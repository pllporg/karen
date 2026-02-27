# LIC Legal Suite Session Handoff

This is the active handoff surface for new chats.

Canonical operations source: `docs/OPERATIONS_PLAYBOOK.md`.
Historical detail: `docs/SESSION_HISTORY_ARCHIVE.md`.

## Snapshot Metadata

- Snapshot File: `tools/backlog-sync/session.snapshot.json`
- Snapshot Timestamp: `2026-02-27T15:27:34.972Z`
- Snapshot Schema Version: `1.1.0`
- Last Successful Mirror Verify: `2026-02-27T14:24:26.272Z`

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

## Short Delta Log

- 2026-02-27: Reorganized operations docs to canonicalize execution rules into `docs/OPERATIONS_PLAYBOOK.md`; moved historical long-form handoff log into `docs/SESSION_HISTORY_ARCHIVE.md`; added active phase registry (`docs/ACTIVE_PHASES.md`) and preflight/housekeeping guardrail protocol.
- 2026-02-27: Restored valid Linear auth and completed queue promotion for EVE-2 (`backlog:seed`, `backlog:sync`, `backlog:verify`, `backlog:snapshot`, and `backlog:handoff:check` passing); switched phase state from draft-local to mirrored queue mode.
- 2026-02-27: EVE-2 queue introduced as draft-local scope (`REQ-EVE2-001`..`REQ-EVE2-011`) with explicit promotion protocol and auth-blocker visibility.
- 2026-02-26: Completed RC-2 (`REQ-RC-012`..`REQ-RC-015`) and refreshed mirror/snapshot state.
