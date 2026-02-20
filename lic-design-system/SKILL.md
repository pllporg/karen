---
name: lic-design-system
description: Enforce the LIC brand identity, visual tokens, UI kit constraints, interaction doctrine, AI interaction model, and GP-01 workflow standards in web apps. Use when asked to apply this design system to an existing repo, build new screens/components that must match LIC standards, or review UI work for compliance.
---

# LIC Design System

Use this skill to implement or enforce the LIC standards manual in product UI, marketing pages, AI interface surfaces, and GP-01 intake-to-matter workflows.

## Reference Loading Map

Read only the files needed for the current task.

- Always load first:
  - `references/design-tokens.md`
  - `references/brand-foundation.md`
- Load for app UI/components:
  - `references/ui-kit.md`
- Load for interaction behavior or AI UX:
  - `references/interaction-and-ai.md`
- Load for marketing site work:
  - `references/marketing-site.md`
- Load for intake-to-matter flow/screen work:
  - `references/gp01-flow.md`
- Load for reusable user prompts in a new repo:
  - `references/adoption-prompt.md`

## Implementation Workflow

1. Determine target surface.
- Classify task as `product-app`, `marketing-site`, `ai-interface`, `gp01-flow`, or mixed.
- Choose references from the map above.

2. Audit the target repo before editing.
- Identify stack (React/Next/Vue, Tailwind/CSS Modules, component library).
- Locate global style entrypoints and design token sources.
- Locate base components (button, input, modal, table, badge, nav).

3. Apply the token and typography layer.
- Install LIC color, type, spacing, radius, and border tokens from `references/design-tokens.md`.
- Preserve semantic token aliases so product code can consume consistent names.

4. Retrofit primitives and shared components.
- Normalize components to LIC constraints from `references/ui-kit.md`.
- Prioritize: button, input, select, textarea, badge, card, table, dialog/modal, alert/toast, tabs, pagination.

5. Enforce interaction and AI behavior rules.
- Apply focus, feedback, loading, modal, validation, and accessibility rules from `references/interaction-and-ai.md`.
- For AI surfaces, apply command-surface and provenance rules from `references/interaction-and-ai.md`.

6. Apply context-specific standards.
- For public pages, apply `references/marketing-site.md`.
- For intake-to-matter workflows, apply `references/gp01-flow.md`.

7. Validate and report compliance.
- Report what changed, what is still non-compliant, and why.
- If existing patterns conflict with LIC standards, prefer the stricter LIC rule and call out the tradeoff.

## Non-Negotiables

- Use only LIC palette and typography tokens.
- Keep corners square by default (no arbitrary border-radius).
- Avoid decorative motion, decorative gradients, and novelty interactions.
- Preserve explicit labels, visible state, and review/audit traceability.
- Treat accessibility requirements as release blockers, not enhancements.

## Conflict Resolution

When references appear to conflict, use this order:

1. `references/interaction-and-ai.md` (behavioral safety and clarity)
2. `references/ui-kit.md` (component contracts)
3. `references/design-tokens.md` (visual primitives)
4. Context-specific docs: `references/marketing-site.md` and `references/gp01-flow.md`

If conflict remains, choose the stricter, more procedural rule and document the decision.
