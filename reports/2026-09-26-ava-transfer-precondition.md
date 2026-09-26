# AVA SALES — Transfer precondition + v49 forensics

🟢 COMPLETE — Parts 1–2 done with evidence. RECOMMENDED HANDOFF FOR v50b: AGENT SWAP. T1 and T2 ran once each on the phone (Shane stopped there), T2 once more on a web call; T1b was built but never called.

2026-09-26 · afternoon CT · probe window on DEMO-POOL-05 15:46:56–16:29:10 CT, restored exactly.
Nothing sensitive is in this file: no private numbers (callers = area code + last 4), no recording links, no keys, no caller names.

```
===== SHANE READBACK — COPY ALL =====

WHAT I DID (plain English)
- I read the live AVA line without changing anything. It runs published v49 (Aug 30) on gpt-4.1
  with the Kate voice. Its system prompt is 4,711 tokens. I saved a byte-exact copy, a v43→v49
  diff and a 20-call latency sheet to ops/tuning.
- I checked all 8 phone numbers. 8930 carries the caller-lookup webhook. Pool lines 01–04 answer
  with live AVA and call out as HEAR-IT-LIVE, with no webhook. Pool 05 (…8976) is the odd one: it has
  been on ZZ-PROBE-36, in AND out, since Aug 30.
- How callers get the pool numbers: not from us calling them. The pool has placed ZERO outbound calls
  in 30 days (2 ever, both internal tests on Jul 22). None of the three callers ever got a call from
  us. The homepage status rail shows DEMO-POOL-03's full number on screen (the Aug 28 caller dialed
  exactly that line), and the public board.json lists all five pool numbers.
- I built both handoffs on the old AVA test agent only, sent its webhooks to a new ZZ sink, and borrowed
  pool line …8976 for 42 minutes. Then I put it back exactly as it was.
- Result: the warm transfer (T1) does NOT work into the AI desk. Retell waits for a "human", the desk's
  AI greeting doesn't count, and it gives up after 30 s with both legs billed. The agent swap (T2)
  works: the desk is talking 1.2 s after the trigger, on the same call, with your number carried over and
  one bill. My recommendation for v50b: agent swap.

DONE TABLE
| # | Item | Status | Proof |
|---|---|---|---|
| 1a | Live agent + LLM read, snapshot, token count | DONE | ops/tuning/ava-8930-v49-snapshot-2026-09-26.md (1a89f38) · 4,711 tokens cl100k_base · prompt SHA-256 6846ef60…9f7766, byte-exact round-trip checked on the git blob |
| 1b | v43→v49 versions + prompt diff | DONE | version table in the snapshot · ops/tuning/ava-8930-v43-v49.diff (140 lines) |
| 1c | Number audit, 8 numbers | DONE | table below · expected finding holds for 8930 + POOL-01..04; POOL-05 is the exception |
| 1c-2 | Pool-number origin check | DONE | 0 outbound calls ever to the three callers · 0 pool outbound in 30 days |
| 1d | Latency baseline, last 20 real inbound | DONE | ops/tuning/ava-8930-last20-2026-09-26.csv |
| 2a | Test agent verified, webhook → ZZ sink, web-callable | DONE | agent_44b48507d38c0bfc29a3150a74 exists · web call call_7d1358888c31641645986ae60d3: greeting spoken, 3 events in the sink, 0 in the live AVA or desk rails |
| 2b | Retell docs read, answers with URLs | DONE | section 2b below |
| 2c | T1 + T2 built, test agent only published | DONE | test v3 (T1+T2) and v4 (+T1b) published · prompt byte-identical to v2 · live and desk agents: version lists identical before/after |
| 2d | …8976 inbound rebound, then restored | DONE | before/after below · all 8 numbers' bindings identical to pre-run |
| 2e | T1 and T2 runs | DONE (minimum) | T1 ×1 phone · T2 ×1 phone + ×1 web · 3× not run: Shane ended the calls · T1b: 0 runs |
| 2f | Verdict + recommendation + desk-rail requests | DONE | sections 2f below |
| 3 | board.json + ISO LOG, Notion inbox, this file | DONE | see the commits line below |

PART 1 — FORENSICS (read-only)

1a · Live agent agent_d5ada9f774fe3ae7f034d2c677 · LLM llm_d0f4aff62bb8b60ff878055aa18c
- Serving: published v49 (2026-08-30 14:59 CT). 8930 binds latest_published = v49. v50 is an
  unpublished draft (only change: tool_call_strict_mode true).
- Model gpt-4.1, temp 0.2 · voice cartesia-Kate on sonic-3-latest, speed 1.0 (dynamic speed on).
- Opening: begin_message is "{{opening_line}}". The 8930 lookup webhook supplies the line. With no
  variables (the pool lines) Retell speaks default_dynamic_variables.opening_line (the 53-word cold opener).
- interruption_sensitivity 0.82 · backchannel ON, frequency 0.30 · responsiveness 1 (dynamic on)
- reminder 25,000 ms × 1 · silence hang-up 30,000 ms · max call 600,000 ms · boosted_keywords none
- denoise noise-cancellation · ambient "call-center" at 0.08
- Handbook ON: high empathy, filler words, default personality. OFF: smart matching, AI disclosure,
  scope boundaries (canon wants those three ON).
- Tools: end_call · book_appointment (POST → circulant.app.n8n.cloud). Knowledge base: none attached.
- Post-call webhook → circulant.app.n8n.cloud (AVA post-call rail 6r8YHuMEJbxeDyT5), event call_analyzed.

1b · What changed, v43 → v49
- v43 Aug 18 12:41 CT — AVA SEAL baseline; webhook to the ava-postcall-wrap rail.
- v44 Aug 18 13:52 — voice emotion "happy", speed 1.02 → 1.00. Prompt same.
- v45 Aug 18 20:17 — dynamic responsiveness/speed/expressive ON, reminder 20 s, webhook → ava-postcall,
  new cold opener, booking tool reworked for Central Time. Prompt +10/−7 lines.
- v46 Aug 19 10:43 — today's cold opener ("…home service trade, or a transportation fleet today?").
- v47 — unpublished draft, same as v46.
- v48 Aug 19 22:46 "Phase 8 final polish" — forked from v44 (not v46). Backchannel ON, begin delay 0,
  reminder 25 s ×1, booking tool takes the cell from {{caller_cell_e164}}. Prompt 16,113 → 21,527 chars.
- v49 Aug 30 14:59 — voice model sonic-3.5 → sonic-3-latest. Nothing else.

1c · Numbers (all 8 are retell-twilio; none has a forwarding/fallback number)
| Nickname | Number | Inbound | Outbound | Inbound webhook |
|---|---|---|---|---|
| (none) | 414-240-8930 | AVA — AI Voice Agency @ latest_published | same | SET → circulant.app.n8n.cloud (WF-ANI-AVA) |
| (none) | 414-775-0019 | AI CHAUFFEUR — CAPTURE DESK @ latest_published | same | unset |
| (none) | …5008 | CAPTURE DESK @ latest_published | same | unset |
| DEMO-POOL-01 | …8042 | AVA live @ latest_published | AVA HEAR-IT-LIVE v1 | unset |
| DEMO-POOL-02 | …6409 | AVA live | HEAR-IT-LIVE | unset |
| DEMO-POOL-03 | …6486 | AVA live | HEAR-IT-LIVE | unset |
| DEMO-POOL-04 | …1886 | AVA live | HEAR-IT-LIVE | unset |
| DEMO-POOL-05 | …8976 | ZZ-PROBE-36 (no version pin) | ZZ-PROBE-36 (no pin) | unset |
POOL-05 was last changed 2026-08-30 14:36 CT (the Sonic probe day) and never put back.

1c-2 · Where did these callers come from?
| Caller | Their call in | Outbound call to them in the 30 days before? |
|---|---|---|
| 414-…-7912 | Sep 26 12:36 CT → DEMO-POOL-01, 26 s | NO (none ever, from any number) |
| 781-…-6601 | Sep 26 13:08 CT → 414-240-8930 (main line, not the pool), 29 s; said "Remote in service" = limousine service | NO (none ever) |
| 414-…-6313 | Aug 28 20:14 CT (71 s) + 20:17 (21 s) → DEMO-POOL-03 | NO (none ever) |
Outbound from the pool, last 30 days: 0 calls. All time: 2 — Jul 22 22:00 CT POOL-02 → POOL-05 (70 s,
HEAR-IT-LIVE) and Jul 22 22:08 CT POOL-03 → an internal owner line (57 s). The call-me demo has not
dialed anyone from the pool in 30 days. Public exposure found instead: the homepage status rail
(js/ava-signal.js, visible text) prints POOL-03's full number, and hq/board.json (served publicly) lists
all five.

1d · Last 20 real inbound calls on the live agent (Aug 2 → Sep 26; private lines and our own lines excluded)
- 13 calls reached a real LLM turn. Medians: e2e p50 1,618 ms, e2e p90 2,793 ms (12 with e2e data),
  LLM p50 662 ms, LLM p90 1,059 ms, 5,587 tokens per request.
- 9 of 20 callers said nothing. 17 of 20 ended with the caller hanging up. Tools used: book_appointment 2, end_call 3.
- First agent turn: the 8930 lookup opener (26 words) ends at 7.2–8.0 s. The default cold opener on the pool
  lines (53 words) ends at 15.2–15.9 s when nobody interrupts.

PART 2 — TRANSFER PRECONDITION (test agent only)

2a · Test agent agent_44b48507d38c0bfc29a3150a74 "AVA SALES v37 TEST" exists (retell-llm, LLM
llm_eb67ba951ee28c1eec75c960e0ee, v2 published Aug 2). New webhook: the ZZ sink, n8n hF7cxEn0SuVaEnnL
(webhook path zz-sink-retell-test; stores events in its execution log only; Error Sentry attached;
self-test passed). CLAUDE.md names no sink URL, so I built one. Web-callable: a real web call
(call_7d1358888c31641645986ae60d3, 16 s) got the greeting, and its call_started / call_ended /
call_analyzed all landed in the sink, none in the live AVA or desk rails.

2b · Retell docs (read 2026-09-26, API spec rev 2026-09-14-b240eb0)
(i) transfer_call — docs.retellai.com/build/single-multi-prompt/transfer-call ·
    schema docs.retellai.com/api-references/update-retell-llm ·
    docs.retellai.com/deprecation-notice/2026/01-23_cold_transfer_mode_selection ·
    docs.retellai.com/build/telephony/sip-headers
  - Phone calls only. Cold = the agent drops off at once (cold_transfer_mode sip_invite default, or
    sip_refer). Warm = the agent stays on, can wait for a human (human detection), whisper to the
    destination (private_handoff_option) or speak to both (public_handoff_option). Agentic warm = a
    separate transfer agent screens the destination, then bridges or cancels.
  - Caller-number option: show_transferee_as_caller: true ("Displayed Caller ID → User's Number").
    Warm sets From + P-Asserted-Identity to the caller. Cold honours it only with
    cold_transfer_mode sip_invite. Retell Twilio numbers support it; if unsupported the transfer fails.
  - What the caller hears while the destination answers: on_hold_music (ringtone default | none |
    relaxing_sound | uplifting_beats | custom), then a bridge audio cue (enable_bridge_audio_cue, default on).
  - Custom SIP headers: custom_sip_headers (X-…, User-to-User, Diversion). "Preserved only when
    transferring directly to a SIP endpoint. They may be stripped when transferring to a PSTN number."
  - The transferring agent's leg stays on the line and bills at the normal rate through dial, hold and
    briefing; once bridged the AI fee stops and only telephony continues. Events: transfer_started /
    transfer_bridged / transfer_cancelled / transfer_ended.
(ii) agent swap — docs.retellai.com/build/single-multi-prompt/transfer-agent (tool type agent_swap)
  - One call: "same call with the same call_id … a single entry in call history."
  - Dynamic variables carry over (the ones passed at call start and any extracted during the call), plus
    metadata and the full transcript. There is no "pass variables" parameter.
  - Webhook: webhook_setting only_source_agent (DEFAULT) | only_destination_agent | both_agents.
    Post-call analysis: post_call_analysis_setting (required) only_destination_agent | both_agents
    (destination wins name clashes).
  - Works on web calls: yes.
  - Stays pinned to the FIRST agent: recording access, data storage, PII redaction, denoising. Voice,
    LLM, prompt, tools, KB, keywords and interruption sensitivity switch.
  - agent_version defaults to "latest" = the newest CREATED version (a draft). Pin latest_published.

2c · Built on the test agent (test agent only, published twice; its prompt is unchanged)
- v3: T1 probe_t1_warm_transfer → +14147750019, warm, show_transferee_as_caller true, ringtone,
  speak_during_execution false, trigger "warm transfer test".
  T2 probe_t2_agent_swap → agent_e41b2e957f1de46cf23dc25a84 @ latest_published (= desk v1),
  webhook both_agents, analysis both_agents, keep voice/language false, trigger "agent swap test".
- v4 (added mid-probe after T1 failed): T1b probe_t1b_warm_bridge = T1 with human detection OFF,
  trigger "bridge test". Never called.

2d · DEMO-POOL-05 (…8976) bindings
- Before (pre-run): inbound ZZ-PROBE-36, no version pin · outbound ZZ-PROBE-36, no pin · no webhook.
- Probe: inbound → test agent v3 at 15:46:56 CT, v4 at 16:22:17 CT. Outbound never touched.
- After (16:29:10 CT): inbound ZZ-PROBE-36, no pin — identical to before. Outbound identical.
- Dial instructions used: call the line ending 8976, say "warm transfer test" (T1), call again and
  say "agent swap test" (T2); "bridge test" (T1b) from 16:22 CT.

2e · Runs
| Run | Calls | Timeline (seconds on AVA's clock) | What the caller heard | Desk got the caller's number? | Desk ticket and text-back | AVA's leg | Webhook events | Billed |
|---|---|---|---|---|---|---|---|---|
| T1 warm (phone, house line) | AVA …385141a0 + desk …c587f210 | trigger ends 6.98 · tool 7.83 · desk answers 9.02 · cancelled 39.06 · AVA back 39.84 | 0.85 s silence, ~31 s on hold (ringtone per config; hold audio isn't recorded), then AVA: the transfer did not go through. Never heard the desk. | YES, from = the caller's …1062 | Ticket made from Retell's own "Hello, is anyone there?" words. Owner SMS + email sent. Caller text not due (no consent asked); target would be the caller's …1062. | Stayed up; the caller hung up at 46.2 s | AVA leg → sink: started, transfer_started, transfer_cancelled, ended, analyzed. Desk leg (a separate call) → desk rail: started, ended, analyzed | AVA 47 s 14.03¢ + desk 31 s 9.38¢ = 23.41¢, both AI-billed the whole overlap |
| T2 swap (phone, house line) | …0f35fab3 (one call) | trigger ends 7.93 · tool 8.78 · swap OK 8.80 · desk's first word 9.15 | 1.22 s gap, no hold audio, then the desk greeting. Full trip taken, SMS consent yes. | YES, same call; the desk read the caller's …1062 | Ticket made, tenant "DEMO" (the rail saw AVA's agent id). Caller text due, aimed at the caller's …1062; skipped because that line is on SMS DND (Twilio 30006, can't take texts). | Handed off; the desk ended the call at 113.7 s | One call_id. Sink: started, ended, analyzed. Desk rail: ended, analyzed (no started). | One bill: 114 s, 30.59¢ |
| T2 swap (web, scripted fake mic) | …1cd313e9 | trigger ends 9.48 · tool 10.31 · desk's first word 10.64 | 1.15 s gap | n/a (web) | Ticket made, tenant "DEMO", no phone. Owner SMS + email sent. | The desk's 20 s silence rule ended it at 86.9 s | Same 3 + 2 | One bill: 87 s, 21.71¢ |
| T1b warm, no human detection | — | built in v4 | not run | | | | | |
Desk "ANI": desk v1 makes no WF-ANI call (0 runs of XLSd3vt41vhsXIA9 in the window; 0019 has no
inbound webhook). Its first code node reads {{user_number}} and resolved the caller's …1062 on both phone
runs. The T1 desk leg received only Twilio SIP values as variables (P-Asserted-Identity host
sip.retellai.com, Diversion = 0019). Nothing named AVA.

2f · Verdict
| | T1 warm transfer | T2 agent swap |
|---|---|---|
| Caller number kept | yes (with show_transferee_as_caller) | yes, same call |
| Text-back lands on the caller's cell, not 8930 | yes (desk leg from = caller) | yes (rail aimed at the caller's number) |
| Handoff audio | ~31 s hold, then a failure line; never bridged | 1.2 s gap, straight into the desk |
| Latency | never completed (cancelled 31.2 s after the tool) | 1.15–1.22 s trigger → desk voice |
| Billing | two legs, both AI-billed for the whole attempt | one call, one bill |
| Post-call webhooks | two separate calls, each fires its own webhook | one call_id; source 3 events + destination 2 when set to both_agents (default = source only) |
| Can the desk rail tell it came via AVA? | no, looks like a direct call (only hint: P-Asserted-Identity host sip.retellai.com) | yes: agent_id = AVA's agent, to_number = the AVA line, transcript opens with AVA. The rail doesn't read these yet. |
| Web calls | no | yes |

RECOMMENDATION — AGENT SWAP. For v50b's handoff_to_desk:
  type agent_swap · agent_id agent_e41b2e957f1de46cf23dc25a84 · agent_version "latest_published" ·
  webhook_setting both_agents · post_call_analysis_setting both_agents · keep_current_voice false ·
  keep_current_language false · speak_during_execution false (the prompt speaks the bridge line itself).
  Failure path: per the docs a swap fails only on a custom-LLM or chat-channel target. On failure the source
  agent stays on the call and the tool result reads successful:false; the fallback keys off that result.
  Not fault-injected in this run.

REQUESTS FOR THE CAPTURE DESK CHAT (requests only; I changed nothing on the desk or its rails)
1. Recognise a swapped call. If call.agent_id is an AVA SALES agent (live d5ada9…, test 44b485…) or
   to_number is an AVA line (8930 or a pool line), file it as the AI Chauffeur desk (CAPTURE-ONLY) and
   set via_line = "AVA 8930". Today it falls back to tenant "DEMO".
2. The "call the desk back at …" line in caller copy and the trip sheet use c.to_number. On a swapped
   call that is the AVA line; use 0019 instead.
3. Tag it: a GHL tag (e.g. via-ava-line), a note line, and a "via AVA line" marker in the owner SMS and email.
4. Swapped calls arrive as call_ended + call_analyzed with no call_started (already harmless).
5. With both_agents, the AVA post-call rail and the desk rail both act on the same call_id. Only one
   caller text should go out, so the AVA side (v50b 3b, handoff_attempted field) has to stand down.
6. Clean-up: delete the three test tickets from this run (calls ending c587f210, 0f35fab3, 1cd313e9) from
   the trip-sheet data table x9ANXgd6qTcriXQn and the trip log sheet, plus the tags and notes on the
   house-line contact. Two of those public trip sheets print the house-line number.

IDS / COMMITS / ROLLBACK
- Live AVA agent_d5ada9f774fe3ae7f034d2c677 v49: untouched (version list identical before/after).
- Desk agent_e41b2e957f1de46cf23dc25a84 v1 published / v2 draft: untouched (identical before/after).
- Test agent_44b48507d38c0bfc29a3150a74: v2 (clean, pre-run) → v3 (T1+T2) → v4 (T1+T1b+T2), published;
  webhook → ZZ sink; bound to no number now.
- ZZ sink n8n hF7cxEn0SuVaEnnL, active, version d45e3d46. Left on for v50b ("test calls → ZZ sink").
- Calls: web check call_7d1358888c31641645986ae60d3 · T2 web call_13556d19ebd3b1eae061cd313e9 ·
  T1 AVA leg call_fbb84500a75dbe6a5f2385141a0 · T1 desk leg call_1f701511990399e39e6c587f210 ·
  T2 phone call_2ecc095b6f6af8e08350f35fab3.
- Commits: 1a89f38 (Part 1 forensics + .vercelignore ops) · this report + board flip (next commit on main).
- Rollback: POOL-05 is already restored. Undo line if ever needed:
  PATCH /update-phone-number/<POOL-05> {"inbound_agents":[{"agent_id":"agent_cfc97001055d3a5e377d0979d7","weight":1}]}.
  Sink: POST /api/v1/workflows/hF7cxEn0SuVaEnnL/deactivate. Test agent: nothing live to undo; fork v2
  for a clean base. Part 1 files: delete the three ops/tuning files by hand. Do NOT git revert 1a89f38:
  that would also drop the .vercelignore line and serve ops/ publicly again.

WHAT'S NEXT (needs Shane)
1. Fire the v50b build prompt. Its gate (this report) now exists; use the agent swap settings above.
2. Hand the six requests above to the Capture Desk chat.
3. Your calls:
   a) POOL-05 has been on ZZ-PROBE-36 in AND out since Aug 30. Put it back on AVA live / HEAR-IT-LIVE
      like the other four?
   b) The homepage status rail and the public board.json show pool numbers. Hide them?
   c) One T2 call from the Google Voice line would prove a text-back actually lands. The house line
      can't receive SMS.
   d) T1b (warm transfer without human detection) is built on test v4 but was never called. It only
      matters if a phone transfer is ever wanted.
4. For v50b step 1d: live v49 differs from canon on backchannel (0.30 vs 0.35), the three Handbook
   switches (OFF vs ON), ambient (call-center vs OFF), reminder (25 s vs 8 s) and silence hang-up (30 s vs 20 s).
   Its opener already uses {{opening_line}} with a default value.

GOTCHAS
1. Warm transfer into an AI desk fails by design. Retell's human check doesn't accept the desk's AI
   greeting and gives up after 30 s. Meanwhile AVA's leg says "Hello, is anyone there?" INTO the desk, the
   desk logs that as a caller, and it files a junk ticket plus an owner alert for a call no human heard.
2. agent_swap's default version is "latest", the newest CREATED version. On the desk today that is the
   unpublished v2 draft. Always pin latest_published.
3. agent_swap's default webhook_setting is only_source_agent. Leave it and the desk rail never hears
   the call: no trip sheet, no text.
4. A swapped call keeps the SOURCE agent_id and to_number. The desk rail files it as "DEMO", and its
   callback line would print the AVA number.
5. After a swap the desk's own rules apply: its 20 s silence hang-up ended the web run. Denoise, data
   storage, PII and recording stay pinned to AVA's settings.
6. Hold music is not in Retell's recording (3 channels: caller / agent / transfer target), so what a
   caller hears on hold can't be proven from the recording.
7. aivoiceagency.ai/ops/tuning/* was publicly served (HTTP 200). ops/ is now in .vercelignore.
   config-snapshots/ is still served (e.g. config-snapshots/2026-08-18-ava-seal/gate-result.json → 200).
8. The house line is on SMS DND (Twilio 30006). No test text-back to it will ever land.
9. The test agent's book_appointment still posts to the LIVE booking rail. v50b replaces it.
10. Retell API moves: GET /get-agent-versions was removed 2026-09-15 (use GET /list-agent-versions/{id});
    web calls are POST /v3/create-web-call; the 2.x browser SDK is deprecated 2026-09-30.
```
