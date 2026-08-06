# RUN S2 — ROUTER HARDEN + CHAUFFEUR BRAND SKILL

**Date:** 2026-08-06 · **Repo:** shanehandel-504/aivoiceagency · **Branch:** main
**Type:** Infrastructure. Zero page changes, zero copy changes, no stamp run.
§ POLISH FREEZE and § HOMEPAGE FREEZE LAW untouched.

---

## 1 · § 1 ENGINE PIPELINE — fixed in place

Additive-only was waived for § 1 by explicit order. No other prior section was touched.

| Row | Before | After |
|---|---|---|
| 1 Grill | `` `grill-me` / `grilling` `` | `` `grilling` `` *(`/grill-me` is a human-typed stub — `disable-model-invocation: true`, not model-loadable)* |
| 2 Map | `` `superpowers` (`brainstorming` → …) `` | superpowers stack — **see § SKILL ROUTER for the 14 explicit names** (entry path preserved) |

Both RUN S1 silent no-ops are now dead in both places they appeared.

---

## 2 · LOADOUT ENFORCEMENT HOOK — live and proven

**Event chosen: `Stop`.** It is the only event that fires when a reply is complete and is one of the
three events whose `decision: "block"` is honoured. `prompt` and `agent` hook types are restricted to
tool events, so this is a `command` hook.

- **Hook:** `.claude/hooks/loadout-guard.py`
- **Wiring:** `.claude/settings.json` (new file — project-scoped and committed, so it travels with
  the repo). No pre-existing hooks anywhere; nothing was overwritten.
- **Command:** `python "${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/loadout-guard.py"`, `shell: bash`,
  15s timeout.

**How it decides.** Reads the Stop payload, opens `transcript_path`, walks back to the last *real*
user turn (a `role:user` record carrying a `tool_result` is machine traffic, not Shane), collects the
assistant **text** blocks produced since, and checks the first non-empty line starts with `SKILLS:`.
**Thinking blocks are excluded** — declaring the loadout only in thinking is a violation, because the
law is about what the user sees.

**Fail-open by design.** Unreadable transcript, unparseable stdin, no assistant text, or
`stop_hook_active` → exit 0, no block. `stop_hook_active` is the infinite-loop guard. The only
block is a positively identified violation.

### The deliberate violation test — 10/10

```
==============================================================================
LOADOUT GUARD — DELIBERATE VIOLATION TEST MATRIX
==============================================================================

[PASS] 1. VIOLATION: reply opens without SKILLS:
        exit=0  blocked=True  expected_block=True
        systemMessage: LOADOUT GUARD: reply did not open with 'SKILLS:' — blocked, model asked to re-lead.
        reason[line1]: LOADOUT LAW VIOLATION (CLAUDE.md § SKILL ROUTER).

[PASS] 2. COMPLIANT: reply opens with SKILLS:
        exit=0  blocked=False  expected_block=False

[PASS] 3. VIOLATION: thinking says SKILLS:, visible text does not
        exit=0  blocked=True  expected_block=True
        systemMessage: LOADOUT GUARD: reply did not open with 'SKILLS:' — blocked, model asked to re-lead.
        reason[line1]: LOADOUT LAW VIOLATION (CLAUDE.md § SKILL ROUTER).

[PASS] 4. COMPLIANT: SKILLS: declared before tool call, prose after tool result
        exit=0  blocked=False  expected_block=False

[PASS] 5. SKIP: turn surfaced no assistant text
        exit=0  blocked=False  expected_block=False

[PASS] 6. SKIP: stop_hook_active=true (infinite-loop guard)
        exit=0  blocked=False  expected_block=False

[PASS] 7. SKIP: transcript missing (fail-open)
        exit=0  blocked=False  expected_block=False

[PASS] 8. COMPLIANT: lowercase 'skills:' still satisfies
        exit=0  blocked=False  expected_block=False

[PASS] 9. COMPLIANT: leading blank lines before SKILLS:
        exit=0  blocked=False  expected_block=False

[PASS] 10. VIOLATION: earlier turn complied, current turn does not
        exit=0  blocked=True  expected_block=True
        systemMessage: LOADOUT GUARD: reply did not open with 'SKILLS:' — blocked, model asked to re-lead.
        reason[line1]: LOADOUT LAW VIOLATION (CLAUDE.md § SKILL ROUTER).

==============================================================================
RESULT: 10/10 scenarios behaved as specified
==============================================================================
```

And the **exact command string from settings.json**, pipe-tested against a violating transcript:

```json
{"decision": "block", "reason": "LOADOUT LAW VIOLATION (CLAUDE.md § SKILL ROUTER).\nYour reply opened with: 'Sure! No declaration here.'\n\nThe FIRST LINE of every response must declare the loadout:\n  SKILLS: [names loaded]\nIf this turn genuinely loaded no skill, the line reads:\n  SKILLS: none — <why>\n\nRe-send the reply with that line first...", "systemMessage": "LOADOUT GUARD: reply did not open with 'SKILLS:' — blocked, model asked to re-lead."}
```

Audit log: `.claude/hooks/loadout-guard.log`, capped at 200 lines, **gitignored**.

---

## 3 · TOKEN AUTHORITY DE-DUP — house skills only

All three now carry the same banner and defer to § 2.

| Skill | Removed | Result |
|---|---|---|
| `circulant-design` | The whole 5-row Colors table + the Typography block | Keeps its non-colour rules (one accent per site, no AI-slop, AVA Signal naming, spacing, breakpoints) |
| `circulant-funnel` | Both `TOKENS (dark stage)` and `TOKENS (light paper cards)` lines, plus the font-family half of `TYPE` | Keeps the type *scale* craft (17px min, H1 clamp) and every conversion/honesty/forms/audio/perf/SEO law |
| `circulant-landing` | Its last 5 inline hex literals | Now **hex-free** — names roles instead: panel, hairline, muted, text, Booked-Green |

**Third-party skill files untouched**, as ordered.

### Two stale claims died in the process — both verified against production

1. **`circulant-design` said "Import: Google Fonts CDN".** Production serves
   `/fonts/space-grotesk.woff2` + `/fonts/jetbrains-mono.woff2` with `@font-face` — **self-hosted on
   both brands**, zero Google Fonts references. Corrected.
2. **`circulant-funnel` authorised "Serif-italic twist words in H1 only (Georgia italic)".** § 2 says
   *"Space Grotesk only. No second family, no display pairing, no serif accent."* Fetched the live
   homepage: **zero** occurrences of Georgia. Removed, with a do-not-reintroduce note.

---

## 4 · `chauffeur-design` — forged, and mostly a correction

`.claude/skills/chauffeur-design/SKILL.md`. **Every value derived from live production. Nothing
invented.** The brief allowed proposing values with AA proof if the live pages lacked them — they did
not lack them.

| Brief asked for | Found live |
|---|---|
| Leather-black base | `--void` / `--void-2` — already the § 2 void tokens |
| Crisp white lettering | `--ink` — never pure `#FFFFFF` |
| Deep muted amber indicators | `--amber` — **already wired as `--state-ringing`** (ringing · pending · the miss) |
| Space Grotesk | Live, self-hosted, plus JetBrains Mono for instrument numerals |
| Bow-tie mark doubling as an acoustic waveform | **Already shipped** — see below |
| 414-775-0019 only | Live sitewide, twice on the homepage; no `414-240-8930` anywhere |

**The mark already exists and is called Signal.** `chauffeur/assets/brand/` holds a **24-file
production kit** with its own surface map: waveform bars — a voice on a line — tied by a **centre
knot**, the knot being both the bow tie and the handoff (the call becomes a booking). Outlined type,
no embedded fonts. The skill says do not redraw it, and carries the SVGO render-gate warning.

**Contrast recomputed this run, not copied from § 2** (independent check — amber came out at exactly
the 10.80:1 § 2 claims):

| Role | On base | On raised |
|---|---|---|
| text | 17.31:1 | 16.05:1 |
| accent (cyan) | 11.16:1 | 10.35:1 |
| amber | 10.80:1 | 10.02:1 |
| Booked-Green | 12.23:1 | 11.34:1 |
| Neutral | 6.40:1 | 5.93:1 |
| Miss-Red | 5.63:1 | 5.22:1 |
| **raised on base** | **1.08:1** | — hairline is mandatory, exactly as § 2 says |

The skill also records the `/chauffeur/` host traps: separate Vercel project, repo-root asset paths
404 in production, and the homepage does **not** load `aic.css` (two CSS copies by design).

### AWAITING SHANE RATIFICATION — two open items, neither written as canon

**4a · Is the chauffeur accent cyan or amber?** On the wire today the accent is **cyan** — the AVA
parent's own colour. § 8 says *"AVA parent (cyan) and AI Chauffeur (blue) are separate brands. Never
cross tokens."* The live site is in the exact cross-brand condition § 8 forbids. Decision needed:
keep cyan, or move chauffeur to amber-led. Four deeper amber candidates, all AA-body-passing on both
surfaces, measured this run — **none is canon**:

| Candidate | On base | On raised |
|---|---|---|
| `#E8951A` | 8.23:1 | 7.63:1 |
| `#D98514` | 6.88:1 | 6.38:1 |
| `#C77A12` | 5.85:1 | 5.43:1 — deepest that still reads as amber |
| `#B86E10` | 4.96:1 | 4.60:1 — at the edge |

**4b · § 8 is stale.** Verified against production, all four of its claims are false:

| § 8 says | Production serves |
|---|---|
| Electric Blue `#3B82F6` / `#60A5FA` | **Not present anywhere** — the accent is § 2 cyan |
| Instrument Serif (display) | **Not present** — Space Grotesk |
| Inter (body) | **Not present** as a font-family |
| Bow-tie mark "not yet on the wire" | **Shipped** — the Signal kit, 24 files |

RUN 7 and RUN 8 moved the brand onto CIRCULANT-X; § 8 was never updated. **Correcting § 8 was out of
scope** — the order was § 1 only — so it is logged in the skill instead. Until Shane ratifies, the
skill is the accurate description of the brand and § 8 is not.

---

## 5 · Router row + name collision

New row: **any AI Chauffeur surface → `chauffeur-design` + `frontend-design` + `ui-ux-pro-max` +
`taste`, and explicitly NOT `circulant-landing`.** The parent row was narrowed to say "on the AVA
parent" so the two never blur.

Also recorded in § SKILL ROUTER: a **name collision**. A plugin skill
`anthropic-skills:circulant-design` shares a name with our local house skill and claims all three
brands. Different file, different content. Routing must name the scoped one; for chauffeur work
neither is correct — `chauffeur-design` is.

---

## 6 · Index + board

- `SKILLS-INDEX.md` → **25 skills**, `chauffeur-design` row added, the pre-X warning replaced with
  the single-authority note, `/preflight` marked confirmed-live, and the collision documented.
- `hq/board.json` — L5 Canon prepended + re-stamped `2026-08-06T11:40:36-05:00`, ISO LOG prepended
  (67 → 68), 7 insertions / 3 deletions, no mass reformat.

---

## 7 · Rollback, per item

| Item | Rollback |
|---|---|
| Whole run | `git revert <commit>` |
| Hook only (fastest kill) | Delete the `"hooks"` key from `.claude/settings.json`, or set `"disableAllHooks": true`. Also `rm .claude/hooks/loadout-guard.py` |
| § 1 rows | `git checkout <prev> -- CLAUDE.md` (also reverts the router row + collision note) |
| Token de-dup | `git checkout <prev> -- .claude/skills/circulant-design/SKILL.md .claude/skills/circulant-funnel/SKILL.md .claude/skills/circulant-landing/SKILL.md` |
| chauffeur-design | `rm -r .claude/skills/chauffeur-design` + remove the chauffeur router row |
| Board | `git checkout <prev> -- hq/board.json` |
