# Matter Participant Lifecycle Hardening (REQ-PMS-CORE-007)

## Scope
- Added matter participant update endpoint for in-context role/side/linkage edits.
- Extended matter dashboard participant workflow to support add/edit/remove with:
  - role + side
  - primary flag
  - represented-by contact mapping
  - law-firm mapping for counsel roles
  - notes
- Enriched dashboard participant payload with `representedByContact` and `lawFirmContact`.

## Validation Rules Covered
- Counsel roles reject `representedByContactId`.
- Non-counsel roles reject `lawFirmContactId`.
- `representedByContactId` and `lawFirmContactId` cannot match participant `contactId`.
- All linked contacts are constrained to the same organization.
- Matter access policy remains enforced for write operations.

## Verification Evidence
- API regression:
  - `pnpm --filter api test -- matters.spec.ts`
  - Added tests:
    - `updates participant relationship mapping and emits audit event`
    - `rejects representedByContactId when update target role is counsel`
- Web regression:
  - `pnpm --filter web test -- matter-dashboard-page.spec.tsx`
  - Added scenario:
    - `adds, edits, and removes participants in matter context`
- Full suite:
  - `pnpm test`
  - `pnpm build`
  - `pnpm lint`

## Files
- `apps/api/src/matters/dto/update-participant.dto.ts`
- `apps/api/src/matters/matters.controller.ts`
- `apps/api/src/matters/matters.service.ts`
- `apps/api/test/matters.spec.ts`
- `apps/web/app/matters/[id]/page.tsx`
- `apps/web/test/matter-dashboard-page.spec.tsx`
- `tools/backlog-sync/requirements.matrix.json`
