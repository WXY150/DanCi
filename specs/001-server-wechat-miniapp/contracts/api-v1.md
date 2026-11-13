# API Contract v1

All responses use JSON. Protected calls require the DanCi session token. Errors
use `{ "error": { "code": "...", "message": "..." } }`; compatibility H5
routes may continue returning the current `{ "error": "..." }` shape until the
H5 migration ends.

## Learner API

### `POST /api/v1/auth/wechat-login`

Request:

```json
{ "code": "one-time-wx-login-code" }
```

Response `200`:

```json
{ "token": "opaque-session-token", "expiresAt": "2026-11-20T00:00:00Z", "user": { "id": 1, "role": "user" } }
```

The server exchanges the code with WeChat. `AppSecret` and `session_key` never
appear in the response.

### `POST /api/v1/auth/logout`

Revokes the current session. Returns `204` or `{ "success": true }`.

### `GET /api/v1/auth/me`

Returns the authenticated learner identity. Missing/expired sessions return
`401 unauthorized`.

### `GET /api/v1/words?version=<optional>`

Response `200`:

```json
{
  "version": "2026-11-13",
  "words": [{
    "id": 200001,
    "word": "conservative",
    "phonetic": "...",
    "partOfSpeech": "adj.",
    "meaning": "...",
    "mnemonic": "...",
    "imageUrl": "https://api.example.com/generated/conservative-123.png",
    "imageVersion": 2
  }]
}
```

Only the active image URL is returned. Candidate/history data and generation
operations are excluded.

### `GET /api/v1/progress`

Returns `{ "state": {}, "revision": 4, "updatedAt": "..." }`.

### `PUT /api/v1/progress`

Request `{ "state": {}, "baseRevision": 4, "clientMutationId": "uuid" }`.
Successful writes return the new revision. A stale base revision returns `409`
with `error.code = "progress_conflict"`, the current server state, and the
current server revision.

## Administrator image API

All routes require an administrator session.

- `POST /api/v1/admin/words/:id/image-candidates` creates an AI candidate.
- `POST /api/v1/admin/words/:id/image-uploads` stores an uploaded candidate.
- `GET /api/v1/admin/words/:id/images` lists active and inactive history.
- `POST /api/v1/admin/words/:id/images/:imageId/activate` activates one candidate.
- `DELETE /api/v1/admin/words/:id/images/:imageId` deletes an inactive candidate.

Learner or unauthenticated calls to these routes return `401` or `403` and do
not mutate the word or image history.

## Compatibility

The current unversioned H5 routes remain temporarily available. They must call
the same server-side services and must never expose AI provider credentials or
learner access to administrator image operations.
