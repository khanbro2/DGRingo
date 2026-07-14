-- 009_support_chat.sql — live customer support chat + team (agent) accounts.
-- Customers chat from the app; the Control Hub (admin) and team members answer.
-- Run once against the production database:
--   mysql -h 127.0.0.1 -u <DB_USER> -p <DB_NAME> < server/migrations/009_support_chat.sql

CREATE TABLE IF NOT EXISTS support_messages (
  id            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT       NOT NULL,               -- the customer this thread belongs to
  sender        VARCHAR(8)   NOT NULL DEFAULT 'user', -- 'user' | 'agent'
  agent_id      BIGINT       NULL,                    -- which team member replied (if agent)
  body          TEXT         NOT NULL,
  read_by_user  TINYINT(1)   NOT NULL DEFAULT 0,
  read_by_agent TINYINT(1)   NOT NULL DEFAULT 0,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_support_user (user_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS agents (
  id            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL DEFAULT '',
  email         VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL DEFAULT '',
  active        TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
