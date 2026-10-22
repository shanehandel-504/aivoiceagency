# 2026-10-21 · AIC WORDS B · aichauffeur.ai

PASTE-CC-AIC-WORDS-B-v1.1 (replaces v1, never run). Run on the Dell, Wed Oct 21 2026, evening (site deploys READY 9:34 PM CT).
Loadout: chauffeur-design · frontend-design · ui-ux-pro-max · taste · verification-before-completion.

- Site commit **b749205** → aichauffeur `dpl_AwdniYzjhcwokCqDUBpoRRKExuVj` READY 9:34:06 PM CT · aivoiceagency `dpl_8CnCDtQLKhK8F25X9B9JnnSRcUS1` READY 9:33:59 PM CT (AVA /book label).
- Before: aichauffeur `dpl_EmyUfVqBZZPMSnm4B7xr2BU4Dfmp` (a702429) · aivoiceagency `dpl_22JA7g1CxRh2ZRpLCp3MK6mrDUHP` (a702429).
- Board + this report: the commit after b749205.

## DONE

| Step | Before | After | Live |
|---|---|---|---|
| 0 Buttons, 34 pages | "Talk to AI" 326 · "Talk to a Human" 167 (raw files: labels, aria-labels, titles, meta, 1 comment) | "Call the demo" / "CALL THE DEMO" · "Pick a time with the team"; same tel: and /book/ links, same data-events; header chip still shows the number | old labels 0 on all 34 served pages ✓ |
| 1 Title + meta | "AI Chauffeur — Answers every call. Quotes your rates. Books the trip." | "Limo Answering Service & AI Reservation Desk \| AI Chauffeur"; meta = the two sentences, demo clause trimmed (168 chars) | ✓ |
| 2 Hero line | "Your people run the cars. AI Chauffeur runs the phones." | "Your people run the cars and the office. AI Chauffeur takes the calls you choose: after hours, weekends, overflow, or all of them." (no other file carried the old line) | ✓ |
| 3 Phone entity line | none (hero-sub hidden under 768) | `.hero-sub-m` under 768 only: 17px like the hero-sub, `--ink-mute`, 5.44:1 measured | ✓ at 390, gone at 768 |
| 4 Which plan writes in | hero-sub, #integrations and the FAQ said "with your reservation software" with no plan | "(the $1,697 plan)" once in each; llms mirrors follow | ✓ |
| 5 Doubled phrase | 14 sentences on the 10 named files | 0 (list below) | grep 0 on served pages ✓ |
| 6 FAQ | "Is this a cheap bot with our name on it?" (home + pricing) | "Is it set up for my company?" + the new answer; JSON-LD via the mirror tool | ✓ |
| 7 Transcript block | own section `#calls` with six accordions | section off; all six under one collapsed "Transcripts" row at the bottom of the sample-call area, under the players; 6 calls, 79 lines, words identical to a702429 | ✓ |
| 8 Call first | call button green, play control outlined | already so; verified (play: surface fill, 1px blue outline; call sits above the player) | ✓ |
| 9 Call bar | old blue rail on the homepage (rarely showed: hidden over any button, FAQ row or the player) | homepage call bar, phones only: green "Call the demo" (tel_tap_sticky) + outlined "Pick a time with the team" (book_click_sticky); up once the hero button scrolls up out of view, down when it is back; safe-area padding; body pays back 73px; not on /book/ or /try/ | ✓ at 320–767 |
| 10 Repo docs | "AI Chauffeur with your CRM" | "with your reservation software" in CLAUDE.md pricing and DESIGN-SYSTEM.md prices | repo |
| 11 /book/ diagnosis | — | see below: GHL's resize usually works; when it misses, the frame sits at 760px with scrolling="no" and every step is trapped | — |
| 12 /book/ fix | scrolling="no", phone floor 760px, "Open it full screen →" | scrolling="auto", phone floor 1100px, "Open in a new tab (this page stays open) →" (target _blank, rel noopener) | ✓ Chromium + WebKit |
| 13 Verify live | — | live check 35/35 · render probe 73/73 on prod · run14 PASS · llms-verify GREEN 124/124 | ✓ |
| 14 Board + report | — | `aic-words-b` + `ava-calendar-fix` live, 2 log entries · AVA /book iframe title "AVA discovery call calendar" | ✓ |

## Step 0 · labels per page (raw file counts, a702429 → b749205)

The homepage loses one "Call the demo" and /book/ two, because the old rail's aria-label and verb went with the rail (the homepage's new bar carries one label; /book/ has no bar).

| Page | Talk to AI before | Talk to a Human before | Call the demo after | Pick a time with the team after | old labels after |
|---|---|---|---|---|---|
| /after-hours-limo-dispatch/ | 10 | 5 | 10 | 5 | 0 |
| /airport-transfer-booking/ | 11 | 5 | 11 | 5 | 0 |
| /answers/can-it-handle-airport-pickups-with-flight-numbers/ | 9 | 5 | 9 | 5 | 0 |
| /answers/can-it-pick-the-right-vehicle-for-the-number-of-bags/ | 9 | 5 | 9 | 5 | 0 |
| /answers/does-it-answer-the-phone-at-3-am/ | 9 | 5 | 9 | 5 | 0 |
| /answers/does-it-quote-prices/ | 9 | 5 | 9 | 5 | 0 |
| /answers/does-it-work-with-my-booking-software/ | 9 | 5 | 9 | 5 | 0 |
| /answers/does-the-caller-know-theyre-talking-to-a-computer/ | 9 | 5 | 9 | 5 | 0 |
| /answers/how-fast-is-a-booking-call/ | 9 | 5 | 9 | 5 | 0 |
| /answers/ | 9 | 4 | 9 | 4 | 0 |
| /answers/what-does-dispatch-actually-get-after-a-call/ | 9 | 5 | 9 | 5 | 0 |
| /answers/what-happens-if-it-doesnt-understand-a-name-or-an-address/ | 9 | 5 | 9 | 5 | 0 |
| /answers/what-happens-when-a-caller-wants-to-change-or-cancel-a-trip/ | 9 | 5 | 9 | 5 | 0 |
| /answers/what-if-the-caller-has-a-question-it-cant-answer/ | 9 | 5 | 9 | 5 | 0 |
| /book/ | 10 | 11 | 8 | 11 | 0 |
| /compare/ | 10 | 5 | 10 | 5 | 0 |
| /how-setup-works/ | 10 | 5 | 10 | 5 | 0 |
| / | 12 | 8 | 11 | 8 | 0 |
| /integrations/fasttrak/ | 10 | 5 | 10 | 5 | 0 |
| /integrations/ | 10 | 5 | 10 | 5 | 0 |
| /integrations/limo-anywhere/ | 10 | 5 | 10 | 5 | 0 |
| /limo-answering-service/ | 11 | 5 | 11 | 5 | 0 |
| /limo-dispatch-automation/ | 10 | 5 | 10 | 5 | 0 |
| /madison-limo-answering-service/ | 10 | 5 | 10 | 5 | 0 |
| /milwaukee-limo-answering-service/ | 10 | 5 | 10 | 5 | 0 |
| /pricing/ | 10 | 7 | 10 | 7 | 0 |
| /privacy/ | 9 | 4 | 9 | 4 | 0 |
| /rates/ | 10 | 3 | 10 | 3 | 0 |
| /reserve/ | 10 | 3 | 10 | 3 | 0 |
| /terms/ | 9 | 4 | 9 | 4 | 0 |
| /try/ | 5 | 0 | 5 | 0 | 0 |
| /what-it-can-do/ | 10 | 4 | 10 | 4 | 0 |
| /what-it-does/ | 10 | 4 | 10 | 4 | 0 |
| /works-with-your-software/ | 11 | 5 | 11 | 5 | 0 |
| **34 pages** | **326** | **167** | **323** | **167** | **0** |

Also changed with the labels: /try/ title and og/twitter titles ("Call the demo | AI Chauffeur | (414) 775-0019"), /book/ title, meta and breadcrumb ("Pick a time with the team: Book a 20-Minute Discovery Call"), and both llms files (headings and link labels). llms-verify reads every label as a claim that must be live, so they had to move with the pages.

## Step 5 · every doubled sentence, before → after

| File | Where | Before | After |
|---|---|---|---|
| after-hours-limo-dispatch | FAQ (+ its JSON-LD via the mirror) | With your reservation software, the trip is written straight into your reservation software. | With your reservation software, the trip is written straight in. |
| what-it-does | table cell | With your reservation software, it writes the trip straight into your reservation software. | With your reservation software, it writes the trip straight in. |
| what-it-does | list item | same | same |
| how-setup-works | section sub | With your reservation software, the trip is written straight into your reservation software. | With your reservation software, the trip is written straight in. |
| limo-dispatch-automation | FAQ (+ JSON-LD via the mirror) | With your reservation software, the trip is written straight into your reservation software. | With your reservation software, the trip is written straight in. |
| integrations | direct answer | With your reservation software, it writes the trip straight into your reservation software. | With your reservation software, it writes the trip straight in. |
| integrations | Service JSON-LD description | same | same |
| what-it-can-do | options table | With your reservation software, write the trip straight into the reservation software you already run. | With your reservation software, write the trip straight in. |
| index.html | #integrations sub (with step 4) | With your reservation software, it writes the trip straight into your reservation software. | With your reservation software (the $1,697 plan), it writes the trip straight in. |
| answers/does-it-work-with-my-booking-software | body | With your reservation software, the trip is also written straight into your reservation software. | With your reservation software, the trip is also written straight in. |
| answers/what-does-dispatch-actually-get-after-a-call | body | same | same |
| answers/can-it-handle-airport-pickups-with-flight-numbers | body | With your reservation software, it writes the trip straight into your reservation software. | With your reservation software, it writes the trip straight in. |

14 sentences (the after-hours and limo-dispatch FAQ answers count twice: page + JSON-LD). `grep -rn "reservation software, [^.]*reservation software" chauffeur --include=index.html` → 0 locally and on all 34 served pages.

## Step 11 · /book/ embed diagnosis (390×844, production, never submitted)

The walk: calendar → pick a day → pick a time → Select → the form; stop before "Schedule Meeting". Heights are the iframe's rendered height vs the widget's own document height.

**Normal path, production before the fix**

| Engine | Calendar | Day (time list) | Time picked | Form | Notes |
|---|---|---|---|---|---|
| Chromium | 842 / 842 | 1748 / 1748 | 1748 / 1748 | 1171 / 1171 | GHL's resize grows the frame at every step; nothing cut |
| WebKit, runs 1–2 | **760 / 836** | **760 / 1743** | **760 / 1743** | **760 / 1165** | resize never ran: 3 height messages, no handshake; frame stuck at the 760 floor with scrolling="no"; 76 / 983 / 983 / 405 px cut and trapped |
| WebKit, runs 3–6 | 841 / 841 | 1748 / 1748 | 1748 / 1748 | 1170 / 1170 | handshake made it; fine |

So the miss is intermittent. To test the miss on demand, GHL's `form_embed.js` was blocked (nothing resizes the frame):

**Resize missing, forced**

| | Calendar | Day | Time | Form |
|---|---|---|---|---|
| Before, Chromium | 760 / 837, 77px hidden, **trapped** | 760 / 1743, 983 hidden, **trapped** | 983 hidden, **trapped** | 760 / 1166, 406 hidden, **trapped** |
| Before, WebKit | 760 / 836, 76 hidden, **trapped** | a day could not be tapped (8s timeout) | — | — |
| After, Chromium | 1100 / 1100, fits | 1100 / 1743, 643 scroll inside the frame | same | 1100 / 1166, 66 scroll inside |
| After, WebKit | 1100 / 1100, fits | 1100 / 1743, 643 scroll inside | same | 1100 / 1165, 65 scroll inside |

"Trapped" = content past the frame's bottom edge that a user's scroll over the frame cannot move (scrolling="no"). After the fix no step is trapped on either engine.

**After the fix, production, normal path:** Chromium 1100 (floor) / 1748 / 1748 / 1171; WebKit 1100 / 1748 / 1748 / 1170. Nothing cut, page width 390 = 390 (no horizontal scroll), the tab never left /book/, Schedule Meeting reachable inside the frame, 0 console errors from aichauffeur.ai (aichauffeur.ai sends no CSP header). The errors seen are inside GHL's widget and Cloudflare Turnstile, the same before and after: 422 on form-survey-event, Turnstile's own CSP refusing `data:`, a 401 on the challenge platform.

## Step 12 · the fix (smallest change that passes)

- (a) `scrolling="no"` → `scrolling="auto"` on the widget iframe; phone floor 760 → 1100px on `.cal-shell` and its iframe (desktop 900 unchanged). 1100 was tested first and passed.
- (b) The loader is unchanged: the IntersectionObserver lazy-load, the load floor, the skeleton and GHL's form_embed.js resize path.
- (c) The link reads "Open in a new tab (this page stays open) →", still target="_blank" rel="noopener".
- (d) Two consequences, both measured: `.cal-fallback` got `max-width:70ch`, because the longer link text put the line over run14's 75-character measure (it looks the same); and the old one-button rail was taken off /book/ (step 9: no call bar on /book/).

Screenshots: `audits/aic-book-embed/2026-10-21-{before|after}-{chromium|webkit}-{1-calendar,2-day,3-time,4-form,5-submit-reachable}.png` and `2026-10-21-{before|after}-noresize-{chromium|webkit}-*.png` (33 files, 1×, 2.96 MB; audits/ is not deployed).

## Fit fixes the longer labels needed (measured, not guessed)

- **Header row, 1024–1139px:** "Call the demo · " (107px) plus "Pick a time with the team" needs 1101px; the nav was 1077px wide at 1024. The verb now drops from 1024 to 1139, as it already did below 1024. Nav on one line at 1024, 1280 and 1440.
- **Homepage call bar at 320:** the book label wraps to two lines below 360 (the gate floor) instead of clipping.
- **Old rail on the other 31 pages:** "Pick a time with the team" overflowed its half by 29–40px at 320, 360 and 480. It may now take two lines inside its 56px control, and the verb before the number drops below 640 instead of 480. tools/aic-run13-railfit.mjs, re-pointed at pages that keep the rail and with its negative control moved to the call label (the book label now wraps by design): no overflow, every control 56px. Its one remaining finding is its own 480 constant.
- **Footer "Call the demo · (414) 775-0019":** the number broke after "775-" at 320–390 on 33 pages; the number is now in the site's `.nw` span. Number-split probe: 110 → 11; the 11 left are /privacy/ prose at 768+, already on production before this run.
- **/rates/ call button at 320:** overflowed by 10px; uses the existing `.tel-main--split` modifier (label and number each stay whole).
- **The bar's trigger:** IntersectionObserver with the root extended far below the screen, so a jump that carries the hero button from below the fold straight above it still raises the bar (the plain-viewport version missed that at 320 and 360).

## Gates

| Gate | Local | Production |
|---|---|---|
| tools/aic-run14-gate.mjs | PASS (after fixing /rates/ 320 and the /book/ measure) | **PASS**, 19 pages × 5 widths |
| scripts/llms-verify.mjs | GREEN 124/124, 33/33 links | **GREEN** 124/124 on the served file |
| tools/aic-run10-faq-mirror.py --check | 15 ok, 11 /answers/ pages "drifted" as before (the tool can't read them) | — |
| /answers/ FAQ parity (by hand) | 11/11 | — |
| tools/aic-run12-gate.mjs | FAIL 37, same checks as before (its CTA canon predates both label sets; /integrations/ answer 67 → 64 words, still out of its band) | — |
| render probe (scratch) | 73/73 | **73/73** |
| live check (scratch) | — | **35/35** |

Tokens (sha256 of the LF content, what stamp_chauffeur.py writes on an LF checkout): aic.css **ab10c10a**, aic.js **4fd514a7**, circulant.css **1f629206**; committed blobs hash to the same. Sitemap 33 URLs, lastmod refreshed by the hook.

## Fold, measured

| Viewport | Hero call button before (prod) | After |
|---|---|---|
| 390×844 | 598–658, in the first screen | 809–869, straddles the fold |
| 1440×900 | 916–976, below | 983–1043, below |
| 1024×768 | 837–897, below | 905–965, below |

```
===== SHANE READBACK — COPY ALL =====
AIC WORDS B · Oct 21 2026 · aichauffeur.ai · LIVE

WHAT CHANGED, PLAIN WORDS
- Every button on the site now says "Call the demo" or "Pick a time with the team": 34 pages, same phone number, same calendar link. The header chip still shows the number.
- The hero line no longer says "runs the phones". It now reads: "Your people run the cars and the office. AI Chauffeur takes the calls you choose: after hours, weekends, overflow, or all of them."
- Phones get a short entity line under the hero: "The AI reservation desk for limo and black car companies…"
- The sentences that say the trip goes straight into the software now say it is the $1,697 plan.
- The transcript block is gone from the middle of the page. All six transcripts sit under the players, folded into one "Transcripts" row, word for word. The live call button is still the first control, above the player.
- A call bar follows the visitor on a phone on the homepage: green "Call the demo", outlined "Pick a time with the team". It comes up once the big call button scrolls away and leaves when it comes back. Never on /book/ or /try/.
- The calendar opens fully. Most of the time GHL grows the frame itself; sometimes it misses, and then the calendar was stuck at 760px with no way to scroll (the times and the form were cut off). Now it can scroll inside, and nothing is trapped on either engine.
- The doubled "reservation software … reservation software" sentences are gone on all ten pages.
- New page title: "Limo Answering Service & AI Reservation Desk | AI Chauffeur". FAQ now asks "Is it set up for my company?"
- No person's name on any served aichauffeur.ai file. The AVA /book calendar is labelled "AVA discovery call calendar".

DONE
| Step | Before | After | Live |
| 0 Buttons | Talk to AI 326 · Talk to a Human 167 (34 pages) | Call the demo · Pick a time with the team | old labels 0 on 34 pages |
| 1 Title | AI Chauffeur — Answers every call… | "Limo Answering Service & AI Reservation Desk" + brand | yes |
| 2 Hero line | …runs the phones. | …takes the calls you choose… | yes |
| 3 Phone line | none | entity line under 768, 5.44:1 | yes at 390 |
| 4 Plan | not named | (the $1,697 plan) x3 | yes |
| 5 Doubled phrase | 14 on 10 pages | 0 | grep 0 served |
| 6 FAQ | Is this a cheap bot…? | Is it set up for my company? | yes + JSON-LD |
| 7 Transcripts | own section | folded under the players, 6 calls / 79 lines | yes |
| 8 Call first | green call, outlined play | unchanged, verified | yes |
| 9 Call bar | old rail, rarely showed | homepage bar, 320–767px | yes |
| 10 Docs | with your CRM | with your reservation software | repo |
| 11-12 /book/ | stuck at 760, trapped when GHL misses | scrolling auto, 1100 floor, new-tab link | yes, Chromium + WebKit |
| 13 Gates | — | run14 PASS · llms GREEN 124/124 · live 35/35 · render 73/73 | yes |
| 14 Board | — | aic-words-b + ava-calendar-fix live · AVA label | yes |

IDS / ROLLBACK
- Site commit b749205 → aichauffeur dpl_AwdniYzjhcwokCqDUBpoRRKExuVj READY 9:34 PM CT · aivoiceagency dpl_8CnCDtQLKhK8F25X9B9JnnSRcUS1 READY 9:33 PM CT.
- Before: aichauffeur dpl_EmyUfVqBZZPMSnm4B7xr2BU4Dfmp · aivoiceagency dpl_22JA7g1CxRh2ZRpLCp3MK6mrDUHP.
- Rollback: git revert b749205 and push, or promote those two deployments.
- Report: reports/2026-10-21-aic-words-b.md. Screenshots: audits/aic-book-embed/. Board: aic-words-b, ava-calendar-fix.

NEXT
- Next owner: Claude (SOFTWARE-PAGES).
- Your call: the two new hero lines pushed the call button to the fold edge on a phone (see gotcha 1).

GOTCHAS
1. On a 390 phone the call button used to sit fully in the first screen (598–658); with the new hero line and phone entity line it straddles the fold (809–869 of 844). The call bar only comes up after the button scrolls past.
2. The meta description is 168 characters even with the demo clause trimmed (the two sentences alone are 168). Google may cut the last word or two.
3. Only the homepage has a call button in its hero, so only the homepage got the new bar. The other 31 pages keep the old rail with the new labels; there the book label can wrap to two lines, and the verb before the number shows from 640px (was 480). tools/aic-run13-railfit.mjs still expects 480 and still tests / and /book/ (outside this run's files).
4. The /book/ calendar now has a 1100px floor on phones: when GHL's resize works, about 260px of empty widget shows under the first step; when it misses, the times and the form scroll inside the frame.
5. Between 1024 and 1139px the header chip shows only the number (the row needed 1101px with the longer book label).
6. DESIGN-SYSTEM.md still says every call control reads "Talk to AI" and every booking control "Talk to a Human" (§ 12), and its copy law says never lead with after hours on the homepage. Only the plan name was changed there, as named.
7. The FAQ "Does it replace my dispatcher?" still answers "It takes the phones so…" (not named in this run).
8. Taking the transcript section off also removed its heading ("From the phone call to the trip sheet") and its inline "call AI Chauffeur" link (tel_tap_inline).
9. run12 still FAILs 37, the same checks: its CTA canon predates both label sets.
```
