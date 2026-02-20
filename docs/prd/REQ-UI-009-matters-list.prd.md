# REQ-UI-009 PRD - Matters List Route

## Metadata

- Requirement ID: `REQ-UI-009`
- Route: `apps/web/app/matters/page.tsx`
- Primary roles: `Admin`, `Attorney`, `Paralegal`, `Intake Specialist`
- Canonical sources:
  - `docs/UI_CANONICAL_PRECEDENCE.md`
  - `lic-design-system/references/ui-kit.md`
  - `lic-design-system/references/gp01-flow.md`

## Problem Statement

The matters list is a central operations queue. It needs explicit PRD definition for filtering, state handling, and auditable progression from matter creation/intake to active management.

## User Intent

- Find and open matters quickly.
- Create new matters by direct entry or intake wizard.
- Resume intake drafts and complete conversion workflows.

## Entry Points

- Primary nav: `Matters`
- Dashboard/module deep links.

## Functional Scope

- Matter table/list display with status metadata.
- Search/filter behavior and clear/reset flow.
- Matter creation (direct form + intake wizard path).
- Intake draft persistence and resume workflow.

## State Model

- Default: matter table rendered with actions.
- Loading: table-level loading indicator with explicit status copy.
- Empty: no-matters state with create action.
- Error: inline error block with corrective action.
- Success: create/update feedback with timestamp.

## Review-Gate Behavior

Not a direct artifact-review route, but matter lifecycle statuses and next required actions must be explicit and traceable.

## Permissions and Visibility

- Internal authenticated roles only.
- Respect matter-level ethical wall restrictions for row visibility/open actions.
- Denied matters are hidden or clearly blocked per policy.

## Data and Validation

- Matter creation validates required fields and canonical matter identifiers.
- Intake wizard requires mandatory domain data before conversion.
- Draft save/resume preserves user-entered values losslessly.

## Audit and Traceability

- Matter create/update actions generate audit records.
- Intake draft save/resume actions should expose actor and updated timestamp context.

## Accessibility Requirements

- Table rows and row actions keyboard reachable.
- Filter controls have visible labels and validation feedback.
- Focus returns correctly after modal/drawer close.

## Responsive Requirements

- Table-first layout retained with controlled horizontal overflow where needed.
- Tablet mode keeps create/resume actions visible without hidden-only affordances.
- Unsupported mobile behavior follows global shell policy.

## Acceptance Criteria

- Matter list and intake workflows documented with full state model.
- Role and ethical-wall visibility behavior is explicit.
- Accessibility and responsive behavior are defined and testable.
- Screen spec linked and versioned.
