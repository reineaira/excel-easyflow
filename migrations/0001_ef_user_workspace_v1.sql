-- DRAFT ONLY: Do not apply to the live D1 database until the Worker
-- v4.2.1 source has been restored, reviewed, and deployed through a separate
-- approved release. This table stores one versioned workspace snapshot per user.
CREATE TABLE IF NOT EXISTS ef_user_workspace_v1 (
  user_id TEXT PRIMARY KEY NOT NULL,
  workspace_json TEXT NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ef_user_workspace_updated_at
  ON ef_user_workspace_v1(updated_at);
