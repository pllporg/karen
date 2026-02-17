# REQ-COMM-003 Parity Evidence: Document Automation Merge Coverage

Requirement: `REQ-COMM-003`  
Prompt section: `Document Management + Automation`

## Implemented

- Expanded DOCX merge context generation in `DocumentsService.mergeDocxTemplate`:
  - matter graph (`matter` + stage + matter type)
  - participant/contact graph (`participants`, `contacts.primaryClient`, side-grouped contacts)
  - custom field graph (`customFields.matter`, `customFields.contacts`)
- Enabled nested template expressions (`matter.name`, `contacts.primaryClient.displayName`, etc.) using Docxtemplater expression parsing.
- Added strict placeholder validation before artifact creation:
  - unresolved merge fields are collected during render
  - `strictValidation` defaults to `true`
  - unresolved placeholders now fail with `422` before upload
  - optional bypass for deliberate partial drafts: `strictValidation=false`
- Added generated artifact provenance metadata:
  - persisted in `Document.rawSourcePayload` for DOCX/PDF generated outputs
  - includes template source ids, strict mode, unresolved fields, merge-data keys, context summary, timestamp
- Added generation audit events:
  - `document.template.generated`
  - `document.pdf.generated`

## Verification

- API tests:
  - `apps/api/test/documents-template-merge.spec.ts`
  - existing compatibility tests retained:
    - `apps/api/test/documents.spec.ts`
- Full API + web test pass:
  - `pnpm test`
- Build pass:
  - `pnpm build`

## Notes

- Generated DOCX documents now inherit confidentiality/share defaults from the source template document.
- Endpoint `POST /documents/template-merge` now supports:
  - optional `mergeData`
  - optional `strictValidation` (default `true`)
