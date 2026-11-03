-- DEVELOPMENT MIGRATION: required by Worker 4.3.0-dev account workspace sync.
-- Not applied to the live D1 database. Apply only in a separately approved release.
-- One versioned workspace snapshot per authenticated account.
CREATE TABLE IF NOT EXISTS ef_user_workspace_v1 (
  user_id TEXT PRIMARY KEY NOT NULL,
  workspace_json TEXT NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ef_user_workspace_updated_at
  ON ef_user_workspace_v1(updated_at);
