# AI CHAUFFEUR 0019 — PRE-TWO-DOOR SNAPSHOT (2026-09-30)

> **READ ONLY.** Snapshot of the published agent answering the AI Chauffeur demo line (414-775-0019), taken before the
> two-door + slow-talker build on the TEST agent. Source: Retell API `GET /v2/list-phone-numbers`, `GET /list-agent-versions/{id}`,
> `GET /get-agent/{id}?version=4`, `GET /get-conversation-flow/{id}?version=4`. Pulled Sep 30, 2026, 8:26 PM CT.
> Nothing was changed on the live agent, its number, its webhook or the n8n rail. Secret values, webhook paths and private numbers are
> left out on purpose; the full JSON stays off the public repo.

Agent `agent_e41b2e957f1de46cf23dc25a84` "AI CHAUFFEUR — CAPTURE DESK" · conversation flow `conversation_flow_c3c710be6c94` (pinned v4).

## The greeting (byte-exact — this is what the test agent must keep)

Phone (`n01_p`):

```
AI Chauffeur, the premium reservation system for limousine, black car and chauffeured transportation. This is the demo line. Play the customer and request a trip. Calls are recorded and transcribed. Which trip would you like to try — airport, point to point, or by the hour.
```

Browser (`n01_b`, the site's Try button):

```
AI Chauffeur, the premium reservation system for limousine, black car and chauffeured transportation. This is the AI Chauffeur demo. Play the customer and request a trip. Which trip would you like to try — airport, point to point, or by the hour.
```

SHA-256 of the phone greeting: `6d9d1162bb841a01ae46d52a9812b79bc1b47212baef4fac21acb5c0c86dac86`

## Versions and binding

| Item | Value |
|---|---|
| Versions | v0 · v1 · v2 (draft) · v3 · v4 |
| Serving 0019 | **v4** — "Desk v4 — slow-talker wait + sedan/SUV ask (2026-09-30)" · last modified Sep 30, 2026, 2:12 PM CT |
| 0019 inbound | `agent_e41b2e957f1de46cf23dc25a84` @ latest_published |
| 0019 outbound | `agent_e41b2e957f1de46cf23dc25a84` @ latest_published |
| Response engine | conversation flow `conversation_flow_c3c710be6c94` v4 · 106 nodes · start `ch_split` · start speaker agent |

## Settings

| Field | Live value |
|---|---|
| Model | gpt-4.1 (cascading, high priority true) · temperature 0.15 · tool_call_strict_mode true · post-call analysis model gpt-4.1 |
| Voice | cartesia-Kate · voice_model sonic-3.6 · temperature 0.72 · speed 1 (dynamic voice speed true) · volume 1 · language en-US |
| responsiveness | 0.7 · enable_dynamic_responsiveness true |
| interruption_sensitivity | 0.82 |
| Backchannel | enable_backchannel true · backchannel_frequency 0.35 · words (default) |
| reminder_trigger_ms / reminder_max_count | 8000 / 0 |
| end_call_after_silence_ms | 20000 |
| max_call_duration_ms | 720000 |
| Denoising | noise-cancellation |
| DTMF | allow_user_dtmf true · user_dtmf_options {} |
| boosted_keywords | Kewaskum, West Bend, Hartford, Slinger, Jackson, Germantown, Menomonee Falls, Milwaukee, Madison, Green Bay, O'Hare, Midway, Mitchell, FBO, Signature Flight Support, Atlantic Aviation |
| pronunciation_dictionary | AVA → ˈeɪvə (ipa) |
| Handbook | ON: scope_boundaries, speech_normalization, smart_matching, ai_disclosure · OFF: conversational_personality, default_personality, nato_phonetic_alphabet, natural_filler_words, echo_verification, high_empathy |
| Other | channel voice · timezone America/Chicago · data_storage everything · pii {"mode":"post_call","categories":[]} · contact memory {"enable_update":false,"enable_read":false} · opt_in_signed_url false |
| Post-call webhook | host `circulant.app.n8n.cloud` (the AI Chauffeur post-call rail in n8n; path withheld) |
| Knowledge base | none attached (kb_config {"filter_score":0.6,"top_k":3}) |
| Flow defaults | default_dynamic_variables {"channel":"phone","is_demo":"true","charter_lines_live":"true"} |

## Global prompt (verbatim, 1639 characters, SHA-256 `a5a572de4797319e01fbccd1d5e39f57c406c78f8e4057b2dde707c26b4066ae`)

```
You are AI Chauffeur, a premium reservation system for limousine, black car and chauffeured transportation running a demo where the caller plays the customer. Your only job is to capture the trip request. If the caller pauses mid-answer, wait. Never answer a half-sentence. If a required item is still missing after the caller finishes, ask for that one item only. Never quote or estimate a fare. Never look anything up. Never take payment. Never promise a chauffeur is assigned or a vehicle is available. Ask the bundled questions exactly as written. Never split them. Never repeat an answer back mid-trip. Ask for a field only if the caller has not already given it. One question per turn. When the caller corrects anything accept it immediately and continue from the corrected detail. On fare questions give the fare line and return to the pending question. On product-price questions give the price line and offer the setup call. Refer only to the team never owner or any person's name. If the caller asks for the owner someone or a person treat it as a request for the team. Speak airports by name never by code. Speak numbers naturally. Use short sentences. No lists. No filler. Never ask if the caller is still there. Mention the recording only in the opening. If challenged use the objection lines. Offer only the times the calendar tool returned. Say a time is booked only after the tool confirms. On failure use the failure line. Do not volunteer that it is AI. Never deny it if asked. Give one truthful beat then return to the trip. When the caller goes quiet speak only the approved silence line and never improvise a check-in.
```

## Tools on the flow

| Tool | Type | Call | Timeout | Sends | Returns into the flow |
|---|---|---|---|---|---|
| `get_open_slots` | custom | POST → `circulant.app.n8n.cloud` (path withheld) · header names: x-sales-cal-secret | 3000 ms | query: call_id · args: requested_time | slots_status, slot_2_iso, slot_1, slot_1_iso, slot_2 |
| `book_slot` | custom | POST → `circulant.app.n8n.cloud` (path withheld) · header names: x-sales-cal-secret | 8000 ms | query: real_name, company, call_id, slot_iso, caller_phone · args: — | appt_timezone, appointment_time, appt_date, book_reason, appointment_booked, appointment_id, book_status, appt_time |
| `team_alert` | custom | POST → `circulant.app.n8n.cloud` (path withheld) · header names: x-sales-cal-secret | 2000 ms | query: company, name, topic, call_id, phone · args: — | — |

- `get_open_slots`: Reads the next open setup-call times from the AI Chauffeur calendar. Pass requested_time only when the caller named a specific time for the call.
- `book_slot`: Books the chosen setup-call time on the AI Chauffeur calendar. Idempotent per call and slot.
- `team_alert`: Tells the team right away that a caller on the demo wants to talk. Fire and forget.

## Post-call analysis fields (24)

| Field | Type | Description |
|---|---|---|
| `trip_type` | enum [arrival, departure, point_to_point, hourly] | Copy the flow's own trip type, never re-derive it from the conversation: the flow recorded '{{trip_type}}' (arrival = arrival, departure = departure, p2p = point_to_point, hourly = hourly). |
| `is_charter` | boolean | Copy the flow's value '{{is_charter}}': true only when it is true (the caller described a charter, bus, coach, motorcoach, wait-and-return, as-directed trip or a group event). |
| `pickup_date` | string | The trip date as an absolute calendar date (YYYY-MM-DD), resolved against the date this call took place, from what the caller said ('{{pickup_date}}'). Never use a stale or training-data year. Leave empty if no date was given. |
| `pickup_time` | string | The pickup time as captured ('{{pickup_time}}'), e.g. '7 PM'. Leave empty if none was given. |
| `pickup_address` | string | The full pickup as captured, venue, street and city, copied word for word from '{{pickup_location}}'. Leave empty if none was given. |
| `dropoff_address` | string | The full drop-off as captured, venue, street and city, copied word for word from '{{dropoff_location}}'. Leave empty if none was given. |
| `airport` | string | The airport for an airport trip ('{{airport}}'). Leave empty otherwise. |
| `airline_flight` | string | Airline and flight number for an airport trip ('{{airline_flight}}'). Leave empty otherwise. |
| `meet_style` | enum [curbside, inside, not_stated] | For an airport arrival, copy '{{meet_style}}': curbside, inside (at baggage claim with a sign) or not_stated. |
| `sign_text` | string | The name for the meet-and-greet sign, if given ('{{sign_name}}'). Leave empty otherwise. |
| `passenger_count` | number | Number of passengers as captured ('{{passenger_count}}'). |
| `bag_count` | string | Number of bags ONLY if the caller stated it ('{{bag_count}}'). Leave EMPTY if the caller never gave a bag count. Never write 0 unless the caller said zero or no bags. |
| `hours` | string | For a charter or hourly trip, the number of hours if the caller gave it ('{{hours}}'). Leave empty otherwise. |
| `one_way` | boolean | Copy the flow's value '{{one_way}}': true only when the caller said one way or just the transfer. |
| `vehicle_class` | string | Copy the flow's vehicle label exactly ('{{vehicle_class_label}}'). Leave empty if it is blank. |
| `caller_name` | string | The name given for the reservation contact. |
| `caller_mobile` | string | The mobile number given for the reservation contact, or the number the caller agreed the trip sheet should go to. |
| `sms_consent` | boolean | Whether the caller agreed to receive the trip sheet by text. |
| `company_name` | string | The name of the caller's company or organization, if mentioned during the call. |
| `appointment_booked` | boolean | True only if a follow-up call with the team was booked during this call (the calendar tool returned BOOKED). |
| `interest_level` | string | The caller's level of interest in setting up AI Chauffeur for their company, in a few words. |
| `demo_feedback` | string | The caller's verbatim answer describing what they thought of the demo, if they gave one. |
| `special_notes` | string | Anything the caller asked dispatch or the driver to know ('{{notes}}'), in a few words. |
| `review_needed` | boolean | Copy the flow's value '{{review_needed}}': true when the group is over 56 passengers, needs a wheelchair lift or an oversized item. |

## Every spoken line on the live flow (55 nodes with speech; all static text)

| Node | Name | Spoken line | Then |
|---|---|---|---|
| `n01_p` | N01-P Greeting (phone) | AI Chauffeur, the premium reservation system for limousine, black car and chauffeured transportation. This is the demo line. Play the customer and request a trip. Calls are recorded and transcribed. Which trip would you like to try — airport, point to point, or by the hour. | `n02_extract` |
| `n01_b` | N01-B Greeting (browser) | AI Chauffeur, the premium reservation system for limousine, black car and chauffeured transportation. This is the AI Chauffeur demo. Play the customer and request a trip. Which trip would you like to try — airport, point to point, or by the hour. | `n02_extract` |
| `n01_nudge` | N01-NUDGE Nudge | Airport, point to point, or by the hour — which one would you like to try? | `n02_extract` |
| `n02_dir` | N02-DIR Direction | Landing or flying out? | `n02dir_extract` |
| `n03a_1` | N03A-1 Ask | What airline, flight number, and landing time? | `n03_extract` |
| `n03a_2` | N03A-2 Ask | What's the drop-off address? | `n03_extract` |
| `n03a_3` | N03A-3 Ask | Curbside pickup, or the chauffeur inside at baggage claim with a name sign? | `n03_extract` |
| `n03a_4` | N03A-4 Ask | How many passengers and how many bags? | `n03_extract` |
| `n03b_1` | N03B-1 Ask | Pickup address, pickup time, and which airport? | `n03_extract` |
| `n03b_2` | N03B-2 Ask | How many passengers and how many bags? | `n03_extract` |
| `n03c_1` | N03C-1 Ask | Pickup address and drop-off address? | `n03_extract` |
| `n03c_2` | N03C-2 Ask | What date and time? | `n03_extract` |
| `n03c_3` | N03C-3 Ask | How many passengers and how many bags? | `n03_extract` |
| `n03d_1` | N03D-1 Ask | Pickup address, date, and start time? | `n03_extract` |
| `n03d_2` | N03D-2 Ask | How many hours, and the occasion or where you'd like to go? | `n03_extract` |
| `n03d_3` | N03D-3 Ask | How many passengers? | `n03_extract` |
| `n04_date` | N04-DATE Ask missing | What date? | `n04_extract` |
| `n04_airport` | N04-AIRPORT Ask missing | Which airport? | `n04_extract` |
| `n04_pickup` | N04-PICKUP Ask missing | What's the pickup address? | `n04_extract` |
| `n04_dropoff` | N04-DROPOFF Ask missing | What's the drop-off address? | `n04_extract` |
| `n04_time` | N04-TIME Ask missing | What time? | `n04_extract` |
| `n04_pax` | N04-PAX Ask missing | How many passengers? | `n04_extract` |
| `n05_p` | N05-P Name + consent (phone) | What's your name? The trip sheet will be texted to the number you're calling from. Is that okay? | `n05p_extract` |
| `n05_b` | N05-B Name + number (browser) | Your name and the best mobile number for the trip sheet? | `n05b_extract` |
| `n05_readback` | N05-READBACK Read back number | That's {{number}}. Is that right? | `n05_fix`, `n05_consent` |
| `n05_consent` | N05-CONSENT Consent | Okay to text the trip sheet to that number? | `n05c_extract` |
| `n05_declined` | N05-DECLINED Declined | No problem. The request still goes to dispatch. | → `contact_done_set` without waiting |
| `n06_speak` | N06 SPEAK (composer output of N06-ARR / N06-DEP / N06-P2P / N06-HRLY) | {{summary_text}} | `n06_extract` |
| `n06_fixed` | N06-FIXED Fixed | Got it. Updated to {{changed_field}}. | → `n06_capacity` without waiting |
| `n07_text` | N07-DELIVERY-TEXT Delivery (text) | Your trip sheet, with the recording and transcript, comes by text after the call. | → `n07_custom` without waiting |
| `n07_notext` | N07-DELIVERY-NOTEXT Delivery (no text) | Dispatch has the request. No text or email goes out. | → `n07_custom` without waiting |
| `n07_custom` | N07-CUSTOM Custom | The live version is configured for your company with your rates, your rules, and your software all set up exactly as you need them. | → `n07_offer` without waiting |
| `n07_offer` | N07-OFFER Offer | Would you like to set up a call with the team? | `n07_extract` |
| `n07_reoffer` | N07-REOFFER Re-offer | The call covers setup details for your operation. Would you like to set one up? | `n07_extract` |
| `n07_bye` | N07-BYE | Thanks for trying the demo. Goodbye. | ends the call |
| `n08_a` | N08-A Who + company | Who should the team ask for, and which company? | `n08a_extract` |
| `n08_a2` | N08-A2 Name + company + number | Name, company, and best number? | `n08a2_extract` |
| `n08_team` | N08-TEAM Team message sent | A message is going to the team right now and they'll call as soon as possible. Still like to book a time? | `n08team_extract` |
| `n08_slots` | N08-SLOTS Offer two times | The next open times are {{slot_1}} and {{slot_2}} — which works? | `pick_extract` |
| `fn_book` | book_slot | Checking the calendar for a moment. | `n08_booked`, `n08_fail` |
| `n08_booked` | N08-BOOKED Booked | Confirmed for {{appt_date}} {{appt_time}} {{appt_timezone}}. The team will call then. | → `n09_bye_booked` without waiting |
| `n08_fail` | N08-FAIL Calendar failed | The calendar isn't cooperating. The callback request is kept and the team will text the scheduling link after the call. | → `n09_bye_captured` without waiting |
| `n09_bye_booked` | N09-BYE-BOOKED | Looking forward to the call. Goodbye. | ends the call |
| `n09_bye_captured` | N09-BYE-CAPTURED | Thanks for trying the demo. Goodbye. | ends the call |
| `g_fare` | N08-FARE Fare question (global) | The live version quotes off your rate sheet — this demo captures the trip. | `n01_nudge` |
| `g_price` | N08-PRICE Product price (global) | A system like this starts at nine ninety-seven a month plus a setup fee — a starting point, not a final number. Writing into your CRM and other customizations are priced on the setup call. Would you like to set up a call with the team? | `price_greet_extract`, `sales_appt` |
| `g_offtopic` | N09-OFFTOPIC Off topic (global) | Happy to help — let's get back to the trip. | `n01_nudge` |
| `g_record_obj` | N09-RECORD-OBJ Recording objection (global) | Understood. Want to end the call now? | `record_greet_extract`, `n09_bye_captured` |
| `g_record_cant` | N09-RECORD-CANT Stop recording (global) | The recording can't be switched off on this line. Want to end the call now? | `record_greet_extract`, `n09_bye_captured` |
| `g_silence` | N09-SILENCE1 Silence (global) | Whenever you're ready, we can continue with the trip. | `n01_nudge`, `n09_silence2` |
| `n09_silence2` | N09-SILENCE2 | What we have so far goes to dispatch. Thank you. Goodbye. | ends the call |
| `g_ai` | N09-AI AI question (global) | Yes, this is AI Chauffeur's automated desk. | `n01_nudge` |
| `n03c_2_charter` | N03C-2-CHARTER Ask | What date, start time, and how many hours? | `n03_extract` |
| `n04_hours` | N04-HOURS Ask missing | How many hours, or one way? | `n04_extract` |
| `n05v_ask` | N05V-ASK Sedan or SUV (3-4 passengers with 3-4 bags) | Sedan or SUV? | `n05v_extract` |

## Global nodes (reachable from anywhere)

| Node | Type | Fires when | Cool-down | Goes back when |
|---|---|---|---|---|
| `g_team` | code | The caller asks to talk to the team, talk to someone, speak to a person or a human, or asks for the owner or for Shane; or says they want to hire you, buy this, or set this up for their company. Not when the caller only asks whether they are talking to an AI or a real person. | 50 | — |
| `g_fare` | conversation | The caller asks what their trip will cost: a fare, price, rate, quote or estimate for the ride itself. Not a question about what AI Chauffeur costs as a product. | 2 | Always — resume the conversation at the point it left off on the caller's very next turn, regardless of how the caller responds |
| `g_price` | conversation | The caller asks what AI Chauffeur itself costs: the price of the system, the software, the service, or setting it up for their company. Not the fare for a trip. | 5 | The caller says no, declines the call, or moves on without agreeing to it |
| `g_offtopic` | conversation | The caller says something unrelated to requesting a trip or to AI Chauffeur, and it is not a fare, price, team, recording, AI, or start-over question. | 2 | Always — resume the conversation at the point it left off on the caller's very next turn, regardless of how the caller responds |
| `g_record_obj` | conversation | The caller says they do not like, do not want, or object to being recorded, or complains about the recording, WITHOUT explicitly asking for the recording to be stopped, paused or turned off. | 3 | The caller wants to continue the call |
| `g_record_cant` | conversation | The caller explicitly asks for the recording to be stopped, paused or turned off (for example: stop recording, turn the recording off, please do not record this). Not when the caller only says they dislike or object to being recorded. | 3 | The caller wants to continue the call |
| `g_silence` | conversation | The caller has gone silent and has not answered the last question. | 50 | The caller responds or answers |
| `g_ai` | conversation | The caller asks whether they are talking to an AI, a robot, a bot, a machine, a computer, or a real person. Not a request to talk to the team or to a person. | 2 | Always — resume the conversation at the point it left off on the caller's very next turn, regardless of how the caller responds |
| `g_restart` | code | The caller asks to start over, start again, begin again, or go back to the beginning. | 5 | — |

## Node inventory

code 19 · conversation 50 · extract_dynamic_variables 17 · branch 13 · end 4 · function 3

| Code node | Purpose (name) | Size | SHA-256 |
|---|---|---|---|
| `ch_split` | CH-SPLIT | 684 chars | `fa67fb90f0e9f5b0…` |
| `nudge_mark` | N01-NUDGE once | 28 chars | `bcc06503a751a87f…` |
| `unclear_fallback` | Still unclear after nudge -> point to point | 28 chars | `db4e580c139e5125…` |
| `n03_next` | N03 NEXT ASK (skip given fields) | 2089 chars | `0007ff6673cc4dd2…` |
| `n04_gate` | N04 GATE | 2249 chars | `02b1c1e91fe28dbd…` |
| `n05_capacity` | N05 CAPACITY (capture-only, round 2) | 4403 chars | `08e2b056c50b9684…` |
| `n05_fmt` | N05 format number | 572 chars | `060778c6a424da50…` |
| `contact_done_set` | Contact captured | 32 chars | `eb4d0d1711da4926…` |
| `n06_compose` | N06 COMPOSER | 11358 chars | `d0508e8d788abe4f…` |
| `offer_mark` | N07-REOFFER once | 29 chars | `16fd37858c10450f…` |
| `sales_appt` | SALES ENTRY - appointment yes | 39 chars | `428e2ed6bca6b819…` |
| `g_team` | SALES ENTRY - talk to the team (global) | 32 chars | `f1e2a33cb1f1e420…` |
| `cal_prep` | CAL prep | 35 chars | `49c832491e496e89…` |
| `choose_1` | Chose slot 1 | 125 chars | `11fe110a17bf9830…` |
| `choose_2` | Chose slot 2 | 125 chars | `22e353310ca2d6c6…` |
| `requery` | Caller named another time | 95 chars | `5d17e4d6edf42ba1…` |
| `g_restart` | RESTART (global) | 412 chars | `e03797b1f24fbf31…` |
| `n06_capacity` | N06 CAPACITY after a correction (same code as N05) | 4403 chars | `08e2b056c50b9684…` |
| `n06_oneway` | N06 one way only on point to point | 797 chars | `0f0cd808d7539eae…` |

| Extract node | Variables read |
|---|---|
| `n02_extract` | trip_type [arrival/departure/airport_unspecified/p2p/hourly/sales/unclear], pickup_date, pickup_time, pickup_location, dropoff_location, airport, airline_flight, meet_style [not_stated/curbside/inside], sign_name, passenger_count, bag_count, hours, occasion, notes, is_charter, one_way |
| `n02dir_extract` | trip_type [arrival/departure], pickup_date, pickup_time, pickup_location, dropoff_location, airport, airline_flight, meet_style [not_stated/curbside/inside], sign_name, passenger_count, bag_count, hours, occasion, notes |
| `n03_extract` | trip_type [arrival/departure/p2p/hourly], pickup_date, pickup_time, pickup_location, dropoff_location, airport, airline_flight, meet_style [not_stated/curbside/inside], sign_name, passenger_count, bag_count, hours, occasion, notes, is_charter, one_way |
| `n04_extract` | trip_type [arrival/departure/p2p/hourly], pickup_date, pickup_time, pickup_location, dropoff_location, airport, airline_flight, meet_style [not_stated/curbside/inside], sign_name, passenger_count, bag_count, hours, occasion, notes, is_charter, one_way |
| `n05p_extract` | caller_name, sms_consent |
| `n05b_extract` | caller_name, caller_phone |
| `n05_fix` | caller_phone |
| `n05c_extract` | sms_consent |
| `n06_extract` | trip_type [arrival/departure/p2p/hourly], pickup_date, pickup_time, pickup_location, dropoff_location, airport, airline_flight, meet_style [not_stated/curbside/inside], sign_name, passenger_count, bag_count, hours, occasion, notes, summary_answer [change/no_change], changed_field, is_charter, one_way |
| `n07_extract` | offer_answer [yes/no/question] |
| `n08a_extract` | real_name, company |
| `n08a2_extract` | real_name, company, caller_phone |
| `n08team_extract` | still_book [yes/no] |
| `pick_extract` | chosen [slot_1/slot_2/other/decline], requested_time |
| `price_greet_extract` | price_answer [yes/no] |
| `record_greet_extract` | record_answer [end_now/continue] |
| `n05v_extract` | vehicle_choice [sedan/suv/not_stated] |

## Integrity

- Whole-flow fingerprint (sorted keys, version fields removed): SHA-256 `d275aa95579c490f8c91f29cddb73d0f2f38aed21b84eefdf56162b3424566a1`
- Whole-agent fingerprint (sorted keys, version fields removed): SHA-256 `49df3dd667c8752221312ab8f1c3cac30c881844613fa0dc7def4360722a40b0`
- Rollback material: the full agent + flow JSON for v4 is held outside the public repo (this run's private work folder and the 2026-09-30 v4 run's `before-v3.json` / `after-v4.json`).
