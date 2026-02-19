# Data Model Conformance Verification

Requirement: `REQ-DATA-001`  
Scope: verify prompt-required Prisma model coverage and key relation/field semantics remain enforced by executable regression checks.

## Artifact

- Schema conformance suite: `apps/api/test/schema-conformance.spec.ts`
- Baseline checklist mapping: `docs/parity/data-model-checklist.md`

## Verification Coverage

- Confirms all prompt-required core models currently tracked as `Complete`/`Partial` in the parity checklist exist in `apps/api/prisma/schema.prisma`.
- Enforces UUID-backed `id` convention on every Prisma model block.
- Asserts high-risk field semantics for tenancy/security/migration-critical models, including:
  - `MatterParticipant`
  - `ImportBatch`, `ImportItem`, `MappingProfile`, `ExternalReference`
  - `AuditLogEvent`
  - `DocumentRetentionPolicy`, `DocumentLegalHold`, `DocumentDispositionRun`
  - `TrustReconciliationRun`, `TrustReconciliationDiscrepancy`
  - `LEDESExportProfile`, `LEDESExportJob`
  - `AiSourceChunk`, `AiExecutionLog`
  - `IntegrationConnection`, `IntegrationSyncRun`, `IntegrationWebhookSubscription`
- Confirms open gaps not part of `REQ-DATA-001` stay explicitly linked to requirement IDs in the checklist (`REQ-DATA-003`, `REQ-MAT-001`, `REQ-MAT-004`, `REQ-PORT-003`).

## Verification Commands

- `pnpm --filter api test -- schema-conformance.spec.ts`
- `pnpm test`
- `pnpm build`
- `pnpm backlog:sync`
- `pnpm backlog:verify`
- `pnpm backlog:snapshot`
- `pnpm backlog:handoff:check`
