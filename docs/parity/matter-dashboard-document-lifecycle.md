# Matter Dashboard Document Lifecycle Verification

Requirement: `REQ-PMS-CORE-006`  
Scope: verify matter-dashboard document lifecycle operations (upload, version upload, client sharing toggle, share-link issuance, signed-download issuance) with matter-scoped access and audit logging.

## Artifact

- API lifecycle updates:
  - `apps/api/src/documents/documents.controller.ts`
  - `apps/api/src/documents/documents.service.ts`
  - `apps/api/src/documents/dto/update-document.dto.ts`
- Web dashboard document workflow:
  - `apps/web/app/matters/[id]/page.tsx`
- Regression tests:
  - `apps/api/test/documents.spec.ts`
  - `apps/web/test/matter-dashboard-page.spec.tsx`

## Verification Coverage

- Matter dashboard document operations:
  - upload new document from matter context (`POST /documents/upload`).
  - upload new version for existing matter document (`POST /documents/:id/versions`).
  - toggle client sharing status (`PATCH /documents/:id` with `sharedWithClient`).
  - generate expiring share link (`POST /documents/:id/share-link`).
  - issue signed download URL for latest version (`GET /documents/versions/:versionId/download-url`).
- Authorization and audit:
  - update/version/share operations are matter-write scoped via `AccessService`.
  - document lifecycle operations emit auditable events (`document.version.uploaded`, `document.updated`, `document.share_link.created`).
- UI behavior:
  - dashboard document card includes actionable controls with explicit feedback messages.
  - row-level version upload controls are keyboard accessible and labeled.

## Verification Commands

- `pnpm --filter api test -- test/documents.spec.ts`
- `pnpm --filter web test -- test/matter-dashboard-page.spec.tsx`
- `pnpm test`
- `pnpm build`
- `pnpm backlog:sync`
- `pnpm backlog:verify`
- `pnpm backlog:snapshot`
- `pnpm backlog:handoff:check`
