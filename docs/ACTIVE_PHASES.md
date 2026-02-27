# Active Phases

This file is the current phase registry for delivery status.

## RC-1: Usability + Production Hardening

- Status: `Completed`
- Scope: `REQ-RC-001` through `REQ-RC-011`
- Notes: Closed and mirrored; retained for history.

## RC-2: Readiness Follow-on

- Status: `Completed`
- Scope: `REQ-RC-012` through `REQ-RC-015`
- Notes: Closed and mirrored; retained for history.

## EVE-2: Agents + Auditor + Analyst

- Status: `Active queued (mirrored)`
- Scope: `REQ-EVE2-001` through `REQ-EVE2-011`
- Current truth:
  1. Requirements exist in local matrix/snapshot.
  2. Linear/GitHub mirror sync and verify are currently passing.
  3. Local dirty-tree contains Eve 2.0 WIP and must be treated as draft implementation until merged.

### Queue Refresh Protocol (EVE-2 mirrored queue maintenance)

1. `pnpm backlog:seed`
2. `pnpm backlog:sync`
3. `pnpm backlog:verify`
4. `pnpm backlog:matrix:check`
5. `pnpm backlog:snapshot`
6. `pnpm backlog:handoff:refresh`
7. `pnpm backlog:handoff:check`
8. Only then assign new cloud lanes from Eve 2.0 requirements.
