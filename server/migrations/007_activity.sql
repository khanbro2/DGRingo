-- 007_activity.sql — persistent activity feed so the Activity screen survives a
-- refresh (previously it was client-only local state and reset to empty on reload).
-- Server-side events (number bought, plan activated, wallet top-up) are logged by
-- the server; client-only events (calls, verification) are POSTed by the app.

CREATE TABLE IF NOT EXISTS activity_log (
  id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT       NOT NULL,
  kind       VARCHAR(32)  NOT NULL DEFAULT 'system',
  title      VARCHAR(191) NOT NULL,
  body       TEXT         NULL,
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_activity_user (user_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
