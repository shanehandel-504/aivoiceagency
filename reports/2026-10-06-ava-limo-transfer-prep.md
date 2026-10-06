# AVA limo transfer — prep run

2026-10-06 · paste CC-AVA-LIMO-TRANSFER-PREP-v1 · the AVA TEST agent, one n8n workflow, one check call.
Read only and unmoved: the live AVA line (414-240-8930, v49), the AI Chauffeur line (414-775-0019, v13), the old capture desk, the briefing agent.
Nothing sensitive is in this file: no key, no header value, no webhook path, no private number, no caller name. Probe and pool lines are last four digits only.

```
===== SHANE READBACK — COPY ALL =====

WHAT I DID (plain English)
- The AVA TEST agent now hands a limo caller, on the same call, to the finished AI Chauffeur two-door agent. Before this
  run the handoff still pointed at the old capture desk.
- No spoken word changed. The test agent's prompt is byte-identical: same SHA-256 before, between and after.
- The handoff is pinned to version 13 of the two-door agent, the version 0019 serves. Retell takes a version number there.
- The booking workflow behind the two-door agent now accepts a call that started on AVA. Before this run it refused such a
  call's setup-call booking and its team alert, because a handed-off call keeps AVA's agent id on every tool call.
- The two rails that run after the call already did the right thing, so I changed nothing in them. The AI Chauffeur rail
  files a handed-off call as AI Chauffeur, marked "via AVA line", with 414-775-0019 as the number to call back. The AVA
  rail sends the caller nothing on a handed-off call.
- One check call, 38.6 seconds, a web call, no simulation: the handoff fired and the AI Chauffeur phone greeting started
  1.1 seconds after "Hear it now."
- That check call sent you one real owner text and one owner email at 5:43 PM Central ("New trip request · via AVA line · CHECK").
  I took its trip-sheet page down afterwards, so the link in that alert no longer opens.
- git: fetched first, local was level with origin (0 ahead, 0 behind), so there was nothing to pull.

DONE TABLE
| Step | What | Status | Evidence |
|---|---|---|---|
| 1 | As-built read, snapshot written | DONE | ops/tuning/ava-test-pre-limo-transfer-snapshot-2026-10-06.md · read 22:15:29Z, before any write · test agent v8, prompt SHA-256 2b212b0ba67206ba471cdac2cf776366a956caba82eeca41a591931fc3a3b27a = the expected value · 8930 serves live AVA v49 · 0019 serves two-door v13, pinned · 8 numbers · 74 workflows, 28 active |
| 2 | Handoff re-pointed | LIVE on the test agent | v8 → v9, published 5:31 PM CT (22:31:44Z) · handoff_to_desk keeps its name and stays an agent swap · target agent_e41b2e957f1de46cf23dc25a84 @ latest_published → agent_9ebb41c9bd8af214649328f107 @ 13 · 12 of 12 read-back checks on the published version: the tool differs in those two fields only, the other three tools equal, all 48 agent settings equal, prompt SHA-256 unchanged |
| 3 | Start variables | LIVE on the test agent | v9 → v10, published 5:32 PM CT (22:32:14Z) · five default variables added, the 0019 flow's own start values · 7 of 7 checks: nothing else differs, prompt SHA-256 unchanged · table below |
| 4a | Booking and team alert accept a handed-off call | LIVE | WF-AIC-SALES-CAL TLoF7bzuPYy1NAW1 serves 47af9608-42d1-4bba-95fa-9937240878f7 since 5:40 PM CT (22:40:16Z) · the allow-lists in nodes Book Input and Alert Input hold 5 agent ids, were 3 · draft, serving version and the tested staging copy equal byte for byte (SHA-256 93aa90825caea151… and 5f7ab2fe6d8641da…) · the other 48 nodes and the wiring equal the old version · Error Sentry attached · live check with no slot, which cannot book: AVA TEST and live AVA answered agent_not_allowed before the publish and missing_slot after; an id on no list is still refused |
| 4b | AI Chauffeur post-call rail | NO CHANGE NEEDED | TkETvvnABhUPd7ME serves c7bd86fd · node Build Trip Ticket, lines 266 to 273 and 742 to 743 · proven on the check call: execution 12427 filed it as AI Chauffeur, CAPTURE-ONLY, "via AVA line", desk number (414) 775-0019 |
| 4c | AVA post-call rail stands down | NO CHANGE NEEDED | 6r8YHuMEJbxeDyT5 serves e0454827 · node Quarantine Gate sets handoff_swapped · node Build Text Back, line 16, stops the caller text · read in the serving code, not run in this run: the test agent's events go to the ZZ sink |
| 4d | Proof before the publish | DONE | staging copy 9qw8pU2bT3drkS6O, inactive again, Error Sentry attached, every write pointed at the ZZ sink with no credential · 8 replays, executions 12403 to 12415 · detail below |
| 4e | Did the session refuse a publish? | NO | the one publish went through |
| 5 | Probe line …8976 | ALREADY SET, NOTHING SENT | inbound = AVA TEST @ latest_published, now v10 · record last changed 2026-10-01T23:00:11Z, identical before and after · outbound = ZZ-PROBE-36, untouched |
| 6 | One check call | DONE | call_9da881b8fc8b4bccad6884d5554 · AVA TEST v10 · web call · 38.6 s · detail below |
| 7 | Nothing moved on the read-only agents | DONE | 22 of 22 end-state checks, start read 22:15:29Z against end read 22:46:50Z · version lists of live AVA, two-door, old desk and briefing identical (51, 14, 6 and 2 versions, last-change times included) · all 8 number records identical, 8930 and 0019 included · 73 of 74 workflows serve what they served at the start; the 74th is the booking workflow |

WHERE THE LIVE SYSTEM DIFFERED FROM THE PASTE (the live system won)
- Step 5 asked for a bind. The line ending 8976 was already inbound to the AVA TEST agent at latest_published, since Oct 1.
  It served only a test agent, so the stop rule did not apply. I sent nothing.
- The AVA post-call rail serves e0454827, not the e08eb55f the Sep 26 report recorded. The stand-down code is in it.
- Step 4b and 4c needed no change: both rails already carried the handed-off-call rules in their serving versions.

STEP 2 · WHAT THE RETELL DOCS SAY
- Version pin: the API reference for LLM tools (docs.retellai.com/api-references/create-retell-llm, the agent_swap tool)
  gives agent_version as a whole number, or the words latest or latest_published. Retell took 13 as a number. So a
  later publish on the two-door agent does not reach AVA callers until this pin is moved.
- A fixed line before the swap: the same page lists speak_during_execution, execution_message_description and
  execution_message_type (prompt or static_text; static_text "will speak the execution_message_description directly").
  The guide (docs.retellai.com/build/single-multi-prompt/transfer-agent) calls it Talk While Waiting and says the line is
  spoken "if the transfer takes more than ~2 seconds". This handoff took 1.1 seconds. So a fixed line can be set, but by
  the docs it would not be heard on a fast handoff. Not set, as the paste said.

STEP 3 · START VARIABLES
What the two-door flow reads from outside itself. Its start node resets 45 of its own variables on every call, and the
rest are written inside the flow before they are read.
| Variable | Read by | On a direct 0019 call | On a handed-off call | If missing or different |
|---|---|---|---|---|
| channel | start node ch_split (picks the greeting), n02_route, n05_route, questions part d2, connect step tr_closed | flow default: phone | test agent default: phone (v10) | anything but "browser", a missing value included, is treated as phone |
| user_number (Retell's own) | ch_split, n05_route | the caller's number | the caller's number, same call (seen on the Sep 26 phone swap); a web call has none | no number: the flow takes its no-caller-number path |
| call_type (Retell's own) | connect step tr_closed | phone_call | phone_call, same call | a web call cannot be connected to the team |
| call_id (Retell's own) | booking and team-alert tools | this call's id | the same call id | none |
| previous_node (Retell's own) | 12 router nodes | the flow's own | the flow's own | none |
| charter_lines_live | trip questions n03_next and n04_gate | flow default: true | test agent default: true (v10) | missing: the charter question and the hours question are skipped |
| zz_sim_phone | connect step tr_closed | flow default: false | test agent default: false (v10) | missing reads as false |
| is_demo, door_now | reset by ch_split before any read | default, then reset | reset | none |
- Same name, different meaning on the two agents: none. AVA's side uses opening_line plus the ten caller-lookup names on
  8930; none of them is among the flow's 159 names. The two agents share no after-call analysis field by name either.
- Why I added the five: Retell's docs say the variables a call started with stay available after a swap. They do not say
  whether the second agent's own default values apply. The greeting is safe either way. The one value whose absence
  changes the flow is charter_lines_live. The test agent now carries the same five start values as the 0019 flow.
- Proven on the check call: the start node wrote channel = phone and took the phone greeting.
- Not proven: that a handed-off call reads charter_lines_live = true. Only a charter or hourly request on a handed-off
  call would show it, and this run was allowed one greeting-only call.

STEP 4d · THE PROOF, PLAINLY
- Direct call unchanged: the real 0019 phone call of Oct 5 (execution 12323, a booking) was replayed through the
  staging copy. The changed node gave exactly the output the serving version recorded for that call, and the copy
  answered from the stored booking. Nothing new was created. The Oct 2 team alert (execution 12152) was replayed the same
  way: the changed node's output equal to the recorded one, and its alert text went to the ZZ sink, not to your phone.
- Handed-off calls now pass: the same shapes with AVA's agent id and an AVA line (AVA TEST on …8976, live AVA on 8930)
  got through the allow-list. Their booking requests landed in the ZZ sink (executions 12405, 12407) and their alert
  texts landed in the ZZ sink (12412, 12414), not on a calendar or on your phone.
- Still refused: an agent id that is on no list (booking: agent_not_allowed; alert: stopped).
- Old code against new code on the same 8 payloads: direct calls identical; handed-off calls differ in "allowed" only.

STEP 6 · THE CHECK CALL
- Handoff fired: yes. handoff_to_desk ran 28.99 s into the call with agent_9ebb41c9bd8af214649328f107 at version 13, both
  agents' webhooks and both agents' after-call analysis. Retell reported it successful.
- Seconds from the end of "Hear it now." to the first word of the AI Chauffeur agent: 1.11 (word timings in the call
  record, 28.33 s to 29.44 s). Nothing was spoken in between.
- Which greeting: PHONE. Path in the call record: begin → ch_split → n01_p "N01-P Greeting (phone)".
- Its first 20 words, verbatim: "AI Chauffeur, the premium reservation system for limousine, black car and chauffeured
  transportation. This is the demo line. Play the"
- Workflows that received events for this call id: two, five executions.
  ZZ sink hF7cxEn0SuVaEnnL (the test agent's own webhook, log only): call_started 12424, call_ended 12425, call_analyzed 12428.
  AI Chauffeur post-call rail TkETvvnABhUPd7ME: call_ended 12426 (ignored by design), call_analyzed 12427 (processed).
  Not reached: the AVA post-call rail, the booking workflow, the caller-lookup rails.
- What the call created: one owner text and one owner email to you; one trip-sheet page; one row in the trip log sheet;
  one flags row in the rail's own table. No contact, no tag, no note, no caller text (a web call has no caller number).
- Removed: the trip-sheet page (HTTP 200 before, 404 after).
- Left: the trip log sheet row (a private Google Sheet; removing it needs a helper workflow, which this paste did not
  cover); the flags row (it stops a second alert if Retell sends the event again); the alert already on your phone;
  three ZZ sink log lines.

IDS / ROLLBACK
- AVA TEST agent agent_44b48507d38c0bfc29a3150a74: v8 before, v10 after. v9 = the handoff re-point. v10 = v9 plus the
  five start variables. v6 is still the unpublished sim-only draft. Rollback: make a new version from v8 and publish it
  (from v9 to keep the handoff and drop the five variables). Published versions cannot be edited or unpublished.
- Probe line …8976: binding before = binding after = inbound to the AVA TEST agent at latest_published. Nothing to undo.
  It now answers with v10.
- WF-AIC-SALES-CAL TLoF7bzuPYy1NAW1: serving 47af9608-42d1-4bba-95fa-9937240878f7. Rollback: publish
  14bce088-2e05-4b7e-a2e9-dc3ab8507312 (n8n, open the workflow, version history, that version, Publish). The session's
  permission check has refused publishing an older version before, so that click is yours.
- Not touched: AI Chauffeur post-call rail c7bd86fd · AVA post-call rail e0454827 · ZZ sink d45e3d46 · Error Sentry active.
- Staging copy 9qw8pU2bT3drkS6O: inactive, safe to delete.
- Check call: call_9da881b8fc8b4bccad6884d5554.

SHANE'S ONE TEST CALL
Call the line ending 8976 from your cell. When AVA asks what kind of business, say: limo company. When it offers, say:
hear it now. You should hear the AI Chauffeur greeting inside two seconds. Say: point to point. Then hang up.
- Will it send you a real owner text and email? Yes. One owner text and one owner email from the AI Chauffeur rail,
  marked "via AVA line". Nothing from the AVA rail: the test agent's events go to the ZZ sink.
- No trip-sheet text to your cell: you hang up before the name and text question, and your cell is on our own-numbers
  list, so the rail would send that copy to the ZZ test contact, not to you.
- It also stores one trip-sheet page and one row in the trip log, as the check call did.

WHAT'S NEXT
1. Your one test call above.
2. The words paste for the test agent, after the merge verdict. It decides the bridge line.
3. Two rulings for you: gotcha 1 (a fix inside the 0019 flow) and gotcha 3 (the call-clock switch on the handoff tool).
4. The promote paste for 414-240-8930. The booking workflow already allows the live AVA agent.

GOTCHAS (what a handed-off call does differently from a direct 0019 call)
1. The recording notice will likely be said twice. After the caller's first answer the flow checks whether "the very
   first agent message" of the call held the notice. On a handed-off call that first message is AVA's opener, so the flow
   takes the greeting as cut off and says the five-word notice again (nodes n02_extract, notice_calc, notice_say). Read
   in the flow, not heard: the check call ended before that point. Your test call will show it right after "point to
   point". The fix is inside the 0019 flow, which this run could not touch.
2. No bridge line. AVA went straight from "Hear it now." to the handoff. The caller hears 1.1 seconds of nothing, then
   the greeting. Retell's fixed-line switch would not cover it (see Step 2).
3. The call clock is AVA's. By Retell's docs a handed-off call ends 10 minutes after it started on AVA. A direct 0019
   call gets 12. The swap tool has a switch that restarts the clock at the handoff (use_swap_agent_max_duration). Not
   set: not in the paste.
4. The call keeps AVA's agent id and the line that was dialled, everywhere. That is why the allow-lists needed AVA's ids.
   The rail's mark always reads "via AVA line (8930)", even when the line dialled was 8976 or a pool line.
5. The ticket is built from the whole call, AVA's part included. The check call asked for no trip, yet its email subject
   read "AI CHAUFFEUR · REVIEW REQUIRED · via AVA line · Hourly · 0 passengers", not a missed capture. The name or
   business a caller gives AVA can also fill the ticket when the AI Chauffeur part captured none.
6. The five start variables are a mirror. If the 0019 flow's defaults ever change, the test agent's copy (and later the
   live AVA agent's) must change with them, or handed-off calls may start differently from direct ones.
7. Two pins now point at version 13: the 0019 number and this handoff. Move them together.
8. After the promote, each handed-off call will send you two alerts: "HANDOFF TO DESK" from the AVA rail and the trip
   ticket from the AI Chauffeur rail. The caller still gets one text, from the AI Chauffeur rail. On the test agent only
   the second alert fires.
9. Live connect, read from the settings and not tested: the team's phone would show the AVA line that was dialled, not
   0019. A web call cannot be connected at all.
10. The AVA rail tags a handed-off caller in GHL (ava-demo-hot, ava-handoff-aic). GHL's own workflow triggers cannot be
    read from here, so "one caller text" is proven for n8n only.
11. The check call was a web call. A phone call adds the caller's number and the phone call type; the flow reads nothing
    else from the line. The Sep 26 phone swap showed the number arriving. Your test call is the first phone handoff
    onto the two-door agent.
12. What the caller said to AVA counts. The flow reads the trip choice "from everything the caller has said so far", so
    words spoken to AVA before the handoff can steer its first step, for example toward the team instead of a trip.
    Read in the flow, not seen on a call.
```
