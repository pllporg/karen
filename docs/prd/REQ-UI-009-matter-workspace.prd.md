# REQ-UI-009 PRD - Matter Workspace Route

## Metadata

- Requirement ID: `REQ-UI-009`
- Route: `apps/web/app/matters/[id]/page.tsx`
- Primary roles: `Admin`, `Attorney`, `Paralegal`, `Intake Specialist`, `Billing`
- Canonical sources:
  - `docs/UI_CANONICAL_PRECEDENCE.md`
  - `lic-design-system/references/interaction-and-ai.md`
  - `lic-design-system/references/ui-kit.md`

- Backlog Reference: `REQ-UI-PRD-003` (`docs/UI_PRD_SCREEN_BACKLOG.md`), `KAR-71`

## Problem Statement

The matter workspace is the highest-risk operational route (participants, tasks, deadlines, communications, documents, billing). It needs explicit interaction and audit behavior definitions to prevent unsafe or ambiguous actions.

## User Intent

- Execute daily casework in one contextual workspace.
- Maintain participant, task, calendar, communication, and document lifecycles.
- Review and confirm deadline, artifact, and client-facing actions safely.

## Entry Points

- Matters list row open.
- Deep links from dashboard, communications, billing, or AI flows.

## Functional Scope

- Matter overview metadata and stage/status context.
- Participants table and participant add/remove operations.
- Task/calendar lifecycle actions.
- Communication log create/edit/delete.
- Document lifecycle actions (upload/version/share/download/toggle client visibility).
- Billing summary and workflow handoff links.
- AI workspace links and review-state indicators.

## State Model

- Default: full matter workspace loaded with sectioned panels/tables.
- Loading: route and section-level loading indicators.
- Empty: section-specific no-data states (participants/tasks/docs/comms).
- Error: section-scoped actionable error blocks.
- Success: timestamped confirmation messages for state-changing actions.

## Interaction Model

- Primary interactions follow explicit user actions (no silent state mutation).
- Mutating actions require deterministic feedback with success/error outcomes.
- Navigation handoffs preserve route context for downstream audit surfaces.

## Review-Gate Behavior

- Generated-output actions surfaced from this workspace must respect:
  - `PROPOSED -> IN REVIEW -> APPROVED -> EXECUTED -> RETURNED`
- Client-facing actions require explicit confirmation and consequence text.
- No auto-send or hidden execution transitions.

## Permissions and Visibility

- Matter access must enforce ethical wall and deny-list policy.
- Actions requiring write privileges hidden/disabled for unauthorized roles.
- Participant and document visibility must respect confidentiality and client-share flags.

## Data and Validation

- Participant operations validate role and side semantics.
- Task/calendar operations validate due/start/end constraints.
- Communication operations validate thread/matter linkage.
- Document operations validate upload security, version targeting, and sharing rules.

## Audit and Traceability

Every state-changing action must expose:
- actor
- action
- timestamp
- affected artifact/entity
- resulting status

Workspace must surface recent action timestamps and review status where applicable.

## Accessibility Requirements

- Full keyboard operability for table actions and section controls.
- Focus-visible on all interactive controls.
- Confirm dialogs and drawers trap/return focus correctly.
- Inline validation explains problem + fix.

## Responsive Requirements

- Desktop/tablet preserve section hierarchy and table readability.
- Compact/tablet uses controlled overflow and drawer behavior without hiding critical actions.
- Unsupported mobile mode follows global shell rule.

## Acceptance Criteria

- Workspace workflow coverage documented for all major sections.
- Review-gate and explicit-approval rules are embedded in interaction requirements.
- Audit visibility requirements are explicit and testable.
- Screen spec linked and maintained.
