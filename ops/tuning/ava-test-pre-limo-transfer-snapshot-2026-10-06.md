# AVA TEST agent — as-built snapshot before the limo-transfer prep

Read 2026-10-06T22:15:29.439Z (Oct 6 2026, 5:15 PM Central), before any write of the run CC-AVA-LIMO-TRANSFER-PREP-v1.
Every value below was read from Retell or n8n at that moment, not copied from an earlier report.
Nothing sensitive is in this file: no key, no header value, no webhook path, no private number, no email, no caller name.
Tool addresses are shown as the workflow they land on. Phone lines other than the two public ones are last four digits only.

What changed after this read is in `reports/2026-10-06-ava-limo-transfer-prep.md`.

## a. AVA TEST agent

- Agent `agent_44b48507d38c0bfc29a3150a74` "AVA SALES v37 TEST". Versions: `0P,1P,2P,3P,4P,5P,6D,7P,8P` (P = published, D = draft). **Newest published: v8.** v6 is the unpublished sim-only harness and stays unpublished.
- Brain: LLM `llm_eb67ba951ee28c1eec75c960e0ee` at version 8 (gpt-4.1, temperature 0.2, strict tool calls true, knowledge base: none).
- System prompt: 5,271 characters, 5,283 bytes. **SHA-256 `2b212b0ba67206ba471cdac2cf776366a956caba82eeca41a591931fc3a3b27a`** — equal to the expected value, so the run could start.
- First words: `begin_message` = `{{opening_line}}`, start speaker = agent.
- Version title of v8: "v7 + rotated booking header (paste 34, 2026-10-01); nothing else changed".

### Default dynamic variables (1)

| Key | Value |
|---|---|
| `opening_line` | AI Voice Agency, this is AVA. I answer every call and book the job for service businesses. What kind of business do you run? |

### Tools (4), in order

**end_call** (`end_call`)

```json
{
  "description": "End the call when the caller says bye, is done, or you are instructed to close.",
  "name": "end_call",
  "speak_after_execution": true,
  "type": "end_call"
}
```

**get_open_slots** (`custom`)

```json
{
  "description": "Look up the next open discovery-call times on the calendar. Returns slots_status, slot_1 and slot_2 (spoken form, timezone included), slot_1_iso and slot_2_iso (pass one of these to book_slot), timezone, and caller_phone_last4. slots_status other than OK means no times could be read.",
  "headers": "(header names only) x-sales-cal-secret",
  "method": "POST",
  "name": "get_open_slots",
  "parameters": {
    "properties": {
      "requested_time": {
        "description": "A time the caller named for the call, in their words, e.g. 'Tuesday at 3 PM'. Empty when the caller has not named one.",
        "type": "string"
      }
    },
    "type": "object"
  },
  "speak_after_execution": true,
  "speak_during_execution": false,
  "timeout_ms": 5000,
  "type": "custom",
  "url": "(n8n webhook → WF-AVA-SALES-CAL fMwY56uNlJaDzkcd)"
}
```

**book_slot** (`custom`)

```json
{
  "description": "Book one discovery call at a time the caller said yes to. Returns status BOOKED with appt_date, appt_time, appt_timezone, appointment_time and phone_last4, or status FAILED with a reason. Only BOOKED means the call is on the calendar.",
  "headers": "(header names only) x-sales-cal-secret",
  "method": "POST",
  "name": "book_slot",
  "parameters": {
    "properties": {
      "business_type": {
        "description": "The caller's type of business, if known.",
        "type": "string"
      },
      "caller_name": {
        "description": "The caller's name, if they gave it.",
        "type": "string"
      },
      "caller_phone": {
        "description": "A callback number the caller gave, only when the call has no caller ID.",
        "type": "string"
      },
      "slot_iso": {
        "description": "The exact slot_1_iso or slot_2_iso value returned by get_open_slots for the time the caller accepted.",
        "type": "string"
      }
    },
    "required": [
      "slot_iso"
    ],
    "type": "object"
  },
  "speak_after_execution": true,
  "speak_during_execution": false,
  "timeout_ms": 10000,
  "type": "custom",
  "url": "(n8n webhook → WF-AVA-SALES-CAL fMwY56uNlJaDzkcd)"
}
```

**handoff_to_desk** (`agent_swap`) — complete config as read

```json
{
  "agent_id": "agent_e41b2e957f1de46cf23dc25a84",
  "agent_version": "latest_published",
  "description": "Hand the live call to the AI Chauffeur desk so the caller hears it take a trip right now. Call it only after the caller chose to hear it now and the handoff bridge line was spoken. If the result is not successful, the handoff did not happen and the caller is still with you: continue with get_open_slots and the booking offer.",
  "keep_current_language": false,
  "keep_current_voice": false,
  "name": "handoff_to_desk",
  "post_call_analysis_setting": "both_agents",
  "speak_after_execution": true,
  "speak_during_execution": false,
  "type": "agent_swap",
  "webhook_setting": "both_agents"
}
```

The handoff before this run: `handoff_to_desk` swaps to `agent_e41b2e957f1de46cf23dc25a84` ("AI CHAUFFEUR — CAPTURE DESK") at `latest_published`.

### Speech and call settings

| Setting | Value |
|---|---|
| Voice | cartesia-Kate · model sonic-3-latest · speed 1 · temperature 0.7 · volume 1 |
| Language | en-US |
| Interruption sensitivity | 0.9 |
| Responsiveness | 1 · dynamic true |
| Dynamic voice speed / expressive mode | true / true |
| Backchannel | on · frequency 0.35 · words: got it, understood, right, makes sense, mm-hm |
| Silence reminder | 8000 ms × 1 |
| Silence hang-up | 20000 ms |
| Longest call | 600000 ms (10 minutes) |
| Begin message delay / ring | 0 ms / 69000 ms |
| Ambient sound | none set (volume field reads 0.08) |
| Noise handling / speech-to-text | noise-cancellation / fast · vocabulary general |
| Handbook | speech_normalization off · ai_disclosure ON · nato_phonetic_alphabet off · scope_boundaries ON · high_empathy off · smart_matching ON · natural_filler_words off · default_personality off · echo_verification off |
| Keypad | caller keypad allowed true · keypad interrupts false |
| Boosted keywords | 20: limousine, limo, black car, chauffeur, chauffeured, car service, livery, sedan, town car, fleet, charter, motorcoach, shuttle, AI Chauffeur, Limo Anywhere, GNet, dispatch, transportation, discovery call, AI Voice Agency |
| Voicemail | fixed text (the AVA voicemail line, names 414-240-8930) |
| Storage / PII | everything / {"mode":"post_call","categories":[]} |
| Time zone | America/Chicago |
| After-call analysis | gpt-4.1: call_summary, caller_first, caller_email, caller_phone, business_name, call_successful, user_sentiment, industry, handoff_attempted |

### Webhook

- Agent webhook → **ZZ SINK `hF7cxEn0SuVaEnnL`** (the ZZ sink: active, serving `d45e3d46`, Error Sentry attached). Expected, and true.
- Events sent: call_started, call_ended, call_analyzed, transfer_started, transfer_bridged, transfer_cancelled, transfer_ended.

## b. Live AVA agent (read only)

- `agent_d5ada9f774fe3ae7f034d2c677` "AVA — AI Voice Agency". 414-240-8930 inbound: `agent_d5ada9f774fe3ae7f034d2c677` "AVA — AI Voice Agency" @ latest_published → **serving v49** (follows the newest published version). Outbound: `agent_d5ada9f774fe3ae7f034d2c677` "AVA — AI Voice Agency" @ latest_published.
- The number has an inbound webhook → WF-ANI-AVA `ITGRwcRKxLgmKnBZ` (caller lookup; it hands AVA its per-call variables).
- Agent webhook (v49) → AVA Post-Call to GHL (Demo Send) `6r8YHuMEJbxeDyT5`.
- Version list, 51 versions, newest published v49:

```
0P,1P,2P,3P,4P,5P,6P,7P,8P,9P,10P,11P,12P,13P,14P,15P,16P,17P,18P,19D,20P,21P,22P,23P,24P,25P,26P,27P,28P,29P,30P,31P,32P,33P,34P,35P,36D,37P,38P,39P,40P,41P,42P,43P,44P,45P,46P,47D,48P,49P,50D
```

## c. 414-775-0019 (read only)

- Inbound: `agent_9ebb41c9bd8af214649328f107` "AIC-LIVE two-door" @ version 13 (pinned). Outbound: `agent_e41b2e957f1de46cf23dc25a84` "AI CHAUFFEUR — CAPTURE DESK" @ latest_published. Number record last changed 2026-10-02T17:18:56.288Z.
- Inbound webhook on the number: **none** (so a direct 0019 call gets no per-call variables from n8n).
- Two-door agent `agent_9ebb41c9bd8af214649328f107` "AIC-LIVE two-door": versions `0P,1P,2P,3P,4P,5P,6P,7P,8P,9P,10P,11P,12P,13P`. Flow `conversation_flow_9cf4ddd5b734` v13, 222 nodes, start node `ch_split`, start speaker agent.
- Agent webhook → DEMO POST-CALL RAIL v1 (all demo agents) `TkETvvnABhUPd7ME`. Events: call_started, call_ended, call_analyzed.
- Longest call 12 minutes · silence reminder 10000 ms × 2 · silence hang-up 20000 ms · voice cartesia-Kate · responsiveness 0.7 · interruption 0.9.

### Flow default dynamic variables (5)

| Key | Value |
|---|---|
| `zz_sim_phone` | `false` |
| `charter_lines_live` | `true` |
| `is_demo` | `true` |
| `door_now` | `demo` |
| `channel` | `phone` |

### What the start node `ch_split` reads

- It is a code node. It reads two variables: `channel` and `user_number`.
- `channel`: exactly `browser` → browser; **anything else, a missing value included → phone**.
- `user_number` (Retell's own variable, the caller's number on a phone call): 10 or more digits on the phone channel → the call "has a caller number".
- Its one edge: `{{channel}} == browser` → `n01_b` (browser greeting). Else → `n01_p` (phone greeting).
- It also resets 45 of the flow's own variables (`is_demo`, `door_now`, `caller_phone`, `transfer_open`, `booking_state` and the rest), so those start clean on every call.

## d. Phone numbers (8)

| Line | Inbound | Outbound | Inbound webhook | Record last changed |
|---|---|---|---|---|
| …0019 | `agent_9ebb41c9bd8af214649328f107` "AIC-LIVE two-door" @ version 13 (pinned) | `agent_e41b2e957f1de46cf23dc25a84` "AI CHAUFFEUR — CAPTURE DESK" @ latest_published | no | 2026-10-02T17:18:56.288Z |
| …1886 | `agent_d5ada9f774fe3ae7f034d2c677` "AVA — AI Voice Agency" @ latest_published | `agent_67381fcfabf6731dad4f40c590` "AVA HEAR-IT-LIVE v1" @ latest_published | no | 2026-07-23T01:25:52.765Z |
| …5008 | `agent_e41b2e957f1de46cf23dc25a84` "AI CHAUFFEUR — CAPTURE DESK" @ latest_published | `agent_e41b2e957f1de46cf23dc25a84` "AI CHAUFFEUR — CAPTURE DESK" @ latest_published | no | 2026-09-28T13:56:49.189Z |
| …6409 | `agent_d5ada9f774fe3ae7f034d2c677` "AVA — AI Voice Agency" @ latest_published | `agent_67381fcfabf6731dad4f40c590` "AVA HEAR-IT-LIVE v1" @ latest_published | no | 2026-07-23T01:25:21.314Z |
| …6486 | `agent_d5ada9f774fe3ae7f034d2c677` "AVA — AI Voice Agency" @ latest_published | `agent_67381fcfabf6731dad4f40c590` "AVA HEAR-IT-LIVE v1" @ latest_published | no | 2026-07-23T01:25:36.002Z |
| …8042 | `agent_d5ada9f774fe3ae7f034d2c677` "AVA — AI Voice Agency" @ latest_published | `agent_67381fcfabf6731dad4f40c590` "AVA HEAR-IT-LIVE v1" @ latest_published | no | 2026-07-23T01:25:04.823Z |
| …8930 | `agent_d5ada9f774fe3ae7f034d2c677` "AVA — AI Voice Agency" @ latest_published | `agent_d5ada9f774fe3ae7f034d2c677` "AVA — AI Voice Agency" @ latest_published | yes | 2026-08-18T16:50:04.590Z |
| …8976 | `agent_44b48507d38c0bfc29a3150a74` "AVA SALES v37 TEST" @ latest_published | `agent_cfc97001055d3a5e377d0979d7` "ZZ-PROBE-36" @ no version set (serves the newest published) | no | 2026-10-01T23:00:11.206Z |

0019 and 8930 are the public lines. 8976 is the probe line (pool line 5); 8042, 6409, 6486 and 1886 are pool lines 1 to 4; 5008 is the Reliable test line.

## e. n8n, read from the serving versions

Found by following the agents' own addresses: each Retell webhook and tool address was read from Retell and matched to the serving webhook node that owns that path.

| Retell address | Lands on (workflow) | Serving version |
|---|---|---|
| AVA TEST agent webhook | ZZ SINK `hF7cxEn0SuVaEnnL` | `d45e3d46` |
| AVA TEST tools get_open_slots, book_slot | WF-AVA-SALES-CAL `fMwY56uNlJaDzkcd` | `0968c734` |
| Live AVA agent webhook (v49) | AVA Post-Call to GHL (Demo Send) `6r8YHuMEJbxeDyT5` | `e0454827` |
| 8930 inbound webhook | WF-ANI-AVA `ITGRwcRKxLgmKnBZ` | `b67ac140` |
| Two-door agent webhook | DEMO POST-CALL RAIL v1 (all demo agents) `TkETvvnABhUPd7ME` | `c7bd86fd` |
| Two-door tools get_open_slots, book_slot, team_alert | WF-AIC-SALES-CAL `TLoF7bzuPYy1NAW1` | `14bce088` |
| Old desk agent webhook | DEMO POST-CALL RAIL v1 (all demo agents) `TkETvvnABhUPd7ME` | same |
| Briefing agent webhook | ZZ SINK `hF7cxEn0SuVaEnnL` | same as the ZZ sink |

All eight are active, draft = serving, Error Sentry `SlnAeMrVRORsF0w7` attached.

### Booking workflow `TLoF7bzuPYy1NAW1` (serving `14bce088-2e05-4b7e-a2e9-dc3ab8507312`)

- `Slots Webhook` → `Slots Auth?`: the secret header only. No agent check, no line check.
- `Book Webhook` → `Book Input`: `ALLOWED` = `agent_2d1d687eb85e6d5d0e720795c2`, `agent_e41b2e957f1de46cf23dc25a84`, `agent_9ebb41c9bd8af214649328f107`. `Book Allowed?` passes only an allowed agent, not a sim, with a slot and a call id. Anything else → `Block Reason` (`agent_not_allowed` for an agent that is not on the list).
- `Alert Webhook` → `Alert Input`: `ALLOWED` = `agent_2d1d687eb85e6d5d0e720795c2`, `agent_e41b2e957f1de46cf23dc25a84`, `agent_9ebb41c9bd8af214649328f107`. `Alert Allowed?` passes only an allowed agent, not a sim; then the owner text and email go out.
- Neither list holds the AVA TEST agent or the live AVA agent. No node checks the number that was dialled.
- (`agent_2d1d687eb85e6d5d0e720795c2` is the retired first AI Chauffeur flow agent; `agent_e41b2e957f1de46cf23dc25a84` the old desk; `agent_9ebb41c9bd8af214649328f107` the two-door agent.)

### Team alert and live connect

- Team alert = the `team_alert` tool → the `Alert Webhook` branch above. Its only agent check is that `ALLOWED` list.
- Live connect = the flow's own transfer node `tr_call`: a warm transfer to the team's number with the briefing agent `agent_63db656e3a68b737fe61cb78db` at `latest_published` on the team's leg. No n8n workflow sits in the connect itself.
- Whether the connect is offered is decided inside the flow (`tr_closed`: a phone call, 7 AM to 9 PM Central). No agent-id or line check there.

### AI Chauffeur post-call rail `TkETvvnABhUPd7ME` (serving `c7bd86fd-f70f-4eb6-b49a-a17fc40541f5`), node `Build Trip Ticket`

| Tenant map entry | Name | Mode |
|---|---|---|
| `agent_367be6cf3c722e89fca03e34b5` | Reliable Limo & Charter | CAPTURE-ONLY |
| `agent_2d1d687eb85e6d5d0e720795c2` | AI Chauffeur | RATE CARD |
| `agent_e41b2e957f1de46cf23dc25a84` | AI Chauffeur | CAPTURE-ONLY |
| `agent_9ebb41c9bd8af214649328f107` | AI Chauffeur | CAPTURE-ONLY |

- Desk list (line 742): `CAPTURE_DESK_AGENTS` = `agent_e41b2e957f1de46cf23dc25a84`, `agent_9ebb41c9bd8af214649328f107`.
- AVA agents (line 266): `agent_d5ada9f774fe3ae7f034d2c677`, `agent_44b48507d38c0bfc29a3150a74`.
- `AVA_LINES` (n8n Variable, present): six lines — 8930, the probe line 8976 and pool lines 1886, 6486, 6409, 8042.
- **Does the serving version file a handed-off call as the AI Chauffeur demo, marked "via AVA line", with 414-775-0019 as the callback number? Yes.** Line 269: a call whose agent id is an AVA agent, or whose dialled number is an AVA line, is "via AVA". Line 271: it then takes the same tenant entry as the two-door agent (AI Chauffeur, CAPTURE-ONLY) plus the mark. Line 743: the desk number printed is 414-775-0019, never the line dialled. The ticket, the owner text, the email subject and the "Line" row all carry "via AVA line"; the GHL contact gets the tag `via-ava-line` (node `Tag Caller`).

### AVA post-call rail `6r8YHuMEJbxeDyT5` (serving `e0454827-2e28-4144-8594-00189fad75b6`)

- **Does it stand down on a handed-off call? Yes.** Node `Quarantine Gate` sets `handoff_swapped` when the desk's variables are on the call, or the `handoff_to_desk` tool reported success, or the analysis says a handoff was attempted and no tool failure shows. Node `Build Text Back` then stops ("the desk texts the trip sheet"), so AVA sends the caller nothing.
- On such a call it still files the lead (tags `ava-demo-hot`, `ava-handoff-aic`) and sends the owner one alert headed HANDOFF TO DESK.
- The check keys on the tool name `handoff_to_desk`. The name must not change.
- The Sep 26 build report recorded this rail serving `e08eb55f`; live is `e0454827` (a Sep 28 run made its owner-contact step read-only). The live system wins, and the stand-down code is in the live version.

### Other

- `WF-POSTCALL-AVA · 8930 Call Wrap` `kpYlhLbwSD0W1sE0` is active and has a caller-copy branch, but it has no executions on record: no Retell address posts to it.
- n8n Variables present (names only): AIC_REPLY_LINE, AVA_LINES, CHATDASH_URL, OUR_NUMBERS, OWNER_ALERT_CONTACT_ID, OWNER_ALERT_EMAIL, OWNER_CELL, OWNER_SMS_FROM, RATE_SHARED_SECRET, SALES_CAL_SECRET, ZZ_TEST_CONTACT_ID.

