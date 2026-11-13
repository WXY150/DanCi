# Research: Server Deployment and WeChat Mini Program Client

## Decision 1: WeChat login is exchanged on the server

- **Decision**: The mini program calls `wx.login()` and sends the one-time code
  to the server. The server calls WeChat `code2Session`, keeps `session_key`
  and AppSecret server-side, and returns a DanCi session token.
- **Rationale**: The code is short-lived and single-use; provider credentials
  and `session_key` must never enter the client package or response payload.
- **Alternatives considered**: Reusing the current username/password form would
  preserve H5 compatibility but would not provide the expected mini program
  identity flow. Returning `session_key` to the client is rejected because it
  expands the trust boundary.

## Decision 2: Single Linux server for the first production release

- **Decision**: Use one Linux server with Nginx TLS, the existing Node service,
  MySQL, and a persistent `generated/` image directory. Add health checks,
  logs, database/image backups, and a rollback script.
- **Rationale**: This is the smallest deployable topology that supports the
  current product and keeps image storage simple.
- **Alternatives considered**: Object storage and multiple service instances
  are deferred until scale or availability requirements justify the migration.

## Decision 3: Keep synchronous image generation for MVP

- **Decision**: Preserve the current administrator-only synchronous generation
  flow with a bounded long timeout and candidate/activation separation.
- **Rationale**: The current admin workflow already records candidates and does
  not replace active images automatically. A queue would add infrastructure
  before throughput or timeout evidence requires it.
- **Alternatives considered**: A background job table and worker are deferred;
  add them when generation timeouts, concurrent administrators, or server load
  make synchronous requests unreliable.

## Decision 4: Version the learner contracts while retaining H5 compatibility

- **Decision**: Add `/api/v1` contracts for mini program auth, content, progress,
  and admin image operations while keeping current unversioned H5 routes during
  migration.
- **Rationale**: The mini program needs stable DTOs and error codes, while the
  current H5 client should keep working until the replacement is accepted.
- **Alternatives considered**: Changing existing routes in place is smaller but
  creates a breaking migration and makes rollback harder.

## Decision 5: Use optimistic progress revisions

- **Decision**: Add a revision to saved progress. Writes include the base
  revision and return a conflict when a newer device state already exists.
- **Rationale**: The current whole-state JSON save can silently overwrite a
  newer device. A compare-and-swap revision is small and prevents data loss.
- **Alternatives considered**: Last-write-wins is simpler but unacceptable for
  cross-device study progress.

## Current-code findings

- `server/index.js` already owns authentication, content, progress, and
  administrator image routes.
- `server/image-generation.js` already reads AI keys only from server
  environment variables and writes generated candidates locally.
- `server/db.js` already has `users`, `sessions`, `words`, `user_progress`, and
  `word_images`; the main schema gap is progress revision/conflict handling.
- The H5 learning rules in `services/learning.js` can be reused by the mini
  program after extracting them from browser-only storage and DOM code.
- The current server exposes local `data/`, `services/`, `images/`, and
  `generated/` paths. Strict separation requires the mini program package to
  stop bundling word images and consume HTTPS image URLs from the service.
