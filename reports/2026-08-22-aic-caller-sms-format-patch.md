# AIC DEMO RAIL — CALLER SMS FORMAT PATCH

**Date:** 2026-08-22 · **Surface:** n8n `circulant.app.n8n.cloud` · workflow `TkETvvnABhUPd7ME`
("DEMO POST-CALL RAIL v1 (all demo agents)") · node **Build Trip Ticket** (`jsCode`)
**Skills loaded:** `verification-before-completion`
(CLAUDE.md § SKILL ROUTER — pre-commit row. No AVA-parent or chauffeur *visual* surface was
touched, so the design rows did not fire; § PROMPT AUTHORITY LOCK is not engaged — this is
outbound SMS assembly in an automation node, not Retell agent dialogue.)

---

## Result

**The requested block is already live.** The old single-string `let callerSms; if (quote) {…}`
concatenation is gone from `Build Trip Ticket`, and the stanza-array replacement is present
**byte-for-byte** in the workflow's **published/active** version. No API write was needed and
none was made — re-applying identical code would have created a noise version with no diff.

### Version lineage

| Step | versionId | When | What |
|---|---|---|---|
| Base before the patch | `19f0cf22-034d-489b-8ee6-81c7dced70ff` | 2026-08-20 22:45:59Z | `bag_count` → BAGS line |
| Reserve-link SMS tail | `f58200da-f1e4-46a9-8806-a57a6e609f45` | 2026-08-20 21:47:00Z | `/reserve` link, AIC accent |
| **This patch** | `6ac9b308-8d7a-423e-871c-ff518aef8d6e` | **2026-08-22 00:44:34Z** | "Caller SMS: short stanzas, not one jammed line" |
| Rebased forward | `88645537-af61-4cce-b460-16da835e2616` | 2026-08-22 01:01:12Z | Airport row (v11 contract) — its own note records that it preserved the stanza-SMS edit off the `6ac9b308` base |

`active: true` · `versionId` == `activeVersionId` == `88645537-af61-4cce-b460-16da835e2616`
· `activeVersion.sameAsDraft: true`. Draft and published are the same bytes.

---

## Proof

**1 · Byte-exact match.** The requested replacement and the block read back out of the
**published** version (`get_workflow_version` on `88645537-…`, not the draft) hash identically:

```
572bcd3f6fc85c1bc84453be512e19b46751f16a2e41f1ca1520990ba7ca10da  requested.txt
572bcd3f6fc85c1bc84453be512e19b46751f16a2e41f1ca1520990ba7ca10da  deployed.txt
diff → IDENTICAL (0 differences)
```

**2 · `smsLines.join` present, old block absent.** In the published `jsCode`, the identifier
`callerSms` now occurs exactly twice — `const callerSms = smsLines.join('\n\n');` and
`caller_sms: callerSms` in the return payload. There is no `let callerSms;` anywhere.

**3 · Rendered output, 6/6 PASS.** Offline harness over the deployed logic, both tenants,
quote and no-quote paths, email present and absent:

| Case | Stanzas | Chars | Result |
|---|---|---|---|
| AIC · quote + trip + email | 6 | 290 | PASS |
| AIC · quote, no email | 5 | 254 | PASS |
| AIC · no quote | 5 | 254 | PASS |
| AIC · no quote, no trip | 4 | 191 | PASS |
| Reliable · quote (no reserve URL) | 5 | 198 | PASS |
| Reliable · no quote (no reserve URL) | 3 | 148 | PASS |

Assertions per case: ≥3 stanzas (never one jammed line) · the reserve URL sits on its own
line after `card on file:` · the URL is the last thing in the message, so carriers auto-link
it cleanly. Reliable Limo has no `RESERVE_URL`, so that stanza correctly never renders on the
Reliable tenant.

Longest AIC case is 290 characters — two SMS segments. Same as before the patch; the blank
lines are the only added bytes.

Worked example, AIC with a quote:

```
AI Chauffeur: thanks for calling!

Your quote: $385 all-in, gratuity included.

Executive Sedan, airport transfer, Aug 24 at 6:15 AM.

Dispatch will confirm availability shortly.

Full trip ticket is in your email.

Hold your reservation — add a card on file:
https://aichauffeur.ai/reserve
```

---

## What was NOT done

- **No workflow write.** The target state was already the live state; an identical PUT would
  have burned a version number for a zero-byte diff.
- **No `execute_workflow` / `test_workflow` run.** That node fans out into live Gmail sends
  and live GHL SMS on `+13502205305`. Verification was done by reading the published version
  and harnessing its logic offline — no message was sent to anyone.
- **No other node, field, or tenant behavior changed.**

---

## Gotchas

- Two lanes were editing this workflow inside seventeen minutes last night (`6ac9b308` at
  00:44:34Z, `88645537` at 01:01:12Z). The airport-row lane rebased onto the stanza edit
  rather than clobbering it — but that was luck plus a careful author, not a lock. Check
  `get_workflow_history` before writing to `TkETvvnABhUPd7ME`.
- `Owner SMS Alert` still joins on a single `\n`, by design — owner alerts are status-led
  scan lines (MESSAGE FORMAT LAW), not stanzas. The blank-line treatment is caller-facing only.
