# PR Linear Policy Verification

Requirement: `REQ-OPS-003`  
Scope: verify CI enforcement of Linear-key linkage for branch naming, PR titles, and PR metadata.

## Verification Coverage

- Policy regression suite: `apps/api/test/pr-linear-policy.spec.ts`

### Workflow checks

- Confirms `.github/workflows/pr-linear-policy.yml` retains required trigger scope and validation job.
- Confirms policy guards for:
  - branch naming format `lin/<LINEAR_KEY>-<slug>`
  - PR title format `[<LINEAR_KEY>] <title>`
  - required `Linear Issue` and `Requirement ID` sections in PR body
- Validates extracted shell regex patterns still accept/reject representative examples.

### Template checks

- Confirms `.github/pull_request_template.md` retains required governance sections:
  - `Linear Issue`
  - `Requirement ID`
  - acceptance checklist
  - test evidence

## Commands

- `pnpm --filter api test -- pr-linear-policy.spec.ts`

## Result

`REQ-OPS-003` is verified with executable policy-governance coverage that detects accidental weakening of PR linkage controls.
