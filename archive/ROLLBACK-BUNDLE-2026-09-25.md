# ROLLBACK BUNDLE — AI Chauffeur Capture Desk · 2026-09-25

Written by **RUN A (archive-first + preconditions)**. Every value below was read from the live
APIs on 2026-09-25 between 19:05Z and 19:30Z, not from memory or an earlier report. This run
made **no change** to any live agent, phone number, workflow or tenant row — the before/after
proof is in `reports/2026-09-25-aic-run-a-archive.md`.

Secrets are not in this file. Where a restore needs one, the step names where it lives.
The repo is **public on GitHub**; `.vercelignore` keeps `/archive` off both websites, not off GitHub.

---

## 1 · Live agent versions

| Agent | Id | Serving (published) | Flow pinned | Draft | Draft differs? |
|---|---|---|---|---|---|
| AI CHAUFFEUR FLOW v1 | `agent_2d1d687eb85e6d5d0e720795c2` | **v27** | `conversation_flow_ec560891b66b` **v27** | v28 (unpublished) | **Yes** — `max_call_duration_ms` 900000 → 720000 and `end_call_after_silence_ms` unset → 60000. Flow v28 is identical to flow v27. |
| Reliable Limo Reservation Desk — AVA (Demo) | `agent_367be6cf3c722e89fca03e34b5` | **v29** | `conversation_flow_36c260d873de` **v29** | v30 (unpublished) | No — only `version_description` / `base_version`. Flow v30 = v29. |
| AVA — AI Voice Agency (sales, 8930) | `agent_d5ada9f774fe3ae7f034d2c677` | **v49** | `llm_d0f4aff62bb8b60ff878055aa18c` v49 | v50 (unpublished) | No — only `version_description` / `base_version`. |
| **AIC-FULL-ARCHIVE (frozen 2026-09-25)** | `agent_932712356e6093929d711033d2` | none — v0 unpublished | `conversation_flow_fe11945611fa` v0 (its own copy) | — | Created by RUN A from v27. No number. |

Live AIC settings at v27: voice `cartesia-Kate` on `sonic-3.6` (temp 0.72, speed 1) · flow model
`gpt-4.1` cascading, high priority, temp 0.15 · `max_call_duration_ms` 900000 ·
`reminder_trigger_ms` 10000 × 1 · `interruption_sensitivity` 0.82 · `responsiveness` 0.9 ·
backchannel on at 0.35 · `denoising_mode` noise-cancellation · `data_storage_setting` everything ·
`opt_in_signed_url` false · `webhook_url` → `circulant.app.n8n.cloud/webhook/demo-postcall`.

Reliable v29: `cartesia-Kate` on `sonic-3-latest` (temp 1) · `gpt-4.1` cascading temp 0.3 ·
`max_call_duration_ms` 720000 · `end_call_after_silence_ms` 60000 · `reminder_trigger_ms` 6000 ·
`interruption_sensitivity` 0.82 · `responsiveness` 0.9 · backchannel **off** · same webhook.

**The archive copy differs from v27 in one field:** Retell stamped `contact_memory_config`
`{enable_read:true, enable_update:false}` on the new agent as a platform default (v27 has no such
field). Its flow differs only by Retell's default `skippable:false` on each node. All 3 local
component ids were preserved and all 9 component references resolve.

## 2 · Phone-number bindings (`GET /v2/list-phone-numbers`)

| Number | Inbound → | Outbound → | Version | Number-level inbound webhook |
|---|---|---|---|---|
| +1 414-775-0019 | `agent_2d1d687eb85e6d5d0e720795c2` | same | `latest_published` (= v27) | none |
| +1 414-409-5008 | `agent_367be6cf3c722e89fca03e34b5` | same | `latest_published` (= v29) | none |
| +1 414-240-8930 | `agent_d5ada9f774fe3ae7f034d2c677` | same | `latest_published` (= v49) | `/webhook/ava-inbound-lookup` → WF-ANI-AVA `ITGRwcRKxLgmKnBZ` |
| DEMO-POOL-01…04 (414-250-8042, 414-300-6409, 414-946-6486, 414-206-1886) | `agent_d5ada9f774fe3ae7f034d2c677` | `agent_67381fcfabf6731dad4f40c590` | `latest_published` | none |
| DEMO-POOL-05 (414-246-8976) | `agent_cfc97001055d3a5e377d0979d7` | same | (unset) | none |

Neither chauffeur number is pinned: both follow `latest_published`, so **publishing any new
version of either agent changes what answers the phone immediately.**

## 3 · /try binding

aichauffeur.ai/try → n8n **WF-TRY-WEBCALL** `9nKn8i2dRuALikuv` (active version
`89829d66-d05c-4e54-96de-2647f627db69`) → node **Create web call** →
`POST https://api.retellai.com/v3/create-web-call` with
`agent_id: agent_2d1d687eb85e6d5d0e720795c2`, `agent_version: "latest_published"` (= v27),
`agent_override.agent: {max_call_duration_ms: 480000, end_call_after_silence_ms: 60000}`,
`metadata.source: aichauffeur.ai/try`. Credential `Retell API` `kGVhqVmqLgPUAxpM`.
**A phone-number pin does not cover /try** — /try follows the agent's `latest_published`.

## 4 · n8n active versions (draft == active on every one — no drift)

| Workflow | Id | Active version | Error workflow |
|---|---|---|---|
| DEMO POST-CALL RAIL v1 (the rail) | `TkETvvnABhUPd7ME` | `0652d902-3832-4a62-ba89-9edd73e33b2f` | `SlnAeMrVRORsF0w7` |
| WF-RATE — Rate Engine (code RCv2.3) | `2JlTkvQ1dGiwwjw9` | `aa76fa61-cadf-4fe9-a80e-923327bb8056` | `SlnAeMrVRORsF0w7` |
| WF-COMMIT — Reservation Commit | `O1fX0FpbT0qqMnqJ` | `61c1f22b-1b4d-429d-972b-47010b1d10f2` | `SlnAeMrVRORsF0w7` |
| WF-ANI-AVA (8930 sales line) | `ITGRwcRKxLgmKnBZ` | `b67ac140-3739-497b-acbf-51f27a3c3f87` | `SlnAeMrVRORsF0w7` |
| WF-ANI — AI Chauffeur (the one N00 calls) | `XLSd3vt41vhsXIA9` | `5555fbf6-73c1-42a2-b12c-029699c0b806` | `SlnAeMrVRORsF0w7` |
| WF-TRY-WEBCALL | `9nKn8i2dRuALikuv` | `89829d66-d05c-4e54-96de-2647f627db69` | `SlnAeMrVRORsF0w7` |
| AVA · book_appointment · realtime | `c5GPBkma1HyvonEa` | `142029ee-8ea2-4b71-8798-fce3147537d3` | `SlnAeMrVRORsF0w7` |

Full listing of all 29 workflows (23 active) with version ids: `n8n/2026-09-25/n8n-workflow-listing.json`.

## 5 · Tenant config snapshot

Tenants live **in code**, not in a table. There are two places, both inside the rail `TkETvvnABhUPd7ME`.

**Build Trip Ticket → `TENANTS`** (keyed by Retell `agent_id`):

| agent_id | name | short | mode (label) | Intake prefix |
|---|---|---|---|---|
| `agent_367be6cf3c722e89fca03e34b5` | Reliable Limo & Charter | Reliable Limo | CAPTURE-ONLY | `REL-` |
| `agent_2d1d687eb85e6d5d0e720795c2` | AI Chauffeur | AI Chauffeur | RATE CARD | `AIC-` |
| *(any other agent)* | `custom_analysis_data.tenant_name` or "AI Chauffeur" | same | DEMO | `AIC-` |

Prefix rule: `short === 'Reliable Limo' ? 'REL' : 'AIC'`, then the last 8 alphanumerics of the
call id, then the caller's last 4 digits. **The archive agent id is not in `TENANTS`** — calls to
it fall through to DEMO / `AIC-`.

**Todd Copy Gate → `DEMO_RECIPIENTS`** (prospect copy of the owner ticket):
both tenants set to `''` — **nothing ships to any prospect today.**

Recipients wired in the rail:
- **Email Ticket to Owner** (Gmail `75yoiG46HfIX5VkQ`) → the owner's personal gmail, hardcoded in
  the node — `[REDACTED-owner-email]` in the archive. It is **not** the same value as n8n
  Variable `OWNER_ALERT_EMAIL` (hash-compared this run); re-enter it by hand on an import.
- **Email Copy to Caller** → `caller_email` captured on the call, only when a trip exists.
- **Owner SMS Alert** → GHL contact `$vars.OWNER_ALERT_CONTACT_ID`, from `$vars.OWNER_SMS_FROM`,
  after **Ensure Owner Contact** upserts `$vars.OWNER_CELL`.
- **SMS Ticket to Caller** → the upserted caller, gated by `sms_ok`.

Flow-side tenant defaults (`default_dynamic_variables`, AIC v27): `tenant=demo`,
`pricing_mode=RATE_CARD`, `account_type=retail`, `test_mode=false`.

Rate card: 7 n8n Data Tables, tenant `demo`, rows stamped `RCv1.0` (the engine code is `RCv2.3`
and carries its own national matrix). Row exports: `n8n/2026-09-25/datatable.*.json`.

## 6 · Restore calls

Run every call under Doppler, never with a pasted key:
`doppler run --project ava-prod --config prd -- sh -c '<curl …>'` with
`-H "Authorization: Bearer $RETELL_API_KEY"` or `-H "X-N8N-API-KEY: $N8N_API_KEY"`.

**R1 — Pin the chauffeur line back to v27 (fastest; phone only).**
```
PATCH https://api.retellai.com/update-phone-number/+14147750019
{"inbound_agents":[{"agent_id":"agent_2d1d687eb85e6d5d0e720795c2","agent_version":27,"weight":1}],
 "outbound_agents":[{"agent_id":"agent_2d1d687eb85e6d5d0e720795c2","agent_version":27,"weight":1}]}
```
Un-pin later with `"agent_version":"latest_published"`. Verify with `GET /v2/list-phone-numbers`
→ `items[].inbound_agents`. Reliable is the same call on `+14144095008` with
`agent_367be6cf3c722e89fca03e34b5` / `29`.

**R2 — Make v27 the latest published again (covers the phone AND /try).**
`POST /create-agent-version/agent_2d1d687eb85e6d5d0e720795c2` body `{"base_version":27}` (that key
only — anything extra returns 400) → note the new version N → `POST /publish-agent-version/agent_2d1d687eb85e6d5d0e720795c2`
body `{"version":N}`. Then read `GET /get-agent-versions/…` and confirm the max published version's
`response_engine.version` points at a flow version whose content matches flow v27.

**R3 — Last resort: serve the frozen archive agent.**
`POST /publish-agent-version/agent_932712356e6093929d711033d2` body `{"version":0}`, then R1 with
`agent_932712356e6093929d711033d2` / `latest_published`. First add that id to rail `TENANTS` (§5) or
its tickets read as DEMO. Its webhook is the live rail, and its tools call the live WF-ANI /
WF-RATE / WF-COMMIT.

**R4 — /try only.** Restore WF-TRY-WEBCALL to `89829d66-…` (R5), or edit node *Create web call*
to `"agent_version":27`. Kill switch: unpublish WF-TRY-WEBCALL (every tap falls back to 775-0019).

**R5 — Restore an n8n workflow to the version in §4.**
Preferred (MCP): `get_workflow_version(workflowId, versionId)` → if present, `restore_workflow_version`
→ `publish_workflow` → assert `versionId === activeVersionId`. Most workflows here retain very
little history, so check first.
Fallback (REST, from the archive file): `PUT /api/v1/workflows/{id}` with **only**
`name, nodes, connections, settings, staticData`. Whitelist `settings` rather than echoing it (an echo
400s) and keep `settings.errorWorkflow: "SlnAeMrVRORsF0w7"` (omitting it silently detaches the
Error Sentry). Then `POST /api/v1/workflows/{id}/activate` and assert `versionId === activeVersionId`.
Before the PUT, replace every `[REDACTED-*]` token: the owner email (§5) and nothing else.
The rate secret lives in `$vars.RATE_SHARED_SECRET`, not in node code, so WF-RATE / WF-COMMIT / WF-ANI
code restores intact. Re-attach credentials by id if the import drops them (`kGVhqVmqLgPUAxpM` Retell,
`wOmBNtlzVgn2fVAc` GHL Header Auth, `75yoiG46HfIX5VkQ` Gmail).

**R6 — Rebuild a conversation flow from the archive JSON (proven this run).**
`POST /create-conversation-flow` with the archived flow minus `conversation_flow_id`, `version`,
`last_modification_timestamp`, `is_published` and the `_archive` header. Local component ids are
kept and component nodes resolve. **First** replace `[REDACTED-x-rate-secret]` in the 4 tool
headers with the value of n8n Variable `RATE_SHARED_SECRET` (hash-verified identical this run), and
`[REDACTED-owner-email]` in the email-capture prompt example. Then `POST /create-agent` with the
archived agent config pointed at the new flow (`response_engine: {type:"conversation-flow",
conversation_flow_id, version:0}`).

**R7 — Rate-card rows.** n8n MCP `add_data_table_rows` (project `1XuT7aKjecjLpe2J`) with the
`rows` array from `n8n/2026-09-25/datatable.<table>.json`, table ids as recorded in each file.

GHL: nothing was written except one test appointment on the ZZ sink, created and deleted (§ report).
There is nothing in GHL to roll back.
