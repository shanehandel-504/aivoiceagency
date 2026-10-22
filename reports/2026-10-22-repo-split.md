# 2026-10-22 · REPO SPLIT · AI Chauffeur gets its own repo

PASTE-CC-REPO-SPLIT-v1. Run on the Dell, Thu Oct 22 2026, about 12:55 to 1:35 PM CT, right after AIC-FIXES (same session).
Loadout: chauffeur-design · verification-before-completion (grilling skipped: the PASTE is pre-approved and says execute only).
This file is in both repos.

- **AI Chauffeur:** https://github.com/shanehandel-504/aichauffeur (private) → Vercel `aichauffeur`, root directory = repo root. Local clone `C:\Users\offic\Desktop\aichauffeur`.
- **AVA:** https://github.com/shanehandel-504/aivoiceagency → Vercel `aivoiceagency` (root) and `ai100x` (`ai100x/`). Local `C:\Users\offic\Desktop\aivoiceagency`.
- No visible word changed on any site. No repo, project, domain, deployment or env var was deleted. Nothing was force-pushed.

## DONE

| Item | Before | After | Live |
|---|---|---|---|
| New repo | none | `shanehandel-504/aichauffeur`, private, 110 chauffeur/ commits kept (`git subtree split`), tree identical (f880eda) | ✓ |
| Tooling in the new repo | in aivoiceagency only | tools, scripts, hook, bricks, skills, docs, 46 AIC reports, board (40 items, 96 log entries), CLAUDE.md, `.vercelignore` | gates green (§ 3) |
| aichauffeur project | Git `aivoiceagency`, root `chauffeur` | Git `aichauffeur` (repoId 1430088782), root = repo root, branch main | first prod `dpl_9LLRe7E571y7nzS8CW35HG4N6VnU` READY; 58/58 URLs byte-identical |
| aivoiceagency `chauffeur/` | 118 files | `chauffeur/README.md` only (`3a1e5e6`) | aivoiceagency.ai 200; /chauffeur/* still 301 to aichauffeur.ai |
| aivoiceagency tools | 33 AIC-only site tools | removed (copies in the new repo) | — |
| ai100x builds | every push | only when `ai100x/` changes | proof: CANCELED on both AVA pushes |
| aivoiceagency builds | every push | skips a push that changed only `ai100x/` | proof: READY on the board push |
| Proof pushes | — | AVA board push built only aivoiceagency; AIC board push built only aichauffeur | ✓ (§ 5) |

## 0 · STEP 0 map (read only)

**a · Vercel projects linked to `shanehandel-504/aivoiceagency` (repoId 1168134209, branch main), before.**

| Project | id | Root dir | Ignored build step | Build / output / install | Framework | Env var names |
|---|---|---|---|---|---|---|
| aivoiceagency | prj_l6TiUSFEOzAIzkplvxdbFtvkn1ZS | repo root | none | auto | none | none |
| aichauffeur | prj_EJPRBO2jy7r9MDOhXkd92mL02JZM | `chauffeur` | none | auto | none | none |
| ai100x | prj_ef7dgXCw7aHtXvwC5W1AmyW0ST4o | `ai100x` | none (the "affected projects" flag was on but it still built every push) | auto | none | none |

**b · Outside chauffeur/ that AIC used.** AIC-only: `tools/aic-*`, `tools/stamp_chauffeur.py`, `tools/ghl-aic-fields.mjs`, `tools/retell-aic-agent.mjs`, `tools/run7_aic_polish.py`, `tools/og/og-card.html`. Shared: `tools/sitemap_lastmod.py`, `tools/gate-pages.mjs`, `tools/validate_jsonld.py` (+ `tools/truth_audit.py`, which it imports), `scripts/llms-verify.mjs`, `scripts/stamp-sitemap.mjs` + `.githooks/pre-commit`, `scripts/sitemap-hygiene.mjs`, `scripts/indexnow-ping.mjs`, `scripts/brick.mjs` + `bricks/*/aic`, the chauffeur part of `tools/stamp.py`. Also `automation/try-webcall/` (the /try n8n mirror `tools/aic-try/receipt-test.mjs` reads), `.claude/skills/chauffeur-design` and the AIC loadout, the AI Chauffeur router lines, AIC docs, AIC board items, `reports/*aic*`.

**c · AVA side → chauffeur/.** 4 redirects (aivoiceagency.ai + www, `/chauffeur` and `/chauffeur/:path` → aichauffeur.ai) keep working: redirects run before files. 8 rewrites point into `/chauffeur/*.html`: 6 fire only for the aichauffeur.ai host (already on the other project, so dead before today), 2 (`/chauffeur`, `/chauffeur/`) are reachable only on the `*.vercel.app` host (now 404 there; the custom domain redirects first). No AVA page uses a chauffeur/ file; the root sitemap had none. **Breaks:** the AVA pre-commit hook read `chauffeur/sitemap.xml` on every commit (fixed in the same commit).

**d · Jobs on chauffeur/ paths.** No GitHub Actions; no n8n export in the repo and no Dell scheduled task reads or writes chauffeur/. The bricks press (`scripts/brick.mjs`, aic target → `chauffeur/answers/`) is run by hand from a PASTE. The Vercel account webhook → n8n "SEO — IndexNow daily" (gdFqOxFFVe13CfvX) fires per project and reads sitemaps over HTTP: unaffected.

## 1 · What moved (copied, not moved), and what stayed

**New repo, on top of the 110 split commits:** `f9a41be` tooling + CLAUDE.md + board + reports · `605c630` empty commit (first production build) · `dd7ea25` board proof · the commit carrying this report (also adds `automation/try-webcall/` and `automation` to `.vercelignore`).
- Paths fixed from `chauffeur/` to the repo root in every copied tool; the shared scripts now name aichauffeur.ai only.
- `tools/gate-pages.mjs` was not kept there: it is AVA's skin-verify page list. `tools/aic-write-*` were never committed in aivoiceagency, so there was nothing to copy.
- `.vercelignore` keeps every build input off the site: tools, scripts, bricks, reports, docs, automation, .claude, .githooks, .playwright-mcp, audits, hq, CLAUDE.md, README.md, .gitignore (plus DESIGN-SYSTEM.md as before). Proven: 12 of those paths 404 on preview and on production.
- `.claude/settings.json` + `loadout-guard.py` carry the `SKILLS:` law; `chauffeur-design` § 0 now describes the repo-root host.
- `git config core.hooksPath .githooks` is set in the Dell clone.

**aivoiceagency (`3a1e5e6`):** chauffeur/ → README; 33 AIC-only site tools removed: the aic-run5…14 gates, shots, probes and helpers, `aic-serve.mjs`, `aic-run10-faq-mirror.py`, `aic-run10-greps.py`, `stamp_chauffeur.py`, `run7_aic_polish.py`, `og/og-card.html`.
**Kept in aivoiceagency, and why:** `tools/aic-try/` (reads `automation/try-webcall`), `tools/aic-verify-slate.mjs` (GHL + n8n), `tools/aic-video/` (the shared `tools/video-kit` uses its calls), `tools/ghl-aic-fields.mjs` (GHL), `tools/retell-aic-agent.mjs` (Retell), and every shared tool. Shared tools changed by one line each so they keep working without chauffeur/: `scripts/stamp-sitemap.mjs` (the hook: otherwise every commit fails), `scripts/llms-verify.mjs` (aichauffeur.ai links now checked live), `scripts/sitemap-hygiene.mjs`, `tools/sitemap_lastmod.py`, `tools/gate-pages.mjs`. Still mentioning chauffeur/ and harmless: `tools/stamp.py` (prints "missing" for the old chauffeur pages), `tools/truth_audit.py` / `tools/run_a_truth_layer.py` (no chauffeur pages to read), `scripts/indexnow-ping.mjs` (reads live sitemaps). **`scripts/brick.mjs` still has the aic target writing `chauffeur/answers/` here: use the new repo's press.**
CLAUDE.md: the AI Chauffeur router row and § 8 point at the new repo.

## 2 · Vercel settings, before → after

| Project | Git | Root dir | Ignored build step | Domains | Production |
|---|---|---|---|---|---|
| aivoiceagency | aivoiceagency → aivoiceagency | root → root | none → `git diff --quiet HEAD^ HEAD -- ':(top)' ':(top,exclude)ai100x/'` | aivoiceagency.ai, www → apex, book.aivoiceagency.ai, aivoiceagency.vercel.app (unchanged) | dpl_3ona7W2NXV1Rb4LcUaA8AEGvd275 → dpl_EqK1EndtALuhozCdDrChtP7jvd9b |
| aichauffeur | **aivoiceagency → aichauffeur** | **`chauffeur` → root** | none → none | aichauffeur.ai, www → apex, aichauffeur.vercel.app (unchanged) | dpl_8J4cwnck5yCq2mxNNo2KsMH4Kk6Z → dpl_6foVXK583t6UPR79AP656kGjinja |
| ai100x | aivoiceagency → aivoiceagency | `ai100x` → `ai100x` | none → `git diff --quiet HEAD^ HEAD -- ':(top)ai100x/'` | ai100x.ai, www → apex, ai100x.vercel.app (unchanged) | dpl_ZWT184FFHF6Qsb7axanb6wmtNZdh (unchanged; skipped builds keep it) |

The ignored-build-step commands use `:(top)` because ai100x's root directory is `ai100x/` and Vercel runs the command there: a plain `-- ai100x/` would mean `ai100x/ai100x/` and skip every build. Both commands were proven in a throwaway repo (ai100x-only push: ai100x builds, AVA skips; root-only push: ai100x skips, AVA builds; both: both build). Env vars: none on any project, before or after.

## 3 · Gates in the new repo (before the cutover)

| Gate | Result |
|---|---|
| run14 (`node tools/aic-run14-gate.mjs --base http://127.0.0.1:8849`) | GATE PASS, 19 pages × 5 widths, all eight assertions |
| run14 extended (+ /pricing/, /compare/, /try/, 9 integration pages) | 1 finding, NO SKIP LINK on /try/: the same on the old repo and at HEAD before this run |
| `python tools/validate_jsonld.py` | 43 pages, 0 errors |
| `node scripts/llms-verify.mjs --local` | GREEN 146/146, links 41/41 |
| `python tools/aic-run10-faq-mirror.py --check` | 34 pages; the same 11 /answers/ drifts as the old repo (known tool limit) |
| `node scripts/stamp-sitemap.mjs --check` | the same 5 one-second lastmod drifts as the old repo (the known hook drift); left as is so sitemap.xml stays byte-identical |
| `node scripts/sitemap-hygiene.mjs` | 41 defects, identical set to the old repo's `--host=aichauffeur.ai` run |
| `python tools/truth_audit.py` | 43 pages, 14 defects, identical page by page to the old repo |
| `node tools/aic-try/receipt-test.mjs` | ALL 49 CHECKS PASS |

## 4 · Preview, then cutover

- Preview from the new repo's HEAD (`npx vercel@65.1.0 deploy`, not `--prod`, staged as `chauffeur/` because the project still had that root directory): `dpl_HaQQBPXt3FK2HkEiMAA3ihPqrmob` (an earlier preview, `dpl_69K3LKxJoG6QeNT4HwqTVfQtjsxU`, was staged with CRLF line endings by `git archive` + autocrlf and discarded).
- Preview vs production, 58 URLs (41 sitemap + /book/, /try/, /llms.txt, /llms-full.txt, /robots.txt, /sitemap.xml, the manifest, favicon, aic.css, aic.js, a font, both IndexNow key files + /terms.html, /privacy.html, /demo, /demo/ and a 404): same status, same bytes, same Cache-Control and redirects. Every difference explained: `X-Robots-Tag: noindex` that Vercel adds to every preview; the Vercel Toolbar script it injects into preview HTML on `/`; the 404 body's request id.
- Rollback point written down before the switch: `dpl_8J4cwnck5yCq2mxNNo2KsMH4Kk6Z` (4b79933).
- Switch: `vercel git connect https://github.com/shanehandel-504/aichauffeur.git --yes`, then root directory → null (Vercel API). Domains checked right after: unchanged, site 200 throughout.
- Empty commit `605c630` → `dpl_9LLRe7E571y7nzS8CW35HG4N6VnU` READY within seconds, aliased to aichauffeur.ai and www.
- Old production (its immutable URL) vs new production on aichauffeur.ai: 58/58 byte-identical; `/trip` and `/hq` keep `X-Robots-Tag: noindex, nofollow, noarchive`; www 308 → apex; 12 build-input paths 404; `/book/` loads the calendar frame at 1440 and shows the button at 320/390; 0 console errors on / and /pricing/ at 320, 390 and 1440 in Chromium and WebKit.

## 5 · Proof pushes

| Push | aivoiceagency | ai100x | aichauffeur |
|---|---|---|---|
| `3a1e5e6` (aivoiceagency, chauffeur/ out) | dpl_ADqH2kyT4Ta8cUuFHzMTuM5CKLYY READY | dpl_Aethq6tLqAQbaxsfrhxsyXZ5kqK4 CANCELED (ignored build step) | none |
| `9ccc51b` (aivoiceagency, board only) | dpl_EqK1EndtALuhozCdDrChtP7jvd9b READY | dpl_EgZPoEghbdjMFFNEdV7WqT257cHi CANCELED (ignored build step) | none |
| `dd7ea25` (aichauffeur, board only) | none | none | dpl_6foVXK583t6UPR79AP656kGjinja READY |

A skipped ai100x push still shows as a CANCELED deployment record; nothing is built or stored for it.

## 6 · Rollback

1. Instant, site only: promote `dpl_8J4cwnck5yCq2mxNNo2KsMH4Kk6Z` on project aichauffeur (Vercel → aichauffeur → Deployments → … → Promote, or `request_promote`).
2. Full: in aivoiceagency `git revert 3a1e5e6` and push (chauffeur/ and the tools come back); then `npx vercel@65.1.0 git connect https://github.com/shanehandel-504/aivoiceagency.git --yes` from a folder linked to aichauffeur, and set its root directory back to `chauffeur`.
3. Builds: clear the ignored build step on aivoiceagency and ai100x (Settings → Git → Ignored Build Step, or set `commandForIgnoringBuildStep` to null).
The new repo can stay as it is; nothing in it is served unless the project points at it.

## SHANE READBACK

```
===== SHANE READBACK — COPY ALL =====
WHAT HAPPENED
- AI Chauffeur now has its own repo: shanehandel-504/aichauffeur (private).
  aichauffeur.ai builds from it. Every page is byte for byte what it was.
- The AVA repo no longer carries the AI Chauffeur site (chauffeur/ is one
  README line). A push to the AVA repo builds aivoiceagency.ai only; ai100x
  builds only when something in ai100x/ changes. A push to the AI Chauffeur
  repo builds aichauffeur.ai only. That stops the triple builds that filled
  Vercel storage.

WHERE EACH SITE LIVES NOW
- aichauffeur.ai: github.com/shanehandel-504/aichauffeur
  On the Dell: C:\Users\offic\Desktop\aichauffeur
- aivoiceagency.ai (and ai100x.ai): github.com/shanehandel-504/aivoiceagency
  On the Dell: C:\Users\offic\Desktop\aivoiceagency

HOW TO START A CLAUDE CODE SESSION
- AI Chauffeur work: open Claude Code in C:\Users\offic\Desktop\aichauffeur.
  It has its own CLAUDE.md, gates and board.
- AVA work: open Claude Code in C:\Users\offic\Desktop\aivoiceagency.
- Two sessions, one in each folder, no longer touch each other.

DONE
| Item | Before | After | Live |
| New repo | none | shanehandel-504/aichauffeur, full history | yes |
| aichauffeur project | built from the AVA repo's chauffeur/ | builds from the new repo | yes, 58/58 pages identical |
| AVA repo chauffeur/ | 118 files | one README | yes, AVA site unchanged |
| ai100x builds | every push | only ai100x/ changes | yes, skipped twice |
| AVA builds | every push | skips ai100x-only pushes | yes |
| Proof pushes | - | each repo builds only its own site | yes |

STILL POINTS AT THE OLD PLACE
- The bricks press in the AVA repo (scripts/brick.mjs) still writes AIC answer
  pages into the AVA repo, where they no longer deploy. Use the new repo's press.
- PASTE files, loaders and claude.ai project docs that name chauffeur/ paths in
  the AVA repo.
- n8n: nothing reads repo paths. The IndexNow job reads the live sitemaps and
  the Vercel webhook is per project, so both keep working.
- Claude Code memory lives per folder: a session in the new folder starts with
  none of the AIC notes kept for the AVA folder.

IDS / ROLLBACK
- New prod: dpl_9LLRe7E571y7nzS8CW35HG4N6VnU (605c630), now dpl_6foVXK583t6UPR79AP656kGjinja.
- Old prod to promote back: dpl_8J4cwnck5yCq2mxNNo2KsMH4Kk6Z.
- Full undo: git revert 3a1e5e6 in the AVA repo, reconnect the aichauffeur
  project to shanehandel-504/aivoiceagency with root directory chauffeur,
  clear the two ignored build steps.

NEXT
- Claude: point the bricks job and the loaders at the new repo, then run the
  AIC cleanup in the new repo.

GOTCHAS
- The Vercel CLI login on the Dell (not Doppler) did the Vercel work; Doppler
  has no Vercel token.
- A skipped ai100x push still shows as a CANCELED deployment. That is the skip.
- Default runs of a few shared AVA tools needed the moved host taken out
  (the pre-commit hook would have blocked every AVA commit); each change is one line.
- /try/ on aichauffeur.ai has no skip link. It is older than this run.
- llms-verify --local on the AVA repo prints GREEN, then Node hits a Windows
  exit assertion (exit 127). Live mode exits 0.
```
