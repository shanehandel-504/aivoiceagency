# CLAUDE.md — Repo Context for Claude Code

Auto-read at every Claude Code session. Do not delete.

## STACK
- Vanilla HTML/CSS/JS only
- NO React, Tailwind, npm, Framer, build systems
- THREE.js r128 via CDN only (do not upgrade)
- Single-file architecture (CSS + JS embedded in HTML)
- Use str_replace for edits, never full-file rewrites
- Vercel auto-deploys from main branch
- Repo: shanehandel-504/aivoiceagency
- Domain: aivoiceagency.ai (parent, Cyan) / aichauffeur.ai (vertical, Electric Blue)
- Personal Cockpit lives at /cockpit/ (do not surface in main nav)

## DESIGN SYSTEM — AIChauffeur
- Background: #06080F (deep void, near-black)
- Text: #EEF2FA (never pure white)
- Primary accent: #3B82F6 (Electric Blue)
- Bright accent: #60A5FA
- Display: Instrument Serif (italic for emphasis)
- Body: Inter
- Mono: JetBrains Mono
- KILLED: brown, gold, lime, matrix green, pure white text

## DESIGN SYSTEM — AVA parent (homepage / = index.html + /assets/funnel.css)
- Void bg #0A0A0F · panel #10131A · line #23232E
- Text #EEF0F4 · dim #9AA1AD (never pure white)
- --cyan #00D4FF (active --cyan-2 #00E5FF) — the ONE brand accent
- --live #00E676 — semantic GREEN: live/on-call dots, success states, receipt checks, pulse rings. GREEN = live/success ONLY (paper-safe variant #0a9d57 on white receipts)
- --gold #D4A94E — pricing scope note ONLY
- Font: Space Grotesk
- GLOW GATE (P1 perf pattern): decorative + pulse animations are gated behind `body.glow-ready`, added on window `load` in funnel.js so they never compete with the LCP paint. Any new decorative motion MUST sit behind this gate, be zero-layout-shift (transform / opacity / shadow only), and be reduced-motion-safe. Keep LCP <=400ms, CLS 0.00.

## HOMEPAGE ANALYTICS — [data-event] beacons
Fired on click by funnel.js (no-op if window.va absent). Current set:
- tel_tap_nav · tel_tap_hero · hear_ava_nav · hear_ava_hero · book_click_hero
- call_me_submit_pod · call_me_submit_gate · book_click_gate
- sticky_talk_ava · book_click_sticky · book_click_footer
- Add a data-event on every new CTA; keep names verb_noun_location.

## PRICING (surface only when asked)
- Starter: $497/mo + $500 setup
- Pro: $997/mo + $1,500 setup
- Enterprise: $1,997/mo + $2,500 setup
- White Glove: by application

## PHONE — public number 414-240-8930 only
- 414-240-8930 — the public AVA line (voice CTAs, schema, footer). The ONLY voice number in marketing copy.
- Private numbers (personal cells, internal/routing lines) NEVER in the repo or commits.
- SMS: 350-220-5305 is the published text-us line (footer only).
- 305-315-6562 retired — do not surface.

## PUSH DISCIPLINE
- One push = one complete unit of work, not one tweak
- Hard cap: 5 pushes per hour
- Local preview FIRST (double-click .html in Windows Explorer)
- Before any push: have I batched all related changes?
- Publish-always: finish the unit, push it live, end with a DONE table (what shipped) + the production URL. If it is NOT live, first line = "RUN INCOMPLETE — what / why / next step" in caps.

## FORBIDDEN WORDS
- "locked" / "locked in" — use "set" or "decided" in our own copy (natural booking language is OK inside clearly-labeled sample call dialogue)
- "she" / "her" for AVA — always "AVA" by name
- "Certainly!" / "Great question!" / "I understand"
- "booked" / "confirmed" / "payment required" / "guaranteed" — banned in marketing CLAIMS about AVA's service; natural booking language IS allowed inside clearly-labeled sample call dialogue

## GUARDRAILS
- No fake proof, ROI, testimonials until verified
- No keys in code or commits — keys live in Drive AICHAUFFEUR KEYS doc
- Don't pitch Billy at Jet Limousines or Chris at Chauffeur Driven until
  Wisconsin operators validate AVA on real calls
- Demo language: captured / routed / dispatcher will confirm

## AUTOMATION
- Drip engine = n8n. The 7-day follow-up runs on n8n, NOT GHL workflows.
- Email/SMS drip templates path: authored inside the n8n drip workflow (not committed to this repo).
- Live-call lead form posts to the n8n `ava-call` webhook (funnel.js).

## VERTICAL POSITIONING
- First vertical: corporate transportation (limo, NEMT, charter, black car)
- Validation gate: Wisconsin operators must validate before broader pitches
- Voice samples: Maxim Limousine + Acme Plumbing (real, recorded)
- Riverside Medical sample currently shows placeholder — fix or delete

## OUTPUT FORMAT
- Traffic lights: green / yellow / red action / consider / stop
- Tag markers: [CREATIVE] [SPEC] [INNOVATION] [META]
- Every response ends with: how could this prompt be better?
- Solution first, zero filler, developer-grade output only

## CONTROL PHRASES
- SHIP IT → execute per Shipping Protocol
- SCOPE THIS → write the full diff plan before any edit
- BATCH IT → consolidate pending edits into one commit
- 100X MODE → max output, no filters
- FULL AUTHORITY → execute without asking
