# Billing Stripe Reconciliation Verification

Requirement: `REQ-BILL-001`  
Scope: verify Stripe checkout payment lifecycle reconciliation, idempotency controls, and invoice balance/status transitions.

## Artifact

- API hardening: `apps/api/src/billing/billing.service.ts`
- API tests: `apps/api/test/billing-stripe-reconciliation.spec.ts`

## Coverage Mapping

- Checkout metadata propagation:
  - checkout session and payment intent metadata include `invoiceId` + `organizationId` for reconciliation routing.
- Webhook reconciliation lifecycle:
  - `checkout.session.completed` and `payment_intent.succeeded` both reconcile payments against invoices.
  - payment amount is clamped to remaining balance, with deterministic invoice status transitions (`PARTIAL` / `PAID`).
- Idempotency hardening:
  - duplicate deliveries are deduped by Stripe event ID (`reference=stripe_event:<eventId>`).
  - payment-intent dedupe remains in place for repeated events with the same `stripePaymentIntentId`.
- Signature verification governance:
  - when `STRIPE_WEBHOOK_SECRET` is configured, missing signature/raw body is rejected.
  - signature path is verified by regression test via Stripe webhook constructor mock.

## Verification

- `pnpm --filter api test -- billing-stripe-reconciliation.spec.ts`
- `pnpm test`
- `pnpm build`
- `pnpm backlog:sync`
- `pnpm backlog:verify`
- `pnpm backlog:snapshot`
- `pnpm backlog:handoff:check`
