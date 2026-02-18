# MyCase Connector Verification

Requirement: `REQ-INT-002`  
Scope: verify MyCase integration supports OAuth lifecycle, incremental idempotent sync, token refresh handling, and webhook subscription registration.

## Artifact

- Connector regression suite: `apps/api/test/mycase.connector.spec.ts`
- Integration orchestration regression suite: `apps/api/test/integrations.spec.ts`

## Verification Coverage

- OAuth lifecycle:
  - service-level OAuth callback validation covers state hash mismatch and expiry rejection.
  - MyCase connector refresh-grant flow is now covered in both scaffold and live modes.
- Token security + refresh:
  - encrypted token-at-rest behavior remains covered by integration service tests.
  - sync orchestration refreshes expired OAuth tokens before provider pulls when connector refresh is available.
  - refreshed token envelopes/scopes are persisted and audited (`integration.oauth.refreshed`).
- Incremental sync + idempotency:
  - duplicate `connectionId + idempotencyKey` requests return existing sync runs.
  - cursor checkpoints and sync state metadata persist on success.
- Webhook subscription:
  - MyCase connector supports scaffold/live registration paths.
  - external subscription IDs are persisted in integration webhook subscriptions.

## Verification Commands

- `pnpm --filter api test -- mycase.connector.spec.ts integrations.spec.ts`
- `pnpm test`
- `pnpm build`
- `pnpm backlog:sync`
- `pnpm backlog:verify`
- `pnpm backlog:snapshot`
- `pnpm backlog:handoff:check`
