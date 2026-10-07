LIVE — THE LIMO TRANSFER IS ON 414-240-8930: AVA V51 (GROK V50E), BOOKING ON THE REAL CALENDAR, THE NEW OPENERS — PUBLISHED OCT 7, 1:47 PM CT — NEXT: SHANE'S CHECK CALL ON THE LIVE LINE

# AVA limo transfer — go-live

2026-10-07 · on Shane's go in the session · the live AVA agent and two n8n rails.
Read only and unmoved: the AVA TEST agent (v12), the AI Chauffeur line (414-775-0019, two-door v13), the old capture desk, the briefing agent, every phone number record, every other n8n workflow.
Nothing sensitive is in this file: no key, no header value, no webhook path, no private number, no caller name. Probe and pool lines are last four digits only.
Earlier runs: reports/2026-10-07-ava-limo-transfer-words-v2.md · reports/2026-10-06-ava-limo-transfer-words.md · reports/2026-10-06-ava-limo-transfer-prep.md.

```
===== SHANE READBACK — COPY ALL =====

WHAT I DID (plain English)
- You said go for all three. They went out in this order, each one checked before the next: booking, openers, agent.
- Booking. AVA's two booking tools now work on your real calendar, "AVA Demo Call", and let the live agent in. Before,
  they booked on a test calendar and let only the test agent in.
- Openers. The caller lookup on 414-240-8930 now hands AVA Grok's four openers. They sat in a switched-off copy since
  Sep 26. I copied its two values over unchanged.
- Agent. The live agent went from v49 to v51. It carries what was proven on the test agent: Grok's v50e words byte for
  byte, the transfer tool, the two booking tools, the tested speech settings. It keeps its own post-call rail.
- I wrote no word an agent speaks. The prompt and the openers are Grok's.
- I placed no test call, by your ruling. No call had reached the new agent when I took the end read.
- One stop on the way: at about 12:36 PM CT this session's safety check refused the first publish. Nothing went live
  then. I stopped and asked you. After your instruction it went through at 1:46 PM CT.

WHAT A CALLER GETS NOW
- A cold caller hears: "AI Voice Agency, this is AVA. I answer every call and book the job for service businesses.
  What kind of business do you run?"
- Says limo, black car or the like: AVA says limousine and black-car companies have their own agent, AI Chauffeur, and
  asks to transfer. Yes: the same call goes to the AI Chauffeur agent, which starts from its own greeting. No: AVA
  stays on and answers short.
- Any other business: the missed-call question, what AVA does, then the discovery call on your real calendar.

DONE TABLE
| Step | What | Status | Evidence |
|---|---|---|---|
| 0 | Fresh reads before the go | DONE | 11:56 AM CT, and again at the start read 17:31:19Z (12:31 PM CT): live v49 (the old prompt, 21,527 characters; tools end_call and book_appointment), test v12 = v50e, no AVA agent written by another session today · the real calendar read from GoHighLevel by id: "AVA Demo Call", active, 15-minute slots, same location, the workflow's team member is on it |
| 1 | Booking workflow | LIVE | WF-AVA-SALES-CAL fMwY56uNlJaDzkcd serves 17f9249b (was 0968c734) · five values changed, each equal to the plan by SHA-256 on the draft and on the served version: the calendar id in four places (GHL Free Slots, Get Calendar, Create Appointment, Save Booking), notify on, allow-list = test agent + live agent · the other 24 nodes and all connections identical · error workflow still attached · checked on the served version at 18:46:23Z: both open times offered are on the real calendar (read directly); booking gate with no time: the live agent passes ("missing_slot", was "agent_not_allowed"), an unknown agent is refused · the check requests ran the gate nodes only, no write node |
| 2 | Openers | LIVE | WF-ANI-AVA ITGRwcRKxLgmKnBZ serves 804b5b4c (was b67ac140) · two values copied from the staged copy RuC3gKs6YtK4ampQ, equal by SHA-256 on the draft and on the served version; the other 7 nodes and all connections identical · the four openers equal the v50e prompt's COLD, RETURNING, WEB-ACTIVITY and UPCOMING-APPOINTMENT lines word for word · a lookup for a made-up 555 number at 18:47:39Z returned the COLD opener word for word (before: the old 26-word opener) · it ran the lookup nodes only |
| 3 | Live agent | LIVE | agent_d5ada9f774fe3ae7f034d2c677 v49 → v51, published 18:47:45Z (1:47 PM CT) · prompt SHA-256 b622d7eb2ceef305e4ba489a5d0e13ef761dfb73a5ad0e7f4dde803b7d8bf1e0 (7,759 characters) read back on the draft, before publish and on the published version; equal to the test agent's v12 prompt · tools equal the test agent's four, object for object; book_appointment is gone · start values: the live keys kept, the default opener = COLD, the five AI Chauffeur start values added · 8 agent settings changed, all to the test agent's values (list below) · the only settings that differ from the test agent: the live line's own post-call webhook, its events and its timeout · 19 of 19 checks four times: draft, at the resume, before publish, published · 414-240-8930 and the four demo pool lines follow the newest published version, so they serve v51; no number record was touched |
| 4 | Nothing else moved | DONE | 30 of 30 end-state checks, start read 17:31:19Z against end read 18:48:47Z · test agent, two-door, old desk, briefing: version lists identical and served objects equal field for field · all 8 number records identical · live agent: one version added (v51), v0 to v50 untouched · n8n: 77 workflows, 29 active, before and after; changed: this run's two, and one that is not this run's (the reminders workflow, changed by its own session at 12:45 PM CT) · the post-call rails, the old booking workflow, WF-AIC-SALES-CAL, the ZZ sink and the Error Sentry: untouched · Retell call records since the start read: 0 · owner rail law on the switched booking workflow: 13 of 14 — own numbers go to the test contact before any lookup, create or booking; no upsert; the owner-alert contact is never a target; the one miss is a tag on that contact (gotcha 12) |
| 5 | Close | DONE | board item flipped to live and log line 2026-10-07T13:50:26-05:00 · /hq and /work rendered at 390×844 and 1440×900 with the new board: the new line shows, no console error; /hq at 390 is wider than the screen, the same as before this run (gotcha 10) · this report · Notion: RUN REPORTS INBOX |

THE EIGHT AGENT SETTINGS THAT CHANGED (live v49 → v51, each now equal to the test agent)
- How fast AVA stops when the caller talks over: 0.82 → 0.90.
- Nudge after silence: 25 seconds → 8 seconds. Hang-up after silence: 30 seconds → 20 seconds.
- Background call-center sound: on → off.
- Backchannel words ("got it", "right"): 0.30 → 0.35.
- Handbook switches: scope boundaries, smart matching and AI disclosure on; high empathy, filler words and default
  personality off.
- Boosted words: none → 20 (limousine, limo, black car, chauffeur and so on).
- Post-call analysis: two fields added, industry and handoff_attempted. The AVA post-call rail reads both.
- Also, on the language side: strict tool calls off → on, as on the test agent.

YOUR CHECK CALL (to 414-240-8930)
- Call 1. When AVA asks what kind of business, say: "Trying to see how a limo reservation would work." To the offer
  say: "Yes." Listen for: the offer in AVA's first reply, then the AI Chauffeur greeting.
- Call 2. Say: "Plumbing." Answer its question. Then ask: "What does it cost?" Listen for: no limo talk at all, and
  four hundred ninety-seven a month as the base price.
- If your cell is a saved contact, AVA opens with the returning-caller line, not the cold one. That is the lookup
  doing its job.
- If you accept a discovery call time, it lands on the real calendar. By the Oct 6 read your cell is on our
  own-numbers list, so it is filed under the test contact. Cancel it after.
- By the Oct 6 reports, a call that reaches the transfer sends you an owner text and an owner email from the AI
  Chauffeur rail, marked "via AVA line", and an alert from the AVA rail.

IDS / ROLLBACK
- Live agent agent_d5ada9f774fe3ae7f034d2c677: v49 before, v51 after. v50 is an old untouched draft. LLM
  llm_d0f4aff62bb8b60ff878055aa18c v51.
- Booking workflow fMwY56uNlJaDzkcd: 0968c734-4383-4278-a58f-58da9a74c5c7 before, 17f9249b-3f4e-43cb-9ea2-4cd9f759aa0b
  after.
- Caller lookup ITGRwcRKxLgmKnBZ: b67ac140-3739-497b-acbf-51f27a3c3f87 before, 804b5b4c-a3ff-4a82-a557-015b5c7d2e76
  after.
- Rollback, agent first: make a new agent version from v49 and publish it; publish caller lookup b67ac140; publish
  booking 0968c734. Each is one action. Published versions cannot be edited or unpublished.
- Still there, unused now: the old booking workflow c5GPBkma1HyvonEa ("AVA · book_appointment · realtime"). A rollback
  needs it.
- Not touched: test agent v12 · two-door v13 on 414-775-0019 · old capture desk · briefing agent · every number
  record.
- Commit: the one that adds this file. Notion: RUN REPORTS INBOX, title "[2026-10-07] — Claude Code — AVA LIMO GO-LIVE
  — 🟢 LIVE".

WHAT'S NEXT
1. Your check call on 414-240-8930.
2. Send this report to the AVA limo fix chat for its check.
3. Grok, after real calls: the last turn of the no path, and the other parked items in the run 2 report.
4. Housekeeping, when you say: the booking workflow's name still says "ZZ TEST calendar until promote"; the two
   switched-off staging copies can be archived.

GOTCHAS
1. v50e has never had a voice call. Yours, or a real caller's, is the first. The simulations were text.
2. A limo caller who says no three times gets "What else do you want to know?", not the demo number and the setup
   call. Known from run 2, parked for Grok.
3. Phone bookings now trigger the calendar's own texts. "Notify on" is what the Sep 26 plan asked for; the old tool
   sent no flag at all. No booking was made to prove what a caller receives. The first real booking will show it.
4. The test agent and the probe line ending 8976 use the same booking workflow. A test booking there now lands on the
   real calendar too.
5. The four demo pool lines got v51 as well. They have no caller lookup, so they always open cold.
6. A handed-off call sends two owner alerts: one from the AVA rail, one from the AI Chauffeur rail.
7. The AI Chauffeur agent may say its recording notice again after the handoff. You accepted that as is.
8. AVA sounds a little different beyond the words: no background sound, it yields faster when talked over, and it
   nudges after 8 seconds of silence.
9. If the two-door agent's start values ever change, the five mirrored on the live AVA agent must change with them.
10. /hq on a phone is still wider than the screen: 601 px on a 390 px screen, the same as before this run. Not fixed,
    not asked.
11. Nothing pins the live agent to a version. Any later publish on that agent goes straight to 414-240-8930.
12. The owner-alert contact carries the tags zz-internal and do-not-drip but not owner-alerts. The record was last
    changed Sep 28, so this is older than today. I did not touch it. It does not open a path to that contact: its
    phone is on the own-numbers list and the booking workflow never names it.
```
