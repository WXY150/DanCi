# Data Model: Server Deployment and WeChat Mini Program Client

## LearnerAccount

- `id`: internal stable identifier
- `openid`: server-side WeChat identity, unique and never returned as a credential
- `username`: optional display name for compatibility/admin views
- `role`: `user` or `admin`
- `createdAt`, `lastLoginAt`

Relationships: one account owns many sessions and one current learning-progress
record.

## Session

- `token`: opaque server-managed session token
- `accountId`
- `expiresAt`, `createdAt`

Rules: session tokens are random, expire, are revocable, and are accepted only
over HTTPS. WeChat `code` and `session_key` are not persisted in the mini program.

## Word

- `id`, `word`, `phonetic`, `partOfSpeech`, `meaning`, `mnemonic`
- `imageUrl`: active approved image only
- `imageVersion`
- `source`, `createdAt`, `updatedAt`

Relationships: one word has zero or more image candidates/history records.

## ImageCandidate

- `id`, `wordId`, `imageUrl`
- `source`: AI or administrator upload
- `isActive`
- `createdAt`

State transitions: `candidate -> active` on administrator activation; active
records may become inactive when another image is activated; inactive records
may be deleted after ownership and path validation.

## LearningProgress

- `accountId`
- `stateJson`: current round, queue, answer state, review state, mistakes,
  streaks, and settings
- `revision`: monotonically increasing compare-and-swap revision
- `updatedAt`

Rules: a write must include `baseRevision`; a stale revision returns a conflict
with the server state and revision so the client can refetch/merge.

## DeploymentConfiguration

- server-only: WeChat AppID/AppSecret, AI keys, DB credentials, session secret
- public: HTTPS API origin and image origin
- operational: persistent image directory, backup destination, health endpoint,
  log destination, rollback release identifier

Rules: only the public origin may appear in the mini program package.
