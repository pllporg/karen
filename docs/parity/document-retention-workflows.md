# REQ-COMM-004 Parity Evidence: Document Retention + Legal Hold + Disposition Workflow

## Implemented

- Added retention/hold/disposition data model in Prisma:
  - enums: `DocumentDispositionStatus`, `RetentionScope`, `RetentionTrigger`, `DocumentLegalHoldStatus`, `DocumentDispositionRunStatus`, `DocumentDispositionItemStatus`
  - models: `DocumentRetentionPolicy`, `DocumentLegalHold`, `DocumentDispositionRun`, `DocumentDispositionItem`
  - document fields: `retentionPolicyId`, `retentionEligibleAt`, `legalHoldActive`, `dispositionStatus`, `disposedAt`
- Added migration:
  - `apps/api/prisma/migrations/20260217191000_document_retention_workflows/migration.sql`
- Added document retention/legal-hold/disposition APIs:
  - `GET /documents/retention/policies`
  - `POST /documents/retention/policies`
  - `POST /documents/:id/retention-policy`
  - `POST /documents/:id/legal-hold`
  - `POST /documents/:id/legal-hold/release`
  - `GET /documents/disposition/runs`
  - `POST /documents/disposition/runs`
  - `POST /documents/disposition/runs/:id/approve`
  - `POST /documents/disposition/runs/:id/execute`
- Added legal-hold precedence and disposition governance behavior:
  - legal-hold documents are skipped from pending disposition items
  - approval state required before execution
  - execution marks documents as disposed, revokes active share links, and records disposition item apply timestamps
  - disposed documents are blocked from share/download/versioning actions
- Added documents page controls for retention workflows:
  - policy creation
  - policy assignment
  - place/release legal hold
  - create/approve/execute disposition runs

## Audit + Safety Controls

- Audit events emitted for:
  - policy creation/assignment
  - legal hold placement/release
  - disposition run creation/approval/completion
- Legal hold requires explicit reason on placement.
- Disposition execution requires approved run state.

## Verification

Executed on 2026-02-17:

```bash
pnpm --filter api prisma:generate
pnpm --filter api test -- document-retention.spec.ts
pnpm --filter web test -- documents-page.spec.tsx
pnpm test
pnpm build
```

Results:

- New API retention workflow suite passed (`apps/api/test/document-retention.spec.ts`).
- Updated documents page suite passed (`apps/web/test/documents-page.spec.tsx`).
- Full monorepo tests and build passed.
