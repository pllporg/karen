# Core Workflow E2E Hardening (KAR-85 / RC-1)

## Scope

- Add executable cross-service workflow coverage for:
  - auth login/session validation
  - matter creation
  - participant add/update lifecycle
  - document upload with malware scan pass path
  - billing time entry, invoice creation, and payment posting
- Ensure this workflow is explicitly enforced in CI.

## Implementation

- Added test: `apps/api/test/core-workflow-e2e.spec.ts`
- Added script: `pnpm --filter api test:core-workflow`
- CI now runs the explicit workflow test before full API test execution.

## Verification Commands

```bash
pnpm --filter api test:core-workflow
pnpm --filter api test
```

## Expected Outcomes

- Workflow test passes with deterministic assertions on:
  - auth session mapping
  - matter and participant lifecycle mutations
  - document version creation and audit activity
  - invoice PDF key generation path
  - payment application and paid invoice status
