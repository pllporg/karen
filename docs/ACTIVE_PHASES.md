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

- Status: `Completed`
- Scope: `REQ-EVE2-001` through `REQ-EVE2-011`
- Current truth:
  1. Requirements exist in local matrix/snapshot.
  2. Reconciliation confirmed `REQ-EVE2-004`, `REQ-EVE2-006`, and `REQ-EVE2-008` were already implemented and test-covered.
  3. Linear/GitHub mirror state should reflect completion after housekeeping sync.

### Queue Refresh Protocol (EVE-2 mirrored queue maintenance)

1. `pnpm backlog:seed`
2. `pnpm backlog:sync`
3. `pnpm backlog:verify`
4. `pnpm backlog:matrix:check`
5. `pnpm backlog:snapshot`
6. `pnpm backlog:handoff:refresh`
7. `pnpm backlog:handoff:check`
8. Only then assign new Symphony issue runs from EVE-2 requirements.

## FRONTEND-REFACTOR: PRD Delivery Program

- Status: `Active`
- Scope: `KAR-118`, `KAR-119` through `KAR-124`, plus `KAR-117`
- Current truth:
  1. Dirty-tree refactor work was preserved on `lin/KAR-118-frontend-refactor-preservation`.
  2. Foundation/data-layer work is isolated on `lin/KAR-119-prd-01-02-foundation`.
  3. Route decomposition/page-overhaul work is isolated on `lin/KAR-122-prd-05-page-overhaul`.
  4. Next execution priority after backlog housekeeping is `PRD-03`, `PRD-04`, and `KAR-117`.
