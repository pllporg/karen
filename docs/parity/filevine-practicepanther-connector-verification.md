# Filevine + PracticePanther Connector Verification

Requirement: `REQ-INT-003`  
Scope: verify production-adapter behavior for Filevine and PracticePanther incremental sync and webhook subscription paths.

## Verification Coverage

- Connector regression suite: `apps/api/test/connector-provider-sync.spec.ts`

### Sync adapter checks

- Filevine and PracticePanther connectors both support:
  - scaffold-mode sync with explicit warning banners when live mode is disabled
  - live-mode incremental pulls with cursor propagation (`updated_since` default)
  - partial-result warning behavior when one entity pull fails

### Webhook adapter checks

- Live-mode webhook subscription requires access tokens for both providers.
- Connectors now support optional live webhook registration URLs:
  - `FILEVINE_WEBHOOK_REGISTER_URL` / config override `webhookRegistrationUrl`
  - `PRACTICEPANTHER_WEBHOOK_REGISTER_URL` / config override `webhookRegistrationUrl`
- Successful webhook registration returns provider-supplied external subscription IDs when present.
- Non-2xx provider responses now raise deterministic connector errors with status context.
- Fallback synthetic subscription IDs remain available when registration URLs are not configured.

## Commands

- `pnpm --filter api test -- connector-provider-sync.spec.ts`
- `pnpm --filter api test -- integrations.spec.ts`

## Result

`REQ-INT-003` is verified with executable coverage for provider pull sync behavior and webhook registration hardening across Filevine and PracticePanther adapters.
