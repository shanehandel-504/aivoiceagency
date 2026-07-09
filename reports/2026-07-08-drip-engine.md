# DRIP ENGINE v1 — Build Report (2026-07-08)

**RUN INCOMPLETE** — both core n8n workflows are BUILT, VALIDATED, and logic-verified, but left **INACTIVE + TEST_MODE=true**. Go-live is gated on 3 owner decisions (below) + one external blocker (Twilio). Nothing has been published; no messages have been sent.

---

## DONE

| Item | Status | Where |
|---|---|---|
| **AVA Drip Engine v1** (7-day, 16 sends D0–D7) | Built, inactive, TEST_MODE | n8n `Pu661B1J1ZgezJT7` |
| **AVA Booking Receipt** (10-min poll, idempotent) | Built, inactive | n8n `NMSWFtcyEQhSypSx` |
| All 16 verbatim messages authored (Build Steps node) | Verified (16 items, all SMS carry STOP opt-out, all emails carry "AVA is an AI assistant" footer, D3 $75,000–$126,000 stat block present, em-dashes intact, no forbidden words, AVA never "she/her") | local harness |
| Receipt copy (SMS + email) | Verified — contains **NO booking link** (rule honored), footer present, ✅ + appointment-time format correct | local harness |
| GHL credential bound (`GHL Header Auth` `wOmBNtlzVgn2fVAc`) to all GHL nodes; Gmail bound for owner alert | Done | both workflows |
| Existing workflows reused as node templates (send_link, post-call, book_appointment, Money Path Spine) | Done | recon |

### What the Drip Engine does
- **Intake:** `POST https://circulant.app.n8n.cloud/webhook/ava-drip-enroll` (body: `contact_id, first_name, phone, email, timezone`) **+** a 10-min fallback poller that finds `demo-no-book` contacts without `drip-active` and self-enrolls them.
- **On enroll:** GET contact → skip if `booked / drip-active / drip-complete / dnd / opt-out`; GET appointments → skip if a future appointment already exists; else respond `enrolled`, add `drip-active`, and walk the 16-step schedule.
- **Before every send:** GET contact and EXIT (add `drip-complete`, remove `drip-active`) if `booked / dnd / opt-out`.
- **Sends:** SMS from **350-220-5305** and email via the GHL Conversations API. Send window clamps to **8:00 AM–8:00 PM** contact timezone (default America/Chicago). `TEST_MODE=true` makes every wait 60s.
- **End:** add `drip-complete`, remove `drip-active`.

### What the Booking Receipt does
- Polls the AVA Strategy Call calendar (`aCIv7rUnCGrysobt6Mlg`) every 10 min. For a drip-tagged contact (`demo-no-book` / `ava demo call` / `drip-active`) with a new appointment and **no** `booked` tag: adds `booked`, removes `demo-no-book`, sends **receipt SMS + receipt email (no booking link)**, and an **owner alert email** to shanehandel@gmail.com. Idempotent via the `booked` tag (re-runs are no-ops). Owner **SMS** node is built but **DISABLED** (see Decision 2).

---

## DECISIONS NEEDED (block the live test / go-live)

1. **Test cell — the OWNER_CELL conflict.** Doppler `OWNER_CELL_OHONE` is a **+1-480** number — which the mission says to **NEVER enroll (internal identity)**. The test step ("enroll a test contact using OWNER_CELL") therefore contradicts itself. **Give me a safe test mobile that can receive SMS and is NOT the 480**, or explicitly OK texting the 480 once. Until then I will not fire a real SMS.
2. **Owner-alert SMS mechanism.** GHL can only SMS a *contact*. To text "BOOKED: {name} {time}" to you, I need either (a) the owner as a GHL contact id / number I can use, or (b) your OK to keep owner alerts **email-only** (already working). The owner-SMS node exists but is DISABLED.
3. **CAN-SPAM footer.** Every email footer carries a `[BUSINESS_ADDRESS]` placeholder + a generic opt-out line. Give me the real physical mailing address and confirm GHL appends a working unsubscribe link, before activation.

## EXTERNAL BLOCKER

- **Channel intake 3(a) — inbound SMS to 414-240-8930 → Twilio → n8n:** NOT built. There are **no Twilio credentials in Doppler**, and I could not verify that 414-240-8930 (a Retell voice number) can receive SMS or routes via Twilio. The n8n receiver half is deferred until you confirm SMS capability + provide Twilio access. Section 3(b) (tag `source-786-ads`) is deferred too — memory says the *demo* agent's post-call webhook points at api.chat-dash.com, not the n8n `ava-postcall` flow, so I need to confirm which webhook 786-937-1218's calls actually hit before adding the tag.

## ONE-ENGINE LAW (report-only)

Pause the legacy **"AVA 7-Day Drip" (GHL)** workflow in the GHL UI. Per prior findings it is published but has **no working auto-trigger** (appointment/tag do not enroll), so double-drip risk is currently low — but it must be paused so nobody wires its trigger later and double-sends. **n8n is now the single drip engine.**

---

## GO-LIVE RUNBOOK (once decisions land)

1. Provide a safe **test cell** (Decision 1).
2. Keep `Config.TEST_MODE = true`. Create/pick a GHL test contact (test cell + owner email), then `POST /ava-drip-enroll {contact_id, first_name, phone, email}`. Within ~2 min: **D0 SMS + D0 email** arrive. Create a test appointment for that contact → drip guard exits and (with Receipt active) the receipt fires **with no booking link**.
3. Set `Config.TEST_MODE = false`. **Publish** both workflows.
4. **Backlog guard (important):** the moment the Drip Engine is published, the 10-min poller will enroll **every existing `demo-no-book` contact** without `drip-active`. Before publishing, either scope the poller to recent contacts or clear/relabel the backlog, or you'll blast D0 to old leads at once.
5. Chain the ava-call flow (Money Path Spine `u3FaLLiH0loGf1BN`) to fail-safe `POST /ava-drip-enroll` on new leads (deferred edit), and add `source-786-ads` tagging once the 786 webhook path is confirmed.
6. Delete the test contact. **Never enroll the +1-480.**

## GOTCHAS (for next time)

- **The n8n Workflow SDK builder is a restricted static parser:** no `for` loops, no arrow functions, no `.join()` at the SDK level. Runtime loops/HTML must live inside Code-node strings; large copy was injected via `update_workflow` (plain JSON), not SDK code.
- `newCredential('name')` in create-from-code does **not** auto-bind — GHL nodes needed explicit `setNodeCredential` with id `wOmBNtlzVgn2fVAc`. Gmail auto-bound.
- **Unverified against live GHL** (standard endpoints, but not yet exercised on this location): `GET /contacts/{id}`, `POST`/`DELETE /contacts/{id}/tags`, `GET /contacts/{id}/appointments`, `POST /contacts/search` (tag filter schema is a best-guess), `GET /calendars/events`. The live TEST_MODE run is the verification gate. The deterministic webhook enroll path is primary; the poller is a safety net and self-heals via the enroll guard.
- Each drip runs as one execution living up to 7 days (n8n persists waiting executions); each step is a separate Wait resume. TEST_MODE = 60s per step.
- Appointment coverage mid-drip relies on the Receipt poller tagging `booked` within 10 min; there is a <10-min window where a brand-new appointment not yet tagged could allow one more send. Acceptable.

## Workflow IDs
- AVA Drip Engine v1 — `Pu661B1J1ZgezJT7` — https://circulant.app.n8n.cloud/workflow/Pu661B1J1ZgezJT7
- AVA Booking Receipt — `NMSWFtcyEQhSypSx` — https://circulant.app.n8n.cloud/workflow/NMSWFtcyEQhSypSx
