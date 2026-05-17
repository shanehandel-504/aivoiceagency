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

## DESIGN SYSTEM — AVA parent
- Background: #0A0A0F
- Text: #EEF0F4
- Accent: #00D4FF (Cyan, active #00E5FF)
- Font: Space Grotesk

## PRICING (surface only when asked)
- Starter: $497/mo + $500 setup
- Pro: $997/mo + $1,500 setup
- Enterprise: $1,997/mo + $2,500 setup
- White Glove: by application

## PHONE NUMBERS
- 305-315-6562 — public business number (on website + marketing)
- 786-937-1218 — Twilio/Retell demo line (NEVER public-facing)

## PUSH DISCIPLINE
- One push = one complete unit of work, not one tweak
- Hard cap: 5 pushes per hour
- Local preview FIRST (double-click .html in Windows Explorer)
- Before any push: have I batched all related changes?

## FORBIDDEN WORDS
- "locked" / "locked in" — use "set" or "decided"
- "she" / "her" for AVA — always "AVA" by name
- "Certainly!" / "Great question!" / "I understand"
- "booked" / "confirmed" / "payment required" / "guaranteed" in demo copy

## GUARDRAILS
- No fake proof, ROI, testimonials until verified
- No keys in code or commits — keys live in Drive AICHAUFFEUR KEYS doc
- Don't pitch Billy at Jet Limousines or Chris at Chauffeur Driven until
  Wisconsin operators validate AVA on real calls
- Demo language: captured / routed / dispatcher will confirm

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
