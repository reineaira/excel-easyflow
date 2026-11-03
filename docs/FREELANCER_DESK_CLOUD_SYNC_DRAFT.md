# Freelancer Desk cloud-sync design (draft)

## Current state
The Freelancer Desk data in `index.html` is stored in browser localStorage. It is not currently synchronized to the user's EasyFlow account. The frontend already authenticates requests with a bearer session token, but the Worker source is not present in this repository branch, so no cloud-sync route can safely be implemented or verified yet.

## Proposed storage
The companion draft migration `migrations/0001_ef_user_workspace_v1.sql` creates one JSON workspace snapshot per authenticated user:
- `user_id`: authenticated account identifier; never accepted from client input as authority.
- `workspace_json`: validated JSON containing only `tasks`, `clients`, `products`, `orders`, and `transactions`.
- `version`: optimistic concurrency counter.
- `updated_at`: server-generated Unix timestamp.

No foreign key is declared because the exact v4.2.1 user-table primary-key declaration is not checked into this repository. Confirm it against the actual Worker/D1 schema before any production migration.

## Proposed API contract
- `GET /api/workspace`: require a valid bearer session; resolve the user ID from the session on the server; return that user's workspace and version, or an empty compatible workspace.
- `PUT /api/workspace`: require a valid bearer session; accept only the five documented arrays; enforce a strict request-size limit; validate object/field types and record counts; ignore/reject any client-supplied user ID; use a version check to prevent silent overwrites; write using the session-derived user ID and a server timestamp.
- Never expose another user's workspace by accepting a user ID in a URL or request body.
- Do not include passwords, session tokens, payment details, or secrets in workspace JSON or backups.

## Frontend sync behavior
1. Keep current local data intact as the recoverable source.
2. After login, fetch the authenticated account workspace.
3. If cloud is empty, offer a one-time upload of local data.
4. If both sides contain data, show a conflict/merge choice; never silently replace either copy.
5. Save with the returned version and show clear offline/error states.
6. Keep JSON export/import available as a user-controlled backup.

## Release gates
- Restore and review the exact deployed Worker v4.2.1 source before coding route handlers.
- Verify actual D1 schema and session-to-user lookup.
- Add tests for cross-account isolation, invalid tokens, oversized payloads, malformed JSON, legacy backups, stale versions, and concurrent writes.
- Run automated checks and browser/mobile tests.
- Apply the migration and deploy Worker only after explicit approval. This draft migration has NOT been applied to any database.
