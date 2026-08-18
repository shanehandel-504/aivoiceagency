# AVA SEAL WINDOW — warm recognition, sim-guard, owner alerts, post-call rail

**Date** 2026-08-18 · **Commits** `6f954c1` (snapshot floor) → `ae38e22` (seal)
**Branch** `aic/p0-live-write-auth-prep` · pushed
**Scope touched** the 8930 number · `agent_d5ada9f774fe3ae7f034d2c677` · n8n `c5GPBkma1HyvonEa` · new n8n `kpYlhLbwSD0W1sE0`

---

## DONE

| Artifact | Live status | Proof |
|---|---|---|
| Config snapshot (number, agent draft, all 44 versions, booking workflow) | COMMITTED `6f954c1` | `config-snapshots/2026-08-18-ava-seal/` |
| WARM-RECOGNITION-8930 | **LIVE** | number `inbound_webhook_url` → `/webhook/ava-inbound-lookup`; unknown caller → HTTP 200, `caller_known="false"`, 517 / 1119ms vs 5s budget |
| SIM-GUARD | **LIVE** | sim payload → `success:false, reason:"simulation_no_phone_leg"`; execution 6634/6640 ran exactly 4 nodes, every write node absent; GHL search returns nothing |
| OWNER-ALERTS-8930 | **LIVE** | `Create Appointment → Body → SMS → Email → Respond OK`; both legs `onError=continueRegularOutput`; 3 `$vars` dereferenced live; 17/17 gate assertions |
| Appointment title | **LIVE** | `"AVA Discovery Call - {name}"`; `"Strategy Call"` gone from node **and** workflow description |
| POSTCALL-RAIL-8930 | **LIVE** | `kpYlhLbwSD0W1sE0` active, Error Sentry attached; `call_analyzed` → 200, Gmail returned message id `1a015d00a7aaec60`; agent `latest_published` v43 posts to it |
| board.json | **COMMITTED + PUSHED** | 4 items `live`, 4 ISO log entries, `2026-08-18T12:44:21-05:00` |

Final gate: **35 assertions, 0 failures**, all four items LIVE, re-read from the live APIs.

---

## THREE THINGS THAT WOULD HAVE SHIPPED GREEN AND BEEN WRONG

**1 · `Respond OK` read `$json.id`.** Correct only while it sat directly on the
appointment node. Splicing the alert chain in front of it makes `$json` the Gmail
node's output — every real booking would have returned `appointment_id: null` to
the caller while the appointment existed. Rebound to `$('GHL Create Appointment')`.
The same class of bug appeared in the new rail: `$('Contact Matched?').all().length > 0`
is true on **both** IF branches, so the response reported `noted: true` on a call
where nothing was written. Now recomputes the match predicate.

**2 · Retell `webhook_url` is VERSIONED.** Measured, not assumed: v0–v5 carry none,
v6 carried an n8n URL, v7–v43 carried chat-dash. `get-agent` returns the unpublished
DRAFT; the number routes `agent_version: "latest_published"`. A PATCH plus the
briefed "verify by GET" reads **fully green while every real call keeps firing the
old URL**. Only a publish moves it. Publishing was gated behind explicit approval —
outward-facing on a live line, and this repo records it as Shane's call (V37
CARVE-OUT). That carve-out's stated reason was the voice freeze; it was measured
and found absent — **LLM v42 and v43 are byte-identical**, agent diff is version
metadata only. Published on approval; `latest_published` = v43.

**3 · The requested webhook path was already taken.** `ava-postcall` is owned by
ACTIVE workflow `6r8YHuMEJbxeDyT5` "AVA Post-Call to GHL (Demo Send)" — a mature
rail carrying owner SMS + email, a Notion call log, a caller text-back and a
quarantine gate — and outside the scope fence. Ownership was enumerated **before**
creating anything rather than gambling on activation failing, because if activation
had succeeded it would have silently stolen live traffic. Built on
`ava-postcall-wrap`; incumbent re-read afterwards and confirmed still ACTIVE.

---

## GOTCHAS / OPEN

- **Duplicate owner notifications are likely.** The account-level Retell hook still
  delivers `call_analyzed` to `/webhook/ava-postcall` (the incumbent rail), and the
  agent now also posts to `/webhook/ava-postcall-wrap`. Expect **two** owner
  notifications per call until one is retired. The new rail duplicates a subset of
  what the incumbent already does.
- **Rollback for the publish** is one call: pin the number's `inbound_agents` to
  `agent_version: 42`.
- `hq/board.json` also carried a prior session's uncommitted RETELL API MIGRATION
  note, inseparable from this flip in one file. It introduces no new number.
- A live Twilio SIP credential (`sip_outbound_trunk_config.auth_username`) comes back
  on every `get-phone-number`. The snapshot tool redacts it; anything else that
  saves that object must too.
- `tools/ava-seal/00-secretgate.mjs` is the diff-aware commit guard — it blocks only
  what a change *introduces*. A whole-file scan of `board.json` flags its own audit
  history forever and trains you to wave the gate through.
