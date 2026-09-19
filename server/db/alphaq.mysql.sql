-- AlphaQ Gaming — MySQL schema + seed dump
-- Import into a fresh MySQL database, e.g.:
--   mysql -u alphaq -p alphaq < alphaq.mysql.sql
-- or paste into phpMyAdmin's "Import" / "SQL" tab.
--
-- The app also creates + seeds these tables automatically on first start,
-- so this dump is only needed if you prefer to set the DB up by hand.
--
-- Seeded admin login:  phone 919573976462  /  password "admin123"  (CHANGE IT!)

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------ schema --

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'customer',
  reward_points INT NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bookings (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS games (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  platform TEXT NOT NULL,
  tags TEXT NOT NULL,
  active TINYINT NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS food (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  category VARCHAR(80) NOT NULL,
  price INT NOT NULL,
  image VARCHAR(255) NOT NULL DEFAULT '',
  active TINYINT NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS food_orders (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tournaments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game VARCHAR(160) NOT NULL,
  format VARCHAR(120) NOT NULL,
  date VARCHAR(60) NOT NULL,
  prize VARCHAR(120) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'soon',
  description VARCHAR(500) NOT NULL DEFAULT '',
  capacity INT NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tournament_id INT NOT NULL,
  user_id INT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  player_name VARCHAR(120) NOT NULL,
  team_name VARCHAR(120),
  created_at BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  name VARCHAR(120) NOT NULL,
  handle VARCHAR(80),
  rating INT NOT NULL DEFAULT 5,
  body VARCHAR(1000) NOT NULL,
  verified TINYINT NOT NULL DEFAULT 0,
  approved TINYINT NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS gallery (
  id INT AUTO_INCREMENT PRIMARY KEY,
  url VARCHAR(255) NOT NULL,
  caption VARCHAR(255) NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rewards_ledger (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  delta INT NOT NULL,
  reason VARCHAR(190) NOT NULL,
  created_at BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS settings (
  `key` VARCHAR(120) PRIMARY KEY,
  `value` TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------------- seed --

INSERT INTO settings (`key`, `value`) VALUES
  ('brandName', 'AlphaQ Gaming'),
  ('whatsapp', '919573976462'),
  ('phone', '919573976462'),
  ('email', 'hello@alphaq.gg'),
  ('instagram', 'alphaq.gaming'),
  ('city', 'Indore, Madhya Pradesh'),
  ('hours', 'Tue–Sun · 11:00 AM – 8:00 PM'),
  ('upiId', 'alphaq@upi'),
  ('upiName', 'AlphaQ Gaming'),
  ('appBg', ''),
  ('pcCount', '10'),
  ('ps5Count', '3')
ON DUPLICATE KEY UPDATE `value` = `value`;

-- Admin account — phone 919573976462, password "admin123" (bcrypt hashed).
INSERT INTO users (phone, name, email, password_hash, role, reward_points, created_at) VALUES
  ('919573976462', 'AlphaQ Admin', '', '$2a$10$Wv.4pbQVpjuRonAQTzFMX.bNsn/t.a2ZAAEvOzCPG3mKDYvwy1txC', 'admin', 0, 1758240000000)
ON DUPLICATE KEY UPDATE phone = phone;

INSERT INTO games (title, platform, tags, active, sort_order) VALUES
  ('Valorant', '["PC"]', '["Competitive","FPS"]', 1, 0),
  ('Counter-Strike 2', '["PC"]', '["Competitive","FPS"]', 1, 1),
  ('Dota 2', '["PC"]', '["MOBA","Multiplayer"]', 1, 2),
  ('GTA V', '["PC"]', '["Open world","Casual"]', 1, 3),
  ('EA FC 25', '["PS5"]', '["Sports","Couch"]', 1, 4),
  ('Mortal Kombat 1', '["PS5"]', '["Fighting","Couch"]', 1, 5);

INSERT INTO food (name, category, price, image, active, sort_order) VALUES
  ('Cold coffee', 'Drinks', 90, '', 1, 0),
  ('Energy cooler', 'Drinks', 70, '', 1, 1),
  ('Peri-peri fries', 'Snacks', 120, '', 1, 2),
  ('Loaded nachos', 'Snacks', 150, '', 1, 3),
  ('Veg maggi bowl', 'Meals', 80, '', 1, 4),
  ('Alpha combo', 'Combos', 220, '', 1, 5);

INSERT INTO tournaments (game, format, date, prize, status, description, capacity, created_at) VALUES
  ('Valorant', '5v5 · Best of 3', 'Sat, 27 Sep', '₹10,000 pool', 'open', 'Squad up and climb the bracket for the AlphaQ crown.', 16, 1758240000000),
  ('Counter-Strike 2', '5v5 · Single elim', 'Sun, 12 Oct', '₹8,000 pool', 'soon', 'Registration opens soon — get your team ready.', 16, 1758240000000);

INSERT INTO reviews (name, handle, rating, body, verified, approved, created_at) VALUES
  ('Rohit K.', '@rohitfrags', 5, 'Best rigs in Indore, hands down. Ping is unreal and the place is spotless.', 1, 1, 1758240000000),
  ('Aisha M.', '@aishaplays', 5, 'Booked the PS5 lounge for four of us. Comfortable couch, great TV, fun night.', 1, 1, 1758240000000),
  ('Dev P.', '@dev_valo', 4, 'Food to your seat is such a nice touch. Day pass is great value for a full grind.', 1, 1, 1758240000000);

SET FOREIGN_KEY_CHECKS = 1;
