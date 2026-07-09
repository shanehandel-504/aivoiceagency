# SATELLITE SWEEP + FUNNEL WIRE — Report (2026-07-10)

**RUN INCOMPLETE** — the ai100x half is LIVE + verified; the chauffeur one-pass and transportation cluster are specced but **not shipped** (deliberately deferred so the first-ever public pricing page isn't rushed). Nothing half-built was pushed.

## DONE (live + verified)

| # | Shipped | Live proof |
|---|---------|-----------|
| 1 | **ai100x.ai operator-story landing** at root (aivoiceagency `ai100x/index.html`): hero "30 years an operator. 25 in phone rooms.", the operator's AI stack, two spoke cards → AI Voice Agency "Put AVA on my line" + AI Chauffeur "Scope your dispatch build", prismatic accent, network strip, dormant Tracking Spine v2, full SEO/JSON-LD. 414-only. | `ai100x.ai/` → 200, title "AI100X — The Operator's AI Stack", "30 years an operator" present |
| 2 | **Cockpit moved → `ai100x/cockpit/`** (functionally untouched) | `ai100x.ai/cockpit/` → 200, "100X · Cockpit" |
| 3 | **`/intake` removed from sitemap.xml** (stays noindex — onboarding form, not discovery) | sitemap grep count = 0; `/intake` still 200 |
| 4 | **GH Pages `shanehandel-504/ai100x` 786 purge** → 414-240-8930 (10 spots: meta/OG/Twitter/JSON-LD/status-bar/CTA) | pushed `21b8f6b`; repo grep-clean of 786 |
| — | Commits: aivoiceagency `0aa1f16`; ai100x GH repo `21b8f6b` | |

## KEY FINDING (resolved with founder)
ai100x.ai is served by **Vercel from `aivoiceagency/ai100x/`**, NOT the GitHub Pages `shanehandel-504/ai100x` repo (DNS points at Vercel; the GH repo's CNAME is dormant). So: the live 786 exposure was **only in the dormant GH repo** (now fixed anyway); the live landing had to go in the Vercel-served folder — which is what shipped. GH Pages repo left dormant per founder.

## REMAINING (specced, ready for a fast careful pass)

### A. Chauffeur one-pass — `chauffeur/index.html` (aichauffeur.ai)
- **Pricing section (NEW, public):** Dispatch Intake **from $1,997/mo + $2,500 setup min** · Full Dispatch Engine **from $2,997/mo + $5,000 setup min** · **+ voice usage** · scope note (call volume, rate rules, dispatch-software access, payment flow, human-handoff point). Insert a `#pricing` section between `#features` (l.516) and `#crush` (l.550).
- **Dispatcher line 414-775-0019 prominent** ("Call the dispatcher AVA runs") — add to nav + hero (page currently has no phone).
- **Funnel CTAs → absolute `https://aivoiceagency.ai/intake` + `/book`:** replace the 5 GHL leadconnector booking URLs (nav l.307, hero ghost l.322, crush l.556, setup l.574, footer l.628) → `/intake`; add `/book` as the secondary "book a call". Keep "See the live demo" → `/demo/`.
- **SEO:** add `og:image` + full Twitter card (missing); add **LocalBusiness + Service** JSON-LD (currently only Organization + FAQPage).
- **Bug fix:** `--green` is used (`.live-badge`, `.badge-green` l.102/103/115) but **undefined in `:root`** → add `--green:#34D399`.
- **Footer:** replace `.foot-mesh` (currently AVA + AI100X only) with the canonical **network strip** (AI Voice Agency · AI Chauffeur · AI100X) + **dormant tracking** + `data-tracking="off"` on `<html>`.

### B. Transportation cluster (hub) — `ground-transportation/`, `wisconsin-limo/`, `transportation/`
- **Reframe:** dispatch = a CUSTOM intake build → **primary CTA "Scope your dispatch build" → `https://aichauffeur.ai/`**; **secondary → `/book`**.
- **`ground-transportation`:** kill the ONE fossil line — `// Demo mode — real call wiring lands next push.` (l.170) — the widget is ALREADY wired live to the n8n `/ava-call` webhook with a TCPA block, so the caption is false. Keep the widget + TCPA (never remove); fix caption to truthful copy.
- Add the canonical **network strip** + **dormant tracking** + `data-tracking="off"` to all three.
- `transportation/` is a dead 308→/ground-transportation redirect; apply the same treatment for consistency (low priority).

### Canonical shared blocks (already proven on the ai100x landing — reuse byte-identical)
- **Network strip:** self-contained inline-styled `<nav>` linking AI Voice Agency · AI Chauffeur · AI100X (all three, same order).
- **Dormant tracking:** `<script>` gated on `<html data-tracking="off">` — early-returns, fires ZERO requests; GA4 + Meta Pixel with TODO id markers; flip `data-tracking="on"` + set IDs to light every site at once.

## QA still owed (on the remaining pages)
Schema validates · Lighthouse sanity · every CTA resolves · **chauffeur pricing NEVER on the hub** (the hub + ai100x landing are already clean of chauffeur $ figures) · zero 786/305/480 · she/her 0 · $ match Master Sheet v3 (hub already synced by the sales-infra run).

## Rollback
- aivoiceagency (ai100x landing + cockpit move + sitemap): `git revert 0aa1f16 && git push` (Vercel redeploys; cockpit returns to root).
- ai100x GH repo 786 fix: `git revert 21b8f6b` in `shanehandel-504/ai100x` (dormant — low impact).
