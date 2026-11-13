<!--
Sync Impact Report
- Version change: template -> 1.0.0
- Modified principles: template placeholders -> five DanCi project principles
- Added sections: Product Boundaries; Development Workflow
- Removed sections: none
- Follow-up TODOs: WeChat authentication details remain an implementation decision in the feature plan.
-->

# DanCi Project Constitution

## Core Principles

### I. Explicit Client and Service Boundaries

The WeChat mini program is a learner client. The server is the authority for
authentication, learning content, progress synchronization, image generation,
image review, and persistence. The client MUST NOT contain AI provider keys or
invoke image-generation providers directly. Every feature change MUST identify
which boundary owns the behavior and the data crossing it.

### II. Server-Side AI and Content Trust

AI-generated images are candidates until an authorized administrator selects
them as the active image. User clients MAY read active images and approved word
content, but MUST NOT generate, upload, activate, or delete images. Server
endpoints MUST enforce authentication and role checks at the trust boundary and
MUST fail closed for missing or invalid credentials.

### III. Secure, Deployable Configuration

Secrets, WeChat credentials, AI keys, database passwords, session tokens, and
deployment credentials MUST stay in server-side environment or secret storage.
The mini program MUST use an HTTPS allowlisted service origin. Production
deployment MUST define persistent storage, TLS termination, backups, logging,
and a rollback path before release.

### IV. Testable Evidence and Honest Status

Every feature change MUST include executable checks for its success path and
main failure path. Contract checks MUST cover client-server boundaries. A
passing local test MUST NOT be reported as proof of WeChat real-device,
third-party AI, network deployment, or production acceptance; those require
separate evidence.

### V. Small, Replaceable, Reversible Design

The implementation MUST reuse the existing learning rules and data model where
they still satisfy the approved scope. New abstractions, queues, dependencies,
or services require a concrete acceptance need. AI, authentication, storage,
and image delivery providers MUST remain replaceable behind service contracts.
Deliberate shortcuts MUST document their ceiling and upgrade condition.

## Product Boundaries

- The learner surface is a WeChat mini program; the current H5 client is a
  migration and compatibility surface until the mini program is accepted.
- The server exposes read-only learner content and progress operations plus
  protected administrator operations for image generation and curation.
- A single-server deployment with persistent local image storage is acceptable
  for the first release; object storage and background jobs require a separate
  scale-driven decision.

## Development Workflow

1. Read the current code, product documents, constitution, and executable
   checks before changing behavior.
2. For each bounded feature, create or update Spec Kit artifacts in order:
   `$speckit-specify`, `$speckit-clarify` when needed, `$speckit-plan`,
   `$speckit-tasks`, `$speckit-analyze`, then `$speckit-implement`.
3. Keep user stories independently testable and map every implementation task
   to a spec requirement and a concrete file or contract.
4. Before reporting completion, run the relevant checks, review the diff, and
   state what still needs WeChat-device or production validation.

## Governance

This constitution governs DanCi development alongside repository instructions.
User instructions control immediate product scope; conflicts MUST be recorded
for later amendment. Amendments use `$speckit-constitution`, include a Sync
Impact Report, increment the semantic version, and describe migration impact.
Feature plans and final reviews MUST check compliance with these principles.
The user approves product scope changes, irreversible external actions, and
production releases.

**Version**: 1.0.0 | **Ratified**: 2026-11-13 | **Last Amended**: 2026-11-13
