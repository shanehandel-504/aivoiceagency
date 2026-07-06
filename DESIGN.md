# DESIGN.md — CIRCULANT Design System (AVA parent)

Canonical token source: **`/assets/circulant.css`**. It is linked in every
page `<head>` before that page's own styles, so every page consumes the same
tokens and inherits the shared polish (keyboard focus, glass, LIVE dot, badge).

> `styles.css` (the shared sheet the vertical / city / blog pages link) mirrors
> the core palette at its own `:root` for resilience. When a token value
> changes, change it in **`/assets/circulant.css` first** — that is the source
> of truth — then mirror into `styles.css` if you want the fallback to match.

---

## The semantic color law

Four accents, each with ONE job. Never spend an accent on decoration.

| Color | Token | Hex | Job — use ONLY for |
|-------|-------|-----|--------------------|
| 🟢 Green  | `--live-green` | `#22C55E` | **Live status** — the pulsing dot on live-call widgets, "AVA is live" signals |
| 🟡 Gold   | `--gold`       | `#FFB800` | **Money** — pricing links, price figures, "See pricing" CTAs |
| 🟣 Violet | `--violet`     | `#8B5CF6` | **Featured** — FLAGSHIP / MOST POPULAR badges, the featured pricing tier |
| 🔵 Cyan   | `--cyan`       | `#00D4FF` | **Everything else** — primary CTAs, links, section labels, focus |

**Budget: ~3 accent moments per screen, max.** If a screen has a green LIVE
dot, a gold price link, and a violet featured tier, it is full — any further
color is noise. When in doubt, it is cyan.

This overrides the older `circulant-design` skill note that reserved gold for
"ResumeReady only." For the AVA site, gold = money (locked, Block P 2026-07-04).

### Base surfaces (not accents)
- Background `--void` `#0A0A0F` — never pure black.
- Text `--ink` / `--matter` `#EEF0F4` — never pure white.
- Secondary text `--ink-mute` `#808088` / `--dim`.
- Hairlines `--line` `rgba(255,255,255,0.10)`.

---

## Typography

| Role | Token | Family |
|------|-------|--------|
| Display | `--font-display` | Space Grotesk (300/400/600/700) |
| Body | `--font-body` | Inter |
| Mono / labels | `--font-mono` | JetBrains Mono (uppercase, 0.1em tracking) |

Fluid type scale: `--text-xs` → `--text-display`, all `clamp()`-based so type
tracks the viewport without breakpoints. Prose blocks cap at `--measure`
(`70ch`, inside the 65–75ch readability band) — apply `.prose`.

---

## Spacing & radii

- Spacing scale is an 8px base: `--space-1` (4px) … `--space-9` (128px).
  Section padding lands on `--space-8` (80px) desktop / `--space-6` (48px) mobile.
- Radii: `--radius-sm` 4px (inputs, hard-edge cards) · `--radius-md` 12px ·
  `--radius-lg` 20px (glass cards) · `--radius-pill` 999px (buttons, chips, badges).

---

## Glass recipe

Apply `.glass`, or compose from the tokens:

```css
background: var(--glass-fill);      /* linear-gradient(165deg, rgba(255,255,255,.07), rgba(255,255,255,.04)) */
border: var(--glass-border);        /* 1px solid rgba(0,212,255,.20) */
border-radius: var(--radius-lg);
backdrop-filter: blur(var(--glass-blur));         /* 18px */
-webkit-backdrop-filter: blur(var(--glass-blur));
box-shadow: var(--glass-shadow);
```

Fallback for browsers without `backdrop-filter` is built in: the surface falls
back to the opaque `--glass-fallback` (`rgba(17,19,27,0.93)`) via `@supports`.

## Glow recipe

`--glow-cyan` / `--glow-violet` / `--glow-gold` / `--glow-green`, or the
`.glow-cyan` / `.glow-violet` / `.glow-gold` utilities. Glow color must match
the element's semantic job (a gold price never glows cyan).

---

## Shared polish utilities (in circulant.css)

| Class | Effect |
|-------|--------|
| `.glass` | Glass card treatment with `@supports` fallback |
| `.circ-live-dot` | Pulsing green LIVE dot (respects `prefers-reduced-motion`) |
| `.circ-badge` | Violet FLAGSHIP / MOST POPULAR badge |
| `.accent-live` / `.accent-money` / `.accent-featured` / `.accent-cyan` | Semantic text color |
| `.prose` | Cap line length at `--measure` |
| `*:focus-visible` | 2px cyan keyboard-focus ring, site-wide (a11y) |

The vertical/city pages get the same treatments from `styles.css`
(`.lcw-live-dot`, `.see-pricing-link` in gold, `*:focus-visible`); circulant.css
carries them to the standalone pages (overview, roi, book, methodology, etc.).

---

## Interactive states — required on every interactive element

- **Hover:** color shifts to the `-bright` variant + matching glow.
- **Focus-visible:** 2px cyan ring, 2px offset (site-wide default).
- **Motion:** any pulse/scan animation must have a `prefers-reduced-motion` off-switch.

---

## Page templates

`/templates/vertical.html` and `/templates/city.html` are token-driven and bake
in the semantic colors. New mass pages copy a template and fill the clearly
marked `{{PLACEHOLDER}}` blocks — they inherit the canon automatically.
