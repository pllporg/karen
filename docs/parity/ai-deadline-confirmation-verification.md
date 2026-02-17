# AI Deadline Confirmation Verification

Requirement: `REQ-AI-001`  
Scope: harden deadline-confirmation governance with API validation, auditable confirmation events, and UI regression checks.

## Artifact

- API hardening: `apps/api/src/ai/ai.service.ts` (`confirmDeadlines`)
- API tests: `apps/api/test/ai-deadline-confirmation.spec.ts`
- Web regression: `apps/web/test/ai-page.spec.tsx`

## Coverage Mapping

- Side-by-side excerpt confirmation UX:
  - preserved existing candidate + excerpt rendering and explicit row selection flow in AI workspace
- Server-side confirmation guardrails:
  - rejects empty confirmation payloads
  - rejects invalid deadline dates
  - rejects rows with neither `createTask` nor `createEvent` enabled
  - rejects blank deadline descriptions
- Audit trail requirement:
  - appends `ai.deadlines.confirmed` audit event per confirmation action
  - stores artifact/matter identifiers, selection summary, and created record references
- User-facing validation behavior:
  - web test verifies API validation failure is surfaced in UI error banner

## Verification

- `pnpm --filter api test -- ai-deadline-confirmation.spec.ts`
- `pnpm --filter web test -- ai-page.spec.tsx`
- `pnpm test`
- `pnpm build`
- `pnpm backlog:sync`
- `pnpm backlog:verify`
- `pnpm backlog:snapshot`
- `pnpm backlog:handoff:check`
