# RUN 9 — SEO + CLAIM PATCH

**Date:** 2026-07-28 · **Surfaces:** repo (65 files) + `CLAUDE.md` + `js/tracking.js`
**Commits:** `9f0d3ff` (claim fix — Skin First) · `c8d8b15` (events, schema, meta, freeze law)
**Result: LIVE.**

---

## WHAT SHIPPED, IN PLAIN ENGLISH

**A blog post was making up numbers, and Google was showing them.** One of your indexed
articles claimed 30% of home-service calls go unanswered, that the average ticket is $480, and
that a five-truck shop therefore loses **$720,000 a year**. None of it came from anywhere. The
description Google displayed in search results literally began with the words *"Industry
data:"* in front of a figure with no source. All of it is gone. The article still hits hard —
the reasons calls get missed and the fact that callers just dial the next number are things we
can actually stand behind — but every invented number is now a pointer to the ROI calculator
so the reader runs their own.

**Your city pages were claiming 31 storefronts you don't have.** Each one told Google there was
a physical "AI Voice Agency — Milwaukee HVAC" business, with your Kewaskum address stamped on
it. That's a false location claim in every metro, and it split your identity across 31 pages.
There is now one company in the markup, everywhere.

**Three new buttons are now measured.** Call AVA Live, Watch AVA Book It, and every pricing
CTA now report to Google Analytics and Meta. The booking conversion you already run ads on was
left exactly alone — verified, not touched.

**The homepage is now frozen for 30 days.** Changes come from the numbers, not from taste.

---

## 1 · CLAIM SWEEP

### Audited and left alone — already compliant

| Surface | Finding |
|---|---|
| **`/lsa`** | Penalty language sits **directly beside the verbatim Google quote** — *"Missed calls may negatively affect your responsiveness."* (`support.google.com/localservices/answer/7527305`) — and every figure carries a named source (411 Locals / ServiceTitan, PATLive / Aircall). **This is the exempt tier.** Hero `3AM. GOOGLE WAS LISTENING.` untouched. |
| **Verticals + city pages** | The 47% / 73% figures carry `Source: AgentZap` inline. |
| **`/staging/xray`** | `noindex,nofollow` — not a front-stage surface. |
| **Every non-`/lsa` page** | **No categorical penalty claim exists.** There was nothing to remove. |

### The one real violation — `/blog/home-services-30-percent-missed`

Indexed and in the sitemap. Built entirely on a fabricated statistical model.

| Was | Now |
|---|---|
| `Industry data: 30% of home-service inbound calls hit voicemail. At $480 average ticket, a five-truck operation loses $720K a year…` *(meta description)* | `Home-service calls get missed in predictable windows — after hours, lunch, storm surge, three-at-once. Where those callers go, and how a 24/7 AI receptionist that books appointments catches them.` |
| `Why Most Home Service Businesses Lose 30% of Their Calls` *(title ×4 + index card)* | `Why Home Service Businesses Miss Calls (And Where Those Jobs Go)` |
| `The trade publications have been quoting the same number for a decade. 30% of inbound calls… run worse than 40%.` | `Ask a home-service operator what happens to the calls nobody picks up and you get a shrug. Nobody measures it, because a missed call leaves no record — the caller simply hangs up and dials the next number.` |
| `…30% miss rate is 12 missed calls. Average ticket … around $480 … $2,880 a day. $14,400 a week. $720,000 a year.` | `The honest answer is that it depends on two numbers nobody else can tell you: your call volume and your average ticket…` |
| `The variance is 30x normal volume.` | `No staffing model is built for that spike, because it would sit idle the rest of the year.` |
| `…enough to account for 5% of daily call volume` | *(figure removed, behaviour kept)* |
| `For a five-truck operation losing $720K/year … even a 10% recapture pays for the system 12x over` | `Whether that pays for itself depends on your own call volume and average ticket — run them through the ROI calculator…` |

**10 replacements across 2 files.** The URL slug is deliberately unchanged — it is indexed and
linked. **Kept:** every clustering window and the "hang up and dial the next number" behaviour
— those are customer-behaviour claims, which are always safe.

---

## 2 · CONVERSION EVENTS

Wired in `js/tracking.js` to **GA4 `G-ZJZD091SMC`** and **Meta Pixel `1029719056532809`**.
The diff is **52 insertions, 0 deletions** — nothing existing was altered.

| Event | Fires on | Hook |
|---|---|---|
| `hero_call_ava` | tel: click on CALL AVA LIVE | `[data-event="tel_tap_hero"]` |
| `hero_watch_demo` | WATCH AVA BOOK IT | `[data-event="watch_tap_hero"]`, `[data-watch]` |
| `pricing_cta_click` | any CTA inside the pricing section | `#pricing a, #pricing button` + `[data-event$="_pricing"]` |
| `booking_complete` | `/booked` | **already live — verified, not duplicated** |

All delegate off **markup that already exists**, so no homepage edit was required — which
matters because the homepage freezes as of this run. Meta receives the three new events via
`trackCustom` so they never collide with the standard `Contact` / `Schedule` events, and
`hero_call_ava` is **additive**: the generic tel: handler still fires `click_to_call` +
`Contact`, so no existing report loses its series.

### Verified in a real browser, not by inspection

The spine self-tags `navigator.webdriver` as internal traffic, so every automated click would
have been silenced — a green result would have been meaningless. A harness neutralised that
flag before `tracking.js` evaluated and stubbed `gtag`/`fbq` as recorders.

| Click | Recorded |
|---|---|
| CALL AVA LIVE | `Contact`, `click_to_call`, **`hero_call_ava`** (GA4 **+** Meta) ✅ |
| WATCH AVA BOOK IT | **`hero_watch_demo`** (GA4 + Meta) ✅ |
| Pricing CTA (named) | **`pricing_cta_click`** (GA4 + Meta) ✅ |
| Pricing CTA **with no `data-event`** | **`pricing_cta_click`** ✅ — future CTAs are covered |
| Unrelated link | *nothing* ✅ |
| Footer tel | `click_to_call` only — **no** hero event ✅ |

### `/booked` — verified, not duplicated

| Load | `booking_complete` | Meta `Schedule` |
|---|---|---|
| First | **1** | **1** |
| Second (same session) | **0** | **0** — dedupe held |

That block is byte-identical to before this run.

---

## 3 · SCHEMA — national architecture

31 city pages shipped a `LocalBusiness` node naming a per-city storefront
(*"AI Voice Agency — Milwaukee HVAC"*) carrying the Kewaskum postal address. That asserts a
**physical location in every metro**, which is false, and it fragmented the entity across 31
pages.

| Change | Count |
|---|---|
| `LocalBusiness` → canonical `Organization` @ `https://aivoiceagency.ai/#organization` | 30 |
| `Service.provider` inline org → `{"@id": org}` | 33 |
| Canonical `Organization` injected (verticals had it **only** nested inside `Service.provider`) | 10 |

**The per-city service area is not lost** — it already lives on `Service.areaServed` as a
`City`, which is the correct place for it. Only the storefront claim went.

| Assertion | Result |
|---|---|
| `LocalBusiness` present | **0 pages** ✅ |
| Organization + Service on homepage + all 9 verticals | ✅ |
| JSON-LD blocks parsing | **190 / 190** ✅ |

---

## 4 · BUYER-INTENT META — 11 existing pages

No new pages. No city stamping. Titles, descriptions, OG and Twitter aligned; **every title
≤65 characters.**

| Page | Now |
|---|---|
| `/` | AI Receptionist That Books Appointments 24/7 (62) |
| `/hvac-answering-service` | 24/7 HVAC Answering Service \| AI Receptionist for HVAC Companies (64) |
| `/plumber-answering-service` | After-Hours Answering Service for Plumbers \| AI Receptionist 24/7 (65) |
| `/electrician-answering-service` | 24/7 Answering Service for Electricians (63) |
| `/24-hour-answering-service` | 24/7 Answering Service for Home Service Companies (55) |
| `/home-services` | AI Receptionist for Home Service Companies \| Books Jobs 24/7 (60) |
| `/hospitality` | AI Receptionist for Hotels and Event Venues \| 24/7 Bookings (59) |
| `/medical-practices` | AI Receptionist for Medical Practices \| Books Appointments 24/7 (63) |
| `/professional-services` | AI Receptionist for Law Firms \| Answers Client Calls 24/7 (57) |
| `/ground-transportation` | AI Receptionist for Limo and Black Car Dispatch (54) |
| `/book` | Book the AVA Strategy Call — 15 Minutes (57) |

### ⚠ SCOPE CALL — H1s were not rewritten

The brief asked for titles/metas/**H1s**. The H1s on these pages are span-per-line
compositions (`<span class="hero-line">Group of twelve</span><span class="hero-line">calling
Friday night?</span>…`) that carry the hero's visual rhythm. Rewording them is a **hero
redesign**, not a meta pass, and it collides with the minimal-delta rule this run is under.
The two highest-intent pages already carry the phrase in the H1 (*"The answering service for
HVAC companies that actually dispatches"*). **Flagged for a separate design run** — say the
word and it gets one.

---

## 5 · HOMEPAGE FREEZE LAW

Appended to `CLAUDE.md`. Homepage copy and design **frozen 30 days, through Aug 27 2026**.
Changes come only from measured behaviour on the four conversion events. Bug fixes, security
fixes and factual corrections stay allowed — *a false claim is a bug, not a redesign*.

---

## ⚠ DRIFT FOUND — REPORTED, NOT TOUCHED

`CLAUDE.md` **§ 5 PROTECTED ANCHORS** is stale (verified 2026-07-22, six days old):

| Anchor | Documented | Actual |
|---|---|---|
| **A1** `3AM. Google Was Listening.` | `/lsa` title + meta | **also the homepage `<h1>`** — the X-Ray swap has effectively landed |
| **A4** `AVA answers calls and books jobs.` | homepage `<h1>` at `index.html:115` | present **only** in the homepage title / OG / Twitter meta — **not** the H1 |
| **A3** `One call. Sixteen agents.` | `index.html:148` | **absent from `index.html` entirely** — lives on `/watch` and `/staging/xray` |

§ 5 says anchors are *"never touched without a CEO order"*, so **nothing was changed**. § 5
needs re-verification against the live homepage.

---

## WHAT CHANGED LIVE

| Change | State |
|---|---|
| Blog invented-stat model stripped (10 replacements) | live, verified `0` residual |
| 3 conversion events → GA4 + Meta | live, browser-verified |
| `/booked` conversion | **verified intact, not duplicated** |
| 31 `LocalBusiness` → canonical `Organization` @id | live, `0` remaining |
| 11 pages buyer-intent titles/descriptions | live |
| HOMEPAGE FREEZE LAW | `CLAUDE.md`, committed |

---

## ROLLBACK — one line each

- **Claim fix:** `git revert 9f0d3ff` — pure string replacement.
- **Everything else:** `git revert c8d8b15`.
- **Events only:** delete the `RUN 9 CONVERSION EVENTS` block in `js/tracking.js` (52 lines,
  additive — nothing else depends on it).
- **Schema only:** `tools/run9-schema.py` documents the exact transform; restoring
  `LocalBusiness` means reverting the commit.

---

## GOTCHAS WORTH KEEPING

1. **A tracking spine that self-tags automation cannot be tested by automation.** Neutralise
   the flag in a harness first, or every event silently "passes" by never firing.
2. **String replacement where the new text contains the old is self-nesting.** Two description
   rules would have stapled their prefix on with every re-run. Whole-attribute replacement
   cannot nest.
3. **`git checkout` to redo one pass silently undoes every other pass on that file.** Reverting
   6 pages for the meta rewrite wiped their schema work; the schema tool's own assertions
   caught it.
4. **An `Organization` nested inside `Service.provider` is not a standalone entity.** Repointing
   `provider` at an `@id` removes the page's only Organization unless you inject one.
5. **A fabricated stat hides in the meta description**, not just the body — that is the copy
   Google actually renders.
6. **Anchors drift.** § 5 was six days stale and two of four anchors had moved or vanished.

## STILL OPEN

- **§ 5 PROTECTED ANCHORS needs re-verification** — A3 absent, A4 meta-only (CEO order required).
- **H1 buyer-intent pass** on the 9 vertical heroes — deliberately deferred, needs a design run.
- Frozen v37 Retell agent still points at chat-dash (RUN 6.6-C).
- GHL draft publishes + contact hygiene (Block F) (RUN 6.5).
