# Portal Attachments Verification

Requirement: `REQ-PORTAL-001`  
Scope: verify secure client-portal messaging attachments with auditable upload/link/download controls.

## Verification Coverage

- API regression suite: `apps/api/test/portal.spec.ts`
- Web regression suite: `apps/web/test/portal-page.spec.tsx`

### API hardening checks

- Attachment linking on portal messages remains matter-scoped and shared-with-client constrained.
- Link actions now emit explicit audit events:
  - `portal.attachment.linked`
- Signed download URL issuance now emits explicit audit events:
  - `portal.attachment.download_url_issued`
- Upload controls remain enforced with malware scan gating and upload audit records.

### Web checks

- Portal page flow still verifies:
  - attachment upload
  - attachment linkage on outbound portal message
  - secure download URL retrieval/open behavior

## Commands

- `pnpm --filter api test -- portal.spec.ts`
- `pnpm --filter web test -- portal-page.spec.tsx`

## Result

`REQ-PORTAL-001` is verified with explicit attachment-action auditability and regression coverage for portal attachment security paths.
