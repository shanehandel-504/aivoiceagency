# RUN 10 — AVA OWNER-ALERT UPGRADE

**Date:** 2026-08-02
**Surface:** n8n `AVA Post-Call to GHL (Demo Send)` — `6r8YHuMEJbxeDyT5`, webhook `/webhook/ava-postcall`
**Status:** LIVE — verified end to end on execution 5224

---

## WHAT THIS RUN WAS ASKED FOR

Put the full call transcript into the owner email, and add an SMS alert to the owner
on every completed call. Guard every field so a missing value never gets invented.

## WHAT IT ACTUALLY FOUND

The SMS leg already existed. **It had been dead for two days and nothing noticed.**

`OWNER_ALERT_CONTACT_ID` pointed at a GHL contact that no longer exists. Every owner
SMS answered `400 CONVERSATIONS_CONTACT_NOT_FOUND`. That node runs with
`neverError: true` — deliberately, so an owner-alert failure can never break the
caller path — so the execution still reported **success** and the run list stayed
green.

Blast radius, read from the execution record rather than estimated:

| Execution | When (UTC) | Owner SMS |
|---|---|---|
| 4995 | 2026-07-29 17:37 | SENT `gQwRwWzGwLadF2AeTOwI` — last good |
| 5083 | 2026-07-31 00:12 | **FAILED** 400 CONTACT_NOT_FOUND |
| 5123 | 2026-07-31 19:00 | **FAILED** 400 CONTACT_NOT_FOUND |
| 5150 | 2026-08-01 07:26 | **FAILED** 400 CONTACT_NOT_FOUND |

**Three real calls reached the owner email but never reached the owner's phone.**

`ZZ_TEST_CONTACT_ID` was dead the same way, so internal test calls were writing their
GHL note into nothing. The correct owner contact — tagged
`owner-alerts` / `zz-internal` / `do-not-drip`, phone on the owner line — had been
rebuilt on 07-31, and neither variable was ever repointed at it.

---

## THE TWO TRAPS

### 1 · The auditor checked the reference, never the value

`tools/n8n-owner-rail.mjs` proved that every owner-alert node *says*
`$vars.OWNER_ALERT_CONTACT_ID`. It never asked whether the value behind that
reference still pointed at a contact that exists. § 9 already says *"verify the
VALUE, not just the id"* — nothing enforced it, so the rail reported healthy while
it was broken.

### 2 · An active n8n workflow keeps serving `activeVersionId`

`update_workflow` writes the **draft**. `GET /api/v1/workflows/{id}` returns the
**draft** nodes at the top level. So a structural check against the API passes green
while production still runs the old code — the published version lives in a separate
`activeVersion` object.

This was caught by the end-to-end test, not by inspection: the first synthetic
payload delivered both alerts **in the old format**, with no transcript and
`owner_sms: undefined`, against a workflow the API had just shown me as correct.
`publish_workflow` swapped it. Same shape as the Retell trap already on file —
*what you read back is not what answers the phone.*

Both are now gates in `tools/n8n-owner-rail.mjs` that **exit non-zero**.

---

## SHIPPED

**Owner email.** Subject unchanged. Recording link and call ID unchanged and still
above the fold. Below them, the full transcript as `AGENT:` / `CALLER:` lines, built
from `transcript_object`; the flat `transcript` string is the fallback and is
*relabelled* rather than re-derived, so speaker attribution is never guessed. No
truncation — the GHL note keeps its own 3,500-char cap, the email does not.

**Owner SMS.** One job:

```
AVA CALL · FOLLOW-UP · +1XXXXXXXXXX · 1m 36s · booked no · details emailed.
```

75 characters, one segment, readable from a lock screen. `BOOKED — ` prefixes it when
the call booked. The summary moved out — detail lives in the email, per MESSAGE
FORMAT LAW ("every outbound message does ONE job").

**Guard.** Any field absent from the payload renders `EMPTY — NO RESULT`. A transcript
is never reconstructed from the summary, because a summary is not a transcript.
Duration prefers the payload's own `duration_ms` and falls back to the timestamps
rather than printing `0m 0s`.

**Coverage.** `Format Call Log` was rehung off `Normalize`, so the owner alert fires
on every completed call — including calls where no caller identifier was captured,
which previously exited before the alert leg and produced nothing at all.

**Rail.** Both variables repointed at contacts verified to resolve live; a fresh
zz-test sink rebuilt. No phone number or contact id appears in any node body or in
this repo — node bodies name KEYS only.

---

## PROOF

| Check | Evidence |
|---|---|
| Webhook responds | `POST /webhook/ava-postcall` → `200 {"status":"ok"}` |
| Execution | 5224 — `success` |
| Owner SMS **delivered** | GHL `status=delivered`, msg `ZDt251OoYKZtJ5nFAl51`, published SMS line → owner line |
| Owner email delivered | Gmail `19fc40f0f1cf1366` |
| Transcript in email | 5 `AGENT:`/`CALLER:` lines in the body |
| Guard | Bare payload renders `EMPTY — NO RESULT` for outcome, summary, recording, caller, duration, transcript |
| `BOOKED —` prefix | Booked payload → `BOOKED — AVA CALL · BOOKED · … · booked yes · …` |
| Owner-only | `Send Email` (caller-facing) did not run; `Send SMS` stays disabled |
| No lead created | 0 contacts hold AVA's own line; write routed to the zz-test sink |
| Error Sentry | still attached — `SlnAeMrVRORsF0w7` |
| Rail gates | `n8n-owner-rail.mjs --audit` → RAIL GATE PASSED, exit 0 |

---

## GOTCHAS

- **`neverError: true` is correct here and must stay.** It stops an owner-alert
  failure from breaking the caller path. The cure for silence is not removing it —
  it is the live gate that now fails loudly out of band.
- **Publishing is a separate step.** Any future n8n edit through the API or MCP is a
  draft until `publish_workflow` runs. Verifying against `GET /workflows/{id}` will
  lie to you.
- **`booked` can legitimately be `unknown`** — a booking attempt whose tool result was
  unreadable. It is reported as-is. The brief said `booked {yes/no}`; collapsing
  `unknown` into `no` would be inventing an outcome, which § 4 forbids, so the third
  state ships intact.
- **A missing caller number now reads `EMPTY — NO RESULT`, not `web-call`.** Per the
  guard rule. `call_type` still distinguishes the two in the payload if that
  distinction is ever wanted back.
- **Shane received two test texts.** The first was the pre-publish shot that exposed
  the draft trap and went out in the old format; the second is the shipped format.
- **GHL appends its own opt-out footer** to outbound SMS at account level. Harmless on
  an owner rail, but it is not coming from the workflow and cannot be removed there.
