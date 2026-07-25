# RUN 4.7 — CITATION TRUTH-LINKS + /LIVE DESKTOP RECLAIM + GREEN COMPLETION

**Date:** 2026-07-25 · **Repo:** `shanehandel-504/aivoiceagency` · **Branch:** `main`
**Pipeline:** per repo `CLAUDE.md` (§ 1 ENGINE PIPELINE)

---

## WHAT SHIPPED, IN PLAIN ENGLISH

Four jobs. One of them turned out to be already done, and saying so is the finding.

1. **The Google citation now points at the actual article.** The `/lsa` page quotes Google
   ("Missed calls may negatively affect your responsiveness.") and the link under it used to
   go to the *front door* of Google's Local Services help centre — a reader could click it and
   never find the sentence. It now goes to the exact page that sentence lives on, and the
   visible link text was changed to match, so what you read is where you land.

2. **`/live` stopped wasting half the desktop screen.** On a laptop the page's whole column
   sat pinned to the left inside a much wider frame, leaving roughly 600px of empty black to
   the right. The column is now wider and centred. Phones and tablets render byte-for-byte
   what they rendered before.

3. **The green button work was already finished.** The brief asked to remove a rule forcing
   the main button to cyan. That rule is gone — it was removed back in commit `605ef1d`.
   What was still wrong was the *written record*: `styles.css` carried a comment stating the
   button "renders CYAN" on every stamped page. That was false and would have misled the next
   person to read it. The comment is corrected; the code needed nothing.

4. **The gates can no longer lie about their own scope.** Details below.

---

## BLOCK A — GOOGLE CITATION TRUTH-LINKS

### The sweep

Grepped the whole repo for `support.google.com` hrefs **and** for Google quote blocks.
The result is smaller than the brief assumed:

| Search | Hits |
|---|---|
| `support.google.com` hrefs | **1** (`lsa/index.html:663`) |
| `<blockquote>` / `.gdoc-quote` | **1** (`lsa/index.html:660`) |
| Any other `google.com` href repo-wide | 0 citations — all remaining hits are `fonts.googleapis.com` font loads |

There is exactly **one** Google citation on the site. No other page quotes Google.

### Verbatim verification — done before the href was written

`curl` → `https://support.google.com/localservices/answer/7527305` → **HTTP 200**.
The page contains, as a complete sentence:

> Your responsiveness to customer inquiries and requests: **Missed calls may negatively affect
> your responsiveness.**

Our quote is that sentence, byte-identical. **Verbatim-verified: YES.**
No other candidate URL was needed, because no other quote exists.

### The change

| Page | Quote (first 8 words) | Old href | New href | Verbatim-verified |
|---|---|---|---|---|
| `/lsa` | "Missed calls may negatively affect your responsiveness." | `support.google.com/localservices` *(hub — banned by rail 4)* | `support.google.com/localservices/answer/7527305` | **Y** |

Visible link text was updated in the same edit from `support.google.com/localservices` to
`support.google.com/localservices/answer/7527305`, so **text and destination now match** (rail 4).

**Quote bytes: UNTOUCHED.** Verified in the rendered DOM after the edit —
`"Missed calls may negatively affect your responsiveness."`

**No unresolved quotes.** Rail 5 did not fire.

### One defect the change introduced, caught and fixed

The deep URL is 44 monospace characters at 11.5px ≈ 289px, inside a card interior of ~346px at
390px — and a URL is a single unbreakable token. Left alone it would have pushed horizontal
scroll onto `/lsa`, violating the zero-horizontal-scroll law. `.gdoc-attr a` now carries
`overflow-wrap:anywhere`. Measured after the fix at 390×844: link 289px wide inside a 346px
card, `linkOverflowsCard: false`, **document horizontal overflow 0**.

---

## BLOCK B — /LIVE DESKTOP RECLAIM

### The defect

`live/index.html` declared `--col:680px` with `.col{max-width:var(--col)}` and **no auto margin**,
inside `.wrap{max-width:1280px;margin:0 auto}`. At 1440 the column sat hard left and left roughly
600px of dead canvas to its right. This is the item RUN 4.5 logged as *"OPEN FOR SHANE"* and
deliberately did not fix.

### Was there a portable token? No — and that was checked, not assumed

The homepage exposes **no** `--col`/`--wrap` container token. Its post-Run-3.5 answer to the same
problem is written inline on the component:

- `css/backstage.css:682` — `.bs-tiers{… max-width:1080px; margin:0 auto}`
- `css/backstage.css:225` — `RUN 3.5 · DESKTOP SCALE (>=1024px only — mobile is untouched)`,
  whose stated principle is *"A product page at desktop width has to USE the width."*

So there is nothing to import. Per the brief's own fallback, `/live` takes the same **shape**
locally: `--col` → **960px**, column **centred**, scoped to **≥1280px**.

### Measured, both ends

| Viewport | `--col` | `.col` width | Left / right gap | `.col` margin-left | h-overflow |
|---|---|---|---|---|---|
| **1440×900** | `960px` | **960px** (all 5 columns) | 233 / 248 *(15px delta = scrollbar)* | `auto` | **0** |
| **390×844** | `680px` | 342px | 24 / — | `0px` | **0** |

Mobile is **byte-untouched**: the media query does not fire, `--col` is still `680px`, the margin
is still `0`, and `.step .b p` still computes `max-width: none`.

### Measure law protected

Widening a column stretches line length. Every prose block on `/live` was already capped in `em`
(`.hero p.sub` 34 · `.sec-head p` 36 · `.faq .a` 40 · `.endcard p` 34), so the widening cannot
reach them. `.step .b p` was the **one uncapped paragraph** and would have run ~115 characters at
960px. It is capped at `44em` inside the same ≥1280 block — desktop only, mobile untouched.

### Homepage

**Untouched.** Zero edits to `index.html`, `css/backstage.css`, `assets/*`. The flagship component
was not opened, so the height law is not in play. Independently confirmed by `feed-verify`, which
measures that component every run: **677 / 671 / 678 / 616px, all ≤680.**

---

## BLOCK C — GREEN PRIMARY COMPLETION

### Item 9 was already complete — stated plainly rather than re-done

The brief asked to kill a `bridge.css` override forcing `.btn-primary` to cyan.
**That override does not exist.** `assets/bridge.css:415` reads:

```css
.btn-primary{… background:var(--green); color:var(--canvas); …}
```

`git log -S` dates the change to **`605ef1d`** ("skin-c1: tokens + green CTA system").
`.btn-primary{` is declared in exactly one place in `assets/*.css`. No cyan fill remains.

### Contrast rule — verified against the tokens, not assumed

| Surface | `--green` | Label | Ratio | Source |
|---|---|---|---|---|
| Dark | `#2EE6A8` | `--canvas` `#0A0A0F` | **12.23:1** ✓ | `assets/circulant.css:61,68` |
| Light | `#0B7E56` | `#FFFFFF` | **5.08:1** ✓ | `assets/bridge.css:76,103-104` |

White on `#2EE6A8` measures 1.62:1 and **is never used** — dark keeps `--canvas`. Matches the
brief's rule exactly.

### What was actually broken: the record

`styles.css` carried a RUN 3.5 note asserting bridge.css "redeclares `.btn-primary` with
`background:var(--bz-cyan)`, so on every STAMPED page the primary renders CYAN". That statement
was true when written and is **false now**. It is the kind of stale comment that sends the next
reader hunting for a rule that no longer exists. Rewritten to record the RUN 4 rider that made the
call, the per-theme label ruling, and the RUN 4.7 re-verification.

### Item 10 — re-run across all stamped pages

Done, and it is the proof for this block: skin-verify counts a solid green CTA as
`#2ee6a8`/`#0b7e56`. **Every one of the 25 city×trade pages reports `green=1` in all four
viewport/theme combinations**, as do `/index`, `/live`, `/lsa` and `/index#pricing`. The primary
is green on the wire, measured on rendered pages.

---

## BLOCK D — HARDEN THE RAILS

### New file: `tools/gate-pages.mjs`

The RUN 4.5 report records the gate *result* ("88/88 … 22 pages") but never which 22 pages. The
list existed only as a hand-typed `--pages=` string in a terminal. **A gate whose scope lives in
scrollback is not a gate.** The sets are now version-controlled data:

| Export | Pages | Checks | Gate |
|---|---|---|---|
| `PAGES_CITY` | 25 | 100 | city × trade |
| `PAGES_LANDERS` | 22 | 88 | landers/hubs/backstage/chauffeur |
| `PAGES_FIVE` | 5 | 20 | canonical five |

`PAGES_CITY` is **derived** from the same `CITIES × TRADES` arrays `stamp.py` loops over, so the
two cannot drift. The file **self-asserts at import time** — wrong length, wrong check count, or a
duplicate entry throws rather than silently measuring the wrong thing.

### `tools/skin-verify.mjs` — the under-count is now fatal

Three changes:

1. **`--set=city|landers|five|all`** — pulls the pinned list; no shell string to mangle.
2. **pages × 4 sanity check.** A page that failed to navigate used to `continue` *without*
   incrementing `checks`, so the run printed `96/100 clean` and **exited 0**. The total is now
   asserted against `pages × 4`; a short run prints `UNDER-COUNT`, names every skipped
   page/viewport/theme, and **exits 1**.
3. **MSYS guard + note.** The usage block documents
   `MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*'`, and if a `--pages=` item arrives already
   rewritten to a Windows path the runner refuses to start with an explanatory error.

### `CLAUDE.md` — three standing rails added to § 4 HARD LAWS

- **Orphan fixes are CSS line-breaking only — never `&nbsp;`.** A hard space is invisible in
  source, survives copy-paste into a CRM, and welds two words together at every viewport to fix one.
- **Homepage component height law: ≤680px is the HARD CEILING**; the four mode numbers are
  *targets*. Measure the rendered component, do not compute it from CSS.
- **Homepage desktop section rhythm = 64px** (ratified 2026-07-25) — explicitly noted as
  overriding § 3's ≥96px *for that page only*, so the two rules stop contradicting each other.

This closes the second RUN 4.5 "OPEN FOR SHANE" item by ratifying it rather than changing five
sections at once.

---

## GATES

| Gate | Scope | Result |
|---|---|---|
| `tools/feed-verify.mjs` | 17 checks | **ALL CHECKS CLEAN** |
| `tools/skin-verify.mjs --set=five` | 5 pages × 4 | **20/20** · scope self-verified |
| `tools/skin-verify.mjs --set=city` | 25 pages × 4 | **100/100** · scope self-verified |
| `tools/skin-verify.mjs --set=landers` | 22 pages × 4 | **88/88** · scope self-verified |
| THE EYE | `/live` @1440×900 + @390×844 · `/lsa` citation @390×844 | **10 shots, reviewed** — `audits/RUN47-*` |

Every page in every sweep reported `green=1, aa=0, overflow=0`.

### THE EYE — what was actually looked at

| Shot | Reading |
|---|---|
| `RUN47-live-desktop.png` (1440×900) | Column spans 240→1200 and is centred; the waveform and the trust-row hairline now reach the full 960px instead of stopping at 913px. Dead right canvas **gone**. |
| `RUN47-live-mobile.png` (390×844) | Unchanged — confirmed against the DOM: `--col` 680px, `margin-left: 0`, `.step .b p` `max-width: none`. |
| `RUN47-live-webkit-390-{dark,light}.png` | iOS Safari clean, both themes. |
| `RUN47-lsa-citation-390.png` | Quote verbatim; attribution line reads `support.google.com/localservices/answer/7527305`, wrapping inside the card; `linkFitsCard: true`, `hOverflow: 0`. |
| `RUN47-lsa-{desktop,mobile,webkit-390-*}.png` | Page clean, both viewports, both engines. |

Every sweep now prints its own expected total (`scope: N pages x 4 = M expected`), so a
short run cannot pass as a clean one.

---

## ROLLBACK

| Unit | Rollback |
|---|---|
| Block A — citation | `git revert <sha>` |
| Block B — /live | `git revert <sha>` |
| Block C — comment | `git revert <sha>` |
| Block D — rails | `git revert <sha>` |

---

## GOTCHAS

- **The brief's Block C premise was stale.** The cyan override was removed in `605ef1d`. Re-doing
  it would have been churn; the real defect was a comment asserting the opposite of the code.
- **Only one Google citation exists site-wide.** Block A's multi-quote machinery (candidate URL
  list, rail 5 unresolved-quote path) never had a second quote to run against.
- **A deep citation URL is a horizontal-overflow risk** on a 390px screen. Any future
  deep-link swap needs `overflow-wrap` on the anchor.
- **`$TMPDIR` is not set in this Bash.** Redirecting to `"$TMPDIR/x.log"` resolves to `/x.log` →
  *Permission denied*. Use the absolute scratchpad path.
