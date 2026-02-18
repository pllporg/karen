# Document Automation Verification

Requirement: `REQ-COMM-003`  
Scope: verify DOCX template merge + generated PDF automation with strict validation, provenance tracking, and hardened merge controls.

## Verification Coverage

- API regression suites:
  - `apps/api/test/documents-template-merge.spec.ts`
  - `apps/api/test/documents.spec.ts`

### Merge/generation hardening checks

- DOCX merge context coverage remains in place:
  - matter, participants, contact graph, and custom field graph
  - nested expressions via Docxtemplater parser
- Strict merge validation remains enforced by default:
  - unresolved placeholders fail with `422`
  - explicit `strictValidation=false` supports controlled partial drafts
- Template ingestion hardening now blocks unsupported template source types:
  - non-DOCX template versions are rejected before render
- Merge patch hardening now sanitizes unsafe keys:
  - reserved keys (`__proto__`, `prototype`, `constructor`) are stripped before merge
  - provenance reflects sanitized top-level merge-data keys
- Provenance + audit coverage verified for generated artifacts:
  - DOCX template generation logs `document.template.generated`
  - PDF generation logs `document.pdf.generated`
  - `rawSourcePayload` persists generation provenance metadata for both output types

## Commands

- `pnpm --filter api test -- documents-template-merge.spec.ts`
- `pnpm --filter api test -- documents.spec.ts`
- `pnpm --filter api test`
- `pnpm test`
- `pnpm build`

## Result

`REQ-COMM-003` is verified with hardened template input controls, sanitized merge patch behavior, strict placeholder governance, and audited provenance for generated DOCX/PDF outputs.
