RUN INCOMPLETE — ONE CLOSE-OUT ITEM: AIC-TEST-2 STILL IN WF-AIC-SALES-CAL ALLOWED (THE PUBLISH WAS REFUSED BY THE SESSION PERMISSION CHECK) / DESK V3 AND THE RAIL ARE LIVE AND VERIFIED / NEXT: SHANE PUBLISHES 18bd10cd OR ALLOWS IT

# AIC Capture Desk — Round 2 LIVE (rail switch, desk v3, close-out)

**Date:** 2026-09-28 (Central) · **Continues:** `reports/2026-09-27-aic-round2-promote.md` (the gate run).
**Approval:** Shane, 2026-09-28: run the rail switch, then Steps 4b–6 and 8; desk v3 published by API (agent-page publish
waived); owner `do-not-drip` tag yes; log T11. No agent-spoken line was written by Claude: desk v3 carries Grok's round-2
lines exactly as gated on AIC-TEST-2 v2.

## What happened, in plain words

- The ticket rail now runs the round-2 version: it reads the desk's own trip fields first, prints charters, one-way and hours,
  prints bags only when the caller gave them, and every desk trip sheet shows 414-775-0019 as the call-back line.
- The live AI Chauffeur desk (414-775-0019, …5008 and /try) now answers on **v3**: the "reservation system" greetings, the
  charter questions, and a read-back that names the vehicle.
- One verification call on the real /try page passed: v3 answered, said "reservation system", and read back "written for an
  Executive Sedan". The rail filed its ticket correctly; that test trip sheet was then deleted.
- The owner-alert contact now carries `do-not-drip`.
- One item is left: the test agent is still on the calendar tool's allow list, because publishing that change was refused by
  this session's permission check. The test agent is bound to no number, so nothing can reach it by phone.

## DONE

| Step | What | State | Proof |
|---|---|---|---|
| 4 | Rail switch `TkETvvnABhUPd7ME` | **LIVE** `601b1332` | four nodes byte-identical to the gated staging copy (Build Trip Ticket `b4977d74…`, Flags Ctx `893c14f5…`, Tag Caller `a4375f6b…`, Create Caller `a5356301…`); 54 other nodes + connections unchanged; Error Sentry attached; rollback `79a5e162` |
| 4b | AIC-TEST-2 webhook → live rail | DONE | AIC-TEST-2 v3 = v2 + `demo-postcall` webhook, flow byte-identical; no calls placed on it |
| 5 | Pre-promote snapshot | DONE (yesterday) | private archive `a87f292`; rollback § 10 + § 10.1 (`b389b95`); runbook refreshed (`a8ccc1d`) |
| 6 | Desk v3 (port + publish by API) | **LIVE** | flow v3 = AIC-TEST-2 flow v2 with **zero** differences; only `post_call_analysis_data` changed at agent level; voice, model, timings, tool endpoints, webhook untouched; 0 unapproved lines, 52/52 code tests on the desk's own draft; published hash = checked |
| 6 | Routes | VERIFIED | 0019 in + out and …5008 in + out → desk `latest_published` = v3; /try (WF-TRY-WEBCALL, no parameter) → desk, no version pinned |
| 6 | …5008 back to the desk | DONE | in + out → desk `latest_published` (the pre-round-2 binding) |
| 6 | AIC-TEST-2 archived | DONE | bound to no number, kept (not deleted) |
| 6 | AIC-TEST-2 out of WF-AIC-SALES-CAL ALLOWED | **OPEN** | publish of `18bd10cd` refused by the permission check; live stays `28ba9379` |
| 6 | One /try check call (real page) | **PASS** | `call_69e064af3fad2a8071709275ec0`: desk v3, "reservation system", "…written for an Executive Sedan. Anything need changing?" |
| 6 | Rail on a real call | PASS | execution 11099 on `601b1332`: Trip "Point to point", Executive Sedan, no bags line, callback 414-775-0019, GHL routed to the zz-test contact |
| 6 | Test artifacts | CLEANED | call-3 appointment (yesterday); the check call's public trip sheet `AIC-09275EC0` → 404 |
| 7 | Owner `do-not-drip` tag | DONE | tags: owner-alert, zz-internal, test, do-not-drip |
| 8 | Board, wrap, receipt, T-backlog (T11) | DONE | this commit · Notion |

## Choices made on the way

1. **`book_slot` mapping came along with the port.** Desk v1's tool mapped the booking reply to `date` / `time`; the round-2
   flow (built on the RUN D draft) reads `appt_date` / `appt_time` / `appt_timezone` in N08-BOOKED. The endpoints and secret
   headers are identical; only the response-variable mapping changed, so the booked line is never spoken with empty
   placeholders. The calendar rail returns both name sets.
2. **The desk-line rule is live.** Every capture-desk trip sheet (phone or web) prints 414-775-0019 as the call-back line;
   /try sheets now show it too.
3. **The /try check call ran on the real page.** A direct call to the /try webhook is refused (403), so the page did its own
   proof and call creation in an instrumented browser (synthesized caller on the mic, the SDK's audio events used to hear turn
   ends). The caller gave the test line as the text number, so the rail routed its GHL writes to the zz-test contact; the owner
   received that call's real alert (email + text).

## Open items

- **AIC-TEST-2 in WF-AIC-SALES-CAL ALLOWED.** To finish: publish `18bd10cd` (it differs from `28ba9379` only by that entry).
- **Trip-log sheet row `AIC-09275EC0`** (private sheet) remains from the check call.
- **§ 9:** 5 active workflows upsert GHL contacts by phone with no own-number guard (AVA Client Intake, send_link,
  write_to_crm, social_intake, LIVE INTAKE v1). Separate run.
- **T11 logged:** hours said in the first breath route the trip to Hourly, and the read-back then skips the drop-off.

## Freeze

The desk (v3) and the rail (`601b1332`) are frozen for 30 days, through **2026-10-28**. Changes before then need a named defect
and Shane's call.

## Rollback, one line each

- Rail: MCP `publish_workflow(TkETvvnABhUPd7ME, 79a5e162-8d2d-439c-b08e-24d0dbc9d54e)`, then check the Sentry.
- Desk: "restore v1" = `create-agent-version {"base_version":1}` + `publish-agent-version` (0019, …5008, /try follow).
- …5008 back to AIC-TEST-2: `update-phone-number` in + out to AIC-TEST-2 `latest_published`.
- Owner tag: remove `do-not-drip` only if the owner row is re-provisioned.
- Full detail: private archive `archive/ROLLBACK-BUNDLE-2026-09-25.md` § 10.1.

```
===== SHANE READBACK — COPY ALL =====
RUN INCOMPLETE — ONE CLOSE-OUT ITEM: THE TEST AGENT IS STILL ON THE CALENDAR
ALLOW LIST (PUBLISH REFUSED BY THE TOOL) / DESK V3 + RAIL LIVE AND VERIFIED

WHAT HAPPENED (plain words)
- The live AI Chauffeur desk (414-775-0019, ...5008, /try) now answers on v3:
  "reservation system" greetings, the charter questions, and a read-back that
  names the vehicle.
- The ticket rail runs the round-2 version: charters, one-way and hours on the
  ticket, bags only when given, and 414-775-0019 as the call-back line.
- A check call on the real /try page passed, and its ticket came out right.
  That test trip sheet is deleted.
- The owner-alert contact now has the do-not-drip tag.
- Left open: the test agent is still on the calendar tool's allow list (the
  tool refused the publish). It has no number, so nobody can reach it.

GOTCHAS
- Desk v3 and the rail are frozen through 2026-10-28.
- /try trip sheets now show 414-775-0019 as the call-back line.
- The owner got a real alert (email + text) from the check call.
- Five live workflows can still write onto the owner's GHL row from your own
  cell (no own-number check). Separate run.

DONE
| Item                          | State          | Proof / rollback                          |
| 414-775-0019 in + out         | desk v3 LIVE   | latest_published = v3 / "restore v1"      |
| ...5008 in + out              | desk v3 LIVE   | rebound to the desk / rebind to AIC-TEST-2|
| /try                          | desk v3 LIVE   | check call_69e064af... v3 PASS            |
| Ticket rail                   | 601b1332 LIVE  | bytes = gated staging / publish 79a5e162  |
| Desk v3 build                 | ported         | 0 differences vs AIC-TEST-2 v2            |
| AIC-TEST-2                    | archived       | v3, no number, kept                       |
| Calendar allow list           | OPEN           | still 28ba9379 / publish 18bd10cd         |
| Owner do-not-drip tag         | done           | tag present                               |
| Snapshot + rollback           | done           | archive a87f292 / b389b95 / a8ccc1d       |
| T11 logged                    | done           | T-backlog page                            |
```
