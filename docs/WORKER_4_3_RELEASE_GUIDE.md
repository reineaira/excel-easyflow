# EasyFlow Worker 4.3.0-dev release notes

## Development-only changes in this branch

- Restores a complete Cloudflare Worker source file at `worker.js`, based on the v4.2.1 Worker source supplied by the project owner.
- Preserves the existing authentication, D1 account/session lookup, AI workflow planner, trial/credits, PayMongo checkout, and signed payment webhook routes.
- Adds authenticated `GET /api/workspace` and `PUT /api/workspace` endpoints for the Freelancer Desk collections: tasks, clients, products, orders, and transactions.
- Resolves the account ID from the validated bearer session on the server. Client-provided user IDs are not used.
- Adds a 256 KiB request/workspace limit, per-collection record caps, field sanitization, and optimistic version checks to prevent silent overwrites.
- Rejects a no-op conditional upsert by checking D1's affected-row count, including the first-save race when two devices create a workspace simultaneously.
- Validates PayMongo paid amount against `net_amount` when present (the amount credited after fees), falling back to `amount` only when `net_amount` is absent.
- Workspace access requires a valid signed-in session but does not consume AI credits or require an active paid/trial entitlement.
- Adds CORS permission for the PUT method and checks actual request-body bytes rather than relying only on Content-Length.
- Frontend now offers explicit Save to account, Merge account data, and Load account data actions. It never silently overwrites the local copy on login.
- Device JSON export/import remains available.

## Staging database migrations

Apply these migrations in numerical order to the isolated `easyflow-staging-db` database only:

1. `migrations/0000_ef_core_v4.sql` — creates the v4 users, sessions, and orders tables used by the existing Worker API.
2. `migrations/0001_ef_user_workspace_v1.sql` — creates the account workspace snapshot table.

Both files use `IF NOT EXISTS` for safe repeat execution. They have not been applied to any database. Do not apply them to production `my-binding` as part of staging setup.

## Required Cloudflare Worker bindings/secrets

For the staging Worker, configure:
- D1 binding: `DB` → `easyflow-staging-db`
- Secret: `OPENAI_API_KEY` — use a separate test/development key if available.
- Variable: `OPENAI_MODEL` — `gpt-6-luna` (or another model enabled for the configured key).
- Secret: `PAYMONGO_SECRET_KEY` — PayMongo test-mode secret only.
- Secret: `PAYMONGO_WEBHOOK_SECRET` — staging test webhook signing secret only.

Never copy production secrets into GitHub or the frontend. If separate test credentials are not available, leave the corresponding integration unconfigured and test the remaining routes first.

## Release sequence — not performed

1. Back up the live Worker source and D1 database.
2. Verify the current live D1 table schema against the queries in `worker.js`.
3. Apply `0000` then `0001` to `easyflow-staging-db` only.
4. Deploy this Worker source to a separate staging Worker, with the staging D1 binding and staging-only test credentials.
5. Test registration/login/logout, expired sessions, AI planning, trial/credits, PayMongo test checkout/webhook, per-account workspace isolation, invalid tokens, oversized requests, stale versions, and concurrent saves.
6. Test the frontend on Android and desktop browsers, including Excel/CSV upload and downloads, local backup/restore, account merge/load/save, logout/login, and network failure behavior.
7. Only after successful tests and explicit owner approval, schedule the production Worker/database/site release.

## Verification truth

Source syntax and static safety checks have been reviewed. These migrations are prepared from the SQL statements currently used by `worker.js`; the staging database has not yet been queried to verify application. The live Worker, production D1 database, PayMongo settings, secrets, and GitHub Pages site have not been changed by this work.
