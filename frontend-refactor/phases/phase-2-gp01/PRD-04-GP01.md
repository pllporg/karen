# PRD-04: GP-01 Intake-to-Matter Workflow Rebuild

> **Phase:** 2 — GP-01
> **Branch:** `refactor/prd-04-gp01`
> **Dependencies:** PRD-01 (components), PRD-02 (hooks), PRD-03 (forms)
> **Parallel with:** PRD-05 (page overhaul)
> **Cross-reference:** `lic-design-system/references/gp01-flow.md` — the authoritative flow spec

---

## Objective

Completely rebuild the GP-01 intake-to-matter workflow. This is the primary operational
pipeline of the application. The current implementation is skeletal — the intake wizard
renders `Object.entries(form)` as a generic table, and every stage page is ~50 lines with
hardcoded defaults. The target is a fully gated, auditable workflow matching the screen
specifications in `gp01-flow.md`.

---

## Current State vs Target

| Screen | Current Lines | Current Reality | Target |
|--------|-------------|-----------------|--------|
| GP-01-A: Intake Queue | 67 | Basic table, no filters | Filterable table with tabs, pagination, search |
| GP-01-B: Intake Wizard | 47 | Object.entries() as table | 5-step stepper wizard with auto-save |
| GP-01-C: Lead Detail | 0 | Not implemented | Two-column lead + AI summary with tabs |
| GP-01-D: Conflict Check | 50 | One textarea, two buttons | Match results table, audit trail, gate |
| GP-01-E: Engagement | 48 | Raw template ID input | Template picker, merge preview, eSign lifecycle |
| GP-01-F: Convert | 61 | Three text inputs | Checklist, participants, ethical wall |
| GP-01-G: Matter Setup | 0 | Not implemented | Setup checklist with deep links |

---

## Screen Specifications

### GP-01-A: Intake Queue

**File to rewrite:** `app/intake/page.tsx`
**New file:** `components/intake/intake-queue-filters.tsx`

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│ PageHeader: "Intake Queue"           [+ New Lead]    │
├──────────────────────────────────────────────────────┤
│ [All] [New] [In Review] [Conflict Hold] [Ready]      │
│ ┌─────────────────────────────────────────────────┐  │
│ │ Search: [________________________] [Filter ▼]   │  │
│ ├─────────────────────────────────────────────────┤  │
│ │ LEAD       SOURCE    STAGE   TYPE  ATTY  ACTION │  │
│ │ ─────────────────────────────────────────────── │  │
│ │ Smith J.   ◆Portal   NEW     CD    KL    [Open] │  │
│ │ Doe Corp   Referral  REVIEW  CL    MR    [Open] │  │
│ │ ...                                             │  │
│ ├─────────────────────────────────────────────────┤  │
│ │ Showing 1–25 of 142         [< 1 2 3 ... 6 >]  │  │
│ └─────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

**Data hook:** `useLeads(filters)` from PRD-02
**Filter tabs:** Implemented as tab-style navigation. Active tab has Institutional Blue underline.
**Portal indicator:** ◆ glyph before source text for leads where `isPortalOrigin === true`.
**Columns:** LEAD (name + truncated ID), SOURCE, STAGE (Badge component), TYPE, ATTORNEY, CREATED (relative time), NEXT ACTION (Button, ghost tone).
**Pagination:** Bottom bar with count text and page buttons. 25 items per page.
**Search:** Text filter across lead name, source, attorney. Debounced at 300ms.
**Empty state:** "No leads match the current filter." with "Create Lead" action.
**Loading state:** `<LoadingState />` in table body area.

**New Lead button:** Links to `/intake/new` (keep existing page, but rewrite with react-hook-form per PRD-03).

### GP-01-B: Intake Wizard

**File to rewrite:** `app/intake/[leadId]/intake/page.tsx`
**New files:**
- `components/intake/wizard-step-client.tsx`
- `components/intake/wizard-step-property.tsx`
- `components/intake/wizard-step-dispute.tsx`
- `components/intake/wizard-step-uploads.tsx`
- `components/intake/wizard-step-review.tsx`
- `components/intake/duplicate-alert.tsx`
- `components/intake/upload-dropzone.tsx`

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│ PageHeader: "Lead Intake"   [Draft saved 2m ago]     │
├──────────────────────────────────────────────────────┤
│ Stepper: [1·CLIENT] ── [2·PROPERTY] ── [3·DISPUTE]  │
│          ── [4·UPLOADS] ── [5·REVIEW]                │
├──────────────────────────────────────────────────────┤
│ Step content area (one step visible at a time)       │
│                                                       │
│ ┌─ Step 1: CLIENT ──────────────────────────────┐    │
│ │ First Name*  [____________]                    │    │
│ │ Last Name*   [____________]                    │    │
│ │ Email*       [____________]                    │    │
│ │ Phone        [____________]                    │    │
│ │ Company      [____________]                    │    │
│ │ Role         [____________]                    │    │
│ │                                                │    │
│ │ ⚠ Potential duplicate: "John Smith" (87%)     │    │
│ │   [Link to Existing] [Create New Contact]      │    │
│ └────────────────────────────────────────────────┘    │
│                                                       │
├──────────────────────────────────────────────────────┤
│                    [Back]  [Save Draft]  [Continue →] │
└──────────────────────────────────────────────────────┘
```

**Stepper:** Use `<Stepper>` from PRD-01. Steps are gated — can go back, not forward past current.
**Step navigation:** "Continue" validates current step schema. If valid, save draft and advance. If invalid, show errors. "Back" saves current state (no validation) and retreats.
**Auto-save:** On step transition, call `createIntakeDraft(leadId, currentFormData)`. Show "Draft saved [time]" badge in PageHeader right area.
**Step forms:** Each step is a separate component with its own Zod schema from PRD-03.

**Step 1 — Client:**
- Fields: firstName*, lastName*, email*, phone, company, role
- Schema: `intakeClientSchema`
- Layout: `.form-grid-2` for name fields, single column for rest
- Duplicate detection: On blur of firstName + lastName or email, call `GET /contacts/search?q={name}`. If matches found, render `<DuplicateAlert>` with confidence %, match rationale, and "Link to Existing" / "Create New" actions.

**Step 2 — Property:**
- Fields: addressLine1*, city*, state*, zip*, parcelNumber, propertyType (select), yearBuilt
- Schema: `intakePropertySchema`
- Layout: addressLine1 full width, city/state/zip in `.form-grid-3`, parcelNumber/type/year in `.form-grid-3`

**Step 3 — Dispute:**
- Fields: contractDate, contractPrice, defects[] (repeatable), damages[] (repeatable)
- Schema: `intakeDisputeSchema`
- Repeatable fields: "Add defect" / "Add damage" buttons append empty rows. Each row has a remove button.
- Layout: date/price in `.form-grid-2`, then defects table, then damages table

**Step 4 — Uploads:**
- Upload dropzone: Dashed 2px Fog border area. Accepts drag-and-drop or click-to-browse.
- File list: Table with columns: FILE, SIZE, CATEGORY (select dropdown), STATUS (● indicator)
  - Uploading: Institutional Blue dot
  - Complete: Ledger Green dot
  - Error: Filing Red dot
- Category suggestions: After upload, suggest category based on file name/type
- Maximum file size: 50MB (validate client-side before upload)

**Step 5 — Review:**
- Read-only summary of all steps using `<KVStack>` from PRD-01
- Grouped by step: Client, Property, Dispute, Uploads
- Each section has "Edit" link that navigates back to that step
- Files listed as table
- Final "Submit Intake" button at bottom

### GP-01-C: Lead Detail + AI Summary

**New file:** `app/intake/[leadId]/detail/page.tsx`
**New files:**
- `components/intake/lead-detail-record.tsx`
- `components/intake/ai-summary-panel.tsx`

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│ PageHeader: "Lead: Smith, John"    [Stage: IN_REVIEW]│
├──────────────────────────────────────────────────────┤
│ StageNav: [Intake ✓] [Conflict ●] [Engage] [Convert]│
├──────────────────────────────────────────────────────┤
│ Tabs: [Overview] [Documents] [Timeline] [Activity]   │
├────────────────────────────┬─────────────────────────┤
│ LEAD RECORD               │ AI INTAKE SUMMARY        │
│                            │                          │
│ CLIENT                     │ ┌─ DRAFT ────────────┐  │
│ Name: John Smith           │ │ Auto-generated      │  │
│ Email: j@smith.com         │ │ summary of intake   │  │
│ Phone: 555-0100            │ │ data with citations │  │
│                            │ │ to source documents │  │
│ PROPERTY                   │ │                     │  │
│ 123 Main St               │ │ [1] Contract shows  │  │
│ Springfield, IL 62701      │ │ price of $450K      │  │
│                            │ │                     │  │
│ DISPUTE                    │ │ ⚠ Missing info:    │  │
│ Contract: $450,000         │ │ - Opposing counsel  │  │
│ Defects: 3 items           │ │ - Insurance policy  │  │
│                            │ │                     │  │
│ UPLOADS                    │ │ [Mark as Reviewed]  │  │
│ 5 files attached           │ └────────────────────┘  │
├────────────────────────────┴─────────────────────────┤
│ [Proceed to Conflict Check →]                        │
└──────────────────────────────────────────────────────┘
```

**Left column (60%):** `<LeadDetailRecord>` — `<KVStack>` groups for each intake section.
**Right column (40%):** `<AISummaryPanel>` — Card with prominent "DRAFT" badge (Brand Doc: AI outputs are always DRAFT until attorney review). Contains:
- Auto-generated summary text
- Source-linked citations (numbered references to uploaded documents)
- Missing info list: actionable items that link back to relevant wizard steps
- "Mark as Reviewed" button: changes AI summary status to REVIEWED

**Tabs:** Overview (default, shown above) | Documents (file list) | Timeline (activity log) | Activity (audit events)

### GP-01-D: Conflict Check

**File to rewrite:** `app/intake/[leadId]/conflict/page.tsx`
**New files:**
- `components/intake/conflict-results-table.tsx`
- `components/intake/conflict-audit-trail.tsx`

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│ PageHeader: "Conflict Check"                         │
├──────────────────────────────────────────────────────┤
│ StageNav: [Intake ✓] [Conflict ●] [Engage] [Convert]│
├──────────────────────────────────────────────────────┤
│ QUERY                                                │
│ Pre-populated: "John Smith, Springfield IL, ..."     │
│ [__________________________ textarea ___]  [Run]     │
├──────────────────────────────────────────────────────┤
│ RESULTS                          Last run: 2m ago    │
│ ┌──────────────────────────────────────────────────┐ │
│ │ ENTITY     TYPE      MATCH    RATIONALE  RESOLVE │ │
│ │ ─────────────────────────────────────────────────│ │
│ │ Smith LLC  Contact   92%      Name+addr  [▼]    │ │
│ │ Smith J.   Matter    67%      Name only  [▼]    │ │
│ │ ...                                             │ │
│ └──────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────┤
│ AUDIT TRAIL (append-only)                            │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 2026-03-01 14:22  Check run by KL  2 matches    │ │
│ │ 2026-03-01 14:25  Smith LLC cleared by KL       │ │
│ │   Notes: "Different entity, confirmed with ..."  │ │
│ └──────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────┤
│ Gate: All conflicts must be resolved to proceed.     │
│ [Proceed to Engagement →]  (disabled if unresolved)  │
└──────────────────────────────────────────────────────┘
```

**Query:** Pre-populated from lead data (client name + property address + any opposing parties). Editable textarea.
**Run button:** Calls `runConflictCheck(leadId, queryText)`. Shows loading state in results area.
**Results table:** Columns: ENTITY, TYPE (Contact/Matter/Organization), MATCH CONFIDENCE (%), RATIONALE (text), RESOLVE (dropdown).
**Resolve dropdown per row:** Options: "Clear" / "Potential Conflict" / "Confirmed Conflict". Each resolution requires a notes field (required for Potential/Confirmed, optional for Clear). Clicking resolve calls `resolveConflict(leadId, ...)`.
**Audit trail:** Append-only timeline. Cannot edit or delete entries. Shows timestamp, actor, action, and notes. Rendered as a vertical timeline with 1px Fog left border.
**Gate:** "Proceed to Engagement" button is disabled (with tooltip: "Resolve all conflicts first") until every result row has a resolution AND no "Confirmed Conflict" resolutions exist.

### GP-01-E: Engagement Letter + eSign

**File to rewrite:** `app/intake/[leadId]/engagement/page.tsx`
**New files:**
- `components/intake/template-picker.tsx`
- `components/intake/engagement-preview.tsx`
- `components/intake/esign-status-tracker.tsx`
- `components/intake/fee-arrangement-form.tsx`

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│ PageHeader: "Engagement Letter"                      │
├──────────────────────────────────────────────────────┤
│ StageNav: [Intake ✓] [Conflict ✓] [Engage ●] [Conv] │
├──────────────────────────────────────────────────────┤
│ TEMPLATE                                             │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│ │ Standard │ │ Conting.  │ │ Flat Fee │              │
│ │ Hourly   │ │ 33%/40%  │ │ Fixed    │              │
│ │    ●     │ │          │ │          │              │
│ └──────────┘ └──────────┘ └──────────┘              │
├──────────────────────────────────────────────────────┤
│ FEE ARRANGEMENT                                      │
│ Fee Type*    [Hourly ▼]                              │
│ Rate         [$350 /hr]                              │
│ Retainer     [$5,000   ]                             │
├──────────────────────────────────────────────────────┤
│ RECIPIENT                                            │
│ Name*        [John Smith]  (pre-populated from lead) │
│ Email*       [j@smith.com]                           │
│ + Add secondary recipient                            │
├──────────────────────────────────────────────────────┤
│ [Generate Engagement Letter]                         │
│                                                       │
│ ENVELOPE STATUS                                      │
│ ○ Draft → ○ In Review → ● Sent → ○ Viewed → ○ Signed│
│                                                       │
│ Gate: Engagement must be signed to proceed.           │
│ [Proceed to Convert →]  (disabled until Signed)      │
└──────────────────────────────────────────────────────┘
```

**Template picker:** Card-style selection (not a dropdown). Each template is a selectable card with radio-button behavior. Selected card: 2px Institutional border.
**Fee arrangement:** react-hook-form with `generateEngagementSchema`. Fee type is a Select. Rate and Retainer are number Inputs.
**Recipient:** Pre-populated from lead client data. Editable. "Add secondary recipient" appends a name/email row.
**Generate button:** Calls `generateEngagement(leadId, templateId)`. Returns envelope data. After generation, show the eSign status tracker.
**eSign status tracker:** Horizontal pipeline: Draft → In Review → Sent → Viewed → Signed (or Declined / Expired). Active stage: Institutional Blue filled circle. Completed: Ink filled circle. Pending: Paper circle with Fog border. Failed states (Declined/Expired): Filing Red.
**Gate:** "Proceed to Convert" disabled until engagement status is SIGNED.

### GP-01-F: Convert to Matter

**File to rewrite:** `app/intake/[leadId]/convert/page.tsx`
**New files:**
- `components/intake/setup-checklist-visual.tsx`
- `components/intake/participant-editor.tsx`
- `components/intake/participant-graph.tsx`
- `components/intake/ethical-wall-toggle.tsx`

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│ PageHeader: "Convert to Matter"                      │
├──────────────────────────────────────────────────────┤
│ StageNav: [Intake ✓] [Conflict ✓] [Engage ✓] [●Conv]│
├──────────────────────────────────────────────────────┤
│ SETUP CHECKLIST                                      │
│ ✓ Intake Draft Complete                              │
│ ✓ Conflicts Resolved                                 │
│ ✓ Engagement Signed                                  │
│ ● Ready to Convert                                   │
├──────────────────────────────────────────────────────┤
│ MATTER DETAILS                                       │
│ Name*         [Smith v. ABC Builders  ]              │
│ Number*       [M-2026-0047        ] (auto-generated) │
│ Practice Area [Construction Lit. ▼]                  │
│ Case Type     [Residential ▼      ]                  │
├──────────────────────────────────────────────────────┤
│ PARTICIPANTS                                         │
│ ┌──────────────────────────────────────────────────┐ │
│ │ NAME          ROLE        SIDE        ACTIONS    │ │
│ │ John Smith    Client      Plaintiff   [✕]        │ │
│ │ ABC Builders  Opp. Party  Defendant   [✕]        │ │
│ │ [+ Add Participant]                              │ │
│ └──────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────┤
│ ETHICAL WALL                                         │
│ [ ] Apply ethical wall to this matter                │
│ Notes: [________________________________]            │
├──────────────────────────────────────────────────────┤
│ [Convert Lead to Matter]                             │
│ (requires all checklist items ✓)                     │
└──────────────────────────────────────────────────────┘
```

**Setup checklist:** Visual checklist using `<SetupChecklistVisual>`. Data from `getSetupChecklist(leadId)`. Each item: ✓ (Ledger) or ● (Institutional) with label.
**Matter fields:** react-hook-form with `convertLeadSchema`. Name pre-populated from lead. Number auto-generated (editable). Practice area and case type are Select dropdowns.
**Participants:** Editable table. Pre-seeded from lead client data. Each row: name (text), role (select: Client, Opposing Party, Opposing Counsel, Expert, Witness, etc.), side (select: Plaintiff, Defendant, Neutral). "Add Participant" appends row. Remove button on each row.
**Ethical wall:** Checkbox + notes textarea. Decision is auditable — recorded in matter creation payload.
**Convert button:** Calls `convertLead(leadId, payload)`. Disabled if any checklist item is incomplete. On success, redirect to `/matters/[newMatterId]`.

### GP-01-G: Matter Overview + Setup Checklist

This is the landing page after conversion. Handled as part of the Matter detail rewrite in PRD-05. The matter detail overview tab shows:
- Matter header (name, number, status, practice area)
- Setup checklist with deep links to configuration areas
- Completeness indicator: "4 of 12 items complete" with progress bar

### Stage Navigation (Shared)

**File to rewrite:** `components/intake/stage-nav.tsx`

Replace the current flat link table with the `<Stepper>` component from PRD-01.

**Steps:** Intake (1) → Conflict (2) → Engagement (3) → Convert (4)
**Gate enforcement:**
- Each step's status comes from lead data: `useLead(leadId)` provides stage
- DRAFT/SUBMITTED: Only step 1 accessible
- IN_REVIEW: Steps 1–2 accessible
- CONFLICT_HOLD: Steps 1–2 accessible, step 3 blocked
- ENGAGED_PENDING: Steps 1–3 accessible
- READY_TO_CONVERT: Steps 1–4 accessible
- CONVERTED: All complete

Clicking a locked step shows tooltip: "Complete [previous step] first."

---

## New Lead Page Rewrite

**File:** `app/intake/new/page.tsx`

Current: 39 lines, no validation, hardcoded defaults.

Rewrite with react-hook-form + `createLeadSchema`:
- Source field: Select dropdown (Website Form, Referral, Portal, Phone, Walk-in)
- Notes field: Textarea, optional
- Submit: Calls `useCreateLead()` mutation. On success, redirect to `/intake/[newLeadId]/intake` (the wizard).
- Error: Toast notification on failure.

---

## Acceptance Criteria

- [ ] A lead can be created from `/intake/new` with validated form
- [ ] Intake queue shows filterable, paginated table with search
- [ ] Queue filter tabs correctly filter by stage
- [ ] Portal-originated leads show ◆ indicator
- [ ] Intake wizard has 5 functional steps with Stepper navigation
- [ ] Each wizard step validates its own schema on "Continue"
- [ ] Drafts auto-save on step transitions
- [ ] "Draft saved" timestamp shows in page header
- [ ] Duplicate detection fires on client name/email blur
- [ ] Duplicate alert shows confidence and link/create options
- [ ] File upload dropzone accepts drag-and-drop
- [ ] Uploaded files show in table with status indicators
- [ ] Review step shows read-only summary with edit links
- [ ] Lead detail page shows two-column layout with AI summary
- [ ] AI summary has prominent DRAFT badge
- [ ] Conflict check pre-populates query from lead data
- [ ] Conflict results render in table with confidence %
- [ ] Each conflict result has resolution dropdown + notes
- [ ] Audit trail is append-only and visible
- [ ] Engagement cannot proceed until all conflicts resolved
- [ ] Template picker renders selectable cards
- [ ] Fee arrangement form validates with Zod
- [ ] eSign status tracker shows lifecycle pipeline
- [ ] Conversion cannot proceed until engagement is SIGNED
- [ ] Conversion pre-seeds participants from lead data
- [ ] Ethical wall toggle records decision
- [ ] Successful conversion redirects to new matter
- [ ] Stage navigation enforces gating based on lead stage
- [ ] ALL screens use PRD-01 components, PRD-02 hooks, PRD-03 forms
- [ ] Zero inline `style={{}}` in any file
- [ ] No file exceeds 400 lines
- [ ] `pnpm --filter web test` passes
- [ ] `pnpm --filter web build` succeeds
