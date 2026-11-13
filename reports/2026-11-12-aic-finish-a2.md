# AIC finish A2 — Thu Nov 12 2026 — W3 window "sales agent v3"

```
===== SHANE READBACK — COPY ALL =====
FINISHED · LIVE ON v24 · READY FOR SHANE'S ONE CALL (A2 AND T2 LIVE)

IN PLAIN WORDS
- The agent fix is live. Version 23 went on both lines at 9:00 PM; version 24, with your timing on top, followed at 9:05 PM.
- What a caller now gets:
  - the full-booking ask first;
  - no price until the airport, the drop-off address, the passenger count and the landing day or time are in;
  - your guardrail line on any stop, wait, extra leg or change, with one price per call (asked again, it repeats the same quote);
  - on the website button, the cell asked once after a name;
  - your new words, with "sample" gone from every spoken line.
- Your timing is on: a two-second wait on the detail steps, and the quiet pickup at three and a half seconds. On the smoke call the
  pickups came at four point three five and four point four seven seconds, never over the caller.
- It passed:
  - all nineteen test scenarios;
  - three test web calls with no critical;
  - four smoke calls on the live versions with no critical.
- Why this pass worked: the "do we have every detail?" check is now a fixed rule in the flow, not a judgment call by the model.
- One thing to know: if a caller adds a stop before the price and then doesn't answer the guardrail question, the price can wait. On one
  smoke call it never came; on the next it came after a re-ask. That is the next fix; it is not built.

DONE TABLE
| # | DONE line                                                       | Status | Proof |
| 1 | full booking first; price only after the four details           | PASS   | finish-a2\GATE-A2.txt: R9-NOTIME, R9-NOPAX, REAL-04, REAL-01 2/2 on v36 |
| 2 | nothing past one pickup priced; guardrail line; L24             | PASS   | R9-TWO, R9-STOPAFTER, FIN-CHANGE, FIN-RETURN, FIN-CURVE, V3-08, PX-43 2/2; web calls 0 criticals |
| 3 | the text every call, the email with an address; web cell once   | PASS   | round 9 Gate 1 · FIN-WEB 2/2 · W2 L5N once, word for word |
| 4 | booked only when this call booked; calendar = picked time       | PASS   | round 9 Gate 1 C1-C5 · R9-HELD 2/2 |
| 5 | talking over the caller at CUTIN=B                              | LIVE   | round 9: 10 -> 5 starts over the caller, 1.72 -> 2.31 s · smoke on v24: 0 cut-ins |
| 6 | questions-part pickup at PICKUP=3.5                             | LIVE   | round 9: 4.25 / 4.46 s · smoke on v24: 4.35 / 4.47 s, none over the caller |
| 7 | every quote says the miles; price follows CARD                  | PASS   | finish\GATE-R.txt |

LIVE NOW (read back 9:09 PM)
- agent_9ebb v24 on 414-775-0019, DEMO-POOL-05 (…8976) and the website button (it reads the 0019 pin)
- notice 05386b07fa07 · greeting 768e6ad24cbd (your P14) · timing 0.7 on N2/N3/N5, pickup 3500 on N7/N7E
- the rate card rows (per_mile = hourly / 60) · WF-RATE cdf38695 and the round 9 rails unchanged

ROLLBACK (each under doppler run --project ava-prod --config prd --)
- T2 back to A2:   sales-v3-2026-11-08> node fin_repin.mjs 23 --go
- To v21:          sales-v3-2026-11-08> node fin_repin.mjs 21 --go
- The card rows:   round9-2026-11-12\finish> node fin_r_card.mjs rollback --go
- The rails:       round9-2026-11-12\rails> node rollback9.mjs all --go

SPEND: Retell $251.31 -> $260.23 of $265 · Claude API $114.04 -> $117.74 of $150.

CHANGED SPOKEN LINES: none beyond v34's list (64 distinct spoken texts on v34-v37). Now live: the P14 notice and greeting, L0 (P17), G1, G2,
L6 (P19), W-4 (P20), W-6 (P21) and the STRIKE edits to L4, L4-NF, L4B, L30, L2 and L3b. Byte for byte at the top of STATUS-W3.txt.

GROK ITEMS
- A re-ask for a caller who goes quiet after the guardrail line.
- The already-holds line (no P15 file).
- A ruling on the read-back naming the tool's town, not the caller's hotel.

NEXT (NEEDS-SHANE.txt)
- NEXT=GO for the guardrail-silence fix.
- The GoHighLevel tap.
- The booking secret (both lanes).
- Your one call.
- The Retell balance, which the API cannot read.

YOUR ONE CALL: from your own phone to 414-775-0019. Say "airport". Give the whole trip in one go. After the price, ask to add a stop. Give
your name. Ask two questions. Pick a Discovery Call time. Then check the text, the page, the email and the calendar. To cancel your test
time, type in this window: cancel my test time.
LESSON: a must-have check belongs in an extracted variable and an equation, not in a prompt edge; reword a condition and the miss just moves.

GOTCHAS
- A stop given before the price, then silence or a name instead of an answer to G1, can leave the price unsaid (one smoke call).
- In a long quiet stretch the two pickups each ask a new question instead of repeating the open one.
- Not asked: AM or PM for a time like "Thursday at four". The read-back says "Mitchell Airport", not the full name.
- The grader needed six fixes of its own before it judged the agent fairly; read every graded miss before touching the agent.
- The Retell account balance (law A6) cannot be read by any API this lane has. The run stayed under the $265 meter.
- Patch scripts must be files: a shell heredoc mangled backslashes again tonight, once turning a path into a form feed.
```
