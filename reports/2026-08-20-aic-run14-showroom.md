# AIC RUN 14 — "SHOWROOM"

**Date:** 2026-08-20 · **Host:** aichauffeur.ai (separate Vercel project, root `/chauffeur/`)
**Commits:** `0a48f83` (content) + `145b01f` (cache armor) · **Branch:** main
**Gate:** `node tools/aic-run14-gate.mjs` — 18 pages × 320/360/390/430/1440 — **PASS**

---

## THE ONE-LINE VERSION

The rate card stops being a grid on a phone, the reservation panel is actually
raised, both money pages carry two doors instead of one, and four CSS rules that
had already lost their cascade fights were found by rendering the site and
reading the computed styles back instead of reading the stylesheets.

---

## WHAT WAS BROKEN AND HAD BEEN FOR A WHILE

Every one of these was live before this run. None of them threw an error, and
none of them is visible in a diff — a stylesheet says what was meant, and only a
browser says what happened.

### 1 · `/rates/` — a rule that lost four of its seven declarations

`.rate-grp th` is one class and one type selector: **(0,1,1)**.
`aic.css` carries `.tbl tbody th`: one class and two type selectors, **(0,1,2)**.

The shared rule wins no matter which file loads first, so four declarations never
applied:

| Declaration | Intended | Actually rendered |
|---|---|---|
| `font-family` | `var(--mono)` | Space Grotesk |
| `font-size` | `.75rem` (12px) | 16px |
| `font-weight` | `500` | 600 |
| `color` | `var(--sky)` | `--ink` |
| `letter-spacing` | `.16em` | `.16em` ✓ (nothing competed) |
| `background` | `--surface-2` | ✓ |
| `padding` | `.85rem 1rem` | ✓ |

The five vehicle-family headers shipped as body-face text at body size in body
colour, wearing an eyebrow's tracking — a hybrid nobody designed, on the labels
whose only job is to break fifteen rows into five short lists. Selector raised to
`.rate-tbl tbody tr.rate-grp th` (0,2,3).

### 2 · `/reserve/` — the page's only primary was the only 54px primary on the site

`.hold-submit{min-height:54px}` restated `.btn`'s own desktop value. Harmless
looking, and not: `aic.css` also carries
`@media(max-width:767.98px){.btn{min-height:56px}}` at the **same specificity**
and **earlier in the cascade**, because a linked stylesheet is always earlier than
a page `<style>`. So the page rule won on a phone. Restating a shared value is how
a page opts out of a system without saying so.

### 3 · Sitewide — every button label was 12px on a phone

`@media(max-width:600px){.btn{font-size:.75rem}}`. Its own comment says why it
exists: ONE homepage setup label was the longest string on the site, it carried a
hyphen, and it broke onto two lines. The same comment then says the label was
replaced with a shorter one and the control now has "roughly 90px more room than
the string needs."

The label went. The shrink stayed. "Place the reservation hold" — the single
control `/reserve/` exists to collect a press on — rendered at 12px, under 16px
input text, beside a 17px phone control.

### 4 · The RUN 13 defect, alive on a different element

`.calc-v[data-empty="true"]{color:var(--neutral);opacity:.5}` — `--neutral` is
6.38:1 on midnight; half of it composites to **2.41:1**, on a 24px figure, under
the floor even at the large-text threshold of 3. RUN 13 removed this exact
construction from `/reserve/`'s card block after the render gate found eight
failures. It survived here because nobody re-measured a placeholder.

### Also found by rendering

- **`/book/`'s `.sk-note` at 10.88px** — the only text under 12px on eighteen
  pages. RUN 10 set the floor in `aic.css` and listed eleven rules under it; this
  rule was added to a page `<style>` afterwards, and a shared list cannot cover a
  rule it was never added to.
- **`.calc-basis` at 122.3 characters of measure** at desktop, on the one
  paragraph that explains where a number came from.
- **The homepage was the only page of eighteen with no skip link and no
  `<main id="main">`** — and it has the longest nav to skip past.
- **The disclosure dot on `/reserve/` was orphaned on its own line** at both
  viewports. `flex-wrap` on a row holding a 6px dot and a 30-word sentence does
  exactly what it is told.
- **`.btn` height was a function of where the button was standing** — 56px in
  most sections, 58px inside `#crush`, purely from inherited leading.
- **The demo card's three sub-fields sat at three different heights** inside three
  equal-height columns, because "Security code" wraps in an 84px column and "ZIP"
  does not.

---

## WHAT SHIPPED

### `/rates/` — rate card RCv1.0

- **Money right-aligns.** Tabular numerals line the digits up *inside one number*.
  They can do nothing for two numbers in a left-aligned column, where `$75` and
  `$115` share a left edge and their units digits sit one place apart — which is
  the exact comparison a reader makes scanning for the jump between classes.
  Headers move right with their cells.
- **"Set on the call" is status text, not a figure.** It and "2 hours" were both
  `.rate-min` in `--neutral`. One is a value the card quotes; the other is the
  card saying it does not have one yet. `--ink-soft` tabular figure vs `--neutral`
  mono uppercase status, which is what `--neutral` literally means.
- **Under 560px the table is one block per vehicle.** Fixed column widths do not
  invent space: the first cut pinned the columns to percentages and `WEEKDAY` /
  `WEEKEND` each demanded 64px inside a 42px column, rendering as
  `WEEKDAWEEKENHOURLY` at 390. Four columns whose *headers alone* demand
  110+77+77+77 = 341px cannot live in the 342px a 390 phone leaves.
- **The semantics survive the `display:block`.** Explicit
  `role=table/rowgroup/row/columnheader/rowheader/cell` and a **clipped** (not
  hidden) `<thead>`. Asserted with a live CDP accessibility snapshot at 390:
  `table=1 rowgroup=6 row=21 columnheader=9 rowheader=15 cell=45`.
- **Visible keys are real `<span aria-hidden="true">`, not `::before` content** —
  CSS `content` is announced by some screen readers and the column header is
  already in the tree.
- **Desktop caps the table at 720px.** Measured, this card's honest content width
  is ~530px; across an 1180px wrap it put 130px of nothing between a vehicle and
  its price. It now lands on the same left-aligned measure as the note and CTAs
  below it.
- **The scroll hint came off the page.** Nothing scrolls at any width now, so
  "Scroll the table sideways to see the hourly minimum" was an instruction that
  is false everywhere. That is a bug fix, not a copy edit.
- **The one phone number on the page is a `tel:` link.** Visible string unchanged;
  `.rate-live a` joined the shared in-body-link underline list in the same edit
  that created the link, because a new in-body link without a non-colour
  distinguisher is exactly what RUN 9 was caught by.

### `/reserve/` — reservation hold

- **The panel is raised for real.** It was `--surface` on a section whose lighting
  is `transparent`: #0D1420 on #070B14, a **1.08:1** step, with a drop shadow that
  had nothing to lift. Moved to `--surface-2`, so the ladder now reads
  midnight → `--input-bg` wells → `--surface` → `--surface-2` panel, and the
  inputs are darker than the card holding them.
- **The legend is the panel's title bar**, full-bleed on a `--surface` strip with
  a hairline under it — the same relationship `.cb-form`'s head has to its body.
- **The disclosure row does not wrap.** The dot is `flex:0 0 6px` at a specificity
  that beats the `span` rule also matching it (the first fix rendered the 6px dot
  **130.2px** wide).
- **The demo block is a strip, not a second form.** Three fields on one row from
  390 up, inputs bottom-aligned so the labels can be as tall as they need to be.
- **Nothing about the DEMO block's behaviour changed.** Every control is still
  `disabled`, the fieldset is still `disabled`, the values are still the literal
  words DEMO and NO CHARGE, and "DEMO — no charge, no card required." is byte
  identical. The TCPA checkbox is unchanged in meaning and still `required`.
- **Helper text 13.6px → 14.4px.** Helper text arrives before the mistake it
  prevents, which only works if it is read.

### Homepage + `/demo/` — two doors, one funnel

`Call the demo — (414) 775-0019` (filled, with its own sub-line) stands beside
`Get a discovery call` (ghost, → `/book/`), **same height, different weight**,
above the fold on both pages and again in `/demo/`'s closing CTA.

The setup call used to be a text link *below* the callback form. A door a reader
has to scroll past is not a door.

Two things the render caught here:

- The pair wants **561.2px**; `.cta-stack` caps at 520 and `.cta-stack--wide` at
  560, so the first cut **shipped as a stack with nothing to say so**.
  `.cta-stack--pair` is 580, measured against a 607px `hero-left` column.
- `.tel-main` was `white-space:nowrap` — correct for a phone number, fatal for a
  30-character label. The nowrap moved off the label and onto `.tel-verb` and
  `.tel-num`, so the phrase and the number can part company but neither breaks
  inside itself.

### Sitewide formatting

| Fix | Before | After |
|---|---|---|
| Button label on phones | 12px | 16px, tighter padding, wrap allowed below 600 only |
| Button box height | 56 or 58, by inherited leading | `line-height:1.2` — padding + min-height, everywhere |
| Eyebrow tracking | 7 values across labels | **every LABEL on .16em** |
| 12px type floor | one violation (10.88px) | zero |
| Paragraph measure | one at 122.3ch | none over 75ch |
| Skip link + `<main>` | 17 of 18 pages | 18 of 18 |
| `.calc-v` empty state | 2.41:1 | 6.38:1 |

**On the tracking that is still spread:** after this run the site still renders
.04, .06, .08, .10, .11, .12 and .14em somewhere, and every one is a console
readout, a status chip, a breadcrumb or the footer colophon. **None of those is an
eyebrow.** Sweeping them in would have been consistency bought with legibility on
the exact text a dispatcher reads at 2AM. The claim this run makes is narrow and
checkable: *every label is on .16em*, and the gate prints the full census with the
class names behind each value.

### AEO + index

- **`llms.txt`** gained `/rates/` and `/reserve/`, a "two ways in" section naming
  the exact two controls above the fold, and two new boundary lines — nothing on
  the site charges a card, and a reservation hold is a request rather than a
  confirmed booking. **Rates are deliberately not duplicated there**, so there is
  only ever one place they can be wrong.
- **`sitemap.xml`** — all 18 `lastmod` move to 2026-08-20, and the file says why:
  `assets/aic.css` changed and all 18 pages load it. The comment also states the
  rule for next time, so a file where every date is always today does not become
  the habit.
- **IndexNow** — 18 URLs submitted to `api.indexnow.org` and `bing.com/indexnow`.
  **HTTP 200 from both, 1037 bytes uploaded to each** (upload size asserted, not
  assumed — a `--data-binary @file` that cannot read its file still returns 200).

---

## THE TRAP THAT COST THE MOST CARE

`python tools/stamp.py` armors the **whole repo**, and on aivoiceagency.ai its
`PAGES` pass does more than rewrite a `?v=` token: it **re-injected the
`BRIDGE:CRUMBLD` BreadcrumbList that RUN A deliberately deleted** from
`/backstage` and 59 other parent pages.

That is a ratified fix on a different brand, and this run has no business undoing
it. All 60 non-chauffeur `.html` files were reverted with `git checkout` before
the stamp commit, and the result was verified rather than assumed: the string
`0a48f83` appears in **no file outside `chauffeur/`**, and `aivoiceagency.ai`
still serves `circulant.css?v=119c51e` in production.

The chauffeur pages are `VERSION_ONLY`, which rewrites the token and the inline
`__ASSET_V` literal and injects no chrome. Confirmed on a page this run never
edited (`/privacy/`): the diff is three tokens and nothing else.

---

## DONE TABLE

| Page | Live | URL |
|---|---|---|
| Rate card RCv1.0 | ✅ | https://aichauffeur.ai/rates/ |
| Reservation hold | ✅ | https://aichauffeur.ai/reserve/ |
| Homepage (two doors) | ✅ | https://aichauffeur.ai/ |
| Live demo (two doors) | ✅ | https://aichauffeur.ai/demo/ |
| Book the setup call (12px floor) | ✅ | https://aichauffeur.ai/book/ |
| 13 other pages (shared formatting) | ✅ | via `assets/aic.css` |
| `llms.txt` | ✅ | https://aichauffeur.ai/llms.txt |
| `sitemap.xml` (18 URLs, fresh lastmod) | ✅ | https://aichauffeur.ai/sitemap.xml |
| IndexNow | ✅ | 18 URLs · HTTP 200 · 1037 bytes each |

## ROLLBACK

| Checkpoint | Command |
|---|---|
| Everything | `git revert 145b01f 0a48f83` |
| Content only, keep the cache token | `git revert 0a48f83` |
| One page | `git checkout 4a33a30 -- chauffeur/rates/index.html` |

## GATE COMMANDS

```
node tools/aic-serve.mjs 8848          # serve chauffeur/ locally
node tools/aic-run14-gate.mjs          # 18 pages x 5 widths, 8 assertions
node tools/aic-run14-audit.mjs         # census: measure, eyebrows, buttons
node tools/aic-run14-shots.mjs --tag x --pages "/,/rates/"
node tools/aic-run14-zoom.mjs --page /reserve/ --sel ".hold-form" --w 390 --tag hf
```

Run the shots and zoom tools from **PowerShell**, or export `MSYS_NO_PATHCONV=1`
first: Git Bash rewrites a leading-slash argument into a drive path and silently
eats the first entry of a comma-joined `--pages` list.

## GOTCHAS FOR THE NEXT RUN

1. **`tools/stamp.py` is not safe to commit wholesale from a chauffeur run.** It
   touches 60 parent-site pages and re-injects a BreadcrumbList RUN A removed.
   Stamp, then revert everything outside `chauffeur/`, then grep for the new hash
   to prove the revert took.
2. **A page-scoped rule cannot be covered by a shared list.** The 12px floor block
   in `aic.css` names eleven rules. `/book/` added a twelfth in its own `<style>`
   after the block shipped. Floors have to be *measured*, not enumerated.
3. **Restating a shared value is how a page opts out of a system.**
   `.hold-submit{min-height:54px}` looked like documentation and was an override.
4. **A media query adds no specificity.** `.rate-k{display:none}` written *below*
   the media query that set `display:block` beat it on source order alone, and
   every key vanished at 390.
5. **A snapshot of a fade is not a contrast measurement, and opacity:0 is not a
   contrast failure.** The first gate run reported 63 console rows as 1:1. The
   hero console is `IntersectionObserver`-gated and below the fold under 1020px,
   so its rows sit at opacity 0 forever there. The gate now defers elements under
   a *running* animation and skips elements that are not painted — which is
   exactly how the **declared** `opacity:.5` on `.calc-v` stayed visible.
6. **`page.accessibility.snapshot()` no longer exists in Playwright.** Use
   `context.newCDPSession(page)` → `Accessibility.getFullAXTree`.
7. **`display:block` on a table strips the table roles in every engine.** If you
   restructure a table for mobile, add the roles in the same edit, keep `<thead>`
   clipped rather than `display:none`, and assert the tree — do not assume it.
8. **`curl --data-binary @file` returns 200 with an empty body if it cannot read
   the file.** Assert `%{size_upload}` or the ping is a green run that submitted
   nothing.
