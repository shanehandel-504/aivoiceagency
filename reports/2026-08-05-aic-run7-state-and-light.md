# AIC RUN 7 — "STATE & LIGHT"

**Date:** 2026-08-05 · **Site:** aichauffeur.ai (12 pages) · **Repo:** `shanehandel-504/aivoiceagency`, root `chauffeur/`

---

## WHAT THIS WAS

A one-hit polish pass. No redesign, no new sections. The DOM barely moved — what changed is
**state** (things on the page now say what they mean) and **light** (sections separate by a change
of surface instead of by a box around every paragraph).

Six things a non-coder can see:

1. **One name for one action.** The button that books a call was called four different things
   across the site — "Request setup", "Request local setup", "Book the strategy call", and an
   "intro call" in the copy. It is **REQUEST FOUNDER-LED SETUP** in all 36 places now, and nothing
   else. "Local" also had to go: our own footer says we serve operators nationwide.
2. **A phone bar on mobile.** Once you scroll past the hero, a bar pins to the bottom of a phone:
   the number on the left, "call me" on the right. It gets out of the way whenever the callback
   form or the booking calendar is on screen, so it can never sit on top of something you're typing in.
3. **The header got shorter.** 72px → 61px on a phone. That is a tenth of an iPhone screen handed
   back to the page. The tap target on the phone chip is untouched at 44px.
4. **The hero console now tells a story.** It runs a real 11.8-second sequence — ringing (amber),
   listening (cyan), trip captured (green), quote prepared, ready for dispatch — and above it sits
   a line that says the outcome in plain text so you don't have to watch the animation to get it.
   It also stopped calling itself "Live intake" over an invented caller. It says
   **INTERACTIVE DEMO · ILLUSTRATIVE TRIP DATA**.
5. **Paragraphs came out of boxes.** Explanations, the founder story, the integration copy — all of
   it was sitting in the same glass card as the trip ticket, which made an explanation look like a
   record. Cards survive only where there is a real record: the two consoles, the trip ticket, the
   four stage cards, the FAQ, the callback form and the calculator.
6. **Six claims got corrected.** Sentences that had AVA writing into your dispatch software, putting
   trips "on the board", or booking the ride. AVA captures; a human confirms. That is what the site
   says now, everywhere, including in the page titles and the invisible schema markup.

---

## DONE TABLE

| # | What shipped | Where | Proof |
|---|---|---|---|
| A1 | Primary CTA is tap-to-call with the digits visible, on all 12 pages | every page | 12/12 carry `Call (414) 775-0019` + "AVA answers. Hear it yourself." |
| A2 | **36 setup CTAs renamed** to REQUEST FOUNDER-LED SETUP — 24 nav/footer, 10 tertiary, 2 buttons | all 12 pages | Rendered sweep returns exactly 2 label forms, identical words, arrow only |
| A3 | Zero synonyms remain | all 12 pages | `Request setup` 0 · `Request local setup` 0 · `Book the strategy call` 0 · `intro call` 0 |
| A4 | Mobile sticky action rail, 60/40, safe-area aware, ≥56px | all 12 pages | Rendered 390×844: 73px tall, suppressed by form/calendar, **0 input overlaps** |
| A5 | Solo rail (no dead button) on the 3 pages with no form | /demo/ /privacy/ /terms/ | `rail--solo`, 1 link, full width |
| B | Mobile header ≤64px | both CSS copies | **61px measured** at 360 / 390 / 430 — ceiling is 64 |
| C1 | Console 5-state progression, 11.8s | homepage | Sampled live: ringing→live→captured→quote→ready, resets at 11.0s |
| C2 | Persistent result header | homepage | `CALL ANSWERED → TRIP CAPTURED → READY FOR DISPATCH`, always complete |
| C3 | Honesty chip, one phrase, no duplicates | homepage | `INTERACTIVE DEMO · ILLUSTRATIVE TRIP DATA` replaces the green "Live intake" |
| C4 | Loop runs only when on screen | homepage | IntersectionObserver start/stop — it used to loop forever off-screen |
| D1 | Prose de-carded | all 12 pages | `.feat` `.pain-card` `.setup-card` `.crush` `.founder-card` `.card` `.vs-row` |
| D2 | Section lighting rhythm, no reordering | all 12 pages | `data-lit` on every section; `git diff` shows zero moved sections |
| E1 | Type scale | all 12 pages | **h1 40px / 72px · sec-h 32px / 52px · body 17-18px lh 1.58 · measure 560px** |
| E2 | Mono stripped from sales prose | all 12 pages | `.cta-note` `.setup-note` `.int-muted` `.cb-note` `.crush-calc-link` → Space Grotesk |
| F | Four-stage rail with state nodes | homepage | idle `rgb(10,10,15)`/neutral ring · current `rgb(0,212,255)` · done `rgb(46,230,168)` |
| G | The Crush, amber-black + 3 lines resolving | homepage | Amber ambience measured; **no miss-red anywhere in the section** |
| H | Founder compressed, uncarded, mono authority rail | homepage | 2 paragraphs, `30 YEARS OPERATING · 17 YEARS IN CHAUFFEURED TRANSPORTATION · FOUNDER-LED SETUP` |
| I | 6 writeback/booking claims corrected | homepage ×4, /after-hours/ ×5, /demo/ ×1 | See CLAIMS below |
| J1 | **Lighthouse mobile: a11y 100 · SEO 100 on all 12** | all 12 pages | Zero failing audits in either category |
| J2 | Performance recorded | all 12 pages | min 92 · median 99 · max 99 |
| J3 | AA contrast verified, not eyeballed | all 12 pages | **1277 rendered text nodes measured, lowest 5.55:1** (AA needs 4.5) |
| J4 | Six viewports, zero horizontal overflow | 360/390/430/768/1024/1440 | 72 page-viewport combinations, 0 failures |
| J5 | Reduced motion verified | console · rail · Crush | All settle on the completed state, `animation:none`, transition 0s |

---

## WHAT THE ADVERSARIAL PASS CAUGHT

Everything above passed my own gates first. Then ten independent checks re-measured each task
against the brief with instructions to **refute** it. They found 1 blocker and 12 real defects that
my gates were not looking for. All are fixed and re-measured; this is the honest list, because the
value of the check is in what it caught, not in the score.

| Sev | What | Why my gate missed it |
|---|---|---|
| **BLOCKER** | Both homepage setup buttons rendered **"REQUEST FOUNDER-" / "SETUP"** on two lines at 320-768px | I identified the hyphen-break hazard for this exact string and put `white-space:nowrap` only on the nav. The `.btn` CTAs never got it. My gate checked for *overflow*, and a wrap is not an overflow. |
| major | `/demo/`'s setup CTA rendered in **sentence-case Space Grotesk at 16px** while the other 34 rendered uppercase mono at 12px | The class sits on the anchor there, not a wrapper, so `.cta-tertiary a` never matched. My gate compared label *text*, not typesetting. |
| major | New result header caused a **CLS regression** — reserved height was 4.8px short of the flex row-gap, so it grew the moment the webfont wrapped it to two rows | My CLS check ran Lighthouse's mobile emulation, where the hero is one column and this element is not on the critical path. It only shows at a two-column width. |
| major | The founder authority rail was **not a rail on a phone** — the `·` separator landed at the start of wrapped lines, leaving hanging dots and a mid-phrase break | I checked the rail existed and read correctly on desktop. I never rendered it at 360. |
| major | `.founder-card` — orphaned card chrome — left in the stylesheet, one class name from resurrecting the card Task H removed | Dead CSS renders as nothing, so nothing I measured could see it. |
| major | The mobile stage grid **blew the text measure to 86 characters** at 850-1019px | Pinning the grid to one column fixed the rail and broke the measure in a band I never rendered. |
| major | Homepage `<style>` declared `.nav-cta` rules *after* their own media queries, so the compressed chip silently lost — **the two CSS copies disagreed** | Both copies "had the rule". Only a computed-style diff shows one of them losing to itself. |
| major | Homepage flight copy said AVA **"adjusts pickup buffer accordingly"** — a scheduling decision the authoritative page explicitly denies | It is not writeback wording, so my claim sweep's patterns did not match it. |
| major | FAQ (and its JSON-LD twin) listed **"basic confirmation work"** among what AVA relieves — implying AVA confirms | Inside a collapsed `<details>`, invisible to an innerText sweep. |
| major | `/book/` titled itself **"Book Founder-Led Setup"** — the destination of the renamed CTA carrying a different verb for the same action | I renamed CTAs. I did not treat the destination page's own title as one. |
| minor | Crush rows **read "Ringing" while painted Booked-Green** for ~18% of the scene — a 450ms colour crossfade against an instant label swap | A screenshot at rest looks perfect. Only sampling the animation catches it. |
| minor | Three accents in the Crush at rest, not two — cyan appeared independently in the section kicker, not just on the CTA | I reasoned about this and reached the wrong answer. Measuring the painted areas settles it. |
| minor | The sticky rail parked on the **demo play button** (25px of a 50px control covered) and stayed **focusable for ~200ms** while sliding out | My gate checked overlap against `input`/`textarea`/`select` — the letter of "never overlaps inputs" — and a `button` is none of those. |
| minor | Green rail head ran **past** the node it had reached; stage rail showed all-neutral with JS off; mobile rail overshot the last node by 204px | Three separate "looks right in a screenshot" defects. |

Fixes verified by measurement, not by re-reading the code: buttons on one line at 320/360/390/768,
`/demo/` typesetting byte-identical to the other pages, console reflow **0px across the font swap**,
rail overshoot **-1px** (was 204), stage measure **64ch** (was 86), every touched label **≥12px**.

### CLAIMS CORRECTED (Task I)

| Where | Was | Now |
|---|---|---|
| `index.html:7,20,29` | "AI Dispatch That **Books the Ride**" (title + og + twitter) | "AI Dispatch That Takes the Whole Trip" |
| `index.html` §demo | "**writes a clean record into your workflow**" | "hands your dispatcher a clean ticket" |
| `index.html` §demo | "From phone call to **dispatch record**" | "From phone call to trip ticket" |
| `index.html` §features | "**updates the reservation, and confirms back**" | "corrects the ticket, and reads it back on the call" |
| `index.html` FAQ + JSON-LD | "**routes the request into your workflow**" | "hands your dispatcher a finished trip ticket" |
| `/after-hours/` ×5 | AVA "**puts it on the board**" / "sitting on the board" | waiting for your dispatcher / handed over as a finished ticket |
| `index.html` §features | "**adjusts pickup buffer accordingly**" | "marks the pickup buffer for your dispatcher to sign off" |
| `index.html` FAQ + JSON-LD | "…after-hours requests, and **basic confirmation work**" | "…and after-hours requests." (AVA confirms nothing) |
| 8 links across 5 pages | "**Watch** one get captured" / "**Watch** a call become a trip ticket" → `/demo/` | "**Hear** …" — `/demo/` is a phone call now; there is nothing to watch |
| 4 shipped HTML comments | quoted retired claim wording **verbatim** | rewritten to describe the rule — comments ship, and a grep audit matches a quote |

Scarcity line "a few slots open at a time" left exactly as authored — it is true, and the brief said
do not amplify it.

---

## ROLLBACK

One commit, one unit. To undo the whole run:

```bash
git revert --no-edit <RUN7_SHA> && git push
```

Vercel redeploys `aichauffeur.ai` from `main` automatically. Nothing else to unwind — no
workflow, no calendar, no webhook, no GHL record was touched.

**Explicitly NOT touched**, verified by an empty `git diff` on each: the `/book/` iframe loader
(JS-attached `src` + IntersectionObserver + `noscript` twin), form routing, and the n8n webhook
payload in `aic.js`.

---

## WHAT'S NEXT

- **Self-host the fonts.** `chauffeur/fonts/space-grotesk.woff2` and `jetbrains-mono.woff2` are
  already in the repo, but every page still pulls Space Grotesk and JetBrains Mono from Google's
  CDN. That font swap is now the **only** remaining cause of homepage CLS. Measured, median of 3,
  both builds:

  | | pre-RUN-7 | RUN 7 |
  |---|---|---|
  | Lighthouse mobile CLS | 0.123 | 0.126 |
  | Desktop CLS (PerformanceObserver, 1440) | 0.0223 | 0.0290 |

  Both are dominated by the same node in both builds — the `h1` re-flowing when the real face
  lands. The element RUN 7 added contributes **0px** now (verified: every child of the console is
  byte-stable across the font swap). Above the 0.00 CLAUDE.md asks for, and a contained win, but it
  deserves its own run with a render gate: a woff2 subset that differs from Google's would change
  every line break on the site.
- **`/book/` Best-Practices is 79.** That is the third-party GHL booking iframe and it is exempt by
  the brief. Worth knowing it will not move without dropping the embed.
- **Confirm the calendar really is 20 minutes.** RUN 7 unified the meeting's NAME — it was carrying
  three ("intro call", "setup call", "strategy call") — and left the length alone at 20 minutes,
  because the brief asked for a name, and the AI Chauffeur calendar (`UaxV0ENx2cEUYs6qeWZ7`) is a
  different calendar from the AVA parent's 15-minute one. The site now says "the 20-minute setup
  call" in one voice across 12 pages. Somebody should open that GHL calendar and confirm the slot
  is 20 minutes, because "the copy law contradicted the live system it described" is a mistake this
  shop has already made once.
- **`.hc-state` / `.c-label` micro-type.** Several console labels predate this run at 9.6-11px,
  under the 12px floor in CLAUDE.md. Both labels RUN 7 added are at 12px. Fixing the rest means
  re-fitting the console grid, which is a rebuild, not a polish.

---

## GOTCHAS

- **A wrap is not an overflow, and my gate only knew about overflow.** The renamed CTA broke across
  two lines inside both homepage buttons at every width up to 768px, with 100px of empty space to
  the right of the arrow, and `scrollWidth === clientWidth` the whole time. Checking a label renders
  on one line is now `Range.getClientRects().length === 1`, not "no horizontal scroll".
- **Two copies of a rule can both be present and still disagree.** The homepage declared its
  `.nav-cta` base rules *after* its own media queries at identical specificity, so the compressed
  mobile chip silently lost to the desktop values — one site, two heads, and invisible unless you
  diff the computed styles between pages rather than the source.
- **Reserving height means reserving the gaps too.** The `min-height` that fixed the result header's
  CLS was 4.8px short because it counted two line boxes and the padding but not the flex row-gap
  between them. It held at the floor in the fallback font and grew the instant the real face wrapped
  it. Off-by-one-gap is invisible in CSS and obvious in a 50ms geometry sample.
- **A colour transition can make a state lie.** The Crush rows swapped their label text on the same
  frame as the class but crossfaded colour over 450ms, so for roughly a fifth of the scene a row
  read "Ringing" while painted Booked-Green. Under a law that says green means captured, a hue
  halfway between two states is a colour that is not true yet. State colour changes on the same
  frame as the state now.
- **"Never overlaps inputs" is narrower than what you meant.** The sticky rail cleared every
  `input`, `textarea` and `select` on the site and parked squarely on the demo play button, covering
  half of a 50px control. It also stayed focusable for ~200ms while sliding out, because the hidden
  state was delayed behind the transform.
- **`.step` had `overflow:hidden`.** The stage rail's state nodes sit outside the card so they can
  land on the rail. They rendered, they were clipped to nothing, and the CSS looked perfectly
  correct. Only the render gate caught it. Anything positioned outside a card on this site needs
  `overflow:visible` checked first.
- **An `aria-label` must CONTAIN the visible text.** The nav phone chip briefly read
  `aria-label="Call AI Chauffeur at 414 775 0019"` over visible text `(414) 775-0019`. Lighthouse
  flagged `label-content-name-mismatch` (WCAG 2.5.3) and a voice-control user saying the number they
  can see would not have activated the link. It is `aria-label="Call (414) 775-0019"` now.
- **`aria-hidden` on the sticky rail would have cost a11y 100.** A container marked `aria-hidden`
  that still holds focusable links is the `aria-hidden-focus` violation. The rail hides with
  `visibility:hidden`, which removes it from the accessibility tree *and* the tab order, and needs
  no ARIA at all.
- **chrome-launcher throws on Windows AFTER the audit succeeds**, while deleting its temp profile.
  Taking the exit code at face value threw away twelve perfectly good Lighthouse reports. The gate
  now judges by whether the report file exists.
- **One Lighthouse run is not a measurement.** `/milwaukee-…/` scored 72 in a batch run and 99 as
  the median of three — the difference was two Python servers and Chrome competing for the same
  machine. Every perf number in this report is a median, and every before/after pair was measured
  against the real pre-run commit in a git worktree, not against memory.
- **A comment ships.** `index.html` carried a note claiming no dollar figure appears anywhere on any
  chauffeur page. It was false — illustrative fare ranges ship inside clearly-labelled sample
  tickets on three pages — and a later audit that trusted the comment would have missed them. It
  also carried a FAQ comment quoting retired copy verbatim, which is exactly the trap the
  integrations note at the top of the same file warns about. Both rewritten to describe the rule
  instead of quoting the copy.
- **The recon reported a markup bug that did not exist** — `<strong>Email<\strong>` on `/privacy/`.
  The tags are well-formed. Verified before acting on it.
- **`index.html` does not load `aic.css`.** It carries its own embedded shell, so every shared rule
  in this run exists in two places on purpose. A header or CTA change that lands in only one of them
  ships a site wearing two different heads.
