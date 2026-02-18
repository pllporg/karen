# Dedupe Merge Verification

Requirement: `REQ-PORT-003`  
Scope: verify dedupe candidate review and merge-confirmation workflow integrity across API + web.

## Verification Coverage

- API regression suite: `apps/api/test/contacts-dedupe.spec.ts`
- Web regression suite: `apps/web/test/contacts-page.spec.tsx`

### API hardening checks

- Rejects self-referential dedupe operations (`primaryId === duplicateId`) for both:
  - `setDedupeDecision`
  - `mergeContacts`
- Merge workflow reassigns high-risk contact references before duplicate deletion, including:
  - `MatterParticipant.contactId`
  - `MatterParticipant.representedByContactId`
  - `MatterParticipant.lawFirmContactId`
  - `CommunicationThread.contactId`
  - `CommunicationParticipant.contactId`
  - `Lead.referralContactId`
  - `LienModel.claimantContactId`
  - `InsuranceClaim.adjusterContactId`
  - `InsuranceClaim.insurerContactId`
  - `ExpertEngagement.expertContactId`
- Audit log emission remains enforced for merge and decision actions.

### Web hardening checks

- Dedupe panel still supports merge/ignore/defer actions and field-diff visibility.
- Merge action now explicitly verifies cancel behavior: if reviewer declines confirmation, no merge POST is sent.

## Commands

- `pnpm --filter api test -- contacts-dedupe.spec.ts`
- `pnpm --filter web test -- contacts-page.spec.tsx`

## Result

`REQ-PORT-003` is verified with explicit guardrails and regression evidence for user-confirmed dedupe merge workflows.
