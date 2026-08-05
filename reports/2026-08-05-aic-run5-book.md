# AIC RUN 5 — "BOOK PAGE + NAV LOCKUP"

**Date:** 2026-08-05 · **Commit:** `ab15baf` · **Host:** aichauffeur.ai (own Vercel project, root `chauffeur/`)

---

## Plain English

aichauffeur.ai now has its own booking page at **aichauffeur.ai/book/**. Before this run, every
"Request setup" button on the site threw the visitor out to a raw GoHighLevel URL — no AI Chauffeur
branding, no analytics, no way to know who bounced. All 34 of those buttons across 11 pages now go
to our own page, which carries the brand, the nav, the phone number, and the callback form, with the
calendar embedded inside it.

Two things were wrong underneath and both are fixed:

1. **The calendar was booking 30-minute slots while every page promised 20 minutes.** Nine live pages
   said "20-min intro call." The actual GoHighLevel calendar was set to 30. On your call, the calendar
   moved to 20 rather than rewriting the copy — so the promise on the page and the booking system now
   agree. The live page proves it: the widget shows "Duration : 20 Mins" and offers 3:40, 4:00, 4:20,
   4:40 PM.
2. **The brand name was invisible on phones.** The header dropped to a bare bar mark below 420px, which
   is most of your traffic. The full "AI | CHAUFFEUR" lockup now shows all the way down to 360px.

One near-miss worth knowing about: the normal way to build this page ships a **permanently blank
calendar**, and it looks fine in the code. Details below.

---

## DONE

| # | Artifact | Live URL | Proof |
|---|---|---|---|
| A | Booking page — H1, embed, fallback, tap-to-call, callback form | https://aichauffeur.ai/book/ | HTTP 200 · LIVE-DIFF byte-identical · Lighthouse mobile **A11y 100 · SEO 100 · Perf 98 · CLS 0.001** |
| B | 34 CTAs rewired to `/book/` across 11 pages | all chauffeur pages | 36 `/book/` CTAs live; **0** raw GHL CTAs outside `/book/` |
| B2 | `/demo/` relabelled off "15-minute AVA strategy call" | https://aichauffeur.ai/demo/ | 2 CTAs now read "Request local setup" |
| C | Nav lockup down to 360px | every chauffeur page | 146.7px at 360/390, 176.1px desktop; compact below 360; 0 overflow |
| C2 | GHL calendar `UaxV0ENx2cEUYs6qeWZ7` → 20-min slots | GHL | Readback diff: only `slotDuration`/`slotInterval` changed; slots render 20 min apart |
| D | `/book/` in sitemap · registered `VERSION_ONLY` · stamped · board.json | https://aichauffeur.ai/sitemap.xml | sitemap lists `/book/`; `stamp_chauffeur.py --check` exit 0 |
| E | Gate tool | `tools/aic-run5-verify.mjs` | **103/103 green against production** |

**Screenshots:** `audits/AIC-run5-LIVE-book-390-fold.png`, `-calendar.png`, `-slots.png`,
`-book-desktop.png`, `AIC-run5-LIVE-nav-359/360/390.png`

---

## The defect that would have shipped a blank calendar

The obvious build — `<iframe src="…" loading="lazy">` — produces a calendar that **never loads, ever**,
and nothing in the markup looks wrong.

GHL's `form_embed.js` parks the booking iframe at `position:absolute; left:-9999px; visibility:hidden`
until the widget posts its ready message. A native lazy iframe that is off-screen is never fetched by
the browser. So: never fetched → never loads → never posts → never revealed. A closed loop.

Measured in the browser, not reasoned about: `iframeFetched: false`, skeleton stuck forever, zero
network requests to the widget.

**Fix:** the `src` is attached from JS (`IntersectionObserver`, `rootMargin: 600px`, plus a
`window.load` floor so "lazy" can never mean "absent"), and a `<noscript>` twin ships the frame
directly for JS-off visitors. Genuinely deferred, and immune to the deadlock.

A DOM-only check would have passed this page while it was broken, so the gate asserts the widget was
**actually fetched**, not merely present.

---

## Rollback

| Checkpoint | ID | One-line rollback |
|---|---|---|
| Code (all of A–D) | `ab15baf` | `git revert ab15baf && git push` |
| Prior good state | `c4c9d25` | `git reset --hard c4c9d25` (destructive — prefer the revert) |
| GHL calendar 20 → 30 | `UaxV0ENx2cEUYs6qeWZ7` | `PUT /calendars/UaxV0ENx2cEUYs6qeWZ7` with `{"slotDuration":30,"slotDurationUnit":"mins","slotInterval":30,"slotIntervalUnit":"mins"}` |

The calendar PUT was surgical — a before/after readback diff confirmed only `slotDuration` and
`slotInterval` moved. `availabilities`, `notifications`, team members and every other key were
preserved, and no key was lost.

---

## What's next

- `/book/` was submitted to the sitemap today; it needs a Search Console fetch to enter the index.
- The four conversion events on this host are `tel_tap_nav` / `tel_tap_cta` / `book_click_*` /
  `book_fullscreen`. `book_fullscreen` is new — if it starts firing often, the embed is failing for
  real users and that is the signal to investigate.
- Queued and deliberately NOT built: next SEO pages (gated on Keyword Planner + Search Console data),
  Chicago page, run-sheet visual pass v2, chauffeur legal inbox, LiveKit latency clip (parked; Retell
  stays canon unless a TEST-agent bake-off proves otherwise).

---

## Gotchas

- **`loading="lazy"` + `form_embed.js` = a permanently blank calendar.** Documented in a comment above
  the iframe. Do not "simplify" it back.
- **The widget re-navigates inside its own frame while booting.** A Playwright frame handle taken too
  early goes stale and `waitForSelector` just times out with no useful error. Re-acquire the frame and
  poll instead.
- **The nav lockup CSS exists in two places.** `chauffeur/assets/aic.css` governs 11 pages;
  `chauffeur/index.html` carries its own embedded copy. Both were changed this run. Change one without
  the other and the homepage silently diverges from the rest of the host.
- **A copy law can contradict the live system it describes.** The brief, nine live pages and the
  calendar disagreed three ways (20 / 20 / 30), and `/demo/` added a fourth (15). Verify the value in
  the system, not just the id — same class of defect as RUN 7's calendar-vs-copy mismatch.
- **Best Practices scores 79, not 100, and cannot be fixed here.** Both failures
  (`third-party-cookies`, `inspector-issues`) come from the embedded GHL widget setting `__cf_bm`.
  Any page with this calendar on it will score the same.
- **The calendar's date cells are 32×32 inside a 37×42 cell** — under the 44px guideline. That is
  GHL's markup inside a cross-origin iframe; we cannot restyle it. Everything we own on the page
  clears 44px.
