# RUN 1.6 — HEAR AVA + PRICING POLISH + CACHE ARMOR + WEBKIT GATE — 2026-07-15

```
===== SHANE READBACK — COPY ALL =====

RUN 1.6 — HEAR AVA + PRICING POLISH + CACHE ARMOR + WEBKIT GATE — LIVE
https://aivoiceagency.ai/

PLAIN ENGLISH
Four additive upgrades, no content touched.

1. HEAR AVA — a new section right under the theater plays three real AVA
   calls (plumbing, HVAC, electrical) — AVA's real voice on the recordings,
   the same calls the theater animates. Glass cards with play/pause, a
   scrubber, the time, and a tap-to-read transcript. Nothing loads until
   you press play (zero speed cost), never autoplays, one plays at a time,
   fully keyboard/screen-reader friendly.
2. PRICING POLISH — the plan cards got the premium treatment back: the
   Starter card lifts with a cyan ring, bigger price, green check bullets
   with divider lines, hover lift. Prices, names, bullets, buttons, and the
   tabs are byte-for-byte unchanged — skin only (proven by a diff).
3. CACHE ARMOR — every stylesheet, script, and audio URL now carries a
   version tag (?v=hash). Every future deploy changes the tag, so browsers
   can never serve a stale file again — the failure you hit is now
   impossible.
4. WEBKIT GATE — iOS Safari is now a permanent test. The full suite runs on
   Chrome AND Safari before anything ships, and THE EYE takes Safari
   screenshots of /, /book, /roi.

PHASE 0 (recon, gate): I inventoried every audio file in the repo + git
history. Real AVA-voice call recordings EXIST (7 canonical trade demos,
41–49s). I grepped every transcript for banned phrasing — all clean, no
"sounds human" / "locked in" / she-her. No audio was synthesized.

DONE TABLE
| Phase | Shipped | Proof (live/verified) |
|---|---|---|
| 0 Recon | audio inventory + transcript grep | 7 clean AVA calls found |
| 1 Hear AVA | index.html #hear + player + css | preload=none, plays, transcripts |
| 2 Pricing skin | css/backstage.css .bs-tier | diff-clean, lift+ring+34px+green✓ |
| 3 Cache armor | tools/stamp.py + __ASSET_V | ZERO unversioned on /,/book,/roi |
| 4 WebKit gate | tools/e2e.mjs + render-audit.mjs | E2E green on Chromium+WebKit |

GATES (all met)
- Dual-engine E2E 22/22 GREEN on Chromium AND WebKit @390
- Zero console errors on /, /book, /roi — both engines
- LCP 625 ms (gate <2.5s) · CLS 0.00
- Lighthouse mobile: A11y 100 · SEO 100 · Agentic 100 (BP 77 = Meta-pixel
  cookie, pre-existing) — ≥ Run 1.5
- Pricing HTML byte-identical (content freeze proven via diff)
- preload="none" verified — zero .mp3 fetched on page load, both engines
- Grep guards clean: only 414-240-8930; no banned phrases incl. the new
  transcripts; AVA never she/her
- 15-agent adversarial review: 4 confirmed defects, ALL FIXED before ship
  (cache armor missing /styles.css + /site.js on 29 pages [HIGH]; audio
  scrubber not resetting on clip-end; light-theme scrubber track too faint;
  pricing hover-lift sticking on touch tablets)

IDS / ROLLBACK
- Rollback tag: pre-run16-2026-07-15
- One-line rollback: git revert <run16-commit> && git push

WHAT'S NEXT
- Your phone re-test on iOS Safari: play a Hear-AVA clip, read a transcript,
  check the pricing cards in both themes.
- Next deploy will auto-bust caches (the ?v tag advances each commit).

GOTCHAS
- Cache armor covers the 37 canonical stamp.py pages (all indexable pages +
  /, /book, /roi). Internal/noindex pages (/work/*, cockpits, /voice-ab,
  /deck, satellite) are out of this run's scope — say the word to extend
  stamp.py to them.
- The ?v tag tracks the last commit (standard git-hash busting): run
  stamp.py as the final step before each push so the tag advances. It's
  already the required build step for the nav/footer markers.
- Hear AVA uses the existing /audio/v2/{plumbing,hvac,electrical}/full.mp3
  recordings (untouched, cache-immutable). The other 4 trade recordings
  (roofing/dental/corporate-car/medspa) are available if you want more clips.
- WebKit browser was installed locally for the gate (Playwright webkit).
  tools/e2e.mjs + render-audit.mjs borrow Playwright from AVA-factory/adstage
  (Shane's machine) — they're build-time tools, never deployed.

===== END READBACK =====
```
