---
name: circulant-design
description: CIRCULANT design system conventions for AI Voice Agency. Use when styling, theming, or making visual decisions for aivoiceagency.ai.
---

# CIRCULANT Design System — AI Voice Agency

## Colors
| Token | Value | Usage |
|-------|-------|-------|
| Void | #0A0A0F | Background (never pure black) |
| Matter | #EEF0F4 | Text (never pure white) |
| Cyan | #00D4FF | Primary accent, CTAs, links |
| Cyan Active | #00E5FF | Hover/active states |
| Gold | #FFB800 | RESERVED for ResumeReady ONLY |

## Typography
- Font family: 'Space Grotesk', sans-serif
- Weights: 300 (light), 400 (regular), 600 (semibold), 700 (bold)
- Import: Google Fonts CDN

## Rules
1. One accent color per site — cyan for AVA, gold for ResumeReady, amber for SeeBlinds
2. No gradients mixing accent colors with other hues
3. No generic AI aesthetics (no blue-purple gradients, no robot imagery)
4. The Signal/orb is the visual signature — never call it "orb" or "particle system" in copy, it is the "AVA Signal"
5. Background is always #0A0A0F, never pure #000000
6. Text is always #EEF0F4, never pure #FFFFFF

## Spacing
- Use consistent spacing (multiples of 8px)
- Section padding: 80px+ on desktop, 48px on mobile
- Content max-width: 1200px centered

## Responsive
- Desktop: full THREE.js WebGL orb
- Mobile: radial gradient fallback, sticky bottom CTA bar
- Breakpoint: 768px
