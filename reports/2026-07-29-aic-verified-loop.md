# RUN REPORT — AIC VERIFIED RESERVATION LOOP

**Date:** 2026-07-29 · **Brief:** `runs/2026-07-29-aic-verified-loop.md` · **Lane:** repo + GHL API + Retell API (n8n untouched)

**RUN INCOMPLETE — STEP R and STEP 3 did not ship. STEP R halts on three inputs only Shane can
supply (agent prompt text, `write_reservation` webhook URL, model choice); STEP 3 cannot run before
STEP R. STEP 1 shipped in full. STEP 2 shipped its 23 fields; its pipeline is blocked on a token
scope. STEP 2B audited and mapped in full; the disable half is UI-only because the GHL workflow
API is read-only.**

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
| R | Retell 775 agent deploy | **HALTED** | 3 inputs required — see HALT |
| 3 | Verify slate (4 trip types + failures) | **NOT RUN** | Blocked by STEP R |

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

### THE HALT — three inputs

1. **Agent prompt text.** PROMPT AUTHORITY: this lane never authors agent prompt text.
   → **PASTE AGENT PROMPT NOW** and it deploys verbatim to `agent_8e9e7d477949c6babcbdcc756d`.
2. **`write_reservation` webhook URL.** Owned by the architect chat (n8n). The function's shape is
   settled by the addendum — 18 parameters identical to the `custom_analysis_data` keys, returning
   `{crm_status, record_id, intake_id, message}` — but a realtime custom function cannot be
   registered without its URL.
3. **Model choice.** Grok is absent. Both live agents (AVA production v39 and the 775 AIC agent)
   currently run `gpt-4.1`; the board's "gpt-5.5" note is stale. Highest available tiers are
   `gpt-5.6-terra` / `gpt-5.6-luna` / `claude-5-sonnet`.

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
