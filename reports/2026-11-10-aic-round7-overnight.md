# 2026-11-10 · W3 "sales agent v3" · AIC round 7 overnight (discovery ladder) · RUN INCOMPLETE, v19 stays live

```
===== SHANE READBACK — COPY ALL =====
RUN INCOMPLETE — THE NEW DISCOVERY BUILD MISSED ITS GATE THREE TIMES, SO v19 STAYS LIVE · NEXT: YOU PICK "KEEP v19" OR "PROMOTE v15" (NEEDS-SHANE ITEM 1)

IN PLAIN ENGLISH
The live AI Chauffeur line (414-775-0019, DEMO-POOL-05 and the website button) never changed tonight: it is still v19.
I built the new question ladder on a test copy and tested it three times. The last copy (v15) asks better questions than v19 and is now fast enough on the phone.
It still failed the gate on old closing lines and on slips in the sample-trip and booking steps that v19 has too. Three misses means no promote, by the run's rules.
The texts and the booking emails did change tonight (Part A); both have one-command rollbacks.

DONE
| Item | What | Live? | Proof |
| Part A A3 | Caller texts end "Grab a time with the team: aichauffeur.ai/book/" (STOP line first text only) | LIVE | WF-POSTCALL v3 f7c67538 · dry run PASS |
| Part A A4 | One branded confirmation per appointment (website bookings), never on a cancel | LIVE, first tick 8:00 AM | WF-AIC-CONFIRM v1 pYUrb9tB9qtvxYU3 · 25 existing ids pre-marked · mock test PASS |
| Part A A5 | /book/ test booking | WAITS for "618G ok" + "draft done" | NEEDS-SHANE A-1 |
| Part B B0 | Shane's check call measured: 6 coverage questions, SantaCruz "connects" claimed | — | round7\FINDING-ROUND7.txt |
| Part B gates | GATE-1 v13 / GATE-2 v14 / GATE-3 v15 | MISS x3 | round7\GATE-1..3.txt, 282 transcripts |
| Best build v15 | core 13: 7 vs v19 3 (same rules) · voice median 2.25 s, worst 5% 3.93 s · silence 3/3 · hold 3/3 | test copy only | GATE-3.txt |
| Morning | B11 6:30 AM + checks to 9:00 AM | no prospect calls, no critical, no text | round7\LIVE-CALLS.txt |
| Spend | Retell $171.83 of $180 · Claude about $79 of $150 · nothing bought | — | spend.py |

IDS / ROLLBACK
- Live: agent_9ebb41c9bd8af214649328f107 v19 (flow conversation_flow_9cf4ddd5b734 v19). Nothing to roll back.
- Test copy: agent_ae31796e0288ba74585b6b42ca v15 (flow conversation_flow_4f67cddad2a9 v15).
- If you type "promote v15", the export is saved first: PASTE\rollback\2026-11-10-round7\R7-ROLLBACK-*-2026-11-10T07-29-00-765Z.json
- Back to v19 in one command: doppler run --project ava-prod --config prd -- node p7_rollback.mjs --go (C:\Users\offic\aic-tuning\sales-v3-2026-11-08\)
- Part A rollbacks: node r_a3_rollback.mjs --go · node r_a4_rollback.mjs --go (C:\Users\offic\aic-tuning\round7-parta-2026-11-10\)

WHAT'S NEXT
1. You: "keep v19" or "promote v15". Doing nothing keeps v19.
2. You: the ALWAYS-SEND test call to 0019 from your cell (NEEDS-SHANE item 2).
3. You: "618G ok", then switch the GHL "AIChauffeur — Booking Response" workflow to Draft, then "draft done".
4. Words items W-1..W-6 + CH-LOC-04 go to Grok/ChatGPT.
5. Round 8 from round7\NEXT-ROUND.txt: closing lines first, then the booking loop, SantaCruz, L34, the name half.

GOTCHAS
- Every field an extract node writes back costs time on every turn: 38 fields added 0.8 s. Measure the extract before the voice gate.
- The gate's hard set includes demo and booking criticals that v19 has too. A questions-part round can't clear them.
- B3 contradicts itself on SantaCruz: L8.5 says "it connects". The next round gives SantaCruz "The team checks it on the Discovery Call."
- Robot callers can't stay silent. The silence tests mute the caller's audio in the test page.
- tools/qa/lines.json still holds the v15-era AIC greeting, and grade_call.py stops at its own $10 cap unless QA_CAP_USD is set.
- Retell has about $8 left under the $180 ceiling: one smoke call, not another gate.
- WF-AIC-CONFIRM's four live senders have never sent for real. The morning test booking is their first proof.
- The night watch's two scheduled tasks could not delete themselves and next fire Nov 10 2027. Delete them by hand.
```

Detail: `PASTE\aic-build\STATUS-W3.txt` (readback at the bottom), `DECISIONS.txt` (R7N lines), `round7\` (findings, gates, transcripts, NEXT-ROUND). Repo change in this commit: `tools/qa/rubric.md` gains R12 (the AIC discovery-ladder rules), additive.
