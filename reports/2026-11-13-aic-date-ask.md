# AIC DATE ASK — Fri Nov 13 2026 — window "AIC date ask"

```
READY FOR SHANE'S ONE CALL — the date ask fix is live as v27 on 414-775-0019, DEMO-POOL-05 and the website button

===== SHANE READBACK — COPY ALL =====
AIC DATE ASK · window "AIC date ask" · Fri Nov 13 2026 · 7:49 to 9:32 PM CT · paste PASTE-CC-AIC-DATE-ASK-v1-2026-11-13.txt + FIX-1 · your word of 9:05 PM ("Yeah, go for it ... make the updates of what you think should be done ... You are authorized to do whatever you like")

IN PLAIN WORDS
When a caller gave the whole trip in one breath with a day like "Friday", the agent got stuck. It asked for the landing date three times and never gave a price. That is fixed and live. Two exits decide "every detail is in, go price it". They now count a day alone or a time alone as the landing. A third, new exit sends a reply the full-booking step can't place to the code that already decides "ask for what is missing, or price it". No spoken line changed. On that same call, live used to stall 2 times in 3. Now it priced 4 calls out of 4, three on the test copy and one on live tonight, with no landing question.

WHAT IS LIVE
- Live agent_9ebb **v27** (built from v26) on 414-775-0019 and DEMO-POOL-05. The website button follows the 0019 pin, so it serves v27 too.
- v27 = v26 plus exactly three changes, all in exit conditions the agent never says out loud:
  1. N2 FULL RUN ASK, the "ready" exit: "the landing date and time" became "when the flight lands (a weekday, a date or a time of day; a day alone or a time alone is enough)". It also now quotes the real first ask, "Give me the full booking: ...".
  2. N3 INTAKE, the "ready" exit: the same two rewordings.
  3. N2 gets a fallback exit to the code gate (QX). A reply that matches none of N2's exits used to leave the call on N2, where the model wrote its own turns. Now it goes to the code that asks for the missing item by name or prices the trip.
- Everything else is byte for byte v26: the greeting, the notice (HASH 1), every spoken line, the tools and their live booking routing, the transfer target, the model and the voice. The number settings were compared and are the same.
- Tested as copy v46. Copy v47 (the two rewordings without the fallback exit) also passed, and is kept as the runner-up.

BEFORE AND AFTER (the talk-over call: "Airport pickup", then the whole trip spoken over the full-booking question)
| | Calls | Priced | Landing asks | Criticals |
|---|---|---|---|---|
| Before: live v26 (1 call) and the v25 twin (2 calls) | 3 | 1 | 6 (two calls stalled) | the cell never asked on the 2 stalls |
| Copy v46, the version now live | 2 full + 1 cut after the price | 3 of 3 | 0 | 0 |
| Copy v47 (runner-up) | 3 | 3 of 3 | 0 | 0 |
| LIVE v27 proof call (test lane) | 1 | 1 ("three hundred twenty dollars", the tool's) | 0 | 0 |
Text (copy v46): DATE-01 to DATE-07, 14 of 14 clean. Gate: 28 of 33 at the first run; GK-25 and V3-11 passed their second run; PX-43 and REAL-04 miss on live too. V3-08, a caller-driven per-mile scenario: 2 of 4 on v46, 2 of 3 on the live twin. A separate checker session also passed all seven of its lines on both copies.
Your check call V5 on copy v46: PASS. The ride to O'Hare got the demo line, then the drop-off ask, $749 Sprinter (the tool's), the same line on repeat, and the cell asked and given.

YOUR CHECK CALL (from the last build, word for word)
On the Dell, open aichauffeur.ai and press Call the demo. Say: "I need a ride to O'Hare tomorrow at four PM, four people, eight bags." You should hear the demo line about one airport pickup and drop-off. Say "okay", then give a hotel as the drop-off. After the price say: "Can you repeat that?" Then say: "Okay, book it." Give your cell when it asks. You should hear the Sprinter both times, the same price both times, and get the text with the trip page right after.

A SECOND CALL YOU CAN MAKE (the one this fix is for)
Press Call the demo. Say "Airport pickup", then talk over the question with "Mitchell Airport, landing Friday at two, going to the Pfister Hotel, two of us." You should hear one price and no question about the landing date.

DONE
| What | State | Proof |
|---|---|---|
| Live agent | v27 on 0019 + DEMO-POOL-05, button on v27 | read back twice, plus a read-only self-check sub-agent: all six lines hold |
| What changed | n2_ready, n3_ready, N2's else edge, nothing else | v26 vs v27 compared field by field: steps, exits, global prompt, tools, defaults, model, transfer |
| Hashes | notice 05386b07fa07 / greeting 768e6ad24cbd = HASH 1 = HASH 3 | da_promote.mjs read-back |
| Live proof call | call_8693295846f7e76e567e407a581: the quote tool once, $320 said once, 0 landing asks | Retell get-call, test lane |
| Spend, whole run | Retell $8.74 of $10 build and test + $0.43 of $1 promote = $9.17 · Claude API $2.01 of $4 | da_spend.py (the checker session spent $0.61 / $0.03 under its own ceilings) |
| After-call rails | WF-POSTCALL 93a10b1b, WF-RATE cdf38695, not touched | read at start and close |

ROLLBACK (one line, back to v26 on both lines; the button follows)
C:\Users\offic\aic-tuning\sales-v3-2026-11-08> doppler run --project ava-prod --config prd -- node fin_repin.mjs 26 --go

THE AGENT IS FROZEN. No change without Shane's word.

GOTCHAS
- The first promote try re-pinned v26 on its own after a few seconds. My number-settings check compared two differently shaped API answers (the list call has one extra field). No setting had changed. I fixed the check and re-ran it once on the same v27, and it passed.
- v27 keeps live's own booking routing on its tools. Only the steps came from the test copy, because the copy's booking tool points at the test lane.
- Found, not fixed (live did these before tonight too):
  - The agent says "Setup takes about fourteen to fifteen days" in its own words.
  - The read-back sometimes drops the hotel name.
  - REAL-04 still prices without the landing ask after the guardrail line.
  - On your check call, "Okay, book it" lands over the cell question, so the cell comes one turn later.
- Copy v45 is an unused duplicate of v46. Copy v47 is the runner-up. Live v27 was promoted at 9:23 PM CT.
```
