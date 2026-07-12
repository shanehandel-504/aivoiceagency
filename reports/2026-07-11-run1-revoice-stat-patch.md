# RUN 1 REVOICE + STAT PATCH — Jul 11 2026

```
===== SHANE READBACK — COPY ALL =====

PLAIN ENGLISH
Re-did both Run 1 videos with a warmer, slower voice and fixed the stat overlays — shipped as _v2.
  • Voice: I read the REAL settings off your live phone agent (AVA SALES v3.4 on 414-240-8930)
    and built a "Faceless Voice Rail" so the reel voice matches the phone. Retell only exposes
    temperature (0.7) + speed (1.07), so the stability/warmth came from the voice's saved
    ElevenLabs profile (0.5 / 0.75 / 0.36). Reels render on eleven_v3 at speed 0.95 — a touch
    slower than the phone for a warm, conversational read.
  • Stats: V2's line is now exactly "62% go unanswered. 85% never call back," and the overlays
    read 62% UNANSWERED and 85% NEVER CALL BACK. Those trace to the 411 Locals 2024 study
    (verified by web search — same study says 85% never call back); $45K stays labeled illustrative.
  • A 13-second A/B sampler MP3 plays the old flat voice then the new rail back-to-back so you can
    ear-check in one listen before watching the full videos.
The prove-work gate on the run page is now CLOSED with sources.

DONE
| Asset                        | Where                       | Dur   | Size    | Status              |
|------------------------------|-----------------------------|-------|---------|---------------------|
| run1_2am_receipt_v2.mp4      | AVA-factory/renders/run1/   | 39.5s | 2.78 MB | revoiced (disk)     |
| run1_45k_math_v2.mp4         | AVA-factory/renders/run1/   | 39.2s | 2.86 MB | revoiced + stats    |
| run1_voice_ab_sampler.mp3    | AVA-factory/renders/run1/   | 12.9s | —       | ear-check (sent)    |
| /work/social/run1 (updated)  | work/social/run1/index.html | —     | —       | LIVE (pushed)       |
| ava-factory skill            | .claude/skills/ava-factory  | —     | —       | Faceless Voice Rail |
| hq/board.json                | L4 + content + log          | —     | —       | updated (pushed)    |

FACELESS VOICE RAIL (saved into the skill — reel = phone, always)
  source: AVA SALES v3.4 (Retell agent_d5ada9f…677 v34) voice_temperature 0.7, voice_speed 1.07,
          custom_voice_705… (Retell hides EL stability/style; custom-voice id 400s on EL API)
  reel render (eleven_v3): stability 0.5 · similarity_boost 0.75 · style 0.36 ·
          use_speaker_boost true · speed 0.95 (slower than phone 1.07) · one [warmly] tag · ellipsis pauses

CREDIT BURN (ESTIMATED — key lacks wallet-read)
  revoice finals (v3) ~911 · A/B sampler ~186 · Retell+STT ~minor  =>  ~1,097 this pass
  cumulative Run 1 ~3,052 (cap 25,000). SET 11Labs meter to ~240,948 (244,000 − 3,052).

IDS / ROLLBACK
  • Phone rail read from Retell agent_d5ada9f774fe3ae7f034d2c677 v34.
  • Re-render _v2 (no voice call): python build/run1_assemble.py bothv2
  • Re-voice: doppler run -p ava-prod -c prd -- python build/run1_tts.py final_v2
  • A/B sampler: doppler run -p ava-prod -c prd -- python build/run1_tts.py absampler
  • Repo revert = revert this run's commit + push (removes page/board/skill edits; masters on disk untouched).
  • v1 masters (old voice) still on disk, superseded by _v2.

WHAT'S NEXT (Shane)
  1. Ear-check run1_voice_ab_sampler.mp3 — if the new rail is right, greenlight; if not, say warmer/slower/faster.
  2. Preview both _v2 masters full-screen.
  3. Draft captions in GHL Social Planner (2×/day). Drop a source link in the V2 caption.
  4. Set the 11Labs meter to ~240,948.
  5. Optional: AI hero footage via the click-sheet on /work/social/run1.

GOTCHAS
  • Retell exposes only voice_temperature + voice_speed, not EL stability/similarity/style; the
    custom_voice_705… id 400s on the EL API → stability/warmth comes from the reel voice's EL saved settings.
  • [warmly] tag verified SILENT via scribe STT (not spoken) — safe in a published master.
  • New rail read slightly LONGER (A/B new line 6.32s vs old 6.00s) — the slower speed landed.
  • Overlays had to be RE-ANCHORED to the new word timestamps (VO durations shifted) — old timings would drift.
  • 411 Locals 2024 study backs BOTH 62% and 85%; $45K is a conservative illustrative floor vs their ~$126K/yr.
  • Masters live on local disk (AVA-factory/renders/run1), NOT committed (binaries).

HOW THIS PROMPT COULD BE BETTER
  Name the exact target read length if 30–45s matters (both landed ~39s); and confirm whether to
  overwrite the v1 masters or keep both (I kept both, _v2 = current).

===== END =====
```
