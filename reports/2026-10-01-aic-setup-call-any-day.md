# 2026-10-01 — AI CHAUFFEUR TEST AGENT · SETUP CALL ANY DAY + SMOOTH SAME-DAY LINE (paste 19 v1.0)

```
===== SHANE READBACK — COPY ALL =====
MISSION: AI Chauffeur test agent, setup call any day + smooth same-day line. Paste 19 v1.0, Oct 1 2026.
STATUS: COMPLETE. Every step in the paste is live. The live 414-775-0019 agent was read and never written.
LIVE: AIC-TEST-2 v7 on the test number ending 8976 · board https://aivoiceagency.ai/hq/board.json
SHARED RAIL: the setup-call calendar now takes Saturday and Sunday. Live callers are offered weekend times too.
OPEN ON YOUR SIDE: the 8 live calls, and the words (2 new Grok items below, plus the 5 from this morning).

WHAT I DID, IN PLAIN ENGLISH
1. Pasted Grok's two texts on the test agent, byte for byte. Text A replaced the setup-call section of the
   questions part. Text B replaced the same-day line. Nothing else in either place was touched. I checked
   both two ways: against the paste, and by reading them back from the published version.
2. Changed two entries of the facts sheet: the setup call ("any day of the week … never the same day") and
   the callback window ("8 AM to 6 PM Central, seven days a week"). Retell cannot edit a facts entry in
   place and nothing may be deleted, so the changed sheet is a new knowledge base, v1.1, on the new version.
   The old one is untouched.
3. Opened Saturday and Sunday on the setup-call calendar in Cal.com, 1 PM to 6 PM Central, the hours the
   weekdays already had. Nothing else on the event changed. The live line books through the same calendar.
4. Looked for a weekday-only filter in the booking path. There is none: the weekday-only times came from
   the calendar itself. So the booking workflow did not change. Never-the-same-day is still enforced.
5. Changed the callback code so Saturday and Sunday count as business days. The six holidays are still
   skipped and the words of the lines did not change.
6. Published the test agent as v7. The test number ending 8976 answers it.
7. Ran the simulations on the published build: the four new ones and the regression cases f, i, o and q.
   10 of 11 pass by my checks. Retell's own judge passed all 11. The one miss is wording, so it goes to Grok.
8. Placed one real web call. It was offered Friday and Saturday, asked for today, heard "Nothing's open
   today", booked the Saturday time through the live rail, and I cancelled the booking.
9. Re-read live. Nothing on the live agent or its flow moved.

DONE
| Item | Result | Proof |
|---|---|---|
| d2 section replaced | "## THE SETUP CALL" is FINAL TEXT A, byte for byte · 1,141 -> 1,178 characters (the node 13,685 -> 13,722) | read back from the published v7 · the rest of the node is identical to v6 |
| n08_sameday replaced | FINAL TEXT B, byte for byte · 102 -> 86 characters | read back from v7 · spoken word for word on a real call |
| KB entries changed (2) | THE SETUP CALL · the callback window in REACHING THE TEAM · loaded as a new knowledge base, AIC-FACTS-v1.1 (knowledge_base_fdb70f2225bf5b63), on v7 | all 10 entries read back equal to the file · v1 (knowledge_base_93ced71a2c1504c8) untouched |
| Cal.com schedule, old -> new | "AI Chauffeur Setup Call hours", Central time · old: Monday to Friday, 1 PM to 6 PM · new: Monday to Sunday, 1 PM to 6 PM | changed Oct 1, 10:55 AM Central · the event is untouched: 20 minutes, 60-minute notice, no buffers, the same 7 questions · Sat Oct 3 and Sun Oct 4 now show 15 open times each |
| Booking-path filter, old -> new | old: none · new: none. The booking workflow has no weekday filter and did not change (still serving a0a29858) · never-same-day kept in both of its guards | live open-times answer before: Fri Oct 2 and Mon Oct 5 · after: Fri Oct 2 and Sat Oct 3 |
| Callback-window code, old -> new | old: a business day is Monday to Friday, minus 6 holidays · new: every day, minus the same 6 holidays | old and new run side by side on 21 clock times · Saturday 10 AM: "Monday morning" -> "within a couple of hours" · Sunday 2 PM: "tomorrow morning" -> "within a couple of hours" · every other output identical |
| Version published | AIC-TEST-2 v7 · Oct 1, 11:03 AM Central | versions 0 to 7 all published, none deleted · v7 differs from v6 in exactly 4 nodes |
| Test number answers it | yes | the number ending 8976 follows the newest published version, which is v7 |
| Simulation s1 (asks for today) | FAIL on one strict check · Retell: pass | heard the fixed line "Nothing's open today. The next open times are Friday October second at one PM Central and Saturday October third at one PM Central", never a time today, booked only after the calendar answered · the miss: the questions part's own first reply said "The setup call can't be booked for today" (Grok item 1) |
| Simulation s2 (Friday caller) | pass | offered Saturday Oct 3 and Sunday Oct 4 at 1 PM · booked the Saturday |
| Simulation s3 (Saturday caller) | pass | offered Sunday Oct 4 and Monday Oct 5 at 1 PM · booked the Sunday |
| Simulation s4 (Sunday afternoon, team missed) | pass | "They'll call you back within a couple of hours, and they have your details." · on v6 the same case said "tomorrow morning" |
| Regression f, i, o, q | all pass: f-book-setup-call, f2-booking-fails, i-door-switch, o-big-fleet, q1, q2, q3 | test_batch_7663a973a4f5 · whole run 10/11 by my checks, 11/11 by Retell's judge |
| Live 0019 byte-identical | yes | agent v4 and flow v4 match the Sep 30 read field by field · the snapshot file rebuilt from today's read is the same 23,890 bytes |
| Shared-rail note | live callers who book a setup call are now offered weekend times, because the Cal.com schedule is shared | read from the live open-times webhook: a Thursday caller is offered Friday and Saturday |
| Commits and deploy | 9c16d15 pushed to main and deployed · this report is the commit after it | live board equals the commit byte for byte (69 items, 123 log lines) · /ops and /reports return 404 |
| Grok items | 2 new, listed below | no word outside text A and text B was written |
| Rollback | listed below | nothing was deleted |

GROK ITEMS (node · what the line has to do)
1. Node d2, setup-call section, a caller who asks for today. In 3 of 3 simulated runs on v7 it said "The
   setup call can't be booked for today", then offered the next open times. The line has to say that
   nothing is open today, in those words, with no "can't", and then offer the next open times. Text A
   gives the instruction but not the words. The fixed line that follows was exact every time.
2. Node d2, a caller whose first words are "I'd like to book the setup call." It should say the one short
   line and hand over to the booking step. It did that in 2 of 9 runs on v7 and in 4 of 7 on v6. In the
   other runs it ran the team interview first (name, company, number, topic) and then the connect offer.
   The call still got booked in 9 of those 10 runs; in the other one my test caller had no answer ready
   for the topic question and hung up (the script is fixed). The rule has to send a booking request
   straight to the booking step, even when it is the caller's first words.
The five items from this morning's report still stand. Case o passed on the published run and missed on
the draft run today, so the no-contract sentence is still drifting.

IDS, COMMITS, ROLLBACK
- Test agent agent_9ebb41c9bd8af214649328f107: v7 is new, v6 is still there.
  Undo: pin the test number to v6, or publish a new version copied from v6.
- Knowledge bases: v1.1 knowledge_base_fdb70f2225bf5b63 (new, read by v7) · v1 knowledge_base_93ced71a2c1504c8
  (unchanged, read by v5 and v6). Nothing to undo.
- Cal.com schedule "AI Chauffeur Setup Call hours". Undo: switch Saturday and Sunday off, back to Monday to
  Friday, 1 PM to 6 PM Central. That also takes the weekend times away from live callers.
- Booking workflow WF-AIC-SALES-CAL: not changed. Serving a0a29858, Error Sentry attached.
- Repo: commit 9c16d15 (build doc, facts sheet, board). Undo: git revert 9c16d15.
- Simulations: test_batch_7663a973a4f5 (published v7) · the same four new cases on v6, before the change:
  test_batch_0ff82a2a39ec (s1 and s4 fail there, as they should) · draft run test_batch_f339aacde333 ·
  opener test test_batch_e89792d8650e (v6) and test_batch_62417e03266a (v7) · facts check test_batch_dfe733eb383e.
- Real call: call_56d2b40a4687c02196cd4648c56 (v7) · live runs 11983 (open times) and 11984 (booking) ·
  booking id 6McNg… (masked), cancelled · its GHL copy deleted.
- Live desk: nothing to undo.

WHAT'S NEXT
1. Your 8 live calls on the test number ending 8976. On call f, ask for today once to hear the new line.
2. Send the two new Grok items to Grok with the five from this morning.
3. Tell me if the calendar should be closed on the six holidays (gotcha 3).
4. Then the promote paste for 0019. Not part of this run.

GOTCHAS
1. Your calendar is open on weekends now, on live too. Saturday and Sunday, 1 PM to 6 PM Central, 20-minute
   calls. A Friday-night caller can book Saturday at 1 PM. The live line still says its own words; it
   offers the same times.
2. Weekend callbacks are now promised on the test agent. On Saturday and Sunday between 8 AM and 6 PM it
   says the team calls back "within a couple of hours". Before 8 AM it says "this morning".
3. Holidays are not closed in the calendar. The callback promise skips the six holidays, but the calendar
   has no closed dates, so a Thanksgiving or Christmas afternoon can be booked. That was already true for
   holidays that fall on a weekday.
4. The facts sheet is in Retell twice now: v1, which v5 and v6 read, and v1.1, which v7 reads. That is what
   keeps v6 a true rollback.
5. Simulations fake the calendar. In s2 and s3 the two times the agent offered are what the live
   workflow's own picking code returned when I ran it against the real calendar with the clock set to
   Friday and to Saturday. With the real clock that code gave the same answer as the live webhook. The real
   call covers the rest: real times, a real Saturday booking, a real copy in GHL.
6. One real booking was made and cancelled. Expect up to four messages in your inbox: Cal.com's booking and
   cancellation, and the calendar invite and its cancellation from the GHL copy. One more test row stays
   in the live booking table (two now). Each is keyed to its own call and cannot touch another call.
7. Battery case k3 is out of date. On v7 a Friday 8:30 PM caller hears "tomorrow morning", not "Monday
   morning". On your live calls k2 and k3, after 6 PM expect "tomorrow morning".
8. The build doc changed in more places than the four you named. Sections 4.2, 6, 8.3 and 10 as ordered,
   plus the facts that had gone stale: the version and knowledge-base rows in 1, the two silence nudges
   in 7, the allow-list and calendar note in 8.1, and the rollback steps in 12.
9. Another session pushed a board line at 10:54 AM (commit de1d382, "as-built check, read-only") while
   this run was working. No conflict. The board's 123 log lines include it.
10. Seen once in s4 and not from this change: the agent said "You can talk to the team live right now"
   where its rule says it can try to connect. One for Grok.
11. The board still carries a GHL calendar id in five older log lines. It was not one of this morning's
   four scrub categories. Say the word and it goes.
12. The booking id is masked here on purpose. A Cal.com booking id opens that booking's public page, and
   this repo is public. The full ids are in the session's private working folder, not in any commit.
```
