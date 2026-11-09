# 2026-11-08 · W3 "AIC sales agent v3 build" · RUN INCOMPLETE

```
===== SHANE READBACK — COPY ALL =====
RUN INCOMPLETE — the new AI Chauffeur sales agent is built and tested but NOT live: it missed the logic gate twice and the hold pitch isn't uploaded yet. The 0019 line, DEMO-POOL-05 and the website button still run today's agent (v17), untouched.

WHAT HAPPENED, PLAIN ENGLISH
- Built the new agent on a copy: your notice and greeting word for word, every line from the line set, the real quote tool from W1, the knowledge bases from W2, transfer only when asked.
- Merged the test bank: 297 scenarios from ChatGPT, Gemini, Perplexity, Grok and the spec's core list.
- Ran 328 text tests, fixed what they found, re-ran the 159 hardest. Money was right every time (182 quotes, 0 wrong totals), but too many smaller misses remain: offering a call too early or again after a no, asking for something twice, small made-up details. Second miss = stop, by the rules.
- Voice: 6 test calls answered fast (0.9 s typical, 1.6 s worst). The 100-call battery did not run: no point testing a version that won't ship.
- Hold pitch: rendered in Kate's voice through Retell (56.8 s, checked word for word). It needs your upload in the Retell dashboard, then the transfer test runs during team hours.

DONE TABLE
| Item | State | Proof |
| Live agent | untouched | 0019 + DEMO-POOL-05 on AIC v17; website button reads 0019 |
| Candidate | built, not live | agent_ae31796e0288ba74585b6b42ca v2, flow conversation_flow_4f67cddad2a9 |
| Greeting + notice | byte-identical | sha 0100dcdc… / 7ecc4cf6… |
| Test bank | done | 297 scenarios, PASTE\aic-build\AIC-TEST-BANK-v1.json |
| Knowledge bases | loaded | airport check 72/72 on v2 |
| Text tests | RED | v1 182/328 pass; v2 re-run 70/159 pass |
| Money | GREEN | 182 quotes = tool totals |
| Voice speed | GREEN on 6 calls | 0.91 s middle / 1.56 s worst 5% |
| Hold pitch | waiting on your upload | PASTE\aic-build\HOLD-PITCH-v2-1-KATE-2026-11-08.mp3 |
| Spend | inside ceilings | Claude API $41.83 of $150 · Retell ≈ $66 of $100 |

IDS / ROLLBACK
- Nothing was re-pinned. For the record: 0019 and DEMO-POOL-05 → agent_9ebb41c9bd8af214649328f107 v17; v17 export in PASTE\rollback\2026-11-08\.
- Test numbers bought: ZZ-W3-CAND-TEST …0807, ZZ-W3-CALLER …0907.

WHAT'S NEXT
- You: upload the hold pitch (steps in PASTE\aic-build\W3-DONE-TABLE.txt, works from a phone), then type "uploaded".
- Next run "AIC sales agent v3 · round 3": fix the remaining misses, test the tester first, full battery, 100 voice calls, transfer test during team hours, then your one call.

GOTCHAS
- Retell charges for text tests ($0.01 a message), so 1,000 text tests plus 100 voice calls can't both fit $100 on Retell.
- Today's live transfer dials the owner direct line, not the transfer cell in the spec. Not changed; flagged.
```
