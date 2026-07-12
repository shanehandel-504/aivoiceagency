# SCREEN-RECORD AD PIPELINE v1 — Jul 12 2026

```
===== SHANE READBACK — COPY ALL =====

SAMPLE READY — awaiting Shane's vote.

PLAIN ENGLISH
Built a new ad pipeline that GENERATES NO VIDEO — it screen-records the real product working.
A new hidden page, /ad-stage, runs the phone-sim as a clean full-screen "CRM record" and writes
each field a beat AFTER it's spoken. Playwright records it frame-by-frame (deterministic, zero
artifacts), then ffmpeg lays the real call audio, burned captions (for muted autoplay), and a
3-second AVA end card over it. Because it's real footage of the product, quality is 100% and it's
prove-work by construction — we SHOW the record write itself instead of claiming anything.

I rendered ONE 12-second VERTICAL sample and published it, gated, at /work/ads so you can watch it
on your phone. Then I STOPPED — nothing else renders until you vote.

  • This sample's audio = the existing LABELED sample call (AI-generated, disclosed on-frame). The
    visual is the real product either way. The 100%-real audio (a real call on the 414 line) is your
    move — see PENDING-SHANE.

>>> WATCH: aivoiceagency.ai/work/ads  (Work Deck passcode) — video attached to this readback too.
>>> VOTE:  reply "GO ADS" to render all 3 formats (9:16 · 1:1 · 16:9) + publish with downloads,
           or send notes (pace / which field lands / caption / end card).

DONE
| ITEM                    | STATUS            | PROOF                                                   |
|-------------------------|-------------------|---------------------------------------------------------|
| /ad-stage capture page  | LIVE (noindex)    | render(t) proven: Urgency writes at t≥8.9, pending before|
| hvac-sample timing JSON | LIVE              | ad-stage/scripts/hvac-sample.json                        |
| Playwright capture      | DONE              | 690 frames @ 60fps, 1080x1920, deterministic            |
| Composite (ffmpeg)      | DONE              | audio + captions + AI-disclosure + 3s end card          |
| Vertical 12s sample     | PUBLISHED (gated) | /work/ads → 14.5s · 60fps · 1080x1920 · 0.57MB, mp4 200  |
| /work/ads review page   | LIVE (FIFTHGEAR)  | video plays, GO-ADS vote + Plan-A steps                 |
| hq/board.json           | UPDATED           | content lane + ISO log entry                            |
| Vercel deploy           | GREEN             | live URLs 200 (verified below)                          |

PENDING-SHANE — PLAN A (the 100%-real audio)
  1. Call 414-240-8930 from your phone; play the caller (state a problem, let AVA qualify, take a slot, say yes).
  2. Hang up — Retell records it automatically.
  3. Tell me "pull my call" (rough time). I fetch that recording_url, make it the master timeline,
     re-time the field cues to your real call, and re-render.
  Privacy law honored: 194 Retell recordings exist but NONE are provably yours (inbound = real
  prospects), so I used none. Only a call you place is provably yours.

IDS / ROLLBACK
  • Commit: <this run's commit> → rollback: git revert <hash> && git push (removes /ad-stage + /work/ads).
  • Re-render sample (no call): serve repo :8847 → FPS=60 node AVA-factory/adstage/capture.js →
    python AVA-factory/adstage/adstage_build.py
  • GO ADS = run capture.js with FMT=sq (1080x1080) + FMT=wide (1920x1080) + rebuild; publish 3 files.
  • Build scripts live in AVA-factory/adstage/ (NOT the site repo).

WHAT'S NEXT
  1. Watch the sample; vote GO ADS or send notes.
  2. (Optional now) place the Plan-A call so the final uses 100%-real audio.

GOTCHAS
  • ElevenLabs Video / generated video = NOT used by design (artifacts). This pipeline records the real page.
  • Local tooling only on the Dell (Playwright installed in AVA-factory, browsers cached) — never in the site repo (vanilla/no-npm site law intact).
  • Deterministic frame-seek (render(t) is a pure function of time) beats Playwright's ~25fps screencast → true 60fps, zero dropped frames.
  • ASS captions need the "Name" field in the Events Format line or a comma leaks into the caption (fixed).
  • Sample is ~12s stage + 3s end card = 14.5s total.

HOW COULD THIS PROMPT BE BETTER
  Say whether the sample should feature the OPENING (urgency writes — what I chose, price/claim-free)
  or the BOOKING CLIMAX (the Booked field + receipt writing itself, punchier but touches sample pricing);
  and confirm the target fps (I used 60 deterministic) and whether the sample video should be committed
  to the repo (I committed the 0.57MB file so you can watch it on your phone via the gated page).

===== END =====
```
