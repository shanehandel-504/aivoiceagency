# RUN 6.5 — OWNER RAIL

**Date:** 2026-07-26 · **Surfaces:** n8n (`circulant.app.n8n.cloud`) + GHL (`sdShCZCaxce8DHKbYcIl`) + Retell
**Mission:** make owner alerting real and un-corruptible. **Result: LIVE.**

---

## WHAT SHIPPED, IN PLAIN ENGLISH

Before tonight, the system texted you on a phone number that lived inside a **customer
record**. That is the whole bug. Any customer who called and gave a matching phone or
email could have overwritten the address your alerts go to — and messages meant for a
customer were landing in your alert thread instead. RUN 6 found this and stopped, because
wiring more alerting onto a broken target would have baked the bug in.

Tonight the alert target became its own dedicated record that nothing is allowed to write
into. The customer record it used to share was cleaned up and kept — including the real
Jul 28 appointment, which is untouched.

Then two things were added that did not exist before:

**You now get told when a call happens.** A text with who called, how long, and a one-line
summary; plus an email with the summary and a link to the recording.

**You now get told when something breaks.** For four days and twenty-two hours in July,
the automation platform was failing 288 times a day and nobody knew. A watchman now texts
you the first time any workflow fails, and then stays quiet for six hours so one outage
cannot become 288 texts.

Two more collisions turned up that nobody was looking for, and both are fixed.

---

## STEP 0 — VOICE STATE · **PASS, NOTHING APPLIED**

The RUN 5 FLIP package is already live on main. Nothing was changed. Voice is frozen.

| Check | Live value | |
|---|---|---|
| 414-240-8930 inbound + outbound | `agent_d5ada9f774fe3ae7f034d2c677` @ `latest_published` | ✅ |
| Resolved agent version | **v37** (38 versions, v37 is the newest published) | ✅ |
| Prompt sha256 | `2bc12992d159db2f2446875773dac85f4dc807d97b9eff050d1533e1d002e9e4` | ✅ matches the RUN 5 post-patch hash exactly |
| Prompt length | 13,138 chars · `"grab a time"` present · `"lock in a time"` absent | ✅ |
| Tool count | **2** — `end_call`, `book_appointment` | ✅ |
| `begin_message` | *"Thanks for calling AI Voice Agency. This is AVA. What can I help you with?"* | ✅ set |
| Voicemail | `static_text`, 0 template tokens | ✅ |
| Max call duration | 600000 ms (10 min) | ✅ |
| Model | `gpt-5.5` · `model_high_priority: true` · `stt_mode: fast` | ✅ |
| Knowledge base | `[]` — detached | ✅ |
| POOL-05 `+14142468976` | inbound → main agent @ latest_published · outbound → `agent_67381fcfabf6731dad4f40c590` (HEAR-IT-LIVE) | ✅ |

> **Where `begin_message` actually lives.** It is on the **Retell-LLM object**, not the
> agent object. A probe that reads only `agent.begin_message` gets `undefined` and will
> report a false negative. Checked on the LLM at version 37 — it is set, verbatim.

**Carried forward, unchanged:** the agent's own `webhook_url` still points at chat-dash,
not the n8n `ava-postcall` rail (RUN 5 finding F). This turned out **not** to matter —
see the next section — but it is still worth a decision.

---

## THE FINDING THAT UNBLOCKED THE PROOF

RUN 5 recorded that post-call data goes to chat-dash rather than n8n, which would mean the
whole GHL rail never fires from a real call. **That is not what happens.** The live
`ava-postcall` webhook receives genuine Retell traffic — execution 4699 carries an
`x-retell-signature` header and a full `call_analyzed` body for the main agent.

There is a **second, account-level Retell webhook** pointing at n8n, in addition to the
agent-level chat-dash one. Both fire. The rail works, and the one-call proof is viable.

---

## THE BLOCKER — CLEARED

RUN 6 stopped on one question: should owner alerting use a dedicated, never-upserted GHL
contact? **Yes — and it now does.**

### What the record actually held

| | |
|---|---|
| Contact | `8zyowOdgNehLoYLpmVBm` |
| Name | `Robert` / `� Owner` — a literal U+FFFD replacement character in a CRM row |
| Email | `scottrose762@gmail.com` — the RUN 5 test lead |
| Phone | the number owner alerts were actually being delivered to |
| Tags | `ava demo call`, `booked` |
| Thread | owner alerts **and** caller-facing demo copy, interleaved, all `delivered` |

### ⚠ The brief's premise was wrong, and the correction matters

The brief said the phone on that row was *"the owner cell"* and named a single owner cell.
Re-fetched from the API:

- The number on `8zyowOdgNehLoYLpmVBm` is **not** the Doppler `OWNER_CELL_PHONE`. It is a
  **different owner line** — and it is the one owner alerts were genuinely being delivered
  to (confirmed against the conversation: `✅ BOOKED: … · delivered`).
- `OWNER_CELL_PHONE` sits on a **different contact entirely**, `YrynHxqMzKp71C8zojNp`.

Both are yours; the brief's own STEP 4 says *"both owner cells,"* which is what reconciles
it. **The number that was moved is the one that was already receiving your alerts**, so the
destination did not change — only the record it lives on. Had the Doppler value been used
literally, alerts would have silently changed destination on the night the alerting rail
was declared trustworthy.

### Two further collisions, not in the brief

| Row | Held | Why it mattered | Action |
|---|---|---|---|
| `P9ZrGdOL9087JJaI8unu` | `shane@aivoiceagency.ai` on a demo-lead row ("Roberto", `ava-demo-hot`) | GHL enforces email uniqueness — the owner contact could not be created while a lead squatted on the owner's address | email freed (`null`) |
| `YrynHxqMzKp71C8zojNp` | `OWNER_CELL_PHONE` on a demo-lead row ("Unknown Caller Test") | every test call you made from your own cell was upserting into a *lead* row | now covered by the STEP 4 guard |

> **GHL clear semantics.** `PUT` with `""` returns **422**. `null` returns **200** and
> clears the field. Empty string is not "no value" to this API.

---

## STEP 1 — DEDICATED OWNER CONTACT ✅

| | |
|---|---|
| **contactId** | **`UtKrbSG01tWotCzc7Jes`** |
| Name | AVA Ops Alerts |
| Email | `shane@aivoiceagency.ai` |
| Phone | moved off `8zyowOdgNehLoYLpmVBm` — **digits not recorded here, per repo phone law** |
| Tags | `zz-internal`, `owner-alerts`, `do-not-drip` |
| Source | `RUN 6.5 OWNER RAIL — internal alert target, never an upsert target` |

Not enrolled in the drip (the poller searches `demo-no-book`, which this row does not
carry). DND deliberately **not** set — that would block the alerts.

## STEP 2 — COLLIDED ROW SPLIT ✅

`8zyowOdgNehLoYLpmVBm` is now a pure test-lead record and the zz-test sink.

| Field | Before | After |
|---|---|---|
| Phone | owner alert line | **removed** |
| Name | `Robert` / `� Owner` | `Robert` / `Owner` — no non-ASCII remains |
| Email | `scottrose762@gmail.com` | unchanged |
| Tags | `ava demo call`, `booked` | + `zz-test` (`booked` **kept** on purpose — dropping it would make the Booking Receipt re-send a receipt) |

**Appointment verified intact, after the edit:**

| | |
|---|---|
| Appointment | `i4JZucAQDg70ozdTrdgp` · `confirmed` |
| When | **2026-07-28 14:00–14:20** |
| Calendar | `aCIv7rUnCGrysobt6Mlg` — **AVA Demo Call** ✅ |
| Assigned | `riVdJngF0dT6xbEmvvFg` — **Shane Handel** ✅ |

## STEP 3 — REPOINT + BLOCK C WIRED ✅

**Five** owner-alert references existed, not the two the brief named. All repointed to
`$vars.OWNER_ALERT_CONTACT_ID`:

| Workflow | Node | |
|---|---|---|
| AVA Booking Receipt | `Owner Alert SMS` | ✅ |
| AVA Client Intake | `Owner SMS Alert` | ✅ |
| AVA Drip Engine v1 | `Owner NEW LEAD SMS` | ✅ |
| AVA · alert_owner · realtime | `Owner SMS (staged)` — was the literal string `PASTE_SHANE_OWNER_CONTACT_ID` | ✅ filled (node left **disabled**, as found) |
| AVA Client Intake | workflow **description** — stale docs naming the dead id | ✅ rewritten |

**New owner legs on `AVA Post-Call to GHL` (`6r8YHuMEJbxeDyT5`):**

- `Owner Alert SMS` → from the 350, to the owner contact:
  `AVA call: {caller} · {duration} · {one-line summary}`
- `Owner Alert Email` → Gmail to `shane@aivoiceagency.ai`, carrying outcome, booked flag,
  **summary and the recording URL**.

They sit on their **own branch** off `Format Call Log`, so an owner-leg failure is visible
to the sentry but can never block the caller-facing path.

**Notion leg: still OFF**, as instructed. **The existing caller-facing `Send SMS` was left
disabled** — it carries lead copy ("Your strategy-call link…"), so repointing *it* at the
owner would have texted you marketing. New nodes were added instead of hijacking old ones.

Gmail was chosen over the GHL email channel for the owner leg: GHL's shared sending pool is
the known deliverability problem (see the email-deliverability memory), and an alert that
lands in spam is not an alert.

## STEP 4 — UPSERT GUARD + `cell` FIX ✅

`OUR_NUMBERS` = **11 numbers** — all 8 Retell lines, the published 350 SMS line, and both
owner cells. Assembled at provisioning time from the live Retell API + Doppler. **Never
printed, never committed.**

**The `cell` fix.** RUN 5 found `book_appointment` writing AVA's own published line as the
lead's phone. The reject list held exactly **one** number. It now holds **every number we
own**, so the bad candidate is rejected and the resolver falls through to the real caller ID.

**The guard.** In both `book_appointment` and the post-call writer, before any upsert:

```
Has Identifier ──▶ Is Our Number? ──true──▶ Test Contact ──┐
                          └───────false──▶ GHL Upsert ─────┴──▶ Contact Ref ──▶ …
```

A call from one of our own numbers resolves to `$vars.ZZ_TEST_CONTACT_ID` and **never
creates or mutates a real lead**. Downstream nodes were repointed at `Contact Ref` so both
branches carry the same shape. A `Caller Send?` gate additionally suppresses caller-facing
demo copy on internal calls.

> `has_identifier` had to be widened. An internal call blanks the phone (it is ours) and
> often carries no email, which previously dead-ended at `Respond No Identifier` — before
> the guard could ever run.

### Proven live, on the real webhook

A synthetic `call_analyzed` was POSTed to the live `ava-postcall` endpoint using one of our
own numbers as the caller (execution **4830**, `success`):

| Node | Result |
|---|---|
| `Build GHL Body` | `is_internal: true`, `has_identifier: true` ✅ |
| `Is Our Number?` → `Test Contact` → `Contact Ref` | resolved to the zz-test contact — **no real lead touched** ✅ |
| `GHL Call Note` | note `ITy1Efy5KRlmhgELY6iQ` written ✅ |
| `Owner Alert SMS` | message `lIdV9GZ9LztVT0tpvZah` — **`delivered`** ✅ |
| `Owner Alert Email` | Gmail `19f9f98dc9b133b3`, `SENT` ✅ |
| `Caller Send?` | false branch — demo email **correctly suppressed** ✅ |

The owner SMS landed on conversation `HhEBddOTddClqGwOCZS8` — a **new** thread on the
**new** contact, not the old collided thread `9fvDOE598jzJmSGjYSPP`. That is the proof the
repoint is real.

## STEP 5 — ERROR SENTRY ✅

| | |
|---|---|
| Workflow | **`OPS — Error Sentry`** · `SlnAeMrVRORsF0w7` · **active** |
| Shape | `Error Trigger` → `Dedupe 6h` → `Owner FAIL SMS` |
| Message | `n8n FAIL: {workflow}: {error, ≤80 chars}` |
| From / to | the 350 → the dedicated owner contact |
| Dedupe | one alert per workflow per 6h, held in n8n workflow static data |
| Attached to | **all 13 active workflows** |

### ⚠ THE GOTCHA THAT COST THIS RUN A CYCLE

**An n8n error workflow that is not ACTIVE is silently never invoked.** n8n accepts the
`errorWorkflow` setting, records no error, logs nothing, and simply does nothing. The first
proof run showed a real workflow failing and **zero** sentry executions. Activating the
sentry fixed it immediately.

This is the exact failure mode the sentry exists to prevent — silent nothing — and it would
have shipped as "done" without a forced failure. The activation step and this reasoning are
now encoded in `tools/n8n-error-sentry.mjs`.

### Forced-failure proof

Two deliberate failures, six seconds apart, on a throwaway workflow (created, fired,
deleted):

```
exec 4836: ALERT SENT — "RUN 6.5 sentry proof — deliberate failure, ignore [line 1]"
exec 4838: deduped (no SMS) — correct
RESULT: 1 alert sent, 1 deduped  →  PASS
```

The sentry fires, and the 6h gate holds. During the July outage this would have been **one
text**, not 1,416.

---

## STEP 6 — ONE-CALL PROOF ✅ **ALL GREEN — 12 PASSED, 0 FAILED**

A real inbound call landed on 414-240-8930 and the whole rail was verified end to end
with `tools/run65-proof.mjs`.

| # | Check | Result |
|---|---|---|
| 1 | Inbound call on the live line | `call_c898f73e36cf331e82a1305b6a4` · 180s · `agent_hangup` |
| 2 | Served by the frozen agent | **v37** ✅ |
| 3 | `ava-postcall` execution | **4840 · success** ✅ |
| 4 | Contact resolved | `matnQ6JbrPiXOQrrR5Kw` — a real lead, **not** the owner row, **not** the zz-test sink ✅ |
| 5 | GHL call note | `vRnNF1usyxYz9ZaBc6oV` · 2,962 chars · **recording URL included** ✅ |
| 6 | Owner SMS dispatched | `fZtotjF06TdCYizqx7lJ` ✅ |
| 7 | Owner SMS **delivered** | `AVA call: +1305…6506 · 3m 0s · Chris called AI Voice Agency to see a demo for his plumbing service…` ✅ |
| 8 | Owner email sent | Gmail `19f9fb6e36f57e42` ✅ |
| 9 | `Caller Send?` gate | correctly **allowed** demo copy (real lead, not internal) ✅ |
| 10 | Owner contact reachable | `AVA Ops Alerts` · tags intact ✅ |
| 11 | **Owner row uncorrupted after the call** | name / email / tags intact ✅ |
| 12 | Owner contact id resolved from n8n config | `UtKrbSG01tWotCzc7Jes` ✅ |

### The RUN 5 `cell` defect — fixed, proven on a real call

The call also booked, so `book_appointment` ran for real (execution **4839**, success):

| | |
|---|---|
| `Is Our Number?` | **false** branch — real upsert path taken ✅ |
| Contact phone written | **the caller's number**, `+1305…6506` — **not** AVA's published line ✅ |
| Appointment | `zWAdbE9q4SQ62OUGWcjL` · **Mon 2026-07-27 14:00** · `aCIv7rUnCGrysobt6Mlg` AVA Demo Call · assigned `riVdJngF0dT6xbEmvvFg` Shane Handel · `confirmed` |

RUN 5 shipped `"cell": "+14142408930"` — AVA's own line — into the lead's phone field. On this
call the resolver rejected every number we own and fell through to the real caller ID. **The
defect is closed against live traffic, not a fixture.**

### Two honest notes on the proof

1. **The contact was matched, not created.** `matnQ6JbrPiXOQrrR5Kw` already existed (added
   2026-07-07 — the same tester's earlier demo call), so the upsert returned `new: false` and
   correctly merged by identity. The brief asked for "a NEW lead"; what it got is a *correctly
   identified returning lead*. The load-bearing assertion — that the write did **not** land on
   the owner row — holds either way.
2. **A real appointment now exists**: Mon 27 Jul, 2:00 PM CT, under "Chris" /
   `scottroes762@gmail.com` (AVA mis-transcribed the address by one letter — the tester's is
   `scottrose762@`). The hourly Booking Receipt poller will send that contact a receipt and
   send you a `BOOKED:` owner alert on the hour. Delete the appointment if you do not want it.

## WHAT CHANGED LIVE

| Change | Surface | State |
|---|---|---|
| `AVA Ops Alerts` contact created (`UtKrbSG01tWotCzc7Jes`) | GHL | live, verified |
| `8zyowOdgNehLoYLpmVBm` repaired → pure test-lead + zz-test sink | GHL | live, verified |
| `shane@aivoiceagency.ai` freed off demo-lead row `P9ZrGdOL9087JJaI8unu` | GHL | live, verified |
| 5 owner-alert references repointed to n8n Variables | n8n | live, verified |
| Post-call owner SMS + owner email legs added | n8n | live, **proven** |
| Upsert guard + `cell` fix (post-call + book_appointment) | n8n | live, **proven** |
| `OPS — Error Sentry` built, activated, attached to 13 workflows | n8n | live, **proven** |
| 5 n8n Variables provisioned | n8n | live |
| `tools/n8n-owner-rail.mjs`, `tools/n8n-error-sentry.mjs`, `tools/run65-proof.mjs` | repo | committed |
| § 9 OWNER RAIL LAW | `CLAUDE.md` | committed |

**Voice: not touched.** **Nothing deactivated. Nothing deleted.** Quota headroom unchanged
at **85.6% PASS**.

## ROLLBACK — one line each

- **Owner alert target:** set n8n Variable `OWNER_ALERT_CONTACT_ID` back to
  `8zyowOdgNehLoYLpmVBm`. Every reference follows in one edit — that is the point of the
  variable.
- **Sentry:** `POST /api/v1/workflows/SlnAeMrVRORsF0w7/deactivate` (stops all alerting), or
  clear `settings.errorWorkflow` per workflow.
- **Upsert guard:** in `tools/n8n-owner-rail.mjs`, the `Is Our Number?` / `Test Contact` /
  `Contact Ref` nodes are additive — deleting the three nodes and restoring
  `Has Identifier → GHL Upsert Contact` reverts it.
- **Contacts:** full pre-change JSON for all three rows is at
  `C:\Users\offic\Desktop\ava-backups\run65-contacts-2026-07-26.json` (outside the repo).
- **Voice:** unchanged — the RUN 5 rollback in `reports/2026-07-25-run5-v37-flip.md` still
  applies verbatim.

## GOTCHAS WORTH KEEPING

1. **An inactive n8n error workflow never fires**, and reports no error while not firing.
2. **GHL `PUT` clears fields with `null`, not `""`** — empty string 422s.
3. **`begin_message` lives on the Retell-LLM object**, not the agent object.
4. **A brief can name the right id and the wrong value.** Re-fetch, then verify the *value*.
5. **n8n `$vars` resolves at runtime on this instance** — proven before it was depended on.
6. **`PUT /workflows/{id}` accepts `description`**, but settings must still be whitelisted.
7. **Retell binds `agent_version: "latest_published"` as a string**, not `null`.

## STILL OPEN — deferred by instruction

- GHL draft publishes + contact hygiene (Block F)
- Zombie disables (Block D-apply) — still needs the reference sweep
- `LIVE INTAKE v1` → `Grok Extract` "invalid syntax" (4 real failures)
- Retell agent-level `webhook_url` still points at chat-dash rather than n8n. Harmless
  today because an account-level webhook covers the n8n rail, but two rails means two
  things to reason about.
- Caller-facing `sms_message` renders `"Hi undefined"` when `custom_analysis_data` is
  empty. Cosmetic and currently unreachable (that node is disabled), but it is a live
  string in a disabled node.
