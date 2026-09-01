# AIC POST-CALL RAIL — RUN 1

**2026-09-01 · n8n `TkETvvnABhUPd7ME` · `edf53538` → `759d31d1` · LIVE**

---

## What was wrong

One bug with two symptoms, and two sentences that were not true.

**The airport was never in `custom_analysis_data`.** The builder's airport lookup read four keys —
`airport`, `pickup_airport`, `arrival_airport`, `airport_name` — all of them out of
`call.call_analysis.custom_analysis_data`. On the live call `call_44e230ac978b6212fa881a99aab`
(5m 35s, ref `AIC-81A99AAB-9511`) that object contains **no airport key under any name**. The value
existed only as `call.collected_dynamic_variables.airport_code = "MKE"`.

So the brief's instruction — widen the CAD key list — would have fixed nothing. The lookup was
reading the wrong object. Two symptoms followed from that single cause:

1. `AIRPORT: REVIEW REQUIRED` on the ticket, and `MISSING BEFORE DISPATCH: airport`, on a call where
   the caller said "Milwaukee", the desk confirmed it, and Retell's own summary named Milwaukee
   Mitchell International.
2. The route header fell through to `originCity` and read **"West Bend → 1225 Main Street"** — an
   arrival described backwards to the one person standing in baggage claim.

**A 0-second call bragged about a conversation that never happened.** `AIC-983E100D-9511`
(`duration_ms: 0`, `call_status: not_connected`, empty CAD, empty transcript) rendered a full
dispatch brief: every ticket line reading `EMPTY — NO RESULT`, a vehicle tile reading
`REVIEW REQUIRED` for a vehicle nobody ever asked about, a green `REQUEST RECEIVED` beacon, and a
footer stating *"Somebody called, described the trip, and dispatch received a structured request."*

**Two lines of copy were false.** The caller receipt promised *"Reply here or call back and we will
correct it on the spot"* — a reply path that reaches nobody and a correction the rail cannot make.
`DISCOVERY CALL: false` printed a raw boolean. And the provider line said *"nothing was submitted or
booked"* directly above a summary saying the agent *"successfully booked the reservation."*

---

## What shipped

### JOB 1 — airport capture

- **Second read source.** `pick2()` reads CAD first, then `collected_dynamic_variables`. Scoped to
  named keys, **not** a merge: CDV also carries `previous_node`, `current_node`, `message`,
  `rate_input_valid` and `spoken_trip`, and a merge would have dumped all of it into the ticket's
  OTHER CAPTURED FIELDS block.
- **Widened keys.** `airport`, `airport_code`, `pickup_airport`, `arrival_airport`,
  `departure_airport`, `airport_name`, `airport_iata`, `iata_code`.
- **Resolver rebuilt.** A name index generated from the airport table itself, plus an alias table.
  Resolves a bare code, a full terminal name, an unambiguous city, a short form, `INTL`/`FIELD`
  spellings, and a single embedded IATA token.
- **Ambiguity is not guessed.** Chicago, Dallas, Houston, New York and Washington stay unresolved and
  print `airport (heard "Chicago" — O'Hare or Midway?)`. A metro with two commercial fields cannot be
  resolved without inventing a value.
- **Direction-aware header.** An arrival reads terminal → drop-off; a departure reads origin →
  terminal.

Three resolver gaps were found by probing, not by reading: `ORD Terminal 3`, `O'Hare Intl` and
`Mitchell Field` all returned null on the first cut. All three fixed before ship.

**A second bug was found while testing the first.** The fallback that probes route keys for a
terminal called `pick2('pickup_location', 'dropoff_or_duration')` — one call, both keys. On a
departure that returns `pickup_location` (a street address), fails to resolve it, and **never tries
`dropoff_or_duration`**, which is where the terminal sits on that leg. Each key is now probed on its
own, and only on a trip that is already airport-shaped.

### JOB 2 — the zero-content call

A call with no trip content now renders a **call alert**, not a dispatch brief: the number, the
length, the line it came in on, and a tap-to-call button. No ticket block. No rate or vehicle tile.
No sentiment meter. The footer reads *"The call reached your line and dropped before it connected. It
is logged with the number and the time. Nothing was said, so nothing about a trip is claimed here."*

Three footer variants keyed to what is actually known — did not connect / spoke but nothing
ticketable / answered and logged — so the sentence is true in each case rather than true on average.
Booked and captured calls keep today's owner footer **byte-identical**.

### JOB 3 — truthful copy

- The correction line now reads *"Need to change something? Call the desk back at (414) 775-0019 and
  give reference AIC-…. A reply to this email does not reach dispatch."* The number comes from the
  payload's own `to_number`, so Reliable gets `(414) 409-5008` and AI Chauffeur gets
  `(414) 775-0019`. **There is no literal phone number anywhere in the builder** — a cross-brand leak
  is structurally impossible, not merely avoided.
- `DISCOVERY CALL: false` → `DISCOVERY CALL: not booked on this call`.
- The provider line now reads *"RATE CARD demo — reservation written to the demo system as
  AC-260830-6E76, not dispatched to a live fleet"* when `commit_status` is CONFIRMED, so it agrees
  with the summary. Status beacon reads `RESERVATION RECORDED`. A failed commit still says nothing
  was submitted, and still trips review.

### Fiction-Zero

`EMPTY — NO RESULT` remains the law's name and the sentinel in code. It no longer reaches a human on
any surface — 78 rendered emails grepped clean.

---

## The booked ticket, before and after

```
BEFORE                                    AFTER
AIRPORT: REVIEW REQUIRED                  AIRPORT: Milwaukee Mitchell International · Airport pickup — arrival
DISCOVERY CALL: false                     DISCOVERY CALL: not booked on this call
MISSING BEFORE DISPATCH: airport          COMMIT STATE: Confirmed
PROVIDER: … nothing was submitted         PROVIDER: … reservation written to the demo system as
          or booked                                 AC-260830-6E76, not dispatched to a live fleet

header:  West Bend → 1225 Main Street     header:  Milwaukee Mitchell International → 1225 Main Street
status:  REVIEW REQUIRED (amber)          status:  RESERVATION RECORDED (green)
```

---

## Verification

Six **real** captured webhooks replayed through both the old and new bodies, plus 10 synthetic
resolver cases and 23 malformed payloads.

| Check | Result |
|---|---|
| Booked call: no review banner, full terminal name, airport-to-address header | PASS |
| Booked call: provider line agrees with summary | PASS |
| 0-second call: no ticket block, no sentinel, no claim about what was said | PASS |
| 0-second call: caller email + SMS still suppressed, owner alert still fires | PASS |
| Reliable REL- payload: every delta | **2 lines**, both mandated by the brief |
| Owner footer on booked/captured calls | **byte-identical**, all 5 real payloads |
| Fiction-Zero sentinel on any human surface | **0 hits across 78 rendered emails** |
| Ambiguous city / unrecognized / absent airport → REVIEW REQUIRED | PASS ×3 |
| Departure header reads origin → terminal | PASS |
| 23 malformed payloads (missing `call_analysis`, null CDV, numeric airport, no `call_id`, HTML injection) | **0 throws** |
| Render at 390×844 and 1280×900 | 0 horizontal overflow, 0 console errors |
| Forbidden words in new copy ("locked", she/her, guaranteed) | 0 |
| Literal phone numbers in the builder | 0 |
| Pushed node vs local file | **byte-identical**, sha `c88c7d1b`, 52 289 chars |

The two Reliable deltas: `FLIGHT: EMPTY — NO RESULT (Commercial)` → `FLIGHT: not stated
(Commercial)` (mandated by the CANON), and the caller correction line (mandated by JOB 3). Nothing
else moved.

### The adversarial pass had to be run by hand

A five-lens subagent workflow was dispatched to attack the patch. **Every one of its agents had every
tool call rejected by a broken permission handler** — no file was read, no code was run. It produced
zero coverage, and two of its lenses returned empty findings arrays that would have read as a clean
pass. They were not. Every check in the table above was then run directly.

That pass caught one real leak the first cut missed: OTHER CAPTURED FIELDS printed
`CORRECTION MADE: true` — the same bare-boolean defect JOB 3 names, one line over. Fixed.

**Known, not fixed, out of scope:** `esc()` escapes `&`, `<` and `>` but not `"`, and
`recording_url` is interpolated into an `href`. Inert today because Retell's CDN is the only writer
of that field. Pre-existing; worth closing on a run that owns the escaping layer.

---

## REPORT — the $185 quote

Read off the rate engine's own live execution (`2JlTkvQ1dGiwwjw9`, execution **8658**), not inferred.

**Priced key:** `WestBend → MKE`. `exact_rate_row: "WestBend->MKE"`, `zone_review_status: DEMO_SEED`,
`quote_source: EXACT_ZONE`, card **RCv2.3**, `day_type: weekday`.

| Line | Amount | Detail |
|---|---|---|
| Executive Sedan — airport transfer | $125 | WestBend to MKE, sedan base $125, multiplier 1 |
| Service fee | $25 | 20% of $125, included in the total |
| Inside meet-and-greet | $35 | chauffeur at baggage claim with sign |
| **All-in** | **$185** | `roundUp5` no-op |

`quote_id q_ac9561dc-8901-4ae2-be70-c53e67f8da24` · `input_hash f14c9c7f…`

**Origin and destination the engine actually priced vs. what it spoke.** The pricing key for an
airport transfer is `(origin, airport)` and the zone row is direction-agnostic — the same
`WestBend → MKE` row prices the arrival and the departure. RCv2.3's direction override is what made
the *spoken* phrase reverse: `normalized_origin: "Milwaukee Mitchell International"`,
`normalized_destination: "1225 Main Street, West Bend, Wisconsin"`, and
`spoken_trip: "Milwaukee Mitchell International to 1225 Main Street, West Bend, Wisconsin"`.

So the row priced is `WestBend → MKE`; the direction spoken to the caller is MKE → West Bend. Both
are correct and they are not the same statement.

One note for a later run: `automation/rate-engine/README.md` records that bare city names are
**deliberately not** resolved to airports in the rate engine's spoken phrase, to stop a
downtown-Denver pickup speaking as the airport. This run does the opposite in the ticket builder —
but only for values arriving on an **airport-typed field on an airport trip**, where the
downtown-Denver hazard does not exist. Different surface, different risk, deliberately different
rule.

---

## DONE

| Item | Value |
|---|---|
| Workflow | `TkETvvnABhUPd7ME` — DEMO POST-CALL RAIL v1 |
| Old version | `edf53538-5c0e-41a0-b83e-35ae714f2a1a` |
| New version | `759d31d1-d9b9-409e-be26-3bf6683a03af` |
| sameAsDraft | true — `versionId` === `activeVersionId`, `active: true` |
| Error workflow | `SlnAeMrVRORsF0w7` still attached (§ 9 OWNER RAIL LAW) |
| Rollback | restore version `edf53538-5c0e-41a0-b83e-35ae714f2a1a` |
| Tests passed | 6 real payloads · 10 synthetic · 23 malformed · 14 assertions · 78-file sentinel grep |
