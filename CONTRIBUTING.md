# Contributing to DanCi

## Development flow

1. Create a short-lived branch from `main`.
2. Read the relevant Spec Kit artifact under `specs/` before changing behavior.
3. Run `npm run check` and `npm test` before opening a pull request.
4. Keep secrets out of the repository; use `.env` locally and update `.env.example` only with placeholders.
5. Explain user-visible changes, validation results, and any deployment or WeChat-device checks still pending.

For a new bounded feature, use the Spec Kit order:

```text
$speckit-specify -> $speckit-clarify (if needed) -> $speckit-plan
-> $speckit-tasks -> $speckit-analyze -> $speckit-implement
```

The current migration plan is in `specs/001-server-wechat-miniapp/`.

## Where to put changes

- Learner H5 compatibility code: `apps/user-h5/`
- Shared login/register entry: `apps/auth-web/`
- Administrator Web code: `apps/admin-web/`
- WeChat mini program code: `apps/miniapp/`
- API, authentication, database, AI generation, and deployment runtime: `server/`
- Product/design documentation: `docs/` and `specs/`
- Checks and maintenance scripts: `tests/`, `tools/`, and `ops/`
