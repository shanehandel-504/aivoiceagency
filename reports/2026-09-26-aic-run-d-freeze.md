# AI Chauffeur Capture Desk — RUN D: post-publish verify + freeze

RUN INCOMPLETE — NO ACCEPTANCE CALLS ON DESK V1 YET · GHL SENDER LINE STILL "THANKS, AI VOICE AGENCY" · 2C TAG EXCLUSIONS NOT ADDED / RETELL SHOWS 0 DESK CALLS SINCE THE 1:19 PM CT PUBLISH · DISABLING SENDER INFO NEEDS SHANE'S LEGAL ATTESTATION · THE GHL BUILDER RENDERS BUT TAKES NO CLICKS / SHANE: MAKE THE ACCEPTANCE CALLS, DISABLE SENDER INFO, APPLY THE 2C CLICKS IN GOTCHA 3

2026-09-26 · 18:20Z–19:45Z · undo steps: private repo `shanehandel-504/aivoiceagency-archive` → `archive/ROLLBACK-BUNDLE-2026-09-25.md` § 8–9.
Nothing sensitive is in this file: no private numbers, no lead or test-caller names, no recording links, no keys.

```
===== SHANE READBACK — COPY ALL =====

WHAT HAPPENED (plain English)
You published desk v1 at 1:19 PM CT. This run checked it, closed what it could, and froze the desk.
- All three doors answer with v1: 414-775-0019 (in and out), 5008 (in and out), and
  aichauffeur.ai/try with no parameter. No binding was changed.
- No acceptance calls have reached v1 yet (0 calls from 1:19 PM to 2:38 PM CT), so the call table is empty.
- No test appointments were left to delete. Monday 1:00 and 1:20 PM are open. The Google Voice
  contact now carries zz-test and do-not-drip.
- STOP footer: GHL lets us edit it. It now reads "Reply STOP to opt out." and stays on. The desk's
  own STOP line is gone, so a caller sees one STOP line. GHL still adds "Thanks, AI Voice Agency"
  under it. Turning that line off needs your legal sign-off in GHL, so I left it.
- The setup-call text a booker gets comes from the GHL workflow "AIChauffeur — Booking Response".
  It is signed "AI Voice Agency". SHANE REVIEWS WORDING. Nothing changed.
- The setup-call time now travels under its own names (appt_date / appt_time / appt_timezone), so it
  can never land in the trip's date field again. The calendar sends the old and the new names; the
  desk's v2 DRAFT reads the new ones. v1 keeps answering, and keeps working, until you publish v2.
- "multi-language (50+ languages)" is live on the homepage and on every trip sheet.
- 2c: this time five of the six automation triggers were readable, but the GHL builder still ignores
  clicks, so no filter changed. Your clicks are in gotcha 3.
- T1–T10 are logged in the Tuning Tower. The runbook says the next tuning round runs on a copy
  (AIC-TEST-2) bound to 5008 — never on the live desk.

PUBLISH CHECKPOINT — DONE
| Row | Result |
|---|---|
| Live route: 0019 | inbound + outbound → agent_e41b2e957f1de46cf23dc25a84 latest_published = v1 · re-read 2:38 PM CT |
| Live route: 5008 | inbound + outbound → the same agent, latest_published = v1 |
| Live route: /try (no parameter) | WF-TRY-WEBCALL 7f2d8225 → the same agent, latest_published = v1 |
| Desk v1 config | "AI CHAUFFEUR — CAPTURE DESK" · flow conversation_flow_c3c710be6c94 v1 · 99 nodes · reminders OFF (8000 ms × 0) · max call 720000 ms · hang-up after 20 s silence · tools get_open_slots 3000 ms, book_slot 8000 ms, team_alert 2000 ms |
| Acceptance table | 0 desk calls since the publish (Retell v3 list-calls, agent + time filter) · the 1 rail run since then is my own STOP proof · table empty |
| Post-publish snapshot | private archive ops/tuning/desk-v1-published-2026-09-26/ (agent v1 + flow v1, secrets redacted) · rollback § 8 now names "restore v1" and "restore old desk" · § 9 = this run · archive commit e1e34e0 |
| Test appointments | none left to delete (the only desk test booking was removed in RUN C) · Mon 9/28: 15 open slots, 1:00 + 1:20 PM included · Google Voice contact tagged zz-test + do-not-drip |
| STOP footer decision | editable: YES → path 2b · GHL opt-out text "Reply STOP to unsubscribe." → "Reply STOP to opt out." (ON) · the rail's own STOP line removed (rail 15a7c3bc → 79a5e162) · proof text to the Google Voice line: "AI Chauffeur: your trip sheet with the recording and transcript is ready — <link>" / "Reply STOP to opt out." / "Thanks, AI Voice Agency" → one STOP line ✓ · brand ✗ (the sender line) |
| Booking confirmation text | source: GHL workflow "AIChauffeur — Booking Response" (the calendar's own notifications are empty) · sender 350-220-5305 · body: "Hi <first name>, your AIChauffeur setup call is booked for Monday, September 28, 2026 1:20 PM. Reply here or call 350-220-5305 to reschedule. — AI Voice Agency" · SHANE REVIEWS WORDING |
| appt field rename | calendar rail 9411b33d → 18bd10cd (book_slot adds appt_date / appt_time / appt_timezone, keeps the old names) · rail team alert #2 + sheet "appointment booked" read the new names (79a5e162) · flow v2: N08-BOOKED placeholders + book_slot variables renamed, words unchanged · desk v2 = UNPUBLISHED DRAFT |
| appt gates | calendar unit 7/7 · staging booked + blocked paths (executions 10797, 10798) · production blocked-path smoke 200 in 239 ms · rail unit 8/8 · flow suites 25/25 + 23/23 · validator: 99 nodes, 55 approved lines byte-exact, 0 problems · sims X09 + X10 PASS on flow v2 with a new-names-only mock → "Confirmed for Monday September twenty-eighth one PM Central. The team will call then." |
| Copy change live | homepage chauffeur/index.html (commit 27fcc16, aichauffeur deploy READY, production shows it) · trip sheet e92d57a1 → 82ea5266 (production page shows it) · render gate 390×844 + 1440×900: no overflow, 0 console errors, list height unchanged, text 16.74:1 · basis: Retell's API language list = 63 locale codes, 55 languages |
| 2c | read today: 03 drip, 04 onboarding, Booking Response, READY Relay, "New Workflow" (5 of 6) · Reminder Engine: not legible · filters changed: NONE · clicks in gotcha 3 |
| T-items logged | Tuning Tower child page https://app.notion.com/p/3e7581219cb2814bae15e865d7dbb51a · pointer added under the tower's § 5 |
| Runbook | private archive ops/RUNBOOK-aic-capture-desk.md (AIC-TEST-2 on a flow copy, 5008 bound to it for the round) · commit 46d35df |
| L5 wrap | https://app.notion.com/p/3e7581219cb281f49352edef66e71d48 |
| Archive index rows | rows 17–22 (agent, flow, rail, calendar rail, trip sheet, trip log sheet) + a /try update, each with re-enable steps · commit e1e34e0 |
| Board + report + receipt | hq/board.json → aic-capture-desk LIVE — frozen 2026-09-26 · reports/2026-09-26-aic-run-d-freeze.md · receipt https://app.notion.com/p/3e7581219cb281e7a735c97b83dbf48c |
| LIVE CHANGES MADE | rail 79a5e162 (was 15a7c3bc) · calendar rail 18bd10cd (was 9411b33d) · trip sheet 82ea5266 (was e92d57a1) · GHL opt-out text (was "Reply STOP to unsubscribe.") · Google Voice contact +zz-test +do-not-drip · 2 RUN D test trip sheets deleted · homepage one line (27fcc16) · desk agent: v2 DRAFT awaiting you (v1 serving) · 0019 / 5008 bindings unchanged · /try unchanged · GHL automation filters: NONE |

ROLLBACK (one line each; full steps in the private bundle § 8–9)
- rail: publish TkETvvnABhUPd7ME version 15a7c3bc-84cd-48c2-9109-9bcf5006490a (brings back the rail's STOP line — do this first if the GHL footer is ever turned off)
- calendar: publish TLoF7bzuPYy1NAW1 version 9411b33d-1841-4608-b034-872fcf252094 (only while v1 is serving)
- trip sheet: publish 3PfmC7sxOjUHI0rE version e92d57a1-4b02-46ce-8932-aa5049f80f92
- GHL footer: Messaging Compliance → opt-out message → "Reply STOP to unsubscribe." → Save
- homepage: git revert 27fcc16
- desk: "restore v1" = create-agent-version from v1, then publish it · "restore old desk" = R-whole-desk (0019 back to agent_2d1d… v27, then the /try line)

WHAT'S NEXT
1. Acceptance calls on v1, from the Google Voice line: 0019, then 5008, then aichauffeur.ai/try on
   your phone. Take one setup call. The next run fills the call table and cancels those test
   appointments.
2. Sender line: GHL → Settings → Phone System → Messaging → Messaging Compliance → Sender information
   → Disable → tick the three boxes (your attestation) → Save. One test text should then end with
   only "Reply STOP to opt out."
3. Booking text wording: yours (gotcha 2).
4. The 2c clicks (gotcha 3).
5. Publish desk v2 after step 1 passes. The next run then drops the old date / time / timezone names
   from the calendar rail.

GOTCHAS
1. GHL STILL SIGNS EVERY FIRST TEXT "Thanks, AI Voice Agency", AI Chauffeur callers included. Only
   you can switch it off (legal attestation). The footer rides the first text of a conversation and
   the 30-day repeat opt-out, not every text.
2. THE BOOKING TEXT CROSSES BRANDS TWICE: it is sent from 350-220-5305 (the AVA text line) and signed
   "— AI Voice Agency". It also spells "AIChauffeur" as one word. Not changed: SHANE REVIEWS WORDING.
3. 2C IS STILL OPEN. The builder renders now, but ignores every click (trigger card, zoom, scroll;
   3 tries). What each trigger says:
   - 03_AVA_7_Day_Follow_Up_Drip: tag "follow-up-drip" added → a test contact gets in only if someone
     adds that tag; no n8n rail does.
   - 04_AVA_Onboarding_Checklist_Closed_Won: deal moved to Closed Won ("AVA Transportation Pi…")
     → only by a person.
   - AIChauffeur — Booking Response: appointment booked on "AIChauffeur Setup C…" → tag, deal,
     internal note, email, text → YES: every setup call booked from our numbers lands on the
     zz-test contact.
   - AVA Demo Call — Reminder Engine v1: not legible (26% zoom, clicks ignored) → unknown.
   - LIVE — READY Relay: SMS reply containing "RE…" (READY) → webhook → YES: texting READY from
     our numbers.
   - New Workflow : 1779930425651: inbound webhook, no filters, warning dot → action → webhook
     → likely: n8n "AVA Layer 1 — Money Path Spine" posts to a GHL inbound hook.
   Clicks: Automation → Workflows → open it → click the trigger → Add filters → the tag filter
   ("Doesn't have tag" / "Contact tags does not include") → zz-test, zz-internal → Save → keep
   Publish on.
   - Booking Response: zz-test + zz-internal. NOT demo-caller (that is setup-call handling).
   - 03 drip: zz-test + zz-internal + demo-caller.
   - Reminder Engine: read the trigger first; the same two tags if it is a booking trigger.
   - READY Relay: excluding zz-test also stops your own READY tests. Your call.
   - New Workflow: an inbound-webhook trigger filters on the payload, not on tags. The guard belongs
     in the Money Path Spine (skip our numbers before it posts). Your call.
4. OLD AND NEW BOOKING NAMES ARE COUPLED. The calendar sends both until v2 has read back a live
   booking. If v2 is published and the calendar is then rolled back, the booked line is spoken with
   blanks.
5. THE PROOF TEXT'S LINK NOW SAYS "This trip sheet isn't available." I deleted this run's two test
   trip sheets because each public page showed one of your private test-line numbers. RUN C's smoke
   sheet (house line) is still up; say the word and it goes too.
6. The trip log sheet keeps 2 RUN D test rows (the staging smoke + the STOP proof). Not removed from
   here.
7. TEXTS YOU GOT FROM THIS RUN, none of them a lead: 1 caller text on the Google Voice line (the STOP
   proof), plus 1 owner text and 1 owner email for that same test.
8. THE PUBLIC BOARD CARRIES FIVE INTERNAL LINE NUMBERS. hq/board.json (served at /hq/board.json)
   has the demo-pool lines ending 8042, 6409, 6486, 1886 and 8976 in lane L2's note, from an earlier
   run. They are in OUR_NUMBERS and are not shown on /live. Not changed here (not this run's lane);
   say the word and they get masked. Git history keeps them either way.
```
