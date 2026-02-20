# LIC Interaction and AI Doctrine

## Table of Contents
- Interaction Principles
- Motion and Timing
- State Model
- Keyboard and Focus
- Feedback Hierarchy
- Confirmation and Destructive Actions
- Loading, Empty, Scroll, and Validation
- Modal Behavior
- Responsive and Accessibility
- Interaction Anti-Patterns
- AI Interaction Principles
- Agent Model
- Universal Interface Rules
- Execution Plans and Review Gates
- AI Voice and Provenance
- AI Anti-Patterns

## Interaction Principles

Core rules:

- State is always visible.
- Actions are always reversible.
- System does not interrupt without user initiation.

Design posture:

- Prioritize procedural clarity over expressive choreography.
- Treat interface as instrument, not entertainment surface.

## Motion and Timing

Allowed timing behavior:

- State changes: instant
- Hover feedback: instant
- Panel open/close: `~120ms linear`
- Content reveal: `~80ms linear`
- Toast entry/exit: `~100ms linear`
- Loading indicators: continuous linear motion only

Do not use:

- Spring/bounce physics
- Parallax
- Staggered entrances
- Shimmer/skeleton theatrics for progress simulation
- Decorative motion on page load

## State Model

Apply explicit visual states across interactive controls:

- Default
- Hover
- Focus
- Disabled
- Active/pressed
- Error
- Success

Rules:

- Distinguish states without relying on color alone.
- Keep cursor semantics correct (`pointer`, `text`, `not-allowed`, etc.).

## Keyboard and Focus

Requirements:

- Ensure full keyboard operability.
- Keep tab order in visual reading order.
- Keep focus trap in modals.
- Return focus to trigger when overlay closes.

Focus ring spec:

- `2px` solid Institutional Blue
- `2px` offset
- visible on both Ink and Paper surfaces

## Feedback Hierarchy

Use escalating channels by severity:

1. Inline state change
2. Inline alert/banner
3. Toast (low-severity transient)
4. Modal confirmation (high-risk interruption)

## Confirmation and Destructive Actions

Rules:

- Do not use generic "Are you sure?" prompts.
- State exact consequence in title/body.
- Repeat action verb on primary button.
- Keep cancel action present and explicit.
- Use typed confirmation for irreversible or high-risk actions.

## Loading, Empty, Scroll, and Validation

Loading and empty states:

- Be explicit and honest about state.
- Label what is loading.
- Use progress bars when progress is knowable.
- Use non-fabricated indeterminate indicators when it is not.

Scroll behavior:

- Use native scrolling.
- Allow sticky headers with clear separation.
- Avoid infinite scroll in primary data workflows.
- Preserve scroll position on return navigation.

Validation and errors:

- Validate on blur and on submit.
- Move focus to first form error on submit failure.
- Clear errors immediately once corrected.
- Write errors as `problem + fix`, never blame language.

## Modal Behavior

Rules:

- Justify modal usage.
- Keep background inert while modal is open.
- Support Escape close.
- Prevent stacked modals.
- Use constrained modal widths (small/large), not full-screen overlays for routine tasks.

## Responsive and Accessibility

Product app behavior:

- Desktop-first.
- Compact desktop/tablet adaptations allowed.
- Under `768px` is out-of-scope for full product experience unless explicitly re-scoped.

Accessibility requirements:

- Meet WCAG 2.1 AA.
- Use semantic elements correctly.
- Never depend solely on color for meaning.
- Verify keyboard and screen-reader behavior before release.

## Interaction Anti-Patterns

Avoid:

- Infinite scroll for primary case tables
- Deceptive optimistic success states
- Gesture-only or hover-only critical actions
- Auto-advancing carousels
- Fragile hidden interactions (e.g., double-click to edit as only path)

## AI Interaction Principles

Core rules:

- AI is workforce, not magic.
- Every output has provenance.
- Human review gate is mandatory before external use.
- Uncertainty is stated explicitly in professional language.

## Agent Model

Agent classes in source system:

- Associate (`ASSOC`): document/work-product production
- Auditor (`AUDT`): compliance and quality review
- Analyst (`ANLS`): synthesis and intelligence reporting

Operational states:

- Idle
- Queued
- Working
- Blocked
- Filed

Delivery modes:

- Scheduled
- On-demand
- Triggered
- Continuous
- Cascaded

## Universal Interface Rules

Treat interface as command surface, not chat toy.

Instruction families:

- Direct task
- Query
- Analysis request
- Review request
- Compound instruction
- Contextual follow-up
- Workflow modification
- System command

Rules:

- Classify instruction before execution.
- Confirm interpretation when ambiguous.
- Return structured outcomes, not conversational filler.

## Execution Plans and Review Gates

When task complexity increases:

- Generate visible execution plan before running.
- Show dependencies, agent assignments, and expected outputs.
- Require explicit approval for multi-agent or multi-step plans.
- Pause on block/failure; do not silently skip steps.

Review-gate sequence:

1. Agent output filed
2. Auto-audit
3. Human review
4. Approval / revision / rejection

## AI Voice and Provenance

Voice rules:

- Acknowledge succinctly, then act.
- Report outcomes, not internal process narration.
- Ask targeted clarifying questions once.
- Report problems without apology scripts.
- Never narrate chain-of-thought.

Human vs machine visual differentiation:

- Use structural formatting differences, not novelty badges.
- Keep authorship and timestamp visible.

Provenance metadata to retain:

- Document ID
- Originating instruction/session
- Producing and auditing agents
- Inputs used
- Filed timestamp
- Review status
- Version
- Confidence flags
- Classification

## AI Anti-Patterns

Avoid:

- Anthropomorphic framing
- Persona/avatar chat behavior
- Suggested prompt gimmicks
- Confidence percentages as fake precision
- "Regenerate" roulette workflows
- Thumbs-up/down consumer feedback widgets
- Filler acknowledgments and hype language
