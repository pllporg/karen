# Webhook Delivery Observability + Manual Retry

Requirement: `REQ-INT-003` (post-completion hardening follow-on)  
Scope: expose delivery observability and scoped manual retry controls for webhook events.

## Artifact

- API:
  - `GET /webhooks/deliveries`
  - `POST /webhooks/deliveries/:deliveryId/retry`
- Web admin monitor:
  - `apps/web/app/admin/page.tsx` (`Webhook Delivery Monitor`)

## Coverage Mapping

- Delivery observability:
  - org-scoped list endpoint with optional `status`, `endpointId`, and `limit` filters
  - response includes endpoint URL + active state, event type, attempts, response code, timestamps
- Manual retry governance:
  - retries limited to `FAILED` and `RETRYING` deliveries
  - rejects inactive endpoints
  - strict organization scoping on retry lookup
  - retry resets delivery state to `PENDING` then reuses signed delivery pipeline
- UI operations:
  - status-filtered delivery table in Admin
  - retry action button for retryable rows only
  - inline error display for retry failures

## Verification

- API tests:
  - `apps/api/test/webhooks-delivery.spec.ts`
  - `apps/api/test/tenant-isolation.spec.ts`
- Web test:
  - `apps/web/test/admin-page.spec.tsx`
- Validation commands:
  - `pnpm test`
  - `pnpm build`
