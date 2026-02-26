# REQ-UI-009 Screen Spec - Matters List

## Metadata

- Requirement ID: `REQ-UI-009`
- Screen ID: `MAT-001`
- Route: `/matters`
- Linked PRD: `docs/prd/REQ-UI-009-matters-list.prd.md`

- Backlog Reference: `REQ-UI-PRD-002` (`docs/UI_PRD_SCREEN_BACKLOG.md`), `KAR-71`

## Layout Structure

- Top bar with route heading and primary create actions.
- Filter/search control bar.
- Primary matter table region.
- Intake draft resume panel/section.

## Component Contract

- `Table` for matters and draft listings.
- `Input`/`Select` for filters and creation inputs.
- `Button` for create, resume, and row actions.
- `Badge` for matter lifecycle status.
- `Modal` or `Drawer` for gated create/intake flows.

## States

- Default: populated matter list.
- Loading: deterministic loading state.
- Empty: no matter records + create CTA.
- Error: inline error state with retry.
- Success: create/save/resume feedback.

## Actions

- Create matter (direct).
- Launch intake wizard.
- Resume intake draft.
- Open matter workspace from row action.

## Audit Visibility

- Matter row metadata includes updated/opened context.
- Draft rows include last modified timestamp and owner.

## Accessibility

- Table headers and row actions keyboard accessible.
- Focus-visible on filters, row actions, and create controls.
- Dialog/drawer focus trap and return semantics required.

## Responsive Rules

- Maintain matter table readability at compact/tablet sizes.
- Preserve action discoverability in compact mode.
- Respect global unsupported mode under 768px.

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
- Backlog row: `REQ-UI-PRD-002` in `docs/UI_PRD_SCREEN_BACKLOG.md`.

