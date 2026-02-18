# Intake Wizard Domain Verification

Requirement: `REQ-MAT-003`  
Scope: verify construction-litigation intake wizard captures required domain sections, enforces required validation gates, supports draft save/resume workflows, and persists domain artifacts into matter records.

## Artifact

- API suite: `apps/api/test/matters.spec.ts`
- Web suite: `apps/web/test/matters-page.spec.tsx`

## Verification Coverage

- Intake validation gates:
  - property address required
  - contract price must be > 0
  - required section arrays enforced (defects/damages/liens/insuranceClaims/expertEngagements)
  - per-item rules validated (e.g., lien claimant info, insurance claim identifiers, expert scope)
- Domain persistence:
  - intake wizard persists property/contract/defects/milestones/damages/liens/insuranceClaims/expertEngagements.
  - matter dashboard domain-completeness indicators reflect populated sections.
- Fallback contact resolution:
  - intake flow creates/reuses contacts from claimant/insurer/adjuster/expert names when IDs are omitted.
  - person vs organization profile creation is verified by contact kind.
- Draft lifecycle:
  - draft save and resume endpoints persist/retrieve payload envelopes.
  - web resume flow repopulates core and domain section fields.
- Full payload composition (web):
  - intake wizard request body includes property, contract, defects, damages, liens, insurance claims, expert engagements, and milestone payload sections.

## Verification Commands

- `pnpm --filter api test -- matters.spec.ts`
- `pnpm --filter web test -- matters-page.spec.tsx`
- `pnpm test`
- `pnpm build`
- `pnpm backlog:sync`
- `pnpm backlog:verify`
- `pnpm backlog:snapshot`
- `pnpm backlog:handoff:check`
