# AIC RUN 8 — "FONT LOCK"

**Site:** aichauffeur.ai (12 pages) · **Repo:** `shanehandel-504/aivoiceagency`, root `chauffeur/`
**Commit:** `ccd3b26` · **Run executed:** 2026-08-06 · **Filename date** is the brief's, kept as issued.

---

## WHAT THIS WAS

RUN 7 finished by naming the one thing still moving the homepage: the webfont arriving from
Google's CDN and re-wrapping the `h1`. This run brought the fonts home and killed the shift.

Three things a non-coder can see:

1. **The page stops jumping.** The homepage's layout shift score went from **0.126 to 0.000** on a
   phone. That number is Google's own measure of "text moved while you were reading it," and it is
   part of how the page is ranked. Every one of the 12 pages now reads essentially zero.
2. **Nothing on the site asks Google for anything any more.** Every page used to make two requests
   to Google's servers before it could show its own typeface. That is now zero, on all twelve.
3. **Not one line of text moved.** That was the risk worth being careful about — a font file that
   differs by a single character re-wraps every paragraph on the site. It was checked first, and it
   was checked by measuring 1,074 pieces of text on three pages at three screen widths, before and
   after. Zero changed.

---

## THE FINDING THAT MADE THIS SAFE

Before any file was edited, the two `chauffeur/fonts/*.woff2` files already in the repo were
compared against what Google's CDN actually serves for this site's exact request.

They are **the same files. SHA-256 identical, byte for byte.**

```
space-grotesk.woff2   repo 0640890476FC1198AB4DE571FB658DE443C4D85B66466EC09534A8737AB1CE9D
                    google 0640890476FC1198AB4DE571FB658DE443C4D85B66466EC09534A8737AB1CE9D
jetbrains-mono.woff2  repo 83C005D49D8A6A50474C73A5A36AC0468076E9C4A29DA7BDB14995D80560A5BE
                    google 83C005D49D8A6A50474C73A5A36AC0468076E9C4A29DA7BDB14995D80560A5BE
```

Both are variable fonts (`wght 300–700` and `wght 400–800`), same 230 / 229 codepoints, same
`unitsPerEm`, same ascent / descent / line-gap, and **identical advance widths on every glyph at
every weight the site uses** (300/400/500/600/700 sans, 400/500 mono). Self-hosting could not
re-wrap a line, because it is not a different font — it is the same bytes from a different host.

**Step 1 of the brief said to stop and report if coverage was short. It was not short. It was exact.**

### What measuring corrected in the brief's model

The brief expected two Google font files per page. There was **one**. `JetBrains Mono` has been
self-hosted since RUN 3.5 (`circulant.css`), and because that `@font-face` is declared *after* the
Google stylesheet link, it was already winning the font-matching contest. Only Space Grotesk was
still leaving the origin. The "before" gate reads `self-hosted-font 1` on every page — that is what
that number was.

---

## DONE TABLE

| # | What shipped | Where | Proof |
|---|---|---|---|
| 1 | Subsets verified against Google's own files **before editing** | `chauffeur/fonts/` | SHA-256 identical ×2; cmap 230/229 identical; advances identical at all 7 weights in use |
| 2 | Every reachable glyph checked against the shipped coverage | 12 pages + 2 stylesheets + `aic.js` | 100 distinct codepoints reachable; 3 outside the subsets, all 3 outside **every** Google subset too — already system-rendered today |
| 3 | Google links removed | all 12 pages | 2 preconnects + 1 css2 stylesheet gone ×12; **0** `fonts.googleapis.com` / `fonts.gstatic.com` references remain anywhere in `chauffeur/`, comments included |
| 4 | Preloads added | all 12 pages | 2 × `<link rel="preload" as="font" type="font/woff2" crossorigin>`, same URL string as the `src` |
| 5 | `@font-face` in **both** CSS homes — and the third | `circulant.css` · `aic.css` · `index.html <style>` | one canonical block, **3854 chars, byte-identical in all three**, asserted by the gate |
| 6 | `font-display:swap` + metric-matched fallbacks | same block | Space Grotesk ← Arial `size-adjust:108.9963%` / `ascent:90.2783%` / `descent:26.7899%`; JetBrains Mono ← Courier New `99.9837%` / `102.0166%` / `30.0049%` |
| 7 | **Zero external font requests** | 12 pages, live | 26 → **0** from our documents. `/book/`'s 2 come from inside the third-party calendar iframe (below) |
| 8 | **Zero line-break changes** | / · /demo/ · /limo-answering-service/ at 360/768/1280 | **1074 text nodes, 0 changed** — pre-run local build vs **LIVE production** |
| 9 | The probe was proved able to fail | same probe, woff2 refused | **534 nodes flagged**. "Zero" is a reading, not an absence of looking |
| 10 | Homepage CLS ≤ 0.05 mobile | live, median of 3 | **0.1261 → 0.0000** |
| 11 | a11y 100 · SEO 100 hold ×12 | live | 12/12 both, zero failing audits |
| 12 | No perf regression | live | homepage median **92 → 99**, LCP **2327ms → 1702ms**; all 12 at 97–100 |
| 13 | Screenshots committed | `audits/run8/` | `{before,after,LIVE}-{home,demo}-{390,1440}.png` — 12 shots |
| 14 | **LIVE-DIFF** | 12 production URLs, cache-busted | **12/12 byte-identical**, 0 Google refs, 2 preloads each; both woff2 **200 + byte-identical + immutable** |

### The numbers, before and after

| Measure (Lighthouse mobile) | Before | After (live) |
|---|---|---|
| Homepage CLS, median of 3 | **0.1261** | **0.0000** |
| Homepage performance, median of 3 | 92 | 99 |
| Homepage LCP, median of 3 | 2327 ms | 1702 ms |
| Worst CLS on any page | 0.126 | 0.005 |
| External font requests, our documents, 12 pages | 26 | **0** |
| a11y / SEO at 100 | 12 / 12 | 12 / 12 |

Full-page heights are identical to the pixel before, after and live —
`/` 11448 px @390 and 8700 px @1440; `/demo/` 3935 px and 3163 px.

---

## HOW GOOD IS THE FALLBACK, MEASURED

The negative control is also the answer to "does the metric match actually work." With the real
faces refused outright — the worst case, a font that never arrives — the same diff reports:

| | count |
|---|---|
| nodes compared | 1074 |
| line **splits** that actually moved | **76 (7.1%)** |
| nodes where the same words stayed on the same lines, width only | 458 |
| median line-width delta | 4.82 px |

So even with the webfont entirely absent, the metric-matched fallback holds **92.9% of line splits**.
With the font present — the real case — it holds 100%.

---

## THE ONE DEVIATION FROM THE BRIEF

The brief said to metric-match **vs Arial**. The sans fallback is Arial, as asked. **The mono
fallback is Courier New, and that is a deliberate departure.**

| | advance width | spread across A–Z a–z 0–9 |
|---|---|---|
| JetBrains Mono | 0.6000 em | 0.0% (monospace) |
| **Courier New** | **0.6001 em** | **0.0%** (monospace) |
| Arial | 0.4427 em avg | **72.2% of an em** |

Arial is proportional. Backing a monospace face with a proportional one means every mono label —
every eyebrow, ticket field, timestamp and nav link on the site — re-flows the instant the real face
lands, which is precisely the defect this run exists to remove. Courier New is a 0.02% width match
and is monospace. Using Arial there would have satisfied the letter of the brief and broken its
purpose.

---

## WHAT WAS NOT TOUCHED

Verified by empty diffs on the commit, not by intent:

- `chauffeur/assets/aic.js` — **empty diff**. Forms and the n8n payload are untouched.
- `/book/`'s iframe loader — the JS-attached `src`, the `IntersectionObserver`, the `<noscript>`
  twin. The only change to `book/index.html` is the same head-of-page font swap as the other 11.
- Board wiring, calendars, workflows, GHL. Nothing outside `chauffeur/` and `tools/` moved.

---

## ROLLBACK

One commit, one unit:

```bash
git revert --no-edit ccd3b26 && git push
```

Vercel redeploys `aichauffeur.ai` from `main`. Nothing else to unwind — no workflow, no calendar, no
webhook, no GHL record was touched. The asset cache tokens revert with the pages, so a returning
visitor is not stranded on a half-reverted stylesheet.

---

## WHAT'S NEXT

- **`/book/` Best-Practices is 79 and stays there.** Unchanged from RUN 7. It is the GHL booking
  iframe and it is exempt by the brief.
- **`.kicker::before` runs `pulse 2s` with no reduced-motion guard.** Found by this run's own
  screenshot control, not looked for. CLAUDE.md's GLOW GATE says decorative motion must be
  reduced-motion-safe; this one is not. It is cosmetic, it is pre-existing, and it is out of scope
  here — but it is the reason two screenshots of the *same build* are never byte-identical, and the
  next run that tries to diff homepage images will hit it.
- **`aic.css`'s own header comment is wrong.** It says the file is loaded by every page "EXCEPT
  /index.html and /demo/". `/demo/` does load it. Left as-is because this run does not touch copy it
  was not sent to touch — flagging it because a comment that ships is a comment a future audit will
  believe.
- **Consider the same treatment on the AVA parent site.** `aivoiceagency.ai` was explicitly out of
  scope. Whether it carries the same Google-CDN dependency has not been measured and should not be
  assumed either way.

---

## GOTCHAS

- **"Self-hosted" was already half true, and the brief did not know it.** `JetBrains Mono` has been
  local since RUN 3.5. Two `@font-face` rules for the same family both matched, and the later
  declaration silently won. If this run had trusted the brief's count of two external files, the
  "before" measurement would have been wrong and every delta computed from it with it.

- **A metric-matched fallback will steal glyphs the real font never had.** `→` (U+2192) and `✓`
  (U+2713) appear on all 12 pages and are in **no subset of either family** — they already fall
  through to the system stack today. Add a fallback family without a `unicode-range` and Arial
  supplies them instead, at a different width, and the arrow at the end of ten CTAs changes size.
  Both real faces and both fallback faces carry Google's declared latin range verbatim, which is
  what preserves today's behaviour exactly.

- **A comment ships, and a comment that quotes the banned string makes the gate lie.** The first
  draft of the `@font-face` block explained itself by naming `fonts.gstatic.com`. The grep gate
  immediately flagged `index.html` — correctly. Reworded to describe the host instead of naming it.
  RUN 7 documented this exact trap; it took ten minutes to walk into it again.

- **A probe that reports "zero" has proved nothing until it has been made to report something.**
  The line-break diff returned zero on the first try, which is also what a broken probe returns.
  Refusing the woff2 files and re-running the identical comparison produced 534 flagged nodes. That
  control is now part of the tool (`RUN8_BLOCK_FONTS=1`).

- **Playwright's `reducedMotion: 'reduce'` does not stop every animation.** `.kicker::before` keeps
  running `pulse 2s`. Shooting the *same build twice* produces a 69-pixel disagreement at a max
  channel delta of 2, which is the same size and shape as the 67-pixel difference between the
  before and after homepage shots. Without that control, a 4/255 colour wobble on 67 pixels reads
  as "the layout changed." `/demo/`, which has no such element, is pixel-identical across builds.

- **`preload` must match the `src` string exactly, and needs `crossorigin` even same-origin.** Fonts
  are always fetched in CORS mode. A preload without `crossorigin`, or with a different query
  string, is not a preload — it is a second download of the same file plus a warning.

- **One Lighthouse run is still not a measurement.** The live homepage returned **73** on one of
  three runs and 99 / 100 on the others. Median of three: 99. RUN 7 learned this against local
  contention; it is just as true against a cold CDN edge.

- **The two builds were served from different line endings.** The pre-run worktree checks out CRLF;
  the working tree is LF. That is invisible to rendering — HTML collapses whitespace — but it means
  the two local servers must be compared by *geometry*, never by bytes. Byte comparison is reserved
  for LIVE-DIFF, where both sides come from git.

- **A self-hosted font that 404s looks exactly like success.** Every other check in this run —
  a11y, SEO, CLS, line breaks — passes cleanly on a site that has silently fallen back to Arial
  everywhere. `run8_livediff.js` fetches both woff2 files from production and compares them to the
  repo byte for byte, because that is the only check that can tell the difference.

- **`/book/` will never read zero external font requests.** Two come from inside
  `api.leadconnectorhq.com`'s booking iframe, which loads Inter. It is a different origin, the brief
  forbids touching that loader, and it cannot be removed without dropping the embed. The gate counts
  main-document and sub-frame font requests separately rather than reporting one blurred number.
