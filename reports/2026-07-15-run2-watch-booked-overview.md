# RUN 2 — /watch ad lander · /booked conversion · /overview rebuild

**Date:** 2026-07-15
**Commits:** `783923b` (feature) · `703e54e` (stamp ?v=783923b) · docs (this report + board)
**Parent:** `95f8cd8` (RUN 1.9, prior session — RUN 2 sits cleanly on top)
**Rollback tag:** `pre-run2-2026-07-15`
**Prod cache token:** `?v=783923b`

```
===== SHANE READBACK — COPY ALL =====
```

## Plain English

Three new pages went live, all built on the SAME machine your homepage runs on
(the streaming-feed theater, the purple pricing skin, the AVA-pulse glow, the
light/dark toggle, cache armor). Nothing on the homepage changed.

1. **/watch** — the page your Google Ads will point at. It has one job: get the
   visitor to watch AVA book a job, then call or book. Tight promise up top with a
   big "WATCH AVA BOOK IT" button, the same 16-agent theater as the homepage, the
   "hear AVA on a real call" clips, a quick nudge to the ROI calculator, a single
   $497 price line, and a final book/call block. Stripped-down header (just the
   logo + phone number — no big menu) and a slim footer, so there's nothing to
   distract from the one path: watch → call or book. It's indexable and in the
   sitemap so it can also pick up organic traffic.

2. **/booked** — the "thank-you" page people land on right after they book a call.
   It confirms they're on the calendar, lays out the 3 things that happen next
   (we map your calls → we build AVA → you approve it before it goes live), lets
   them add the call to their Google Calendar, reminds them they can hear AVA on
   the demo line right now, and plays a sample call. The moment this page loads it
   silently tells Google + Facebook "a booking happened" so your ad conversions
   can be tracked. It's hidden from search on purpose.

3. **/overview** — rebuilt to match the homepage's look. Its pricing table is now
   pulled straight from the homepage, word for word, so the two can never say
   different prices again. The rest of the page explains what AVA is, how we build
   it for you, and who it's for.

## DONE — what shipped

| Page | URL | Status | Proof |
|---|---|---|---|
| Ad lander | https://aivoiceagency.ai/watch | LIVE (indexable, in sitemap) | Dual-engine E2E green: overflow-0 @390, 16-card theater streams to payoff (11.3s), slim header + theme toggle, 3 hear-clips, self-canonical + Service/Org JSON-LD, real H1 |
| Conversion | https://aivoiceagency.ai/booked | LIVE (noindex, excluded from sitemap) | Dual-engine E2E green: fires GA4 `booking_complete` (+ legacy `booking_confirmed`) + Meta `Schedule` + Ads conversion on load; 3-step next; hear-clip; add-to-calendar |
| Overview | https://aivoiceagency.ai/overview | LIVE (rebuilt) | Dual-engine E2E green: pricing byte-identical to homepage ($497/$997/$1,997), tabs + theme work, full nav + breadcrumb + 2 JSON-LD |

**Wiring:** `js/tracking.js` +`booking_complete` GA4 event · `tools/stamp.py`
+`VERSION_ONLY` cache-armor pass (watch+booked incl inline `__ASSET_V`) ·
`sitemap.xml` +`/watch` (0.9), `/overview` lastmod bumped, `/booked` excluded ·
`tools/e2e.mjs` +RUN 2 dual-engine suite for all three pages.

**Gates (all GREEN):** Chromium + WebKit E2E @390 for all 3 pages · zero console
errors both engines · overflow 0 @390 · `/booked` noindex verified · content-law
greps clean (only 414-240-8930; zero banned phrases; AVA never she/her; zero forms
→ no TCPA needed) · JSON-LD valid · homepage `index.html` content FROZEN (diff =
`?v` version tokens only) · 5-lens adversarial review = 0 blockers / 0 majors
(pricing-drift + claims lenses CLEAN).

## Rollback (per checkpoint)

- Everything: `git reset --hard pre-run2-2026-07-15 && git push --force-with-lease`
  (⚠ this also reverts RUN 1.9 — prefer the per-commit reverts below).
- RUN 2 only: `git revert 703e54e 783923b && git push` (leaves RUN 1.9 intact).
- `/overview` only: it's one file — `git checkout 95f8cd8 -- overview.html`.

## What's next

- **Google Ads conversion is a ONE-LINE swap (PENDING-SHANE).** In
  `js/tracking.js` set `ADS_ID = 'AW-XXXXXXXXXX'` and
  `ADS_BOOKING_LABEL = '<booking conversion label>'` (Ads → Goals → Conversions).
  The `/booked` conversion code is already live and silently skips while these are
  placeholders — the moment the two constants are real, both GA4 `booking_complete`
  AND the Google Ads conversion fire on every booking.
- Point the Google Ads campaign destination URL at `https://aivoiceagency.ai/watch`.
- Confirm GHL's post-booking redirect targets `/booked` (the conversion + smart
  add-to-calendar both key off `PATH === '/booked'`).

## Gotchas / notes

- `/watch` and `/booked` deliberately DON'T get the full bridge nav/footer — they
  carry a hand-authored slim header (reuses `.bnav` so the theme toggle still
  mounts) and are cache-armored via a new `VERSION_ONLY` list in `stamp.py`
  (NOT the `PAGES` list). Re-running `stamp.py` keeps them versioned.
- The slim-header phone number uses a compact custom class (`.wl-tel` / `.bk-tel`),
  NOT `.bnav-tel` — `.bnav-tel` bumps to 18px under 820px (built for the full-width
  menu row) and would blow the 390 overflow gate.
- `/booked` conversion event was renamed/added to `booking_complete` (the RUN 2
  spec name); the legacy `booking_confirmed` still fires alongside it for any
  existing GA4 config.
- Concurrent RUN 1.9 (payoff-circle revert + AVA-pulse v2) was shipped by a
  parallel session and is RUN 2's parent (`95f8cd8`, already on remote). RUN 2's
  pages were verified against that live `bridge.css`.

```
===== END READBACK =====
```
