-- 008_voice_forwarding.sql — incoming-call delivery: per-user call forwarding,
-- voicemail, and per-user WebRTC SIP identity (fixes the shared-credential
-- multi-tenant collision where an inbound call rang the wrong user / nobody).
-- Run once against the production database:
--   mysql -h 127.0.0.1 -u <DB_USER> -p <DB_NAME> < server/migrations/008_voice_forwarding.sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS forward_number     VARCHAR(32) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS voicemail_enabled  TINYINT(1)  NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS sip_username       VARCHAR(80) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sip_credential_id  VARCHAR(80) NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS voicemails (
  id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id      BIGINT       NOT NULL,
  from_number  VARCHAR(32)  NOT NULL DEFAULT '',
  to_number    VARCHAR(32)  NOT NULL DEFAULT '',
  recording_url TEXT        NULL,
  duration     INT          NOT NULL DEFAULT 0,
  is_read      TINYINT(1)   NOT NULL DEFAULT 0,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_voicemail_user (user_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
