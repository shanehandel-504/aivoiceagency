# AIC finish run (FINISH v5) — Thu Nov 12 2026 — W3 window "sales agent v3"

```
===== SHANE READBACK — COPY ALL =====
PART LIVE (STAGE R RATE CARD LIVE · STAGE T TIMING ROLLED BACK ON A SMOKE-CALL CRITICAL · STAGE A AGENT LOGIC INCOMPLETE: ITS GATE MISSED TWICE, SO THE AGENT STAYS v21)

IN PLAIN WORDS
- Prices are fixed. The demo now prices by the mile at each vehicle's hourly rate divided by sixty, and the minimum covers short runs.
  A sedan from the airport downtown is still three hundred twenty dollars. A seven-hundred-mile sedan run is one thousand eight hundred
  sixty-seven dollars, not four thousand thirty-two. All fifteen of your check prices match to the dollar, and every quote says the miles.
- Your timing went live and came straight back off. At 7:44 PM version 22 (the two-second wait plus the pickup at three and a half
  seconds) went on both lines. A smoke call then showed a critical: the agent said it would include a stop, quoted the pickup alone and
  read the stop back. The paste's rule rolled it back at 7:48 PM. That stop handling is version 21's, which the agent fix replaces.
- The agent fix is built but not live. On the test copy it passed fourteen of nineteen scenarios first time and thirteen of sixteen after
  its one fix. It still missed three:
  - with a flight number given, it priced before asking the landing time;
  - on a web call, it skipped the cell after a name;
  - asked to repeat the price, it refused.
  Two misses keep it on the test copy.

DONE TABLE
| # | DONE line                                                        | Status                                         | Proof |
| 1 | full booking first; price only after the four details            | NOT LIVE                                       | v21 priced without the time 3/3; candidate missed REAL-04 (finish\GATE-A.txt) |
| 2 | nothing past one pickup priced; guardrail line; L24              | NOT LIVE                                       | candidate: R9-TWO, R9-STOPAFTER, FIN-CHANGE, FIN-RETURN, FIN-CURVE, V3-08, PX-43 2/2 |
| 3 | the text every call, the email with an address; web cell once    | text + email PASS · web cell NOT LIVE          | round 9 Gate 1 · candidate FIN-WEB missed |
| 4 | booked only when this call booked; calendar = picked time        | records + alert PASS · agent words NOT LIVE    | round 9 Gate 1 C1-C5 · candidate R9-HELD 2/2 |
| 5 | talking over the caller at CUTIN=B                               | NOT LIVE (rolled back)                         | round 9: 10 -> 5 starts over the caller, 1.72 -> 2.31 s |
| 6 | questions-part pickup at PICKUP=3.5                              | NOT LIVE (rolled back)                         | round 9: first word 4.25 / 4.46 s, never over a caller |
| 7 | every quote says the miles; price follows CARD                   | PASS                                           | finish\GATE-R.txt: 15/15 anchors, never down, ladder, 4 live test quotes |

LIVE NOW (read back 8:16 PM)
- agent_9ebb v21 on 414-775-0019, DEMO-POOL-05 (…8976) and the website button (it reads the 0019 pin) · notice 7ecc4cf65776 · greeting 0100dcdc9ea6
- rate card rows: per_mile = hourly / 60 on all 8 rows · WF-RATE cdf38695 and the other rails unchanged
- test copy agent_ae31796e: v34 = the agent fix (not live) · v32 = v21 + your two timing settings (not live)

ROLLBACK COMMANDS
- card rows:  round9-2026-11-12\finish> node fin_r_card.mjs rollback --go
- agent:      sales-v3-2026-11-08> node p9_rollback.mjs --go   (ran 7:48 PM)
- rails (round 9 Stage 1): round9-2026-11-12\rails> node rollback9.mjs all --go
(each under doppler run --project ava-prod --config prd --)

SPEND: Retell $243.89 -> $251.31 of $260 · Claude API $110.72 -> $114.04 of $150.

NEXT (NEEDS-SHANE.txt)
- 1 AGENT=B: one short pass on the three misses (recommended).
- 2 TIMING=A: put the timing on with the agent fix (recommended).
- 3 the GoHighLevel tap.
- 4 the booking secret (both lanes).
- 5 your one call.
- 6 the hourly rates you asked for.
GROK ITEMS: live v21 still says "sample" in 12 spoken lines (the candidate has none) · the already-holds line (no P15 file).
YOUR ONE CALL: from your own phone to 414-775-0019. Say "airport". Give the whole trip in one go. After the price, ask to add a stop. Give
your name. Ask two questions. Pick a Discovery Call time. Then check the text, the page, the email and the calendar. Today it hears v21 with
the new prices. To cancel your test time, type in this window: cancel my test time.
LESSON: a timing change and the logic it rides on promote together; a smoke call cannot tell a timing fault from an old logic fault.

GOTCHAS
- A smoke-call critical rolls back at once, even when it comes from the old logic and not from the change being promoted.
- The website button reads the 0019 pin on every call, not the newest published version.
- The first request from the Dell to the rate webhook costs about 2 s of connection; the engine's own latency (421-673 ms) is the measure.
- The battery's simulated web calls carry no web marker in their final variables, so CC5 cannot see them; the behaviour check caught FIN-WEB.
- Regex patches written through a shell heredoc get their backslashes mangled. That bit twice tonight; write patch scripts as files.
- The sales-v3 build sources now hold the Stage A candidate (FIN_WORDS=1). v21 plus the timing knobs is in *.fin-v21knobs.bak.
```
