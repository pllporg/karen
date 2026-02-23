# UI Standards-Manual Boundary Verification

Requirement context: `REQ-UI-014` branding migration hardening.

## Problem

Product UI contained standards-manual documentation UX carryover in operator-facing shell copy and navigation semantics.

Observed examples before remediation:

- Shell kicker text: `Standards Manual`
- Shell metadata text: revision/internal banner language
- Section-style navigation markers in product sidebar
- Dashboard heading using documentation-style framing (`Litigation Command Center`)

## Remediation

1. Refactored shell copy and nav taxonomy to product-operational terms:
   - `apps/web/components/app-shell.tsx`
   - `apps/web/app/globals.css`
2. Updated dashboard heading copy:
   - `apps/web/app/dashboard/page.tsx`
3. Migrated seeded/demo identity domain from Karen-era to LIC:
   - `apps/api/prisma/seed.ts`
   - `apps/web/app/login/page.tsx`
   - `README.md`
4. Added regression assertions:
   - `apps/web/test/app-shell.spec.tsx`
   - `apps/web/test/dashboard-page.spec.tsx`
5. Added guardrail to block standards-manual documentation strings in product code:
   - `tools/ui/check_lic_style_guards.mjs`
6. Codified the standards-manual boundary in canonical operational docs:
   - `docs/UI_CANONICAL_PRECEDENCE.md`
   - `docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md`
   - `docs/UI_REFACTOR_LANE_PLAN.md`
   - `docs/UI_TOKEN_CONTRACT.md`
   - `docs/WORKING_CONTRACT.md`
   - `docs/PROMPT_CANONICAL_SOURCES.md`
   - `docs/UI_REGRESSION_ROLLOUT_GATES.md`
   - `README.md`
   - `lic-design-system/references/source-map.md`

## Verification

Commands run:

```bash
pnpm ui:contract:check
pnpm --filter web test -- test/app-shell.spec.tsx test/dashboard-page.spec.tsx test/app-shell-responsive.spec.tsx
pnpm --filter web build
pnpm backlog:sync
pnpm backlog:verify
pnpm backlog:handoff:check
```

Results:

- UI style guard passed.
- Targeted shell/dashboard responsive tests passed.
- Web build passed.
- Demo/seed login identity defaults now use `@lic-demo.local`.
- Backlog mirror verify passed with zero missing/orphan issues.
- Handoff freshness check passed.
