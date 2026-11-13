# Feature Specification: Server Deployment and WeChat Mini Program Client

**Feature Branch**: `001-server-wechat-miniapp`

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "将 DanCi 调整为服务端和用户端，服务端部署到服务器，用户端使用微信小程序，AI 生图统一放到服务端；仓库创建后再迁入 Spec Kit  artifacts。"

## User Scenarios & Testing

### User Story 1 - Learner studies in the WeChat mini program (Priority: P1)

As a learner, I can sign in through the WeChat mini program, receive the current
word content and approved images from the service, complete a study round, and
resume my progress on a later visit.

**Why this priority**: The learner study loop is the product's primary value and
must work before migration or administration improvements matter.

**Independent Test**: Use a test mini program account against a test service to
authenticate, study a 20-word round, close and reopen the mini program, and
confirm that the next card and progress are restored.

**Acceptance Scenarios**:

1. **Given** a valid mini program account, **When** the learner opens the study
   page, **Then** the service returns word content and only the currently
   approved image for each word.
2. **Given** a learner has answered part of a round, **When** the learner leaves
   and returns, **Then** the current round, answer state, and long-term progress
   resume without resetting completed work.
3. **Given** the service or an image is temporarily unavailable, **When** the
   learner continues studying, **Then** the mini program shows a recoverable
   error and keeps text-based learning available.

### User Story 2 - Administrator generates and curates images on the service (Priority: P1)

As an administrator, I can generate, upload, review, activate, and remove word
images from the protected administration surface; learners only receive active
images after approval.

**Why this priority**: AI image generation is the highest-risk and most
valuable capability, and keeping it server-side protects credentials and makes
content quality controllable.

**Independent Test**: As an administrator, create an image candidate, inspect
its history, activate it, and confirm that a learner request returns the new
active image. Repeat the same calls as a learner and confirm they are rejected.

**Acceptance Scenarios**:

1. **Given** an administrator session, **When** the administrator requests a
   generated image, **Then** the service stores it as a candidate without
   replacing the active image automatically.
2. **Given** one or more candidates, **When** the administrator activates one,
   **Then** new learner content responses return that image and the previous
   image remains available in history unless explicitly removed.
3. **Given** a learner or unauthenticated request, **When** it attempts to
   generate, upload, activate, or delete an image, **Then** the service rejects
   the request and the active image remains unchanged.

### User Story 3 - Operations deploy and maintain the service safely (Priority: P1)

As an operator, I can deploy the service with server-only secrets, HTTPS, a
persistent database and image directory, health checks, logs, backups, and a
rollback procedure, while the mini program points to an allowlisted service
origin.

**Why this priority**: The product cannot be accepted if the learner client and
AI service only work on a development machine.

**Independent Test**: Provision a clean test server from the deployment guide,
start the service, run health and authentication checks, restart it, and verify
that users, progress, and active images remain available.

**Acceptance Scenarios**:

1. **Given** a clean server and documented configuration, **When** the operator
   deploys the service, **Then** the service starts behind HTTPS and reports a
   healthy database and content state.
2. **Given** a service restart or application rollback, **When** the operator
   restores the previous release, **Then** persistent user progress and active
   images remain intact.
3. **Given** a built mini program package, **When** it is inspected before
   release, **Then** it contains no AI provider key, database credential, or
   direct provider endpoint.

## Edge Cases

- An expired or already-used WeChat login code is rejected without creating a
  second account or session.
- AI analysis or image generation times out or returns invalid output; the
  active image remains unchanged and the administrator receives a retryable
  error.
- An image candidate is missing, corrupted, or no longer reachable; the
  learner sees the text content and a recoverable image error.
- Two administrators activate different candidates for the same word; the
  service records one final active image and retains an auditable history.
- A learner submits progress after a stale session or network retry; the
  service prevents silent loss of newer progress and returns a recoverable
  conflict.
- Database or persistent image storage is unavailable during deployment; the
  release fails health checks and does not claim readiness.

## Requirements

### Functional Requirements

- **FR-001**: The service MUST authenticate WeChat mini program users and issue
  a server-managed session without exposing provider credentials to the client.
- **FR-002**: The learner client MUST retrieve word content, current approved
  image URLs, and learning progress through the service boundary.
- **FR-003**: The service MUST preserve the existing active-recall learning
  rules, including wrong-word requeueing and three consecutive correct answers
  for relearning words.
- **FR-004**: The service MUST persist learner progress so that a later visit
  can resume the current round and long-term review state.
- **FR-005**: The service MUST expose image generation, upload, activation,
  history, and deletion only to authenticated administrators.
- **FR-006**: A newly generated or uploaded image MUST remain a candidate until
  an administrator activates it.
- **FR-007**: Learner-facing content MUST return only the active image for a
  word and MUST NOT expose an image-generation operation.
- **FR-008**: The service MUST validate image type, size, path, ownership, and
  word association before storing or activating an image.
- **FR-009**: The deployment MUST keep AI keys, WeChat credentials, database
  credentials, and session secrets on the service side.
- **FR-010**: The deployment MUST provide HTTPS, an allowlisted service origin,
  health checks, structured operational logs, persistent storage, backups, and a
  documented rollback procedure.
- **FR-011**: The existing H5 client MAY remain as a migration and compatibility
  surface, but it MUST follow the same service-side image-generation boundary.
- **FR-012**: The project MUST define versioned client-service contracts for
  authentication, content, progress, and administrator image operations before
  the mini program is released.

### Key Entities

- **Learner Account**: A WeChat identity mapped to a service account and its
  session state.
- **Word**: A word, pronunciation, meaning, mnemonic, category, and current
  approved image reference.
- **Image Candidate**: A generated or uploaded image linked to a word, with
  source, review state, timestamps, and activation history.
- **Learning Progress**: The learner's current round, answer history, review
  schedule, mistakes, streaks, and settings.
- **Deployment Configuration**: Server-only credentials, public service origin,
  storage locations, runtime settings, and backup/rollback metadata.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of release mini program packages contain no AI provider key,
  database credential, or direct AI provider request.
- **SC-002**: 100% of learner attempts to generate, upload, activate, or delete
  images are rejected without administrator authorization.
- **SC-003**: At least 95% of normal learner content and progress requests
  complete within 1 second under the agreed test load.
- **SC-004**: At least 95% of test learners can complete and resume a 20-word
  study round without losing completed answers.
- **SC-005**: 100% of administrator image candidates remain non-active until an
  explicit activation, and every activation is visible in image history.
- **SC-006**: A clean test server can be deployed and health-checked from the
  documented procedure in 30 minutes or less by a developer familiar with the
  project.
- **SC-007**: A restart and one documented rollback preserve all verified user
  progress and active image references.

## Assumptions

- The first production deployment uses one server instance with persistent disk;
  object storage and background job workers are deferred until scale requires
  them.
- WeChat app credentials and an approved HTTPS domain will be available before
  mini program release.
- The current Node.js/MySQL learning rules and word/image tables are the
  migration baseline unless a plan task explicitly changes them.
- The current H5 client is retained during migration so the server API can be
  validated before the mini program replaces it for daily users.
- The first release uses native WeChat mini program pages with the smallest
  dependency footprint that supports the existing study flow.
