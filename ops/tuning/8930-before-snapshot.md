# AVA 8930 — BEFORE SNAPSHOT

**Pulled 2026-08-01. Read-only. Nothing on the live rail was modified.**

Every value below came from a live Retell fetch during this run, not from the repo
and not from a pasted id. The number was resolved first, then the agent from the
number, then the config from the agent.

---

## §1 · WHAT ACTUALLY ANSWERS THE PHONE

| field | value |
|---|---|
| Phone number | `+14142408930` — "(414) 240-8930", `retell-twilio`, area code 414, US-only inbound |
| Inbound agent | `agent_d5ada9f774fe3ae7f034d2c677` — "AVA — AI Voice Agency" |
| Outbound agent | same id (single agent serves both directions) |
| Served version | **`latest_published`** |
| Latest **published** version | **v38** |
| Latest version that exists | v39 — **`is_published: false`, a DRAFT** |
| Response engine | `retell-llm` → `llm_d0f4aff62bb8b60ff878055aa18c` v38 |

> **v39 is a draft and does not answer the phone.** `get-agent` returns v39 by
> default, so reading it and calling it "live" is wrong. The snapshot below is
> **v38**, the published version the number serves.
>
> Checked anyway: v38 and v39 are **identical on every tuning-relevant field**
> (sensitivity, backchannel, denoise, volume, voice, full handbook). So nothing
> here changes based on which one you read — but the distinction is real and the
> next run must not assume it away.

---

## §2 · MODEL + PROMPT

| field | value |
|---|---|
| Model | `gpt-4.1` |
| `model_temperature` | 0.2 |
| `model_high_priority` | false |
| `tool_call_strict_mode` | true |
| `start_speaker` | agent |
| **Prompt chars** | **13,138** |
| **Token estimate (chars/4)** | **~3,285** |
| Prompt words / lines | 2,216 / 41 |
| Knowledge bases | none (`knowledge_base_ids: []`) |
| Dynamic variables | none |
| Post-call analysis model | `gpt-4.1` |
| Post-call fields | `call_summary`, `caller_first`, `caller_email`, `caller_phone`, `business_name`, `call_successful` |

**Begin message** (verbatim):

> `Thanks for calling AI Voice Agency. This is AVA. What can I help you with?`

**Tools:** `end_call`, `book_appointment`
`book_appointment` POSTs to the **live** n8n webhook `…/webhook/ava-book-appointment`.

---

## §3 · INTERACTION + AUDIO

| field | live value | note |
|---|---|---|
| `interruption_sensitivity` | **0.82** | **already at the tune target — this was never a change** |
| `enable_backchannel` | **false** | backchannel is OFF on live |
| `backchannel_frequency` | *(unset)* | inapplicable while backchannel is off |
| `denoising_mode` | `noise-cancellation` | **denoise already ON.** Enum: `no-denoise` / `noise-cancellation` / `noise-and-background-speech-cancellation` |
| `volume` | 1 | agent loudness, range [0,2] |
| `responsiveness` | 1 | |
| `stt_mode` | `fast` | latency-biased over accuracy |
| `vocab_specialization` | `general` | |
| `begin_message_delay_ms` | 400 | |
| `end_call_after_silence_ms` | 30,000 | |
| `max_call_duration_ms` | 600,000 (10 min) | |
| `ring_duration_ms` | 69,000 | |
| `ambient_sound` | `call-center` @ volume 0.08 | |
| `allow_user_dtmf` | true | `allow_dtmf_interruption` false |
| `timezone` | `America/Chicago` | |
| `webhook_events` | `call_analyzed` → chat-dash.com endpoint | post-call CRM pipeline |

### Volume normalization — NO SUCH FIELD

The run ordered "volume normalization ON". **Retell's agent API has no volume-normalization
field.** Verified against the live object and the current API reference. What exists is:

- `volume` — agent loudness, [0,2]. Not normalization.
- `handbook_config.speech_normalization` — **text** normalization (reads dates/numbers
  naturally). Not audio.

`speech_normalization` was left **OFF** on the test agent because the same instruction
said Smart Matching / AI Disclosure / Scope Boundaries ON and **all other modules OFF** —
and speech_normalization is one of those other modules. The explicit handbook list wins
over an inferred mapping. **Open item for Shane** — see the readback.

---

## §4 · VOICE

| field | value |
|---|---|
| `voice_id` | `custom_voice_705a2cb49b0413f7fc1c456d02` |
| Retell voice name | "Ava – Eager, Helpful and Understanding" |
| Provider | `elevenlabs` |
| `voice_temperature` | 0.7 |
| `voice_speed` | 1.07 |

**Verification of the ElevenLabs id.** Retell's `get-voice` does **not** expose the
underlying provider voice id, so the mapping was confirmed by name across both APIs:

| source | result |
|---|---|
| Retell `get-voice/custom_voice_705a…` | name "Ava – Eager, Helpful and Understanding", provider `elevenlabs` |
| ElevenLabs `GET /v1/voices/gJx1vCzNCD1EQHT212Ls` | name "Ava – Eager, Helpful and Understanding", category `professional` |

Names match exactly → this is the ordered voice. **Unchanged, as instructed.**

**ElevenLabs settings (baseline, untouched):**
`stability 0.5` · `similarity_boost 0.75` · `style 0.36` · `speed 1` · `use_speaker_boost true`

> These live on the **ElevenLabs voice**, not on the Retell agent — Retell exposes only
> `voice_temperature` / `voice_speed` / `volume`. The voice is **shared with the live
> 8930 line**, so editing stability or similarity would change what callers hear on the
> production number. Left alone deliberately.

---

## §5 · HANDBOOK — LIVE STATE (all nine modules)

| module | live (v38) | v37 TEST |
|---|---|---|
| `smart_matching` | OFF | **ON** |
| `ai_disclosure` | OFF | **ON** |
| `scope_boundaries` | OFF | **ON** |
| `default_personality` | **ON** | OFF |
| `natural_filler_words` | **ON** | OFF |
| `high_empathy` | **ON** | OFF |
| `echo_verification` | OFF | OFF |
| `speech_normalization` | OFF | OFF |
| `nato_phonetic_alphabet` | OFF | OFF |

Live runs three "warmth" modules and none of the three control modules. The test agent
inverts exactly that.

---

## §6 · ROLLBACK

Nothing on the live rail changed, so there is nothing to roll back. If the v37 TEST
agent needs to disappear:

```bash
doppler run --project ava-prod --config prd -- node -e "fetch('https://api.retellai.com/delete-agent/agent_44b48507d38c0bfc29a3150a74',{method:'DELETE',headers:{Authorization:'Bearer '+process.env.RETELL_API_KEY}}).then(r=>console.log(r.status))"
```

The live agent, its LLM, the number binding, and the ElevenLabs voice are all untouched
and were re-verified by fresh fetch after the test agent was built.
