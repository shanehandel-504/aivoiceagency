# AEO phase 2 apply v1.1 · Oct 19 2026

Paste: PASTE-CC-PHASE2-APPLY v1.1. Source table: reports/2026-10-18-aeo-phase2-table.md (6c374fc). Run Mon Oct 19 2026, first push 2:07 PM CT.

## What happened, in plain English

- Five AVA trade pages now have titles and opening lines in the words people search with.
- The two AVA limo pages stop saying AVA pushes trips into dispatch software in real time. They now say AI Chauffeur works beside Limo Anywhere, FASTTRAK and Livery Coach and sends dispatch the trip sheet. The software names stayed.
- The five sentences left open on Sunday got their words: FASTTRAK spelled right on the transportation page, the AI Chauffeur terms show the $997 price, the setup page says the caller gets a text, the setup FAQ points to the integrations page, and the AVA overview heading reads "Answers every call".
- Twelve dead AVA city pages are hidden from Google (noindex) and left the sitemap. They still work and are still linked.
- The Milwaukee HVAC and Milwaukee electrical pages now send visitors and Google to the general HVAC and electrician pages with a 301. Both old pages are backed up.
- The AI Chauffeur homepage names Limo Anywhere and FASTTRAK in its first paragraph.
- The setup-call reminder workflow now retries the Cal.com read up to 3 times, 5 seconds apart, so one slow answer no longer pages the owner.

## DONE

| Part | Files changed | Verified by (exact command and result) | Live |
|---|---|---|---|
| 0 · Check | none | `git fetch` → 0 ahead / 0 behind; HEAD 6c374fc contains 96902f4. 12 tracked files modified since 2026-09-28 18:01 (audits/aic-try/*.png, audits/run10/run10-gate.json, config-snapshots/2026-08-18-ava-seal/gate-result.json): stale gate output, not another session's work; never staged | n/a |
| 1 · Match (8324d24) | plumber-answering-service, hvac-answering-service, electrician-answering-service, 24-hour-answering-service, milwaukee-roofing (index.html each) · sitemap.xml (hook) | `checkpoint.mjs` on prod: each page 200, new title x3 (title + og + twitter), new paragraph visible x1 + JSON-LD x1 · `validate_jsonld.py` 0 errors · `truth_audit.py --page` 0 defects on all 5 · Playwright 390x844 + 1440x900 on prod: no overflow, 0 console errors | yes |
| 2 · Limo facts (7e3b2b5) | wisconsin-limo/index.html · blog/wisconsin-limo-crush/index.html · llms.txt · sitemap.xml | prod grep both pages: AI Dispatcher 0 · AI dispatcher 0 · FastTrack 0 · LimoAnywhere 0 · pushes captured trips 0 · in real time 0 · 17 years 0 · Limo Anywhere 8 and 1 · FASTTRAK 6 and 1 · aichauffeur.ai link 1 each · truth_audit 0 defects both · Playwright prod /wisconsin-limo clean | yes |
| 3 · Open lines (5967e46) | ground-transportation/index.html · chauffeur/terms/index.html · chauffeur/how-setup-works/index.html · overview.html · both sitemaps | prod: /ground-transportation FastTrack 0, Limo Anywhere 1 · all 32 aichauffeur.ai sitemap pages + llms.txt: "Every build is custom" 0, "Nothing on this website is a price" 0, "does not text or email the passenger" 0, "Not by default" 0 · /overview "Answers in one ring" 0 but **"one ring" 1** (see NEEDS WORDS) | yes (1 line open) |
| 4 · Noindex (4b7fb59) | 12 city pages (index.html each) · sitemap.xml | prod: 12/12 answer 200 and carry `<meta name="robots" content="noindex, follow">`, 0 of them in sitemap.xml · `python -c xml.dom.minidom.parse` sitemap OK · validate_jsonld 0 errors | yes |
| 5 · Merge (1e48002) | vercel.json · sitemap.xml · tools/stamp.py · tools/gate-pages.mjs · 66 pages (footer marker region) of which 7 also had an inline card · milwaukee-hvac/index.html + milwaukee-electrical/index.html moved to infra/backups/2026-10-19/ · 2 dated backups | `curl`: /milwaukee-hvac and /milwaukee-hvac/ → 301 /hvac-answering-service; /milwaukee-electrical and /milwaukee-electrical/ → 301 /electrician-answering-service; both targets 200 · 71 served pages scanned (55 sitemap + 12 noindexed + legacy x2 + staging/xray + llms.txt): links to the old paths 0 · temp-copy full `stamp.py` run: 63/63 PAGES footer regions equal, 56 whole pages equal, the other 7 differ only by the inline card hrefs; 32 chauffeur VERSION_ONLY pages differ only by stamp adding `?v=` to the insights script (not taken) | yes |
| 6 · Deploy + ping | none | Playwright prod 390x844 + 1440x900: 5 match pages, /wisconsin-limo, /overview, aichauffeur.ai/how-setup-works/, aichauffeur.ai/ → 18/18 no overflow, 0 console errors · `llms-verify.mjs --live` GREEN both (134/134, 122/122) · IndexNow: see below | yes |
| 8 · AIC home (3ce77b0) | chauffeur/index.html · chauffeur/sitemap.xml | prod: sentence visible x1 (+2 JSON-LD copies of the paragraph) · truth_audit 0 · validate_jsonld 0 · Playwright 390x844 hero no overflow, CTA 615-675 px (above fold) | yes |
| 9 · n8n retry | n8n only | staging TRSFeQqDKW4lGhLu version b719997b, diff = 3 settings on Cal Bookings, dry run exec 15335 success · prod 618G34AR1xQTr3Uf version 2a7be652, diff = the same 3 settings, published, versionId = activeVersionId, Error Sentry SlnAeMrVRORsF0w7 attached and active · timed runs after publish: 15336 (19:25Z) success, 15338 (19:30Z) success | yes |
| 7 · Board + report | hq/board.json · this file | board item aeo-phase2-apply + 1 log line appended at the end; round-trip JSON byte-identical apart from the additions | yes |

## Every line changed, before → after

### PART 1 (title = `<title>`, og:title and twitter:title; paragraph = the `.hero-sub` paragraph after the H1 and the JSON-LD Service description that quoted it)

| Page | Before | After |
|---|---|---|
| /plumber-answering-service title | After-Hours Answering Service for Plumbers \| AI Receptionist 24/7 | Answering Service for Plumbers That Books the Job \| AVA |
| /plumber-answering-service paragraph | A traditional answering service picks up, takes a message, and bills you by the minute, and you still start every callback cold at 6 AM. AVA answers your plumbing line, captures the caller's address and how bad the water is, and routes the intake to your on-call tech. You call back with the whole picture, not a name and a number. | AVA is an answering service for plumbers that answers every call, quotes your rates and books the job. Every job lands in your CRM, your texts and your inbox. |
| /hvac-answering-service title | 24/7 HVAC Answering Service \| AI Receptionist for HVAC Companies | HVAC Answering Service That Books the Job \| AVA |
| /hvac-answering-service paragraph | A traditional answering service takes a message and bills you by the minute while the no-heat call sits in a queue. AVA is an AI voice agent that picks up, gets the address and the symptom, and texts the intake to your on-call tech - so the callback goes out with full context. List Open 24 Hours on Google, and mean it. | AVA is an HVAC answering service that answers every call, knows your business and books the job. Every job lands in your CRM, your texts and your inbox. |
| /electrician-answering-service title | 24/7 Answering Service for Electricians \| AI Receptionist \| AVA | Electrician Answering Service That Books the Job \| AVA |
| /electrician-answering-service paragraph | A traditional answering service takes a message and bills you by the minute to do it. When the caller says the panel is sparking, a note sitting in a queue is not an answer. AVA picks up, runs a safety-first triage, captures the address and the fault, and routes it to your on-call tech so your callback starts with the full picture. | AVA is an electrician answering service that answers every call, knows your business and books the job. Every job lands in your CRM, your texts and your inbox. |
| /24-hour-answering-service title | 24/7 Answering Service for Home Service Companies \| AVA | 24 Hour Answering Service for Home Service Companies \| AVA |
| /24-hour-answering-service paragraph | A traditional 24 hour answering service picks up, writes down a message, and bills you by the minute for it. AVA answers every hour Wisconsin runs, captures the caller's problem and address, and routes it to whoever is on call. You wake up to a real intake, not a sticky note that says call back. | AVA is a 24 hour answering service for home service companies that answers every call, day or night, and books the job. Every job lands in your CRM, your texts and your inbox. |
| /milwaukee-roofing title | Milwaukee Roofing Answering Service (em dash) Built for Hail-Week Call Surges \| AVA | Roofing Answering Service in Milwaukee \| AVA |
| /milwaukee-roofing paragraph | One storm cell over the metro and your phone becomes the most valuable asset your company owns (em dash) for about seventy-two hours. Out-of-state storm outfits answer on the first ring. AVA makes sure the local company does too, from Bay View flats to Oak Creek subdivisions. | AVA is a roofing answering service that answers every call, even the morning after a hail storm, and books the job. Every job lands in your CRM, your texts and your inbox. |

No llms.txt line quoted these titles or paragraphs (llms.txt quotes the H1s, which did not change).

### PART 2

| Where | Before | After |
|---|---|---|
| /wisconsin-limo title, og:title, twitter:title | AI Dispatcher for Wisconsin Limo Operators \| AVA | AI Phone Agent for Wisconsin Limo Operators \| AVA |
| /wisconsin-limo page data name (JSON-LD) | AI Dispatcher for Wisconsin limo operators (em dash) built by one. | AI Phone Agent for Wisconsin limo operators, built by one. |
| /wisconsin-limo H1 | AI Dispatcher · for Wisconsin · limo operators (em dash) · built by one. | AI Phone Agent · for Wisconsin · limo operators, · built by one. |
| llms.txt line 70 (quoted the H1) | AI Dispatcher for Wisconsin limo operators (em dash) built by one. | AI Phone Agent for Wisconsin limo operators, built by one. |
| /wisconsin-limo "Works Alongside" | Limo Anywhere · FASTTRAK · Livery Coach | unchanged (table item 5 cancelled) |
| /wisconsin-limo operator section | Ran Limo Anywhere and FastTrack daily. | Ran Limo Anywhere and FASTTRAK daily. |
| /wisconsin-limo FAQ question (page data + visible) | Does AVA integrate with LimoAnywhere, FASTTRAK, or Livery Coach? | Does AVA integrate with Limo Anywhere, FASTTRAK or Livery Coach? |
| /wisconsin-limo FAQ answer (page data + visible) | Yes. AVA pushes captured trips into your dispatch software in real time (em dash) Limo Anywhere, FASTTRAK, Livery Coach, RideXpert, or whatever you run. | Yes. AI Chauffeur, AVA's limo product, works beside Limo Anywhere, FASTTRAK and Livery Coach. It takes the trip request, reads it back and sends dispatch the trip sheet with the recording and the transcript. Direct write-back into Limo Anywhere switches on after setup verification. ("AI Chauffeur" links to https://aichauffeur.ai/, same tab; the page's one aichauffeur.ai link) |
| /blog/wisconsin-limo-crush H2 | What an AI dispatcher actually does at 4:47 PM | What an AI phone agent actually does at 4:47 PM |
| /blog/wisconsin-limo-crush corporate-confirm sentence | ...and writes the trip to your dispatch software (em dash) Limo Anywhere, FASTTRAK, Livery Coach, whatever you run. | ...and sends dispatch the trip sheet. It works beside Limo Anywhere, FASTTRAK, Livery Coach or whatever you run. |
| /blog/wisconsin-limo-crush, new paragraph after the "new lead" paragraph | (none) | AVA's limo product is AI Chauffeur. ("AI Chauffeur" links to https://aichauffeur.ai/; the page's one aichauffeur.ai link) |

### PART 3

| Where | Before | After |
|---|---|---|
| /ground-transportation operator section | Used Limo Anywhere and FastTrack daily. | Used Limo Anywhere and FASTTRAK daily. |
| aichauffeur.ai/terms/ section 7 | Every build is custom. Your scope, your fees and your billing dates are set in a written agreement before work begins. Nothing on this website is a price or an offer. In general: | AI Chauffeur is $997 a month plus a $997 one-time setup, as shown on the pricing page. Connected and custom work, your scope and your billing dates are set in a written agreement before work begins. In general: ("pricing page" links to /pricing/) |
| aichauffeur.ai/how-setup-works/ "One thing does not change" paragraph | AI Chauffeur does not text or email the passenger. It does not assign a driver or send work out to an affiliate. | The caller gets a text when the trip is booked. AI Chauffeur does not assign a driver or send work out to an affiliate. |
| aichauffeur.ai/how-setup-works/ FAQ "Does AI Chauffeur put the trip into my system for me?" (visible + JSON-LD) | Not by default. AI Chauffeur captures the trip and hands your dispatcher a clean ticket, and on most setups a person enters it. On supported platforms, direct write-back can be configured and tested against your account and switched on after it verifies, and the record is then created for you. AI Chauffeur does not text the passenger or assign a driver, and your dispatcher confirms every trip. That last part does not change once you go live. | The trip sheet lands in your CRM, your texts and your inbox, with the recording and the transcript. Direct write-back into Limo Anywhere switches on after setup verification. The integrations page shows where every other platform stands. ("integrations page" links to /integrations/) |
| /overview heading | Answers in one ring, any hour | Answers every call (sentence under it unchanged) |

No llms.txt line on either host quoted any of these.

### PART 8

| Where | Before | After |
|---|---|---|
| aichauffeur.ai/ first paragraph after the H1 (visible + the two JSON-LD descriptions that quoted it word for word) | Set up for your company, it answers in your company name, takes the whole reservation and quotes from your rate sheet. The trip sheet lands in your CRM, your texts and your inbox. | Set up for your company, it answers in your company name, takes the whole reservation and quotes from your rate sheet. It works beside Limo Anywhere, FASTTRAK and the dispatch software you already run. The trip sheet lands in your CRM, your texts and your inbox. (new sentence in its own `.hb` line, like the other two) |

chauffeur/llms.txt line 5 quotes only the last sentence, which did not change, so it was left alone.

### PART 5 link retargets (hrefs only, no words)

- Footer (stamp.py FOOTER + every BRIDGE:FOOTER region): "HVAC answering" /milwaukee-hvac → /hvac-answering-service · "Electrical answering" /milwaukee-electrical → /electrician-answering-service. 132 hrefs in 66 files: 63 registered pages plus 3 served pages that carry the same footer and are not registered (legacy/index-3am-2026-10-01.html, legacy/index-funnel-v2-2026-07-14.html, staging/xray.html).
- Inline cross-link cards (9 hrefs, 7 pages): /hvac-answering-service, /electrician-answering-service, /24-hour-answering-service, /home-services (2), /milwaukee (2), /milwaukee-plumbing, /milwaukee-roofing.

## The 12 noindexed URLs

https://aivoiceagency.ai/madison-roofing · /west-bend · /waukesha · /green-bay-hvac · /green-bay-plumbing · /green-bay-electrical · /green-bay-dental · /green-bay-roofing · /waukesha-hvac · /waukesha-plumbing · /waukesha-electrical · /waukesha-roofing

Tag added after the viewport meta: `<meta name="robots" content="noindex, follow">`. Nothing else on those pages changed. They stay in tools/stamp.py PAGES (PAGES does not build sitemap.xml), so their nav and footer keep stamping.

## The two 301s

| Old | New | Proof |
|---|---|---|
| https://aivoiceagency.ai/milwaukee-hvac (and trailing slash) | /hvac-answering-service | `curl -I` → `HTTP/1.1 301 Moved Permanently`, `Location: /hvac-answering-service` |
| https://aivoiceagency.ai/milwaukee-electrical (and trailing slash) | /electrician-answering-service | `curl` → 301 to /electrician-answering-service |

vercel.json carries 8 entries (apex and www, with and without the slash), house pattern. www first hops 308 to the apex through the existing catch-all, then 301.
Backups: infra/backups/2026-10-19/milwaukee-hvac.html and milwaukee-electrical.html (dated header + the page unchanged) and the moved sources infra/backups/2026-10-19/milwaukee-hvac/index.html and milwaukee-electrical/index.html (`git mv`, history kept). Nothing deleted.

## Sitemap URL count

| Host | Before | After |
|---|---:|---:|
| aivoiceagency.ai | 69 | 55 (12 noindex + 2 merges out) |
| aichauffeur.ai | 32 | 32 |

`node scripts/stamp-sitemap.mjs --check` → IN SYNC 87/87.

## Deployments (production)

| Commit | aivoiceagency | aichauffeur |
|---|---|---|
| 8324d24 match | dpl_Em37euvxasWdXFSopLejWJ3q3L8F | dpl_C7J85Tc3FbkeeL8GVfKWqryCgJo2 |
| 7e3b2b5 facts | dpl_H4H4LCXUzdSePFQhEndRPPUXPKPp | dpl_FPcEbw3sbXvJMH9X1Ln2NSj9D7CP |
| 5967e46 canon | dpl_DtSg6KBEETmUDjtkkeJu41Yn9Jev | dpl_UnQDYEazdWmkKaYLTb8Hjcjpx79q |
| 4b7fb59 noindex | dpl_CLSihck9HnPx7rpn69TuEaxtGK2X | dpl_9ki98dUQv2RWY5gcYMgxEpr8UgHk |
| 1e48002 + 3ce77b0 merge + AIC home (one push) | dpl_5LNfuYKkYzkU6eSm72NxC88GhJTS | dpl_qqBQXpBR87QCQ7oCmHeJhxcg4oVK |

**Rollback (pre-run, 6c374fc):** aivoiceagency dpl_946JofE77MA8saAHrd7MLaqxudLP · aichauffeur dpl_2L8HSer4vCDLpwy57VQQ8tpXCnea. Per part: `git revert <commit>` and push.

## IndexNow

| Exec | Trigger | aivoiceagency.ai | aichauffeur.ai |
|---|---|---|---|
| 15333 | deploy hook (3ce77b0, aichauffeur) | 200, but 57 URLs: read the sitemap before the merge deploy reached the CDN | not in this run |
| 15334 | deploy hook (3ce77b0, aivoiceagency) | 200, same stale 57 | 200, 32 URLs |
| **15337** | **run by hand after the deploys settled** | **200, 55 URLs (current)** | **200, 32 URLs** |

## PART 9 · n8n setting

| | Before | After |
|---|---|---|
| ZZ STAGING WF-SETUP-CALL-REMINDERS v1.1 (TRSFeQqDKW4lGhLu), node Cal Bookings | Retry On Fail off (version b9acff18) | Retry On Fail ON, Max Tries 3, Wait Between Tries 5000 ms (version b719997b). Version diff: only those 3 fields. Dry run exec 15335: success, Cal.com HTTP 200, 0 bookings in the next 72 h, ended at Collect, nothing posted |
| WF-SETUP-CALL-REMINDERS v1.1 (618G34AR1xQTr3Uf), node Cal Bookings | Retry On Fail off, serving e0855328 | Same 3 settings, serving 2a7be652 (published 19:22Z). Version diff: only those 3 fields. active true, versionId = activeVersionId, Error Sentry attached |

Why: execs 14461 (Oct 15 19:05Z) and 15041 (Oct 18 15:00Z) failed when the Cal.com read timed out once; the next run was clean both times.
Timed production runs after publish: exec 15336 (19:25:00Z) success · exec 15338 (19:30:00Z) success.
Rollback: Retry On Fail OFF on Cal Bookings, or `publish_workflow(618G34AR1xQTr3Uf, e0855328-bea6-470c-aa5b-87db795842f9)`.

## NEEDS WORDS

1. **/overview hospitality card**: "Reservations and inquiries answered in one ring." The 3.6 grep wants "one ring" at 0; it is 1. The paste approved words for the heading only.
2. **/wisconsin-limo hero paragraph + its JSON-LD Service description**: "...AVA picks up every call, captures the trip, pushes it to your dispatch software, and keeps the run..." Still a "pushes" claim about a connection. Not in this paste's list.
3. **Cross-link cards after the merge** (hrefs retargeted, words untouched): on /hvac-answering-service and /electrician-answering-service the "// See it local · City-trade coverage" card now points at its own page (the 301 would have done the same); on /24-hour-answering-service the same card lands on the general HVAC page; on /milwaukee, /home-services, /milwaukee-plumbing and /milwaukee-roofing the "Milwaukee HVAC" / "Milwaukee Electrical" cards land on the general pages. Words, or removal, needed.

## Calls I made where the paste and the facts disagreed

- **2.1 page data name:** the table's item 3 writes "AI phone agent" (lowercase); the paste says "AI Dispatcher" becomes "AI Phone Agent" in the page data name. The paste wins, and the name now matches the H1 word for word (schema truth law).
- **5.4 "permanent: true":** Vercel answers `permanent: true` with a 308, and the paste's own check (5.5) and commit name a 301. I used `"statusCode": 301`, which the repo already uses for /chauffeur. Same permanence.
- **5.5 "0 links":** the footer was not the only place linking the two pages. 9 inline cards and 3 served non-registered pages also linked them; their hrefs were retargeted so the check reads 0.
- **tools/gate-pages.mjs:** its city list and self-check counts moved 25 → 23 and 61 → 59, or the next gate sweep would render two 404s.
- **/wisconsin-limo FAQ link:** styles.css sets `a{text-decoration:none}`, so the new link carries an inline underline to read as a link. The blog link uses the post's existing link style.
- **Order:** PART 8 ran before 6 and 7, and PARTS 5 and 8 shared push 5, because the hourly cap allows 5 pushes and the report must hold everything.

## Gotchas

- aichauffeur.ai/ at 1440x900: the new line pushes the PUSH TO CALL AI button from 807-867 px to 873-933 px, so it now sits on the fold line (27 px showing). 390x844 is fine (615-675). The paste said change nothing else on the homepage, so it was left.
- The deploy hook raced the CDN again: both hook runs submitted the old 57-URL AVA sitemap. The hand run fixed it. After any push that changes a sitemap, read the hook run's URL count.
- llms.txt still lists /west-bend and /waukesha, now noindexed. The verifier is green; the paste did not cover llms.txt entries.
- The pre-commit hook can stamp a lastmod 1 second after the commit's own time (seen twice). Pinning `GIT_COMMITTER_DATE` for the commit removes it; the sitemap is IN SYNC 87/87 now.
- /blog/wisconsin-limo-crush still says "confirms the pickup time" and "a confirmed trip" (table D13, flagged only).
- The 12 stale modified audit files (from 2026-09-28) are still in the working tree, unstaged.

## SHANE READBACK (mirror)

```
===== SHANE READBACK — COPY ALL =====
AEO PHASE 2 APPLY v1.1 · Mon Oct 19 2026 · LIVE on aivoiceagency.ai + aichauffeur.ai

WHAT HAPPENED
- 5 AVA trade pages: new titles + first lines in the words people search.
- /wisconsin-limo + the limo blog post: no more "pushes trips into your dispatch software in real time".
  They now say AI Chauffeur works beside Limo Anywhere, FASTTRAK and Livery Coach. Names kept.
- The 5 open lines from Sunday got your words (FASTTRAK spelling, $997 on the AIC terms,
  caller gets a text, integrations page FAQ, "Answers every call").
- 12 dead city pages: hidden from Google, still working, out of the sitemap.
- /milwaukee-hvac and /milwaukee-electrical now 301 to the general HVAC and electrician pages. Backed up.
- aichauffeur.ai homepage names Limo Anywhere and FASTTRAK.
- The setup-call reminder now retries Cal.com 3 times, 5 seconds apart. No more false alarm texts.

DONE
Part | files changed | verified by | live
1 match      | 5 trade pages | prod: new title x3 + new paragraph on all 5; Playwright 390+1440 clean | yes
2 limo facts | wisconsin-limo, blog post, llms.txt | prod grep: AI Dispatcher/FastTrack/LimoAnywhere/pushes captured trips/in real time/17 years = 0; Limo Anywhere 8+1, FASTTRAK 6+1 | yes
3 open lines | ground-transportation, AIC terms, AIC how-setup-works, overview | 32 AIC pages + llms.txt: retired strings 0; /overview "one ring" still 1 | yes (1 line open)
4 noindex    | 12 city pages, sitemap | prod: 12/12 = 200 + noindex, out of sitemap | yes
5 merge      | vercel.json, sitemap, stamp.py, gate-pages.mjs, 66 footers, 7 cards, 2 backups | curl 301 x4 to the right page, targets 200; 71 served pages scanned, old-path links 0; temp stamp run matches 63/63 footers | yes
6 deploy     | none | Playwright prod 18/18 clean; llms-verify --live GREEN both | yes
8 AIC home   | chauffeur/index.html | prod: sentence x1; 390 hero no overflow | yes
9 n8n        | WF-SETUP-CALL-REMINDERS | staging dry run 15335 ok; prod 2a7be652 live; runs 15336 + 15338 success | yes
7 board      | hq/board.json + this report | item aeo-phase2-apply + log line | yes

IDS + ROLLBACK
- Commits: 8324d24 · 7e3b2b5 · 5967e46 · 4b7fb59 · 1e48002 · 3ce77b0 · board. Undo one part: git revert <commit>, push.
- Pre-run deploys: AVA dpl_946JofE77MA8saAHrd7MLaqxudLP · AIC dpl_2L8HSer4vCDLpwy57VQQ8tpXCnea.
- n8n 618G34AR1xQTr3Uf: serving 2a7be652; rollback = publish e0855328 or Retry On Fail OFF.

ANSWERS
(a) Every line before -> after: reports/2026-10-19-aeo-phase2-apply.md, "Every line changed".
(b) Sitemap: aivoiceagency.ai 69 -> 55 · aichauffeur.ai 32 -> 32.
(c) IndexNow: aivoiceagency.ai 200 (55 URLs) · aichauffeur.ai 200 (32 URLs), exec 15337.
(d) NEEDS WORDS: /overview "Reservations and inquiries answered in one ring." ·
    /wisconsin-limo hero "pushes it to your dispatch software" ·
    the "See it local" and "Milwaukee HVAC/Electrical" cards now land on the general pages (2 on their own page).

NEXT
- Your words for the 3 NEEDS WORDS lines.
- Watch HVAC + electrical impressions: expect a dip for a few weeks while Google moves the two old pages over.

GOTCHAS
- aichauffeur.ai at 1440x900: PUSH TO CALL AI now sits on the fold line (27 px showing). Phone view is fine.
- Redirects use statusCode 301: Vercel's "permanent: true" answers 308, and the paste checks for 301.
- The deploy hook pinged IndexNow with the old sitemap (CDN race); the hand run 15337 sent the right one.
- llms.txt still lists /west-bend and /waukesha (now noindex); verifiers green.
- 12 stale audit files from Sep 28 are still modified in the working tree, never staged.
```
