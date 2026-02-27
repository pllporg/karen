# LIC Legal Suite Session Handoff

This is the active handoff surface for new chats.

Canonical operations source: `docs/OPERATIONS_PLAYBOOK.md`.
Historical detail: `docs/SESSION_HISTORY_ARCHIVE.md`.

## Snapshot Metadata

- Snapshot File: `tools/backlog-sync/session.snapshot.json`
- Snapshot Timestamp: `2026-02-27T16:28:25.638Z`
- Snapshot Schema Version: `1.1.0`
- Last Successful Mirror Verify: `2026-02-27T16:28:22.289Z`

## Current Operational Status

- Branch baseline: `main`
- Backlog model: Linear canonical, GitHub mirror-only
- Active phase registry: `docs/ACTIVE_PHASES.md`
- Current queued phase: `EVE-2` in mirrored queue mode

EVE-2 queue conditions:
1. `REQ-EVE2-001`..`REQ-EVE2-011` exist in local matrix/snapshot.
2. Linear-backed commands are currently healthy in this workspace (`backlog:verify` passing).
3. Dirty local Eve 2.0 WIP must not be treated as merged implementation until PR merge completes.

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

Only after this sequence succeeds should EVE-2 lanes be assigned in Codex Cloud.

## Open Operational Conflicts

1. Local Eve 2.0 feature implementation is still in mixed WIP across branches and requires strict branch/file-owner isolation.
2. Release smoke runner still has one deterministic failure (`POST /portal/messages` returns 403 when run as admin user); remaining smoke steps pass.

## Short Delta Log

- 2026-02-27: Cleaned local repo clutter by removing patch-equivalent stale branches and stale remote `origin/codex/*` branches; preserved unique/WIP branches and one WIP stash (`wip/unscoped-followups-after-kar89`), with stash patch backups written under `artifacts/git-stash-backups/`.
- 2026-02-27: Queued next Cloud wave packet for EVE-2 and UI/Ops parallel lanes in `docs/codex-cloud/eve2-wave-20260227.packet.md` (KAR-106, KAR-109, KAR-111, KAR-102).
- 2026-02-27: Re-ran release smoke with Docker services up (`artifacts/ops/release-smoke-summary-20260227-docker.json`): 5/6 steps passed; failing step is `portal_message` because smoke runs under admin role and portal endpoint enforces client-only access.
- 2026-02-27: Ran release smoke command (`node tools/ops/run_release_smoke.mjs --wait-ms 3000 --out artifacts/ops/release-smoke-summary-20260227.json`); run failed at API health check because local runtime dependencies are down.
- 2026-02-27: Reorganized operations docs to canonicalize execution rules into `docs/OPERATIONS_PLAYBOOK.md`; moved historical long-form handoff log into `docs/SESSION_HISTORY_ARCHIVE.md`; added active phase registry (`docs/ACTIVE_PHASES.md`) and preflight/housekeeping guardrail protocol.
- 2026-02-27: Restored valid Linear auth and completed queue promotion for EVE-2 (`backlog:seed`, `backlog:sync`, `backlog:verify`, `backlog:snapshot`, and `backlog:handoff:check` passing); switched phase state from draft-local to mirrored queue mode.
- 2026-02-27: EVE-2 queue introduced as draft-local scope (`REQ-EVE2-001`..`REQ-EVE2-011`) with explicit promotion protocol and auth-blocker visibility.
- 2026-02-26: Completed RC-2 (`REQ-RC-012`..`REQ-RC-015`) and refreshed mirror/snapshot state.
