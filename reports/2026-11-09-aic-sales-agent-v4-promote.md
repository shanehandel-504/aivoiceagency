# 2026-11-09 · W3 "AIC sales agent v3 build" rounds 5 + 6 · V4 LIVE, TRANSFER PROVEN, PARKED

```
===== SHANE READBACK — COPY ALL =====
PARKED. The new agent (v4, live as agent_9ebb v19 since 12:08 PM CT) keeps answering 414-775-0019, DEMO-POOL-05 and the website button. The transfer to your cell is proven with a real conversation. Round 6's extra fixes were built and tested, but they missed the bar twice, so by the rule they wait for a later run.

WHAT CALLERS GET NOW (v19)
- The same recorded-call notice and greeting as before (hashes checked at build and at promote).
- "I'm checking that now." while it looks up the calendar or books, so no silence.
- It answers the caller's question, then asks its own. It books the Discovery Call when the caller picks a time.
- Two vehicles, extra stops or hourly: the team-prices line once, never a made-up quote. The flight-tracking line only with a flight number.
- Asking for a person: "Getting someone from the team on the line now.", ringing while your cell gets a short private note, then you're talking to the caller.
- Still on the list: an opening "What does it cost?" gets the trip question first, with the price one turn later. The fix is built (price first) but waits.

THE TRANSFER
- The 12:04 test: the bridge worked, but nobody spoke after it, and the TEST CALLER hung up on its own 15-second silence hang-up. That was not the agent.
- The 12:42 re-test on live v19: you heard the note, said "Hello?", the caller answered, and you said "Yes." PASS. 14 seconds bridged.

THE CALLER TEXT LINE (Shane's rule)
- Not changed (it waits with the other round 6 changes).
- What callers get today when nothing was booked: the trip sheet text already says "Want it on your line? Grab a time with the team: aichauffeur.ai/book/", then the STOP line on the first text. A link-only text ends with the bare link.
- Prepared change: the exact line "Grab a time with the team: aichauffeur.ai/book/" last, before the STOP line, in both texts.

GATE TABLE (hand-checked grader; text sims with tools mocked; voice = calls in Kate's voice)
| Build | Criticals (core + REAL-01) | Core | Typical gap | Slowest 5% | Shipped |
| v17 (live until Nov 9) | 23 of 43 sims | 1 / 13 | 2.34 s | 4.34 s | rolled forward |
| v4 = v19 (round 5) | 0 | 7 / 13 | 1.25 s | 2.25 s | LIVE |
| v10 (round 6: transfer rules, price first) | 0 | 6 / 13 | not run | not run | no |
| v11 (round 6 printed fix) | 0 | 4 / 13 | not run | not run | no |
Second miss = v19 stays live. One-run text scores swing 2-4 points between near-identical builds; the next gate runs the core 3 times and uses the middle score.

DONE TABLE
| Item | Result | Proof |
| Cancel 3 ZZ TEST appointments (Tue Nov 10) | cancelled, not deleted | hFSFWvzbfx4NAJ0zqTc8 · 4xAP0aw5lhK4QwoCoLfa · ByTlXg32kTuMw6zCjZtg |
| Promote v4 | LIVE | agent_9ebb41c9bd8af214649328f107 v19, flow conversation_flow_9cf4ddd5b734 v19 |
| Smoke call | PASS | call_c4c090fd0e7af6a265e26294502 |
| Transfer, proven on live v19 | PASS | call_b86c8b488b37f606369aa9cff68 |
| Shane's live check call | logged | call_0df490d283b21cb1edd0806d2d7 |
| Two ZZ test numbers | released; out of OUR_NUMBERS again | Retell number list |
| Round 6 changes | built, graded, parked | candidate agent_ae31796e v10, v11 |

REMAINING TUNING LIST (for later, not now)
1 CH-LOC-04: agrees that a caller's hotel name matches an address. Needs one approved line (words item, not shipped).
2 Parked and ready: transfer rules (no offer; a failed transfer -> L38 once, then L21B times, never a second try), price first, the v11 fixes, the caller-text line.
3 From the live check call: it asked about phone coverage too many times. One problem branch per call, then answer and offer.
4 Caller commentary ending up in the destination sent to the quote tool; the "have the team reach out" path; "requested vehicle" when none was asked.
5 QA-NIGHTLY: production grade = seven green nights in a row.

SPEND (nothing bought)
- Retell: about $114 of $130 (estimate). Claude API: $58.65 of $150.

ROLLBACK
- node p5_rollback.mjs --go (W3 working folder, under doppler) -> 0019 + DEMO-POOL-05 back to agent_9ebb v17 with their saved webhooks.

GOTCHAS
- Booking on the live line is real. Any test call into 0019 must decline times, and its caller number must be in OUR_NUMBERS first, or the rails treat it as a real lead.
- The voice-battery test callers hang up after 15 seconds of silence; a transfer test needs the stay-on-the-line caller agent.
- The test numbers are released. A phone-leg voice run needs two new ZZ numbers (a purchase, so it needs Shane's yes), or it uses web calls only.
```
