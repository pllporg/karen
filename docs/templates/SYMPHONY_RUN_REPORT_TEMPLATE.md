# Symphony Run Report Template

Use this exact structure when returning a Symphony issue run.

## Issue

- Linear Key: `<KAR-...>`
- Requirement IDs: `<REQ-...>`

## Branch

- `<branch-name>`

## Commit SHA

- `<commit-sha>`

## PR URL

- `<github-pr-url>`

## Handoff Status

- `COMPLETE` or `BLOCKED`
- Blocking Step: `<none | branch | commit | push | pr>`
- Review Ready: `YES` or `NO`

## Files Changed

- `<path>`

## Validation Results

| Command | Result | Notes |
| --- | --- | --- |
| `<command>` | `PASS` / `FAIL` | `<short note>` |

## Known Risks / Follow-ups

1. `<risk or follow-up>`

## Ready-to-Merge Decision

- `READY` or `NOT READY`
- Rationale: `<short rationale>`

Rules:
1. `READY` requires a real GitHub PR URL.
2. If branch/commit/push/PR creation failed, set `Handoff Status` to `BLOCKED` and `Review Ready` to `NO`.
3. Patch bundles or salvage artifacts are fallback evidence only and do not qualify as review-ready handoff on their own.
