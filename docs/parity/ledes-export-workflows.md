# REQ-BILL-004 Parity Evidence: LEDES / UTBMS Export Jobs

## Implemented

- Added LEDES export data model in Prisma:
  - enums: `LEDESFormat`, `LEDESValidationStatus`
  - models: `LEDESExportProfile`, `LEDESExportJob`
- Added migration:
  - `apps/api/prisma/migrations/20260217204500_ledes_export_workflows/migration.sql`
- Added billing LEDES APIs:
  - `GET /billing/ledes/profiles`
  - `POST /billing/ledes/profiles`
  - `GET /billing/ledes/jobs`
  - `GET /billing/ledes/jobs/:id`
  - `POST /billing/ledes/jobs`
  - `GET /billing/ledes/jobs/:id/download`
- Added profile-driven validation behavior:
  - profile controls UTBMS phase/task strictness and expense-line inclusion
  - export jobs fail with `validationStatus=FAILED` and structured validation errors when required fields are missing
  - successful jobs persist checksum, line totals, storage key, and export summary metadata
- Added billing UI workflow in `apps/web/app/billing/page.tsx`:
  - create LEDES profile
  - run export job by selected profile and optional invoice IDs
  - view job list/status and download completed job artifact

## Governance + Safety Controls

- All LEDES jobs are organization-scoped and stored with explicit status/validation state.
- Download endpoint is restricted to completed jobs with stored artifacts.
- Export profile creation and job success/failure transitions emit audit events.

## Verification

Executed on 2026-02-17:

```bash
pnpm --filter api prisma:generate
pnpm --filter api test -- billing-ledes-export.spec.ts
pnpm --filter api test -- billing-ledes-verification.spec.ts
pnpm --filter web test -- billing-page.spec.tsx
pnpm test
pnpm build
```

Results:

- API LEDES service coverage passed (`apps/api/test/billing-ledes-export.spec.ts`).
- Verification hardening coverage passed (`apps/api/test/billing-ledes-verification.spec.ts`) for:
  - default-profile rotation behavior (`isDefault=true` resets prior defaults atomically),
  - explicit invoice-id export integrity (dedupe + missing-id rejection with deterministic error),
  - expense-line exclusion behavior for `includeExpenseLineItems=false` without false validation failures.
- Web billing LEDES workflow coverage passed (`apps/web/test/billing-page.spec.tsx`).
- Full monorepo tests and build passed.
