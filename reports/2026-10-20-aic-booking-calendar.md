# 2026-10-20 — PASTE-CC-BOOKING-CALENDAR v1.2 · AI Chauffeur booking calendar

RUN INCOMPLETE — WHAT: SATURDAY AND SUNDAY STILL SHOW NO TIMES ON AICHAUFFEUR.AI/BOOK/. WEEKDAYS ARE LIVE (11:00 AM TO 7:00 PM CENTRAL, 3 HOURS' NOTICE, 30 DAYS OUT). WHY: THE CALENDAR NOW HOLDS ALL SEVEN DAYS, BUT GOHIGHLEVEL STILL DROPS SAT/SUN FOR THE ASSIGNED USER; THE BLOCK SITS IN A USER-LEVEL SETTING THE API DOES NOT EXPOSE, AND THIS RUN MAY WRITE ONLY THE ONE CALENDAR. NEXT: SHANE RUNS GHL'S "TROUBLESHOOT CALENDAR" ON SAT OCT 24 AND ADDS SATURDAY + SUNDAY TO HIS OWN AVAILABILITY (STEPS IN § 7).

Run: Tue Oct 20 2026, about 8:10–9:10 PM CT, on the Dell. Calendar write approved by Shane in chat ("approve the calendar PUT") after the
auto-mode classifier held it. GoHighLevel write made at about 8:53 PM CT. Every Retell agent, every n8n workflow, Cal.com, every other GHL
calendar, contact and workflow: read only.

## 1 · Diagnosis — calendar UaxV0ENx2cEUYs6qeWZ7 before the change

| Field | Value read (8:20 PM CT) |
|---|---|
| name | AI Chauffeur setup call |
| isActive | true |
| calendarType | personal (eventType RoundRobin_OptimizeForAvailability) |
| teamMembers | 1 — Shane Handel (account admin, the location's only user), primary, priority 0.5 |
| openHours | **none saved** (`{}`) |
| availability overrides | none (`availabilities: []`); no availability schedule attached to this calendar (Shane's one schedule, "Work Hours", Mon–Fri 1–6 PM, is attached to his Personal Calendar only) |
| slotDuration · slotInterval · slotBuffer · preBuffer | 20 min · 20 min · 0 · 0 |
| appointmentPerSlot | 1 |
| allowBookingAfter (minimum notice) | 0 days |
| allowBookingFor (how far out) | **not set** (the key was missing) |
| assigned user's connected / conflict calendar | not exposed by the GHL API. Not the cause: the same user gets 100 open times in the next 7 days on the ZZ TEST calendar and 50 on his Personal Calendar; 0 GHL events and 0 blocked slots in the next 30 days |
| free-slots, next 30 days, America/Chicago | **0** (HTTP 200, body is only a traceId) — with and without userId |
| location timezone | America/Chicago |

**Cause:** the calendar had no open hours saved, so GoHighLevel had no time to offer on any day.

## 2 · Backup

Full calendar JSON taken before the change, outside the repo: `C:\ava-backups\2026-10-20-ghl-calendar-UaxV0ENx2cEUYs6qeWZ7.json`
(54 keys, 2026-10-21T01:23:18Z). Never committed; it is not quoted here.

## 3 · The change (one PUT, this calendar only)

| Setting | Before | After |
|---|---|---|
| name | AI Chauffeur setup call | **Discovery Call** |
| openHours | none | **all seven days, 11:00 AM – 7:20 PM** (last 20-minute call starts 7:00 PM) |
| allowBookingAfter | 0 days | **3 hours** (same day allowed) |
| allowBookingFor | not set | **30 days** |
| isActive · slot 20/20 · buffer 0 · one per slot | as before | sent with the same values |

PUT → HTTP 200. Read-back PASS. Read back unchanged: teamMembers, calendarType, widgetSlug, formId, notifications, formSubmitType,
thank-you message, consent label, guest type, notes, autoConfirm, Google invitation emails. Booking form, confirmation messages and
every workflow tied to the calendar were not touched.

## 4 · Verify

| Check | Result |
|---|---|
| free-slots, next 7 days | **125 times on 5 days** — Wed Oct 21, Thu 22, Fri 23, Mon 26, Tue 27 · first 11:00 AM, last 7:00 PM, every day |
| weekend in the 7 days | **NO** — Sat Oct 24 + Sun Oct 25 queried alone: 0. The widget's own public endpoint agrees |
| free-slots, next 30 days | 525 times on 21 days (weekdays only) |
| widget URL the page uses | `https://api.leadconnectorhq.com/widget/booking/UaxV0ENx2cEUYs6qeWZ7` → **200**. The brief's `link.leadconnectorhq.com` host does not exist in DNS |
| aichauffeur.ai/book/ at 390×844 (Playwright, live) | header **"Discovery Call · 20 min"**; Wed Oct 21 lists 25 times, **11:00 AM → 07:00 PM**; weekend days greyed; no horizontal overflow; 0 console errors |
| screenshots | `audits/aic-booking-calendar/prod-390-widget-calendar.png` · `audits/aic-booking-calendar/prod-390-widget-times.png` |
| text-consent checkbox on the widget form | one checkbox: "I confirm that I want to receive content from this company using any contact information I provide." Unchecked, not required, never says texts → **NEEDS WORDS** (§ 6). Form not changed |
| booking | not attempted: the widget sits behind Cloudflare Turnstile; a real booking needs a person (§ 8, NEXT) |

## 5 · Report only (nothing written)

**(a) Can GoHighLevel block a time from the start of a Google Calendar event until 3 hours after its start? — No.**
A Google event marked busy blocks only its own start-to-end time. GHL buffers apply around GHL's own bookings; no setting stretches an
outside event. Two ways it could be done (not built): make the Google events 3 hours long, or a small n8n job that reads the Google
events and writes a GHL blocked slot from each start to start + 3 hours (the GHL API has `POST /calendars/events/block-slots`).
The phone booking path already applies this rule (below).

**(b) Live transfer and booking on the two phone lines** (read 2026-10-20; agent versions are the ones each number serves):

| | 414-775-0019 · AI Chauffeur v14 | 414-240-8930 · AVA v53 |
|---|---|---|
| Transfer tool | yes — warm transfer to Shane's direct line, with a short briefing agent | yes — `transfer_team`, warm transfer to Shane's direct line, with a short briefing agent and hold audio |
| Tells Shane name, business, reason first | **yes** — "Name … Company … They asked about …" (business = company name only) | **partly** — the brief reads "{name} from {company}, {trade}, {want}", but those are filled only if the `note_caller` step runs; the recorded tests of the live words skipped it, so Shane could hear a blank brief |
| No answer or decline | back to the caller → the earliest open times, same day first | back to the caller → "team tied up right now" → the earliest open times, same day first |
| Booking path + hours | n8n WF-SHANE-SLOTS → a Google Calendar event, copied to GHL calendar UaxV0… | the same workflow, copied to GHL calendar "AVA setup call" (aCIv…) |

Phone hours, read from the WF-SHANE-SLOTS slot code: every day, starts on :00 and :30 Central, **8:00 AM to a last start of 7:00 PM**,
first time at least **2 hours** out, 3 days ahead. Busy = any timed event on Shane's Google calendars, blocking from its start to the
later of start + 3 hours and its end; Google Tasks and declined events never block. The workflow does not read the GHL calendar's open
hours, so today's change does not move phone booking — the phone line and the web page now offer different hours.

What can stop a transfer working the way Shane wants:
- A transfer is tried only when Shane reads free at the start of the call (8 AM–7 PM Central, nothing on his Google calendars, including
  any event that started within the last 3 hours). Otherwise the caller is offered times and Shane is not called.
- Shane must say "connect" or "connect me", or press 1. "Yes" gets one re-prompt, then counts as a decline. Voicemail waits out the 45 s timeout.
- On 0019 the caller is offered a booking *before* the transfer "in case the team isn't available".
- No real transfer has happened since go-live (Oct 15); the briefing reaching Shane is unproven until one live transfer call.
- 0019's `team_alert` and the Capture Desk agent (line …5008) still call the old WF-AIC-SALES-CAL (Cal.com path). Retiring it breaks both.

## 6 · NEEDS WORDS

- **Text-consent line on the booking form.** The widget's only checkbox is GHL's generic line above; it does not mention text messages,
  is not required, and is unchecked by default. Shane supplies the consent words; the form change is a GHL form edit, not this run.

## 7 · Found outside this run (not touched)

1. **Weekend gap (this run's open item).** GHL → Calendars → Calendar Settings → "Discovery Call" → ⋯ → **Troubleshoot Calendar**, pick
   Sat Oct 24, read the code on the empty slots. If it reads USER (outside the user's availability): Settings → My Profile →
   availability / working hours → add Saturday and Sunday, 11:00 AM – 7:20 PM. Re-check /book on a phone.
2. **The AVA setup call calendar (aCIv7rUnCGrysobt6Mlg) has the same empty open hours: 0 times in the next 30 days.** It is the calendar
   embedded on aivoiceagency.ai/book. Same one-PUT fix, in its own run.
3. **Phone vs web hours differ:** phone 8:00 AM start, 2 hours' notice, 3 days out; web 11:00 AM start, 3 hours' notice, 30 days out.
4. **Reminder timer hours:** WF-SETUP-CALL-REMINDERS runs 6:00 AM–6:55 PM CT. A 7:00 PM call's day-before text falls outside it, and the
   workflow has a same-day guard, so a same-day web booking may get no reminder text. Check before relying on reminders.
5. **12 other aichauffeur.ai pages still say "setup call"** (homepage, how-setup-works, integrations, city pages). Words decision for Shane.
6. **34 chauffeur pages carry a stale `aic.css` token** (`?v=affe6ce0`; the file now hashes `c14574df`) after today's words/stamp merges.
   Returning visitors can keep the older stylesheet up to a day. Not from this run.

## 8 · Repo, rollback, DONE

- `chauffeur/book/index.html`: the two iframe titles "AI Chauffeur setup call scheduling calendar" → "… discovery call …" (words only).
  Every other line on the page already said "discovery call" / "Talk to a Human" after today's words run. No asset changed, so no re-stamp.
- `hq/board.json`: item `aic-booking-calendar` + one LOG entry.
- **Rollback.** Calendar: one PUT built from the backup JSON (name, openHours, allowBookingAfter + unit, allowBookingFor), backup at
  `C:\ava-backups\2026-10-20-ghl-calendar-UaxV0ENx2cEUYs6qeWZ7.json` on the Dell. Page: `git revert` this run's commit.

| Item | Result |
|---|---|
| Cause | no open hours saved on the calendar (and no booking window set) |
| Setting changed | name → Discovery Call · openHours none → 7 days 11:00 AM–7:20 PM · notice 0 days → 3 hours · window unset → 30 days |
| free-slots next 7 days | 125 · first 11:00 AM · last 7:00 PM · weekend **no** |
| Widget | 200 (api.leadconnectorhq.com) · header "Discovery Call" |
| Screenshots | audits/aic-booking-calendar/prod-390-widget-calendar.png · …-times.png |
| Backup | C:\ava-backups\2026-10-20-ghl-calendar-UaxV0ENx2cEUYs6qeWZ7.json (outside repo) |
| Step 5 | (a) no, GHL can't; phone path already does it · (b) see § 5 |
| Board | aic-booking-calendar live (weekdays), weekend gap in the label |
| Report | reports/2026-10-20-aic-booking-calendar.md |
