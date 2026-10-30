# tools/qa — the call grader and the text caller

Grades any call on either line against the house rules, and plays scripted callers against an agent in text.
Read-only on Retell: GETs, `POST /v3/list-calls`, and the stateless `POST /agent-playground-completion/{agent_id}`
(nothing persisted, no number, no audio). Every command runs under Doppler: `doppler run -p ava-prod -c prd -- …`
(`ANTHROPIC_API_KEY`, `RETELL_API_KEY`). Spend is logged per request to `ops/tuning/qa/<date>/ledger.jsonl`; a run
stops at `QA_CAP_USD` (default $10) for that day's ledger.

## One-line commands

```bash
# grade one call id (or several)
doppler run -p ava-prod -c prd -- python -X utf8 tools/qa/grade_call.py call_d3c7d2779c341623123c54348d4

# grade the last 20 calls on an agent
doppler run -p ava-prod -c prd -- python -X utf8 tools/qa/grade_call.py --agent agent_9ebb41c9bd8af214649328f107 --last 20

# grade a folder of saved call JSON (any depth; Session A's {agentKey,test,label,call} wrapper is understood)
doppler run -p ava-prod -c prd -- python -X utf8 tools/qa/grade_call.py --dir ops/tuning/calls/2026-10-29 --batch

# run N scenarios in text against an agent id (default version = the one bound to the line's number), then grade them
doppler run -p ava-prod -c prd -- python -X utf8 tools/qa/text_caller.py --line aic --scenarios aic-001,aic-002 --grade
doppler run -p ava-prod -c prd -- python -X utf8 tools/qa/text_caller.py --agent agent_0fa59b66c74f6366b0af8035dc --version 3 --n 10 --grade
```

Flags worth knowing: `--batch` (Batch API, half price, a few minutes) · `--no-model` (code metrics only, $0) ·
`--no-verify` (skip the second pass) · `--label` / `--out` (where the per-call JSON and `summary-<label>.md` go;
default `ops/tuning/qa/<today>/`).

## What is computed where

| Check | Where | How |
|---|---|---|
| Per-turn gap, p50 / p95, max gap + turn, silence prompts | code | Phase 0 method: agent first word − caller last word from `transcript_object` word timestamps; overlaps excluded; agent turn after ≥5 s of its own silence = silence prompt |
| Duration, disconnection reason, extracted variables present / empty | code | call object |
| Greeting byte check | code | first agent words vs `lines.json` (AIC: n01_p / n01_b static text; AVA: the call's own `opening_line`) — `exact` / `cut short` / `changed` |
| Recorded-line notice | code | "recorded" in the agent's words |
| Caller questions answered before the next ask, re-asked fields, invented facts, dead ends, one question per turn, booked-before-tool, "owner", outcome | Claude Haiku 5.5 + `rubric.md` | structured JSON verdict |
| Second pass | Claude Haiku 5.5 | each skipped question, invented fact, dead end and re-ask is re-asked on its own with only the nearby turns; it counts only if both passes find it |

Red flags in the summary: question skipped · gap over 3 s · invented fact · greeting changed · dead end · field
re-asked · booked before tool · said owner/name · no recorded notice · no trip sheet.

## Files

- `grade_call.py` — the grader. `rubric.md` — the house rules, sent word for word to the grader; edit rules here.
- `lines.json` — per-line agent ids and stored greetings. `_mask.py` — masking (public repo rules) applied before
  anything is saved or sent. `_retell.py` — the allowlisted Retell transport. `_claude.py` — Claude client, ledger, cap.
- `text_caller.py` — Sonnet 5.5 plays a scenario against the agent over the playground endpoint, every tool mocked
  (fail-closed if a tool cannot be named). `write_scenarios.py` + `scenarios/*.json` — 50 AIC + 20 AVA scripted
  callers (`aic-001` = the Denver script, verbatim).

Text has no audio: the text caller tests what the agent says, never how fast. Speed is measured on real calls only.
Outputs land under `ops/tuning/qa/` (masked, local; not committed by this tool).
