-- V4 — Admin decisions on bookings: physical setup assignment + decision audit.

ALTER TABLE booking
    ADD COLUMN decided_by      VARCHAR(80)  NULL AFTER notes,
    ADD COLUMN decided_at      DATETIME(6)  NULL AFTER decided_by,
    ADD COLUMN decision_reason VARCHAR(300) NULL AFTER decided_at;

-- Which physical setups an approved booking occupies (admin assigns after approval).
CREATE TABLE booking_setup (
    booking_id BIGINT NOT NULL,
    setup_id   BIGINT NOT NULL,
    PRIMARY KEY (booking_id, setup_id),
    CONSTRAINT fk_bs_booking FOREIGN KEY (booking_id) REFERENCES booking (id) ON DELETE CASCADE,
    CONSTRAINT fk_bs_setup   FOREIGN KEY (setup_id)   REFERENCES gaming_setup (id)
) ENGINE=InnoDB;
