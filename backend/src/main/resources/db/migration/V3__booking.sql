-- V3 — Booking engine (blueprint §05, master prompt §8).
-- Customers pick platform + quantity + date/time/duration; admin assigns the
-- numbered setup after approval. Overlap is prevented at the service+DB level.

CREATE TABLE booking (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    reference       VARCHAR(20)  NOT NULL,               -- human-friendly code, e.g. AQ-7F3K9Q
    user_id         BIGINT       NOT NULL,
    platform        VARCHAR(10)  NOT NULL,               -- PC, PS5
    quantity        INT          NOT NULL,               -- number of setups
    booking_date    DATE         NOT NULL,
    start_time      TIME         NOT NULL,
    end_time        TIME         NOT NULL,
    duration_min    INT          NOT NULL,
    day_pass        TINYINT(1)   NOT NULL DEFAULT 0,
    participants    INT          NOT NULL DEFAULT 1,
    unit_price_inr  INT          NOT NULL,
    total_inr       INT          NOT NULL,
    status          VARCHAR(20)  NOT NULL,               -- see BookingStatus
    hold_expires_at DATETIME(6)  NULL,                   -- set while AWAITING_PAYMENT
    notes           VARCHAR(300) NULL,
    created_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    version         BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_booking_reference (reference),
    CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES users (id),
    KEY idx_booking_avail (platform, booking_date, status),
    KEY idx_booking_user (user_id, booking_date)
) ENGINE=InnoDB;
