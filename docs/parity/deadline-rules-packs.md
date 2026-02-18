# REQ-MAT-005 Parity Evidence: Jurisdictional Deadline Rules Packs

## Implemented

- Added rules-pack API endpoints in `CalendarController`:
  - `GET /calendar/rules-packs`
  - `POST /calendar/rules-packs`
  - `POST /calendar/deadline-preview`
  - `POST /calendar/deadline-preview/apply`
- Added rules-pack DTOs:
  - `apps/api/src/calendar/dto/create-rules-pack.dto.ts`
  - `apps/api/src/calendar/dto/preview-deadlines.dto.ts`
  - `apps/api/src/calendar/dto/apply-deadline-preview.dto.ts`
- Extended `CalendarService` to support:
  - versioned jurisdiction/court/procedure pack metadata via `DeadlineRuleTemplate.configJson`
  - pack resolution by matter attributes and effective date
  - deadline preview generation before persistence
  - business-day offset computation
  - apply flow with per-rule override date + required override reason
  - audit event emission for pack creation and apply actions
  - `rawSourcePayload` provenance on generated calendar events
- Added matter dashboard rules-pack flow in `apps/web/app/matters/[id]/page.tsx`:
  - rules-pack selector
  - trigger date input
  - preview grid
  - override date/reason entry
  - apply action and status feedback

## Governance + Safety Behavior

- Override reason is mandatory when an override date is supplied.
- Generated deadline events persist source provenance (`source=deadline_rules_pack`, rules pack id, rule id, computed/override dates).
- Apply and create-pack actions are audit logged.
- Explicit rules-pack selection now enforces active/effective-window validation (inactive or out-of-window packs are rejected).
- Auto-selection now prefers the most specific active match (jurisdiction/court/procedure), then the latest effective version.
- Apply validation now rejects duplicate or unknown rule selections to prevent silent partial application.

## Verification

Executed on 2026-02-18:

```bash
pnpm --filter api test -- deadline-rules-packs.spec.ts deadline-rules-verification.spec.ts
pnpm --filter web test -- matter-dashboard-page.spec.tsx
pnpm test
pnpm build
```

Results:

- API targeted suite passed (`apps/api/test/deadline-rules-packs.spec.ts`).
- API verification suite passed (`apps/api/test/deadline-rules-verification.spec.ts`).
- Web targeted suite passed (`apps/web/test/matter-dashboard-page.spec.tsx`).
- Full monorepo test suite passed (44 API suites, 13 web files).
- Full monorepo build passed.
