# AIC COPY + CLEANUP — 2026-09-17

**Live.** Commit `72b5f9b` · deploy `dpl_B9hFkrZmRa2Zh29xoVgP2qvLcXMa` (READY, aliased to aichauffeur.ai).
**Rollback:** promote `dpl_43UqPqDwHUgJyDmJ6tFaN4QWFJSf` in Vercel, or `git revert 72b5f9b`.

A copy-and-cleanup release on aichauffeur.ai. No redesign, no new features, no agent, n8n,
GHL or Retell changes. Every edit is a string replacement or a deletion.

---

## WHAT SHIPPED

| # | Change | Where | Proof |
|---|---|---|---|
| 1 | The callback box removed — card, first-name and cell fields, TCPA tick, submit, and the JS that posted it | 13 pages + `assets/aic.js` (−293 lines) | rendered DOM 0 at 4 viewports × 2 pages; served HTML 0 across all 20 pages |
| 2 | Homepage hero: new headline, four big sentences, new body, closer unchanged | `chauffeur/index.html` + `.hero-big` in `aic.css` | one line each at 1024 and 1440, measured; wraps at 390/430 |
| 3 | Homepage button → `tel:+14147750019`, label **PUSH TO CALL AI**; browser-call link removed from the page | `chauffeur/index.html` | `href` read off the rendered element on production |
| 4 | `/try` words, **PUSH TO TRY AI** in every reset state, recording line moved above the button | `chauffeur/try/index.html` | real production call: ready → connecting → live → Stop → ended |
| 5 | Homepage title, meta description, OG/Twitter description | `chauffeur/index.html` | fetched from production |
| 6 | 14 retired strings → zero sitewide | 23 files | gate with a 17-of-17 negative control |

**Production URLs:** <https://aichauffeur.ai/> · <https://aichauffeur.ai/try/>

---

## ACCEPTANCE — as the brief listed it

| # | Check | Result |
|---|---|---|
| 1 | Zero hits for every retired string | **PASS** — 0 dirty of 29 files; negative control caught 17/17 in a planted fixture |
| 2 | Callback box, fields, button and submit script gone; view-source shows no trace | **PASS** — 0 in the rendered DOM at 390/430/1024/1440 on both pages, and 0 in the served HTML of all 20 pages |
| 3 | PUSH TO CALL AI is a `tel:` link to +14147750019; no browser call from the homepage | **PASS** — `href="tel:+14147750019"` read off production at all four widths; `.go-tel` absent; no web-call binding on the page |
| 4 | `/try` PUSH TO TRY AI; one push reaches mic-permission and connection; Stop works; recording line above the button; Privacy works; noindex intact | **PASS** — real production call ran the full state machine; recording line top 235 vs button top 291; `noindex,follow` served |
| 5 | Both pages render at 390×844 and 430×932 with zero horizontal overflow, measured | **PASS** — `scrollWidth` 390 vs `clientWidth` 390, and 430 vs 430, on production |

Not asked for, measured anyway: AA floor **8.72:1** on the homepage's new and changed copy,
**9.10:1** on `/try`; zero console and page errors on production (the local run's only two
were `/_vercel/insights` and the Origin-gated n8n webhook, neither of which exists off the
Vercel host — both clean on production).

### The repo's own gates

`aic-run9-gate` 114 renders PASS · `aic-run10-gate` all probes green, 6 controls fired ·
`aic-run10-faq-mirror --check` 14 pages mirror · `aic-run10-greps` all clean ·
`stamp_chauffeur --check` 20 pages on current tokens.

---

## THINGS TO KNOW

**The 100 is an owner ruling, not a wire reading.** `GET /get-concurrency` read 20 base on
2026-09-13. Both numbers are written into the source comments beside the claim, in both
places it appears, so the next run finds the tension instead of reconciling it by accident.
The homepage proof row and `/what-it-does/` were moved to 100 with it — leaving 20 and 100
on the same page would have been a defect.

**Two privacy lines named the deleted form.** They now describe giving us the number without
naming a form that no longer exists. Every disclosure is kept word for word and nothing is
narrowed — over-disclosure is the safe direction. Worth a read before it sits long.

**The `.cb-*` CSS stays, dead, on purpose.** `.cb-form` and `.cb-submit` sit inside five
shared selector lists and `/reserve/` borrows `.cb-consent` for its own hold form. Unpicking
that on a copy release buys nothing a reader can see and risks a shared rule. The block is
marked dead at the top with the date and the reason; delete it behind `aic-run13-parity`.

**The backend is untouched, so nothing posts to it any more.** The n8n `/ava-call` workflow,
its CALLBACK GATE and the GHL leg are exactly as they were, by instruction — only the site
side went. `/reserve/` still posts its own four-field hold to `/ava-intake` and is unaffected.

**Analytics.** The hero button kept `tel_tap_hero`, the name the hero's phone link already
used, so that series continues. `hero_push_to_book` is gone with the button it named.
`close_push_to_book`, `wid_push_to_book`, `wicd_push_to_book` and `try_call_start` keep their
names though their labels changed — renaming would have broken the series for a cosmetic match.

**`og:title` and `twitter:title` were left alone.** The brief named the title tag and the
descriptions; those three now differ from each other on the homepage. Say the word and it is
one edit.

---

## TWO GATE FINDINGS

**`aic-run11-gate.mjs` drawer probe — fixed here.** Its drawer-row and chevron assertions and
their negative control read `PROBE_STATIC.drawers`, which is built from `.cb-form` and nothing
else. With the console gone the collection is empty at every width: the filters pass vacuously
*and* the control cannot fire, which is the gate's own abort condition, correctly. Retired with
the reason written in and restorable verbatim. `#ava-callback` dropped from `HOME_ANCHORS` for
the same reason.

**`aic-run11-gate.mjs` § 1 anchor clearance — pre-existing, NOT fixed.** It crashes the renderer
in this environment (`page.goto: Page crashed`), on a different anchor each run. **Proved
pre-existing** by checking out the unmodified `5a04d1d` into a worktree and running the gate
against it on its own port, where it crashed on the first anchor. Flagged, not repaired — it is
not this release's bug and fixing it is its own job. Anchor clearance was measured instead by a
standalone probe on a single context: 20 fresh loads, all pass, `--nav-h` 61 and 73 matching the
measured bar, control caught the clip.

---

## A TRAP WORTH KEEPING

Building that anchor probe: on `waitUntil:'load'` every anchor below the fold reads short by up
to **1810px**, in a clean monotonic ramp that looks exactly like a real clearance bug. The
fragment jump happens at parse time and the document keeps growing after it. On `networkidle`,
`#faq` lands at **77** — the 61 of `scroll-padding-top` plus the 16 of `scroll-margin-top`,
exactly.

Two smaller ones from the same run. A contrast probe that takes the first ancestor with a
background as opaque reported `--sky` on the hero at **1.77:1**; `.hero` carries
`rgba(61,123,255,.05)` as its grid tint, and composited properly it is **8.72:1**. And
`net::ERR_ABORTED` on a `preload="metadata"` `<audio>` is Chromium taking the header and
dropping the range — counted as an error it failed the homepage at every viewport over a file
that serves 200 to `curl` on both origins.
