# AIC HOMEPAGE · THE HERO PLAYS THE CALLS · Oct 2 2026

Lane: cloud Claude session. Shane at 5:18 PM CT: on desktop "it has the board on the right kind of filling itself out, but I think that that should be the audio right there"; on the phone "we need to move it up"; "CEO mode. Do whatever you wanna do."

## What changed on aichauffeur.ai
- **The hero's right column is the six-call player.** The play control, the six tabs, the recorded call with its waveform and words, and the trip sheet that fills in on the word. It is now beside PUSH TO CALL AI, where the board used to be.
- **The dispatch console ("the board") is gone, along with its 11.8-second loop.** It acted out a call with a made-up caller. The recorded call does the same job for real, with sound. There is now one fill-in moment on the page, not two.
- **One money button.** The play control is an outline (a blue line and a blue play mark). PUSH TO CALL AI stays the only filled button in the fold, as the one-filled-control law requires.
- **Phone.** The player moved from about 2,860px down the page to 839px, one short scroll under PUSH TO CALL AI. Two things made that possible: the player itself moved up, and the long hero subhead is hidden under 768px. That subhead repeats the four sentences above it, and it still shows from 768px up.
- **Desktop.** When a visitor presses play, the page eases down so the call and the sheet stay in view, and PUSH TO CALL AI stays on screen beside them for the whole call.
- **Below the hero.** `section#calls` keeps the heading, the subhead and all six written transcripts. `#demo` moved with the player: `/#demo`, `?call=<id>` and llms.txt all land on the hero player now.
- **Not changed.** No visible copy was edited. The engine (`aic-calls.js`) and the audio are the same files. Phone agents, GHL, n8n and Twilio were not touched.

## Files
- `chauffeur/index.html`: the console markup and its timeline script are removed, the player is in the hero, the transcripts are in `#calls`, and the homepage `aic.css` stamp is `?v=s1003a`.
- `chauffeur/assets/aic.css`: about 70 lines of hero-console CSS are deleted (the pulse, the lit edge, the intake animation, the state chip and the proof loop); `#demo .sc-tx` is re-scoped to `#calls`; there is a new "THE HERO PLAYS THE CALLS" block.
- `chauffeur/DESIGN-SYSTEM.md`: § 4 GLOW LAW is amended (scene 1 is retired), and a § 12 round 3 ruling is added.
- `tools/aic-run11-gate.mjs`: the demo-pair negative control plants its own pair now that no page has one. Three steps that crashed on the callback form (removed 2026-09-17) now skip when the form is absent. The gate had not completed a run since that date.

## Verification (local build, against the same gates the last AIC run used)
- Rendered at 390x844, 1024, 1280 and 1440, at rest and 24 s into a call. No overflow and no console errors except the known analytics 404.
- run 9 render gate: PASS on all lines. That includes overflow, contrast, accents per section (at most 2), a homepage shadow count of 9 (the limit is 15), and reduced motion.
- run 10: ALL PROBES GREEN.
- run 11 (amended): all ten negative controls fire. The anchors, the rail, the deep link, the skip link, the back button, radius, FAQ, and 'two filled controls never co-occur' (17 pages x 6 widths) all PASS. Its two FAILs match the baseline: the .btn-go recipe check and the safe-area check. A third FAIL showed up only while four gates were running at once: a rail read on /madison/, a page this run did not touch. Re-probed alone on both builds at 390 and 430, it came back clean.
- run 12: FAIL lines identical to the untouched baseline, line for line. They are the `/privacy/` and `/terms/` orphans, the PUSH TO BOOK canon that predates PUSH TO CALL AI, and the `#ava-callback` anchors on four pages that lost the form on 2026-09-17. Nothing new.
- run 14: GATE PASS, 19 pages x 5 widths, all eight assertions.

## Rollback
`git revert 203ea3c`. The previous hero (console and loop) comes back byte for byte. The audio and the engine never changed.

```
===== SHANE READBACK — COPY ALL =====
WHAT HAPPENED: On aichauffeur.ai the sample-call player now sits in the top section, on the right beside PUSH TO CALL AI, where the self-filling board used to be. Visitors can press play the moment the page opens. The trip sheet fills in while the recorded call plays, so the board you liked is still there, but now it is real and has sound. The old board is gone. On a phone the player is one short scroll under PUSH TO CALL AI. It used to be about three phone screens further down.

DONE
| What | Where | Proof |
|---|---|---|
| Player in the hero, board retired | aichauffeur.ai (203ea3c) | rendered at 390/1024/1280/1440, at rest and mid-call |
| One green button in the fold | hero | play control is an outline; the co-occurrence gate passes on 17 pages x 6 widths |
| Phone: player moved up ~2,000px | aichauffeur.ai on iPhone | play control at 839px (was ~2,860px) |
| Design law updated | chauffeur/DESIGN-SYSTEM.md § 12 round 3 | glow scene 1 retired |
| Gate kept alive | tools/aic-run11-gate.mjs | all 10 negative controls fire |

ROLLBACK: git revert 203ea3c. The old hero comes back as it was; the audio and the player engine never changed.

NEXT: watch play clicks (sample_play_hero) next to PUSH TO CALL AI taps (tel_tap_hero / qr_open_hero) for a week. Video 02 on your go.

GOTCHAS
- The play event was renamed from sample_play_demo to sample_play_hero. That event was hours old, so no history is lost.
- Sitemap lastmods are behind git on both sites: 79 entries. The pre-commit hook is not set in this clone. One stamp run fixes it; give it its own run.
- run 11 had not finished a run since the callback form left on Sep 17. It finishes now, with two FAILs that pre-date today's change.
```
