# Discovery words run v1.3 — RUN INCOMPLETE at the speed gate (2026-10-15)

> **READ ONLY.** Run report for PASTE-CC-DISCOVERY-WORDS-RUN v1.3 (Google Doc "Claude – PASTE-CC-DISCOVERY-WORDS-RUN-v1.3 – 2026-10-15"):
> v1.2 plus two mechanical fixes and a corrected simulation gate. Same Claude Code session, Doppler ava-prod/prd, single writer.
> Earlier reports: `reports/2026-10-14-discovery-words-run.md` (v1), `reports/2026-10-15-discovery-words-run-v1-2.md` (v1.2).

**RUN INCOMPLETE — WHAT: DISCOVERY WORDS NOT PROMOTED · WHY: THE AI CHAUFFEUR SPEED GATE FAILED (MEDIAN e2e p50 2,515 ms AGAINST THE AVA AFTER-NUMBER 1,067 ms; ANSWER GAP 2.9 s AGAINST 1.4 s), AFTER SPEED LEVER 1 · NEXT: OWNER RULING ON THE AI CHAUFFEUR SPEED GATE (THE NEW WORDS ARE FASTER THAN TODAY'S v13, NOT AS FAST AS AVA), THEN STEP 9 (PROMOTE) AND STEP 7 (ONE NAME, ONE PATH)**

No phone line moved. 414-240-8930 and the four pool lines (…1886 …6486 …6409 …8042) serve AVA v51; 414-775-0019 serves AI Chauffeur
v13; WF-AVA-SALES-CAL and WF-AIC-SALES-CAL are active; WF-ANI-AVA serves 804b5b4c. The simulation gate passed both MUST rows 3 of 3, and the
AVA speed gate passed. Built and ready for the promote: AVA TEST v17 and AI Chauffeur draft v14 (v14.3).

## DONE

| Step | What | Result | Proof |
|---|---|---|---|
| 0 | Sources | DONE | The v1.3 doc exported as text/plain; the hold words and the two PRICE spans cut by script (`z0-cut.mjs`), never retyped. The hold line's first sentence is inside AIC text G ("Connecting you with the team now."), the rest is the v53.3 HOLD line; the price line is the first five sentences of v14.2 text D. |
| 1 | FIX 1 — AVA hold audio | DONE | New asset **`asset_2364a4ddc00c`** (ava-hold-v2): "Connecting you with the team now. AVA answers every call, books the job, and sends them the details." Made like `asset_9c134610bc2a`: ElevenLabs, voice gJx1vCzNCD1EQHT212Ls, eleven_v4, mp3 44.1 kHz mono 128 kbps; loudness −19.2 LUFS vs −19.0 (within 0.3 LU, no gain). **faster-whisper** (small.en) transcript: "Connecting you with the team now Ava answers every call books the job and sends them the details" — opens with the connecting line, word for word whole (it adds no punctuation; a 0.61 s pause follows "now"). Stored by Retell in the same format as v1 (24 kHz PCM). Old asset kept. `assets/audio/ava-hold-v2.mp3`. |
| 1 | TEST v17 | DONE | Published 16:31:40Z: `transfer_team` hold audio = ava-hold-v2; nothing else changed; prompt SHA `3cbbb505…` re-checked before and after publish. |
| 2 | FIX 2 — AIC price | DONE (draft) | Draft v14 → v14.3 in place. PRICE bullet one: the spoken-price span replaced with the fixed five-sentence line; its two other conditions kept byte for byte. Bullet three (text D) replaced with the turn-end rule. Read-back: only d2 lines **30 and 32** differ; greetings `6d9d1162` / `7bbd8f18` unchanged. `ops/tuning/aic-0019-flow-v14.3-draft-2026-10-15.json` (secrets withheld) and `ops/tuning/aic-0019-v14.3-delta-texts.md` (both spans, before and after). |
| 3 | Gate v1.3 | DONE | `z3-gate.mjs`, frozen with the definitions (hash `0c1ccde91cb32504`); every row not named delegates to the v1.2 gate unchanged; diff vs v1.2 printed (below). Dry run on the v1.2 transcripts: S7 MUST now passes there (the judge's ruling), S10 MUST still misses there. |
| 4 | Simulations | **PASS (MUST)** | S7 on TEST v17 **3/3**, S10 on AIC v14.3 **3/3**. Batches `test_batch_1e0773b28527`, `test_batch_6e3f2189d0b2`. Transcripts below. |
| 6 | Speed gate — AVA | **PASS** | 10 scripted web calls on TEST v17 (S1–S8, S5 and S6 twice): median e2e p50 **1,067 ms** (≤ 1,344), median e2e p90 **1,880 ms** (≤ 2,273). |
| 6 | Speed gate — AI Chauffeur | **FAIL** | Five calls on v14.3: median e2e p50 2,503 ms (> 1,067). Speed lever 1 (responsiveness up one step, 0.7 → 0.8, on the draft): five new calls, median e2e p50 **2,515 ms**, derived answer gap p50 **2,876 ms** against AVA's 1,387. Lever 2 (gpt-4.1-mini) is "on the test agent only" (AVA). Lever 3: stop and report. Context: the same lines on today's live v13 — derived answer gap p50 **4,993 ms**: the new words are faster than what 0019 answers with now, and still not as fast as AVA. Table: `ops/tuning/latency-after-2026-10-14.md`. |
| 5a | One booking text | DONE (engine) | WF-SHANE-SLOTS **37590140**: GHL appointments made with `toNotify: false` for both brands (GHL's own booking text and its AVA reminder engine do not fire on engine bookings); the AI Chauffeur caller text is signed "AI Chauffeur Team". ZZ test (exec 14295 / 14298): AVA text "… — AVA Team", AIC text "… — AI Chauffeur Team"; no GHL message to the zz contact in the minutes after; 2 calendar events + 2 GHL appointments deleted. Not used by a live line until the promote. |
| 5b | Reminders on both calendars | PUBLISHED | WF-SETUP-CALL-REMINDERS **e0855328**: Collect reads the engine's bookings (both brands; the GHL copy must still be there and confirmed; the AVA calendar loop leaves those copies to it); Plan gives AVA engine bookings the prospect reminders (AVA website bookings keep GHL's texts) and calls the AVA call a "setup call". Unit 17/17; staging run 14325 (ZZ STAGING copy, dry, simulated clock): a zz-test engine booking got its 15-minute reminder through the ZZ sink, the owner ping held back. No behaviour change until engine bookings exist. |
| 5c | Probe line …8976 | NOT RUN | Promote step. Prepared: keep it on AVA TEST (its job is reaching the test agent) and give it the WF-ANI-AVA webhook like the five AVA lines. |
| 5d | CLAUDE.md fixes | DONE | "AVA strategy call" → "AVA setup call" (15 minutes stays); the PHONE line spelling the full …6562 number → "Owner direct line (…6562): private; never in the repo, the board or public copy" (text cut from the v1 paste); RETELL API RULES + two rows (`/v2/create-web-call` → `/v3/create-web-call`, `/list-test-case-definitions` → `/v2/list-test-case-definitions`). Other tracked files with the full …6562 number, reported and not changed: `reports/2026-07-17-lsa-campaign.md`, `reports/2026-07-17-run5-5.md`, `tools/callback-gate/01-recon.mjs`, `tools/truth_audit.py`. |
| 5f | Public webhook URL | DONE | The ChatDash import-webhook URL replaced with "[redacted]": 48 occurrences in 12 tracked files (hq/board.json, the three config snapshots, two July reports, six retell-backups). None left. /hq at 390×844: **529 px** wide (was 601) — still sideways; the next long word is an old board entry's `support.google.com/localservices/answer/7527305)`. Git history keeps the URL; rotate or delete it in ChatDash. |
| 7 | One name, one path (GHL rename, retire rails) | NOT RUN | After the promote, as planned (it would break live booking before). The GHL changes are small: "AVA Demo Call" → "AVA setup call" + minimum notice 4 h → 0 (slot is already 15 min); "AIChauffeur Setup Call" → "AI Chauffeur setup call" (already 20 min, notice 0). |
| 8 | Snapshots | stands | v51 and v13 are published and unchanged; snapshot commit ca78ad8 stands. |
| 9 | Promote | NOT RUN | Gated by step 6. Script ready (`z9-promote.mjs`: AIC publish + pin, AVA build from TEST v17 with handoff_to_desk → AIC v14, publish, pins + webhooks). |
| 10 | Close | DONE (incomplete) | This report, the board, the Notion inbox. |

## Gate v1.3 against v1.2

| Row | v1.2 | v1.3 |
|---|---|---|
| S7 MUST | TEAM NOW asked before any time + a spoken line right before `transfer_team` | `transfer_team` fires only after a yes to TEAM NOW or after the caller asked for a person · never "connected" before the tool returns · the hold asset transcribes with the connecting line first (recorded from step 1) |
| S7 SHOULD | — | the spoken line right before `transfer_team` (moved from MUST) |
| S10 MUST | the above-base sentence intact | the five-sentence price line spoken whole in one turn |
| S10 SHOULD | — | the soft ask never before questions-part turn 3; expected from there unless the caller is saying goodbye |
| Every other row | — | unchanged (delegated to the v1.2 gate) |

Result: S7 MUST 3/3, S7 SHOULD 0/3 (the transfer is silent in the transcript; the caller now hears the connecting line in the hold
audio), S10 MUST 3/3, S10 SHOULD 3/3. Retell's judge failed all six on its v1 judge text (connecting line in the transcript; soft ask right
after the price) — the two points the v1.3 rulings moved; not gating. Observation, not gated: the S10 price turn ends after "The team goes
over the full pricing on the setup call." and the next turn carries "What else would you like to know?".

## Simulation transcripts (v1.3)

#### S7~1 — miss: v1.3 SHOULD: no spoken line right before transfer_team (the hold audio carries the connecting line)

Retell judge: fail — The agent asked whether to get someone on the line now and invoked transfer_team after the caller said yes. It also correctly stated the team was tied up and offered 4:30 or 5 Central without excessive apologies. However, it did not say it was connecting the caller before invoking the transfer, which is required.

```text
AGENT : Hi, this is AI Voice Agency. This call is recorded. I can answer your calls, give your prices, give information about your company and book appointments. What kind of questions do you have for me?
CALLER: I own a landscaping company and I am ready to talk to someone.
AGENT : And who am I speaking with?
CALLER: Jake Morris, Morris Lawn and Garden.
AGENT : Jake, do you want to get someone from the team on the line right now, or set up a time for later today?
CALLER: Yes, right now.
[tool transfer_team {}]
[result Transfer failed: the team did not pick up.]
AGENT : The team is tied up right now. I can book you a fifteen-minute setup call with the team. I have today at 4:30 Central or today at 5 Central. Which one works?
CALLER: The first one.
AGENT : How did you hear about us?
CALLER: My neighbor.
[tool book_slot {"business_type":"landscaping","caller_name":"Jake Morris","company":"Morris Lawn and Garden","which_slot":"1"}]
[result {"status":"BOOKED","reason":"","when_text":"today at 4:30 Central","appt_date":"Wednesday ]
AGENT : You're booked for today at 4:30 Central. The team will call you then. If you need anything else, just let me know.
CALLER: Thanks, bye.
AGENT : Thanks for calling, Jake. Have a great day!
[tool end_call {"execution_message":"Thanks for calling, Jake. Have a great day!"}]
```

#### S7~2 — miss: v1.3 SHOULD: no spoken line right before transfer_team (the hold audio carries the connecting line)

Retell judge: fail — The agent transferred to the team before asking whether the caller wanted someone on the line now, and it did not state that it was connecting the caller before using transfer_team. Although it correctly handled the failed transfer by saying the team was tied up and offering 4:30 or 5 Central, the required transfer sequence was not met.

```text
AGENT : Hi, this is AI Voice Agency. This call is recorded. I can answer your calls, give your prices, give information about your company and book appointments. What kind of questions do you have for me?
CALLER: I own a landscaping company and I am ready to talk to someone.
AGENT : And who am I speaking with?
CALLER: Jake Morris, Morris Lawn and Garden.
[tool transfer_team {}]
[result Transfer failed: the team did not pick up.]
AGENT : The team is tied up right now. I can book you a fifteen-minute setup call with the team. I have today at 4:30 Central or today at 5 Central. Which one works for you?
CALLER: Yes, right now.
[tool book_slot {"business_type":"landscaping","caller_name":"Jake Morris","company":"Morris Lawn and Garden","which_slot":"1"}]
[result {"status":"BOOKED","reason":"","when_text":"today at 4:30 Central","appt_date":"Wednesday ]
AGENT : Jake, your setup call is booked for today at 4:30 Central. How did you hear about us?
CALLER: The first one.
AGENT : You are all set for today at 4:30 Central. The team will call you then. If you need anything else, just let me know.
CALLER: My neighbor.
AGENT : Thanks for letting me know. The team will talk to you at 4:30 Central. Have a great day!
[tool end_call {"execution_message":"Thanks for letting me know. The team will talk to you at 4:30 Central. Have a great day!"}]
```

#### S7~3 — miss: v1.3 SHOULD: no spoken line right before transfer_team (the hold audio carries the connecting line)

Retell judge: fail — The agent asked whether to get someone from the team on the line and used transfer_team after the caller said yes. It correctly handled the failed transfer by saying the team was tied up and offering 4:30 or 5 Central. However, it did not say it was connecting the caller before invoking transfer_team, which is required.

```text
AGENT : Hi, this is AI Voice Agency. This call is recorded. I can answer your calls, give your prices, give information about your company and book appointments. What kind of questions do you have for me?
CALLER: I own a landscaping company and I am ready to talk to someone.
AGENT : And who am I speaking with?
CALLER: Jake Morris, Morris Lawn and Garden.
AGENT : Jake, do you want to get someone from the team on the line right now, or set up a time later today?
CALLER: Yes, right now.
[tool transfer_team {}]
[result Transfer failed: the team did not pick up.]
AGENT : The team is tied up right now. I can book you a fifteen-minute setup call with the team. I have today at 4:30 Central or today at 5 Central. Which one works?
CALLER: The first one.
AGENT : How did you hear about us?
CALLER: My neighbor.
[tool book_slot {"business_type":"landscaping","caller_name":"Jake Morris","company":"Morris Lawn and Garden","which_slot":"1"}]
[result {"status":"BOOKED","reason":"","when_text":"today at 4:30 Central","appt_date":"Wednesday ]
AGENT : You're all set for today at 4:30 Central. The team will call you then. Anything else you want to know?
CALLER: Thanks, bye.
AGENT : Thanks for calling, Jake. Have a great day!
[tool end_call {"execution_message":"Thanks for calling, Jake. Have a great day!"}]
```

#### S10~1 — clean

Retell judge: fail — The pricing content included the base price, no-contract/cancel-any-month terms, and the sizing statement. However, it omitted the required soft ask, “Whenever you're ready to set up a time, just say so,” before asking what else the caller would like to know.

```text
AGENT : AI Chauffeur, the premium reservation system for limousine, black car and chauffeured transportation. This is the demo line. Play the customer and request a trip. Calls are recorded and transcribed. Which trip would you like to try — airport, point to point, or by the hour.
CALLER: How much does AI Chauffeur cost?
AGENT : AI Chauffeur is nine ninety-seven a month, nine ninety-seven one-time setup, and sixty-five cents a minute of talk time. No contract. Cancel any month. Anything above the base is sized to the company, with one price after the setup call. The team goes over the full pricing on the setup call. What else would you like to know?
CALLER: Okay.
AGENT : What else would you like to know?
CALLER: Goodbye.
AGENT : Thanks for calling. You can find more at A I chauffeur dot A I. Goodbye.
```

#### S10~2 — clean

Retell judge: fail — The price details, no-contract/cancel-any-month language, and company-sized pricing statement were present. However, the required soft ask was omitted: the agent did not say, “Whenever you're ready to set up a time, just say so,” before asking what else the caller wanted to know.

```text
AGENT : AI Chauffeur, the premium reservation system for limousine, black car and chauffeured transportation. This is the demo line. Play the customer and request a trip. Calls are recorded and transcribed. Which trip would you like to try — airport, point to point, or by the hour.
CALLER: How much does AI Chauffeur cost?
AGENT : AI Chauffeur is nine ninety-seven a month, nine ninety-seven one-time setup, and sixty-five cents a minute of talk time. No contract. Cancel any month. Anything above the base is sized to the company, with one price after the setup call. The team goes over the full pricing on the setup call. What else would you like to know?
CALLER: Okay.
AGENT : What else would you like to know?
CALLER: Goodbye.
AGENT : Thanks for calling. You can find more at A I chauffeur dot A I. Goodbye.
```

#### S10~3 — clean

Retell judge: fail — The response gave the base pricing, stated "No contract. Cancel any month," and retained the company-sizing/one-price-after-setup-call language. However, it omitted the required soft ask: "Whenever you're ready to set up a time, just say so." Instead, it said, "The team goes over the full pricing on the setup call. What else would you like to know?"

```text
AGENT : AI Chauffeur, the premium reservation system for limousine, black car and chauffeured transportation. This is the demo line. Play the customer and request a trip. Calls are recorded and transcribed. Which trip would you like to try — airport, point to point, or by the hour.
CALLER: How much does AI Chauffeur cost?
AGENT : AI Chauffeur is nine ninety-seven a month, nine ninety-seven one-time setup, and sixty-five cents a minute of talk time. No contract. Cancel any month. Anything above the base is sized to the company, with one price after the setup call. The team goes over the full pricing on the setup call. What else would you like to know?
CALLER: Okay.
AGENT : Got it. What else would you like to know?
CALLER: Goodbye.
AGENT : Thanks for calling. You can find more at A I chauffeur dot A I. Goodbye.
```

## Speed gate

| Set | Calls | Median e2e p50 | Median e2e p90 | Derived answer gap p50 / p90 | Result |
|---|---|---|---|---|---|
| AVA TEST v17 | 10 | 1,067 ms | 1,880 ms | 1,387 / 2,535 ms | **PASS** (≤ 1,344 / ≤ 2,273) |
| AIC v14.3, responsiveness 0.7 | 5 | 2,503 ms | 2,503 ms | 3,298 / 5,521 ms | FAIL |
| AIC v14.3, responsiveness 0.8 (lever 1) | 5 | 2,515 ms | 2,515 ms | 2,876 / 5,380 ms | **FAIL** (not slower than AVA) |
| AIC live v13 (context) | 5 | 2,217 ms (2 calls carry e2e) | — | 4,993 / 5,742 ms | — |

Retell's `e2e` on the AI Chauffeur calls covers one turn per call (most AIC turns are static or tool turns), so the derived answer gap
(agent's first word minus the caller's last word, from word timings, same method on both agents) is shown beside it. The AIC flow (222 nodes:
75 code, 27 extract, 40 branch) answers in about 3 seconds against AVA's 1.4; the slowest turns follow a read-and-route chain
(router extract → code → next ask). Web calls, not phone calls; no transfer attempted.

## Rollback lines (what moved in this run)

- TEST v17 → TEST only (latest published also reaches the probe line …8976); previous v16.
- AI Chauffeur draft v14: responsiveness back to 0.7 with one PATCH on the draft; v14.2 texts = the v14.2 JSON in the repo.
- WF-SHANE-SLOTS: publish a46ad26a (before 5a). WF-SETUP-CALL-REMINDERS: publish 67b21399 (before 5b).
- CLAUDE.md and the redaction: one `git revert` of the commit; the webhook URL itself stays in git history either way.

## LESSON

A line the caller must hear every time belongs in the mechanism (hold audio, static node), not in the prompt. The sim gate caught twenty
misses on Oct 14 that a "sounded good" call would have shipped; the speed gate caught today that the AI Chauffeur flow answers in about
3 seconds — faster than the version live now, slower than AVA.

## Gotchas

1. The AI Chauffeur gate as written compares AIC to AVA. The new AIC words are faster than today's live v13 (answer gap 2.9 s vs 5.0 s), so
   holding them back keeps the slower version on 0019. That is a ruling for the owner.
2. faster-whisper writes no punctuation on this clip, so "the first sentence" was checked as the first six words plus the pause after "now".
3. 5a, 5b, 5d and 5f ran while the speed calls were in flight, before the gate's result. None of them changes what a caller hears today.
4. A bash heredoc turned `\\?` into `\?` in a write-guard rule; the guard refused the write (nothing changed). Scripts with escapes are
   written with the editor, not a heredoc.
5. /hq still scrolls sideways at 390 px (529 px) after the redaction: another long unbroken word in an old board entry.
6. The webhook URL is gone from current files but stays in git history; rotate or delete it in ChatDash.
7. Three of the redacted files also name n8n webhook paths (`/webhook/ava-postcall`, `/webhook/ava-book-appointment`, `/webhook/live-postcall`)
   that were already public before this run; this run's change to those files is the ChatDash redaction only.

```text
===== SHANE READBACK — COPY ALL =====
RUN INCOMPLETE — WHAT: DISCOVERY WORDS NOT PROMOTED · WHY: THE AI CHAUFFEUR SPEED GATE FAILED (ANSWERS IN ~2.9 s, AVA IN ~1.4 s; e2e 2,515 vs 1,067 ms) · NEXT: YOUR RULING ON THAT GATE (THE NEW AI CHAUFFEUR WORDS ARE FASTER THAN TODAY'S LIVE v13), THEN THE PROMOTE

PLAIN ENGLISH
Nothing your callers hear changed. 414-240-8930 and the four pool lines still answer with AVA v51; 414-775-0019 still answers with
AI Chauffeur v13.
Both fixes worked. AVA's hold message now starts with "Connecting you with the team now." (checked by a speech-to-text read of the
audio), so no caller is put through in silence. The AI Chauffeur price answer is one fixed line now, and it came out whole in 3 of 3
simulated calls. Both must-pass checks passed 3 of 3.
The speed check stopped the run. AVA answers fast enough (1.07 s against your 1.34 s bar). AI Chauffeur answers in about 2.9 seconds,
and the bar is "no slower than AVA". One speed setting helped a little but not enough. The fair comparison: today's live AI Chauffeur
answers in about 5.0 seconds on the same lines, so the new version is faster than what callers hear now, just not as fast as AVA. The
paste says the words don't ship slower than the bar, so I stopped and need your call.
Also done: one booking text per booking (GHL's own text no longer fires on phone bookings; the AI Chauffeur text is signed "AI Chauffeur
Team"), reminders now cover phone bookings on both calendars, the three CLAUDE.md fixes, and the ChatDash webhook link removed from 12
public files (rotate it in ChatDash; git history still has it).

DONE TABLE
| Step | Result | Proof |
| 1 AVA hold audio | DONE | asset_2364a4ddc00c; faster-whisper opens with "Connecting you with the team now"; TEST v17 published 16:31Z |
| 2 AIC price line | DONE (draft) | v14.3: only d2 lines 30 and 32 changed; both greetings = Oct 13 hashes |
| 3 Gate v1.3 | DONE | frozen 0c1ccde9…; diff vs v1.2 printed in the report |
| 4 Simulations | PASS | S7 3/3 (TEST v17), S10 3/3 (AIC v14.3); batches test_batch_1e0773b28527 + test_batch_6e3f2189d0b2 |
| 6 Speed — AVA | PASS | median e2e p50 1,067 / p90 1,880 ms (bar 1,344 / 2,273) |
| 6 Speed — AIC | FAIL | p50 2,515 ms after lever 1 (bar: AVA's 1,067); answer gap 2.9 s vs AVA 1.4 s; live v13 5.0 s |
| 5a One booking text | DONE | WF-SHANE-SLOTS 37590140; ZZ tests show "— AVA Team" / "— AI Chauffeur Team", no GHL text |
| 5b Reminders | PUBLISHED | WF-SETUP-CALL-REMINDERS e0855328; 17/17 unit; staging run 14325 |
| 5d CLAUDE.md | DONE | setup call, …6562 line private, two Retell rows |
| 5f Webhook link | DONE | 48 copies in 12 files → [redacted]; /hq 601 → 529 px wide |
| 7 GHL rename + retire old rails | NOT RUN | waits for the promote |
| 9 Promote | NOT RUN | gated by the AIC speed check; script ready |
| 10 Close | DONE | report reports/2026-10-15-discovery-words-run-v1-3.md; board; Notion inbox |

IDS / ROLLBACK
- Phone lines: nothing moved.
- TEST v17 (test agent only). AIC draft v14: responsiveness back to 0.7 = one draft PATCH.
- WF-SHANE-SLOTS back = publish a46ad26a. WF-SETUP-CALL-REMINDERS back = publish 67b21399.
- CLAUDE.md + redaction: git revert of this run's commit (the URL stays in history regardless).

WHAT'S NEXT
1. Your ruling: hold AI Chauffeur to "no slower than AVA" (then it needs a faster flow, a build job), or to "no slower than today's
   v13" (it passes: 2.9 s vs 5.0 s). AVA could also go live alone; the paste ships both together.
2. With a ruling: step 9 promote (AVA v53 from TEST v17, AIC v14.3, lookup v3.3 openers, webhooks on all six lines, …8976 keeps the
   test agent + gets the webhook), then step 7 (GHL renames, retire the two old booking workflows).
3. SHOULD-level items D11–D14 wait for the first tuning pass after twenty real calls.

GOTCHAS
1. On every simulated transfer the agent still calls transfer_team without a spoken line; the caller now hears the connecting line from
   the hold audio instead.
2. The AI Chauffeur slowness is the flow's build (222 nodes; most turns run a read-and-route chain), not the new words.
3. /hq still scrolls sideways on a phone (529 px): another long word in an old board entry.
4. Rotate or delete the ChatDash import webhook in ChatDash: it is out of the files, not out of git history.
5. Four other repo files still carry the full …6562 number (two July reports, two tools scripts) — listed in the report, not changed.
```

