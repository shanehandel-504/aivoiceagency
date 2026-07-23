# CLAUDE.md — THE FACTORY LINE

Auto-read at every Claude Code session. Do not delete.
This file is the repo's design brain. When anything else disagrees with it, this file wins.

## § 0 · PRECEDENCE

1. **Shane, in this conversation.** A direct instruction beats every line below.
2. **This file.** CIRCULANT wins every conflict — with skills, with harvested rulebooks, with your own taste.
3. **Skills** (`.claude/skills/`) — how to work. See § SKILL STACK.
4. **Default model behavior** — last.

Freeze beats everything except an explicit un-freeze from Shane (§ POLISH FREEZE).

---

## § 1 · ENGINE PIPELINE

Strict order. Every build task. No skipping, no reordering, no "this one is simple."

| # | Stage | Skill | Gate — do not advance until |
|---|---|---|---|
| 1 | **Grill** | `grill-me` / `grilling` | Intent is unambiguous. Cross-examine objectives one question at a time, each with your recommended answer. Look up *facts* yourself (filesystem, git, live site); put *decisions* to Shane. **No code before shared understanding.** |
| 2 | **Map** | `superpowers` (`brainstorming` → `writing-plans` → `subagent-driven-development` / `dispatching-parallel-agents`) | An execution map exists: task split, subagent boundaries, and a test plan with named verification commands. |
| 3 | **Reason** | `ui-ux-pro-max` | Layout + typography reasoning done — spacing scale, grid, fold order, hierarchy, touch targets, motion timing. **PHYSICALLY BOUND to § 2**: its palette, font, radius, and stack output is DISCARDED on sight. |
| 4 | **Strip** | `taste` + `frontend-design` | AI-slop defaults removed: generic gradients, badge rows, template card grids, stock-illustration energy, centered-hero-over-mesh, numbered 01/02/03 markers that encode nothing. |
| 5 | **Self-review** | `verification-before-completion` | Rendered at **390×844 AND desktop**. Checked: fold, contrast, spacing, broken tags, console errors, horizontal overflow. Defects fixed. **Then** commit. |

**One pass, zero manual polish rounds.** Step 5 is not optional and is not "I looked at the code."
It means the page was actually rendered and actually inspected. Evidence before assertions.

---

## § 2 · CIRCULANT TOKENS

The canonical palette for every **new** surface. Verified AA — measured, not assumed.

### Dark (default)

| Role | Hex | On void | On panel |
|---|---|---|---|
| Background (void) | `#0A0A0F` | — | — |
| Panels | `#12121A` | — | — |
| Line / hairline | `#23232E` | border only | border only |
| Text | `#EEF0F4` | 17.31:1 ✓ | 16.33:1 ✓ |
| Muted | `#7E8299` | 5.21:1 ✓ | 4.92:1 ✓ |
| Accent | `#00D4FF` | 11.16:1 ✓ | 10.52:1 ✓ |

### Semantic — meaning, never decoration

| Role | Hex | Means | Contrast |
|---|---|---|---|
| Booked-Green | `#2EE6A8` | live · success · captured · on-call | 12.23:1 ✓ |
| Amber | `#FFB020` | warning · mixed · partial | 10.80:1 ✓ |
| Miss-Red | `#FF3B4E` | missed · at-risk · lost | 5.63:1 ✓ |
| Neutral | `#8A93A6` | inactive · not-yet · n/a | 6.40:1 ✓ |

A semantic color may only appear when its meaning is literally true on screen. Green is never
"a nice green." Red is never "an attention color."

### Light mode

| Role | Hex | Contrast on Paper |
|---|---|---|
| Paper | `#F7F8FA` | — |
| Ink | `#14161C` | 17.02:1 ✓ |
| Deep Cyan | `#0090C8` | **3.39:1 — LARGE-TEXT / UI-COMPONENT ONLY** |

**Deep Cyan is not a body-copy color.** ≥24px, or ≥18.66px bold, or a non-text UI element
(border, icon, control). For body-weight links on Paper, use Ink with an underline.

### Type

**Space Grotesk only.** No second family, no display pairing, no serif accent. Weights 300 / 400 / 600 / 700.

### `line` token note

`#23232E` is carried forward from the live system and is **required**, not optional: § 3 bans
shadows and elevation, so a hairline rule is the only device left that separates a panel from the
void (panel-on-void is 1.06:1 — invisible without it).

### Legacy ledger — what's already live

55+ stamped pages ship the pre-X values and are under § POLISH FREEZE. **Do not mass-recolor.**

| Legacy | CIRCULANT-X | Rule |
|---|---|---|
| panel `#10131A` | `#12121A` | New surfaces use X. Existing pages keep legacy until that page is rebuilt. |
| dim `#9AA1AD` | muted `#7E8299` | ″ |
| `--live #00E676` | Booked-Green `#2EE6A8` | ″ |
| gold `#FFB800` = money | **BANNED** (§ 3) | Never in a new build. Remove existing instances only when that page is already being touched — never as a sweep. |
| violet `#8B5CF6` = badge | **BANNED** (§ 3) | ″ |

The old **ACCENT LAW** (cyan=brand · green=live · gold=money · violet=badge) is **SUPERSEDED** by
this section for new work, and remains an accurate description of what is currently on the wire.

---

## § 3 · DESIGN CONSTRAINTS

- **Flat UI.** No shadows, no elevation ladders, no glassmorphism, no skeuomorphic depth. (Existing nav glass is grandfathered — nav only.)
- **Sharp 90° corners.** `border-radius: 0`.
- **Vast negative space.** Section rhythm ≥96px desktop / ≥48px mobile. Whitespace is the layout, not the leftover.
- **60-30-10 balance.** 60% void, 30% panel/structure, 10% accent. Accent is a seasoning.
- **AA contrast 4.5:1** on all body text. Verified, not eyeballed.
- **Max 2 accents per section.** (Tighter than the old 3-per-screen rule.)

**BANNED, no exceptions:**
multi-hue gradients · badges / pills-as-ornament · rounded template cards · floating decorative orbs ·
the color gold on AVA surfaces · emoji used as icons · placeholder-only form labels · removed focus rings.

---

## § 4 · HARD LAWS

- **Vanilla HTML/CSS/JS only.** No React, Tailwind, npm, Framer, build systems. THREE.js r128 via CDN only — do not upgrade.
- **Mobile-first.** Every build gets a **390×844** fold check before it is called done.
- **AVA is never "she" or "her."** Always "AVA," by name.
- **"locked" / "locked in" is banned** in our own copy — use "set" or "decided." (Natural booking language is fine *inside* clearly-labeled sample call dialogue.)
- **No fabricated stats, testimonials, metrics, ROI, or proof.** Ever. If it isn't sourced or recorded, it doesn't ship. Sourced set in use: AgentZap 47% / 73%-higher · ServiceTitan 10–14.1% · ~50→~3 shops 2PM-vs-2AM.
- **Pricing surfaces anchor on $497.** Never "100 free minutes." Never a free-trial claim.
- **Grade 5–7 readability** on all public copy. Zero jargon. A plumber reads it at 2AM on a cracked phone screen.

---

## § 5 · PROTECTED ANCHORS

Verbatim. Never touch without a CEO order. Verified locations as of 2026-07-22:

| # | Anchor | Status |
|---|---|---|
| A1 | `3AM. Google Was Listening.` | **LIVE** — `/lsa` `<title>` + OG/meta. On-page H1 reads "Your phone went to voicemail. *Google was listening.*" |
| A2 | `Every missed call hands the job to the next name on the map →` | ⚠ **RESERVED — NOT PRESENT IN REPO.** Protected as future hero copy. Do not invent a variant; use this string exactly when the slot is built. |
| A3 | `One call. Sixteen agents.` | **LIVE** — `index.html:148` (`.bs-theater-sub`), also `/watch`, `/staging/xray`. |
| A4 | `AVA answers calls and books jobs.` | **LIVE** — `index.html:115` (homepage `<h1>`), also `/staging/xray`. |

A1 + A2 read as a pair and are the intended homepage hero for the pending X-Ray swap
(`/staging/xray.html`, fires only on **GO SWAP**). The current homepage hero is A4.

---

## § 6 · COPY SOURCE

**Google Wording Canon v2.0** — Notion "GOOGLE PROTECTION MASTER" — is the sole copy authority.

- **"Google says" = verbatim quotes only.** If it is not a direct quote from Google's own documentation, it is not "Google says." Paraphrase is attribution fraud.
- **Behavior-chain claims on broad surfaces.** Describe the mechanism (missed call → engagement signal → ranking pressure), never a promised outcome.
- Never claim a ranking result, a placement, or an algorithmic guarantee.

---

## § 7 · TOKENIZATION LAW

- All GHL / n8n message templates use `{{booking_link}}`. **Never hardcode a calendar or domain URL in an automation.**
- Site CTAs point to `/book`.
- One swap at the token, not 40 edits across workflows.

---

## § 8 · BRAND B — AI CHAUFFEUR

**Direction for future builds** (not yet on the wire):
leather-black base · crisp white lettering · deep muted amber indicators · a 3D bow-tie mark that
doubles as an acoustic waveform · dark luxury minimalist.

**Currently live** at aichauffeur.ai (do not recolor without an explicit brand run):
bg `#06080F` · text `#EEF2FA` · Electric Blue `#3B82F6` / bright `#60A5FA` · Instrument Serif (display,
italic for emphasis) · Inter (body) · JetBrains Mono. KILLED: brown, gold, lime, matrix green, pure white text.

AVA parent (cyan) and AI Chauffeur (blue) are separate brands. Never cross tokens.

---

## § SKILL STACK

Installed in `.claude/skills/` — vendored, not plugin-linked, so the brain survives a fresh clone.
Provenance, licenses, and local modifications: `.claude/skills/VENDOR.md`.

| Skill | Fires at | Note |
|---|---|---|
| `grill-me` · `grilling` | Pipeline 1 | `grill-me` is a stub; it runs `grilling`. |
| `brainstorming` · `writing-plans` · `executing-plans` · `subagent-driven-development` · `dispatching-parallel-agents` · `verification-before-completion` · `systematic-debugging` · `test-driven-development` · `requesting-code-review` · `receiving-code-review` · `using-git-worktrees` · `finishing-a-development-branch` · `writing-skills` · `using-superpowers` | Pipeline 2 + 5 | Superpowers, 14 skills. |
| `ui-ux-pro-max` | Pipeline 3 | Bound to § 2. Search: `python .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain>` |
| `taste` · `frontend-design` | Pipeline 4 | Both bound to § 2. |
| `circulant-landing` | Building a landing page | House skill — landing anatomy, CTA patterns, terminal loader. |
| `social-post` | Writing a post | House skill — caption structures, prove-work law, pin comment. |
| `circulant-design` · `circulant-funnel` · `ava-factory` | Pre-existing | Untouched by RUN 0 v2. |

Every vendored design skill carries a `CIRCULANT BINDING` block. Do not remove it, and do not
upgrade a vendored skill without re-reading its binding against this file.

---

## STACK

- Vanilla HTML/CSS/JS only — see § 4.
- Single-file architecture (CSS + JS embedded in HTML)
- Use `str_replace` for edits, never full-file rewrites
- Vercel auto-deploys from `main`
- Repo: `shanehandel-504/aivoiceagency` · Domain: aivoiceagency.ai (parent, cyan) / aichauffeur.ai (vertical, blue)
- Personal Cockpit lives at `/cockpit/` — do not surface in main nav
- Cache armor: `tools/stamp.py` writes `?v=<hash>` + `__ASSET_V` across registered pages. New pages must be registered in `PAGES` (or `VERSION_ONLY` for chrome-free landers) or they never bust.
- Shared nav / footer / breadcrumbs / call bar are **stamp.py-owned**. Editing a marker region inline without also editing `tools/stamp.py` gets reverted on the next stamp run.

## GLOW GATE (perf pattern)

Decorative + pulse animations sit behind `body.glow-ready`, added on window `load` in `funnel.js`,
so they never compete with the LCP paint. Any new decorative motion MUST be behind this gate,
zero-layout-shift (transform / opacity / shadow only), and reduced-motion-safe.
**LCP ≤400ms · CLS 0.00.**

## HOMEPAGE ANALYTICS — `[data-event]` beacons

Fired on click by `funnel.js` (no-op if `window.va` absent):
`tel_tap_nav` · `tel_tap_hero` · `hear_ava_nav` · `hear_ava_hero` · `book_click_hero` ·
`call_me_submit_pod` · `call_me_submit_gate` · `book_click_gate` · `sticky_talk_ava` ·
`book_click_sticky` · `book_click_footer`
Add a `data-event` on every new CTA. Names are `verb_noun_location`.
Tracking spine is `js/tracking.js` — the ONE tracking file. Never add a per-page snippet.
It self-tags as internal (`NOTRACK`) on webdriver / `ava_internal` / `?notrack=1`.

## PRICING (surface only when asked)

- Starter — $497/mo + $497 setup
- Growth — $997/mo + $1,500 setup
- Operations — From $1,997/mo (custom, scoped setup)
- White Glove — by application

## PHONE — 414-240-8930 only

- **414-240-8930** — the public AVA line. The ONLY voice number in marketing copy, schema, and footer.
- Private numbers (personal cells, internal/routing lines) NEVER in the repo or in commits.
- SMS: 350-220-5305 is the published text-us line (footer only).
- 305-315-6562 retired — do not surface.

## PUSH DISCIPLINE

- One push = one complete unit of work, not one tweak
- Hard cap: 5 pushes per hour
- Local preview FIRST
- Before any push: have I batched all related changes?
- **Publish-always** — finish the unit, push it live, end with a DONE table + the production URL.
  If it is NOT live, first line = `RUN INCOMPLETE — what / why / next step` in caps.

## FORBIDDEN WORDS

- "locked" / "locked in" — use "set" or "decided"
- "she" / "her" for AVA — always "AVA"
- "Certainly!" / "Great question!" / "I understand"
- "booked" / "confirmed" / "payment required" / "guaranteed" — banned in marketing CLAIMS about AVA's service. Natural booking language IS allowed inside clearly-labeled sample call dialogue.

## GUARDRAILS

- No fake proof, ROI, or testimonials until verified
- No keys in code or commits — keys live in the Drive AICHAUFFEUR KEYS doc
- Never `git add -A` — untracked backups (`voice-stack/**`) are a secret risk. Use `git add -u` or an explicit path list.
- Don't pitch Billy at Jet Limousines or Chris at Chauffeur Driven until Wisconsin operators validate AVA on real calls
- Demo language: captured / routed / dispatcher will confirm

## AUTOMATION

- Drip engine = **n8n**. The 7-day follow-up runs on n8n, NOT GHL workflows.
- Email/SMS drip templates are authored inside the n8n drip workflow (not committed here).
- Live-call lead form posts to the n8n `ava-call` webhook (`funnel.js`).

## VERTICAL POSITIONING

- First vertical: corporate transportation (limo, NEMT, charter, black car)
- Validation gate: Wisconsin operators must validate before broader pitches
- Voice samples: Maxim Limousine + Acme Plumbing (real, recorded)
- Riverside Medical sample shows a placeholder — fix or delete

## OUTPUT FORMAT

- Traffic lights: green / yellow / red — action / consider / stop
- Tag markers: `[CREATIVE]` `[SPEC]` `[INNOVATION]` `[META]`
- Solution first, zero filler, developer-grade output only
- Every response ends with: how could this prompt be better? — placed **inside** the readback block, since nothing may follow it.

## CONTROL PHRASES

- **SHIP IT** → execute per Shipping Protocol
- **SCOPE THIS** → write the full diff plan before any edit
- **BATCH IT** → consolidate pending edits into one commit
- **100X MODE** → max output, no filters
- **FULL AUTHORITY** → execute without asking

## SHANE READBACK LAW

- Every run ends with ONE fenced block: `===== SHANE READBACK — COPY ALL =====`
- Contents: plain-English summary a non-coder can follow · DONE table (what shipped, live, proof) · IDs / one-line rollback per checkpoint · what's next · gotchas · how could this prompt be better.
- **NOTHING comes after the block.** Mirror it to `/reports/YYYY-MM-DD-<mission>.md`.

## ONE-REPO-LANE LAW

`shanehandel-504/aivoiceagency` → Vercel (auto-deploy from `main`) is the ONLY lane for
aivoiceagency.ai. No second deploy target, no parallel branch shipping the same page.
One push = one live unit.

## POLISH FREEZE (homepage)

After THE FINAL CUT (2026-07-09), the homepage (`index.html` + `/assets/funnel.*` + `ava-pod.js` /
`ava-theater.js`) is **FROZEN**. Bug fixes only. New features / redesigns require an explicit
un-freeze from Shane. `/lsa` is likewise frozen as authored.

---

## APPENDIX A — FOLDED STRUCTURAL RULES

Surveyed from [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) (`664b3e7`,
74 brand DESIGN.md rulebooks). Only brand-agnostic **layout and typography** discipline was folded in.
Everything that collided with CIRCULANT — border-radius scales, elevation/shadow ladders, decorative
depth, multi-hue gradient surfaces — was **dropped, not merged**. CIRCULANT wins every conflict.

**Spacing** — 4px base unit. Scale: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 96. Section gap 96px desktop /
48px mobile. Card interior padding 24px; CTA banner padding 48px. Nothing lands off-scale.

**Grid** — max content width 1280px, centered. Card grids collapse 3-up → 2-up → 1-up
(desktop → tablet → mobile). Hero media spans full content width; it is the protagonist.

**Whitespace** — on a dark canvas, the void *is* the whitespace. Sections separate by surface change
and hairline rule, not by empty gaps. Never add a divider where a change of surface already reads.

**Type hierarchy** — one H1 per page, and it states the page's single job. Body base 16px minimum,
line-height 1.5, measure 60–75 characters. Nothing below 12px, ever. Weight and size carry hierarchy;
color does not.

**Structure encodes meaning** — eyebrows, numbering, dividers, and labels must be true about the
content. Numbered markers (01 / 02 / 03) only when the content genuinely is an ordered sequence.

**Touch + responsive** — targets ≥44×44px with ≥8px spacing. Breakpoint 768px. Viewport meta present,
zoom never disabled, **zero horizontal scroll at 390px**. Reserve space for media — CLS stays 0.00.

**Motion** — 150–300ms. Motion conveys meaning or it does not exist. Never animate width/height
(transform/opacity only). Reduced-motion always respected. Behind the GLOW GATE.

**Forms** — visible labels always. Errors adjacent to their field, never only at the top. Helper text
before the mistake, not after.
