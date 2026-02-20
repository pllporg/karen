# LIC Marketing Site Standards

## Table of Contents
- Strategic Intent
- Audience
- Tone and Positioning
- Site Architecture
- Typography in Marketing Context
- Hero and Section Patterns
- Imagery Direction
- Surface Rules
- Conversion Rules
- Responsive and Performance Rules
- Marketing Anti-Patterns

## Strategic Intent

- Present LIC as institutional litigation workforce.
- Convey operational credibility over startup energy.
- Use restrained, factual narrative.

## Audience

Primary:

- Managing partners
- Practice group leaders
- Operations directors at mid-size to large law firms

Secondary:

- General counsel evaluating external litigation support

## Tone and Positioning

Desired tone:

- Authoritative
- Measured
- Factual
- Unhurried

Avoid:

- Playful/promotional startup style
- Urgency gimmicks
- Trend-driven visual language

## Site Architecture

Recommended core pages:

- `/` home/landing
- `/capabilities`
- `/how-it-works`
- `/about`
- `/contact`

Rules:

- Keep architecture compact.
- Avoid blog/resource-center sprawl unless explicitly requested.
- Drive to clear high-trust conversion actions.

## Typography in Marketing Context

Use same families with different hierarchy than product app:

- H1 hero: IBM Plex Serif, `48–56px`
- H2 section: IBM Plex Serif, `28–32px`
- H3 feature/card: IBM Plex Sans, `18–20px`
- Body: IBM Plex Sans, `16px`, `1.6` line-height
- Labels/captions: IBM Plex Mono, `10–12px`, tracked

## Hero and Section Patterns

Hero must communicate quickly:

- What LIC is
- What LIC does
- Why this is operationally serious

Rules:

- Avoid autoplay/video-heavy hero treatments.
- Keep CTA hierarchy explicit.
- Use high-contrast, low-noise composition.

## Imagery Direction

Preferred imagery:

- Grayscale or muted treatment
- Architectural/documentary tone
- Framed and contained, not full-bleed spectacle

Avoid:

- Futurist AI clichés
- Cartoon/illustrative filler
- Saturated decorative imagery

## Surface Rules

Primary surfaces:

- Ink
- Paper
- Parchment

Rules:

- Do not introduce marketing-only neon/accent palette.
- Keep section contrast and pacing through approved surfaces.

## Conversion Rules

Primary conversion:

- Schedule capabilities briefing

Secondary conversion:

- Download operational overview

Rules:

- Avoid free-trial/self-serve SaaS conversion patterns.
- Keep calls-to-action sparse and confident.

## Responsive and Performance Rules

Unlike the product app, marketing pages must be fully responsive.

Performance targets from source manual:

- FCP `< 1.2s`
- LCP `< 2.0s`
- Total page weight `< 500KB`
- Lighthouse performance `>= 95` (mobile and desktop)

Implementation preferences:

- Keep JS weight constrained.
- Prefer static rendering where possible.
- Use optimized images (WebP, lazy-load below fold).
- Keep third-party script usage minimal and justified.

## Marketing Anti-Patterns

Avoid:

- Chatbot sales widgets
- Countdown timers and urgency manipulations
- Pop-up spam and intrusive overlays
- Vanity metrics without sourcing
- Anonymous testimonials and hype claims
