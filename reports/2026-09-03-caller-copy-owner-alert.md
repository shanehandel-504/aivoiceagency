# AVA 8930 — CALLER COPY OF OWNER ALERT

**Date:** 2026-09-03
**Workflow:** `kpYlhLbwSD0W1sE0` — *WF-POSTCALL-AVA · 8930 Call Wrap v1.0*
**Board row:** `POSTCALL-RAIL-8930`
**Old version:** `b10bd751-b72d-479d-989c-cd154f8a9045` (draft, **never published**)
**New active version:** `bf1a2130-c809-49d0-bbe9-44bc91b3ccf4` · `sameAsDraft: true`
**Webhook:** `POST https://circulant.app.n8n.cloud/webhook/ava-postcall-wrap` — unchanged, no new webhook

---

## WHAT SHIPPED

Every AVA call that produces an owner alert now also sends the caller a copy of that alert,
so a prospect sees exactly what an operator receives.

The copy is labelled as the owner-side preview — *"This is the owner-side preview — what your
team receives the moment a call ends."* — and signs **"AVA Team."**

**Delivery ladder, in order:**

1. **Email** — if the caller gave one on the call (`custom_analysis_data.caller_email` and the
   other analysis / dynamic-variable slots), else the address already on their CRM record.
2. **SMS** — the owner-SMS text as a preview, sent on the published 350-220-5305 line
   (`$vars.OWNER_SMS_FROM`) to the caller's **own** GHL contact.
3. **Nothing** — no email and no contact on file. The rail never creates a contact to have
   somewhere to send.

**A call with no captured content sends no copy.** Nor does a call from one of our own numbers.

**The existing owner alert is unchanged.** `Owner Call Email` is byte-identical, still first
in the chain, still reads `$vars.OWNER_ALERT_EMAIL`, and its body still carries the real
`to_number`. Only the caller-facing strings are redacted.

## THE OWNER'S CONTACT NEVER APPEARS

Redaction runs over every caller-facing string before it leaves `Wrap Payload`:

- Owner email address → `[owner contact removed]`
- Any number on `OUR_NUMBERS` **or** the owner numbers → `[our line]`
- `/shane/gi` → `[owner]`

It strips **every** number on `OUR_NUMBERS`, not only the owner cells. At runtime an owner cell
and a routing line are both just entries on that list and cannot be told apart, so the safe
reading of "the owner's contact never appears" is the superset. Nothing is hardcoded — the lists
come from n8n Variables.

## VERIFICATION

Three payloads replayed against the draft before publishing.

| # | Execution | Payload | Result |
|---|---|---|---|
| A | `8864` | booked, caller gave an email | `channel: email`, `email_source: given_on_call` |
| B | `8867` | booked, no email anywhere, known contact | `channel: sms`, `to_contact_id: ghlContactJordanB` |
| C | `8868` | no summary, no transcript | `channel: none`, `reason: no_captured_content` — neither send node executed |

**Test C is the one that proves the gate.** That caller's CRM record *did* carry an email
(`hangup@example.com`), so the no-copy could not have come from a missing address. It came from
the content gate. In the same run the owner alert built normally and still read
`To: +14142408930` — unredacted, owner-side, unchanged.

**Redaction proved at the VALUE level, not the reference level.** The code emits
`redaction_keys` as **counts** — `{our: 11, owner_nums: 2, owner_emails: 1}`. All three replays
read non-zero, which is how we know the variables resolved. A missing key would build an empty
list, and an empty list redacts nothing while every gate still passes green.

Test A seeded the transcript with the owner's name and the AVA line. It came back:

```
Agent: Got it. I will have [owner] call you back at [our line] to confirm the airport run.
```

**Grep over every caller-facing string produced by all three replays:**

```
shane (any case) ......... 0 hits
8930 / 414-240-8930 ...... 0 hits
3502205305 / 350-220-5305  0 hits
10-digit tokens present .. 4145550137, 4145550188, 4145550199  (the three test callers' own numbers)
```

## THE THING THE BRIEF COULD NOT HAVE KNOWN

**The board row said `live`. The workflow was not.**

`kpYlhLbwSD0W1sE0` was sitting at `active: false`, `activeVersionId: null`, with a single
unpublished version from **18 Aug** and an edit on **22 Aug** that was never published. Retell's
`latest_published` v43 posts `call_analyzed` to `/webhook/ava-postcall-wrap`, and an inactive
workflow does not serve its production webhook — so for roughly sixteen days **no owner alert
was firing from this rail at all**, and the ledger said otherwise the whole time.

This changes what the run's own outcome sentence means. "Every AVA call that produces an owner
alert today" was, before this publish, zero calls. The `publish_workflow` step in this run is
what actually put the post-call rail on the wire — the caller copy shipped with it, not onto it.

Adjacent state, checked and intact: the demo rail `TkETvvnABhUPd7ME` was never opened. The
incumbent `ava-postcall` owner `6r8YHuMEJbxeDyT5` was not touched — this rail keeps its own
`ava-postcall-wrap` path. `settings.errorWorkflow` still reads `SlnAeMrVRORsF0w7`, so the write
did not silently detach the Error Sentry.

## § 9 OWNER RAIL LAW ASSERTIONS

- **No upsert was added.** The change writes nothing to GHL that was not already written. The
  new SMS leg posts a *message*, never a contact.
- **The owner-alert contact is not a target.** The SMS goes to the caller's own contact id,
  resolved from the `GHL Find Contact` result for the caller's number.
- **Our own numbers get no copy.** `is_internal` short-circuits the lane to `none`.
- **Opaque ids were read from the API, not from the brief.** The workflow id came from the board
  row, but every version id, contact id and credential id in this run was read back off the live
  API after the write.
- **A DND contact is never texted.** GHL carries the opt-out on the contact row; `dnd: true`
  routes to `reason: contact_dnd` and sends nothing.

## GOTCHAS

- **`n8n publish_workflow` is what makes the webhook live.** `update_workflow` alone left the
  rail inactive and would have shipped a green-looking edit onto a dead endpoint.
- **The caller SMS carries `Reply STOP to opt out.` on every copy.** MESSAGE FORMAT LAW puts that
  line on first touch only and never on every message in a sequence. This is a judgment call: a
  per-call transactional copy is not a sequence, and the rail cannot cheaply prove first touch
  without writing a tag to the lead's contact. If Shane would rather it appear once, the fix is a
  tag write in `Caller Copy Build` — it is a scope change, not a bug fix.
- **The email lane can fall back to the CRM address.** `email_source` records which one was used
  (`given_on_call` vs `crm_record`) on every run, so this is auditable rather than invisible.
- **`Respond OK` was already position-independent** — it reads named nodes, not `$json` — which
  is why splicing five nodes in front of it did not break `call_id` or `noted`. It now also
  returns `caller_copy: {sent, channel, reason}`.
- **`zoneinfo` has no tzdata on this box.** Board timestamps have to be built from a fixed
  `-05:00` offset; `ZoneInfo('America/Chicago')` raises `ZoneInfoNotFoundError`.
