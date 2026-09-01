# AI CHAUFFEUR POST-CALL RAIL — source of record

`build-trip-ticket.js` is the **authoring copy** of the `Build Trip Ticket` Code node inside n8n
workflow **`TkETvvnABhUPd7ME`** ("DEMO POST-CALL RAIL v1"). n8n is the runtime; this directory is the
only version-controlled copy. Edit here, replay, then push the body into the node — there is no
automatic sync.

The rail is live for **both tenants**, routed by `call.agent_id`:

| agent_id | Tenant | Mode | Prefix | Desk line |
|---|---|---|---|---|
| `agent_2d1d687eb85e6d5d0e720795c2` | AI Chauffeur | RATE CARD | `AIC-` | from `call.to_number` |
| `agent_367be6cf3c722e89fca03e34b5` | Reliable Limo & Charter | CAPTURE-ONLY | `REL-` | from `call.to_number` |

**No phone number is hardcoded in the builder.** The desk callback number on the caller receipt is
derived from the payload's own `to_number`, so a tenant can only ever be given the line the caller
actually dialed. That is the mechanism that keeps the two brands from crossing — not a constant.

## Where the trip data actually lives

This is the trap that cost RUN 1. A Retell post-call webhook carries trip fields in **two** places:

- `call.call_analysis.custom_analysis_data` (CAD) — the post-call extraction.
- `call.collected_dynamic_variables` (CDV) — what the conversation flow saved mid-call.

**They do not agree on what they contain.** On the live 2026-08-30 booked call
(`call_44e230ac978b6212fa881a99aab`) CAD had no airport key under any name; the airport existed only
as `cdv.airport_code = "MKE"`. `commit_status` and `trip_id` are CDV-only too.

`pick()` reads CAD. `pick2()` reads CAD then CDV, **for named keys only**. It is deliberately not a
merge: CDV also carries router bookkeeping (`previous_node`, `current_node`, `message`,
`rate_input_valid`, `spoken_trip`) that would land in the ticket's OTHER CAPTURED FIELDS block.

## Airport resolution

`hApt()` resolves a code, a full terminal name, an unambiguous city, a short form, or a single
embedded IATA token to the terminal name. It returns `null` — which trips `REVIEW REQUIRED` — for
anything it cannot resolve, and **deliberately** for a metro with more than one commercial field:

| Input | Result |
|---|---|
| `MKE` · `Milwaukee` · `Milwaukee Mitchell` · `General Mitchell` · `Mitchell Field` | Milwaukee Mitchell International |
| `ORD` · `O'Hare` · `O'Hare Intl` · `ORD Terminal 3` | O'Hare International |
| `MDW` · `Chicago Midway` · `Midway` | Chicago Midway |
| `PHX` · `Phoenix` · `Sky Harbor` | Phoenix Sky Harbor |
| `Chicago` | **null** — `airport (heard "Chicago" — O'Hare or Midway?)` |
| `MKE or ORD` | **null** — two codes, no guess |
| `1225 Main Street, West Bend, Wisconsin` | **null** — an address is never an airport |

Same for Dallas, Houston, New York and Washington. Guessing which field a caller meant would invent
a value, which is the one thing Fiction-Zero forbids.

## Fiction-Zero

`EMPTY — NO RESULT` is still the law's name and still the sentinel in code. It must **never render**
to a human. Absence reads as plain language (`not stated`, `name not given`, `none captured`), and a
call with no trip content renders a call alert instead of a dispatch brief — no ticket block, no rate
or vehicle tile, and a footer that makes no claim about what the caller said or heard.

## Replaying

```bash
node replay.js build-trip-ticket.js fixtures/8660_booked.json          # prints the returned json
node replay.js build-trip-ticket.js fixtures/8663_zero.json --html /tmp/out.html
```

`fixtures/` holds six real captured webhooks with caller identifiers replaced by placeholders and
per-word timing arrays stripped. Structure is untouched — that is what the fixtures exist to test.

| Fixture | What it covers |
|---|---|
| `8660_booked` | 5m35s AI Chauffeur booking. Airport from CDV, arrival header, commit CONFIRMED, `$185` quote |
| `8663_zero` | 0-second `not_connected` call. Empty CAD, empty transcript — the call-alert path |
| `8581_x` | Second AI Chauffeur booking. Independent confirmation of the CDV airport path |
| `8702_airport_cad` | Reliable Limo, airport present in CAD as `Milwaukee Mitchell` |
| `8721_x` | Reliable Limo, oversized party, vehicle missing → REVIEW REQUIRED |
| `6688_rel` | Reliable Limo, airport trip with **no** airport captured → REVIEW REQUIRED |

## Known, not fixed

`esc()` escapes `&`, `<` and `>` but not `"`, and `recording_url` is interpolated into an `href`.
Inert today because Retell's CDN is the only writer of that field. Pre-existing; worth closing on a
run that owns the escaping layer.

## Downstream

The node's output keys are consumed by `Caller Copy Gate` (`caller_email`, `caller_copy_ok`,
`caller_subject`, `caller_html`), `Todd Copy Gate` (`subject`, `html`), `Caller Reachable?`
(`caller_phone_e164`, `has_trip`), `SMS Consent OK?` (`sms_ok`) and `Owner SMS Worth Sending?`
(`owner_sms_ok`). Changing a key name breaks a gate silently — the IF nodes compare strings.
