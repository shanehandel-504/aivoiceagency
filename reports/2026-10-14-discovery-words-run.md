# RUN INCOMPLETE — WHAT: DISCOVERY WORDS NOT PROMOTED · WHY: STEP-5 SIMULATION GATE FAILED (10 OF 30 RUNS MATCH THEIR LINE) · NEXT: GROK PATCH FOR THE 8 DEFECTS BELOW + ONE BOOK FIX, THEN RE-RUN STEPS 5–10

# 2026-10-14 · PASTE-CC-DISCOVERY-WORDS-RUN v1 · both phone agents

> **READ ONLY.** Run report. Claude Code wrote no agent dialogue (Prompt Authority Lock): every spoken word placed in an agent
> is Grok's, cut by script from the three Drive docs and spliced byte-exact. Numbers appear as last four only; webhook and
> function addresses as host only; no secret, key or caller detail. Times are UTC unless marked CT.

**Live phone lines did not change.** 414-240-8930 and the four pool lines (…1886 …6486 …6409 …8042) serve live AVA **v51**
(the v50e prompt, SHA-256 b622d7eb…); 414-775-0019 serves AI Chauffeur **v13**. Both old booking rails are active and untouched.
Verified by an end-state read at 23:05Z (`c10-endstate.mjs`).

The run stopped where the paste says to stop: "any miss prints the transcript and stops the run at RUN INCOMPLETE". Steps 6
(scripted calls + speed gate), 7 (one name, one path) and 9 (promote) did not run. Step 8 (snapshots + prep) ran and is committed.

## DONE TABLE

| Step | What | Result | Proof |
|---|---|---|---|
| 0 | Precheck | DONE | All ids resolved from the APIs: …8930 + 4 pool lines → `agent_d5ada9f774fe3ae7f034d2c677` pinned v51 (v52 published, unused); …0019 → `agent_9ebb41c9bd8af214649328f107` pinned v13, flow `conversation_flow_9cf4ddd5b734` v13 (222 nodes, greetings n01_p 6d9d1162 / n01_b 7bbd8f18); AVA TEST `agent_44b48507d38c0bfc29a3150a74` v12; briefing agent `agent_63db656e3a68b737fe61cb78db` v1. n8n: WF-ANI-AVA ITGRwcRKxLgmKnBZ, WF-AVA-SALES-CAL fMwY56uNlJaDzkcd, **WF-AIC-SALES-CAL TLoF7bzuPYy1NAW1**, WF-SETUP-CALL-REMINDERS 618G34AR1xQTr3Uf, Error Sentry SlnAeMrVRORsF0w7, ZZ sink hF7cxEn0SuVaEnnL. **Google Calendar credential now exists** (`YRVTiGmoYhU2J5cc` "Google Calendar account"; its calendar list = the aivoiceagency.ai work calendar + the gmail.com calendar shared to it + US holidays) → step 3 not blocked. Doppler `AIC_TRANSFER_NUMBER_` and `OWNER_CELL_PHONE` present (names only). |
| 0 | Sources | DONE | v53.1 prompt cut by script from the Drive export: 12,718 chars · **2,989 cl100k tokens (= the paste's number)** · SHA-256 `f7de1e32ad83144698e30aed54f6f83cf1fe9e434f34714f08baa123a74ead64`. Strip proof: AI CHAUFFEUR BRANCH, FACT LIST, TURN LAW, REPAIR, DEAD AIR + SCOPE byte-identical to v50e (5/5). 0 Markdown escapes in the export. Eight AIC texts cut (A D F G H from v3, B C E from v3.1; B C E differ between v3 and v3.1). Files: `ops/tuning/ava-8930-v53-final.md`, `ops/tuning/aic-0019-v14-delta-texts.md`. |
| 1 | AVA TEST v13 | DONE | Published 20:36:11Z. Prompt = v53.1 byte-exact (read back from Retell); 21 start values = live v51's 16 + slot_1 slot_2 slot_1_iso slot_2_iso team_free_now "false"; opening_line = Grok's COLD line (house rule: the default opener is the prompt's COLD; logged); fast tier ON; every other agent and LLM field = live v51 (11/11 checks) except the agent's own webhook (ZZ sink, owner rail law). …8042 → TEST @ latest_published (before: live AVA v51). |
| 2 | AIC flow v14 (draft) | DONE, NOT PUBLISHED | Draft v14 on the AIC agent; 0019 still pinned v13. A in the global prompt (one sentence span); B C D E F in d2 → d2 changed on lines [1,18,32,35,36,38,45,50] only; G → tr_call as **static text**; H → n08_sameday; n08_sameday renamed "N08-EARLIEST Earliest open times"; d2_quick renamed "ZZ-RETIRED d2_quick" and unreachable; team_free_now "false" added to the start values. Greetings byte-identical (hashes above). Edges, before → after: **td156** (d2_state, `d2_mode == quick`) d2_quick → **d2_from_router** (the router's own entry; the second d2_state pass comes out `full`, door_now questions); **td213** (team_open_gate) `transfer_open != true` → `transfer_open != true OR team_free_now != true` (to tr_closed); **td193** (alert_out, `alert_ret == after`) tr_after (the callback line) → **d2_ex_book** (the booking offer → fn_slots → n08). That one edge covers closed, transfer not answered / declined and callback-chosen. Saved: `ops/tuning/aic-0019-flow-v14-draft-2026-10-14.json` (secrets withheld). |
| 3a–c | WF-SHANE-SLOTS | DONE, ACTIVE | `xB0ifGzDozl2NwBz`, served = draft `0295660f`, 43 nodes, Error Sentry attached, MCP access on. Two routes: GET-SLOTS (Retell tool call, Retell inbound-call webhook, WF-ANI-AVA fold-in) and BOOK. Rules exactly as step 3b. Production timing from the Dell, 5 calls each: GET-SLOTS tool shape median 838 ms (max 939), inbound shape median 818 ms (max 985), no secret → 401. BOOK answers in ~1.1 s (exec 14059/14060). |
| 3f | Unit tests | PASS | On the deployed workflow (frozen now): Sat 4:00 PM → "today at 6:30 Central" / "today at 7 Central" (exec 14052); 6:15 PM → "tomorrow at 8 AM Central" (14053); 9 AM + a 3:00–4:00 PM event → block 15:00–18:00, nothing 3:00–5:30, 6:00 open (14051); all-day free-marked event → no block (14054); empty day (Google Tasks never appear in events.list) → no block (14055); real calendars, real now → both reads HTTP 200 (14056). Plus 25/25 local cases on the same source (DST end, before 8 AM, declined events, busy all-day). |
| 3f | ZZ test of BOOK | PASS, CLEANED UP | zz-test contact, 15-min "ZZ TEST — delete me" on the work calendar: BOOKED (14048, 14059), AI Chauffeur 20-min on the AIC GHL calendar (14060), TAKEN path with next slot (14058), dry-run path for test_mode calls (14063), simulations blocked (14064). Caller text and owner alert went to the ZZ sink, not sent. **Deleted after:** Google events fqo8slik…, mjdn4sr8…, g5sd0vh6… (status cancelled) and GHL appointments THJZsaHV…, JVyT9nsD…, FJdIO2fV… (deleted true). |
| 3d | WF-ANI-AVA fold-in | BUILT + TESTED AS A DRAFT, **NOT PUBLISHED** | Get Slots (GET-SLOTS, fold mode, 1.8 s timeout) after Extract; the five values added to both responses; the four openers synced to Grok's v3.1 lines (Shane: "Sync to v3.1", in chat). Draft run 14126: success, 1.1 s. Held back on purpose: publishing it changes what live 8930 callers hear while the live agent still runs v50e. Parked as version **e3ed6c6b-d731-41f0-857e-89456c28ef84**; the draft was restored to the served version (cc1f9942 = 804b5b4c). **Incident:** see Gotchas 1. |
| 3e | Tools re-pointed | DONE | AVA TEST **v14** (published 22:56:13Z): get_open_slots → GET-SLOTS, book_slot → BOOK (names and parameters kept; `company` added), descriptions now say "setup call" and the TAKEN shape. AIC v14 draft: both functions → the slot engine; book_slot also sends `sms_consent` and `no_text`. The tools' secret header = the one the engine accepts (checked by hash). |
| 4a | AVA-TRANSFER-brief | DONE | `agent_30f791226d75acd36ffff2a31a` v0 published, flow `conversation_flow_db85140b3698` (is_transfer_cf). Swap, global prompt only — before: "You are the AI Chauffeur demo line speaking privately to the AI Chauffeur team before a caller is connected." after: "You are the AI Voice Agency line speaking privately to the AI Chauffeur team before a caller is connected." Brief node = Grok's WHISPER line; reprompt, bridge, cancel and every agent setting = the AIC briefing agent (webhook → ZZ sink). |
| 4b | transfer_team | DONE (TEST only) | Agentic warm transfer to Doppler `AIC_TRANSFER_NUMBER_` (…6562) through AVA-TRANSFER-brief, AVA hold audio, transfer_timeout 45 s, action on timeout cancel → caller returns to AVA. Retell's agentic transfer has no `agent_detection_timeout_ms` (that field is plain warm transfer); the 20 s went to `transfer_ring_duration_ms`. Added `note_caller` (extract_dynamic_variable: name, company, trade, want) — the single-prompt way to fill the four whisper fields (0019 does it with extract + code nodes). |
| 4c | HOLD audio | DONE | 0019's hold message is a custom audio asset (asset_194cec46941c, made Sep 30 with ElevenLabs, Ava voice, eleven_v4). Made the same way and speech-to-text checked word for word: AVA HOLD → **asset_9c134610bc2a**, `assets/audio/ava-hold-v1.mp3`; AIC HOLD (text G) → **asset_2566bb462b44**, `assets/audio/aic-hold-v2.mp3`, set on the v14 draft's tr_call. Never music. |
| 5 | Simulations | **FAIL — 10/30** | 30 runs (3 per case), batches `test_batch_89e559dd5cb8` (AVA TEST v14) and `test_batch_af88632b79c0` (AIC v14 draft). Scorer frozen before the runs (sha256 bed97650…): 11/30; on reading every miss, S7~2 also missed (no connecting line before transfer_team) → **10/30**. Retell's own judge: 11/30. Table and defects below. |
| 6 | Scripted calls + speed gate | NOT RUN | Gated by step 5. |
| 7 | One name, one path | NOT RUN | Also must not run before step 9: retiring the two old rails while 8930 and 0019 still serve v51 / v13 breaks live booking. |
| 8 | Snapshot + prep commit | DONE | `ca78ad8` — `ops/tuning/ava-8930-pre-discovery-snapshot-2026-10-14.md`, `ops/tuning/0019-pre-v14-snapshot-2026-10-14.md`, the four Oct 13 prep files, v53 final, delta texts, v14 draft JSON, both HOLD mp3s. Secret sweep clean (11 files). |
| 9 | Promote | NOT RUN | Gated by step 5. |
| 10 | Close | DONE (incomplete) | This report, board item `discovery-words` (pending) + ISO LOG line, Notion Run Reports Inbox page. |
| — | Cleanup | DONE | …8042 back to live AVA v51 at 23:04:47Z (it was the run's test line; a pool line should not keep a version that failed its gate). WF-ANI-AVA draft = served. |

## SIMULATIONS (step 5)

Caller scripts, judge text and mocks: `s5-cases.mjs`; scorer: `s5-score.mjs` (string checks against fixed lines cut from the
Grok files). P = passes its line, F = misses. Retell's judge in brackets.

| Case | Runs | What failed |
|---|---|---|
| S1 wrong number, wanted a ride company | F P P (f p f) | run 1: the first reply was the AI Chauffeur transfer offer |
| S2 roofer asks what it does | F P P (p p p) | run 1: the soft ask came as reply 2 |
| S3 vet clinic, three questions | F F F (f p f) | the full soft ask never came (only "What else would you like to know?") |
| S4 curious caller | P P P (f f f) | passes the paste's line; Retell counted the half line as the soft ask |
| S5 ready buyer, today, team busy | F F P (f f p) | runs 1–2: no "And who am I speaking with?" — times offered first |
| S6 ready buyer asks for today, tomorrow slots | P F P (p f p) | run 2: no name question |
| S7 team free, transfer not answered | F F F (f f f) | runs 1, 3: went to the booking times instead of the TEAM NOW question; run 2: no connecting line before transfer_team |
| S8 vendor | F F F (f f f) | offered the team on the line / a call instead of "not taking on vendors" |
| S9 (AIC) demo, then "what can you do for me" | F F F (p p p) | demo stopped, same-day times offered — but the full soft ask never came |
| S10 (AIC) price | F F F (f f f) | above-base sentence missing; soft ask cut to its second half |

## DEFECTS (for the Grok patch brief — Claude Code does not write the fix)

| # | Agent · case | Symptom, verbatim from the sim | Section it touches |
|---|---|---|---|
| D1 | AVA · S8 3/3 | Vendor: "I can get someone from the team on the line right now or set a time for you to talk today." | DISCOVERY: the vendor line vs the "Can I talk to someone?" line (precedence) |
| D2 | AVA · S7 2/3 | team_free_now "true", caller "ready to talk to someone" → name, then get_open_slots and "I have today at 4:30 Central or today at 5 Central" (no TEAM NOW question; tool called with slots in hand) | DISCOVERY "Asks to book … Then TEAM NOW if …"; BOOKING RAIL "already in hand: offer at once no lookup" |
| D3 | AVA · S7 1/3 | "Yes, right now." → transfer_team with no connecting line first | TEAM NOW "line first tool second same turn" |
| D4 | AVA · S5 2/3, S6 1/3 | Ready buyer → times offered before "And who am I speaking with?" | DISCOVERY "Asks to book …: 'And who am I speaking with?'" |
| D5 | AVA · S3 3/3 · AIC · S9 3/3 | Full soft ask never said; the agent ends answers with "What else would you like to know?" only | DISCOVERY soft ask (AVA); C / E bullet two (AIC) |
| D6 | AVA · S2 1/3 | "Okay." → soft ask as reply 2 | DISCOVERY "No booking ask first or second turn" |
| D7 | AVA · S1 1/3 | "I need a ride for a patient going home today." → AI Chauffeur transfer offer | ROUTER (no trigger word was said) |
| D8 | AIC · S10 3/3 | "…No contract. Cancel any month. The team goes over the full pricing on the setup call. Anything else you'd like to know?" — no above-base sentence, soft ask cut | d2 PRICE bullet three (text D says "the soft ask from C": a cross-reference the agent cannot resolve) vs PRICE bullet two |

**Infrastructure defect (Claude Code's lane, not words):** I1 — when the times come from the start values, the model never sees
`{{slot_1_iso}}` / `{{slot_2_iso}}` (the prompt names only `{{slot_1}}` and `{{slot_2}}`), so book_slot got invented ISO times with the
wrong year ("2024-06-11T18:30:00-05:00" in S5, also S6, S7). On a real call BOOK would answer TAKEN. Fix in BOOK: when slot_iso is not
an open slot, match its Central clock time against the call's own `slot_1_iso` / `slot_2_iso` (BOOK receives them in the call object).

## WHAT IS BUILT AND NOT PROMOTED

- AVA TEST v14 (v53.1 words, slot engine tools, transfer_team, note_caller). Probe line …8976 follows the TEST agent's latest published
  (it did before this run) and now answers with v14; it has no inbound webhook, so team_free_now stays "false" there (no transfer).
- AIC v14 draft (texts A–H, d2_quick retired, team_free_now path, slot engine, new HOLD). 0019 stays on v13.
- WF-SHANE-SLOTS — active; only the TEST agent and the AIC v14 draft call it.
- WF-ANI-AVA fold-in + v3.1 openers — parked as version e3ed6c6b (restore + publish at the promote).
- AVA-TRANSFER-brief — published, used only by TEST v14's transfer_team.

## ROLLBACK (nothing live moved, so nothing to roll back today)

- AVA at a future promote: re-pin …8930 (in + out), …1886, …6486, …6409, …8042 to v51; remove the inbound webhook from the four pool lines.
- AIC: re-pin …0019 to v13 (never ≤ v10).
- Rails: reactivate WF-AVA-SALES-CAL and WF-AIC-SALES-CAL (if retired); deactivate WF-SHANE-SLOTS; publish WF-ANI-AVA 804b5b4c.

## GOTCHAS

1. **A REST PUT on an active n8n workflow publishes at once.** Staging the WF-ANI-AVA fold-in with `PUT /api/v1/workflows/{id}` moved the
   served version (8f73bf3f) instead of only the draft. Its cold path answered HTTP 500 ("invalid syntax": n8n's expression parser rejects
   object spread `...`). The broken window was about 30 s at 22:49Z; the only three executions in it were my probes (14108, 14111, 14114);
   rolled back to 804b5b4c with an MCP publish of that version, then re-checked (unknown caller → 200, cold opener). Changes to a live
   workflow go through MCP update_workflow (draft) → manual run → publish.
2. n8n's expression engine also refuses `arguments` ("Cannot access arguments due to security concerns"). n8n Code nodes cold-start at
   ~1.7 s (exec 14043, 14048) — too slow for the 2.5 s answer budget; WF-SHANE-SLOTS runs its logic in Set-node expressions instead.
3. Grok's examples disagree: "Friday at 10 Central" vs "tomorrow at 8 AM Central". The engine says AM for morning times ("Friday at 10 AM
   Central"), nothing after noon ("today at 6:30 Central"), which meets both of the paste's tested strings. Earliest = the first :00/:30
   strictly after now + 2 h (needed for "Saturday 4:00 PM → today at 6:30 Central").
4. BOOK returns `BOOKED` / `TAKEN` / `FAILED` in capitals: the AIC flow's fn_book branches on `book_status == "BOOKED"`. The AIC flow has no
   TAKEN branch — a taken time goes to its failure line. GET-SLOTS ignores `requested_time`.
5. AVA bookings keep `toNotify: true` so GHL's own AVA texts and reminders still run; the new "AVA Team" confirmation text then makes two
   booking texts for an AVA caller. AIC bookings use `toNotify: false` (n8n sends those reminders). Both texts are signed "AVA Team" as the
   paste says, including the AI Chauffeur one.
6. WF-SETUP-CALL-REMINDERS does **not** yet read an AI Chauffeur booking made by BOOK (it reads Cal.com bookings and widget bookings only).
   Planned with step 7b: a booking-store loop on `calcom_uid` starting `gcal:` (BOOK writes those rows).
7. While 0019 serves v13, AVA's handoff_to_desk stays pinned to v13. Shane approved pointing it at v14 at the promote, because 7b retires
   v13's booking rail.
8. Twice in this session's own terminal output (never in a file, a commit, the board or Notion): the sales-calendar header value
   (a flow read printed tool headers before the mask was fixed) and the owner cell (a mask missed its dashed format).
9. Commit 330416c ("email signature wordmarks") landed on main from another session during this single-writer run.
10. CLAUDE.md still spells the …6562 line in full in § PHONE (public repo). Step 7c's fix did not run with the rest of step 7.

## SHANE READBACK

```text
===== SHANE READBACK — COPY ALL =====
RUN INCOMPLETE — WHAT: DISCOVERY WORDS NOT PROMOTED · WHY: SIMULATION GATE FAILED, 10 OF 30 RUNS MATCHED THEIR LINE · NEXT: GROK PATCH FOR 8 DEFECTS + 1 BOOKING FIX, THEN RE-RUN STEPS 5–10

PLAIN ENGLISH
Nothing your callers hear changed today. 414-240-8930 and the four pool lines still answer with AVA v51, and 414-775-0019
still answers with AI Chauffeur v13. The old booking systems are still on.
Everything for the switch is built and parked: the new AVA words on the test agent, the new AI Chauffeur words as a
draft, the new calendar engine (reads your work and personal calendars, books on the work calendar and in GHL), the live
transfer to your line through a new briefing agent, and the two hold messages.
Before anything goes live, the run tests the words with 30 simulated calls. Only 10 behaved exactly as written, so the
run stopped there, as the paste says. The misses are in the words (for example, a vendor got offered a call with the team,
and the full "Whenever you're ready…" line rarely comes out). They go back to Grok. One miss is mine to fix: when AVA
already has the two times in hand, it invents the booking code for the time and books the wrong thing.

DONE TABLE
| Step | Result | Proof |
| 0 Precheck | DONE | Google Calendar credential exists (YRVTiGmoYhU2J5cc); all ids read from the APIs |
| 0 Sources | DONE | v53.1 cut by script: 2,989 tokens (the paste's number), SHA-256 f7de1e32…74ead64; 5/5 sections = v50e |
| 1 AVA TEST | DONE | v13 published 20:36Z (words, 21 start values, fast tier on), then v14 with the new tools |
| 2 AIC v14 | DRAFT ONLY | texts A–H placed; d2 changed on 8 named lines only; greetings unchanged; 3 edges changed |
| 3 Calendar engine | ACTIVE | WF-SHANE-SLOTS xB0ifGzDozl2NwBz; times answered in ~0.8 s, booking in ~1.1 s; tests passed |
| 3 ZZ test | PASS | test bookings made on both brands, then deleted (3 calendar events, 3 GHL appointments) |
| 3d 8930 lookup | DRAFT, PARKED | fold-in + Grok's v3.1 openers tested; parked as version e3ed6c6b (you said sync) |
| 4 Transfer + hold | DONE (test agent) | AVA-TRANSFER-brief agent_30f791226d75acd36ffff2a31a; hold audio asset_9c134610bc2a / asset_2566bb462b44 |
| 5 Simulations | FAIL 10/30 | batches test_batch_89e559dd5cb8 + test_batch_af88632b79c0 |
| 6 Calls + speed | NOT RUN | gated by step 5 |
| 7 One name, one path | NOT RUN | also must wait for step 9 (retiring the old rails early breaks live booking) |
| 8 Snapshots | DONE | commit ca78ad8 |
| 9 Promote | NOT RUN | gated by step 5 |
| 10 Close | DONE | commit 827de92 pushed; board live; this page |

IDS / ROLLBACK
- Nothing live moved, so nothing to roll back. Line ending 8042 was the test line and is back on AVA v51 (23:04Z).
- At the future promote: AVA → re-pin 8930 + the four pool lines to v51 and remove the pool lines' webhook; AIC → re-pin
  0019 to v13; rails → reactivate WF-AVA-SALES-CAL / WF-AIC-SALES-CAL, deactivate WF-SHANE-SLOTS, publish WF-ANI-AVA 804b5b4c.
- Report: reports/2026-10-14-discovery-words-run.md (defect table D1–D8 + I1 inside).

WHAT'S NEXT
1. Grok patch brief from defects D1–D8: vendor gets the team offer; TEAM NOW skipped when the team is free; no connecting line
   before the transfer; name question skipped; full soft ask rarely said; soft ask too early once; a "ride" caller got the
   AI Chauffeur offer; AI Chauffeur price answer drops the above-base sentence ("the soft ask from C" points nowhere).
2. Claude Code: BOOK matches the requested time against the call's own slot_1_iso / slot_2_iso.
3. New words paste → re-run steps 5–10 (test line …8042 again, the parked WF-ANI-AVA version, then promote).

GOTCHAS
1. Saving WF-ANI-AVA through n8n's REST API published it on the spot; its cold path failed on 3 of my own test calls for
   about 30 seconds (22:49Z). Rolled back at once; no real caller hit it. Live workflow edits now go draft → test → publish.
2. Line ending 8976 (the test agent's probe line) follows the test agent and now answers with the new words and tools; it has
   no lookup webhook, so it never transfers. It books real times on your calendar if someone books there.
3. When this goes live, an AVA caller gets two booking texts: GHL's own and the new "AVA Team" one. The AI Chauffeur text is
   signed "AVA Team" too, as the paste says.
4. The reminder workflow does not yet see AI Chauffeur bookings made by the new engine; that wiring rides with step 7.
5. Another session pushed a commit (email signature wordmarks) during this single-writer run.
6. Twice in this session's own terminal output, never in a file, commit, board or Notion: the sales-calendar header value
   and your cell number (a mask missed the dashed format).
7. CLAUDE.md still spells the line ending 6562 in full in the PHONE section (public repo); that fix sits in the step 7 that did not run.
```
