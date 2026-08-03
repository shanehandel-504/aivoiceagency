# AI CHAUFFEUR — VOICE + AUTOMATION STATE

Verified against the live APIs on **2026-08-03 (RUN 2)**. Every row below was fetched, not
read out of a brief. Re-verify and re-stamp the date before citing any of it.

## The line

| | |
|---|---|
| Number | **+1 (414) 775-0019** — the AI Chauffeur demo/inbound line |
| Retell agent | `agent_8e9e7d477949c6babcbdcc756d` ("Single-Prompt Agent") |
| Bound as | `inbound_agents[0]`, weight 1 |

### Versions — V13 live, V14 unpublished

| | |
|---|---|
| Versions that exist | 0–14 |
| Published | 0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, **13** |
| **Serving the phone** | **V13** (latest published) |
| Unpublished | **14** (the current draft) and 2 |

**V14 is authored but not published, so it is not what answers the phone.** A Retell number
serves `latest_published`; `get-agent` returns the *draft*. Reading V14 back from the API and
concluding "that's what callers hear" is the exact trap recorded in
`retell-api-traps-8930-tune`. Publishing V14 is a deliberate act, not a side effect of editing.

The phone-number record carries **no explicit `agent_version` pin** on this line — it resolves
`latest_published` implicitly. Pinning a version would freeze the line against future publishes.

### Scope law

`+14147750019` is a *different agent* from the AVA parent line `414-240-8930`
(`agent_d5ada9f774fe3ae7f034d2c677`). Assert they are distinct before any agent write. They share
the same Retell account and an edit to the wrong id changes the wrong brand's phone.

---

## Endpoints on the wire

| Endpoint | Workflow | State |
|---|---|---|
| `POST /webhook/tools/rate-lookup` | WF-RATE `2JlTkvQ1dGiwwjw9` | live · 47/47 |
| `POST /webhook/tools/ani-lookup` | WF-ANI `XLSd3vt41vhsXIA9` | live · 27/27 |
| `POST /webhook/tools/commit-reservation` | WF-COMMIT `O1fX0FpbT0qqMnqJ` | live · 36/36 |
| `POST /webhook/aic-write-reservation` | AIC write_reservation `vAPSLlSjSUzoO0pg` | live (v1.2, predecessor) |

**None of the three tools/* endpoints is called by the agent yet.** V13's prompt does not register
`rate_lookup`, `ani_lookup` or `commit_reservation` as custom functions. The spine is built and
signed; wiring it into the agent prompt is a separate, deliberate publish.

---

## PORT PLAN STUB — missed-call text-back, GHL → n8n

**Current owner:** GHL workflow `01_AVA_Missed_Call_Text_Back`
(`32fdabca-9c16-41d2-8c05-f7165a9b50a8`, **published**).

### The trigger gap — why this is not a straight lift

There is **no `call_failed` / no-answer webhook available to build off.** Verified 2026-08-03:

- **Retell emits nothing usable here.** Retell fires `call_started` / `call_ended` /
  `call_analyzed` only for calls it *answers*. A missed call is by definition a call that never
  reached Retell, so no Retell event exists for it. There is no `call_failed` event type.
- **GHL owns the signal.** The missed-call trigger is a GHL-native call event on the contact
  timeline. GHL's public workflow API is **read-only** (every write route 404s) and triggers are
  not even readable, so the trigger cannot be moved or inspected via API.

### Recommended shape — thin relay, fat n8n

Move the *logic* to n8n and leave only the *trigger* in GHL:

1. In the GHL UI, reduce `01_AVA_Missed_Call_Text_Back` to one action: a **webhook POST** to a new
   n8n endpoint `POST /webhook/hooks/missed-call`, carrying `{contact_id, phone, direction,
   call_status, timestamp}`.
2. Build `WF-MISSED` in n8n: signed the same way as WF-RATE/ANI/COMMIT, `OUR_NUMBERS` guard so our
   own lines never trigger a text-back (§ 9), first-touch-only `Reply STOP to opt out`, one job per
   message, CTA varied across the sequence (MESSAGE FORMAT LAW).
3. Cut over by pausing the GHL workflow's message actions **after** WF-MISSED proves out — not
   before. Memory records a paused GHL workflow coming back published on its own, so verify state
   after the change and again a day later.

**This step is documented, not built.** It needs UI work in GHL that the API cannot perform, and
building the n8n half before the trigger relay exists would ship a dead endpoint.

### Blockers to clear first
- GHL UI edit to `01_AVA_Missed_Call_Text_Back` (Shane — API cannot do it)
- Decide whether text-back applies to the AVA parent line, the chauffeur line, or both
