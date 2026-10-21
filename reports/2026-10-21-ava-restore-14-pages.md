# AVA restore 14 pages · Oct 21 2026

Paste: PASTE-CC-RESTORE-14-PAGES v1.1 (replaces v1, Oct 20). Base: main 0a7880e. Run Wed Oct 21 2026, push 6:29 PM CT.

Shane's rulings: Oct 19 (10:33 PM, 10:49 PM CT), Oct 20 (8:47 PM CT, "I want you to reinstate those. I never authorize that") and Oct 21 (5:22 PM CT, "we're not cutting any pages… bring them back").

## What happened, in plain English

- On Oct 19 a run hid 12 Wisconsin city pages from Google and turned the Milwaukee HVAC and Milwaukee electrical pages into redirects to the general HVAC and electrician pages.
- All 14 pages are back. Each one opens on its own address, tells Google it may list it, and is in the sitemap again (55 URLs before, 69 now).
- The two Milwaukee pages came back exactly as they were, from the Oct 19 backups. The backups stay where they are.
- No words changed on any page. The only other edits put links back: the footer and a few in-page cards had been pointed away from the two Milwaukee pages, and now point to them again.
- The 14 addresses were sent to IndexNow (Bing, Yandex and the rest). That is a request to look at them, not a promise they get listed. Google does not take IndexNow; it finds them through the sitemap.
- aichauffeur.ai (/chauffeur/) was not touched.

## DONE

| # | Page | Before (main 0a7880e) | After (live, 6d3384d) |
|---|---|---|---|
| 1 | /milwaukee-hvac | 301 → /hvac-answering-service · file only in infra/backups/2026-10-19/ · not in sitemap | 200, no redirect · no noindex · in sitemap |
| 2 | /milwaukee-electrical | 301 → /electrician-answering-service · file only in infra/backups/2026-10-19/ · not in sitemap | 200, no redirect · no noindex · in sitemap |
| 3 | /green-bay-dental | 200 · `noindex, follow` · not in sitemap | 200 · no robots tag · in sitemap |
| 4 | /green-bay-electrical | 200 · `noindex, follow` · not in sitemap | 200 · no robots tag · in sitemap |
| 5 | /green-bay-hvac | 200 · `noindex, follow` · not in sitemap | 200 · no robots tag · in sitemap |
| 6 | /green-bay-plumbing | 200 · `noindex, follow` · not in sitemap | 200 · no robots tag · in sitemap |
| 7 | /green-bay-roofing | 200 · `noindex, follow` · not in sitemap | 200 · no robots tag · in sitemap |
| 8 | /madison-roofing | 200 · `noindex, follow` · not in sitemap | 200 · no robots tag · in sitemap |
| 9 | /waukesha | 200 · `noindex, follow` · not in sitemap | 200 · no robots tag · in sitemap |
| 10 | /waukesha-electrical | 200 · `noindex, follow` · not in sitemap | 200 · no robots tag · in sitemap |
| 11 | /waukesha-hvac | 200 · `noindex, follow` · not in sitemap | 200 · no robots tag · in sitemap |
| 12 | /waukesha-plumbing | 200 · `noindex, follow` · not in sitemap | 200 · no robots tag · in sitemap |
| 13 | /waukesha-roofing | 200 · `noindex, follow` · not in sitemap | 200 · no robots tag · in sitemap |
| 14 | /west-bend | 200 · `noindex, follow` · not in sitemap | 200 · no robots tag · in sitemap |

| Item | Result |
|---|---|
| Sitemap (aivoiceagency.ai, live) | **69** `<loc>` (was 55) |
| IndexNow | `scripts/indexnow-ping.mjs --urls=<the 14>`: key file verified live, **200 OK, 14 URLs submitted**. A submission, not indexing. |
| Commit | 6d3384d (restore) + the board/report commit |
| Deploy | aivoiceagency **dpl_J3f1nCa9oDHEpgeZGDU1H2tVVEmY**, READY 6:29:56 PM CT, aliased to aivoiceagency.ai + www |
| Words changed | 0 |
| /chauffeur/ files in the commit | 0 |

Before-state proof (from git, 0a7880e): sitemap.xml 55 `<loc>`; each of the 12 pages carries `content="noindex, follow"` once; `milwaukee-hvac/index.html` absent; vercel.json carries 8 rules for the two paths.

## Step 1 · what the Oct 19 run changed (read from the commits)

**4b7fb59 (noindex):** one line added to each of the 12 pages, after the viewport meta: `<meta name="robots" content="noindex, follow">`. None of the 12 had a robots tag before. sitemap.xml lost those 12 `<url>` blocks. chauffeur/sitemap.xml: two lastmods moved by 1 second (hook drift, not a page change).

**1e48002 (merge):** vercel.json gained 8 rules (apex + www, with and without the slash, statusCode 301). milwaukee-hvac/index.html and milwaukee-electrical/index.html were `git mv`'d to infra/backups/2026-10-19/ and two dated copies were added. sitemap.xml lost the 2 `<url>` blocks. tools/stamp.py dropped both pages from PAGES (a MERGED filter) and pointed the FOOTER's "HVAC answering" and "Electrical answering" links at the general pages. tools/gate-pages.mjs filtered both out and moved its self-check counts 25 → 23 and 61 → 59. 66 served pages had their footer hrefs retargeted (132 hrefs), 7 of them also an in-page card (9 hrefs).

**llms.txt:** no line about any of the 14 was dropped after Oct 18 (`git log -p --since=2026-10-18 -- llms.txt` shows no removed line naming them). /west-bend and /waukesha were listed throughout and still are. Nothing to put back.

## Step 2 · what this run reversed

| Part | How | Check |
|---|---|---|
| (a) noindex off the 12 | deleted the one line 4b7fb59 added | each page now equals its pre-run (6c374fc) content |
| (b) 8 redirect rules | reverse of 1e48002's vercel.json hunk | `vercel.json` parses; 0 rules name either path; every other rule unchanged |
| (c) the two Milwaukee pages | `cp` from infra/backups/2026-10-19/<page>/index.html | `cmp` identical to the backup; backup identical to 6c374fc |
| (d) sitemap | the 14 `<url>` blocks put back at their pre-run positions (order of the other 55 unchanged); lastmod written by the pre-commit hook (`scripts/stamp-sitemap.mjs --hook`) | `stamp-sitemap.mjs --check` → IN SYNC 102/102 · XML parses · 69 `<loc>` |
| (e) llms.txt | nothing dropped | see step 1 |
| links + tooling | reverse of 1e48002's hunks on 66 pages, tools/stamp.py, tools/gate-pages.mjs (`git apply -R`, applied clean) | every changed HTML line is an href swap or the robots line, nothing else; gate-pages imports with 25 / 61; stamp.py has no MERGED filter and its footer links the two pages again |

Whole commit: 72 files. infra/backups/2026-10-19/ untouched. Staged by explicit path list; the 12 stale audit files from Sep 28 stayed unstaged.

## Step 3 · live verification

`live14.sh` (curl, cache-busted) on aivoiceagency.ai after the deploy was READY:

```
live sitemap <loc> count: 69
PASS milwaukee-hvac code=200 redirect=none noindex_meta=0 x-robots=none in_sitemap=1 slash=200
PASS milwaukee-electrical code=200 redirect=none noindex_meta=0 x-robots=none in_sitemap=1 slash=200
PASS green-bay-dental … PASS west-bend   (same five checks, all 14)
FAILS=0
www/milwaukee-hvac 308 > https://aivoiceagency.ai/milwaukee-hvac   (the house www → apex hop, then 200)
www/milwaukee-electrical 308 > https://aivoiceagency.ai/milwaukee-electrical
```

Playwright (Chromium) on production, 390×844 and 1440×900, all 14 pages: 28/28 status 200, no redirect, no robots meta, horizontal overflow 0, console errors 0. The same 28/28 passed on a local server before the commit. Screenshots of both Milwaukee pages were looked at: hero, breadcrumb and nav render as before.

The footer on /milwaukee-plumbing (live) links /milwaukee-hvac once and /milwaukee-electrical twice (footer + its in-page card).

## Calls I made where the paste and the facts disagreed

- **Links back as well as pages.** The paste lists (a)–(e). The Oct 19 merge also pointed 141 links away from the two Milwaukee pages, and took them out of stamp.py PAGES and gate-pages.mjs. Restoring the pages without those would have left them unlinked, skipped by every future stamp run, and left the "Milwaukee HVAC" / "Milwaukee Electrical" cards landing on the general pages. Those hunks were hrefs only, so reversing them changes no words. This also closes NEEDS WORDS item 3 from Oct 19: the "See it local" card on /hvac-answering-service and /electrician-answering-service no longer points at its own page.
- **No stamp.py run.** The paste asks for a byte-for-byte restore. The restored pages already carry the same `?v=` cache tokens as their live siblings, so nothing needed stamping. The next normal stamp run covers them again now that they are back in PAGES.

## Rollback

`git revert 6d3384d` and push (puts the noindex, the 301s and the 55-URL sitemap back). Pre-run deploy to promote instead: aivoiceagency dpl_3JtmqR3hXCHYJAwqBk9KqZHHb9AH (0a7880e).

## Gotchas

- The sitemap lastmod moved to Oct 21 on 65 pages: the link revert touched their files, and the hook dates each page by its last commit.
- Vercel's deploy hook also pings IndexNow with the whole sitemap, and has raced the CDN before. That run was not checked here. The 14 were sent by hand after the live sitemap read 69.
- /transportation keeps its noindex and canonical to /ground-transportation (Jul 12 alias), as the paste said.
- The 12 stale audit files from Sep 28 are still modified in the working tree and were never staged.

## SHANE READBACK (mirror)

```
===== SHANE READBACK — COPY ALL =====
AVA RESTORE 14 PAGES · Wed Oct 21 2026 · LIVE on aivoiceagency.ai

WHAT HAPPENED
- On Oct 19, 12 city pages were hidden from Google, and the Milwaukee HVAC and
  Milwaukee electrical pages were turned into redirects. You never okayed that.
- All 14 are back: each one opens on its own address, Google may list it, and it
  is in the sitemap again (55 -> 69 addresses).
- The two Milwaukee pages came back exactly as they were, from the backup copies.
- Not one word changed on any page. Footer and card links that had been pointed
  away from the two Milwaukee pages point to them again.
- aichauffeur.ai was not touched.

DONE
page                  | before                        | after
milwaukee-hvac        | redirect to general HVAC page | 200, listed, in sitemap
milwaukee-electrical  | redirect to electrician page  | 200, listed, in sitemap
green-bay-dental      | hidden (noindex), no sitemap  | 200, listed, in sitemap
green-bay-electrical  | hidden (noindex), no sitemap  | 200, listed, in sitemap
green-bay-hvac        | hidden (noindex), no sitemap  | 200, listed, in sitemap
green-bay-plumbing    | hidden (noindex), no sitemap  | 200, listed, in sitemap
green-bay-roofing     | hidden (noindex), no sitemap  | 200, listed, in sitemap
madison-roofing       | hidden (noindex), no sitemap  | 200, listed, in sitemap
waukesha              | hidden (noindex), no sitemap  | 200, listed, in sitemap
waukesha-electrical   | hidden (noindex), no sitemap  | 200, listed, in sitemap
waukesha-hvac         | hidden (noindex), no sitemap  | 200, listed, in sitemap
waukesha-plumbing     | hidden (noindex), no sitemap  | 200, listed, in sitemap
waukesha-roofing      | hidden (noindex), no sitemap  | 200, listed, in sitemap
west-bend             | hidden (noindex), no sitemap  | 200, listed, in sitemap
Sitemap: 69 addresses live (was 55).
IndexNow: 200 OK, 14 sent. That asks Bing and others to look; it does not list them.
Google picks them up from the sitemap.
Proof: 14/14 pass a live check (200, no redirect, no noindex, in sitemap);
phone + desktop render 28/28 clean, no errors.

IDS + ROLLBACK
- Commit 6d3384d · deploy dpl_J3f1nCa9oDHEpgeZGDU1H2tVVEmY (READY 6:29 PM CT).
- Undo: git revert 6d3384d, push. Pre-run deploy: dpl_3JtmqR3hXCHYJAwqBk9KqZHHb9AH.

NEXT
- Next owner: Claude (AIC words run).
- Google takes days to weeks to re-list pages that were hidden; nothing to do but wait.

GOTCHAS
- I also put back the footer and card links that pointed away from the two
  Milwaukee pages, plus their spots in the site tools. Links only, no words.
  Without that they would have been back but linked from nowhere.
- 65 pages show today's date in the sitemap because their links were touched.
- /transportation still points Google to /ground-transportation, as before.
```
