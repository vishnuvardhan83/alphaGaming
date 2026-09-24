// AlphaQ Gaming — Database Migration Runner
// Ensures database connectivity, manages the schema_migrations tracking table,
// and applies pending incremental migrations in sequence.

const fs = require("fs");
const path = require("path");
const { db, init } = require("../db");

async function ensureMigrationTable() {
  if (db.kind === "sqlite") {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at INTEGER NOT NULL
      )
    `);
  } else {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id VARCHAR(255) PRIMARY KEY,
        applied_at BIGINT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  }
}

async function getAppliedMigrations() {
  const rows = await db.all("SELECT id FROM schema_migrations ORDER BY id ASC");
  return new Set(rows.map((r) => r.id));
}

async function runMigrations() {
  await ensureMigrationTable();
  const applied = await getAppliedMigrations();

  const migrationsDir = __dirname;
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".js") && f !== "runner.js")
    .sort();

  let count = 0;
  for (const file of files) {
    const migrationPath = path.join(migrationsDir, file);
    const migration = require(migrationPath);
    const migrationId = migration.id || path.basename(file, ".js");

    if (!applied.has(migrationId)) {
      console.log(`[Migration] Applying ${migrationId} (${file})...`);
      try {
        await migration.up(db);
        await db.run("INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)", [
          migrationId,
          Date.now(),
        ]);
        console.log(`[Migration] ✓ Successfully applied ${migrationId}`);
        count++;
      } catch (err) {
        console.error(`[Migration] ✗ Failed to apply ${migrationId}:`, err);
        throw err;
      }
    }
  }

  if (count === 0) {
    console.log("[Migration] Database is already up to date. No pending migrations.");
  } else {
    console.log(`[Migration] Applied ${count} pending migration(s).`);
  }
}

module.exports = {
  runMigrations,
};

if (require.main === module) {
  (async () => {
    try {
      console.log("[Migration] Initializing database connection...");
      await init({ skipMigrations: true });
      await runMigrations();
      console.log("[Migration] Done.");
      await db.close();
      process.exit(0);
    } catch (e) {
      console.error("[Migration Runner Fatal Error]:", e);
      process.exit(1);
    }
  })();
}
