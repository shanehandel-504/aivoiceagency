---
name: ava-factory
description: AVA content factory — the permanent Run 1 pipeline for turning a script into a postable 1080x1920 avatar reel. Use when rendering AVA reels/Shorts, running the ElevenLabs→HeyGen→ffmpeg→GHL content loop, batch social video, or any AVA short-form content. Encodes the ElevenLabs Closer voice rail, burn guards, CIRCULANT video kit, hard content laws, and the /work + board.json publish steps.
---

# AVA FACTORY — script → postable reel, permanently

The repeatable pipeline that shipped Content Loop v2 (4 reels, 2026-07-09). One run = a batch of finished 1080x1920 vertical masters, credit meters updated, board flipped, readback delivered. Draft = failed run.

## THE LOOP (5 steps)
1. **Grok mines** — surfaces the trend / hook (fresh, real).
2. **Claude refines** — tightens the script + angle to the hard laws below.
3. **Grok re-checks** — fact + freshness pass (no stale or fake claims).
4. **Render** — ElevenLabs VO → HeyGen avatar → ffmpeg CIRCULANT overlay + end card → master.
5. **Post 2×/day** — schedule in **GHL Social Planner** (never auto-publish without Shane's go).

## WORKSPACE + SECRETS (hybrid build)
- Workspace: `C:\Users\offic\Desktop\AVA-factory\` → `audio/` `seed/` `video/` + `uploads.json` (asset-ID ledger; new batch → `uploads_v2.json`-style suffix).
- ALL API calls run under Doppler: `doppler run -p ava-prod -c prd -- <cmd>`. **Never print / echo / log a key value.** Reference names only.
- **Hybrid rule:** use the MCP when it works; fall back to Doppler REST/CLI when it doesn't. The **ElevenLabs MCP key is DEAD (401)** — render TTS via Doppler REST, not the MCP. HeyGen has no MCP render key here either → REST.
- Doppler secret NAMES (the gotcha): ElevenLabs = `ELEVENLABS_API_KEY` (header `xi-api-key`). HeyGen = **`HEY_GEN_API`** (header `X-Api-Key`) — NOT `HEYGEN_API_KEY`. Always `doppler secrets --only-names` first.

## RAIL 1 — ElevenLabs (voice)
- Voice: **"Ava ⚡ Eager, Helpful and Understanding"**, `voice_id = gJx1vCzNCD1EQHT212Ls`. Resolve by GET `/v1/voices` (name contains "ava"+"eager") if the ID ever drifts.
- **Closer voice_settings (content-grade, expressive — NOT the phone-line profile):** `stability 0.5 · similarity_boost 0.85 · style 0.35 · use_speaker_boost true`. Output `mp3_44100_128`.
- **FACELESS VOICE RAIL — LAW: reel voice settings = phone voice settings.** Sourced 2026-07-11 from the flagship phone agent AVA SALES v3.4 (Retell `agent_d5ada9f774fe3ae7f034d2c677` v34: `voice_temperature 0.7`, `voice_speed 1.07`, `custom_voice_705…`). Retell does NOT expose EL stability/style and the custom-voice id 400s on the EL API → pull `stability/similarity/style` from the reel voice's EL saved settings (`GET /v1/voices/{id}/settings` → **0.5 / 0.75 / 0.36 / speaker-boost true**). **Reel render (eleven_v3):** `stability 0.5 · similarity_boost 0.75 · style 0.36 · use_speaker_boost true · speed 0.95` (slower than the phone's 1.07 for a warm, conversational reel read). Warmth via one `[warmly]` tag (verify SILENT via scribe STT — it must not be spoken) + ellipsis pauses. Always ship an A/B sampler (old flat vs new rail) for Shane's ear-pick before he watches the full videos.
- **Model ladder — turbo scratch → v3 finals:** draft/timing passes = `eleven_turbo_v2_5` (cheap narration). Final masters = `eleven_v3` (max emotion — hooks, reactions, big lines). If v3 is unavailable for the voice, fall back to `eleven_multilingual_v2` (the proven v1/v2 finals model). SFX pass = ElevenLabs SFX for news-breaker polish.
- Endpoint: POST `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}` with `{text, model_id, voice_settings, output_format}`.

## RAIL 2 — HeyGen (avatar)
- Reuse the live face — **do NOT re-upload:** `talking_photo_id = 1fa401cc3d9540b6953776b6f34492c5` (still live from v1/v2). Only re-upload if HeyGen reports it GC'd.
- Endpoints: `upload.heygen.com/v1/talking_photo` (image/png) · `/v1/asset` (audio/mpeg) · `api.heygen.com/v2/video/generate` (type:audio, `audio_asset_id`, **dimension 1080×1920**) · poll `v1/video_status.get?video_id=`.
- **Reel-1-first gate (proven pattern):** submit reel1 → poll → download → verify on disk, THEN fire 2/3/4 concurrently. Never fan out before reel1 lands.

## BURN GUARDS (preflight EVERY run)
- **ElevenLabs 25K guard:** meter start = **244,000** credits (manual, on `/work/elevenlabs`). Do NOT burn **>25,000** credits in one batch without an explicit Shane go. Update the meter after each batch.
- **HeyGen wallet:** GET `/v2/user/remaining_quota` first. Unit is RAW: **60 units = 1 credit ≈ 1 min of video.** ~116 units ≈ $1.93 per 4-reel batch. If `details.api` is 0 → STOP (web/studio credits are a SEPARATE bucket and won't render API jobs).

## CIRCULANT VIDEO KIT (overlay + end card)
- Canvas 1080×1920. Background void `#0A0A0F`. One accent: cyan `#00D4FF`. Text `#EEF0F4` (never pure white). Font **Space Grotesk**.
- **Captions live in the TOP THIRD** (clear of platform UI + the avatar's mouth), high-contrast, generous line height, ≤ ~7 words/line.
- **3-second end card:** static void card, cyan wordmark, CTA `414-240-8930` + `aivoiceagency.ai`. Reduced-motion-safe.
- Assembly = ffmpeg: burn captions (`subtitles`/`drawtext`), concat body + end card, keep 1080×1920, reserve all dimensions (no reflow). No React/Framer — CLI only.
- **Assembly muscle = the vetted `social-media-clip-creator` + `video-editor` agents** (`.claude/agents/`, from aitmpl ffmpeg-clip-team, VETTING-LAW-cleared): 9:16 crop `crop=ih*9/16:ih`, SRT burn `subtitles=subs.srt`, encode `libx264 -crf 23 -preset fast -c:a aac -b:a 128k`, concat + thumbnail. **CIRCULANT override:** those agents default captions to the bottom — force them into the TOP THIRD (`subtitles=subs.srt:force_style='Alignment=8,MarginV=..'` or `drawtext y=H/8`) and keep the void/cyan/Space-Grotesk look + 3s end card. The agents are the ffmpeg execution; this kit is the law.

## HARD LAWS (block — check before every render)
- **AVA is never "she"/"her"** — always "AVA" by name.
- **$497 only** — the one price allowed in short-form (Starter). Never surface other tiers in a reel.
- **Prove-work** — no fake proof/ROI/counts/ratings/testimonials/logos. Demo language: *captured · routed · dispatcher will confirm.* One speed claim sitewide: "one ring."
- **CTA = 414-240-8930** — the ONLY public voice number in content. (Text line 350-220-5305, footer only.) Never surface private/personal numbers.
- **No real names** — no real client/prospect names (e.g. no operators, no "Billy"/"Chris"). Sample dialogue must be labeled "Sample" / "Demo call — AVA's real voice. Sample data."
- Forbidden in AVA marketing CLAIMS: "locked/locked in", "booked", "confirmed", "guaranteed", "she/her" for AVA. Natural booking language is OK ONLY inside clearly-labeled sample call dialogue.

## GHL SCHEDULE STEP
- Masters are 1080×1920 vertical, ~28s → Shorts/Reels/TikTok-ready.
- Schedule **2×/day** in the **GHL Social Planner**. Draft the caption (hook + CTA `414-240-8930`, hard laws applied) and hand to Shane to approve/publish — publishing is a Shane action, not an auto-step.

## PUBLISH STEPS (/work + board.json)
1. Update `/work/elevenlabs` credit meter (manual) with the new ElevenLabs balance after the batch.
2. Update `hq/board.json`: flip/confirm the `content` lane, append a `log` entry (ISO ts + what shipped). The `/work` hub and `/hq` board read `board.json` live.
3. Commit + push (Vercel auto-deploys `main`) per PUSH DISCIPLINE: one push = one complete unit, ≤5 pushes/hr, batch related changes.

## RUN CLOSEOUT (mandatory)
- End with a **DONE table** (reel → master file → duration → size → HeyGen video_id → status) + the wallet before/after math + asset IDs persisted to `uploads*.json` + a per-checkpoint rollback line.
- If NOT delivered: first line = `RUN INCOMPLETE — what / why / next step` in caps.
- Emit ONE `===== SHANE READBACK — COPY ALL =====` block (plain-English summary, DONE table, IDs/rollback, what's next, gotchas). NOTHING after the block. Mirror it to `/reports/YYYY-MM-DD-<mission>.md`.

## GOTCHAS (learned, do not relearn)
- HeyGen 'api' credits ≠ web/studio credits; the wallet integer is ×60 (raw units).
- On-disk names drift (spec said `uploads_v2.json`/`AVA_seed_5395.png`; disk had `uploads.json`/`AVA_seed_clean.png`) — reuse the live `talking_photo_id`, don't chase renamed files.
- No Google Drive sync folder on this PC (OneDrive only) — masters stay on local disk unless Shane names a path.
- Keys never printed; every call under `doppler run -p ava-prod -c prd`.
