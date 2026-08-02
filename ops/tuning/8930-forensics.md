# AVA 8930 — CALL FORENSICS (last 25 calls)

Pulled **2026-08-01**, read-only, from `agent_d5ada9f774fe3ae7f034d2c677` — the agent
resolved from the `+14142408930` binding. Tools: `tools/retell-8930-forensics.mjs`
(network) → `tools/retell-8930-analyze.mjs` (offline).

Window: **2026-07-14 → 2026-08-01**. All 25 calls inbound.

---

## TOP 10 WORST — ranked by e2e p90 + abnormal disconnects

| # | call_id | start (UTC) | dur | e2e p50 | e2e p90 | e2e p99 | llm p90 | tts p90 | barge | disconnect | class |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `call_ce3014e92adf40933e060070abc` | 2026-07-14 15:24:29 | 28.1s | 4393 | **4393** | 4393 | 3603.6 | 246 | 0 | agent_hangup | A |
| 2 | `call_b357359b5561d083750a7df45c6` | 2026-07-18 15:35:59 | 180s | 1163 | **1491** | 2831.1 | 1053.3 | 239.8 | 0 | max_duration_reached ⚠ | A |
| 3 | `call_92f0947632243a422486fbbe6a8` | 2026-07-23 03:00:34 | 70.4s | 1849 | **3229** | 3739.3 | 1277.8 | 229 | 2 | user_hangup | D |
| 4 | `call_238b0ffeb5bf98af54f804bd9e6` | 2026-07-29 15:50:36 | 151.6s | 1402 | **2738** | 4466.9 | 2410 | 243.8 | 0 | agent_hangup | A |
| 5 | `call_c898f73e36cf331e82a1305b6a4` | 2026-07-26 18:33:27 | 179.7s | 1569 | **2191.6** | 2334.2 | 1199.5 | 210 | 0 | agent_hangup | D |
| 6 | `call_b1a40cb12a48ffc6eaacb77d313` | 2026-07-14 15:00:31 | 25.7s | 2093 | **2093** | 2093 | 1557 | 227 | 0 | agent_hangup | A |
| 7 | `call_b774fb5301a217dbab3f9923bbe` | 2026-08-01 07:20:17 | 379.5s | 1327.5 | **1901.5** | 3807.6 | 1037.2 | 208.3 | 1 | user_hangup | D |
| 8 | `call_472ffe6cbd9be0937b116d01eff` | 2026-07-16 18:17:06 | 116.4s | 1321.5 | **1955.8** | 2191.8 | 1398.8 | 781.4 | 0 | user_hangup | A |
| 9 | `call_ace2f15fcb0782aa46714043b01` | 2026-07-23 20:40:00 | 9.8s | 1927 | **1927** | 1927 | 888.5 | 245.8 | 0 | user_hangup | D |
| 10 | `call_0e1d94471c9155fbab1da3a9522` | 2026-07-29 17:34:50 | 140.5s | 1463 | **1913.4** | 2051.6 | 1328.2 | 214.6 | 0 | user_hangup | A |

All latency values are **milliseconds**. Classes: **A** = LLM p90 dominates e2e ·
**B** = TTS variance dominates · **C** = high interruption count · **D** = inconclusive.

---

## WORST 3 — FLAGGED, WITH RECORDINGS

### 1 · `call_ce3014e92adf40933e060070abc` — **CLASS A**
LLM p90 3,603.6ms = **82% of e2e p90**. 2026-07-14 15:24:29Z · 28.1s · 2 turns ·
`agent_hangup` · sentiment Neutral.
e2e p50/p90/p99 **4393 / 4393 / 4393** · llm 2386 / 3603.6 / 3877.6 · tts 246 / 246 / 246 · asr 189.

> **Caveat: n=1.** Exactly one latency sample, so p50 = p90 = p99 are the same single
> measurement. It is the worst *observed* turn on the line and a genuine 4.4s wait, but
> it is one data point, not a distribution. Do not tune against this call alone.

- Recording: https://dxc03zgurdly9.cloudfront.net/ff7bdd3b3ee5646a65445697ad15e6602aca96f5fcbd529c8ed99a61deb39e4c/recording.wav
- Log: https://dxc03zgurdly9.cloudfront.net/ff7bdd3b3ee5646a65445697ad15e6602aca96f5fcbd529c8ed99a61deb39e4c/public.log

### 2 · `call_b357359b5561d083750a7df45c6` — **CLASS A** · only abnormal disconnect
LLM p90 1,053.3ms = **71% of e2e p90**. 2026-07-18 15:35:59Z · 180.0s · 23 turns ·
**`max_duration_reached`** · sentiment Positive.
e2e p50/p90/p99 **1163 / 1491 / 2831.1** (max 2980, n=11) · llm 636.5 / 1053.3 / 1532.5 ·
tts 204 / 239.8 / 372.5 · asr 176 / 266 / 350.6.

> The only abnormal disconnect in 25 calls. The call hit a hard **180s** ceiling while
> the caller was *positive* and mid-conversation — the cut was the timer, not the caller.
> Note `max_call_duration_ms` on the agent is **600,000ms**, so the 180s stop did **not**
> come from the agent config. Worth tracing where that ceiling is imposed.

- Recording: https://dxc03zgurdly9.cloudfront.net/9ad41d3d12da95a6be6f3e645de5e0714f4cdb6ee068630ea58c344b0f55ad6b/recording.wav
- Log: https://dxc03zgurdly9.cloudfront.net/9ad41d3d12da95a6be6f3e645de5e0714f4cdb6ee068630ea58c344b0f55ad6b/public.log

### 3 · `call_92f0947632243a422486fbbe6a8` — **CLASS D**
No single dominant driver (LLM 40% of e2e p90, TTS 7%). 2026-07-23 03:00:34Z · 70.4s ·
11 turns · `user_hangup` · sentiment Neutral · **2 barge-ins**.
e2e p50/p90/p99 **1849 / 3229 / 3739.3** (max 3796, n=4) · llm 857 / 1277.8 / 1419.3 ·
tts 204 / 229 / 241.6 · asr 121.5 / 205.6 / 237.5.

> e2e p90 of 3.2s with LLM at only 1.3s and TTS at 0.2s leaves **~1.7s unexplained by
> any named stage** — it is not the model and not the voice. A 3AM call where the caller
> hung up. This is the most diagnostically interesting call of the three.

- Recording: https://dxc03zgurdly9.cloudfront.net/5d3d08f217afedb01feaf4e8e49d1acab14ddab54a5cd67d227b03c13135aeda/recording.wav
- Log: https://dxc03zgurdly9.cloudfront.net/5d3d08f217afedb01feaf4e8e49d1acab14ddab54a5cd67d227b03c13135aeda/public.log

---

## AGGREGATE — 25 CALLS

| metric | value |
|---|---|
| Calls with latency samples | 18 / 25 (7 too short to record a turn) |
| **Median e2e p90** | **1,901.5 ms** |
| Median LLM p90 | 1,080.2 ms |
| Median TTS p90 | 237.6 ms |
| Abnormal disconnects | **1 / 25** (`max_duration_reached`) |
| Disconnect histogram | `user_hangup` 14 · `agent_hangup` 10 · `max_duration_reached` 1 |
| Class histogram | **A 14 · B 0 · C 0 · D 11** |
| Total derived barge-ins | 7 across 25 calls |
| Calls with a recording | 25 / 25 |

### What the distribution says

- **The bottleneck is the LLM, not the voice.** 14 of 25 calls are Class A. Median LLM
  p90 (1,080ms) is **4.5× median TTS p90** (238ms).
- **TTS is not a problem. Zero Class B calls.** TTS p90 sits in a tight 208–246ms band on
  9 of the top 10; call #8 (781ms) is the single outlier.
- **Interruptions are not a problem. Zero Class C calls**, 7 barge-ins across 25 calls.
  Raising interruption sensitivity is not indicated by this data — and it is already 0.82.
- **Disconnect health is good** — 24 of 25 ended normally.
- **The Class D group is the real open question.** In 11 calls, LLM + TTS + ASR do not
  add up to e2e. That residual is where the remaining seconds are hiding.

---

## METHOD NOTE — the interruption count is DERIVED

**Retell's call object carries no interruption field.** Verified: zero keys matching
`/interrupt/` across all 25 raw call objects.

A barge-in is counted here as a **user turn whose first word starts before the preceding
agent turn's last word ends**, using `transcript_object[].words[].start/end`, with a 50ms
jitter guard. That is a reasonable proxy for the caller talking over AVA — it is **not**
a Retell-reported metric, and Class C is assigned from it.

Raw dumps, `analysis.json`, and both scripts reproduce this end to end.
