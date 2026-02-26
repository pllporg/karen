# REQ-UI-009 Screen Spec - Matter Workspace

## Metadata

- Requirement ID: `REQ-UI-009`
- Screen ID: `MAT-002`
- Route: `/matters/[id]`
- Linked PRD: `docs/prd/REQ-UI-009-matter-workspace.prd.md`

- Backlog Reference: `REQ-UI-PRD-003` (`docs/UI_PRD_SCREEN_BACKLOG.md`), `KAR-71`

## Layout Structure

- Top bar: matter identity, stage/status, key deadline metadata.
- Sectioned content regions:
  - Overview
  - Participants
  - Tasks/Calendar
  - Communications
  - Documents
  - Billing
  - AI workspace links

## Component Contract

- `Table` for participant/task/event/comms/document lists.
- `Badge` for matter/review statuses.
- `Drawer` for contextual review actions where supported.
- `Modal` for destructive/irreversible confirmations.
- `Toast` + inline alerts for feedback hierarchy.

## States

- Default: all sections render current data.
- Loading: route and section loading indicators.
- Empty: section-level empty states with add/create actions.
- Error: section-scoped error blocks with corrective actions.
- Success: timestamped operation confirmations.

## Actions

- Add/remove participants.
- Create/edit/update/delete tasks.
- Create/edit/delete calendar events.
- Log/edit/delete communications.
- Upload document, upload version, toggle share, create share link, fetch download URL.

## Review-Gate and Status Presentation

- Review-related rows/actions show explicit status badge and metadata.
- Client-facing actions require explicit confirmation text describing effect.

## Audit Visibility

- Show operation result messages with time context.
- Ensure actor/status/timestamp visibility where workflow data is available.

## Accessibility

- Section heading hierarchy is semantic and keyboard navigable.
- Row actions are reachable and labeled.
- Modal/drawer interactions enforce focus trap + focus return.

## Responsive Rules

- Preserve section order and high-priority action visibility at compact/tablet breakpoints.
- Keep dense data table-first with horizontal overflow where required.
- Follow unsupported mode under mobile threshold.

## Interaction Model

- Primary path: view route summary -> select scoped action -> confirm resulting state feedback.
- Non-destructive interactions (filters, tabs, sorting, search) update visible context without hidden side effects.
- Mutating actions require explicit user intent and inline confirmation/error messaging.


## Role Visibility

- Route visibility follows LIC role policy defined in the linked PRD.
- Role-restricted controls are hidden or disabled with explicit rationale where disclosure is permitted.
- Client portal visibility remains scoped to portal-authorized route behavior only.


## Review-Gate Expectations

- Review-gated actions surface current status labels and required next-step actions.
- No implied approval: status changes require explicit user action.
- Route surfaces expose review-state context needed by downstream audit trails.


## Accessibility Checks

- Verify keyboard-only completion for all primary actions.
- Verify focus-visible treatment on every actionable element.
- Verify status/error messaging is announced with semantic text, not color-only cues.


## Traceability

- Requirement: `REQ-UI-009`.
- Linear issue: `KAR-71`.
- Backlog row: `REQ-UI-PRD-003` in `docs/UI_PRD_SCREEN_BACKLOG.md`.

