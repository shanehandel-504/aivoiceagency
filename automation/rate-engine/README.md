# CHAUFFEUR RATE ENGINE v1.0 — source of record

Shipped 2026-08-03. These files are the **authoring copy** of code that lives inside n8n.
n8n is the runtime; this directory is the only version-controlled copy. Edit here, then push
the change into the node — there is no automatic sync.

**Card version now live: `RCv2.3`.** The three `wf-rate.*.js` bodies here had drifted to RCv1.0
while the workflow ran RCv2.0 → RCv2.2; they were re-synced from the live nodes on 2026-08-28 and
now match `2JlTkvQ1dGiwwjw9` byte-for-byte. Because there is no automatic sync, **re-diff these
files against the live nodes before trusting them.**

`docs/` and `automation/` are in `.vercelignore`, so nothing here is deployed.

## Where each file runs

| File | n8n workflow | Node |
|---|---|---|
| `wf-rate.01-verify-normalize.js` | WF-RATE `2JlTkvQ1dGiwwjw9` | `Verify + Normalize` |
| `wf-rate.02-compute-quote.js` | WF-RATE `2JlTkvQ1dGiwwjw9` | `Compute Quote` |
| `wf-rate.03-build-response.js` | WF-RATE `2JlTkvQ1dGiwwjw9` | `Build Response` |
| `postcall.build-text-back.js` | AVA Post-Call `6r8YHuMEJbxeDyT5` | `Build Text Back` |
| `postcall.inject-quote-block.js` | AVA Post-Call `6r8YHuMEJbxeDyT5` | `Inject Quote Block` |

`wf-rate.workflow.json` is the full node+connection graph as created.
`battery.py` + `rate_call.py` are the test harness (see below).

## Endpoint

```
POST https://circulant.app.n8n.cloud/webhook/tools/rate-lookup
```

Auth — one of:
- `x-retell-signature`: HMAC-SHA256 of the **exact request body** keyed with `RATE_SHARED_SECRET`,
  hex. Bare hex or `v1=<hex>` / `sha256=<hex>` both parse.
- `x-rate-secret`: the shared secret verbatim.

Both are compared with `crypto.timingSafeEqual`. Neither header, or a mismatch, returns **401**.
The secret lives in the n8n Variable **`RATE_SHARED_SECRET`** — never in this repo, never in a node body (§ 9).

## The contract

**There was no pre-existing `rate_lookup` contract.** A full sweep of the repo, 373 commits across
74 branches, 75 Retell agent versions, 73 Retell LLM versions, 20 n8n workflows, 45 GHL custom
fields and Notion found no tool, node or spec of that name with defined fields. The Notion hits are
a *third-party* Limo Anywhere endpoint path (`/companies/{company_alias}/rate_lookup`), not ours.
**This file defines the contract. It is a new decision, not a recovered one.**

### Request — `args` (also accepted at the body root, or under `arguments` / `parameters`)

| Field | Type | Notes |
|---|---|---|
| `trip_type` | `"hourly"` \| `"airport"` | required |
| `vehicle_key` | string | must exist in `vehicle_classes` |
| `pickup_at` | ISO-8601 or `yyyy-MM-dd HH:mm` | required; interpreted in `America/Chicago` |
| `requested_hours` | number | hourly only |
| `origin`, `airport` | string | airport only; matched case- and punctuation-insensitively. **`origin` stays the zone-lookup pricing key** regardless of direction |
| `trip_origin`, `trip_destination` | string | optional, RCv2.3. The true direction of travel. On an airport **arrival** `trip_origin` is the airport and `trip_destination` is the drop-off — the reverse of the `(origin, airport)` pricing key. Wording only: see **Direction fields** below |
| `addons` | array of `{key, qty, seat_type}` | object and CSV forms are also normalised |
| `stops_count` | number | `> 3` escalates |
| `account_type` | `retail` \| `corporate` \| `affiliate` \| `farm_out` | non-retail never gets a number |
| `pricing_mode` | `QUOTE_ENABLED` \| `CAPTURE_ONLY` | overrides the tenant policy |
| `call_id`, `tenant_id` | string | `tenant_id` defaults to `demo` |

### Response

```json
{ "quote_id", "status", "all_in_total", "currency", "gratuity_included": true,
  "breakdown": [ { "label", "amount", "detail" } ],
  "rate_source": "hourly|airport|none", "rate_card_version", "superseded_quote_id",
  "reason", "message", "call_id", "tenant_id" }
```

`message` is the speakable one-liner. `reason` is for operators and logs.

### Statuses

`QUOTED` · `CAPTURE_ONLY` · `NO_ROUTE_FOUND` · `HUMAN_REVIEW_REQUIRED` ·
`CORPORATE_RATE_REQUIRED` · `INPUT_INCOMPLETE` · `RATE_ENGINE_FAILED` · `UNAUTHORIZED` (401)

`INPUT_INCOMPLETE` is an addition to the brief's list. A missing field is not a dispatch
escalation — it is a question the agent should ask — so it gets its own status and a
question-shaped `message`. Everything else returns HTTP 200 so the agent always has something
speakable; only auth failure is a non-200.

**Every non-`QUOTED` status returns `all_in_total: null` and an empty `breakdown`.** The battery
asserts this: no retail number can leak on an escalation.

## Math

1. Day type — Fri/Sat/Sun = `weekend`, resolved in `America/Chicago`. A date in `holidays`
   escalates to `HUMAN_REVIEW_REQUIRED`.
2. **Hourly** — `billable = max(requested, minimum_for_day_type)`; `base = round5(rate × billable)`.
3. **Airport** — exact `(origin, airport)` zone lookup. No match ⇒ `NO_ROUTE_FOUND`.
   **The engine never estimates and never substitutes a nearest city.**
   `base = round5(zone[basis_base] × multiplier)`, basis from `airport_vehicle_adjust`.
   Stretch / party-bus / coach classes carry `review_required` and escalate.
4. `service_charge = base × 20%`, labelled "chauffeur gratuity & service".
5. Add-ons. `late_night` is auto-applied when the local pickup hour is 23:00–04:59.
   `child_seat` without `seat_type` returns `INPUT_INCOMPLETE`.
6. `all_in_total = base + service_charge + add-ons`.

**Rounding.** `rounding_increment` is applied to the **base only**, both trip types. Because a
$5 multiple × 20% is always a whole dollar, the line items always sum exactly to `all_in_total`.
Rounding the *total* instead would have produced an itemised quote whose lines do not reconcile —
a defect in an emailed ticket. The battery asserts the sum on every `QUOTED` case.

## Direction fields (RCv2.3, 2026-08-28)

Zone rows are direction-agnostic — one `(Kewaskum, MKE)` row prices both the MKE arrival and the
MKE departure. Until RCv2.3 the spoken phrase always read origin-to-airport, so an **arrival** was
described backwards to a caller standing in the terminal.

When Retell sends **both** `trip_origin` and `trip_destination` non-empty, and the trip is not
hourly, the spoken route phrase becomes `{trip_origin} to {trip_destination}` and
`normalized_origin` / `normalized_destination` follow the same direction.

- **Airports are spoken as terminal names.** A direction field may arrive as an IATA code (`MKE`),
  a full name (`Milwaukee Mitchell International Airport`), or a town (`Kewaskum`). Codes and
  canonical names resolve to the same wording the zone lane already speaks; anything else passes
  through verbatim.
- **Bare city names are deliberately NOT matched to their airports.** Indexing
  `Denver International` under `Denver` would make a downtown-Denver pickup speak as the airport.
  A non-canonical phrasing is spoken as the caller said it — never wrong, occasionally less canonical.
- **Hourly is excluded.** Its phrase is a duration (`3 hours of dedicated service`), not a route.
- **Not in the input hash.** `trip_origin` / `trip_destination` are absent from `canonical`, so they
  cannot move `input_hash` and cannot change idempotency, supersede or `quote_id` behavior.
- **Absent fields ⇒ byte-identical output.** Verified by running the RCv2.2 and RCv2.3 bodies against
  identical inputs: `message`, `spoken_trip`, `breakdown`, `all_in_total` and the response key set all
  match exactly. Only `rate_card_version` / `calculation_version` / `reason` carry the version bump.

Pricing, zone lookup, the ladder, rounding and the response contract shape are untouched.

## Idempotency and corrections

`input_hash = sha256(tenant_id | call_id | canonical_inputs)`.

- Same `call_id` + same inputs ⇒ the original `quote_id` is returned and **no new audit row is written**.
- Same `call_id` + different inputs ⇒ a new `quote_id`, prior rows for that call flipped to
  `SUPERSEDED`, and `superseded_quote_id` returned.

## Data tables (n8n project `1XuT7aKjecjLpe2J`)

| Table | Id | Rows |
|---|---|---|
| `vehicle_classes` | `dofpCkfUf9u13OCt` | 18 |
| `hourly_rates` | `dhypYajHbsOUqua6` | 18 |
| `airport_zones` | `ffdnELJPWfa3yLsj` | 35 |
| `airport_vehicle_adjust` | `KQQy3fSHRlnWKmHQ` | 18 |
| `addons` | `sjmTvvww3QwueBCA` | 5 |
| `pricing_policies` | `MQSD2rRYt5POaFYK` | 1 |
| `holidays` | `KNVXERtLOqHrmSzr` | 8 |
| `quote_audit` | `g4tjdTKEwDjnojQU` | write target |

Every rate row carries `rate_card_version` `RCv1.0`, `tenant_id` `demo`, `effective_from` 2026-08-03.

**2026-08-05 — demo-zone coverage for Shane's test area.** Three `DEMO_SEED` rows were appended to
`airport_zones` (32 → 35), on RCv1.0 and consistent with the existing `WestBend`/`MKE` 125/165 ladder:

| origin | airport | sedan_base | suv_base |
|---|---|---|---|
| `Kewaskum` | `MKE` | 135 | 180 |
| `Kewaskum` | `ORD` | 265 | 335 |
| `WestBend` | `ORD` | 255 | 320 |

The stored origin spelling is `WestBend`, no space — matched to the existing row, and read back off the
live endpoint before writing, not assumed. Zone rows are direction-agnostic: the same `(origin, airport)`
row prices an MKE arrival dropping in Kewaskum and a Kewaskum pickup departing MKE.

The brief listed `key` on `vehicle_classes` and `vehicle_key` on `hourly_rates`; both ship as
**`vehicle_key`** so the join column has one name.

## Running the battery

Needs the shared secret at `rate_secret.txt` beside `rate_call.py` (not committed — read it from
the n8n Variable `RATE_SHARED_SECRET`).

```bash
python automation/rate-engine/battery.py
```

47 cases, all against the live signed endpoint. Last run 2026-08-03: **47/47 PASS**.
Cases 46–47 are stateful (replay, then correction) and write real `quote_audit` rows under
`b46_idem`-style call ids.

## Sandbox facts (measured, not assumed)

The n8n Code sandbox has **no `crypto` global, no `URL`, no `fetch`, no `process`**.
`require('crypto')` **does** work and gives `createHmac`, `createHash`, `randomUUID` and
`timingSafeEqual`. `Buffer`, `TextEncoder`, `$vars` and Luxon `DateTime` are all available.
