-- 006_freemius.sql — idempotency ledger for Freemius (Merchant of Record) webhooks.
-- Freemius may deliver the same event more than once; recordFreemiusEvent()
-- INSERTs the event id and treats a duplicate-key error as "already handled",
-- so a top-up is never double-credited nor a plan double-activated.

CREATE TABLE IF NOT EXISTS freemius_events (
  event_id   VARCHAR(191) NOT NULL PRIMARY KEY,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
