# RUN 4.5 — THE FINE TOUCH

**Date:** 2026-07-25 · **Branch:** `run4.5-fine-touch` → `main`
**Repo:** `shanehandel-504/aivoiceagency` → Vercel (auto-deploy from `main`)
**Mission:** the fresh-eyes craft pass the morning after Runs 3.5 + 4. Polish only.

---

## THE SHAPE OF IT

**3 files. All CSS. Zero JS, zero HTML text, zero structural change, zero new copy.**

| | |
|---|---|
| Defects found (numbered, measured) | **15** |
| Fixed | **13**, across 5 commits |
| Deliberately not fixed | **2** — both design decisions, not polish. Named below. |
| Files touched | `css/feed.css` · `css/backstage.css` · `chauffeur/index.html` (its `<style>` block) |

Nothing was fixed without a defect number, and no defect number was assigned without a
measurement. The grill ran before anything was touched.

---

## THE BASELINE WAS ALREADY GOOD — that is a finding, not a filler line

Across **10 page × viewport combinations** (5 surfaces × 390×844 and 1440×900):

| Check | Result |
|---|---|
| Horizontal overflow | **0** |
| Console errors / page errors | **0** |
| Contrast failures (AA, every text node against its painted backdrop) | **0** |
| Clipped / ellipsised text | **0** |
| Focus rings present | **206/206** tabbable elements |

**One retracted finding.** The first pass flagged 38 elements with "no focus state." That was a
false positive in my own instrument: Chromium does not set `:focus-visible` for a programmatic
`el.focus()`, so the probe was asking the wrong question. Re-tested by driving real `Tab`
traversal across six page/viewport combos — every focusable element paints a ring. The defect
did not exist and no fix was shipped for it.

---

## THE 15 DEFECTS

| # | Surface | Defect | Measured | Status |
|---|---|---|---|---|
| D1 | `/` | Deep link to `/backstage` reads as fine print, not a door | 9.5px, `text-decoration:none`, 127 × **15.2px** | **C1** |
| D2 | `/` | The disclosure line is the smallest type on the page | 9.5px (floor is 12px) | **C1** |
| D3 | `/` @390 | `.fd-h` strands `job.` on its own line | lines `[312, 37]` | **C2** |
| D4 | `/` @390 | `.fd-outcome` strands `board` | `[231, 38]` | **C2** |
| D5 | `/` @390 | `.fd-anchor` splits the caller's quote, dangling close-quote | `[214, LEAKING"]` | **C2** |
| D6 | `/` @390 | `.bs-result-line` strands `AM` | `[~300, 38]` | **C2** |
| D7 | `/backstage` @1440 | Intro paragraph indented 222px under a flush eyebrow + H1 | support x=**362.3**, h1 x=140 | **C3** |
| D8 | `/backstage` @390 | `.bs-h2` strands `job.` | `[350, 46]` | **C2** |
| D9 | `/` @1440 | Component section runs a third rhythm | `#watch` 34px vs every sibling 64px | **C4** |
| D10 | `/` `/backstage` | 9 tab buttons under the touch floor | 40px (law 44) | **C5** |
| D11 | `/` | "Read the transcript" under the floor | 40px | **C5** |
| D12 | `/` | 5 stacked footer nav links under the floor | 23.2px on an 8px gap | **C5** |
| D13 | `/chauffeur` @390 | Header's only CTA under the floor | 34.4px | **C5** |
| D14 | `/` | `.bs-3am` computes to UA link blue `#0000EE` | latent, not rendered | **C5** |
| D15 | `/live` @1440 | 568px of dead canvas — hero column pinned left | col 680px in a 1280px wrap | **OPEN** |

`/lsa` was walked at both viewports and is **untouched**: it is frozen as authored
(CLAUDE.md POLISH FREEZE), and its short last lines are Shane's line breaks, not defects.

---

## C1 — THE DOOR, AND WHAT IT COST

Two defects, one element. The disclosure line — the one line on this component whose entire job
is to be believed — rendered at 9.5px. The deep link to `/backstage` rendered at that same 9.5px
with no underline, so the only exit from the flagship component was a 127 × 15.2px target with
no affordance at all.

Both are now 12px. The link carries 700 weight, a persistent 1px underline at a 3px offset, and
6px of vertical padding. **Hit height 15.2 → 31.2px.**

### The height law was paid, not waived

A 12px footer costs height in all four modes. Every pixel came back off values that were off the
4px scale anyway:

```
.fd-top      margin-bottom  10 → 8      .fd            padding-bottom 14 → 12
.fd-phases   margin-bottom  10 → 8      .fd-foot       row-gap        12 → 8
.fd-phases   gap             5 → 4      .fd-roster     max-height    226 → 218, mb 10 → 8
.fd-outcome  margin-bottom  10 → 8      .fd-audio      margin-bottom  14 → 8
```

| Mode | Law | Measured | Drift |
|---|---|---|---|
| closed | 672 | **677.2** | +5.2 |
| roster-open | 671 | **671.2** | +0.2 |
| audio | 677 | **678.0** | +1.0 |
| roster-during-play | 614 | **616.5** | +2.5 |

Max drift **5.2px** against an 8px tolerance; all four ≤ 680.

### The constraint I could not clear

**`.fd-foot a` is 31.2px, not 44px.** Reaching 44 costs +24.8px and the height law has roughly
8px of room; buying it would have meant shaving the four phase rows, which are the component's
core reading rhythm. The link gains weight, size and affordance instead of a block. This is
recorded rather than quietly broken — it is the one target on the five surfaces still under the
floor after this run.

---

## C2 — ORPHANS KILLED IN CSS, NOT IN THE COPY

`text-wrap: balance` / `pretty`, **not `&nbsp;`**. That distinction is the whole point: an
`&nbsp;` swaps U+0020 for U+00A0 *inside the string*, so any gate, protected-anchor check or grep
that string-matches a headline silently stops matching. The words here are byte-identical to what
shipped; only the line breaking moved.

| Element | Before | After |
|---|---|---|
| `.fd-h` | `[312, 37]` | `[190, 160]` |
| `.bs-h2` | `[350, 46]` | `[204, 191]` |
| `.bs-result-line` | `[~300, 38]` | `[145, 172]` |
| `.fd-outcome` | `[231, 38]` | `[277, 72]` |
| `.fd-anchor` | `[214, LEAKING"]` | `[168, 147]` |

The anchor needed more than `pretty`: `pretty` only guarantees no one-word last line, and the
caller's words are a unit that must not split at all. The `<b>` already wraps exactly that phrase,
so `white-space: nowrap` on it took no markup change. It now breaks after the timestamp — where
the line wanted to break anyway.

---

## C3 — THE MOVED-COMPONENT SEAM (the run's best catch)

`.bs-support` carries `margin: 0 auto`. Inside `.bs-hero` that is correct: the hero is
`text-align: center`, so a capped measure centres under a centred headline. `/backstage` reuses
the same class in a **left-aligned** section, where the identical rule centres a 715px measure
inside a 1160px column:

```
/backstage @1440   BEFORE   .g-eyebrow x=140   .bs-h2 x=140   .bs-support x=362.3
                   AFTER    .g-eyebrow x=140   .bs-h2 x=140   .bs-support x=140
```

A 222px hanging indent under two flush elements — and it was the first thing on the deep page the
homepage component now points at. Nothing broke when the section moved; the section landed
somewhere its inherited centring stopped meaning anything. The centring is now scoped to the hero
that wants it. The homepage hero is unchanged (`ml` still 222.3px, still centred). Invisible at
390 in both cases, because there the max-width exceeds the column.

---

## C4 — THE JUNCTION JOINS THE PAGE'S OWN RHYTHM

Measured homepage section padding at 1440, before:

```
bs-3am 13 · #watch 34 · #hear 64 · #questions 64 · #pricing 64 · #book-cta 64
```

`.fd-sec { padding: 34px 0 !important }` applied one number at every viewport. Every
`.bs-section` steps to 64px at desktop and this `!important` rule was the only one that did not
follow — so the flagship sat 34px under the 3AM strip while the sections beneath it breathed at
110px and 140px. The defect is not that 34px is small; it is that the new component invented a
third rhythm on a page that already had one.

At 1440 `#watch` is now 64px, uniform with every neighbour. **390 is untouched**, so the height
law is untouched: RUN 4 existed to put this component in the same screen as the hero, and the
page's mobile sections run 38px, so 34 already reads as one rhythm there.

---

## C5 — TAP TARGETS + ONE LATENT TRAP

| Element | Before | After |
|---|---|---|
| `.bs-cliptab` (3, homepage) | 40 | 44 |
| `.bs-trade` (6, `/backstage`) | 40 | 44 |
| `.bs-clip-tx summary` | 40 | 44 |
| `.bs-news a` (5, FROM THE WIRE) | **23.2** | 44 (8px gap kept) |
| `/chauffeur .nav-cta` | 34.4 | 44 |

The FROM THE WIRE links were the real miss: five stacked navigational links on a 31px rhythm.
They are not inline links inside a sentence, so the WCAG inline exception does not cover them.

**D14 is latent, not live.** `.bs-3am` is an `<a>` that declared no colour, so it computed to the
UA default link blue `#0000EE`. Both of its children set their own colour, so nothing renders
blue today — but any bare text or `currentColor` child added to that strip would come out
browser-blue on a CIRCULANT surface. Named and closed.

---

## HIERARCHY — VERIFIED, NOT ASSERTED

The brief requires the eye to land on JOB BOOKED inside one screen. Measured from scroll 0:

| Mark | @390×844 | @1440×900 |
|---|---|---|
| H1 — the fear | screen 0.25 | screen 0.23 |
| Hero CTAs | 0.53 | 0.63 |
| **`CALL RESULT → JOB BOOKED`** | **0.79** | **0.78** |
| 3AM strip | 0.98 | 0.89 |
| `RESULT: JOB BOOKED` chip | 1.19 | 1.04 |

JOB BOOKED lands inside the first screen at both viewports, before any scroll, clear of the
sticky call bar. The claim holds.

---

## TASTE — NOTHING TO KILL

Every element on the component earns its place: the chip is green because the job is booked, the
glyph cluster encodes four lanes plus twelve more agents, the summary label is the honesty law
in one line, the lane rules are semantic. No multi-hue gradients, no decorative orbs, no
badges-as-ornament, no gold, no violet, no emoji-as-icon. Runs 3.5 and 4 already stripped these
surfaces. **Inventing a change here would have been churn, not craft** — so none was made.

---

## GATES

| Gate | Result |
|---|---|
| `tools/feed-verify.mjs` (17 checks) | **ALL CLEAN** |
| `tools/skin-verify.mjs` canonical five | **20/20** |
| All 25 city × trade pages | **100/100** |
| Landers, hubs, `/roi`, `/overview`, `/blog`, `/backstage`, `/watch`, `/booked`, `/chauffeur` — 22 pages | **88/88** (the 56/56 gate + 8 extra surfaces) |
| THE EYE — 5 component states @390×844 + 2 desktop passes | `audits/RUN45-01..07`, reviewed |
| `tools/stamp.py` | 56/56 stamped · 5/5 version-only armored · `?v=f6fdc22` |

### Gate-runner gotcha worth keeping

The first 25-page sweep returned **96/100**. The page was fine; the harness was not. Git Bash
MSYS path conversion rewrites the **first** `/`-prefixed item of `--pages=` into
`C:/Program Files/Git/milwaukee-hvac/index.html`, and skin-verify skips what it cannot navigate
to — silently under-reporting. Re-run with `MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*'` → 100/100.

**Any future `--pages=` sweep launched from bash on this machine needs that env var or it will
quietly under-count.**

---

## OPEN FOR SHANE — deliberately not fixed

Both are design decisions, not polish edits. This run did not make them unilaterally.

**1 · `/live` wastes half the desktop canvas.** At 1440 the entire hero column caps at 680px
pinned left (x=112 → 792) inside a 1280px wrap, leaving **568px** of dead canvas — the same
defect RUN 3.5 C2 fixed on the homepage and never carried across. The 680px is a deliberate
`--col` token used page-wide, so widening it, centring it, or putting something on the right is a
call about that page's canvas, not a spacing tweak. Say the word and it becomes a one-value change.

**2 · The homepage's desktop section step is 64px; APPENDIX A says ≥96px.** C4 made the component
match the page rather than diverge from it, which was the polish move. Raising the page-wide step
moves five sections at once and changes the whole scroll — that is a rhythm decision.

---

## ROLLBACK

```bash
git revert <stamp-commit>   # stamp + board + report
git revert f6fdc22          # c5 tap targets + latent colour
git revert 719f25b          # c4 junction rhythm
git revert 7d5de15          # c3 /backstage seam
git revert 12cdb69          # c2 orphans
git revert 565be65          # c1 the door
```

Newest first. Each commit is independently revertible and touches one concern. **c1 is the only
one that moves the height law** — reverting it alone returns the component to 672/671/677/614 and
the footer to 9.5px.
