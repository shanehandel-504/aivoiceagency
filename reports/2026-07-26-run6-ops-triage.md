# RUN INCOMPLETE — RUN 6 OPS TRIAGE

**Date:** 2026-07-26 · **Surfaces:** n8n (`circulant.app.n8n.cloud`) + GHL (`sdShCZCaxce8DHKbYcIl`)

**WHAT:** Blocks A, B and the diagnosis half of C2 are done and verified live. Blocks C
(owner alert legs), D (verdict application), E (error sentry), F (GHL publishes + contact
hygiene) and the one-call proof are **not** done.

**WHY:** Blocks C and E both need one thing — a trustworthy "owner" SMS target. Tonight's
forensics found that target is currently a corrupted, colliding record (see THE BLOCKER).
Wiring owner alerting and an error sentry onto that contact would bake the bug in rather
than fix it, and both are exactly the kind of always-on alerting you cannot half-ship.

**NEXT:** Answer the one question in THE BLOCKER, then C → E → F → the proof call. Every
input those blocks need is already gathered and recorded below.

---

## WHAT SHIPPED, IN PLAIN ENGLISH

Two things were actually wrong, and only one of them was the thing the brief expected.

The 70.8% failure rate turned out **not** to be broken workflows. Every one of those
failures says "Execution limit reached" — it was the n8n quota running out between Jul 18
and Jul 23. It stopped on its own when the quota reset, and both workflows have run clean
ever since. Deactivating them, as the brief allowed for, would have switched off a healthy
drip engine for no reason.

What *was* real: those two workflows were burning quota twice as fast as they needed to.
They now run hourly instead of every 30 minutes, which halves the drain that caused the
outage in the first place.

And a third thing nobody was looking for: a customer record in the CRM had a corrupted
name, and the record it corrupted is the one the system texts you on.

---

## BLOCK A — FAILURE FORENSICS ✅

| Workflow | Fails 14d | Last fail | Root cause |
|---|---|---|---|
| AVA Drip Engine v1 | **708** | 2026-07-23 02:30 | `Execution limit reached` — quota outage |
| AVA Booking Receipt | **708** | 2026-07-23 02:30 | `Execution limit reached` — quota outage |
| AVA Post-Call to GHL | 4 | 2026-07-24 14:31 | `GHL Upsert Contact` 400 — the known empty-`custom_analysis_data` trap |
| LIVE INTAKE v1 | 4 | 2026-07-23 02:58 | `Grok Extract` — "invalid syntax" |

**1,416 of 1,424 failures are one cause: the account-wide quota outage** (2026-07-18 →
2026-07-23 02:30). Confirmed by opening the latest failed execution of each top offender —
both return the n8n plan-limit HTML error, not a node error.

**Neither top offender was deactivated, and that is the correct call.** The brief's rule was
"a workflow failing unread 100×/day is pure quota burn" — but these stopped failing three
days ago and have succeeded continuously since (last success 2026-07-26 03:30, minutes before
this snapshot). They are healthy. The fix for the *cause* is Block B.

Error-per-day timeline (proves the cliff):

    07-18  233   07-19  288   07-20  288   07-21  288   07-22  288
    07-23   38   07-24    1   07-25    0   07-26    0

Residual real defects, both left in place and logged rather than rushed:
- **Post-Call 400s** — already mitigated by the `Has Identifier` gate added 2026-07-24; the 4
  failures predate/straddle that fix and there have been successes since.
- **LIVE INTAKE `Grok Extract` "invalid syntax"** — a genuine Code-node fault, 4 occurrences,
  last seen during the outage window. Not fixed tonight (see NEXT).

## BLOCK B — QUOTA TAME ✅

Retimed via the repo's own `tools/n8n-quota-hygiene.mjs`, extended this run with
`--target=<minutes>`.

| | Before | After |
|---|---|---|
| AVA Drip Engine v1 | every 30 min | **hourly, on the hour** |
| AVA Booking Receipt | every 30 min | **hourly, on the hour** |
| **Projected monthly (schedule triggers)** | **2,880 / 10,000** | **1,440 / 10,000** |
| Headroom | 71.2% | **85.6% — PASS** |

Verified live: both rules now read
`{"field":"hours","hoursInterval":1,"triggerAtMinute":0}` and both workflows remain `active`.
Re-running the audit is a clean no-op (idempotent).

**Why `field:hours` and not `minutesInterval:60`:** a 60-minute interval fires 60 minutes
after activation and drifts off the hour permanently. `triggerAtMinute:0` is what "hourly on
the hour" actually means. The tool now encodes that distinction.

**Booking Receipt webhook conversion: NOT done.** It polls GHL calendar events and has no
webhook trigger. Converting it means creating a GHL-side workflow to POST on appointment
creation — a new build, which this run was told not to do outside the sentry.

## BLOCK C2 — CALENDAR TRUTH (diagnosis ✅ / fixes partial)

**Items 1 and 2 required no change — the required state was already true.**

| Check | Required | Actual | |
|---|---|---|---|
| Calendar | AVA Demo Call | `aCIv7rUnCGrysobt6Mlg` — AVA Demo Call | ✅ |
| Assigned user | Shane Handel | `riVdJngF0dT6xbEmvvFg` — Shane Handel | ✅ |
| Appointment | — | `i4JZucAQDg70ozdTrdgp`, 2026-07-28 14:00 −05:00, `confirmed` | ✅ |

The n8n `GHL Create Appointment` node **already hard-pins both**:
`"calendarId": "aCIv7rUnCGrysobt6Mlg"` and `"assignedUserId": "riVdJngF0dT6xbEmvvFg"`.
That is why the RUN 5 booking rendered correctly. Nothing to fix.

> Note: the rider quoted the calendar id as `aCIv7rUnCGrysobt6MIg` (capital i). The live id is
> `aCIv7rUnCGrysobt6Mlg` (lowercase L). Visually identical, different string — the API value
> is authoritative and is what is pinned.

**Item 4 — non-ASCII name: FIXED ✅.** The contact stored `firstName "Robert"` /
`lastName "� Owner"` — a literal replacement character in a CRM record. Source traced:
`AVA Post-Call to GHL → Build GHL Body` wrote `first_name` unsanitised, and GHL splits the
string on the first space. (`book_appointment` was *not* the source — its `Normalize` node
already regex-sanitises names.) A `cleanName()` helper now strips U+FFFD, en/em dashes,
middot, pipes and any non-printable-ASCII before the upsert. Proven:

    'Robert � Owner' -> 'Robert Owner'
    'Robert — Owner'      -> 'Robert Owner'
    '  '                  -> 'Unknown Caller'

Workflow re-fetched after the PUT: helper present, `firstName` line rewritten, still `active`.

**Item 3 — AIChauffeur split: confirmed intact.** Its calendar
(`UaxV0ENx2cEUYs6qeWZ7`) is separate and was not touched. Its booking flow's assigned-user
setting was **not** verified — that check is outstanding.

**Item 5 — failed booking SMS: NOT REPRODUCIBLE via API.** Every outbound SMS on that
contact around 21:57 CDT returns `status: delivered`. No `failed`/`undelivered` message is
exposed on the conversation. The failure is visible in the GHL UI but not in the messages
API response, so the reason could not be pulled. Needs the message id from the UI.

## THE BLOCKER — why C and E stopped

`AVA Booking Receipt → Owner Alert SMS` sends to a **hardcoded** contact:

    { type: 'SMS', contactId: '8zyowOdgNehLoYLpmVBm', fromNumber: '+13502205305', ... }

That is the **same contact id** the RUN 5 test booking upserted into and attached its
appointment to. As of now that single record holds:

- `firstName: "Robert"`, `lastName: "� Owner"`
- `email: scottrose762@gmail.com` (the test lead's address)
- `tags: ["ava demo call", "booked"]`
- a conversation containing **both** owner alerts (`✅ BOOKED: Andy…`, `🔥 NEW LEAD: …`)
  **and** caller-facing demo messages (`✅ You're set, Robert…`)

**The owner's alert record and a demo lead record are the same row.** Every booking that
upserts by phone/email can overwrite the address the system alerts you on. Two consequences:
owner alerts can be redirected by a lead, and lead-facing copy can be sent to the owner.

Blocks C and E both require an owner SMS target. Wiring either onto this record would make
the collision permanent and harder to unpick. **The question for you: should owner alerting
use a dedicated, never-upserted GHL contact (recommended), or a different mechanism
entirely?** Once that is answered both blocks are short.

Also relevant: the historical alert `"✅ BOOKED: Andy · … · ⚠️ phone looks invalid - capture
bug"` shows a phone-capture defect was already instrumented — consistent with RUN 5's finding
that `book_appointment` passes our own line as the lead's `cell`.

## BLOCK D — THE MAP ✅ (produced) / verdicts NOT applied

Full inventory: `reports/2026-07-26-ops-map.md` — 28 n8n workflows (13 active) and 8 GHL
workflows, each with trigger, purpose, last success, 14-day fails and a verdict.

The brief expected 14 n8n workflows; there are **28**. The extra 14 are inactive duplicates
(9) and `ZZZ` credential-probe litter (4) plus one starter template. All already inactive, so
they cost no quota.

**Verdicts were computed but deliberately not applied.** The two active zombie candidates
(`100X - Lead Response Loop`, `AVA Layer 1 — Money Path Spine`) have zero executions ever, but
both are **webhook-triggered** — zero executions means "nothing has called it yet", not
"nothing can". Disabling a live webhook without a reference sweep across the repo, Retell tool
URLs and GHL is how you break a money path silently. That sweep was not completed.

## BLOCKS C, E, F — NOT DONE

- **C (owner legs):** blocked on THE BLOCKER. Groundwork done: `Send SMS` is the only disabled
  node (Notion stays off, `Send Email` already enabled), and both existing legs target the
  **caller's** `contactId` — so they are demo sends, not owner alerts. Repointing them without
  a decision would silently stop lead follow-up.
- **E (error sentry):** blocked on the same target question. This is the highest-value
  outstanding item — it is the reason a five-day outage went unnoticed.
- **F (GHL fixes):** not started. Both drafts confirmed present and identified:
  `03_AVA_7_Day_Follow_Up_Drip` (`8590663f-…`) and `AIChauffeur — Booking Response`
  (`6fd1fb71-…`). Contact hygiene not performed.

## VERIFY CALL — NOT RUN

Not printed as an instruction, because asking for a live proof call while owner SMS and email
alerting are still unwired would prove only the GHL leg — the half that already works.

---

## WHAT CHANGED LIVE TONIGHT

| Change | Surface | State |
|---|---|---|
| Drip Engine v1 → hourly on the hour | n8n | live, verified |
| Booking Receipt → hourly on the hour | n8n | live, verified |
| `cleanName()` name sanitiser | n8n `AVA Post-Call to GHL` | live, verified |
| `--target=` + on-the-hour support | `tools/n8n-quota-hygiene.mjs` | committed |

Nothing was deactivated. Nothing was deleted. No GHL record was modified.

## ROLLBACK

- Schedules: re-run the tool with `--fix --target=30`, or set both rules back to
  `{"field":"minutes","minutesInterval":30}`.
- Name sanitiser: remove the `cleanName` helper and restore
  `firstName: (((s.first_name == null ? '' : s.first_name) + '').trim()) || 'Unknown Caller'`.

## NEXT, IN ORDER

1. **Decide the owner alert target** (dedicated GHL contact recommended). Unblocks C and E.
2. **Repair contact `8zyowOdgNehLoYLpmVBm`** — it is currently both the owner alert row and a
   demo lead. Split them.
3. **Fix the `cell` argument** in `book_appointment` (RUN 5 finding — writes our own number as
   the lead's cell).
4. **Build the sentry (E)** — highest leverage; nothing else stops the next silent outage.
5. **F**: publish the two GHL drafts after the mechanical fixes; contact hygiene.
6. **Reference-sweep the two active zombies**, then disable if clean.
7. **LIVE INTAKE `Grok Extract`** "invalid syntax" — 4 real failures.
8. Then the one-call proof.
