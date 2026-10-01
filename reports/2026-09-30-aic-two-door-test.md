# 2026-09-30 — AI CHAUFFEUR DEMO LINE · TWO-DOOR + SLOW-TALKER BUILD ON THE TEST AGENT (paste v1.5)

```
===== SHANE READBACK — COPY ALL =====
RUN INCOMPLETE — SETUP-CALL BOOKING AND THE TEAM ALERT DO NOT WORK FROM THE TEST AGENT YET / THE BOOKING WORKFLOW ONLY ANSWERS THE LIVE DESK, AND THIS RUN WAS NOT ALLOWED TO TOUCH N8N / ADD THE TEST AGENT TO THAT WORKFLOW'S ALLOW-LIST (ONE LINE), THEN PLACE LIVE CALL F

MISSION: AI Chauffeur demo line, two-door + slow-talker build on the TEST agent. Paste v1.5, Sep 30 2026.
Everything else in the paste is built, published on the test agent, and bound to a test number.
The live line (0019) was read and never written.

WHAT I DID, IN PLAIN ENGLISH
1. Read the live 0019 agent and saved a snapshot of it. Nothing on live changed: I compared the live agent
   and its flow to the snapshot again at the end and they are identical, byte for byte.
2. Built the two-door call on the test agent (AIC-TEST-2), starting from a copy of the live flow.
   - The demo is still the default and still runs as fixed steps. The greeting is the live greeting, byte for byte.
   - The questions part is one answering step that reads only the facts sheet. Around it, the things that must be
     said the same way every time are fixed steps, not the model's choice: the booking, "How did you hear about us?",
     the offer to connect to the team, the line after a missed transfer, and the goodbye.
   - A caller is never offered a choice of doors. A question mid-demo gets one short answer and the demo picks up
     at the exact question it left. "Let me try booking one" mid-questions goes straight to the demo.
3. Slow talkers. The agent now waits about twice as long before it speaks on the 27 open questions, holds silent
   through a stop in the middle of a sentence, and confirms a pieced answer in one short question. Proven on real
   web calls, not just in text: an 8-second pause mid-answer was held in silence; an address given in three pieces
   two seconds apart landed as one answer; talking over the greeting stops the agent in 0.8 seconds.
4. Loaded FACTS SHEET v1 word for word as the knowledge base "AIC-FACTS-v1" and attached it to the test agent only.
5. Wired the warm transfer: hold with the recorded pitch (not music), a private briefing to the team, the team
   presses 1 to accept, hours 7 AM to 9 PM Central. Anything else (decline, no answer, voicemail, outside hours,
   a web call) brings the caller back to one fixed line that says when the team will call back.
6. Rendered HOLD PITCH v1 with ElevenLabs on Eleven v4 in the Ava brand voice. It runs 34 seconds. I checked it
   by machine transcription: all 103 words, in order.
7. Added the analysis fields, published, placed the web test call, and bound a test number.
8. Ran the simulation battery (test calls a through q, plus curveballs C01 to C25): the whole set three times.
   The last run, on the published build, scored 41 of 49 by my checks and 46 of 49 by Retell's own judge.
   The 8 misses were all wording in the questions part. I fixed them, published that as v5, and re-ran only
   those cases: 9 of 9. v5 is what the test number answers.

DONE
| Item | Result | Proof |
|---|---|---|
| Snapshot saved | yes | ops/tuning/0019-pre-two-door-snapshot-2026-09-30.md |
| Test agent | AIC-TEST-2 · agent_9ebb41c9bd8af214649328f107 · v5 published | versions 0,1,2,3,4,5 all published; flow conversation_flow_9cf4ddd5b734 v5, 221 steps |
| Greeting byte-exact | yes | phone, browser and nudge lines equal to live when read back from the API; 274 characters equal on a real call |
| Knowledge base attached | yes, test agent only | AIC-FACTS-v1 · knowledge_base_93ced71a2c1504c8 · 10 sections · live flow has none |
| Settings (old -> new) | wait before speaking: 0.7 -> 0.7 for the agent, 0.3 on the 27 open questions · interruption 0.82 -> 0.9 · backchannel 0.35 -> 0.1 · silence nudge: none (8 s, count 0) -> one, after 10 s · end after silence 20 s unchanged | read back from the API |
| Warm transfer wired | yes (the number was under AIC_TRANSFER_NUMBER_, with the underscore) | in the transfer step only, once; in no prompt, no knowledge base, no file. NOT yet proven on a real call |
| Hold pitch | custom audio set | Eleven v4, Ava voice, 34 s · assets/audio/aic-hold-pitch-v1.mp3 · Retell asset asset_194cec46941c |
| Analysis fields | 36 (24 from live + 12 added); all 14 named fields present | filled on real calls: door, outcome, price_asked, transfer_result and the rest |
| Test number bound | yes · last four 8976 | answers AIC-TEST-2, newest published version |
| Web test call | call_4246e700817a9da5cb9cfbb4291 (v5) · price check PASS | greeting exact, full base price, no other number; also call_4118a85d649d0a7682aefe65556 on v4 |
| Battery | 3 whole-set runs; last on published v4: 41/49 mine, 46/49 Retell · v5 re-check of the misses: 9/9 | ops/tuning/aic-demo-test-battery-2026-09-30.md |
| Model | gpt-4.1, fast tier, same as live. No smaller model was tried | see gotcha 9 |
| Live 0019 untouched | confirmed | live versions 0P,1P,2D,3P,4P before and after; agent and flow identical to the snapshot; 0019, 5008, 8930 and the four pool numbers answer what they answered before; no n8n write |

IDS, COMMITS, ROLLBACK
- Commit b57d81f: snapshot, build doc, battery table, hold pitch, board line. This report is the commit after it.
  Undo: git revert the two commits.
- Test agent AIC-TEST-2: v4 (first two-door build) and v5 (v4 + wording fixes) are new. Versions 0 to 3 are still
  there. Nothing was deleted.
- Test number 8976. It was the AVA sales test line (AVA SALES v37 TEST, agent_44b48507d38c0bfc29a3150a74, no
  version pin). Undo: point its inbound side back at that agent. Its outbound side was not changed.
- New Retell pieces, all additive, none attached to live: knowledge base knowledge_base_93ced71a2c1504c8 ·
  hold audio asset_194cec46941c · briefing agent agent_63db656e3a68b737fe61cb78db (its own flow
  conversation_flow_2cc948787428).
- Battery runs: test_batch_f2367f2b9ff5 · test_batch_9ae6e2325670 · test_batch_63ef83c5882b (the one on published v4) ·
  re-checks test_batch_92f2546c22f2 and test_batch_929a2340a1fc.
- Real-call checks on v5: pause call_b658574dcbaf4771790bef5c9d3 · talk-over call_50979f129e00b8b7829975e0986 ·
  slow talker call_d741ac08024e053862e2f9d72b0 · silence call_d97c099a885fb72371f3f721b86.
- Live desk: nothing to undo.

WHAT'S NEXT
1. Decide the allow-list: say the word and the test agent gets added to the booking workflow. Until then call f
   cannot pass.
2. Your 8 live calls on the number ending 8976. Place k, k2 and k3 between 7 AM and 9 PM Central with the team
   phone in your hand: press 1 to accept on k, hang up during the briefing on k2, let it ring out on k3.
   The table of what to say and what counts as a pass is in section 7 of the battery file.
3. Two calls that are yours: a fourth run of the whole set on v5, and a trial of a smaller, faster model.
4. Then the promote paste, and the separate rail run for the lead sheet.
5. When testing is done, give 8976 back to the AVA sales test (one line, above).

GOTCHAS
1. I wrote the agent's new spoken lines. The repo rule says Claude Code does not write what the agent says; this
   paste ordered it (step 3), and your direct instruction outranks that rule. Every new fixed line is listed in
   section 6 of the build doc so it can be read and replaced. The live lines were not reworded.
2. Calls to 8976 are real calls on the live rail. The test agent posts to the same after-call address as live, so a
   demo trip on 8976 sends a real trip sheet and a real text. A questions-only call will show up as a missed
   capture until the lead-sheet run. Calls on a pool number are tagged "via AVA line".
3. Booking and the alert, again, because it changes what you hear: from the test number, saying yes to the setup
   call ends on "The calendar isn't cooperating…". After a missed transfer the caller is told the team has their
   details; today that reaches you through the after-call alert, not the instant one.
4. The transfer is built but unproven. Simulations fake transfers. Three things only a real call shows: the hold
   pitch plays, the team hears the briefing with the caller's name and company in it, and pressing 1 connects.
   If the briefing has a gap where the name should be, or the hold is silent, tell me which and it is one fix.
5. The hold pitch is 34 seconds, not the "about 40" in the paste. Same words; that is how long the read came out.
6. "How did you hear about us?" never holds a caller who is already saying goodbye. On a questions call it is
   asked when the caller says they are done, or in the team interview right after the topic. Say "that's all I
   needed" on call p, not "bye", or you will get the closing line straight away, as the paste asks.
7. Dead air gets one nudge after 10 seconds, then the call ends 20 seconds after that. The paste says "once" in
   one place and "two prompts" in another; I built once. On that dead-air call the analysis marked spam as false,
   so the lead-sheet run should treat "caller never spoke" as spam by rule, not by that field.
8. Pieces two seconds apart land as one answer and get no extra confirm question. The confirm ("That's from …
   to …. Is that right?") comes when a pause is long enough to split the answer in two.
9. Two things the paste asked for that I did not do in full. The model: I kept gpt-4.1 and did not qualify a
   faster one, because each candidate needs its own run of the whole set and the cap was three. And v5 itself has
   not had a whole-set run: 9 simulated cases, 21 scripted conversations and 5 real calls, not all 49.
10. The first scoring of the last run said 45 of 49. I read every transcript, found my own checks too kind in five
   places and wrong in one, tightened them, and re-scored the same calls: 41 of 49. Both numbers are in the file.
11. On the test agent two live lines are gone on purpose: the old price line and the old "a message is going to
   the team" line. The questions part replaces both.
12. The transfer number showed once in this session's own scratch output during an early probe (Retell echoes a
   transfer's arguments). I changed the tool to mask it. It is in no file, no commit, and no report; my last
   sweep of every committed file for it, digits or spoken, came back clean.
13. Not from this run, but I tripped over it: the public board file already carries, in older log entries, the
   GHL location id, some phone-shaped strings, 14 workflow addresses and 3 email addresses. Worth a look.
```
