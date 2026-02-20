# REQ-UI-009 Screen Spec - Dashboard

## Metadata

- Requirement ID: `REQ-UI-009`
- Screen ID: `DASH-001`
- Route: `/dashboard`
- Linked PRD: `docs/prd/REQ-UI-009-dashboard.prd.md`

## Layout Structure

- Top bar with route title and status context.
- Primary summary region (table/list-first where density requires).
- Secondary notice region for warnings and operational flags.

## Component Contract

- `Card` for bounded summary blocks.
- `Badge` for workload/status markers.
- `Table` for any dense listing preview.
- `Button`/link actions for module handoff.

## States

- Default: all summary regions populated.
- Loading: deterministic loading state (no decorative shimmer).
- Empty: explicit no-data copy.
- Error: inline error block with retry action.
- Success: snapshot metadata visible.

## Actions

- Open module shortcuts (`Matters`, `Communications`, `Billing`, `AI`, `Portal`).
- Retry load after error.

## Audit Visibility

- Last refresh timestamp visible in mono metadata style.
- Review-gate queue counts visible where data exists.

## Accessibility

- Landmarks and heading order enforce predictable navigation.
- Keyboard focus order: topbar -> summary -> notices -> actions.
- Non-color cues on status (badge text + semantic labels).

## Responsive Rules

- Preserve region ordering across breakpoints.
- Collapse multi-column regions to single-column at tablet mode.
- Do not render full workflow UI under unsupported mobile threshold.
