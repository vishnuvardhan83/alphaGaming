// AlphaQ Gaming — Utility script to update or reset Admin credentials
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { db, init } = require("./db");

async function main() {
  const newPassword = process.argv[2] || process.env.ADMIN_PASSWORD;
  const newEmail = process.argv[3] || process.env.ADMIN_EMAIL;

  if (!newPassword && !newEmail) {
    console.log("Usage:");
    console.log("  node reset-admin.js <new_password> [new_email]");
    console.log("Example:");
    console.log("  node reset-admin.js mySecretPass123 v9347976462@gmail.com");
    process.exit(1);
  }

  console.log("Connecting to database...");
  await init({ skipMigrations: true });

  const adminPhone = (process.env.ADMIN_PHONES || "9573976462").split(",")[0].trim().replace(/\D/g, "");
  const updates = [];
  const params = [];

  if (newPassword) {
    const hash = bcrypt.hashSync(newPassword.trim(), 10);
    updates.push("password_hash = ?");
    params.push(hash);
  }

  if (newEmail) {
    updates.push("email = ?");
    params.push(newEmail.trim().toLowerCase());
    updates.push("email_verified = 1");
  }

  // Update by role='admin' or by phone
  let sql = `UPDATE users SET ${updates.join(", ")} WHERE role = 'admin' OR phone LIKE ?`;
  params.push(`%${adminPhone}%`);

  const res = await db.run(sql, params);

  console.log(`✓ Admin credentials updated successfully (${res.changes || 1} account(s) updated).`);
  if (newPassword) console.log(`  New Admin Password: ${newPassword}`);
  if (newEmail) console.log(`  New Admin Email:    ${newEmail}`);

  await db.close();
}

main().catch((err) => {
  console.error("Error resetting admin:", err);
  process.exit(1);
});
