# Communications Provider Adapter Verification

Requirement: `REQ-COMM-001`  
Scope: verify production email/SMS provider adapters with deterministic retry policy behavior and persisted delivery provenance.

## Verification Coverage

- API regression suites:
  - `apps/api/test/message-dispatch.spec.ts`
  - `apps/api/test/communications-delivery.spec.ts`
  - `apps/api/test/communications-portal-attachments.spec.ts`

### Provider + dispatch hardening checks

- Provider routing remains env-driven with production adapters:
  - `MESSAGE_EMAIL_PROVIDER=stub|resend`
  - `MESSAGE_SMS_PROVIDER=stub|twilio`
- Dispatch retry policy now guards invalid env values:
  - non-integer retry settings fall back to safe defaults
  - retry attempts are clamped to valid bounds
  - invalid config emits warning logs instead of silently disabling retries
- Retry semantics are explicitly verified:
  - retryable provider errors (`5xx`) are retried and can recover
  - non-retryable provider errors (`4xx`) do not retry
  - optional `MESSAGE_PROVIDER_FAIL_OPEN=true` fallback remains constrained to non-stub provider failures
- Outbound delivery metadata remains persisted on each message:
  - `rawSourcePayload.delivery.provider`
  - `rawSourcePayload.delivery.status`
  - `rawSourcePayload.delivery.providerMessageId`
  - `rawSourcePayload.delivery.destination`
  - `rawSourcePayload.delivery.providerResponse/error`
- Audit events are emitted for both success and failure paths:
  - `communication.delivery.updated`
  - `communication.delivery.failed`

## Commands

- `pnpm --filter api test -- message-dispatch.spec.ts`
- `pnpm --filter api test -- communications-delivery.spec.ts`
- `pnpm --filter api test -- communications-portal-attachments.spec.ts`

## Result

`REQ-COMM-001` is verified with production provider adapters, persisted delivery/audit provenance, and hardened retry/failure behavior under invalid configuration and non-retryable provider errors.
