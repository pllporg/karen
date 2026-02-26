# Lane A Packet: RC Reliability Hardening

## Branch

`lin/KAR-87-89-94-rc-reliability`

## Scope

1. Stabilize flaky web/api suites and CI determinism.
2. Harden session bootstrap/protected-route behavior when reliability issues are present.
3. Enforce API lint gate behavior and preserve blocking CI semantics.

Mapped requirements:

- `REQ-RC-001`
- `REQ-RC-003`
- `REQ-RC-008`

Mapped Linear keys:

- `KAR-87`
- `KAR-89`
- `KAR-94`

## File Boundary

Allowed:

- `apps/api/**`
- `.github/workflows/ci.yml`
- `apps/web/test/**` (deterministic stabilization only)

Disallowed:

- UX feature changes in `apps/web/app/**` except reliability fixes required by tests.

## Required Validation

```bash
pnpm rc1:lane:a:verify
```

## PR Requirements

1. PR title includes one lane key and references all mapped requirement IDs in body.
2. Include command evidence for lane verification.
3. Include flaky root-cause notes and deterministic fix description.
4. Do not update Linear from this lane.

