-- AlphaQ Gaming — local MySQL bootstrap (run once as an admin/root user).
-- Creates a dedicated application database + user so the app never needs root.
-- Dev-only credentials; production uses managed secrets (see backend/.env.example).

CREATE DATABASE IF NOT EXISTS alphaq_gaming
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE USER IF NOT EXISTS 'alphaq'@'localhost' IDENTIFIED BY 'alphaq_dev_pw';
GRANT ALL PRIVILEGES ON alphaq_gaming.* TO 'alphaq'@'localhost';
FLUSH PRIVILEGES;

SELECT 'alphaq_gaming ready' AS status;
