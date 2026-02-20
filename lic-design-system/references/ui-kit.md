# LIC Application UI Kit

## Table of Contents
- Kit Doctrine
- Global Component Rules
- Component Inventory
- Buttons
- Form Controls
- Navigation
- Data Display
- Cards
- Status and Tags
- Modals and Alerts
- Layout Shell
- Filter/Search Bar

## Kit Doctrine

- Treat the kit as a closed parts list.
- If a component does not exist in the kit, compose from existing parts before proposing a new type.
- Keep visual behavior uniform across modules.

## Global Component Rules

- Keep corners square by default.
- Keep focus states visible and explicit.
- Keep labels visible above form controls.
- Keep transitions minimal and functional.
- Keep colors within token set.
- Keep destructive actions explicit and confirmed.
- Keep touch targets at least `44x44px` (or `36x36px` with explicit justification).

Authoritative summary rules from the source manual:

- No ad hoc component invention.
- No decorative elevation patterns.
- No hidden loading fakery.
- No opacity hacks to create new colors.
- No nested modal-in-modal workflows.

## Component Inventory

Canonical kit sections from the source manual:

- Buttons
- Form controls
- Navigation
- Data display
- Card system
- Badges/tags/status
- Modals/dialogs
- Alerts/toasts/banners
- Empty/loading/error states
- Tooltips/popovers
- Application layout shell
- Filter/search bar

Underlying primitive set in source code (`src/app/components/ui`):

- `accordion`, `alert`, `alert-dialog`, `avatar`, `badge`, `breadcrumb`, `button`, `calendar`, `card`, `checkbox`, `collapsible`, `dialog`, `drawer`, `dropdown-menu`, `form`, `hover-card`, `input`, `label`, `menubar`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `scroll-area`, `select`, `sheet`, `sidebar`, `slider`, `switch`, `table`, `tabs`, `textarea`, `toast/sonner`, `tooltip` and related helpers.

## Buttons

Variants:

- Primary
- Secondary
- Ghost
- Destructive

States:

- Default
- Hover
- Focus
- Active
- Disabled
- Loading (when applicable)

Sizes:

- Small (`24px`)
- Medium (`40px`)
- Large (`48px`)

Rules:

- Use monospace uppercase labels for action buttons.
- Keep state differentiation clear without relying only on color.
- Use explicit destructive variant for destructive actions.

## Form Controls

Core controls:

- Text input
- Textarea
- Select/dropdown
- Checkbox/radio/toggle
- Slider
- File/document-type selection inputs

Rules:

- Put labels above controls, always visible.
- Keep validation close to field.
- Use institutional focus treatment.
- Keep error message copy specific and corrective.

## Navigation

Use:

- Tabs for peer views in same context.
- Breadcrumbs for hierarchy context.
- Pagination for bounded data sets.
- Stepper for gated process stages.

Rules:

- Keep wayfinding explicit.
- Keep current state obvious.
- Keep counts and dataset position visible for paginated views.

## Data Display

Patterns:

- Stacked key-value groups
- Inline key-value rows
- Stat blocks
- Sortable tables

Rules:

- Keep metadata monospaced and structured.
- Keep rows scannable and stateful.
- Keep sorting affordance explicit.

## Cards

Card structure is consistent:

- Header: module/status identity
- Body: title + summary
- Footer: metadata

Rules:

- Keep content variation inside shared structure.
- Avoid decorative card variants that change semantics.

## Status and Tags

Types:

- Status badges
- Category tags
- Dismissible filter tags
- Agent identifiers
- Progress bars

Rules:

- Keep tags square and compact.
- Keep status semantics consistent across pages.
- Keep color mapping stable (`filing-red` error, `ledger` success, etc.).

## Modals and Alerts

Modal variants:

- Confirmation
- Destructive
- Informational

Alert channels:

- Page-level banners
- Toast notifications
- Inline alerts

Rules:

- Use modal only when interruption is justified.
- Use typed confirmation for high-risk destructive actions.
- Keep alert hierarchy aligned with severity and persistence needs.

## Layout Shell

Canonical product frame:

- Fixed left sidebar
- Persistent top bar
- Scrollable main content
- Bottom instruction/action bar when needed

Typical shell specs in manual:

- Sidebar around `280px`
- Top bar around `48px`
- Content padding around `32px`
- Max content width around `960px`

## Filter/Search Bar

Required parts:

- Search field
- Structured filter controls
- View toggle
- Secondary actions (for example export)
- Active filter chips with clear/reset affordance

Rules:

- Keep controls compact and aligned.
- Keep applied filters visible.
- Keep state changes immediate and reversible.
