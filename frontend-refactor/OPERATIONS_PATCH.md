# Operations Document Patches

> These are changes to make to existing operational documents so they recognize
> the frontend refactoring initiative within the established doc hierarchy.

---

## 1. Patch: `docs/PROMPT_CANONICAL_SOURCES.md`

Add the following entry AFTER the `lic-design-system/references/` entry and BEFORE `AGENTS.md`:

```markdown
7. `docs/frontend-refactor/INSTRUCTIONS.md` — Frontend refactoring execution authority.
   Governs implementation approach for all `apps/web/` changes during the refactoring initiative.
   Subordinate to UI_CANONICAL_PRECEDENCE and lic-design-system references for visual/interaction conflicts.
   Contains phase-sequenced PRDs with acceptance criteria, file lists, and reference implementations.
```

---

## 2. Patch: `docs/ACTIVE_PHASES.md`

Add a new phase entry:

```markdown
## FE-REFACTOR: Active

**Scope:** `apps/web/` frontend rebuild
**Authority:** `docs/frontend-refactor/INSTRUCTIONS.md`
**Phases:**
- Phase 0 (Foundation): PRD-01 Components + PRD-02 Data Layer
- Phase 1 (Forms): PRD-03 Form System
- Phase 2 (GP-01): PRD-04 Workflow Rebuild
- Phase 3 (Pages): PRD-05 Page Overhaul
- Phase 4 (Polish): PRD-06 Accessibility + PRD-07 Performance

**Constraint:** Phase N must complete before Phase N+1 begins.
Exception: PRD-04 and PRD-05 may run in parallel after Phase 1 completes.

**Validation:** `pnpm --filter web test && pnpm --filter web build` after every PRD.
```

---

## 3. Patch: `docs/SESSION_HANDOFF.md`

Add to the "Open Operational Conflicts" section:

```markdown
- **FE-REFACTOR initiative active.** Frontend is being rebuilt phase-by-phase.
  Current phase: [UPDATE THIS AS PHASES COMPLETE].
  All `apps/web/` PRs should reference the applicable PRD in `docs/frontend-refactor/phases/`.
  Backend API unchanged — no coordination required with API lanes.
```

---

## 4. Patch: `docs/WORKING_CONTRACT.md`

Add the following invariant:

```markdown
### Frontend Refactoring Invariants

- Every `apps/web/` component and page must use CSS classes from `globals.css` and tokens
  from `lic-tokens.css`. Inline `style={{}}` attributes are prohibited.
- Every API-consuming view must use a custom hook from `lib/hooks/` and render
  LoadingState / ErrorState / EmptyState appropriately.
- Every form must use react-hook-form with a Zod schema from `lib/schemas/`.
- The component inventory in `components/ui/` is the closed parts list per
  `lic-design-system/references/ui-kit.md`. No ad-hoc component creation.
```

---

## 5. Patch: `agents.md`

Add to the "Engineering rules" section:

```markdown
### Frontend Refactoring Standards

- Consult `docs/frontend-refactor/INSTRUCTIONS.md` before modifying any file in `apps/web/`.
- Implementation specs are in `docs/frontend-refactor/phases/` organized by PRD.
- Reference code (component APIs, hook signatures, schemas, CSS) is in `docs/frontend-refactor/reference/`.
- Current per-file issues are cataloged in `docs/frontend-refactor/audit/current-issues.md`.
- No file in `apps/web/` may exceed 400 lines.
- No component may have more than 5 direct useState calls.
- All forms use react-hook-form + Zod. No manual useState for form fields.
```

---

## 6. No Changes Required

The following documents remain unchanged — they already contain the correct specifications:

- `docs/UI_CANONICAL_PRECEDENCE.md` — Already defines the UI conflict resolution order
- `docs/UI_TOKEN_CONTRACT.md` — Already defines token specifications
- `docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md` — Already defines PR compliance checks
- `lic-design-system/references/*` — Already contains authoritative design specs
- `lic-design-system/SKILL.md` — Already defines the design system implementation workflow
