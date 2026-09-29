# AI Chauffeur — B4: setup calls book in Cal.com (GHL out of the caller's wait)

**Date:** 2026-09-29 (Central) · **Chain:** `reports/2026-09-28-aic-addendum-2.md` → this.
**Brief:** Shane's B4 run. The phone agent `agent_e41b2e957f1de46cf23dc25a84` (v3) was read only for the whole run: no agent, flow,
tool, timeout or binding change. No new customer-facing words: the spoken slots, the agent's answer fields and every caller text are
unchanged. The one switch used the staging law: inactive staging copy (Error Sentry attached) → pinned replays (sends to the ZZ sink
`hF7cxEn0SuVaEnnL`) → MCP `update_workflow` on the live ID → full-graph hash check (ZERO DIFF) → `publish_workflow` → Error Sentry
asserted. No REST PUT on an active workflow.

**B4 is live.** WF-AIC-SALES-CAL `TLoF7bzuPYy1NAW1` `4cedca1d` → `ce62eb39`, 11:24 AM CT (16:24:23Z). The rail did not need a change.

## What happened, in plain words

- **The Cal.com key is in place.** It was in Doppler's `dev` config only. It is now in `prd` too (same 41 characters, identical),
  and a read-only Cal.com check answered HTTP 200.
- **Cal.com has an "AI Chauffeur Setup Call" event type.** 20 minutes, Monday–Friday 1–6 PM Central (the same hours as the GHL
  calendar), no buffer (same as GHL), a 20-minute grid, at least 1 day's notice. It is hidden from your public Cal.com page.
  Your two Google Calendar connections are already checked for conflicts, so no calendar card is needed.
- **The phone agent now books in Cal.com.** Same two webhooks, same fields, same spoken times. The agent cannot tell the difference.
  A booking now answers in about 1.7 seconds (it was 2–7 seconds with GHL).
- **GHL still gets every booking, after the caller has the answer.** The copy lands on the caller's GHL contact in the AIChauffeur
  Setup Call calendar. If it fails, it retries once; if that fails too, you get an email that says
  "Setup call booked in Cal.com — the GoHighLevel copy didn't go through." plus the time and the caller's name.
- **The GHL copy sends the caller nothing.** GHL's own "your setup call is booked" message (the workflow "AIChauffeur — Booking
  Response") does not fire for the copy. Proven: 23 copies, 0 messages; one test appointment made the old way fired that workflow's
  email in 4.8 seconds.
- **Cal.com emails you, not the caller.** Cal.com needs an attendee email and the phone agent never asks for one, so every booking
  uses an address we own (a sub-address of the owner-alert mailbox). Cal.com emailed you (the organizer) on every test booking and
  every cancellation.
- **The late-book text still works.** When a caller hears "the calendar isn't cooperating" but the booking went through, the rail
  reads the booking back from GHL (the copy) and, with consent and no GHL message, texts the caller — same as before, proven on the
  new path.
- **Worth deciding:** a caller who books on the phone now hears the time but gets no written setup-call confirmation. GHL's text is
  off for the copies (as the brief asked) and our caller text covers the trip only. Card 3 below.

## DONE

| Item | Live | Evidence |
|---|---|---|
| **Step 0** key copied + verified | **YES** | `dev` → `prd` via stdin, value never printed · lengths 41 = 41, identical · Cal.com `GET /v2/me` HTTP 200 under `doppler run` (prd), username returned (private archive) |
| **1** Cal.com event type | **YES** | "AI Chauffeur Setup Call": 20 min · slot grid 20 · notice 1440 min · buffers 0/0 · Mon–Fri 13:00–18:00 America/Chicago (own schedule, = the GHL "Work Hours" schedule) · hidden · guests off · no description (no invented copy) · 2 Google Calendar connections, 4 calendars checked for conflicts |
| **2** same webhooks, same fields, same words | **YES** | `aic-sales/open-slots` + `aic-sales/book-slot` unchanged · local red/green: the same slots through the live GHL code and the new Cal.com code give a word-for-word identical answer, 8/8 · BOOKED answer = live answer on every field but the id · A1 + A7 kept (below) |
| **3** attendee email | **YES** | always an address we own (a sub-address of the owner-alert mailbox, from the n8n Variable); the flow never collects a caller email · Cal.com cannot switch attendee emails off by API for a personal event type → card 1 |
| **4** GHL copy after the answer | **YES** | answer → save → copy (no-notify, skip GHL's slot check) → retry once (after a lookup, so a slow first write is never doubled) → owner email · staging: 23 real copies landed; C1/C2/C3 retry paths pass; owner email byte-exact (captured in the ZZ sink, not sent) |
| **5** no second confirmation | **YES** | calendar notifications: in-app to the assigned user only · GHL workflow "AIChauffeur — Booking Response" (trigger not readable by API) fires on normal bookings: control fired its email in 4.8 s; the 23 no-notify copies fired nothing (48 activity entries, 0 texts, 0 emails) |
| **6** speed gate | **PASS** | 20/20 booked · p50 **1.69 s** · p95 **2.09 s** · max **2.12 s** (see below) |
| **7** B5 + A1/A7 hold | **YES** | B5 on the new path **61/61** (Addendum 2's count) · A1 **5/5** · A7 **2/2** · Addendum 2 rail gate re-run **280/280** |
| Banned-word scan | **0** | new owner email, event type, report, board text |
| Privacy scan (public files) | **CLEAN** | fail-closed: no private number, email, caller word, trip or call id |

## Speed (staging, real Cal.com bookings, one at a time)

End-to-end = the run starting → the agent's answer sent: the same basis as the live GHL numbers. Staging runs start their trigger
~0.1 s later than live ones (test-mode start-up), so these numbers include that and are, if anything, high.

| | p50 | p95 | max |
|---|---|---|---|
| **Cal.com, 20 bookings** | **1.69 s** | **2.09 s** | **2.12 s** |
| the Cal.com create alone | 1.62 s | 2.02 s | 2.06 s |
| last five real GHL books | 3.48 s | 6.62 s | 6.62 s (all: 2.0 / 2.3 / 3.5 / 4.5 / 6.6) |

All 20: 1.87 · 2.08 · 2.09 · 2.12 · 1.50 · 1.61 · 1.50 · 1.77 · 1.48 · 2.07 · 1.76 · 1.69 · 1.87 · 1.68 · 1.44 · 1.80 · 1.43 · 1.61 ·
1.63 · 1.80 s. Outside the 20: the smoke booking before the gate took 3.04 s (the first call, cold); a caller with no known number books
with a Cal Video link, and Cal.com took 4.33 s to make the video room (still inside the agent's 8 s). Open slots: 0.84 s in staging,
1.33 s round trip to the live webhook after the switch (the agent allows 3 s).

**Organizer emails:** Cal.com emailed you for every booking (23/23, the 20 gate bookings included) and every cancellation (23/23). The
two probe bookings made before the gate (to learn Cal.com's answers) also sent a booking and a cancellation email each.

## Versions (before → after)

| Workflow | Before (rollback) | After | Hash check |
|---|---|---|---|
| WF-AIC-SALES-CAL `TLoF7bzuPYy1NAW1` | `4cedca1d-e8f3-491a-9747-7a3568b1e669` | `ce62eb39-3e8a-4da3-8083-dabe06ec4ad5` | draft + active ZERO DIFF · 49 nodes / 51 connections (was 39) |
| Rail `TkETvvnABhUPd7ME` | `abb5d3fe` | unchanged | no node had to change |
| WF-TRY-WEBCALL `9nKn8i2dRuALikuv` · AVA `6r8YHuMEJbxeDyT5` · trip sheet `3PfmC7sxOjUHI0rE` · reply handler `41Xu5hfIfJPn3IF1` · WF-NEWSLETTER `YIhCCJe3Qiz9G6Vq` · AVA book_appointment `c5GPBkma1HyvonEa` | `4514c0c1` · `e0454827` · `484c0a36` · `68c88c1a` · `fe57b793` · `d470c8aa` | unchanged | — |

Also changed: the live `sales_bookings` table gained two columns, `calcom_uid` and `ghl_copy` (the 5 rows are untouched; older
versions ignore them). New in n8n: one Header Auth credential for Cal.com (made from Doppler; the key was never printed). Error Sentry
`SlnAeMrVRORsF0w7` is attached and active (`08d6c82d`). After the switch, live run 11653 (a real open-slots request) went through the
Cal.com node.

## Replay + gate (staging only, every send to the ZZ sink)

| Runs | What | Result |
|---|---|---|
| local | every changed expression from the built graph: slots red/green, A1, A7, the copy paths, owner email words | **46/46** |
| 11521 · 11522–11541 | smoke + the 20-booking speed gate (real Cal.com + real GHL copies on the ZZ test contact) | 20/20 booked, p95 2.09 s |
| 11542 · 11543 | a caller with no number (Cal Video) · a real open-slots read | booked · OK |
| 11546–11550 | A1 (pinned Cal.com answers): booked · timeout + present · 502 + present · timeout + absent · 409 | **5/5**, one create per run 5/5 |
| 11551 · 11552 | A7 (pinned slots): 10:00 AM and 11:30 PM calls on Thu Oct 1 | first offer Fri Oct 2, **2/2** |
| 11553 · 11555 · 11556 | GHL copy fails twice (owner email) · times out but found · one retry lands | 3/3 |
| cases | all of the above, scored from execution data | **34/34** |
| 11557–11606 | Addendum 2 rail gate re-run: same 7 cases, same inputs, unchanged rail | **280/280** |
| 11616 · 11617–11645 | B5 on the new path: a real Cal.com booking + its GHL copy, then N1 GHL message present → held back · N2 real read, no GHL message → text · N3 read fails → no text · N4 no consent → no text | **61/61** (+ § 9, 62/62) |
| control | one GHL appointment the old way (notify on), ZZ contact, then deleted | GHL workflow email fired in 4.8 s |

Cleanup: 23 Cal.com test bookings cancelled (0 left on the event type), 23 GHL copies + the control deleted (0 left in the calendar
list), both probe bookings cancelled. The staging copies are archived and the three staging tables deleted.

## Choices made on the way

1. **Location = the caller's number.** Cal.com needs one location. "Attendee phone" puts the caller's number on your calendar event
   and skips the video room (1.8 s vs 2.3 s in the first probes). A caller with no known number gets Cal Video instead, because
   Cal.com refuses an attendee-phone booking without a number.
2. **The attendee is always an address we own.** The flow never collects a caller email, so no caller can receive a Cal.com email.
3. **The answer goes first.** Cal.com → the agent's answer → the booking row → the GHL copy. The row keeps the Cal.com booking; once the
   copy lands, `appointment_id` holds the GHL copy's id, which is what the rail's late-book check reads. That is why the rail
   needed no change. If the copy never lands, the late-book text holds back and you get the owner email.
4. **The copy skips GHL's own slot check** (Cal.com already decided the slot, and Cal.com's calendar event can look busy to GHL) and
   is made with notifications off (step 5).
5. **A1 in Cal.com:** a create that times out or answers 5xx gets one read of Cal.com 2 s later; it counts only this call's booking
   (tagged with the call id), accepted, within 5 minutes of the slot. Never a second create. A7 stays in n8n.
6. **Error reasons say `cal_http_…`** instead of `ghl_http_…`. The agent reads only the status fields; nothing reads the reason.
7. **Test data:** far-future slots (Nov 16–18), our published line as the caller, every GHL copy fenced to the ZZ test contact.

## Also found (not changed — for Shane)

1. **No written setup-call confirmation for phone bookings now** (card 3).
2. **Cal.com's 1-day notice counts 24 hours**, not calendar days. A caller at 4 PM is offered 4 PM the next day at the earliest, where
   GHL offered 1 PM. The never-same-day rule (A7) still holds.
3. **Cal.com emails the organizer on every booking and cancellation**, and cannot be told not to by API on a personal account. Its
   attendee copy goes to the owner-alert mailbox's sub-address.
4. **The appointment id the agent stores is now the Cal.com booking's id.** The agent never speaks it.

## Cards for Shane

**Card 1 — Cal.com attendee emails (optional).** No caller can get one today (the attendee is always our own address). To stop the
copies landing in the owner-alert mailbox: 1) Cal.com → Workflows → new workflow for "AI Chauffeur Setup Call", trigger "when event is
booked", action "send email to attendee" (Cal.com allows the switch only with such a workflow); 2) Event Types → AI Chauffeur Setup
Call → Advanced → turn on "Disable default confirmation emails for attendees"; 3) Save. Or filter the sub-address in the mailbox.

**Card 2 — organizer emails (optional).** Cal.com will email you for every real setup call and cancellation. A Gmail filter on
"AI Chauffeur Setup Call" can label or skip the inbox for them.

**Card 3 — written confirmation for phone bookings (decide).** Before today, GHL's "Booking Response" workflow sent the caller a
booking message; the copies no longer trigger it. Either approve the words for a setup-call line in our own caller text (a small rail
change), or say so and the copy's notification setting goes back on (one parameter), which brings back exactly GHL's old message.

## Rollback (also in the private archive, `archive/ROLLBACK-BUNDLE-2026-09-25.md` § 14)

- **Sales calendar:** `publish_workflow(TLoF7bzuPYy1NAW1, 4cedca1d-e8f3-491a-9747-7a3568b1e669)` → bookings go back to GHL (and GHL's
  own message comes back). Assert `activeVersionId` and the Error Sentry. Cal.com bookings already made stay in Cal.com; their GHL
  copies stay in GHL.
- The two new table columns, the Cal.com event type, the schedule and the credential are inert without the new version; leave them.
- The Doppler `prd` copy of the key can stay (the `dev` value is unchanged).

## § 9 assertion

Owner-alert row: not written by any staging run (the rail gate's § 9 check, 280/280 and 62/62). Every GHL write in staging went to the
ZZ test contact (a staging-only fence refused any other contact). The live workflow carries the Error Sentry, and the Sentry is active.

```
===== SHANE READBACK — COPY ALL =====

WHAT HAPPENED
The Cal.com key was only in Doppler's dev config; it is in prd now and a
read-only Cal.com check answered 200. Cal.com has an "AI Chauffeur Setup
Call" event: 20 minutes, Mon-Fri 1-6 PM Central like the GHL calendar, no
buffer, 1 day's notice, hidden from your public page. Your two Google
calendars already block busy times. The phone agent now books in Cal.com
through the same webhooks with the same words; a booking answers in about
1.7 s (GHL took 2-7 s). GHL still gets a copy of every booking on the
caller's contact after the caller has the answer; if the copy fails twice
you get an email saying so. The copy sends the caller nothing: GHL's own
"your setup call is booked" message stays quiet (23 copies, 0 messages).
Cal.com emails you, never the caller. The late-book text still works.

DONE
| Item                        | Live | Proof                                   |
| Step 0 key in prd + checked | yes  | 41 = 41 chars, identical; HTTP 200      |
| 1 Cal.com event type        | yes  | 20 min, Mon-Fri 1-6 PM CT, notice 1 day |
| 2 Cal.com behind webhooks   | yes  | same fields + words; red/green 8/8      |
| 3 attendee = our address    | yes  | card 1 for Cal.com's attendee email     |
| 4 GHL copy after answer     | yes  | retry once, owner email; 23/23 copies   |
| 5 no 2nd confirmation       | yes  | 0 messages from 23 copies; control 4.8s |
| 6 speed gate                | pass | 20/20; p50 1.69 / p95 2.09 / max 2.12 s |
| 7 B5 + A1 + A7              | yes  | B5 61/61, A1 5/5, A7 2/2, rail 280/280  |
| Banned words / privacy      | 0    | scans clean                             |

SPEED
Cal.com p50 1.69 s, p95 2.09 s, max 2.12 s (20 of 20 booked).
Last five real GHL books: 2.0 / 2.3 / 3.5 / 4.5 / 6.6 s.
Cal.com emailed you on every test booking (23/23) and every cancellation
(23/23).

VERSIONS + ONE-LINE ROLLBACK
- WF-AIC-SALES-CAL TLoF7bzuPYy1NAW1: 4cedca1d -> ce62eb39 (live 11:24 AM
  CT). Undo: publish 4cedca1d (bookings go back to GHL).
- Rail abb5d3fe, /try 4514c0c1, AVA e0454827, trip sheet 484c0a36, reply
  68c88c1a, newsletter fe57b793, AVA book d470c8aa: unchanged.
- Full detail: private archive, section 14.

WHAT'S NEXT
1. Card 3: decide the written confirmation for phone bookings (approve a
   line for our text, or turn GHL's message back on for the copies).
2. Cards 1-2 (optional): Cal.com attendee copies and organizer emails.
3. Still open from before: T12 (the agent's 8 s booking limit, slow
   talkers) and the two GHL screen settings.

GOTCHAS
- Phone bookers now hear the time but get no written setup-call message.
- Cal.com's 1-day notice is 24 hours: a 4 PM caller is offered 4 PM the
  next day at the earliest (GHL offered 1 PM).
- A caller with no known number books with a Cal Video link; Cal.com took
  4.3 s for that one (still inside the agent's 8 s).
- The agent's stored appointment id is now the Cal.com booking id.
```
