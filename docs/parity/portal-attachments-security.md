# Client Portal Attachment Security (REQ-PORTAL-001)

This artifact captures the secure attachment workflow added to the client portal messaging path.

## Scope Delivered

- Clients can upload attachments as part of portal message flow.
- Attachments are stored as `Document` + `DocumentVersion` records with:
  - `sharedWithClient: true`
  - matter linkage to the selected portal-visible matter
- Portal messages can include linked attachment versions.
- Clients can request signed download URLs for portal-visible attachment versions.

## Server-Side Security Controls

- Portal access remains restricted to users whose role is `Client`.
- Client actions are scoped by `MatterParticipant` membership (contact-to-matter link):
  - send message
  - upload attachment
  - request download URL
- Portal attachment linkage validation enforces:
  - attachment version exists in tenant
  - attachment belongs to same matter as message
  - attachment document is marked `sharedWithClient`
- Staff-side communications path is hardened:
  - any `PORTAL_MESSAGE` attachments must be shared-with-client and matter-matched.
- Uploads pass through malware scanning before persistence.
- Signed URLs are issued server-side only after portal visibility checks pass.

## API Endpoints Added/Updated

- `POST /portal/messages`
  - now accepts optional `attachmentVersionIds`.
- `POST /portal/attachments/upload`
  - multipart upload for portal attachment draft creation.
- `GET /portal/attachments/:versionId/download-url`
  - returns signed URL for client-visible attachment versions.

## Test Coverage

- `apps/api/test/portal.spec.ts`
  - client matter-scope enforcement
  - attachment upload persistence semantics
  - signed download URL access constraints
- `apps/api/test/communications-portal-attachments.spec.ts`
  - staff-side portal attachment safety rules
- `apps/web/test/portal-page.spec.tsx`
  - attachment upload -> message link -> secure download UI flow
