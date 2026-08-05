# AIC RUN 6 — "CALLBACK LINE FIX"

**Date:** 2026-08-05 · **Workflow:** `AVA Layer 1 — Money Path Spine` (`u3FaLLiH0loGf1BN`)
**Published version:** `5f891259-c517-410a-a85e-0801644d1e91` · **Status:** ACTIVE

---

## Plain English

The "AVA calls you" form on aichauffeur.ai was calling people back from the **AVA** number with the
**AVA** agent, even when the lead came from the chauffeur site. A limo operator asked AI Chauffeur to
call them and got a pitch for a plumbing receptionist from a number they'd never seen. That is fixed:
a chauffeur lead is now called from **(414) 775-0019** by the **AI Chauffeur** agent. Everything else
still comes from the AVA line exactly as before.

While proving it, a **second and worse defect** turned up in the same execution: the step that logs the
lead into the CRM had a one-character typo in the account id, and had been failing **silently** on
every submission — AVA leads and chauffeur leads alike. That is also fixed.

There is one thing I could not finish, in **Open** below.

---

## The two defects, both visible in execution 5662

Shane's Aug 5 form submit, before any change:

| Field | Value | Meaning |
|---|---|---|
| `source` | `aichauffeur` | the discriminator was already being sent — nothing to add on the site |
| `from_number` | `+14142408930` | **the AVA line** |
| `agent_name` | `AVA — AI Voice Agency` (v38) | **the AVA agent answered a chauffeur lead** |
| `Log Contact to GHL` | `Error: Request has invalid data: Trigger is not from the provided Location` | **the CRM write failed** |

**Defect 1 — wrong line.** `Dial via Retell` hardcoded `"from_number": "+14142408930"`. Retell picks the
agent from the outbound binding on the **from** number, so hardcoding the AVA line forced the AVA agent.

**Defect 2 — silent lead loss.** The CRM node posted to locationId `sdShCZCaxce8DHKbYcII` (capital i)
instead of `sdShCZCaxce8DHKbYcIl` (lowercase L). GHL answers a bad location with **an error string inside
an HTTP 200**, and the node runs `continueOnFail`, so n8n recorded the whole run as `success` while the
lead went nowhere. Doppler `GHL_LOCATION_ID` and the live calendar API both agree on the lowercase-L form.

---

## What changed

One new node, three edited, in the published version:

| Node | Change |
|---|---|
| `Route by Brand` *(new, Code)* | Reads `source`/`brand`/`tag`, emits `from_number`, `brand_label`, `lead_tag`, `is_chauffeur`. Substring match on `chauffeur`, no regex. |
| `Normalize Fields` | Now also carries `brand` and `tag` through from the form. |
| `Dial via Retell` | `from_number` comes from the router. **No number is hardcoded any more.** |
| `Log Contact to GHL` | locationId repaired; payload now also carries `brand`, `tag`, `called_from`. |
| `Respond Calling` | Returns `from` and `brand` so the browser can see which line was used. |

**No `override_agent_id`.** `+14147750019` already binds AI CHAUFFEUR FLOW v1 for outbound at
`latest_published`. Routing on the *number* means the callback always runs whatever is live on the
chauffeur line; pinning an agent id here would drift the day that line is re-pointed.

---

## DONE

| # | Item | Proof |
|---|---|---|
| 1 | Workflow diff | 10 operations, published `5f891259-c517-410a-a85e-0801644d1e91`, **ACTIVE**, `versionId == activeVersionId` |
| 2 | Chauffeur test call | `call_e6714c27dedaac486bba1c64d20` — **outbound, from `+14147750019`, agent `AI CHAUFFEUR FLOW v1` v2** |
| 3 | from_number proof | Webhook returned `{"status":"calling","to":"+14142508042","from":"+14147750019","brand":"AI Chauffeur"}` |
| 4 | Before/after contrast | Pre-fix `call_ca5d57d273ad89181b0a333b63f` — outbound from `+14142408930`, agent `AVA — AI Voice Agency` |
| 5 | AVA non-regression | Execution 5736 on the published version → `from_number "+14142408930"`, `brand "AI Voice Agency"` |
| 6 | CRM leg repaired | Execution 5733 `Log Contact to GHL` → `Success: request sent to trigger execution server` (was an error string) |
| 7 | Error Sentry intact | `SlnAeMrVRORsF0w7` still attached **and still ACTIVE** |
| 8 | Gate | `tools/run6_line_proof.py` — **13/13 PASS** against live n8n + Retell |
| 9 | Every chauffeur form covered | All 9 `data-cb-form` pages route through `aic.js`, the only sender, `source: 'aichauffeur'` |

**Test-call safety:** the destination was `+14142508042` (DEMO-POOL-01), a Retell number we own. No
human was dialled. Both legs ended by themselves at ~80s.

---

## OPEN — needs Shane in the GHL UI

**GHL tagging does not separate chauffeur leads, because no contact is created at all.**

The n8n → GHL transport is now repaired and proven (`Success` + a trigger id). But the payload lands on
a GHL *inbound-webhook trigger*, and after that trigger fires, **no contact appears** — searched by
phone, by name, and by partial number, for both test payloads.

Two GHL workflows sit in `draft`: `02_AVA_New_Lead_Internal_Notification` and
`AIChauffeur — Booking Response`. A draft GHL workflow never runs. That is the most likely consumer,
but I cannot confirm it: GHL's public API does not expose workflow triggers and every write route is
read-only, so I can neither read which workflow owns trigger `feba6e50-…` nor publish it.

**What is needed:** open the GHL workflow that owns inbound webhook `feba6e50-4bf3-4489-a03b-765fe5094dde`,
confirm it creates/updates the contact, and publish it. The payload now carries `source`, `brand`, `tag`
and `called_from`, so tagging by brand is a field mapping away once it runs.

**Not done deliberately:** I did not swap the node to a direct GHL contacts-API upsert. That would work,
but CLAUDE.md § 9 OWNER RAIL LAW requires `OUR_NUMBERS` quarantine routing *before* any upsert, and
porting that gate is a separate piece of work — not something to slip into a line-routing fix.

---

## Rollback

| Checkpoint | ID | One-line rollback |
|---|---|---|
| Workflow | `u3FaLLiH0loGf1BN` | In n8n → Version history → restore `fc61cbb7-d825-48ab-a619-6da1c7dfe499`, then publish |
| Calendar (RUN 5) | `UaxV0ENx2cEUYs6qeWZ7` | unchanged this run |

Reverting restores **both** defects — the wrong line *and* the silent CRM loss. If only the routing needs
undoing, set `from_number` back to a literal in `Dial via Retell` and leave the GHL URL repaired.

---

## Gotchas

- **GHL returns errors inside HTTP 200.** `{"status":"Error: …"}` with a 200 status. Combined with
  `continueOnFail`, a broken CRM write is invisible in the execution list. Assert on the `status` string,
  never on the HTTP code.
- **The capital-I / lowercase-l id trap struck for the third time** (RUN 6 caught `…MIg` vs `…Mlg`,
  RUN 6.5 caught a wrong phone on a right contact, now `…YcII` vs `…YcIl`). Dereference every opaque id
  against the live API before trusting it — including ones already sitting in production.
- **Retell rejects 555-01xx destinations.** `"+15550100199 is not a valid number"` — a 400, no call
  object. The NANP-reserved fictional range is the standard safe test target everywhere else in this
  repo, but it does **not** work for Retell outbound. Use a Retell number we own instead.
- **Retell has no REST end-call.** `/v2/end-call/{id}`, `/end-call/{id}` and a body variant all 404.
  A test call cannot be hung up over the API — it self-terminates on `max_call_duration_ms`
  (AVA 600000, chauffeur 900000) or `end_call_after_silence_ms` (AVA 30000). Budget for that before
  dialling one of our own agents; mine ran 80s per leg.
- **Calling our own number creates TWO call records.** `list-calls` returns the *inbound* leg first,
  which shows the answering agent, not the dialling one. Filter on `direction: outbound` or you will
  read the wrong agent name and think the fix failed.
- **An n8n API write lands on the draft.** Publish, then assert `versionId == activeVersionId`, or
  production keeps running the old graph while every check reads green.
