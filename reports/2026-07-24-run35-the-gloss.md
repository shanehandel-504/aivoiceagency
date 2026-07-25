# RUN 3.5 — THE GLOSS

**Date:** 2026-07-24
**Repo:** `shanehandel-504/aivoiceagency` → Vercel (auto-deploy from `main`)
**Mission:** make the shipped skin feel expensive — depth, motion, scale, texture.
**Constraints honored:** ZERO new copy. ZERO token changes. RUN 3 palette + Space Grotesk frozen.
No `#00FF94` / `#00F0FF` / `#FF4D00` / `#030303`, no font-family swap, no second green per viewport.

---

## DONE

| # | Artifact | Live at | Proof | Commit | Rollback |
|---|---|---|---|---|---|
| C1 | GLASS-X recipe + button physics | `/` `/book` `/#pricing` | computed `backdrop-filter: blur(12px)` on every named surface; `.cta:hover` box-shadow = two **inset** layers, zero outer | `77b569f` | `git revert 77b569f` |
| C2 | Desktop scale + hero proof + real mono | `/` | H1 `64px → 100.8px` at 1440; JetBrains span measures `86.41px` vs `79.17px` fallback (identical before = never rendered) | `0c0fbc8` | `git revert 0c0fbc8` |
| C3 | Gradient edges + standalones join the system | `/` `/live` `/lsa` `/chauffeur` | identical GLASS-X signature on `/live .form-card`, `/lsa .transcript`, `/book .proof-rail` | `82f5db4` | `git revert 82f5db4` |
| C4 | Light-mode debt paid + bridge token gap closed | 25 city×trade + `/ground-transportation` + ~60 stamped pages | 100/100 city sweep, both themes, both viewports | `3e0a5a5` | `git revert 3e0a5a5` |
| — | `stamp.py` + board flip | site-wide | 55/55 pages stamped, 5/5 version-only armored | see close commit | `git revert <close>` |

---

## WHAT CHANGED, IN PLAIN ENGLISH

**1 · Glass.** There is now exactly one glass recipe, written once as tokens
(`--gx-fill / --gx-blur / --gx-line / --gx-edge`) plus a `.glass-x` utility. A smoked panel, a
hairline made of light, and a single 1px top edge. No outer shadow — depth comes from the blur
and the edge, never from an elevation ladder. Where `backdrop-filter` is unsupported it falls back
to `--gx-solid`, which is the *composite* of the fill over the canvas, so contrast never changes
between the two paths. Applied to hero chips, pricing tiers, Backstage cards, the Status Rail, the
stage, the feed pill, the result strip, and `/book`'s proof rail.

The 16 Backstage cards take the fill immediately but wait for `body.glow-ready` before they blur —
sixteen blurred layers competing with the first paint is exactly the cost the GLOW GATE exists to stop.

**2 · Buttons have physics now.** Every CTA on the site used to throw a coloured drop shadow onto
the void on hover. That is an outer ring and an elevation cue. The lift stayed; the light moved
inside. Hover = 2px up + an inner glow in the button's own semantic colour, 0.25s. Active presses
down through the resting plane. The glow **inverts** on paper: dark-theme green carries a near-black
label so a light bloom raises contrast, but light-theme green carries a *white* label at 5.08:1 —
so on paper the button glows green by going *deeper*. Measured, not assumed.

**3 · Desktop finally uses the width.** At 1440 the hero shipped a 64px headline inside a 1120px
column and floated in the middle of the void — a page designed at 390 and stretched. The H1 now
clamps 5.5→6.5rem (88px at 1024, 100.8px at 1440) at 17ch, which is wide enough that
"3AM. GOOGLE WAS" holds one line at both ends of the clamp and narrow enough that the two-line
break never becomes three. CTAs, micro line and chip row scale with it. Mobile is untouched.

**4 · The four-orb tick cluster is dead.** It stacked four coloured orbs each carrying an identical
checkmark — decoration pretending to be data. It never said *which* four things, and its hues
replayed the lane rainbow the theater already retired. One element replaced it: a mini cyan waveform
thumb. A recorded call is a waveform.

**5 · The mono was never real.** `--font-mono` / `--g-mono` / `--mono` have named *JetBrains Mono*
sitewide since the first build, but no self-hosted page ever **loaded** it. The entire technical
voice of the site — status rail, chips, timestamps, agent names, eyebrows — was rendering in
whatever mono the operating system happened to ship. Now self-hosted (latin subset, variable
400–700) and preloaded on the homepage, where the mono sits above the fold.

**6 · Edges are made of light.** The Backstage lane grid was drawn with boxes. Now a 1px rule that
is solid through the middle and fades to nothing at both ends does the work — as the lane rule, as
the divider between the four columns, and as the split in the objection strip (which lost two
bordered, shadowed template cards in the process). At ≥1024 the agent cards drop their box entirely
and keep only the fill, the top-edge light, and the semantic left lane hairline.

**7 · The standalones joined the system.** `/live`, `/lsa` and `/chauffeur` each carried their own
private copy of the design system. All three now link `circulant.css`, loading *before* their own
`<style>` so every local token still wins. `/lsa`'s copy and layout are untouched, and its paper
document card is deliberately excluded from the glass — it holds Google's own words and stays
opaque paper.

**8 · Light mode actually works now.** Two bugs, both invisible in dark:
- `@keyframes cyanFlicker` ran with `animation-fill-mode: forwards`, so its 100% frame **pinned**
  every city×trade headline accent at a literal `#00D4FF` for the life of the page — **1.64:1** on
  paper. An animation-set colour beats a plain `color` declaration, so the fix had to happen *inside*
  the keyframe. It now resolves to `--light-link` (#00688F, 5.51:1) on paper.
- Four panels were hardcoded `#14141C`. They stayed black when the toggle flipped while the text on
  them turned to ink: **1.01:1**.

---

## THE ROOT CAUSE UNDER #8

`assets/bridge.css` describes itself as "the ONE site-wide light theme", but its light block never
carried the RUN 3 FINAL SKIN tokens. Only `guide.css` did — and `guide.css` loads on the homepage
and the guide family **only**. So on the 40 city×trade pages and every vertical hub,
`--canvas / --panel / --text / --body-dim / --neutral / --green / --amber / --red` all stayed at
their **dark** values when the toggle flipped. Added to `bridge.css` with `guide.css`'s measured
values (lowest is green at 4.70:1).

---

## OPEN — NEEDS A SHANE CALL

**`bridge.css` overrides `.btn-primary` to cyan on ~60 stamped pages.** `bridge.css` loads *after*
`styles.css` and redeclares `.btn-primary` with `background: var(--bz-cyan)`. So on every stamped
page the primary CTA renders **cyan**, and the green rule in `styles.css` never reaches the paint.
The comment in `styles.css` claiming ".btn-primary IS the one solid green per page on the 40 stamped
SEO pages" was not true of the rendered page; it is corrected in place.

Its hover also threw `0 0 24px rgba(0,212,255,.25)` — an outer glow on a CTA across ~60 pages, a
live violation of the button recipe. **The physics were unified. The fill was deliberately left
alone**, because recolouring sixty pages' primary action is a semantic decision, not a side effect
of a gloss pass. Say the word and it becomes green.

---

## FIXED IN PASSING

- `/chauffeur` referenced `var(--green)` in `.live-badge` and `.badge-green` but never declared it —
  both rules were silently broken. `circulant.css` now defines it.
- `/chauffeur` was in **neither** `stamp.py` list, so its first-party assets never busted on a
  deploy. Registered in `VERSION_ONLY`.
- Killed the violet radial wash behind the pricing grid (violet is banned, and a second hue smears
  through real glass) and the e2/e3 elevation ladder the light-theme tier rules re-introduced.
- Two green CTA hovers that swapped in a *second* green (`#4FF0BC`) now hold the fill.

---

## GATES

| Gate | Result |
|---|---|
| `tools/skin-verify.mjs` — canonical five | **20/20** clean |
| All 25 city×trade pages, both themes, both viewports | **100/100** clean |
| Hubs, landers, `/roi`, `/overview`, `/blog` | **40/40** clean |
| `/chauffeur` + `/live` | **8/8** clean |
| Greens per viewport band | ≤ 1 everywhere |
| Multi-hue gradients on interactive elements | 0 |
| Horizontal overflow at 390px | 0 |
| LCP (home, 390×844) | **140ms** — budget 400ms |
| CLS introduced by this run | **0.00** |

**CLS attribution method:** a `git worktree` was cut at the pre-run commit `50bc9a5` and served on a
second port, so before/after were measured on identical hardware in the same session. Home mobile
`0 → 0`; home desktop `0.0006 → 0.0006`; `/book` `0.0026 → 0.0026`. Both residuals are byte-identical
pre-existing shifts (the rail row rotation and `.bnav-menu`). The self-hosted mono *did* cost
0.0063 on the homepage where it sits above the fold — that is why it is preloaded.

---

## PER-COMMIT ROLLBACK

```bash
git revert 3e0a5a5   # C4 — light-mode debt
git revert 82f5db4   # C3 — edges + standalones
git revert 0c0fbc8   # C2 — desktop scale + hero proof + mono
git revert 77b569f   # C1 — glass + button physics
```

Revert in that order (newest first). Each commit is independently revertible; C4 depends on C1's
`--gx-*` tokens, so do not revert C1 while C4 is still applied.
