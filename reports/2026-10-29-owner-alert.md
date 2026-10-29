```
===== SHANE READBACK — COPY ALL =====
NIGHT RUN · A measure, B owner alert · closed Thu Oct 29 2026 · 17:50 CT · Claude Code (Opus 5.5)
From PASTE-CC-NIGHT-v1 (Run A = PASTE-CC-AIC-AGENT-READ-v1, Run B = PASTE-CC-OWNER-ALERT-v1 steps 4–11, B1–B4)

RUN A — AGENT MEASURE (read only, commit 20ba1fe)
- 0019 (AI Chauffeur) leaves the caller waiting 4.03 s after they stop talking on a typical
  turn (p50) and 6.01 s on the slow ones (p95). AVA on 8930: 1.24 s / 3.30 s.
- Retell's own end-to-end figure on 0019 is 2.31 s at p50, but it exists on only 9 turns in
  20 calls: Retell writes none for a static-text reply, which is every trip-intake line.
- Where the five seconds go: not the model (2 ms on static text) and not the voice (64 ms).
  27 of 0019's flow nodes are set to responsiveness 0.3. On the 34 turns that answer one of
  them (the greeting, every bundled trip ask, every missing-item ask, the name asks) the flow
  waits 4.19 s at the median before it moves, for a 5.59 s gap. Static-text asks at the agent's
  0.8 wait 1.08 s. The same edge text waits 4.21 s on a 0.3 node and 0.58 s on a 0.8 node.

RUN B — OWNER-ALERT
- LIVE. Every analyzed call on AVA (8930) and AI Chauffeur (0019) now sends your cell one text
  and posts the same line to Slack, through the new n8n workflow OWNER-ALERT v1.
- The two proof texts (browser calls, no test switch, caller "Night"), both delivered:
  12:21 PM CT "CALL · Knight · AVA 8930 · call not successful, sentiment Neutral · web call, no number"
  12:22 PM CT "CALL · Knight · AIC 0019 · info_only, callback requested: no, sentiment Neutral · web call, no number"
  #bots has the same two lines. The three OWNER-ALERT lines above them (12:14–12:16 PM) are
  staging: the ZZ test and the two probe runs, all sent to the zz-test contact, not to you.
- CALENDAR-ONE still has to run. It must re-read TkETvvnABhUPd7ME before it edits: tonight
  added one node to it, and it now serves version 3d53d0ec.

THE OWNER RECORD (your ruling, written into CLAUDE.md § 9 as an amendment)
- The one GHL record holding your cell is the owner record. The demo-caller and
  aichauffeur-calendar-booked tags are gone. It keeps owner-alert / zz-internal / do-not-drip
  and has the note "OWNER — not a lead". DND is on for Email, Call, WhatsApp, GMB and FB.
  SMS stays open: GHL has no marketing-only DND, and SMS DND would block the alerts. Its
  campaigns are cleared, and it is out of all 8 published GHL workflows.

DONE — RUN B
| # | item | what shipped | status | proof |
|---|------|--------------|--------|-------|
| 1 | owner record | your ruling applied (above); one cancelled appointment left as it was | live | close assert: tags exact, DND per channel, note present; campaigns removeAll 200; 8 × workflow unenroll 200 |
| 2 | guard scan | n8n drip / reminder / booking / post-call guards read | read | guarded: AVA Drip Engine v1, WF-SETUP-CALL-REMINDERS v2.1, book_appointment, SALES-CAL, SHANE-SLOTS, WF-POSTCALL-AVA (unguarded: see gotchas) |
| 3 | n8n variables | OWNER_ALERT_CONTACT_ID repointed to the owner record; OWNER_TEST_NUMBERS (3 entries); OWNER_ALERT_URL = production webhook | live | gate: the variable resolves to the record holding the owner's cell |
| 4 | secrets | Doppler OWNER_ALERT_KEY + OWNER_ALERT_URL; n8n credentials "OWNER-ALERT Key" (header auth) and "Slack bot (ava_command)" | live | Doppler read-back equal; both writes approved by you in chat |
| 5 | ZZ copy | ZZ OWNER-ALERT v1 uFkagGrGRZxm5Ur1 aimed at the zz-test sink | proven, now inactive | wrong key 403 · first send sent + Slack · repeat deduped · test number skipped |
| 6 | production | OWNER-ALERT v1 zv4tViyB5EVW8Uhy, POST /webhook/owner-alert, header key, 10-minute dedupe by call id, test numbers and test_mode skipped, a failed text fails the run so the Error Sentry fires | live | gate: active, draft == served, Sentry attached; skip ping + wrong key 403 |
| 7 | rails | one node "→ OWNER-ALERT" (continue on error, 8 s timeout) added to AVA post-call 6r8YHuMEJbxeDyT5 (serving b9c39d5a) and demo post-call TkETvvnABhUPd7ME (serving 3d53d0ec) | live | +1 node +1 edge each; same body as probes Y5DeGykxYuax68wO / B1ThbENJghUWD96T run on real payloads |
| 8 | hardcoded rails | 9FoLm4slBmM5nIus Owner SMS Alert on $vars contact + from (serving fc62f5ab); RH6POCJWU5CUdTyd owner text on $vars, email to $vars.OWNER_ALERT_EMAIL, "Upsert Owner Contact (Shane)" disabled (serving 37ba1ff8) | live | diffs = the intended lines only; gate on served versions |
| 9 | proof calls | AVA call_1cc1401a826b28c92d53914eb08 → rail run 17591 → alert run 17592; AIC call_6fe123da3d45dfbd3a808b08420 → rail run 17598 → alert run 17599 | live | exactly 2 delivered texts on the owner record; exactly 2 #bots lines for the 2 calls (12:21:57, 12:22:39 CT) |
| 10 | test switch on prod | two 0019 browser test calls from another session (test_mode on) → alert runs 17680 / 17690 skipped | live | no text, no Slack line |
| 11 | ops note (step 11) | "OWNER-ALERT production webhook is live; the hourly inbox sweep may now fire it through the n8n connector's execute_workflow for PROSPECT and LEAD lines. Ruling for the Tower: a Claude task may execute an existing alert workflow that texts only the owner; it never edits one." | paste ready | — |
| 12 | B4 | "CALENDAR-ONE still to run; it must re-read TkETvvnABhUPd7ME before editing." | waiting | TkETvvnABhUPd7ME serves 3d53d0ec |
| 13 | board + § 9 + report | hq/board.json item OWNER-ALERT live + one ISO log entry; CLAUDE.md § 9 amendment; this report | live | commit "rails: OWNER-ALERT live — call alerts to owner cell + #social"; /hq |
| 14 | rollback files | PASTE\rollback\{SlnAeMrVRORsF0w7,6r8YHuMEJbxeDyT5,TkETvvnABhUPd7ME,9FoLm4slBmM5nIus,RH6POCJWU5CUdTyd}-2026-10-29T033802Z.json + n8n-variables-before-owner-alert-2026-10-29.json | on disk | 6 files |
| 15 | Error Sentry | SlnAeMrVRORsF0w7 active, attached to all five workflows touched | live | gate GREEN (25/25) + close assert GREEN (7/7) |

LESSON: a dedupe key built from kind + first name + number merges two different web calls
from the same first name; key on the call id whenever there is one.

DONE — RUN A: printed at Run A's close (Oct 29 03:37 UTC); in full in
reports/2026-10-28-agent-measure-v1.md and PASTE\AGENT-MEASURE-v1-2026-10-28.md.

ROLLBACK (one line each)
- kill switch, no edit: deactivate zv4tViyB5EVW8Uhy. Both rails continue on error; nothing else changes.
- AVA post-call 6r8YHuMEJbxeDyT5: publish e0454827-2e28-4144-8594-00189fad75b6
- demo post-call TkETvvnABhUPd7ME: publish 830898d5-7f80-4267-bcd4-7a85290f0b64 (only if CALENDAR-ONE has not published since)
- client intake 9FoLm4slBmM5nIus: publish 33184ac3-06c4-467e-abff-6006f90ed50c
- alert_owner RH6POCJWU5CUdTyd: publish a6158fce-4e7e-42c5-8615-871ea249087b
- OWNER_ALERT_CONTACT_ID: old value in PASTE\rollback\n8n-variables-before-owner-alert-2026-10-29.json
- repo: git revert the "rails: OWNER-ALERT live" commit
- the owner record itself is not rolled back (your ruling)

NEXT
- CALENDAR-ONE (needs your GHL clicks): re-read TkETvvnABhUPd7ME first.
- The hourly inbox sweep may now execute OWNER-ALERT for PROSPECT and LEAD lines (step 11).
- Your call: an OUR_NUMBERS guard on the two upserts that still lack one (gotcha below).
- Your call: the opening word of the alert (gotcha below).

GOTCHAS
- Retell heard "Night" as "Knight", and an earlier analysis gave the first name "I". The alert
  prints whatever Retell's analysis wrote.
- GHL added "Reply STOP to opt out. Thanks, AI Voice Agency" to the first text, because it
  was the first SMS to that record; later texts come without it. If you reply STOP from your
  phone, GHL turns on SMS DND and the alerts stop.
- AVA's call analysis has no callback field, so the AVA alert shows a number only from a phone
  call's caller ID. Web calls read "web call, no number".
- OWNER_TEST_NUMBERS holds 3 numbers: your cell, the direct line and the Google Voice line.
  The house line is not in Doppler, so it is not on the list, and a call from it would alert.
- The PASTE's "#social (C0ALKB5NDM4)" is named #bots in Slack, and the lines go to that id.
  The bot can post there but cannot read history (no channels:history), so I checked the lines
  through the Slack connector.
- The ZZ sink was the zz-test contact that holds the Google Voice line, because
  ZZ_TEST_CONTACT_ID has no phone.
- The older owner texts inside the AVA and demo post-call rails still go to the direct line
  through $vars.OWNER_CELL, and their fallback contact id (starts DkkL) is a deleted contact.
  Your cell gets one OWNER-ALERT text per call; 9FoLm and RH6P now text the owner record too.
- 6r8YHuMEJbxeDyT5's own owner text keeps a literal from-number fallback in its node. It was
  not touched tonight (one-node additive change).
- Two upserts have no OUR_NUMBERS guard: RH6P "GHL Upsert Contact" and 9FoLm "GHL Upsert". Fed
  your cell, they could still write to the owner record.
- These n8n workflows do not check do-not-drip: AVA Booking Receipt, send_link, newsletter,
  write_reservation and WF-ANI-AVA.
- The GHL API cannot read workflow triggers. Leaving all 8 workflows is the best proof
  available; a tag or appointment trigger could still enroll the record later, and only the
  GHL builder shows triggers.
- The MESSAGE FORMAT LAW says owner alerts open with the status (BOOKED / MISSED / VOICEMAIL /
  FOLLOW-UP); the PASTE's lines open with "CALL". Built as the PASTE says; that word is yours.
- RH6P's email now goes to $vars.OWNER_ALERT_EMAIL. The address hardcoded there before was a
  different inbox.
- The record's GHL type still reads "lead"; the tags and the note mark it as the owner.
- The DND reason text on the record reads "OWNER - not a lead" with a plain hyphen; the note
  uses the dash.
- Dedupe is static data with no lock, so two runs for the same call in the same instant could
  both pass. Different calls never merge, because the key is the call id.
- The NIGHT PASTE said Run B commits only hq/board.json. Per your message today, this commit
  also carries the § 9 amendment and this report.
```
