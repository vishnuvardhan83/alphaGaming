// AlphaQ Gaming — Migration 002: Email requirements, verification columns & table
// Safe, incremental and non-destructive:
// 1. Converts empty string emails in existing users to NULL so they do not conflict.
// 2. Safely handles any pre-existing duplicate emails without deleting accounts.
// 3. Adds email_verified and email_verified_at to users.
// 4. Adds unique index on users(email).
// 5. Creates email_verifications table for cryptographically secure OTP storage.

module.exports = {
  id: "002_email_and_verifications",
  async up(db) {
    // Step 1: Normalize existing empty string / whitespace emails to NULL.
    // In SQL, NULL values do not conflict in UNIQUE indexes, while empty strings do.
    await db.run("UPDATE users SET email = NULL WHERE email IS NOT NULL AND TRIM(email) = ''");

    // Step 2: Handle any existing duplicate non-null emails safely (case-insensitive)
    const duplicates = await db.all(
      "SELECT LOWER(email) AS em, COUNT(*) AS c FROM users WHERE email IS NOT NULL GROUP BY LOWER(email) HAVING c > 1",
    );
    for (const dup of duplicates) {
      const rows = await db.all(
        "SELECT id, email FROM users WHERE LOWER(email) = ? ORDER BY id ASC",
        [dup.em],
      );
      // Keep first row as-is, make subsequent rows unique without deleting them
      for (let i = 1; i < rows.length; i++) {
        const u = rows[i];
        const parts = u.email.split("@");
        const safeEmail = `${parts[0]}+duplicate_${u.id}@${parts[1] || "domain.local"}`;
        console.warn(
          `[Migration 002] Resolving duplicate email for user ${u.id}: "${u.email}" -> "${safeEmail}"`,
        );
        await db.run("UPDATE users SET email = ? WHERE id = ?", [safeEmail, u.id]);
      }
    }

    if (db.kind === "sqlite") {
      // Step 3: Check and add email_verified & email_verified_at columns in SQLite
      const columns = await db.all("PRAGMA table_info(users)");
      const colNames = new Set(columns.map((c) => c.name));

      if (!colNames.has("email_verified")) {
        await db.exec("ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0");
      }
      if (!colNames.has("email_verified_at")) {
        await db.exec("ALTER TABLE users ADD COLUMN email_verified_at INTEGER NULL");
      }

      // Step 4: Add UNIQUE index on email in SQLite
      await db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)");

      // Step 5: Create email_verifications table
      await db.exec(`
        CREATE TABLE IF NOT EXISTS email_verifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NULL,
          email TEXT NOT NULL,
          otp_hash TEXT NOT NULL,
          purpose TEXT NOT NULL DEFAULT 'verify_email',
          expires_at INTEGER NOT NULL,
          attempt_count INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          verified_at INTEGER NULL
        );
        CREATE INDEX IF NOT EXISTS idx_email_verif_email_purpose ON email_verifications(email, purpose);
        CREATE INDEX IF NOT EXISTS idx_email_verif_expires_at ON email_verifications(expires_at);
      `);
    } else {
      // Step 3: MySQL column checks & additions
      const cols = await db.all(
        "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'",
      );
      const colNames = new Set(cols.map((c) => c.COLUMN_NAME));

      if (!colNames.has("email_verified")) {
        await db.exec("ALTER TABLE users ADD COLUMN email_verified TINYINT NOT NULL DEFAULT 0");
      }
      if (!colNames.has("email_verified_at")) {
        await db.exec("ALTER TABLE users ADD COLUMN email_verified_at BIGINT NULL");
      }

      // Step 4: Add unique index on users(email) if not already exists
      const indexes = await db.all(
        "SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND (INDEX_NAME = 'idx_users_email' OR (COLUMN_NAME = 'email' AND NON_UNIQUE = 0))",
      );
      if (indexes.length === 0) {
        await db.exec("CREATE UNIQUE INDEX idx_users_email ON users(email)");
      }

      // Step 5: Create email_verifications table in MySQL
      await db.exec(`
        CREATE TABLE IF NOT EXISTS email_verifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NULL,
          email VARCHAR(190) NOT NULL,
          otp_hash VARCHAR(255) NOT NULL,
          purpose VARCHAR(40) NOT NULL DEFAULT 'verify_email',
          expires_at BIGINT NOT NULL,
          attempt_count INT NOT NULL DEFAULT 0,
          created_at BIGINT NOT NULL,
          verified_at BIGINT NULL,
          INDEX idx_email_verif_email_purpose (email, purpose),
          INDEX idx_email_verif_expires_at (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    }
  },
};
