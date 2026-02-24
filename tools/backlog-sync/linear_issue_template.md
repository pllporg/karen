# Linear Parity Task Template

Use this template for manually-created parity tasks so they remain compatible with sync/verification tooling.

```
Requirement ID: REQ-XXX-000
Prompt Section: <Prompt section heading>
Parity Status: Missing|Partial|Complete|Verified
Risk: High|Medium|Low
Component: API|Web|Infra|Data|Integrations|AI
Verification Evidence:
- <link>

## Problem statement
<what is broken/missing and why it matters>

## Requirement excerpt
<exact requirement summary from Prompt-Context>

## Acceptance criteria
- <testable statement 1>
- <testable statement 2>

## API/data/UI impact
<contract, schema, UI, migration impact>

## Design + Interaction Compliance (required for UI-affecting work)
- Canonical source reviewed: `lic-design-system/references/`
- Checklist reviewed: `docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md`
- Compliance notes:
  - <token/typography/layout/interaction confirmations>
  - <exceptions + follow-up ticket if any>

## Security/privacy implications
<auth, data isolation, secrets, compliance impact>

## Definition of done
- <objective completion criteria>
```
