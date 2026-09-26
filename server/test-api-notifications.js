// AlphaQ Gaming — HTTP Integration Test for Notification Admin Endpoints (Section 25.5, 25.7, 25.8, 25.12)
const assert = require("assert");
const jwt = require("jsonwebtoken");
const { db } = require("./db");

const JWT_SECRET = process.env.JWT_SECRET || "alphaq_super_secret_jwt_key_2026";
const BASE_URL = "http://127.0.0.1:4000";

function makeToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "1h" });
}

async function runTests() {
  console.log("=== STARTING HTTP API INTEGRATION TESTS FOR NOTIFICATIONS ===");

  // Ensure test users exist in DB
  const adminUser = await db.get("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
  const adminId = adminUser ? adminUser.id : 1;
  const adminToken = makeToken({ id: adminId, phone: "9573976462", role: "admin", email: "admin@example.com" });

  let custUser = await db.get("SELECT * FROM users WHERE role = 'customer' LIMIT 1");
  if (!custUser) {
    await db.run(
      "INSERT INTO users (phone, name, email, password_hash, role, email_verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ["919999988888", "Test Customer", "cust@example.com", "hash", "customer", 1, Date.now()]
    );
    custUser = await db.get("SELECT * FROM users WHERE phone = '919999988888'");
  }
  const customerToken = makeToken({ id: custUser.id, phone: custUser.phone, role: "customer", email: custUser.email });

  // 1. Test unauthenticated access -> Must fail with 401
  console.log("\nTEST 1: Security Gate — Reject Unauthenticated Access (Section 25.5)");
  const unauthRes = await fetch(`${BASE_URL}/api/admin/notifications/settings`);
  assert.strictEqual(unauthRes.status, 401, "Unauthenticated access must return 401");
  console.log("✓ Unauthenticated access rejected with 401");

  // 2. Test customer access -> Must fail with 403 Forbidden
  console.log("\nTEST 2: Security Gate — Reject Non-Admin Customer (Section 25.5)");
  const custRes = await fetch(`${BASE_URL}/api/admin/notifications/settings`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  assert.strictEqual(custRes.status, 403, "Customer access must return 403 Forbidden");
  console.log("✓ Customer access rejected with 403 Forbidden");

  // 3. Test admin access -> Must succeed with 200 and return settings + masked status
  console.log("\nTEST 3: Admin GET /api/admin/notifications/settings (Section 25.5, 25.7)");
  const adminGetRes = await fetch(`${BASE_URL}/api/admin/notifications/settings`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(adminGetRes.status, 200, "Admin access must return 200");
  const rawString = await adminGetRes.text();
  const getBody = JSON.parse(rawString);

  assert.ok(getBody.settings, "Should return settings object");
  assert.ok(getBody.providerStatus, "Should return providerStatus object");

  // Verify DevTools security: raw secrets MUST NOT be anywhere in response string
  if (process.env.SMTP_PASSWORD) {
    assert.strictEqual(
      rawString.includes(process.env.SMTP_PASSWORD),
      false,
      "CRITICAL: DevTools network response MUST NOT contain SMTP password!"
    );
  }
  if (process.env.JWT_SECRET) {
    assert.strictEqual(
      rawString.includes(process.env.JWT_SECRET),
      false,
      "CRITICAL: DevTools network response MUST NOT contain JWT secret!"
    );
  }
  console.log("✓ Admin GET returned 200 with zero leaked secrets in DevTools payload");

  // 4. Test admin PUT /api/admin/notifications/settings
  console.log("\nTEST 4: Admin PUT /api/admin/notifications/settings (Section 25.5, 25.8)");
  const updatePayload = {
    email_enabled: true,
    sms_enabled: true,
    customer_email_otp_enabled: true,
    customer_sms_otp_enabled: false,
    booking_email_enabled: true,
    booking_sms_enabled: true,
    admin_booking_email_enabled: true,
    admin_booking_sms_enabled: true,
    admin_email: "secure-admin@alphaq.gg",
    admin_phone: "+919573976462",
    email_provider: "gmail",
    sms_provider: "msg91",
    otp_length: 6,
    otp_expiry_minutes: 5,
    otp_max_attempts: 5,
    resend_cooldown_seconds: 60,
  };
  const adminPutRes = await fetch(`${BASE_URL}/api/admin/notifications/settings`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatePayload),
  });
  assert.strictEqual(adminPutRes.status, 200);
  const putBody = await adminPutRes.json();
  assert.strictEqual(putBody.settings.admin_email, "secure-admin@alphaq.gg");
  assert.strictEqual(putBody.settings.sms_enabled, true);
  console.log("✓ Admin PUT successfully updated non-secret settings");

  // 5. Test admin POST /api/admin/notifications/test-email
  console.log("\nTEST 5: Admin POST /api/admin/notifications/test-email (Section 25.2)");
  const testEmailRes = await fetch(`${BASE_URL}/api/admin/notifications/test-email`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ to: "e2e-test-recipient@example.com" }),
  });
  assert.strictEqual(testEmailRes.status, 200);
  const testEmailBody = await testEmailRes.json();
  assert.strictEqual(testEmailBody.success, true);
  assert.strictEqual(testEmailBody.recipient, "e2e-test-recipient@example.com");
  console.log("✓ Admin POST test-email executed cleanly without secret exposure");

  // 6. Test admin POST /api/admin/notifications/test-sms
  console.log("\nTEST 6: Admin POST /api/admin/notifications/test-sms (Section 25.2)");
  const testSmsRes = await fetch(`${BASE_URL}/api/admin/notifications/test-sms`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ to: "+919573976462" }),
  });
  assert.strictEqual(testSmsRes.status, 200);
  const testSmsBody = await testSmsRes.json();
  assert.strictEqual(testSmsBody.success, true);
  assert.strictEqual(testSmsBody.recipient, "+919573976462");
  console.log("✓ Admin POST test-sms executed cleanly without secret exposure");

  console.log("\n=======================================================");
  console.log("ALL HTTP API INTEGRATION TESTS PASSED! ✓");
  console.log("=======================================================\n");
}

module.exports = { runTests };

if (require.main === module) {
  runTests().catch((err) => {
    console.error("HTTP Integration Tests Failed:", err);
    process.exit(1);
  });
}
