# BOOKING RAIL FIX v1 · Oct 31 2026

```
===== SHANE READBACK — COPY ALL =====
BOOKING RAIL FIX v1 · AI Chauffeur booking rails + privacy pages · Sat Oct 31 2026 · COMPLETE

WHAT HAPPENED (plain English)
Your Oct 31 test booking now comes out clean. One booking makes ONE calendar event: GHL writes it and
syncs it to Google, and the event carries the name, company, number, call id and "Booked on the phone by
AI Chauffeur". Everything says "Discovery Call" now: the email, the owner text, the calendar title and
the caller's confirmation. The owner email is rebuilt: black, one thin border, BOOKED in green, the five
rows, a "Call {first name}" button and "Trip sheet + recording". The dead "Text the booking link" button
is gone. A call that did not book prints the booking link as one line. The retired "one call or a
thousand" footer is gone. The trip page lists two add-ons: more than 50 languages and flight tracking.
"We'll call you at ." was not a bug: the test went to the ZZ contact, which has no phone. A test contact
with a phone fills it in. Both privacy pages now carry the two A2P sentences, and the resubmission
report is written. Test runs sent no texts or emails.

DONE
| Item | What shipped | Where | Live proof | Rollback |
|------|--------------|-------|------------|----------|
| D1 one event | Google insert removed; GHL appointment is the booking + carries the details | WF-SHANE-SLOTS xB0ifGzDozl2NwBz v198bd938 | draft run #18354: exactly one Google event, synced from GHL, details in it; AVA calendar probe proved GHL syncs AVA too | publish 37590140 |
| D2 blank number | no change (template reads the contact's phone; the ZZ contact has none) | GHL calendar UaxV0 unchanged | run #18355 with the GV test contact: "We'll call you at (•••) •••-6506" | n/a |
| D3 text button | removed; not booked prints "Booking link to send: https://aichauffeur.ai/book/" | DEMO POST-CALL RAIL TkETvvnABhUPd7ME vef0e7d46 | probe runs #18357 + #18358: 0 sms: links | publish 3d53d0ec |
| D4 Discovery Call | email subject + body, owner text first line, event title, caller text, link text | SHANE-SLOTS v198bd938 + RAIL vef0e7d46 | #18354: "BOOKED · Discovery Call · Shane Handle, Maxim Limo · Tue, Nov 3 · 8:00 AM CT" / "BOOKED - AI Chauffeur Discovery Call, Tuesday, November 3 at 8 AM Central. …" / event "AI Chauffeur Discovery Call — Maxim Limo" | publish 37590140 / 3d53d0ec |
| D5 footer | retired line out; "Right after the call, your dispatcher has the trip sheet, the recording and the transcript." + "Hear it take a call: 414-775-0019 · aichauffeur.ai" | RAIL vef0e7d46 | probe html: line absent, footer present | publish 3d53d0ec |
| Email look | black card, one thin border, Signal mark, green only on BOOKED | RAIL vef0e7d46 | rendered 390 + 600 px: no overflow, smallest 12px, contrast 8.03+ | publish 3d53d0ec |
| D6 add-ons | exactly "More than 50 languages" + "Flight tracking" | WF-TRIP-SHEET 3PfmC7sxOjUHI0rE v3e5e8345 | live aichauffeur.ai/trip/AIC-5BF1A150-9511: 2 add-ons, no reminder texts, no talk button | publish 2b0bbab6 |
| Privacy AVA | the two sentences + date Oct 31 | af0796b -> dpl_5Rvq3XtnqqPZkMDUN2nXPmoVvq1n | live 200, both sentences; IndexNow 200 | git revert af0796b, push |
| Privacy AIC | second sentence + date Oct 31 | aichauffeur 6f62f5b -> dpl_DxCL3WLsVXLHucASu7Sfnw958veG | live 200, both sentences | git revert 6f62f5b, push |
| A2P report | brand, campaign words, opt-in per number, samples, STOP/HELP, URLs | reports/2026-10-31-a2p-resubmission.md | in repo | n/a |

CHECKS RUN
- Every changed n8n node: draft hash = built code, then served hash = draft after publish; all three active,
  Error Sentry attached and active. Contact and owner-alert nodes unchanged (§ 9 holds; owner record untouched).
- Tests: 2 probe appointments + 2 draft booking runs on GHL, all deleted after, Google cleared; owner texts,
  owner emails and the booking-row insert pinned (nothing sent, no row written); 2 probe workflows deleted.
- Privacy pages rendered at 390 + desktop: no overflow, new text 4.92:1 (AVA) and 12.16:1 (AIC).

NEXT
- Resubmit in Retell from reports/2026-10-31-a2p-resubmission.md: Edit + Save. Do not click "Next"
  (it attaches the $20-a-month SMS add-on).
- Before resubmitting: the GHL booking checkbox on both calendars says only "I confirm that I want to receive
  content from this company…" — no texts, frequency, rates, STOP or HELP. Needs your words.
- The AVA line (8930 + pool) never asks the caller's OK to text. That is an agent run (prompt lock).
- The agents still say "setup call" / "set up a call with the team" (prompt lock: reported, not changed).

GOTCHAS
- One AI Chauffeur booking still sends you 3 emails and 3 texts (WF-SHANE-SLOTS, the setup alert, the trip
  ticket). The WF-SHANE-SLOTS email and the setup email now share one subject, so Gmail threads them.
- AI Chauffeur booking confirmations still go out from the 350 line, not the AI Chauffeur texting line, which is
  against the Oct 27 ruling. Not changed this run.
- If GHL cannot create the appointment, the agent now hears FAILED and says the team will text the link (before,
  the Google insert kept the booking alive). Booking reply time goes from about 1 s to 2–3 s (8 s limit).
- The booking row keeps its "gcal:" prefix because the reminders workflow finds phone bookings by it; the id
  after it is now the GHL appointment id.
- Still carrying old words: the caller copy email footer ("one call or a thousand"), "Setup call request" and
  "SETUP CALLBACK" inside the trip-ticket builder (no longer used for the owner email), and WF-AIC-SALES-CAL
  (a legacy path the v17 agent does not use).
- The owner record carries "test" + "aichauffeur-calendar-booked" tags and company "ZZ Test"; § 9 allows
  owner-alert, zz-internal and do-not-drip only. Older than this run; not touched.
- The public trip page transcript spells the caller's phone number out in words.
- Trip page vs FACT-SHEET v3.3 (v3.5 is not on disk; put it in the PASTE folder): "Talk to AI" is still the label
  (v3.3 says "Call the demo"); the included list leaves out the live transfer and office alerts; the transcript
  shows the agent saying "Confirmed".
- The AVA "booked" email you picked on Sep 17 was not found in mail or the repo; the email was built to the
  PASTE's description.
- aichauffeur.ai/privacy/ section 3 still describes a consent-box web form that is no longer on the site.
- aichauffeur.ai/privacy/ was not IndexNow-pinged by hand; the n8n deploy hook sends changed lastmods.
```
