# RUN 11 — OWNER ALERT FORMAT PASS

**Date:** 2026-08-02
**Surface:** n8n `AVA Post-Call to GHL (Demo Send)` — `6r8YHuMEJbxeDyT5`, webhook `/webhook/ava-postcall`
**Status:** LIVE — verified end to end on execution 5229

---

## THE EMAIL

An HTML call report on the CIRCULANT light shell. 600px single column, table-based,
all-inline CSS, **zero images** — so images-off renders identically to images-on.

Header bar `AVA — CALL REPORT` on ink · outcome pill · label/value rows
(From · Duration · Date/Time CT · Booked · Outcome) · SUMMARY block · TRANSCRIPT as
alternating speaker rows, AVA tinted `#EAF4FA`, caller plain, 14/18px padding ·
Listen to Recording + call-log buttons · Call ID in a small gray footer.

Paper `#F7F8FA`, ink `#14161C`, accent `#0090C8`, Space Grotesk with Arial fallback,
sharp corners, no shadows.

Pill colours carry meaning and nothing else: **BOOKED** `#2EE6A8` ·
**MISSED** `#FF3B4E` · **FOLLOW-UP** and **VOICEMAIL** `#FFB020`.

### Three AA defects caught in self-review — measured, not eyeballed

| # | Defect | Was | Now |
|---|---|---|---|
| 1 | Footer gray on white | `#8A93A6` — **3.09:1**, fails AA | `#5C6573` — 5.89:1 |
| 2 | Label eyebrows + speaker labels | 10–11px, under Appendix A's 12px floor | 12px |
| 3 | Deep Cyan carrying small text | AVA label **3.23:1** on tint; button white-on-cyan **3.61:1** | label `#00688F` 5.57:1; button ink-on-cyan 5.01:1 |

Defect 3 is § 2's warning landing exactly as written: **Deep Cyan `#0090C8` is
LARGE-TEXT / UI-COMPONENT ONLY** and it was carrying two pieces of small text. The
cyan stays as the button *fill* — a UI component, which § 2 permits — and only the
text on it changed, to ink, matching how the outcome pill is already treated.

### Dark mode

The shell first declared `color-scheme: light dark` while supplying only light
colours. In a dark-mode client that invites any un-styled text to be painted **white
on a white surface** — reproduced live in a dark-mode browser during review. It now
declares `light only`, and every text-bearing element carries an explicit colour.

**Final sweep of the delivered HTML** (not the preview): zero contrast failures, zero
sub-12px text, zero horizontal overflow at 390px, zero images.

---

## THE SMS

```
AVA CALL — FOLLOW-UP
+14142408930 · 3m 7s
Booked: no
RUN 11 SYNTHETIC TEST — not a real caller. Verifying the HTML call report and…
Full report emailed.
```

Five lines. Summary capped at 80 characters. BOOKED calls open
`AVA CALL — BOOKED 🔥`. Sent from the published SMS line to the owner line.

---

## THE DEDUPE — THE PREMISE WAS WRONG, AND THAT IS THE FINDING

**There is no duplicate leg in `ava-postcall`.** The owner thread held exactly two
messages, **55 seconds apart, both from the same node** — RUN 10's pre-publish and
post-publish test executions. One call, one SMS, then and now.

The footer is the tell. The 19:58 message carried GHL's
`Reply STOP to unsubscribe` and the 19:59 message, from the identical code path, did
not. **GHL appends opt-out language to the FIRST message on a conversation only**, not
to every send. No send-path switch was warranted, and this run's test message came
through clean — `has STOP/opt-out footer: false`.

*Fragility worth knowing:* if the owner contact is ever rebuilt — it was on 07-31 —
its conversation resets and the next alert carries the footer once.

### Sender identity is not flapping server-side

The GHL location owns **exactly one** number, `+1350-220-5305`, and all five
owner-SMS legs — postcall, intake, receipt, drip, Error Sentry — send from
`$vars.OWNER_SMS_FROM`. The iMessage *"Number changed to Personal"* string is a
device-side contact-card artifact and cannot be fixed from the server. The fix is on
the handset: that number is likely saved on a contact card that also holds a number
labelled *Personal*.

### A real duplicate WAS found — and deliberately left alive

`AVA Booking Receipt` polls every 10 minutes and fires **its own** owner SMS on a new
appointment. So a call that books produces the postcall `BOOKED 🔥` alert **and** a
second Booking Receipt alert within ten minutes.

It was left enabled because it is the **only** owner alert for a booking made on the
web with no call attached — disabling it silently drops that coverage. This is a
decision, not an oversight. One-line fix available on request.

---

## PROOF

| Check | Evidence |
|---|---|
| Webhook | `POST /webhook/ava-postcall` → `200 {"status":"ok"}` |
| Execution | 5229 — `success` |
| **Exactly one SMS** | thread count before **2** → after **3**, delta **1** |
| SMS delivered | `status=delivered`, msg `eT9SUTOZuqhn6y60ktRp`, 5 lines, 152 chars |
| **No opt-out footer** | `has STOP/opt-out footer: false` |
| Email delivered | Gmail `19fc4735be33e7ca`, `emailType=html`, 9,331 bytes |
| Transcript rows | 5, alternating AVA / CALLER |
| Phone render | 390px — no horizontal overflow, 0 contrast failures, 0 sub-12px text |
| Images-off | 0 `<img>` elements in the delivered HTML |
| Published | `versionId === activeVersionId` |
| Error Sentry | still attached — `SlnAeMrVRORsF0w7` |

---

## GOTCHAS

- **The public-API `PUT /workflows/{id}` auto-publishes; the MCP `update_workflow`
  tool does not.** RUN 10 was bitten by the MCP path leaving a draft. This run used
  the REST PUT and landed published, confirmed by `versionId === activeVersionId`.
  `/rest/workflows/{id}/publish` returns 404 — it is not the public route. Always
  assert the two ids match rather than trusting either path.
- **`color-scheme: light dark` on a light-only email is a bug, not a courtesy.** It
  authorises a dark-mode client to paint un-styled text white on your white surface.
- **The em-dash / EMPTY split is deliberate.** Compact metadata cells collapse to `—`;
  content blocks (SUMMARY, TRANSCRIPT, and a missing recording) say
  `EMPTY — NO RESULT` out loud, so a silent block is never read as "nothing happened".
- **`booked` can still be `unknown`** and is reported as-is. The brief says
  `{yes/no}`; collapsing `unknown` to `no` would invent an outcome.
- **The second button reads "Open call log", not "Open in ChatDash".** No ChatDash URL
  exists in the payload and none was supplied, so the button falls back to the
  provider call log the payload already carries. An empty n8n Variable `CHATDASH_URL`
  now exists — set it and the button becomes "Open in ChatDash" with the call id
  appended. A button pointing nowhere would have been worse than an honest one.
- **The BOOKED headline emoji forces UCS-2 encoding**, which drops the SMS segment
  size from 160 to 70 characters. A booked alert will therefore bill as multiple
  segments. That is a cost note, not a defect.
