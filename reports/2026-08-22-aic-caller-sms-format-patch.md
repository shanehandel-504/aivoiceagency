# AIC DEMO RAIL — CALLER SMS FORMAT PATCH

**Date:** 2026-08-22
**Surface:** n8n · workflow `TkETvvnABhUPd7ME` — "DEMO POST-CALL RAIL v1 (all demo agents)"
**Node touched:** `Build Trip Ticket` (`n8n-nodes-base.code`) — `jsCode` only
**Status:** LIVE / published

---

## What changed

The caller SMS was one long jammed sentence built by string concatenation. It is now an
`smsLines[]` array joined on a blank line, so the text arrives as short stanzas. The reserve
CTA moved to its own stanza with the URL on its own line.

Per MESSAGE FORMAT LAW, one message still does one job — this is a legibility change to how
that one job reads on a lock screen, not a second ask.

## DONE

| Item | Before | After | Proof |
|---|---|---|---|
| `activeVersionId` | `19f0cf22-034d-489b-8ee6-81c7dced70ff` | `6ac9b308-8d7a-423e-871c-ff518aef8d6e` | re-fetched after publish |
| `active` | true | true | re-fetch |
| `activeVersion.sameAsDraft` | true | true | re-fetch |
| `smsLines.join` in published code | absent | present ×1 | re-fetch grep |
| legacy `let callerSms;` | present | absent | re-fetch grep |
| Published bytes vs. reviewed local | — | sha256 identical (`709da6e8…8920`, 17,320 chars) | independent re-transcription + `diff` |
| Nodes changed | — | 1 of 16 (`appliedOperations: 1`) | update response |
| Diff footprint | — | one hunk, lines 166–179 | `diff -u old.js new.js` |

## Rendered output — new format

AI Chauffeur, quote + email captured + reserve URL:

```
AI Chauffeur: thanks for calling!

Your quote: $189 all-in, gratuity included.

Executive Sedan, Airport transfer, Sep 3 at 6:15 AM.

Dispatch will confirm availability shortly.

Full trip ticket is in your email.

Hold your reservation — add a card on file:
https://aichauffeur.ai/reserve
```

Reliable Limo, no quote, no email, no reserve URL:

```
Reliable Limo: thanks for calling!

We have your trip details — Executive Sedan, Airport transfer, Sep 3 at 6:15 AM.

Dispatch will confirm rate and availability shortly.
```

## Rollback

One step, no code required:

- `restore_workflow_version` → workflow `TkETvvnABhUPd7ME`, version `19f0cf22-034d-489b-8ee6-81c7dced70ff`
- then `publish_workflow` → workflow `TkETvvnABhUPd7ME`

## Gotchas

- **Segment count went up on the longest case.** The message carries an em dash, so the
  carrier encodes it UCS-2 (67 chars per concatenated segment), not GSM-7. Measured:
  AI-Chauffeur-with-quote-and-email went 264 chars / 4 segments → 289 chars / 5 segments.
  Reliable-no-quote held at 3 segments. Blank lines are real characters and they are billed.
- **§ 9 OWNER RAIL assertion — three pre-existing conditions on this workflow, none introduced
  by this patch, none changed by it** (this brief was scoped to `jsCode`):
  1. `Owner SMS Alert` carries the owner-alert contact id inline in the node body. § 9 puts
     that value in an n8n Variable (`OWNER_ALERT_CONTACT_ID`).
  2. There is no `OUR_NUMBERS` guard ahead of `Upsert Caller in GHL`. A call placed from one
     of our own lines would upsert a real contact.
  3. Workflow settings carry no `errorWorkflow` — `OPS — Error Sentry` (`SlnAeMrVRORsF0w7`)
     is not attached to this workflow.
- **Owner SMS is untouched.** It still opens status-led and still joins on a single newline.
- **`Todd Copy Gate` remains dormant** (`SHIP_TO_TODD = false`).
