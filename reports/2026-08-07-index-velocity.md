# INDEX VELOCITY RIG — aivoiceagency.ai + aichauffeur.ai

**Date:** 2026-08-07 · **Commits:** `ec159f6` (the rig) → the closeout commit carrying this file
**Status:** LEG A LIVE on both hosts · **LEG B BLOCKED — no Google credential**

---

## Plain English

Search engines don't check your site on a schedule you control. They come when they
come. There are two ways to tap them on the shoulder and say *look now* — and this run
built one of them and found the other one locked.

**The one that shipped (IndexNow).** A single file with a random 32-character name now
sits at the root of both websites. That file is the password. A script reads each site's
sitemap, bundles up every page address, and hands the whole list to IndexNow in one
message. IndexNow passes it straight to Bing, Yandex, Seznam and Naver. It fired today:
60 pages for aivoiceagency.ai, 16 for aichauffeur.ai, both accepted.

**Google is not on that list.** IndexNow is an open standard Google has never joined, so
none of the above touches Google. Reaching Google needs the Search Console API, which
needs a Google service-account key. There isn't one, so that half is blocked and waiting
on you — the exact steps are below.

**The thing worth your attention.** Every page in a sitemap carries a "last modified"
date. The obvious way to fill it in is "ask git when the file last changed." That answer
was wrong, and wrong in a direction that would have quietly hurt the site. Git says all
60 pages on the parent site changed on August 5th. They didn't — that day's commit only
bumped a cache-busting number in each file, and the commit message says so in plain words.
Had the run trusted git, it would have told Google that every page on the site got fresh
content on August 5th. Google's published response to a "last modified" date it decides
it can't trust is to stop believing that field **for the entire site**. A made-up date is
worse than no date. So the tool was taught to ignore two kinds of meaningless churn —
cache-buster numbers, and the shared header/footer that gets rewritten on every page at
once — and to date each page by the last time its *actual content* moved. 69 dates were
corrected. One of them, `/deck`, moved *backwards*, because it had been claiming an edit
that never happened.

**Four pages were invisible.** `/watch`, `/deck`, `/plumber-answering-service` and
`/electrician-answering-service` were listed in the sitemap but nothing on the site linked
to them. That's the site telling Google "rank these" while refusing to point at them
itself. All four now have footer links.

**One bug found in passing.** Four of the newer chauffeur pages were never registered in
the cache-armor tool, so they were pointing at an old copy of the stylesheet that could
never expire. If the design changed, those four pages would have served the old styles
against new markup — the exact breakage the cache-armor system exists to prevent. Fixed.

---

## DONE

| # | Artifact | Live status | Proof |
|---|---|---|---|
| 1 | IndexNow key — `aivoiceagency.ai` | **LIVE** | `https://aivoiceagency.ai/7f6e54227b2f4a609ddf3040a7d86dfb.txt` → 200, `text/plain`, body matches key |
| 2 | IndexNow key — `aichauffeur.ai` | **LIVE** | `https://aichauffeur.ai/7f6e54227b2f4a609ddf3040a7d86dfb.txt` → 200, `text/plain`, body matches key |
| 3 | `scripts/indexnow-ping.mjs` | **LIVE (in repo)** | Vanilla Node, zero deps. Dry-run + negative test both pass; refuses to POST when the key file 404s |
| 4 | IndexNow submission — parent | **FIRED** | `HTTP 202 Accepted` · 60 URLs · 2026-08-07 |
| 5 | IndexNow submission — chauffeur | **FIRED** | `HTTP 202 Accepted` · 16 URLs · 2026-08-07 |
| 6 | `scripts/sitemap-hygiene.mjs` | **LIVE (in repo)** | `SITEMAP HYGIENE: CLEAN` — 0 defects across both hosts |
| 7 | lastmod corrections | **LIVE** | 57 parent + 12 chauffeur. Prod check: `/deck` → `2026-07-28`, chauffeur home → `2026-08-07` |
| 8 | Orphan fix (4 pages) | **LIVE** | Orphan check PASS on both hosts; 6 new footer links via `tools/stamp.py`, 56 pages re-stamped |
| 9 | Cache-armor fix (4 chauffeur pages) | **LIVE** | All four moved from stale hand-written tokens to `?v=119c51e`; 20/20 now registered |
| 10 | **Leg B — Google Search Console API** | **BLOCKED** | No `GSC_SA_KEY` / `GOOGLE_APPLICATION_CREDENTIALS` in any of the 4 `ava-prod` Doppler configs |

**Not delivered, and why:** Leg B items (a) sitemap submission via the Sitemaps API,
(b) batch URL-Inspect across both properties, (c) the per-host verdict /
`coverageState` / `lastCrawlTime` table, and (d) the non-indexed-URL reason list. All
four require the Search Console API, which requires a credential that does not exist.
Nothing was submitted to Google and no coverage data was read. Any table claiming
otherwise would be invented.

---

## P0 FOUND — NOT FIXED, NEEDS YOUR DECISION

**`https://aivoiceagency.ai/hq/board.json` returns HTTP 200 to anyone**, and the served
body contains **8 occurrences across all 4 of the private / retired phone numbers this
run was told never to publish.** The digits are deliberately not reproduced here.

- **Not caused by this run.** Occurrence counts are byte-identical before and after
  (`git show HEAD:hq/board.json` vs the working file). This run added none.
- **`robots.txt` does not protect it.** `Disallow: /hq/` is a request to well-behaved
  crawlers, not access control — the same reasoning already written into
  `chauffeur/.vercelignore` about `DESIGN-SYSTEM.md`. `hq` is **not** in the root
  `.vercelignore`, so the ledger is deployed to the CDN and fetchable by path.
- **The repo is public.** `shanehandel-504/aivoiceagency` is a public GitHub repo, so
  those numbers are also in public git history. Redacting the live file would reduce the
  fetch surface but would **not** remove them from history.

**Why I did not fix it:** every real remediation carries a decision that is yours. Adding
`hq` to `.vercelignore` stops the deployment but breaks the internal cockpit — the `/work`
hub and `/hq` board read this file live. Redacting the log entries preserves the cockpit
but leaves public git history untouched, which would give a false sense of remediation.
Full remediation is a history rewrite plus rotating the exposed numbers. Silently doing
the cheap half would have been worse than reporting it.

**Options, cheapest first:**

1. **Redact + accept history** — strip the numbers from `hq/board.json` log entries. Live
   fetch is clean within one deploy; history still carries them.
2. **Stop deploying the ledger** — add `hq` to `.vercelignore` and repoint `/work` and
   `/hq` at a gated endpoint instead of a static file. Removes the CDN copy entirely.
3. **Full** — 1 + 2, plus a `git filter-repo` history rewrite and force-push, plus
   retiring/rotating any number still in service.

---

## LEG B — the 5 steps to unblock

Steps 1–5 are yours; the run picks up again at step 6.

1. **GCP project** — <https://console.cloud.google.com/projectcreate>. Any name.
2. **Enable the API** — in that project, APIs & Services → Library → "Google Search
   Console API" → Enable.
3. **Service account** — IAM & Admin → Service Accounts → Create. No project role is
   needed; access is granted per-property in step 5. Copy the generated email, which
   looks like `name@project-id.iam.gserviceaccount.com`.
4. **JSON key** — on that service account: Keys → Add key → Create new key → JSON.
   Download it.
5. **Grant it on BOTH properties** — Search Console → `aivoiceagency.ai` → Settings →
   Users and permissions → Add user → paste the service-account email → permission
   **Owner** (Full does not permit sitemap submission). **Repeat for `aichauffeur.ai`.**
   This is the step most often missed, and skipping it produces a 403 that reads like a
   bad key.
6. **Store it** — `doppler secrets set GSC_SA_KEY --project ava-prod --config prd < key.json`
   then delete the downloaded file.

Property-type note: if either property is registered as a **Domain** property rather
than a **URL-prefix** property, the API identifier is `sc-domain:aivoiceagency.ai`, not
`https://aivoiceagency.ai/`. Worth checking before the next run so it doesn't 404 on a
correct key.

---

## Rollback

| Checkpoint | ID | One-line rollback |
|---|---|---|
| The rig | `ec159f6` | `git revert ec159f6 && git push` — removes key files, scripts, sitemap dates, footer links, cache-armor registration |
| Closeout | see final commit | `git revert <sha> && git push` — board + report only |
| Kill IndexNow alone | — | Delete both `7f6e54227b2f4a609ddf3040a7d86dfb.txt` files and push. Submissions stop authenticating immediately; already-submitted URLs are not withdrawn |
| Un-fire a submission | — | Not possible. IndexNow has no retraction endpoint |

---

## What's next

- **Leg B is the whole remaining job.** Do the 5 steps above and the Search Console half
  runs end to end: sitemap submission, URL-Inspect across all 76 URLs (2,000/day quota is
  not a constraint at this size), and the coverage table this report could not produce.
- **Re-fire IndexNow after any content push** — `node scripts/indexnow-ping.mjs`. It is
  safe to re-run; it re-reads the live sitemap each time.
- **Run the hygiene gate before each push** — `node scripts/sitemap-hygiene.mjs`, and
  `--write` to auto-correct dates. Exit code 1 on any defect, so it drops into CI as-is.
- **The 202s should become 200s.** Re-fire in a day or two; a continuing 202 is fine, but
  a 403 means the key file stopped serving.

---

## Gotchas

- **There is no `shanehandel-504/aichauffeur` repo.** The brief assumed two repos. There
  is one repo with two site roots — the parent deploys from `/`, the `aichauffeur` Vercel
  project from `/chauffeur/`. Confirmed against the GitHub account listing, and confirmed
  behaviourally: an unknown path on `aichauffeur.ai` returns a real 404 rather than the
  repo-root `vercel.json` catch-all rewrite, which proves the chauffeur project serves
  that host. Anything that "fixes" aichauffeur.ai by editing the repo-root `vercel.json`
  is editing a file that host never reads.
- **IndexNow does not reach Google, and never will by itself.** Google has not adopted the
  standard. Treat Leg A and Leg B as two separate audiences, not a primary and a backup.
- **`git log -1` is the wrong way to compute lastmod in this repo**, and it fails silently
  and confidently. Two classes of commit rewrite every page without changing any page:
  the cache-armor re-stamp (`?v=` / `__ASSET_V`) and any shared nav/footer edit. Both look
  like a 60-file content change to git.
- **A line-level filter is not enough to skip shared chrome.** The first attempt tested
  each changed line for a chrome class name. `<a href="/privacy">Privacy</a>` lives inside
  the footer block and carries no class, so it passed the filter and a footer-only sweep
  registered as a real content change on 59 pages. The fix compares the body with the
  `<!-- BRIDGE:* -->` regions removed — exact, not heuristic.
- **`202` from IndexNow is a pass, not a warning.** It means accepted with key validation
  pending, which is the normal answer the first time a key is used. `403` is the failure
  that matters, and it means the key file is missing or wrong — which is why the script
  fetches and byte-compares the key file itself before submitting anything. Without that
  precheck a 403 in a log is indistinguishable from a network error.
- **Four chauffeur money pages had dead cache armor for two runs.** RUN 12's integration
  cluster and RUN 13's dispatch page were never added to `stamp.py`, so they carried
  hand-written 8-character tokens while every registered page on the same host carried the
  7-character git short hash. Same stylesheet, two URLs, two cache entries, and the stale
  one could not expire. **The lesson is not "add the page" — it is that nothing warns you.**
  The stamp run prints only what it stamped, so an unregistered page is invisible in its
  output. A page count assertion against the sitemap would have caught it on day one.
- **Writing a NUL byte into a source file makes git treat it as binary** and `grep` stops
  reporting matches, which reads as "the edit didn't apply." Sentinels in source must be
  written as `\u0000` escapes, not literal control characters.
- **The footer change touched the frozen homepage.** Judgement call, flagged for reversal:
  an indexable page with zero inbound links is a defect in the link graph, and both
  HOMEPAGE FREEZE LAW and § POLISH FREEZE permit bug fixes. It changes shared chrome
  authored in `tools/stamp.py`, not homepage copy or layout. If you read that differently,
  revert `ec159f6` and the fix can be re-cut as contextual in-body links instead.
- **Screenshots were unavailable this session** — the Browser pane was not displayed, so
  the page never composited frames. The render check was done by measurement against the
  live DOM at 390×844 and 1280×800 (overflow, box sizes, computed contrast, console), not
  by eye.
