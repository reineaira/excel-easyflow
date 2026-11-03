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

## Database migration required

The new API requires `migrations/0001_ef_user_workspace_v1.sql` to be applied to the target Cloudflare D1 database before the new routes can work. The migration is checked into this branch only. It has NOT been run against any database.

## Required Cloudflare Worker bindings/secrets

Keep the existing binding and secret names unchanged:
- D1 binding: `DB`
- Secret: `OPENAI_API_KEY`
- Variable: `OPENAI_MODEL` (default `gpt-6-luna`; confirmed in the current OpenAI API model catalog)
- Secret: `PAYMONGO_SECRET_KEY`
- Secret: `PAYMONGO_WEBHOOK_SECRET`

Never commit secret values to GitHub or the frontend.

## Release sequence — not performed

1. Back up the live Worker source and D1 database.
2. Verify the current live D1 table schema against the queries in `worker.js`.
3. Apply the workspace migration to the intended D1 database.
4. Deploy this Worker source to a separate staging Worker first, with the same binding names and securely configured test credentials.
5. Test registration/login/logout, expired sessions, AI planning, trial/credits, PayMongo test checkout/webhook, per-account workspace isolation, invalid tokens, oversized requests, stale versions, and concurrent saves.
6. Test the frontend on Android and desktop browsers, including Excel/CSV upload and downloads, local backup/restore, account merge/load/save, logout/login, and network failure behavior.
7. Only after successful tests and explicit owner approval, schedule the production Worker/database/site release.

## Verification truth

The source and frontend scripts have been syntax-reviewed. The workflow was changed to use the runner's built-in Git and Node.js rather than third-party setup actions, to reduce repository action-policy dependencies. A successful GitHub Actions run is still required; previous PR runs ended in `startup_failure` with zero jobs. Therefore no automated test suite has been confirmed passing. The live Worker, D1 database, PayMongo settings, secrets, and GitHub Pages site have not been changed by this branch.
