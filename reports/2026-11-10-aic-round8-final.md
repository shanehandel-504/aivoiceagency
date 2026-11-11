# 2026-11-10 · W3 "sales agent v3" · AIC round 8 FINAL v2 (the last tuning run) · RUN INCOMPLETE: the build missed its gate twice, v20 stays live

- Shane's paste PASTE-CC-AIC-ROUND8-FINAL-v2 + "plus 40" (Retell ceiling $220). Window "sales agent v3".
- Built on the test copy (agent_ae31796e) and the test lane: sections A (agent), B (rails, via a forked writer) and C (grader). Live agent_9ebb v20 and the five live n8n rails were not changed.
- Repo change in this commit: `tools/qa/lines.json` (the live AIC greeting, v20; the old greetings kept under `greetings_before_round8`) and `tools/qa/rubric.md` (AIC LINE FACTS price = L27, setup 14-15 days, the software list, SantaCruz not confirmed, flight tracking approved, the Discovery Call can be today; R7 no longer lists "offers the team"; R12 round 8 note; R13 added).
- Detail lives in `PASTE\aic-build\round8\` (FINDING-ROUND8, GATE-R8-1, FIX-1, GATE-R8-2, GATE-R8-2-NOTES, AFTER-THE-FREEZE, rails\RAILS-READY, rails\MSG-TESTS) and `DECISIONS.txt` (R8 lines).

```
===== SHANE READBACK — COPY ALL =====
RUN INCOMPLETE — THE ROUND 8 BUILD MISSED ITS GATE TWICE, SO v20 STAYS LIVE AND NO RAIL CHANGED · NEXT: YOU PICK "KEEP v20" OR "PROMOTE ROUND 8" (NEEDS-SHANE R8-0)

IN PLAIN ENGLISH
Nothing a caller hears changed tonight. 414-775-0019, DEMO-POOL-05 and the website button still answer on v20, and the texts, the page and the rate engine are today's.
Everything in sections A, B and C is built and tested on the test copy and the test lane. It beats v20 on the same rules: your 3:20 PM call pattern passes 2 of 3 (v20 passes 0 of 3), and v20 has a critical in 44 of 90 sims.
The gate allows one fix and one re-run. Both missed, so by the paste nothing went live. The misses that decided it were all real:
- After the sample trip was done, "What would it be without the extra stop?" got "The team checks it" instead of a re-quote.
- A trip that arrived in two pieces got quoted before the passenger count was given.
- One turn in 54 ended on a fact with no question.
- In a silence test, the caller stayed quiet through both nudges and then heard silence.

WHAT ROUND 8 WOULD CHANGE FOR A CALLER (in the order a caller meets it; all on the test copy, none live)
1. Extra stop: an extra stop or a wait is kept on the trip and priced once as hourly as directed (L4B-X), with no "how many hours". Your Kewaskum address now prices to the town, 51 mi, $384 (it was "couldn't find that address", $576).
2. The trip read-back carries the stop. The text is promised once, and the agent never reads a phone number aloud.
3. Questions part, software: "my CRM" gets L8.5 and then "What reservation software are you on?". SantaCruz gets W-2 the first time and W-2B after that.
4. Questions part, the caller's words: 20 cars or more, or calls landing in the wrong place, get the auto attendant line (L34). Voicemail gets L17A.
5. Questions part, the name: on a phone call, the name and company come after your second answer, with T1-P.
6. No dead air: when the questions run out, every turn ends on "What else can I answer for you?". "You still there?" gets "Yes." plus the open question.
7. The close: L39 alone after a booking. L41 + L39 when the caller asked the team to reach out. L40 or L40Q + L39 when a text is going. "Have the team reach out" never hears "I can't arrange".
8. After the call: one text after every call (TEXT-TRIP or TEXT-CALL), the new page (Extra stop row, "Hourly as directed", every word with Agent and Caller labels), the email, and STOP honored on all four text paths.

THE GATE (candidate vs live v20, same scenarios, same rubric and code rules on both sides)
| Rule | Gate 1 (v18) | Gate 2 (one re-run after FIX-1, v20 test copy) |
| (a) no scenario under v20 | MISS (REAL-01, V3-11, V3-49) | MISS on V3-33 only: a judge error (it says L34 was never said; the turn holds L34) |
| (b) no new critical | MISS (REAL-01, V3-30, V3-49) | MISS on RATES-01 only: a judge error (it calls "the owner and staff test it before it touches their line", an approved fact, invented) |
| (c) hard checks 3 of 3 | MISS (PX-43: a grader bug, fixed) | MISS: V3-36 one turn with no question · voice: 8.59 s of silence after the second nudge |
| (d) REAL-03 / REAL-04 two of three | REAL-03 2/3 · REAL-04 1/3 | REAL-03 2/3 PASS · REAL-04 1/3 MISS |
| (e) voice | median 2.31 s, worst 5% 3.85 s (near-pass, counts only if all else green) | same voice |
| (f) hashes + rollback | PASS | PASS |
| (g) messages | PASS, 15 of 15 on the test lane | PASS |
Voice: 13 web calls, 99 turns. SILENT-01 2 of 2 and HOLD-01 1 of 1 pass. The extract takes 0.89 s a turn; A12's extract change did not move it, so it came out.
Message tests (round8\rails\MSG-TESTS.txt):
- Composed: questions call, sample trip, extra stop with "Hourly as directed", no-address price on the page, booked call with "Book an appointment", own-number booking texted to the caller, web call with a cell, email on file, email by reply, exactly one text per call.
- Nothing sent, correctly: web call with no cell, "don't text me", a blocklisted number, a STOP contact on all four text paths, a five-second hang-up.
Texting approval on 0019 (Retell): custom_sms_enabled = false. No other approval field exists on the number.

IDS / ROLLBACK
- Live, unchanged: agent_9ebb41c9bd8af214649328f107 v20 on 0019 + DEMO-POOL-05 + the website button.
- Tested candidate: agent_ae31796e0288ba74585b6b42ca v20, flow conversation_flow_4f67cddad2a9 (test copy, bound to no number).
- Fresh v20 export: PASTE\rollback\2026-11-10-round8\R8-ROLLBACK-*-2026-11-11T00-46-20-302Z.json.
- Agent rollback if a promote ever happens: node p8_rollback.mjs --go (back to v20; dry run passed). Back to v19: node p7_rollback.mjs --go. Both run in C:\Users\offic\aic-tuning\sales-v3-2026-11-08\.
- Rails: nothing promoted. When they are, the commands run in C:\Users\offic\aic-tuning\round8-2026-11-10\rails\:
  - promote all: node rails_all.mjs promote --go
  - roll back all: node rails_all.mjs rollback --go
  - one rail: node rollback.mjs <rate|slots|confirm|reply|postcall> --go
- Spend: Retell about $210 of $220. Claude API about $93 of $150. Nothing bought.

WHAT'S NEXT
1. You: "keep v20" (doing nothing keeps it) or "promote round 8" (W3 promotes the candidate and the five rails together, each with a one-command rollback). This is like round 7's "promote v15".
2. You: optional. "buy test numbers" (a phone-path voice re-check) · "do B7 now" (the GHL Booking Response to Draft and the /book/ test booking; it otherwise waits for a promote).
3. Grok: XS-1, the extra-stop line, and a page label for the hours a caller gives.
4. Next round, from round8\AFTER-THE-FREEZE.txt:
   - a re-quote ask after the sample trip ends
   - holding the quote until a passenger count or vehicle is given
   - the question-every-turn guard on bank lines
   - the third nudge (written, untested)
   - speed
5. SHANE'S ONE CALL, after a promote. From your cell to 414-775-0019:
   1. Say "airport". Give a trip with an extra stop and leave out the landing time.
   2. Give the time when it asks. Hear a price.
   3. Ask "does it connect to SantaCruz?"
   4. Answer two questions, then stay quiet for eight seconds.
   5. Say no to the call with the team, ask one more question, then say "that's all".
   6. Check the text, the page and the email.

GROK ITEMS
- XS-1: the line for an extra stop, a wait or a second drop-off. round8\XS-1.txt was not there at the wire or before the gate, so the agent says L4B-X.
- A row label for the hours a caller gives on an as-directed trip. The page keeps the hours in its data but does not show them.

GOTCHAS
- The two decisive misses were in the sample trip, not the questions part: a re-quote asked after N6, and a trip given in two pieces.
- Judge errors: two of gate 2's four misses were the model judge mis-reading approved words (L34 without its question, the "test it before it touches their line" fact). The rubric's LINE FACTS should list both before the next gate.
- I printed FIX-1 before the voice results were in. The voice misses were found after the fix was written, so F4 (a third nudge = the close) is written but never built or tested. Next time, wait for the whole gate before writing the fix.
- The auto-mode permission check refused buying the two ZZ phone-path numbers, so the "real phone path" calls ran as web calls (Retell's same voice system, no phone line).
- The A12 extract change and the shell-escaped regex word boundaries both cost a build. Write regex-bearing patches as files, never inline in a shell heredoc.
- Masking: my first call export kept your private cell number in full in round8\calls (the rails writer caught it). It has been re-masked; it never left PASTE.
- Shane's 5:40 PM test appointment was already cancelled when read. The AVA line still hands limo callers to AI Chauffeur version 17 (an AI Voice Agency lane item).
- LESSON: one fix for one gate only works if the gate is read whole first. The fix went out before the voice results, so the voice misses had no fix left.
```
