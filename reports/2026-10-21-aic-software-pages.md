RUN INCOMPLETE — WHAT: STEP 0E (CHATDASH) COULD NOT BE READ, AND STEP 4B (TWO AI CHAUFFEUR CALENDAR FIELDS) IS HELD. WHY: THERE IS NO CHATDASH KEY IN ANY DOPPLER CONFIG AND CHATDASH IN CHROME IS LOGGED OUT; THE AUTO-MODE CLASSIFIER HELD THE GHL PUT, AS IT DID ON THE OCT 21 AVA CALENDAR RUN. NEXT: SHANE SAYS "APPROVE THE PUT" IN CHAT (THE SCRIPT AND BACKUP ARE READY), AND LOGS INTO APP.CHAT-DASH.COM IN CHROME OR ADDS A CHATDASH KEY TO DOPPLER SO THE DASHBOARD LINE CAN NAME WHAT IT SHOWS.

# 2026-10-21 · AIC SOFTWARE PAGES · aichauffeur.ai

PASTE-CC-AIC-SOFTWARE-PAGES-v1.4 (replaces v1.3). Run on the Dell, Wed Oct 21 2026, about 10:40 PM to midnight CT.
Loadout: chauffeur-design · frontend-design · ui-ux-pro-max · taste · verification-before-completion.

- Site commit **7d15b6d** → aichauffeur `dpl_CV1xh4C9cqs1kqzorNm1B3NyTbwd` READY 11:22:15 PM CT (created 11:22:06).
- Before: aichauffeur `dpl_48ib38a5Ek8dN1Cr8sTm5Kt79dt6` (1f14364).
- Board + this report: the commit after 7d15b6d.
- Rollback: `git revert 7d15b6d` and push, or promote `dpl_48ib38a5Ek8dN1Cr8sTm5Kt79dt6`.

## DONE

| Item | Before | After | Live |
|---|---|---|---|
| 0 Buttons | "Call the demo" / "Pick a time with the team" (WORDS-B) | the same two labels on all 8 new pages; no other label, no name | old labels 0 and "Shane" 0 on all 41 served pages ✓ |
| 0b Rail | homepage: call bar only (data-rail-hide on the sample area did nothing); other pages: old rail hidden over every FAQ row and the sample player | homepage call bar unchanged; old rail no longer hides for `summary` or `.demo-play-btn`; `data-rail-hide` taken off the homepage sample area | moovs FAQ row: rail up · limo-anywhere and pricing FAQ rows: hidden on prod before, up after ✓ |
| 0c Headings | 7 named | 5 changed, 2 skipped (no matching section) + /book/ H1 | ✓ |
| 0d Entity line | "Flight tracking and more languages can be added to any plan." | "Flight tracking and more than 50 languages can be added to either plan." (home hero-sub, llms.txt, llms-full.txt); phone copy "…more than 50 languages as add-ons." | ✓ |
| 0e ChatDash | — | not confirmed (see § 1) → dashboard line: "Your client dashboard is included with both plans. Every trip sheet also comes with the call recording." | — |
| 0f Hero line | "Your people run the cars and the office. AI Chauffeur takes the calls you choose…" (1 copy) | gone; no other copy existed | grep 0 on 41 pages + both llms files ✓ |
| 1 /pricing/ | price cards, no table, "reminder texts" add-on | plan table (11 rows), add-on lines, software line linked to /integrations/; reminder texts out of the page and its FAQ | ✓ |
| 2 /compare/ | one table; title "…vs a Limo Answering Service vs Voicemail" | second H2 + table vs a generic AI phone agent; title "AI Chauffeur vs a Generic AI Phone Agent vs an Answering Service" + meta | ✓ two tables |
| 3 Software pages | 2 (Limo Anywhere, FASTTRAK) | 10; sitemap 33 → 41; hub + works-with + llms link them; LA + FASTTRAK kicker and change/cancel FAQ | 8 URLs 200 with the right H1 ✓ |
| 4 Verify | — | run14 PASS (prod, 19 pages + 11 new/changed pages × 5 widths) · llms-verify GREEN 146/146 served · live check 78/78 · render probe 32/32 prod · IndexNow 10 URLs 200 | ✓ |
| 4b Calendar | thank-you = GHL stock with {{contactMethod}}; description empty | **held** (PUT ready, not sent) | — |
| 5 Board + report | — | `aic-software-pages` live + one log entry | repo |

## 1 · STEP 0e · ChatDash (read only)

| Check | Result |
|---|---|
| Doppler key | **none.** `doppler secrets --only-names` on ava-prod prd, dev, dev_personal, stg, codex and codex_read: no name containing CHAT or DASH. |
| How the Oct 8 run read it | Shane's Chrome, app.chat-dash.com → Agents (it then held the AVA 414-240-8930 agent only). |
| Tonight in Chrome | app.chat-dash.com and /agents redirect to **/client/login** (logged out). No password was entered. |
| (1) agents imported + their lines | not confirmed |
| (2) clients + feature toggles | not confirmed |
| (3) recording · transcript · call count in the client view | not confirmed · not confirmed · not confirmed |
| (4) client login address | ChatDash default `app.chat-dash.com/client/login` exists (page title is a white-label placeholder); a custom domain is not confirmed |
| (5) Stripe connected · products present | not confirmed · not confirmed |

So the site never names ChatDash and names no dashboard feature. The sentence used everywhere: **"Your client dashboard is included with both plans. Every trip sheet also comes with the call recording."** The /pricing/ row says only "Client dashboard"; the /compare/ row says "Client dashboard".

## 2 · STEP 4b · AI Chauffeur calendar `UaxV0ENx2cEUYs6qeWZ7` (GHL)

Backup (full GET, 55 keys, 4,912 bytes, 11:19 PM CT): `C:\ava-backups\2026-10-22-ghl-aic-thankyou-backup.json`. Scripts: `C:\ava-backups\2026-10-22-ghl-aic-thankyou-get.mjs` (read) and `…-put.mjs` (write, `--dry`, `--rollback`).

| Field | Before (read 11:19 PM CT) | After |
|---|---|---|
| formSubmitThanksMessage | "Thank you for your appointment request. We will contact you shortly to confirm your request. Please call our office at {{contactMethod}} if you have any questions." | **not sent yet.** Ready: "You're booked. Check your email for the time and details. Our team will call the number you provided. — AI Chauffeur Team" |
| description | `<p style="margin:0px;color:#10182899"></p>` (empty) | **not sent yet.** Ready: the same `<p>` wrapper holding "20 minutes to talk about your calls, your rates, and how our reservation desk can help your team." |

The PUT sends only those two plus the values read back as read (slot length and interval 20/20, buffers 0, 1 per slot, per-day as read (empty), the 7-day 11:00 AM–7:20 PM hours, 3 hours notice, 30 days, ThankYouMessage). The AVA calendar, the consent line, the Google invite, workflows, n8n, emails and texts are untouched.

If the API refuses a field after approval, the click path is: GHL → Calendars → Calendar Settings → "Discovery Call" (AI Chauffeur) → Edit → Forms & Payment → "Thank You Message" box; and Meeting Details → "Meeting Invite / Description" box. Save.

## 3 · The eight pages

Each page: title "<Software> Integration — AI Reservation Desk for Limo Operators | AI Chauffeur", H1 "AI Chauffeur works beside <Software>.", kicker "THE AI RESERVATION DESK FOR LIMOUSINE AND BLACK CAR COMPANIES", sections About · Day one · The $1,697 plan · the field map (the one table) · a sample call · Call the demo / Pick a time with the team · FAQ (5) · More. Every vendor fact sits next to an HTML comment with its source URL and the quoted words.

| Page | Words in main | Page-specific | Grade (blocks) | Grade (full sentences only) | Table | FAQ JSON-LD | "Call the demo" / "Pick a time with the team" |
|---|---|---|---|---|---|---|---|
| /integrations/moovs/ | 1,253 | 1,151 | 2.53 | 3.15 | 1 | 5/5 mirrored | 11 / 5 |
| /integrations/livery-coach/ | 1,247 | 1,120 | 3.55 | 4.20 | 1 | 5/5 | 11 / 5 |
| /integrations/gnet/ | 1,274 | 1,121 | 3.06 | 3.68 | 1 | 5/5 | 11 / 5 |
| /integrations/hudson/ | 1,184 | 1,050 | 3.48 | 4.12 | 1 | 5/5 | 11 / 5 |
| /integrations/santacruz/ | 1,146 | 1,023 | 3.82 | 4.40 | 1 | 5/5 | 11 / 5 |
| /integrations/limoexpress/ | 1,172 | 1,048 | 3.41 | 4.06 | 1 | 5/5 | 11 / 5 |
| /integrations/a-to-z-dispatch/ | 1,268 | 1,133 | 2.99 | 3.66 | 1 | 5/5 | 11 / 5 |
| /integrations/ridebits/ | 1,201 | 1,044 | 3.76 | 4.48 | 1 | 5/5 | 11 / 5 |
| /pricing/ | 1,074 | — | 4.02 | 4.73 | 1 | 13/13 | 10 / 7 |
| /compare/ | 402 | — | 3.10 | 4.13 | 2 (owner-ordered) | none on page | 10 / 5 |

Grade = Flesch-Kincaid on the visible text of `<main>` (a script, vowel-group syllables). "Blocks" counts each list item, cell and paragraph as a unit; "full sentences only" keeps only blocks that end in . ! ?. Page-specific = words in main minus blocks shared with another of the eight pages (the shared ones are the mandated lines: price, guarantee, dashboard line, the CTA, the sample-call label, the FAQ question "What if you can't connect it?", a few table cells and dialogue lines). Button counts are raw text counts, the same way WORDS-B counted (they include "Call the demo line…" in body copy).

### Vendor facts (all from the vendor's own site, read Oct 21 2026)

| Software | Known for | Built for | API / webhook / email | Page says |
|---|---|---|---|---|
| Moovs | software for limo reservations and dispatch — moovsapp.com (meta); quotes, invoicing, driver app — moovsapp.com/pricing | plans by fleet: 2–10, 11–20, 20+ vehicles — moovsapp.com/pricing | automated SMS & email notifications — moovsapp.com/pricing; no API docs page (an "open API" is mentioned on the enterprise page, "Custom API" Enterprise only) | email dispatch or webhook |
| Livery Coach | reservations, dispatch, QuickBooks accounting, maintenance — liverycoach.com | a few cars to hundreds of cars and 1,000+ trips a day — liverycoach.com/software.html | emailed confirmations and receipts; client/server, data on your own server — software.html; no API page | email dispatch or webhook |
| GNet | GRiDD's network for ground transportation; "not a booking system" — docs.grdd.dev/introduction, gnet.grdd.net FAQ | chauffeur and black car operators farming out across 65+ dispatch systems — connect.grdd.net/products/gnet-platform | public API docs (approval-gated credentials) + webhook callbacks — docs.grdd.dev | API, webhook or email |
| Hudson | ground transportation software since 1999: reservations, dispatch, reports, accounting — hudsonltd.com, /our-company | limo and sedan operators, mixed fleets — hudsonltd.com, /limousine-management-solutions | emailed confirmations and receipts — hudsonltd.com/reservation-system; no API page (/api serves the homepage) | email dispatch or webhook |
| SantaCruz (GroundWidgets) | core of GroundWidgets: reservations, dispatch, accounting — groundwidgets.com/santacruz | established operators, one location or many markets — groundwidgets.com | WebConnect emailed confirmations — groundwidgets.com/webconnect; no API page | email dispatch or webhook |
| LimoExpress | inquiry to payment for limo and livery companies — limoexpress.me | all sizes; 5 to 50 user accounts, unlimited vehicles — limoexpress.me | public API reference api.limoexpress.me/api/docs/v1; "API integration included." on each plan; email/SMS/push notices — /features | API, webhook or email |
| A to Z Dispatch | white-label dispatch software, zero commission — atozdispatch.com | small and mid-sized operators, 1 to 100 vehicles — atozdispatch.com | email confirmations; SMS & email notifications add-on — /limo-app-integrations; API "on higher-tier plans" but no API docs page | email dispatch or webhook |
| RideBits | ground transportation software since 2012; classic product built around the dispatch desk, corporate accounts, booking widget — ridebits.com | limo companies, private chauffeurs, car services; plans up to 10 / 50 team members — ridebits.com/platform, /platform/pricing | confirmations and updates through its passenger and driver apps — /platform; no API page | email dispatch or webhook |

What every page claims: AI Chauffeur answers in your company's name, quotes your rates and books the reservation on both plans; the trip sheet, recording and transcript go to your dispatcher; live transfer; the $1,697 plan writes the new booking into the software, remembers regular customers and sends a card link; the connection is scoped on your setup call; the 30-day refund line. What no page claims: tested, trial, pilot, certified, partner, official, two-way sync, any API on the six vendors without an API page, any vendor feature not read on the vendor's site, any price but $997 / $1,697, any language as included, that AI Chauffeur dispatches, changes, cancels, moves or farms out a trip.

## 4 · STEP 0b · the rail

| Where | Before (prod 1f14364) | After (prod 7d15b6d) |
|---|---|---|
| Homepage | one call bar (WORDS-B); `data-rail-hide` on the sample area was read by nothing on this page | the same call bar; the dead attribute is gone. Up over the transcripts, the software section, the FAQ and the footer; down only while the hero call button is on screen; never on /book/ or /try/ |
| 39 other pages (old rail) | hidden over any FAQ row (`summary`), the sample player, inline call/book buttons, the footer and marked forms | still hidden over inline call/book buttons (`.btn-primary`, `.tel-btn`), the footer, the /reserve/ hold form and the /book/ calendar; **no longer hidden over FAQ rows or the sample player** |

Measured at 390×844 with instant scrolling: /integrations/limo-anywhere/ and /pricing/ FAQ rows 1 and 3, rail hidden before, up after.

## 5 · Homepage headings (STEP 0c) and the fold (STEP 0f)

| Section | Before | After |
|---|---|---|
| Sample calls | no heading (the players sit in the hero) | **skipped** |
| Coverage (#pain) | Every missed call is a ride going to someone else. | Help for the calls your office can't get to. |
| Software (#integrations) | Works with what you already run. | Keep the reservation software you use. |
| Plans (h3 in #built) | What it costs | Choose how bookings reach your team. + "Both plans quote your rates and book the reservation. The difference is who enters it in your reservation software." + the dashboard line |
| Setup (h3 in #setup) | Setup, done for you. | Set up for your company. |
| FAQ | Questions operators actually ask. | Questions from operators. |
| Closing call | no such section | **skipped** |
| How it works | Four steps. One complete trip sheet. | unchanged |
| /book/ H1 | Pick a time for your discovery call. | Pick a time with our team |

Hero call button at 390×844: **809–869** (straddled the fold) → **675–735** (fully in the first screen). No CSS change was needed.

## 6 · Gates

| Gate | Local | Production |
|---|---|---|
| tools/aic-run14-gate.mjs (19 pages × 5 widths) | PASS | **PASS** |
| the same eight assertions on the 8 new pages + /pricing/ + /compare/ + /book/ (scratch copy) | PASS after two fixes: SantaCruz H1 overflowed 29px at 320 (now `Ground<wbr>Widgets`), sample-call note over 75ch | **PASS** |
| scripts/llms-verify.mjs | GREEN 146/146 | **GREEN 146/146** on the served file, 41/41 links |
| tools/aic-run10-faq-mirror.py --check | 11 drifted, all /answers/ (the tool can't read them, as before) | — |
| render probe, 16 pages × 390 + 1440 (overflow, console, tables) | 32/32 | **32/32** |
| live check (scratch) | — | **78/78** |
| contrast (composite over ancestors) | every new text ≥ 5.0:1 (lowest: link on the software line 5.03, row "—" 5.98) | — |
| IndexNow | — | 10 URLs, HTTP 200 "submitted" (submission, not indexing) |

Screenshots: `audits/aic-software-pages/local/*.png` (390 and 1440, full page; not committed, audits/ is not deployed).

```
===== SHANE READBACK — COPY ALL =====
AIC SOFTWARE PAGES · Oct 21 2026 · aichauffeur.ai · LIVE (calendar step held)

WHAT CHANGED, PLAIN WORDS
- Eight new pages, one per reservation software: Moovs, Livery Coach, GNet, Hudson, SantaCruz (GroundWidgets), LimoExpress, A to Z Dispatch, RideBits. Each says what that software is known for and who it is built for (from the vendor's own site, source in the page code), what you get on day one, what the $1,697 plan adds, a table of where each trip detail lands, a sample call, and five questions.
- /pricing/ now has one table: "Reservation Desk — $997 a month + $997 setup" next to "With Your Reservation Software — $1,697 a month + $1,697 setup". Both columns tick the same first eight rows (answers, quotes your rates, books, live transfer, trip sheet + recording + transcript, trip log, 24/7 or after hours, client dashboard). Only the $1,697 column ticks: writes into your software, remembers regulars, card link.
- Add-on lines under it: more than 50 languages, flight tracking, a website talk button, custom set-ups (speed-to-lead, outbound campaigns), and "your dispatcher confirms the car and the chauffeur". Reminder texts are gone from /pricing/.
- Dashboard line, everywhere: "Your client dashboard is included with both plans. Every trip sheet also comes with the call recording." It names no dashboard feature because ChatDash could not be read tonight (no key in Doppler, Chrome logged out).
- /compare/ has a second table: AI Chauffeur vs a generic AI phone agent vs an answering service, 10 rows. New page title to match.
- Homepage: the line "Your people run the cars and the office…" is gone. On a phone the call button now sits fully in the first screen (675–735 of 844; it was 809–869). New headings: Help for the calls your office can't get to · Keep the reservation software you use · Choose how bookings reach your team · Set up for your company · Questions from operators. /book/ says "Pick a time with our team".
- The call bar now stays up while someone reads the FAQ (it used to hide).
- What every software page never says: tested, trial, partner, official, certified, two-way sync, an API for the six vendors that publish none, any price but $997 / $1,697, or that AI Chauffeur dispatches, changes, cancels or farms out a trip.

DONE
| Item | Before | After | Live |
| Software pages | 2 | 10, sitemap 33 -> 41 | 8 URLs 200, right H1 |
| /pricing/ | cards only | plan table + add-on lines + dashboard row | yes |
| /compare/ | 1 table | 2 tables, new title | yes |
| Hero line | on the homepage | gone | grep 0, 41 pages |
| Call button on a phone | 809-869 of 844 | 675-735 | yes |
| Headings | 5 old | 5 new (+ /book/) | yes |
| Rail over FAQ | hidden | up | yes |
| ChatDash | - | not confirmed | - |
| AIC calendar words | GHL stock text with the AVA number | HELD, waiting for your OK | no |
| Gates | - | run14 PASS, llms GREEN 146/146, live 78/78, IndexNow 10 | yes |

IDS / ROLLBACK
- Site 7d15b6d -> aichauffeur dpl_CV1xh4C9cqs1kqzorNm1B3NyTbwd READY 11:22 PM CT. Before: dpl_48ib38a5Ek8dN1Cr8sTm5Kt79dt6.
- Rollback: git revert 7d15b6d and push, or promote dpl_48ib38a5Ek8dN1Cr8sTm5Kt79dt6.
- Calendar: backup C:\ava-backups\2026-10-22-ghl-aic-thankyou-backup.json; send with doppler run -p ava-prod -c prd -- node C:\ava-backups\2026-10-22-ghl-aic-thankyou-put.mjs; undo with the same command plus --rollback.
- Report: reports/2026-10-21-aic-software-pages.md. Board: aic-software-pages.

NEXT
- Your call: say "Approve the PUT" and the two calendar fields go in (thank-you text without the AVA number, the 20-minute description).
- Your call: log into app.chat-dash.com in Chrome (or add the ChatDash key to Doppler) so the dashboard line can name calls, recordings and transcripts.
- Next owner: Claude (booking words v1.1, ChatDash + Stripe plan, outreach launch).

GOTCHAS
1. On Oct 8, ChatDash held only the AVA agent. If the AI Chauffeur agent was never added, a client dashboard for it is not set up yet. Check before selling "both plans include it".
2. GNet says on its own site that it is not a booking system. Its page says the $1,697 plan writes into the reservation software GNet links to, not "into GNet".
3. Only GNet and LimoExpress publish API docs. Moovs and A to Z Dispatch mention an API on sales pages (Enterprise / higher tiers) with no docs, so their pages say "email dispatch or webhook", like the other four.
4. Moovs ("Miles AI Agent") and A to Z Dispatch ("AtoZ AI ... answer calls") sell their own AI inside the software.
5. On /pricing/ the price cards under the new table still say "AI Chauffeur" and "AI Chauffeur with your reservation software", not the new plan names.
6. "Reminder texts" is still in the homepage add-on list and in CLAUDE.md pricing; only /pricing/ was named.
7. The add-on line you wrote says "Your dispatcher confirms the car and the chauffeur." CLAUDE.md says the dispatch step is never called confirmed. Kept as written.
8. Two homepage headings had no section to land on (no heading in the sample-call area, no closing call section). Plans and setup were h3 headings; they kept their h3.
9. The old Limo Anywhere page still says "we run test trips". Only its kicker and FAQ were in scope.
10. /compare/ now carries two tables; DESIGN-SYSTEM says one per page. Owner-ordered.
11. The repo's pre-commit hook also moved one aivoiceagency.ai sitemap date by one second (/book). Harmless, outside chauffeur/.
12. The sample calls are page copy written for each page, labeled as samples, with no prices. They do not change what the phone agent says.
```
