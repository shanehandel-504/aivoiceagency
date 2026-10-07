RUN INCOMPLETE — V50D IS ON THE AVA TEST AGENT (V11, BYTE-EXACT) AND THE HANDOFF SETTINGS ARE SET, BUT THE SIMULATION GATE DID NOT PASS: S2, THE NO PATH, FAILED (FIVE TRANSFER OFFERS, NO DEMO NUMBER, NO SETUP CALL) — NEXT: GROK PATCHES THE NO PATH → NEW WORDS PASTE → SHANE'S THREE TEST CALLS

# AVA limo transfer — words run

2026-10-06 · paste CC-AVA-LIMO-TRANSFER-WORDS-v1 · the AVA TEST agent only · five simulations, no call.
Read only and unmoved: the live AVA line (414-240-8930, v49), the AI Chauffeur line (414-775-0019, v13), the old capture desk, the briefing agent, every n8n workflow.
Nothing sensitive is in this file: no key, no header value, no webhook path, no private number, no caller name. Probe and pool lines are last four digits only.

```
===== SHANE READBACK — COPY ALL =====

WHAT I DID (plain English)
- Put Grok's v50d prompt on the AVA TEST agent, byte for byte. Nobody typed it: a script cut it out of your paste. It
  is 7,072 characters. Its hash matched the paste's own hash before I sent it, on the draft, and on the published
  version.
- Set the call-clock switch on the handoff tool. A handed-off caller now gets the AI Chauffeur agent's own call
  length, 12 minutes, counted from the handoff. Before, AVA's 10-minute clock kept running.
- Changed the handoff tool's description, which is never spoken. It still named the old "hear it now" choice. It now
  says only when to call the tool.
- Published all of it as test agent version 11. The probe line ending 8976 answers with it now. Nothing else on the
  agent changed.
- Ran the five simulations, one run each. Four passed. S2, the no path, failed. So the gate is not passed and this run
  is incomplete. I ran nothing twice and changed nothing after the runs.
- During the simulations nothing left Retell: no call record, no n8n run, no text, no email.
- git: fetched first. Local was level with origin (0 ahead, 0 behind), so there was nothing to pull.

DONE TABLE
| Step | What | Status | Evidence |
|---|---|---|---|
| 1 | Before read | DONE | read 00:46:08Z (7:46 PM CT), before any write · test agent serves v10 (expected v10) · prompt SHA-256 2b212b0ba67206ba471cdac2cf776366a956caba82eeca41a591931fc3a3b27a = the expected value · handoff_to_desk as read: agent swap to agent_9ebb41c9bd8af214649328f107 at version 13, webhook both_agents, analysis both_agents, speak_during_execution false, call-clock switch not set · 48 agent fields, 15 LLM fields and all 4 tools kept for the diff |
| 2 | v50d prompt placed | LIVE on the test agent | 7,072 characters, 7,076 bytes, LF, no trailing newline; the paste arrived with LF · SHA-256 939ed32283bee38a9d957e1b72ebc753563680071a6472dbc19655f583f9026d on four reads: the text cut from the paste, the draft read back from Retell (00:50:36Z), published v11 read back (00:50:44Z), and v11 again at the end read (01:00:17Z) · file ops/tuning/ava-8930-v50d-final.md in the v50b layout; the block in the committed file hashes the same · begin message {{opening_line}} and the default opening line unchanged; the default equals the COLD opener in the new prompt byte for byte |
| 3a | Call clock restarts at the handoff | LIVE on the test agent | handoff_to_desk.use_swap_agent_max_duration = true (was not set) · name checked on Retell's API reference, quoted below |
| 3b | Tool description | LIVE on the test agent | it named the old accept phrase and the old choice, so it changed · before and after below · never spoken |
| 3c | speak_during_execution | UNCHANGED | false, and no execution message is set · the bridge line is in the prompt only |
| 3d | Published, then diffed against step 1 | DONE | v10 → v11, published 00:50:44Z (7:50 PM CT) · leaf-by-leaf diff of the step 1 objects against published v11: no agent field differs beyond version bookkeeping (48 fields); 3 LLM paths differ: general_prompt, handoff_to_desk.description, handoff_to_desk.use_swap_agent_max_duration · 17 of 17 checks on the draft and again on the published version · unchanged: target agent, version pin 13 (a number), webhook and analysis settings, the five start variables, the other three tools, voice and every speech setting · version bookkeeping = version number, base version, last-change time, the version's label, engine version |
| 4 · S1 | The Oct 6 caller | PASS | test_job_4ff46d08cd9a · first reply: "Limousine and black-car companies have their own agent, AI Chauffeur, where you can try a reservation like a customer and get your questions answered. Want me to transfer you now?" · after "Yes." the handoff tool ran (agent swap, two-door agent, version 13, successful) · REPORT ONLY: the bridge line was not spoken; AVA said nothing between "Yes." and the tool |
| 4 · S2 | The no path | FAIL | test_job_30e6f1d60f01 · five transfer offers, the cap is three · reply to the last "No.": "What else do you want to know? AI Chauffeur is the agent built for limo and black-car companies. Want me to transfer you now?" · no demo number; get_open_slots never called · held: the price line whole, no trip taken, four ninety-seven never said |
| 4 · S3 | The plumber with a fleet | PASS | test_job_3b5a5d032eda · no limo, chauffeur, car service or AI Chauffeur word in 6 AVA turns · "AVA answers the line twenty-four seven, qualifies the caller, and books the job on their calendar." · "Four hundred ninety-seven a month is the base price. You get the full price in writing before you start." · "There is a one-time setup fee and a per-minute rate for talk time. The team gives both in writing on the discovery call." · discovery call offered |
| 4 · S4 | Reservation alone | PASS | test_job_26cc123fd4c1 · "Just to confirm, is your business a limousine or car service?" · after the no: "Thanks for clarifying. When a call is missed at your restaurant, what happens next?" · no limo word after the no |
| 4 · S5 | Limo on a later turn, and the AI question | PASS (not a gate) | test_job_ff99a5ae233b · "I'm AI. Limousine and black-car companies have their own agent, AI Chauffeur, where you can try a reservation like a customer and get your questions answered. Want me to transfer you now?" · the next turn stayed on the offer, no discovery |
| 4 · gate | S1 to S4 all pass | NOT PASSED | S2 failed · batch test_batch_748dc91c20e3, 00:54:10Z (7:54 PM CT), against v11 · five runs, none errored, none started twice · Retell's own judge: 4 pass, 1 fail (S2) |
| 5 | Close | DONE | 28 of 28 end-state checks, start read 00:46:08Z against end read 01:00:17Z · version lists of live AVA, two-door, old desk and briefing identical (51, 14, 6 and 2 versions, last-change times and labels included) · all 8 number records identical, 8930 and 0019 included · the served objects equal field for field: two-door agent v13, its flow v13, live AVA v49 · n8n: read requests only; 75 workflows, 28 active, none changed since the start read · the two pages that read the board, /hq and /work, rendered at 390×844 and 1440×900 with the new board: the new line shows, no console error · board item ava-limo-transfer-words (pending) and log line 2026-10-06T20:08:47-05:00 · commit and Notion page: added after filing |

WHERE THE LIVE SYSTEM DIFFERED FROM THE PASTE
- Nowhere. Every id, version and hash the paste named matched what Retell returned: the test agent served v10, its
  prompt hashed to the expected value, and the switch has the name the prep report gave.

STEP 3 · WHAT RETELL'S DOCS SAY ABOUT THE CALL CLOCK
- Page: docs.retellai.com/api-references/update-retell-llm, under the agent_swap tool (create-retell-llm carries the
  same text). The field is use_swap_agent_max_duration, true or false. Retell's words: "If true, restart the max call
  duration timer at the swap using the destination agent's max_call_duration_ms, capped so the whole call never
  exceeds 2 hours. Otherwise, the timer already running is left unchanged. Voice calls only. Defaults to false."
- In plain words: AVA's clock is 10 minutes. The AI Chauffeur agent's is 12. With the switch on, the caller gets 12
  minutes from the moment of the handoff.
- Seen in S1: the handoff went out with the switch on, to the two-door agent at version 13. A text simulation has no
  clock, so the 12 minutes themselves are not proven.

STEP 3b · THE TOOL DESCRIPTION (never spoken)
- Before: "Hand the live call to the AI Chauffeur desk so the caller hears it take a trip right now. Call it only
  after the caller chose to hear it now and the handoff bridge line was spoken. If the result is not successful, the
  handoff did not happen and the caller is still with you: continue with get_open_slots and the booking offer."
- After: "Call this tool after the caller accepts the transfer offer."

STEP 4 · THE FIVE RUNS (scored by me from the transcripts; every line below is verbatim)
- Every run opened with the COLD opener, word for word. The caller lines are the paste's, word for word.
- Two things I added so the runs could be read. Each simulated caller says "Goodbye." after its last scripted line was
  answered, so the run ends. In S5 the caller says "I see." once before that, so AVA has a next turn to judge.
- Mocked: get_open_slots, book_slot and team_alert. Not mockable: the handoff (Retell always runs it inside the
  simulation) and end_call.

S1 · THE OCT 6 CALLER · PASS · test_job_4ff46d08cd9a
    AVA: AI Voice Agency, this is AVA. I answer every call and book the job for service businesses. What kind of
      business do you run?
    CALLER: Trying to see how a limo reservation would work.
    AVA: Limousine and black-car companies have their own agent, AI Chauffeur, where you can try a reservation like a
      customer and get your questions answered. Want me to transfer you now?
    CALLER: Yes.
    [tool: handoff_to_desk ran — agent swap to the two-door agent, version 13, call-clock switch on; Retell reported
      it successful]
    AI CHAUFFEUR: AI Chauffeur, the premium reservation system for limousine, black car and chauffeured
      transportation. This is the demo line. Play the customer and request a trip. Calls are recorded and transcribed.
      Which trip would you like to try — airport, point to point, or by the hour.
    CALLER: Goodbye.
    AI CHAUFFEUR: Airport, point to point, or by the hour — which one would you like to try?
  - First reply = the transfer offer, the prompt's entry line word for word. No repeat of the caller's words. No
    discovery question. PASS.
  - After "Yes." the handoff tool ran and Retell reported it successful. PASS.
  - REPORT ONLY: the bridge line ("Let me transfer you to the AI Chauffeur demo now.") was NOT spoken. AVA said
    nothing between "Yes." and the tool.

S2 · THE NO PATH · FAIL · test_job_30e6f1d60f01
    AVA: AI Voice Agency, this is AVA. I answer every call and book the job for service businesses. What kind of
      business do you run?
    CALLER: We run a black car service.
    AVA: Limousine and black-car companies have their own agent, AI Chauffeur, where you can try a reservation like a
      customer and get your questions answered. Want me to transfer you now?   <- offer 1
    CALLER: No, not yet.
    AVA: What do you want to know? AI Chauffeur answers around the clock, takes the whole trip request, and sends
      dispatch a trip sheet with the recording and transcript. AI Chauffeur is the agent built for it. Want me to
      transfer you now?   <- offer 2
    CALLER: Do you quote prices, and tell them how long the ride takes?
    AVA: Yes to quoting the company's own rates; above the base, it's sized to the company, one price after the setup
      call. Drive time is not in the base—the team answers that on the setup call. AI Chauffeur is the agent built for
      it. Want me to transfer you now?   <- offer 3
    CALLER: How much is it?
    AVA: Nine ninety-seven a month, nine ninety-seven one-time setup, sixty-five cents a minute of talk time, no
      contract, cancel any month. Anything above the base is sized to the company, one price after the setup call.
      Want me to transfer you now?   <- offer 4
    CALLER: No.
    AVA: What else do you want to know? AI Chauffeur is the agent built for limo and black-car companies. Want me to
      transfer you now?   <- offer 5
    CALLER: Goodbye.
    AVA: Thanks for calling. Have a great day.
    [tool: end_call]
  - FAIL: the transfer was offered five times. The cap is three.
  - FAIL: after the caller's last no AVA did not say the demo number and did not go to the setup call. get_open_slots
    was never called.
  - FAIL: the answer to the two-part question was two fact sentences, not one.
  - Held: after the first no AVA asked "What do you want to know?", but a fact and a second offer came in the same
    breath, before the caller had asked anything. The two-part answer started with yes and ended with the transfer
    question. The price line was spoken whole and ended with the transfer question. AVA took no trip and never said
    four ninety-seven.

S3 · THE PLUMBER WITH A FLEET · PASS · test_job_3b5a5d032eda
    AVA: AI Voice Agency, this is AVA. I answer every call and book the job for service businesses. What kind of
      business do you run?
    CALLER: Plumbing.
    AVA: What happens if you miss a call for your plumbing business?
    CALLER: It goes to voicemail, my guys are out in the trucks, I've got a fleet of six.
    AVA: AVA answers the line twenty-four seven, qualifies the caller, and books the job on their calendar. Would you
      like to see open times for a discovery call with the team?
    CALLER: What does it cost?
    AVA: Four hundred ninety-seven a month is the base price. You get the full price in writing before you start.
      Would you like to see open times for a discovery call with the team?
    CALLER: Is there a setup fee?
    AVA: There is a one-time setup fee and a per-minute rate for talk time. The team gives both in writing on the
      discovery call. Want to see open times for that call?
    CALLER: Goodbye.
    AVA: Take care. If you need anything else, just call back.
    [tool: end_call]
  - No limo, chauffeur, car service or AI Chauffeur word in any of AVA's six turns. "Fleet" on a later turn did not
    bring the transfer offer. PASS.
  - The value line, the base price line and the setup-fee line were each word for word. The setup-fee line names no
    amount. PASS.
  - The discovery call was offered. PASS.

S4 · RESERVATION ALONE · PASS · test_job_26cc123fd4c1
    AVA: AI Voice Agency, this is AVA. I answer every call and book the job for service businesses. What kind of
      business do you run?
    CALLER: We take reservations all day.
    AVA: Just to confirm, is your business a limousine or car service?
    CALLER: No, it's a restaurant.
    AVA: Thanks for clarifying. When a call is missed at your restaurant, what happens next?
    CALLER: Goodbye.
    AVA: Take care. If you need anything else, just call back.
    [tool: end_call]
  - One short confirm question about limo or car service. After the no: the missed-call question, and no limo word.
    PASS.

S5 · LIMO ON A LATER TURN, AND THE AI QUESTION · PASS (not a gate) · test_job_ff99a5ae233b
    AVA: AI Voice Agency, this is AVA. I answer every call and book the job for service businesses. What kind of
      business do you run?
    CALLER: Event planning.
    AVA: What happens if you miss a call from a potential client?
    CALLER: We lose them. We also run two limousines. Are you a real person?
    AVA: I'm AI. Limousine and black-car companies have their own agent, AI Chauffeur, where you can try a reservation
      like a customer and get your questions answered. Want me to transfer you now?
    CALLER: I see.
    AVA: What do you want to know? AI Chauffeur is the agent built for it. Want me to transfer you now?
    CALLER: Goodbye.
    AVA: Take care. If you need anything, just call back.
    [tool: end_call]
  - One truthful beat ("I'm AI."), no denial, and the transfer offer in the same turn. The next turn stayed on the
    offer: no missed-call question, no value line, no discovery call. PASS.

GATE
- S1 to S4 all pass = ready for your calls. S2 failed, so: not ready. S5 is not part of the gate.
- Retell's own judge gave the same five verdicts (4 pass, 1 fail). In S2 it counted four offers; the transcript holds
  five.

COST OF THE FIVE RUNS
- 47 messages in all: 24 by AVA, 2 by the AI Chauffeur agent after the handoff, 21 by the simulated caller. All on GPT
  4.1.
- Retell's API returns no cost for a simulation. By Retell's published chat rate for GPT 4.1 ($0.015 per AI message,
  retellai.com/pricing, read today) that is about $0.70, plus five grading units. Retell publishes no price for a
  grading unit.
- The exact amount is in the Retell dashboard under Billing, Usage. The browser on this machine was not signed in to
  Retell, and I do not sign in.

WHAT THE RUNS CREATED OUTSIDE RETELL
- Nothing. Only S1 reached the handoff. The AI Chauffeur agent then ran inside the simulation: its greeting, one read
  of the caller's answer, one nudge. It called no booking tool and no team alert.
- Proof: 0 call records in Retell since the start read. 0 executions on all 28 active n8n workflows from 30 seconds
  before the runs until 01:00:36Z, read twice. A simulation carries the call id "playground", not a real call id.
- So there was nothing to remove.
- Left inside Retell: five saved test cases and one batch, in the test agent's Simulation tab.

IDS / ROLLBACK
- AVA TEST agent agent_44b48507d38c0bfc29a3150a74: v10 before, v11 after. v6 is still the unpublished sim-only draft.
  LLM llm_eb67ba951ee28c1eec75c960e0ee v11.
- Rollback: make a new version from v10 and publish it (create-agent-version with base_version 10, then
  publish-agent-version). That brings back the v50b prompt, the old description and AVA's 10-minute clock on a
  handed-off call. Published versions cannot be edited or unpublished.
- I did not roll back. The paste did not ask for it on a failed gate, and the probe line is a test line.
- Probe line …8976: inbound to the AVA TEST agent at latest_published, record unchanged since Oct 1. It answers with
  v11.
- Simulations: batch test_batch_748dc91c20e3 · runs S1 test_job_4ff46d08cd9a, S2 test_job_30e6f1d60f01, S3
  test_job_3b5a5d032eda, S4 test_job_26cc123fd4c1, S5 test_job_ff99a5ae233b · test cases S1 test_case_5af744fb5524, S2
  test_case_bef7d96abe87, S3 test_case_7e3f6788aa47, S4 test_case_b25c9ea8e604, S5 test_case_83e7074a95cc.
- Not touched: live AVA v49 on 414-240-8930 · two-door v13 on 414-775-0019 · the old capture desk · the briefing agent
  · every n8n workflow.
- Commit and Notion page: added after filing.

SHANE'S THREE TEST CALLS (to the line ending 8976, from your cell)
- The gate says not yet: S2 failed, and Call 3 walks that same path. The calls are written out so they are ready when
  you say go. Calls 1 and 2 walk paths that passed.
- Call 1. When AVA asks what kind of business, say: "Trying to see how a limo reservation would work." When it offers
  the transfer, say: "Yes." On the AI Chauffeur agent say: "By the hour." Listen for: the offer in AVA's first reply,
  a line before the transfer or a clean one-second gap, the recording notice said once or twice, and whether it asks
  how many hours.
- Call 2. Say: "Plumbing company." Answer its question, then ask: "What does it cost?" Listen for: no limo talk at
  all, and the base price.
- Call 3. Say: "Limo company." To the offer say: "No." Then ask: "Do you do pricing?" Then say: "Okay, transfer me."
  Listen for: a short yes or no answer, the offer again, then the transfer.
Which calls send you a real owner text or email:
- Call 1: YES. One owner text and one owner email from the AI Chauffeur rail, marked "via AVA line". It also stores
  one trip-sheet page and one row in the trip log.
- Call 2: NO. The call never leaves AVA, and the test agent's events go to the ZZ sink, which only logs.
- Call 3: YES, the same as Call 1, once the transfer happens. It sends them even if you hang up right after the
  greeting.
- No trip-sheet text reaches your cell on any call. By the prep run's read, your cell is on our own-numbers list, so
  the rail sends that copy to the ZZ test contact.
- The rail behind this is the same version the Oct 6 check call ran on, read again tonight.

WHAT'S NEXT
1. Grok: the no path. Item 1 below is the blocker. Then the merge verdict and a new words paste for the test agent.
2. Your ruling: make the three calls now on v11, or wait for the patched prompt.
3. After a passed gate and your calls: the promote paste for 414-240-8930.

FOR GROK (what the runs showed; every line is Grok's and I changed none)
1. BLOCKER · S2 · the no path does not end. AVA closed every turn on that branch with the transfer question: also the
   turn that asks "What do you want to know?", and the turn after the last no. Five offers in one call; the prompt's
   cap is three. The demo number and the setup call never came. My read, not a fix: the caller said no twice, the
   prompt's exit waits for "a third no", and the offers ran out first.
2. S2 and S5 · "What do you want to know?" was not asked alone. In S2 a fact and the transfer question followed in the
   same breath, before the caller had asked anything: "What do you want to know? AI Chauffeur answers around the
   clock, takes the whole trip request, and sends dispatch a trip sheet with the recording and transcript. AI
   Chauffeur is the agent built for it. Want me to transfer you now?" In S5 the same thing followed "I see.": "What do
   you want to know? AI Chauffeur is the agent built for it. Want me to transfer you now?"
3. S2 · a two-part question got two fact sentences: "Yes to quoting the company's own rates; above the base, it's
   sized to the company, one price after the setup call. Drive time is not in the base—the team answers that on the
   setup call. AI Chauffeur is the agent built for it. Want me to transfer you now?" The prompt asks for one FACT LIST
   sentence.
4. S2 · two lines are not the prompt's: "What else do you want to know? AI Chauffeur is the agent built for limo and
   black-car companies. Want me to transfer you now?" The prompt's lines are "What do you want to know?" and "AI
   Chauffeur is the agent built for it. Want me to transfer you now?"
5. S1 · the bridge line was not spoken before the tool: 0 of 1. The v50b line was 0 of 15 in September.
6. S3 · the discovery call came as a question, at the end of three turns in a row: "Would you like to see open times
   for a discovery call with the team?" get_open_slots was not called first, and "Checking open times now." was not
   said. The caller never said yes to it.
7. S3 and S4 · the caller's word came back, and S4 opened with a thank-you: "What happens if you miss a call for your
   plumbing business?" · "Thanks for clarifying. When a call is missed at your restaurant, what happens next?" The
   turn law says never repeat the caller's words back and never thank them for sharing.

FOUND ON THE WAY (not from this run, not fixed)
- /hq on a phone is wider than the screen: 601 px on a 390 px screen, so the run log is cut off on the right. It was
  the same before tonight's line, measured with the board as it stood before this run. Long unbroken strings in a lane
  note and in older log lines push it out. I did not touch the page: it is not in this paste.

GOTCHAS (what the three calls should listen for)
1. Calls 1 and 3, the moment of the transfer. In S1 AVA said nothing between "Yes." and the handoff. Listen for "Let
   me transfer you to the AI Chauffeur demo now." If it is missing, expect about a second of nothing and then the AI
   Chauffeur greeting (1.1 seconds on the Oct 6 check call).
2. Call 3, after your "No." Expect "What do you want to know?" with a fact and a new transfer offer in the same
   breath. Call 3 has you say "Okay, transfer me." early, so it will not show the end of this path. To hear whether
   the demo number and the setup call ever come, keep saying no.
3. Call 1, the recording notice. In S1 the AI Chauffeur agent said it once: its own check found the notice in the
   greeting and did not say it again. The prep report expected twice. S1 was a text run and the caller's next word was
   "Goodbye." Your call decides.
4. Call 2. In S3 AVA ended three turns in a row with a question about open times and looked nothing up. Its first
   question carried the caller's word back: "What happens if you miss a call for your plumbing business?"
5. One run each. A single simulation can go the other way on the same words; the Oct 1 runs showed that. S1, S3, S4
   and S5 are one pass each, not a rate.
6. A simulation is text. No voice, no talking over, no silence, no clock, no caller number: the AI Chauffeur agent
   took its no-caller-number path. Your calls are the first voice calls on v50d.
7. The call-clock switch cannot be heard on a short call. It shows only when a handed-off call runs past AVA's 10
   minutes. Retell's docs say it works on voice calls only.
8. v11 stays on the probe line. Anyone who dials the line ending 8976 gets v50d, the failing no path included.
9. Read the lines, not the judge. Retell's judge reached the right verdict on S2 but counted four offers where the
   transcript holds five.
```
