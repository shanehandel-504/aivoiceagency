# AVA-AGENT-FIX-v1 — the AVA line (414-240-8930): transfer on the first yes, voice pinned, handoff re-pinned (2026-10-29)

> Run from PASTE-CC-AVA-AGENT-FIX-v1 (Session B, window "AVA 8930 agent fix"), evidence `reports/2026-10-28-agent-measure-v1.md` (Phase 0). Writer: AVA TEST `agent_44b48507d38c0bfc29a3150a74`, then live AVA `agent_d5ada9f774fe3ae7f034d2c677` at the promote, the five AVA number bindings, this repo. Read only: AI Chauffeur `agent_9ebb…` and 0019, the briefing agents, every n8n workflow (executions and code read only), GHL, Twilio, Cal.com, the calendar. Masking for this public repo: keys and secret headers `[masked]`, every URL `host/[path]`, caller numbers last four, no GHL contact ids. Recordings are not in the repo. Shane's START RULE answer (Oct 29, 17:30 CT): "Test now, hold promote"; his overnight order: wait up to 90 minutes for 0019 to serve a version above v16, then promote against whatever 0019 serves.

## HEADLINE

**AVA FIXES LIVE — 8930 v54 · email ask gone (none existed) · transfer fires on first yes (S1, S2, live proof) · sonic-3.6 · handoff → AIC v17 · rollback re-pin v53**

8930 (in + out) and pool …8042 …6409 …6486 …1886 serve live AVA **v54** since **2026-10-29 22:20:02 CT** (03:20:02Z Oct 30).

| | Before (live v53) | After (TEST v18 → live v54) |
|---|---|---|
| Transfer | Prompt told the model to speak the bridge line, then call `handoff_to_desk`. The only handoff since Oct 7 (call_4602101bf4ce5dc45f07c98c785, Oct 17) spoke the line at 28.44 s with no tool call; the caller said yes twice more; the tool fired at 55.44 s. | The tool speaks the line itself (`speak_during_execution`, `static_text`, byte-exact). S1 and S2: the tool fired on the caller's first accept, the line was heard once, the AI Chauffeur greeting started 0.34 s and 0.40 s after the tool. |
| Prompt span | `Yes: speak "Let me transfer you to the AI Chauffeur demo now." then call handoff_to_desk and stop. Line first, tool second, same turn. Never say …` | `Yes: call handoff_to_desk. Never say …` — rest of the prompt sha256 `786467b7f17324338e07fc12aa29940bc0ee09b08b47e0edc4ad49bcd34da982` equal before and after (15,259 → 15,151 chars). No new spoken line. |
| Handoff tool description | "Call this tool after the caller accepts the transfer offer." | "Call this the moment the caller accepts the transfer offer with any yes-form." |
| Handoff pin | AIC v14 (live) / v13 (TEST); 0019 served v15 at step 0, v16 since 19:47 CT | TEST v18 → v15 (tested); live v54 → **v17**, what 0019 serves since 22:19 CT (Shane's overnight order) |
| Voice | `sonic-3-latest` (v53 forked from v51, so v52's pin was lost) | `sonic-3.6` |
| Email ask | — see EMAIL: nothing to remove | unchanged |

## EMAIL — nothing to remove

The PASTE expected an email parameter in the booking tool's schema. There is none:

- `book_slot` on live v53 and TEST v17 takes `which_slot` (required), `caller_name`, `caller_phone`, `company`, `business_type`. No tool, state or setting carries an email field; the general prompt says "email" 0 times. The only hit is the post-call analysis field `caller_email` ("as confirmed/read back during the call"), which reads the transcript and asks nothing — kept, as the PASTE says.
- Every AVA and TEST call since 2026-09-01 (66 calls) plus the five AIC calls since Oct 28: **0 turns contain the word "email"**. (A first scan matched "voic*email*" in the v49 opener; the word-boundary scan is the one that counts.)
- WF-SHANE-SLOTS `xB0ifGzDozl2NwBz` (serves `37590140`): the BOOK route's 38 nodes carry no email anywhere. Already optional; n8n untouched.
- S3 (a plumber books the setup call on TEST v18): no email asked; `book_slot` called with `{"business_type":"plumbing","caller_name":"Sam","caller_phone":"","company":"Sam's Test Plumbing","which_slot":"1"}`.

Where Shane heard an email ask is not found. A call id or time would let the next run trace it.

## STEPS

| Step | Result | Evidence |
|---|---|---|
| 0 Preflight | read only | 8930 in+out and pool …8042 …6409 …6486 …1886 → AVA v53 (pinned); TEST v17 published, no number; 0019 → AIC v15. Live prompt sha256 `3cbbb505988e9e84f8fa6e0af3c4121e2744b8ed1d95c8b370d5e2cdc9bbd885` (TEST v17 equal). Rollback: unmasked `PASTE\rollback\ava-8930-v53-20261029T222645Z.json`, masked `ops/tuning/ava-8930-v53-rollback-2026-10-29.json`. |
| 1 Email | nothing to remove | above |
| 2 Transfer | TEST v18 | handoff_to_desk: `speak_during_execution` false → true, `execution_message_type` → `static_text`, `execution_message_description` → the bridge line, description changed; `use_swap_agent_max_duration` true (kept); prompt span reduced |
| 3 Handoff pin | TEST v18 → AIC v15 (what 0019 served at step 0) | promote: see PROMOTE |
| 4 Voice + publish | TEST v18 published 22:35:17Z | diff v17 → v18: agent `voice_model` only; LLM `general_prompt` + `general_tools` (handoff_to_desk: 5 fields) only |
| 5 Tests | S1–S4 PASS, one run each | TESTS |
| 6 Promote | live v54 published 03:19:50Z, five numbers pinned 03:20:01–03:20:02Z, verify 11/11, proof PASS | PROMOTE |
| 7 Close | this report, board, commit | |

## TESTS (TEST v18, web calls, `metadata.test_mode`, Retell cap 90 s + harness hang-up at 88 s, one create per run)

Start values the way AVA web call-start `VDiBEwZ8FB28ME8b` gets them (a synthetic `call_inbound` to 8930's own inbound webhook, from_number empty — 16 keys incl. opener and slots). The call-start workflow itself always targets the agent bound to 8930, so it cannot reach a test agent; the harness mirrors it.

| Script | Call | Result | Turn gaps (caller last word → agent first word) |
|---|---|---|---|
| S1 limo, first yes: "I run a limo company and want to see how a reservation works." → "Yes." | call_7961265d469c232330eaef4d3c9 | **PASS** — tool on caller turn 2 at 32.60 s; bridge line 30.15–32.47 s, once; AI Chauffeur greeting 32.94 s (+0.34 s); no second ask | 1.33 · 1.31 s |
| S2 the Oct 17 caller's words: "Yeah. I was checking in. Do you do limo agencies?" → "Yeah." (then, only if needed, "Oh, I'm ready." / "Is AI Chauffeur there?" → "Yeah." → "Yeah. Already transfer me.") | call_737d731169e94f87dc8e35684a9 | **PASS** — tool on the first accept (caller turn 2, transcribed "Yet,") at 36.23 s; bridge line once; greeting +0.40 s | 1.40 · 3.12 s |
| S3 plumber books | call_d9bffb0f94f45d15fbf1f96dfc9 | **PASS** — no email asked; `book_slot` with the fields above; BOOKED as a **dry run** (n8n run 17697: Dry Run? → Respond Dry → Dry Sink; no event, no text, no alert) — nothing on Shane's calendar | 2.95 · 0.92 · 3.38 (get_open_slots in the gap) · 1.42 · 3.46 (book_slot in the gap) s |
| S4 "What does it cost per month?" | call_93cc077e288f42cd4df088b0668 | **PASS** — "Four hundred ninety-seven a month is the base price. You get the full price in writing before you start. …"; the call ran on TEST v18 = `sonic-3.6` | 2.34 · 0.94 s |

Spend on TEST: 4 calls, 66.8¢ (15.4 · 16.5 · 25.2 · 9.7).

## PROMOTE

**The wait.** Held at Shane's START RULE answer; overnight order: read 0019 every 5 minutes for up to 90 minutes, promote once it serves a version above v16. Reads 21:49–22:14 CT: v16 (6 reads). **22:19 CT: v17** ("v16 + BUNDLE v1.2 (2026-10-29): grouped asks, break-out to discovery, consent in the name+number turn, facts, team opener rule", published, sonic-3.6).

**Build.** `create-agent-version {base_version: 53}` → v54 (LLM v54); PATCH LLM v54 `{general_prompt, general_tools}`; PATCH agent v54 `{voice_model, version_title}`. Copied from TEST v18, not retyped: the prompt is live v53 with the one span replaced and is **byte-equal to TEST v18**; the handoff tool is v53's with the five TEST v18 fields copied in (equal to TEST v18's apart from the pin).

| v53 → v54 | Before | After |
|---|---|---|
| agent `voice_model` | `sonic-3-latest` | `sonic-3.6` |
| LLM `general_prompt` | 15,259 chars, sha256 `3cbbb505…` | 15,151 chars; rest-of-prompt sha256 `786467b7…` equal |
| handoff_to_desk `agent_version` | 14 | **17** |
| handoff_to_desk `description` | "Call this tool after the caller accepts the transfer offer." | "Call this the moment the caller accepts the transfer offer with any yes-form." |
| handoff_to_desk `speak_during_execution` / `execution_message_type` / `execution_message_description` | false / — / — | true / `static_text` / "Let me transfer you to the AI Chauffeur demo now." |
| every other agent field, every other LLM field, the other 5 tools | — | equal (diff gate) |
| greeting: `begin_message` sha256 / cold `opening_line` sha256 | `71d7ffad…` / `967c09e6…` | equal |

**Publish and pin.** v54 published 03:19:50Z with every number still on v53. Pinned 03:20:01–03:20:02Z, pool lines first, each read back: …8042, …6409, …6486, …1886 inbound → v54 (their outbound agents untouched); …8930 inbound + outbound → v54. `verify 54`: 11/11 (v54 + LLM published · diff is the allowed set · v53 still published · no version above 54 · five numbers on v54 · handoff → AIC v17). Masked v54 snapshot: `ops/tuning/ava-8930-v54-live-2026-10-29.json`.

**Live proof — S1 on v54** (web call through the harness, start values from 8930's inbound webhook, `metadata.test_mode`): call_872b375e3c2f10ea728eaf7ae5d, 52.8 s, 15.3¢. **PASS** — "Yes." (caller turn 2) → bridge line 30.23–32.79 s, once → `handoff_to_desk` (agent_version 17) at 32.87 s → AI Chauffeur greeting 33.16 s (+0.30 s); no second ask. Turn gaps 1.43 · 1.00 s. Greeting = the cold opener, unchanged.

Rails on the proof call: `AVA Post-Call to GHL` run 18032 (Quarantine Gate: `is_test` true, `handoff_swapped` true → Build GHL Body → Has Identifier false → no GHL write → owner alert handed to OWNER-ALERT, skipped for test_mode, run 18033) **and** `DEMO POST-CALL RAIL v1` run 18031 (trip sheet, sheet row, owner email + owner SMS; OWNER-ALERT skipped, run 18034).

**Rollback:** `s6-promote.mjs pin 53` — the five numbers back on v53 (one command; v53 stays published). Last resort, also restore TEST: nothing needed (TEST v17 still published, TEST is on no number).

**Spend:** 5 web calls, 82.1¢ (4 on TEST 66.8¢ + 1 live 15.3¢). Cap $8.

## GHL AFTER A HANDOFF (READ ONLY — Shane's ruling: a caller who transfers from AVA to AI Chauffeur is an AI Chauffeur lead and gets the AI Chauffeur drip and emails, not AVA's. Report only; nothing fixed.)

**On S1 and S2 (test web calls):**
- The caller never reached GHL: no contact, no tag, no pipeline, no drip. A web call has no caller number, so the AI Chauffeur rail's GHL leg did not run (`Leg GHL?` false, flag `ghl_upsert: false`).
- **The AVA post-call rail did not fire.** The TEST agent's webhook goes to the ZZ sink; `AVA Post-Call to GHL` (6r8Y…) and `WF-POSTCALL-AVA · 8930 Call Wrap` (kpYl…) have no run carrying either call id.
- **The AI Chauffeur rail fired, twice per call** (`DEMO POST-CALL RAIL v1`, TkET…: runs 17676 + 17679 for S1, 17687 + 17688 for S2 — call_ended stops at "Is Call Analyzed"; call_analyzed runs the legs): trip sheet stored (AIC-AEF4D3C9, AIC-E35684A9), Google Sheet row appended, "Email Ticket to Owner" sent (Gmail), "Owner SMS Alert" sent (GHL conversation on the owner record). `→ OWNER-ALERT` was skipped: "payload carried test_mode" (OWNER-ALERT v1 runs 17680, 17690).

**On the live proof call (observed, call_872b375e3c2f10ea728eaf7ae5d on v54):** **both rails fired on the same call.** `AVA Post-Call to GHL` run 18032 detected the swap (`handoff_swapped` true, `desk_vars_present` true, industry transportation) and built `tags: ["ava-demo-hot", "ava-handoff-aic", "TEST", "zz-internal", "phone-unresolved"]`, source "AVA → AI Chauffeur handoff" — the last three only because it was a test web call; no GHL write (no caller number). `DEMO POST-CALL RAIL v1` run 18031 filed the AI Chauffeur trip ticket and sent the owner email + SMS.

**On a real phone call that hands off today (from the served code, confirmed by the proof call's computed tags; no real lead has handed off since Oct 7 — the one handoff was the owner's own call on Oct 17):**
- **Both rails fire on the same call.** The live agent's webhook is `AVA Post-Call to GHL` (circulant.app.n8n.cloud/[path]) and the AI Chauffeur agent's is `DEMO POST-CALL RAIL v1` (circulant.app.n8n.cloud/[path]); `handoff_to_desk` sends both agents' webhooks (`webhook_setting: both_agents`).
- **AVA rail** (`Build GHL Body`): upserts the caller by phone with tags **`ava-demo-hot` + `ava-handoff-aic`**, source "AVA → AI Chauffeur handoff", plus a call note. Its own comment: "a call AVA handed to the AI Chauffeur desk stays a hot AVA lead and is marked as a handoff." Owner alert headline "AVA CALL — HANDOFF TO DESK". AVA texts the caller nothing on a handoff (`Build Text Back` stops: "the desk texts the trip sheet"); its caller email and SMS nodes are disabled.
- **AI Chauffeur rail**: finds the caller by phone; tags **`demo-caller` + `via-ava-line`** and adds a note (or creates the contact with source "AI Chauffeur demo line" and those tags); texts the trip sheet when the caller said yes to texts; emails the caller a copy when an email was captured; owner email + owner SMS + OWNER-ALERT.
- **Pipeline: none.** No active n8n workflow (30 scanned) creates an opportunity in any pipeline — not "AIChauffeur Sales", not "AVA Sales".
- **Drip: none from either rail.** The n8n `AVA Drip Engine v1` enrolls only from `AVA · social_intake · realtime` (lead ads) or a contact tagged `demo-no-book`, and no active workflow adds `demo-no-book`. No AI Chauffeur drip exists in n8n or in GHL (8 GHL workflows by name; GHL's API does not expose their triggers, so whether `02_AVA_New_Lead_Internal_Notification` or the legacy `03_AVA_7_Day_Follow_Up_Drip` fires on a tag needs a look in the GHL builder).
- **What does key on the AVA tag:** `AVA Booking Receipt` (NMSW…) reads `ava-demo-hot`; a handed-off caller who later books on the AVA calendar gets AVA's receipt text and email.
- **Against the ruling:** today a handed-off caller is filed as an AVA lead (`ava-demo-hot`, AVA source) and also as an AI Chauffeur demo caller; there is no AI Chauffeur drip for them to receive. The two rails also race on the same contact (one upsert, one tag add).
- Fix scope for a later run (not done): the AVA rail's `Build GHL Body` handoff branch (tag and source), whether the AVA rail should touch a handed-off caller at all, an AI Chauffeur drip (does not exist yet), and the GHL builder triggers.

## GOTCHAS

1. **The email ask the PASTE set out to remove does not exist** on the agent, its tools, the booking workflow, or any recorded call since Sep 1.
2. **Retell's docs say the agent-swap message plays "if the transfer takes more than ~2 seconds."** On the wire it is spoken first, then the swap runs (S1: line 30.15–32.47 s, tool 32.60 s). The Oct 6 note that called it "not a bridge-line mechanism" was wrong.
3. **The three-ask call is Oct 17** (call_4602101bf4ce5dc45f07c98c785), not Oct 28 as the PASTE says.
4. **Handoff test calls reach the owner.** `webhook_setting: both_agents` sends every handoff to the AI Chauffeur rail, whose legacy owner email and SMS legs ignore `test_mode` (only OWNER-ALERT v1 honours it). S1 and S2 each sent one; the live proof sent one more.
5. **`metadata.test_mode` makes WF-SHANE-SLOTS book as a dry run** (BOOKED answer, `appointment_id: dry-run`, ZZ sink) — a scripted booking test never lands on the calendar.
6. **AVA called `get_open_slots` on S3 although `slot_1` came in the start values** (the prompt: "get_open_slots is called only when {{slot_1}} is empty"). Grok item; unchanged.
7. **A mumbled yes is slower:** S2's "Yeah." transcribed as "Yet," took 3.12 s; a clean "Yes." took 1.31 s. The tool still fired on it.
8. **The call object carries no voice model** (nor does the public log); the evidence is the call's `agent_version` and that version's `voice_model`.
9. **The 4-call test budget leaves no room for the PASTE's "re-run once"**; not needed this run.
10. **S3's booking readback was cut by the harness hang-up at 88 s** — the cap working, not an agent fault. The two "Go ahead when you're ready." lines in S3 are a harness artifact: a 1.3 s agent turn sat at the harness's 1.2 s voiced threshold, so the scripted caller waited past AVA's 8 s reminder.

## GROK ITEMS

- The re-greeting on "this is a test call" (Oct 28 proof calls).
- S3: AVA looked up open times it already had (prompt rule vs behaviour).

## MODEL CANDIDATE (from Session A's bake-off)

GPT 6.1 Terra (fast tier) won the AI Chauffeur bake-off (reports/2026-10-29-aic-agent-build-v1.md). 8930 runs gpt-4.1 (fast tier, 640 ms LLM p50 in Phase 0). Candidate for a later one-change run on the AVA line; not touched here.

LESSON: A line the caller must hear every time belongs in the mechanism — and a mechanism the docs call conditional still has to be measured on the wire before it is trusted or dismissed.
