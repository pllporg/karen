# REQ-UI-009 PRD - Dashboard Route

## Metadata

- Requirement ID: `REQ-UI-009`
- Route: `apps/web/app/dashboard/page.tsx`
- Primary roles: `Admin`, `Attorney`, `Paralegal`, `Intake Specialist`, `Billing`
- Canonical sources:
  - `docs/UI_CANONICAL_PRECEDENCE.md`
  - `brand/Brand Identity Document/src/app/components/sections/AppUIKit.tsx`
  - `lic-design-system/references/interaction-and-ai.md`

## Problem Statement

The dashboard currently renders summary metrics and recent-activity blocks, but route-level behavior is not yet formalized in a PRD for consistent LIC interaction, audit visibility, and accessibility verification.

## User Intent

- Quickly assess open workload and operational status for the firm.
- Open high-priority work areas without navigating deep into module pages.
- Validate that casework progression and risk signals are current.

## Entry Points

- Primary nav: `Dashboard`
- Post-login default redirect for authenticated users.

## Functional Scope

- Display summary metrics (matters, deadlines, pending reviews, billing signals).
- Display operational notices/warnings.
- Provide direct links to key modules (`Matters`, `Communications`, `Billing`, `AI`, `Portal`).

## State Model

- Default: metric and notice cards rendered with latest data.
- Loading: route-level loading indicator while initial data fetch resolves.
- Empty: clear "no activity" messaging when data sets are empty.
- Error: inline error block with actionable retry instruction.
- Success: timestamped data snapshot with stable status labels.

## Review-Gate Behavior

Dashboard does not execute direct artifact review actions, but it must surface counts and links for review-gated workloads (`PROPOSED`, `IN REVIEW`, `APPROVED`, `EXECUTED`, `RETURNED`).

## Permissions and Visibility

- Requires authenticated internal membership.
- Respect role-level module visibility for linked actions.
- Client portal users do not access this route.

## Data and Validation

- Data is read-only summary data.
- Ensure stale/failed data fetches are visibly flagged.
- Display snapshot timestamp for user trust.

## Audit and Traceability

- Any dashboard-triggered action navigation should preserve route and timestamp context in downstream audit surfaces.
- Dashboard should expose last refresh timestamp and source status where available.

## Accessibility Requirements

- Keyboard traversal in visual reading order.
- Focus-visible ring on all interactive links/actions.
- Headings and region labels announced correctly.
- Errors include corrective text, not generic failure statements.

## Responsive Requirements

- `>=1280px`: full shell, dense summary layout.
- `1024-1279px`: compact shell with preserved summary hierarchy.
- `768-1023px`: tablet drawer nav and single-column summary stacking.
- `<768px`: unsupported operator-workflow notice.

## Acceptance Criteria

- Dashboard behavior documented for all required states.
- Role visibility and navigation behavior explicitly defined.
- Accessibility and responsive rules align with LIC doctrine.
- Screen spec linked and maintained alongside this PRD.
