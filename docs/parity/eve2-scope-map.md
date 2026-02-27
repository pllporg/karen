# Eve 2.0 Scope Map

## Scope Baseline

- Baseline branch for planning: `main` (committed state).
- Source page: `https://www.eve.legal/eve-2`.
- Source metadata captured during intake: last publish indicates **February 25, 2026 (UTC)**.
- Backlog intake target: `REQ-EVE2-001` through `REQ-EVE2-011` (`phase-1`, `parityStatus=Missing`).

## Source-to-Requirement Traceability

| Eve 2 Domain | Source Theme | Requirement IDs | Epic |
| --- | --- | --- | --- |
| Agents | Client engagement intake + staged lead progression | `REQ-EVE2-001`, `REQ-EVE2-002` | `PARITY-12` |
| Agents | Human-in-the-loop orchestration and review lifecycle | `REQ-EVE2-003` | `PARITY-12` |
| Agents | Proactive case-work and engagement next-actions | `REQ-EVE2-004` | `PARITY-12` |
| Auditor | Missed-value signal detection with citations | `REQ-EVE2-005` | `PARITY-13` |
| Auditor | Movement risk detection (staleness, deadline/statute risk) | `REQ-EVE2-006` | `PARITY-13` |
| Auditor | Daily operations queue with review drawer | `REQ-EVE2-007` | `PARITY-13` |
| Auditor | Continuous monitoring via scheduled scan/dispatch | `REQ-EVE2-008` | `PARITY-13` |
| Analyst | Metrics pipeline (cycle time, turnaround, capacity, referral, value) | `REQ-EVE2-009` | `PARITY-14` |
| Analyst | Insight APIs + CSV exports | `REQ-EVE2-010` | `PARITY-14` |
| Analyst | Table-first analyst dashboard route | `REQ-EVE2-011` | `PARITY-14` |

## Planned Public Surface Coverage

- Intake + lead lifecycle: `/leads` + staged intake routes.
- Agent orchestration: `AgentRun`, `AgentStep`, `AgentProposal` with review-gate states.
- Auditor signals: signal scan/review endpoints and queue UX.
- Analyst intelligence: analyst metrics APIs, CSV export, and `/analyst` route.

## Governance Constraints

- No automatic client-facing execution.
- Mutation proposals remain gated by explicit approval.
- New event families to capture in audit logs:
  - `agent.run.*`
  - `agent.proposal.*`
  - `auditor.signal.*`
  - `analyst.snapshot.*`
