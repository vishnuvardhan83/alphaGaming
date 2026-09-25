// AlphaQ Gaming — Migration 001: Baseline schema
// Ensures all foundational tables exist if not already created.
// Idempotent and non-destructive: existing tables and rows are never dropped or modified.

const SQLITE_TABLES = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    reward_points INTEGER NOT NULL DEFAULT 0,
    blocked INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS bookings (
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
  )`,
  `CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    platform TEXT NOT NULL,
    tags TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS food (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price INTEGER NOT NULL,
    image TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS food_orders (
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
  )`,
  `CREATE TABLE IF NOT EXISTS tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game TEXT NOT NULL,
    format TEXT NOT NULL,
    date TEXT NOT NULL,
    prize TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'soon',
    description TEXT NOT NULL DEFAULT '',
    capacity INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    phone TEXT NOT NULL,
    player_name TEXT NOT NULL,
    team_name TEXT,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    handle TEXT,
    rating INTEGER NOT NULL DEFAULT 5,
    body TEXT NOT NULL,
    verified INTEGER NOT NULL DEFAULT 0,
    approved INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    caption TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS rewards_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    delta INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    \`key\` TEXT PRIMARY KEY,
    \`value\` TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS group_quotes (
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
  )`,
];

const MYSQL_TABLES = [
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

module.exports = {
  id: "001_initial_schema",
  async up(db) {
    if (db.kind === "sqlite") {
      for (const sql of SQLITE_TABLES) {
        await db.exec(sql);
      }
      // Ensure food.image exists
      try {
        await db.exec("ALTER TABLE food ADD COLUMN image TEXT NOT NULL DEFAULT ''");
      } catch {
        /* already exists */
      }
      // Ensure users.blocked exists
      try {
        await db.exec("ALTER TABLE users ADD COLUMN blocked INTEGER NOT NULL DEFAULT 0");
      } catch {
        /* already exists */
      }
    } else {
      for (const sql of MYSQL_TABLES) {
        await db.exec(sql);
      }
      // Check column blocked in users
      try {
        await db.exec("ALTER TABLE users ADD COLUMN blocked TINYINT NOT NULL DEFAULT 0");
      } catch {
        /* already exists */
      }
    }
  },
};
