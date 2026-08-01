# aichauffeur.ai — how this host actually works

**Written during AIC SITE RUN 1 "OPERATOR CUT" · 2026-08-01.**
This file exists because the deploy topology here is genuinely surprising and cost this run
most of its discovery time. Read it before touching anything under `chauffeur/`.

`docs/` is in `.vercelignore` and sits outside the chauffeur root, so this file is never deployed.

---

## The one fact that governs everything

**`aichauffeur.ai` is a SEPARATE Vercel project, not a path on the AVA site.**

| | |
|---|---|
| Project | `aichauffeur` |
| Project ID | `prj_EJPRBO2jy7r9MDOhXkd92mL02JZM` |
| Team | `team_lnYiCQUX106u9Ak0EnQLAEng` (shanehandel-504's projects) |
| Git source | `shanehandel-504/aivoiceagency` @ `main` — the SAME repo |
| **Root Directory** | **`chauffeur/`** |
| Domains | `aichauffeur.ai`, `www.aichauffeur.ai` |

One push to `main` deploys **both** projects: `aivoiceagency` (root `/`) and `aichauffeur`
(root `/chauffeur/`).

### What follows from that

- `chauffeur/index.html` → `https://aichauffeur.ai/`
- `chauffeur/<slug>/index.html` → `https://aichauffeur.ai/<slug>/` — **automatically. No rewrite needed.**
- `chauffeur/robots.txt` → `https://aichauffeur.ai/robots.txt`
- `chauffeur/vercel.json` is the **only** config this host reads.

### The trap

**The repo-root `vercel.json` is NEVER read by the aichauffeur project.**

The root `vercel.json` still contains host-conditional rewrites for `aichauffeur.ai`
(`/:path*` → `/chauffeur/index.html`, plus `/demo`). Those are **dead config**. They look
authoritative and they do nothing. Proof, measured on production before this run:

```
aichauffeur.ai/nonsense        404   <- the "catch-all" rewrite never fired
aichauffeur.ai/demo/index.html 200   <- only possible if root IS chauffeur/
aichauffeur.ai/llms.txt        404   <- repo-root file, unreachable
aichauffeur.ai/robots.txt      404
```

Every repo-root path 404s on this host. That is the signature.

### What that broke (all fixed in RUN 1)

`chauffeur/index.html` linked `/assets/circulant.css` and `/audio/demos-v2/maxim-v2.mp3`;
`chauffeur/demo/index.html` linked 22 audio files. All were repo-root paths. **All 404'd in
production.** Consequences:

1. `circulant.css` defines `--gx-fill`, `--gx-line`, `--gx-edge` and `--green`. With the file
   missing those custom properties were undefined, so every `background: var(--gx-fill)` and
   `border: 1px solid var(--gx-line)` was *invalid at computed-value time* — **every card on
   the live homepage rendered transparent and border-less.**
2. Every audio button was wired to a 404. The homepage's "tap to retry" label was not a UX
   choice; it was `audio.play()` rejecting because the file did not exist.
3. 11 of the demo page's 22 `<audio>` elements pointed at files that exist **nowhere in the
   repo** and had zero consumers in `scenarioAudioMap` / `transcriptAudioMap`.

**Fix:** assets are now duplicated under the chauffeur root —
`chauffeur/assets/`, `chauffeur/audio/`, `chauffeur/fonts/`.

> If you add an asset to a chauffeur page, it must live under `chauffeur/`.
> A repo-root path will pass local review and 404 in production.

---

## Verifying locally the way Vercel actually serves it

Serving the repo root hides every one of these bugs. Serve `chauffeur/` as the web root:

```bash
python -m http.server 8848 --directory chauffeur
```

`.claude/launch.json` has this as the **`aichauffeur-static`** configuration.

---

## Two sites, not one

`aivoiceagency.ai` and `aichauffeur.ai` are separate brands and separate search properties.

- Each host has its own `robots.txt` and `sitemap.xml`.
- The AVA sitemap contains **zero** `/chauffeur/` URLs. Keep it that way.
- No page on either host canonicals to the other. Verified 2026-08-01.
- Cyan is the AVA parent brand; AI Chauffeur currently ships cyan too. The brand direction in
  CLAUDE.md § 8 (leather-black / amber / bow-tie mark) is **not** on the wire yet.

## Shared page assets

| File | Used by |
|---|---|
| `chauffeur/assets/aic.css` | every chauffeur page **except** `/` and `/demo/` |
| `chauffeur/assets/aic.js` | every chauffeur page **including** `/` |
| `chauffeur/assets/circulant.css` | `/` and the pages that load `aic.css` |

`aic.js` holds the **only** copy of the `ava-call` webhook URL. Swap it once there, never per-page.

`/` and `/demo/` keep their own embedded `<style>` — they carry console machinery the content
pages do not need, and they were already working. Rebuilding them onto `aic.css` was judged more
risk than value during RUN 1.
