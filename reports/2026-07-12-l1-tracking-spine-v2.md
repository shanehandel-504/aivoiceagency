---
title: "L1 — TRACKING SPINE V2 — Meta Pixel + GA4 live across all 37 pages — 2026-07-12"
date: 2026-07-12
lane: AVA
agent: claude-code-fable5
type: run-report
---

# [L1] TRACKING SPINE V2 — 2026-07-12

**LIVE** — Meta Pixel + GA4 on all 37 sitemap pages (curl-proven post-deploy), /booked conversion page live, Google Ads slot staged as a 2-constant enable. Commit e518260 · Vercel deploy READY (verified via API).

===== SHANE READBACK — COPY ALL =====

PLAIN ENGLISH
Every page on aivoiceagency.ai now reports to Meta and Google Analytics through ONE file
(/js/tracking.js) — future tracking changes are a single edit. The money signals are wired:
calling the demo line, submitting a lead form, reaching /book, actually seeing pricing, and
playing with the ROI calculator. The booking conversion is double-railed: a new /booked
thank-you page plus a fallback listener on /book, deduped so one booking never counts twice.
Google Ads is pre-plumbed — the moment your AW- ID exists, it's a two-value edit and ads
conversions light up. Nothing visible changed anywhere; the frozen homepage gained exactly
the two authorized invisible lines.

DO THIS (2 minutes, makes the booking conversion bulletproof)
GHL → Calendars → AVA Strategy Call → settings → "After booking: redirect to" →
https://aivoiceagency.ai/booked
CONFIRM FIRE (5 min): Meta Events Manager → Test Events, and GA4 → Reports → Realtime,
then load the site and click the phone number.

DONE TABLE
| ITEM | STATUS | PROOF |
|---|---|---|
| /js/tracking.js single source | LIVE | curl 200, 8,845 bytes, both IDs in body |
| Tag on all 37 sitemap pages | 37/37 | post-deploy curl sweep: every URL 200 + tag (table in run log) |
| Meta Pixel 1029719056532809 | LIVE | real fbevents.js executing on prod (fbq.callMethod present) |
| GA4 G-ZJZD091SMC | LIVE | google_tag_manager container G-ZJZD091SMC registered on prod |
| Homepage noscript pixel | LIVE | grep on prod = 1 · frozen page delta = exactly 2 lines |
| /booked conversion page | LIVE | 200 + noindex,nofollow + "You're booked." + calendar-add + home link |
| Booking dedupe (page + postMessage) | LIVE | sessionStorage flag + origin-checked GHL listener |
| Google Ads slot | STAGED | AW-PENDING + LABEL-PENDING constants; guarded code already live; enable = fill 2 values |
| Events: Contact/Lead/InitiateCheckout/ViewContent/roi_engaged/Schedule | LIVE | wired in tracking.js, delegated, never-throw |
| Adversarial review (3 reviewers + verify) | DONE | 6 confirmed findings fixed pre-push (incl. threshold-0.3 bug reproduced in a live browser) |
| Vercel deploy | READY | dpl_9sJKjfijunAqw6ryPfbvbUAMWxsk = commit e518260 on aivoiceagency.ai |

HONESTY LINE (per spec)
Tags installed and served; libraries verified executing on production with zero console
errors. A browser-side PIXEL FIRE cannot be curl-verified — Shane confirms via Meta Events
Manager → Test Events and GA4 → Realtime.

IDS / ROLLBACK
- Commits: e518260 (spine + /booked + 37 pages) · board flip rides the report commit.
- Rollback: `git revert e518260` (removes tag from all pages + /booked). One-page rollback: delete its one script line.
- Meta 1029719056532809 · GA4 G-ZJZD091SMC · Ads account 916-658-0915, AW- ID PENDING-SHANE — never invented; tracking.js skips placeholders silently.

GOTCHAS
- Lead = submit ATTEMPT (client-rejected submits count once; per-form dedupe caps retries). True success-only Lead needs one line in funnel.js (frozen) — P2 with un-freeze.
- /booked scrubs its query string BEFORE trackers load — GHL redirect params (even future PII ones) never reach Google/Meta logs.
- /deck and /pitch are not in the sitemap → intentionally untagged. Add the one line if they should report (P2).
- GHL postMessage fallback is heuristic (origin-checked + booking-pattern match); the /booked redirect is the reliable rail — hence the SHANE ACTION above.

P2 BACKLOG
funnel.js `ava:lead` success event (needs un-freeze) · tag /deck + /pitch · AW- ID + conversion label when Ads account is provisioned · UTM conventions doc for ADS MONDAY.

HOW COULD THIS PROMPT BE BETTER
Tight prompt — IDs up front, honest-proof section, and the "never invent the AW- ID" law all did work. Two upgrades: (1) the "commented block = 2-line uncomment" spec is self-contradictory once conversion labels exist (a commented block needs 4 touch-points) — specifying "guarded-live code + placeholder constants" would match intent exactly (that's what shipped, documented); (2) name the expected Lead semantics (attempt vs webhook-success) — funnel.js is frozen, so success-only Lead needed a scope call this prompt didn't authorize.

===== END READBACK =====
