# Discovery words — LIVE on all six lines (2026-10-15)

> **READ ONLY.** Close of PASTE-CC-DISCOVERY-WORDS-RUN v1.3 after Shane's ruling of 2026-10-15: the AI Chauffeur speed gate is "no slower
> than today's live v13" (it passes, 2.9 s vs 5.0 s answer gap); a faster AI Chauffeur flow is a later rebuild, not this run. Then step 9
> (promote), step 7 (one name, one path) and step 10 (close), plus Shane's instruction to take the full …6562 number out of four files.
> Earlier: `reports/2026-10-15-discovery-words-run-v1-3.md` (sims, speed, 5a–5f), `…-run-v1-2.md`, `reports/2026-10-14-discovery-words-run.md`.

**RUN INCOMPLETE — WHAT: ONE OLD BOOKING RAIL STILL RUNS (WF-AIC-SALES-CAL) · WHY: AI CHAUFFEUR v14's TEAM ALERT AND THE SEPARATE CAPTURE DESK AGENT (…5008) STILL CALL IT, SO RETIRING IT WOULD BREAK THEM · NEXT: MOVE THOSE TWO OFF IT, THEN RETIRE IT. EVERYTHING ELSE IS LIVE.**

The new words are live: 414-240-8930 and the four pool lines answer with AVA **v53** (Grok v53.3), 414-775-0019 with AI Chauffeur
**v14** (v14.3). All six lines get their start values from a webhook at call start. Every publish-checkpoint item is met except the one in
the line above.

## DONE

| Step | What | Result | Proof |
|---|---|---|---|
| ruling | AI Chauffeur speed gate | PASS (ruled) | Owner ruling: no slower than live v13. Answer gap v14.3 p50 2,876 / p90 5,380 ms vs v13 4,993 / 5,742 ms. Recorded in `ops/tuning/latency-after-2026-10-14.md`. AVA gate: PASS (e2e 1,067 / 1,880 vs 1,344 / 2,273). |
| 9b | AI Chauffeur promote | LIVE | Agent v14 published 17:56:42Z (nodes unchanged by the publish; greetings `6d9d1162` / `7bbd8f18`). …0019 inbound v13 → **v14** + webhook **WF-SHANE-SLOTS GET-SLOTS** 17:56:56Z (probe: HTTP 200, slots + team_free_now). Outbound and every other field unchanged. |
| 9a | AVA promote | LIVE | Live agent `agent_d5ad…` **v53** built from TEST v17 (prompt v53.3 SHA `3cbbb505…`, 21 start values, tools end_call / get_open_slots / book_slot (which_slot) / handoff_to_desk → **AIC v14** / transfer_team (hold ava-hold-v2) / note_caller, fast tier ON; voice, model, post-call webhook and every other field = v51), published 17:57:14Z. **…8930** in + out → v53; **…1886 …6486 …6409 …8042** in → v53, each with the WF-ANI-AVA webhook, 17:57:17–18Z. |
| 9a | Caller lookup | LIVE | WF-ANI-AVA **910e8194** published (v3.3 openers with "This call is recorded." + the five slot values); draft set equal to it. Production probe, unknown caller: …8930 1,374 ms and …1886 1,722 ms, opening_line = v53.3 COLD, five slot values present. |
| 5c | Probe line …8976 | DONE | Stays on AVA TEST (latest published) — it is the one phone path to the test agent — and got the WF-ANI-AVA webhook, so a test call there gets the same start values as a live call. |
| 9 | Check calls | PASS | Web call on live AVA v53 (`call_ee7712…`): first line = the v53.3 COLD line word for word, slot values in the call's variables, roofer pivot line. Web call on live AIC v14 (`call_21023f…`): the demo started ("Pickup address, pickup time, and which airport?"), "what can you do for me" switched it to questions, no trip question came back, setup call path reached the open times. Both `metadata.test_mode` (no owner page, bookings dry). |
| 7a | GHL calendars | DONE | …6Mlg "AVA Demo Call" → **"AVA setup call"**, minimum notice 4 h → **0** (slot already 15 min). …eWZ7 "AIChauffeur Setup Call" → **"AI Chauffeur setup call"** (already 20 min, notice 0). Re-read: AVA changed name + notice only; AIC changed the name, and GHL wrote out four defaults it had left blank (buffers 0, guest collection email, countAvailableDaysOnly false). Ids unchanged. |
| 7b | Retire old rails | PARTLY | **WF-AVA-SALES-CAL** deactivated and renamed "ZZ-RETIRED WF-AVA-SALES-CAL …" (no agent among 22 and no workflow among 78 pointed at it). **WF-AIC-SALES-CAL stays active**: AIC v14's `team_alert` tool (kept from v13) and the AI CHAUFFEUR — CAPTURE DESK agent (`agent_e41b…`, inbound …5008, outbound for …0019) still call its open-slots / book-slot / team-alert webhooks. WF-SETUP-CALL-REMINDERS keeps running and reads the engine's bookings (e0855328); no "strategy call" / "discovery call" label left in it. |
| 7c | CLAUDE.md | DONE | Committed f0af4b1 (setup call, the …6562 line private, two Retell rows). |
| 6562 | Four files (Shane) | DONE | `reports/2026-07-17-lsa-campaign.md`, `reports/2026-07-17-run5-5.md`: the number → "Owner direct line (…6562)". `tools/callback-gate/01-recon.mjs`: the comment's example → the owner direct line (…6562). `tools/truth_audit.py`: the two list entries → the CLAUDE.md wording, and a last-four check (BANNED_SUFFIXES) in both places the list was used, so the audit still catches the line: planted test 5/5 formats + schema + head PASS; full audit output **byte-identical** to the run before the edit. Full …6562 now in **0** tracked files. |
| 10 | Close | DONE | Board row live + ISO LOG, this report, Notion inbox, commit pushed (below). |

## Publish checkpoint

| Item | State |
|---|---|
| Both agents serve the new versions on every number | YES — AVA v53 on …8930 …1886 …6486 …6409 …8042; AIC v14 on …0019 |
| AVA = TEST v17's prompt, tools and hold audio; AIC = flow v14.3 | YES |
| Webhook on all six numbers | YES — five WF-ANI-AVA, …0019 GET-SLOTS (…8976 too) |
| Parked WF-ANI-AVA 910e8194 published | YES |
| WF-SHANE-SLOTS the only booking path | **NO** — both agents book only through it; WF-AIC-SALES-CAL still runs for AIC v14's team alert and the Capture Desk agent's bookings |
| One confirmation text per booking | YES — engine bookings: GHL notifications off, the engine's text only (37590140) |
| Speed gate PASS | YES — AVA PASS; AIC PASS by the owner's ruling |
| Webhook URL gone from current public files | YES (f0af4b1) |

## Rollback lines

- **AVA** → re-pin …8930 (in + out), …1886, …6486, …6409, …8042 to **v51**; remove the WF-ANI-AVA webhook from the four pool lines and …8976;
  publish WF-ANI-AVA **804b5b4c**.
- **AI Chauffeur** → re-pin …0019 to **v13** and remove its webhook.
- **Rails** → publish WF-AVA-SALES-CAL **17f9249b** and rename it back (WF-AIC-SALES-CAL never stopped). WF-SHANE-SLOTS back = a46ad26a;
  WF-SETUP-CALL-REMINDERS back = 67b21399.
- **GHL calendars** → names "AVA Demo Call" / "AIChauffeur Setup Call", AVA notice 4 hours (before-reads in the working set).

## Shane: two check calls

1. **414-240-8930** from your phone: say any business, then "can I talk to someone" while your cell is free. Listen for the connecting
   line on hold before your cell rings, and the whisper when you pick up.
2. **414-775-0019**: start the demo trip, then say "what can you do for me". The demo stops and the questions part starts.

## LESSON

A line the caller must hear every time belongs in the mechanism (hold audio, static node), not in the prompt.

## Gotchas

1. WF-AIC-SALES-CAL is still the team-alert path for AI Chauffeur v14 and the booking path for the Capture Desk agent on …5008.
   Retiring it needs those moved to WF-SHANE-SLOTS (or a new alert path) first.
2. The ruling is on the answer gap. Retell's own e2e, which covers one turn per AI Chauffeur call, reads v14.3 2,515 ms vs v13 2,217 ms
   (from only 2 v13 calls that carry it).
3. The owner cell (…9511) is still spelled in full in three public files: the two July 17 reports and `tools/truth_audit.py`. Not in
   this ask; the same treatment would take it out.
4. The AVA calendar's booking-page slug is still "ava-strategy-call"; only the name changed (a new slug would break existing links).
5. The lines switched at 12:57 PM Central on a Thursday; a call already in progress finished on the old version.
6. /hq still scrolls sideways at 390 px (529 px) because of a long link in an old board entry.
7. Rotate or delete the ChatDash import webhook in ChatDash; it is out of the files, not out of git history.

```text
===== SHANE READBACK — COPY ALL =====
RUN INCOMPLETE — WHAT: ONE OLD BOOKING RAIL STILL RUNS (WF-AIC-SALES-CAL) · WHY: AI CHAUFFEUR v14's TEAM ALERT AND THE CAPTURE DESK AGENT (…5008) STILL CALL IT · NEXT: MOVE THOSE TWO OFF IT, THEN RETIRE IT. THE NEW WORDS ARE LIVE ON ALL SIX LINES.

PLAIN ENGLISH
The switch is done. 414-240-8930 and the four pool lines now answer with the new AVA (v53): the "This call is recorded" opener, the
new discovery words, two real open times from your calendar at the start of every call, booking by "the first one / the second one",
and a live hand-off to your line that plays "Connecting you with the team now" while it rings. 414-775-0019 answers with the new AI
Chauffeur (v14.3): the price is one fixed line, and it books on the same calendar engine.
I checked it the way a caller would: a test call on each line's new version, and the start-of-call lookup on two real lines.
Step 7: the two GHL calendars are renamed "AVA setup call" and "AI Chauffeur setup call" (the AVA one now takes same-day bookings),
and the old AVA booking workflow is switched off. The old AI Chauffeur booking workflow has to stay on for now: the new AI Chauffeur
still sends its team alert through it, and the separate Capture Desk agent on 414-409-5008 books through it. That is the one
item left, so the run is marked incomplete.
The full 6562 number is out of the four files. The audit tool still catches it (it now checks the last four), and its results did
not change.

DONE TABLE
| Step | Result | Proof |
| Speed ruling | PASS | AIC 2.9 s vs live v13 5.0 s (your ruling); AVA 1.07 s vs 1.34 s bar |
| AIC promote | LIVE | v14 published 17:56Z; 0019 → v14 + slots webhook 17:56:56Z |
| AVA promote | LIVE | v53 (from TEST v17) published 17:57Z; 8930 + 1886/6486/6409/8042 → v53 + lookup webhook 17:57:18Z |
| Lookup | LIVE | WF-ANI-AVA 910e8194; probes on 8930 and 1886: new opener + slots in 1.4–1.7 s |
| Probe line 8976 | DONE | stays on the test agent, now with the lookup webhook |
| Check calls | PASS | AVA v53 new opener word for word; AIC v14 demo → questions switch |
| GHL calendars | DONE | "AVA setup call" (notice 0) · "AI Chauffeur setup call" |
| Old rails | PARTLY | AVA rail retired (ZZ-RETIRED); AIC rail stays (team alert + Capture Desk) |
| 6562 in 4 files | DONE | 0 files left with it; audit output identical, last-four check proven |
| Close | DONE | report reports/2026-10-15-discovery-words-live.md; board; Notion; commit pushed |

IDS / ROLLBACK
- AVA: re-pin 8930 (in + out), 1886, 6486, 6409, 8042 to v51; remove the lookup webhook from the four pool lines and 8976; publish
  WF-ANI-AVA 804b5b4c.
- AI Chauffeur: re-pin 0019 to v13 and remove its webhook.
- AVA rail back: publish 17f9249b and rename it. GHL calendars: old names, AVA notice 4 hours.

WHAT'S NEXT
1. Your two check calls: 8930 (any business, then "can I talk to someone" with your cell free — listen for the hold line and the
   whisper) and 0019 (start the demo, then "what can you do for me").
2. Move AI Chauffeur's team alert and the Capture Desk agent (5008) off WF-AIC-SALES-CAL, then retire it.
3. Later: the faster AI Chauffeur flow (rebuild), and the SHOULD items D11–D14 after twenty real calls.

GOTCHAS
1. The owner cell (…9511) is still spelled in full in three public files (the two July 17 reports and tools/truth_audit.py).
2. Retell's own e2e number for AI Chauffeur covers one turn per call and reads v14.3 2.5 s vs v13 2.2 s; the ruling uses the answer gap.
3. The lines switched at 12:57 PM Central; a call already in progress finished on the old version.
4. The AVA booking page address still says "ava-strategy-call"; only the calendar name changed.
5. Rotate or delete the ChatDash import webhook in ChatDash (out of the files, not out of git history).
```

