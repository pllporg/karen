# RC-1 Parallel Delivery Playbook

This playbook operationalizes RC-1 as two parallel Codex Cloud lanes with local orchestration.

## Operating Decisions

1. Parallelism: 2 concurrent lanes.
2. Linear authority: local orchestrator only.
3. Merge policy: merge as green.
4. Wave 1 lanes: reliability + usability.

## Lane Assignments (Wave 1)

### Lane A: Reliability Hardening

- Requirements: `REQ-RC-001`, `REQ-RC-003`, `REQ-RC-008`
- Linear keys: `KAR-87`, `KAR-89`, `KAR-94`
- Ownership boundary:
  - `apps/api/**`
  - `.github/workflows/ci.yml`
  - `apps/web/test/**` (deterministic stabilization only)
  - No UX feature work
- Lane validation command:

```bash
pnpm rc1:lane:a:verify
```

### Lane B: No-ID Workflow Usability

- Requirements: `REQ-RC-002`, `REQ-RC-004`
- Linear keys: `KAR-88`, `KAR-90`
- Ownership boundary:
  - `apps/web/app/**`
  - `apps/web/components/**`
  - `apps/web/lib/**`
  - `apps/api/src/lookups/**` (narrow additions only)
  - No CI workflow edits unless required by failing tests
- Lane validation command:

```bash
pnpm rc1:lane:b:verify
```

## Merge and Governance Protocol

1. Merge each lane PR when required checks are green.
2. Required checks:
   - `api-test`
   - `web-test`
   - `build`
   - `validate-linear-linkage`
   - `handoff-freshness`
   - UI gates when UI files changed
3. After merge, local orchestrator runs:

```bash
pnpm rc1:orchestrator:post-merge
```

4. Conflict rule:
   - If both lanes touch same file, Lane B rebases on latest `main`.
   - Reliability changes to CI/test infrastructure take precedence.

## Wave 2 Queue

1. Lane A next: `REQ-RC-005`, `REQ-RC-006`
2. Lane B next: `REQ-RC-007`, `REQ-RC-010`
3. Final gate lane: `REQ-RC-009`, `REQ-RC-011`

## Public Interface Constraints

1. No breaking API changes in Wave 1.
2. New usability endpoints should stay under `/lookups/*` and remain backward compatible.
3. Any new endpoint must be OpenAPI-visible and covered by tests.

## Acceptance Criteria

### Reliability

1. Repeated-run stability for `core-workflow-e2e` and `matter-dashboard-page`.
2. No unhandled promise rejections or timeout flakes in CI logs.
3. API lint violations are enforced as blocking.

### Usability

1. Core attorney/paralegal/billing workflows run without raw IDs.
2. Matter, billing, documents, and AI flows complete using selectors/lookups.
3. Regression tests cover no-ID success and validation error states.

### Governance

1. Linear issue evidence is present for each merged requirement.
2. Mirror verification reports no missing/orphan parity issues.

