# Style Pack Verification

Requirement: `REQ-AI-003`  
Scope: verify style-pack governance controls for source-document attachment lifecycle and AI provenance persistence.

## Verification Coverage

- API regression suite: `apps/api/test/ai-style-pack.spec.ts`
- Web regression suite: `apps/web/test/ai-page.spec.tsx`

### API hardening checks

- Style-pack source detach path now enforces matter access before unlinking source docs.
- Detach audit event now records full provenance metadata:
  - `documentVersionId`
  - `documentId`
  - `matterId`
- Detach flow rejects unknown source links with deterministic `NotFound` behavior.
- Existing provenance checks remain in place:
  - selected style pack recorded in artifact metadata
  - selected style pack recorded in execution model params

### Web checks

- AI workspace continues to verify full style-pack management lifecycle:
  - create
  - update
  - source doc attach
  - source doc detach
- AI job creation continues to include selected `stylePackId`.

## Commands

- `pnpm --filter api test -- ai-style-pack.spec.ts`
- `pnpm --filter web test -- ai-page.spec.tsx`

## Result

`REQ-AI-003` is verified with explicit detach authorization + provenance auditing and maintained style-pack provenance traceability in AI artifacts/execution logs.
