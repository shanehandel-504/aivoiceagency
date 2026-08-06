# CLAUDE.md — THE FACTORY LINE

Auto-read at every Claude Code session. Do not delete.
This file is the repo's design brain. When anything else disagrees with it, this file wins.

---

## § SKILL ROUTER (ratified 2026-08-06, RUN S1)

Skills stopped being suggestions. This section is the routing law; § 0 PRECEDENCE still
ranks it — Shane's direct instruction beats it, and the rest of this file beats any skill
it loads. Human-readable map of what's installed: `.claude/skills/SKILLS-INDEX.md`.

**LAW — invocation is mandatory, not inferred.** If a task matches a row in the routing
table, READ those `SKILL.md` files BEFORE producing any output. Not "consider." Not "if it
seems relevant." Read them. If a listed file is missing, print
`RUN INCOMPLETE — missing skill: [name]` and continue with what exists.

**LAW — declare the loadout.** The FIRST LINE of every response states it:
`SKILLS: [names loaded]`. No exceptions. When a turn genuinely loads nothing, the line
reads `SKILLS: none — [why]`. A silent turn is a routing failure.

**MACHINE-ENFORCED since RUN S2.** This is no longer discipline. `.claude/settings.json`
runs a `Stop` hook — `.claude/hooks/loadout-guard.py` — that reads the turn's own
transcript and **blocks the reply** if its first surfaced line does not open with
`SKILLS:`. Thinking does not count; only text the user can see. The guard fails **open**
on any unexpected condition (unreadable transcript, no assistant text, `stop_hook_active`)
because a guard that halts the session over its own bug is worse than no guard. Audit
trail: `.claude/hooks/loadout-guard.log` (gitignored, last 200 lines).

**Name collision — be specific.** Two different skills answer to `circulant-design`: the
local house one in `.claude/skills/`, and a plugin-provided `anthropic-skills:circulant-design`
that claims all three brands. They are not the same file and do not say the same thing. When
routing, name the scoped one you mean; for chauffeur work the correct skill is
`chauffeur-design`, not either `circulant-design`.

### ROUTING TABLE

| Task | Load — in this order | Notes |
|---|---|---|
| Any page, HTML, CSS, component, re-skin, visual change **on the AVA parent** (aivoiceagency.ai) | `frontend-design` + `ui-ux-pro-max` + `taste` + `circulant-landing` | Then run § 1 ENGINE PIPELINE steps 3→5. |
| Any **AI Chauffeur** surface (aichauffeur.ai, limo / black-car / NEMT / charter, "the blue brand") | `chauffeur-design` + `frontend-design` + `ui-ux-pro-max` + `taste` — **NOT `circulant-landing`** | Separate brand, separate Vercel project rooted at `/chauffeur/`. Never cross tokens or phone numbers between the two brands. |
| Any new build, feature, or ambiguous request | `grilling` **FIRST** — cross-examine until intent is unambiguous — then the Superpowers set: `brainstorming` → `writing-plans` → `subagent-driven-development` / `dispatching-parallel-agents` | No code before shared understanding. |
| Social post, caption, reel, thumbnail, ad creative | `social-post` (+ `ava-factory` when the reel is actually being rendered) | |
| Before ANY commit | `verification-before-completion` + the self-review loop below | Non-negotiable. |
| Voice agent / Retell prompt work | **STOP.** See PROMPT AUTHORITY LOCK below. | Claude Code does not author agent dialogue. |

### TWO NAMES THAT DO NOT RESOLVE — read this before routing

Both were verified against the filesystem on 2026-08-06. Routing to the wrong one is a
silent no-op — the skill simply never loads and the run proceeds unguarded.

- **There is no `superpowers` skill.** It was vendored as **14 flat skills** (Claude Code
  only discovers skills one level under `.claude/skills/`). "Load superpowers" means load
  the named ones: `brainstorming` · `writing-plans` · `executing-plans` ·
  `subagent-driven-development` · `dispatching-parallel-agents` · `using-git-worktrees` ·
  `test-driven-development` · `systematic-debugging` · `verification-before-completion` ·
  `requesting-code-review` · `receiving-code-review` · `finishing-a-development-branch` ·
  `writing-skills` · `using-superpowers`.
- **`grill-me` cannot be model-invoked.** Its front-matter carries
  `disable-model-invocation: true`, so it is a stub *Shane types* (`/grill-me`) and it is
  absent from the model's own skill list. The model routes to **`grilling`** — same
  interrogation, the door that opens. § 1 ENGINE PIPELINE row 1 lists both; the
  model-side name is `grilling`.

### SELF-REVIEW LOOP — before any commit

Render, do not reason about it. Evidence before assertions.

1. Render at **390×844 AND desktop**. Actually rendered, actually looked at.
2. Verify the fold — what is above it, and does it state the page's one job.
3. Verify contrast **≥4.5:1** on body text. Measured, not eyeballed.
4. Verify spacing rhythm against § 3 (and § 4's 64px homepage override).
5. Verify **no cancelled/overridden CSS selectors**, no console errors, no horizontal
   overflow at 390px.
6. Fix every defect found. **Then** commit.

### PROMPT AUTHORITY LOCK

Voice-agent dialogue — Retell prompts, AVA's spoken lines, greetings, objection handling,
call scripts — is **not Claude Code's to author.** On any such request: stop, say so, and
hand it back. Reading, auditing, diffing, version-checking, and reporting on an existing
prompt are all fine. Writing or rewriting what AVA *says* is not.

---

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
| 1 | **Grill** | `grilling` *(`/grill-me` is a human-typed stub — `disable-model-invocation: true`, not model-loadable)* | Intent is unambiguous. Cross-examine objectives one question at a time, each with your recommended answer. Look up *facts* yourself (filesystem, git, live site); put *decisions* to Shane. **No code before shared understanding.** |
| 2 | **Map** | superpowers stack — **see § SKILL ROUTER for the 14 explicit names** (entry path: `brainstorming` → `writing-plans` → `subagent-driven-development` / `dispatching-parallel-agents`) | An execution map exists: task split, subagent boundaries, and a test plan with named verification commands. |
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
- **Orphan fixes are CSS line-breaking only — never `&nbsp;`.** Use `text-wrap:balance`/`pretty`, a `max-width` in `ch`/`em`, or an explicit `<br>` at a chosen breakpoint. A hard space is invisible in the source, survives copy-paste into a CRM, and welds two words together at every viewport to fix one.
- **Homepage component height law: ≤680px is the HARD CEILING.** The four mode numbers are *targets*, not the law — a mode may land under its target, but nothing may exceed 680. Measure the rendered component, do not compute it from the CSS.
- **Homepage desktop section rhythm = 64px** (ratified 2026-07-25). This is the homepage's own ratified value and it *overrides* the ≥96px general section rhythm in § 3 for that page only. Every other surface stays on 96px desktop / 48px mobile.

---

## § 5 · PROTECTED ANCHORS

Verbatim. Never touch without a CEO order. **Re-verified against production 2026-07-29
(RUN 9.5)** — every row below was confirmed by fetching the live page, not by reading the repo.

| # | Anchor | Where it lives — verified on prod |
|---|---|---|
| A1 | `3AM. GOOGLE WAS LISTENING.` | **LIVE — homepage `<h1>`**, `index.html:148`. Also `/lsa` `<title>` + OG/meta; the `/lsa` on-page H1 is its own line, "Your phone went to voicemail. *Google was listening.*" **Frozen through Aug 27 2026** under HOMEPAGE FREEZE LAW. |
| A2 | `Every missed call hands the job to the next name on the map →` | **LIVE — homepage hero sub**, `index.html:149` (`.bs-sub`). No longer reserved; the slot is built. Frozen with A1. |
| A3 | `One call. Sixteen agents.` | **LIVE — `/backstage`, `/watch`, `/staging/xray`** (`.bs-theater-sub`). **Not on the homepage** — the 16-agent theater moved off it in RUN 4. Any claim that A3 sits in `index.html` is stale. |
| A4 | `AVA answers calls and books jobs.` | **LIVE — homepage metadata only**: `meta[name=description]`, `og:title`, `twitter:title` (`index.html:7,15,21`). It is **not** the homepage `<title>` (that reads "AI Receptionist That Books Appointments 24/7 \| AI Voice Agency") and **not** the H1. The `<h1>` form survives only at `/staging/xray.html:116`. |

A1 + A2 are the homepage hero pair and are **already on the wire** — the X-Ray swap
(`/staging/xray.html`, fires only on **GO SWAP**) is what still carries the A4 H1.
Anchor drift is a real failure mode: this table was wrong for a week before RUN 9.5.
**Re-verify against prod before citing a row, and stamp the date when you do.**

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

## § 9 · OWNER RAIL LAW (ratified 2026-07-26, RUN 6.5)

- **Owner-alert contacts are never upsert targets.** The GHL row the system alerts
  Shane on is dedicated, tagged `zz-internal` / `owner-alerts` / `do-not-drip`, and no
  code path may upsert into it. **Every GHL-touching run asserts this before it finishes.**
  RUN 6 found the alert target and a demo-lead row were the *same record*: a lead could
  redirect the owner's alerts, and lead-facing copy was reaching the owner.
- **Before any upsert, our own numbers route to the zz-test contact.** `OUR_NUMBERS`
  covers every Retell line, the published SMS line, and both owner cells. A call from
  one of them never creates or mutates a real lead.
- **Opaque IDs are re-fetched from the API, never trusted from pasted text.** This
  includes contact ids, calendar ids, agent ids, and workflow ids. A brief that quotes an
  id is a hint, not a source. RUN 6 caught `aCIv7rUnCGrysobt6MIg` vs `…Mlg`; RUN 6.5
  caught a brief that named the wrong phone on the right contact. **Verify the value,
  not just the id.**
- **Sensitive automation values live in n8n Variables, never in the repo and never in a
  node body.** Keys in use: `OWNER_ALERT_CONTACT_ID` · `ZZ_TEST_CONTACT_ID` ·
  `OWNER_SMS_FROM` · `OWNER_ALERT_EMAIL` · `OUR_NUMBERS`. Tools name the KEY only.
- **Every active n8n workflow carries an error workflow.** `OPS — Error Sentry`
  (`SlnAeMrVRORsF0w7`) is attached to all of them and **must stay ACTIVE** — an inactive
  error workflow is silently never invoked, which is the exact failure mode it exists to
  prevent. Alerts dedupe to one per workflow per 6h.

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
Plain-English map of all 24: `.claude/skills/SKILLS-INDEX.md`. **Firing is governed by
§ SKILL ROUTER** — this table describes the stack, the router commands it.

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
- See **PROMPT-FOOTER KILL** — no run, report, or response carries a prompt-critique tail.

## CONTROL PHRASES

- **SHIP IT** → execute per Shipping Protocol
- **SCOPE THIS** → write the full diff plan before any edit
- **BATCH IT** → consolidate pending edits into one commit
- **100X MODE** → max output, no filters
- **FULL AUTHORITY** → execute without asking

## SHANE READBACK LAW

- Every run ends with ONE fenced block: `===== SHANE READBACK — COPY ALL =====`
- Contents: plain-English summary a non-coder can follow · DONE table (what shipped, live, proof) · IDs / one-line rollback per checkpoint · what's next · gotchas.
- **NOTHING comes after the block.** Mirror it to `/reports/YYYY-MM-DD-<mission>.md`.
- The block **ends on the last gotcha.** See PROMPT-FOOTER KILL — no critique tail.

## ONE-REPO-LANE LAW

`shanehandel-504/aivoiceagency` → Vercel (auto-deploy from `main`) is the ONLY lane for
aivoiceagency.ai. No second deploy target, no parallel branch shipping the same page.
One push = one live unit.

## POLISH FREEZE (homepage)

After THE FINAL CUT (2026-07-09), the homepage (`index.html` + `/assets/funnel.*` + `ava-pod.js` /
`ava-theater.js`) is **FROZEN**. Bug fixes only. New features / redesigns require an explicit
un-freeze from Shane. `/lsa` is likewise frozen as authored.

---

## MESSAGE FORMAT LAW (Jul 28 2026)

Governs every outbound message — SMS, email, owner alert, booking receipt, post-call summary.
Ratified RUN 7-CODE.

- **Every outbound message does ONE job.** One ask, one outcome. If it needs two, it is two messages.
- **Owner alerts open status-led.** First line is the outcome — `BOOKED` / `MISSED` / `VOICEMAIL` /
  `FOLLOW-UP` — details after. The status is readable from a lock screen without opening anything.
- **One canonical name on every surface: "AVA strategy call."** **15 minutes, never 30.** Not
  "demo," not "intro call," not "30-minute call." The GHL `AVA Demo Call` calendar
  (`aCIv7rUnCGrysobt6Mlg`) is set to a 15-minute slot to match — copy and booking system agree.
- **Booking receipts include:** `Hear AVA anytime: 414-240-8930.`
- **SMS:** `Reply STOP to opt out` on **first touch only** — never on every message in a sequence.
- **CTA phrasing varies across any sequence.** No two messages in the same sequence share an
  identical CTA sentence.
- **Never fabricate stats, dollar amounts, or testimonials.** Never "100 free minutes." Never
  "locked in." **Caller-facing copy never says "Shane"** — the owner is named only in owner-facing
  messages.

Nav and footer CTAs are stamp.py-owned. Change the string in `tools/stamp.py`, then re-stamp —
an inline edit is reverted on the next stamp run.

## HOMEPAGE FREEZE LAW (Jul 28 2026)

After RUN 9's claim fix, **homepage copy and design are frozen for 30 days — through
Aug 27 2026.** Changes come only from measured behavior on the four conversion events:

| Event | Fires on |
|---|---|
| `hero_call_ava` | tel: click on CALL AVA LIVE |
| `hero_watch_demo` | WATCH AVA BOOK IT click |
| `pricing_cta_click` | any CTA inside the pricing section |
| `booking_complete` | `/booked` — already imported to Google Ads. **Never duplicate it.** |

All four are wired in `js/tracking.js` to GA4 (`G-ZJZD091SMC`) and Meta Pixel
(`1029719056532809`), routed through `ga()` / `fbCustom()` so the `NOTRACK` self-tag
silences internal traffic.

- **No taste-driven homepage edits during the freeze.** "It would read better" is not a
  reason; a number is.
- A change requires a named event, a measured problem, and the expected direction of movement.
- Bug fixes, security fixes and factual corrections are always allowed — a false claim is a
  bug, not a redesign.
- This freeze is narrower than § POLISH FREEZE and does not replace it. Where both apply, both
  must be satisfied.

## PROMPT-FOOTER KILL (Jul 29 2026)

**Never end any run, report, receipt, or prompt with "how could this prompt be better" or any
prompt-critique section. Banned on all surfaces.**

Ratified RUN 9.5, CEO order. Scope is total: the SHANE READBACK block, `/reports/*.md` mirrors,
Notion receipts, commit bodies, and ordinary chat replies. It also covers every rewording of the
same move — "how could this prompt be better," "prompt feedback," "to get a better result next
time," "what would have helped," a "meta" note grading the brief. The readback ends on the last
gotcha. Nothing follows it.

This supersedes the OUTPUT FORMAT and SHANE READBACK LAW lines that previously required it.
Older files under `/reports/` still carry the section as authored — they are the historical
record and are **not** retro-edited. Every report from 2026-07-29 forward ships clean.

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
