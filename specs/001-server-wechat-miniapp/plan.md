# Implementation Plan: Server Deployment and WeChat Mini Program Client

**Branch**: `001-server-wechat-miniapp` | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-server-wechat-miniapp/spec.md`

**Note**: This template is filled in by the `$speckit-plan` command; its definition describes the execution workflow.

## Summary

Move learner delivery to a native WeChat mini program while keeping the server
as the authority for accounts, words, active images, progress, and administrator
image curation. Preserve the current H5 client during migration. Reuse the
existing learning rules and MySQL entities, add a WeChat login adapter and
versioned learner contracts, and keep AI keys and image generation entirely on
the server.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Node.js 20 LTS for production (current local runtime is Node.js 22.20.0); native WeChat mini program JavaScript/WXML/WXSS

**Primary Dependencies**: Existing `mysql2`; WeChat `wx.login`/server `code2Session`; existing OpenAI-compatible Responses and Images APIs; Nginx TLS and a process manager

**Storage**: MySQL for accounts, words, sessions, progress, and image history; persistent server `generated/` directory for the first deployment

**Testing**: Existing `npm run check` and `npm test`; new HTTP contract checks; WeChat DevTools and real-device acceptance checks

**Target Platform**: Linux server behind Nginx HTTPS plus WeChat mini program; H5 remains a temporary compatibility client

**Project Type**: Monorepo with API service, native mini program, administrator web client, and temporary H5 client

**Performance Goals**: 95% of normal content and progress requests complete within 1 second under the agreed test load; administrator image generation may use a longer bounded timeout

**Constraints**: HTTPS and WeChat legal-domain allowlist; no provider or database secrets in the mini program; learner roles cannot mutate image candidates; H5 routes remain compatible during migration

**Scale/Scope**: First release targets one Linux server, one MySQL instance, persistent local image storage, the existing 114-image demo set, and the current learning loop

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Evidence / guard |
|---|---|---|
| Client/service boundary | PASS | Mini program receives active content only; generation and curation remain under protected server routes. |
| Secret handling | PASS | WeChat AppSecret, AI keys, DB credentials, and session secrets stay server-side. |
| Testable evidence | PASS WITH FOLLOW-UP | Existing checks pass; plan adds contract, deployment, and real-device checks. |
| Simplicity and replaceability | PASS | Reuse current learning rules and tables; no job queue or object storage in MVP. |
| Production safety | PASS WITH FOLLOW-UP | HTTPS, persistence, backups, logs, health checks, and rollback are required before release. |

## Project Structure

### Documentation (this feature)

```text
specs/001-server-wechat-miniapp/
├── plan.md              # This file ($speckit-plan command output)
├── research.md          # Phase 0 output ($speckit-plan command)
├── data-model.md        # Phase 1 output ($speckit-plan command)
├── quickstart.md        # Phase 1 output ($speckit-plan command)
├── contracts/           # Phase 1 output ($speckit-plan command)
└── tasks.md             # Phase 2 output ($speckit-tasks command - NOT created by $speckit-plan)
```

### Source Code (target repository root)

```text
server/
├── index.js                 # API and static image delivery
├── auth.js                  # WeChat login adapter and admin login
├── db.js                    # MySQL schema and persistence
├── image-generation.js      # server-only AI analysis and image generation
├── prompts/
└── tests/contract/

apps/miniapp/
├── app.js / app.json / app.wxss
├── pages/
│   ├── login/
│   ├── home/
│   ├── study/
│   ├── result/
│   └── profile/
└── services/

apps/admin-web/
├── admin.html
├── admin.js
└── admin.css

apps/user-h5/                # temporary H5 migration surface and local compatibility data
packages/learning/           # migrated/reused learning rules
contracts/api-v1.md
tests/contract/
specs/001-server-wechat-miniapp/
```

**Structure Decision**: Use one repository with three deployable surfaces. The
server owns all secrets, data access, AI generation, and image storage. The
mini program is a learner-only client. The admin web client remains protected
and can be deployed with the server or separately. H5 compatibility files,
services, and local demo content live under `apps/user-h5`; the server maps the
legacy root URLs to that directory.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | The target structure keeps the existing service and adds only the two client surfaces required by the product boundary. |
