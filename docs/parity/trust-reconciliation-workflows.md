# REQ-BILL-003 Parity Evidence: Trust Reconciliation Workflows

## Implemented

- Added trust reconciliation schema + lifecycle enums:
  - `TrustReconciliationRunStatus` (`DRAFT`, `IN_REVIEW`, `COMPLETED`)
  - `TrustReconciliationDiscrepancyStatus` (`OPEN`, `RESOLVED`, `WAIVED`)
  - models: `TrustReconciliationRun`, `TrustReconciliationDiscrepancy`
- Added migration:
  - `apps/api/prisma/migrations/20260217200500_trust_reconciliation_workflows/migration.sql`
- Added billing reconciliation endpoints:
  - `GET /billing/trust/reconciliation/runs`
  - `POST /billing/trust/reconciliation/runs`
  - `POST /billing/trust/reconciliation/runs/:id/submit`
  - `POST /billing/trust/reconciliation/discrepancies/:id/resolve`
  - `POST /billing/trust/reconciliation/runs/:id/complete`
- Added reconciliation workflow behavior:
  - run creation calculates statement-period totals and opens discrepancy records
  - submit transitions run from `DRAFT` to `IN_REVIEW`
  - discrepancy resolution supports `RESOLVED` and `WAIVED` with required resolution note
  - completion requires no `OPEN` discrepancies and records sign-off (`signedOffByUserId`, `signedOffAt`)
  - audit events emitted for create/submit/resolve/complete actions
- Added web billing workflow support in `apps/web/app/billing/page.tsx`:
  - create run form
  - submit run action
  - discrepancy resolution controls
  - complete run action with result feedback

## Governance + Safety Controls

- Reconciliation completion is blocked until all discrepancies are resolved or waived.
- Resolution and completion actions are user-attributed and timestamped.
- All reconciliation state transitions generate audit events.

## Verification

Executed on 2026-02-17:

```bash
pnpm --filter api prisma:generate
pnpm --filter api test -- billing-trust-invariants.spec.ts
pnpm --filter web test -- billing-page.spec.tsx
pnpm test
pnpm build
```

Results:

- API trust reconciliation regression coverage passed (`apps/api/test/billing-trust-invariants.spec.ts`).
- Web billing reconciliation coverage passed (`apps/web/test/billing-page.spec.tsx`).
- Full monorepo tests and build passed.
