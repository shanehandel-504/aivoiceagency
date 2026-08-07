# AIC RUN 13 — "STICKY + TIDY"

**Shipped** 2026-08-07 · **Scope** `chauffeur/` + `tools/` + `hq/board.json` + `reports/`
**Host** aichauffeur.ai · **Design system** Signal v1.4 → **Signal v1.5**

Two ratified fixes. Both landed. The interesting part of this run is not either
fix — it is that moving CSS between files broke the homepage twice in ways no
existing gate could see, and the instrument built to catch it found two live
defects nobody was looking for.

---

## 1 · WHAT SHIPPED

| § | Change | Where |
|---|---|---|
| 1 | Sticky rail is **Call + Book**, equal columns | 16 pages |
| 1 | `/book/` is the only `.rail--solo` page | moved off `/demo/`, `/terms/`, `/privacy/` |
| 2 | The homepage's embedded stylesheet is **gone** | 3 CSS homes → **2** |
| — | `.hero-console .hc-state` colour crossfade removed | STATE LAW, homepage fold |
| — | Rail no longer clips at 320px | measured 28px overflow, fixed |

`index.html` **212,100 → 75,090 bytes** (−137,010, all of it CSS that is now
cacheable instead of re-sent with every page view).
`assets/aic.css` **115,619 → 168,288**.

---

## 2 · § 1 — THE STICKY PAIR

The bar's second control used to be **Get a call back**, pointing at the
callback console further down the same page. A fixed bar spending half of the
only chrome a phone reader has on scrolling them to something already on the
page. It is **Book the setup call → `/book/`** now.

The callback console is **untouched** and is still the callback path: a reader
meets it by scrolling and opens it by tapping its own 64px header row.

- **Equal columns, not 60/40.** § 4's demo pair settled the idiom — two
  controls with different labels and no width rule read as a primary with a
  stray link beside it rather than as a choice. Hierarchy is the fill.
- **`.rail--solo` moved, and so did its reason.** `/demo/`, `/terms/` and
  `/privacy/` were solo because they have no callback form for the old control
  to point at. `/book/` exists on every page, so those three get the pair, and
  `/book/` becomes solo — a button offering to take the reader to the page they
  are on does nothing. Call stays there.
- **One filled blue holds.** `aic-run11-gate.mjs`: *rail never arms over a
  content primary* — **932 live scroll steps**, 16 pages × 6 viewports. The
  suppressor set needed no change: every `/book/` CTA on this site is either a
  `.btn-primary` or inside the footer, and both were already observed.

### The two labels do not fit on a phone, and that is arithmetic

Measured at the rail's own type, on the real faces — glyph + margin + label +
the control's own padding:

```
"Call (414) 775-0019"   194px       viewport 360 offers 328px of bar
"Book the setup call"   166px       viewport 390 offers 358px
                        -----
                        360px
```

No split of the columns fixes a 32px text shortfall. § 3's header chip settled
the identical problem the identical way, so the **verb drops below 480** and the
bar steps to **14px below 400**. At **320** — below the render gate's floor of
360 — the pair still overflowed by **28px** (tracks 324 into a 296px box), so
the box tightens there too. All four numbers are re-measurable with
`node tools/aic-run13-railfit.mjs`.

### The overflow probe that could not fail

The first version measured the CONTROL, and read a clean zero on a bar that was
visibly clipped. Two reasons, both worth writing down:

- `scrollWidth` on `overflow:visible` elements equals `clientWidth` however far
  a nowrap label runs — there is no scrolling box;
- a grid item's default `min-width` is `auto`, which resolves to **min-content**,
  so a nowrap label simply **grows its own `1fr` track**. The control never
  overflows. It cannot.

What overflows is the **bar**: the grown tracks plus the gap exceed its content
box. And page-level overflow probes cannot see that either — the rail is
`position:fixed` and `body` is `overflow-x:hidden`, which is RUN 9's *"a fixed
bar never hits scrollWidth"*. The gate sums the tracks, and its negative control
catches a deliberately overstuffed label at **195px** where measuring the
control reports **0**.

---

## 3 · § 2 — TWO CSS HOMES

`index.html` carried its own copy of the shell. That third home is why § 1's
trap has cost a run every time it fired since RUN 7; RUN 12's `details > div a`
was the most recent — an FAQ link underlined on eleven pages and colour-only on
the homepage, live since the section shipped, **with Lighthouse reading 100
either way**.

All sixteen pages now link `circulant.css` then `aic.css`, in that order, and
nothing else. Homepage-only rules live in `aic.css` under **RUN 13 · THE
HOMEPAGE COMES HOME**, positioned before the RUN 10/11/12 blocks so those still
override — the same order they had inside `index.html`.

### The acceptance test

`tools/aic-run13-parity.mjs` records the resolved computed style of **every
rendered element** on all 16 pages at 3 viewports — ~60 properties plus the box
— and diffs two states of the tree. Baseline taken from a `git worktree` at
HEAD, so nothing uncommitted was ever at risk.

**Result: 15 of 16 pages identical — 0 nodes differ.** The homepage differs on
**22 nodes**, and all 22 are intended:

| Delta | Nodes | Why |
|---|---|---|
| `summary` gains `min-height:44px` | 9 | the touch-target law, which the homepage FAQ had never had |
| `details > div` line-height 1.6 → 1.65 | 12 | FAQ answers now read identically on all sixteen pages |
| `.cta-tertiary a` gains `white-space:nowrap` | 1 | the value the other fifteen already had |

Two homepage values were **preserved rather than unified**, because this is a
housekeeping run and changing section rhythm is a design decision: `.sec-sub`
keeps `margin-bottom:2.5rem` (vs 1.25rem) and `.cta-stack` keeps `3rem`
(vs 1rem). They live in the shared home as `body.home` rules with the
disagreement written down beside them. **A scope is not a fork** — a fork is two
copies that can drift; this is one copy next to the value it differs from.

---

## 4 · THE FOUR THINGS THAT WENT WRONG, AND WHAT CAUGHT THEM

### 4.1 · A migrator that dropped 350 nodes of geometry — caught by parity

The first migrator emitted a rule when `aic.css` did not mention its selector.
It shipped a homepage missing its own layout, because **the interesting
selectors are the ones BOTH files declare**: `aic.css` carried the RUN 10/11/12
*override* for `.console`, `.step`, `.feat`, `.c-card` and `.btn`, while the
BASE those overrides were written against lived only in `index.html`.
Selector-level presence answered "yes, aic.css has it" and threw the base away.

Fixed by comparing **per property**: emit what `aic.css` does not say at all,
drop what it says identically, and treat same-property-different-value as a
human decision rather than a merge.

### 4.2 · A dead rule that the move brought back to life — caught by parity

`index.html` carried `@media(min-width:1020px){.cta-stack{margin-bottom:0}}`,
and it had not applied to anything in a long time: a **later** rule in the same
file set the `margin` SHORTHAND, which resets `margin-bottom`, and a media query
adds no specificity to break a tie source order has already decided.

Migrating it faithfully — same text, same query — put it *after* the shorthand
instead of before and **resurrected it**. The homepage hero lost 48px at
desktop and the whole page walked up 20px.

> **MOVING CSS CHANGES WHICH RULES ARE DEAD.** A rule that lost a source-order
> tie in its old home can win it in the new one, and it arrives looking like a
> verbatim copy. Only a rendered before/after finds this.

### 4.3 · A live STATE LAW violation on the homepage fold — found by accident

The parity harness recorded `.hero-console .hc-state` with the **same class** in
**two different colours** across two runs of identical code. That is only
possible while a colour is in flight.

`.hero-console .hc-state` carried `transition:color .25s`. `setState()` writes
`textContent` and `className` in one synchronous block — so the WORD changed
instantly and the COLOUR took a quarter second to follow, and for that quarter
second the chip read **"Trip captured" in the previous state's blue**.

That is exactly the defect § 2 STATE LAW was written against. RUN 10 gave
`transition:none` to the callback console's chip and to the dispatch ledger;
this chip — scene 1 of GLOW LAW, on the homepage fold — was never re-read
against the law. **Fixed.**

> If a probe reads a different value from a page that did not change, something
> on that page is animating that should not be.

### 4.4 · A "defect" that was the separator — caught by looking at the shot

RUN 13 measured the header chip at desktop (verb right 1095, digits left 1102),
read the 7px flex gap as a hole sitting on top of the span's own trailing space,
and removed it. **Trailing whitespace inside a flex item is trimmed** — the gap
was the only thing holding the word off the number. The chip rendered
`Call(414)`.

It also failed a second way first: applied to the base rule instead of scoped to
≥1024, it ADDED 7.2px where the verb is hidden, and the nav row went 1px past
its own content box at 360 on all sixteen pages. `aic-run9-gate.mjs` caught
that one; the screenshot caught the other.

**Reverted. The chip ships exactly as it always has.** The rail does it properly
via a `.rail-label` wrapper — verb and digits inline inside ONE flex item, where
a trailing space is ordinary text. Giving the chip the same wrapper is a markup
change on sixteen pages worth ~3px of tracking, and belongs to a run that is
doing chrome.

---

## 5 · GATES — ALL AGAINST PRODUCTION

| Gate | Result |
|---|---|
| 16 URLs, cache-busted fetch | **16/16 · 200 + rendered H1 + the new asset token** |
| Rail shape, live | **15 pair + `/book/` solo**, asserted as an exact set |
| `aic-run9-gate.mjs` — 16 pages × 6 viewports | **PASS**, 12 probes, 5 negative controls |
| `aic-run9-styleparity.mjs` | **PASS** — chrome identical across the homepage and 3 `aic.css` pages incl. depth two |
| `aic-run10-gate.mjs` — 12px floor, schema, CTA de-dup, canvas, llms.txt | **ALL GREEN**, 4 controls |
| `aic-run11-gate.mjs` — anchors, primary v3, rail, drawer, radius, haptics | **ALL GREEN**, 18 probes, 10 controls |
| `aic-run12-gate.mjs` — answer anatomy, claim ladder, tables, anchors | **ALL GREEN**, 7 controls |
| `aic-run13-railfit.mjs` | **PASS** — 56 controls × 8 widths × 4 pages, 1 control |
| `aic-run13-parity.mjs` (local, B0→B1) | **15/16 pages identical, 0 nodes** · homepage 22 intended |
| `aic-run10-faq-mirror.py --check` | **13/13 mirror visible copy** |
| `aic-run10-greps.py` | **ALL CLEAN** — 19 terms + the control |
| `aic-run9-livediff.mjs` | **PASS — 22/22 byte-identical**, 3 stamped assets 200 |
| Lighthouse, mobile, 16 pages | **a11y 100/16 · SEO 100/16 · CLS 0/16** |

The two probes that mattered most for § 1, both green on production:

```
rail never arms over a content primary      932 live scroll steps
two content primaries can never co-occur    16 pages x 6 viewports, exact
```

### Performance — the question this run had to answer

The homepage stopped inlining its CSS and started fetching a 168KB stylesheet.
That is the one thing § 2 could plausibly have cost, and trap 21 says it can
only be measured on production:

```
home         median of 3   perf 99 / 100 / 100   LCP 1685ms   CLS 0   TBT 0
integrations median of 3   perf 100 / 100 / 100  LCP 1599ms   CLS 0   TBT 25
```

**Homepage perf 100, CLS 0.000.** LCP is ~160ms above the ~1524ms RUN 11
recorded, which is inside this host's own run-to-run spread and did not move the
score. The homepage already fetched `circulant.css` as a render-blocking
stylesheet, so `aic.css` is a second request on a connection that was already
open — and 137KB of CSS moved from a document re-sent on every view into a file
that is cached across all sixteen pages.

Four pages read **perf 99** on their single run — `/book/`, `/how-setup-works/`,
`/limo-answering-service/`, `/airport-transfer-booking/`. Per trap 28 a one-run
99 is not a finding, and the gate's requirement is a11y / SEO / CLS. Printed,
not chased.

### THE EYES GATE

Opened, not counted — `audits/run13/shots/`:

- **rail at 390** — one filled blue, one hairline ghost, equal widths, the verb
  correctly gone and the digits reading cleanly beside the glyph;
- **rail at 480** — the verb back, with a single normal word space before the
  number, which is the `.rail-label` wrapper doing its job;
- **rail at 320** — both labels fully on screen, nothing clipped, after the box
  tightened;
- **`/book/` solo** — one full-width Call and no second control;
- **nav chip at 1440** — `Call (414) 775-0019`, back to exactly as shipped after
  the revert. This shot is the reason that revert happened.

---

## 6 · WHAT WAS NOT TOUCHED

`/book/`'s iframe loader, its `noscript` fallback and its minimum heights · every
form's routing and payload · the n8n contract · the callback console's
behaviour · `chauffeur/fonts/` · the brand kit and the root icon set ·
`tools/stamp.py` · anything outside `chauffeur/`, `tools/`, `audits/`,
`hq/board.json` and `reports/`.

**`chauffeur/assets/aic.js` changed in COMMENTS ONLY** — 317 executable lines
before, 317 after, proved by stripping comments from both and comparing. The
comments described the retired rail wiring, and § 6 COMMENTS SHIP makes a stale
comment a real defect: a grep-based audit reads it as live.

---

## 7 · GOTCHAS FOR THE NEXT RUN

1. **Compare CSS per PROPERTY, not per selector.** A selector both files declare
   is the dangerous one, not a missing one. See § 4.1.
2. **Moving CSS changes which rules are dead.** See § 4.2.
3. **A grid item with a nowrap label never reports overflow** — `min-width:auto`
   resolves to min-content and the TRACK grows. Sum the tracks against the
   container. `scrollWidth` on an `overflow:visible` box is not an overflow
   test either.
4. **Trailing whitespace inside a flex item is trimmed.** A `gap` between a
   verb span and its digits may be the only separator there is.
5. **`python -m http.server` deadlocks a headless browser.** It is
   single-threaded; Chromium holds six keep-alive connections and a page waiting
   on `networkidle` waits forever. No error, no timeout, no partial output — it
   reads like a broken probe and it is a broken server. `tools/aic-serve.mjs`
   now ships with the repo.
6. **A snapshot of an animating page diffs against itself** — 1,130 nodes of
   `opacity`/`box-shadow`/`transform` noise between two runs of identical code.
   Freeze with `getAnimations().forEach(a => { a.pause(); a.currentTime = 0 })`.
   It does NOT freeze a transition started by a JS class swap on a timer, which
   is how § 4.3 surfaced.
7. **Take a clean baseline from `git worktree add`, never a stash.**
8. **`networkidle` on `/book/` is a coin flip** — third-party booking iframe —
   and an uncaught throw there killed 95 downstream measurements. The RUN 11
   sweep now falls back to `load` and PRINTS that it did.
9. **`tools/run7_aic_polish.py` would re-emit the retired rail if re-run.**
   Banner added. Its "idempotent by construction" note does not protect against
   this: the markup it matches no longer exists, so "matches only the OLD form"
   now means "matches nothing, then writes the old form".
10. **The homepage still has no `<main>` and no skip link** while the other
    fifteen have both. Lighthouse a11y still reads 100, so no probe flags it.
    Carried from RUN 11 gotcha 8 and RUN 12 gotcha 10. Still true, still out of
    scope — and now cheaper than it has ever been, because the homepage no
    longer has a stylesheet of its own to reconcile.
11. **A `#ava-callback` deep link lands on a collapsed card on a phone.** The
    console opens on click, not on a hash landing. Equally true before RUN 13;
    what changed is that the rail's callback link no longer exists to mask it.
    The console was out of scope this run — the brief said untouched.
12. **DESIGN-SYSTEM § 3 claimed the nav verb drops at 380px.** The CSS drops it
    at 1024, which is what § 8 of the same file said. Corrected.
