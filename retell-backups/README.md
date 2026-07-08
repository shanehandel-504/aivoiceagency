# Retell agent backups — AVA live demo line (414-240-8930)

Verbatim Retell API snapshots taken before the **AVA SALES v3** rollout.

- **Agent:** `agent_d5ada9f774fe3ae7f034d2c677` — "AVA — AI Voice Agency"
- **LLM:** `llm_d0f4aff62bb8b60ff878055aa18c` (retell-llm, gpt-5.5)
- **Live number:** `+14142408930` — inbound + outbound bound to `latest_published`

## Files (captured 2026-07-07)

| File | What it is |
|---|---|
| `agent-2026-07-07.json` | Agent **v30** — the version live on the number at backup time (`is_published: true`) |
| `llm-2026-07-07.json` | LLM **v30** — prompt / temperature / tools referenced by agent v30 |
| `agent-draft-v31-2026-07-07.json` | Agent v31 (unpublished draft head) at backup time |
| `llm-draft-v31-2026-07-07.json` | LLM v31 (unpublished draft head) at backup time |
| `phone-numbers-2026-07-07.json` | Phone-number → agent binding (verbatim) |

## Rollback

The phone number serves `latest_published`. To revert AVA to the pre-v3 state,
re-point the number to the known-good published version **30** (exact command is
printed in the rollout report at publish time). Nothing here is ever deleted —
old published versions remain immutable in Retell and can be re-served at will.
