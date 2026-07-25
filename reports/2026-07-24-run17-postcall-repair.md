# RUN 1.7 — POST-CALL REPAIR

**Date:** 2026-07-24 · **Lane:** L3 (GHL) · **Workflow:** `6r8YHuMEJbxeDyT5` — AVA Post-Call to GHL (Demo Send)

---

## 1 · What was broken

Every run of the post-call workflow since the quota recovery died at the same node.

| Execution | When (UTC) | Node | Result |
|---|---|---|---|
| 3031 | 2026-07-18 15:39 | GHL Upsert Contact | error |
| 4340 | 2026-07-23 03:01 | GHL Upsert Contact | error |
| 4564 | 2026-07-23 20:40 | GHL Upsert Contact | error |
| 4643 | 2026-07-24 14:31 | GHL Upsert Contact | error |
| 2486 | 2026-07-16 18:19 | — | **success** (last good run) |

GHL's answer, verbatim from execution 4643:

```
400 - {"message":"Pass at least one of number, email query parameter",
       "error":"Bad Request","statusCode":400,
       "traceId":"49d85870-53c2-4191-8d68-61b34b4cd7a7"}
```

## 2 · Root cause

Retell delivered `call_analyzed` with an **entirely empty** `custom_analysis_data` — the caller hung up
16 seconds into the greeting, before giving a name, phone or email:

```json
"custom_analysis_data": { "caller_first":"", "caller_email":"", "caller_phone":"", "business_name":"" }
```

`Normalize` faithfully produced `phone:""`, `email:""`, `first_name:""`. The upsert node's own phone
guard then correctly dropped the empty phone — and the request body went out with **no identifier at
all**:

```json
{"locationId":"sdShCZ…","firstName":"","source":"AVA Inbound Demo Call",
 "tags":["ava-demo-hot","phone-unresolved"]}
```

GHL `/contacts/upsert` cannot match a contact on nothing, so it 400s. The workflow then hard-stopped —
the webhook never reached `Respond OK`, so Retell got no answer either.

**The caller's real number was in the same payload the whole time**, at `body.call.from_number` — the
telephony ANI. The workflow only ever read the number the caller *spoke*.

This is the same class as the Run-1.5 bug: a node builds a body missing the field the API requires, the
call fails, and the whole branch dies.

## 3 · The fix

Three changes, applied as one unit and published as `activeVersion 3184cc42`.

**a · New `Build GHL Body` Code node** (between `Normalize` and the upsert)

- Falls back `caller_phone` → `call.from_number`, tagging `phone-from-ani` when the fallback fires so
  the CRM record shows where the number came from.
- `firstName` defaults to `Unknown Caller` rather than an empty string — a nameless, noteless contact is
  unusable in GHL.
- Guards **both** of our own published lines — 414-240-8930 (voice) and 350-220-5305 (SMS) — so we can
  never upsert ourselves as a contact.
- All regex/string work now lives in a Code node instead of an inline `={{ }}` expression. This is the
  Run-1.5 proven fix: regexes inside an inline `jsonBody` get double-escaped by the API round-trip and
  fail at runtime. The backreference `/^(.)\1+$/` was also replaced with a set-size check, so there is
  no escape-sensitive syntax left to mangle.

**b · New `Has Identifier` IF gate** — a call with genuinely no phone and no email (a web call from
`/live` where the caller gives nothing) now routes to a new `Respond No Identifier` node returning
`200 {"status":"no_identifier"}`, instead of 400-ing and crashing the run.

**c · `GHL Upsert Contact` jsonBody** reduced to `={{ $json.ghl_body }}`.

## 4 · Verification — execution 4694, SUCCESS

One safe execution, replaying the **exact** payload shape from failing execution 4643, with a
NANP-reserved test ANI: **+1 414 555 0142**. The 555-01xx range is reserved as fictional and cannot ring
a real person — safer than any live number. HTTP nodes were pinned by `test_workflow`, so **nothing was
written to the production CRM**.

Body built by the fix, straight from the execution record:

```json
{"locationId":"sdShCZCaxce8DHKbYcIl","firstName":"Unknown Caller",
 "source":"AVA Inbound Demo Call","tags":["ava-demo-hot","phone-from-ani"],
 "phone":"+14145550142"}
```

`has_identifier: true` · `Has Identifier` routed to the true branch (false branch empty) · chain ran
through to `Respond OK` · execution status **success**.

Before: no identifier → 400. After: `phone` present, from the ANI. The cause of the 400 is gone by
construction.

**Honest limit:** the GHL round-trip itself was not re-exercised live, because pinning the HTTP nodes is
what keeps the test from writing to the CRM. The evidence that GHL returns 200 for this body shape is
execution 2486 — the last successful run — which posted the same shape with a phone present and got a
created contact back.

## 5 · Regression check

| Workflow | ID | Active | Interval |
|---|---|---|---|
| AVA Booking Receipt | `NMSWFtcyEQhSypSx` | ✅ true | `minutesInterval: 30` |
| AVA Drip Engine v1 | `Pu661B1J1ZgezJT7` | ✅ true | `minutesInterval: 30` |

Both unchanged by this run. The Run-1.6 quota retune is intact.

## 6 · Saved-trap compliance

- **n8n public-API PUT settings trap** — respected. All edits went through the operations-based
  `update_workflow`; no settings object was echoed back, so the `availableInMCP` / `binaryMode` 400 was
  never in play.
- **Inline-expression regex double-escape** — this is exactly what the Code-node move fixes.

## 7 · Rollback

n8n keeps version history on this workflow. To revert: restore the version prior to
`3184cc42-bc35-4f2a-b96e-eafbf595c4bc` (predecessor `579e99ff-dbc7-4324-81da-45c366ad2721`) and
republish. That returns the workflow to the failing state, so only do it if the new path misbehaves in a
way worse than the 400.

## 8 · Open items

- **Not proven live.** The first real inbound call that hangs up during the greeting is the true proof.
  Watch for a contact tagged `phone-from-ani`.
- **`Send SMS` and `Notion Call Log Append` remain disabled** — pre-existing state, untouched by this
  run.
