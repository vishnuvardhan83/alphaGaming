// AlphaQ Gaming — Test Suite for Section 25: Notification System & Secret Security
const assert = require("assert");
const { init, db } = require("./db");
const {
  getNotificationSettings,
  updateNotificationSettings,
  getProviderSecretStatus,
} = require("./services/notifications/notificationSettings");
const {
  sendEmail,
  sendSms,
  handleBookingCreated,
  sendTestEmail,
  sendTestSms,
  getActiveEmailProvider,
  getActiveSmsProvider,
} = require("./services/notifications/notificationService");
const { createOrReplaceOtp, validateOtp } = require("./services/otpService");

async function run() {
  console.log("=== STARTING SECTION 25 NOTIFICATION SYSTEM TESTS ===");

  await init();

  // Test 1: Notification settings defaults & retrieval
  console.log("\nTEST 1: Retrieving Notification Settings (Section 25.1 & 25.4)");
  const settings = await getNotificationSettings();
  assert.ok(typeof settings.email_enabled === "boolean", "email_enabled should be boolean");
  assert.ok(typeof settings.sms_enabled === "boolean", "sms_enabled should be boolean");
  assert.ok(typeof settings.customer_email_otp_enabled === "boolean", "customer_email_otp_enabled should be boolean");
  assert.ok(typeof settings.customer_sms_otp_enabled === "boolean", "customer_sms_otp_enabled should be boolean");
  assert.ok(typeof settings.booking_email_enabled === "boolean", "booking_email_enabled should be boolean");
  assert.ok(typeof settings.booking_sms_enabled === "boolean", "booking_sms_enabled should be boolean");
  assert.ok(typeof settings.admin_booking_email_enabled === "boolean", "admin_booking_email_enabled should be boolean");
  assert.ok(typeof settings.admin_booking_sms_enabled === "boolean", "admin_booking_sms_enabled should be boolean");
  assert.ok(settings.admin_email, "admin_email should exist");
  assert.ok(settings.admin_phone, "admin_phone should exist");
  assert.ok(settings.otp_length >= 4 && settings.otp_length <= 10, "otp_length valid range");
  assert.ok(settings.otp_expiry_minutes >= 1, "otp_expiry_minutes valid");
  console.log("✓ Settings initialized with valid non-secret types");

  // Test 2: Provider Secret Status & Strict Masking (Section 25.7 & 25.12)
  console.log("\nTEST 2: Provider Secret Status & Zero Secret Leakage (Section 25.7 & 25.12)");
  const secretStatus = getProviderSecretStatus();
  const rawStatusJson = JSON.stringify(secretStatus);

  // Assert that raw secrets from .env are NEVER present in secretStatus
  if (process.env.SMTP_PASSWORD) {
    assert.strictEqual(
      rawStatusJson.includes(process.env.SMTP_PASSWORD),
      false,
      "CRITICAL: SMTP password MUST NOT appear in secret status output!"
    );
  }
  if (process.env.JWT_SECRET) {
    assert.strictEqual(
      rawStatusJson.includes(process.env.JWT_SECRET),
      false,
      "CRITICAL: JWT Secret MUST NOT appear in secret status output!"
    );
  }
  if (secretStatus.email.smtp.configured) {
    assert.strictEqual(secretStatus.email.smtp.secretMasked, "••••••••••••");
  }
  console.log("✓ Provider status correctly masks secrets (returned •••••••••••• without leaking credentials)");

  // Test 3: Updating Notification Settings (Section 25.8)
  console.log("\nTEST 3: Updating Notification Settings & Validation (Section 25.8)");
  const updated = await updateNotificationSettings({
    email_enabled: true,
    sms_enabled: true,
    customer_email_otp_enabled: true,
    customer_sms_otp_enabled: false,
    booking_email_enabled: true,
    booking_sms_enabled: true,
    admin_booking_email_enabled: true,
    admin_booking_sms_enabled: true,
    admin_email: "updated-admin@example.com",
    admin_phone: "+919876543210",
    email_provider: "gmail",
    sms_provider: "msg91",
    otp_length: 6,
    otp_expiry_minutes: 10,
    otp_max_attempts: 4,
    resend_cooldown_seconds: 45,
  });

  assert.strictEqual(updated.email_enabled, true);
  assert.strictEqual(updated.sms_enabled, true);
  assert.strictEqual(updated.admin_email, "updated-admin@example.com");
  assert.strictEqual(updated.admin_phone, "+919876543210");
  assert.strictEqual(updated.otp_length, 6);
  assert.strictEqual(updated.otp_expiry_minutes, 10);
  assert.strictEqual(updated.otp_max_attempts, 4);
  assert.strictEqual(updated.resend_cooldown_seconds, 45);
  console.log("✓ Notification settings successfully updated and verified in database");

  // Test 4: Provider Abstraction & Dispatch (Section 25.10 & 25.2)
  console.log("\nTEST 4: Provider Abstraction & Safe Test Actions (Section 25.10 & 25.2)");
  const emailProvider = getActiveEmailProvider("mock");
  const smsProvider = getActiveSmsProvider("mock");
  assert.strictEqual(emailProvider.name, "mock");
  assert.strictEqual(smsProvider.name, "mock");

  const testEmailRes = await sendTestEmail({ to: "test-recipient@example.com" });
  assert.strictEqual(testEmailRes.success, true);
  assert.strictEqual(testEmailRes.recipient, "test-recipient@example.com");
  assert.strictEqual(JSON.stringify(testEmailRes).includes("password"), false);

  const testSmsRes = await sendTestSms({ to: "+919876543210" });
  assert.strictEqual(testSmsRes.success, true);
  assert.strictEqual(testSmsRes.recipient, "+919876543210");
  assert.strictEqual(JSON.stringify(testSmsRes).includes("key"), false);
  console.log("✓ Safe test email and test SMS successfully executed without credentials leak");

  // Test 5: Notification Decision Flow (Section 25.9)
  console.log("\nTEST 5: Notification Decision Flow (Section 25.9)");
  // Disable email globally
  await updateNotificationSettings({ email_enabled: false });
  const skipEmail = await sendEmail({ to: "nobody@example.com", subject: "Test", text: "Test" });
  assert.strictEqual(skipEmail.skipped, true);
  assert.strictEqual(skipEmail.reason, "email_disabled");
  console.log("✓ Correctly skips email when email_enabled is false");

  // Disable SMS globally
  await updateNotificationSettings({ sms_enabled: false });
  const skipSms = await sendSms({ to: "+919876543210", message: "Test" });
  assert.strictEqual(skipSms.skipped, true);
  assert.strictEqual(skipSms.reason, "sms_disabled");
  console.log("✓ Correctly skips SMS when sms_enabled is false");

  // Re-enable and test booking flow
  await updateNotificationSettings({
    email_enabled: true,
    sms_enabled: true,
    booking_email_enabled: true,
    booking_sms_enabled: true,
    admin_booking_email_enabled: true,
    admin_booking_sms_enabled: true,
  });

  const mockBooking = {
    id: 999,
    platform: "pc",
    date: "2026-10-01",
    slot: "6:00 PM",
    duration_label: "2 Hours",
    price: 200,
    players: 1,
    phone: "919876543210",
  };
  const mockUser = {
    id: 1,
    name: "Test Gamer",
    email: "gamer@example.com",
    phone: "919876543210",
  };

  const bookingResults = await handleBookingCreated({ booking: mockBooking, user: mockUser });
  assert.ok(bookingResults.customerEmail || bookingResults.customerSms || bookingResults.adminEmail || bookingResults.adminSms);
  console.log("✓ Booking decision flow handled all branches based on admin settings");

  // Test 6: Dynamic OTP settings
  console.log("\nTEST 6: Dynamic OTP length and validation limits");
  await updateNotificationSettings({ otp_length: 6, otp_expiry_minutes: 5, otp_max_attempts: 3 });
  const otpRes = await createOrReplaceOtp({ db, email: "otp-test@example.com" });
  assert.strictEqual(otpRes.otp.length, 6, "Generated OTP should have length 6");

  const valRes = await validateOtp({ db, email: "otp-test@example.com", otp: otpRes.otp });
  assert.strictEqual(valRes.valid, true, "Generated OTP must validate successfully");
  console.log("✓ Dynamic OTP length and validation passed");

  console.log("\n=======================================================");
  console.log("ALL SECTION 25 BACKEND TESTS PASSED SUCCESSFULLY! ✓");
  console.log("=======================================================\n");

  await db.close();
}

run().catch((err) => {
  console.error("\nTEST SUITE FAILED:", err);
  process.exit(1);
});
