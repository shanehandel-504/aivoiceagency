# RUN 4.6 — SITEMAP TRUE-UP + GHL DRIP EXPORT (read-only)

**Date:** 2026-07-25 · **Sitemap commit:** 839d123 (LIVE) · **Board flip:** staged, uncommitted (shell blocked)

> Drip message copy is intentionally NOT in this file (rail: do not commit drip copy to the public repo).
> The full read-only export lives at `C:\Users\offic\ava-exports\2026-07-25-ghl-drip-export.md` (outside the repo).

## Block A — Sitemap true-up (LIVE ✅)
- Added `https://aivoiceagency.ai/backstage/` (indexable, self-canonical, live 200).
- Verified all 58 prior URLs live 200 — none dead, none removed.
- Refreshed every `<lastmod>` forward-only to each page's real git last-change date → 59 URLs, all 2026-07-25.
- **/chauffeur excluded** (Shane's call): 308-redirects cross-domain to aichauffeur.ai and self-canonicals there.
- Exclusions confirmed absent: /intake, /ctr-report, /hq, /booked, /ad-stage, /backstage/theater.
- **Live proof:** `curl https://aivoiceagency.ai/sitemap.xml` → 200, 59 `<loc>`, /backstage/ present, /chauffeur absent.
- Gotcha: `/overview` is served via a vercel rewrite to `overview.html` (not `overview/index.html`).

## Block B — GHL drip export (export DONE ✅ · Notion post BLOCKED ❌)
- GHL location `sdShCZCaxce8DHKbYcIl` (matches Doppler `GHL_LOCATION_ID`); `GHL_PIT` present, used only via env.
- Listed all **8 GHL workflows** via v2 `/workflows/`.
- GHL public API exposes only the workflow **inventory** — `GET /workflows/{id}` 404s; templates/campaigns/snippets/customValues all empty. Step message bodies are not API-retrievable.
- Actual drip copy is authored in **n8n**; exported read-only from: Drip Engine v1 `Pu661B1J1ZgezJT7` (16 sends D0–D7), Booking Receipt `NMSWFtcyEQhSypSx`, Post-Call `6r8YHuMEJbxeDyT5`.
- Full export written to local file (path above). No secrets; no banned 305/480/786 numbers; only published 350-220-5305 / 414-240-8930 lines.
- **Notion post (step 7): BLOCKED** — the Notion Run Reports Inbox write was denied twice by the harness auto-mode safety classifier ("could not evaluate this action … earlier conversation content"). Not an action-correctness failure.

## Blocked by harness safety gate (needs Shane)
1. Notion post of the run report / export → paste the local file into the inbox, or approve the Notion connector.
2. `git commit`/`push` of the board.json flip (+ this report) → shell tool calls are gated this session.

## Rollback
- Sitemap: `git revert 839d123`.
