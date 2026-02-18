# Tenant Isolation Verification

Requirement: `REQ-SEC-001`  
Scope: verify organization scoping across core service reads for security-critical multi-tenant isolation.

## Artifact

- Security regression suite: `apps/api/test/tenant-isolation.spec.ts`

## Coverage Mapping

- Existing org-scope coverage retained for contacts, matters, tasks, calendar, communications, imports, exports, integrations, admin/audit/webhooks, and reporting.
- Expanded entity coverage for newly introduced modules:
  - Documents governance:
    - `listRetentionPolicies` is constrained by `organizationId`
    - `listDispositionRuns` is constrained by `organizationId`
  - Billing governance:
    - `listTrustReconciliationRuns` enforces org scope and trust-account ownership checks
    - `listLedesExportProfiles` is constrained by `organizationId`
    - `listLedesExportJobs` validates profile ownership and queries by `organizationId`
  - AI governance:
    - `listStylePacks` is constrained by `organizationId`

## Verification

- `pnpm --filter api test -- tenant-isolation.spec.ts`
- `pnpm test`
- `pnpm build`
- `pnpm backlog:sync`
- `pnpm backlog:verify`
- `pnpm backlog:snapshot`
- `pnpm backlog:handoff:check`
