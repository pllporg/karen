# LIC Legal Suite Session Handoff

This is the active handoff surface for new chats.

Canonical operations source: `docs/OPERATIONS_PLAYBOOK.md`.
Historical detail: `docs/SESSION_HISTORY_ARCHIVE.md`.

## Snapshot Metadata

- Snapshot File: `tools/backlog-sync/session.snapshot.json`
- Snapshot Timestamp: `2026-03-10T15:14:48.352Z`
- Snapshot Schema Version: `1.1.0`
- Last Successful Mirror Verify: `2026-03-10T15:14:44.847Z`

## Current Operational Status

- Branch baseline: `main`
- Backlog model: Linear canonical, GitHub mirror-only
- Active phase registry: `docs/ACTIVE_PHASES.md`
- Current queued phase: `FRONTEND-REFACTOR` with review branches prepared

Queue conditions:
1. `REQ-EVE2-001`..`REQ-EVE2-011` remain in the matrix, but reconciliation confirmed the previously open EVE-2 slices were already implemented and test-covered.
2. Linear-backed commands are currently healthy in this workspace (`backlog:verify` passing before timestamp drift only).
3. Active frontend-refactor work is isolated to dedicated branches and no longer needs to live as dirty `main` state.

## New Chat Bootstrap

Run:

```bash
pnpm ops:preflight
```

Then follow `docs/OPERATIONS_PLAYBOOK.md`.

## Promotion Protocol (EVE-2)

Use exactly:

```bash
pnpm backlog:seed
pnpm backlog:sync
pnpm backlog:verify
pnpm backlog:matrix:check
pnpm backlog:snapshot
pnpm backlog:handoff:refresh
pnpm backlog:handoff:check
```

Only after this sequence succeeds should EVE-2 issue runs be assigned in Symphony.

## Open Operational Conflicts

1. Frontend refactor review branches are local until pushed/opened (`lin/KAR-119-prd-01-02-foundation`, `lin/KAR-122-prd-05-page-overhaul`).
2. Release smoke runner still has one deterministic failure (`POST /portal/messages` returns 403 when run as admin user); remaining smoke steps pass.

## Short Delta Log

- 2026-02-27: Cleaned local repo clutter by removing patch-equivalent stale branches and stale remote `origin/codex/*` branches; preserved unique/WIP branches and one WIP stash (`wip/unscoped-followups-after-kar89`), with stash patch backups written under `artifacts/git-stash-backups/`.
- 2026-03-06: Reconciled stale EVE-2 backlog state against implemented/tested code for `REQ-EVE2-004`, `REQ-EVE2-006`, and `REQ-EVE2-008`; matrix and Linear completion state refreshed as part of housekeeping.
- 2026-03-06: Normalized frontend refactor WIP off `main` into dedicated branches: preservation checkpoint on `lin/KAR-118-frontend-refactor-preservation`, foundation/data-layer split on `lin/KAR-119-prd-01-02-foundation`, and page-overhaul split on `lin/KAR-122-prd-05-page-overhaul`.
- 2026-02-27: Queued next Cloud wave packet for EVE-2 and UI/Ops parallel lanes in `docs/codex-cloud/eve2-wave-20260227.packet.md` (KAR-106, KAR-109, KAR-111, KAR-102).
- 2026-02-27: Re-ran release smoke with Docker services up (`artifacts/ops/release-smoke-summary-20260227-docker.json`): 5/6 steps passed; failing step is `portal_message` because smoke runs under admin role and portal endpoint enforces client-only access.
- 2026-02-27: Ran release smoke command (`node tools/ops/run_release_smoke.mjs --wait-ms 3000 --out artifacts/ops/release-smoke-summary-20260227.json`); run failed at API health check because local runtime dependencies are down.
- 2026-02-27: Reorganized operations docs to canonicalize execution rules into `docs/OPERATIONS_PLAYBOOK.md`; moved historical long-form handoff log into `docs/SESSION_HISTORY_ARCHIVE.md`; added active phase registry (`docs/ACTIVE_PHASES.md`) and preflight/housekeeping guardrail protocol.
- 2026-02-27: Restored valid Linear auth and completed queue promotion for EVE-2 (`backlog:seed`, `backlog:sync`, `backlog:verify`, `backlog:snapshot`, and `backlog:handoff:check` passing); switched phase state from draft-local to mirrored queue mode.
- 2026-02-27: EVE-2 queue introduced as draft-local scope (`REQ-EVE2-001`..`REQ-EVE2-011`) with explicit promotion protocol and auth-blocker visibility.
- 2026-02-26: Completed RC-2 (`REQ-RC-012`..`REQ-RC-015`) and refreshed mirror/snapshot state.
- 2026-03-09: Switched operations model from Codex Cloud lane packets to Symphony-first orchestration; added repo `WORKFLOW.md`, Symphony adoption guide, and updated canonical operations docs/templates.
