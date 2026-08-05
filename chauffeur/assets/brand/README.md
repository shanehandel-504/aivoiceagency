# AI CHAUFFEUR — BRAND ASSETS

The mark is **Signal**: waveform bars — a voice on a line — tied by a center knot.
The knot is the handoff: the call becomes a booking.

Extracted from the Claude Design kit *AI Chauffeur Brand Kit* and installed by
`AIC-BRAND-INSTALL`. Every file here is the supplied production SVG — outlined
type, no embedded fonts, no external references. **Do not redraw, retype, or
rebuild these.** If a surface needs something this folder does not have, the kit
gets a new file; the site does not get a hand-made one.

---

## SURFACE MAP

Which file goes where. Mirrors the kit's own map.

| File | Surface | Minimum size |
|---|---|---|
| `mark-compact.svg` | App icon, favicon | **16px** · dark ground baked in |
| `lockup-short.svg` | Web nav, product header | **120px** wide · transparent |
| `lockup-short-ink.svg` | Light UI, help centre | **120px** wide · ink bars, `#0090C8` accent |
| `lockup-stacked.svg` | Social avatar | **96px** · square crop safe |
| `lockup-horizontal-ink.svg` | Letterhead, invoice | **260px** wide · with tagline |
| `lockup-horizontal.svg` | Deck title slide | **260px** wide · dark deck master only |
| `wordmark-ink.svg` | Email signature | **140px** wide · no mark at small line height |
| `mark-black.svg` / `mark-white.svg` | Embroidery, stamp, fax | **16px** · single colour, no knot tint |
| `card-front.svg` / `card-back.svg` | Business card | 3.5 × 2in at 1125 × 675px |

### The remaining variants

| File | Use it when |
|---|---|
| `mark-full.svg` | The mark has room to breathe — **min 44px**. Twelve bars, not six. |
| `mark-full-ink.svg` | Same, on light print or light UI. |
| `mark-compact-ink.svg` | Compact mark on a light ground. |
| `mark-mono.svg` | One colour, full detail — stamps, engraving, single-plate print. |
| `lockup-stacked-ink.svg` | Stacked lockup on a light ground. |
| `wordmark-white.svg` | Wordmark alone on dark, where the mark already appears nearby. |
| `wordmark-black.svg` | Wordmark alone, single-colour print. |

---

## THE INK-ON-LIGHT RULE

**Bright cyan is a dark-surface colour.** On white it fails contrast. Print and
light UI use the deeper `#0090C8` instead — that is the entire reason the `-ink`
variants exist.

| | Ground | Bars · type | Knot · accent bar |
|---|---|---|---|
| **Dark** — app, web, video, signage | `#0A0A0F` | `#EEF0F4` | `#00D4FF` |
| **Light** — stationery, invoices, decks | `#F7F8FA` | `#14161C` | `#0090C8` |

Pick the file that already carries the right palette. Never recolour one to reach
the other.

## CLEAR SPACE

**X = one bar width.** Lockups and wordmarks hold **3X** on all sides; the mark
alone holds **2X**. Nothing crosses that boundary — no type, no rules, no photo
edge.

---

## THE FIVE WAYS THIS BREAKS

All five have been seen in the wild.

1. **Bright cyan on white.** Fails contrast. Use the `-ink` variant.
2. **Stretched.** Scale proportionally only — never fit to a box by distorting.
3. **Rotated.** The bars sit on the baseline. The mark does not tilt.
4. **Mid-tone ground.** Go full dark or full light. Nothing in between holds.
5. **Hand-built lockup.** The mark-to-word gap and rule weights are already set.
   Use the supplied file.

---

## GENERATED RASTERS

Rendered by headless Chrome from the SVGs above. Regenerate rather than edit —
these are outputs, not sources. Email clients cannot render SVG, which is why the
email logos are PNG at 2x.

| File | From | Size | Ground |
|---|---|---|---|
| `avatar-512.png` | `lockup-stacked.svg` | 512 × 512 | `#0A0A0F` |
| `avatar-512-light.png` | `lockup-stacked-ink.svg` | 512 × 512 | `#F7F8FA` |
| `email-logo@2x.png` | `lockup-short-ink.svg` | 1200 × 204 | transparent |
| `email-logo-white@2x.png` | `lockup-short.svg` | 1200 × 204 | transparent |
| `card-front.png` / `card-back.png` | matching SVG | 1125 × 675 @ 300 DPI | baked |
| `../aic-logo.png` | `lockup-short.svg` | 892 × 152 (@2x) | transparent |

An avatar is composited on chrome we do not control, so both avatars are opaque —
a transparent avatar turns into a black or white box depending on the platform.

The cards are 1125 × 675 px = 3.75 × 2.25in at 300 DPI: a 3.5 × 2in card with
0.125in bleed on every edge. Send them to print at that size — do not scale.

`../aic-logo.png` sits one level up, outside this folder, at
`chauffeur/assets/aic-logo.png`. That exact path is what the RUN 4 Slack rail
checks for. Moving or renaming it silently drops the logo out of Slack.

---

## FAVICON SET

Site root, not this folder: `/favicon.svg`, `/favicon-16.png`, `/favicon-32.png`,
`/apple-touch-icon-180.png`, `/icon-192.png`, `/icon-512.png`, `/site.webmanifest`.

All of them bake in the `#0A0A0F` ground. That is deliberate: the bars are
`#EEF0F4`, so a transparent favicon disappears against a light-mode tab strip.

## HOUSE RULES THAT STILL APPLY

- **AVA is never "she" or "her."** Always "AVA," by name.
- AI Chauffeur (blue/cyan vertical) and the AVA parent brand are separate brands.
  Never cross tokens between them.
