-- V1 — Authentication & identity schema (blueprint §07, master prompt §10)
-- Roles: OWNER, ADMIN, STAFF, CUSTOMER. Mobile is mandatory & unique.

CREATE TABLE roles (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    name        VARCHAR(32)  NOT NULL,
    created_at  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_roles_name (name)
) ENGINE=InnoDB;

CREATE TABLE users (
    id             BIGINT        NOT NULL AUTO_INCREMENT,
    mobile         VARCHAR(20)   NOT NULL,
    username       VARCHAR(40)   NOT NULL,
    email          VARCHAR(160)  NULL,
    password_hash  VARCHAR(100)  NOT NULL,
    status         VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',   -- ACTIVE, SUSPENDED
    mobile_verified TINYINT(1)   NOT NULL DEFAULT 1,
    email_verified TINYINT(1)    NOT NULL DEFAULT 0,
    created_at     DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at     DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    version        BIGINT        NOT NULL DEFAULT 0,           -- optimistic locking
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_mobile (mobile),
    UNIQUE KEY uk_users_username (username),
    UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE user_roles (
    user_id  BIGINT NOT NULL,
    role_id  BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (id)
) ENGINE=InnoDB;

-- OTP challenges (registration, login-recovery, etc.). Code is stored HASHED.
CREATE TABLE otp_request (
    id           BIGINT        NOT NULL AUTO_INCREMENT,
    mobile       VARCHAR(20)   NOT NULL,
    purpose      VARCHAR(24)   NOT NULL,                       -- REGISTER, PASSWORD_RESET
    code_hash    VARCHAR(100)  NOT NULL,
    expires_at   DATETIME(6)   NOT NULL,
    attempts     INT           NOT NULL DEFAULT 0,
    consumed     TINYINT(1)    NOT NULL DEFAULT 0,
    created_at   DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_otp_mobile_purpose (mobile, purpose),
    KEY idx_otp_created (created_at)
) ENGINE=InnoDB;

-- Immutable audit trail for sensitive actions (master prompt §20, blueprint §11).
CREATE TABLE audit_log (
    id          BIGINT        NOT NULL AUTO_INCREMENT,
    actor       VARCHAR(80)   NULL,          -- username / 'system' / 'anonymous'
    action      VARCHAR(80)   NOT NULL,      -- e.g. AUTH_REGISTER, AUTH_LOGIN
    entity      VARCHAR(80)   NULL,
    detail      VARCHAR(500)  NULL,
    created_at  DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_audit_action (action),
    KEY idx_audit_created (created_at)
) ENGINE=InnoDB;

-- Seed the role catalogue.
INSERT INTO roles (name) VALUES ('OWNER'), ('ADMIN'), ('STAFF'), ('CUSTOMER');
