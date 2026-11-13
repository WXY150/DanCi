# Quickstart Validation: Server Deployment and WeChat Mini Program Client

This guide is for the first repository implementation. It deliberately
separates local contract checks from WeChat real-device and production checks.

## Local prerequisites

- Node.js 20 LTS or newer
- MySQL 8.x
- A test WeChat AppID/AppSecret for login acceptance
- Test AI text/image credentials for administrator generation checks
- WeChat DevTools for mini program checks

## Local service checks

1. Copy `.env.example` to `.env` and set test-only database, WeChat, session,
   and AI values. Never commit `.env`.
2. Start the service with `npm start`.
3. Run `npm run check` and `npm test`.
4. Verify `GET /api/health` reports the database and image-generation state.
5. Verify `GET /api/v1/words` returns only active image URLs.
6. Attempt learner access to each administrator image route and verify `401` or
   `403` with no database or filesystem mutation.
7. Run the administrator candidate -> activation flow and verify that the
   learner content response changes only after activation.
8. Submit two progress writes with the same `baseRevision`; verify the first
   succeeds and the second returns `409 progress_conflict`.

## Mini program checks

1. Configure the HTTPS API origin in the mini program and add it to the WeChat
   legal request and download domains.
2. Use `wx.login()` to obtain a code and verify server-side session creation.
3. Complete a 20-word round, close the mini program, reopen it, and verify the
   current round and progress resume.
4. Disable or fail an image request and verify text-based study remains usable.
5. Inspect the built package for AI keys, database credentials, and direct AI
   provider URLs; the expected count is zero.

## Deployment checks

1. Provision a clean Linux host with Nginx, Node.js, MySQL, persistent image
   storage, and a backup destination.
2. Deploy the service, enable HTTPS, and restrict the Node port to localhost.
3. Run health, login, content, progress, and admin image checks through HTTPS.
4. Restart the service and verify users, progress, and active images remain.
5. Restore the documented previous release and verify the same data remains.
6. Record the deployment evidence separately from local tests and WeChat
   device acceptance.
