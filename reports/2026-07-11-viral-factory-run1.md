# VIRAL FACTORY RUN 1 — 2AM Receipt + $45K Math · 2026-07-11

```
===== SHANE READBACK — COPY ALL =====

PLAIN ENGLISH
Two finished faceless vertical videos, built start-to-finish tonight on the ElevenLabs lane
(no face, no HeyGen): script → voice → sound → graphics → final MP4.
  • Video 1 "2AM Receipt" — a $340 emergency job answered at 2AM, receipt texted before hangup.
  • Video 2 "$45K Math"   — the missed-call math, ending on $497/mo flips it.
Both use the AVA "Eager" voice on ElevenLabs' top v3 model, 6 custom sound effects, and an
on-brand motion-graphics look (AVA void + cyan, Space Grotesk). Text overlays are locked to the
exact spoken words using speech timestamps; a calendar fills to "BOOKED," an SMS booking-receipt
card pops in, and an AVA end card shows 414-240-8930.

The one thing I could NOT do: AI "cinematic hero footage." ElevenLabs' video generator
(Sora/Veo/Kling) is UI-only and US-restricted in beta — there is no API/MCP for it, so I did NOT
fake it. Both masters ship as polished motion-graphics you can post right now, and the run page
carries an exact click-sheet to upgrade with real footage in the ElevenLabs UI later.

DONE
| Asset                    | Path                                   | Dur   | Size    | Status            |
|--------------------------|----------------------------------------|-------|---------|-------------------|
| run1_2am_receipt.mp4     | AVA-factory/renders/run1/              | 41.0s | 2.82 MB | rendered (disk)   |
| run1_45k_math.mp4        | AVA-factory/renders/run1/              | 36.6s | 2.70 MB | rendered (disk)   |
| + _thumb.png (x2)        | AVA-factory/renders/run1/              | —     | —       | thumbnails        |
| /work/social/run1 page   | work/social/run1/index.html            | —     | —       | LIVE (pushed)     |
| /work/social link        | work/social/index.html                 | —     | —       | LIVE (pushed)     |
| hq/board.json            | L4 + content lane + log                | —     | —       | updated (pushed)  |

CREDIT BURN (ESTIMATED — key lacks wallet-read scope, so computed not read)
  scratch (turbo v2.5)  915 chars x0.5  ~458
  finals  (eleven_v3)   915 chars x1.0  ~915
  A/B line (v3)         110 chars x1.0  ~110
  SFX x6                ~11.8s x40cr/s   ~472
  STT (scribe)          ~1.3 min audio   minor
  --------------------------------------------
  RUN 1 TOTAL           ~1,955 credits   (hard cap 25,000 — well under)
  → decrement /work/elevenlabs meter (ref start 244,000) by ~1,955.

IDS / ROLLBACK
  • Voice gJx1vCzNCD1EQHT212Ls (Ava Eager) · model eleven_v3 · SFX model eleven_text_to_sound_v2.
  • All source + intermediates on local disk: AVA-factory/renders/run1/{audio,gfx,build}. Masters
    are NOT committed (binaries live on disk; Shane schedules via GHL).
  • Repo (this run's publish unit): revert the Run 1 commit + push to remove the run page + board
    edits. Masters on disk are untouched by any git action.
  • Re-render video (no API needed): python build/run1_gfx.py && python build/run1_assemble.py both
  • Re-voice: doppler run -p ava-prod -c prd -- python build/run1_tts.py final

WHAT'S NEXT (Shane actions)
  1. Source the 27% / 62% / $45K stats before scheduling Video 2 (prove-work law) — gated on the run page.
  2. Preview both masters full-screen on your phone.
  3. Draft captions in GHL Social Planner, 2x/day — publishing is your call, never auto.
  4. Decrement the 11Labs credit meter ~1,955.
  5. Optional: upgrade heroes with real AI footage via the click-sheet on /work/social/run1.

GOTCHAS
  • ElevenLabs Video = UI-only + US-restricted beta, no API/MCP → STEP 3 handed off, not faked.
  • Render key can TTS/SFX/STT but lacks user_read → no live wallet; burn is estimated.
  • eleven_v3 IS API-available now. Literal [pause] tag renders as SILENCE (verified via scribe STT),
    so finals use "..." ellipsis for reliable pauses.
  • Temporal film grain exploded files to ~500 MB (killed H.264 compression) → removed; masters ~2.8 MB.
  • VO says "Books the job" (Shane's exact script). "BOOKED" appears only inside the clearly-labeled
    sample receipt (law-OK). My caption copy uses demo-safe "captures / routes / dispatcher will confirm."
  • board.json had concurrent skill-rail edits (already committed at 10aa172); Run 1 edits layered clean.

HOW THIS PROMPT COULD BE BETTER
  Say whether AI hero footage is required (it's US-blocked via API) or motion-graphics masters suffice;
  define "PROMPT C rail settings" (not in my context — I A/B'd v3 [pause] vs ellipsis instead); and name
  the output folder + whether to auto-commit/push.

===== END =====
```
