# 2026-11-04 · OUTREACH CRM v2 · 60 AI Chauffeur prospects logged in GHL

Source: PASTE-CC-OUTREACH-CRM-v2 (2026-11-02), supersedes v1. Logging only. Counts only in this
file: prospect names and emails live in the Dell's `nla-pull` folder and in GHL, never in the repo.

```
===== SHANE READBACK — COPY ALL =====

PLAIN ENGLISH
All 60 AI Chauffeur prospects you emailed Oct 31 to Nov 2 are now contacts in GoHighLevel.
Each has its tags, one note saying when the first email went out and when the follow-up is
due, and a deal in the "AIChauffeur Sales" pipeline at the first stage ("New AIChauffeur
Lead"; there is no "Contacted" stage in that pipeline). None of them was in GHL before, so
all 60 are new records and no existing field was overwritten. Nothing went out: across all 60
contacts there are zero emails, zero texts and zero calls. The only entries on their GHL
timelines are GHL's own "Opportunity created" records. The 7 group A notes also carry the
owner-on-record line and the job-post link from the v1 PASTE you dropped in.

WORKFLOW CHECK (before any write)
GHL's API does not show workflow triggers. The check used the Sep 26 UI reads (RUN C / RUN D)
plus each workflow's last-edit date, read today:
| Workflow | Trigger on record | Edited since that read? | Fires on this run? |
|---|---|---|---|
| 01_AVA_Missed_Call_Text_Back | missed incoming call | no (Aug 7) | no |
| 02_AVA_New_Lead_Internal_Notification | Contact Tag Added = "transportation" | no (Aug 7) | no, tag not used |
| 03_AVA_7_Day_Follow_Up_Drip | Contact Tag Added = "follow-up-drip" | no (Jul 31) | no, tag not used |
| 04_AVA_Onboarding_Checklist_Closed_Won | deal moved to Closed Won (AVA Transportation pipeline) | no (Apr 11) | no |
| AIChauffeur — Booking Response | appointment booked (AIC setup call) | yes, Oct 27 (message edits) | no |
| AVA Demo Call — Reminder Engine v1 | Customer Booked Appointment (AVA Demo Call) | yes, Oct 2 | no |
| LIVE — READY Relay | inbound SMS containing READY | no (Jul 25) | no |
| New Workflow : 1779930425651 | inbound webhook | no (May 30) | no |
Contact Created: none. Contact Changed: none. Contact Tag Added: 02 and 03, and neither tag
is on any of the 60. Checked live: B went first as a canary (13), then a send check, then
C and A.

DONE
| Group | Sent | Created | Updated | Tags ok | Note ok | Opportunity |
|---|---|---|---|---|---|---|
| A · hiring signal | Oct 31 | 7 | 0 | 7/7 | 7/7 (with owner line + job link) | yes, 7 |
| B · NLA owner email | Nov 1 | 13 | 0 | 13/13 | 13/13 | yes, 13 |
| C · NLA owner email | Nov 2 | 40 | 0 | 40/40 | 40/40 | yes, 40 |
| Total | | 60 | 0 | 60/60 | 60/60 | 60 |
Proof: a fresh lookup by email of all 60 finds each exactly once, with tags present, exactly
one run note, company, source and first name matching the CSV, no phone, and one open deal
in AIChauffeur Sales at New AIChauffeur Lead. Send check: 60 contacts, 60 timeline entries,
all TYPE_ACTIVITY_OPPORTUNITY, 0 email / SMS / call messages.
§ 9: the owner record (found by the owner cell) is not among the 60; it still carries
owner-alert, zz-internal and do-not-drip. None of the 60 is a zz-test, zz-internal or
owner-alert contact. No phone number was written.
Board: item OUTREACH-CRM-V2 (live) + log entry "GHL: 60 AI Chauffeur outreach prospects
logged (Oct 31 to Nov 2)", counts only.

IDS / ROLLBACK
GHL pipeline AIChauffeur Sales apGHhZkkKEo4cVObywyo, stage New AIChauffeur Lead 97dcb9bc.
Every contact, note and deal from this run is additive. Rollback is by hand in GHL: filter
contacts on tag outreach-2026-10-31 / outreach-2026-11-01 / outreach-2026-11-02 (7 / 13 / 40).
This run deleted nothing.

NEXT
- Follow-ups due: A Nov 5 to 6, B Nov 6 to 7, C Nov 6 to 9, in the same Gmail thread; stop
  on a no.
- Tuesday's 50 (TUE-50-2026-11-03) go in v3, once Gmail Sent confirms them.

GOTCHAS
- GHL logs an "Opportunity created" entry, marked outbound, in each contact's conversation
  timeline. A send check that counts "outbound" sees 60 and reads as an alarm. Count by
  message type: TYPE_ACTIVITY_* is GHL's own log entry, not a send.
- GHL's contact search on email is case-sensitive (emails are stored lowercase), so this run
  searches with lowercase emails. The duplicate-check route (/contacts/search/duplicate) is not
  case-sensitive.
- The trigger table rests on the Sep 26 UI reads. Two workflows (Booking Response, Reminder
  Engine) were edited after that read. Both are booking-triggered on record, and the live send
  check found zero sends. A UI look at both is still the only direct proof of their trigger.
- One group B prospect is on SUPPRESS-DO-NOT-EMAIL as "delivery delayed, WATCH". It is logged
  with its delivery-delayed tag. It is not a "no".
```
