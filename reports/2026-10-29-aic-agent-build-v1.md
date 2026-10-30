# AIC-AGENT-BUILD-v1 — the AI Chauffeur demo line's trip intake, rebuilt and live (2026-10-29)

> Run from PASTE-CC-AIC-AGENT-BUILD-v1 (Session A). Spec of record `AIC-AGENT-SPEC-v1-2026-10-29.md`; measurement of record `reports/2026-10-28-agent-measure-v1.md` (Phase 0). Writer: agent_9ebb… (AI Chauffeur, 414-775-0019), its flow `conversation_flow_9cf4ddd5b734`, the test agents below, this repo. Read only: AVA agent_d5ada… and 8930, the briefing agent, the capture desk, every n8n workflow (executions read only), GHL, Twilio, Cal.com, Google Calendar. Masking for this public repo: keys and secret headers `[masked]`, every URL `host/[path]`, the transfer destination by its Doppler secret name, caller numbers last four. The test caller's number is the reserved 414-555-0100. Recordings are not in the repo.

## HEADLINE

**AIC INTAKE v2 LIVE — 0019 v16 · model GPT 6.1 Terra (`gpt-6.1-terra`, fast tier) · first word p50 1.8 s / p95 2.5 s · questions answered 9/9 · rollback re-pin v15**

| | Phase 0 (live v15, Oct 28) | v16 (15 confirmation calls, Oct 29) | v16 live proof call |
|---|---|---|---|
| Caller's last word → agent's first word, intake turns, p50 / p95 | **4.03 s / 6.01 s** (79 turns, 20 calls) | **1.79 s / 2.46 s** (78 turns, 15 calls; max 2.91 s, 0 over 3.0 s) | 1.78 s / 2.19 s (9 turns) |
| Caller questions answered in one line, then the trip resumed or the right door opened | 0% (Denver went to the trip-field reader, every field empty, next ask) | **9/9** (Denver 3/3 · "talk to somebody" 3/3 · "what is this" 3/3) | Denver 1/1 |
| One-airport city confirmed by name | no | "Denver International Airport" 3/3 + extracted 3/3 | 1/1 |
| Slow talker ("I need a pickup at, uh," 2 s pause "O'Hare terminal three") | — | 3/3 heard as one answer, O'Hare International extracted 3/3 | — |
| Flow tokens (tiktoken o200k_base, reachable) | 29,195 (Phase 0 count) · 27,899 (this run's script on v15) | 17,900 · INTAKE node 491 | |
| Greeting N01-P / N01-B | sha256 6d9d1162… / 7bbd8f18… | equal at build, after the build, after the promote | |

Gate as run: **Shane's ruling mid-run** (relayed from the AIC agent chat): promote if Terra passes every check and the intake gap is under 2.0 s typical and 3.0 s worst; the paste's 1.5 / 2.5 line does not stop the run. Read as p50 < 2.0 s and p95 < 3.0 s; the max (2.91 s) is also under 3.0 s. Met.

## BUILD

New flow built in code from the v15 export (`p3-build.mjs`, offline, with proofs: every edge resolves, no retired node is reachable from the start or a global node, every kept node is byte-identical to v15 except its rewired edge targets and the removed responsiveness override, greeting hashes equal).

**Kept byte-exact:** begin, CH-SPLIT, NOTICE calc, N01-P, N01-B, the questions door (d2 and its exits), the team path (g_team, D2 STATE, tr_prep, tr_call, the alert), booking (fn_slots → N08 → fn_book and their code), the N05 CAPACITY / N06 CAPACITY code, the readback (N06 COMPOSER with the AIRPORTS map, N06 SPEAK, N06 corrections), the text/trip-sheet nodes, the end nodes, all 12 global nodes, silence handling, the 3 tools, default dynamic variables, contact memory, Kate on Cartesia sonic-3.6.

**Retired (52, renamed `ZZ-RETIRED …`, unreachable, nothing deleted):** n01_nudge "N01-NUDGE Nudge" · nudge_mark "N01-NUDGE once" · n02_extract "N02 ROUTER - read answer" · n02_route "N02 ROUTER" · n02_dir "N02-DIR Direction" · n02dir_extract "N02-DIR read direction" · unclear_fallback · pg3 "PIECE gate (bundled asks)" · pg4 "PIECE gate (missing-item asks)" · n03_next "N03 NEXT ASK" · n03a_1–4, n03b_1–2, n03c_1–3, n03c_2_charter, n03d_1–3 (the N03 asks) · n03_extract "N03 read trip fields" · n04_gate · n04_date, n04_airport, n04_pickup, n04_dropoff, n04_time, n04_pax, n04_hours · n04_extract · piece_mark "PIECE-MARK", piece_hold, piece_route, piece_build, piece_confirm, hold_mark3, hold_mark4 · n05_p, n05p_extract, n05p_route, tp_mark_p, n05_tp_p (phone name + consent) · n05_b (browser name + number ask) · n05_name, n05n_extract, notext_set_c · n05v_ask, n05v_extract, n05v_back (sedan-or-SUV ask). d2_handoff_clear (router-only) is now unreachable too.

**Added (6):**

| Node | Type | Job |
|---|---|---|
| INTAKE (prompt-driven trip intake) | conversation, prompt | The PASTE's instruction text verbatim. The flight line it quotes is `We'll be tracking your flight.` — no retired ask node carried a tracking sentence; this is the only one in v15, copied from the N06-ARR frame in N06 COMPOSER. Edges in order: (1) "The caller asks what AI Chauffeur is, what it does, what it costs, how it works, or says "what is this" — not a trip question." → D2 from router (the questions-door entry the router used) · (2) "The caller asks to talk to somebody, the team, a manager, a person, or asks for a callback." → g_team · (3) "Every required field … collected (…)" → INTAKE-DONE · (4) else stay. No node-level responsiveness, model or interruption setting. |
| INTAKE-ENTER | code | `asked_asks: 'intake'` before INTAKE, so D2 STATE knows a demo trip is in progress when the caller breaks off to ask about AI Chauffeur. |
| INTAKE-DONE | code | Between INTAKE and EXTRACT-ONCE: `vehicle_asked: 'true'`, `trip_started: 'true'` (INTAKE asked the vehicle; N05/N06 CAPACITY then take the caller's pick and never re-ask). |
| EXTRACT-ONCE read trip fields | extract | The v15 "N03 read trip fields" schema (22 variables, same names/types) plus `caller_name` and `vehicle_choice` copied from the retired N05-P / N05V readers. Two descriptions changed by measurement (see MODELS): `caller_name`, `airport`. → N05 CAPACITY → N05 CONTACT route → N05-CONSENT or the browser number read → Contact captured → N06 COMPOSER → readback. |
| NOTICE read how the opening ended (demo, phone) | extract | A copy of the kept questions-door reader `notice_x` (2 variables, byte-exact). Feeds the kept NOTICE calc, so a phone caller who cut the greeting off before "Calls are recorded and transcribed." still hears that line. |
| NOTICE route (demo) | branch | v15 N02 ROUTER's first equation, byte-exact (`greeting_cut` true, phone, notice not done) → NOTICE mark → NOTICE say → INTAKE; else → INTAKE. |

**Rewired (54 edge targets; conditions unchanged):** N01-P's three edges and N01-B's three edges (the ones that went to N02 ROUTER - read answer, and the half-answer edge to PIECE-MARK) → INTAKE-ENTER → INTAKE. **One edge added to N01-P, first in order:** "The opening was cut off: the caller started talking before the opening reached the words "Calls are recorded and transcribed." and the caller answered the question or gave trip details." → NOTICE read. Build 0 sent every phone call through the notice reader; the smoke call measured it at 0.74 s on turn 1 (3.15 s total), so build 1 gates it behind this edge. g_silence, g_ai, the recording objection return → NOTICE read (as v15 did through N02) · g_restart, RESUME default, D2 exit trip, D2-DEMO → INTAKE-ENTER · N05 CAPACITY's / N06 CAPACITY's sedan-or-SUV edge → their else targets · N05 CONTACT route: no-text → Contact captured, phone → N05-CONSENT, browser → N05-B read name + number (kept) · RESUME route: 28 equation edges whose `pending_node` can no longer hold a retired id → INTAKE-ENTER.

**Kept on the path although they are N05 nodes, and why:** N05-CONSENT ("Okay to text the trip sheet to that number?", the approved line) and its decline path. The demo post-call rail sends the caller's trip-sheet text only when `sms_consent` is true (`sms_ok` in DEMO POST-CALL RAIL v1); INTAKE confirms a callback number but does not ask text consent. Without this node no caller would ever get the sheet. Browser calls also keep N05-B read + the number read-back.

**Variable map** (every variable a kept node reads that only a retired node set):

| Variable | Set by (retired) | Read by (kept) | Action |
|---|---|---|---|
| trip_type, pickup_date, pickup_time, pickup_location, dropoff_location, airport, airline_flight, meet_style, sign_name, passenger_count, bag_count, hours, occasion, notes, is_charter, one_way, stops, return_leg, pickup_time_zone, wheelchair_lift_needed, oversized_item_needed | N02 / N02-DIR / N03 / N04 readers | N06 COMPOSER, GOTIT compose, D2 STATE, G-COST, N05/N06 CAPACITY, N06 one-way | EXTRACT-ONCE (N03 schema) |
| caller_name | N05-P read, N05-NAME read | N06 COMPOSER, GOTIT compose, TR prep | EXTRACT-ONCE (+ N05-B read on browser) |
| vehicle_choice | N05V read | N05 / N06 CAPACITY | EXTRACT-ONCE |
| vehicle_asked | (N05 CAPACITY) | N05 / N06 CAPACITY | INTAKE-DONE sets `true` |
| asked_asks | N03 NEXT ASK | G-NOTEXT, D2 STATE | INTAKE-ENTER sets `intake` |
| trip_started | (D2 STATE) | d2 prompt | INTAKE-DONE sets `true`; D2 STATE recomputes it |
| opening_tail, opening_has_notice | N02 ROUTER - read answer | NOTICE calc | NOTICE read (barge-in edge only) |
| sms_consent | N05-P read, No text (contact step) | N07 DELIVERY, N05 consent?, booking gates | kept N05-CONSENT → N05 read consent |
| text_pitch_done, no_text | TEXT-PITCH once (phone), No text (contact step) | N05 consent?, G-NOTEXT, booking gates | none: CH-SPLIT defaults + kept setters |
| piece_ask | PIECE-MARK, HOLD marks | G-* codes, D2 STATE | dropped: read only when the previous node is PIECE-HOLD (unreachable) |
| next_ask, piece_ret, charter_step, gate_next, asked_gate, gate_missing, piece_wait, hold_count | retired code nodes | no kept reader | dropped |

**Global prompt, two edits, everything else byte-identical:**
1. "Never look anything up." → "Never look up facts about AI Chauffeur or its prices: answer those only from the knowledge base and the rules for the questions part. General knowledge, such as which airport serves a city, is allowed." (a behavior rule, no spoken line)
2. "Your only job is to capture the trip request." → removed · "Ask the bundled questions exactly as written. Never split them." → removed. ("Ask for a field only if the caller has not already given it. One question per turn." stay.)

**Settings:** every per-node responsiveness override removed (27, all at 0.3: the two greetings, the nudge, the N03/N04/N05 asks, N08-A / N08-A2, D2-DEMO) → every node inherits the agent's 0.8. `reminder_trigger_ms` 10000 → 6000. **`enable_dynamic_responsiveness` true → false** (Shane's pick after the bake-off, see MODELS). reminder_max_count 2, end_call_after_silence_ms 20000, interruption sensitivity 0.9, backchannel, denoising, boosted keywords, STT: unchanged.

**Tokens** (o200k_base; same script on both flows): v15 28,092 all nodes / 27,899 reachable (Phase 0's own count 29,195) → v16 **17,900 reachable** (30,631 counting the 52 retired nodes still in the JSON). INTAKE: instruction 388 + its edge conditions = **491** (limit 2,000).

## MODELS

Identifiers from docs.retellai.com (create-conversation-flow, `LLMModel` and `S2SModel` enums). The dashboard's Model leaderboard needs Shane's sign-in; not read.

| Dashboard name | API identifier | Tier | Note |
|---|---|---|---|
| GPT 6.1 Terra | `gpt-6.1-terra` | fast (accepted) | |
| GPT 6.1 Sol | `gpt-6.1-sol` | fast (accepted) | `ultrafast` exists for Sol only; not used (identical-except-model) |
| Claude 5.5 Sonnet | `claude-5.5-sonnet` | **standard** | Retell: "tier fast is not offered by claude-5.5-sonnet; supported tiers: standard" |
| GPT 4.1 (control) | `gpt-4.1` | fast (`high_priority` true, as v15) | |
| Grok Voice 3.0 (side reading) | `grok-voice-3.0` (s2s) | — | Retell refused cartesia-Kate ("Use a supported xai voice") → xai-Ara |

Test agents (webhook = ZZ sink `hF7cxEn0SuVaEnnL`, published, masked copies in `ops/tuning/aic-intake-v2-<A..E>-2026-10-29.json`): A agent_0fa59b66c74f6366b0af8035dc (flow conversation_flow_3f502a51d013) · B agent_9bafa6f2c2805183ebc456aeaa (conversation_flow_85eed8a61727) · C agent_57fc611111e33bcfebe80ae78f (conversation_flow_a6e06a760df1) · D agent_12beab314c4f8dc556340a3a30 (conversation_flow_115bb5b88311) · E agent_0ba2c0ef8c2e1e786f9bd2955b (conversation_flow_0625a0bcc716).

**Harness.** The Oct 14–15 caller (`y6-listen.mjs`: RetellClient 3.0.2 in headless Chromium, Windows SAPI "David" clips at 48 kHz into a WebAudio mic, agent turns timed from the agent's audio level, REST proxied through node so the key never reaches the page) carried forward. New: the agent's own audio track is recorded per turn and heard by faster-whisper base.en, so the scripted caller answers what was actually asked (a later scripted line when asked out of order; a per-test fallback otherwise). The caller speaks after 1.6 s of agent quiet (the harness's existing rule, not the PASTE's 0.6 s; it does not touch the measured gap, which is Retell's own word timestamps). Calls went straight to `POST /v3/create-web-call` with the start values the /try call-start builds (live slots from WF-SHANE-SLOTS fold mode, channel phone, caller 414-555-0100, team_free_now false), each capped at 180 s by `agent_override`. The /try workflow itself could not be used: it reads 0019's inbound agent from `get-phone-number` and caps 3 calls per IP per hour. Lines ADDED to the PASTE's scripts: the consent "Yes." (the kept N05-CONSENT ask) on T1/T3/T4, and the answers T3 and T4 leave to the caller.

**Bake-off (build 1, 20 calls, one per candidate per test).** Cells: intake-turn gap p50 / p95 in seconds · checks passed.

| Candidate | T1 Denver | T2 person | T3 by the hour | T4 slow talker | T5 what is this | Intake pooled p50 / p95 (n) | LLM p50 | Checks | $/min |
|---|---|---|---|---|---|---|---|---|---|
| A GPT 6.1 Terra | 1.36 / 2.27 · 4/4 | 1.82 / 2.38 · 2/2 | 2.24 / 2.40 · 1/2 ✗ name | 2.36 / 2.79 · 3/4 ✗ name | 1/1 | 2.14 / 2.72 (25) | 448 ms | 11/13 | $0.153 |
| B GPT 6.1 Sol | 1.83 / 2.81 · 4/4 | 2.72 / 3.22 · 2/2 | 2.45 / 4.85 · 2/2 | 2.20 / 3.20 · 4/4 | 1/1 | 2.29 / 3.39 (25) | 892 ms | **13/13** | $0.227 |
| C Claude 5.5 Sonnet | 1.42 / 2.51 · 3/4 ✗ extraction hung | 2.78 / 4.36 · 2/2 | 2.41 / 3.13 · 1/2 ✗ extraction hung | 2.21 / 2.91 · 4/4 | 1/1 | 2.13 / 3.24 (25) | 912 ms | 11/13 | $0.188 |
| D GPT 4.1 fast | 1.54 / 2.34 · 4/4 | 2.41 / 2.43 · 2/2 | 2.34 / 2.75 · 1/2 ✗ bags never asked | 2.35 / 3.30 · 4/4 | 0/1 ✗ greeting edge sent it into INTAKE | 2.25 / 2.93 (23) | 477 ms | 11/13 | $0.151 |

Calls: A call_0bd717ee2cf832e6900681314a4 · call_a3f568a45e281d4cc617719265f · call_9f0ee2fc8c74fdda9f82c5271da · call_a77a66c915d7898d98c869c6b3d · call_9fa16ca7481ac19bc15878dd700 — B call_118abfe2cda80df1610f93fc43b (re-run; the first, call_9dc41172980e12dd12aef4b1dfb, was spoiled by a harness threshold) · call_02f61e988a600ae2bfa90f6faa2 · call_83fe2233ebdc2b58078c67a4e21 · call_4e99a7ad26048e22db4b8edbbb2 · call_e671cf84dc266dc14e75ffd55d9 — C call_e5308ac34fb80aae3a9fb3542c2 · call_a6d792478832b4a2a508a375801 · call_05fe57af50fbdf9819f7f71be6e · call_0aa64bbcef6ac25164ee531e095 · call_0dea3456f3878e5b03b3b06094a — D call_331ed5c100832165fdeed3810a4 · call_370d2cb1fd602f1dfdd197ac2e2 · call_e7188c848348f95424886ec37aa · call_51d301da9f19b6c2a9488e245b1 · call_a6792b585d63d477e63614edafc.

What the numbers showed: no candidate could reach 1.5 s on T2–T4, because Retell's **dynamic responsiveness** (on in v15) slows the agent by about 1 s for the rest of a call once the caller pauses — on T4, the turns after the 2-second pause went from ~1.2–1.8 s to 2.3–2.9 s while the model stayed at 0.4–0.6 s. By the PASTE's rule the winner was B (only all-pass) and the slowest. **Shane picked Terra + two fixes** (AskUserQuestion): (1) EXTRACT-ONCE `caller_name`: "The caller's name. Use the latest value if the caller corrected it. Leave empty if the caller has not said it." → "The caller's name, or the passenger's name the caller gave when asked for it. Use the latest value if the caller corrected it. Leave empty if the caller has not said it." (INTAKE asks for "the passenger's name") · (2) `enable_dynamic_responsiveness` → false. Proof on A v3, T3 + T4 (call_7ae98f0c5ca48a6b4d0e643b590, call_60c623c1dd3d4358a4d15178131): intake 1.74 / 2.35 and 1.80 / 2.24, 6/6 checks, the slow talker not cut off.

**Winner: A, GPT 6.1 Terra** — fastest model on the account (LLM p50 ~0.45–0.47 s), cheapest per minute with the control (~$0.15), and all checks pass after the two fixes. Sol passed everything but answers ~0.45 s slower per turn; Claude 5.5 Sonnet's extraction hung twice; GPT 4.1 skipped bags on a by-the-hour trip and let a greeting question fall into the intake.

## CONFIRMATION

Round 1 on A v3 (15 calls: T1–T5 × 3): intake p50 1.79 s / p95 2.53 s (78 turns, max 3.21 s); 12/15 all-pass. Misses: one T1 (call_d1bc21998664eae3497f8ee2e42) — EXTRACT-ONCE returned `airport: null` though the agent said "Denver International Airport"; the copied rule "Leave empty if the caller has not said it." loses an airport the agent names itself, and the readback dropped it. Two T4 flags — see below.

**The one iteration (one change):** EXTRACT-ONCE `airport`, last sentence "Leave empty if the caller has not said it." → "If the caller did not name it but you stated the airport for the caller's city and the caller did not correct it, write that airport. Leave empty if no airport was said." → A v4.

Round 2 on A v4 (15 calls), the confirmation of record:

| Test | Calls | Intake gap p50 / p95 per call | Checks |
|---|---|---|---|
| T1 Denver | call_32a7d45040dd1dd1cf21bd6be7d · call_7a5d085b6262a5d5e3f5962a0b3 · call_a8c86f7466716c3f7d4c522941b | 1.73 / 2.19 · 1.77 / 2.22 · 1.76 / 2.13 | 4/4 × 3 (Denver International said and extracted) |
| T2 person | call_325664f4a41eefba4b6d26c851d · call_5228e0c4f03396578a54ea8cedf · call_b600aa92f6d692cf072543ca528 | 2.31 / 2.79 · 2.24 / 2.80 · 2.34 / 2.85 | 2/2 × 3 (team path, no trip field asked after) |
| T3 by the hour | call_2886f0b82459bce66091c0d6186 · call_7cce2ebe0781e0f7dbc490effbb · call_f146c6bdba8683c474db0d34af1 | 1.78 / 2.29 · 1.84 / 2.31 · 1.82 / 2.31 | 2/2 × 3 |
| T4 slow talker | call_47ecb6973a50f992778867456f3 · call_85a2b311612f77c73bb474f0159 · call_ed29424d26ad332d46576c21c75 | 1.82 / 2.28 · 1.79 / 2.18 · 1.78 / 2.17 | 3/4 × 3 — not cut off, O'Hare International, all fields; the re-ask detector flags "We'll be tracking your flight. Is eight fifteen the new pickup time?" |
| T5 what is this | call_1e59c3c3eb02c0b8275d62206cc · call_897b75de17290b02a7e3b2ae95c · call_c170c4a9e907867c823f9465a02 | (no intake turn: the questions door) | 1/1 × 3 |
| **All 15** | | **p50 1.79 s · p95 2.46 s · max 2.91 s · 0 turns over 3.0 s · 0 talk-overs** | 36/39 automated; **15/15 with the T4 call below** |

T4 ruling: the PASTE's T4 is "then the T1 tail", so a *landing* trip gets "Tomorrow at 6 AM" for the pickup and then "United 1234 at 8:15" — two different pickup times. Asking which one is right is the correct move, not a re-ask of a field it already had. Shane chose (AskUserQuestion) to count it as a pass and flag it here.

Two runs were stopped by Claude Code's low-memory reaper (Dell RAM, not disk): the bake-off at 7/20 and confirmation round 2 at 6/15. Each restarted only on Shane's go; the remaining calls ran two at a time, round 2 in foreground batches.

## S2S READING

One T1 call on E (`grok-voice-3.0`, xai-Ara, same flow): call_4df14734507559f6d2497cad3f9, recording dxc03zgurdly9.cloudfront.net/[path]. Intake gap p50 1.58 s / p95 2.45 s (9 turns), e2e p50 1.25 s, 174 s, $0.57 ($0.196/min). Code nodes and EXTRACT-ONCE ran (every field filled). But: its first turn answered "Airport." with the silence line ("Whenever you're ready, we can continue with the trip."), "We'll be tracking your flight." came with no next question, and after the extraction it **never spoke the static N05-CONSENT line** — the call sat silent to the cap. Static-text nodes do not speak under speech-to-speech here. Not usable on this flow as built; voice law (Kate) also rules it out for the live line.

## PROMOTE

| Step | Result |
|---|---|
| Fork | `POST /create-agent-version/agent_9ebb… {base_version: 15}` → v16 (Retell forked conversation_flow_9cf4ddd5b734 to v16 with it) |
| Flow | v16 takes the winner flow's content (conversation_flow_3f502a51d013 v4): nodes, global prompt, model config, model temperature, tools, start values, start node/speaker, knowledge base settings — deep-equal on all 10 keys, differs on none |
| Agent diff vs v15 | exactly three fields: `response_engine` {9cf4…, v15} → {9cf4…, v16} · `reminder_trigger_ms` 10000 → 6000 · `enable_dynamic_responsiveness` true → false. Webhook = the production rail, as v15 |
| Greeting hashes | N01-P 6d9d1162bb841a01ae46d52a9812b79bc1b47212baef4fac21acb5c0c86dac86 · N01-B 7bbd8f185e2bfd9a261b0667d3a142c6824e40921311367de4022acb8e92595a — equal before, after the build, after the promote |
| Publish | v16 `is_published` true at 2026-10-30T00:46:46Z |
| Re-pin | 414-775-0019 and …8976 inbound agent_9ebb **15 → 16** at 2026-10-30T00:47:02Z (7:47 PM CT); outbound agents and inbound webhooks unchanged |
| Rollback | `doppler run --project ava-prod --config prd -- node p10-promote.mjs repin 15` (re-pins both lines to v15; v15 is untouched) |
| Proof call | call_5a79933695d439db813b68468d2 (web, live v16, T1): intake 1.78 / 2.19 s, 4/4 checks. Per turn: Airport 2.39 · Flying out 1.78 · Denver question 1.89 ("Denver's commercial airport is Denver International Airport. What is your pickup address?") · address 1.79 · date 1.76 · flight 1.81 · passengers 1.70 · SUV 1.78 · name 1.69 · number → consent 3.10 · Yes → readback 0.24 |
| Rail | DEMO POST-CALL RAIL exec 17961 success: trip sheet AIC-B68468D2 stored, sheet row, owner email, owner SMS, caller text queued to the harness number (414-555-0100 cannot receive it); its OWNER-ALERT leg skipped ("payload carried test_mode"). Session C's OWNER-ALERT v1 is live, so the PASTE's "no owner alert expected" no longer holds — Shane got the owner email and owner SMS for this call. § 9: the lead upsert resolved to the 414-555-0100 contact (SI4O…iZ9g), not the owner-alert record or zz-test |
| Session B note | the 8930 `handoff_to_desk` still points at AIC **v14**; Session B re-pins it |

## CHECK CALLS

Shane was asked at 00:50Z to make three calls from his cell. The session watched 0019 for 30 minutes (00:50–01:22Z, `p11-watch.mjs`, auto re-pin to v15 on an owner-cell intake turn over 3 s or a talk-over): **no call arrived** — the only call on v16 in that window is the proof call. Before vs after on the same script (Denver): Phase 0 call_d3c7d2779c341623123c54348d4 "Airport." 5.62 s · "Flat out." 2.94 s · "What's the airport in Denver?" 5.60 s → "How many passengers and how many bags?" · hung up at 67.59 s — v16 proof call 2.39 · 1.78 · 1.89 s → "Denver's commercial airport is Denver International Airport. What is your pickup address?" · trip completed and read back at 134 s. Re-run `p11-watch.mjs <since> 30` when Shane calls.

## ENDPOINTS

Retell (api.retellai.com): GET /v2/list-phone-numbers · GET /get-phone-number/{E.164} · GET /get-agent/{id}?version= · GET /get-conversation-flow/{id}?version= · GET /list-agent-versions/{id} · GET /list-voices · POST /create-conversation-flow · POST /create-agent · POST /publish-agent-version/{id} · POST /create-agent-version/{id} · PATCH /update-conversation-flow/{id}?version= · PATCH /update-agent/{id}?version= · PATCH /update-phone-number/{E.164} (inbound_agents only) · POST /agent-playground-completion/{id}?version= (text smoke tests, tools mocked) · POST /v3/create-web-call · GET /v2/get-call/{id} · POST /v3/list-calls. None of the deprecated routes in CLAUDE.md § RETELL API RULES. n8n (circulant.app.n8n.cloud, read only): GET /api/v1/workflows, /workflows/{id}, /executions, /executions/{id}, /variables; POST circulant.app.n8n.cloud/[path] (WF-SHANE-SLOTS, mode fold: read the live slots). Docs: docs.retellai.com/api-references/create-conversation-flow.

Spend: **$15.77** in Retell web calls (56 calls, 95.3 min: smoke 0.34 · bake-off 6.87 incl. the spoiled call · proof 0.55 · S2S 0.57 · confirmation 3.58 + 3.54 · live proof 0.32). The 4 playground smoke runs (T1, T2, T3, T5 on D) are billed as LLM tokens and are not itemized by the API. Cap $25.

Files: `ops/tuning/aic-0019-v15-{agent,flow}-rollback-2026-10-29.json` (masked rollback; unmasked in the PASTE rollback folder) · `ops/tuning/aic-0019-v16-{agent,flow}-2026-10-29.json` · `ops/tuning/aic-intake-v2-{A..E}-2026-10-29.json` · `ops/tuning/calls/2026-10-29/<agent>/<call_id>.json` (56 masked calls; no access tokens, ICE credentials or recordings). Working set off-repo: `C:\Users\offic\aic-tuning\agent-build-2026-10-29\`.

## GOTCHAS

1. **Dynamic responsiveness works both ways.** On, it answered fast callers in ~1.0–1.3 s and slowed every turn after a pause by ~1 s. Off, the gap is flat at ~1.7–1.9 s. A faster flat line needs agent responsiveness above 0.8; T4 is the guard for that.
2. **The memory reaper kills background call runs** when the Dell is short of RAM (2.4–2.6 GB free of 15.3 GB with several Claude windows, ChatGPT and Chrome open). The lane loops survived the kill and kept placing calls; stop them by command line. Long call sets run safer as foreground batches.
3. **INTAKE has no drop-off field.** Point-to-point gets one only when the caller volunteers it, and landing trips end with no drop-off on the sheet (every T4 readback). Grok patch brief, not a Claude Code edit.
4. **INTAKE reads the caller ID number aloud** ("Is four one four - five five five - zero one zero zero the best callback number?") while the global prompt says never say a number the caller did not give. Shane/Grok to rule.
5. **A question at the greeting relies on the global node beating the greeting's edges.** v15's router caught it by extraction. GPT 4.1 sent "What is this?" into INTAKE once; Terra opened the questions door 7/7. A greeting question edge to the door would close it.
6. **Text consent is still its own turn.** The rail texts the sheet only with `sms_consent` true, so N05-CONSENT stays. Exit turns are the slow ones: INTAKE → EXTRACT-ONCE → consent ~3.0 s, consent → readback ~2.5 s (two extractions).
7. **Claude 5.5 Sonnet:** EXTRACT-ONCE never returned on 2 of 3 attempts (agent silent to inactivity). The fast tier is not offered.
8. **S2S (grok-voice-3.0)** runs code and extraction nodes but does not speak static_text nodes; it needs an xAI voice.
9. **"Get my trip so far?" (G-GOTIT)** reads the trip from dynamic variables, which stay empty until EXTRACT-ONCE. Mid-intake it has nothing to read back. Untested.
10. **The /try call-start can't call a test agent:** it reads 0019's own agent and caps 3 calls per IP per hour. Test calls go straight to /v3/create-web-call with the same start values.
11. The proof call upserted a GHL contact for 414-555-0100 and queued a text to it. ASR heard "United one two three" on the proof call, so its sheet says United 123.
12. The Retell playground (`agent-playground-completion`) ran the whole flow as text with tools mocked. It caught the wiring before any call was paid for.

LESSON: the flow was slow because it never let the model speak; the last second came from a setting (dynamic responsiveness) that only showed itself when the same caller lines were timed side by side.

## SHANE READBACK

```text
===== SHANE READBACK — COPY ALL =====
AIC INTAKE v2 LIVE — 0019 v16 · model GPT 6.1 Terra · first word p50 1.8 s / p95 2.5 s · questions answered 9/9 · rollback re-pin v15

WHAT HAPPENED (plain English)
The AI Chauffeur demo line (414-775-0019) used to read a script, one fixed line per step, and it waited about 4 seconds after
every answer. It now runs one smart "take the trip" step. It asks one thing at a time, answers any question in one line, then
goes back to the trip. It names a one-airport city's airport itself ("Denver International Airport"), and it reads the trip
fields once at the end. The greeting is word for word the same. Four AI models were tested on the same five scripted calls.
GPT 6.1 Terra was fastest and cheapest once two problems were fixed: the name, and a Retell setting that slowed every call
after a pause. It passed 15 confirmation calls at about 1.8 seconds to the first word (was 4.0). It is live on 0019 and the
Google tracking line since 7:47 PM CT. Your three check calls never came in during the 30-minute watch.

DONE
| Step | Result | Evidence |
| 0 Preflight | 0019 + …8976 on agent_9ebb v15; rollback saved; greeting hashed; models + harness found | PASTE\rollback\aic-0019-v15-{agent,flow}-2026-10-29.json · N01-P 6d9d1162… N01-B 7bbd8f18… |
| 1 Build | INTAKE + EXTRACT-ONCE (+ INTAKE-ENTER/DONE, barge-in notice reader); 52 nodes retired; 2 prompt edits; 27 overrides off; reminder 6 s; 17,900 tokens, INTAKE 491 | report BUILD · ops/tuning/aic-intake-v2-*.json |
| 1f Test agents | A Terra · B Sol · C Claude 5.5 Sonnet (standard tier only) · D GPT 4.1 fast · E Grok Voice 3.0; all on the ZZ sink | agent_0fa59b66 / 9bafa6f2 / 57fc6111 / 12beab31 / 0ba2c0ef |
| 2 Clips | 25 SAPI caller clips + the T4 slow line (2.0 s pause) | tests.mjs, mkclips.ps1 |
| 3 Bake-off | 20 calls. Sol only all-pass but slowest; you picked Terra + 2 fixes | report MODELS table |
| 4 Confirm | round 1 12/15 (airport miss) → one fix (airport description) → 15 calls: p50 1.79 s, p95 2.46 s, max 2.91 s, 0 talk-overs; 15/15 (T4 time question counted as a pass, flagged) | 15 call ids in report CONFIRMATION |
| 5 S2S | Grok Voice 3.0: p50 1.58 s, tools + extraction ran, static lines never spoken → not usable | call_4df14734507559f6d2497cad3f9 |
| 6 Promote | v16 published 00:46:46Z; 0019 + …8976 re-pinned 00:47:02Z; diff = 3 fields; hashes equal 3×; proof call 1.78 / 2.19 s, 4/4; rail ran | call_5a79933695d439db813b68468d2 · rail exec 17961 |
| 7 Check calls | asked; watched 30 min; none arrived | p11-watch.mjs |
| 8 Close | report + PASTE copy + board + 56 masked calls; pushed; /hq shows the item | 83da043 + this readback commit |

IDS / ROLLBACK
Live: agent_9ebb41c9bd8af214649328f107 v16 · flow conversation_flow_9cf4ddd5b734 v16 (= test flow conversation_flow_3f502a51d013 v4)
Rollback (one line, both numbers back to v15): doppler run --project ava-prod --config prd -- node p10-promote.mjs repin 15
  (run in C:\Users\offic\aic-tuning\agent-build-2026-10-29\; v15 is untouched)
Spend: $15.77 in Retell web calls (56 calls, 95 min) + 4 text playground runs (not itemized). Cap $25.

WHAT'S NEXT
1. Your three check calls from your cell. Ask me and I'll run the watcher again (it re-pins v15 by itself on a slow turn or a talk-over).
2. Session B: re-pin the 8930 handoff_to_desk from AIC v14 to v16. Session A is done, so B's held v54 promote can go.
3. Grok patch brief (words, not mine): INTAKE has no drop-off field; INTAKE reads the caller ID aloud against the "never say a
   number" rule; a greeting edge for "what is this" would protect the questions door on other models.
4. Next speed step, if wanted: agent responsiveness above 0.8, with the slow-talker call as the guard.

GOTCHAS
- Dynamic responsiveness was the hidden second: on, it slowed every turn after a pause by ~1 s. Off, the gap is a flat ~1.8 s.
- Claude Code's memory reaper stopped two background runs (the Dell's RAM, not its disk). The call loops survived and kept dialing until I stopped them.
- Claude 5.5 Sonnet's extraction hung 2 of 3 times. Grok Voice 3.0 never speaks the fixed lines.
- Text consent is still its own question: the rail texts the trip sheet only on a yes. The turns leaving the trip are the slow ones (~2.5–3.0 s).
- The proof call sent you an owner email + owner text (OWNER-ALERT is live now) and queued a caller text to the fake 414-555-0100.
- The flight-tracking line was in no retired node. The only one in v15 is the readback's "We'll be tracking your flight."
- The /try call-start can only reach 0019's own agent (3 calls an hour), so test calls went straight to Retell.

DONE (again)
| Step | Result | Evidence |
| 0 Preflight | 0019 + …8976 on agent_9ebb v15; rollback saved; greeting hashed; models + harness found | PASTE\rollback\aic-0019-v15-{agent,flow}-2026-10-29.json |
| 1 Build | INTAKE + EXTRACT-ONCE; 52 retired; 2 prompt edits; 27 overrides off; reminder 6 s; INTAKE 491 tokens | report BUILD |
| 1f Test agents | A Terra · B Sol · C Sonnet · D GPT 4.1 · E Grok Voice 3.0, ZZ sink | ops/tuning/aic-intake-v2-*.json |
| 2 Clips | 25 SAPI clips + T4 slow line | tests.mjs |
| 3 Bake-off | 20 calls; Terra + 2 fixes (your pick) | report MODELS |
| 4 Confirm | 15 calls: p50 1.79 s, p95 2.46 s, max 2.91 s, 15/15 | report CONFIRMATION |
| 5 S2S | Grok Voice 3.0 not usable on this flow | call_4df14734507559f6d2497cad3f9 |
| 6 Promote | v16 live on 0019 + …8976 since 00:47:02Z (7:47 PM CT); proof 1.78 / 2.19 s | call_5a79933695d439db813b68468d2 |
| 7 Check calls | none arrived in 30 min | p11-watch.mjs |
| 8 Close | report, board, masked calls pushed; /hq live | 83da043 |

BEFORE → AFTER
| | Phase 0 (v15) | v16 |
| First word, intake turns p50 / p95 | 4.03 s / 6.01 s | 1.79 s / 2.46 s |
| Questions answered in one line, then back to the trip | 0% | 9/9 (100%) |
| "What's the airport in Denver?" | ignored → "How many passengers and how many bags?" | "Denver's commercial airport is Denver International Airport. What is your pickup address?" |
| Flow tokens (reachable) | 29,195 | 17,900 |
| Model | GPT 4.1 fast | GPT 6.1 Terra fast |
```
