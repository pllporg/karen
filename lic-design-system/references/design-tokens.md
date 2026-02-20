# LIC Design Tokens

## Table of Contents
- Core Aesthetic
- Color Tokens
- Typography Tokens
- Type Scale
- Layout and Spacing
- Borders, Radius, and Elevation
- Motion Tokens
- CSS Starter Snippet
- Compliance Checks

## Core Aesthetic

- Treat interface as an institutional systems manual.
- Prefer matte, high-contrast, low-ornament surfaces.
- Use structure (grid, borders, spacing, hierarchy) instead of decoration.

## Color Tokens

### Brand Palette (authoritative)

- `--color-ink: #0B0B0B`
- `--color-paper: #F7F5F0`
- `--color-graphite: #3A3A3A`
- `--color-slate: #6B6B6B`
- `--color-silver: #A8A8A8`
- `--color-fog: #D4D2CD`
- `--color-parchment: #ECEAE4`
- `--color-institutional: #2B4C7E`
- `--color-filing-red: #8B2500`
- `--color-ledger: #2D5F3A`

### Usage Intent

- Ink/Paper: dominant foreground/background pairing.
- Graphite/Slate/Silver/Fog/Parchment: hierarchy and neutral structure.
- Institutional: links, focus, active informational state.
- Filing Red: destructive/error/warning.
- Ledger: success/completed/approved.

### Color Rules

- Do not invent new hex values outside the approved set.
- Do not use gradients for UI surfaces.
- Do not use functional colors decoratively.
- Maintain WCAG AA minimum contrast (4.5:1 for body text).

## Typography Tokens

### Font Families

- `--font-mono: 'IBM Plex Mono', ui-monospace, monospace`
- `--font-sans: 'IBM Plex Sans', ui-sans-serif, sans-serif`
- `--font-serif: 'IBM Plex Serif', ui-serif, serif`

### Role Assignment

- Mono: headings, labels, controls, tables, metadata, module codes.
- Sans: body copy and long-form explanatory prose.
- Serif: limited emphasis, pull quotes, select marketing headlines.

### Font Weights

- Light 300
- Regular 400
- Medium 500
- SemiBold 600
- Bold 700

## Type Scale

Primary app scale:

- Display: `2.5rem`, 500, mono
- H1: `2rem`, 500, mono
- H2: `1.5rem`, 500, mono
- H3: `1.125rem`, 500, mono
- Body: `1rem`, 400, sans
- Caption: `0.8125rem`, 400, sans
- Code/Label: `0.6875rem`, 400, mono
- Micro: `0.5625rem`, 400, mono

Tracking/leading guidance:

- Headings: tracking `0.01em–0.02em`, leading `1.1–1.3`
- Labels/Codes: tracking `0.15em–0.4em`, all caps
- Body: normal tracking, leading `1.6–1.7`

## Layout and Spacing

### Grid

- Use a 12-column grid for core desktop layouts.
- Keep max content width around `960px` for dense reading surfaces.
- Keep horizontal margins at least `32px`.

### Spacing Scale (8px base)

- `4px` (`0.5x`)
- `8px` (`1x`)
- `16px` (`2x`)
- `24px` (`3x`)
- `32px` (`4x`)
- `48px` (`6x`)
- `64px` (`8x`)
- `96px` (`12x`)

## Borders, Radius, and Elevation

- Prefer `1px` and `2px` rules/borders for grouping and hierarchy.
- Default corners are square.
- Avoid global rounded corners for core controls and containers.
- Avoid depth-heavy box shadows.
- Use offset shadows only for floating surfaces (modal/popover/toast), and keep subtle.

## Motion Tokens

- Default state changes: instant (`0ms`) where possible.
- Allowed animated transitions are short and linear.
- Avoid expressive easing and decorative animation.

Reference timing targets:

- Panel open/close: `120ms linear`
- Content reveal: `80ms linear`
- Toast entry/exit: `100ms linear`
- Page transitions: `0ms`

## CSS Starter Snippet

```css
:root {
  --font-size: 16px;

  --color-ink: #0b0b0b;
  --color-paper: #f7f5f0;
  --color-graphite: #3a3a3a;
  --color-slate: #6b6b6b;
  --color-silver: #a8a8a8;
  --color-fog: #d4d2cd;
  --color-parchment: #eceae4;
  --color-institutional: #2b4c7e;
  --color-filing-red: #8b2500;
  --color-ledger: #2d5f3a;

  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;
  --font-sans: 'IBM Plex Sans', ui-sans-serif, sans-serif;
  --font-serif: 'IBM Plex Serif', ui-serif, serif;
}
```

Google Fonts import used in source manual:

```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=IBM+Plex+Serif:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap');
```

## Compliance Checks

- Tokens defined once at system level (not per-component overrides).
- Surfaces primarily use Ink/Paper/Parchment.
- Typography roles follow Mono/Sans/Serif assignment.
- Spacing snaps to base scale.
- New colors and ad hoc effects are absent.
