# Matter Dashboard Task + Calendar Lifecycle Verification

Requirement: `REQ-PMS-CORE-005`  
Scope: verify matter dashboard task/calendar lifecycle operations plus in-context billing operations (time, expense, invoice, payment, trust), including server-side matter access checks and audit logging.

## Artifact

- API task lifecycle updates:
  - `apps/api/src/tasks/tasks.controller.ts`
  - `apps/api/src/tasks/tasks.service.ts`
- API calendar lifecycle updates:
  - `apps/api/src/calendar/calendar.controller.ts`
  - `apps/api/src/calendar/calendar.service.ts`
  - `apps/api/src/calendar/dto/update-event.dto.ts`
- Web matter dashboard lifecycle UX:
  - `apps/web/app/matters/[id]/page.tsx`
- Matter dashboard billing/trust payload expansion:
  - `apps/api/src/matters/matters.service.ts`

## Verification Coverage

- Task lifecycle:
  - matter dashboard can create, edit, status-update, and delete tasks.
  - delete path enforces org/matter scope and emits `task.deleted` audit event.
- Calendar lifecycle:
  - matter dashboard can create, edit, and delete calendar events.
  - update/delete paths enforce org/matter scope and emit `calendar_event.updated` / `calendar_event.deleted` audit events.
- UI behavior:
  - task/calendar edit mode supports explicit cancel behavior and contextual status feedback.
  - dashboard tables expose edit/delete actions with keyboard-accessible controls and stable labels.
  - matter dashboard calendar panel provides in-context ICS export action with deterministic status messaging.
  - matter dashboard billing panel supports in-context creation of time entries, expenses, invoices, invoice payments, checkout links, and trust transactions.
  - billing actions show timestamped procedural feedback and refresh matter-scoped ledger/payment context without route changes.
- Regression hardening:
  - API service unit tests cover update/delete happy paths, not-found guards, and ICS export payload semantics.
  - web workflow tests cover full task/calendar lifecycle interactions, billing/trust workflows, and ICS export download flow.

## Verification Commands

- `pnpm --filter api test -- test/tasks.spec.ts test/calendar-events.spec.ts`
- `pnpm --filter api test -- matters.spec.ts`
- `pnpm --filter web test -- test/matter-dashboard-page.spec.tsx`
- `pnpm test`
- `pnpm build`
- `pnpm backlog:sync`
- `pnpm backlog:verify`
- `pnpm backlog:snapshot`
- `pnpm backlog:handoff:check`
