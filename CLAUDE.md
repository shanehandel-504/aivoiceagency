# AI Voice Agency — CLAUDE.md
# CIRCULANT SYSTEMS | aivoiceagency.ai
# Version: 1.0 | April 14, 2026

## Project Overview
AI Voice Agency (AVA) — done-for-you AI voice agent service for businesses.
Live at aivoiceagency.ai. Deployed via Vercel from this repo (main branch).
Vanilla HTML/CSS/JS + THREE.js r128 via CDN. No frameworks. No build systems.

## Tech Stack
- Vanilla HTML5, CSS3, JavaScript (ES6+)
- THREE.js r128 via CDN (https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js)
- Hosted on Vercel (auto-deploys from main branch)
- Domain: aivoiceagency.ai
- NO React. NO Tailwind. NO npm. NO build tools. NO Framer.

## Design System — CIRCULANT (Locked)
- Background: #0A0A0F (never pure black)
- Text: #EEF0F4 (never pure white)
- Accent: #00D4FF (cyan — active states #00E5FF)
- Font: Space Grotesk (300/400/600/700)
- Gold #FFB800 is reserved for ResumeReady only
- One accent color per site. No gradients with other hues.
- No generic AI aesthetics.

## Deployment
- Repo: shanehandel-504/aivoiceagency (main branch)
- Vercel teamId: team_lnYiCQUX106u9Ak0EnQLAEng
- Vercel projectId: prj_l6TiUSFEOzAIzkplvxdbFtvkn1ZS
- Push to main = auto-deploy. No manual steps.

## Phone Numbers
- 305-315-6562 — BUSINESS number (on website and marketing)
- 786-937-1218 — Twilio/Retell demo/R&D line (NEVER public-facing)

## Pricing (Locked)
- Starter: $497/mo + $500 setup
- Pro: $997/mo + $1,500 setup
- Enterprise: $1,997/mo + $2,500 setup
- White Glove: By application

---

## Behavioral Rules (Karpathy-derived)

### 1. Manage Confusion — Don't Assume
- State assumptions explicitly before writing code.
- If uncertain about intent, ASK. Do not guess.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so.
- Push back when warranted.
- If something is unclear, STOP. Name what's confusing. Ask.

### 2. Simplicity — Minimum Viable Code
- Write the minimum code that solves the problem. Nothing speculative.
- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- If you write 200 lines and it could be 50, rewrite it.
- Ask: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes — Don't Break What Works
- ALWAYS use str_replace for edits. NEVER rewrite full files.
- Do not change or remove comments, code, or markup unrelated to the task.
- Do not refactor code that is orthogonal to the current task.
- If a change risks side effects, flag it before making it.
- Treat every line you didn't write as load-bearing until proven otherwise.

### 4. Goal-Driven Execution
- Focus on verifiable success criteria, not process.
- After making changes, verify they work (check syntax, test if possible).
- If stuck in a loop, stop and reassess rather than trying variations.
- State what "done" looks like before starting.

---

## Project-Specific Rules

### Editing
- Use str_replace ONLY. Never rewrite full files. This burns token limits fast.
- Test changes mentally before applying — will this break the live site?
- One concern per edit. Don't combine unrelated fixes.

### File Structure
- index.html is the main site file
- All CSS is embedded in index.html (single-file architecture)
- All JS is embedded in index.html
- Signal/orb code uses THREE.js r128 — do not upgrade or change the CDN version

### What NOT to Do
- Do not add npm, package.json, or any build system
- Do not convert to React, Vue, Svelte, or any framework
- Do not add Tailwind or any CSS framework
- Do not use she/her pronouns for AVA — always say "AVA" by name
- Do not add any gold (#FFB800) — that color is reserved for ResumeReady
- Do not touch the THREE.js orb/signal code unless specifically asked
- Do not change phone numbers without explicit confirmation

### CTA Links
- Primary CTA: https://api.leadconnectorhq.com/widget/booking/aCIv7rUnCGrysobt6Mlg
- Do NOT use cal.com links — those are deprecated

---

## Important Files
- `index.html` — Main site (single-file, all CSS/JS embedded)
- `privacy.html` — Privacy Policy
- `terms.html` — Terms of Service
- `robots.txt` — Search engine crawl rules
- `sitemap.xml` — Sitemap for Google Search Console
