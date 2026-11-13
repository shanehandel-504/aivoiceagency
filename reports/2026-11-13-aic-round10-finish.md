# AIC round 10 FINISH — Fri Nov 13 2026 — window "AIC round 10 finish"

```
READY FOR SHANE'S ONE CALL — the round 10 agent is live as v25 on 414-775-0019, DEMO-POOL-05 and the website button; the after-call words are live

===== SHANE READBACK — COPY ALL =====
AIC ROUND 10 FINISH · window "AIC round 10 finish" · Fri Nov 13 2026 · 5:08 to 5:47 PM CT · paste PASTE-CC-AIC-ROUND10-FINISH-v1-2026-11-13.txt (your PROMOTE=GO, 5:07 PM)

PLAIN ENGLISH
- The tested build is live. At 5:13 PM it went live as version 25, exactly as tested (test copy v42).
  - 414-775-0019, DEMO-POOL-05 and the "Call the demo" button all answer on it now.
  - The recorded notice and the greeting are byte for byte the same as before.
- The proof call on live (test lane, the LAX script by voice) did what the build was made to do: the guardrail line came before any price, then it asked for the drop-off.
  - It went wrong after that, the same way it does on version 24. The test caller's synthetic voice said "LAX" and the phone heard "Lex".
  - Lex is the code for Lexington's airport, so the rate engine priced 2,169 miles, $9,024, from Lexington.
  - I ran the same script on version 24's twin. It made the same "Lex" price, and it also priced the ride to the airport with no guardrail line, which is the Nov 13 fault.
  - Nothing the new build did is worse than version 24, so I kept it live.
- The after-call words you approved (A1 to A7) are live in the after-call flow since 5:24 PM.
  - In the test lane, the text, the email subject, the trip page and the email all show the new lines.
  - The word "sample" shows up zero times in anything a person sees.
  - The call-only text and page did not change, apart from the shared dashboard button (A7).
- The hotel by name (step 5) was NOT run, for two reasons:
  - its own rule skips it when the proof call is not clean;
  - the build script the paste names is from Nov 8. It would wipe out the rate engine changes from Nov 10 and 12 (the as-directed price and the town fallback).
  The rate engine is unchanged.
- Timing on live (ten scripted calls): the intake answer gap is 2.62 s typical and 3.79 s at the slow end, against version 24's 3.00 s and 3.96 s on the same ten scripts.
  - It is faster, but still above the 2.0 / 3.0 bar. No dial was changed.
  - Two of the ten calls never reached a price, because the model kept asking on its own in the first step.
  - I ran those two scripts twice more on both versions, and every run priced (4 of 4 each). So it is logged, not blamed on the change.

DONE TABLE
| Step | Result | Proof |
|---|---|---|
| 1 Preflight | DONE | The W3 window was idle (last write 4:51 PM). Live was v24 on both lines, with notice 05386b07fa07 / greeting 768e6ad24cbd = HASH 1. The button reads the 0019 pin. 8 rollback exports were present. r10_promote.mjs dry run CHECKS GREEN; fin_repin.mjs 24 dry run clean |
| 2 Promote | DONE 5:13 PM | agent_9ebb v25 is published (flow v25, 67 steps, title "round 10 (tested as copy v42)"). 0019 and DEMO-POOL-05 are on v25 alone, with the inbound webhook kept. WF-TRY-WEBCALL GETs the 0019 pin and starts the call on that version, so the button = v25. HASH 3 = HASH 1, read back independently |
| 3 Proof call | KEPT LIVE (no miss that v24 does not make) | live call_dd927d849d761b664dd22f74d13 vs v24's twin call_14822fb3e8e964b6e7d104fd6fc, same script |
| 4 After-call words | DONE 5:24 PM | WF-POSTCALL 98ca8dae -> bebc4798. Red/green in the test lane: before, every OLD string showed and "sample" showed 1/1/6/6; after, every NEW string showed and "sample" showed 0/0/0/0 (text/subject/page/email), with no bold fragment in the box |
| 5 Hotel by name | NOT RUN | its skip rule + the stale build source (details below) |
| 6 Timing | DONE (reported, not gated) | Ten calls on live v25: intake median 2.62 s, 95th 3.79 s, max 4.05 s, 3 cut-ins (v24 on the same scripts: 3.00 / 3.96 / 7.89, 2 cut-ins). Priced 8 of 10; A09 and A10 re-run twice on v25 and twice on v24's twin: priced 4 of 4 on each. The seven proof calls: median 2.34 s, 95th 3.69 s |
| 7 Close | DONE | this file, STATUS-W3.txt, report, board, Slack |

PUBLISH CHECKPOINT
- Live version: agent_9ebb v25 (flow v25). Before: v24.
- Both numbers and the button: 0019 v25 · DEMO-POOL-05 v25 · the button follows the 0019 pin (v25).
- Three hashes equal: notice 05386b07fa07 · greeting 768e6ad24cbd, at step 0, at the build (HASH 2) and served on v25 (HASH 3).
- Proof call: call_dd927d849d761b664dd22f74d13. Verdict: KEPT LIVE. G1 was word for word before any price or tool call; the shared misses are listed below.
- WF-POSTCALL: before 98ca8dae-f4fc-4260-b0b7-10a521ba556b, after bebc4798-7d9d-4f54-a873-bfc2fc2869a1.
- Step 5: not run. WF-RATE still serves cdf38695.
- Timing: live v25 intake median 2.62 s, 95th 3.79 s, max 4.05 s (n 31, 10 calls) vs the v24 baseline 3.00 s / 3.96 s; the proof calls 2.34 s / 3.69 s
- Spend: Retell $4.81 of this run's $8 (20 voice calls, no text runs); Claude API $0.00 of $3. Round 10 in all: Retell $23.49 of $30, Claude $6.69 of $12
- Rollback lines: below.

THE PROOF CALL, IN ORDER (live v25, web call, test lane)
1. "Airport pickup. Or drop off." The agent started "Give me the" in the caller's pause and then gave the full booking ask. This cut-in is old (version 24 does it too).
2. "I'm going to LAX ... four people ... eight bags ... picked up today at four PM." The phone heard "Lex".
3. GDEP said G1 word for word. No price and no tool call came before it.
4. "Okay." The agent asked: "Can you give me the drop-off address?"
5. "The Beverly Hilton, in Beverly Hills." The step stayed put, and the model wrote "Is that everything for the trip?" twice, plus "Are you still there?".
6. "Okay. I wanna proceed." The agent asked for the landing date and time.
7. The scripted caller's next line was the cell number, and it was taken as the landing time.
8. One quote came straight from the tool: "2169 miles to Beverly Hills, the Mercedes-Benz executive Sprinter, $9,024 ..." (the tool was sent airport "Lex", direction "departure").
9. The script ran out and hung up during the quote line, so the repeat, the cell ask and the done line were not reached on live.
   Those three were proved by voice on the test copy earlier today (P-REPEAT2, P-PROCEED) and in text (2 of 2 each).
- Version 24's twin, same script: NO guardrail line; the same "Lex" price; the landing date asked three times plus "Are you still there?"; model-written "I have LAX to the Beverly Hilton ... What else can I answer for you?" and "That's from Lex to Beverly Hills"; the same cut-in.

WHAT A CALLER CAN STILL HEAR WRONG (FOUND, NOT FIXED)
1. A misheard airport is priced as heard. "LAX" heard as "Lex" became Lexington, 2,169 miles, $9,024. The rate engine has no distance sanity check for an airport pickup. NEW today. (The heard word came from a synthetic voice; a person saying "L A X" was not tested.)
2. A ride to the airport is one fact in three places, and round 10 fixed one:
   - the gate (fixed);
   - the quote tool's direction field (still "departure", seen live today);
   - the N5 read-back (1 of 3 text runs said "From the hotel ... to LAX").
3. After a detail is given, N3 can stay put and the model writes its own turn ("Is that everything for the trip?", "What else can I answer for you?"). L23 can come up to three times. Version 24 does the same.
4. A non-answer to the landing ask (digits) counts as the landing time.
5. Talking over the recorded notice itself gets a model-written answer before the greeting. The fix is the notice step's interruption setting, which this run may not touch.
6. The agent can start over a caller who pauses after "Airport pickup." (seen live today, 1.6 s in). The cover line can start before a caller's last word.
7. PX-43, the hard pusher: reworded lines instead of G2/L24. Version 24 fails it too.
8. A caller who talks over the cell ask with a name loses the text.
9. GK-25: G1 can be said twice when "to the airport" reaches N3 through the trip edge.
10. "sample" is still in the model's own instruction text (note B of Patch 7, not wired by this file).
11. Test quotes against the live rate engine are not marked as tests in its quote log.
12. The hotel by name (R45) is not built. The rails-v3 WF-RATE build sources are behind the live engine.
13. In the first step (N2) the model can keep asking on its own instead of moving on: 2 of 14 calls on v25 did not reach a price within 90 s (0 of 14 on v24), and neither came back in 4 re-runs. It is the same class as item 3.

ROLLBACK LINES (all run under doppler run --project ava-prod --config prd --)
- Agent, both lines and the button: sales-v3-2026-11-08> node fin_repin.mjs 24 --go (dry run clean 5:12 PM)
- After-call words: the saved id: n8n MCP publish_workflow wVZg0OxSKFBcgINB versionId 98ca8dae-f4fc-4260-b0b7-10a521ba556b. One-line fallback: round10-2026-11-13> node fin10_pc_rollback.mjs --go (dry run clean)
- Rate engine: untouched, nothing to roll back.

WORDS WIRED AND WAITING
- AIC-AFTER-CALL-WORDS-APPROVED-v2, A1 to A7 + the A3 code note: WIRED (live 5:24 PM).
- Patch 7 row P1 and note B: NOT wired (this file holds them for round 11's single gate). P2, P4 held; P3 is back with Grok; P5/P6 are not used.

MONEY
- This run: Retell $4.81 of $8: 20 voice calls (1 live proof, 1 v24 comparison, 10 live timing, 8 re-runs). Claude API $0.00 of $3 (no judge was needed; every call was read by hand)
- Round 10 in all: Retell $23.49, Claude $6.69 (your ceilings $30 / $12).

SHANE'S ONE CHECK CALL (word for word from the v2 paste)
On the Dell, open aichauffeur.ai and press Call the demo. Say: "I need a ride to O'Hare tomorrow at four PM, four people, eight bags." You should hear the demo line about one airport pickup and drop-off. Say "okay", then give a hotel as the drop-off. After the price say: "Can you repeat that?" Then say: "Okay, book it." Give your cell when it asks. You should hear the Sprinter both times, the same price both times, and get the text with the trip page right after.

GOTCHAS
- A synthetic voice saying "LAX" is heard as "Lex", the same trap as "O'Hare" heard as "Oh, here". In voice scripts, say "Los Angeles airport".
- A voice script must answer every ask the flow can make. A ride to the airport becomes an airport pickup, so the flow asks for the landing time, and a script without that answer drifts one step.
- WF-RATE's build sources (rails-v3 quote-core.js, s5c-build-rate.mjs) are from Nov 8. Live was patched in place on Nov 10 and 12, so never rebuild from them.
- WF-POSTCALL is MCP-enabled now (availableInMCP true). A public-API PUT still publishes at once.
- The first session's board script replaces its own log line. This run added a new ISO log entry instead (additive).

LESSON: judge a live miss by running the same script on the old version. Today that showed the "Lex" price was not the change.
```
