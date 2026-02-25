# Lane B Packet: RC No-ID Workflow Usability

## Branch

`lin/KAR-88-90-rc-no-id-usability`

## Scope

1. Remove raw-ID user input in core billing/documents/AI workflow paths.
2. Replace with selector/lookup driven UX while keeping behavior stable.
3. Preserve LIC UI constraints and accessibility behavior.

Mapped requirements:

- `REQ-RC-002`
- `REQ-RC-004`

Mapped Linear keys:

- `KAR-88`
- `KAR-90`

## File Boundary

Allowed:

- `apps/web/app/**`
- `apps/web/components/**`
- `apps/web/lib/**`
- `apps/api/src/lookups/**` (narrow endpoint additions only)

Disallowed:

- CI workflow edits unless directly required to fix failing tests.

## Required Validation

```bash
pnpm rc1:lane:b:verify
```

## PR Requirements

1. PR title includes one lane key and references both requirement IDs in body.
2. Include before/after no-ID workflow evidence and test command output summary.
3. Include UI interaction checklist + screenshot evidence sections.
4. Do not update Linear from this lane.

