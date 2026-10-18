# AEO-SUNDAY v1 · 2026-10-18

Follow-up to SEO-RECOVERY v1.1. Closes the v1 NEEDS WORDS list, makes aivoiceagency.ai/ground-transportation tell the same story as aichauffeur.ai, finishes the AVA hero lines, publishes two answer pages, pings IndexNow.

RUN INCOMPLETE — WHAT: the 2B.5 grep returns 1 on production, not 0: aichauffeur.ai/terms/ still says "Every build is custom." / WHY: it is legal copy and the paste gives no new words for it / NEXT: Shane sends the replacement line for terms §226 (below, NEEDS WORDS 1).
RUN INCOMPLETE — WHAT: the 2C.11 grep for "Limo Anywhere" returns 1 on the served /ground-transportation page, not 0 / WHY: the operator paragraph says "Used Limo Anywhere and FastTrack daily." and the paste only gives new words for "17 years" in that sentence / NEXT: Shane sends the replacement sentence (NEEDS WORDS 2).

Every other check passed on production.

## DONE

| Part | Files changed | Verified by (command → result) | Live |
|---|---|---|---|
| 0 · Check | none | `curl` both v1.1 answer URLs → 200 · 200; homepage `cx-btn cx-btn--go` CALL AVA LIVE is the first hero button | yes |
| 2B · NEEDS WORDS from v1 | chauffeur/how-setup-works/index.html · chauffeur/index.html · chauffeur/llms.txt · ground-transportation/index.html (2 lines) · wisconsin-limo/index.html · both sitemaps (lastmod hook) | production grep of all 31 chauffeur sitemap pages for the six strings → 0 everywhere except /terms/ = 1 · `chauffeur/llms.txt` live → 0 · `grep -c "17 years"` /ground-transportation → 0, /wisconsin-limo → 0 · `validate_jsonld.py` → 0 errors · `truth_audit.py --page` both chauffeur pages → 0 defects · `llms-verify.mjs --live` → GREEN both · Playwright 390 + 1440 on all four pages → no overflow, 0 console errors | yes (terms line open) |
| 2C · Transportation page, footer tag, old examples | ground-transportation/index.html · tools/stamp.py · 64 registered AVA pages (footer marker region, 1 line each) · legacy/index-funnel-v2-2026-07-14.html · infra/backups/2026-10-18/ground-transportation-pricing-grid.html | served /ground-transportation: By Quote 0 · No public fixed price 0 · 17 years 0 · Limo Anywhere **1** · Zapier 0 · GoHighLevel 0 · 24/7 0 · one ring 0 · footer tag on 64/68 AVA sitemap pages (the other 4, /live /watch /lsa /deck, carry their own chrome and no shared footer) · temp-copy full `stamp.py` run matches 64/64 pages (footer region and whole page, `?v=` ignored) · Playwright 390 + 1440: no overflow, 0 console errors, one $997 `.tier` card · `validate_jsonld.py` → 0 errors · `llms-verify.mjs --live` → GREEN both | yes (one line open) |
| 3B · AVA hero lines | index.html · llms.txt | Playwright on https://aivoiceagency.ai/ at 390x844 and 1440x900: CALL AVA LIVE first (`cx-btn--go`, tel:+14142408930), HEAR A SAMPLE CALL second (`#watch`, data-watch, plain `cx-btn`), both in the fold, micro line one row, no overflow, 0 console errors · clicking HEAR A SAMPLE CALL starts the sample (`aria-pressed="true"`) · `llms-verify.mjs --live` GREEN | yes |
| 3C · Two answer pages | chauffeur/answers/can-it-handle-airport-pickups-with-flight-numbers/index.html · answers/can-ava-send-an-emergency-call-to-my-cell/index.html · both /answers/ indexes · both sitemaps · both llms.txt · bricks/built/{aic,ava}/ | `brick.mjs --all --dry` 2/2 PASS, then `--all` 2/2 PASS · both URLs 200 with the H1 · both /answers/ indexes list the new page first · `validate_jsonld.py` → 106 pages, 0 errors · `llms-verify.mjs --live` GREEN (134/134 and 122/122 segments) · truth audit 15 defects, all 15 already there before the run (0 new) · Playwright 390 + 1440 clean | yes |
| 4 · IndexNow | none | n8n "SEO — IndexNow daily" runs 15162 + 15163 after the last deploy: aivoiceagency.ai 200, aichauffeur.ai 200 (both runs) · hand ping of the 4 new/changed answer URLs (`scripts/indexnow-ping.mjs --urls=…`) → aivoiceagency.ai 200, aichauffeur.ai 200 | yes |
| 5 · Board + report | hq/board.json · this file | board items `needs-words-closed` + `ava-transportation-canon`, one log entry | yes, with this commit |

## 2B · every line, before → after

**chauffeur/how-setup-works/index.html**
- (a) rate-sheet bullet: "So AI Chauffeur asks for the details your rate sheet needs, instead of a generic set of questions. Your dispatcher still prices the trip." → "So AI Chauffeur quotes from your rate sheet on the call. A price that is not on the sheet is flagged for dispatch, never made up."
- (b) "One thing does not change at any step: AI Chauffeur captures, your dispatcher confirms." → "One thing does not change at any step: AI Chauffeur books the trip, and your dispatcher confirms the car and assigns the chauffeur." (rest of the paragraph unchanged)
- (c) Cost H2: "There is no price list, *and here is the reason.*" → "One price. *Everything on the list.*"
- (c) Cost ¶1: "Every build is custom to the operation — your rate rules, your service area, your vehicle classes, the way your dispatcher works. A small operation running weddings is not the same build as a fleet running airport contracts all week, so the two do not carry the same number." → "AI Chauffeur is $997 a month plus a $997 one-time setup. Month to month. No contract."
- (c) Cost ¶2: "That is the honest reason this page has no figures on it. There is no package to pick from, so there is nothing to publish. The build is scoped on the setup call, out loud, while you are on the phone. What gets built is the limo answering service that answers your line." → "Connected and custom work is priced after the setup call. The whole price is on the pricing page (→ /pricing/). What gets built is the limo answering service that answers your line."
- (c) rows: "No packages / There is no tier to choose from and no starter plan to grow out of. Nothing gets a price before we have seen how you run." → "One price / $997 a month plus a $997 one-time setup. Month to month. No contract."
- (c) rows: "What drives it / Your rate rules, your service area, your vehicle classes, and how a trip reaches your dispatcher today. Same four things as step 02." → "What setup builds / Your company name, your service area, your fleet, your rate sheet and who gets the trip sheets."
- (c) rows: "Not metered / Not per call and not per minute. No meter runs while a caller talks." → "Connected and custom / It connects to CRMs too. We check your reservation software and handle the connection. Connected and custom work is priced after the setup call."
- (c) rows: "When you hear a number / On the setup call, before anything is built. Scoped up front, not after." → "Before you start / The full price in writing before anything is built."
- (d) FAQ "What does it cost?" (visible + JSON-LD): "It depends on the operation, and that is not a dodge. Every build is custom to your rate rules, your service area, your vehicle classes, and the way your dispatcher works. There is no package to pick from, which is why there is no price list on this page. You get a real number on the setup call, before anything is built." → "AI Chauffeur is $997 a month plus a $997 one-time setup. Connected and custom work is priced after the setup call. The whole price is on the pricing page." (visible "pricing page" links to /pricing/)

**chauffeur/index.html**
- (a) kicker: "Included · Custom options" → "Included · Connected and custom"
- (b) "INCLUDED IN THE CAPTURE DESK — 24/7 capture · trip ticket · owner and caller text · recording and transcript · trip log sheet" → "INCLUDED — answers every call in your company name · takes the whole reservation · quotes from your rate sheet · reads the trip back and books it · the trip sheet lands in your CRM, your texts and your inbox, with the recording and the transcript"
- (c) "CUSTOM OPTIONS — your rates in your territory · writing into your CRMs · appointment booking on your calendar · website talk button · multi-language (50+ languages) · knowledge answers · confirmations" → "CONNECTED AND CUSTOM — writing into your reservation software · website talk button · multi-language (50+ languages) · knowledge answers · priced after the setup call"
- (d) setup block: "Every build is custom to your operation — your rates, your service area, your vehicle classes. We scope it on the setup call." → "Setup builds it for your company: your company name, your service area, your fleet, your rate sheet and who gets the trip sheets."
- (e) flow step 01: "Inbound calls route to AI Chauffeur 24/7. Every call gets answered and written up as a trip sheet before it goes cold." → "Answers every call. Every call is written up as a trip sheet before it goes cold."

**chauffeur/llms.txt** (2B.3)
- "- Every build is custom to your operation — your rates, your service area, your vehicle classes. We scope it on the setup call." → "- Setup builds it for your company: your company name, your service area, your fleet, your rate sheet and who gets the trip sheets."
- "Last reviewed: 2026-10-17" → "Last reviewed: 2026-10-18". No other line quoted an old 2B string.

**AVA "17 years" (2B.4)**
- /ground-transportation hero: "// 17 years in limo operations · we know what your phones sound like" → "// 14 years in limo operations · …"
- /ground-transportation operator: "30 years operating, 17 years specifically in transportation." → "30 years operating, 14 years specifically in transportation."
- /wisconsin-limo hero: "// Shane Handel · 17 years in limo ops · owned Maxim Limousine · Wisconsin-based" → "… 14 years in limo ops …"
- /wisconsin-limo operator: "Shane Handel. 17 years in limo operations." → "Shane Handel. 14 years in limo operations."
- /wisconsin-limo also carried the same fact written another way. I changed the number only, so the page does not say 14 in one place and 17 in another: meta description + og:description "Built by a 17-year operator." → "Built by a 14-year operator." · section label "// 02 ── BUILT BY A 17-YEAR OPERATOR" → "… 14-YEAR OPERATOR" · stat "17" (data-target 17) → "14" (data-target 14). That goes past the literal "17 years" string. To undo just those four: put the 17 back in wisconsin-limo/index.html lines 13, 18, 264, 278.
- The AVA llms.txt never quoted "17 years". The CSS comment v1 found ("17 YEARS IN CHAUFFEURED", chauffeur/assets/aic.css:1535) sits in a file this run did not touch, so it is unchanged.

## 2C · every line, before → after (aivoiceagency.ai/ground-transportation)

- `<title>`, og:title, twitter:title: "AI Receptionist for Limo and Black Car Dispatch | 24/7" → "Limo and Black Car AI Phone Agent | AI Voice Agency"
- meta / og / twitter description: "AI receptionist for limo, black car and NEMT dispatch. AVA answers ride calls 24/7, captures trip details, and writes clean reservation records." → "For limousine and black car companies, AI Chauffeur answers the call, quotes your rates and books the trip. $997 a month plus a $997 one-time setup."
- founder line: "// 17 years in limo operations · …" → "// 14 years in limo operations · …"
- "// Works alongside": "Limo Anywhere · GoHighLevel · Flight Data · Zapier" → "Your CRM · your reservation software · flight numbers"
- proof strip: "Never sleeps / Never gets sick / Never quits / Never has a bad day" → "Answers the call / Quotes your rates / Books the trip / Trip sheet to dispatch"
- capability [09] title: "24/7 + Multilingual" → "Every call + Multilingual"
- capability [09] body: "Nights, weekends, holidays, overflow — and switches language mid-call when the caller does. Every shift, every language your corporate accounts need." → "Answers every call, and switches language mid-call when the caller does. Every language your corporate accounts need."
- integrations (7 → 6 pills): "Limo Anywhere · GoHighLevel · Flight Status Feeds · Zapier · Twilio · SIP / BYOC · Google Calendar · Shared Inbox · SMS" → "Your CRM · Your reservation software · Flight numbers · Texts · Inbox · Recording + transcript" (H2 and note unchanged)
- FAQ [02] question (visible + JSON-LD): "Does AVA work alongside Limo Anywhere or other dispatch software?" → "Does AVA work alongside my dispatch software?"
- FAQ [02] answer (visible + JSON-LD): "Yes. AVA pushes captured trip data into the dispatch stack you already run — Limo Anywhere via Zapier, GoHighLevel, shared inbox, or your operator-side queue. Your dispatcher confirms; AVA doesn't dispatch the driver." → "Yes. It connects to CRMs too. We check your reservation software and handle the connection. Your dispatcher confirms; AVA doesn't dispatch the driver."
- pricing label: "// 05 ── PRICING ─ SCOPED TO YOUR DISPATCH DESK" → "// 05 ── PRICING"
- pricing H2: "Custom-built around how your desk works." → "One price. Everything on the list."
- .pricing-trust: "No public fixed price for serious dispatch systems — call volume, integrations, and rate logic decide the build. Every operation gets scoped before work starts. Get a live dispatch call first. Then we'll scope the build." → "For limousine and black car companies, AI Chauffeur is $997 a month plus a $997 one-time setup. Month to month. No contract. Connected and custom work is priced after the setup call. The whole price is on the AI Chauffeur pricing page." (link → https://aichauffeur.ai/pricing/)
- .pricing-grid: four cards (Local Intake Build "By Quote", Dispatch Growth Build "By Quote", Operations Build "Custom Quoted", Enterprise / Network "By Application", each "Scope it →"/"Apply →" to /book in a new tab) → one `.tier` card: AI Chauffeur · $997 a month · $997 one-time setup · Month to month · "Answers the call. Quotes your rates. Books the trip. The trip sheet lands in your CRM, your texts and your inbox, with the recording and the transcript." · "See the full price →" → https://aichauffeur.ai/pricing/ (same tab, `data-event="pricing_click_ground_transportation"`). The old grid is at infra/backups/2026-10-18/ground-transportation-pricing-grid.html.
- operator: "30 years operating, 17 years specifically in transportation." → "… 14 years …" · stat "// Years in limo" 17 → 14 (data-target 14)
- Not words, so noted here: styles.css sets `a{text-decoration:none}` across the site, which made the new in-copy pricing link look like plain text. The page's own `<style>` block now underlines `.pricing-trust a`. No color change, no shared CSS touched. The in-copy link also carries `data-event="aic_link_pricing_ground_transportation"`.

**Footer tag (2C.9), tools/stamp.py FOOTER → 64 registered AVA pages:** "The AI receptionist for local service businesses. Answers in one ring. Books the job." → "Any voice. Any business. Answers every call. Books the job." Only the marker region changed, one line per page, with no `?v=` churn. A full stamp run in a temp copy matched 64/64 pages. Three unregistered files keep the old tag, just as v1 left them: legacy/index-3am-2026-10-01.html, legacy/index-funnel-v2-2026-07-14.html, staging/xray.html.

**Old examples (2C.10):** neither page is in a sitemap or linked from a live nav, footer or page. legacy/index-funnel-v2-2026-07-14.html gets `<meta name="robots" content="noindex">` (it served 200 with no robots tag). chatgpt-example/index.html already carried `noindex, nofollow`, so it is unchanged.

## 3B · before → after (index.html)

- hero sub: "Play a sample call. The job ticket fills in while AVA is still on the phone." → "Call AVA live, or play a sample call. The job ticket fills in while AVA is still on the phone."
- micro line: "Tap to play · About a minute · No form" → "Tap to call · AVA answers live · No form"
- llms.txt line 28: "Play a sample call. The job ticket fills in while AVA is still on the phone. Sample calls: …" → "Call AVA live, or play a sample call. The job ticket fills in while AVA is still on the phone. Sample calls: …"; "Last reviewed" → 2026-10-18. No JSON-LD quoted either line.
- The v1.1 button swap was already live (3B.1), so it was not touched.

## 3C · new answer URLs

- https://aichauffeur.ai/answers/can-it-handle-airport-pickups-with-flight-numbers/ (AEO #11, 357 words)
- https://aivoiceagency.ai/answers/can-ava-send-an-emergency-call-to-my-cell/ (AVA #7, 392 words; H1 is the brick's question "Can it send an emergency call to my cell?")

## 4 · IndexNow

- Deploy-hook runs after the last deploy: exec 15162 → aivoiceagency.ai 200, aichauffeur.ai 200 · exec 15163 → aivoiceagency.ai 200 (68 URLs), aichauffeur.ai 200 (32 URLs).
- Exec 15163 read a cached aivoiceagency.ai sitemap that did not list the new AVA answer page yet, so the four new and changed answer URLs were pinged by hand: `node scripts/indexnow-ping.mjs --urls=…` → aivoiceagency.ai 200, aichauffeur.ai 200.

## IDs and rollback

| Checkpoint | Commit | aivoiceagency deployment | aichauffeur deployment | One-line rollback |
|---|---|---|---|---|
| before this run | 80ebaac | dpl_8GGBg2WD82bH87cha4BzgCzBf7be | dpl_AvbUSkv9Vt4LBWXwtCdqGvdi8Zr7 | promote these two to undo every page change |
| 2B | 0cab4cd | dpl_2t8wb75wkpPg3JULDWh1R2ybfaMs | dpl_B6hw8T6QDGBbkRdN6tpCaaXtyF2e | `git revert 0cab4cd` |
| 2C | 911fa45 · 206f436 (backup) | dpl_J9cHHtcJAW92DpLHddchE2WdtTGr | dpl_7DhLMCLVtmj9gqcvkXiT2jwvNzsT | `git revert 206f436 911fa45`, or promote the 2B pair |
| 3B | 546f05d | dpl_CdVXiVqX59NfecKmjMDeLtonTx3K | dpl_9GZx5w5DpQZSk5ufVZhMcrngstuh | `git revert 546f05d`, or promote the 2C pair |
| 3C | 0e5cfed | dpl_G4wEGKau9jWoJ4ZYUxvgLsrEZVcn | dpl_MXYFjubjWyn6ffNkhMWkq378j25U | `git revert 0e5cfed`, or promote the 3B pair |

Nothing changed on 414-775-0019, 414-240-8930, the pool lines, any Retell agent, or any n8n workflow. n8n was read only.

## NEEDS WORDS

1. aichauffeur.ai/terms/ (chauffeur/terms/index.html:226): "Every build is custom. Your scope, your fees and your billing dates are set in a written agreement before work begins. Nothing on this website is a price or an offer." This contradicts /pricing/, and it is the one 2B.5 grep hit left on production.
2. aivoiceagency.ai/ground-transportation operator paragraph: "Used Limo Anywhere and FastTrack daily." This is the one 2C.11 hit. /wisconsin-limo has the same idea: "Ran Limo Anywhere and FastTrack daily."
3. aichauffeur.ai/how-setup-works/: kept as the paste ordered, but these read against the canon. The rest of the step paragraph says "AI Chauffeur does not text or email the passenger." while the canon says the caller gets a text. It also says "Direct write-back into your dispatch software is a per-account option…". The FAQ "Does AI Chauffeur put the trip into my system for me?" answers "Not by default. AI Chauffeur captures the trip… does not text the passenger…".
4. aivoiceagency.ai/overview body copy still says "Answers in one ring, any hour" and "Reservations and inquiries answered in one ring." Outside this run's scope; the footer tag on that page is the new line.

## Readback mirror

```
===== SHANE READBACK — COPY ALL =====
RUN INCOMPLETE — WHAT: aichauffeur.ai/terms/ still says "Every build is custom." (2B.5 grep = 1, not 0) / WHY: legal copy, no words in the paste / NEXT: send the new line for terms §226.
RUN INCOMPLETE — WHAT: /ground-transportation still says "Used Limo Anywhere and FastTrack daily." (2C.11 "Limo Anywhere" = 1, not 0) / WHY: the paste only gives words for "17 years" in that sentence / NEXT: send the new operator sentence.

PLAIN ENGLISH
Both sites now tell one story. AI Chauffeur's setup page and homepage say $997 a month plus $997 setup,
with no "no price list" left. The AVA transportation page dropped the four "By Quote" boxes for one
$997 AI Chauffeur card, dropped the software names and "24/7", and says 14 years. Every AVA page footer
now reads "Any voice. Any business. Answers every call. Books the job." The AVA hero now invites the
live call first. Two new answer pages are live, and Bing got pinged. Two sentences still need your words.

DONE
| Part | Files changed | Verified by | Live |
|---|---|---|---|
| 0 | none | curl both v1.1 answers → 200/200; CALL AVA LIVE first on / | yes |
| 2B | chauffeur/how-setup-works · chauffeur/index · chauffeur/llms.txt · ground-transportation (2 lines) · wisconsin-limo | prod grep of 6 strings on 31 AIC pages → 0 except /terms/ 1 · llms.txt 0 · "17 years" 0 + 0 · validate_jsonld 0 errors · truth_audit 0 new · llms-verify --live GREEN x2 · Playwright 390/1440 clean | yes (1 line open) |
| 2C | ground-transportation · tools/stamp.py · 64 AVA footers · legacy funnel-v2 noindex · infra backup | served-page grep: 7 strings 0, "Limo Anywhere" 1 · footer tag on 64/68 sitemap pages (4 have no shared footer) · temp stamp run 64/64 match · Playwright 390/1440 clean, one $997 card · validate_jsonld 0 · llms GREEN | yes (1 line open) |
| 3B | index.html · llms.txt | Playwright on prod 390/1440: CALL AVA LIVE first, both in fold, 0 errors, sample still plays · llms GREEN | yes |
| 3C | 2 answer pages · 2 indexes · sitemaps · llms.txt · bricks/built | brick --dry 2/2 then --all 2/2 · both URLs 200 + H1 · listed first on both indexes · validate_jsonld 106 pages 0 errors · llms GREEN | yes |
| 4 | none | n8n exec 15162 + 15163: 200 / 200 · hand ping of 4 URLs: 200 / 200 | yes |
| 5 | hq/board.json · reports/2026-10-18-aeo-sunday-v1.md | 2 items + 1 log entry, JSON parses | yes |

(a) Every line before → after: reports/2026-10-18-aeo-sunday-v1.md, sections 2B, 2C and 3B (about 45 lines: AIC cost section + FAQ, AIC homepage 5 lines, 2 llms.txt lines, 17→14 on two AVA pages, 16 ground-transportation swaps, footer tag, 2 hero lines).
(b) IndexNow: aivoiceagency.ai 200, aichauffeur.ai 200 (deploy hook and hand ping).
(c) https://aichauffeur.ai/answers/can-it-handle-airport-pickups-with-flight-numbers/ · https://aivoiceagency.ai/answers/can-ava-send-an-emergency-call-to-my-cell/
(d) NEEDS WORDS: terms §226 · ground-transportation "Used Limo Anywhere and FastTrack daily." (wisconsin-limo has "Ran Limo Anywhere…") · how-setup-works "does not text or email the passenger" + its FAQ "Not by default…" · /overview "Answers in one ring, any hour".

IDS / ROLLBACK
before 80ebaac · AVA dpl_8GGBg2WD82bH87cha4BzgCzBf7be · AIC dpl_AvbUSkv9Vt4LBWXwtCdqGvdi8Zr7 → promote both to undo all pages
2B 0cab4cd · dpl_2t8wb75wkpPg3JULDWh1R2ybfaMs · dpl_B6hw8T6QDGBbkRdN6tpCaaXtyF2e → git revert 0cab4cd
2C 911fa45 + 206f436 · dpl_J9cHHtcJAW92DpLHddchE2WdtTGr · dpl_7DhLMCLVtmj9gqcvkXiT2jwvNzsT → git revert 206f436 911fa45
3B 546f05d · dpl_CdVXiVqX59NfecKmjMDeLtonTx3K · dpl_9GZx5w5DpQZSk5ufVZhMcrngstuh → git revert 546f05d
3C 0e5cfed · dpl_G4wEGKau9jWoJ4ZYUxvgLsrEZVcn · dpl_MXYFjubjWyn6ffNkhMWkq378j25U → git revert 0e5cfed

NEXT
1. Send words for the two open lines (terms §226, the Limo Anywhere operator sentence).
2. Decide on the how-setup-works "does not text the passenger" lines.

GOTCHAS
- wisconsin-limo also said "17-year operator" (x3) and showed a stat 17. I changed those numbers to 14 so the page doesn't say 14 in one spot and 17 in another. That goes past the literal "17 years" string. To undo, put 17 back at lines 13, 18, 264 and 278.
- styles.css strips link underlines site-wide, so the new pricing link looked like plain text. The page's own <style> now underlines it. No shared CSS changed.
- The deploy hook raced the CDN: run 15163 read an AVA sitemap that didn't list the new page yet. The hand ping covered it.
- The fact sheet claude/FACT-SHEET-v1-2026-10-17.md is not on this machine. Every word came from the paste.
- Five pushes this hour (17:42 → board), so the hourly cap is used up.
```
