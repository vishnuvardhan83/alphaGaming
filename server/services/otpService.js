// AlphaQ Gaming — Cryptographically Secure OTP Service
// Generates, hashes, validates, and cleans up verification OTPs with brute-force protection
// and resend cooldowns.

const crypto = require("crypto");

const OTP_SECRET = process.env.JWT_SECRET || "alphaq-otp-secure-secret-key-123";
const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 5);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const OTP_RESEND_COOLDOWN_SECONDS = Number(
  process.env.OTP_RESEND_COOLDOWN_SECONDS || 60,
);

/**
 * Generates a cryptographically secure 6-digit numeric OTP using crypto.randomInt.
 * NEVER uses Math.random().
 */
function generateOtp(length = 6) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length);
  return crypto.randomInt(min, max).toString();
}

/**
 * Computes a secure keyed HMAC-SHA256 hash of the email and OTP.
 */
function hashOtp(email, otp) {
  const normEmail = String(email || "").trim().toLowerCase();
  const safeOtp = String(otp || "").trim();
  return crypto
    .createHmac("sha256", OTP_SECRET)
    .update(`${normEmail}:${safeOtp}`)
    .digest("hex");
}

/**
 * Validates an OTP against the stored hash in constant time.
 */
function verifyOtpHash(email, inputOtp, storedHash) {
  try {
    const computed = hashOtp(email, inputOtp);
    const bufA = Buffer.from(computed, "utf8");
    const bufB = Buffer.from(storedHash, "utf8");
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Creates or replaces an OTP record for an email and purpose.
 * Enforces resend cooldown so users cannot spam requests.
 */
async function createOrReplaceOtp({ db, email, userId = null, purpose = "verify_email" }) {
  const normEmail = String(email || "").trim().toLowerCase();
  const now = Date.now();

  // Check cooldown on the latest active OTP for this email & purpose
  const existing = await db.get(
    "SELECT created_at FROM email_verifications WHERE LOWER(email) = ? AND purpose = ? ORDER BY id DESC LIMIT 1",
    [normEmail, purpose],
  );

  if (existing) {
    const elapsedSeconds = Math.floor((now - Number(existing.created_at)) / 1000);
    if (elapsedSeconds < OTP_RESEND_COOLDOWN_SECONDS) {
      const waitTime = OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds;
      throw new Error(
        `Please wait ${waitTime} second${waitTime === 1 ? "" : "s"} before requesting a new code.`,
      );
    }
  }

  // Invalidate any existing OTPs for this email & purpose
  await db.run(
    "DELETE FROM email_verifications WHERE LOWER(email) = ? AND purpose = ?",
    [normEmail, purpose],
  );

  const otp = generateOtp(6);
  const otpHash = hashOtp(normEmail, otp);
  const expiresAt = now + OTP_EXPIRY_MINUTES * 60 * 1000;

  await db.run(
    `INSERT INTO email_verifications (user_id, email, otp_hash, purpose, expires_at, attempt_count, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?)`,
    [userId, normEmail, otpHash, purpose, expiresAt, now],
  );

  return {
    otp,
    expiresAt,
    expiryMinutes: OTP_EXPIRY_MINUTES,
  };
}

/**
 * Validates the submitted OTP with expiration and brute-force attempt tracking.
 */
async function validateOtp({ db, email, otp, purpose = "verify_email", consume = true }) {
  const normEmail = String(email || "").trim().toLowerCase();
  const rawOtp = String(otp || "").trim();
  const now = Date.now();

  const record = await db.get(
    "SELECT * FROM email_verifications WHERE LOWER(email) = ? AND purpose = ? ORDER BY id DESC LIMIT 1",
    [normEmail, purpose],
  );

  if (!record) {
    return {
      valid: false,
      error: "No active verification code found. Please request a new code.",
    };
  }

  // Check expiration
  if (Number(record.expires_at) < now) {
    await db.run("DELETE FROM email_verifications WHERE id = ?", [record.id]);
    return {
      valid: false,
      expired: true,
      error: "Verification code has expired. Please request a new one.",
    };
  }

  // Check if max attempts previously reached
  if (record.attempt_count >= OTP_MAX_ATTEMPTS) {
    await db.run("DELETE FROM email_verifications WHERE id = ?", [record.id]);
    return {
      valid: false,
      maxAttempts: true,
      error: "Too many failed attempts. This code has been invalidated. Please request a new one.",
    };
  }

  // Verify hash
  const isMatch = verifyOtpHash(normEmail, rawOtp, record.otp_hash);

  if (!isMatch) {
    const newAttempts = record.attempt_count + 1;
    if (newAttempts >= OTP_MAX_ATTEMPTS) {
      await db.run("DELETE FROM email_verifications WHERE id = ?", [record.id]);
      return {
        valid: false,
        maxAttempts: true,
        error: "Incorrect verification code. Maximum attempts exceeded. Please request a new code.",
      };
    }
    await db.run("UPDATE email_verifications SET attempt_count = ? WHERE id = ?", [
      newAttempts,
      record.id,
    ]);
    const remaining = OTP_MAX_ATTEMPTS - newAttempts;
    return {
      valid: false,
      error: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
    };
  }

  // Valid OTP! Consume/invalidate if requested
  if (consume) {
    await db.run("DELETE FROM email_verifications WHERE id = ?", [record.id]);
  } else {
    await db.run("UPDATE email_verifications SET verified_at = ? WHERE id = ?", [
      now,
      record.id,
    ]);
  }

  return {
    valid: true,
    record,
  };
}

/**
 * Removes all expired OTP records from the database.
 */
async function cleanupExpiredOtps(db) {
  try {
    const res = await db.run("DELETE FROM email_verifications WHERE expires_at < ?", [
      Date.now(),
    ]);
    if (res && res.changes > 0) {
      console.log(`[OTP Cleanup] Removed ${res.changes} expired verification record(s).`);
    }
  } catch (err) {
    console.error("[OTP Cleanup Error]:", err.message);
  }
}

/**
 * Starts an application-level background cleanup interval.
 */
function startPeriodicCleanup(db, intervalMs = 5 * 60 * 1000) {
  const timer = setInterval(() => {
    void cleanupExpiredOtps(db);
  }, intervalMs);
  if (timer.unref) timer.unref();
  return timer;
}

module.exports = {
  generateOtp,
  hashOtp,
  verifyOtpHash,
  createOrReplaceOtp,
  validateOtp,
  cleanupExpiredOtps,
  startPeriodicCleanup,
  OTP_EXPIRY_MINUTES,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
};
