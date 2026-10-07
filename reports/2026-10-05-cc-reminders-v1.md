# CC-REMINDERS v1 — setup-call reminder texts

Brief dated 2026-10-05 · run 2026-10-07 · paste CC-REMINDERS v1 · one new n8n workflow, built in staging first.
Read only and unmoved: both phone lines (414-775-0019, 414-240-8930), every Retell agent, WF-AIC-SALES-CAL, WF-AVA-SALES-CAL, the post-call rail.
Nothing sensitive is in this file: no key, no header value, no private number, no caller name, no contact id, no Cal.com id. Caller numbers are last four digits only.

```
===== SHANE READBACK — COPY ALL =====

STATUS
LIVE since 11:07 AM CT, Wed Oct 7. That is a day after the brief's deadline (Tue Oct 6, 1:00 PM CT): this run
started at 10:47 AM CT on Oct 7. The Tampa call's 24-hour text and 9 AM text were never sent. Its 15-minute text
and your ping are planned for 12:45 PM CT today.

WHAT I DID (plain English)
- Built one new n8n workflow, WF-SETUP-CALL-REMINDERS v1.0. Every 5 minutes it looks at the setup calls booked for
  the next 26 hours. When a reminder is due, it texts the caller. It also texts you 15 minutes before each call so
  you know to dial.
- Built it as a staging copy first. The staging copy sent every text to the ZZ sink, not to GoHighLevel. No real
  person got a test text. No test booking was made.
- Made the live workflow from the same build. Only three things differ from staging: live mode, its own table, and
  the real GoHighLevel text step. That text step is a copy of the one the post-call rail already uses for the
  "your setup call is booked" text.
- AI Chauffeur calls booked by phone get all three texts: 24 hours before, 9 AM the day of, 15 minutes before.
- AVA strategy calls get no caller texts from this workflow. GoHighLevel already texts them 24 hours, 1 hour and
  15 minutes before. Ours would be a second text for the same reminder. You still get the ping for AVA calls.
- A text goes only when consent is on record, the number is not on do-not-disturb, and it is between 9 AM and 8 PM
  for the caller. One reminder is never sent twice. Nothing is sent late.
- Read only: I did not change a phone agent, either sales-calendar workflow, or the post-call rail.

ONE DECISION FOR YOU
- Every 5 minutes, day and night, is 8,640 runs a month. The repo's quota tool puts the n8n plan at 10,000 a month.
  With the two hourly timers already running, the audit projects 10,080. Calls and texts come on top of that.
- Going over the plan is what took every workflow down for five days in July.
- Nothing breaks today. It would bite inside a billing month.
- My recommendation: keep the 5-minute check, but only from 6 AM to 7 PM Central. Both calendars only offer call
  times from 1:00 to 5:45 PM Central (read today, next 14 days). So every reminder and every ping falls between
  8:00 AM and 5:30 PM Central. The shorter day is about 4,700 runs a month, and the same audit math lands near
  6,100 of 10,000.
- The catch: if you ever open call times before 7 AM or after 7 PM Central, the timer hours must move with them.
- Say "bound the hours" and I will change the timer and prove the next ticks. I left it as you wrote it until then.

DONE TABLE
| Step | What changed | Verified by | Live |
|---|---|---|---|
| 1 · Read | Nothing. Read the three rails, four GHL calendars and their reminder rules, GHL's workflows, Cal.com, the booking store. | n8n GET /workflows for TLoF7bzuPYy1NAW1, fMwY56uNlJaDzkcd, TkETvvnABhUPd7ME · GHL GET /calendars/{id}/notifications on all four calendars · GHL conversation reads on real past bookings | n/a |
| 2 · Build | New inactive workflow "ZZ STAGING — WF-SETUP-CALL-REMINDERS v1.0" (TRSFeQqDKW4lGhLu), 19 steps, Error Sentry attached. Two new tables: setup_call_reminders (7WTaF9S1GBfk0lQ6) and zz_staging_setup_call_reminders (OfHrHNvgoHdtYW89). | n8n validate_node_config: 15 step configs, all valid · stored staging graph vs the build: ZERO DIFF · logic run on my machine against the real booking first: 4 sends at the 4 expected times, 10 guard checks pass | staging, inactive |
| 3 · Words | The seven lines as pasted. One change, from step 4: the 24-hour text ends "Questions? Call 414-775-0019" (AVA: 414-240-8930). | read back from the ZZ sink, runs 12476, 12477, 12479, 12480 | yes |
| 4 · Reply route | Fallback used. No branch added. | n8n: the one reply workflow (WF-AIC-TEXT-REPLY) has one run on record, Sep 28, and its switch AIC_REPLY_LINE is off · the GHL workflow API is read-only, so a "customer replied" trigger cannot be made from here · GHL user alert settings are not readable by API | yes |
| 5 · Dry run | Six staging runs. Texts went to the ZZ sink only. | 12475 real clock, 72 hours: 2 planned, 2 posted, 2 rows marked sent · 12478 clock set to Mon Oct 5 noon CT: the 24-hour and 9 AM texts planned and posted, the other two read "already sent" · 12481 same clock again: nothing sent · 12482 to 12484 dead address: failed, tried once more, final failure routed to the owner email (email step switched off for the test, so no email went out), then nothing | staging |
| 6 · Publish | New workflow "WF-SETUP-CALL-REMINDERS v1.0" (618G34AR1xQTr3Uf), active. Staging left inactive. | publish_workflow → active version f3b42591-1f5e-45d0-9ae2-4042d80a66b2 · read back: active true, draft = active version, the ACTIVE graph vs the tested build ZERO DIFF on 19 steps, Error Sentry SlnAeMrVRORsF0w7 attached and itself active · the three rails still on the versions read in step 1 (47af9608, 0968c734, c7bd86fd) | YES |
| 7 · First live proof | Slack post in #social, "REMINDERS LIVE — next sends:" (last four digits only). | first timed run 12485 at 11:10:07 AM CT: live mode, 1 booking, plan shows the 15-minute text and your ping at 12:45 PM CT, nothing sent, live table empty · the first real send (12:45 PM CT) had not happened when this was filed | YES, first send pending |
| 8 · Board + report | hq/board.json item setup-call-reminders (live) + one log entry. This report. | board file round-trips byte for byte before the write · commit "board: CC-REMINDERS v1" | YES |

THE DRY-RUN TABLE (step 5)
Real clock, next 72 hours (run 12475, Wed Oct 7 11:03 AM CT). One booking in range.
| Brand | Kind | Send time CT | To | Consent | Message |
|---|---|---|---|---|---|
| AI Chauffeur | 24 hours | none: window passed | …7156 | yes | (not sent) |
| AI Chauffeur | 9 AM | none: window passed | …7156 | yes | (not sent) |
| AI Chauffeur | 15 minutes | Wed Oct 7 · 12:45 PM CT | …7156 | yes | AI Chauffeur — your setup call starts in 15 minutes. We'll call you at this number. |
| AI Chauffeur | Owner ping | Wed Oct 7 · 12:45 PM CT | owner | n/a | CALL IN 15 — AI Chauffeur — [name] · [company] · 1:00 PM CT · [cell] |

Same booking with the clock set to Mon Oct 5, noon CT (run 12478). This is the brief's expected table, and it matches.
| Kind | Send time CT | Caller's time | Message |
|---|---|---|---|
| 24 hours | Tue Oct 6 · 1:00 PM CT | 2:00 PM ET | AI Chauffeur — reminder: your setup call is tomorrow, Wed Oct 7 at 1:00 PM CT (2:00 PM ET). We'll call you at this number. Questions? Call 414-775-0019 |
| 9 AM | Wed Oct 7 · 8:00 AM CT | 9:00 AM ET | AI Chauffeur — your setup call is today at 1:00 PM CT (2:00 PM ET). We'll call you at this number. |
| 15 minutes | Wed Oct 7 · 12:45 PM CT | 1:45 PM ET | AI Chauffeur — your setup call starts in 15 minutes. We'll call you at this number. |
| Owner ping | Wed Oct 7 · 12:45 PM CT | n/a | CALL IN 15 — AI Chauffeur — [name] · [company] · 1:00 PM CT · [cell] |

PUBLISH CHECKPOINT
- GHL native reminders found: calendar reminder rules on all four calendars are in-app notices to you only. No SMS,
  no email. But two GHL workflows text on their own:
  · "AVA Demo Call — Reminder Engine v1" → AVA Demo Call calendar: a text at booking, 24 hours, 1 hour and
    15 minutes before. Read off two real past bookings. So ours are OFF for AVA callers: all three.
  · "AIChauffeur — Booking Response" → AIChauffeur Setup Call calendar: one text at booking, for bookings made on
    the web widget only. No reminder text seen on any past booking. Phone bookings get nothing from GHL (the Tampa
    thread holds only our two texts), so ours are ON.
- AVA real calendar reminded: aCIv7rUnCGrysobt6Mlg, "AVA Demo Call", the /book widget. Owner ping only.
  WF-AVA-SALES-CAL books on "ZZ TEST — AVA Demo Call (v50b gate)", so it is never read.
- Consent rule result for the Tampa booking: YES. The rail's booking text went out Oct 5 at 11:33 AM CT and the
  contact is not on do-not-disturb.
- The four planned sends for the Tampa booking, CT: 24 hours Tue Oct 6 1:00 PM (missed, not live yet) · 9 AM
  Wed Oct 7 8:00 AM, which is 9:00 AM ET (missed, not live yet) · 15 minutes Wed Oct 7 12:45 PM · owner ping
  Wed Oct 7 12:45 PM.
- Reply route: FALLBACK USED. The 24-hour text ends "Questions? Call 414-775-0019" for AI Chauffeur and
  "Questions? Call 414-240-8930" for AVA.

IDS AND ROLLBACK
- Live workflow: 618G34AR1xQTr3Uf · version f3b42591-1f5e-45d0-9ae2-4042d80a66b2 · live 11:07 AM CT Oct 7.
- Rollback, one step: unpublish 618G34AR1xQTr3Uf in n8n. Texts stop at once. The table stays.
- Staging copy: TRSFeQqDKW4lGhLu, inactive. Tables: setup_call_reminders 7WTaF9S1GBfk0lQ6 (live) ·
  zz_staging_setup_call_reminders OfHrHNvgoHdtYW89 · zz_staging_setup_call_reminders_failtest FIOcOu5tcJPcctOH.
- Same text sender as the rails: the n8n Variable OWNER_SMS_FROM (ends 5305), GHL Header Auth. Owner ping goes to
  the contact in OWNER_ALERT_CONTACT_ID. I read that contact today: it exists, it carries the owner-alert tags,
  it is not on do-not-disturb. This workflow never writes a contact.

WHAT'S NEXT
- Your call on the timer hours (above).
- 12:45 PM CT today: the first real send. Check your phone for "CALL IN 15" against the Slack table.
- The AI Chauffeur web widget (below) if you want those calls covered too.

GOTCHAS
- The 15-minute text fires when the call is 8 to 17.5 minutes away, not 8 to 20. With a check every 5 minutes, the
  wider window sent it at 12:40. The brief's own test says 12:45. If one check is missed, the next one still sends.
- Calls booked on the aichauffeur.ai/book widget land on the GHL calendar, not in Cal.com. The brief reads Cal.com
  for AI Chauffeur, so widget bookings get no reminder and no ping from v1.0.
- GoHighLevel's own AVA reminder texts say "AVA Demo Call" and one signs off with your first name. Both break the
  message law. They live in the GHL workflow builder. The API cannot edit them.
- If a GHL contact has no time zone, the zone comes from the area code. Tampa's 813 reads as Eastern.
- A call booked the same morning could get the 9 AM text minutes after its booking text. The brief's rule allows
  it. AI Chauffeur phone bookings are never same-day, so it cannot happen with what is switched on today.
- If a send dies between "claimed" and "marked sent", that reminder is never tried again. I chose a missed text
  over a double text.
- Do not run tools/n8n-quota-hygiene.mjs --fix as it stands. It would move this timer to 30 minutes and break the
  15-minute text.
- The failure email is proven up to the email step. No real failure email has been sent.
- No Notion inbox page for this run: the brief listed the board and this report only.
```
