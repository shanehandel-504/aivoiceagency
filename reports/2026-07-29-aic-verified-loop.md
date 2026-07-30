# RUN REPORT — AIC VERIFIED RESERVATION LOOP

**Date:** 2026-07-29 · **Brief:** `runs/2026-07-29-aic-verified-loop.md` · **Lane:** repo + GHL API + Retell API (n8n untouched)

**PUBLISH CHECKPOINT — Jul 29/30 wrap. THE DATA PATH IS GREEN END TO END.** The 775 agent is
PUBLISHED and serving **v13** with both prompt cures applied, verified byte-for-byte against the
published version. Webhook v1.1 shipped overnight and **both defects the Jul 29 slate found are
fixed**: all 23 `aic_*` fields now write (13–16 values per record, read back independently out of
GHL), and per-trip slot enforcement is live — a missing flight on an `AIRPORT_ARR` now returns
`FAILED_VALIDATION` naming exactly what is missing, with no record id. Slate re-run: **ALL CHECKS
PASS, 1 WARN.**

**Outstanding, none of it in this lane:** the GHL pipeline (PIT scope, Shane UI), the 4 workflow
disable/scope actions (workflow API is read-only, Shane UI), one wording WARN for the architect,
and conversational behavior — Retell exposes no API-key text simulation, so mid-call correction,
readback protocol and the ACT 2 tour remain unproven until one real dial.

**Correction carried forward:** the 5 ZZ-TEST contacts were reported deleted but are **still live**
in the CRM — see the STEP 3 cleanup note.

---

## DONE TABLE

| # | Artifact | Status | Proof |
|---|---|---|---|
| 1 | `schema/aic-reservation-v1.json` | **SHIPPED** `1189eb4` | 28/28 contract checks; 18 Retell keys + 23 GHL keys mapped to canonical paths |
| 1 | `templates/aic-proof-ticket.html` | **SHIPPED** `1189eb4` | Rendered 390×844 + 1440×900: 0 horizontal overflow, 0 non-zero radii, 0 console errors, 6/6 absent fields print "— NOT PROVIDED", 0 dollar amounts |
| 1 | `templates/aic-dispatch-sheet.txt` | **SHIPPED** `1189eb4` | Same contract suite, all PASS |
| 2 | 23 × `aic_*` contact custom fields | **SHIPPED** `4638a5b` | Readback 23/23 present on location `sdShCZCaxce8DHKbYcIl`; ids below |
| 2 | Pipeline "AI Chauffeur Reservations" | **BLOCKED — needs Shane** | `POST /opportunities/pipelines` → 401 "token is not authorized for this scope" |
| 2B | Widget → calendar → workflow map | **SHIPPED** `4638a5b` | `tools/ghl-booking-map.mjs --audit --probe`, map below |
| 2B | Disable duplicate booking notifications | **BLOCKED — UI only** | Workflow write routes all 404 ROUTE ABSENT (measured twice) |
| R | Retell 775 agent deploy | **SHIPPED + PUBLISHED v13** | Prompt cures applied; byte-match 6777/6777 against the **published** version, plus voice, model, begin_message, 18 keys, `write_reservation` + 18 params + URL |
| 3 | Verify slate (4 trip types + failures) | **RE-RUN GREEN — ALL PASS, 1 WARN** | 4/4 trip types write and read back with 13–16 `aic_*` values each; case E now `FAILED_VALIDATION`; case G rejects clean |
| — | 2 defects from the Jul 29 slate | **FIXED by webhook v1.1** | Re-verified by independent GHL read-back, not by the endpoint's own claim |

---

## STEP 2 — THE 23 FIELD IDS (for the architect's n8n build)

Location `sdShCZCaxce8DHKbYcIl` ("AI Voice Agency"), verified against Doppler `GHL_LOCATION_ID`
and the API before any write.

| Field key | Id | Type |
|---|---|---|
| `aic_trip_type` | `qta1B3kERujMTLNDlj66` | TEXT |
| `aic_pickup_datetime` | `HOfBlSbheMOtChBuK0vU` | TEXT |
| `aic_pickup_address` | `L9FS4ZqII0OvQe5KESh7` | TEXT |
| `aic_dropoff_address` | `ISMLWbZhk0V9eVHXut86` | TEXT |
| `aic_stops` | `Os3wL0uOEddjnDlRdVwl` | LARGE_TEXT |
| `aic_pax_count` | `5mLlo7JQv1s2PTjGHfBq` | NUMERICAL |
| `aic_luggage_count` | `Yiyl1wPsGs927sT2l6KK` | NUMERICAL |
| `aic_vehicle_class` | `OtmDBeaHItbSvOUHRTGY` | TEXT |
| `aic_hours_booked` | `DKJoMbtyRJE1VPpjuM20` | NUMERICAL |
| `aic_airline` | `FQc1deemot7Um7yawjcz` | TEXT |
| `aic_flight_number` | `sLr1SgxWniXbbABjTYgu` | TEXT |
| `aic_meet_style` | `ugYKX5zQXK4UkclTYXbg` | TEXT |
| `aic_special_notes` | `jSoQ7iPIZp32m4DBlV1l` | LARGE_TEXT |
| `aic_booker_name` | `T485WCP9WVkbeaP9VnSd` | TEXT |
| `aic_booker_company` | `uwGZ2sMwnLsNJAsRXaEY` | TEXT |
| `aic_billing_type` | `Z36xyFEoF9brVdNeKAIP` | TEXT |
| `aic_intake_id` | `rG7ddiPNaCtnVb6WpQ6q` | TEXT |
| `aic_call_id` | `qPEAuGHATmSwj5ZD0zDD` | TEXT |
| `aic_recording_url` | `vn8dhOTRYTLov1epE3Bf` | TEXT |
| `aic_crm_status` | `dKWoeh5ayPS7clTpAy4O` | TEXT |
| `aic_payload_hash` | `kKCOH83XaTlUAdaeCxh5` | TEXT |
| `aic_consent` | `NrB5VCwkvsSsBBcVPmSx` | TEXT |
| `aic_tenant` | `16MIe7L45qETn9TtcOK5` | TEXT |

`fieldKey` derivation was verified on ONE field before the other 22 were created:
`name: "aic_trip_type"` → `fieldKey: "contact.aic_trip_type"`, exactly as the brief specifies.

**Why the types are what they are.** Enums are TEXT, not SINGLE_OPTIONS — an automated write of an
enum into a GHL options field fails on any string mismatch, which is silent data loss on the fields
a chauffeur depends on. `aic_pickup_datetime` is TEXT, not DATE, because a GHL DATE field drops the
time and the timezone. Pickup time **is** the job. `aic_consent` is TEXT ("true"/"false") because
GHL has no boolean and CHECKBOX reintroduces the option-matching trap.

---

## STEP 2B — THE BOOKING MAP

### What the API can and cannot do (measured 2026-07-29, not assumed)

| Call | Result |
|---|---|
| `GET /calendars/` | 200 — full detail incl. notifications |
| `GET /workflows/?locationId=` | 200 — id + name + status + version **only** |
| `GET /workflows/{id}` | **404 ROUTE ABSENT** |
| `PUT` / `PATCH /workflows/{id}` | **404 ROUTE ABSENT** |
| `POST` / `PUT /workflows/{id}/status` | **404 ROUTE ABSENT** |
| `DELETE /workflows/{id}` | **404 ROUTE ABSENT** |

**The GHL workflow API is read-only.** Triggers and actions are not exposed and no workflow can be
paused via API. Probed non-destructively (empty-body writes distinguish "route missing" from "route
exists, body invalid"), and re-confirmed on a second independent pass. So every disable below is a
UI action, not something this run could execute.

Also API-verified: **`notifications = []` on all three calendars.** No calendar-level alert exists
anywhere, so every booking alert originates in a workflow — which narrows the duplicate hunt to the
workflow list.

### Widget → calendar → workflow

| Brand | Site widget (repo evidence) | Calendar | Booking-notification workflow |
|---|---|---|---|
| **AIC** | `chauffeur/index.html:364,379,613,631,685` + `chauffeur/demo/index.html:258` → aichauffeur.ai | `UaxV0ENx2cEUYs6qeWZ7` "AIChauffeur Local Setup Call" · 30 min · active | `AIChauffeur — Booking Response` `6fd1fb71-…` — **published, and unscoped** |
| **AVA** | `book/index.html:234,254,256` (the `/book` iframe) → aivoiceagency.ai | `aCIv7rUnCGrysobt6Mlg` "AVA Demo Call" · 15 min · active | `AVA Demo Call — Reminder Engine v1` `6aee9afc-…` — **KEEP, canonical** |
| — | **no widget — 0 references in any shipped page** | `oL7JyjGAHWOMA0FdOize` "Shane Handel's Personal Calendar" · 30 min · active | none |

### Duplicate verdicts

| Workflow | Id | API status | Verdict |
|---|---|---|---|
| `AIChauffeur — Booking Response` | `6fd1fb71-…` | published v9, updated **2026-07-29 07:31:40** | **DUPLICATE + BRAND CROSS** — disable or calendar-scope |
| `02_AVA_New_Lead_Internal_Notification` | `ceaa1d47-…` | published v3 | **DUPLICATE RISK** — doubles the n8n RUN 6.5 owner alert |
| `03_AVA_7_Day_Follow_Up_Drip` | `8590663f-…` | published v11, updated **2026-07-29 07:30:30** | **DUPLICATE RISK (lead-facing)** — CLAUDE.md says the drip engine is n8n |
| `New Workflow : 1779930425651` | `4a70242a-…` | published v10, untouched since 2026-05-30 | **INSPECT** — unnamed, purpose unrecorded |
| `AVA Demo Call — Reminder Engine v1` | `6aee9afc-…` | published v6 | **KEEP** — the one legitimate AVA booking alert (nodes 3-4) |
| `01_AVA_Missed_Call_Text_Back` · `04_AVA_Onboarding_Checklist` · `LIVE — READY Relay` | — | published | out of scope, not booking notifications |

**The headline: two workflows flipped draft → published this morning, ~70 seconds apart.**
`reports/2026-07-26-ops-map.md` recorded `AIChauffeur — Booking Response` and
`03_AVA_7_Day_Follow_Up_Drip` as **draft** on Jul 26. Both are **published** now, updated
07:30:30 and 07:31:40 today. The AIC one is the documented legacy double-sender: it fires on
**AVA Demo Call** bookings too, sending off-brand AIC copy (SMS + 2 emails) with a hardcoded
"Calendar: AIChauffeur Local Setup Call" line. It was deliberately paused back on 2026-07-11
(`reports/2026-07-11-v34-closeout.md:60`) and is live again.

**Honest limit on these verdicts.** The workflow API exposes no triggers, so "which workflow fires
on which calendar" is **not** API-provable. Every trigger claim above comes from prior live-tested
runs, cited per row in `tools/ghl-booking-map.mjs`. A UI check on the trigger filter is the gate
before trusting any row — including the possibility that this morning's re-publish already scoped
the AIC workflow correctly.

### UI steps to finish STEP 2B (Shane · ~3 minutes)

1. **GHL → Automation → `AIChauffeur — Booking Response`.** Open the trigger. Either
   (a) add filter **In calendar = AIChauffeur Local Setup Call**, or (b) Publish → Draft.
   Option (a) keeps AIC bookings answered and stops the AVA cross-fire; (b) silences AIC bookings.
   → **One booking = one owner alert per brand** requires (a), not (b).
2. **`02_AVA_New_Lead_Internal_Notification`** → Publish → Draft. The n8n owner rail (RUN 6.5)
   already sends this alert; leaving both live means two alerts per lead.
3. **`03_AVA_7_Day_Follow_Up_Drip`** → Publish → Draft. The drip engine is n8n per CLAUDE.md;
   a published GHL twin double-sends to the lead.
4. **`New Workflow : 1779930425651`** → open it, read the trigger, then rename or delete.
   An unnamed published workflow with an unknown trigger is an unknown alert source.
5. Re-run `node tools/ghl-booking-map.mjs --audit` to confirm the statuses flipped.

### Pipeline UI steps (Shane · ~60 seconds)

`POST /opportunities/pipelines` → **401 "token is not authorized for this scope."** The route
exists; the PIT lacks the scope. Either add the opportunities/pipelines write scope to the Private
Integration Token, or faster:

1. GHL → Opportunities → Pipelines → **+ Add Pipeline**
2. Name it exactly **AI Chauffeur Reservations**
3. Stages in this order: **Demo Call Taken · CRM Verified · Ticket Sent · Follow-Up · Client Signed**
4. Save, then `node tools/ghl-aic-fields.mjs --audit` to capture the pipeline id.

---

## STEP R — WHAT IS RESOLVED, AND THE HALT

### Resolved by verification (no Shane input needed)

**Target confirmed.** `+14147750019` binds inbound **and** outbound to
`agent_8e9e7d477949c6babcbdcc756d` ("AI CHAUFFEUR"). The forbidden line `+14142408930` is served by
a completely different agent, `agent_d5ada9f774fe3ae7f034d2c677` — no overlap, so writes scoped to
the 775 agent cannot touch the published AVA line.

**Live state of the 775 agent:** version 12, `is_published: false`. Latest **published** version is
**v11**, so the phone currently serves v11 (voice `retell-Brynne`, llm v11). LLM
`llm_368f49c56d280a6199bc0fbb5785`, model `gpt-4.1`, 1 tool (`end_call` only),
`post_call_analysis_data` = 7 keys (not the 18 the brief specifies), prompt 3,553 chars,
`begin_message` = "Thanks for calling, this is AVA. Are you looking to book a ride?" — which names
AVA and does **not** carry `{{company_name}}`.

**Voice — the brief's id is not usable as given, and RUN 1 already solved this.**
`gJx1vCzNCD1EQHT212Ls` is a real ElevenLabs voice ("Ava – Eager, Helpful and Understanding") but is
**absent from Retell's 298-voice catalog**, so it cannot be set as a Retell `voice_id`. The same
voice as Retell exposes it is **`custom_voice_705a2cb49b0413f7fc1c456d02`** (provider elevenlabs,
type custom) — the value the L2 board note recorded in RUN 1, and the voice the live AVA production
agent v39 already runs.

**Do not apply the brief's stability 0.78 / similarity 0.85 / style 0.15.** Two reasons:
1. Retell's agent object has no stability/similarity/style fields at all — it exposes
   `voice_temperature`, `voice_speed`, `volume`. Those three numbers are ElevenLabs-native.
2. They would have to be set on the ElevenLabs voice itself — and that voice
   (`custom_voice_705a…`) is **shared with the live AVA production agent on 414-240-8930**.
   Changing its settings would alter the forbidden line's voice, breaking the run's scope law.
   (A second identical Ava entry, `custom_voice_a1ba4a6c2de775d60d987d5120`, exists if a
   separately-tuned AIC voice is ever wanted.)

**Model enum captured** via the throwaway-LLM probe (invalid value → the API enumerates the allowed
set; nothing was created). 28 allowed values:
`gpt-4o, gpt-4o-mini, gpt-4.1, gpt-4.1-mini, gpt-4.1-nano, gpt-5, gpt-5-mini, gpt-5-nano, gpt-5.1,
gpt-5.2, gpt-5.4, gpt-5.4-mini, gpt-5.4-nano, gpt-5.5, gpt-5.6-terra, gpt-5.6-luna,
claude-4.0-sonnet, claude-4.5-sonnet, claude-4.6-sonnet, claude-5-sonnet, claude-4.5-haiku,
gemini-2.0-flash, gemini-2.0-flash-lite, gemini-2.5-flash, gemini-2.5-flash-lite, gemini-3.0-flash,
gemini-3.1-flash-lite, gemini-3.5-flash`

**No `grok` model exists in the enum.** The pre-call snapshot's own `_meta.mission` reads
"AI CHAUFFEUR **Grok** build deploy to 414-775-0019". If Grok was the intended model, the brief's
"ABORT if absent" condition is met.

**Rollback artifact:** `retell-backups/chauffeur-agent-2026-07-29-precall.json` — agent v12 / llm
v12 snapshot, captured today by the prior session, redaction verified (3 `[REDACTED]` markers, zero
keys, zero URLs).

### All three inputs supplied — DEPLOYED AND PUBLISHED

Shane supplied the prompt (v3 Closer OS), the webhook URL, and the model. Deployed via
`tools/retell-aic-agent.mjs`, which ships `docs/aic-agent-prompt.md` between `PROMPT:BEGIN/END`
byte-for-byte and never edits prompt text.

| Field | Before | After (published v12) |
|---|---|---|
| prompt | 3,553 chars | **6,598 chars, byte-match PASS** |
| voice | `retell-Brynne` | `custom_voice_705a2cb49b0413f7fc1c456d02` |
| model | `gpt-4.1` | `claude-5-sonnet` |
| begin_message | no `{{company_name}}` | OPENING line, carries `{{company_name}}` |
| capture keys | 7 | 21 = the 18 + 3 preserved presets |
| boosted keywords | none | 11, from the prompt's TUNING section |
| `write_reservation` | absent | registered, 18 params, → the architect webhook |
| published | v11 | **v12 — the phone serves this** |

The **publish gate** was proven to hold before the URL existed: `--publish` refused with exit 1,
nothing published, agent still draft v12, published set still v0–v11. It only went through after
`write_reservation` was registered. The gate exists because the prompt tells the agent to say the
reservation is "written … and I verified the record" — with no tool registered that sentence is a
phantom booking, the same shape as the `trigger_dashboard_sms` risk the board recorded in RUN 1.6.

**Scope law held on every call:** the target is resolved from `+14147750019`, never from a pasted
agent id, and the tool aborts if that resolves to the agent serving `414-240-8930`
(`agent_d5ada9f774fe3ae7f034d2c677`). Asserted distinct on every invocation.

---

## STEP 3 — VERIFY SLATE (`tools/aic-verify-slate.mjs`)

Seven cases driven through `write_reservation`, each claimed record then read back **independently
out of GHL** — the loop is only "verified" if the CRM agrees with what the endpoint said. Caller
numbers are all in the NANP-reserved `555-01xx` fictional range, which cannot ring a real person.

| Case | crm_status | record_id | Verdict |
|---|---|---|---|
| A · AIRPORT_ARR | `CRM_VERIFIED` | `HgWUGKGNndrGV3Fn7nuD` | written, contact readable |
| B · P2P | `CRM_VERIFIED` | `ag7C5YtVU5guUik2mo7i` | written, contact readable |
| C · HOURLY | `CRM_VERIFIED` | `y2oADWKZxEpMb6dzyYuO` | written, contact readable |
| D · ROADSHOW | `CRM_VERIFIED` | `vW7Sv2pHDeZ1aWzfpdTS` | written, contact readable |
| E · missing flight | `CRM_VERIFIED` | `meTGXYdYcduth7Sa8mgn` | **DEFECT — should not have written** |
| F · vague address | `CRM_VERIFIED` | `kafOU4EQ6THubwhQvwye` | written (see note) |
| G · nothing captured | `FAILED_VALIDATION` | *(none)* | correct — rejected cleanly, no record id |

**Passing:** the 4-key contract on every response · an `intake_id` on every response, including
failures · **zero premature "booked / confirmed / guaranteed" language anywhere** · the total-failure
case rejects cleanly and does **not** hand back a record id it never created · all four trip types
write and read back · stored phone is the reserved test number in every case.

### DEFECT 1 (SERIOUS) — `CRM_VERIFIED` is claimed while zero reservation data is stored

Every written contact comes back from GHL with **`customFields: []`**. Name, phone, tags
(`aichauffeur-lead`, `aic-demo-call`) and source are set; **none of the 23 `aic_*` fields carry a
value.** So the endpoint's "written to the CRM and verified after write" is verifying that a
*contact* exists, not that a *reservation* landed. A trip ticket rendered from one of these records
would print "— NOT PROVIDED" for pickup, vehicle, flight, times — the entire job.

This is the exact false-verification the mission was built to prevent, and the agent speaks that
claim to the caller. **Likely cause:** the endpoint was built before the 23 field ids existed —
they were created earlier in this same run. The ids the architect needs are in the STEP 2 table
above and in `schema/aic-reservation-v1.json` under `x-ghl-field-map`. Architect's lane.

### DEFECT 2 — the endpoint does not enforce the required-slot matrix

Case E sent an `AIRPORT_ARR` with `airline`, `flight_number` and `meet_style` all empty and it was
written as `CRM_VERIFIED`. The brief's REQUIRED-SLOT MATRIX makes flight plus meet style mandatory
for airport runs, and `schema/aic-reservation-v1.json` already encodes it (`allOf` → if
`trip_type == AIRPORT_ARR` then `flight` required). Only the all-empty case G is rejected, so
validation is currently "did we get anything at all" rather than the matrix. A chauffeur dispatched
on case E has no flight to track. Server-side enforceable; architect's lane.

**Case F is a weaker finding and is called out as such.** "somewhere downtown" is a plausible string;
no endpoint can reasonably judge address quality. That one is genuinely prompt-level — the ADDRESS &
READBACK PROTOCOL is what prevents it, and the test expectation was stricter than fair.

### NOT TESTED — conversational behavior

**Retell exposes no API-key-accessible text simulation.** `/simulate-conversation` returns
`401 Unauthorized: Invalid JWT` (route exists, dashboard-only auth); `/v2/simulate-conversation`,
`/create-simulation` and `/test-agent` are 404; `/v2/create-web-call` needs a browser WebRTC client
and `/v2/create-phone-call` would place a real call. `simulate_conversation` is an **ElevenLabs** MCP
tool — the brief conflated providers. So mid-call correction, the readback protocol, latency cover,
the recap-before-close and the ACT 2 tour are all **unproven** and need one real dial to
`+14147750019`.

---

## JUL 30 — RE-RUN AGAINST WEBHOOK v1.1

Both defects **fixed**, confirmed by independent GHL read-back rather than by the endpoint's own
claim.

| Case | crm_status | record_id | `aic_*` values on the record |
|---|---|---|---|
| A · AIRPORT_ARR | `CRM_VERIFIED` | `HgWUGKGNndrGV3Fn7nuD` | **16** |
| B · P2P | `CRM_VERIFIED` | `ag7C5YtVU5guUik2mo7i` | **13** |
| C · HOURLY | `CRM_VERIFIED` | `y2oADWKZxEpMb6dzyYuO` | **13** |
| D · ROADSHOW | `CRM_VERIFIED` | `vW7Sv2pHDeZ1aWzfpdTS` | **14** |
| E · missing flight | **`FAILED_VALIDATION`** | *(none)* | — *"Required details are missing: airline, flight number, meet style."* |
| F · vague address | `CRM_VERIFIED` | `kafOU4EQ6THubwhQvwye` | 13 — prompt-level, see below |
| G · nothing captured | `FAILED_VALIDATION` | *(none)* | — rejects clean |

**DEFECT 1 — FIXED.** `aic_tenant` now stamps `"reliable-limo"`, and trip data lands verbatim
(`aic_pickup_datetime = "2026-08-04 14:30"`, `aic_airline = "Delta"`, `aic_pax_count = 3`). A trip
ticket rendered from record A now has a real job on it instead of "— NOT PROVIDED" throughout.

**DEFECT 2 — FIXED.** Per-trip slot enforcement is live and the rejection message names the exact
missing slots, which is what the prompt needs to offer a callback rather than guess.

**Case F reclassified — my Jul 29 expectation was wrong, not the endpoint.** "somewhere downtown"
is a plausible string and no server can judge address quality; `aic_dropoff_address` stored
`"the usual place"` verbatim, which is correct endpoint behavior. The ADDRESS & READBACK PROTOCOL
in the prompt is the control here. The slate now records this as prompt-level, not a defect.

### WARN (1) — for the architect, not a blocker

Webhook v1.1's success message reads *"…verified after write — trip fields **confirmed** on the
record."* True in the data sense, but `write_reservation` runs with `speak_after_execution: true`
and the prompt explicitly bans *"never say confirmed-with-a-reference"* to callers. Suggest
**"verified"** in place of "confirmed" for zero ambiguity. Booking-claim words (`booked`,
`guaranteed`, `payment required`) are absent everywhere — hard check passes.

### Cleanup — the ZZ-TEST contacts were NOT deleted

Reported deleted, but all five are **still live**. Same record ids returned across both runs, with
`dateAdded = 2026-07-30T04:51Z` (= Jul 29 23:51 CDT, the original slate) and only `dateUpdated`
moving to today. GHL never reuses ids, so these are the original rows, not recreations.

`HgWUGKGNndrGV3Fn7nuD` · `ag7C5YtVU5guUik2mo7i` · `y2oADWKZxEpMb6dzyYuO` · `vW7Sv2pHDeZ1aWzfpdTS` ·
`kafOU4EQ6THubwhQvwye` — all `* Testcase`, tagged `aichauffeur-lead`, `special_notes` =
`ZZ-TEST STEP3 SLATE`. (Case E no longer writes, so `meTGXYdYcduth7Sa8mgn` from Jul 29 is a sixth
orphan row.) I do not delete CRM data.

**Correction:** the Jul 29 note calling the slate "not idempotent" was wrong. The endpoint upserts
on `caller_phone`, so re-running updates the same rows instead of proliferating — proven by
identical ids and unchanged `dateAdded` across two runs a day apart.

---

## GOTCHAS

- **The GHL workflow API is read-only — all write routes 404 at the route level.** Any run that
  plans to "disable a GHL workflow via API" is planning something that does not exist. Audit via
  API, disable in the UI, re-audit to confirm.
- **A workflow that was paused stays paused only until someone republishes it.**
  `AIChauffeur — Booking Response` was pushed to draft on 2026-07-11, was still draft on 07-26, and
  is published again as of 07-29 07:31. Status is live state, not a settled decision — re-read it.
- **Board notes go stale and will lie to you.** The L2 lane note says the AVA agent runs
  "gpt-5.5/0.2"; the live API says `gpt-4.1`. The same note's voice-id finding was correct and saved
  this run a cycle. Cite the board for leads, verify against the API before acting.
- **A raw ElevenLabs voice id is not a Retell `voice_id`.** RUN 1 recorded this; the brief repeated
  the raw id anyway. Resolve names to the provider's own id space every time.
- **A shared custom voice couples two brands.** `custom_voice_705a…` serves both the AIC 775 agent
  and the AVA production line. Voice-level tuning is not brand-scoped, so "scope writes to 775 only"
  silently forbids editing that voice's settings.
- **Retell numbers serve `latest_published`, not the draft.** The 775 agent sits at draft v12 while
  the phone answers on v11 — editing the draft changes nothing on the wire until a publish.
- **Enum discovery beats guessing.** Posting one deliberately invalid value returns the entire
  allowed set and creates nothing. Same trick works for the model enum and for any GHL/Retell
  field whose legal values are undocumented.
