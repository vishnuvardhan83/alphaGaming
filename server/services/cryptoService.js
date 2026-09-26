// AlphaQ Gaming — Crypto & Password Service
// Inspects, verifies, hashes, and tests passwords and OTP hashes.

const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { normalizePhone } = require("../db");

const OTP_SECRET = process.env.JWT_SECRET || "alphaq-otp-secure-secret-key-123";

/**
 * Checks whether a given string is a valid bcrypt hash.
 */
function isBcryptHash(hash) {
  if (typeof hash !== "string") return false;
  return /^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$/.test(hash.trim());
}

/**
 * Parses metadata from a bcrypt hash string.
 */
function inspectHash(hash) {
  const clean = String(hash || "").trim();
  const valid = isBcryptHash(clean);

  if (!valid) {
    return {
      valid: false,
      algorithm: "unknown",
      rounds: null,
      version: null,
      length: clean.length,
      sample: clean.slice(0, 10) + "...",
      error: "Not a valid bcrypt hash format ($2a$, $2b$, or $2y$ followed by 2-digit rounds and 53 characters).",
    };
  }

  const parts = clean.split("$");
  const version = parts[1];
  const rounds = parseInt(parts[2], 10);
  const salt = parts[3].slice(0, 22);

  return {
    valid: true,
    algorithm: "bcrypt",
    version,
    rounds,
    salt,
    length: clean.length,
  };
}

/**
 * Compares plaintext password against a bcrypt hash.
 */
function verifyPassword(plainPassword, hash) {
  const plain = String(plainPassword || "");
  const targetHash = String(hash || "").trim();

  if (!plain) {
    throw new Error("Password cannot be empty.");
  }
  if (!targetHash) {
    throw new Error("Hash cannot be empty.");
  }

  const hashMeta = inspectHash(targetHash);
  if (!hashMeta.valid) {
    return {
      match: false,
      error: hashMeta.error,
      hashMeta,
    };
  }

  try {
    const match = bcrypt.compareSync(plain, targetHash);
    return {
      match,
      hashMeta,
    };
  } catch (err) {
    return {
      match: false,
      error: err.message,
      hashMeta,
    };
  }
}

/**
 * Generates a bcrypt hash for a plaintext password.
 */
function hashPassword(plainPassword, rounds = 10) {
  const plain = String(plainPassword || "");
  if (!plain) {
    throw new Error("Password cannot be empty.");
  }
  const r = Math.min(Math.max(Number(rounds) || 10, 4), 16);
  const salt = bcrypt.genSaltSync(r);
  const hash = bcrypt.hashSync(plain, salt);
  return {
    plain,
    hash,
    rounds: r,
    hashMeta: inspectHash(hash),
  };
}

/**
 * Checks a plaintext password against a specific user in the database.
 */
async function checkUserPassword(db, identifier, plainPassword) {
  const rawId = String(identifier || "").trim();
  const plain = String(plainPassword || "");

  if (!rawId) {
    throw new Error("Please provide user ID, email, or phone number.");
  }
  if (!plain) {
    throw new Error("Please enter password to test.");
  }

  let user = null;
  if (/^\d+$/.test(rawId) && rawId.length < 8) {
    user = await db.get("SELECT * FROM users WHERE id = ?", [Number(rawId)]);
  } else if (rawId.includes("@")) {
    user = await db.get("SELECT * FROM users WHERE LOWER(email) = ?", [rawId.toLowerCase()]);
  } else {
    const norm = normalizePhone(rawId);
    user = await db.get("SELECT * FROM users WHERE phone = ? OR phone = ?", [norm, rawId]);
  }

  if (!user) {
    throw new Error(`No user found matching "${rawId}".`);
  }

  const hashMeta = inspectHash(user.password_hash);
  let match = false;
  try {
    match = bcrypt.compareSync(plain, user.password_hash);
  } catch {
    match = false;
  }

  return {
    match,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      emailVerified: !!user.email_verified,
      blocked: !!user.blocked,
    },
    passwordHash: user.password_hash,
    hashMeta,
  };
}

/**
 * Generates HMAC-SHA256 hash for OTP testing.
 */
function hashOtpHmac(email, otp) {
  const normEmail = String(email || "").trim().toLowerCase();
  const safeOtp = String(otp || "").trim();
  return crypto
    .createHmac("sha256", OTP_SECRET)
    .update(`${normEmail}:${safeOtp}`)
    .digest("hex");
}

/**
 * Tests OTP code against active database verifications.
 */
async function inspectDbOtp(db, email, inputOtp = "") {
  const normEmail = String(email || "").trim().toLowerCase();
  const rows = await db.all(
    "SELECT * FROM email_verifications WHERE LOWER(email) = ? ORDER BY created_at DESC LIMIT 5",
    [normEmail],
  );

  if (!rows || rows.length === 0) {
    return {
      found: false,
      message: `No OTP verifications found for ${normEmail}`,
      verifications: [],
    };
  }

  const now = Date.now();
  const results = rows.map((r) => {
    const isExpired = Number(r.expires_at) < now;
    let match = null;
    let computedHmac = null;

    if (inputOtp) {
      computedHmac = hashOtpHmac(normEmail, inputOtp);
      match = computedHmac === r.otp_hash;
    }

    return {
      id: r.id,
      purpose: r.purpose,
      createdAt: r.created_at,
      expiresAt: r.expires_at,
      expired: isExpired,
      attemptCount: r.attempt_count,
      verifiedAt: r.verified_at,
      otpHash: r.otp_hash,
      testedOtpMatch: match,
      computedHmac,
    };
  });

  return {
    found: true,
    email: normEmail,
    verifications: results,
  };
}

module.exports = {
  isBcryptHash,
  inspectHash,
  verifyPassword,
  hashPassword,
  checkUserPassword,
  hashOtpHmac,
  inspectDbOtp,
};
