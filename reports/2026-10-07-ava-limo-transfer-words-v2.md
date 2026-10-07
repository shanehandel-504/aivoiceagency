RUN INCOMPLETE — V50E IS ON THE AVA TEST AGENT (V12, BYTE-EXACT, THE PROMPT IS THE ONLY CHANGE), BUT THE GATE DID NOT PASS, 2 OF 3: S2, THE NO PATH, FAILED ON ITS LAST TURN (AFTER THE CALLER'S LAST NO: NO DEMO NUMBER, NO SETUP CALL) — NEXT: GROK PATCHES THE END OF THE NO PATH → NEW WORDS PASTE → SHANE'S THREE TEST CALLS

# AVA limo transfer — words run 2

2026-10-07 · paste AVA LIMO WORDS v2 · the AVA TEST agent only · three simulations, no call.
Read only and unmoved: the live AVA line (414-240-8930, v49), the AI Chauffeur line (414-775-0019, v13), the old capture desk, the briefing agent, every n8n workflow.
Nothing sensitive is in this file: no key, no header value, no webhook path, no private number, no caller name. Probe and pool lines are last four digits only.
Run 1 (v50d, Oct 6): reports/2026-10-06-ava-limo-transfer-words.md.

```
===== SHANE READBACK — COPY ALL =====

WHAT I DID (plain English)
- Put Grok's v50e prompt on the AVA TEST agent, byte for byte. Nobody typed it: a script cut it out of your paste. It
  is 7,759 characters. Its hash matched the paste's own hash before I sent it, on the draft, and on the published
  version.
- Published it as test agent version 12. The probe line ending 8976 answers with it now. The prompt is the only thing
  that changed: the tools, the call-clock switch, the tool description, version pin 13, the five start variables, the
  voice and every speech setting are as they were.
- Ran the three simulations, one run each, on the three saved cases from Oct 6: same caller lines, same mocks. S1
  passed. S3 passed. S2, the no path, failed. So the gate is not passed and this run is incomplete. I ran nothing
  twice and changed nothing after the runs.
- What got better in S2 since Oct 6: after the first no AVA asked "What do you want to know?" and nothing else, and
  the transfer question came three times, not five. What still fails: after the caller's last no AVA said "What else
  do you want to know?" The demo number and the setup call never came.
- During the simulations nothing left Retell: no call record, no n8n run, no text, no email.
- git: fetched first, and again before the board edit. Local was level with origin both times (0 ahead, 0 behind), so
  there was nothing to pull.

DONE TABLE
| Step | What | Status | Evidence |
|---|---|---|---|
| 1 | Before read | DONE | read 14:51:27Z (9:51 AM CT), before any write · test agent serves v11 (expected v11) · prompt SHA-256 939ed32283bee38a9d957e1b72ebc753563680071a6472dbc19655f583f9026d = the expected value (7,072 characters) · handoff_to_desk as read: call-clock switch on (use_swap_agent_max_duration true), description "Call this tool after the caller accepts the transfer offer.", agent swap to agent_9ebb41c9bd8af214649328f107 at version pin 13, webhook both_agents, analysis both_agents, speak_during_execution false · 48 agent fields, 15 LLM fields and all 4 tools kept for the diff |
| 2 · cut | v50e cut out of the paste | DONE | 7,759 characters, 7,763 bytes, LF, no trailing newline; the paste arrived with LF, so nothing was converted · SHA-256 b622d7eb2ceef305e4ba489a5d0e13ef761dfb73a5ad0e7f4dde803b7d8bf1e0 = the paste's value · the 4 extra bytes are the prompt's two long dashes |
| 2 · place | Set as the system prompt, read back | LIVE on the test agent | the same SHA-256 on five reads from Retell: the draft right after the write (14:52:46Z), the draft again (14:52:47Z), the draft before publish (14:52:52Z), published v12 (14:52:52Z), and v12 again at the end read (14:58:55Z) · each read equal to the cut text character for character |
| 2 · file | Prompt file | DONE | ops/tuning/ava-8930-v50e-final.md in the layout of the v50d file · the block in the file hashes to the same SHA-256 · measured against v50d by script: 2 lines of 61 differ, both under AI CHAUFFEUR BRANCH (the no path and the price line); the other 59 are identical and in the same order · 1,859 tokens (v50d: 1,715) |
| 2 · publish | Published, then diffed against step 1 | DONE | v11 → v12, published 14:52:52Z (9:52 AM CT) · leaf-by-leaf diff of the step 1 objects against published v12: no agent field differs beyond version bookkeeping (48 fields, 114 values); 1 LLM path differs: general_prompt (15 fields, 66 values) · 16 of 16 checks on the draft, again before publish, and again on the published version · unchanged: all 4 tools in the same order, the call-clock switch (on), the tool description, version pin 13 (a number), begin message {{opening_line}}, the default opening line and the five start variables, voice and every speech setting · version bookkeeping = version number, base version, last-change time, the version's label, engine version |
| 3 · S1 | The Oct 6 caller | PASS | test_job_2fb360d64776 · first reply: "Limousine and black-car companies have their own agent, AI Chauffeur, where you can try a reservation like a customer and get your questions answered. Want me to transfer you now?" · no discovery question before it · after "Yes." the handoff tool ran (agent swap, two-door agent, version 13, successful) · REPORT ONLY: the bridge line was spoken: "Let me transfer you to the AI Chauffeur demo now." |
| 3 · S2 | The no path | FAIL | test_job_e34f13691820 · held: after the first no, "What do you want to know?" and nothing else; three transfer questions in the call, the entry offer included; no trip taken; four ninety-seven never said · failed: the turn that would have carried a fourth, AVA's reply to the last "No.", was "What else do you want to know?" — no demo number, no setup call; get_open_slots never called |
| 3 · S3 | The plumber with a fleet | PASS | test_job_ed39f97d179c · no limo, chauffeur, car service or AI Chauffeur word in 6 AVA turns · "Four hundred ninety-seven a month is the base price. You get the full price in writing before you start." · "There is a one-time setup fee and a per-minute rate for talk time. The team gives both in writing on the discovery call." (no amount) · discovery call offered: "Would you like to book a discovery call to see how it works for your plumbing business?" |
| 3 · gate | S1, S2 and S3 all pass | NOT PASSED | S2 failed · batch test_batch_2d10065ca8ff, 14:56:56Z (9:56 AM CT), against v12: the batch and each run's saved case name engine version 12 · three runs, none errored, none started twice · Retell's own judge: 2 pass, 1 fail (S2) |
| 4 | Close | DONE | 29 of 29 end-state checks, start read 14:51:27Z against end read 14:58:55Z · version lists of live AVA, two-door, old desk and briefing identical (51, 14, 6 and 2 versions, last-change times and labels included) · all 8 number records identical, 8930 and 0019 included · the served objects equal field for field: two-door agent v13, its flow v13, live AVA v49 · n8n: read requests only; 75 workflows, 28 active, every one the same at 14:52:35Z and 14:58:59Z (id, name, active flag, last-change time, draft and serving version) · the two pages that read the board, /hq and /work, rendered at 390×844 and 1440×900 with the new board: the new line shows, no console error; /hq at 390 is wider than the screen, the same as before this run (gotcha 8) · board item ava-limo-transfer-words flipped in place (still pending) and log line 2026-10-07T10:01:45-05:00 · commit and Notion page: added after filing |

THE FULL S2 TRANSCRIPT, EVERY TRANSFER QUESTION NUMBERED · FAIL · test_job_e34f13691820
    AVA: AI Voice Agency, this is AVA. I answer every call and book the job for service businesses. What kind of
      business do you run?
    CALLER: We run a black car service.
    AVA: Limousine and black-car companies have their own agent, AI Chauffeur, where you can try a reservation like a
      customer and get your questions answered. Want me to transfer you now?   <- transfer question 1
    CALLER: No, not yet.
    AVA: What do you want to know?
    CALLER: Do you quote prices, and tell them how long the ride takes?
    AVA: Yes, it quotes your company’s own rates. Drive time is not in the base; the team answers that on the setup
      call. AI Chauffeur is the agent built for it. Want me to transfer you now?   <- transfer question 2
    CALLER: How much is it?
    AVA: Nine ninety-seven a month, nine ninety-seven one-time setup, sixty-five cents a minute of talk time, no
      contract, cancel any month. Anything above the base is sized to the company, one price after the setup call. AI
      Chauffeur is the agent built for it. Want me to transfer you now?   <- transfer question 3
    CALLER: No.
    AVA: What else do you want to know?
    CALLER: Goodbye.
    AVA: Take care. If you have more questions, just call back.
    [tool: end_call]
  - Transfer questions, counted by me line by line: 3. They sit in AVA's replies to caller lines 1, 3 and 4. Each one
    is the prompt's wording: "Want me to transfer you now?"
  - PASS · after the first no, AVA's turn is one short question and nothing else: "What do you want to know?" It is
    the prompt's line word for word.
  - PASS · the transfer question is asked three times at most in the whole call, the entry offer included: three.
  - FAIL · the turn that would have carried a fourth says the demo number digit by digit once and offers the setup
    call. That turn is AVA's reply to the last "No." It was: "What else do you want to know?" The demo number was said
    0 times in the call. The setup call was not offered. get_open_slots was not called.
  - PASS · AVA never takes a trip and never says four ninety-seven.

THE OTHER TWO RUNS (scored by me from the transcripts; every line is verbatim)
- Every run opened with the COLD opener, word for word. The caller lines are the paste's, word for word. As on Oct 6,
  each simulated caller says "Goodbye." after its last scripted line was answered, so the run ends.
- Mocked, as on Oct 6: get_open_slots, book_slot and team_alert. Not mockable: the handoff (Retell always runs it
  inside the simulation) and end_call. No run reached a mocked tool.
- The scoring script was written before the runs and tried on the Oct 6 runs first: S1 and S3 came out green, S2 red.
  Its file hash was recorded at 14:56:39Z, before the batch started at 14:56:56Z, and was the same when it scored.

S1 · THE OCT 6 CALLER · PASS · test_job_2fb360d64776
    AVA: AI Voice Agency, this is AVA. I answer every call and book the job for service businesses. What kind of
      business do you run?
    CALLER: Trying to see how a limo reservation would work.
    AVA: Limousine and black-car companies have their own agent, AI Chauffeur, where you can try a reservation like a
      customer and get your questions answered. Want me to transfer you now?   <- transfer question 1
    CALLER: Yes.
    AVA: Let me transfer you to the AI Chauffeur demo now.
    [tool: handoff_to_desk ran — agent swap to the two-door agent, version 13, call-clock switch on; Retell reported
      it successful]
    AI CHAUFFEUR: AI Chauffeur, the premium reservation system for limousine, black car and chauffeured
      transportation. This is the demo line. Play the customer and request a trip. Calls are recorded and transcribed.
      Which trip would you like to try — airport, point to point, or by the hour.
    CALLER: Goodbye.
    AI CHAUFFEUR: Calls are recorded and transcribed.
    AI CHAUFFEUR: Airport, point to point, or by the hour — which one would you like to try?
  - First reply = the transfer offer, the prompt's entry line word for word. No discovery question before it. PASS.
  - After "Yes." the handoff tool ran and Retell reported it successful. PASS.
  - REPORT ONLY: the bridge line was spoken before the tool: "Let me transfer you to the AI Chauffeur demo now." On
    Oct 6 it was not.

S3 · THE PLUMBER WITH A FLEET · PASS · test_job_ed39f97d179c
    AVA: AI Voice Agency, this is AVA. I answer every call and book the job for service businesses. What kind of
      business do you run?
    CALLER: Plumbing.
    AVA: When a call is missed, what happens next for your plumbing business?
    CALLER: It goes to voicemail, my guys are out in the trucks, I've got a fleet of six.
    AVA: AVA answers the line twenty-four seven, qualifies the caller, and books the job on your calendar. Would you
      like to book a discovery call to see how it works for your plumbing business?
    CALLER: What does it cost?
    AVA: Four hundred ninety-seven a month is the base price. You get the full price in writing before you start.
      Would you like to book a discovery call to go over the details?
    CALLER: Is there a setup fee?
    AVA: There is a one-time setup fee and a per-minute rate for talk time. The team gives both in writing on the
      discovery call. Would you like to book a time to go over everything?
    CALLER: Goodbye.
    AVA: Thanks for calling. Have a great day.
    [tool: end_call]
  - No limo, chauffeur, car service or AI Chauffeur word in any of AVA's 6 turns. "Fleet" on a later turn did not
    bring the transfer offer. PASS.
  - The base price line, word for word. PASS.
  - The setup-fee line, word for word, with no amount. PASS.
  - The discovery call was offered. PASS.

WHERE THE LIVE SYSTEM DIFFERED FROM THE PASTE
- On the agent: nowhere. The test agent served v11, its prompt hashed to the expected value, the handoff tool was set
  the way the paste said, and the three saved cases were there under the ids the paste named.
- One thing the paste did not cover. Each saved case names the engine version it was saved against, and that was 11.
  Retell's docs do not say whether the batch's version or the case's version is the one that runs. So I set that one
  field to 12 on the three cases and sent every other field back as read. Caller lines, mocks, judge text, names and
  caller model came back unchanged. The batch and each run's saved case then named version 12.

WHAT EACH RUN CREATED OUTSIDE RETELL
- S1: nothing. It reached the handoff. The AI Chauffeur agent then ran inside the simulation: its greeting, one read
  of the caller's answer, the recording notice a second time, one nudge. It called no booking tool and no team alert.
- S2: nothing. The call never left AVA. The only tool was end_call.
- S3: nothing. The call never left AVA. The only tool was end_call.
- Proof: 0 call records in Retell since the start read. 0 executions on all 28 active n8n workflows from 30 seconds
  before the runs until 14:58:54Z. A simulation carries the call id "playground", not a real call id.
- A second n8n read at 15:05:03Z found two executions, both hourly timer runs that fire with or without this run: AVA
  Booking Receipt at 15:00:44Z and AVA Drip Engine v1 at 15:00:48Z. Each ran the same nodes as its runs at 14:00,
  13:00 and 12:00 UTC. Neither names the test agent, the two-door agent or a simulation id.
- So there was nothing to remove.
- Left inside Retell: one new batch with three runs, in the test agent's Simulation tab. The three saved cases now
  name engine version 12. The other two saved cases from Oct 6 (S4 and S5) were not touched.

COST OF THE THREE RUNS
- 33 messages in all: 16 by AVA, 3 by the AI Chauffeur agent after the handoff, 14 by the simulated caller. All on GPT
  4.1.
- Retell's API returns no cost for a simulation. Retell's published chat rate for GPT 4.1 is $0.015 per AI message
  (retellai.com/pricing, read today). If every message bills at that rate, that is about $0.50, plus three grading
  units. Retell publishes no price for a grading unit.
- The exact amount is in the Retell dashboard under Billing, Usage. I did not sign in there.

IDS / ROLLBACK
- AVA TEST agent agent_44b48507d38c0bfc29a3150a74: v11 before, v12 after. v6 is still the unpublished sim-only draft.
  LLM llm_eb67ba951ee28c1eec75c960e0ee v12.
- Rollback: make a new version from v11, the version that served before this run, and publish it (create-agent-version
  with base_version 11, then publish-agent-version). That brings back the v50d prompt; nothing else differs. Published
  versions cannot be edited or unpublished.
- I did not roll back. The paste does not ask for it on a failed gate, and the probe line is a test line.
- Probe line …8976: inbound to the AVA TEST agent at latest_published, record unchanged since Oct 1. It answers with
  v12.
- Simulations: batch test_batch_2d10065ca8ff · runs S1 test_job_2fb360d64776, S2 test_job_e34f13691820, S3
  test_job_ed39f97d179c · saved cases S1 test_case_5af744fb5524, S2 test_case_bef7d96abe87, S3 test_case_7e3f6788aa47.
- Not touched: live AVA v49 on 414-240-8930 · two-door v13 on 414-775-0019 · the old capture desk · the briefing agent
  · every n8n workflow.
- Commit and Notion page: added after filing.

WHAT'S NEXT
1. Grok: the end of the no path. Item 1 below is the blocker. Then the merge verdict and a new words paste for the
   test agent.
2. Your three test calls come after a passed gate. What to say on each is written out in the Oct 6 report.
3. After a passed gate and your calls: the promote paste for 414-240-8930.

ITEMS FOR GROK (what the three runs showed; every quoted line is verbatim and I changed none)
1. BLOCKER · S2 · the no path still does not end the way the prompt says. After the third transfer question the caller
   said "No." AVA's whole turn was: "What else do you want to know?" No demo number, no setup call, get_open_slots not
   called. AVA asked no fourth transfer question, and did not do the exit either. The prompt's line for that turn:
   "The turn that would carry a fourth transfer question says 4-1-4-7-7-5-0-0-1-9 once, digit by digit, and offers the
   setup call through the BOOKING RAIL."
2. S2 · "What else do you want to know?" is not a line of the prompt. The prompt's question is "What do you want to
   know?"
3. S2 · held: after the first no the question came alone, word for word: "What do you want to know?" On Oct 6 a fact
   and a transfer question came in the same breath.
4. S2 · held: three transfer questions in the call (the entry offer, after the two-part answer, after the price line).
   On Oct 6 it was five.
5. S2 · the two-part question got two fact sentences, yes first, then the transfer question: "Yes, it quotes your
   company’s own rates. Drive time is not in the base; the team answers that on the setup call. AI Chauffeur is the
   agent built for it. Want me to transfer you now?" The first sentence leaves out the rest of its FACT LIST line:
   "Quoting the company's own rates: yes; above the base, sized to the company, one price after the setup call."
6. S2 · the price line was spoken whole, then the full transfer question line: "Nine ninety-seven a month, nine
   ninety-seven one-time setup, sixty-five cents a minute of talk time, no contract, cancel any month. Anything above
   the base is sized to the company, one price after the setup call. AI Chauffeur is the agent built for it. Want me
   to transfer you now?"
7. S1 · the bridge line was spoken before the tool, 1 of 1: "Let me transfer you to the AI Chauffeur demo now." On Oct
   6 it was 0 of 1. That line of the prompt is the same in v50d and v50e.
8. S3 · the value line changed one word: "AVA answers the line twenty-four seven, qualifies the caller, and books the
   job on your calendar." The prompt's line: "AVA answers the line twenty-four seven, qualifies the caller, and books
   the job on their calendar."
9. S3 · the caller's word came back twice: "When a call is missed, what happens next for your plumbing business?" ·
   "Would you like to book a discovery call to see how it works for your plumbing business?" The turn law says never
   repeat the caller's words back.
10. S3 · the discovery call came as a question at the end of three turns in a row: "Would you like to book a discovery
    call to see how it works for your plumbing business?" · "Would you like to book a discovery call to go over the
    details?" · "Would you like to book a time to go over everything?" get_open_slots was not called first, and
    "Checking open times now." was not said. The caller never said yes to it.
11. Not the AVA prompt · S1 · after the handoff the AI Chauffeur agent said the recording notice twice: inside its
    greeting, and again alone after the caller's next word: "Calls are recorded and transcribed." On Oct 6 it said it
    once. That agent is read only in this run and did not change.

GOTCHAS
1. v12 stays on the probe line. Anyone who dials the line ending 8976 gets v50e. A limo caller who keeps saying no
   gets one more question, not the demo number and the setup call.
2. One run each. A single simulation can go the other way on the same words. S1's bridge line shows it: spoken today,
   not spoken on Oct 6, and that line of the prompt did not change. S1 and S3 are one pass each, not a rate.
3. The parts of S2 that held are one run too: the question alone after the first no, and the cap of three.
4. A simulation is text. No voice, no talking over, no silence, no clock, no caller number. Your calls would be the
   first voice calls on v50e.
5. Read the lines, not the judge. Retell's judge failed S2 for the true reason and for a stale one: its text is the
   Oct 6 text, which asks for one fact sentence per answer. v50e allows two for a two-part question. I left the judge
   text alone: the paste asked for the same saved cases.
6. The three saved cases now name version 12. A later run against another version must name that version on the batch.
   I also set it on the case, since Retell's docs do not say which one runs.
7. The mocked open times are fixed text from Oct 6. The first one reads "Wednesday October seventh at ten AM Central",
   which is this morning. No run reached that mock today. A later run that does will offer a time that has passed.
8. /hq on a phone is still wider than the screen: 601 px on a 390 px screen, the same with the board as it stood
   before this run. The new log line shows, and its right side is cut off like every other line. Found on Oct 6, not
   fixed, not in this paste.
9. The recording notice came twice from the AI Chauffeur agent in S1 today and once on Oct 6, on the same flow
   version. On a real handed-off call, listen for it.
```
