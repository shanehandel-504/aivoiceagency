# RUN — CALLBACK GATE (2026-09-06)

International revenue-share fraud against an auto-dial web form. Contained, gated, proven.

---

## THE INCIDENT

`call_54e89c60b6b97ae97170d0f4162` — AI Chauffeur agent `agent_2d1d687eb85e6d5d0e720795c2`,
outbound from the chauffeur line, **13m14s to a +44 121 number** at 2026-09-06 11:41Z.
Far end was a *"test call connected, you are all set to earn"* recording.

Cost, from Retell's own breakdown: **372.09 cost units total**, of which **132.33 was
`uk_twilio_telephony`**. The rest was LLM, TTS and voice-engine time spent talking to a robot.
It ran 13m14s and stopped only because the far end hung up — the agent's own ceiling was 15 min.

**One outbound call in the last 72h across the whole account. This was it.**

---

## THE CAUSE — not one bad form

The dialer is the **ACTIVE n8n workflow `AVA Layer 1 — Money Path Spine` (`u3FaLLiH0loGf1BN`)**,
webhook `POST /webhook/ava-call` → `Dial via Retell` (`/v2/create-phone-call`).

Three facts that together made this inevitable:

1. `Normalize Fields` returned `'+' + digits` for **any** input beginning with `+`.
2. **Both** brand forms validated with `/^\+[1-9]\d{7,14}$/` — every country on earth.
   `chauffeur/assets/aic.js` *and* `site.js`. Two brands, one webhook, one hole.
3. No rate limit, no server-side consent check, no bot check.

An overseas number was never an edge case. It was the happy path.

---

## THE BRIEF SAID "IN REPO OR GHL". IT WAS NEITHER.

The brief's step 2 branched on *"if it's in the repo, gate it in place; if not, report
'dialer is not in repo — GHL automation' and build WF-CALLBACK-GATE that the form calls
instead of Retell."*

Reality was a third thing: **the dialer is n8n, and the form that feeds it is in the repo.**

That matters, because building a *separate* `WF-CALLBACK-GATE` for the form to call would
have left `ava-call` **live, public and ungated** — a bot POSTing it directly bypasses the
new gate entirely. So the gate went in **at the chokepoint, inside the dialer**, in front of
`Dial via Retell`, where every path must cross it. Same name, better placement.

---

## WHAT SHIPPED

### Server — the actual defence

`CALLBACK GATE` (Code node) + `Recent Allowed Lookup` + `Gate Allowed?` + `Gate Log` +
`Gate Alert Owner` + `Respond Blocked`, inside `u3FaLLiH0loGf1BN`.
**Fails closed.** Rules, in order:

| # | Rule |
|---|---|
| 1 | `company_url` honeypot must be empty |
| 2 | `tcpa_consent === true` — absent is a block |
| 3 | E.164 shape |
| 4 | **`+1` only** — the line the fraud crossed |
| 5 | Structurally valid NANP (NPA and NXX both lead 2–9) |
| 6 | Not 900 / 976 |
| 7 | Not one of the 20 Caribbean revenue-share NPAs — *these read as domestic because they are +1* |
| 8 | Not toll-free |
| 9 | Never one of our own lines (§ 9) |
| 10 | One outbound per number per 24h |

Every attempt writes to data table **`callback_gate_log`** (`1HwLwaFTwsyp6cV0`) with verdict,
reason, destination class, IP and UA. A block also fires a **status-led owner SMS** on the
Error Sentry's own GHL rail (`OWNER_ALERT_CONTACT_ID` / `OWNER_SMS_FROM`, credential
`GHL Header Auth`) — first word is `BLOCKED`, readable from a lock screen.

### Client — courtesy, not defence

`site.js` and `chauffeur/assets/aic.js`: same rules, plus a JS-injected off-screen honeypot
(built in JS so all ten chauffeur pages get one and no page can ship the form without it),
plus 403-specific copy so a refusal never reads as an outage. Anything here is skipped by
POSTing the endpoint directly — which is exactly what a bot does. It exists so a human who
mistypes is told instantly instead of waiting on a phone that never rings.

### Retell — drafts only, NOT published

| Agent | Draft | `max_call_duration_ms` | `end_call_after_silence_ms` | Published (unchanged) |
|---|---|---|---|---|
| AI CHAUFFEUR `…95c2` | v28 | 900000 → **720000** | absent → **60000** | v27 |
| Reliable `…4b5` | v29 | 3600000 → **720000** | absent → **60000** | v28 |

Read back and asserted on the **value**, because Retell silently accepts unknown field names
and returns 200 — with `end_call_after_silence_ms` previously absent there was no before-value
to diff, so a typo would have been invisible. **Shane publishes.**

---

## PROOF

| Check | Result |
|---|---|
| Gate live-fire vs **production** | **5/5 blocked**, correct reason each: UK, Caribbean +1 876, 900, absent TCPA, filled honeypot |
| Log rows written | 10 rows (both runs), verdict + reason + dest_class + IP |
| Client gate, real browser, chauffeur | UK rejected, Caribbean rejected, valid US accepted, honeypot injected + off-screen |
| Client gate, real browser, parent | UK / Caribbean / 900 / toll-free all rejected with correct copy |
| 390×844 and desktop | 0 console errors, 0 horizontal overflow, both hosts |
| n8n published | `versionId === activeVersionId` = `82bd9f69-…`; `errorWorkflow` still `SlnAeMrVRORsF0w7` |
| Retell drafts | verified `720000` / `60000`; published still v27 / v28 |
| Outbound calls, 72h, after | still **1** — no new outbound |
| Production JS | `CARIBBEAN_NPA` present on both `aichauffeur.ai/assets/aic.js` and `aivoiceagency.ai/site.js` |

---

## FIVE THINGS THE BRIEF COULD NOT HAVE KNOWN

1. **There is no platform switch to throw.** All 8 numbers are `retell-twilio`
   **Retell-provisioned** (not imported), `custom_sms_enabled: false` on every one, and the
   API exposes **no per-number outbound or international control at all**.
   `allowed_inbound_country_list` is **inbound only** (`["US"]` on 8930 and 0019).
   My own recon script got this wrong first: it read the `sip_outbound_trunk_config` object
   as an import marker, but Retell returns that object (`termination_uri` / `transport` /
   `auth_username`) on **every** number as its own SIP plumbing, so `{}` is truthy and the
   heuristic printed `IMPORTED` on all 8. Corrected before commit.

2. **The first live-fire found a real defect.** All five cases returned 403 with an **empty
   reason**. `Respond Blocked` sat downstream of the SMS node, so its `$json` was the GHL API
   response, not the gate verdict — a node receives only its immediate predecessor's output.
   The blocking worked; the explanation didn't, and only a live test could tell them apart.

3. **The parent AVA form had the identical hole.** This was never a chauffeur-only defect —
   the fraud could have arrived through aivoiceagency.ai just as easily.

4. **Board law nearly produced a false alarm.** The written-file assertion tripped on two
   *pre-existing* log rows that quote the retired numbers inside an older laws-check. Those
   are the historical ledger and are not retro-edited; the assertion was scoped to this run's
   own rows instead, so it stays meaningful rather than permanently red.

5. **The first board write destroyed ~8.7k chars of L2 lane history** by assigning over the
   note instead of prepending. Invisible in the tool output; only the git diff showed it.
   Restored from `HEAD` and the script now follows the file's own `| PREV:` chain.

---

## NOT DONE — deliberately

- **Retell agents not published.** Drafts only, per the brief. The phone still serves v27 / v28.
- **Cloudflare Turnstile is NOT live.** No site key and no secret exist on this account. The
  gate **records** `turnstile_token` and never trusts it; its absence is never a reason to
  allow. Enabling it is in the T-item.
- **Owner alert is SMS, not email.** The brief said "emails Shane"; the rail's proven alert
  path is the GHL SMS the Error Sentry already uses, with the same variables and credential.
  Email would have been an untested node on a security path. Say the word and it becomes both.
- **T-OUTBOUND-IDENTITY not executed** — scoped only, filed `pending` on the board.

---

## T-ITEM — SMS / caller ID (SCOPED, NOT EXECUTED)

| Step | Cost | Time |
|---|---|---|
| Twilio A2P 10DLC brand + campaign vet | ~$4 brand + ~$15 campaign one-time, ~$1.50–10/mo | 1–3 business days; up to 3–4 weeks if the brand vet is appealed |
| Number(s) | ~$1.15/mo each | same day |
| CNAM registration → "AI CHAUFFEUR" | ~$0.30–1.00/mo per number + one-time set fee | 5–10 business days to propagate, **never guaranteed on every carrier** |
| Import to Retell as outbound/SMS line | — | same day once 10DLC clears |
| Cloudflare Turnstile (site key + `TURNSTILE_SECRET`) | free | same day |

**Total ≈ $20–25 one-time, $5–15/mo, 3–5 business days of real elapsed time** gated on the
10DLC vet, with CNAM display trailing 1–2 weeks behind. CNAM is a best-effort database, not a
display promise — do not sell it as one. **None of this is required to hold the fraud gate;
the gate is already live without it.**

---

## ROLLBACK

| Thing | Rollback |
|---|---|
| n8n gate | Publish version `5f891259-c517-410a-a85e-0801644d1e91` (the pre-gate spine) |
| Repo | `git revert a503448` |
| Retell drafts | Nothing to roll back — never published |
