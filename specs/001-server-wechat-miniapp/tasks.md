---
description: "Task list for the DanCi server and WeChat mini program migration"
---

# Tasks: Server Deployment and WeChat Mini Program Client

**Input**: Design documents from `/specs/001-server-wechat-miniapp/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/api-v1.md`, and `quickstart.md`

**Organization**: Tasks are grouped by user story. Every task names its target
file or directory so it can be assigned after the repository is created.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the target repository layout without changing product
behavior yet.

- [ ] T001 Create the target monorepo directories `server/`, `apps/miniapp/`, `apps/admin-web/`, `apps/legacy-h5/`, `packages/learning/`, `contracts/`, and `tests/contract/`.
- [ ] T002 [P] Move the current Node service files into `server/` while preserving `server/prompts/` and existing image-generation tests.
- [ ] T003 [P] Move the current administrator files into `apps/admin-web/` and update `server/index.js` static-file allowlisting.
- [ ] T004 [P] Copy the current H5 client into `apps/legacy-h5/` and keep its existing service boundary during migration.
- [ ] T005 [P] Add the native mini program skeleton in `apps/miniapp/app.js`, `apps/miniapp/app.json`, and `apps/miniapp/app.wxss`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish contracts, secrets, persistence, and shared validation
before either client is migrated.

- [ ] T006 Add the versioned API contract and error-code definitions in `contracts/api-v1.md`.
- [ ] T007 [P] Add server-only WeChat, AI, database, session, and public-origin configuration validation in `server/config.js` and `.env.example`.
- [ ] T008 [P] Add `/api/v1` routing, request IDs, unified errors, and trusted-origin handling in `server/index.js` and `server/http.js`.
- [ ] T009 Extend `server/db.js` migrations with WeChat identity fields and `user_progress.revision`, preserving existing H5 data.
- [ ] T010 [P] Add contract-test helpers and temporary MySQL test configuration in `tests/contract/helpers.js` and `tests/contract/.env.test.example`.
- [ ] T011 [P] Add deployment health, structured logging, backup, and rollback placeholders in `DEPLOYMENT.md`, `ops/backup.sh`, and `ops/rollback.sh`.

**Checkpoint**: The repository has a stable contract, server-only secret path,
compatible schema migration, and runnable contract-test harness.

---

## Phase 3: User Story 1 - Learner studies in the WeChat mini program (Priority: P1) 🎯 MVP

**Goal**: A learner can authenticate in WeChat, study using server content and
active images, save progress, and resume after leaving.

**Independent Test**: Run the learner contract checks, complete a 20-word round
in WeChat DevTools, reopen it, and verify progress and current round recovery.

### Tests for User Story 1

- [ ] T012 [P] [US1] Add contract tests for WeChat login, session expiry, active-only word DTOs, and learner access to image-admin routes in `tests/contract/learner-api.test.mjs`.
- [ ] T013 [P] [US1] Add progress conflict tests for stale `baseRevision` writes in `tests/contract/progress-conflict.test.mjs`.

### Implementation for User Story 1

- [ ] T014 [US1] Implement one-time WeChat code exchange and DanCi session creation in `server/auth.js` and `server/index.js`; never return `session_key` or AppSecret.
- [ ] T015 [US1] Implement `GET /api/v1/words` with version metadata and active-image-only DTO mapping in `server/content.js` and `server/index.js`.
- [ ] T016 [US1] Implement revision-aware `GET/PUT /api/v1/progress` with `409 progress_conflict` responses in `server/db.js` and `server/index.js`.
- [ ] T017 [P] [US1] Extract the existing learning rules into `packages/learning/learning.js` with browser-independent storage boundaries.
- [ ] T018 [P] [US1] Implement mini program authentication and API clients in `apps/miniapp/services/auth.js`, `apps/miniapp/services/api.js`, and `apps/miniapp/services/progress.js`.
- [ ] T019 [US1] Build mini program login, home, study, result, and profile pages in `apps/miniapp/pages/` using the existing active-recall flow.
- [ ] T020 [US1] Add loading, image-failure, expired-session, retry, and progress-conflict recovery states in `apps/miniapp/services/api.js` and `apps/miniapp/pages/`.
- [ ] T021 [US1] Run the mini program 20-word resume acceptance scenario and record evidence in `specs/001-server-wechat-miniapp/evidence/learner.md`.

**Checkpoint**: The mini program can replace the H5 learner surface for the
core study loop while the H5 client remains available for compatibility.

---

## Phase 4: User Story 2 - Administrator generates and curates images on the service (Priority: P1)

**Goal**: Administrators generate or upload candidates, review history, and
activate images; learners cannot perform any of those mutations.

**Independent Test**: Run the admin contract checks, complete candidate ->
activation, then repeat each mutation as a learner and verify rejection.

### Tests for User Story 2

- [ ] T022 [P] [US2] Add contract tests for candidate creation, upload validation, activation, deletion, role denial, and active-image-only learner responses in `tests/contract/admin-image-api.test.mjs`.
- [ ] T023 [P] [US2] Add image path, MIME, size, ownership, and candidate-state tests in `tests/contract/image-validation.test.mjs`.

### Implementation for User Story 2

- [ ] T024 [US2] Keep AI analysis and image generation server-only in `server/image-generation.js`; move provider settings behind `server/config.js`.
- [ ] T025 [US2] Expose versioned administrator image candidate, history, activation, and deletion routes in `server/index.js` while preserving current H5-compatible admin routes.
- [ ] T026 [US2] Enforce candidate-before-activation and expected image-version checks in `server/db.js` and `server/content.js`.
- [ ] T027 [US2] Update administrator UI calls and labels in `apps/admin-web/admin.js`, `apps/admin-web/admin.html`, and `apps/admin-web/admin.css` to use the versioned routes.
- [ ] T028 [US2] Remove all AI generation, upload, candidate selection, and image-history mutation code from `apps/miniapp/` and verify no provider URL or secret is bundled.
- [ ] T029 [US2] Record the administrator candidate and activation acceptance evidence in `specs/001-server-wechat-miniapp/evidence/admin-images.md`.

**Checkpoint**: Image generation and curation are a protected server/admin
capability, and the mini program is read-only with respect to images.

---

## Phase 5: User Story 3 - Operations deploy and maintain the service safely (Priority: P1)

**Goal**: Deploy the server behind HTTPS with persistent data, monitoring,
backups, and rollback; configure the mini program against the allowlisted origin.

**Independent Test**: Deploy to a clean test server, run smoke checks, restart,
restore a previous release, and verify progress and active images remain.

### Tests for User Story 3

- [ ] T030 [P] [US3] Add a release-package secret scan for `apps/miniapp/` and `apps/legacy-h5/` in `tests/contract/client-secret-scan.mjs`.
- [ ] T031 [P] [US3] Add HTTPS health, restart, persistence, and rollback smoke commands in `ops/smoke-test.ps1` and `ops/smoke-test.sh`.

### Implementation for User Story 3

- [ ] T032 [US3] Document Linux server provisioning, Nginx TLS, process management, firewall rules, WeChat legal domains, and server-only secrets in `DEPLOYMENT.md`.
- [ ] T033 [US3] Configure persistent `generated/` storage, MySQL backups, image backups, retention, and restore steps in `ops/backup.sh` and `DEPLOYMENT.md`.
- [ ] T034 [US3] Add health/readiness checks that fail when required database or image storage is unavailable in `server/index.js`.
- [ ] T035 [US3] Add mini program environment configuration for the HTTPS service origin in `apps/miniapp/config/production.js` and release instructions in `apps/miniapp/README.md`.
- [ ] T036 [US3] Run deployment smoke checks and record evidence in `specs/001-server-wechat-miniapp/evidence/deployment.md`.

**Checkpoint**: A clean test server can be deployed, restarted, and rolled
back without losing verified user progress or active image references.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Close migration gaps and prepare the new repository for review.

- [ ] T037 [P] Update `README.md`, `QUICK_START.md`, and `docs/requirements.md` to describe server, mini program, admin, H5 compatibility, and image ownership boundaries.
- [ ] T038 [P] Add API contract links and migration notes to `contracts/api-v1.md` and `apps/legacy-h5/README.md`.
- [ ] T039 Run `npm run check`, `npm test`, all contract checks, and `quickstart.md`; record results in `specs/001-server-wechat-miniapp/evidence/validation.md`.
- [ ] T040 Review the final repository diff and run `$speckit-analyze`; append any remaining gaps to this task list before implementation is considered complete.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; required after the repository is created.
- **Foundational (Phase 2)**: Depends on Setup and blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on the contracts, schema, and test harness from Phase 2.
- **User Story 2 (Phase 4)**: Depends on Phase 2; can proceed in parallel with US1 after shared routing and schema are ready.
- **User Story 3 (Phase 5)**: Depends on the server API from US1/US2; deployment docs can begin in parallel with client work.
- **Polish (Phase 6)**: Depends on all release stories and their evidence.

### User Story Dependencies

- **US1**: No dependency on US2 client behavior; it needs the foundational auth/content/progress contracts.
- **US2**: No dependency on mini program UI; it needs the foundational auth, image schema, and role checks.
- **US3**: Depends on the server endpoints that it deploys, but can prepare infrastructure in parallel.

### Parallel Opportunities

- T002-T005 can run in parallel after the repository is created.
- T007-T011 can run in parallel once the target layout exists.
- T012-T013, T017-T018, T022-T023, and T030-T031 are independent checks/files.
- US1 and US2 can be assigned to separate agents after Phase 2; US3 deployment documentation can proceed alongside them.

## Implementation Strategy

### MVP First

1. Complete Setup and Foundational phases.
2. Complete US1 learner authentication/content/progress and validate the mini program study loop.
3. Complete the minimum US2 server image boundary needed to supply active images.
4. Stop and validate before moving to production deployment.

### Incremental Delivery

1. Keep the H5 client working while `/api/v1` contracts are introduced.
2. Release the mini program learner flow against read-only active images.
3. Move administrator image operations to versioned server routes.
4. Deploy the server to a test host, then run real-device and rollback checks.
5. Retire or archive H5 only after mini program acceptance.

## Notes

- `[P]` tasks touch different files and have no incomplete dependency.
- The first release deliberately does not add an image-job queue or object-storage dependency.
- WeChat real-device, third-party AI, and production deployment results are separate evidence classes.
