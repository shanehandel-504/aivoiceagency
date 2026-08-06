# SKILLS INDEX — what's installed and when it fires

Shane's map. One page, plain English. Written RUN S1, updated RUN S2 (2026-08-06).

A **skill** is a rulebook Claude reads before it works. It is not code and it does not run —
it changes what Claude knows and what it is allowed to do. Provenance and licenses live in
[`VENDOR.md`](VENDOR.md). The mandatory firing rules live in `/CLAUDE.md` § SKILL ROUTER —
**this page describes, that section commands.**

**25 skill folders installed. All present, none empty.**

The loadout declaration is **machine-enforced** as of RUN S2: a `Stop` hook
(`.claude/hooks/loadout-guard.py`, wired in `.claude/settings.json`) blocks any reply that does not
open with `SKILLS:`. It fails open on its own errors and logs to `loadout-guard.log`.

---

## THE ONE THING TO KNOW

There is no folder called `superpowers`. It was vendored as **14 separate skills**, flat, because
Claude Code only finds skills one level deep. When something says "load superpowers," it means
load the relevant ones from the fourteen listed below — usually `brainstorming` → `writing-plans`
→ `subagent-driven-development`.

And `grill-me` is a **stub Shane types** (`/grill-me`). Claude cannot fire it on its own by design.
The one Claude fires is `grilling`. Same interrogation, different door.

---

## HOUSE SKILLS — written here, for this business

These know AVA, the brands, and the laws. They are the ones that keep output on-brand.

| Skill | What it does, in one sentence | Fires when |
|---|---|---|
| `circulant-landing` | Says what goes on a landing page, in what order — the six required sections, the CTA wording, the terminal-loader, the trust row. | Any page, lander, city/trade page, hero, section, re-skin, or "make it look better" **on the AVA parent brand**. |
| `chauffeur-design` | The AI Chauffeur brand law — leather-black base, crisp white lettering, amber indicators, the Signal mark, the 414-775-0019 line, and the `/chauffeur/` hosting traps. | Any aichauffeur.ai surface: limo, black car, NEMT, charter, dispatch. **Never `circulant-landing` for these.** |
| `social-post` | Says how a social caption is shaped — the hook structures, the rule that you must show real work, the pinned comment, the hashtag bank. | Any caption, post, reel description, thumbnail text, or ad copy. |
| `ava-factory` | The full assembly line that turns a written script into a finished vertical video ready to post. | Rendering AVA reels or Shorts; the ElevenLabs → HeyGen → ffmpeg → GHL loop. |
| `circulant-design` | The house style rules that are *not* colours — one accent per site, no AI-slop aesthetics, the AVA Signal naming rule, spacing and breakpoints. | Quick styling or theming questions. Colours come from § 2, not from here. |
| `circulant-funnel` | The conversion rulebook for lead-capture pages — forms, audio, honesty laws, speed, SEO checks. | Building or editing a funnel, demo pod, or any page whose job is capturing a lead. |

> **One token authority, as of RUN S2.** `circulant-design`, `circulant-funnel` and
> `circulant-landing` no longer carry their own colour tables — they used to, and they had drifted to
> *pre-X* values (`--panel:#10131A`, `--dim:#9AA1AD`, gold, green `#28D07A`) that were wrong for any
> new surface. All three now defer to `/CLAUDE.md` § 2 and name colours by **role**, not hex.
> When you patch a **legacy** section, match the page around you; anything **new** uses § 2.

---

## DESIGN SKILLS — borrowed, then leashed

Three outside skills give real design horsepower. Each one carries a **CIRCULANT BINDING** block
we added, because left alone they will happily suggest gradients, rounded cards, and glassmorphism —
all banned here. Do not delete those blocks.

| Skill | What it does, in one sentence | Fires when | Leash |
|---|---|---|---|
| `ui-ux-pro-max` | A searchable design library — 84 styles, 192 palettes, 74 font pairings, 98 UX guidelines, motion presets, chart types. | Every visual build, at pipeline step 3. | **Layout and typography reasoning ONLY.** Its palette, font, corner-radius, and framework picks are thrown away on sight. It literally recommends "Glassmorphism" for a landing page — that is banned. |
| `taste` | Finds and removes the tells that make a page look AI-generated. | Every visual build, at pipeline step 4. | Runs **subtractive only** — it removes slop, it does not get to add a new look. |
| `frontend-design` | Pushes toward a deliberate, non-templated look instead of safe defaults. | Every visual build, alongside `taste`. | Bound to § 2. Direction yes, tokens no. |

Search the library from the repo root:

```bash
python .claude/skills/ui-ux-pro-max/scripts/search.py "landing page" --domain product
```

---

## GRILLING — the gate before any build

| Skill | What it does, in one sentence | Fires when |
|---|---|---|
| `grilling` | Interrogates the request one question at a time — each with a recommended answer — until what Shane wants is unambiguous. Looks up **facts** itself; only puts **decisions** to Shane. | Any new build, feature, or ambiguous ask. **Before any code.** |
| `grill-me` | A one-line stub whose only job is to run `grilling`. Marked `disable-model-invocation`, so **only Shane** can trigger it, by typing `/grill-me`. | Shane types it. Claude cannot. |

---

## SUPERPOWERS — the 14 work-discipline skills

These do not know anything about AVA. They govern *how the work is done*: plan first, test first,
prove it before claiming it. Vendored flat from `obra/superpowers`.

### Planning
| Skill | In one sentence | Fires when |
|---|---|---|
| `brainstorming` | Turns a rough idea into a real design by asking one question at a time before anything is built. | Before any creative or feature work. |
| `writing-plans` | Writes the build plan as bite-sized tasks, assuming the person doing it has zero context. | Once requirements are known, before touching code. |
| `using-superpowers` | The meta-rule that says: find and load the right skill before answering anything. | Start of a session. |

### Doing
| Skill | In one sentence | Fires when |
|---|---|---|
| `executing-plans` | Works through a written plan with review checkpoints. | A plan exists and is being run. |
| `subagent-driven-development` | Hands each task to a fresh helper agent with clean context, then reviews each one. | Executing a multi-task plan in one session. |
| `dispatching-parallel-agents` | Runs 2+ genuinely independent tasks at the same time. | Tasks share no state and no ordering. |
| `using-git-worktrees` | Puts risky work in an isolated copy of the repo so the main one stays clean. | Feature work needing isolation. |
| `test-driven-development` | Write the failing test first, then the code that passes it. | Any feature or bugfix. |
| `systematic-debugging` | Find the actual root cause instead of patching symptoms. | Any bug, test failure, or surprise. |

### Proving
| Skill | In one sentence | Fires when |
|---|---|---|
| `verification-before-completion` | **Run the check and read the output before saying anything is done.** Claiming success unverified is treated as dishonesty. | Before every "it's done," every commit, every push. |
| `requesting-code-review` | Sends the work to a reviewer agent to catch problems early. | Finishing a task or major feature. |
| `receiving-code-review` | Evaluate review feedback technically — verify it, don't just agree with it. | Feedback has arrived. |
| `finishing-a-development-branch` | Decide how finished work gets merged, PR'd, or cleaned up. | Work is complete and tests pass. |
| `writing-skills` | How to write a new skill properly, and test that it actually fires. | Creating or editing a skill. |

---

## WHAT IS *NOT* A SKILL

Do not go looking for these in `.claude/skills/` — they live elsewhere and work differently.

- **`/preflight`** — a slash command at `.claude/commands/preflight.md`. Prints the loadout,
  the tokens, and the checklist for a task. Builds nothing. **Confirmed registered and live.**
- **The loadout guard** — `.claude/hooks/loadout-guard.py`, a `Stop` hook wired in
  `.claude/settings.json`. Not a skill; it is the machine that enforces the `SKILLS:` line.
- **`anthropic-skills:circulant-design`** — a *plugin* skill with the same name as our local
  `circulant-design`, claiming all three brands. **Different file, different content.** When you
  route, say which one you mean. For chauffeur work neither is right — use `chauffeur-design`.
- **`tools/stamp.py`** — a real Python script that owns the shared nav, footer, breadcrumbs,
  call bar, and cache-busting. Editing those regions by hand gets reverted on the next stamp.
- **The Prompt Authority Lock** — voice-agent dialogue is not Claude Code's to write. See
  `/CLAUDE.md` § SKILL ROUTER.

---

## MAINTENANCE

- Re-harvesting a vendored skill means re-applying its CIRCULANT BINDING block. The blocks are
  delimited by `<!-- ===== CIRCULANT BINDING ... ===== -->` so they lift and re-paste cleanly.
- **Never edit a third-party skill's `description:` line.** Upstream owns those files; local
  description edits create silent drift on the next update. Routing is handled by
  `/CLAUDE.md` § SKILL ROUTER instead, which is ours and travels with the repo.
- House skills (`circulant-*`, `social-post`, `ava-factory`) are ours — edit freely.
- Adding a skill means adding a row here **and** a row in the § SKILL ROUTER table. A skill
  nobody routes to is a skill that never fires.
