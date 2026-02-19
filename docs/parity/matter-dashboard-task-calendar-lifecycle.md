# Matter Dashboard Task + Calendar Lifecycle Verification

Requirement: `REQ-PMS-CORE-005`  
Scope: verify matter dashboard task and calendar lifecycle operations (create/edit/delete), including server-side matter access checks and audit logging.

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
- Regression hardening:
  - API service unit tests cover update/delete happy paths + not-found guards.
  - web workflow test covers full task and calendar lifecycle interactions.

## Verification Commands

- `pnpm --filter api test -- test/tasks.spec.ts test/calendar-events.spec.ts`
- `pnpm --filter web test -- test/matter-dashboard-page.spec.tsx`
- `pnpm test`
- `pnpm build`
- `pnpm backlog:sync`
- `pnpm backlog:verify`
- `pnpm backlog:snapshot`
- `pnpm backlog:handoff:check`
