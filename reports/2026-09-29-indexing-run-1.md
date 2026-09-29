===== SHANE READBACK — COPY ALL =====

RUN INCOMPLETE — AVA LLMS.TXT HAS NO AI CHAUFFEUR POINTER / NO AIVOICEAGENCY.AI PAGE PRINTS ONE AND THE FILE MAY ONLY QUOTE ITS OWN HOST / ADD ONE POINTER SENTENCE TO AN AVA PAGE (E.G. /GROUND-TRANSPORTATION), THEN RE-RUN STEP 5

AI CHAUFFEUR + AVA — INDEXING RUN 1 · run 2026-09-29 (brief dated Sep 28) · Claude Code

WHAT HAPPENED, IN PLAIN ENGLISH
- Search engines now get true dates. Every page in both sitemaps shows the date that page last changed in git. A git hook keeps those dates current on every commit that touches a page.
- aivoiceagency.ai/chauffeur/ no longer serves a copy of the AI Chauffeur site. Every old /chauffeur/ address now sends people and crawlers permanently (301) to the same page on aichauffeur.ai. An address with no real page ends on a true "not found", never the homepage.
- Trip sheets, the HQ board and run reports now tell every search engine "do not index, do not follow, do not archive" on both sites.
- Both llms.txt files (the summary AI answer engines read) were rebuilt only from sentences live on each site. "100 calls at once" and the rate-quoting lines are gone from AI Chauffeur's file.
- Bing and the other IndexNow engines were told about the 6 money pages. Both sites answered 202 (accepted).
- All 9 crawlers get the full page and its headline on all 6 money pages, and Vercel's firewall blocks none of them.
- One thing is missing: the AVA llms.txt has no line sending transportation callers to AI Chauffeur, because no AVA page says that today.

DONE
| Step | Files changed | Verified by | Live |
|---|---|---|---|
| 1 Sitemap lastmod from git | scripts/stamp-sitemap.mjs (new) · .githooks/pre-commit (new) · sitemap.xml · chauffeur/sitemap.xml · core.hooksPath=.githooks (this clone) | `node scripts/stamp-sitemap.mjs --check` → IN SYNC 79/79 · 6 hand checks vs `git log -1 --format=%cI -- <file>` all MATCH · both sitemaps parse | yes |
| 2 IndexNow | 69c6723b4b145a13877f1c954bdb0e09.txt · chauffeur/69c6723b4b145a13877f1c954bdb0e09.txt · scripts/indexnow-ping.mjs | `node scripts/indexnow-ping.mjs --urls=<6 money URLs>` → key files verified live · aivoiceagency.ai 202 · aichauffeur.ai 202 | yes |
| 3 Cross-host seal | vercel.json | `curl -sI` + `curl -sIL` on 30 /chauffeur paths → 301 to the same path, final 200 on aichauffeur.ai (30/30) · dead path → 301 → 404 · canonicals 62/62 + 20/20 self, live 200 · each sitemap own host only · each robots.txt → own sitemap | yes |
| 3B Private pages | vercel.json · chauffeur/vercel.json | `curl -sI https://aivoiceagency.ai/hq/board.json` → 200 + X-Robots-Tag · trip page GET → 200 + X-Robots-Tag (`curl -I` → 404 + header) · 0 private URLs in sitemaps, llms.txt, ping list | yes |
| 4 Crawler check | none | curl × 9 UAs × 6 money URLs → 54/54 200 with the H1 · `npx vercel@61.0.0 firewall status / rules list / traffic` under `doppler run` | yes |
| 5 llms.txt | llms.txt · chauffeur/llms.txt | verifier: 87 + 92 segments verbatim from live pages, 48 links 200 · red test caught 9/9 planted defects | yes (AVA pointer missing) |
| 6 Verification files | none | all four fill-in slots blank → skipped | n/a |
| 7 Board + readback | hq/board.json · reports/2026-09-29-indexing-run-1.md | board.json parses · deployment READY | yes |

CRAWLERS — 6 money URLs × 9 user-agents (curl, no redirect follow)
| Money URL | Googlebot | Bingbot | GPTBot | ChatGPT-User | OAI-SearchBot | ClaudeBot | PerplexityBot | Google-Extended | Applebot |
|---|---|---|---|---|---|---|---|---|---|
| aichauffeur.ai/ | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 |
| aichauffeur.ai/what-it-does | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 |
| aichauffeur.ai/limo-answering-service | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 |
| aichauffeur.ai/integrations/limo-anywhere | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 |
| aichauffeur.ai/book | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 |
| aivoiceagency.ai/ | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 | 200 · H1 |
| robots.txt (live, both hosts) | allow | allow | allow | allow | allow | allow | allow | allow | allow (* group) |
| Vercel firewall (both projects, CLI 61.0.0) | not configured · 0 custom rules | Bot Protection Off | AI Bots Allow | BotID Basic | Attack Mode Off | OWASP Off | DDoS mitigations Active | 25 h: 186 mitigations (AVA 34 · AIC 152) | bot "(not set)" on all 186 → 0 verified crawlers denied or challenged |
H1s: "One call or a thousand. Every one answered. Every one booked." · "What it does" · "The limo answering service that never puts a caller on hold." · "AI Chauffeur works beside Limo Anywhere." · "Book the setup call." · "3AM. GOOGLE WAS LISTENING." Every body was byte-for-byte the size a browser gets.

IDS / ROLLBACK
- Commits: ca815c4 (S1) · 0ecbb51 (S2) · 0a0050f (S3 + 3B) · 4d66b46 (S5) · this readback + board (S7).
- Built from 4d66b46: aivoiceagency dpl_FHP5tALm2TWEPGDR8ctGN53oZ3F7 · aichauffeur dpl_6x4u9P61n7Bh3g19ZhVod1BSqN5j (both READY).
- Roll everything back: promote dpl_7TjoHHiUfBQPBcGmpH6iDsJJ5zj5 (aivoiceagency) and dpl_A3uvFgK7Zc8o6bETYpqeVzDtUZ9u (aichauffeur), the production builds from before this run.
- One step at a time: `git revert ca815c4` (then `git config --unset core.hooksPath`) · `git revert 0ecbb51` · `git revert 0a0050f` · `git revert 4d66b46`. An IndexNow ping cannot be unsent (harmless).

WHAT'S NEXT
1. Put one AI Chauffeur pointer sentence on an AVA page (e.g. /ground-transportation), then re-run Step 5 so the AVA llms.txt can quote it.
2. /what-it-does/ itself still prints "100 calls at once", "every call, twenty at a time" and the rate-quoting lines. llms.txt no longer repeats them; the page copy was out of scope.
3. aivoiceagency.ai/ai100x/ serves a copy of ai100x.ai (canonical → ai100x.ai), the same leak /chauffeur/ had. Seal it the same way if you want.
4. Fill the Google / Bing verification slots only if you want file-based verification.

GOTCHAS
- Lastmod now moves on ANY commit to a page's own file, including a stamp.py cache-armor re-stamp. The Aug 7 rig ignored those on purpose. scripts/sitemap-hygiene.mjs still checks the old content-only rule and will now report drift.
- The hook runs only where `git config core.hooksPath .githooks` is set. It is set on this machine only; every other clone needs it once.
- /hq/ is also Disallowed in aivoiceagency.ai robots.txt, so obedient crawlers never fetch it and never see the new noindex header. Left as is (not in the brief).
- `curl -I` (HEAD) on a trip page returns 404, because the n8n webhook behind /trip/:id answers GET only. A crawler's GET returns 200 with the header. The trip id is masked everywhere. The same sheets also answer at the n8n webhook URL directly, which vercel.json cannot reach.
- Four money URLs (…/what-it-does, …/limo-answering-service, …/integrations/limo-anywhere, …/book) answer 200 as no-slash twins of the canonical trailing-slash pages, and their canonical tags point at the slash form. They were pinged as given.
- The Vercel CLI is not installed and Doppler holds no Vercel key in any project or config. The firewall read ran `npx vercel@61.0.0` under `doppler run -p ava-prod -c prd` on the CLI's stored login.
- 19 internal noindex files carry no canonical: 17 under /work, /hq, /cockpit, /brand, /pitch, /voice-ab, /ad-stage, /ctr-report and /chatgpt-example; /ai100x/cockpit/; and aichauffeur.ai/assets/trip-text-card.html. Three shells carry neither canonical nor noindex: /templates/aic-proof-ticket.html, /work/emails/receipt.html and /work/emails/signal.html (/work/ is robots-Disallowed). The legacy and staging homepage copies canonicalize to /. /templates/city.html and /templates/vertical.html are served without noindex and with {{placeholder}} canonicals. None were changed: none is a public page.
- The Aug 7 IndexNow key file 7f6e…dfb still serves on both roots, unused.
- "Last reviewed: 2026-09-28" is written as instructed. The run executed on 2026-09-29 (Central).
- Probe trap: with MSYS_NO_PATHCONV=1, Git Bash hands native curl a literal /dev/null, which exits 23: no -L follow and an empty redirect_url. The first Step 3 pass read 0/30; the fixed probe read 30/30.
