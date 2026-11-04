-- DEVELOPMENT ONLY: base schema required by worker.js v4.3.0-dev.
-- Apply only to the isolated easyflow-staging-db database.
-- This schema is based on the SQL statements used by worker.js.
-- Cloudflare D1 enforces foreign keys by default; no PRAGMA toggle is needed.

CREATE TABLE IF NOT EXISTS ef_users_v4 (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  trial_ends_at INTEGER NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'starter', 'pro', 'business')),
  plan_ends_at INTEGER NOT NULL DEFAULT 0,
  credits_remaining INTEGER NOT NULL DEFAULT 20 CHECK (credits_remaining >= 0),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled')),
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS ef_sessions_v4 (
  token_hash TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES ef_users_v4(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ef_sessions_user_id
  ON ef_sessions_v4(user_id);
CREATE INDEX IF NOT EXISTS idx_ef_sessions_expires_at
  ON ef_sessions_v4(expires_at);

CREATE TABLE IF NOT EXISTS ef_orders_v4 (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'pro', 'business')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  created_at INTEGER NOT NULL,
  checkout_session_id TEXT,
  paid_at INTEGER,
  payment_event_id TEXT,
  FOREIGN KEY (user_id) REFERENCES ef_users_v4(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ef_orders_user_created
  ON ef_orders_v4(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ef_orders_checkout_session
  ON ef_orders_v4(checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_ef_orders_status
  ON ef_orders_v4(status);
