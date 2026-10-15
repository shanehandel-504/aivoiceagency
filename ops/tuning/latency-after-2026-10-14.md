# Latency after — discovery words (2026-10-15)

> **READ ONLY.** The AFTER number for the speed gate of PASTE-CC-DISCOVERY-WORDS-RUN (v1 step 6, run in v1.3). BEFORE:
> `ops/tuning/latency-baseline-2026-10-13.md` (live AVA phone calls: median e2e p50 1,344 ms, median e2e p90 2,273 ms).

Method: scripted web calls (RetellClient 3.0.2 in Playwright, the caller's lines as SAPI clips, `metadata.test_mode` so bookings run dry
and nothing pages the owner), then `GET /v2/get-call` per call and the `latency` block's `e2e` p50 / p90, the same field the baseline
read. Gate: median of the per-call p50 and median of the per-call p90. AVA = TEST agent v17 (Grok v53.3 prompt, fast tier on, voice as live
v51). AIC = flow draft v14.3. The caller's lines are the simulation cases' own (S1–S8 for AVA, S9–S10 for AIC). One trial call before the
set is left out. Note: web calls, not phone calls (the baseline is phone calls); no transfer was attempted (`team_free_now` "false").

| Call | Case | Agent | Ver | Duration | e2e p50 | e2e p90 | LLM p50 | TTS p50 | Agent turns | Ended by |
|---|---|---|---|---|---|---|---|---|---|---|
| …ddea85 | S1-1 | AVA | v17 | 84 s | 1516 | 1802 | 593 | 52 | 5 | agent_hangup |
| …70e50c | S10-4 | AIC | v14 | 74 s | 2515 | 2515 | 467 | 58 | 5 | agent_hangup |
| …4951af | S10-5 | AIC | v14 | 73 s | 2764 | 2764 | 555 | 72 | 5 | agent_hangup |
| …0e3852 | S10-6 | AIC | v14 | 76 s | 4627 | 4627 | 580 | 62 | 5 | agent_hangup |
| …947901 | S2-1 | AVA | v17 | 45 s | 1104 | 2218 | 608 | 52 | 4 | agent_hangup |
| …376a28 | S3-1 | AVA | v17 | 83 s | 954 | 1957 | 629 | 65 | 6 | agent_hangup |
| …351c1b | S4-1 | AVA | v17 | 105 s | 881 | 1982 | 598 | 67 | 8 | agent_hangup |
| …e9dbc4 | S5-1 | AVA | v17 | 76 s | 1058 | 3230 | 716 | 65 | 6 | agent_hangup |
| …6d1604 | S5-2 | AVA | v17 | 76 s | 1032 | 1549 | 690 | 68 | 6 | agent_hangup |
| …c6f94f | S6-1 | AVA | v17 | 78 s | 1128 | 1545 | 794 | 67 | 6 | agent_hangup |
| …1534f3 | S6-2 | AVA | v17 | 77 s | 908 | 1068 | 663 | 56 | 6 | agent_hangup |
| …09869f | S7-1 | AVA | v17 | 89 s | 1076 | 1088 | 685 | 64 | 8 | agent_hangup |
| …79bff1 | S8-1 | AVA | v17 | 46 s | 1771 | 2395 | 707 | 53 | 4 | agent_hangup |
| …79f7ec | S9-4 | AIC | v14 | 163 s | 1506 | 1506 | 3 | 63 | 12 | agent_hangup |
| …30add2 | S9-5 | AIC | v14 | 160 s | 1139 | 1139 | 2 | 60 | 12 | agent_hangup |

| Gate | Median e2e p50 | Median e2e p90 | Limit | Result |
|---|---|---|---|---|
| AVA after (TEST v17, 10 calls) | 1067 ms | 1880 ms | ≤ 1,344 / ≤ 2,273 (Oct 13 baseline) | **PASS** |
| AIC after (v14.3, 5 calls) | 2515 ms | 2515 ms | not slower than the AVA after-number | **FAIL** |

Derived answer gap (agent's first word minus the caller's last word, from the call's word timings; same method on both agents; used for
the AIC row when its latency block carries no e2e, as on the Oct 13 AIC phone calls): AVA median p50 1387 ms / p90 2535 ms ·
AIC median p50 2876 ms / p90 5380 ms → AIC not slower than AVA: **FAIL**

Context, not gating (same scripted lines, same method):

| Set | Calls | Median e2e p50 | Median e2e p90 | Derived gap p50 | Derived gap p90 |
|---|---|---|---|---|---|
| AIC v14.3 before speed lever 1 (responsiveness 0.7) | 5 | 2503 | 2503 | 3298 | 5521 |
| AIC v14.3 after lever 1 (responsiveness 0.8) — the gated set above | 5 | 2515 | 2515 | 2876 | 5380 |
| AIC live v13 (what 414-775-0019 answered with before the promote) | 5 | 2217 | 2217 | 4993 | 5742 |

## Owner ruling, 2026-10-15

Shane ruled the AI Chauffeur gate is "no slower than today's live v13" (the gate above, "not slower than the AVA after-number", failed;
a faster AI Chauffeur flow is a later rebuild). On the answer gap he cited: v14.3 median p50 2876 ms / p90 5380 ms against
live v13 4993 ms / 5742 ms → **PASS**. For the record, Retell's e2e (one turn per AIC call): v14.3 2515 ms,
v13 2217 ms from the 2 v13 calls that carry it.
