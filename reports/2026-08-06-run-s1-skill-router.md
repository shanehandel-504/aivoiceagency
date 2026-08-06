# RUN S1 — SKILL ROUTER + LOADOUT LAW

**Date:** 2026-08-06 · **Repo:** shanehandel-504/aivoiceagency · **Branch:** main
**Type:** Infrastructure. Zero page changes, zero copy changes, no stamp run.
Both freezes (§ POLISH FREEZE, § HOMEPAGE FREEZE LAW) untouched.

---

## 1 · AUDIT — every folder in `.claude/skills/`

24 folders. **All present. None empty. Every one carries a `SKILL.md`.**
Nothing from the RUN 0 v2 harvest (`ea419aa`) is missing.

| # | Skill | Source | Files | SKILL.md bytes | First line of description | Status |
|---|---|---|---|---|---|---|
| 1 | `ava-factory` | house (pre-existing) | 1 | 8,692 | AVA content factory — the permanent Run 1 pipeline for turning a script into a postable 1080x1920 avatar reel. | OK |
| 2 | `brainstorming` | obra/superpowers `d884ae0` | 8 | 10,435 | You MUST use this before any creative work… | OK |
| 3 | `circulant-design` | house (pre-existing) | 1 | 1,437 | CIRCULANT design system conventions for AI Voice Agency. | OK · legacy tokens |
| 4 | `circulant-funnel` | house (pre-existing) | 1 | 3,393 | CIRCULANT FUNNEL design + conversion skill for AI Voice Agency landing pages. | OK · legacy tokens |
| 5 | `circulant-landing` | house (RUN 0 v2) | 1 | 7,212 | **HARDENED this run** — MANDATORY for any visual work on the AVA parent brand… | OK |
| 6 | `dispatching-parallel-agents` | obra/superpowers | 1 | 6,644 | Use when facing 2+ independent tasks… | OK |
| 7 | `executing-plans` | obra/superpowers | 1 | 2,588 | Use when you have a written implementation plan… | OK |
| 8 | `finishing-a-development-branch` | obra/superpowers | 1 | 6,832 | Use when implementation is complete, all tests pass… | OK |
| 9 | `frontend-design` | anthropics/skills `1f630fd` | 2 | 9,531 | Guidance for distinctive, intentional visual design… | OK · CIRCULANT BINDING present |
| 10 | `grill-me` | mattpocock/skills `ed37663` | 2 | 154 | A relentless interview to sharpen a plan or design. | **OK but NOT model-invocable** — see §1.1 |
| 11 | `grilling` | mattpocock/skills | 1 | 855 | Grill the user relentlessly about a plan, decision, or idea. | OK |
| 12 | `receiving-code-review` | obra/superpowers | 1 | 6,382 | Use when receiving code review feedback… | OK |
| 13 | `requesting-code-review` | obra/superpowers | 2 | 2,826 | Use when completing tasks, implementing major features… | OK |
| 14 | `social-post` | house (RUN 0 v2) | 2 | 5,329 | **HARDENED this run** — MANDATORY before writing any outward-facing short copy… | OK |
| 15 | `subagent-driven-development` | obra/superpowers | 6 | 21,647 | Use when executing implementation plans with independent tasks… | OK |
| 16 | `systematic-debugging` | obra/superpowers | 11 | 9,885 | Use when encountering any bug, test failure, or unexpected behavior… | OK |
| 17 | `taste` | Leonxlnx/taste-skill `98565e6` | 2 | 88,409 | Anti-slop frontend skill for landing pages, portfolios, and redesigns. | OK · CIRCULANT BINDING present |
| 18 | `test-driven-development` | obra/superpowers | 2 | 9,894 | Use when implementing any feature or bugfix… | OK |
| 19 | `ui-ux-pro-max` | nextlevelbuilder `1307d97` | 45 | 14,447 | UI/UX design intelligence for web and mobile. Searchable local database… | OK · BINDING present · `search.py` smoke-tested working |
| 20 | `using-git-worktrees` | obra/superpowers | 1 | 7,472 | Use when starting feature work that needs isolation… | OK |
| 21 | `using-superpowers` | obra/superpowers | 5 | 3,063 | Use when starting any conversation… | OK |
| 22 | `verification-before-completion` | obra/superpowers | 1 | 4,201 | Use when about to claim work is complete, fixed, or passing… | OK |
| 23 | `writing-plans` | obra/superpowers | 2 | 7,092 | Use when you have a spec or requirements for a multi-step task… | OK |
| 24 | `writing-skills` | obra/superpowers | 7 | 26,431 | Use when creating new skills, editing existing skills… | OK |

Harvest cross-check against `ea419aa`: `frontend-design` ✓ · `ui-ux-pro-max` ✓ · `taste` ✓ ·
`grill-me` ✓ · `grilling` ✓ · 14× superpowers ✓ · `circulant-landing` ✓ · `social-post` ✓.
**Zero missing, zero empty.**

### 1.1 · Two names in the § 1 pipeline table do not resolve

Both fail **silently** — routing to them is a no-op, so the run proceeds with the skill never
loaded and nobody sees an error. This is the single most valuable finding of the audit.

**(a) There is no `superpowers` skill.** It was vendored as **14 flat folders**, because Claude
Code only discovers skills one level under `.claude/skills/`. `/CLAUDE.md` § 1 row 2 reads
"`superpowers` (`brainstorming` → …)", which is descriptive prose, not a resolvable name. The new
router names all fourteen explicitly.

**(b) `grill-me` cannot be model-invoked.** Its front-matter carries
`disable-model-invocation: true`. It is a 154-byte stub whose entire body is "Run a `/grilling`
session" — a door **Shane** opens by typing `/grill-me`. Verified by observation, not by reading
the file alone: `grill-me` is **absent** from this session's own skill registry while `grilling`
is present. The model-side name is `grilling`, and the router says so.

---

## 2 · `.claude/skills/SKILLS-INDEX.md` — created

Shane's map. All 24 skills, each with a one-sentence plain-English description and a "fires when."
Grouped: House (5) · Design, borrowed-and-leashed (3) · Grilling (2) · Superpowers (14).

Also records three things worth knowing that the folder listing alone won't tell you:

- The `superpowers` / `grill-me` traps above, up top under "THE ONE THING TO KNOW."
- `circulant-design` and `circulant-funnel` still carry **pre-X** tokens (`--panel:#10131A`,
  `--dim:#9AA1AD`, gold, green `#28D07A`). That is accurate history for 55+ live pages, but on a
  **new** surface § 2 wins and those values are wrong. Read them for structure, not colour.
- Why `ui-ux-pro-max` is leashed, with the receipt: asked for a landing page it recommends
  "Glassmorphism," which § 3 bans outright.

---

## 3 · `/CLAUDE.md` § SKILL ROUTER — added

**Purely additive. 433 → 501 lines. 68 insertions, ZERO deletions.** All 30 pre-existing sections
verified intact by heading scan. Placed as a new top section, above § 0 PRECEDENCE, with an
explicit line keeping it subordinate to § 0's ordering.

Contents:

- **LAW — invocation is mandatory, not inferred.** Match a routing row → READ those `SKILL.md`
  files before producing output. Missing file → print `RUN INCOMPLETE — missing skill: [name]`
  and continue with what exists.
- **LAW — declare the loadout.** First line of every response: `SKILLS: [names loaded]`.
  A turn that loads nothing reads `SKILLS: none — [why]`, so silence is always a routing failure
  rather than a valid state.
- **The 5-row routing table** exactly as briefed: visual work → `frontend-design` +
  `ui-ux-pro-max` + `taste` + `circulant-landing` · new/ambiguous → `grilling` FIRST then the
  Superpowers set · social → `social-post` · pre-commit → self-review loop · Retell prompt work
  → STOP.
- **"Two names that do not resolve"** — §1.1 written into law so the trap cannot be re-stepped.
- **Self-review loop**, six numbered steps: render 390×844 + desktop, fold, contrast ≥4.5:1
  measured, spacing rhythm, no cancelled CSS selectors / console errors / horizontal overflow,
  fix, then commit.
- **PROMPT AUTHORITY LOCK** — Claude Code does not author AVA's spoken dialogue. Reading,
  auditing, diffing, and version-checking an existing Retell prompt stay allowed; writing or
  rewriting what AVA *says* does not.

One further additive line in § SKILL STACK pointing at `SKILLS-INDEX.md` and noting that
§ SKILL ROUTER governs firing while that table only describes the stack.

---

## 4 · Descriptions hardened — house skills only

| Skill | Before | After |
|---|---|---|
| `circulant-landing` | 232 chars, passive "Use when building or rebuilding…" | Opens **MANDATORY**, names 24 trigger words: reskin, re-skin, skin, restyle, redesign, landing page, lander, ad lander, city page, trade page, vertical hub, homepage, hero, section, fold, page layout, mockup, artifact, deck, wireframe, component, CTA, button, "make it look better", "clean this up", "make it pop" |
| `social-post` | 223 chars, passive "Use when writing any social caption…" | Opens **MANDATORY**, names: social post, caption, hook, reel, Short, TikTok, Instagram, LinkedIn, X post, tweet, thread, thumbnail, ad creative, ad copy, email, subject line, newsletter, promo copy, announcement — plus the § 4 / § 6 / FORBIDDEN WORDS enforcement it carries |

**Verified live:** both rewritten descriptions came back in this session's own skill registry
immediately after the edit — not inferred from the file, observed in the loaded list.

**Third-party files deliberately untouched** — `frontend-design`, `ui-ux-pro-max`, `taste`,
`grill-me`, `grilling`, and all 14 Superpowers skills keep their upstream `description:` lines.
A local description edit is invisible drift the next time one is re-harvested. The router is ours,
travels with the repo, and does the steering instead.

---

## 5 · `/preflight` — created at `.claude/commands/preflight.md`

A dry run. Takes a task description, prints three blocks, builds nothing:

1. **SKILLS THAT WILL LOAD** — routed against § SKILL ROUTER, as a table with the reason each
   one triggered, plus an existence check on every named file, plus the `superpowers` /
   `grill-me` guard. Retell prompt work short-circuits to the PROMPT AUTHORITY LOCK.
2. **CIRCULANT TOKENS IN PLAY** — only the tokens the task actually touches, each as
   `role · hex · measured contrast`; new-vs-legacy surface call; the applicable rhythm (64px
   homepage / 96px elsewhere); and which § 3 bans the task is at risk of tripping.
3. **SELF-REVIEW CHECKLIST** — the router's loop as unchecked boxes, with the real verification
   command named for each box that has one.

Hard constraints written into the command: read-only, no writes, no commit, no deploy, output
only the three blocks, refuse to guess a loadout if the task is too vague. Ends on the single
line `PREFLIGHT COMPLETE — nothing built. Say GO to run it for real.`

---

## 6 · Board

`hq/board.json` — lane **L5 Canon** note prepended and re-stamped `2026-08-06T11:22:21-05:00`,
top-level `updated` re-stamped, ISO LOG entry prepended (log 66 → 67 entries, newest-first order
preserved). Diff is 7 insertions / 3 deletions — no mass reformat, all prior history intact.

---

## 7 · Rollback

| Checkpoint | Rollback |
|---|---|
| Everything in this run | `git revert <commit>` — infrastructure only, nothing on the live site depends on it |
| § SKILL ROUTER alone | Delete lines **6–71** of `CLAUDE.md` (leading `---` through the trailing blank, restoring `## § 0 · PRECEDENCE` to line 6) — plus the 2 added lines in § SKILL STACK. 66 + 2 = the 68 insertions. |
| Hardened descriptions | `git checkout <prev> -- .claude/skills/circulant-landing/SKILL.md .claude/skills/social-post/SKILL.md` |
| `/preflight` | `rm .claude/commands/preflight.md` |
