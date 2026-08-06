---
name: circulant-design
description: CIRCULANT design system conventions for AI Voice Agency. Use when styling, theming, or making visual decisions for aivoiceagency.ai.
---

# CIRCULANT Design System — AI Voice Agency

## TOKENS

**TOKENS: CLAUDE.md § 2 is the SOLE token authority. Legacy pages may show PRE-X values — when
patching a legacy section, match the surrounding page; anything NEW uses § 2.**

Palette, semantic colors, font family and weights all live there. This file does not restate them
and cannot override them. Type delivery is **self-hosted woff2** (`/fonts/space-grotesk.woff2`,
`/fonts/jetbrains-mono.woff2`) on both brands — not the Google Fonts CDN.

## Rules
1. One accent per site. Cyan is AVA's. Sibling products carry their own — never borrow one onto an
   AVA surface, and never put AVA's cyan on a sibling.
2. No gradients mixing accent colors with other hues.
3. No generic AI aesthetics (no blue-purple gradients, no robot imagery).
4. The Signal/orb is the visual signature — never call it "orb" or "particle system" in copy, it is
   the "AVA Signal".
5. Background is never pure `#000000`; text is never pure `#FFFFFF`. The actual values are § 2's.

## Spacing
- Use consistent spacing (multiples of 8px)
- Section padding: 80px+ on desktop, 48px on mobile
- Content max-width: 1200px centered

## Responsive
- Desktop: full THREE.js WebGL orb
- Mobile: radial gradient fallback, sticky bottom CTA bar
- Breakpoint: 768px
