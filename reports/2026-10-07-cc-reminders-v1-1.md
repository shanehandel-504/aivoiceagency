# CC-REMINDERS v1.1 — timer hours bounded, then the AI Chauffeur widget bookings added

2026-10-07 · follow-up to CC-REMINDERS v1 (reports/2026-10-05-cc-reminders-v1.md) · Shane's order in chat: "bound the hours. Then v1.1".
One workflow changed: n8n WF-SETUP-CALL-REMINDERS (618G34AR1xQTr3Uf). Proven on the inactive staging copy first.
Read only and unmoved: both phone lines (414-775-0019, 414-240-8930), every Retell agent, WF-AIC-SALES-CAL, WF-AVA-SALES-CAL, the post-call rail, Cal.com, every GoHighLevel calendar and workflow.
Nothing sensitive is in this file: no key, no header value, no private number, no caller name, no contact id, no Cal.com id. Caller numbers are last four digits only.

```
===== SHANE READBACK — COPY ALL =====

STATUS
- Timer hours: LIVE since 11:59 AM CT. The check runs every 5 minutes from 6:00 AM to 6:55 PM Central.
- First real send: WORKED. At 12:45:00 PM CT the caller's 15-minute text and your CALL IN 15 ping both went out.
  GoHighLevel shows both delivered.
- v1.1: LIVE since 12:45:49 PM CT. Calls booked on aichauffeur.ai/book now get the three texts and you get the ping.
- LOOK AT THIS: the Tampa booking was cancelled in Cal.com at 12:47:55 PM CT. That is three minutes after the
  texts. The cancel came from the attendee address on the booking, which is your own +aic-setup address. I did not
  cancel it: this run only reads Cal.com. The caller sent no reply. The GoHighLevel copy still shows 1:00 PM.

WHAT I DID (plain English)
- Bound the hours. Same 5-minute check, but only 6 AM to 7 PM Central. About 4,700 runs a month, down from 8,640.
  Nothing else in the workflow moved for that step.
- Left that version alone for the 12:45 real send, then read the send back from n8n and from GoHighLevel.
- Built v1.1. Calls booked on the aichauffeur.ai/book widget live on the GoHighLevel calendar and never reach
  Cal.com. The workflow already read that calendar to find the phone bookings' contacts. Now it also takes the
  widget bookings from it. Same words, same quiet hours, same never-twice table.
- Consent for a widget booking is the same test a phone booking passes: a booking text is on record for that
  booking, and the number is not on do-not-disturb. For the widget, the booking text is GoHighLevel's own
  ("your AIChauffeur setup call is booked..."). The workflow reads it from the caller's text thread. No booking
  text, or a thread it cannot read, means no caller text. You still get the ping.
- Proved it on the staging copy first. No widget call is booked in the next 72 hours, so the staging run was fed
  one made-up appointment on a real past widget contact. Nothing was created in GoHighLevel. Every would-be text
  went to the ZZ sink. Nobody was texted.
- Put the same build live. Live differs from the tested staging build only by live mode, its own table and the
  real text step. Against what was live before, 16 of 19 steps are untouched.

DONE TABLE
| Step | What changed | Verified by | Live |
|---|---|---|---|
| 1 Bound the hours | The timer step only: every 5 minutes, hours 6 to 18, Central | n8n validate_node_config valid · update_workflow, then draft vs build ZERO DIFF and old build vs new build differ on the timer step alone · publish → version 7b7e168f · timed runs on the 5-minute mark: 12495 (12:00:00 PM CT), 12498 (12:05:00), 12507 (12:10:00), 12508 (12:15:00) and every mark after | YES |
| 2 First real send | Nothing. Read back only. | run 12524, 12:45:00 PM CT: 2 texts handed on, 2 accepted by GoHighLevel (HTTP 201, message ids), 0 failed · caller thread: "AI Chauffeur — your setup call starts in 15 minutes. We'll call you at this number." delivered · owner thread: CALL IN 15 delivered · live table: 15-minute row sent, owner row sent | YES |
| 3 v1.1 logic, on my machine | Collect and Plan logic | the Tampa phone booking gives the same 4 sends at the same 4 times as v1.0 · widget fixture: 4 planned · 24 checks beside the baseline, all hold (no thread, unreadable thread, wrong thread, failed booking text, booking text from an older booking, do-not-disturb, cancelled, TEST name, no phone, our own number, owner-rail tag, API copy, same-day booking, already sent, both sources down, same number on two bookings) | n/a |
| 4 v1.1 in staging | Staging copy TRSFeQqDKW4lGhLu set to the v1.1 build (21 steps), still inactive | stored graph vs build ZERO DIFF · run 12499, real data: the phone booking reads as before, the cancelled widget booking is dropped · run 12500, calendar answer pinned, everything else read for real: 3 texts + the ping planned, consent from the GoHighLevel booking text, 4 posts to the ZZ sink (12501 to 12504), 4 rows marked sent · run 12505, fixture with no booking text: no caller text, ping only (sink 12506) | staging |
| 5 v1.1 live | Same workflow, now "WF-SETUP-CALL-REMINDERS v1.1": 2 new read steps, 1 step renamed, Collect and Plan changed | the built file was sent as is, 12:45:49 PM CT → version 67b21399 · active true, draft = active, ACTIVE graph vs build ZERO DIFF, Error Sentry attached · live vs tested staging, read back from n8n: only the clock's mode and horizon lines, the table id on 4 steps, and the text step's address and credential · live vs before: 16 of 19 steps untouched · timed runs 12525 (12:50:00 PM CT) and 12526 (12:55:00): no call in range, so they end at Collect | YES |
| 6 Board | hq/board.json item setup-call-reminders refreshed + one log entry | file round-trips byte for byte before the write · live board read back after the push | YES |
| 7 Report | This file. Step 7 of the v1 report now holds the first-send proof. | committed with the board | YES |
| 8 Slack | One post in #social with the next planned sends | message link in the chat readback | YES |

NEXT PLANNED SENDS (next 72 hours, staging run 12527 at 12:56 PM CT)
None. Cal.com holds no upcoming phone booking. The AVA calendar holds no call. The AI Chauffeur GoHighLevel
calendar holds two entries and neither counts: the copy of the cancelled Tampa call, and one widget appointment
that is itself cancelled.

What a widget booking gets (the staging fixture, call set for Thu Oct 8, 2:00 PM CT, caller in Eastern time):
| Kind | Send time CT | Caller's time | Text |
|---|---|---|---|
| 24 hours | Wed Oct 7 · 2:00 PM CT | 3:00 PM ET | AI Chauffeur — reminder: your setup call is tomorrow, Thu Oct 8 at 2:00 PM CT (3:00 PM ET). We'll call you at this number. Questions? Call 414-775-0019 |
| 9 AM | Thu Oct 8 · 8:00 AM CT | 9:00 AM ET | AI Chauffeur — your setup call is today at 2:00 PM CT (3:00 PM ET). We'll call you at this number. |
| 15 minutes | Thu Oct 8 · 1:45 PM CT | 2:45 PM ET | AI Chauffeur — your setup call starts in 15 minutes. We'll call you at this number. |
| Owner ping | Thu Oct 8 · 1:45 PM CT | n/a | CALL IN 15 — AI Chauffeur — [name] · 2:00 PM CT · [cell] |

IDS AND ROLLBACK
- Live workflow 618G34AR1xQTr3Uf · v1.1 = version 67b21399-dc7b-4c40-a404-21584b1017ac.
- Back to v1.0 with bounded hours, one step: publish version 7b7e168f-4378-4810-81d2-9cbbb2d3b0e7.
- Back to v1.0 around the clock: publish version f3b42591-1f5e-45d0-9ae2-4042d80a66b2.
- Stop everything: unpublish the workflow. The table stays.
- Staging copy TRSFeQqDKW4lGhLu, inactive, holds the v1.1 build. Tables as before.
- Owner rail: unchanged. The workflow still writes no contact.

WHAT'S NEXT
- The Tampa cancel. If that was you, nothing to do. If it was not, look at who has that mailbox.
- The first real widget booking is the first live run of the two new read steps. Check your phone against the
  table above.

GOTCHAS
- One rule is new, and it only ever holds a text back: the 9 AM text needs the booking to exist before 9 AM that
  day. The widget allows same-day bookings. Without the rule, a 9:10 AM booker gets "your setup call is today"
  minutes after the booking text.
- The widget's consent tick is not stored anywhere the API can read. The form shows the consent line; the proof
  the workflow uses is GoHighLevel's booking text plus no do-not-disturb. If that GoHighLevel workflow is ever
  switched off, widget bookers get no caller texts. You still get the ping.
- "AIChauffeur — Booking Response" was edited Oct 2. The last real widget booking I could read is from Aug 17:
  one text at booking, no reminder. The API cannot show that workflow's steps. If a reminder is ever added there,
  callers get two.
- The quota tool does not count this timer now. Its audit reads 1,440 of 10,000. The real timer math is 1,440 +
  4,680 = 6,120. The good side: its --fix leaves this timer alone.
- I have seen the timer run on every 5-minute mark since noon. I have not yet seen it stop at 7 PM. And a run at
  or after 2:00 PM CT is what shows the hours are read as Central.
- If call times ever open before 7 AM or after 7 PM Central, widen the timer hours.
- Only widget bookings and phone bookings are read. An appointment you add by hand inside GoHighLevel gets no text
  and no ping.
- A widget booking needs its GoHighLevel contact to hold a phone. If the contact read fails on one check, that
  check does nothing for the call and the next one tries again.
- When Cal.com cancels a booking, the GoHighLevel copy stays "confirmed". The workflow follows Cal.com, so the
  cancelled Tampa call gets nothing more.
- No Notion inbox page: not asked for.
```
