# E-Sign Provider Abstraction Coverage

Requirement: `REQ-PORTAL-002`  
Scope: replace portal e-sign stub-only flow with provider abstraction, lifecycle persistence, polling, and webhook processing.

## Implemented API Surface

- `POST /portal/esign`
  - creates envelope via provider abstraction (`stub` fallback or `sandbox` provider).
  - validates client role, matter scope, and template ownership.
  - persists envelope status transition history (`payloadJson.statusHistory`) and provider metadata.
- `GET /portal/esign/envelopes`
  - returns client-scoped envelopes for visible matters.
- `POST /portal/esign/:envelopeId/refresh`
  - polls provider and applies persisted lifecycle transition updates.
- `POST /portal/esign/webhooks/:provider`
  - processes provider callbacks with signed payload validation.
  - updates envelope status idempotently with webhook event tracking.

## Provider Abstraction

- `apps/api/src/portal/esign/esign-provider.interface.ts`
  - unified contract for create/poll/webhook behavior.
- `apps/api/src/portal/esign/esign-provider.registry.ts`
  - resolves configured provider and enforces supported keys.
- `apps/api/src/portal/esign/stub-esign.provider.ts`
  - local fallback provider.
- `apps/api/src/portal/esign/sandbox-esign.provider.ts`
  - sandbox provider path with signed webhook verification (`ESIGN_SANDBOX_WEBHOOK_SECRET`).

## Portal UX Surface

- `apps/web/app/portal/page.tsx`
  - provider selector for envelope creation (`stub` / `sandbox`).
  - snapshot card + list showing envelope statuses.
  - “Refresh Status” action wired to provider polling endpoint.

## Configuration

- Added env settings in `.env.example` and `apps/api/.env.example`:
  - `ESIGN_PROVIDER`
  - `ESIGN_STUB_WEBHOOK_SECRET`
  - `ESIGN_SANDBOX_WEBHOOK_SECRET`
  - `ESIGN_SANDBOX_SIGN_BASE_URL`

## Test Evidence

- API:
  - `apps/api/test/portal.spec.ts`
  - `apps/api/test/portal-esign-verification.spec.ts`
  - coverage includes:
    - envelope creation with provider abstraction + stub fallback
    - sandbox status polling transitions
    - signed sandbox webhook processing
    - envelope list scope enforcement for client-visible matters
    - webhook idempotency for duplicate provider event IDs
    - refresh lifecycle persistence (`statusHistory` + `providerPoll` metadata)
    - invalid signature rejection before envelope lookup
- Web:
  - `apps/web/test/portal-page.spec.tsx`
  - verifies portal action flow for intake + e-sign envelope creation payload including provider.
  - verifies envelope status refresh calls provider refresh endpoint and updates surfaced status.

## Verification Command

- `pnpm --filter api test -- portal.spec.ts portal-esign-verification.spec.ts`
- `pnpm --filter web test -- portal-page.spec.tsx`
