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

## Rollout result (2026-07-07)

**AVA SALES v3 published** — agent `agent_d5ada9f774fe3ae7f034d2c677` **version 31**
(`version_title: "AVA SALES v3"`), now `latest_published` on `+14142408930`.

- Old published version: **30**  ·  New published version: **31**
- LLM `llm_d0f4aff62bb8b60ff878055aa18c` v31: model `gpt-5.5`, temperature `0.2`
- Knowledge base (handbook): `knowledge_base_913893be26fee4bc` — "AVA Sales Handbook v3" (Pricing & Tiers + FAQ)
- Voice: LOCKED `custom_voice_705a2cb49b0413f7fc1c456d02` (Ava – Eager; elevenlabs), `voice_speed 1.05`
- Snapshots: `agent-v31-PUBLISHED-2026-07-07.json`, `llm-v31-PUBLISHED-2026-07-07.json`

### One-line rollback (revert live number to pre-v3 = v30)
```bash
doppler run --project ava-prod --config prd -- bash -c 'curl -s -X PATCH "https://api.retellai.com/update-phone-number/+14142408930" -H "Authorization: Bearer $RETELL_API_KEY" -H "Content-Type: application/json" -d "{\"inbound_agents\":[{\"agent_id\":\"agent_d5ada9f774fe3ae7f034d2c677\",\"agent_version\":30,\"weight\":1}],\"outbound_agents\":[{\"agent_id\":\"agent_d5ada9f774fe3ae7f034d2c677\",\"agent_version\":30,\"weight\":1}]}"'
```
To return to v3 after a rollback, re-run the same command with `agent_version` set to `"latest_published"` (or `31`).
