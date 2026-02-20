# GP-01 Intake-to-Matter Standards

## Table of Contents
- Workflow Intent
- Flow Stages and Gates
- Status Models
- Screen Standards (A-G)
- Functional Requirement Anchors
- Analytics Events
- Design Doctrine

## Workflow Intent

Goal:

- Move a potential client from new lead to active matter through a gated, auditable flow.

Primary users:

- Intake specialist
- Attorney/reviewer

End state:

- Active matter seeded with participants, tasks, and structured setup checklist.

## Flow Stages and Gates

Ordered stages:

1. GP-01-A: Universal Inbox / Intake Queue
2. GP-01-B: Lead Intake Wizard
3. GP-01-C: Lead Detail + AI Intake Summary
4. GP-01-D: Conflict Check
5. GP-01-E: Engagement Letter + eSign
6. GP-01-F: Convert to Matter Wizard
7. GP-01-G: Matter Overview + Setup Checklist

Hard gates:

- Conflict must be resolved before engagement progression.
- Engagement must be signed before conversion.

## Status Models

Lead status lifecycle:

- Draft
- Submitted
- In Review
- Conflict Hold
- Engaged Pending
- Ready to Convert
- Converted

Conflict status examples:

- Not started
- In progress
- Cleared
- Potential conflict
- Confirmed conflict

Engagement status examples:

- Draft
- In Review
- Sent
- Viewed
- Signed
- Declined
- Expired

## Screen Standards (A-G)

### GP-01-A Universal Inbox / Intake Queue

- Use filterable queue table with source/stage/owner indicators.
- Distinguish portal-originated leads visibly.
- Support one-click new lead creation and quick open.

### GP-01-B Lead Intake Wizard

- Use progressive stepper with save-as-draft.
- Support uploads and category suggestions.
- Detect likely duplicate contacts/entities.

### GP-01-C Lead Detail + AI Intake Summary

- Show lead record and AI artifact side-by-side/contextually.
- Mark AI output as draft.
- Include source-linked citations and missing-info actions.

### GP-01-D Conflict Check

- Search across contacts, matters, and organizations.
- Show fuzzy match confidence and match rationale.
- Record outcomes in append-only audit trail.

### GP-01-E Engagement Letter + eSign

- Use template-driven generation with merge fields.
- Capture fee arrangement and recipient review.
- Track eSign status through lifecycle.

### GP-01-F Convert to Matter Wizard

- Capture participant roles, side, and representation links.
- Support participant graph preview.
- Make ethical wall decision explicit and auditable.

### GP-01-G Matter Overview + Setup Checklist

- Seed matter with structured checklist and immediate tasks.
- Deep-link checklist items into relevant setup areas.
- Show completeness as professional progress, not gamification.

## Functional Requirement Anchors

Key requirement groups represented in source manual:

- FR-A1..A4: Queue model, filters, portal differentiation, new lead initiation
- FR-B1..B4: Wizard progression, uploads, dedupe, draft persistence
- FR-C1..C4: Lead detail structure, AI summary, citations, task creation from gaps
- FR-D1..D4: Conflict matching, confidence/rationale, outcomes, append-only audit
- FR-E1..E5: Engagement templating, fee terms, send/sign lifecycle, recipient confirmation
- FR-F1..F4: Participant model/graph and ethical wall handling
- FR-G1..G3: Matter overview, checklist deep-links, completeness indicator

## Analytics Events

Representative events across flow:

- `lead_created`
- `lead_draft_saved`
- `upload_added`
- `ai_intake_summary_run`
- `conflict_check_run`
- `conflict_result_recorded`
- `engagement_generated`
- `engagement_sent`
- `engagement_signed`
- `lead_converted_to_matter`
- `setup_checklist_item_clicked`

## Design Doctrine

- Keep flow linear and gated.
- Keep participant/opposing representation model explicit.
- Keep AI summaries draft-only until attorney review.
- Keep conflict decisions transparent and append-only.
- Keep engagement progression as Draft -> Review -> Finalize/Send.
- Keep save-as-draft available across data-entry steps.
- Keep portal submissions accepted and triaged, not rejected for incompleteness.
- Keep every screen on approved UI kit components; avoid one-off widgets.
