# 2026-10-01 — AI CHAUFFEUR TEST AGENT · SEVEN WORDING ITEMS + CAL.COM HOLIDAYS + HOUSEKEEPING (paste 22 v2.0)

```
===== SHANE READBACK — COPY ALL =====
MISSION: AI Chauffeur test agent, seven wording items + Cal.com holidays + housekeeping. Paste 22 v2.0, Oct 1 2026.
STATUS: COMPLETE. Every step in the paste is live. The live 414-775-0019 agent was read and never written.
LIVE: AIC-TEST-2 v8 on the test number ending 8976 · board https://aivoiceagency.ai/hq/board.json
SHARED RAIL: six holidays are closed on the setup-call calendar. Live callers are not offered those days either.
SCORE: 9 of the 13 named cases pass on the published build. The 4 misses are wording. They are listed for Grok.

WHAT I DID, IN PLAIN ENGLISH
1. Pasted Grok's six texts on the test agent, byte for byte: the silence sentences in the standing
   instructions, and five places in the questions part. Nothing else was touched. I checked each text three
   ways: against the paste, against the old text with only the ruled phrases swapped, and by reading it back
   from the published version.
2. Confirmed the silence setting still fires the prompt twice, so the words and the setting agree.
3. Closed the six holidays on the setup-call calendar in Cal.com for the next 12 months. Nothing else on the
   calendar or the event changed. The live line books through the same calendar.
4. Published the test agent as v8. The test number ending 8976 answers it.
5. Ran the named cases on the published build: 15 simulations, plus two real web calls for the two silence
   cases, because a simulation cannot go silent.
6. Ran each wording case four more times (once before publishing, three times after). The answers move
   from run to run, so one run is not the whole story.
7. Housekeeping: masked the prospect in the board's lane note, masked the calendar ids in five older log
   lines, and gave tools/stamp.py a guard so --help no longer stamps pages.
8. Re-read live at the start and at the end. Nothing on the live agent or its flow moved.
9. Committed, pushed, checked the deploy, and filed this report to the Notion inbox.

DONE
| Item | Result | Proof |
|---|---|---|
| Text A · standing instructions, the silence sentences | 251 -> 352 characters (the whole prompt 2,502 -> 2,603) | read back from published v8, equal to the paste byte for byte |
| Text B · questions part, "## PRICE", the whole section | 558 -> 757 | same |
| Text C · questions part, "## ANSWERING QUESTIONS", two bullets in place, same order | 729 -> 1,138 (185 -> 416 and 544 -> 722) | same · the other bullets of the section are unchanged |
| Text D · questions part, "## WHO IS CALLING", the unverified-caller bullet | 458 -> 678 | same · in place |
| Text E · questions part, "## THE SETUP CALL", the whole section | 1,178 -> 1,645 · seven bullets, the fifth is the new one | same |
| Text F · questions part, the team section, the second bullet | 360 -> 588 | same · in place · the questions part as a whole 13,722 -> 15,245 characters, 78 -> 79 lines |
| Nothing else changed | v8 differs from v7 in the standing instructions and in the questions part's prompt, nowhere else | compared field by field: 0 other nodes, 0 settings, 0 tools, 221 nodes before and after |
| Silence setting = 2 prompts | confirmed: 2 prompts, 10 seconds apart, the line ends 20 seconds after the second | read from published v8 · heard on two real calls |
| Cal.com holiday overrides | six dates added, closed all day: Thu Nov 26 2026 (Thanksgiving) · Fri Dec 25 2026 (Christmas) · Fri Jan 1 2027 (New Year's Day) · Mon May 31 2027 (Memorial Day) · Sun Jul 4 2027 (Independence Day) · Mon Sep 6 2027 (Labor Day) | added Oct 1, 12:27 PM Central · each day had 15 open times before and has 0 now · the day before and the day after each still have 15 · weekly hours and the event untouched |
| Version published | AIC-TEST-2 v8 · Oct 1, 12:38 PM Central | versions 0 to 8 all published, none deleted, no draft left above v8 |
| Test number answers it | yes | the number ending 8976 follows the newest published version, which is v8 · the number itself was not dialed in this run |
| Simulation o (big fleet, price) | FAIL · Retell: pass | the new rule held: the base price came with "No contract. Cancel any month." in the same breath · the miss is the older rule beside it: "one price fit to your company" instead of "sized to the company" · no number above the base |
| Simulation l3 (charter buses) | FAIL · Retell: fail | said it is built for limo and black-car first and fits charter bus too, then asked two check-in questions over two answers and never offered the setup call |
| Simulation C25 (caller claims to run the line) | FAIL · Retell: pass | refused three times, read out nothing, confirmed nothing, attached no offer, ended the call with a goodbye on the third push · the miss: each refusal ran three sentences, not one short line |
| Simulation s1 (asks for today) | pass | "Nothing's open today for the setup call. Would you like to hear the next available times?" · no "can't", no "cannot", no time today · the booking step did not repeat it · not the ruled line word for word on this run (it was on 4 of 5) |
| z1 (questions-part caller goes silent) | pass · real call | "Take your time. I'll be right here." twice, word for word, then the line ended · no third |
| z2 (demo caller goes silent) | pass · real call | "Whenever you're ready, we can continue with the trip." twice, word for word, then the line ended · no third |
| Simulation y1 (first words: book the setup call) | pass | "Sure, let's get that booked. Ready for the open times?" and the booking step took over on the next turn · no interview, no connect offer |
| Simulation y2 (mid-interview: just book me the setup call) | pass | the booking step took over at once: its first fixed question came next · no more interview questions |
| Simulation y3 (can I talk to someone right now) | FAIL · Retell: fail | "You can talk to the team live—I just need a few details first." · the rule is to say only that it can try to connect |
| Simulation f (book the setup call; calendar fails) | pass, both parts | only the calendar's times offered · "Confirmed" only after the calendar answered · with a failed calendar it never said booked |
| Simulation i (questions, then the demo) | pass | two answers, then "Let me try booking one" ran the demo through the read-back |
| Simulation q (three questions) | pass, all three | what it is · yes to quoting rates, above the base · how dispatch gets the trip |
| Simulation p (how did you hear about us) | pass, both parts | asked once on a demo call and once on a questions call |
| Board prospect masked | yes | one lane note: the person and the company now read "[prospect]" · live |
| Board calendar id masked | yes, 5 lines | 7 ids now read "[calendar]": the same id in all five lines, and two more calendar ids that sat in one of them · live |
| stamp.py guard | yes · dry call unchanged | --help and -h print the usage and stop · all 116 tracked pages identical before and after · in a throw-away copy the old script with --help rewrote 79 pages, the new one 0 |
| Live 0019 byte-identical | yes | agent v4 and flow v4 match the Sep 30 read field by field · the snapshot file rebuilt from today's read is the same 23,890 bytes · checked at the start and at the end |
| Commits and deploy | 138469c pushed to main at 12:55 PM Central, live about 24 seconds later · this report is the commit after it | the live board equals the commit byte for byte (69 items, 124 log lines) · /ops, /tools and /reports return 404 · both sites answer 200 |
| Grok items | 5, listed below | no word outside texts A to F was written |
| Rollback | listed below | nothing was deleted |

HOW STEADY EACH ITEM IS (five runs each on v8: one before publishing, four after)
- Held every time: the base price with the no-contract sentence (5 of 5) · the offer's name, never "a quick
  call" or "a chat" · "Nothing's open today" with no "can't" (5 of 5) · a booking request straight to the
  booking step, as first words (5 of 5; v7 was 2 of 9) and mid-interview (5 of 5) · two silence prompts
  with the fixed line (2 of 2 real calls).
- Did not hold: "try to connect" (4 of 10 answers) · the other-industry offer as the one question (0 of 5)
  · a one-line refusal to an unverified caller (0 of 5) · "sized to the company" in those words (3 of 5).

GROK ITEMS (node · what the line has to do)
1. Questions part, team section, second bullet (text F). Asked "Can I talk to someone right now?" with the
   team reachable, 6 of 10 answers told the caller they can talk to, reach or be connected with the team:
   "You can talk to the team live—I just need a few details first." (2), "You can reach the team live
   right now." (2), "You can be connected with the team once I have a few details." (2, one of them with
   "live"). The line has to say only that it can try to connect. Likely pull: the status line in the same
   part reads "The team can be reached live right now: true", and the answers echo it.
2. Questions part, other ground transportation (text C). The offer has the right name every time. But it
   came as half of an either-or question in 3 of 5 runs ("Want to hear how it would work for your
   operation, or book a twenty-minute setup call with the team?"), as a mention with "Want the next part?"
   in 1, and not at all in 1. The ruled sentence also gains words ("it fits charter bus and other ground
   transportation too"). The line has to say the ruled sentence as written and end the answer with the
   setup-call offer as its one question. Likely pull: the bullet above still tells a first answer to end
   with a short check and to keep the offer for the second or third answer.
3. Questions part, unverified caller (text D). Better than v6: the call now ends every time, and the
   connect offer showed in 1 of 5 runs. Still open: no refusal was one short line (each adds a reason, the
   site, or both), and in 3 of 5 runs the goodbye came on the second push, not the third. The closing
   section and the end-call note still say "third try" where text D says "third push".
4. Questions part, "## PRICE", second bullet (not changed in this run). "one price fit to your company" in
   2 of 5 runs. The words are "sized to the company".
5. Questions part, setup-call section, asked for today (text E). In 1 of 5 runs: "Nothing's open today for
   the setup call. Would you like to hear the next available times?" It passes the strict list. The ruled
   line is "Nothing's open today. Ready for the open times?"

IDS, COMMITS, ROLLBACK
- Test agent agent_9ebb41c9bd8af214649328f107: v8 is new, v7 is still there.
  Undo: pin the test number to v7, or publish a new version copied from v7.
- Cal.com schedule "AI Chauffeur Setup Call hours": six date overrides.
  Undo: delete those six overrides. The weekly hours stay. That reopens the days for live callers too.
- Repo: commit 138469c (build doc, battery file, board, tools/stamp.py). Undo: git revert 138469c.
  That would also put the prospect's name and the calendar ids back on the public board.
- Simulations: official run test_batch_7b39c9d9ec75 · repeats test_batch_c12865dbbd69 · the run before
  publishing test_batch_879da088973f.
- Real calls: call_490718c4a16aa9d355e029ad5a9 (z1) · call_7bfb9108c9604ee049e9e028966 (z2).
- n8n and GHL: not changed. The booking workflow still serves a0a29858, last written at 9:27 AM Central,
  before this run.
- Live desk: nothing to undo.

WHAT'S NEXT
1. Send the five Grok items to Grok. Item 1 is the big one: it missed 6 of 10.
2. Your 8 live calls on the test number ending 8976. They will be the first real phone calls on v8. On
   call f, ask for today once. On one call, go silent in the questions part.
3. Rule on gotcha 3 (the line tries the team after a mid-interview booking).
4. Then the promote paste for 0019. Not part of this run. Run the whole set of 49 on the version that gets
   promoted. This run ran only the cases the paste named.

GOTCHAS
1. The answers move from run to run. y3 passed before publishing and failed after, on the same words. That
   is why each wording case ran five times and the report gives rates, not one verdict.
2. y1 and y2 cannot pass a word-for-word reading of "no name or company question before the open times".
   The booking step itself asks "Who should the team ask for, and which company?", spells the company
   back, asks how the caller heard about us and asks whether a text is okay. Then it reads the times.
   Those are fixed lines of the booking step, the same on the live line, and this run did not touch them.
   I scored the hand-over: nothing from the team interview comes first.
3. In 2 of 5 runs of y2 the setup call was booked and then the line tried the team anyway ("I'm connecting
   you with the team now."). The caller had opened with "Can I talk to somebody right now?" The flow's own
   read of the call did not count "actually, just book me the setup call" as taking that back. That is a
   flow setting, not a spoken line. It was the same before this run. I left it alone.
4. z1 and z2 are real web calls, not simulations. A text simulation has no clock, so it cannot go silent.
   Both calls sent their after-call notice to the test sink. No booking, no alert, no text.
5. The holidays are closed by date, not by a yearly rule. The six dates run through Sep 6 2027.
   Thanksgiving 2027 and later need adding again.
6. One of the five log lines held three calendar ids, not one. I masked all three, so 7 ids are masked in
   the 5 lines. One calendar id is still in a lane note (the Canon lane) and in CLAUDE.md. Other long ids
   (workflows, the voice, a few more) are still in lane notes and older log lines. None of that was in
   this paste. Say the word and it goes.
7. The prospect's name is still on the client audit page itself and in the public git history. The lane
   note still names that page by the company's initials. Only the name and company in the board note were
   in this paste.
8. stamp.py now refuses any argument, not only --help. A plain run with no argument stamps as before.
   Nothing in the repo calls it with an argument.
9. The battery file had no section 10. The v7 scorecard lived only in that run's report. I added it as
   section 10 from the saved results, so section 11 follows in order.
10. The build doc changed in more places than 4.1, 4.2 and 8.1. The header, the version rows in section 1
   and the rollback steps in section 12 now say v8.
11. Scoring changes, all written into section 11.5 of the battery file: one new check each on o, l3 and
   C25 for the rule each got; one Sep 30 check narrowed (C25 counted the refusal "I can't … mark a booking
   confirmed" as a confirmation); and Retell's judge was told that the booking step's and the connection
   step's own fixed lines are expected, after it failed y1, y2 and y3 for them on the run before publishing.
12. The paste said git pull --rebase first. The folder holds uncommitted files from other work (nine tool
   scripts, some audit screenshots), so a rebase pull would refuse. I fetched instead: the repo was level
   with origin, nothing to pull. I did not touch or commit those files.
13. No page, stylesheet or script changed in this run, so there was nothing to render and review.
```
