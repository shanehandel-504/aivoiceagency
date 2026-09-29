# AI Chauffeur — B4 follow-up: next-day slots + written confirmation for phone bookings

**Date:** 2026-09-29 (Central) · **Chain:** `reports/2026-09-29-aic-b4-calcom.md` → this.
**Brief:** Shane's B4 follow-up (C1 + C2). The phone agent `agent_e41b2e957f1de46cf23dc25a84` stayed read-only: still v3, last
changed 2026-09-28 13:56Z, before this run. No new customer-facing words: the confirmation text is the approved B5 line, byte-exact,
with only `{the slot}` filled by code. A refused same-day booking gets the existing FAILED answer, so the agent says nothing new. Both
switches followed the staging law: inactive staging copy with Error Sentry → pinned replays, every send to the ZZ sink `hF7cxEn0SuVaEnnL`
→ MCP `update_workflow` on the live ID → full-graph hash check (ZERO DIFF) → `publish_workflow` → Error Sentry asserted. No REST
PUT on an active workflow. The Cal.com notice changed last, after both workflows were live.

**C1 and C2 are live.** WF-AIC-SALES-CAL `ce62eb39` → `d66218e1` at 1:23 PM CT (18:23:49Z). Rail `abb5d3fe` → `c7bd86fd` at
1:25 PM CT (18:25:48Z). Cal.com minimum notice went from 1 day to 60 minutes at about 1:27 PM CT.

## What happened, in plain words

- **Callers are offered the next day's first open time.** Cal.com's notice was a rolling 24 hours, so a 4 PM caller was first offered
  4 PM the next day. It is now 60 minutes, so that caller is offered the next weekday's first open time (1 PM), as GHL did.
- **Same-day calls still can't be booked, in two places.** The slot step removes every time on the caller's own date before
  anything is offered (A7, unchanged). The booking step now refuses a same-day time too. It sends the agent the existing "didn't go
  through" answer, so the agent says nothing new.
- **Live check after the change.** One real open-slots request at 1:28 PM CT offered Wed Sep 30 first and Thu Oct 1 second. Cal.com
  returned 10 times for later today (60 minutes' notice now allows them), and all 10 were removed before anything was offered.
- **Every phone booking now gets a text.** After a call where the calendar workflow saved a BOOKED row, the caller gets the
  approved line: `AI Chauffeur — your setup call is booked: {Tue, Sep 29 · 1:00 PM CT}. Questions? Call 414-775-0019`. This applies
  whether or not the agent heard a failure.
- **The text goes out only after four checks:**
  1. The booking is read back from Cal.com: this booking's id, the setup-call event type, accepted, made on this call, and the same
     time as the saved slot.
  2. The caller gave text consent.
  3. GHL has not already sent its own confirmation after the booking time.
  4. No text has gone out yet for this call or for this booking.

  Once it is sent, the booking row is stamped (`caller_texted_at`), and a stamped booking never gets a second text. Your setup
  alert then reads "Booked — caller texted".
- **Bookings made before B4 get no text.** Those rows have no Cal.com id, so they can't be checked in Cal.com, and the rail holds
  back. No live caller is affected: the rail already handled those calls when they ended.

## DONE

| Item | Live | Evidence |
|---|---|---|
| **C1** next-day slots | **YES** | Cal.com minimum notice 1440 → 60 min (read back as 60; 17 other event-type fields unchanged) · A7 unchanged and re-proven with a Cal.com answer that holds same-day times · new book_slot guard "Same Day?" refuses a same-day start with the existing FAILED answer (reason `same_day_slot`, nothing reaches Cal.com) · **live read (1:28 PM CT): offered slot 1 Wed Sep 30 · slot 2 Thu Oct 1** (an answer offers two) · **first three eligible slots in that live Cal.com answer: Wed Sep 30 · Wed Sep 30 · Wed Sep 30** · never today |
| **C2** written confirmation | **YES** | every BOOKED row with a Cal.com id → verified in Cal.com → consent → GHL-confirmation check → one text, byte-exact approved line · booking-level dedupe on `caller_texted_at` · alert status "Booked — caller texted" |
| C1 / A7 / A1 cases | **29/29** | A7 with same-day times in the answer · T4 + T5 · book_slot same-day refusal ×2 · A1 5/5 (one create per run) |
| C2 cases | **18/18** | verified + consent + no failure heard → one text · consent false → none · verify fails → none · same booking replayed twice → one text · GHL confirmation present → none · never a text without the verify |
| B5 re-run | **61/61** | on the new rail, the booking verified in Cal.com |
| Addendum 2 rail gate re-run | **280/280** | same inputs; node-path changes counted below |
| Local red/green | **35/35** | the old rail sends nothing for a heard-BOOKED call; the new rail sends one text |
| Banned-word scan | **0** | the caller text and owner alerts as sent in staging, the event type, report, board text, commit message |
| Privacy scan (public files) | **CLEAN** | fail-closed; its self-test caught 8/8 planted values |

## Versions (before → after)

| Workflow | Before (rollback) | After | Hash check |
|---|---|---|---|
| WF-AIC-SALES-CAL `TLoF7bzuPYy1NAW1` | `ce62eb39-3e8a-4da3-8083-dabe06ec4ad5` | `d66218e1-e7a1-4f20-819b-e3060f931867` | draft + active ZERO DIFF · 50 nodes / 53 connections (49 / 51 before) |
| Rail `TkETvvnABhUPd7ME` | `abb5d3fe-741a-42b2-b7cb-1e1e6586e1f3` | `c7bd86fd-f70f-4eb6-b49a-a17fc40541f5` | draft + active ZERO DIFF · 86 nodes / 120 connections (85 nodes before) |
| WF-TRY-WEBCALL `9nKn8i2dRuALikuv` · AVA `6r8YHuMEJbxeDyT5` · trip sheet `3PfmC7sxOjUHI0rE` · reply handler `41Xu5hfIfJPn3IF1` · WF-NEWSLETTER `YIhCCJe3Qiz9G6Vq` · AVA book_appointment `c5GPBkma1HyvonEa` | `4514c0c1` · `e0454827` · `484c0a36` · `68c88c1a` · `fe57b793` · `d470c8aa` | unchanged (re-read after the switch) | — |

The staging copies (`HASMAq956CPLDcHg`, `KKinym6AIQIUAeUF`) match the live versions node for node. Every node this run changed is
identical; every other difference is a named staging stand-in (webhook paths, the ZZ-sink sends, the staging tables and the
staging-only contact fence). The live `sales_bookings` table gained one column, `caller_texted_at` (date); older versions ignore it.
Error Sentry `SlnAeMrVRORsF0w7` is attached to both changed workflows and to all six unchanged ones, and every draft equals its
published version.

## Replay + gate (staging only, every send to the ZZ sink)

| Runs | What | Result |
|---|---|---|
| 11656 | A7: a Cal.com answer holding three times later today, plus tomorrow and the day after | today removed; first offer Wed Sep 30 |
| 11657 · 11658 | A7: 10:00 AM and 11:30 PM calls on Thu Oct 1 | first offer Fri Oct 2, 1 PM |
| 11659 · 11660 | book_slot with a same-day time · a call that started before midnight booking the new day | both refused (existing FAILED answer); no Cal.com call, no row |
| 11661–11665 | A1 (pinned Cal.com answers): booked · timeout + present · 502 + present · timeout + absent · 409 | 5/5, one create per run |
| 11666 · 11667 | two real far-future bookings (Thu Nov 19) + their GHL copies on the ZZ test contact, used below | booked |
| 11668 · 11680 · 11686 | Addendum 2 cases on the new rail | 280/280 with the rows below |
| 11693 · 11719 · 11702 · 11711 | B5 on the new rail: GHL confirmation present · real reads → text · Cal.com read fails · no consent | 61/61; one text (11719) |
| 11755 · 11729 · 11737 · 11746 | C2 (agent heard BOOKED): real reads → text · no consent · Cal.com read fails · GHL confirmation present | 18/18 with the next row; one text (11755) |
| 11765 · 11766 | the 11755 booking replayed: call flags kept · call flags wiped | no text either time (early stop · booking already stamped) |
| 11775 · 11784 · 11793 | GHL-era rows (no Cal.com id): GHL confirmation present · none · no consent | no reads, no text |

Across these 16 rail runs there were two confirmation texts (11719 and 11755), and both came after a verified Cal.com read.

## Node-path changes vs the B4 runs (same inputs)

| Case | B4 run → now | Nodes run | What changed |
|---|---|---|---|
| 7e4f: no booking row → link text | 11606 → 11668 | 57 → 57 | the renamed IF only (Late Book? → Confirm Due?) |
| 8da: no setup call asked | 11566 → 11680 | 34 → 34 | none |
| p1: booked on the old rail | 11572 → 11686 | 45 → 45 | none |
| N1: heard failure, BOOKED, GHL confirmation present | 11617 → 11693 | 63 → 63 | Verify Cal Booking replaces Verify Late Appointment |
| N2: heard failure, BOOKED, real reads → text | 11626 → 11719 | 65 → 66 | the same swap + Mark Caller Texted |
| N3: heard failure, BOOKED, read fails | 11636 → 11702 | 58 → 58 | the same swap |
| N4: heard failure, BOOKED, no consent | 11645 → 11711 | 42 → 42 | none |
| old R1: GHL-era row, GHL confirmation present | 11557 → 11775 | 63 → 50 | no Cal.com id → the 13 contact / read / decide nodes no longer run |
| old R2: GHL-era row, no GHL confirmation | 11579 → 11784 | 65 → 50 | as R1, plus the text it sent in B4 no longer goes (Late Book SMS, Flag setup_text) |
| old R4: GHL-era row, no consent | 11598 → 11793 | 42 → 42 | none |

Old R3 (GHL read fails) was not re-run. Its only distinguishing pin targeted the removed GHL read, so its input is now old R1's.

## Choices made on the way

1. **The same-day guard sits before Prior Booking.** A same-day time goes to Block Reason, the answer the agent already knows for a
   blocked booking, so nothing new is spoken. "Today" follows A7's rule: the day the call started, or today if that is later. A
   call that started at 11:50 PM can't book the new day's times either.
2. **The check moved from GHL to Cal.com.** Since B4, Cal.com holds the booking and GHL holds only a copy. The rail reads the
   booking by its id and requires all of: the setup-call event type, accepted, this call's id in the booking's metadata, and a
   start within 5 minutes of the saved slot. Anything else means no text.
3. **Two dedupe layers.** The call's existing `setup_text` flag stops a repeat run of the same call. The booking's new
   `caller_texted_at` stamp stops a second text for the same booking even if the call flags are wiped.
4. **The B5 GHL-confirmation check stays.** Our text holds back if GHL already confirmed. The GHL copies are made with
   notifications off, so normally our text goes out.
5. **GHL-era rows fail closed.** They can't be verified in Cal.com, so they never get the text.

## Also found (not changed — for Shane)

1. **GHL copies send a Google Calendar invitation email.** Gmail shows every GHL copy, and every deletion of one, sending the
   contact an "Invitation: …" or "Canceled event: …" email from your Google Workspace calendar account. This run sent 2 of each to
   the ZZ test contact's address, and B4's test copies sent about 48. B4 said "the copy sends the caller nothing", which held for
   GHL's own messages but not for this invitation. It reaches a caller only if their GHL contact already has an email address. The
   phone flow never collects one, so new callers get none. See card 4.
2. **Cal.com's 60-minute notice would allow same-day times on its own.** The two n8n guards (A7 in Pick Slots and Same Day? in
   book_slot) keep them out; the live read showed 10 same-day times returned and none offered. Removing both guards would bring
   same-day offers back.
3. **Cal.com emailed you (the organizer)** for the 2 test bookings and their 2 cancellations.
4. **A booked call's rail run can take up to 45 s longer.** The confirmation waits until 45 s after the booking before reading the
   GHL conversation. This is inherited from B5 and is usually about 1 s, because the rail starts after the call ends.

## Cards for Shane

**Card 3 (B4): written confirmation for phone bookings.** Done here (C2, your decision 18 A).

**Card 1: Cal.com attendee emails (optional, unchanged).** No caller can get one; the attendee is always our own address.

**Card 2: organizer emails (optional, unchanged).** A Gmail filter on "AI Chauffeur Setup Call" can label them or keep them out
of the inbox.

**Card 4: Google Calendar invitations from GHL copies (decide, optional).** A caller whose GHL contact has an email address gets
a calendar invitation for the setup call from your Workspace calendar, alongside our text. Keep it (it is a real invitation), or
turn off attendee invitations in the GHL calendar's Google Calendar connection. That is a screen setting, not readable by API, and
I did not touch it.

## Rollback (also in the private archive, `archive/ROLLBACK-BUNDLE-2026-09-25.md` § 15)

1. **Cal.com minimum notice back to 1 day:** PATCH the event type's `minimumBookingNotice` to 1440 (Doppler key; the event type's
   ids are in the archive). Do this first.
2. **Sales calendar:** `publish_workflow(TLoF7bzuPYy1NAW1, ce62eb39-3e8a-4da3-8083-dabe06ec4ad5)` removes the book_slot same-day
   guard. A7 in Pick Slots stays either way.
3. **Rail:** `publish_workflow(TkETvvnABhUPd7ME, abb5d3fe-741a-42b2-b7cb-1e1e6586e1f3)` brings back B5 exactly (heard-failure
   bookings only, verified through the GHL copy).
4. Assert `activeVersionId` and the Error Sentry after each publish. The `caller_texted_at` column does nothing without
   `c7bd86fd`, so leave it.

## Cleanup

The 2 staging Cal.com bookings are cancelled (0 upcoming on the event type) and their 2 GHL copies deleted (0 left in the calendar
list). Both staging copies are archived, and the three staging tables are deleted (HTTP 204 ×3).

## § 9 assertion

No staging run wrote the owner-alert row (the rail gate's § 9 check, inside 280/280). Every staging text went to the ZZ sink, and
every GHL copy was fenced to the ZZ test contact. Both changed workflows carry the Error Sentry, and the Sentry is active.

```
===== SHANE READBACK — COPY ALL =====

WHAT HAPPENED
Callers are now offered the next weekday's first open time instead of
"24 hours from now": Cal.com's notice went from 1 day to 60 minutes. A 4
PM caller is now offered 1 PM tomorrow, as GHL did. Same-day calls still
can't be booked: the slot step removes today's times, and the booking step
now refuses a same-day time too, using the answer the agent already knows.
After the change, one real open-slots request offered Wed Sep 30 and Thu
Oct 1. Cal.com returned 10 times for later today, and none were offered.
Every phone booking now gets your approved text, byte-exact (the braces
are filled with the booked time):
AI Chauffeur — your setup call is booked: {Tue, Sep 29 · 1:00 PM CT}. Questions? Call 414-775-0019
It goes out
only after the booking is read back from Cal.com, with text consent, when
GHL hasn't already confirmed. It goes out once per booking, never twice.
Your alert then reads "Booked — caller texted".

DONE
| Item                      | Live | Proof                                  |
| C1 next-day slots         | yes  | notice 60 min; offers Wed 9/30, Thu 10/1 |
| C1 same-day refusal       | yes  | 2/2 refused; A7 same-day-in-answer ok  |
| C2 text on every booking  | yes  | C2 18/18; one text per booking         |
| B5 re-run                 | yes  | 61/61                                  |
| A1                        | yes  | 5/5                                    |
| Rail gate re-run          | yes  | 280/280; path changes counted          |
| Banned words / privacy    | 0    | scans clean (self-test 8/8)            |
First three offered dates: Wed Sep 30, Thu Oct 1 (two per answer); first
three eligible in the live answer: Wed Sep 30 x3. Never today.

VERSIONS + ONE-LINE ROLLBACK
- Cal.com notice 1 day -> 60 min. Undo: set it back to 1 day (1440).
- WF-AIC-SALES-CAL TLoF7bzuPYy1NAW1: ce62eb39 -> d66218e1 (1:23 PM CT).
  Undo: publish ce62eb39.
- Rail TkETvvnABhUPd7ME: abb5d3fe -> c7bd86fd (1:25 PM CT).
  Undo: publish abb5d3fe.
- /try 4514c0c1, AVA e0454827, trip sheet 484c0a36, reply 68c88c1a,
  newsletter fe57b793, AVA book d470c8aa: unchanged. Phone agent v3
  untouched.
- Full detail: private archive, section 15.

WHAT'S NEXT
1. Card 4 (decide): GHL copies send a Google Calendar invitation to
   callers whose contact has an email address. Keep it, or turn off
   attendee invites in the GHL calendar's Google connection.
2. Cards 1-2 (optional): Cal.com attendee copies and organizer emails.
3. Still open: T12 (the agent's 8 s booking limit) and the two GHL screen
   settings.

GOTCHAS
- B4 said the GHL copy sends the caller nothing. GHL's own messages stay
  off, but the copy does send a Google Calendar invitation (and a
  cancellation) to the contact's email, if the contact has one.
- Cal.com's 60 minutes would allow same-day times on its own. The two n8n
  guards keep them out; removing both brings same-day offers back.
- Bookings saved before B4 (no Cal.com id) never get the text.
- A booked call's rail run can take up to 45 s longer (it waits before
  reading the GHL conversation).
```
