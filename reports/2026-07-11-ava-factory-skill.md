# SKILL SCOUT + AVA FACTORY SKILL — 2026-07-11

**Mission:** Scout the official marketplace + aitmpl.com for AVA-factory-relevant tools, vet under the VETTING LAW (max 3 installs), build the permanent `ava-factory` skill encoding Run 1, publish board + report.

**Result:** ✅ Skill built + test-loaded (hot-loaded this session). 2 installs, both justified. Official marketplace confirmed already-added. Board flipped. Live.

---

## SCOUT + VET REPORT TABLE — skill → source → what it does for the factory → risk

| Skill / tool | Source | What it does for the factory | Decision · risk |
|---|---|---|---|
| **commit-commands** | Official marketplace (`claude-plugins-official`) | Git hygiene — `/commit`, `/commit-push-pr`, `/clean_gone`. Matches PUSH DISCIPLINE (batched conventional commits, branch cleanup). | **INSTALLED** · low (official) |
| **ffmpeg-clip-team** → `social-media-clip-creator` + `video-editor` | Community — aitmpl.com / `davila7/claude-code-templates` | **The one real gap: video-ffmpeg assembly.** 9:16 vertical crop (`crop=ih*9/16:ih`), SRT caption burn-in, `libx264 -crf 23` encode, concat, thumbnail, cuts/color. Feeds the factory's ffmpeg step (HeyGen master → captioned/end-carded reel). | **INSTALLED (2 of 8 agents)** · low — I read both files verbatim: tools scoped Bash/Read/Write, **local ffmpeg only, zero network, no secret/env reads, no obfuscation**. Wrote vetted bytes to `.claude/agents/` (no third-party npx executed). Skipped 6 podcast/audio agents as bloat. |
| anthropic-skills **docx / pdf / pptx / xlsx** | Official (already installed) | docx/pdf output for reports & one-pagers. | **ALREADY LIVE** — no install needed |
| **postiz** + **brand-voice** + **marketing** | Connected plugins (already available) | Social-content ops — posting, captions, brand-safe copy. | **ALREADY LIVE** — no install needed |
| **HeyGen HyperFrames MCP** + **ElevenLabs MCP** | Connected MCPs | Avatar render + voice render rails. | **ALREADY LIVE** — used by the skill |
| ~~remotion~~ / ~~remotion-best-practices~~ | aitmpl (community) | React video framework w/ caption burn-in. | **REJECTED** · React/npm/build — violates STACK LAW; redundant w/ HyperFrames |
| ~~heygen-best-practices~~ | aitmpl (community) | HeyGen v2 API knowledge docs. | **REJECTED** · redundant w/ HeyGen MCP + ava-factory skill; no ffmpeg |
| ~~pdf-fill-studio~~ | aitmpl (community) | Visual PDF form-fill. | **REJECTED** · redundant + off-path; executing code hides in an unvettable PyPI package |
| ~~commit-guardian~~ | aitmpl (community) | Blocking pre-commit secret/branch/test gates. | **REJECTED** · redundant w/ commit-commands + built-in security-review/code-review; prompt-persona only, not a hard hook |
| ~~changelog-generator~~ | aitmpl (community) | Conventional-Commits → CHANGELOG.md. | **REJECTED** · redundant; repo uses SHANE READBACK `/reports/`, not Keep-a-Changelog |

**Vetting method:** 9-agent adversarial workflow (scout aitmpl → read every SKILL.md + shipped script → apply reject criteria: secrets / network / broad-write / obfuscation / redundancy). aitmpl.com is a client-rendered SPA; enumerated via its authoritative backing repo `davila7/claude-code-templates`. 7 community candidates surfaced, 1 passed, 6 rejected. Final human re-read of the 1 approved before enabling.

---

## THE ava-factory SKILL — what got encoded (permanent)

`.claude/skills/ava-factory/SKILL.md` — hot-loaded + invocable this session. Encodes:
- **The loop:** Grok mines → Claude refines → Grok re-checks → render → post 2×/day (GHL Social Planner).
- **ElevenLabs rail:** Closer voice `gJx1vCzNCD1EQHT212Ls` · settings `stability 0.5 / similarity 0.85 / style 0.35 / speaker_boost` · **turbo v2.5 scratch → v3 finals** · Doppler `ava-prod/prd` REST (`ELEVENLABS_API_KEY`, MCP key is dead).
- **HeyGen rail:** reuse `talking_photo_id 1fa401cc…` (no re-upload) · `HEY_GEN_API` · 1080×1920 · reel-1-first gate.
- **Burn guards:** ElevenLabs 25K-per-batch guard (meter start 244,000) · HeyGen quota preflight (60 units = 1 credit ≈ 1 min).
- **CIRCULANT video kit:** void `#0A0A0F` · cyan `#00D4FF` · Space Grotesk · **captions in TOP THIRD** · 3s end card w/ CTA. Assembly muscle = the two vetted ffmpeg agents, with a CIRCULANT top-third caption override.
- **Hard laws:** AVA never she/her · $497 only · prove-work (no fake proof) · CTA `414-240-8930` · no real names.
- **Publish steps:** update `/work/elevenlabs` meter → flip `hq/board.json` content lane + log → push (Vercel).
- **Closeout:** DONE table + SHANE READBACK block + mirror to `/reports/`.

---

```
===== SHANE READBACK — COPY ALL =====

PLAIN ENGLISH
I turned your Run-1 video pipeline into a permanent, reusable skill so any future
session runs the factory the same way without you re-explaining it. I also went
shopping for tools that help the factory — and was strict about it.

First, the shopping. Anthropic's official plugin store was already connected to your
machine (6 plugins already installed). I added ONE from it: "commit-commands" (clean
git commits/PR — matches your push discipline). Then I checked the community gallery
(aitmpl.com) and ran 9 AI reviewers to read the actual code of every candidate before
trusting any of it. Out of 7 community tools, only ONE passed: a pair of FFmpeg
"clip" agents that do the exact video-assembly step you had no tool for — vertical
9:16 crop, burn captions in, stitch on an end card. I read both files myself to
confirm they only run local FFmpeg (no internet, no touching your keys), then saved
the two useful ones into the repo. The other 6 I rejected and logged why (two were
React — banned by your stack law; four just duplicated what you already have).

Second, the skill. "ava-factory" is now a loadable skill that bakes in everything:
the ElevenLabs Closer voice + settings, turbo-scratch→v3-finals, the 25K credit burn
guard, the CIRCULANT look (void/cyan/Space Grotesk, captions in the TOP third, 3s end
card), your hard laws (AVA never "she", $497 only, prove-work, call 414-240-8930, no
real names), the GHL 2×/day schedule, and the /work + board publish steps. It
hot-loaded this session — it's live now, not next reboot.

DONE TABLE
| Artifact | What | Status | Proof |
|---|---|---|---|
| ava-factory skill | .claude/skills/ava-factory/SKILL.md | LIVE | listed in Skill menu this session (hot-loaded) |
| ffmpeg assembly agents | .claude/agents/social-media-clip-creator.md + video-editor.md | INSTALLED | vetted verbatim; local ffmpeg only |
| commit-commands plugin | claude-plugins-official (user scope) | INSTALLED | `claude plugin install` exit 0 |
| board.json | hq/board.json — content lane "skill rail live" + new item + log | UPDATED | JSON valid, 8 lanes / 11 items / 4 logs |
| this report | reports/2026-07-11-ava-factory-skill.md | WRITTEN | mirror of this block |

INSTALLS (max 3 — used 2, both logged)
  1. commit-commands (OFFICIAL) — git hygiene. Risk: low (official). WHY: matches PUSH DISCIPLINE; unique vs installed set.
  2. ffmpeg-clip-team → social-media-clip-creator + video-editor (COMMUNITY, vetted) — fills the ONE gap (video-ffmpeg
     assembly). Risk: low — read verbatim, local ffmpeg only, no secrets/network/broad-write. WHY: no already-available
     tool does caption/crop/concat assembly. Installed the 2 relevant agents; dropped 6 podcast/audio ones.
  REJECTED (6): remotion, remotion-best-practices (React — STACK LAW); heygen-best-practices, pdf-fill-studio,
     commit-guardian, changelog-generator (redundant with installed/built-in tooling).

ROLLBACK (per checkpoint)
  - Skill:   git rm .claude/skills/ava-factory/ && commit.
  - Agents:  git rm .claude/agents/social-media-clip-creator.md .claude/agents/video-editor.md && commit.
  - Plugin:  claude plugin uninstall commit-commands@claude-plugins-official
  - Board:   git revert the board.json commit (content lane returns to "Content Loop v2 shipped · ElevenLabs + HeyGen factory").

WHAT'S NEXT
  - Next content run: invoke the ava-factory skill; it drives the whole pipeline end to end.
  - Optional: feed a HeyGen master through the social-media-clip-creator agent to prove the top-third-caption + end-card
    assembly on a real reel (the one step that was tool-less before today).
  - The 4 prompt bodies on /work/prompts are still pending paste (unrelated open item).

GOTCHAS
  - "L1 → skill rail live": your board's L1 lane is SITE. I put the skill-rail-live marker on the CONTENT lane
    (the factory's lane) + added an "AVA Factory skill" item, since tagging it to Site would be wrong. Say the word
    if you want it literally on L1.
  - aitmpl.com is a JS SPA (WebFetch sees only "Loading…"); real source is the davila7/claude-code-templates repo.
  - Community agents were installed by writing the vetted bytes directly — I did NOT run their `npx claude-code-templates`
    installer (avoids executing third-party code). Same files, safer path.
  - ElevenLabs MCP key is dead (401) — the skill renders via Doppler REST, not the MCP.

===== END =====
```
