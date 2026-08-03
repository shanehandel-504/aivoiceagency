# ANI + COMMIT SPINE — source of record

Shipped 2026-08-03 (RUN 2). These files are the **authoring copy** of code that lives inside n8n.
n8n is the runtime; this directory is the only version-controlled copy. Edit here, then push the
change into the node — there is no automatic sync.

`docs/` and `automation/` are in `.vercelignore`, so nothing here is deployed.

## Where each file runs

| File | n8n workflow | Node |
|---|---|---|
| `wf-ani.01-verify-normalize.js` | WF-ANI `XLSd3vt41vhsXIA9` | `Verify + Normalize` |
| `wf-ani.02-build-response.js` | WF-ANI `XLSd3vt41vhsXIA9` | `Build ANI Response` |
| `wf-commit.01-verify-normalize.js` | WF-COMMIT `O1fX0FpbT0qqMnqJ` | `Verify + Normalize` |
| `wf-commit.02-verify-status.js` | WF-COMMIT `O1fX0FpbT0qqMnqJ` | `Verify + Status` |
| `wf-commit.03-build-response.js` | WF-COMMIT `O1fX0FpbT0qqMnqJ` | `Build Response + Ticket` |
| `wf-commit.04-duplicate-response.js` | WF-COMMIT `O1fX0FpbT0qqMnqJ` | `Build Duplicate Response` |
| `wf-commit.05-resolve-contact.js` | WF-COMMIT `O1fX0FpbT0qqMnqJ` | `Resolve Contact` |

`wf-ani.workflow.json` / `wf-commit.workflow.json` are the full node+connection graphs as created.
`aic_call.py` is the signed caller; `ani_battery.py` and `commit_battery.py` are the test batteries.

## Auth — identical to WF-RATE

Both endpoints take `x-retell-signature` (HMAC-SHA256 of the exact request body, keyed with
`RATE_SHARED_SECRET`, hex) or `x-rate-secret` (the shared secret verbatim). Compared with
`crypto.timingSafeEqual`. Neither header, or a mismatch, returns **401**. The secret lives in the
n8n Variable `RATE_SHARED_SECRET` — never in this repo, never in a node body (§ 9).

Both workflows carry `errorWorkflow: SlnAeMrVRORsF0w7` (OPS — Error Sentry).

---

## WF-ANI — `POST /webhook/tools/ani-lookup`

Caller lookup for the moment the phone rings.

### Request
`{ phone_e164, tenant_id, call_id }` at the body root or under `args` / `arguments` / `parameters`.
`phone_e164` is normalized defensively — 10-digit, 11-digit and punctuated forms all resolve.

### Response
```json
{ "known_caller", "first_name", "company_name", "account_type", "last_trip",
  "rate_plan", "ghl_contact_id", "data_verified", "reason", "lookup_ms" }
```

- `account_type` — `corporate` when the CRM says `DIRECT_BILL` / `NEW_ACCOUNT` or a company is on
  file; `retail` on `CC_ON_FILE`. **Never guessed from the area code.**
- `last_trip` — `{trip_type, pickup_datetime, pickup_address, dropoff_address, vehicle_class}`,
  or `null` when the CRM holds no prior trip. Never invented.
- `data_verified` — `true` only when the lookup actually completed. A **miss is a verified answer**
  (`data_verified: true`, `known_caller: false`); a **failed lookup is not** (`false`).

### The 400ms budget — measured, not assumed

One GHL round trip only. `/contacts/search/duplicate` returns identity, `companyName`, tags **and
`customFields`** in a single call, so last-trip and billing need no second fetch.

Measured 2026-08-03 from inside n8n, 20 consecutive lookups with the timeout lifted:

| p50 | p75 | p90 | tail |
|---|---|---|---|
| 243 ms | 287 ms | 366 ms | 741 ms, 2247 ms |

The CRM node timeout is **360 ms** — the most the hard 400 ms endpoint budget allows once code
time is counted. Roughly the slowest 10% of lookups therefore return a **fast-miss**
(`known_caller: false`, `data_verified: false`, `reason: FAST_MISS`) rather than a late answer.

**Open decision for Shane:** raising the budget to ~800 ms would recover that last ~10% of caller
recognitions. 400 ms is honored as ratified; the number above is what it costs.

### Traps this endpoint already stepped on

- **`nodeCredentialType` is silently ignored.** `n8n-nodes-base.httpRequest` wants
  **`genericAuthType`**. With the wrong key the credential is attached in the workflow JSON, the UI
  shows it bound, and GHL still answers `401 No Authorization header found`.
- **A node timeout THROWS.** `neverError` suppresses HTTP error *statuses*, not socket timeouts.
  Without `onError: continueRegularOutput` the run died at the CRM node and the webhook returned
  **HTTP 200 with an empty body** on 15–25% of calls — the agent got nothing.
- **A failed lookup must never read as a verified miss.** The first build reported
  `data_verified: true` on a `401`. The check now treats any non-2xx, any error field, and any body
  carrying neither `contact` nor a trace id as a failure.

---

## WF-COMMIT — `POST /webhook/tools/commit-reservation`

### Request
`{ tenant_id, call_id, intake_id, quote_id|null, retell_call_id, reservation }` where
`reservation` is RESERVATION_CORE (`schema/aic-reservation-v1.json`) plus the trip-type extension.

Per-trip-type required slots are enforced server-side: `AIRPORT_ARR` needs airline + flight number
+ meet style, `HOURLY`/`ROADSHOW` need `hours_booked`, `P2P` needs a dropoff. A missing slot
returns `reservation_state: FAILED` with the slots named — and **mints no trip id and writes
nothing**.

### What it does
1. GHL contact upsert (23 `aic_*` custom fields)
2. **Reservation custom-object record** — object `6a70df48cf83fcd4097d738a`, key
   `custom_objects.reservation`, 27 properties. A real record, *not* a snapshot flattened onto the contact.
3. **Association** to the contact — `reservation_contact` `6a70e026747242cebef44955`
4. Trip note on the contact
5. **READ-AFTER-WRITE** — the record is re-fetched and hash-compared field by field against what
   was intended. `crm_write_status` is decided by what the CRM returned, never by what the write
   call claimed.
6. Commit ledger row (n8n Data Table `reservation_commits` `DCNqBPRtXLaLFSEh`)

### Trip ID
`AC-YYMMDD-XXXX`, suffix derived from the payload hash — the same reservation always mints the
same trip id, so a retry cannot invent a second trip number.

### State policy
| | |
|---|---|
| `crm_write_status` | `CRM_VERIFIED` · `WRITE_UNVERIFIED` · `WRITE_FAILED` |
| demo tenant | may return `CONFIRMED`, and **only** on `CRM_VERIFIED` |
| every other tenant | CAPTURE_ONLY — hard-capped at `REQUEST_RECEIVED` however clean the write |
| `WRITE_FAILED` | `FAILED` |

`provider_reservation_id` is `null` in Phase 2 — there is no provider submission yet.
A field the caller never gave prints **`— NOT PROVIDED`** on the ticket. Never inferred, never defaulted.

### Idempotency
Keyed on `retell_call_id` against the `reservation_commits` ledger. A repeated call id **replays the
original response verbatim** — no second contact upsert, no second record, no second trip id.

**Why a Data Table and not a record search:** GHL's custom-object record search returns **0 rows
immediately after a successful 201 write** (index lag, measured 2026-08-03). Search cannot back
idempotency. The Data Table is immediately consistent — the same reason `quote_audit` backs WF-RATE.

### § 9 OWNER RAIL enforcement

`Our Number?` gates the upsert. A call placed from one of `OUR_NUMBERS` (every Retell line, the
published SMS line, both owner cells) **skips the contact upsert entirely** and the reservation is
associated to the dedicated zz-test contact instead — a call from one of our own lines never
creates or mutates a real lead.

Every downstream node reads the contact id from **`Resolve Contact`**, never from the upsert node,
so the guard cannot be bypassed by a later edit that forgets it exists. The first build of this
workflow *computed* `is_our_number` and never used it; the § 9 assertion at the end of the run is
what caught it.

Asserted live 2026-08-03: Error Sentry `SlnAeMrVRORsF0w7` **active**, attached to both workflows;
owner-alert contact `pWm6s2wCWu8rMlDxmhcW` tagged `owner-alerts` / `zz-internal` / `do-not-drip`
and distinct from the zz-test sink; `OWNER_ALERT_CONTACT_ID` appears only in the two Ticket Owner
messaging nodes, never in an upsert.

### Commit-success also fires the quote-ticket path
`Respond Commit` → `Send Ticket?` → owner SMS + owner email, reusing the Run 1 GHL messaging
branch. Additive: the response is already returned before the ticket path runs, so messaging
latency never reaches the agent. Owner alerts are status-led per MESSAGE FORMAT LAW.

---

## Running the batteries

Both need the shared secret at `automation/rate-engine/rate_secret.txt` (not committed — read it
from the n8n Variable `RATE_SHARED_SECRET`).

```bash
python automation/ani-commit/ani_battery.py
python automation/ani-commit/commit_battery.py
```

Last run 2026-08-03: **WF-ANI 27/27 PASS · WF-COMMIT 40/40 PASS.**

Both batteries seed their own fixtures on NANP-reserved `555-01xx` numbers (which cannot ring a
real person), read every claim back independently out of GHL rather than trusting the endpoint's
own word, and delete what they created.
