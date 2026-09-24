// AlphaQ Gaming — database layer.
//
// Supports MySQL (for production/server deploys) with automatic SQLite fallback
// (zero-config local dev). Pick the driver via environment:
//
//   DB_CLIENT=mysql            -> MySQL  (or set any MYSQL_* var / DATABASE_URL)
//   DB_CLIENT=sqlite           -> SQLite (default when nothing is configured)
//
// Both drivers expose the SAME async API so the rest of the app never cares:
//   db.get(sql, params)  -> a single row (or undefined)
//   db.all(sql, params)  -> an array of rows
//   db.run(sql, params)  -> { lastInsertRowid, changes }
//   db.exec(sql)         -> run raw DDL (no params)
//
// Call `await init()` once at startup to create tables + seed defaults.
require("dotenv").config();
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");

const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const explicit = (process.env.DB_CLIENT || "").toLowerCase();
const mysqlUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
const mysqlHost = process.env.MYSQL_HOST || process.env.MYSQLHOST;
const mysqlPort = Number(process.env.MYSQL_PORT || process.env.MYSQLPORT || 3306);
const mysqlUser = process.env.MYSQL_USER || process.env.MYSQLUSER || "root";
const mysqlPassword =
  process.env.MYSQL_PASSWORD !== undefined
    ? process.env.MYSQL_PASSWORD
    : (process.env.MYSQLPASSWORD || "");
const mysqlDatabase = process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || "alphaq";

const USE_MYSQL =
  explicit === "mysql" ||
  (explicit !== "sqlite" && (!!mysqlUrl || !!mysqlHost));

/* ------------------------------------------------------------- drivers --- */

function makeMysql() {
  const mysql = require("mysql2/promise");
  const pool = mysqlUrl
    ? mysql.createPool(mysqlUrl)
    : mysql.createPool({
        host: mysqlHost || "localhost",
        port: mysqlPort,
        user: mysqlUser,
        password: mysqlPassword,
        database: mysqlDatabase,
        waitForConnections: true,
        connectionLimit: Number(process.env.MYSQL_POOL || 10),
        charset: "utf8mb4",
        // Fail a single connect attempt fast so the retry loop (waitForDb) can
        // back off, instead of hanging on the driver's long default.
        connectTimeout: Number(process.env.MYSQL_CONNECT_TIMEOUT || 10000),
      });
  return {
    kind: "mysql",
    async get(sql, params = []) {
      const [rows] = await pool.query(sql, params);
      return rows[0];
    },
    async all(sql, params = []) {
      const [rows] = await pool.query(sql, params);
      return rows;
    },
    async run(sql, params = []) {
      const [res] = await pool.query(sql, params);
      return { lastInsertRowid: res.insertId, changes: res.affectedRows };
    },
    async exec(sql) {
      await pool.query(sql);
    },
    async transaction(callback) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const tx = {
          async get(sql, params = []) {
            const [rows] = await conn.query(sql, params);
            return rows[0];
          },
          async all(sql, params = []) {
            const [rows] = await conn.query(sql, params);
            return rows;
          },
          async run(sql, params = []) {
            const [res] = await conn.query(sql, params);
            return { lastInsertRowid: res.insertId, changes: res.affectedRows };
          },
          async exec(sql) {
            await conn.query(sql);
          },
        };
        const result = await callback(tx);
        await conn.commit();
        return result;
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    },
    async close() {
      await pool.end();
    },
  };
}

function makeSqlite() {
  const Database = require("better-sqlite3");
  const DATA_DIR = path.join(__dirname, "data");
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const file = process.env.SQLITE_PATH || path.join(DATA_DIR, "alphaq.db");
  const sdb = new Database(file);
  sdb.pragma("journal_mode = WAL");
  return {
    kind: "sqlite",
    async get(sql, params = []) {
      return sdb.prepare(sql).get(...params);
    },
    async all(sql, params = []) {
      return sdb.prepare(sql).all(...params);
    },
    async run(sql, params = []) {
      const info = sdb.prepare(sql).run(...params);
      return { lastInsertRowid: Number(info.lastInsertRowid), changes: info.changes };
    },
    async exec(sql) {
      sdb.exec(sql);
    },
    async transaction(callback) {
      sdb.exec("BEGIN IMMEDIATE");
      try {
        const tx = {
          async get(sql, params = []) {
            return sdb.prepare(sql).get(...params);
          },
          async all(sql, params = []) {
            return sdb.prepare(sql).all(...params);
          },
          async run(sql, params = []) {
            const info = sdb.prepare(sql).run(...params);
            return { lastInsertRowid: Number(info.lastInsertRowid), changes: info.changes };
          },
          async exec(sql) {
            sdb.exec(sql);
          },
        };
        const result = await callback(tx);
        sdb.exec("COMMIT");
        return result;
      } catch (err) {
        sdb.exec("ROLLBACK");
        throw err;
      }
    },
    async close() {
      sdb.close();
    },
  };
}

const db = USE_MYSQL ? makeMysql() : makeSqlite();

/* -------------------------------------------------------------- schema --- */

const SQLITE_SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  reward_points INTEGER NOT NULL DEFAULT 0,
  blocked INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  phone TEXT NOT NULL,
  platform TEXT NOT NULL,
  date TEXT NOT NULL,
  slot TEXT NOT NULL,
  duration_label TEXT NOT NULL,
  price INTEGER NOT NULL,
  players INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'awaiting_payment',
  upi_ref TEXT,
  decision_reason TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  platform TEXT NOT NULL,
  tags TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS food (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS food_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  phone TEXT NOT NULL,
  booking_id INTEGER NOT NULL,
  setup_label TEXT NOT NULL,
  items TEXT NOT NULL,
  total INTEGER NOT NULL,
  pay_with TEXT NOT NULL DEFAULT 'counter',
  status TEXT NOT NULL DEFAULT 'placed',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS tournaments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game TEXT NOT NULL,
  format TEXT NOT NULL,
  date TEXT NOT NULL,
  prize TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'soon',
  description TEXT NOT NULL DEFAULT '',
  capacity INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  phone TEXT NOT NULL,
  player_name TEXT NOT NULL,
  team_name TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  name TEXT NOT NULL,
  handle TEXT,
  rating INTEGER NOT NULL DEFAULT 5,
  body TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  approved INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS gallery (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS rewards_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  \`key\` TEXT PRIMARY KEY,
  \`value\` TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS group_quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  group_size INTEGER NOT NULL DEFAULT 1,
  event_type TEXT NOT NULL DEFAULT 'group',
  preferred_date TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL DEFAULT 'pc',
  add_food INTEGER NOT NULL DEFAULT 0,
  add_tournament INTEGER NOT NULL DEFAULT 0,
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL
);
`;

// MySQL runs one statement per exec() call, so keep them as an array.
const MYSQL_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(190),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer',
    reward_points INT NOT NULL DEFAULT 0,
    blocked TINYINT NOT NULL DEFAULT 0,
    created_at BIGINT NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    platform VARCHAR(20) NOT NULL,
    date VARCHAR(40) NOT NULL,
    slot VARCHAR(80) NOT NULL,
    duration_label VARCHAR(120) NOT NULL,
    price INT NOT NULL,
    players INT NOT NULL DEFAULT 1,
    status VARCHAR(30) NOT NULL DEFAULT 'awaiting_payment',
    upi_ref VARCHAR(120),
    decision_reason VARCHAR(255),
    created_at BIGINT NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(160) NOT NULL,
    platform TEXT NOT NULL,
    tags TEXT NOT NULL,
    active TINYINT NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS food (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    category VARCHAR(80) NOT NULL,
    price INT NOT NULL,
    image VARCHAR(255) NOT NULL DEFAULT '',
    active TINYINT NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS food_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    booking_id INT NOT NULL,
    setup_label VARCHAR(160) NOT NULL,
    items TEXT NOT NULL,
    total INT NOT NULL,
    pay_with VARCHAR(20) NOT NULL DEFAULT 'counter',
    status VARCHAR(20) NOT NULL DEFAULT 'placed',
    created_at BIGINT NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS tournaments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game VARCHAR(160) NOT NULL,
    format VARCHAR(120) NOT NULL,
    date VARCHAR(60) NOT NULL,
    prize VARCHAR(120) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'soon',
    description VARCHAR(500) NOT NULL DEFAULT '',
    capacity INT NOT NULL DEFAULT 0,
    created_at BIGINT NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NOT NULL,
    user_id INT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    player_name VARCHAR(120) NOT NULL,
    team_name VARCHAR(120),
    created_at BIGINT NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    name VARCHAR(120) NOT NULL,
    handle VARCHAR(80),
    rating INT NOT NULL DEFAULT 5,
    body VARCHAR(1000) NOT NULL,
    verified TINYINT NOT NULL DEFAULT 0,
    approved TINYINT NOT NULL DEFAULT 1,
    created_at BIGINT NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS gallery (
    id INT AUTO_INCREMENT PRIMARY KEY,
    url VARCHAR(255) NOT NULL,
    caption VARCHAR(255) NOT NULL DEFAULT '',
    sort_order INT NOT NULL DEFAULT 0,
    created_at BIGINT NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS rewards_ledger (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    delta INT NOT NULL,
    reason VARCHAR(190) NOT NULL,
    created_at BIGINT NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS settings (
    \`key\` VARCHAR(120) PRIMARY KEY,
    \`value\` TEXT NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS group_quotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(190) NOT NULL DEFAULT '',
    group_size INT NOT NULL DEFAULT 1,
    event_type VARCHAR(40) NOT NULL DEFAULT 'group',
    preferred_date VARCHAR(60) NOT NULL DEFAULT '',
    platform VARCHAR(20) NOT NULL DEFAULT 'pc',
    add_food TINYINT NOT NULL DEFAULT 0,
    add_tournament TINYINT NOT NULL DEFAULT 0,
    message VARCHAR(1000) NOT NULL DEFAULT '',
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    created_at BIGINT NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

async function ensureSchema() {
  if (db.kind === "sqlite") {
    await db.exec(SQLITE_SCHEMA);
    // Legacy migration: `image` column added to food after the first release.
    try {
      await db.exec("ALTER TABLE food ADD COLUMN image TEXT NOT NULL DEFAULT ''");
    } catch {
      /* column already exists */
    }
    // Migration: `blocked` column added to users.
    try {
      await db.exec("ALTER TABLE users ADD COLUMN blocked INTEGER NOT NULL DEFAULT 0");
    } catch {
      /* column already exists */
    }
  } else {
    for (const stmt of MYSQL_SCHEMA) await db.exec(stmt);
    try {
      await db.exec("ALTER TABLE users ADD COLUMN blocked TINYINT NOT NULL DEFAULT 0");
    } catch {
      /* column already exists */
    }
  }
}

/* --------------------------------------------------------------- helpers -- */

function now() {
  return Date.now();
}

function normalizePhone(input) {
  let d = String(input || "").replace(/\D/g, "");
  if (d.length === 10) d = "91" + d;
  return d;
}

async function getSetting(key, fallback = "") {
  const row = await db.get("SELECT `value` FROM settings WHERE `key` = ?", [key]);
  return row ? row.value : fallback;
}

async function setSetting(key, value) {
  const res = await db.run("UPDATE settings SET `value` = ? WHERE `key` = ?", [
    String(value),
    key,
  ]);
  if (!res.changes) {
    await db.run("INSERT INTO settings(`key`, `value`) VALUES(?, ?)", [key, String(value)]);
  }
}

async function allSettings() {
  const rows = await db.all("SELECT `key`, `value` FROM settings");
  const out = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

async function addReward(userId, delta, reason) {
  await db.run("INSERT INTO rewards_ledger(user_id, delta, reason, created_at) VALUES(?,?,?,?)", [
    userId,
    delta,
    reason,
    now(),
  ]);
  await db.run("UPDATE users SET reward_points = reward_points + ? WHERE id = ?", [delta, userId]);
}

/* ------------------------------------------------------------------ seed -- */

async function seed() {
  const DEFAULT_SETTINGS = {
    brandName: "AlphaQ Gaming",
    whatsapp: (process.env.ADMIN_PHONES || "9573976462").split(",")[0].trim(),
    phone: (process.env.ADMIN_PHONES || "9573976462").split(",")[0].trim(),
    email: process.env.ADMIN_EMAIL || "v9347976462@gmail.com",
    instagram: "alphaq.gaming",
    city: "Indore, Madhya Pradesh",
    hours: "Tue–Sun · 11:00 AM – 8:00 PM",
    upiId: "alphaq@upi",
    upiName: "AlphaQ Gaming",
    upiPhone: (process.env.ADMIN_PHONES || "9573976462").split(",")[0].trim(),
    appBg: "",
    pcCount: "10",
    ps5Count: "3",
    pcPrice30m: "50",
    pcPrice1h: "100",
    pcPriceDay: "500",
    ps5Price30m: "60",
    ps5Price1h: "120",
    ps5PriceDay: "600",
    statSetups: "13",
    statRefresh: "240Hz",
    statPing: "<20ms",
    statTitles: "7+",
    address: "",
  };
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
    const exists = await db.get("SELECT 1 FROM settings WHERE `key` = ?", [k]);
    if (!exists) await setSetting(k, v);
  }

  // Admin bootstrap
  const adminPhones = (process.env.ADMIN_PHONES || "9573976462")
    .split(",")
    .map(normalizePhone)
    .filter(Boolean);
  const adminPhone = adminPhones[0];
  const adminEmail = (process.env.ADMIN_EMAIL || "v9347976462@gmail.com").trim().toLowerCase();

  if (adminPhone) {
    const existingAdmin = await db.get("SELECT id, email FROM users WHERE phone = ?", [adminPhone]);
    if (!existingAdmin) {
      const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || "admin123", 10);
      await db.run(
        "INSERT INTO users(phone, name, email, password_hash, role, reward_points, blocked, email_verified, email_verified_at, created_at) VALUES(?,?,?,?,?,?,?,?,?,?)",
        [adminPhone, "AlphaQ Admin", adminEmail, hash, "admin", 0, 0, 1, now(), now()],
      );
      console.log(`Seeded admin: phone ${adminPhone} / email ${adminEmail} / password "admin123" (change it!)`);
    } else if (!existingAdmin.email) {
      await db.run(
        "UPDATE users SET email = ?, email_verified = 1, email_verified_at = ? WHERE id = ?",
        [adminEmail, now(), existingAdmin.id],
      );
      console.log(`Updated admin (id: ${existingAdmin.id}) email to ${adminEmail}`);
    }
  }

  // No sample content is seeded — games, food, tournaments and reviews all start
  // empty. The admin adds real data through the in-app admin screens after deploy.
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Transient connection failures that are worth retrying (network/DNS warmup,
// DB still booting). Anything else (bad credentials, unknown DB) fails fast.
const TRANSIENT_DB_ERRORS = new Set([
  "ETIMEDOUT",
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ECONNRESET",
  "EPIPE",
  "PROTOCOL_CONNECTION_LOST",
  "ER_CON_COUNT_ERROR",
]);

// Wait until MySQL accepts a connection, retrying transient errors with
// exponential backoff. SQLite is a local file, so there is nothing to wait for.
// Bounded by DB_CONNECT_RETRIES so startup can never hang forever.
async function waitForDb() {
  if (db.kind !== "mysql") return;

  const maxRetries = Number(process.env.DB_CONNECT_RETRIES || 12);
  const baseDelay = Number(process.env.DB_CONNECT_RETRY_DELAY_MS || 1000);
  const maxDelay = Number(process.env.DB_CONNECT_MAX_DELAY_MS || 15000);

  for (let attempt = 1; ; attempt++) {
    try {
      await db.get("SELECT 1");
      if (attempt > 1) console.log(`MySQL reachable after ${attempt} attempts.`);
      return;
    } catch (err) {
      const code = (err && err.code) || "";
      const retryable = TRANSIENT_DB_ERRORS.has(code);
      if (!retryable || attempt >= maxRetries) {
        // Sanitized: only the error code is surfaced — never host/credentials.
        throw new Error(
          `Could not connect to MySQL after ${attempt} attempt(s)` +
            (code ? ` (last error: ${code})` : "") +
            ". Verify the database service is running and the MYSQL_* variables are set.",
        );
      }
      const delay = Math.min(baseDelay * 2 ** (attempt - 1), maxDelay);
      console.log(
        `MySQL not ready yet (${code || "unknown"}); retry ${attempt}/${maxRetries} in ${delay}ms.`,
      );
      await sleep(delay);
    }
  }
}

// Create the target database if it does not exist. Railway's MySQL image only
// creates the initial database on first boot with an empty volume; if the volume
// predates the MYSQL_DATABASE setting the DB is missing and every connection
// fails with ER_BAD_DB_ERROR (which is not transient, so waitForDb gives up
// immediately). We connect WITHOUT selecting a database, create it if needed,
// then let the pool connect normally. Retries transient errors so this doubles
// as the "wait for MySQL to boot" step. Skipped when DATABASE_URL is used (the
// DB name is embedded there) or on SQLite.
async function ensureDatabase() {
  if (db.kind !== "mysql" || mysqlUrl) return;
  const name = mysqlDatabase;
  const mysql = require("mysql2/promise");

  const maxRetries = Number(process.env.DB_CONNECT_RETRIES || 12);
  const baseDelay = Number(process.env.DB_CONNECT_RETRY_DELAY_MS || 1000);
  const maxDelay = Number(process.env.DB_CONNECT_MAX_DELAY_MS || 15000);

  for (let attempt = 1; ; attempt++) {
    let conn;
    try {
      conn = await mysql.createConnection({
        host: mysqlHost || "localhost",
        port: mysqlPort,
        user: mysqlUser,
        password: mysqlPassword,
        connectTimeout: Number(process.env.MYSQL_CONNECT_TIMEOUT || 10000),
      });
      // Backtick-escape the identifier; CREATE DATABASE cannot be parameterized.
      await conn.query(
        `CREATE DATABASE IF NOT EXISTS \`${name.replace(/`/g, "``")}\` ` +
          "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
      );
      if (attempt > 1) console.log(`MySQL reachable after ${attempt} attempts.`);
      return;
    } catch (err) {
      const code = (err && err.code) || "";
      const retryable = TRANSIENT_DB_ERRORS.has(code);
      if (!retryable || attempt >= maxRetries) {
        throw new Error(
          `Could not create/verify MySQL database after ${attempt} attempt(s)` +
            (code ? ` (last error: ${code})` : "") +
            ". Verify the database service is running and the MYSQL_* variables are set.",
        );
      }
      const delay = Math.min(baseDelay * 2 ** (attempt - 1), maxDelay);
      console.log(
        `MySQL not ready yet (${code || "unknown"}); retry ${attempt}/${maxRetries} in ${delay}ms.`,
      );
      await sleep(delay);
    } finally {
      if (conn) await conn.end().catch(() => {});
    }
  }
}

async function init({ skipMigrations = false } = {}) {
  await ensureDatabase();
  await waitForDb();
  if (!skipMigrations) {
    const { runMigrations } = require("./migrations/runner");
    await runMigrations();
  }
  await seed();
  return db.kind;
}

module.exports = {
  db,
  init,
  now,
  normalizePhone,
  getSetting,
  setSetting,
  allSettings,
  addReward,
  UPLOAD_DIR,
};

// `node db.js --seed` — set up the database without starting the API.
if (require.main === module && process.argv.includes("--seed")) {
  init()
    .then((kind) => {
      console.log(`Database ready (${kind}).`);
      return db.close();
    })
    .catch((e) => {
      console.error("Seed failed:", e);
      process.exit(1);
    });
}
