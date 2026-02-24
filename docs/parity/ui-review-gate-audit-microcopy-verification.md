# REQ-UI-013 Verification: Review Gates, Audit Visibility, Procedural Microcopy

## Scope

- Issue: `KAR-75`
- Requirement: `REQ-UI-013`
- Canonical references:
  - `docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md`
  - `docs/UI_TOKEN_CONTRACT.md`
  - `lic-design-system/references/interaction-and-ai.md`

## Implementation Summary

- Standardized AI artifact review-gate presentation in AI Workspace:
  - visible gate sequence: `PROPOSED -> IN REVIEW -> APPROVED -> EXECUTED -> RETURNED`
  - explicit gate status badges with deterministic state mapping
  - operator context line showing actor/time metadata (`submitted by`, `review actor/time`)
  - explicit blocking notice for external send/file actions until approval
- Added explicit “return to review” action for AI artifacts (`REJECTED`) alongside approval action.
- Added explicit confirmation gates for client-facing portal actions:
  - portal message send requires modal approval
  - e-sign envelope dispatch requires modal approval
  - both confirmations include consequence text and “Return to Review” cancel path
- Updated regression coverage to lock these behaviors.

## Verification Commands

```bash
pnpm ui:contract:check
pnpm --filter web test -- test/ai-page.spec.tsx test/portal-page.spec.tsx test/confirm-dialog.spec.tsx
pnpm --filter web build
```

## Notes

- No API route changes were required.
- Microcopy remains procedural and avoids non-operational hype language.
