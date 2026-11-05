# 2026-11-05 · OUTREACH CRM v3 · 102 AI Chauffeur prospects logged in GHL + 5 outcomes

Source: PASTE-CC-OUTREACH-CRM-v3 (2026-11-05), follows v2 (5b0f453). Logging only. Counts only in
this file: prospect names, emails and contact ids live in the Dell's `nla-pull` folder and in GHL,
never in the repo.

```
===== SHANE READBACK — COPY ALL =====

PLAIN ENGLISH
All 102 AI Chauffeur prospects you emailed Nov 3 and Nov 4 are now in GoHighLevel. Each has its
tags and one note saying what went out and when the follow-up is due. 99 are new contacts
(Nov 3: 50, Nov 4: 49). The 3 warm re-approach prospects were already in GHL from July,
August and September, but not under the email you used, so a plain email lookup missed them.
Their records were found by name, company and an older note. The new tags and note went onto
those records, and nothing was overwritten (one record had no email, so the email was added).
Their existing deals were left where they were, at Setup Call Booked. New deals sit in
"AIChauffeur Sales" at "New AIChauffeur Lead". The two hard bounces got no deal, as told.
The 5 outcomes are applied: the one "No thanks" (deal moved to "Lost / Not Fit"), the two hard
bounces, the group B address that failed for good, and the Nov 4 demo booking that wasn't a
real operator. Each now has its tag, one note and email Do Not Disturb (texts are blocked too
on the demo booking). Nothing went out: zero emails, texts or calls on any of them.

WORKFLOW CHECK (before any write)
Same 8 workflows as v2, same versions, none edited since Nov 4 (newest edit Oct 27):
| Workflow | Version | Last edit | Trigger on record | Fires on this run? |
|---|---|---|---|---|
| 01_AVA_Missed_Call_Text_Back | v10 | Aug 7 | missed incoming call | no |
| 02_AVA_New_Lead_Internal_Notification | v7 | Aug 7 | Contact Tag Added = "transportation" | no, tag not used |
| 03_AVA_7_Day_Follow_Up_Drip | v13 | Jul 31 | Contact Tag Added = "follow-up-drip" | no, tag not used |
| 04_AVA_Onboarding_Checklist_Closed_Won | v3 | Apr 11 | deal to Closed Won (AVA Transportation) | no |
| AIChauffeur — Booking Response | v20 | Oct 27 | appointment booked (AIC setup call) | no |
| AVA Demo Call — Reminder Engine v1 | v9 | Oct 2 | Customer Booked Appointment (AVA Demo Call) | no |
| LIVE — READY Relay | v5 | Jul 25 | inbound SMS containing READY | no |
| New Workflow : 1779930425651 | v10 | May 30 | inbound webhook | no |
No Contact Created, Contact Changed or Contact DND trigger on record. The two Contact Tag Added
tags match none of this run's 13 tags. The only deal trigger (04) watches Closed Won in the AVA
Transportation pipeline, and this run moved one deal inside AIChauffeur Sales only. Order: D as the canary (50), 90 s wait, send check
(50 entries, all TYPE_ACTIVITY_OPPORTUNITY, 0 sends), then R, E, outcomes.

DONE
| Group | Created | Updated | Tags ok | Notes ok | Opportunities | Outcomes applied | Workflow check | Send check (email / SMS / call) |
|---|---|---|---|---|---|---|---|---|
| D · Nov 3 NLA owner (v17.2) | 50 | 0 | 50/50 | 50/50 | 49 at New AIChauffeur Lead + 1 at Lost / Not Fit | 1 replied-no | pass | 0 / 0 / 0 |
| R · Nov 3 E2 re-approach | 0 | 3 | 3/3 | 3/3 | 3 existing, left at Setup Call Booked | none | pass | 0 / 0 / 0 since run start |
| E · Nov 4 NLA owner (28 v17.2 + booking line, 21 v18) | 49 | 0 | 49/49 | 49/49 (28 + 21 by wording) | 47 at New AIChauffeur Lead; 2 bounced-hard: none | 2 bounced-hard | pass | 0 / 0 / 0 |
| Outside the 102 (v2 group B + Nov 4 recon) | 0 | 2 | 2/2 | 2/2 | B deal left at New AIChauffeur Lead (not asked); recon had none | bounced-server, aic-recon | pass | 0 / 0 / 0 since run start |
| Total | 99 | 5 | 104/104 | 104/104 | 97 new (1 since moved to Lost / Not Fit) + 3 existing | 5 | pass | 0 |
Board commit: the commit that carries this report (item OUTREACH-CRM-V3 + one log entry).

Proof (fresh read-back, second full pass): 102/102 resolve to 102 distinct records (99 by email;
R by matched record, one of the three now also by email). Tags 102/102. Company, source and first
name match the CSV on all 99 new. No phone on any of the 99. Run note exactly once on 102/102,
and exactly one new note today on every contact with no outcome (two on the 3 in-run outcome
rows: run note + outcome note). Outcome contacts, read by id: tag present 5/5, outcome note exactly
once 5/5, email DND active 5/5 (SMS too on the recon), global DND flag off 5/5, delivery-delayed
kept on the group B contact. Send check by message type: D 52 entries (51 opportunity + 1 contact
activity), E 49 (47 + 2), R 0 since run start, outside 2 contact activity since run start. Every
entry is TYPE_ACTIVITY_*: GHL's own records of the deals, the Lost move and the DND changes.
0 email / SMS / call messages.
§ 9: owner record (found by the owner cell) untouched, still owner-alert / zz-internal /
do-not-drip. No zz-test, zz-internal or owner-alert contact touched. No phone written.

IDS / ROLLBACK
GHL pipeline AIChauffeur Sales apGHhZkkKEo4cVObywyo (re-fetched today): New AIChauffeur Lead
97dcb9bc, Lost / Not Fit 0ec4892f, Setup Call Booked 080da65d.
Everything is additive. Rollback is by hand in GHL: filter contacts on tag outreach-2026-11-03
(53: 50 D + 3 R) / outreach-2026-11-04 (49). Outcome tags: replied-no 1, bounced-hard 2,
bounced-server 1, aic-recon 1. DND is undone per contact (Email channel; Email + SMS on the
recon). The Lost move is one stage change back to New AIChauffeur Lead. This run deleted nothing.

NEXT
- Follow-ups in the same Gmail thread, stop on a no: D Nov 7 to 10 (49, not the no), R Nov 10 (3),
  E Nov 9 to 11 (47, not the 2 bounces). From v2: A Nov 5 to 6, B Nov 6 to 7 (12, not the failed
  one), C Nov 6 to 9.
- Your call: the group B contact that failed for good still has an open deal at New AIChauffeur
  Lead (the PASTE did not ask to move it). Say the word and it goes to Lost / Not Fit.

GOTCHAS
- The 3 group R prospects were NOT findable by the emailed address: GHL holds them under an older
  primary email (two of them) or none (one, now filled). A lookup by email alone would have made
  3 duplicates. Two of the three still answer only by record id. The next CRM run must match
  those two by id, not by email.
- "Lost / Not Fit" is a stage. The deal's GHL status stays "open" because the PASTE asked for the
  stage. If GHL's won/lost reports should count it, setting status to lost is a one-field change.
- The first read-back pass missed 2 of the 21 v18 rows by email search about 5 minutes after
  they were created. A fresh lookup found both, and a second full pass read 102/102. GHL's
  contact search can lag or hiccup. Re-run the read-back before calling a miss a missing contact.
- The deal moves and DND changes add TYPE_ACTIVITY_OPPORTUNITY / TYPE_ACTIVITY_CONTACT entries to
  the timeline, some marked outbound. They are GHL's own log entries, not sends. Count by type.
- The Nov 4 recon contact has no email on record. Email DND was set as told, and the SMS DND is
  the one that stops anything.
- The trigger table still rests on the Sep 26 UI reads plus today's last-edit dates (unchanged
  since v2).

LESSON: "upsert by email" is not enough for warm prospects. Anyone who called or booked before
lives under whatever email (or none) they gave then, so check name + company before you create.
```
