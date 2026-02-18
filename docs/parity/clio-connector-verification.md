# Clio Connector Verification

Requirement: `REQ-INT-001`  
Scope: verify Clio integration supports OAuth lifecycle, incremental idempotent sync, token refresh handling, and webhook subscription registration paths.

## Artifact

- Connector regression suite: `apps/api/test/clio.connector.spec.ts`
- Integration orchestration regression suite: `apps/api/test/integrations.spec.ts`

## Verification Coverage

- OAuth lifecycle:
  - authorization URL generation and callback token exchange are covered in service-level tests.
  - callback validation now has explicit state-mismatch and state-expired regression coverage.
- Token security and refresh:
  - encrypted token-at-rest behavior remains covered by integration service tests.
  - Clio connector now supports OAuth refresh grant flow in live mode.
  - sync flow refreshes expired tokens before provider pull when connector refresh is available.
  - refreshed tokens/scopes are persisted and audited via `integration.oauth.refreshed` events.
- Incremental sync + idempotency:
  - duplicate `connectionId + idempotencyKey` returns existing sync run without invoking provider sync.
  - successful sync persists cursor checkpoints and connection sync state.
- Webhook subscription:
  - Clio connector supports scaffold/live webhook registration paths.
  - subscription persistence and external subscription ID storage are covered in service tests.

## Verification Commands

- `pnpm --filter api test -- clio.connector.spec.ts integrations.spec.ts`
- `pnpm test`
- `pnpm build`
- `pnpm backlog:sync`
- `pnpm backlog:verify`
- `pnpm backlog:snapshot`
- `pnpm backlog:handoff:check`
