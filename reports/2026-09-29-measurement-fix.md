# AVA — Measurement fix v2: one real booking = one count

Run date 2026-09-30 (file named per the brief). Commits `7cd8529` (code) · `d8f5ef5` (cache stamp) ·
report/board commit listed in the readback. Correction live on aivoiceagency.ai from
**2026-09-30 ~13:19 CT** (deploy of `d8f5ef5`). GA4 does not rewrite the past: sessions before that
time keep `booked_page` / `ghl_postmessage` as their source and keep the bare-visit conversions.

## Why — the numbers

From the brief (Supermetrics read of GA4 property 545206969, last 90 days, dimension Session source):
`booked_page` 82 sessions and 7 of 15 conversions · `ghl_postmessage` 28 sessions · 216 of 957
sessions from localhost / 127.0.0.1.

This run's own reads (Supermetrics → GA4 545206969, read-only, last 90 days incl. 2026-09-30, CT):

| Read | Result |
|---|---|
| `page_view` on aivoiceagency.ai `/booked` | **27, every one with an empty page referrer.** 0 carried the leadconnectorhq.com referrer a GHL redirect leaves. |
| `booking_complete` on aivoiceagency.ai | 17 on `/booked` (session source 10 × `(direct)` + 7 × `booked_page`) · 3 on `/book` (the postMessage path: 2 × `(direct)`, 1 × `aichauffeur.ai`) |
| `booking_complete` on localhost / 127.0.0.1 | 7 (plus 7 `booking_confirmed`) |
| GHL calendar "AVA Demo Call" `aCIv7rUnCGrysobt6Mlg` (API re-fetch) | `formSubmitType: ThankYouMessage`. The `/booked` redirect URL is stored but **not active**: a real widget booking shows GHL's thank-you text and never lands on `/booked`. |
| Where bare `/booked` visits come from | `.claude/skills/social-post/SKILL.md:83` sends social traffic to `aivoiceagency.ai/booked` ("Full call + transcript") — the audio wall. Every one of those visits counted as a booking. |

## Step 2 — what GHL's post-booking redirect carries (read-only)

Read from the booking widget's own code (`api.leadconnectorhq.com/widget/booking/aCIv7rUnCGrysobt6Mlg`
and its `stcdn.leadconnectorhq.com/_preview/*.js` chunks):

1. On every completed booking the widget first posts `["msgsndr-booking-complete", {fingerprint, calendarId}]`
   to the parent page. That is what the `/book` postMessage path already counts (its regex matches
   `booking-complete`). Unchanged.
2. It redirects only when `form_submit_type === "RedirectURL"` (or a custom-form redirect), by setting
   `window.top.location.href` **from inside its iframe**.
3. The redirect URL gets merge tags filled and only fills query keys that are already present in the
   URL. `https://aivoiceagency.ai/booked` has none, so **no query parameters arrive**.
4. No `Referrer-Policy` header on the widget or our pages → the browser default
   (`strict-origin-when-cross-origin`) → `/booked` sees `document.referrer = https://api.leadconnectorhq.com/`.

So the one piece of evidence a real redirect leaves is a leadconnectorhq.com / msgsndr.com referrer.
`aivoiceagency.ai/book` is never the referrer (the navigation starts in the iframe), so it is not
accepted as proof. A refresh keeps the referrer; the existing sessionStorage flag stops the recount.

## Every changed line

### `js/tracking.js` (`7cd8529`, 26 insertions / 8 deletions)

| Line (new) | Change |
|---|---|
| 25–30 | Comment: four off-switches; the host check is listed first. |
| 35 | `+ var PROD_HOSTS = ['aivoiceagency.ai', 'www.aivoiceagency.ai', 'aichauffeur.ai', 'www.aichauffeur.ai'];` |
| 37 | `+ if (PROD_HOSTS.indexOf(location.hostname) === -1) return true;` — first line of NOTRACK, outside the storage `try`, so a blocked localStorage can never skip it. `?notrack=1` (and its persist), `ava_internal` and `navigator.webdriver` are unchanged. |
| 320–331 | Comment: two rails, one dedupe, the proof rule, and why the parameter is not `source`. |
| 333 | `- function fireBookingConversion(source)` → `+ function fireBookingConversion(method)` |
| 341 | `- ga('booking_complete', { source: source });` → `+ ga('booking_complete', { booking_method: method });` |
| 342 | `- ga('booking_confirmed', { source: source });` → `+ ga('booking_confirmed', { booking_method: method });` |
| 345–350 | `/booked`: `- fireBookingConversion('booked_page');` → fires only when `new URL(document.referrer).hostname` matches `(^|\.)leadconnectorhq\.com$|(^|\.)msgsndr\.com$`. |

Event names (`booking_complete`, `booking_confirmed`) and values (`booked_page`, `ghl_postmessage`)
are unchanged. The `/book` postMessage block is byte-for-byte unchanged.

### Cache stamp (`d8f5ef5`)

One line per page, `<script src="/js/tracking.js?v=…" async>` → `?v=7cd8529` (the token
`tools/stamp.py` writes: `git rev-parse --short HEAD` of the code commit). Only the tracking.js URL
moved. `stamp.py` itself was not run: it re-versions every asset on every registered page, including
the chauffeur pages, which are outside this run. 60 pages came from `abf8701`, `staging/xray.html`
from `d7c20e7`, and `legacy/index-funnel-v2-2026-07-14.html` + `templates/lander-master.html` had no
token. 63 pages, 63 × `1+/1-`, 0 other lines:

`index.html` · `24-hour-answering-service` · `backstage` · `blog` (+ 3 posts) · `book` · `booked` ·
`electrician-answering-service` · `green-bay` (+ dental, electrical, hvac, plumbing, roofing) ·
`ground-transportation` · `guides/ac-running-but-not-cooling.html` · `guides/furnace-short-cycling.html` ·
`home-services` · `hospitality` · `hvac-answering-service` · `legacy/index-funnel-v2-2026-07-14.html` ·
`live` · `lsa` · `madison` (+ 5 trades) · `medical-practices` · `methodology.html` · `milwaukee` (+ 5) ·
`overview.html` · `plumber-answering-service` · `privacy` · `professional-services` · `roi` ·
`sms-policy.html` · `staging/xray.html` · `templates/lander-master.html` · `terms.html` · `videos` ·
`watch` · `waukesha` (+ 5) · `west-bend` (+ 5) · `wisconsin-limo`.

`sitemap.xml`: the repo's pre-commit hook moved 59 `<lastmod>` values to the stamp commit's time
(INDEXING RUN 1 law: a commit that re-stamps a page's cache tokens moves its lastmod).

## Step 3 — the sweep

Scanned every tracked `.js`, `.html`, `.mjs` and `.cjs` file (261 files, both sites, `chauffeur/` included)
for `gtag('event' …)`, `ga(…)`, `fb(…)`, `fbq(…)`, `fbCustom(…)`, `AVA_TRACK.event(…)`, `window.va(…)`
and `dataLayer.push(…)` passing `source`, `medium`, `campaign`, `term`, `content`, `campaign_source`,
`campaign_medium` or `campaign_name`. Single-line and multi-line.

| File:line | Before | After |
|---|---|---|
| `js/tracking.js:327` → `:341` | `ga('booking_complete', { source: source })` | `ga('booking_complete', { booking_method: method })` |
| `js/tracking.js:328` → `:342` | `ga('booking_confirmed', { source: source })` | `ga('booking_confirmed', { booking_method: method })` |

Nothing else passes a reserved name. The other trackers in the repo send event names only:
`chauffeur/assets/aic.js` + `chauffeur/try` → `va('event', {name})` · `js/backstage.js` →
`va('event', {name})` · `js/feed.js` → `AVA_TRACK.event(name)` · `ai100x/index.html` → dormant
placeholder IDs, nothing loads · `ctr-report/index.html` → `gtag('config')` only, no events.

## Step 4 — production hosts only

The host check is the first line of NOTRACK. When it holds, neither GA4 nor the Meta pixel
initializes, and `fb()`, `ga()`, `fbCustom()` and `AVA_TRACK.event` do nothing. That covers every tag
this file loads (GA4, and through it the linked Google Ads tags, plus Meta). Proof: T4.

## Step 5 — private pages

| Page | Result |
|---|---|
| `aichauffeur.ai/trip/:id` | Served by n8n `WF-TRIP-SHEET` `3PfmC7sxOjUHI0rE` (published = draft). The builder adds no `<script>`. A live test sheet (`is_test = true`) rendered **0 scripts, 0 analytics requests**. |
| `aivoiceagency.ai/trip/*` | 404. Trip sheets do not exist on this host. 0 analytics requests. |
| `aivoiceagency.ai/hq/` | 200, 2 inline scripts (passcode gate + board), **0 analytics requests**. |
| `aichauffeur.ai/hq/` | 404 · 0 analytics requests |
| `/reports/` (both hosts) | 404 (`reports` is in `.vercelignore`) · 0 analytics requests |

Nothing was removed; no private page loads analytics.

Payload privacy: every analytics request captured in C0 and T1–T5 was scanned for an email, a
phone-shaped number, the exact phone and email typed into the test booking, a trip reference,
`transcript`, `recording`, `cloudfront.net`, `/trip/` and Meta `ud[em]` / `ud[ph]`. **0 hits.** The
matcher was self-tested on planted values first (the run aborts if it misses one). Bare 10-digit runs
are not treated as phones, because every hit carries timestamps and client ids of that shape. Meta
automatic advanced matching is **off** on pixel `1029719056532809` (its live config has no
`automaticMatching` block; the `pdl_auto_pii` gate is `passed:false`). `click_to_call` carries the
tapped `tel:` number; on the tracked pages that is only ever 414-240-8930 (366 links) or
414-775-0019 (126 links), both published lines.

## Step 6 — cache

63 / 63 live pages serve `/js/tracking.js?v=7cd8529` (curl, cache-busted). The live
`tracking.js?v=7cd8529` md5 `ba07d91c…` equals the committed file.

## Step 7 — acceptance tests (live site)

Harness: Playwright 1.61.1 Chromium. `navigator.webdriver` masked, because the old webdriver switch
would silence tracking.js on its own and hide what the host and booking gates do. A stock desktop
Chrome UA, because the pixel's own bot rules drop `HeadlessChrome` before it sends. Every request to
google-analytics.com, googletagmanager.com, analytics.google.com, googleadservices.com,
doubleclick.net, facebook.com, facebook.net, `www.google.com` (except `/recaptcha`) and
`/_vercel/insights` was recorded (URL + body) and **aborted**. The one exception is the three tag
libraries (`gtag/js`, `fbevents.js`, the pixel config): they were fetched once before the tests and
fulfilled locally, never forwarded, so the tags could build real hit payloads to read. **No hit left
the machine.** GA4 counts come from GA4's own endpoint. gtag also copies each hit to
`www.google.com/g/collect` and `stats.g.doubleclick.net`; those copies are counted separately.

**Controls**

| Control | Result |
|---|---|
| C0 · old live code (`abf8701`), bare `/booked` | `booking_complete` + `booking_confirmed` fired with **`ep.source=booked_page`**: the defect, seen by the harness |
| PRE · new code served onto the live host, before push | T1 0 bookings · T1b exactly 1 + 1 + Meta `Schedule`, `booking_method=booked_page` |
| T4 control · old code on localhost | **117** analytics requests on the same 5 pages |

**Tests**

| Test | Result | Evidence |
|---|---|---|
| T1 · bare `/booked` (no referrer) | **PASS** | page loads `tracking.js?v=7cd8529`; GA4 `page_view` + Meta `PageView` only; **0** `booking_complete`, **0** `booking_confirmed`, **0** Meta `Schedule` |
| T1b · `/booked` with referrer `https://api.leadconnectorhq.com/`, then refresh (positive control) | **PASS** | exactly 1 `booking_complete` + 1 `booking_confirmed` (`ep.booking_method=booked_page`, no `ep.source`, no `cs`/`cm`/`cn`) + 1 Meta `Schedule`; after the refresh (referrer kept) a new `page_view` and **0** further booking events |
| T2 · one real test appointment through `/book` (ZZ sink, Thu Oct 29 5:45 PM CT, the last slot in the 30-day window) | **NOT DONE — blocked by GHL** | 3 automated submits (13:21, 13:24, 13:36 CT). Each time GHL's `POST /calendars/events/appointments/widget` answered **429 "Too many requests"**. The widget guards booking creation with **Cloudflare Turnstile** (`challenges.cloudflare.com/turnstile`) plus a calendar rate limiter (its own code carries a `x-should-skip-calendar-ratelimit` header, but only for a hard-coded list of other GHL locations), and an automated browser does not pass. **0 appointments and 0 contacts created**; nothing to cancel. Getting past a third party's bot check was not attempted. |
| T2-sim · same live `/book`, GHL's own completion line run inside the real widget iframe, sent **twice** | **PASS** | Received twice from origin `https://api.leadconnectorhq.com` → exactly **1** `booking_complete` + **1** `booking_confirmed` (`ep.booking_method=ghl_postmessage`, `ep.source` absent, no `cs`/`cm`/`cn`) + **1** Meta `Schedule`. The second message was swallowed by the dedupe (`ava_booking_tracked=1`). |
| T3 · enter at `/?utm_source=claude_test&utm_medium=test`, click through to `/book`, complete (T2-sim) in the same session | **PASS** | All 6 GA4 hits (`page_view` ×2, `user_engagement`, `begin_booking`, `booking_complete`, `booking_confirmed`) share **one session id**; the landing hit carries `utm_source=claude_test&utm_medium=test`; **0** hits carry `cs`, `cm`, `cn` or `ep.source`, so nothing overrides the session's source. **Control:** the old code on the same journey put `ep.source=ghl_postmessage` on both booking hits, the overwrite that turned sessions into "ghl_postmessage" in GA4. |
| T4 · `http://localhost:4178` + `http://127.0.0.1:4178` (`/`, `/booked/`, `/book/`) | **PASS for tracking.js** | `gtag` and `fbq` never initialize on any of the 5 pages; tracking.js made **0** requests. The run's only analytics request (1) is GHL's booking iframe on `/book` fetching the `fbevents.js` library by itself. It sent 0 hits, and it does the same on every host. |
| T5 · trip sheet on each host + `/hq/` + `/reports/` | **PASS** | **0** analytics requests attempted on all 6 pages (see Step 5) |

T2 and T3 were one journey, so the run needed only the one authorized appointment. The booking form
was filled with the ZZ sink's own name and email, the phone was our public AIC test line (…5008, held
by no GHL contact, searched first), and a note marked it a test. Run 1's click landed on the parent
page's sticky bar over the iframe; runs 2 and 3 clicked inside the frame and reached GHL, which
answered 429 both times. Evidence that real bookings do send the completion message the sim
replays: the widget's own code, and GA4's 3 production `booking_complete` events on `/book` in the
last 90 days, all from the postMessage rail.

A repeat of T1, T1b and T5 on the live code (13:33 CT) gave identical results.

## Step 8 — GA4 and Google Ads (read-only)

| Question | Answer |
|---|---|
| Which event is a GA4 key event? | **`booking_complete` only.** It carries key event = `true` on every day from 2026-07-16 on; `booking_confirmed` is `(not set)` on every row in 90 days. |
| Which one does Google Ads import? | Account 916-658-0915: **"Book appointment (Google Analytics event booking_complete)"** `7687285865`: Enabled, Primary for goal, Included in Conversions. No action imports `booking_confirmed`. |
| Does a booking count twice? | No. `booking_confirmed` is sent but counted nowhere, so no unmark card is needed. |

Cards for Shane are in the readback. Correction date: **2026-09-30 ~13:19 CT**. Past data is not
rewritten.

## Also found (not changed — out of this run's scope)

- **The GHL `/booked` redirect is off** (`ThankYouMessage`). Counting does not need it: the `/book`
  postMessage path counts real bookings (3 in GA4 in 90 days; T2-sim shows the path on today's code). If Shane turns the redirect on, `/booked`
  counts it through the referrer rule and the dedupe stops a second count.
- **A second Primary "Book appointment" action in Google Ads:** "AI Voice Agency (web) ads_conversion"
  `7687285334`, Enabled, Primary, Included. 0 conversions in 90 days, and no page on either site fires
  an `ads_conversion` event, so nothing double-counts today.
- **GA4 carries the Google Ads remarketing tag** (`googleads.g.doubleclick.net/pagead/viewthroughconversion/18170793196`,
  `www.google.com/rmkt/collect`) through its Ads link. It rides the same NOTRACK switch (T4: 0 requests).
- **GHL's booking widget has its own Meta pixel loader**, which fetched `fbevents.js` inside the
  iframe in T4 and T2.
- **`ctr-report/index.html` loads GA4 directly** (`gtag('config')`, no tracking.js), so the NOTRACK
  switches do not cover it.
- **The GHL calendar description says "30 minutes"**; the slot and MESSAGE FORMAT LAW say 15. This is
  customer-facing copy, so it was not changed here.

## § 9 owner-rail assertion

`OWNER_ALERT_CONTACT_ID` and `ZZ_TEST_CONTACT_ID` were dereferenced live from n8n Variables (not from
memory or a brief). The owner row resolves (200), is a different row from the ZZ sink, and was
**not touched by this run** (last updated 2026-09-28). It carries `zz-internal` and `do-not-drip`,
but its tag reads **`owner-alert`** (singular), not the `owner-alerts` that CLAUDE.md § 9 names. That
drift predates this run and was not changed here. The test booking used the ZZ sink's own name and
email, and a phone (our public AIC test line, …5008) that no GHL contact held beforehand (searched
first), so it could land on no other row.

## Rollback

`git revert d8f5ef5 7cd8529` (one push) restores the old tracking.js and stamps. Nothing outside the
repo was changed apart from the T2 test appointment; its cleanup is below.

## Cleanup

No test appointment exists, so nothing needed cancelling or deleting. Checked after the last attempt
(GHL API, read-only): the ZZ row still has 11 appointments (same as before the run); the calendar
has no event on Oct 29 17:00–19:00 CT; the ZZ row's tags equal the pre-test snapshot and it still has
no phone; no GHL contact holds the test phone; no workflow enrollment was possible without a booking.
The delete / unenroll / restore script was written and dry-run, then never needed. The local static
server used for T4 was stopped. The test trip sheet used in T5 is `is_test = true`; its id is not
written anywhere public.

```
===== SHANE READBACK — COPY ALL =====

RUN INCOMPLETE — T2'S REAL TEST BOOKING WAS NOT MADE / GHL'S BOOKING
WIDGET SITS BEHIND CLOUDFLARE TURNSTILE AND ANSWERED 429 TO ALL 3
AUTOMATED TRIES (0 APPOINTMENTS CREATED, NOTHING TO CLEAN UP) / ONE HUMAN
TEST BOOKING ON /BOOK FROM A DEVICE OPENED ONCE WITH ?NOTRACK=1, THEN
DELETE IT IN GHL — OR ACCEPT T2-SIM AS THE PROOF

AVA — MEASUREMENT FIX v2 · 2026-09-30

What changed, in plain words
- A booking in GA4 no longer erases where the visitor came from. The
  booking events used a setting called "source", and GA4 read it as the
  visit's source. It is now called "booking_method". The event names are
  the same, so the Google Ads import keeps working.
- Opening /booked no longer counts as a booking. It counts only if the
  visitor was actually sent there by the GHL calendar. The social posts
  link people to /booked for the call recordings, and every one of those
  visits was being counted as a booking (17 in 90 days).
- Nothing is tracked on test computers anymore. Localhost, 127.0.0.1 and
  preview links send nothing to GA4, Google Ads or Meta.
- The trip sheets, /hq and /reports load no analytics, and no
  analytics hit carries a phone, email, trip id, transcript or recording.

DONE
| Item | Live | Proof |
|---|---|---|
| Step 1 source -> booking_method | yes | live tracking.js md5 = commit 7cd8529 |
| Step 2 /booked needs GHL proof | yes | T1 0 events · T1b 1+1, refresh 0 |
| Step 3 sweep, 261 files | yes | 2 renames, both in js/tracking.js |
| Step 4 production hosts only | yes | T4 localhost 0 (old code: 117) |
| Step 5 private pages clean | yes | T5 0 requests · payload scan 0 hits |
| Step 6 cache stamp | yes | 63/63 live pages on ?v=7cd8529 |
| T1 bare /booked | PASS | 0 booking events |
| T2 real test booking | NOT DONE | GHL Turnstile -> 429 x3, 0 created |
| T2-sim widget message x2 | PASS | exactly 1 booking, booking_method |
| T3 utm session kept | PASS | 1 session id, 0 source overrides |
| T4 localhost | PASS | tracking.js 0 requests |
| T5 trip sheets | PASS | 0 analytics requests |

Renamed parameters
- js/tracking.js booking_complete: source -> booking_method
- js/tracking.js booking_confirmed: source -> booking_method
  (the only two in the repo)

Commits · rollback
- 7cd8529 code · d8f5ef5 stamp (63 pages + sitemap lastmods)
- report + board: the commit carrying this file
- rollback: git revert d8f5ef5 7cd8529 (one push)

GA4 / Google Ads (read-only)
- Key event: booking_complete only (since 2026-07-16).
  booking_confirmed is not a key event, so no unmark card.
- Google Ads imports "Book appointment (Google Analytics event
  booking_complete)". Nothing imports booking_confirmed.
- Correction live 2026-09-30 ~13:19 CT. Older data is not rewritten.

Cards for Shane
1. GA4 -> Admin -> Custom definitions -> Create custom dimension ->
   Event scope -> event parameter: booking_method
2. GA4 -> Admin -> Data streams -> the web stream -> Configure tag
   settings -> List unwanted referrals -> add leadconnectorhq.com and
   msgsndr.com
3. (T2, optional) Book one test slot on aivoiceagency.ai/book from a
   device opened once with ?notrack=1, then delete it in GHL.

What's next
- Cards 1-2. Then the booking_method dimension fills from today.
- T2 by hand (card 3), or accept T2-sim.

GOTCHAS
- The GHL calendar's redirect to /booked is OFF (thank-you message
  instead). Real bookings count on /book, from the widget's own message.
  If the redirect is turned on, /booked counts it and the dedupe stops
  a double count.
- Google Ads has a second Primary "Book appointment" action,
  "AI Voice Agency (web) ads_conversion": 0 conversions and nothing
  fires it today, but it would count if anything ever did.
- The owner-alert contact's tag reads "owner-alert", not the
  "owner-alerts" that CLAUDE.md § 9 names. It predates this run and was
  not changed.
- ctr-report/index.html loads GA4 on its own, so the no-tracking
  switches do not cover it.
- The GHL calendar description says "30 minutes"; the slot is 15.
- GHL's booking iframe loads the Meta pixel library by itself on every
  host. It sent no events in these tests.
```
