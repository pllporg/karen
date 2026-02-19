# Access Policy ABAC Verification

Requirement: `REQ-DATA-002`  
Scope: complete composable ABAC hook coverage for matter-level access with explicit reason codes.

## What Was Implemented

- Added reusable access policy contract types in:
  - `apps/api/src/access/access-policy.types.ts`
- Added composable policy evaluation engine in:
  - `apps/api/src/access/access-policy.engine.ts`
- Added matter ABAC policy evaluator with explicit rule chain and reason codes in:
  - `apps/api/src/access/matter-access-policy.evaluator.ts`
- Refactored `AccessService` to:
  - expose `evaluateMatterAccess(...)` returning structured policy evaluation
  - keep `assertMatterAccess(...)` behavior stable while enforcing evaluator decisions
  - return deterministic reason codes (`MATTER_NOT_FOUND`, deny-list, ethical-wall membership/write, admin bypass)

## Policy Coverage

- Deny list precedence (`MATTER_DENY_LIST_MATCH`)
- Ethical wall team-membership gating (`ETHICAL_WALL_TEAM_REQUIRED`)
- Ethical wall write restriction (`ETHICAL_WALL_WRITE_RESTRICTED`)
- Explicit admin bypass (`ROLE_ADMIN_BYPASS`)
- Non-restricted matter allow path (`ETHICAL_WALL_DISABLED`)
- Organization scope miss (`MATTER_NOT_FOUND`)

## Verification Tests

- New unit policy-composition coverage:
  - `apps/api/test/access-policy-evaluator.spec.ts`
- Expanded service-level ethical-wall integration coverage:
  - `apps/api/test/access-ethical-wall.spec.ts`

## Verification Commands

- `pnpm --filter api test -- access-ethical-wall.spec.ts access-policy-evaluator.spec.ts`
- `pnpm --filter api test`
- `pnpm --filter api build`

