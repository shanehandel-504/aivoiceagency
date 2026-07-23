# OUTAGE RECOVERY — calls that may have fallen through

**Generated:** 2026-07-22 21:55 CDT · **Run:** 1.5 · **Source:** Retell `/v2/list-calls` + GHL lookup

**Window:** 2026-07-17 23:30 CDT → now (the n8n dead zone)


During this window every n8n workflow failed at the trigger, so AVA's call functions
(`book_appointment`, `write_to_crm`, `send_link`, `alert_owner`) could not fire. Any real
conversation in here may have produced **no booking, no CRM row, and no follow-up text**.

**Lines audited:** `+14142408930` AVA SALES (public line) · `+14147750019` AI CHAUFFEUR

---

## THE CALLBACK LIST

| # | When (CDT) | Caller | Line | Dur | Outcome | CRM trace | Priority |
|---|---|---|---|---|---|---|---|
| 1 | 2026-07-18 10:35 CDT | `OWNER TEST LINE` (Shane's cell — redacted) | AVA SALES (public line) | 180s | max_duration_reached | **NONE** | **P0 - OWNER TEST** |

**P1 (real talk, zero CRM record): 0** · **P2 (real talk, no booking): 0** · total calls: 1

---

## DETAIL

### 1 · 2026-07-18 10:35 CDT — `OWNER TEST LINE` (Shane's cell — redacted)

- **Priority:** P0 - OWNER TEST — Shane's own cell — a test call, not a lead
- **Line:** AVA SALES (public line) · **Direction:** inbound · **Duration:** 180s
- **Ended:** max_duration_reached · **Status:** ended
- **Retell call_id:** `call_b357359b5561d083750a7df45c6`
- **Summary:** The agent explained the benefits of their answering service to the user, discussed missed calls and potential lost revenue, and offered a Starter plan. The user expressed interest and scheduled a strategy call for Tuesday at 2 PM. The agent confirmed the user's email address, clarifying the spelling.
- **GHL contact:** **EMPTY — no result** (never made it into the CRM)

---

## HOW TO READ PRIORITY

- **P1** — talked ≥25s with a real transcript and there is **no CRM record at all.** The
  strongest signal of a lost lead. Call these first.
- **P2** — talked, contact exists, but **no opportunity/booking** was created.
- **P3** — talked and the CRM shows a contact and an opportunity. Probably fine; verify.
- **P4/P5** — short or unanswered. Low value.

Priority is computed from call duration, transcript length, and what GHL actually returned —
never guessed. Where an API returned nothing, the row says **EMPTY — no result**.

