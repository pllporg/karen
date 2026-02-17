# REQ-COMM-001 Parity Evidence: Production Message Providers

Requirement: `REQ-COMM-001`  
Prompt section: `Email/SMS provider interfaces + stub provider in MVP`

## Implemented

- Added provider routing service with env-based selection:
  - `MESSAGE_EMAIL_PROVIDER=stub|resend`
  - `MESSAGE_SMS_PROVIDER=stub|twilio`
- Added production adapters:
  - `ResendEmailProvider` (`/communications/providers/resend-email.provider.ts`)
  - `TwilioSmsProvider` (`/communications/providers/twilio-sms.provider.ts`)
- Added retry/failure policy in dispatch layer:
  - `MESSAGE_PROVIDER_MAX_RETRIES`
  - `MESSAGE_PROVIDER_RETRY_DELAY_MS`
  - optional fail-open fallback: `MESSAGE_PROVIDER_FAIL_OPEN=true`
- Persisted delivery metadata and provider IDs on outbound messages:
  - stored in `CommunicationMessage.rawSourcePayload.delivery`
  - includes provider name, status, provider message id, destination, timestamps, provider response/error
- Added delivery audit trails:
  - `communication.delivery.updated`
  - `communication.delivery.failed`

## Verification

- API tests:
  - `apps/api/test/message-dispatch.spec.ts`
  - `apps/api/test/communications-delivery.spec.ts`
  - existing compatibility tests still pass:
    - `apps/api/test/communications-portal-attachments.spec.ts`

## Notes

- Provider credentials are configured via environment variables; no secrets are persisted in application tables.
- Existing stub provider remains default for local/dev safety.
