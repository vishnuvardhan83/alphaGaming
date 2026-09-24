// AlphaQ Gaming — Authentication & User Management Service
// Handles user registration, email verification, password reset, and admin creation
// with database transactions, cryptographically secure OTPs, and email dispatch.

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db, now, normalizePhone } = require("../db");
const {
  createOrReplaceOtp,
  validateOtp,
} = require("./otpService");
const {
  sendVerificationEmail,
  sendForgotPasswordEmail,
  sendWelcomeUserEmail,
} = require("./email/emailService");

const JWT_SECRET = process.env.JWT_SECRET || "alphaq-dev-secret-change-me";
const ADMIN_PHONES = (process.env.ADMIN_PHONES || "9573976462")
  .split(",")
  .map(normalizePhone)
  .filter(Boolean);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
  const trimmed = String(email || "").trim().toLowerCase();
  if (!trimmed) {
    throw new Error("Email address is required.");
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    throw new Error("Please enter a valid email address.");
  }
  return trimmed;
}

function publicUser(u) {
  return {
    id: u.id,
    uid: String(u.id),
    phone: u.phone,
    name: u.name,
    email: u.email || null,
    role: u.role,
    rewardPoints: u.reward_points ?? 0,
    blocked: !!u.blocked,
    emailVerified: !!u.email_verified,
    emailVerifiedAt: u.email_verified_at || null,
    createdAt: u.created_at,
  };
}

function signUserToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: "30d" },
  );
}

function signResetToken(email, userId) {
  return jwt.sign(
    { purpose: "reset_password", email, userId },
    JWT_SECRET,
    { expiresIn: "15m" },
  );
}

/**
 * Register a new customer user account.
 * Requires name, phone, email, and password.
 */
async function registerUser({ phone, name, email, password, confirmPassword }) {
  const normPhone = normalizePhone(phone);
  const normName = String(name || "").trim();
  const normEmail = validateEmail(email);
  const rawPassword = String(password || "");

  if (!/^\d{11,15}$/.test(normPhone)) {
    throw new Error("Enter a valid phone number with country code.");
  }
  if (!normName) {
    throw new Error("Please enter your name.");
  }
  if (rawPassword.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }
  if (confirmPassword !== undefined && rawPassword !== String(confirmPassword)) {
    throw new Error("Passwords do not match.");
  }

  // Check unique constraints (only block if user is already verified or admin)
  const existingPhone = await db.get("SELECT * FROM users WHERE phone = ?", [normPhone]);
  if (existingPhone && (existingPhone.email_verified || existingPhone.role === "admin")) {
    throw new Error("An account with this phone number already exists. Try signing in.");
  }

  const existingEmail = await db.get("SELECT * FROM users WHERE LOWER(email) = ?", [normEmail]);
  if (existingEmail && (existingEmail.email_verified || existingEmail.role === "admin")) {
    throw new Error("An account with this email address already exists. Try signing in or use forgot password.");
  }

  const role = ADMIN_PHONES.includes(normPhone) ? "admin" : "customer";
  const passwordHash = bcrypt.hashSync(rawPassword, 10);

  // Generate OTP and save to email_verifications (user is NOT created in DB yet)
  const otpResult = await createOrReplaceOtp({
    db,
    email: normEmail,
    userId: existingEmail ? existingEmail.id : null,
    purpose: "verify_email",
  });

  console.log(`[Auth Registration] Generated OTP for ${normEmail}: ${otpResult.otp}`);

  // Non-blocking asynchronous email dispatch so registration does not fail if SMTP has high latency
  setImmediate(async () => {
    try {
      await sendVerificationEmail({
        email: normEmail,
        name: normName,
        otp: otpResult.otp,
        expiryMinutes: otpResult.expiryMinutes,
      });
    } catch (err) {
      console.error("[Register Email Dispatch Error]:", err.message);
    }
  });

  // Secure signed registration token holding pending data
  const registrationToken = jwt.sign(
    {
      phone: normPhone,
      name: normName,
      email: normEmail,
      passwordHash,
      role,
      type: "pending_registration",
    },
    JWT_SECRET,
    { expiresIn: "15m" },
  );

  return {
    ok: true,
    requiresVerification: true,
    email: normEmail,
    registrationToken,
    message: `Verification code sent to ${normEmail}. Please verify code to complete registration.`,
    user: {
      phone: normPhone,
      name: normName,
      email: normEmail,
      role,
      emailVerified: false,
    },
  };
}

/**
 * Verify user email using OTP.
 * When registrationToken is provided, account is atomically created upon verification.
 * Issues the login JWT token ONLY upon successful verification.
 */
async function verifyEmail({ email, otp, registrationToken }) {
  const normEmail = validateEmail(email);
  const rawOtp = String(otp || "").trim();

  if (!rawOtp) {
    throw new Error("Verification code is required.");
  }

  const result = await validateOtp({
    db,
    email: normEmail,
    otp: rawOtp,
    purpose: "verify_email",
    consume: true,
  });

  if (!result.valid) {
    throw new Error(result.error);
  }

  const verifiedAt = now();
  let finalUser = null;

  if (registrationToken) {
    let payload;
    try {
      payload = jwt.verify(registrationToken, JWT_SECRET);
    } catch {
      throw new Error("Registration session expired. Please register again.");
    }

    if (payload.type !== "pending_registration" || payload.email !== normEmail) {
      throw new Error("Invalid registration token.");
    }

    await db.transaction(async (tx) => {
      // Clean up any unverified stale record with same phone or email
      await tx.run(
        "DELETE FROM users WHERE (phone = ? OR LOWER(email) = ?) AND email_verified = 0 AND role != 'admin'",
        [payload.phone, payload.email],
      );

      const res = await tx.run(
        `INSERT INTO users (phone, name, email, password_hash, role, reward_points, blocked, email_verified, email_verified_at, created_at)
         VALUES (?, ?, ?, ?, ?, 0, 0, 1, ?, ?)`,
        [payload.phone, payload.name, payload.email, payload.passwordHash, payload.role, verifiedAt, verifiedAt],
      );

      finalUser = await tx.get("SELECT * FROM users WHERE id = ?", [res.lastInsertRowid]);
    });
  } else {
    // Existing user verifying (e.g. from unverified login attempt)
    const existing = await db.get("SELECT * FROM users WHERE LOWER(email) = ?", [normEmail]);
    if (!existing) {
      throw new Error("User account not found for this email address.");
    }

    await db.run(
      "UPDATE users SET email_verified = 1, email_verified_at = ? WHERE id = ?",
      [verifiedAt, existing.id],
    );

    finalUser = await db.get("SELECT * FROM users WHERE id = ?", [existing.id]);
  }

  // Issue login token ONLY after successful verification
  const token = signUserToken(finalUser);

  return {
    ok: true,
    token,
    user: publicUser(finalUser),
    message: "Email verified successfully! You are now logged in.",
  };
}

/**
 * Resend verification OTP for user registration.
 */
async function resendVerificationOtp({ email }) {
  const normEmail = validateEmail(email);

  const user = await db.get("SELECT * FROM users WHERE LOWER(email) = ?", [normEmail]);
  if (!user) {
    throw new Error("No account found for this email address.");
  }
  if (user.email_verified) {
    return { ok: true, alreadyVerified: true, message: "Email is already verified." };
  }

  const otpResult = await createOrReplaceOtp({
    db,
    email: normEmail,
    userId: user.id,
    purpose: "verify_email",
  });

  setImmediate(async () => {
    try {
      await sendVerificationEmail({
        email: normEmail,
        name: user.name,
        otp: otpResult.otp,
        expiryMinutes: otpResult.expiryMinutes,
      });
    } catch (err) {
      console.error("[Resend Verification Email Error]:", err.message);
    }
  });

  return {
    ok: true,
    message: "A new verification code has been sent to your email.",
  };
}

/**
 * Initiate forgot password flow.
 * Returns generic message to prevent account enumeration.
 */
async function forgotPassword({ email, login }) {
  const raw = email || login;
  const normEmail = validateEmail(raw);

  const user = await db.get("SELECT * FROM users WHERE LOWER(email) = ?", [normEmail]);

  if (user) {
    try {
      const otpResult = await createOrReplaceOtp({
        db,
        email: normEmail,
        userId: user.id,
        purpose: "reset_password",
      });

      setImmediate(async () => {
        try {
          await sendForgotPasswordEmail({
            email: normEmail,
            name: user.name,
            otp: otpResult.otp,
            expiryMinutes: otpResult.expiryMinutes,
          });
        } catch (err) {
          console.error("[Forgot Password Email Error]:", err.message);
        }
      });
    } catch (err) {
      // If cooldown was triggered, log and continue with generic response
      console.warn("[Forgot Password Cooldown]:", err.message);
    }
  }

  // Always return generic response to prevent account enumeration
  return {
    message: "If an account exists for this email, a verification code has been sent.",
  };
}

/**
 * Verify reset OTP and issue a short-lived reset token.
 */
async function verifyResetOtp({ email, otp }) {
  const normEmail = validateEmail(email);
  const rawOtp = String(otp || "").trim();

  if (!rawOtp) {
    throw new Error("Verification code is required.");
  }

  const user = await db.get("SELECT * FROM users WHERE LOWER(email) = ?", [normEmail]);
  if (!user) {
    throw new Error("Invalid or expired verification code.");
  }

  // Validate OTP without consuming yet, or consume and issue reset token
  const result = await validateOtp({
    db,
    email: normEmail,
    otp: rawOtp,
    purpose: "reset_password",
    consume: true,
  });

  if (!result.valid) {
    throw new Error(result.error);
  }

  const resetToken = signResetToken(normEmail, user.id);
  return {
    ok: true,
    resetToken,
    message: "Verification code accepted. Please set your new password.",
  };
}

/**
 * Reset password using reset token (or direct OTP) and new password.
 */
async function resetPassword({ email, resetToken, otp, newPassword, confirmPassword }) {
  const normEmail = validateEmail(email);
  const safePassword = String(newPassword || "");
  const safeConfirm = String(confirmPassword || "");

  if (safePassword.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }
  if (safePassword !== safeConfirm) {
    throw new Error("Passwords do not match.");
  }

  let verifiedUserId = null;

  if (resetToken) {
    try {
      const decoded = jwt.verify(resetToken, JWT_SECRET);
      if (decoded.purpose !== "reset_password" || decoded.email !== normEmail) {
        throw new Error("Invalid or expired reset token.");
      }
      verifiedUserId = decoded.userId;
    } catch {
      throw new Error("Your password reset session has expired. Please request a new code.");
    }
  } else if (otp) {
    const result = await validateOtp({
      db,
      email: normEmail,
      otp,
      purpose: "reset_password",
      consume: true,
    });
    if (!result.valid) {
      throw new Error(result.error);
    }
  } else {
    throw new Error("Reset token or verification code is required.");
  }

  const user = verifiedUserId
    ? await db.get("SELECT * FROM users WHERE id = ?", [verifiedUserId])
    : await db.get("SELECT * FROM users WHERE LOWER(email) = ?", [normEmail]);

  if (!user) {
    throw new Error("Account not found.");
  }

  const passwordHash = bcrypt.hashSync(safePassword, 10);
  await db.run("UPDATE users SET password_hash = ? WHERE id = ?", [
    passwordHash,
    user.id,
  ]);

  // Clean up any remaining reset OTPs
  await db.run("DELETE FROM email_verifications WHERE LOWER(email) = ? AND purpose = 'reset_password'", [
    normEmail,
  ]);

  return {
    ok: true,
    message: "Password reset successfully. You can now sign in with your new password.",
  };
}

/**
 * Admin creates a user. Requires email.
 * Sends welcome email with verification OTP.
 */
async function adminCreateUser({ phone, name, email, password, role }) {
  const normPhone = normalizePhone(phone);
  const normName = String(name || "").trim();
  const normEmail = validateEmail(email);
  const rawPassword = String(password || "");
  const allowedRoles = ["admin", "staff", "customer"];
  const userRole = allowedRoles.includes(role) ? role : "customer";

  if (!/^\d{11,15}$/.test(normPhone)) {
    throw new Error("Enter a valid phone number.");
  }
  if (!normName) {
    throw new Error("Name is required.");
  }
  if (rawPassword.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  if (await db.get("SELECT 1 FROM users WHERE phone = ?", [normPhone])) {
    throw new Error("An account with this phone number already exists.");
  }
  if (await db.get("SELECT 1 FROM users WHERE LOWER(email) = ?", [normEmail])) {
    throw new Error("An account with this email address already exists.");
  }

  const passwordHash = bcrypt.hashSync(rawPassword, 10);
  const createdAt = now();

  let createdUser = null;
  let otpResult = null;

  await db.transaction(async (tx) => {
    const res = await tx.run(
      `INSERT INTO users (phone, name, email, password_hash, role, reward_points, blocked, email_verified, email_verified_at, created_at)
       VALUES (?, ?, ?, ?, ?, 0, 0, 0, NULL, ?)`,
      [normPhone, normName, normEmail, passwordHash, userRole, createdAt],
    );

    createdUser = await tx.get("SELECT * FROM users WHERE id = ?", [res.lastInsertRowid]);

    otpResult = await createOrReplaceOtp({
      db: tx,
      email: normEmail,
      userId: createdUser.id,
      purpose: "verify_email",
    });
  });

  // Send welcome email with verification code (passwords never sent via email)
  setImmediate(async () => {
    try {
      await sendWelcomeUserEmail({
        email: normEmail,
        name: normName,
        otp: otpResult.otp,
        role: userRole,
        expiryMinutes: otpResult.expiryMinutes,
      });
    } catch (err) {
      console.error("[Admin Create User Email Error]:", err.message);
    }
  });

  return publicUser(createdUser);
}

/**
 * Authenticates user by identifier (phone or email) and password.
 * If user is unverified, dispatches a verification OTP and throws an error with requiresVerification.
 */
async function loginUser({ identifier, phone, email, password }) {
  const rawId = String(identifier || phone || email || "").trim();
  const rawPass = String(password || "");

  if (!rawId) {
    throw new Error("Phone number or email is required.");
  }
  if (!rawPass) {
    throw new Error("Password is required.");
  }

  let u = null;
  if (rawId.includes("@")) {
    u = await db.get("SELECT * FROM users WHERE LOWER(email) = ?", [rawId.toLowerCase()]);
  } else {
    const normPhone = normalizePhone(rawId);
    u = await db.get("SELECT * FROM users WHERE phone = ?", [normPhone]);
  }

  if (!u || !bcrypt.compareSync(rawPass, u.password_hash)) {
    throw new Error("Incorrect login credentials.");
  }

  if (u.blocked) {
    throw new Error("Your account has been suspended. Please contact AlphaQ staff.");
  }

  // Verification check: unverified users cannot log in
  if (u.email && !u.email_verified && u.role !== "admin") {
    const otpResult = await createOrReplaceOtp({
      db,
      email: u.email,
      userId: u.id,
      purpose: "verify_email",
    });

    setImmediate(async () => {
      try {
        await sendVerificationEmail({
          email: u.email,
          name: u.name,
          otp: otpResult.otp,
          expiryMinutes: otpResult.expiryMinutes,
        });
      } catch (err) {
        console.error("[Login Verification Dispatch Error]:", err.message);
      }
    });

    const err = new Error("Please verify your email address to log in. We sent a 6-digit verification code to your email.");
    err.status = 403;
    err.requiresVerification = true;
    err.email = u.email;
    throw err;
  }

  const token = signUserToken(u);
  return {
    token,
    user: publicUser(u),
  };
}

module.exports = {
  validateEmail,
  publicUser,
  signUserToken,
  registerUser,
  verifyEmail,
  loginUser,
  resendVerificationOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  adminCreateUser,
};
