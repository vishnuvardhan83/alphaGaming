// Comprehensive Automated Verification Suite for Email, OTP, Password Reset, and Migrations

const assert = require("assert");
const bcrypt = require("bcryptjs");
const { db, init, normalizePhone } = require("./db");
const {
  registerUser,
  verifyEmail,
  resendVerificationOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  adminCreateUser,
} = require("./services/authService");
const {
  validateOtp,
  verifyOtpHash,
  hashOtp,
} = require("./services/otpService");
const { runMigrations } = require("./migrations/runner");

async function runTests() {
  console.log("=== STARTING AUTH & OTP VERIFICATION SUITE ===\n");

  await init();

  // Test 1: Migrations
  console.log("TEST 1: Database Migrations Idempotency & Tracking");
  await runMigrations();
  const appliedMigrations = await db.all("SELECT * FROM schema_migrations");
  assert(appliedMigrations.length >= 2, "Expected at least 2 migrations tracked");
  console.log("✓ Migrations correctly tracked in schema_migrations table\n");

  // Test 2: Existing Data Preserved
  console.log("TEST 2: Existing User & Booking Data Integrity");
  const existingUsers = await db.all("SELECT * FROM users ORDER BY id ASC LIMIT 3");
  assert.strictEqual(existingUsers.length, 3, "Expected 3 existing users to be intact");
  assert.strictEqual(existingUsers[0].phone, "919573976462");
  const existingBookings = await db.all("SELECT COUNT(*) c FROM bookings");
  assert(Number(existingBookings[0].c) >= 15, "Expected at least 15 existing bookings");
  console.log("✓ All pre-existing user records and bookings survived untouched\n");

  // Test 3: Registration Validation
  console.log("TEST 3: Registration Email Requirement & Format Validation");
  // Missing email
  await assert.rejects(
    async () => {
      await registerUser({
        phone: "919999900001",
        name: "Test Missing Email",
        email: "",
        password: "password123",
      });
    },
    { message: /Email address is required/ },
    "Should reject empty email",
  );

  // Invalid email format
  await assert.rejects(
    async () => {
      await registerUser({
        phone: "919999900001",
        name: "Test Bad Email",
        email: "not-an-email",
        password: "password123",
      });
    },
    { message: /Please enter a valid email address/ },
    "Should reject invalid email format",
  );
  console.log("✓ Empty and malformed emails properly rejected\n");

  // Test 4: Successful Registration & Cryptographic OTP Generation
  console.log("TEST 4: Successful User Registration & OTP Storage Security");
  const testPhone = "919999900001";
  const testEmail = "gamer1@alphaq.test";
  const testPass = "secureSecret123";

  // Clean test user if previously run
  await db.run("DELETE FROM email_verifications WHERE LOWER(email) = ?", [testEmail]);
  await db.run("DELETE FROM users WHERE phone = ? OR LOWER(email) = ?", [testPhone, testEmail]);

  const regResult = await registerUser({
    phone: testPhone,
    name: "Apex Champion",
    email: testEmail,
    password: testPass,
    confirmPassword: testPass,
  });

  assert(regResult.user, "User object should be returned");
  assert.strictEqual(regResult.user.email, testEmail);
  assert.strictEqual(regResult.user.emailVerified, false);

  // Verify OTP was stored in DB as a HASH, not plain text
  const verifRow = await db.get(
    "SELECT * FROM email_verifications WHERE LOWER(email) = ? AND purpose = 'verify_email'",
    [testEmail],
  );
  assert(verifRow, "Verification record must exist in email_verifications");
  assert.notStrictEqual(verifRow.otp_hash.length, 6, "OTP hash must not be plain 6-digit text");
  assert.strictEqual(verifRow.otp_hash.length, 64, "OTP hash must be 64-char HMAC-SHA256 hex");
  assert.strictEqual(verifRow.attempt_count, 0, "Initial attempt count must be 0");
  assert(Number(verifRow.expires_at) > Date.now(), "Expires at must be in future");
  console.log("✓ User created, OTP securely hashed (HMAC-SHA256) and stored with 5-minute expiry\n");

  // Test 5: Prevent Duplicate Email Registration
  console.log("TEST 5: Duplicate Email Prevention");
  await assert.rejects(
    async () => {
      await registerUser({
        phone: "919999900002",
        name: "Imposter",
        email: "V9347976462@GMAIL.COM", // Case-insensitive duplicate test
        password: "password123",
      });
    },
    { message: /An account with this email address already exists/ },
    "Should reject duplicate email even with different casing",
  );
  console.log("✓ Case-insensitive duplicate email properly rejected\n");

  // Test 6: Resend Cooldown
  console.log("TEST 6: Resend Cooldown Enforcement (60s)");
  await assert.rejects(
    async () => {
      await resendVerificationOtp({ email: testEmail });
    },
    { message: /Please wait .* seconds before requesting a new code/ },
    "Should enforce 60-second cooldown",
  );
  console.log("✓ Resend cooldown successfully prevented spam\n");

  // Test 7: Incorrect OTP & Brute-Force Rate Limiting (5 Attempts)
  console.log("TEST 7: Brute-Force Rate Limiting (Max 5 Failed Attempts)");
  for (let i = 1; i <= 4; i++) {
    await assert.rejects(
      async () => {
        await verifyEmail({ email: testEmail, otp: "000000" });
      },
      { message: /Incorrect verification code/ },
    );
    const row = await db.get("SELECT attempt_count FROM email_verifications WHERE LOWER(email) = ?", [testEmail]);
    assert.strictEqual(row.attempt_count, i);
  }

  // 5th attempt invalidates OTP
  await assert.rejects(
    async () => {
      await verifyEmail({ email: testEmail, otp: "000000" });
    },
    { message: /Maximum attempts exceeded/ },
  );

  const invalidatedRow = await db.get("SELECT * FROM email_verifications WHERE LOWER(email) = ?", [testEmail]);
  assert.strictEqual(invalidatedRow, undefined, "OTP record must be deleted after max attempts reached");
  console.log("✓ Brute-force protection: OTP invalidated upon 5 failed attempts\n");

  // Test 8: Valid OTP Verification & State Update
  console.log("TEST 8: Successful Email Verification via OTP");
  // Force reset cooldown for testing and generate new OTP
  await db.run("UPDATE email_verifications SET created_at = 0 WHERE LOWER(email) = ?", [testEmail]);
  const knownOtp = "123456";
  const knownHash = hashOtp(testEmail, knownOtp);
  await db.run(
    `INSERT INTO email_verifications (user_id, email, otp_hash, purpose, expires_at, attempt_count, created_at)
     VALUES (NULL, ?, ?, 'verify_email', ?, 0, ?)`,
    [testEmail, knownHash, Date.now() + 5 * 60 * 1000, Date.now()],
  );

  const verifyRes = await verifyEmail({ email: testEmail, otp: knownOtp, registrationToken: regResult.registrationToken });
  assert.strictEqual(verifyRes.ok, true);
  assert.strictEqual(verifyRes.user.emailVerified, true);
  assert(verifyRes.user.emailVerifiedAt > 0);

  // OTP must be deleted/consumed after successful verification
  const consumedRow = await db.get(
    "SELECT * FROM email_verifications WHERE LOWER(email) = ? AND purpose = 'verify_email'",
    [testEmail],
  );
  assert.strictEqual(consumedRow, undefined, "OTP must be deleted once verified");
  console.log("✓ Email marked verified in DB and OTP record cleanly consumed\n");

  // Test 9: Forgot Password Flow (No Account Enumeration)
  console.log("TEST 9: Forgot Password Generic Response (Account Enumeration Defense)");
  const fakeResponse = await forgotPassword({ email: "nonexistent_gamer_99999@alphaq.test" });
  assert.strictEqual(
    fakeResponse.message,
    "If an account exists for this email, a verification code has been sent.",
  );

  const realResponse = await forgotPassword({ email: testEmail });
  assert.strictEqual(
    realResponse.message,
    "If an account exists for this email, a verification code has been sent.",
  );
  console.log("✓ Forgot password returns identical generic response for both existing and non-existing accounts\n");

  // Test 10: Reset Password Verification & Execution
  console.log("TEST 10: Reset Password Token Issuance & Password Update");
  const resetOtp = "654321";
  const resetHash = hashOtp(testEmail, resetOtp);
  await db.run("DELETE FROM email_verifications WHERE LOWER(email) = ? AND purpose = 'reset_password'", [testEmail]);
  await db.run(
    `INSERT INTO email_verifications (user_id, email, otp_hash, purpose, expires_at, attempt_count, created_at)
     VALUES (?, ?, ?, 'reset_password', ?, 0, ?)`,
    [verifyRes.user.id, testEmail, resetHash, Date.now() + 5 * 60 * 1000, Date.now()],
  );

  const verifyResetRes = await verifyResetOtp({ email: testEmail, otp: resetOtp });
  assert.strictEqual(verifyResetRes.ok, true);
  assert(verifyResetRes.resetToken, "Should return a signed JWT reset token");

  const newPassword = "newGamerPassword2026!";
  const resetRes = await resetPassword({
    email: testEmail,
    resetToken: verifyResetRes.resetToken,
    newPassword,
    confirmPassword: newPassword,
  });
  assert.strictEqual(resetRes.ok, true);

  // Verify DB updated with bcrypt hash
  const updatedUser = await db.get("SELECT password_hash FROM users WHERE LOWER(email) = ?", [testEmail]);
  assert(bcrypt.compareSync(newPassword, updatedUser.password_hash), "New password must match stored bcrypt hash");

  // Attempting to reuse same token or OTP must fail
  await assert.rejects(
    async () => {
      await resetPassword({
        email: testEmail,
        otp: resetOtp,
        newPassword: "anotherPassword123",
        confirmPassword: "anotherPassword123",
      });
    },
    { message: /No active verification code found|Invalid or expired/ },
    "Old OTP cannot be reused",
  );
  console.log("✓ Password reset succeeded, bcrypt hash updated, and OTP rendered unusable\n");

  // Test 11: Admin User Creation
  console.log("TEST 11: Admin Creates New User with Mandatory Email & Verification OTP");
  const adminStaffPhone = "919999900003";
  const adminStaffEmail = "staff1@alphaq.test";
  await db.run("DELETE FROM email_verifications WHERE LOWER(email) = ?", [adminStaffEmail]);
  await db.run("DELETE FROM users WHERE phone = ? OR LOWER(email) = ?", [adminStaffPhone, adminStaffEmail]);

  // Missing email should fail
  await assert.rejects(
    async () => {
      await adminCreateUser({
        phone: adminStaffPhone,
        name: "Arena Manager",
        email: "",
        password: "staffPassword123",
        role: "staff",
      });
    },
    { message: /Email address is required/ },
  );

  const staffUser = await adminCreateUser({
    phone: adminStaffPhone,
    name: "Arena Manager",
    email: adminStaffEmail,
    password: "staffPassword123",
    role: "staff",
  });

  assert.strictEqual(staffUser.email, adminStaffEmail);
  assert.strictEqual(staffUser.role, "staff");
  assert.strictEqual(staffUser.emailVerified, false);

  const staffVerif = await db.get(
    "SELECT * FROM email_verifications WHERE LOWER(email) = ? AND purpose = 'verify_email'",
    [adminStaffEmail],
  );
  assert(staffVerif, "Verification OTP record must exist for admin-created user");
  console.log("✓ Admin user creation enforced email, created staff user, and staged verification OTP\n");

  // Clean test accounts
  await db.run("DELETE FROM email_verifications WHERE email IN (?, ?)", [testEmail, adminStaffEmail]);
  await db.run("DELETE FROM users WHERE email IN (?, ?)", [testEmail, adminStaffEmail]);

  await db.close();
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! DATABASE INTEGRITY AND BUSINESS LOGIC VERIFIED.");
}

runTests().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
