# RUN — CHAUFFEUR RATE ENGINE v1.0 + UNIVERSAL TEXT-BACK

**2026-08-03 · single session · all keys via Doppler `ava-prod/prd`**

Everything asked for is live except two things that were **reports, not builds** — and one of
those turned out to be a P0 that was already broken before this run started.

---

## Phase 0 — gates and recon

### 0a · GHL gate — PASS

`AIChauffeur — Booking Response` (`6fd1fb71-b18c-4924-afdf-174bec8c8154`) is **`draft`**, v11,
last touched 2026-07-31. Draft is GHL's not-live state, so the gate opens and Phases 3–4 proceed.

**Separate finding, and it matters more:** `01_AVA_Missed_Call_Text_Back`
(`32fdabca-9c16-41d2-8c05-f7165a9b50a8`) is **`published`**. The GHL workflow API is read-only —
every write route 404s and triggers are not readable — so it **cannot be paused from here**. If its
trigger overlaps an answered call, a caller gets two texts. It probably fires only on *missed*
calls, where the new n8n rail fires on `call_analyzed` (answered), but that is inference, not
verification. **Pause it by hand.** This is the #1 manual step below.

### 0b · Cloudflare — reported, NOT changed. **P0 found.**

GitHub → Workers Builds is connected and **has failed on every commit since 2026-07-09**
(check `Workers Builds: aichauffeur-token`, app `cloudflare-workers-and-pages`). Last green build
was `938cc52`; the worker's `modified_on` is 32 seconds later, so that build is what is live now.

**The deployed worker is not the token worker.** Measured directly:

| Probe | Result |
|---|---|
| `GET /` | 200, `text/html`, 49,475 bytes, `<title>AI Receptionist for Local Service Businesses …` |
| `GET /health` | **404** |

`worker.js` is path-agnostic — its GET branch returns 200 JSON for *any* path. A 404 on an
arbitrary path is dispositive. The endpoint is serving a static snapshot of the AVA marketing
homepage frozen at `938cc52`, and the response body is byte-identical to `git show 938cc52:index.html`.

**The LiveKit token endpoint is dead.** `aichauffeur.ai/demo` cannot mint a session.

`git diff --stat 938cc52 HEAD -- voice-stack/worker/` is empty, so repo drift is not the cause.
There is no `wrangler.toml` at the repo root — the only one is `voice-stack/worker/wrangler.toml`.
A build root pointed at the repo root with no wrangler config there falls back to deploying the
directory as static assets, which is exactly what is being served. The fix is Cloudflare build
configuration, not code. **No Cloudflare changes were made — the brief said report only.**

`KNOWN_ISSUES.md` blames PR #33 on 2026-05-25. That is wrong: builds were green on 2026-07-08/09.

**Backup caveat.** `infra/backups/worker-20260803.js` holds the **repo** source plus the measured
evidence above, clearly labelled. The *live* script source could not be captured: the Cloudflare
MCP `workers_get_worker_code` returns a null payload and fails schema validation (reproduced three
times), and Doppler holds no Cloudflare API token for a fallback. Backing up the running script
is still outstanding.

### 0c · Retell audit — one brief claim is FALSE

| Claim | Verdict |
|---|---|
| 414-775-0019 bound to **V14** | **FALSE — it serves V13.** |

`+14147750019` → `agent_8e9e7d477949c6babcbdcc756d` ("AI CHAUFFEUR"). From `/list-agents`:
v14 is `is_published: false`; **v13 is the highest `is_published: true`**. The binding omits
`agent_version` entirely (the only number in the account that does), so it resolves to latest
*published* — which cannot be an unpublished draft under any reading. `get-agent` returns the v14
draft, exactly the documented trap; reading it alone gives the wrong answer.

**Custom voice.** Exactly three `custom_voice_*` exist, all provider `elevenlabs`. The chauffeur
agent uses **`custom_voice_705a2cb49b0413f7fc1c456d02`** on both v13 and v14.
Retell exposes **no** underlying ElevenLabs id on `/list-voices` or `/get-voice` — only
`voice_id, voice_type, provider, voice_name, avatar_url, preview_audio_url`. The map to
`gJx1vCzNCD1EQHT212Ls` is an **inference from an account-unique name match**, not an API-proven
link: that ElevenLabs voice is the sole holder of the name "Ava – Eager, Helpful and Understanding".

**Blast radius:** all eight Retell numbers resolve to agents on that same custom voice, including
the live public AVA line 414-240-8930. **Tuning it is not scopeable to one number.** The only
custom voice safe to tune is `custom_voice_a1ba4a6c2de775d60d987d5120` (same name, bound to no phone).

### 0d · The `rate_lookup` contract does not exist

The brief calls it "the frozen rate_lookup contract." **There is no such contract.** Swept: the
working tree, 373 commits across 74 branches, 75 Retell agent versions, 73 Retell LLM versions
(the complete tool roster is `end_call, book_appointment, write_reservation, write_to_crm,
send_link, alert_owner`), 20 n8n workflows, 45 GHL custom fields, and Notion.

`all_in_total`, `NO_ROUTE_FOUND`, `CORPORATE_RATE_REQUIRED` and `HUMAN_REVIEW_REQUIRED` return
**zero hits in every system**. The only literal `rate_lookup` anywhere is in two Notion pages
describing a **third-party Limo Anywhere** endpoint path, with no fields named.

**So this run defined the contract.** It is written down in `automation/rate-engine/README.md`.
Treat it as a new decision needing your sign-off, not a recovered spec.

**Related, and load-bearing:** the live chauffeur agent is **hard-enforced capture-only**.
`schema/aic-reservation-v1.json` pins `pricing.mode` to the constant `CAPTURE_ONLY`, and the live
LLM prompt says verbatim *"Never quote numbers or ranges of any kind; all rates defer to dispatch."*
The engine is built and correct, **but no agent calls it yet**, and wiring one to speak a number is
a schema + prompt change, not a wiring task. Nothing in this run touched either.

---

## Phase 1 — pricing data · LIVE

8 tables in n8n project `1XuT7aKjecjLpe2J`, **100 rows**, every row carrying
`rate_card_version RCv1.0` · `tenant_id demo` · `effective_from 2026-08-03`.

| Table | Id | Rows |
|---|---|---|
| `vehicle_classes` | `dofpCkfUf9u13OCt` | 18 |
| `hourly_rates` | `dhypYajHbsOUqua6` | 18 |
| `airport_zones` | `ffdnELJPWfa3yLsj` | **32** (5 `SEED_APPROVED` + 27 `DEMO_SEED`) |
| `airport_vehicle_adjust` | `KQQy3fSHRlnWKmHQ` | 18 |
| `addons` | `sjmTvvww3QwueBCA` | 5 |
| `pricing_policies` | `MQSD2rRYt5POaFYK` | 1 |
| `holidays` | `KNVXERtLOqHrmSzr` | 8 |
| `quote_audit` | `g4tjdTKEwDjnojQU` | write target |

Three judgment calls, all flagged rather than buried:

- **`vehicle_key` everywhere.** The brief named the column `key` on table 1 and `vehicle_key` on
  table 2. One name for one join column.
- **`holidays` was added.** The brief called for a holiday stub but did not list the table.
- **`airport_enabled` / `hourly_enabled` are `true` for all 18.** Availability is not the gate that
  matters; `quote_only` and `review_required` do the real work, and they escalate with a reason
  instead of flatly refusing.

---

## Phase 2 — WF-RATE · LIVE

**`2JlTkvQ1dGiwwjw9`** · 19 nodes · `active: true` · `versionId === activeVersionId`
(`154bc6be-…`) · Error Sentry `SlnAeMrVRORsF0w7` attached.

```
POST https://circulant.app.n8n.cloud/webhook/tools/rate-lookup
```

Auth is `x-retell-signature` (HMAC-SHA256 over the body) **or** `x-rate-secret`, both compared with
`crypto.timingSafeEqual` against the n8n Variable **`RATE_SHARED_SECRET`** (created this run, id
`yKKPumZBIAclDIwV`, 64 hex chars). Nothing sensitive is in the repo or in a node body (§ 9).

All math is deterministic, in one Code node. **The LLM never calculates.** Full contract, statuses
and math in `automation/rate-engine/README.md`.

Two design notes worth your attention:

- **`INPUT_INCOMPLETE` is a status I added.** A missing field is a question the agent should ask,
  not a dispatch escalation. Folding it into `HUMAN_REVIEW_REQUIRED` would have sent a human after
  a caller who simply had not said the date yet.
- **$5 rounding applies to the base, not the total.** A $5-multiple base × 20% is always a whole
  dollar, so the line items always sum exactly to `all_in_total`. Rounding the total instead would
  produce an emailed ticket whose lines do not add up. The battery asserts the sum on every quote.

I probed the sandbox before designing rather than assuming: it has **no `crypto` global, no `URL`,
no `fetch`, no `process`** — but `require('crypto')` works and yields `createHmac`, `createHash`,
`randomUUID`, `timingSafeEqual`. `$vars` and Luxon `DateTime` are available.

---

## Phase 3 — universal text-back · LIVE

Post-call workflow **`6r8YHuMEJbxeDyT5`** extended **20 → 26 nodes**, active,
`versionId === activeVersionId`, Error Sentry still attached.

**The existing `Send SMS` node was deliberately not reused.** It is disabled, has a null credential
(it would 401), and — the real problem — it sits **upstream of the `Caller Send?` gate**. Enabling
it in place would have texted internal test calls and chauffeur callers. Instead the text-back is a
**new parallel branch off `Contact Ref`**:

```
Contact Ref → Load Quote For SMS → Build Text Back → Text Back Gate? → Text Back SMS
```

Sends from **+13502205305** — value read from `OWNER_SMS_FROM` and **verified**, not just
referenced. Inbound only. Skips: no contact id, internal number, `< 10s`, non-inbound, voicemail,
spam flag or spam disposition. Copy is line-aware and uses only the returned status —
never "booked", never "locked in".

## Phase 4 — quote ticket email · LIVE

An itemised **QUOTE** block now sits between Summary and Transcript in the owner call report:
base · billable hours (with requested vs minimum) · service charge · each add-on incl.
meet-and-greet · all-in total · status · `quote_id`. Absent quote renders "No quote was generated
on this call."

`Format Call Log` was **not modified**. The block is injected by a new `Inject Quote Block` node
downstream, and the two owner-alert bindings were repointed to it. Those bindings also moved from
`.item` to `.first()`, removing paired-item resolution risk across the inserted data-table node.

Reuses the email's existing tokens (`#14161C`, `#5C6573`, `#DDE3EA`, `#00688F`, `#FFFFFF`) — no
sixth value invented. The all-in figure uses `ACCENT_DEEP #00688F`, **not** Deep Cyan `#0090C8`,
which is only 3.61:1 on white and fails AA at body size.

---

## Phase 5 — battery · **47/47 PASS**

All against the **live signed endpoint**, not a simulation.

Coverage: airport pricing across all five multipliers with $5 rounding · `SEED_APPROVED` and
`DEMO_SEED` zones · case/punctuation-insensitive origin matching · `NO_ROUTE_FOUND` for unknown
origin *and* unknown airport with **no nearest-city substitution** · stretch/party/coach escalation ·
hourly minimums lifting requested hours · Fri/Sat/Sun weekend pricing · quote-only fleet ·
corporate / affiliate / farm-out · `CAPTURE_ONLY` · add-ons incl. child-seat `seat_type` enforcement ·
late-night auto-apply at 23:30 · >3 stops · holiday · four missing-input cases · three negative auth
cases returning 401 · valid shared-secret · **idempotent replay** · **correction/supersede**.

Two invariants asserted on *every* case: the breakdown sums exactly to `all_in_total`, and no
escalation status ever carries a retail number.

**E2E proof — exec `5322`, status success.** Quote `q_52aa0387-…` ($229: $170 base + $34 service +
$25 meet-and-greet) created via the live endpoint, then a synthetic `call_analyzed` fired from one
of our own numbers. Result: routed to `ZZ_TEST_CONTACT` (`w4dxhKHflhSz6whGdQrr`, matches the
variable exactly), text-back correctly **suppressed** with reason "internal number, suppressed by
the owner rail", quote block injected, owner email sent. Email HTML tag balance is exact
(7/7 tables, 27/27 rows, 38/38 cells).

**Not exercised: the outbound SMS send itself.** Proving it required texting a real phone. The gate
was proven to *block* correctly; the GHL POST is the same node pattern as the already-live
`Send Email` and `Owner Alert SMS`. First real inbound call is its first real send.

---

## § 9 sweep

`AIC · write_reservation · realtime` (`vAPSLlSjSUzoO0pg`) — **live, GHL-touching, and had no error
workflow at all**. Attached. **All 16 active workflows now carry the Error Sentry, and the Sentry
itself is confirmed ACTIVE.**

Owner rail asserted end-to-end: internal call → zz-test contact, owner-alert contact
(`pWm6s2wCWu8rMlDxmhcW`) distinct and never an upsert target.

---

## Manual steps — yours, I cannot do them

1. **Pause GHL `01_AVA_Missed_Call_Text_Back`** (`32fdabca-…`). Read-only API. Double-text risk.
2. **Fix Workers Builds** for `aichauffeur-token` — set the build root to `voice-stack/worker`.
   The LiveKit token endpoint is dead until then.
3. **Decide on the contract** in `automation/rate-engine/README.md`. It is my definition, not a
   recovered one.
4. **Nothing calls the engine yet.** Pointing the chauffeur agent at it means changing
   `schema/aic-reservation-v1.json` off `CAPTURE_ONLY` and rewriting the prompt line that forbids
   quoting numbers. That is a policy decision, not a wiring task.

## Gotchas

- The rate card is **demo seed data**. Only 5 of 32 airport zones are `SEED_APPROVED`; the other 27
  are `DEMO_SEED` and are not operator-validated prices.
- `ZZ-PROBE — n8n Code sandbox capabilities` (`HWbNDJdm383EQFk9`) is left inactive in n8n as the
  record of what the sandbox actually exposes. Delete when you like.
- The battery writes real `quote_audit` rows under `b01`–`b47` / `ZZTEST_*` call ids.
- The MCP `search_workflows` tool hides archived workflows — it showed 16 where the public API
  showed 20. Do not trust it alone for an inventory.
- `get_workflow_details` strips node credentials entirely. Credential bindings are only visible via
  the raw public API.
