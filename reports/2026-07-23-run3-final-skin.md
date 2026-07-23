# RUN 3 — FINAL SKIN · 6-AI BAKE-OFF MERGE

**Date:** 2026-07-23 · **Repo:** `shanehandel-504/aivoiceagency` · **Live:** https://aivoiceagency.ai
**Status:** COMPLETE — 4/4 commits shipped, pushed, Vercel green, board flipped per commit.

---

## What actually changed, in plain English

The site had a colour problem: cyan meant everything, so it meant nothing. Three or
four filled cyan buttons could share one screen, each shouting equally loud, and a
visitor had no idea which one was the thing to do. Underneath every one of those
buttons sat a rotating ring that faded gold → violet → cyan — two banned colours,
painted under every primary button on the whole site.

Now there is one rule a plumber could state out loud: **green means do this.** There
is exactly one green thing per screen, everywhere on the site. Cyan means "look at
this / this is the system". Amber means "here is what the miss costs you". Red means
"here is the miss". Nothing else gets a colour.

The homepage hero is the frozen canon. `/book` strips away every exit until you have
engaged the calendar. `/live` tells you what state each field is in. `/lsa` prints
Google's own sentence on white paper so it cannot be mistaken for our copy.

---

## DONE table

| # | Artifact | Live | Proof |
|---|---|:--:|---|
| C1 | RUN 3 tokens + semantic law on the global stylesheet | ✅ | `605ef1d` · every value measured, lowest dark token red 5.63:1 |
| C1 | `.cta` / `.cta--quiet` canonical button system | ✅ | `605ef1d` · `assets/circulant.css` |
| C1 | Primaries converted AT SOURCE, not page-by-page | ✅ | `.bs-cta-cyan` (~120 pages) + nav/callbar → quiet; `.btn-primary` (40 SEO pages, each verified to carry exactly one) → green |
| C1 | **RAINBOW AUDIT P0** — gold→violet→cyan ring killed at the mixin | ✅ | `--bz-pulse-2` / `-3` **deleted**; grep = 0 |
| C1 | Hero → A1 + A2 verbatim, one green CALL AVA LIVE | ✅ | prod H1 = `3AM. GOOGLE WAS LISTENING.` |
| C1 | 3AM strip rebuilt + **light-mode bug fixed** | ✅ | was hardcoded `#101018`; now token-driven |
| C1 | `"responsiveness score"` → Google's word | ✅ | repo grep **0** · prod `/lsa` grep **0** |
| C1 | DURATION LAW = 30 | ✅ | 69 files + stamp.py; grep **0** |
| C2 | AVA STATUS RAIL (real events only) | ✅ | `8865063` · 5 hops from `reports/2026-07-22-run15-e2e-proof.md` |
| C2 | LIVING WAVEFORM — real AnalyserNode | ✅ | `tools/wave-proof.mjs` **9/9**; trace changes over time |
| C2 | `window.AVA_LIVE_FEED` seam pre-wired (socket NOT built) | ✅ | `js/ava-signal.js` |
| C3 | `/book` FOCUS MODE + branded skeleton + proof rail | ✅ | `443a464` |
| C3 | **GHL calendar description 20 → 30 minutes** | ✅ | API write to `aCIv7rUnCGrysobt6Mlg`, re-read to confirm |
| C3 | `/live` field states + amber pending + verbatim receipt | ✅ | receipt copied from the deployed n8n SMS node |
| C3 | `/lsa` GOOGLE DOCUMENT CARD (only light surface) | ✅ | quote 17.02:1, link 5.85:1 |
| C3 | `/lsa` stat demotion + merged phone CTAs + amber $28,458 | ✅ | `audits/PROD-lsa-*.png` |
| C4 | PRICING — one green that TRANSFERS on selection | ✅ | prod: solid-green tier CTAs = **1** at 390 and 1440 |
| C4 | Audio → one featured + two compact records | ✅ | `audits/c4-audio-desktop.png` |
| C4 | KILLS: ✓-spam · equal-weight theater · purple dot · neon glow | ✅ | `c59481c` |
| C4 | Footer suppressed (all links kept) + sticky-bar overlap fixed | ✅ | `.bfoot` added to the IO suppression list |
| V | Canon sweep — 3 real misses closed | ✅ | `cca67f9` |

**Final commit on `main`: `dc4a8fb`. Production asset hash: `cca67f9`.**

---

## Grep proofs — all zero

```
"responsiveness score"                     0
meeting-length 15/20-minute in html        0    (only "10 Minutes Up Highway 45"
                                                 remains — a drive time, kept)
multi-hue gradient tokens on buttons       0
block-glyph kickers                        0
"MOST OPERATORS" chip                      0
blanket "No contracts. Cancel anytime."    0
violet/gold button fills on public CSS     0
```

## Law gate — production, 20/20 clean

`tools/skin-verify.mjs` renders each page at **390×844 and 1440×900 in BOTH themes**
and asserts, per viewport band: solid greens ≤ 1 · zero multi-hue gradients on
interactive elements · zero light-text-on-red · zero horizontal overflow · every
visible text node ≥ 4.5:1 against its painted backdrop.

```
/ /live /book /lsa /overview × mobile+desktop × dark+light  =  20/20 clean
#pricing solid-green tier CTAs = 1 at 390 and at 1440
```

## AA spot-check — all pass

| Pair | Ratio |
|---|---:|
| gdoc quote `#14161C` on paper | 17.02:1 |
| gdoc source link `#00688F` on paper | 5.85:1 |
| MISS red label on panel | 5.40:1 |
| ANSWERED green label | 11.72:1 |
| $28,458 amber (large) | 10.80:1 |
| **text on solid red fill** `#0A0A0F` | **5.63:1** |

Shane's red law is empirically correct: `#EEF0F4` on `#FF3B4E` measures **3.07:1** —
it fails, which is exactly why the law says the label must be `#0A0A0F`.

---

## Two judgement calls, stated plainly

**1. The status rail does not end on JOB BOOKED.**
The brief's cycle was RINGING → ANSWERED → INTENT FOUND → SLOT HELD → JOB BOOKED, fed
by "REAL events, NEVER fabricated". The Run 1.5 end-to-end call is genuinely real — real
outbound from 414-946-6486, answered, 57s talk time, 8/8 variables off a live scrape —
but it was a **system test**. It never held a slot and never booked a job.

The obvious second source was the plumbing audio. In commit 2 I used it, and that was
wrong: that audio is disclosed **on the same page** as "Scripted scenarios, not customer
recordings". Using it on a rail labelled RECENT ACTIVITY would have been dressing
scripted copy as real activity. I caught it in commit 4 and corrected it.

The rail now shows the five hops that actually happened:
**TEXT SENT → RINGING → ANSWERED → INTENT FOUND → RECAP SENT.**
No-fabrication outranked the state list. A REPLAY chip makes clear it is not a socket.

**2. The same audit found a live contradiction.** The audio section's heading read
*"Hear AVA answer a real call"* while its own disclosure eight lines below read
*"Scripted scenarios, not customer recordings."* Both cannot be true. The heading now
matches the disclosure — the **voice** is real, the **scenario** is scripted.

---

## Left undone, deliberately — RUN 3.5

`styles.css` contains **zero** light-theme overrides. It was never tokenized for light
mode at all, which is the job the brief explicitly deferred ("do NOT attempt it this
run"). It is not a two-rule patch, so it was left alone rather than left half-done.

The gate produced the exact work-order:

| Page | Failure | Measured |
|---|---|---:|
| city × trade (40 pages) | `#00D4FF` headline accent on paper | 1.62:1 |
| city × trade | hardcoded `#14141C` panels never flip while their text does | 1.01:1 |
| `/ground-transportation` | same two classes | 1.62:1 / 1.01:1 |

These were confirmed **byte-identical before this run** by stashing every change and
re-running the gate — they are pre-existing, not regressions.

## Still PENDING-SHANE (unchanged by this run)

- **GHL → n8n `/webhook/live-ready` is UNVERIFIED.** Until Shane replies READY to the
  AVA text and confirms an execution on `V6wAFgJ803xmLM0K`, a real prospect who replies
  READY gets no call. Highest-priority item in the machine.
- `AVA Post-Call to GHL (Demo Send)` `6r8YHuMEJbxeDyT5` still 400s at GHL Upsert Contact.

## New tools

- `tools/skin-verify.mjs` — the law gate. Run against local or prod.
- `tools/wave-proof.mjs` — proves the waveform reads real audio AND that audio stays audible.
