-- AlphaQ Gaming — Production MySQL Schema & Complete Data Backup
-- Generated with all 12 tables + email verification system + migration tracking
-- Fully compatible with Railway MySQL 8.x / 9.x and local MySQL

SET NAMES utf8mb4;
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
SET @OLD_TIME_ZONE=@@TIME_ZONE;
SET TIME_ZONE='+00:00';

-- ====================================================================
-- Table structure and data for table: schema_migrations
-- ====================================================================
CREATE TABLE IF NOT EXISTS `schema_migrations` (
  `id` varchar(255) NOT NULL,
  `applied_at` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `schema_migrations` WRITE;
INSERT INTO `schema_migrations` (`id`, `applied_at`) VALUES
  ('001_initial_schema', 1789852166902),
  ('002_email_and_verifications', 1789852166902)
ON DUPLICATE KEY UPDATE `applied_at` = VALUES(`applied_at`);
UNLOCK TABLES;

-- ====================================================================
-- Table structure and data for table: users
-- ====================================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `phone` varchar(20) NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(190) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'customer',
  `reward_points` int NOT NULL DEFAULT '0',
  `email_verified` tinyint(1) NOT NULL DEFAULT '0',
  `email_verified_at` bigint DEFAULT NULL,
  `blocked` tinyint NOT NULL DEFAULT '0',
  `created_at` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `phone` (`phone`),
  UNIQUE KEY `idx_users_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `users` WRITE;
INSERT INTO `users` (`id`, `phone`, `name`, `email`, `password_hash`, `role`, `reward_points`, `email_verified`, `email_verified_at`, `blocked`, `created_at`) VALUES
(1,'919573976462','AlphaQ Admin','v9347976462@gmail.com','$2a$10$QtxjtRgn6nkYm89fys7gnuExSuFy4BI/4rYmvqjiE.Lrrq6hY4Cia','admin',10,1,1789852166902,0,1789852166902),
(2,'919908213322','vardhan@83',NULL,'$2a$10$P6F7Pbc1DKlO6UYsCuRqIeyIWYfifhS6dn8MhPyQKjWdhL8tlW0ay','customer',0,0,NULL,0,1789852770181),
(3,'919553515955','Vamsi',NULL,'$2a$10$Yw6VO8Gs/9sMD9xYSn9wce46wwbRF8KggFxGUUJ3C19d4gVi5xYbq','customer',0,0,NULL,0,1789883169815),
(4,'918269820266','karan roy',NULL,'$2a$10$AEtTwM26mfo2Y9NpB4R58OxYyXgnCaZSjTdUV2ZsjaZZ5dwdcRuq6','customer',5,0,NULL,0,1789883309153);
UNLOCK TABLES;

-- ====================================================================
-- Table structure and data for table: email_verifications
-- ====================================================================
DROP TABLE IF EXISTS `email_verifications`;
CREATE TABLE `email_verifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `email` varchar(190) NOT NULL,
  `otp_hash` varchar(255) NOT NULL,
  `purpose` varchar(50) NOT NULL DEFAULT 'verify_email',
  `expires_at` bigint NOT NULL,
  `attempts` int NOT NULL DEFAULT '0',
  `max_attempts` int NOT NULL DEFAULT '5',
  `consumed_at` bigint DEFAULT NULL,
  `created_at` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_verif_lookup` (`email`,`purpose`),
  KEY `idx_verif_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- Table structure and data for table: bookings
-- ====================================================================
DROP TABLE IF EXISTS `bookings`;
CREATE TABLE `bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `phone` varchar(20) NOT NULL,
  `platform` varchar(20) NOT NULL,
  `date` varchar(40) NOT NULL,
  `slot` varchar(80) NOT NULL,
  `duration_label` varchar(120) NOT NULL,
  `price` int NOT NULL,
  `players` int NOT NULL DEFAULT '1',
  `status` varchar(30) NOT NULL DEFAULT 'awaiting_payment',
  `upi_ref` varchar(120) DEFAULT NULL,
  `decision_reason` varchar(255) DEFAULT NULL,
  `created_at` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `bookings` WRITE;
INSERT INTO `bookings` VALUES
(1,4,'918269820266','pc','2026-09-20','11:00','Full-day pass',500,1,'pending','Chickened',NULL,1789883370153),
(2,1,'919573976462','pc','2026-09-20','17:00','Per hour',100,1,'pending','99',NULL,1789899095552);
UNLOCK TABLES;

-- ====================================================================
-- Table structure and data for table: food
-- ====================================================================
DROP TABLE IF EXISTS `food`;
CREATE TABLE `food` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(160) NOT NULL,
  `category` varchar(80) NOT NULL,
  `price` int NOT NULL,
  `image` varchar(255) NOT NULL DEFAULT '',
  `active` tinyint NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `food` WRITE;
INSERT INTO `food` VALUES (3,'chicken','meals',120,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTnhWvgmAT6YROJeCRTKbhrkdQD2t9IG1Go39O7xh0Tw&s=10',1,1);
UNLOCK TABLES;

-- ====================================================================
-- Table structure and data for table: food_orders
-- ====================================================================
DROP TABLE IF EXISTS `food_orders`;
CREATE TABLE `food_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `phone` varchar(20) NOT NULL,
  `booking_id` int NOT NULL,
  `setup_label` varchar(160) NOT NULL,
  `items` text NOT NULL,
  `total` int NOT NULL,
  `pay_with` varchar(20) NOT NULL DEFAULT 'counter',
  `status` varchar(20) NOT NULL DEFAULT 'placed',
  `created_at` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ====================================================================
-- Table structure and data for table: gallery
-- ====================================================================
DROP TABLE IF EXISTS `gallery`;
CREATE TABLE `gallery` (
  `id` int NOT NULL AUTO_INCREMENT,
  `url` varchar(255) NOT NULL,
  `caption` varchar(255) NOT NULL DEFAULT '',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `gallery` WRITE;
INSERT INTO `gallery` VALUES
(9,'/uploads/g_1789904663943_950383.jpg','',0,1789904664578),
(10,'/uploads/g_1789904671843_164643.jpg','',0,1789904671895),
(11,'/uploads/g_1789904679699_67873.jpeg','',0,1789904679724),
(12,'/uploads/g_1789904687013_76772.png','',0,1789904688285);
UNLOCK TABLES;

-- ====================================================================
-- Table structure and data for table: games
-- ====================================================================
DROP TABLE IF EXISTS `games`;
CREATE TABLE `games` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(160) NOT NULL,
  `platform` text NOT NULL,
  `tags` text NOT NULL,
  `active` tinyint NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ====================================================================
-- Table structure and data for table: group_quotes
-- ====================================================================
DROP TABLE IF EXISTS `group_quotes`;
CREATE TABLE `group_quotes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `name` varchar(120) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(190) NOT NULL DEFAULT '',
  `group_size` int NOT NULL DEFAULT '1',
  `event_type` varchar(40) NOT NULL DEFAULT 'group',
  `preferred_date` varchar(60) NOT NULL DEFAULT '',
  `platform` varchar(20) NOT NULL DEFAULT 'pc',
  `add_food` tinyint NOT NULL DEFAULT '0',
  `add_tournament` tinyint NOT NULL DEFAULT '0',
  `message` varchar(1000) NOT NULL DEFAULT '',
  `status` varchar(30) NOT NULL DEFAULT 'pending',
  `created_at` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ====================================================================
-- Table structure and data for table: registrations
-- ====================================================================
DROP TABLE IF EXISTS `registrations`;
CREATE TABLE `registrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tournament_id` int NOT NULL,
  `user_id` int NOT NULL,
  `phone` varchar(20) NOT NULL,
  `player_name` varchar(120) NOT NULL,
  `team_name` varchar(120) DEFAULT NULL,
  `created_at` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `registrations` WRITE;
INSERT INTO `registrations` VALUES (1,1,1,'919573976462','AlphaQ Admin','plain',1789885694605);
UNLOCK TABLES;

-- ====================================================================
-- Table structure and data for table: reviews
-- ====================================================================
DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `name` varchar(120) NOT NULL,
  `handle` varchar(80) DEFAULT NULL,
  `rating` int NOT NULL DEFAULT '5',
  `body` varchar(1000) NOT NULL,
  `verified` tinyint NOT NULL DEFAULT '0',
  `approved` tinyint NOT NULL DEFAULT '0',
  `created_at` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `reviews` WRITE;
INSERT INTO `reviews` VALUES
(1,1,'AlphaQ Admin','@6462',5,'hi',1,0,1789898969003),
(2,1,'AlphaQ Admin','@6462',5,'hhh',1,1,1789904712541);
UNLOCK TABLES;

-- ====================================================================
-- Table structure and data for table: rewards_ledger
-- ====================================================================
DROP TABLE IF EXISTS `rewards_ledger`;
CREATE TABLE `rewards_ledger` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `delta` int NOT NULL,
  `reason` varchar(190) NOT NULL,
  `created_at` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `rewards_ledger` WRITE;
INSERT INTO `rewards_ledger` VALUES
(1,1,2,'testing',1758342600000),
(2,1,10,'Staff adjustment',1790193118147),
(3,4,5,'Staff adjustment',1790268726921);
UNLOCK TABLES;

-- ====================================================================
-- Table structure and data for table: settings
-- ====================================================================
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `key` varchar(120) NOT NULL,
  `value` text NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `settings` WRITE;
INSERT INTO `settings` VALUES
('address','Shop No. 12, ABC Mall, Vijay Nagar, Indore 452001'),
('appBg',''),
('arenaImage','/uploads/g_1789904501722_322096.jpg'),
('brandName','AlphaQ Gaming'),
('city','Indore, Madhya Pradesh'),
('email','v9347976462@gmail.com'),
('hours','Tue–Sun · 11:00 AM – 8:00 PM'),
('instagram','alphaq.gaming'),
('pcCount','10'),
('pcPrice1h','100'),
('pcPrice30m','50'),
('pcPriceDay','500'),
('phone','919573976462'),
('ps5Count','3'),
('ps5Price1h','120'),
('ps5Price30m','60'),
('ps5PriceDay','600'),
('statPing','<20ms'),
('statRefresh','240Hz'),
('statSetups','13'),
('statTitles','7+'),
('upiId','alphaq@upi'),
('upiName','AlphaQ Gaming'),
('upiPhone','9573976462'),
('whatsapp','919573976462')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);
UNLOCK TABLES;

-- ====================================================================
-- Table structure and data for table: tournaments
-- ====================================================================
DROP TABLE IF EXISTS `tournaments`;
CREATE TABLE `tournaments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `game` varchar(160) NOT NULL,
  `format` varchar(120) NOT NULL,
  `date` varchar(60) NOT NULL,
  `prize` varchar(120) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'soon',
  `description` varchar(500) NOT NULL DEFAULT '',
  `capacity` int NOT NULL DEFAULT '0',
  `created_at` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `tournaments` WRITE;
INSERT INTO `tournaments` VALUES (1,'PUBG','4Vs4','2026-09-25','10000','open','hi this conduction by cafe',100,1789885678731);
UNLOCK TABLES;

-- Restore configuration
SET TIME_ZONE=@OLD_TIME_ZONE;
SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
