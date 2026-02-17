# REQ-AI-003 Parity Evidence: Style Pack Governance

Requirement: `REQ-AI-003`  
Prompt section: `AI Layer / StylePack + source docs`

## Implemented

- Admin style-pack management API (organization-scoped):
  - `GET /ai/style-packs`
  - `POST /ai/style-packs`
  - `PATCH /ai/style-packs/:id`
  - `POST /ai/style-packs/:id/source-docs`
  - `DELETE /ai/style-packs/:id/source-docs/:documentVersionId`
- Source-doc governance checks:
  - source doc must exist in same organization
  - actor must have matter access for attached source doc
  - add/remove actions are audit logged
- AI job style-pack selection:
  - `POST /ai/jobs` accepts optional `stylePackId`
  - queue payload carries selected style pack
- Provenance persistence:
  - artifact `metadataJson.stylePack` stores selected pack id/name/source doc count
  - `AiExecutionLog.modelParamsJson` stores `stylePackId`, `stylePackName`, source doc count
- Web AI Workspace updates:
  - admin card to create/update style packs and attach/remove source docs
  - job creation form supports style-pack selection
  - artifact panel displays selected style-pack provenance

## Verification

- API tests:
  - `apps/api/test/ai-style-pack.spec.ts`
- Web tests:
  - `apps/web/test/ai-page.spec.tsx`

## Notes

- AI outputs remain draft-only with attorney review requirement unchanged.
- Existing org/matter access boundaries remain enforced for style-pack source attachment.
