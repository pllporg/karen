# Matter Participant Role Verification

Requirement: `REQ-MAT-001`  
Scope: verify configurable participant-role semantics, counsel/non-counsel constraints, side/default handling, and supported category coverage for construction litigation matters.

## Artifact

- Regression suite: `apps/api/test/matters.spec.ts`

## Verification Coverage

- Role configurability and defaults:
  - role definitions are looked up per organization and applied to participant records.
  - default side values are applied when caller does not provide explicit side.
  - explicit side and `isPrimary` overrides are preserved.
- Counsel/non-counsel constraints:
  - counsel roles reject `representedByContactId`.
  - non-counsel roles reject `lawFirmContactId`.
  - role label fingerprinting enforces counsel semantics even if role key omits `counsel`.
- Identity and reference guards:
  - missing role definitions are rejected.
  - `representedByContactId` and `lawFirmContactId` cannot equal participant `contactId`.
  - referenced contacts are required to exist in the same organization.
- Category matrix coverage:
  - regression matrix validates all prompt-required participant categories (opposing counsel/party, co/local counsel, adjuster, insurer, mediator/arbitrator, judge/court staff, expert, inspector, process server, lien claimant, witness, subcontractor, supplier).

## Verification Commands

- `pnpm --filter api test -- matters.spec.ts`
- `pnpm test`
- `pnpm build`
- `pnpm backlog:sync`
- `pnpm backlog:verify`
- `pnpm backlog:snapshot`
- `pnpm backlog:handoff:check`
