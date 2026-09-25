-- MySQL dump 10.13  Distrib 9.5.0, for macos15.4 (arm64)
--
-- Host: iriguchi.proxy.rlwy.net    Database: alphaq
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (1,4,'918269820266','pc','2026-09-20','11:00','Full-day pass',500,1,'pending','Chickened',NULL,1789883370153),(2,1,'919573976462','pc','2026-09-20','17:00','Per hour',100,1,'pending','99',NULL,1789899095552);
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `food`
--

DROP TABLE IF EXISTS `food`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `food`
--

LOCK TABLES `food` WRITE;
/*!40000 ALTER TABLE `food` DISABLE KEYS */;
INSERT INTO `food` VALUES (3,'chicken','meals',120,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTnhWvgmAT6YROJeCRTKbhrkdQD2t9IG1Go39O7xh0Tw&s=10',1,1);
/*!40000 ALTER TABLE `food` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `food_orders`
--

DROP TABLE IF EXISTS `food_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `food_orders`
--

LOCK TABLES `food_orders` WRITE;
/*!40000 ALTER TABLE `food_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `food_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gallery`
--

DROP TABLE IF EXISTS `gallery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gallery` (
  `id` int NOT NULL AUTO_INCREMENT,
  `url` varchar(255) NOT NULL,
  `caption` varchar(255) NOT NULL DEFAULT '',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gallery`
--

LOCK TABLES `gallery` WRITE;
/*!40000 ALTER TABLE `gallery` DISABLE KEYS */;
INSERT INTO `gallery` VALUES (9,'/uploads/g_1789904663943_950383.jpg','',0,1789904664578),(10,'/uploads/g_1789904671843_164643.jpg','',0,1789904671895),(11,'/uploads/g_1789904679699_67873.jpeg','',0,1789904679724),(12,'/uploads/g_1789904687013_76772.png','',0,1789904688285);
/*!40000 ALTER TABLE `gallery` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `games`
--

DROP TABLE IF EXISTS `games`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `games` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(160) NOT NULL,
  `platform` text NOT NULL,
  `tags` text NOT NULL,
  `active` tinyint NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `games`
--

LOCK TABLES `games` WRITE;
/*!40000 ALTER TABLE `games` DISABLE KEYS */;
/*!40000 ALTER TABLE `games` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_quotes`
--

DROP TABLE IF EXISTS `group_quotes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_quotes`
--

LOCK TABLES `group_quotes` WRITE;
/*!40000 ALTER TABLE `group_quotes` DISABLE KEYS */;
/*!40000 ALTER TABLE `group_quotes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registrations`
--

DROP TABLE IF EXISTS `registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registrations`
--

LOCK TABLES `registrations` WRITE;
/*!40000 ALTER TABLE `registrations` DISABLE KEYS */;
INSERT INTO `registrations` VALUES (1,1,1,'919573976462','AlphaQ Admin','plain',1789885694605);
/*!40000 ALTER TABLE `registrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (1,1,'AlphaQ Admin','@6462',5,'hi',1,0,1789898969003),(2,1,'AlphaQ Admin','@6462',5,'hhh',1,1,1789904712541);
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rewards_ledger`
--

DROP TABLE IF EXISTS `rewards_ledger`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rewards_ledger` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `delta` int NOT NULL,
  `reason` varchar(190) NOT NULL,
  `created_at` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rewards_ledger`
--

LOCK TABLES `rewards_ledger` WRITE;
/*!40000 ALTER TABLE `rewards_ledger` DISABLE KEYS */;
INSERT INTO `rewards_ledger` VALUES (1,1,2,'testing',1758342600000),(2,1,10,'Staff adjustment',1790193118147),(3,4,5,'Staff adjustment',1790268726921);
/*!40000 ALTER TABLE `rewards_ledger` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `key` varchar(120) NOT NULL,
  `value` text NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES ('appBg',''),('arenaImage','/uploads/g_1789904501722_322096.jpg'),('brandName','AlphaQ Gaming'),('city','Indore, Madhya Pradesh'),('email','hello@alphaq.gg'),('hours','Tue–Sun · 11:00 AM – 8:00 PM'),('instagram','alphaq.gaming'),('pcCount','10'),('phone','919573976462'),('ps5Count','3'),('upiId','alphaq@upi'),('upiName','AlphaQ Gaming'),('upiPhone','9573976462'),('whatsapp','919573976462');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tournaments`
--

DROP TABLE IF EXISTS `tournaments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tournaments`
--

LOCK TABLES `tournaments` WRITE;
/*!40000 ALTER TABLE `tournaments` DISABLE KEYS */;
INSERT INTO `tournaments` VALUES (1,'PUBG','4Vs4','2026-09-25','10000','open','hi this conduction by cafe',100,1789885678731);
/*!40000 ALTER TABLE `tournaments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `phone` varchar(20) NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(190) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'customer',
  `reward_points` int NOT NULL DEFAULT '0',
  `created_at` bigint NOT NULL,
  `blocked` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `phone` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'919573976462','AlphaQ Admin','','$2a$10$QtxjtRgn6nkYm89fys7gnuExSuFy4BI/4rYmvqjiE.Lrrq6hY4Cia','admin',10,1789852166902,0),(2,'919908213322','vardhan@83','','$2a$10$P6F7Pbc1DKlO6UYsCuRqIeyIWYfifhS6dn8MhPyQKjWdhL8tlW0ay','customer',0,1789852770181,0),(3,'919553515955','Vamsi','','$2a$10$Yw6VO8Gs/9sMD9xYSn9wce46wwbRF8KggFxGUUJ3C19d4gVi5xYbq','customer',0,1789883169815,0),(4,'918269820266','karan roy','','$2a$10$AEtTwM26mfo2Y9NpB4R58OxYyXgnCaZSjTdUV2ZsjaZZ5dwdcRuq6','customer',5,1789883309153,0);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'alphaq'
--

--
-- Dumping routines for database 'alphaq'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-25  1:38:21
