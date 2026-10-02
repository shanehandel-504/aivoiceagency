# AIC HOMEPAGE — SIX RECORDED SAMPLE CALLS · Oct 2 2026

Lane: cloud Claude session (Shane: "full authority … burn the credits … go create something awesome", Oct 2 11:30 AM CT).
Host: aichauffeur.ai (Vercel project rooted at /chauffeur/). Brand law: chauffeur/DESIGN-SYSTEM.md (Signal v1.6).

## What changed
- `chauffeur/index.html` — the #demo section (the single maxim recording and its percentage-timed reveal) is now a six-call player. The old inline maxim script is removed. `maxim-v2.mp3` stays in the repo (additive law).
- `chauffeur/assets/aic-calls.js` (new) — the player. The recording is the clock: transcript, trip sheet, waveform and chapters follow `audio.currentTime`. Ready rest state, guided page follow that yields to the visitor, touch-safe waveform, deep link `?call=<id>`, no hash writes.
- `chauffeur/assets/aic.css` — RUN S1 block appended, every rule scoped to `#demo`. Unplayed / said / speaking lines dim by colour (ink-mute 5.41:1 · ink-soft 9.8:1 · ink 15.7:1 on the console surface), never by opacity.
- `chauffeur/audio/samples/v1/` (new) — six calls, `.m4a` + `.mp3`.
- `chauffeur/llms.txt` — one line naming the six sample calls.

## The six calls
| Tab | Company (invented) | What it shows | Length |
|---|---|---|---|
| Airport | Corbel Black Car | Rate quoted from the rate sheet, flight tracked, booked, receipt by text and email, chauffeur details by text | 1:09 |
| Corporate | Larkin & Ashe Chauffeur | Account pulled from the CRM, billed to the account, text to the passenger, email + calendar invite to the assistant | 1:03 |
| Wedding | Tavenner Limousine | Hourly rate + minimum, hours changed 5 → 6 on the sheet, booked, deposit link by text, contract by email | 1:15 |
| My driver | Ironbridge Livery | Reservation pulled up, door and coat texted to the chauffeur, live hand-off to dispatch with a one-sentence brief | 0:58 |
| Rebook | Kestrel Row Car Service | Cancel inside 24 hours routed to dispatch, new trip booked on the same call, vehicle changed sedan → SUV on the sheet | 0:55 |
| Group of 26 | Greyhaven Limousine | Caller shopping three companies; minicoach priced and booked on the first call; owner alert | 1:09 |

Scripts were merged from the six-AI challenge (v2 prompt): Perplexity 1, 3, 6 and Claude 2, 4, 6 as bases, with ChatGPT's review folded in (urgent transfer is not a new reservation; corrections change visibly on the word; flight arrival kept separate from pickup). Shane's Oct 2 direction: "booked" is the catchphrase, and the calls show what the line can be set up to do. The page note reads: "Sample calls: built scenarios, sample trips and rates, recorded voices."

Voices (Eleven v4): Zara answers every call. Callers: Nick, Amy, Alexandra, Jarnathan, Hale, Juniper. Dispatch: W. L. Oxley. 26 generations, every one billed 0 credits (launch promo through Oct 12). Mixes: two rings, pickup, caller phone filter, text ping + email chime, hold ring and connect click on the transfer, loudnorm −16 LUFS (measured −16.4 to −16.5).

## Verification
- Speech-to-text on every take and every final mix; every line present (the greeting window re-checked on its own where the full-file pass skipped it after the ring).
- Local render at 390 / 375 / 440 / 1440: no horizontal overflow, nothing under 12px, six tabs at 48px, ready state "Waiting".
- Every call played and seeked to the end at 390 and 1440: chip ends on the success label, result card on, after-call block shown, button back to idle, zero page errors. Deep link and Next verified.
- Gates on the local build: `aic-run9-gate` all PASS (114 renders) · `aic-run10-gate` ALL GREEN · `aic-run14-gate` GATE PASS (19 pages × 5 widths). `aic-run12-gate` 5 FAILs identical to the untouched baseline. `aic-run11-gate` crashes on stale probes on the baseline too.
- Only console error anywhere: `/_vercel/insights/script.js` 404, which exists only on Vercel.

## Defects found and fixed before ship
1. Chapter labels overprinted on phones. The row now measures itself and keeps only the current chapter's words when it is tight.
2. A seek into a silence left the script parked at the top. It now snaps to the last line said, even while paused.
3. Opacity dimming failed AA (gate 14: 154 findings, all in this block). It now dims by colour.
4. Transcript `<details>` inherited the FAQ's 12px radius and blue open-state bar.
5. A `var cur` inside `render()` shadowed the call index and broke play.
6. `html{scroll-behavior:smooth}` on this host made the per-frame follow scroll creep forever. Follow forces `auto` for its own call and restores it.
7. "Next: the o'hare pickup call" — the next-call name now comes from a per-call reference, not a lowercased tab.

```
===== SHANE READBACK — COPY ALL =====
WHAT HAPPENED: aichauffeur.ai now plays six recorded sample calls where the old maxim recording was. Pick a call, press play, and the trip sheet fills in while it plays, including the moment a caller changes something. Every call shows a different thing the line can be set up to do: rate quotes, flight tracking, the CRM, a calendar invite, a deposit link, a contract, a text to the chauffeur, a live hand-off to dispatch, a cancel routed to dispatch, an owner alert. Five of the six end on "You're booked"; the sixth puts the caller through to dispatch live.

DONE
| What | Live | Proof |
|---|---|---|
| Six-call player on the homepage | aichauffeur.ai/#demo | gates 9, 10, 14 pass; every call played to the end at phone and desktop size |
| Six recordings, Eleven v4 | /audio/samples/v1/ | 0 credits each; every line checked by speech-to-text |
| llms.txt line for the six calls | aichauffeur.ai/llms.txt | in the same commit |
| Board item + log entry | aivoiceagency.ai/hq | hq/board.json |

ROLLBACK: git revert the commit that added this report. The old maxim player comes back with it; no audio is deleted either way.

NEXT: listen on your phone and say which call is weakest; any line can be re-recorded at 0 credits until Oct 12. The other 15 keepers from the challenge are recordable the same way.

GOTCHAS
- The calls show what the line can be set up to do, beyond the base capture-only product (rates, CRM, deposit, contract, chauffeur text, owner alert). If a prospect asks for one, it is a build-when-paid item.
- The wedding call runs 1:15, five seconds over the 70-second target, because it carries the most beats.
- After Oct 12, re-records cost credits. Zara is a library voice; future re-records depend on it staying in the library.
- The AVA homepage player has the two latent bugs fixed here (chapter labels on phones, the script stalling after a seek into a silence). It was not touched, per Shane's no-going-back rule; a bug fix is allowed under the freeze if wanted.
- aic-run11-gate probes #ava-callback, gone since Sep 17, and every AIC gate hard-codes the Dell's Playwright path.
```
