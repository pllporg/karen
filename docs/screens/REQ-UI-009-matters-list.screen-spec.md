# REQ-UI-009 Screen Spec - Matters List

## Metadata

- Requirement ID: `REQ-UI-009`
- Screen ID: `MAT-001`
- Route: `/matters`
- Linked PRD: `docs/prd/REQ-UI-009-matters-list.prd.md`

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
