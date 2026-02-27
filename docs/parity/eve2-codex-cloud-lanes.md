# Eve 2.0 Codex Cloud Lane Prompts

Use one worker per lane. Keep all work on committed `main` baseline and follow LIC UI rules in `AGENTS.md`.

## Lane 1: GP01 Intake Core (Web + API)

```text
Implement REQ-EVE2-001 and REQ-EVE2-002 from requirements.matrix.json.

Scope:
- Build `/intake` flow routes:
  - `/intake`
  - `/intake/new`
  - `/intake/[leadId]/intake`
  - `/intake/[leadId]/conflict`
  - `/intake/[leadId]/engagement`
  - `/intake/[leadId]/convert`
- Add Leads API:
  - GET/POST `/leads`
  - GET/PATCH `/leads/:id`
  - POST `/leads/:id/intake-drafts`
  - POST `/leads/:id/conflict-check`
  - POST `/leads/:id/conflict-resolution`
  - POST `/leads/:id/engagement/generate`
  - POST `/leads/:id/engagement/send`
  - POST `/leads/:id/convert`
  - GET `/leads/:id/setup-checklist`
- Enforce gates:
  - Cannot send engagement while conflict unresolved.
  - Cannot convert before engagement signed.
- Keep `/matters/intake-wizard` as compatibility adapter.

Constraints:
- Table-first UX, drawer-based review, focus-visible on all interactives.
- No auto-send to client actions.
- Emit audit events on state mutations.

Validation:
- Run lint, typecheck, unit/integration tests for new routes and APIs.
- Add gate enforcement tests and happy-path GP01 test.

Deliverables:
- PR-sized commit(s)
- before/after summary
- touched file list
- test results
```

## Lane 2: Agentic Engine + Review Gate

```text
Implement REQ-EVE2-003 and REQ-EVE2-004 from requirements.matrix.json.

Scope:
- Add models/entities:
  - AgentRun
  - AgentStep
  - AgentProposal
- Add statuses:
  - PROPOSED -> IN REVIEW -> APPROVED -> EXECUTED | RETURNED
- Build orchestration flow:
  - planner -> step executor -> proposal creation
  - no mutating action executes without APPROVED status
- Add endpoints:
  - GET/POST `/ai/agent-runs`
  - GET `/ai/agent-runs/:id`
  - POST `/ai/agent-runs/:id/review`
- Implement proactive proposal triggers for intake and lifecycle next-actions.

Constraints:
- Typed tool registry with explicit side-effect boundaries.
- Every proposal/action has provenance and audit events (`agent.run.*`, `agent.proposal.*`).

Validation:
- Unit tests for state machine transitions.
- Integration test: mutation blocked until APPROVED.

Deliverables:
- PR-sized commit(s)
- schema/API change notes
- test results
```

## Lane 3: Auditor (Signals + Queue + Scan)

```text
Implement REQ-EVE2-005, REQ-EVE2-006, REQ-EVE2-007, REQ-EVE2-008.

Scope:
- Add `MatterAuditSignal` model with severity, citations, stale/deadline metadata, resolution state.
- Build signal generation:
  - missed-value indicators with citations
  - staleness/deadline/statute-risk checks
- Add APIs:
  - GET `/auditor/signals`
  - POST `/auditor/scan`
  - POST `/auditor/signals/:id/review`
- Build `/auditor` UI:
  - table-first queue
  - review drawer
  - approve/return/execute actions
- Add scheduled scan with idempotency controls and notifications.

Constraints:
- Deterministic signal generation on fixture timestamps.
- Audit events on every state change (`auditor.signal.*`).

Validation:
- Tests for deterministic stale/deadline signals.
- Accessibility checks for `/auditor` states and keyboard flow.

Deliverables:
- PR-sized commit(s)
- ops notes for scheduler/idempotency keys
- test results
```

## Lane 4: Analyst (Metrics + APIs + Dashboard)

```text
Implement REQ-EVE2-009, REQ-EVE2-010, REQ-EVE2-011.

Scope:
- Add `AnalystMetricSnapshot` model (tenant-scoped periodic aggregates).
- Build metrics pipeline:
  - cycle time
  - turnaround
  - capacity
  - referral
  - value
- Add APIs:
  - GET `/reporting/analyst/bottlenecks`
  - GET `/reporting/analyst/capacity`
  - GET `/reporting/analyst/growth`
  - GET `/reporting/analyst/csv`
- Build `/analyst` UI with table-first drilldowns and exports.

Constraints:
- Reproducible metrics from seeded fixture data.
- Audit events for snapshot generation (`analyst.snapshot.*`).

Validation:
- Aggregation reproducibility tests.
- CSV export correctness tests.
- Accessibility checks for `/analyst` states and keyboard flow.

Deliverables:
- PR-sized commit(s)
- API contract summary
- test results
```

## Engineering Manager Integration Rules

```text
1. Do not edit requirements IDs or parity labels.
2. Keep changes isolated to lane scope; no cross-lane refactors unless blocking.
3. Rebase frequently on main; resolve schema conflicts explicitly.
4. Include migration/backward-compat notes in every lane output.
5. Report blockers with file path + exact failing command/error.
```
