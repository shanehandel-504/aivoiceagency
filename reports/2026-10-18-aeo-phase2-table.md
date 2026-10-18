# AEO phase 2 table · aivoiceagency.ai · Oct 18 2026

Read-only. Nothing was changed, deployed or redirected. Nothing moves until Shane approves this table.

- **Data:** Google Search Console, sc-domain:aivoiceagency.ai, Jul 19 to Oct 16 2026 (90 days, the newest data Google has). The site total is 41 clicks and 16.4K impressions. Numbers are for the apex URL in the sitemap. "Top query" is the query with the most impressions; Google hides the queries on small pages.
- **Outside links:** the Search Console Links report shows 5 outside links, all to the homepage. No other page has one.
- **Rows:** all 69 URLs in sitemap.xml at HEAD 96902f4.
- **Count:** keep 48 · merge 2 · noindex 12 · fact fix 2 · match 5
- **Rules applied:** a general page beats a city page that competes for the same search. With no general page (roofing, dental), the strongest city page stays. A page with any click in 90 days, or any outside link, stays. Noindex is only for dead weight (see D1). Merges are 301s with a backup in infra/backups/.

| URL | Google impressions (90 days) | Clicks | Top query | Action | Proposed title | Proposed first paragraph | Fact fixes |
|---|---:|---:|---|---|---|---|---|
| / | 5,028 | 10 | ai voice agent (1,834) | keep (homepage, frozen; the only page with outside links, 5 of them) |  |  |  |
| /live | 145 | 10 | ava call (3) | keep |  |  |  |
| /backstage/ | 22 | 0 | ai receptionist for hvac in madison (3) | keep |  |  |  |
| /ground-transportation | 221 | 6 | ai receptionist for taxi services (30) | keep (stays on AVA; its fact fixes are in the AEO Sunday paste, left out here) |  |  |  |
| /professional-services | 27 | 0 | ai voice intake agent for mckinney tx practices (1) | keep |  |  |  |
| /home-services | 274 | 0 | ai receptionist for hvac in bend (19) | keep (also targets home service companies, like /24-hour-answering-service; see D5) |  |  |  |
| /medical-practices | 162 | 0 | ai receptionist for pharmacies (9) | keep |  |  |  |
| /hospitality | 409 | 1 | ai receptionist for catering services (71) | keep |  |  |  |
| /milwaukee | 380 | 0 | milwaukee answering service (105) | keep |  |  |  |
| /madison | 309 | 0 | madison answering service (95) | keep |  |  |  |
| /green-bay | 160 | 0 | ai receptionist for hvac in green bay (34) | keep |  |  |  |
| /wisconsin-limo | 156 | 2 | ai answering service for transportation (23) | fact fix |  |  | 1. 17 years to 14: done, live in 0cab4cd (checked on the live page Oct 18)<br>2. L12+17+24 title, og:title, twitter:title "AI Dispatcher for Wisconsin Limo Operators \| AVA" to "AI Phone Agent for Wisconsin Limo Operators \| AVA"<br>3. L65 page data name "AI Dispatcher for Wisconsin limo operators — built by one." to "AI phone agent for Wisconsin limo operators, built by one."<br>4. L207 H1 "AI Dispatcher" to "AI Phone Agent" and "limo operators —" to "limo operators,"<br>5. L219 "Works Alongside" value "Limo Anywhere · FASTTRAK · Livery Coach" to "Your dispatch software"<br>6. L269 "Ran Limo Anywhere and FastTrack daily." to "Ran dispatch daily."<br>7. L81+314 FAQ question (page data + visible) to "Does AVA work with my dispatch software?"<br>8. L84+315 FAQ answer (page data + visible) to "Yes. AI Chauffeur, AVA's limo product, takes the trip request, reads it back and sends dispatch the trip sheet with the recording and transcript." Visible copy links "AI Chauffeur" to https://aichauffeur.ai/ (the one link); see D8<br>9. "24/7": none on this page. "By Quote": none on this page |
| /watch | 414 | 1 | call ava (170) | keep |  |  |  |
| /lsa/ | 52 | 0 | google lsa phone response score (12) | keep (frozen as authored) |  |  |  |
| /overview | 281 | 4 | aeva ai receptionist (19) | keep |  |  |  |
| /book | 119 | 0 | ai services green bay (35) | keep |  |  |  |
| /roi | 198 | 0 | ai answering service roi (34) | keep |  |  |  |
| /deck | 68 | 0 | ava calling (3) | keep |  |  |  |
| /milwaukee-hvac | 1,814 | 0 | hvac answering service (613) | merge into /hvac-answering-service with a 301 (top search is the general one that /hvac-answering-service serves; 0 clicks, 0 outside links) |  |  |  |
| /milwaukee-plumbing | 93 | 0 | who to call for a burst pipe emergency in milwaukee (30) | keep (local searches only, does not compete with the general page; see D4) |  |  |  |
| /milwaukee-electrical | 444 | 0 | answering service for electricians (120) | merge into /electrician-answering-service with a 301 (top search is the general one that /electrician-answering-service serves; 0 clicks, 0 outside links) |  |  |  |
| /milwaukee-dental | 141 | 0 | milwaukee phone answering solutions (34) | keep (strongest dental page, since there is no general dental page; see D3) |  |  |  |
| /milwaukee-roofing | 695 | 0 | roofing answering service (523) | match rewrite | Roofing Answering Service in Milwaukee \| AVA | AVA is a roofing answering service that answers every call, even the morning after a hail storm, and books the job. Every job lands in your CRM, your texts and your inbox. |  |
| /madison-hvac | 19 | 0 | ai receptionist for hvac in madison (16) | keep (local search only, does not compete with the general page) |  |  |  |
| /madison-plumbing | 86 | 0 | frozen pipes experts in mukwonago (32) | keep (homeowner searches; see D4) |  |  |  |
| /madison-electrical | 52 | 0 | madison answering service (43) | keep (competes with /madison, not the general page; see D3) |  |  |  |
| /madison-dental | 94 | 0 | madison answering service (78) | keep (competes with /madison, not the general page; see D3) |  |  |  |
| /madison-roofing | 9 | 0 | hidden by Google | noindex (dead weight: under 10 impressions, 0 clicks, 0 outside links; see D1, D2) |  |  |  |
| /west-bend-hvac | 17 | 0 | hidden by Google | keep (just above the dead line; see D1) |  |  |  |
| /west-bend-plumbing | 191 | 0 | plumber west bend (73) | keep (homeowner searches; see D4) |  |  |  |
| /west-bend-electrical | 43 | 0 | generator service west bend wi (31) | keep (homeowner searches; see D4) |  |  |  |
| /west-bend-dental | 22 | 0 | hidden by Google | keep (just above the dead line; see D1) |  |  |  |
| /west-bend-roofing | 16 | 0 | hail damage roofing contractor washington county wi (6) | keep (homeowner searches; see D4) |  |  |  |
| /blog | 15 | 0 | hidden by Google | keep |  |  |  |
| /methodology.html | 3 | 0 | hidden by Google | keep (dead by the numbers, kept; see D6) |  |  |  |
| /blog/wisconsin-limo-crush | 3 | 0 | hidden by Google | fact fix |  |  | 1. "17 years": none on this page<br>2. L185 H2 "What an AI dispatcher actually does at 4:47 PM" to "What an AI phone agent actually does at 4:47 PM"<br>3. L189 cut " — Limo Anywhere, FASTTRAK, Livery Coach, whatever you run" so the sentence ends "writes the trip to your dispatch software."<br>4. after L191 add one sentence: "AVA's limo product is AI Chauffeur." with "AI Chauffeur" linked to https://aichauffeur.ai/ (the one link)<br>5. "24/7": none on this page. "By Quote": none on this page |
| /blog/home-services-30-percent-missed | 127 | 1 | missed calls home service business (5) | keep |  |  |  |
| /guides/furnace-short-cycling.html | 270 | 0 | furnace turns on then shuts off (18) | keep |  |  |  |
| /guides/ac-running-but-not-cooling.html | 11 | 0 | ac unit not cooling house (2) | keep |  |  |  |
| /blog/what-happens-when-you-call-ava | 238 | 0 | call ava (85) | keep |  |  |  |
| /videos | 15 | 0 | ava ai demo (9) | keep |  |  |  |
| /privacy | 43 | 3 | aivo agency (1) | keep |  |  |  |
| /terms.html | 28 | 0 | hidden by Google | keep |  |  |  |
| /sms-policy.html | 44 | 2 | ava sms (3) | keep |  |  |  |
| /west-bend | 4 | 0 | south bend answering service (4) | noindex (dead weight: under 10 impressions, 0 clicks, 0 outside links; see D1, D2) |  |  |  |
| /waukesha | 3 | 0 | ai phone answering service for trades (1) | noindex (dead weight: under 10 impressions, 0 clicks, 0 outside links; see D1, D2) |  |  |  |
| /green-bay-hvac | 1 | 0 | hidden by Google | noindex (dead weight: under 10 impressions, 0 clicks, 0 outside links; see D1, D2) |  |  |  |
| /green-bay-plumbing | 0 | 0 | none (0 impressions) | noindex (dead weight: under 10 impressions, 0 clicks, 0 outside links; see D1, D2) |  |  |  |
| /green-bay-electrical | 0 | 0 | none (0 impressions) | noindex (dead weight: under 10 impressions, 0 clicks, 0 outside links; see D1, D2) |  |  |  |
| /green-bay-dental | 3 | 0 | green bay answering service (1) | noindex (dead weight: under 10 impressions, 0 clicks, 0 outside links; see D1, D2) |  |  |  |
| /green-bay-roofing | 0 | 0 | none (0 impressions) | noindex (dead weight: under 10 impressions, 0 clicks, 0 outside links; see D1, D2) |  |  |  |
| /waukesha-hvac | 1 | 0 | hidden by Google | noindex (dead weight: under 10 impressions, 0 clicks, 0 outside links; see D1, D2) |  |  |  |
| /waukesha-plumbing | 0 | 0 | none (0 impressions) | noindex (dead weight: under 10 impressions, 0 clicks, 0 outside links; see D1, D2) |  |  |  |
| /waukesha-electrical | 2 | 0 | hidden by Google | noindex (dead weight: under 10 impressions, 0 clicks, 0 outside links; see D1, D2) |  |  |  |
| /waukesha-dental | 17 | 0 | dental after hours answering service (4) | keep (the only page that gets general dental searches; see D1) |  |  |  |
| /waukesha-roofing | 0 | 0 | none (0 impressions) | noindex (dead weight: under 10 impressions, 0 clicks, 0 outside links; see D1, D2) |  |  |  |
| /plumber-answering-service | 1,408 | 1 | answering service for plumbers (380) | match rewrite | Answering Service for Plumbers That Books the Job \| AVA | AVA is an answering service for plumbers that answers every call, quotes your rates and books the job. Every job lands in your CRM, your texts and your inbox. |  |
| /hvac-answering-service | 1,496 | 0 | hvac answering service (217) | match rewrite | HVAC Answering Service That Books the Job \| AVA | AVA is an HVAC answering service that answers every call, knows your business and books the job. Every job lands in your CRM, your texts and your inbox. |  |
| /electrician-answering-service | 1,113 | 0 | electrician answering service (301) | match rewrite | Electrician Answering Service That Books the Job \| AVA | AVA is an electrician answering service that answers every call, knows your business and books the job. Every job lands in your CRM, your texts and your inbox. |  |
| /24-hour-answering-service | 344 | 0 | 24 hour answering service companies (48) | match rewrite | 24 Hour Answering Service for Home Service Companies \| AVA | AVA is a 24 hour answering service for home service companies that answers every call, day or night, and books the job. Every job lands in your CRM, your texts and your inbox. |  |
| /pricing | 0 | 0 | none yet (live since Oct 17) | keep (live since Oct 17, no data yet) |  |  |  |
| /answers/can-it-book-appointments-on-my-calendar/ | 0 | 0 | none yet (live since Oct 17) | keep (live since Oct 17, no data yet) |  |  |  |
| /answers/does-it-answer-the-phone-at-3-am/ | 0 | 0 | none yet (live since Oct 17) | keep (live since Oct 17, no data yet) |  |  |  |
| /answers/does-it-work-with-my-scheduling-software/ | 0 | 0 | none yet (live since Oct 17) | keep (live since Oct 17, no data yet) |  |  |  |
| /answers/does-the-caller-get-a-text/ | 0 | 0 | none yet (live since Oct 17) | keep (live since Oct 17, no data yet) |  |  |  |
| /answers/what-does-the-owner-get-after-a-call/ | 0 | 0 | none yet (live since Oct 17) | keep (live since Oct 17, no data yet) |  |  |  |
| /answers/what-happens-when-a-caller-asks-for-a-price/ | 0 | 0 | none yet (live since Oct 17) | keep (live since Oct 17, no data yet) |  |  |  |
| /answers/ | 0 | 0 | none yet (live since Oct 17) | keep (live since Oct 17, no data yet) |  |  |  |
| /answers/can-ava-send-an-emergency-call-to-my-cell/ | 0 | 0 | none yet (live since Oct 18) | keep (live since Oct 18, no data yet) |  |  |  |

Line numbers in the fact fixes are from HEAD. Every proposed title is 60 characters or fewer, and every proposed first paragraph is two sentences. Both passed the word ban check.

## Five AVA citation questions (draft, Mondays only)

For Shane's word-for-word approval. After approval, Claude in the ops chat adds them to the AI citation check as a new Task ID. No scheduled task was edited here.

1. **MISSED CALLS:** I run a small plumbing company and we miss calls when we're all out on jobs. Is there an AI that can answer the phone and book the job for us?
2. **AFTER-HOURS:** What's the best way for an HVAC company to handle phone calls after hours and on weekends without paying someone to sit by the phone?
3. **SCHEDULING SOFTWARE:** Can an AI answering service put the job straight into my scheduling software, or does someone in my office still have to type it in?
4. **PRICE:** How much does an AI answering service cost for a small HVAC company? I want the monthly price.
5. **WORTH IT:** Is an AI answering service worth it for a plumbing company with five trucks, or should I just hire someone to answer the phones?

Scoring is the same as the limo set:

- **Brand mention:** the answer names AI Voice Agency, or AVA tied to aivoiceagency.ai.
- **Website citation:** the answer links aivoiceagency.ai.
- **Price check (question 4):** right is "AVA starts at $497 a month". Any other price we're given is noted as wrong.

## DECISIONS FOR SHANE

Questions I would have asked. Each shows the safer pick, and that pick is what the table uses.

- **D1.** Where is the line for dead weight? **Pick:** Under 10 Google impressions in 90 days, with 0 clicks and 0 outside links. Pages from 10 to 22 impressions (/west-bend-hvac, /west-bend-dental, /waukesha-dental, /west-bend-roofing, /madison-hvac) stay.
- **D2.** Dead city trade pages: noindex, or a 301 into the surviving page for that trade? **Pick:** Noindex (rule 7 reads literally: they show no competing searches, so rule 2 does not apply). Switching any row to a 301 is a one-line change.
- **D3.** City trade pages that compete with their own city page, not with a general page (/madison-electrical and /madison-dental on "madison answering service", /milwaukee-dental on "milwaukee answering service"): merge into /madison or /milwaukee? **Pick:** Keep. Rule 2 only covers general trade pages.
- **D4.** City pages that draw homeowners, not business owners ("plumber west bend", "generator service west bend wi", "frozen pipes experts in mukwonago", "who to call for a burst pipe emergency in milwaukee", hail damage roofing searches): retitle toward owners? **Pick:** Keep. No words changed.
- **D5.** /home-services and /24-hour-answering-service both target home service companies. Merge? **Pick:** Keep both. Only /24-hour-answering-service gets the match rewrite.
- **D6.** /methodology.html has 3 impressions (dead by D1), but it is the page that explains the $126K missed-call figure. Noindex? **Pick:** Keep. Separately, $126K is not in the sourced set in CLAUDE.md § 4; worth a check against the fact sheet.
- **D7.** /blog/wisconsin-limo-crush has 3 impressions (dead by D1). Noindex? **Pick:** Keep, per answer 3. Fact fixes only.
- **D8.** /wisconsin-limo FAQ: keep the old "pushes trips into your dispatch software in real time" claim with the names cut out, or replace it? **Pick:** Replace it with the AI Chauffeur listing facts (takes the trip request, reads it back, sends dispatch the trip sheet with the recording and transcript). That is where the one aichauffeur.ai link goes.
- **D9.** /wisconsin-limo "Works Alongside" box is empty once the software names go. Remove the box or put in new words? **Pick:** Put in "Your dispatch software" (no layout change).
- **D10.** "AI Dispatcher" becomes what? **Pick:** "AI Phone Agent" (the WORDS rule).
- **D11.** /milwaukee-roofing title: keep "Milwaukee"? **Pick:** Keep it: "Roofing Answering Service in Milwaukee | AVA". The query words lead, and the page stays local to match its address.
- **D12.** /24-hour-answering-service title and paragraph use "24 hour". The ban is "24/7". Allowed? **Pick:** Yes. "24 hour" is the top query's own words and the page address. "24/7" is not used.
- **D13.** The blog post still says "confirms the pickup time" and "a confirmed trip" (L189). CLAUDE.md bans "confirmed" in claims about AVA. Fix it now? **Pick:** No, it is not on answer 3's list. Flagged only.
- **D14.** Other pages still have "AI Receptionist" or "24/7" in their titles (homepage, /home-services, /hospitality and others). Fix them? **Pick:** No. Out of scope this phase, and the homepage is frozen.
- **D15.** The /milwaukee-hvac and /milwaukee-electrical merges: the shared footer (tools/stamp.py L126 and L128) links both pages from almost every page on the site. How do they ship? **Pick:** When approved, change the footer link in tools/stamp.py (not inline), re-stamp, drop both pages from sitemap.xml and the stamp.py PAGES list, and back them up in infra/backups/ before adding the 301s. Expect HVAC and electrical impressions to dip for a few weeks while Google moves them over.
