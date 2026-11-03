# Freelancer Desk cloud-sync design (draft)

## Development-branch implementation
The Freelancer Desk keeps its local device copy and now includes explicit Save, Load, and Merge actions for a separate account copy. The development-branch `worker.js` implements authenticated `GET /api/workspace` and `PUT /api/workspace` routes. Workspace access requires a valid session but does not require an active paid plan, so users can retrieve their own records after trial or plan expiry. This is development code only; the live Worker and D1 database have not been changed.

## Proposed storage
The companion draft migration `migrations/0001_ef_user_workspace_v1.sql` creates one JSON workspace snapshot per authenticated user:
- `user_id`: authenticated account identifier; never accepted from client input as authority.
- `workspace_json`: validated JSON containing only `tasks`, `clients`, `products`, `orders`, and `transactions`.
- `version`: optimistic concurrency counter.
- `updated_at`: server-generated Unix timestamp.

No foreign key is declared because the exact v4.2.1 user-table primary-key declaration is not checked into this repository. Confirm it against the actual Worker/D1 schema before any production migration.

## API contract
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
- Confirm the live D1 schema and session-to-user lookup match the source before applying the migration.
- Test cross-account isolation, invalid/expired tokens, oversized payloads, malformed JSON, legacy backups, stale versions, and concurrent writes.
- Run automated checks and browser/mobile tests; the current branch syntax checks are not a substitute for live D1 integration tests.
- Apply the migration and deploy Worker only after explicit approval. The migration has NOT been applied to any database.
