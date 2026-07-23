# Vendored Skill Provenance — RUN 0 v2 · SKILL FOUNDRY

Harvested 2026-07-22. Every skill below is vendored (copied into this repo) rather than
plugin-installed, so the design brain travels with the repo and survives a fresh clone,
a new machine, or a marketplace going dark. All sources are permissively licensed.

Install method note: the official marketplace path (`/plugin marketplace add …`) opens an
interactive terminal panel and cannot run in a headless session, so the fallback documented
in the mission brief was used — clone the source, copy `SKILL.md` (plus its support files)
into `.claude/skills/`, keep the upstream LICENSE alongside it.

## Sources

| Skill dir | Upstream | Commit | License | Modified? |
|---|---|---|---|---|
| `frontend-design/` | [anthropics/skills](https://github.com/anthropics/skills) `skills/frontend-design` | `1f630fd` | Apache-2.0 | + CIRCULANT BINDING block |
| `ui-ux-pro-max/` | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) `.claude/skills/ui-ux-pro-max` | `1307d97` | MIT | + CIRCULANT BINDING block · `${CLAUDE_PLUGIN_ROOT}` → repo-relative path (11×) · dropped `scripts/tests/` |
| `taste/` | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) `skills/taste-skill` | `98565e6` | MIT | + CIRCULANT BINDING block · front-matter `name: design-taste-frontend` → `taste` |
| `grill-me/`, `grilling/` | [mattpocock/skills](https://github.com/mattpocock/skills) `skills/productivity/*` | `ed37663` | MIT | unmodified (`grill-me` is a stub that runs `grilling` — both required) |
| 14 Superpowers skills¹ | [obra/superpowers](https://github.com/obra/superpowers) `skills/*` | `d884ae0` | MIT | unmodified |

¹ `brainstorming` · `dispatching-parallel-agents` · `executing-plans` · `finishing-a-development-branch`
· `receiving-code-review` · `requesting-code-review` · `subagent-driven-development` · `systematic-debugging`
· `test-driven-development` · `using-git-worktrees` · `using-superpowers` · `verification-before-completion`
· `writing-plans` · `writing-skills`

Vendored flat (not nested) because Claude Code only discovers skills one level under
`.claude/skills/`. Upstream directory names already match their front-matter `name:`, so
cross-references between Superpowers skills still resolve.

## Rulebook survey (not vendored)

[VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) `664b3e7` — 74 brand
DESIGN.md rulebooks. **Not** vendored: every file is a *brand's* system (Linear's radii, Stripe's
gradients, Apple's type ramp) and importing one wholesale would fight CIRCULANT. What was taken is
the format's brand-agnostic structural discipline, folded into `/CLAUDE.md` § APPENDIX A. Rules that
conflicted with CIRCULANT (border-radius scales, elevation/shadow ladders, decorative depth,
multi-hue gradient surfaces) were **dropped, not merged** — CIRCULANT wins every conflict.

## House skills (authored here, not harvested)

| Skill dir | Purpose |
|---|---|
| `circulant-landing/` | Landing-page anatomy, CTA patterns, terminal-loader spec, trust row |
| `social-post/` | Caption structures, prove-work law, pin-comment pattern |
| `circulant-design/`, `circulant-funnel/`, `ava-factory/` | Pre-existing house skills (untouched by this run) |

## Maintenance

Re-harvesting means re-applying the modifications in the table above — the CIRCULANT BINDING
blocks are delimited by `<!-- ===== CIRCULANT BINDING ... ===== -->` comments so they are easy to
lift and re-paste. Do not upgrade a vendored skill without re-reading the binding block against it.
