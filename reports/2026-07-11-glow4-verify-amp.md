===== SHANE READBACK — COPY ALL =====

# L1 — GLOW VERIFY + AMP (GLOW4) — 2026-07-11

## Plain English
You asked me to (1) look at what GLOW3 actually shipped on the phone with my own eyes, on a real mobile
screen, and grade each piece, then (2) amp the three glows you keep asking for and publish.

Done. GLOW3's three glows were real but timid — a whisper-thin ring on a button, a frame that lit up empty
space, and a tiny pulse on the little play button. The phone itself — the thing your eye lands on — had NO
ring at all. I rebuilt all three as "GLOW4" and it's live on aivoiceagency.ai now:

- The hero PHONE now has a living, breathing cyan ring hugging the whole device frame. It glows gently at
  rest and gets obviously brighter + faster the moment AVA is "on a call." Alive at arm's length.
- The "enter your phone number" call box now lights up a cyan frame the instant you tap into it, and flips
  to a green frame when AVA confirms the callback — on both the hero card and the bottom "Two ways in" card.
- While a demo call plays, a radar ring now pulses OUT from the phone frame (not the tiny button) — tuned to
  look elite when you screen-record it at 1080×1920 for social.

I verified every piece against the real shipped CSS on a 390×844 mobile viewport, then confirmed it live on
production. Zero layout shift, no errors, +2.6KB.

## VERIFY — what GLOW3 shipped, graded (mobile 390×844, animations frozen at peak)
| # | Selector | Effect | Verdict |
|---|----------|--------|---------|
| 1 | `.hero-cta .btn-cyan::after` (g3-cta-breathe) | 1.5px cyan ring breathing on the "Hear AVA answer" button | TOO SUBTLE — barely reads even at peak opacity .5 |
| 2 | `.pod-panel[data-panel="call"].active::after` (g3-frame) | inset cyan frame, always-on when the Call-me tab is open | VISIBLE but MIS-SCOPED — framed the whole empty pod body, not the card; not tied to focus/submit |
| 3 | `.play-btn[data-play]::after` (g3-play, on demo-active) | small ring hugging the 56px play button | VISIBLE but TINY — nowhere near "around the phone" for a social capture |
| — | the device frame `.phone` | (nothing) | MISSING — the phone had no living ring; the FINAL-CUT `phone-breathe` was a .16-alpha whisper only after 3 rings |

## AMP — GLOW4 (what shipped)
| Ask | Built | Selector / hook |
|-----|-------|-----------------|
| (a) Siri-class breathing ring on the device frame, synced to Signal states, obvious | Living halo: idle cyan breathe → **audio-live** amp (brighter/faster) | `body.glow-ready .phone:not(.ringing)` → `g4-halo`; `body.glow-ready.audio-live …` → `g4-halo-live` |
| (b) Call box activation glow frame on focus + submit | Cyan frame on `:focus-within`, green frame on submit-success `:has(.gate-status.ok)` — hero card + S9 gate card | `.pod-panel[data-panel="call"] .mini-gate` + `.gcard.a .mini-gate` |
| (c) Demo-playback pulse around the phone, tuned for 1080×1920 | Radar ring emanating from the frame while the pod plays (transform+opacity, 60fps) | `body.glow-ready.demo-active .phone::after` → `g4-radar` |
| (kept) | GLOW3 #1 hero-CTA breathing ring | unchanged |
| (retired) | GLOW3 #2, GLOW3 #3, FINAL-CUT `phone-breathe` | superseded |

Doctrine held: SINGLE cyan #00D4FF for every glow (green stays semantic = success only); all motion gated
behind `body.glow-ready`; zero new DOM; zero layout shift; reduced-motion-safe (halo → faint static glow,
CTA ring + radar hide, call-box frames are static).

## DONE — shipped & live
| Item | Live | Proof |
|------|------|-------|
| GLOW4 in `assets/funnel.css` | ✅ aivoiceagency.ai | prod CSS has `g4-halo`×4, `g4-radar`×2, focus-frame×2; `g3-frame`=0, `@keyframes phone-breathe`=0 |
| Living halo runs on prod | ✅ | live DOM: `getComputedStyle('.phone').animationName === 'g4-halo'`, `glow-ready` auto-fires, host=aivoiceagency.ai |
| Call-box focus (cyan) + success (green) | ✅ | computed box-shadow: focus `rgb(0,212,255)` 2px, success `rgb(0,230,118)` 2px — hero + S9 both |
| Demo radar | ✅ | `body.glow-ready.demo-active .phone::after` → `g4-radar`, ring emanates outside bezel (money shot) |
| Perf budget | ✅ | CLS = 0, no console errors, net +2,605 bytes (~2.5KB, < 6KB cap) |
| BOARD LAW flip | ✅ | `hq/board.json` L1 lane note → GLOW4; run-log entry appended; top-level `updated` bumped |

## Checkpoints / rollback
- Code commit: `f794282` (`feat(/): GLOW4 — founder AMP of the 3 glow signatures`), 2 files.
- One-line rollback: `git revert f794282 && git push` (restores GLOW3 + phone-breathe verbatim).
- Prior homepage-frozen pin was `57d737a` (THE LAST CUT). This run is a Shane-directed glow un-freeze.

## What's next
- If you want the on-call halo even louder for the reel, bump `g4-halo-live` 50% shadow from `.72/54px` toward `.85/64px` (still zero-CLS).
- Optional: cyan success frame instead of green on the call box, if you'd rather stay strictly single-cyan (currently green = success per ACCENT LAW).
- Homepage returns to POLISH FREEZE — re-froze at `f794282`; further glow work needs an explicit un-freeze.

## Gotchas (for the next run)
- The in-app Browser pane's screenshot tool hangs on this build; use chrome-devtools-mcp `take_screenshot` + `emulate viewport 390x844x3,mobile,touch`. `resize_page` alone does NOT constrain the CSS viewport → renders desktop.
- `body.glow-ready` is set via a `requestAnimationFrame` on load; a throttled/background renderer never fires it — force it in-page when capturing.
- Static server (`python -m http.server`) + browser caching served STALE CSS after edits — use a hard reload (`ignoreCache`) or cache-bust before trusting a capture.
- `:focus-within` / `:has()` box-shadow reads look wrong if taken mid-`.28s` transition — read again a beat later.

Before/after contact sheet attached (`glow4-before-after.png`).

===== END =====
