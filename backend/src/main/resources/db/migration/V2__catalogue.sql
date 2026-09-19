-- V2 — Catalogue: pricing, games and physical setups (blueprint §04).
-- Prices live in the DB (master prompt §9: never hardcode in Angular).

CREATE TABLE pricing (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    platform    VARCHAR(10)  NOT NULL,            -- PC, PS5
    tier_code   VARCHAR(16)  NOT NULL,            -- MIN30, HOUR, DAY
    label       VARCHAR(40)  NOT NULL,
    minutes     INT          NOT NULL,            -- billing block length (day = 540 = 11:00–20:00)
    price_inr   INT          NOT NULL,
    sort_order  INT          NOT NULL DEFAULT 0,
    active      TINYINT(1)   NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uk_pricing_platform_tier (platform, tier_code)
) ENGINE=InnoDB;

CREATE TABLE game (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    title         VARCHAR(80)  NOT NULL,
    platform      VARCHAR(10)  NOT NULL,          -- PC, PS5, BOTH
    tags          VARCHAR(160) NULL,              -- comma-separated (Competitive, FPS, ...)
    player_count  VARCHAR(24)  NULL,
    active        TINYINT(1)   NOT NULL DEFAULT 1,
    sort_order    INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_game_platform (platform)
) ENGINE=InnoDB;

-- Physical setups. Customers pick platform+quantity; admin assigns a numbered
-- setup after approval. A setup in MAINTENANCE is removed from availability.
CREATE TABLE gaming_setup (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    code             VARCHAR(16)  NOT NULL,       -- PC-01 .. PC-10, PS5-01 .. PS5-03
    platform         VARCHAR(10)  NOT NULL,
    status           VARCHAR(16)  NOT NULL DEFAULT 'AVAILABLE',  -- AVAILABLE, MAINTENANCE
    capacity_players INT          NOT NULL DEFAULT 1,             -- PS5 = 4
    sort_order       INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_setup_code (code),
    KEY idx_setup_platform_status (platform, status)
) ENGINE=InnoDB;

-- ---- Seed: pricing (blueprint §04) ----------------------------------------
INSERT INTO pricing (platform, tier_code, label, minutes, price_inr, sort_order) VALUES
 ('PC',  'MIN30', '30 minutes',    30,  50, 1),
 ('PC',  'HOUR',  'Per hour',      60, 100, 2),
 ('PC',  'DAY',   'Full-day pass', 540, 500, 3),
 ('PS5', 'MIN30', '30 minutes',    30,  60, 1),
 ('PS5', 'HOUR',  'Per hour',      60, 120, 2),
 ('PS5', 'DAY',   'Full-day pass', 540, 600, 3);

-- ---- Seed: games ----------------------------------------------------------
INSERT INTO game (title, platform, tags, player_count, sort_order) VALUES
 ('Valorant',         'PC',  'Competitive,FPS',      '5v5',   1),
 ('Counter-Strike 2', 'PC',  'Competitive,FPS',      '5v5',   2),
 ('Dota 2',           'PC',  'MOBA,Multiplayer',     '5v5',   3),
 ('GTA V',            'PC',  'Open world,Casual',    '1',     4),
 ('EA FC 25',         'PS5', 'Sports,Couch',         '1-4',   5),
 ('Mortal Kombat 1',  'PS5', 'Fighting,Couch',       '1-2',   6);

-- ---- Seed: physical setups (10 PCs, 3 PS5s) -------------------------------
INSERT INTO gaming_setup (code, platform, capacity_players, sort_order) VALUES
 ('PC-01','PC',1,1),('PC-02','PC',1,2),('PC-03','PC',1,3),('PC-04','PC',1,4),('PC-05','PC',1,5),
 ('PC-06','PC',1,6),('PC-07','PC',1,7),('PC-08','PC',1,8),('PC-09','PC',1,9),('PC-10','PC',1,10),
 ('PS5-01','PS5',4,11),('PS5-02','PS5',4,12),('PS5-03','PS5',4,13);
