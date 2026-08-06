---
description: Dry-run the loadout for a task — skills, tokens, checklist. Builds nothing.
argument-hint: <task description>
---

# PREFLIGHT — verification before the build

Task under inspection: **$ARGUMENTS**

You are running a **dry run**. Print the three blocks below and STOP.

## ABSOLUTE CONSTRAINTS

- **Do not build anything.** No file is created, edited, or deleted. No commit, no push,
  no stamp run, no deploy.
- **Read-only inspection only.** You may read `/CLAUDE.md`, `.claude/skills/**`, and repo
  files to answer accurately. You may not write.
- **Do not load the skills** — this is a dry run of the routing decision. Name what *would*
  load and why. Reading `/CLAUDE.md` § SKILL ROUTER to route correctly is expected.
- **Output only the three blocks.** No preamble, no plan, no code, no offer to proceed
  beyond the single closing line.
- If the task description is empty or too vague to route, say exactly that and name the one
  question that would resolve it. Do not guess a loadout.

---

## BLOCK 1 — SKILLS THAT WILL LOAD

Route the task against `/CLAUDE.md` § SKILL ROUTER. Output a table:

| Skill | Why this task triggers it |
|---|---|

Then, below the table:

- Confirm each named file exists at `.claude/skills/<name>/SKILL.md`. For any that does not,
  print `RUN INCOMPLETE — missing skill: [name]`.
- Two names that do not resolve, per § SKILL ROUTER — check yourself before printing them:
  there is **no `superpowers` folder** (name the 14 flat skills you actually mean), and
  **`grill-me` cannot be model-invoked** (route to `grilling`).
- If the task is voice-agent / Retell prompt authoring, print the **PROMPT AUTHORITY LOCK**
  and stop the preflight there — no tokens block, no checklist.

## BLOCK 2 — CIRCULANT TOKENS IN PLAY

Only the tokens this specific task will actually touch. Not the whole palette.

- Name the surface and whether it is **new** (CIRCULANT-X, § 2) or **legacy / under freeze**
  (keeps its shipped values — § 2 legacy ledger, § POLISH FREEZE, § HOMEPAGE FREEZE LAW).
- List each token as `role · hex · measured contrast`.
- Flag any semantic colour and state the meaning that must be literally true on screen for
  it to be allowed.
- Name the applicable section rhythm: **64px** if the homepage, otherwise 96px desktop /
  48px mobile.
- Name any § 3 ban the task is at risk of tripping — gradients, badges/pills, rounded cards,
  gold, emoji-as-icons, shadows, removed focus rings.
- If the task touches no visual surface, print `TOKENS: none — non-visual task` and move on.

## BLOCK 3 — SELF-REVIEW CHECKLIST

The § SKILL ROUTER self-review loop, made specific to this task. Unchecked boxes:

- [ ] Rendered at **390×844** — actually rendered, actually looked at
- [ ] Rendered at **desktop**
- [ ] Fold verified — states the page's one job
- [ ] Contrast **≥4.5:1** on body text, measured not eyeballed
- [ ] Spacing rhythm verified against the value named in Block 2
- [ ] No cancelled / overridden CSS selectors
- [ ] No console errors
- [ ] Zero horizontal scroll at 390px
- [ ] Touch targets ≥44×44px with ≥8px spacing
- [ ] …plus any task-specific gate: freeze compliance, `data-event` on new CTAs, stamp.py
      registration for a new page, GLOW GATE for new motion, `{{booking_link}}` tokenization

Name the **verification command or tool** for each box that has one — the actual command,
not "check it."

---

End with exactly one line:

`PREFLIGHT COMPLETE — nothing built. Say GO to run it for real.`
