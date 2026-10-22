# AIC words A · Oct 21 2026

Paste: PASTE-CC-AIC-WORDS-A-v1 (2026-10-21). Base: main e2acf72. Site commit 98f9d02, pushed 7:09 PM CT. Host: aichauffeur.ai (`chauffeur/`) only, plus `CLAUDE.md` (step 10), `hq/board.json` and this report.

## What happened, in plain English

- The homepage now opens with "THE AI RESERVATION DESK FOR LIMOUSINE AND BLACK CAR COMPANIES". It fits on two lines on a 390 px phone, so the short version was not needed.
- The paragraph under the hero is Shane's entity block: it says AI Chauffeur is the AI reservation desk, quotes from the rate sheet, books the reservation, writes the booking into the reservation software, sends changes and cancellations to dispatch, does not dispatch, and that flight tracking and more languages are add-ons.
- "CRM" is gone from every page except Terms and Privacy. It now says "reservation software": 143 uses on 17 pages, plus `llms.txt` and `llms-full.txt`. The ten software names did not change.
- "$99 bot" is down to one use per page. "A $99 bot takes a message" now reads "An answering service takes a message."
- The trip sheet says flight tracking is an add-on that watches the flight for dispatch. The steps heading reads "Four steps. One complete trip sheet." The pricing question reads "How much does AI Chauffeur cost?"
- Every page except /try/ now tells search engines it may be listed with a full snippet and large image preview. /try/ keeps its noindex.
- Prices, phone numbers, button labels, recordings, transcripts, calendar embeds and IDs did not change.

## DONE

| Step | Before (main e2acf72) | After (98f9d02) | Live check (aichauffeur.ai) |
|---|---|---|---|
| 1 Kicker | `FOR LIMOUSINE AND BLACK CAR COMPANIES` | `THE AI RESERVATION DESK FOR LIMOUSINE AND BLACK CAR COMPANIES` · 2 lines at 390, 1 at 1440 (long version kept) | ✓ served on / |
| 2 Entity block | `It takes the whole trip like your best dispatcher — flight number, meet and greet, passengers, bags, child seats, gate codes. It quotes your rates. It reads the trip back and books it.` | The entity block, verbatim from the paste | ✓ served on /; 8 lines at 1440. Hidden under 768 px by an existing rule (gotcha 1) |
| 3 CRM | grep 141 lines · 143 uses on 17 pages + 2 llms files | grep **0** lines · 0 uses | ✓ 0 on all 33 live pages (Terms/Privacy excluded) + llms files + `aic-calls.js` |
| 4 $99 line | / 3 visible · /pricing/ 2 · llms-full 3 · llms 1 | / 1 · /pricing/ 1 · llms-full 1 · llms 1 | ✓ live: `{'/': 1, '/pricing/': 1}` |
| 5 Heading | `Four stages. <em>One clean record.</em>` | `Four steps. <em>One complete trip sheet.</em>` · "Not a chatbot." kept | ✓ |
| 6 Trip-sheet card | `<dd>On, pickup moves with it</dd>` | `<dd>Add-on · watches the flight for dispatch</dd>` (HTML + `aic-calls.js`) · flight FAQ answer unchanged | ✓ rendered card reads the add-on at 320/390/1440 |
| 7 FAQ question | `What about pricing?` (/ only; /pricing/ has no such question) | `How much does AI Chauffeur cost?` · JSON-LD regenerated | ✓ visible + JSON-LD |
| 8 Robots | 0 pages with a robots meta (only /try/ noindex) | 33 pages with `index,follow,max-snippet:-1,max-image-preview:large` right after the viewport meta · /try/ unchanged | ✓ 33/33 sitemap pages · /try/ noindex only |
| 9 llms | description line = "AI Chauffeur answers the phone for limousine and black car companies. …" · CRM 2 + 7 | entity block in both files · CRM 0 · price figures unchanged | ✓ served llms.txt + llms-full.txt carry the block · llms-verify GREEN 124/124 |
| 10 CLAUDE.md | — | bullet under the router: PASTE files live at `C:\Users\offic\Desktop\PASTE\` | n/a (repo file) |

## Step 3: CRM count per page

Counts are uses of `\bCRMs?\b`, including meta, JSON-LD and comments.

| File | Before | After |
|---|---|---|
| `after-hours-limo-dispatch/index.html` | 2 | 0 |
| `answers/can-it-handle-airport-pickups-with-flight-numbers/index.html` | 1 | 0 |
| `answers/does-it-work-with-my-booking-software/index.html` | 6 | 0 |
| `answers/what-does-dispatch-actually-get-after-a-call/index.html` | 1 | 0 |
| `how-setup-works/index.html` | 7 | 0 |
| `index.html` | 9 | 0 |
| `integrations/fasttrak/index.html` | 9 | 0 |
| `integrations/index.html` | 11 | 0 |
| `integrations/limo-anywhere/index.html` | 20 | 0 |
| `limo-answering-service/index.html` | 2 | 0 |
| `limo-dispatch-automation/index.html` | 4 | 0 |
| `madison-limo-answering-service/index.html` | 2 | 0 |
| `milwaukee-limo-answering-service/index.html` | 2 | 0 |
| `pricing/index.html` | 12 | 0 |
| `what-it-can-do/index.html` | 12 | 0 |
| `what-it-does/index.html` | 4 | 0 |
| `works-with-your-software/index.html` | 30 | 0 |
| `llms.txt` | 2 | 0 |
| `llms-full.txt` | 7 | 0 |
| `assets/aic-calls.js` (sample-call card data) | 3 | 0 |
| `terms/index.html` (excluded by the paste) | 2 | 2 |

Grammar used, in order: `With Your CRM` → `With Your Reservation Software` (pricing title) · `WITH YOUR CRM` → `WITH YOUR RESERVATION SOFTWARE` · `CRMs` → `reservation systems` (none found) · `the CRM` → `the reservation software` · `a CRM` → `reservation software` (none found) · `your CRM` → `your reservation software` (carries every "With your CRM") · bare `CRM` → `reservation software` (`my CRM`, `found in CRM`). The step 3 grep found 141 lines before and 0 after.

## Every other swap, one row each

| Step | File | Before | After |
|---|---|---|---|
| 1 | index.html | `<span class="kicker">FOR LIMOUSINE AND BLACK CAR COMPANIES</span>` | `<span class="kicker">THE AI RESERVATION DESK FOR LIMOUSINE AND BLACK CAR COMPANIES</span>` |
| 2 | index.html | hero-sub (old text above) | hero-sub = entity block |
| 4 | index.html | `A $99 bot takes a message. AI Chauffeur takes the reservation.` | `An answering service takes a message. AI Chauffeur takes the reservation.` |
| 4 | index.html (FAQ) | `It's not a $99 bot with your name typed in.` | `It's not an answering service with your name typed in.` |
| 4 | pricing/index.html (FAQ) | `It's not a $99 bot with your name typed in.` | `It's not an answering service with your name typed in.` |
| 4 | llms-full.txt (2 FAQ copies) | `It's not a $99 bot with your name typed in.` | `It's not an answering service with your name typed in.` |
| 4 | kept | `Not a $99 bot with your name typed in.` (built-close: /, /pricing/, llms.txt, llms-full.txt) | unchanged |
| 5 | index.html | `Four stages. <em>One clean record.</em>` | `Four steps. <em>One complete trip sheet.</em>` |
| 6 | index.html | `<dt>Flight tracking</dt><dd>On, pickup moves with it</dd>` | `<dt>Flight tracking</dt><dd>Add-on · watches the flight for dispatch</dd>` |
| 6 | assets/aic-calls.js | `["Flight tracking","On, pickup moves with it",4]` | `["Flight tracking","Add-on · watches the flight for dispatch",4]` |
| 6 | index.html | `/assets/aic-calls.js?v=s1002b` | `/assets/aic-calls.js?v=s1021a` |
| 3 | assets/aic-calls.js | `pulled up from the CRM` · `Dunmore Capital, found in CRM` · `Paul Grant, found in CRM` | `pulled up from the reservation software` · `… found in reservation software` ×2 |
| 7 | index.html | `<summary>What about pricing?</summary>` | `<summary>How much does AI Chauffeur cost?</summary>` |
| 7 | llms-full.txt | `- What about pricing? …` | `- How much does AI Chauffeur cost? …` |
| 9 | llms.txt, llms-full.txt | description line (old text above) | entity block |
| 10 | CLAUDE.md | — | `- PASTE files for Claude Code live at C:\Users\offic\Desktop\PASTE\ on the Dell. A claude.ai project doc path is never readable here; ask for the file.` |

### Three things done past the literal text, and why

1. **`assets/aic-calls.js`.** The homepage sample-call card is redrawn from this file as soon as the page loads, so changing the HTML alone would never have reached a visitor. The same row value and the three CRM strings in the card data were changed there. Recordings and transcript lines were not touched. Its hand-set token moved `s1002b` → `s1021a`. It is not in `stamp_chauffeur.py`'s list, and no other file changed token.
2. **`llms-full.txt` copies of the changed FAQ lines.** That file repeats the homepage and pricing FAQs word for word. Its copies of "What about pricing?" and the two "$99 bot" FAQ answers were changed to match, so it still quotes only what the site says.
3. **FAQ JSON-LD on the 11 `/answers/` pages.** `tools/aic-run10-faq-mirror.py` cannot read the h3/p layout those pages use. It reports "NO VISIBLE Q&A" for all 11, and did so before this run too. Their FAQPage text took the same swap as the visible text. A parity check compared every visible question and answer with its JSON-LD: 11/11 match. On the 15 pages the mirror can read, the FAQ JSON-LD was not touched by hand; the mirror regenerated 14 of them.

The pre-commit hook refreshed `<lastmod>` on the 33 changed sitemap pages. The sitemap still lists 33 URLs.

## Gates

| Gate | Before (prod, e2acf72) | After (local) | After (prod, 98f9d02) |
|---|---|---|---|
| `tools/aic-run14-gate.mjs` | PASS · 19 pages × 5 widths, 8 assertions | PASS | PASS |
| `tools/aic-run12-gate.mjs` | FAIL 37 | FAIL 37: same assertions, none new. Answer word counts +1 where CRM sat (/integrations/ 66 → 67, already over) · uniqueness 82.8% → 82.5% (bar 60%) | not re-run (same files) |
| `scripts/llms-verify.mjs` | GREEN 123/123 (local preview) | GREEN 124/124 (`--local`) | GREEN 124/124 on the served file (`--live`) and the repo file · `--red` caught all planted defects |
| `tools/aic-run10-faq-mirror.py --check` | 15 ok · 11 flagged (/answers/, NO VISIBLE Q&A) | 15 ok · same 11 flagged | — |
| /answers/ FAQ parity (run script) | — | 11/11 | — |
| Homepage render 390×844 + 1440 (+320) | — | no horizontal scroll · kicker 2 lines at 390 · 0 console errors besides the known analytics 404 | no horizontal scroll at 320/390/1440 · **0 console errors** · kicker 2 lines at 390 |
| Live string check (27 assertions) | — | — | 27/27 |

## Deploy and rollback

- aichauffeur production: `dpl_3YLVXeU2QsEH3HohBK1LBwcGSybq` · commit 98f9d02 · READY 2026-10-21 7:09:45 PM CT.
- Previous production: `dpl_A3e68LJVWz4t8dpj8RRe7ZjBT6kN` (e2acf72).
- Rollback: `git revert 98f9d02` and push. Or promote `dpl_A3e68LJVWz4t8dpj8RRe7ZjBT6kN` in Vercel (aichauffeur project).

## Gotchas

1. **Phones do not see the entity block.** `chauffeur/assets/aic.css:2855` hides `.hero .hero-sub` under 768 px. That rule was already there. Desktop shows the block; on a phone the fold is the kicker, H1, the set-up line and TALK TO AI. Showing it on phones adds about 12 lines above the button, so that is a layout call for Shane.
2. **11 sentences on 10 files now say "reservation software" twice**, e.g. "With your reservation software, the trip is written straight into your reservation software." This comes from the word-for-word swap. The grade-6 rewrite pass should fix it.
3. **The FAQ on / and /pricing/ still asks "Is this a cheap bot with our name on it?"**, and it now answers "It's not an answering service with your name typed in."
4. The kicker runs to 3 lines at 320 px. At 390 px, the width the paste tests, it is 2.
5. The O'Hare sample recording still has the AI say "I'll track that flight, so your pickup moves with it." Recordings and transcripts are frozen; the card beside it now says Add-on.
6. `CLAUDE.md` PRICING and `chauffeur/DESIGN-SYSTEM.md` still call the plan "AI Chauffeur with your CRM". Those are internal docs and were outside this paste, so the site and the fact-sheet name now differ.
7. Red before this run and unchanged by it: `aic-run12-gate` (37: its RUN 12 canon expects old CTA strings, a 19-URL sitemap and `#ava-callback` anchors) and `faq-mirror --check` (the 11 /answers/ pages it cannot read).
8. `stamp_chauffeur.py --check` reports 34 stale pages on the Dell. That is false. The files are checked out with CRLF line endings, while the committed LF files hash to the live tokens (`affe6ce0`, `4075e6d5`). Do not re-stamp from this machine.
9. `Last reviewed: 2026-10-20` in both llms files was left as is (not named). Terms still says CRM twice (excluded by the paste).

## Readback (mirror)

```
===== SHANE READBACK — COPY ALL =====
AIC WORDS A · Oct 21 2026 · aichauffeur.ai · LIVE

WHAT CHANGED, PLAIN WORDS
- The site now says "reservation desk": the homepage opens with THE AI RESERVATION DESK FOR LIMOUSINE AND BLACK CAR COMPANIES, and the paragraph under the hero is your entity block word for word.
- CRM became "reservation software" on 17 pages, plus llms.txt, llms-full.txt and the sample-call trip sheet. Terms and Privacy were left alone.
- The $99 line is down to one per page. "A $99 bot takes a message" now reads "An answering service takes a message."
- Flight tracking reads as an add-on on the trip sheet. The steps heading reads "Four steps. One complete trip sheet." The pricing question reads "How much does AI Chauffeur cost?"
- Every page except /try/ tells search engines it may be listed with full snippets. /try/ still says noindex.
- Nothing else moved: prices, phone numbers, buttons, recordings, transcripts, calendars and IDs are the same.

DONE
| Step | Before | After | Live |
| 1 Kicker | FOR LIMOUSINE AND BLACK CAR COMPANIES | THE AI RESERVATION DESK FOR LIMOUSINE AND BLACK CAR COMPANIES (2 lines at 390) | yes |
| 2 Hero-sub | "It takes the whole trip like your best dispatcher…" | entity block | yes (desktop; phones hide it, gotcha 1) |
| 3 CRM | 141 grep lines, 143 uses, 17 pages + 2 llms files | 0 | 0 on 33 live pages |
| 4 $99 | / 3, /pricing/ 2 | 1 each | yes |
| 5 Heading | Four stages. One clean record. | Four steps. One complete trip sheet. | yes |
| 6 Trip sheet | On, pickup moves with it | Add-on · watches the flight for dispatch | yes, rendered |
| 7 FAQ | What about pricing? | How much does AI Chauffeur cost? (+ JSON-LD) | yes |
| 8 Robots | none | 33 pages index,follow; /try/ noindex | 33/33 |
| 9 llms | old description line | entity block, CRM 0, prices same | llms-verify GREEN 124/124 |
| 10 CLAUDE.md | — | PASTE folder bullet under the router | repo |
Gates: run14 PASS (local + prod) · llms-verify GREEN (served file) · run12 FAIL 37 before and after, same set (old canon) · 27/27 live checks · 0 console errors on prod.

IDS / ROLLBACK
- Site commit 98f9d02 → dpl_3YLVXeU2QsEH3HohBK1LBwcGSybq READY 7:09:45 PM CT.
- Before: dpl_A3e68LJVWz4t8dpj8RRe7ZjBT6kN (e2acf72).
- Rollback: git revert 98f9d02 and push, or promote dpl_A3e68LJVWz4t8dpj8RRe7ZjBT6kN.
- Board: hq/board.json item aic-words-a = live, one log entry. Report: reports/2026-10-21-aic-words-a.md.

NEXT
- Next owner: Claude (grade-6 rewrites + software pages).
- Your call: show the entity block on phones (it pushes TALK TO AI down about 12 lines).

GOTCHAS
1. Phones don't see the entity block. aic.css:2855 hides the hero-sub under 768 px; that rule was already there.
2. 11 sentences now say "reservation software" twice ("With your reservation software, … into your reservation software."), from the word-for-word swap.
3. The FAQ still asks "Is this a cheap bot with our name on it?" and now answers "It's not an answering service with your name typed in."
4. The homepage trip sheet is drawn by aic-calls.js, so its data got the same flight-tracking and CRM swaps (token s1021a). The O'Hare recording still says "I'll track that flight, so your pickup moves with it."
5. CLAUDE.md pricing and chauffeur/DESIGN-SYSTEM.md still say "AI Chauffeur with your CRM", so the site and the fact sheet now name the plan differently.
6. stamp_chauffeur --check says 34 pages are stale on the Dell. That is false (CRLF checkout). Don't re-stamp from this machine.
```
