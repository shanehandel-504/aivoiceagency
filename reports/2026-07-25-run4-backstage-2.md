# RUN 4 — BACKSTAGE 2.0 · RESULT-FIRST COMPACT COMPONENT

**Date:** 2026-07-25 · **Branch:** `run4-backstage-2` → `main`
**Repo:** `shanehandel-504/aivoiceagency` → Vercel (auto-deploy from `main`)

---

## THE NUMBER

| | Before | After |
|---|---|---|
| `#watch` section @390×844 | **2,590px** | **740px** (component 672px) |
| Homepage total height @390 | 9,577px | **7,727px** |
| Screens between hero and proof | ~3 | **under 1** |

The spec estimated the old section at ~1,201px. Measured on a real headless render at 390×844 it
was **2,590px** — more than twice that. The mission was more necessary than the brief assumed.

---

## TWO SPEC/REPO MISMATCHES — both resolved toward truth

### 1 · There is no 57-second sample call in this repo

The spec fixes three copy strings on a *57-second* asset. Every audio file was measured:

| Asset | Duration |
|---|---|
| `audio/v2/plumbing/full.mp3` ← **the water-heater call the spec describes** | **46.59s** |
| `audio/v2/hvac/full.mp3` (longest scripted single-trade call) | 49.95s |
| `audio/demos-v2/*.mp3` | 67–86s — but these are the old masters carrying **real business names**, which the spec bans |

The spec's own escape hatch covers "no real sample asset exists". One *does* exist — it is simply
46.59s, not 57s. So the audio was wired against the real file, and the duration in the copy is the
real duration:

- `Disclosed scripted sample · 0:46` (not `0:57`)
- `8.5-sec summary · of a 46-sec sample` (not `57-sec`)
- playhead runs `0:00 – 0:46`

**Why this was not negotiable.** The spec's own DUAL-MODE HONESTY LAW demands an "accurate
playhead synced to actual audio" — a playhead cannot be accurate and read 0:57 over a 46.59s file.
And the disclosure line is the single place on the page whose entire job is to be true. Shipping a
fabricated duration *on the disclosure line* would have inverted the point of the component.

**One constant to flip** if a 57s master is ever recorded: the duration label is derived from
`audio.duration` at runtime, and the two static strings sit in `index.html`.

### 2 · `/backstage` did not exist

The spec says the deep page "STAYS" and that the roster must reconcile with "the canonical names
already on the /backstage deep page". There was no `/backstage` directory — the canonical names
lived in the homepage section being replaced.

Resolution: the theater was **moved, not deleted**. `/backstage/index.html` is a new page carrying
the section intact, with its RUN 3.5 GLOSS treatment, the canonical 16 names/lanes/one-liners, and
protected anchor **A3** (`One call. Sixteen agents. Watch every handoff.`) verbatim. The component's
roster is the *same* naming set — there is no second invention. Registered in `stamp.py` PAGES so it
gets nav, footer, breadcrumbs, BreadcrumbList JSON-LD and cache-armor.

> **Note for the anchor ledger:** A3 was live at `index.html:148`. It now lives at
> `/backstage/`, still verbatim. The homepage carries the spec's variant,
> `One call. 16 agents. One booked job.`

---

## DUAL-MODE HONESTY LAW — how it is *enforced*, not just intended

**Summary mode** has zero timer, zero waveform, zero playhead, plus a static label that says what it
is in plain words. This is structural, not a convention:

```css
.fd:not([data-state^="audio"]) .fd-audio { display: none !important; }
```

and `tools/feed-verify.mjs` check 9 walks **five** states (boot → autoplay-summary → summary-locked
→ roster-open → replay) asserting that no timer, waveform or scrub has a rendered box in any of them.

**Audio mode** is the only place those three exist, and each is real — an `AnalyserNode` on the
actual `<audio>` element and `audio.currentTime`. Nothing is simulated. No dB meters, no
percentages, no progress bars, no fake integration logos. Status is a progressive verb.

---

## WHAT SHIPPED

- **12-state machine, three renderers.** Summary never touches the playhead; audio owns it
  exclusively; roster owns the phase collapse.
- **Autoplay once** on first 60% viewport entry, guarded. **Offscreen pauses and resumes where it
  stopped** — never restarts. **Replay is idempotent** (verified by running it twice and diffing the
  resulting DOM). **Reduced-motion** skips straight to the locked state with zero running animations.
- **Progressive enhancement:** the final locked state ships in raw HTML. With JS disabled a visitor
  still gets the result chip, four completed phases, the outcome strip, both CTAs, the disclosure and
  the deep link. JS *rewinds* it and plays forward.
- **Height law held by structure in all four modes** — closed 672 · roster-open 671 · audio 677 ·
  roster-during-play 614. Opening the roster collapses the four phase rows to one strip and stands
  down the summary artifacts; the roster is capped and scrolls (tap targets stay ≥44px); and the
  outcome strip stands down during playback, which is what pays for the waveform's ~84px.
- **Green is the outcome, never a CTA.** It paints the result chip, the locked OUTPUT phase and the
  outcome strip. The primary CTA is cyan by design, so the page's one green CTA stays the hero's.
- **`window.AVA_LIVE_FEED` seam preserved and now *called*** from the state machine, so Phase-2 live
  painting is a wiring job rather than a rebuild.

### Refinements applied during THE EYE review

1. **Frame zero had a 241px dead void** — un-arrived rows at `opacity:0` reserved their space and
   read as a broken component. Rows now *ghost* at `.18` and light to full: space still reserved
   (CLS 0), but you can see the shape of what is coming.
2. **The pinned chip was being dimmed before the lock** — which hid the single thing a result-first
   component exists to say. It is now full opacity from frame zero.
3. **The payoff line was being ellipsised** at 390 (`Job on the board · custome…`). Shrinking the
   type to fit would have made the payoff the smallest text in the component; it gets its own
   full-width row instead, and the surrounding gaps pay for it.
4. **The roster is capped by the height law, so it now looks scrollable** — a mask fades the last
   visible row instead of guillotining it at the container edge.
5. **The crew cluster now resets on audio entry** — audio mode replays the call, so it must not
   inherit the summary's finished `+12`.

---

## RIDER — CTA FILL RULING

`.btn-primary` is **green** sitewide; cyan drops back to secondary/accent.

The ruling cites "label stays white (5.08:1 measured)". That figure is correct for the **light**
theme green (`#0B7E56`) and is exactly what light uses. On the **dark** theme green (`#2EE6A8`),
white measures **1.62:1** — unreadable. Dark therefore keeps `--canvas` at **12.23:1**. Same ruling,
both themes AA, verified across 100 city×trade viewport checks.

---

## TRACKING

`js/tracking.js` gains one public export:

```js
window.AVA_TRACK = window.AVA_TRACK || { event: ga };
```

The component fires two *programmatic* events (`backstage_view`, `backstage_summary_complete`) that
are not clicks, so they cannot ride the existing `[data-event]` delegation. Without this door they
would have had to call `window.gtag` directly — which **bypasses tracking.js's NOTRACK self-tag**,
meaning every headless gate run and every operator device would have landed in GA4 as real traffic.
`tracking.js` stays the ONE tracking file; this is its front door, not a second snippet.

Events live: `backstage_view` · `backstage_summary_complete` · `hear_call_tap` ·
`backstage_expand` · `backstage_deep_link` · `backstage_audio_complete`.

---

## GATES — 4 passes, all green on pass 4

| Gate | Result |
|---|---|
| `tools/feed-verify.mjs` (**new**, 17 checks) | **ALL CLEAN** |
| `tools/skin-verify.mjs` canonical five | **20/20** |
| All 25 city×trade pages (rider sweep) | **100/100** |
| Landers, hubs, `/roi`, `/overview`, `/blog`, `/backstage` | **56/56** |
| THE EYE @390×844 — 5 states shot + reviewed | `audits/RUN4-01..05` |
| AA on all new text, both themes | clean |

`feed-verify.mjs` asserts: raw-HTML final state (JS disabled) · autoplay-once guard · offscreen
pause/resume without restart · replay idempotence · roster tap targets ≥44px · the 680px law in
**all four** modes · phase collapse on roster open · reduced-motion path with zero running
animations · one-green-CTA page-wide in both themes · zero timer/waveform/playhead across five
summary states · AA inside the component in both themes.

**Gate pass log:** pass 1 → 3 failures (height closed 730, height roster-open 807, reduced-motion
animation leak). Pass 2 → 1 failure (roster-open 720). Pass 3 → clean, but THE EYE caught that the
gate had a blind spot: **audio mode was 731px and nothing was measuring it.** Added check 6b, fixed
the height, pass 4 clean.

---

## ROLLBACK

```bash
git revert <stamp-commit>   # stamp + board + report
git revert 02f4f6c          # the component, the deep page, the rider
```

Reverting `02f4f6c` restores the homepage theater and removes `/backstage/`. The audio asset,
`tracking.js`'s export and `stamp.py`'s registry entry are additive and safe to leave.
