# AVA 8930 — PRE-DISCOVERY SNAPSHOT (2026-10-14)

> **READ ONLY.** Rollback insurance for PASTE-CC-DISCOVERY-WORDS-RUN v1, taken 2026-10-14T23:02:12.803Z before the promote. Retell read only.
> Withheld: webhook paths and tool header values (host only), every number but its last four.

## Bindings (read 2026-10-14T23:02:12.803Z)

| Number | Binding |
|---|---|
| …8042 DEMO-POOL-01 | inbound [["agent_44b48507d38c0bfc29a3150a74","latest_published"]] · outbound [["agent_67381fcfabf6731dad4f40c590","latest_published"]] · inbound webhook none |
| …8930 +1(414)240-8930 | inbound [["agent_d5ada9f774fe3ae7f034d2c677",51]] · outbound [["agent_d5ada9f774fe3ae7f034d2c677",51]] · inbound webhook set (host circulant.app.n8n.cloud) |
| …6409 DEMO-POOL-02 | inbound [["agent_d5ada9f774fe3ae7f034d2c677",51]] · outbound [["agent_67381fcfabf6731dad4f40c590","latest_published"]] · inbound webhook none |
| …6486 DEMO-POOL-03 | inbound [["agent_d5ada9f774fe3ae7f034d2c677",51]] · outbound [["agent_67381fcfabf6731dad4f40c590","latest_published"]] · inbound webhook none |
| …1886 DEMO-POOL-04 | inbound [["agent_d5ada9f774fe3ae7f034d2c677",51]] · outbound [["agent_67381fcfabf6731dad4f40c590","latest_published"]] · inbound webhook none |

## Served version

Live AVA `agent_d5ada9f774fe3ae7f034d2c677` **v51** (published true) · LLM `llm_d0f4aff62bb8b60ff878055aa18c` v51 ·
prompt 7759 characters, SHA-256 `b622d7eb2ceef305e4ba489a5d0e13ef761dfb73a5ad0e7f4dde803b7d8bf1e0` · agent object SHA-256 (canonical JSON) `aa9ac66045ebe52202c4465f3254a76d221b956bfa0fbed10a556039ac86251a` ·
LLM object SHA-256 `752adb9dbe334b268a6f30228b39a471ee48029f6141995628d84279ccb4f175` (both hashes over the unmasked objects).

**Rollback:** re-pin …8930 (in + out) and …1886 / …6486 / …6409 / …8042 (in) to v51; remove the inbound webhook from the four
pool lines (they had none); publish WF-ANI-AVA version 804b5b4c-a3ff-4a82-a557-015b5c7d2e76 (the served version before this run).

## Agent v51 (every field)

````json
{
  "agent_id": "agent_d5ada9f774fe3ae7f034d2c677",
  "channel": "voice",
  "last_modification_timestamp": 1791398864806,
  "agent_name": "AVA — AI Voice Agency",
  "response_engine": {
    "type": "retell-llm",
    "llm_id": "llm_d0f4aff62bb8b60ff878055aa18c",
    "version": 51
  },
  "webhook_url": "https://circulant.app.n8n.cloud/[path withheld]",
  "webhook_timeout_ms": 5000,
  "language": "en-US",
  "data_storage_setting": "everything",
  "opt_in_signed_url": false,
  "end_call_after_silence_ms": 20000,
  "version": 51,
  "base_version": 49,
  "assigned_tags": [],
  "is_published": true,
  "version_title": "v49 + limo transfer go-live: Grok v50e prompt (byte-exact, SHA-256 b622d7eb…7d8bf1e0), the four tools and the tested speech settings of AVA TEST v12 (2026-10-07)",
  "post_call_analysis_model": "gpt-4.1",
  "pii_config": {
    "categories": [],
    "mode": "post_call"
  },
  "handbook_config": {
    "high_empathy": false,
    "smart_matching": true,
    "natural_filler_words": false,
    "default_personality": false,
    "speech_normalization": false,
    "ai_disclosure": true,
    "nato_phonetic_alphabet": false,
    "scope_boundaries": true,
    "echo_verification": false
  },
  "timezone": "America/Chicago",
  "post_call_analysis_data": [
    {
      "type": "system-presets",
      "name": "call_summary",
      "description": "Write a 1-3 sentence summary of the call based on the call transcript. Should capture the important information and actions taken during the call."
    },
    {
      "description": "The caller's first name, as stated by the caller during the conversation.",
      "type": "string",
      "name": "caller_first"
    },
    {
      "name": "caller_email",
      "description": "The caller's email address, as confirmed/read back during the call. Lowercase, valid email format.",
      "type": "string"
    },
    {
      "description": "The best callback phone number for the caller, in E.164 format (e.g. +14142408930) if possible.",
      "name": "caller_phone",
      "type": "string"
    },
    {
      "description": "The name of the caller's company or business.",
      "type": "string",
      "name": "business_name"
    },
    {
      "description": "Evaluate whether the agent had a successful call with the user. For a successful call, the agent should have a complete conversation with user, finished the task, and have not ran into technical issues, or caused user frustration. Besides, the agent was not blocked by a call screen or encountered voicemail.",
      "type": "system-presets",
      "name": "call_successful"
    },
    {
      "description": "Evaluate user's sentiment, mood and satisfaction level.",
      "name": "user_sentiment",
      "type": "system-presets"
    },
    {
      "choices": [
        "transportation",
        "other"
      ],
      "name": "industry",
      "type": "enum",
      "description": "The caller's industry. transportation = the caller runs or represents a limo, black car, chauffeur, livery, charter, motorcoach, shuttle or other passenger-transportation business. other = any other business, or unknown."
    },
    {
      "name": "handoff_attempted",
      "description": "True if AVA called the handoff_to_desk tool during the call, whether or not the handoff succeeded. False otherwise.",
      "type": "boolean"
    }
  ],
  "voice_id": "cartesia-Kate",
  "voice_model": "sonic-3-latest",
  "voice_temperature": 0.7,
  "voice_speed": 1,
  "enable_dynamic_voice_speed": true,
  "volume": 1,
  "enable_expressive_mode": true,
  "enable_backchannel": true,
  "backchannel_frequency": 0.35,
  "backchannel_words": [
    "got it",
    "understood",
    "right",
    "makes sense",
    "mm-hm"
  ],
  "reminder_trigger_ms": 8000,
  "reminder_max_count": 1,
  "max_call_duration_ms": 600000,
  "interruption_sensitivity": 0.9,
  "boosted_keywords": [
    "limousine",
    "limo",
    "black car",
    "chauffeur",
    "chauffeured",
    "car service",
    "livery",
    "sedan",
    "town car",
    "fleet",
    "charter",
    "motorcoach",
    "shuttle",
    "AI Chauffeur",
    "Limo Anywhere",
    "GNet",
    "dispatch",
    "transportation",
    "discovery call",
    "AI Voice Agency"
  ],
  "ambient_sound_volume": 0.08,
  "responsiveness": 1,
  "enable_dynamic_responsiveness": true,
  "begin_message_delay_ms": 0,
  "ring_duration_ms": 69000,
  "voicemail_option": {
    "action": {
      "type": "static_text",
      "text": "Hi, this is AVA with AI Voice Agency - sorry I missed you. Call me back anytime at 414-240-8930, or grab a time that works at aivoiceagency.ai/book. Talk soon."
    }
  },
  "stt_mode": "fast",
  "vocab_specialization": "general",
  "allow_user_dtmf": true,
  "allow_dtmf_interruption": false,
  "user_dtmf_options": {},
  "denoising_mode": "noise-cancellation",
  "webhook_events": [
    "call_analyzed"
  ]
}
````

## LLM v51 (every field; the prompt is the v50e text in ops/tuning/ava-8930-v50e-final.md)

````json
{
  "llm_id": "llm_d0f4aff62bb8b60ff878055aa18c",
  "version": 51,
  "model": "gpt-4.1",
  "model_temperature": 0.2,
  "model_high_priority": false,
  "tool_call_strict_mode": true,
  "general_prompt": "(7759 characters · SHA-256 b622d7eb2ceef305e4ba489a5d0e13ef761dfb73a5ad0e7f4dde803b7d8bf1e0 · = ops/tuning/ava-8930-v50e-final.md)",
  "general_tools": [
    {
      "speak_after_execution": true,
      "type": "end_call",
      "description": "End the call when the caller says bye, is done, or you are instructed to close.",
      "name": "end_call"
    },
    {
      "name": "get_open_slots",
      "speak_after_execution": true,
      "description": "Look up the next open discovery-call times on the calendar. Returns slots_status, slot_1 and slot_2 (spoken form, timezone included), slot_1_iso and slot_2_iso (pass one of these to book_slot), timezone, and caller_phone_last4. slots_status other than OK means no times could be read.",
      "headers": {
        "x-sales-cal-secret": "(value withheld)"
      },
      "speak_during_execution": false,
      "method": "POST",
      "parameters": {
        "type": "object",
        "properties": {
          "requested_time": {
            "type": "string",
            "description": "A time the caller named for the call, in their words, e.g. 'Tuesday at 3 PM'. Empty when the caller has not named one."
          }
        }
      },
      "timeout_ms": 5000,
      "type": "custom",
      "url": "https://circulant.app.n8n.cloud/[path withheld]"
    },
    {
      "url": "https://circulant.app.n8n.cloud/[path withheld]",
      "description": "Book one discovery call at a time the caller said yes to. Returns status BOOKED with appt_date, appt_time, appt_timezone, appointment_time and phone_last4, or status FAILED with a reason. Only BOOKED means the call is on the calendar.",
      "parameters": {
        "required": [
          "slot_iso"
        ],
        "properties": {
          "slot_iso": {
            "description": "The exact slot_1_iso or slot_2_iso value returned by get_open_slots for the time the caller accepted.",
            "type": "string"
          },
          "caller_name": {
            "description": "The caller's name, if they gave it.",
            "type": "string"
          },
          "business_type": {
            "description": "The caller's type of business, if known.",
            "type": "string"
          },
          "caller_phone": {
            "type": "string",
            "description": "A callback number the caller gave, only when the call has no caller ID."
          }
        },
        "type": "object"
      },
      "name": "book_slot",
      "type": "custom",
      "method": "POST",
      "headers": {
        "x-sales-cal-secret": "(value withheld)"
      },
      "speak_after_execution": true,
      "timeout_ms": 10000,
      "speak_during_execution": false
    },
    {
      "speak_during_execution": false,
      "keep_current_language": false,
      "description": "Call this tool after the caller accepts the transfer offer.",
      "agent_version": 13,
      "name": "handoff_to_desk",
      "keep_current_voice": false,
      "post_call_analysis_setting": "both_agents",
      "webhook_setting": "both_agents",
      "speak_after_execution": true,
      "agent_id": "agent_9ebb41c9bd8af214649328f107",
      "use_swap_agent_max_duration": true,
      "type": "agent_swap"
    }
  ],
  "start_speaker": "agent",
  "begin_message": "{{opening_line}}",
  "default_dynamic_variables": {
    "caller_known": "false",
    "caller_timezone_label": "",
    "charter_lines_live": "true",
    "recent_web_activity": "false",
    "door_now": "demo",
    "channel": "phone",
    "is_demo": "true",
    "appointment_time_caller_local": "",
    "appointment_count_upcoming": "0",
    "caller_first_name": "",
    "zz_sim_phone": "false",
    "opening_line": "AI Voice Agency, this is AVA. I answer every call and book the job for service businesses. What kind of business do you run?",
    "caller_cell_e164": "",
    "opening_mode": "cold",
    "has_upcoming_appointment": "false",
    "appointment_time_ct": ""
  },
  "knowledge_base_ids": [],
  "kb_config": {
    "top_k": 3,
    "filter_score": 0.6
  },
  "last_modification_timestamp": 1791398864832,
  "is_published": true,
  "mcps": []
}
````
