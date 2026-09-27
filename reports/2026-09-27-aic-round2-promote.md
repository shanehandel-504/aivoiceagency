RUN INCOMPLETE — RAIL SWITCH BLOCKED BY THE SESSION PERMISSION CLASSIFIER / DESK V3 PROMOTE NOT STARTED (IT DEPENDS ON THE SWITCH) / NEXT: SHANE ALLOWS OR RUNS THE SWITCH, THEN STEPS 4B–6

# AIC Capture Desk — Round 2 FINAL (lines in → sims → calls → rail gate → snapshot)

**Date:** 2026-09-27 (Central) · **Continues:** `reports/2026-09-27-aic-round2-staged.md` (its IDs held).
**The live desk did not change:** 414-775-0019 and /try still answer on `agent_e41b2e957f1de46cf23dc25a84` v1; the live ticket
rail `TkETvvnABhUPd7ME` still serves `79a5e162`. No agent-spoken line was written by Claude: every new line is Grok's,
applied byte-exact from the brief.

## What happened, in plain words

- Grok's lines are in on the test desk AIC-TEST-2 (test line …5008) and published as **v2**: the greetings now say
  "reservation system", the charter questions ("What date, start time, and how many hours?" and "How many hours, or one
  way?") are live, and the read-back names the vehicle ("written for a Motorcoach", "written for an Executive Sedan").
- The sim gate passed **12 of 12**. The first batch caught a real bug: the desk marked trips "one way" when nobody said it
  (airport, plain point-to-point, and the Nobu charter, where it skipped the hours question). Fixed before the gate.
- Shane was out, so the three Step 3 calls were made as real web calls with a synthesized caller (his ruling): computer
  speech into the call's microphone, Retell's real speech recognition, the call card word for word. All three captured
  every field correctly, and the rail replay of calls 1 and 2 matched every expected field.
- The rail switch was refused by this session's permission classifier, so the live rail is unchanged. The desk v3 promote
  depends on the switch and was not started. The owner-contact tag was refused the same way.
- The call-3 test booking was deleted from the calendar. The public board no longer shows the owner-alert email, a
  prospect's personal email, or the test line.

## DONE

| Step | What | State | Proof |
|---|---|---|---|
| 1 | Grok's lines into AIC-TEST-2 flow v2 (forked from v1): N01-P, N01-B, global prompt first sentence, N03C-2-CHARTER, N04-HOURS, composer frames (ARR · DEP · P2P hours · P2P one way · HRLY, vehicle clause "written for [a/an] [label]") | DONE | validator: **0 unapproved lines** (54 static texts), 0 markers, pending list empty; 52/52 code tests; the five frames render byte-exact against Grok's frame text |
| 1 / 7 | `one_way` never on airport / hourly / non-charter trips | DONE | extraction wording (explicit "one way" only) + `n06_oneway` code clamp after the last extraction; asserted in the sims (A1, H1, P1, E2 false) and in real calls 2 and 3 (false) |
| 2 | Sim gate on the draft, every tool mocked, our scorer | **12/12 PASS** | batch `test_batch_ac2f471c11fb` (10 listed cases + G1 greetings) + real silence web call `call_6e36e3b736b5b0b0b50c5a645de`; extras 3/3 |
| 2 | AIC-TEST-2 v2 published | LIVE (test line) | published bytes = tested bytes (hash `b75bbe7c…`); …5008 in + out → `latest_published` = v2 |
| 3 | Three calls (synthesized caller, real web calls on v2) | DONE, all field checks PASS | call 1 `call_f65cd4d9000d8f06a0c661712c9` · call 2 `call_0aac88baaa673ded89e23faa4e8` · call 3 `call_d7312d49825d17d52c14920d71f`; ZZ sink execs 11048 / 11050 / 11055 |
| 4 | Rail replay on staging `WcMOi7GdVoIGUlwU` | **GATE PASS** (call 1 every expected field; call 2) | pinned replays exec 11057 / 11058, nothing sent for real |
| 4 | Rail switch (`update_workflow` on `TkETvvnABhUPd7ME`) | **BLOCKED** — permission classifier | live rail unchanged `79a5e162`; draft never written |
| 4b | AIC-TEST-2 webhook → live rail | NOT DONE (depends on the switch) | still the ZZ sink |
| 5 | Pre-promote snapshot + rollback § 10 | DONE | private archive `a87f292`: `ops/tuning/desk-pre-v3-2026-09-27/` |
| 6 | Desk v3 port + publish by API | NOT STARTED (depends on the switch) | desk still v1 published, RUN D v2 draft untouched |
| 6 | Delete the call-3 test appointment | DONE | `yDLs0L8T3XvOBCID4xSD` deleted; Monday's calendar lists 0 events |
| 7 | Mask the public board | DONE (this commit) | owner-alert email ×7, a prospect's gmail ×3, test line ×1 |
| 7 | Owner-alert contact `do-not-drip` tag | **BLOCKED** — permission classifier | Shane approved after the assertion failed; tags unchanged |

## Step 1 — the patch (data + code; spoken words only from the brief)

Changed nodes on AIC-TEST-2 flow v1 → v2: `n01_p`, `n01_b`, `n03c_2_charter`, `n04_hours` (Grok's text), `n06_compose`
(frame words), `n02/n02dir/n03/n04/n06_extract` (extraction wording only), plus one new code node `n06_oneway`. Flow default
`charter_lines_live` = `true` (the round-2 switch). Global prompt: first sentence replaced, the rest byte-identical.
The composer's date, time, airport, flight, plural and meet logic is byte-identical (310 field-drop variants checked against v1).
Precedence: when a charter has hours, the read-back and the ticket both say the hours, never "one way".

## Step 2 — sim gate (AIC-TEST-2 v2 draft)

| Case | Result | What it proved |
|---|---|---|
| F1 Nobu, hours in the one-breath dump | PASS | charter · 4 hours · Motorcoach (routes Hourly, as in the staged run) |
| F2 Nobu, "one way" when asked | PASS | the hours question fires; one way captured; "one way, written for a Motorcoach" |
| F3 Nobu, hours answered at N03C-2-CHARTER | PASS | charter ask spoken; "4 hours, written for a Motorcoach"; ticket "Point to point · charter", 4 hours |
| A1 airport arrival | PASS | read-back speaks "an Executive Sedan" and ends with the tracking line; ticket "Arrival", no one way |
| P1 point to point, not a charter | PASS | no hours / one-way clause; ticket "Point to point" |
| H1 hourly | PASS | "an Executive SUV"; ticket "Hourly", 3 hours |
| X1 mid-call passenger correction | PASS | 2 → 10 passengers: "an Executive Sedan" read-back replaced by "a Sprinter" |
| T1 talk to the team | PASS | team path, team alert ×1 (mocked) |
| Q1 are you AI | PASS | the approved AI line, then the trip |
| R1 price ask | PASS | the approved price line |
| G1 greetings, both channels | PASS | phone opener byte-exact in 12/12 phone runs (keeps "Calls are recorded and transcribed." in place); browser opener byte-exact |
| 20 s silence (real web call) | PASS | greeting only; hang-up by inactivity 20.2 s after it |
| extra: call-1 path · departure (a Minibus) · fare ask | PASS 3/3 | all five labels spoken with the right article |

Retell's own judge failed R1 (it reads the approved product-price line as "a price no tool returned"); our scorer is the gate,
as in the staged run.

## Step 3 — the three calls

Real web calls on AIC-TEST-2 v2 (Retell `v2/create-web-call`, the LiveKit transport, SDK 2.0.7 for live turn events), with a
synthesized caller: Windows speech ("Microsoft David") played into the call's microphone, Retell's real speech recognition on
the desk side. The caller spoke the card's opener word for word, answered each question the card covers with the card's words,
restated the opener when asked again, and ends the call as failed on any unscripted question. Caller numbers: calls 1 and 2
used fictional 555-01xx numbers; call 3 used a number on `OUR_NUMBERS`, so its booking landed on the zz-test contact (§ 9).
One earlier call-1 attempt (`call_599ffff2…`) failed in the harness (a rolling transcript window) and is not counted.

| Call | Trip | Captured (all PASS) | Read-back ends |
|---|---|---|---|
| 1 Nobu charter | Point to point · charter | hours 4 · one way not set · 56 · Motorcoach · pickup "Baccarat Hotel, 28 West 53rd Street, New York" · drop-off "Nobu Downtown, 195 Broadway" · bags 0 ("no bags") · no airline or airport | "…4 hours, written for a Motorcoach. Anything need changing?" |
| 2 airport arrival | Arrival | Delta 1203 · Milwaukee Mitchell International · 2 passengers · 2 bags · 100 Main Street, Kewaskum · inside with a sign · one way false · Executive Sedan · no hours | "…written for an Executive Sedan. We'll be tracking your flight. Anything need changing?" |
| 3 hourly + setup call | Hourly | Saturday 6 PM · 500 Water Street, Milwaukee · 3 hours · birthday dinner · 4 passengers · one way false · Executive SUV · no bags · setup call booked | "…written for an Executive SUV. Anything need changing?" |

## Step 4 — the rail gate

Staging copy `WcMOi7GdVoIGUlwU` = live `79a5e162` + the four round-2 nodes. One rule was added this run so the brief's expected
callback holds for the test line and for web calls: **every capture-desk trip sheet carries the desk line 414-775-0019**,
whichever number was dialled (the test line never prints on a public trip sheet); other tenants keep the dialled number.

| Expected (call 1) | Got (exec 11057) |
|---|---|
| Pickup as captured | Baccarat Hotel, 28 West 53rd Street, New York |
| Hero | Baccarat Hotel → Nobu Downtown |
| Vehicle | Motorcoach |
| Trip | Point to point · charter |
| Duration | 4 hours |
| Bags | no bags line (owner ticket "BAGS: not stated") |
| Callback | 414-775-0019 |

Call 2 (exec 11058): trip label "Arrival" (the sheet's Trip row reads "Arrival · Milwaukee Mitchell International", as the live
rail has always built it), Executive Sedan, BAGS: 2, no duration, desk callback, no "one way" anywhere. Both replays: runtime
= local shim on all 40 ticket keys, every side-effect node returned its pin, no node errors.

**The switch:** MCP `update_workflow` on `TkETvvnABhUPd7ME` (Build Trip Ticket, 57,983 chars, then the other three nodes) was
refused by the session's permission classifier before anything was written. It was not retried by any other route.

## Findings

1. **Hours in the one-breath dump route to Hourly**, and the Hourly frame has no drop-off, so the read-back omits Nobu (the
   ticket keeps it). Open since the staged run.
2. **"Tonight" is not always captured as a date** on the first pass, so the charter question can fire after the caller already
   gave the time; the gate then asks "What date?" separately.
3. **§ 9 owner row:** 5 active workflows upsert GHL contacts by phone with no own-number guard (AVA Client Intake, send_link,
   write_to_crm, social_intake, LIVE INTAKE v1); the owner row's email sits on the `aivoiceagent.ai` domain, not the
   owner-alert address. Nothing changed.
4. **Silence (T6, platform):** the desk hangs up 20 s after the last line without a goodbye.
5. **Call 3 side effects:** the booking was real on the calendar before cleanup; any owner or team notice it triggered cannot
   be unsent.

## NEXT (Shane)

1. Allow the rail switch in this tool (or run it): `update_workflow` on `TkETvvnABhUPd7ME` with the four staged nodes →
   hash-check against staging → `publish_workflow` → Error Sentry check. Rollback `79a5e162`.
2. Then: AIC-TEST-2 webhook → live rail; desk v3 = AIC-TEST-2 flow v2 + capture-desk analysis set, published by API (waiver
   given); verify 0019, …5008, /try; rebind …5008 to the desk; remove AIC-TEST-2 from WF-AIC-SALES-CAL ALLOWED; archive
   AIC-TEST-2; one /try check call; board flip `aic-capture-desk` → LIVE v3.
3. Owner tag `do-not-drip`: allow it, or add it in GHL.

## Rollback, one line each

- AIC-TEST-2: fork v1 (`create-agent-version base_version 1`) and publish; …5008 follows `latest_published`.
- Staging rail: nothing live (inactive copy).
- Test appointment: none (test data, soft-deleted).
- Board masking: none (do not revert).
- Pending: rail → publish `79a5e162`; desk → "restore v1" (archive rollback bundle § 10 / § 8 C6).

```
===== SHANE READBACK — COPY ALL =====
RUN INCOMPLETE — RAIL SWITCH BLOCKED BY THE PERMISSION CLASSIFIER /
DESK V3 NOT PROMOTED (DEPENDS ON THE SWITCH) / NEXT: ALLOW OR RUN THE SWITCH

WHAT HAPPENED (plain words)
- Grok's lines are live on the test desk (AIC-TEST-2 v2, test line ...5008):
  "reservation system" greetings, the charter hours questions, and a read-back
  that names the vehicle ("written for a Motorcoach").
- Sims: 12 of 12. They caught a real bug first (trips marked "one way" when
  nobody said it); fixed before the gate.
- The three calls were made for you as real web calls with a computer voice
  reading the call card. Every field came out right. The ticket replay of
  calls 1 and 2 matched every expected field, callback 414-775-0019 included.
- The ticket-rail switch was refused by this tool's safety check, so the live
  rail and the live desk (414-775-0019) did NOT change. The owner-tag write was
  refused the same way.
- The call-3 test booking is deleted. The public board no longer shows the
  owner email, a prospect's gmail, or the test line.

DONE
| What                              | Live?          | Proof                          |
| AIC-TEST-2 v2 (Grok lines)        | yes (test)     | 0 unapproved lines, 12/12 sims |
| 3 calls (synthesized, web)        | done           | every field PASS               |
| Rail replay calls 1 + 2           | gate PASS      | execs 11057 / 11058            |
| Rail switch                       | NO (blocked)   | live rail still 79a5e162       |
| Desk v3 promote                   | NO (waits)     | desk still v1                  |
| Snapshot + rollback section 10    | yes (archive)  | a87f292                        |
| Test appointment deleted          | yes            | Monday calendar: 0 events      |
| Board masking                     | yes            | this commit                    |
| Owner do-not-drip tag             | NO (blocked)   | tags unchanged                 |

IDS + ROLLBACK
- AIC-TEST-2 back to v1: fork v1 and publish (5008 follows)
- Rail (after a switch): publish 79a5e162
- Desk (after a promote): "restore v1" = fork v1 + publish

NEXT
1. Allow the rail switch in the tool, or run it: four staged nodes from
   WcMOi7GdVoIGUlwU onto TkETvvnABhUPd7ME, hash-check, publish.
2. Then desk v3 by API, route checks, 5008 back to the desk, AIC-TEST-2 out
   of ALLOWED and archived, one /try check call, board to LIVE v3.
3. Owner tag: allow it or add do-not-drip in GHL.

GOTCHAS
- New rail rule (staged, not live): every desk trip sheet shows 414-775-0019
  as the call-back line, phone or web. /try sheets will show it after the switch.
- Hours said in the first breath route the trip to Hourly; the read-back then
  skips the drop-off (the ticket keeps it).
- Five live workflows can still write onto the owner's GHL row from your own
  cell (no own-number check). Separate run.
- Call 3's booking was real until deleted; any notice it sent can't be unsent.
- In silence the desk hangs up after 20 seconds without a goodbye.
```
