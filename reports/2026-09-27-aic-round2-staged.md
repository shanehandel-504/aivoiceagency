RUN INCOMPLETE — GROK LINES PENDING / 3 REAL CALLS / PUBLISH

# AIC Capture Desk — Round 2, staged (Part 5 of the overnight run)

**Date:** 2026-09-27 (Central) · **Scope:** AI Chauffeur capture desk, round 2, built and tested on the TEST agent
AIC-TEST-2 behind the test line …5008. **The live desk did not change:** 414-775-0019 still answers on
`agent_e41b2e957f1de46cf23dc25a84` at latest_published (versions unchanged: v0 + v1 published, the RUN D v2 draft
untouched). No agent-spoken line was written or edited by Claude; the two lines Grok owes sit behind marker nodes
that no call can reach.

## What happened, in plain words

- AIC-TEST-2 is the round-2 desk. It now captures charters (is it a charter, is it one way, how many hours), picks
  the vehicle by head count with no pricing, and fixes the vehicle when a caller changes the head count mid-call
  (a bug the sims found tonight and v1 fixes). 5008 answers on it.
- The /try demo page is live with the new receipt: no Quote row, a Duration row when hours or one way were given,
  and green meter bars while the call is live. The receipt workflow behind it was switched and verified.
- The ticket rail (the workflow that texts the trip sheet and alerts the owner) is patched and fully tested, but
  **it was not switched**. Its gate asked for "Vehicle: Motorcoach" on the two real Nobu calls; those calls were
  made on the old desk flow, which recorded "Sprinter Van" for 56 people, and the patched rail prints what the
  flow recorded. The fix for that lives in the new flow (proven: it picks Motorcoach). One real call on 5008 in
  the morning gives a payload that can pass the gate.
- The three Sep 26 test tickets are gone from the trip sheets, the trip log and the house contact.

## DONE

| Part | What | State | Proof |
|---|---|---|---|
| 5a | AIC-TEST-2 from the desk v2 draft flow | LIVE on 5008 (test line) | `agent_9ebb41c9bd8af214649328f107`, flow `conversation_flow_9cf4ddd5b734`; now **v1 published**; 5008 in + out → AIC-TEST-2 at latest_published |
| 5a | AIC-TEST-2 in WF-AIC-SALES-CAL ALLOWED | LIVE | `TLoF7bzuPYy1NAW1` active `28ba9379…` (rollback `18bd10cd…`; staging `ya9jIVIDU5u6ya8J`) |
| 5a | AIC-TEST-2 in the desk rail tenant map | STAGED (rides with the rail switch) | in staging copy `WcMOi7GdVoIGUlwU` |
| 5b | Flow: is_charter / one_way extraction, N03C-2-CHARTER + N04-HOURS marker nodes gated off, capture-only N05, blank composer slots | LIVE on AIC-TEST-2 | 32/32 code tests; approved-lines file + "unapproved — pending Grok" list |
| 5b+ | **v1:** capacity re-runs after a mid-call correction (`n06_capacity`, byte-identical copy of N05, on the correction loop) | LIVE on AIC-TEST-2 | found by sim X1 (4 passengers stayed "Executive Sedan"); v0→v1 diff = 2 nodes, 0 spoken lines, 0 dangling edges |
| 5c | Capture-desk analysis set (24 fields; the 7 rate-era fields removed) | LIVE on AIC-TEST-2 | agent read-back |
| 5d | Desk rail patches (flow variables first, hero, bags only when stated, trip label, AVA-line swaps → capture desk + 0019 + via-AVA tag, note and owner marker) | **STAGED, NOT SWITCHED** — gate diff below | staging `WcMOi7GdVoIGUlwU` (inactive, Error Sentry attached); live rail `TkETvvnABhUPd7ME` untouched at `79a5e162…` |
| 5d | One caller text per call | PROVEN on staging | desk rail replay of the real swap: caller text ×1 (exec 11001); AVA rail replay of the same payload: 0 texts, "handoff to the AI Chauffeur desk; the desk texts the trip sheet" (exec 11005) |
| 5d | Cleanup of the three Sep 26 test tickets | DONE | see Cleanup record |
| 5d | WF-TRY-WEBCALL receipt: pickup as captured, no quote key, duration | LIVE | `9nKn8i2dRuALikuv` active `dd2fb9c5-3280-4a66-8e31-ad6699b46108` (rollback `7f2d8225-b852-44b0-8036-88950ccf3b90`); draft hash = tested bytes; prod exec 11018 ran the new node clean |
| 5e | /try page: Quote row gone, Duration row, live meter #2EE6A8 | LIVE | commit `c590e1c`, aichauffeur deploy `dpl_6TmrGTVijT4cgNQmmgWMeWJMUGDg` READY; prod render gate 390×844 + 1440×900: 0 console errors, 0 overflow |
| 5e | Live transcript transport | MEASURED — emits nothing mid-call | SDK 3.0.1 (the latest on npm); v3 create-web-call hands out the `gateway` transport; a 35 s call delivered 0 `update` events while the server logged 3 turns (`call_a6653488f59480f2a45578c06e4`). The thread fills from the receipt after the call. No placeholder. |
| 5f | Sim gate on AIC-TEST-2 v1 | **11/11 PASS** | batch `test_batch_1404598b8df6`; our scorer, not Retell's judge |
| 5f | 20 s silence | PASS (no invented line) | real web call `call_ef028e36e803a06a6842f6665b3`: greeting only, hung up by inactivity at 36 s |
| 5g | Report, board, Tuning Tower wrap, Inbox receipt | DONE | this file · hq/board.json item `aic-round2-staged` |

## The rail gate — the one open diff

Pinned replays on the staging copy with the real payloads. Structural checks passed on all four
(runtime trigger = file, Build Trip Ticket runtime = local test on all 40 keys, Flags Ctx = local test, every
side-effect node returned its pin, no node errors).

| Expected field | Want | Nobu /try `AIC-222B798B` (exec 11002) | Swap `AIC-0F35FAB3` (exec 11001) |
|---|---|---|---|
| Pickup row | Baccarat Hotel, 28 West 53rd Street, New York, New York | match | match |
| Hero | Baccarat Hotel → Nobu Downtown | match | match |
| Vehicle | Motorcoach | **Sprinter Van** | **Sprinter Van** |
| Bags | no bags line (owner ticket "BAGS: not stated") | match | match |
| Trip | Point to point · charter | match | match |
| Callback | 414-775-0019 | — (web call) | match (`tel:+14147750019`) |

**Why:** both calls ran on the live desk's v27 flow. Its old N05 wrote "Sprinter Van" for 56 people into the flow
variables and the analysis alike. The patched rail reads the flow's label first, as specified, and never invents
one. **Proof the next payload clears it (derived, not a real call):** the same Nobu inputs through AIC-TEST-2's
N05 give "Motorcoach", and the patched rail prints "Motorcoach" and "Point to point · charter". The sims confirm
it end to end (F1/F3: Motorcoach, "Point to point · charter · one way").

Arrivals replayed too: the desk arrival keeps "BAGS: 2" and its hero; the AVA-swapped arrival files as the capture
desk with "via AVA line" on the subject, owner text, note and tag, and the 0019 callback.

## Sim gate (5f) — AIC-TEST-2 v1, every tool mocked

Scoring: every agent line must break down into approved lines (templates allowed); every readback must equal the
flow's own final summary (a readback a correction replaced is listed, not scored); no marker text spoken; required
flow variables present; required lines and tool calls present; the final variables run through the patched ticket
code.

| Case | Result | What it proved |
|---|---|---|
| F1 Nobu one-breath, one way | PASS | p2p · charter · one way · 56 → Motorcoach · ticket "Point to point · charter · one way", Duration "One way" |
| F2 Nobu one-breath, hours in the dump | PASS | routes to Hourly · charter · 5 hours · Motorcoach |
| F3 Nobu, "one way" said when asked | PASS | one_way caught mid-call · Motorcoach |
| A1 airport arrival | PASS | arrival · 2 pax · 3 bags · Executive Sedan |
| P1 point to point | PASS | 3 pax → Executive Sedan · not a charter |
| H1 hourly | PASS | 4 hours · 6 pax → Executive SUV |
| X1 mid-call correction | PASS on v1 (FAIL on v0) | 2 → 4 passengers → Executive SUV; readback updated |
| T1 "talk to the team" | PASS | team path, team_alert ×1 (mocked) |
| Q1 "are you AI" | PASS | the approved AI line, then back to the trip |
| R1 product price ask | PASS | the approved price line, then the offer |
| R2 fare ask | PASS | the approved fare line, no number quoted |
| 20 s silence (web call) | PASS | only the greeting; no improvised check-in; hang-up by inactivity |
| Swapped payload through the rail | on STAGING (the rail is not switched) | exec 11001: via-AVA filing, one caller text |

The two marker nodes were never reached in any run.

## Cleanup record (5d)

| Where | Deleted | Kept / not possible |
|---|---|---|
| trip_sheets `x9ANXgd6qTcriXQn` | rows 3 `AIC-1CD313E9`, 4 `AIC-C587F210-1062` (the ghost REVIEW REQUIRED), 5 `AIC-0F35FAB3-1062`; full content backed up locally first | rows 1 and 2 (not in the order). The three public trip-sheet links now 404; `AIC-222B798B` still serves |
| Trip log sheet, tab "AI Chauffeur" | rows 11, 12, 13 (the same three intakes); guarded bottom-up delete; tab went 12 → 9 rows | rows 2–10 untouched |
| House-line contact (`lFwe…`, a zz-test contact) | notes `1TW86TK7H8diZUAXToF9` (ghost) and `1LsLmj7nV3YtygIZMtJ8` | tag `demo-caller` kept: an earlier call (a4512d7f, exec 10743) set it hours before the three tests, so they added no tag of their own. The other 3 notes kept |
| Ghost owner alert | the alert email moved to Trash in the sending mailbox (reversible for 30 days) | the owner's inbox copy lives in another mailbox; the owner SMS cannot be unsent |

Three one-off utility workflows did the sheet and mailbox work and were archived after use.

## New objects

- n8n Variable `AVA_LINES` = the AVA line + the five DEMO-POOL lines, built from Retell's own number list and
  cross-checked against `OUR_NUMBERS`. The patched rail reads it, so no pool digits sit in a node body (§ 9).
- `chauffeur/DESIGN-SYSTEM.md` § 12 now records tonight's rulings: the live meter's green (the one STATE LAW
  exception), the receipt shape, and the measured transport.

## Findings for Grok, Conductor and Shane

1. **Silence closes without a word.** The reminder is off on AIC-TEST-2 (it made the model invent lines), so the
   approved silence lines never play; Retell hangs up 20 s after the last line. A spoken close needs a
   Conductor setting that fires the approved line without the reminder.
2. **An airport pickup counts as one way.** "Need a pickup" matches the one_way rule ("just the transfer"), so an
   arrival ticket reads "Arrival · one way" with Duration "One way". Extraction wording if unwanted.
3. **A fare question as the first line** gets the fare line, then the desk asks the trip type again; the trip
   details inside the question are not kept.
4. **The real swap texted nobody.** The house contact has SMS DND on, and the rail honored it. With DND off, the
   replay sends exactly one text.
5. **Owner-alert contact tags** read owner-alert / zz-internal / test; § 9 names zz-internal / owner-alerts /
   do-not-drip. `do-not-drip` is missing. Not changed: adding a tag can fire GHL triggers the API cannot show.
6. **/try from one of our own numbers** routes the text to the zz-test contact, which has no phone, so GHL answers
   422 "Missing phone number". Existing behaviour.

## Morning order

1. Shane: the three Part 4b calls to the probe line, then reply "done" (v50b).
2. Grok's desk words → Claude reviews → into the marker slots and frames → `charter_lines_live` on → the 12 sims
   rerun with the charter nodes live.
3. Three real calls to 5008 (AIC-TEST-2 v1).
4. Replay a real AIC-TEST-2 Nobu call from the ZZ sink through staging `WcMOi7GdVoIGUlwU`; switch the desk rail only
   when every field matches (rollback `79a5e162…`).
5. Snapshot → Shane publishes desk v3 once, **from AIC-TEST-2 flow v1** → confirm 0019 / 5008 / /try serve
   latest_published → 5008 back to forwarding → remove AIC-TEST-2 from ALLOWED → verification call → wrap.

## Rollback, one line each

- WF-TRY-WEBCALL: publish version `7f2d8225-b852-44b0-8036-88950ccf3b90`.
- /try page: `git revert c590e1c` and push.
- WF-AIC-SALES-CAL: publish version `18bd10cd-69cd-49ed-940a-6eb4f3dfd9b8`.
- AIC-TEST-2: publish v0 (5008 follows latest_published); or rebind 5008 to the desk agent.
- Desk rail: nothing to roll back (live `79a5e162…` never changed).
- AVA_LINES: delete the n8n Variable (the rail staging copy falls back to the agent check).

```
===== SHANE READBACK — COPY ALL =====
RUN INCOMPLETE — GROK LINES PENDING / 3 REAL CALLS / PUBLISH

WHAT HAPPENED (plain words)
- AIC-TEST-2 (the round-2 desk on the test line ...5008) now captures charters, one-way
  trips and hours, picks the vehicle by head count with no pricing, and fixes the
  vehicle if a caller changes the head count. Sims: 11 of 11 pass.
- The /try demo page is live: no Quote row, a Duration row, green bars while live.
  The receipt behind it was switched and checked on production.
- The ticket rail is patched and tested but NOT switched. Its gate wanted
  "Motorcoach" on the two old Nobu calls; those calls were recorded by the old
  desk as "Sprinter Van". The new desk picks Motorcoach. One real call on 5008
  in the morning gives a call that can pass the gate.
- The three Sep 26 test tickets are deleted (trip sheets, trip log, house contact).
- The live desk (414-775-0019) did not change.

DONE
| What                          | Live?        | Proof                                  |
| AIC-TEST-2 v1 on 5008         | yes (test)   | 11/11 sims, silence call clean         |
| /try page                     | yes          | c590e1c, deploy READY, 0 errors        |
| /try receipt workflow         | yes          | active dd2fb9c5, hash = tested         |
| Calendar ALLOWED + AIC-TEST-2 | yes          | active 28ba9379                        |
| Ticket rail patches           | NO (staged)  | WcMOi7GdVoIGUlwU, 1 field short        |
| Test-ticket cleanup           | yes          | 3 rows, 3 sheet rows, 2 notes          |

IDS + ROLLBACK
- /try receipt: publish 7f2d8225-b852-44b0-8036-88950ccf3b90
- /try page: git revert c590e1c
- Calendar: publish 18bd10cd-69cd-49ed-940a-6eb4f3dfd9b8
- AIC-TEST-2: publish v0, or point 5008 back at the desk
- Ticket rail: nothing to undo (never switched)

NEXT
1. Your three probe-line calls, then reply "done".
2. Grok's two desk lines -> Claude review -> charter lines on -> 12 sims.
3. Three real calls to 5008.
4. Replay one of them through the staged rail; switch only if every field matches.
5. Publish desk v3 from AIC-TEST-2 flow v1 -> confirm 0019 / 5008 / /try ->
   5008 back to forwarding -> remove AIC-TEST-2 from ALLOWED -> one check call.

GOTCHAS
- The public board (aivoiceagency.ai/hq/board.json) still shows the owner-alert
  email and several internal phone numbers in older entries. This run added
  none. Masking them is a one-commit fix; say GO and it ships.
- AIC-TEST-2 sends its call data to the ZZ sink, not the ticket rail, so the
  5008 calls make no tickets until the rail is switched and pointed at.
- Build desk v3 from flow v1, not v0 (v1 holds the head-count fix).
- In silence the desk hangs up after 20 seconds without a goodbye line.
- An airport pickup is recorded as one way; the ticket says so.
- The house test contact has texts blocked (DND), so test texts to it never arrive.
- The owner-alert contact is missing the do-not-drip tag; left alone on purpose.
```
