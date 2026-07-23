# RUN 1.6 — SCRIPT v3 DEPLOY + QUOTA HYGIENE + PAGE LIST + SURFACE SEAL

**Date:** 2026-07-23 · **Branch:** `main` · **Public pages touched:** ZERO (POLISH FREEZE intact)

---

## UNIT 1 — SCRIPT v3 → BOTH AGENTS

`docs/demo-agent-prompt.md` overwritten wholesale with the Grok-merged SCRIPT v3 canon.
The Run-1.5 provenance warning ("THE DOC AND THE DEPLOYED AGENT DIVERGE ON PURPOSE") is gone.

**The doc now ships byte-for-byte.** `DEPLOY_PATCHES` in `tools/retell-demo-agent.mjs` is
**empty** — the 2-entry patch table that rewrote Stage 4 is retired, because v3 carries its own
`INTERIM ACTIVE VARIANT` wording inside the script. There is no longer any transformation between
what is committed and what AVA says.

| Agent | agent_id | llm_id | Version | Byte-match |
|---|---|---|---|---|
| AVA HEAR-IT-LIVE v1 (brand) | `agent_67381fcfabf6731dad4f40c590` | `llm_b0300ecfb0c94997cd3a8156b59f` | v1 → **v2**, published | **PASS** 2333 = 2333 |
| AVA HEAR-IT-LIVE v1-CARTESIA | `agent_c705538081e1693ce3c358fc68` | `llm_12c0ea2cafbc97c80c1724f5b2e8` | v1 → **v2**, published | **PASS** 2333 = 2333 |

New `--verify` mode GETs each agent, resolves its published LLM version, and byte-compares the
live `general_prompt` against the file. It exits non-zero on mismatch and prints the first
differing character, so this is gateable:

```bash
doppler run --project ava-prod --config prd -- node tools/retell-demo-agent.mjs --verify
```

v3 markers confirmed **on the wire**, not just by length: STAGE_1 `"Am I coming through clear"`,
`INTERIM ACTIVE VARIANT`, STAGE_5 `"It should be right there"` — all `true` on both agents.

Voicemail: v3 SETTINGS declares it **unchanged**. Carried forward verbatim (468 chars), untouched.

### OPEN RISK — flagged, shipped as ordered

v3 STAGE_4 instructs *"call trigger_dashboard_sms FIRST, unconditionally."* That function is
**not registered on either agent** — `general_tools` is `end_call` only. It shipped verbatim per
the run order. AVA cannot invoke a tool she does not have, so the exposure is narration drift
(AVA describing a send), not a failed send: the post-call SMS is fired by n8n regardless.
Fix in Run 2 by registering the function or dropping the clause.

---

## UNIT 2 — n8n QUOTA HYGIENE

Root cause of the 4d22h outage was never a workflow bug. Two 10-minute pollers burned
**8,640 executions/month** against a 10,000 cap — 86% of the plan spent on empty sweeps.

| Workflow | id | BEFORE | AFTER | Monthly |
|---|---|---|---|---|
| AVA Booking Receipt | `NMSWFtcyEQhSypSx` | every 10 minutes | **every 30 minutes** | 4,320 → 1,440 |
| AVA Drip Engine v1 | `Pu661B1J1ZgezJT7` | every 10 minutes | **every 30 minutes** | 4,320 → 1,440 |

**Projected monthly executions: 8,640 → 2,880 of 10,000. Headroom 13.6% → 71.2%** (gate: ≥30%) — **PASS**.

Both verified `active=true` after the write, both confirmed at `minutesInterval: 30`.

**No further retune is possible.** Of 13 active workflows, the other 11 are all event-driven
webhooks with zero timer cost — there is no other schedule trigger anywhere in the account.
Neither retuned workflow has a webhook equivalent available today: the drip genuinely needs a
timer (nothing can webhook "it is now day 3"), and a GHL appointment webhook for the booking
receipt would need a GHL-UI change, which is Shane's hands.

New tool `tools/n8n-quota-hygiene.mjs` — `--audit` / `--fix` / `--stats`. **Idempotent**: a third
run reports "none needed — already clean."

**Gotcha captured:** `PUT /workflows/{id}` rejects any `settings` key outside its own schema, and
the n8n UI writes two the public API will not accept back — `availableInMCP` and `binaryMode`.
Echoing settings back 400s with *"must NOT have additional properties."* The tool whitelists
the 8 accepted keys instead.

### Execution health since the PRO upgrade (2026-07-23T02:40Z)

**252 executions · 249 success · 3 error · 98.8% — HEALTHY, the outage is over.**
Both retuned workflows: 112/112 = 100%.

The 1,423 errors across the full retained window are the historical outage, not current state —
which is exactly why `--stats` splits on the recovery timestamp.

**Still failing, out of RUN 1.6 scope:** `AVA Post-Call to GHL (Demo Send)` (`6r8YHuMEJbxeDyT5`) —
2 of 2 executions since recovery die at node `GHL Upsert Contact` with `400 Bad request`, most
recently 2026-07-23T20:40Z. Same class as the Run-1.5 empty-body upsert bug, different workflow.

### Outage callback list — verbatim from `reports/2026-07-22-outage-recovery.md`

| # | When (CDT) | Caller | Line | Dur | Outcome | CRM trace | Priority |
|---|---|---|---|---|---|---|---|
| 1 | 2026-07-18 10:35 CDT | `OWNER TEST LINE` (Shane's cell — redacted) | AVA SALES (public line) | 180s | max_duration_reached | **NONE** | **P0 - OWNER TEST** |

**P1 (real talk, zero CRM record): 0** · **P2 (real talk, no booking): 0** · total calls: 1

**Zero customers to call back.**

---

## UNIT 3 — PAGE LIST

`reports/pages-list.md` — all **58** sitemap URLs, grouped, one line each:
core 7 · verticals 6 · cities 30 · trades 4 · blog & guides 8 · utility 3.

Machine-diffed against `sitemap.xml`: **58/58, zero dropped, zero invented.**
Also documents the 7 deliberately-unlisted surfaces (`/booked`, `/staging/xray.html`, `/work/*`,
`/cockpit/`, `/chatgpt-example`, `/ad-stage`, `templates/lander-master.html`) so nobody
mistakes them for missing pages.

---

## UNIT 4 — SURFACE SEAL

| Path | Status | Sealed? |
|---|---|---|
| `/retell-backups/` | **404** | YES — regression check holds |
| `/reports/2026-07-22-outage-recovery.md` | **404** | YES — no `.vercelignore` change needed |
| `/automation/number-pool.json` | **404** | YES |
| `/docs/demo-agent-prompt.md` (extra probe) | **404** | YES |
| `/tools/stamp.py` (extra probe) | **404** | YES |

`.vercelignore` already lists `reports`, `tools`, `docs`, `automation`, `retell-backups`, `.claude`.
The conditional branch ("if 200: add `reports/`") **did not fire** — nothing to add.
Two extra probes were run beyond the brief to confirm the doc carrying the new script and the
build tooling are not served either.

---

## UNIT 5 — BOARD + WRAP

`hq/board.json`: L2 (Voice) → SCRIPT v3 DEPLOYED · `drip` lane relabelled **Drip / Automation**
→ quota hygiene state. Top-level `updated` refreshed, one ISO-timestamped LOG entry prepended
(33 total). JSON validated.
