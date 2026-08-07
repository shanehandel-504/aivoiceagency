# AI CHAUFFEUR — DESIGN SYSTEM

**Signal v1.5** · ratified RUN 13 "STICKY + TIDY", 2026-08-07.
v1.5 changes two things and closes the build phase: the sticky rail is
**Call + Book** (§ 3), and **there are two CSS homes, not three** (§ 1) — the
homepage's embedded stylesheet is gone and with it the drift class that has cost
a run every time it fired since RUN 7.

Supersedes Signal v1.4 (RUN 12), which is still correct about everything else it
covers; v1.4 added the answer-engine page anatomy (the direct answer, the
last-updated stamp, the status column), the table rules for a phone, and the
CLAIM LADDER that governs what this brand is allowed to say about write-back.
v1.3 added the anchor gutter, a third-generation primary control with press
physics, a third state on the callback console, and the container cap. v1.2
added a third elevation, a page-depth layer, a second-generation button system,
the callback console, the dispatch ledger and the logo canon.

**The site is sixteen pages.** Everything below that says "twelve" predates
RUN 12 and describes a smaller tree; the rules are unchanged, the counts are not.

Read this file **before** touching anything under `chauffeur/`. It is the brand's
own law. Where it disagrees with a skill, this file wins. Where it disagrees with
`/CLAUDE.md`, CLAUDE.md wins — except on the palette, which CLAUDE.md § 8 has
described incorrectly since RUN 7 and which this run supersedes for this brand.

---

## 0 · HOST TOPOLOGY — read this first or you will 404 in production

- `aichauffeur.ai` is a **separate Vercel project rooted at `/chauffeur/`.** Every
  absolute path in these files is relative to *that* root. `/assets/aic.css`
  means `chauffeur/assets/aic.css`. A repo-root path such as `/js/tracking.js`
  **404s on this host.**
- `chauffeur/assets/circulant.css` is the **chauffeur copy**. The AVA parent has
  its own file of the same name at the repo root. They share a filename and
  nothing else. **Do not sync them.**
- The phone is **414-775-0019** and it is the only voice number on any chauffeur
  surface. The parent's `414-240-8930` must never appear here.

---

## 1 · THE TWO CSS HOMES — the trap that bit every run from RUN 7 to RUN 12

**There were three. RUN 13 removed the third, and the trap with it.**

| # | File | Loaded by | Holds |
|---|---|---|---|
| 1 | `chauffeur/assets/circulant.css` | all 16 pages | the DOCUMENT layer — tokens, canvas, anchor gutter, the grid |
| 2 | `chauffeur/assets/aic.css` | all 16 pages | the COMPONENT layer — everything else |

Both files load on every page, in that order, from a `<link>` in every `<head>`.
There is no third copy and no page-local block anywhere on this host.

Through RUN 12, `index.html` did not load `aic.css` — it carried its own
embedded copy of the shell, and a rule written for "the stylesheet" could land
in one head and ship a site wearing two. That cost a run every time it fired.
The last instance was RUN 12's `details > div a`: an FAQ-answer link underlined
on eleven pages and colour-only on the homepage, live since the section shipped,
with Lighthouse reading 100 either way. **The audit is not the rule.**

### What replaced the byte-identity law

Three blocks used to be byte-identical across the homes and machine-checked as
pairs. A pair-check is a proxy for "there is one copy of this rule", and now
there is literally one copy, so the proxy is retired and the stronger claim is
asserted directly: `aic-run11-gate.mjs` fails if `index.html` grows a `<style>`
element again, or stops linking `aic.css`.

Rules genuinely belonging to the homepage alone live in `aic.css` under
**RUN 13 · THE HOMEPAGE COMES HOME**, and **their position in that file is
load-bearing**: they are BASE rules and the RUN 10 / 11 / 12 blocks below them
still override. Move that block below those and the container radii, the
primary-control physics and the 12px type floor all silently revert.

A rule that belongs to the **document** rather than to a component still goes in
`circulant.css` — one copy, nothing to drift. The canvas layer and the § 1
anchor gutter live there for that reason.

`node tools/aic-run9-styleparity.mjs` still reads the RESOLVED computed style of
the shared chrome off a homepage and three `aic.css` pages. Its premise changed
but not its value: "same stylesheet" is not "same rendered chrome", because a
page can still diverge through its own markup. **`/book/` carries `.rail--solo`**
— see § 3 — and that is asserted as an exact set: solo where it belongs and not
solo anywhere else.

**`aic.css` used to claim `/demo/` did not load it. That was false.** It does.
Anyone trusting the old note would have edited a shared file believing one page
was immune to it.

---

## 2 · TOKENS — Signal v1.1

Every ratio measured against the surface named. Not eyeballed.

| Token | Hex | On midnight | On surface |
|---|---|---|---|
| `--midnight` | `#070B14` | the page | — |
| `--surface` | `#0D1420` | 1.07:1 (needs the hairline) | — |
| `--surface-2` | `#111A2A` | 1.13:1 | 1.06:1 — nested + active only |
| `--input-bg` | `#0A101C` | 1.03:1 | 1.03:1 — form fields only |
| `--line` | `#1B2536` | hairline only | — |
| `--ink` | `#E8EDF5` | **16.74:1** | 15.70:1 |
| `--ink-soft` | `rgba(232,237,245,.78)` | 10.21:1 | 9.78:1 |
| `--ink-mute` | `rgba(232,237,245,.55)` | 5.47:1 | 5.38:1 |
| `--signal-blue` | `#3D7BFF` | **5.13:1** | 4.81:1 |
| `--action-blue` | `#1E56D6` | 3.15:1 *(control, needs 3)* | — |
| `--action-blue-hover` | `#2A63E8` | 3.79:1 *(control)* | white on it **5.19:1** |
| `--sky` | `#7FB2FF` | 9.10:1 | 8.54:1 |
| `--success-green` | `#2EE6A8` | 12.18:1 | 11.42:1 |
| `--amber` | `#FFB020` | 10.76:1 | 10.09:1 |
| `--miss-red` | `#FF3B4E` | 5.61:1 | 5.26:1 |
| `--neutral` | `#8A93A6` | 6.38:1 | 5.98:1 |

`#FFFFFF` on an `--action-blue` fill measures **6.25:1**.

### Role, not decoration

A rule that wants a colour and cannot name the state it paints is decoration and
does not ship.

- **`--signal-blue`** — live states, text links, focus rings, selected UI,
  console activity, and at most **one** highlighted headline phrase per section.
  It is a **text and line** colour.
- **`--action-blue`** — **filled CTA buttons only**, always with white lettering.
  It is a **fill** colour and never sets type.
- **`--sky`** — secondary highlight and eyebrow accent.
- **`--success-green`** — see STATE LAW below.
- **`--amber`** — ringing · pending · the cost of the miss.
- **`--miss-red`** — failure only. Never "attention".
- **`--neutral`** — inactive · not-yet · n/a.

`--signal-blue` is **never a fill under small white type**: white on it lands
under the body floor. Filled controls take `--action-blue`.

On a **light or print** surface the blue is `--action-blue`. The lighter blue
measures 3.61:1 on paper and is large-text only there.

### STATE LAW

Green renders **only beside a label naming the action that succeeded** — TRIP
CAPTURED, QUOTE RETURNED, READY FOR DISPATCH. Never because a flow ended.
**Label text and colour change on the same frame.** A 450ms colour crossfade
once left rows reading "Ringing" while still painted green, in 18.6% of frames.

**A COLOUR TRANSITION ON A STATE CHIP IS THE VIOLATION, not a softening of it.**
RUN 10 gave `transition:none` to the callback console's chip and to the dispatch
ledger. `.hero-console .hc-state` — scene 1 of § 4 GLOW LAW, on the homepage
fold — kept a **250ms** colour transition until RUN 13, and nobody re-read the
law against it. `index.html`'s `setState()` writes `textContent` and `className`
in one synchronous block, so the word changed instantly and the colour took a
quarter second to follow: for that quarter second the chip read "Trip captured"
in the previous state's blue.

**How it was found is the transferable part.** Not by reading the CSS — by the
RUN 13 parity harness recording the same element, with the same class, in two
different colours across two runs of identical code. That is only possible while
a colour is in flight. **If a probe reads a different value from a page that did
not change, something on that page is animating that should not be.**

### CANVAS LAW (ratified RUN 10)

**Page-depth treatment is allowed and required. Component halos stay banned.**
The two are not the same rule and the difference is where the light is painted.

- **The page** carries one fixed layer (`body::before`, declared once in
  `assets/circulant.css`, which all twelve pages load): a horizon band of the
  blue at **.045** rising out of the lower third, plus a corner vignette at
  **.06**. No images, no `blur()`, nothing animated — so there is no motion for
  reduced-motion to switch off.
- **A component** separates from the canvas with a hairline and a step of
  surface. Never with light thrown outside its own box. § 4 GLOW LAW is
  unchanged and still allows ambient light in exactly two scenes.

**The acceptance bar is a phone at 50% brightness.** `--surface` on `--midnight`
is 1.07:1; that is why the hairline is mandatory and why nested layers now take
`--surface-2` with `inset 0 1px 0 rgba(127,178,255,.06)`. Nested layers used to
be `rgba(7,11,20,.55)` — **darker than their own parent**, which is the one
direction that cannot read as depth on a dark ground.

### THE GRID WAS INVISIBLE, and this is how it was proved

`--grid-line` carried `.05` alpha *and* was multiplied by a zone opacity of
`.04`. Rendered page line = 0.002 alpha of `#3D7BFF` over `#070B14`:

```
R 61x0.002 + 7x0.998  = 7.1  -> 7
G 123x0.002 + 11x0.998 = 11.2 -> 11
B 255x0.002 + 20x0.998 = 20.5 -> 20
```

Identical to the background on all three channels. **Every page zone on this
site drew a grid that could not produce one different pixel.** The hue now lives
at full strength in `--grid-line` and the ZONE sets the alpha: `--grid-page:.05`
at the top of the document, fading to `--grid-page x --grid-floor` = **.02** at
the foot, `--grid-console:.08` inside an instrument.

The depth fade is a second mask layer under `@supports (mask-composite:
intersect)`. **The guard is not politeness.** With two mask layers and the
default `add` compositing, the result is the UNION of the two, which would put
grid lines straight back behind the 560px prose measure the horizontal mask
exists to protect. Outside the guard the single horizontal mask ships and only
the depth is lost. *Never let a progressive enhancement fail into a rule
violation.*

### 60-30-10 and the accent cap

Midnight + surface ≈ 60 · ink + neutral + line ≈ 30 · all accents ≤ 10.
**Max two accents per section.**

The single filled action control is **chrome, not content**, and does not count
toward a section's two. It is the same object in every section on the site; if
it counted, every section would have exactly one accent of room. The rule is
about how many meanings the *content* asks the reader to hold at once.
`tools/aic-run9-gate.mjs` encodes this exclusion explicitly.

### EXEMPT

`/assets/brand/*.svg` keeps its own values, cyan included. **Never repaint a logo
file.** The 24-file kit is supplied production artwork with its own README and a
surface map; SVGO on it is render-gated because the default profile drifts pixels
on all eleven outlined-type marks.

**CORRECTED IN RUN 10.** The **root** icon set (`favicon.svg`, `favicon-*.png`,
`apple-touch-icon-180.png`, `icon-192/512.png`) **IS** in that exemption. RUN 9
repainted it into Signal blue on the reasoning that a derived favicon is not
supplied artwork. That reasoning was wrong, and `assets/brand/README.md` had said
so in writing the whole time — its FAVICON SET section names those exact root
paths as part of the kit. A favicon *is* the mark at 16px; repainting it forked
the brand from the lockup sitting 40px away in the same header. The pre-RUN-9
files are restored: bars `#EEF0F4`, knot `#00D4FF`.

`site.webmanifest` is **not** reverted. Its only RUN 9 change was
`theme_color` / `background_color` `#0A0A0F` → `#070B14`, which is the site's own
background hex and carries no logo colour at all. Reverting it would put the AVA
parent's void back on this brand's PWA and contradict the `theme-color` meta on
all twelve pages. See the LOGO CANON appendix for why that line is drawn there.

---

## 3 · TYPOGRAPHY LAW

**Two faces, both self-hosted woff2. No third family, no serif accent.**

| Face | Owns |
|---|---|
| **JetBrains Mono** | status · times · routes · quote records · field names · console events · eyebrows |
| **Space Grotesk 500, sentence case** | buttons · nav · headlines · conversion copy |

Mono is for a machine readout. A sentence set in mono reads like one, and it
costs real legibility at label sizes. **12px is the hard floor. Nothing below it,
ever.**

Self-hosting is load-bearing: it took homepage CLS from 0.126 to **0.000**. Do
not reintroduce a font CDN link. A metric-matched fallback **must carry the same
`unicode-range`** as the real face, or it silently steals `→` and `✓`. The
preload `href` must be the **same string** as the `@font-face` `src`, with
`crossorigin`, or the file is fetched twice.

### The primary control — v3 (ratified RUN 11)

**Applies to `.btn-primary`, `.tel-btn`, `.demo-play-btn` only.** `.rail-call`
and `.nav-book` are **chrome** — the same object inside a fixed bar on every
page — and they keep the v2 recipe below: no chamfer, no exterior elevation.
`.btn-ghost` is untouched.

| Part | Recipe |
|---|---|
| Fill | `--action-blue`, `#FFFFFF` label, `1px solid rgba(127,178,255,.45)`, radius **10px** |
| Bevel | `inset 0 1px 0 rgba(127,178,255,.35)` top · `inset 0 -2px 0 rgba(0,0,0,.22)` bottom |
| Elevation | `drop-shadow(0 8px 24px rgba(0,0,0,.35))` — **neutral black, no hue** |
| Signature | a single **8px chamfer on the upper-right corner**, `clip-path` polygon |
| Hover | `--action-blue-hover`, border `rgba(127,178,255,.60)`, `translateY(-1px)` |
| Press | `#1A4CC2`, `translateY(2px) scale(.985)`, shadow collapses to `0 2px 8px rgba(0,0,0,.35)` |
| Timing | press **70ms**, release **160ms**, `cubic-bezier(.2,.8,.2,1)` |
| Reduced motion | transforms and transitions off, **colour states only**, elevation holds at its resting value |
| Label | Space Grotesk 600, sentence case. No ALL-CAPS, no emoji, no cyan. |

**THE STRUCTURE IS NOT A STYLE CHOICE.** `clip-path` is applied **after**
`filter` and it clips **everything the element paints — its outline and its
box-shadow included.** Read as pixels on a 200×60 fixture over `--midnight`: an
outline at `outline-offset:4px` rendered `7,11,20` (the page) with `clip-path`
on and `61,123,255` (the ring) with it off. A `box-shadow` below the box: gone.
A `filter:drop-shadow` below the box: **also gone** — the filter runs first, so
the shadow it produces sits inside the region `clip-path` then discards.

A control that chamfers **itself** therefore has no elevation and **no focus
ring**, and a removed focus ring is banned outright. So the chamfer moves off
the host:

| | Carries |
|---|---|
| **host** — unclipped | the label, the exterior elevation as a `drop-shadow`, and the sitewide `2px solid --signal-blue` focus ring, which survives because nothing clips it |
| **`::before`** — clipped, `z-index:-1` | the fill, the 1px border, both bevels, so all four follow the chamfer instead of ignoring it |

Any state rule that repaints a primary's **fill or border** must target the
`::before`. `.demo-play-btn[data-state="playing"]` is the live example: written
against the host it would leave the button filled blue while claiming to play.

**Two consequences for the gates, both already handled.** RUN 10's filled-CTA
probe read only an element's own `background-color`; from RUN 11 it reads the
`::before` as well, or it would report ONE filled control on a fold carrying
two, in green. And a `drop-shadow` is elevation that the `box-shadow` budget
cannot see — `aic-run11-gate.mjs` asserts the hue in it is neutral.

### The button system — v2 (still current for chrome)

| Level | Recipe |
|---|---|
| **Primary (chrome)** | filled `--action-blue`, `#FFFFFF` label, `1px solid rgba(127,178,255,.30)` border, `inset 0 1px 0 rgba(127,178,255,.35)` bevel. **Hover: `background:var(--action-blue-hover)`, border `rgba(127,178,255,.55)`, `translateY(-1px)`, `filter:none`.** Active `#1A4CC2`, `translateY(0)`. **No halo.** |
| **Secondary** | 1px `--line` on `--surface`. Border and label go `--sky` on hover. |
| **Tertiary** | `--sky` text link with an arrow. No box. |

**`filter:brightness()` is retired on controls.** It lightens the bevel and the
border along with the fill, so the whole control washed out by the same amount
instead of reading as a state change — and on a button that already carries an
inset highlight it flattens the top edge that gives the button its shape. An
explicit hover fill moves only what should move.

**Heights: 54px desktop / 56px on a phone**, Space Grotesk 600, sentence case.
Applies to `.btn`, `.cb-submit`, `.demo-play-btn`, `.demo-call-btn`. **Nav and
rail are chrome and stay at 44px** — the header is capped at 64px on a phone and
80px on desktop, and a 54px control inside 14px of padding puts the desktop bar
at 82.

### CTA DE-DUPLICATION (ratified RUN 10)

**Never three filled blue phone surfaces in one viewport.** Measured on the 390
fold before this run, the header chip and the hero primary sat 40px apart, both
filled, both dialling the same number, and the rail was a third once the reader
scrolled.

- **Header chip** — the OUTLINED utility variant at desktop; **filled below
  1024px**, where it is the only chrome CTA on screen. Digits always visible;
  **the word "Call" drops below 1024px**, which is what the CSS has always done
  — an earlier draft of this section claimed 380px and was wrong about its own
  file. The `aria-label` still CONTAINS the visible text.
- **Hero** — keeps THE filled primary.
- **Rail** — arms only after the hero CTA cluster has left the top of the
  viewport, and suppresses itself whenever an inline primary, the callback
  console, the booking calendar or the footer is on screen.

### THE STICKY PAIR (ratified RUN 13)

**The rail is `Call (414) 775-0019` filled + `Book the setup call` ghost, in
equal columns.** Its second control used to be "Get a call back", pointing at
the callback console further down the same page — a fixed bar spending half of
the only chrome a phone reader has on scrolling them to something already on
the page. The console is unchanged and is still the callback path: a reader
meets it by scrolling and opens it by tapping its own 64px header row.

- **Equal columns, not 60/40.** § 4's demo pair settled the idiom: two controls
  with different labels and no width rule read as a primary with a stray link
  beside it rather than as a choice. These are one choice, and the fill carries
  the hierarchy.
- **`/book/` is the only `.rail--solo` page**, and the reason moved with the
  set. `/demo/`, `/terms/` and `/privacy/` were solo because they have no
  callback form for the old control to point at; `/book/` exists on every page,
  so all three now get the pair. On `/book/` the Book control would take the
  reader to the page they are on, so it is dropped. Call stays — calling is
  still a real alternative there.
- **THE TWO FULL LABELS DO NOT FIT ON A PHONE.** Measured at the rail's own
  type: Call needs **194px**, Book needs **166px**, and the 360 viewport offers
  **328px** between the bar's padding and the gap. The shortfall is 32px of
  text, not of layout, and no split of the columns fixes it. So the verb drops
  below **480px** — the header chip's own idiom, digits are the payload and the
  glyph carries the affordance once the word goes — and the bar steps to 14px
  below **400px**. Re-measure both labels before changing either.
- **The label is ONE flex item.** `.rail-label` wraps the verb span and the
  digits so they are inline siblings *inside* one item, where the span's
  trailing space is ordinary text and renders as an ordinary word space.

  **The header chip does NOT have that wrapper, and its 7px is the separator,
  not a defect.** RUN 13 measured the chip at desktop — verb right edge 1095,
  digits left edge 1102 — read the gap as a hole sitting on top of the span's
  own trailing space, removed it, and shipped `Call(414)` into a screenshot.
  **Trailing whitespace inside a flex item is trimmed**, so the container `gap`
  was the only thing holding the word off the number. Reverted, and the chip is
  as it has always been. Adopting `.rail-label`'s wrapper there is a markup
  change on sixteen pages worth about 3px of tracking — a fair job for a run
  that is doing chrome, and not one to do by accident.

  The first attempt also failed in a second way worth remembering: applied to
  the base rule rather than scoped to ≥1024, moving the spacing onto the glyph
  ADDED 7.2px at widths where the verb is hidden, and the nav row went 1px past
  its own content box at 360 on all sixteen pages. `aic-run9-gate.mjs` caught
  that one.
- Analytics: `tel_tap_rail` and `book_click_rail`.

**One primary per viewport** still holds. The single exception is the callback
console's submit, which is a ghost at rest and takes the fill only once both
fields validate and consent is ticked — by which point the reader has chosen
that path.

---

## 3.5 · COMPONENTS RATIFIED IN RUN 10

### The callback console

The form was a card with a label on it. It is an instrument now.

- Card `--surface`, border `--line`, **`border-top: 1px var(--line-hot)`**,
  radius 8. That hot hairline is the only place `--line-hot` appears on a
  resting panel, and it marks the one panel on the fold that *does* something.
- **Header row 64px** (was 44 through RUN 10): the whole row is the control that
  opens the one module on the fold that does something, and it is sized as one.
  Mono module name left, then status, then a **chevron** — an inline SVG, not a
  text glyph, because the two faces here are self-hosted subsets and a
  metric-matched fallback silently steals characters the real face does not
  carry. It points right when the body is collapsed and rotates to point down
  when it is open, 160ms `cubic-bezier(.2,.8,.2,1)`.
- **The chevron follows the RENDERED state, never `aria-expanded`.** That
  attribute is written by JS from what CSS actually painted, so a rotation keyed
  to it points the wrong way for one frame on every load and points the wrong
  way forever with scripting off. Its selectors are the same ones that drive the
  collapse.
- **THREE states, not two.** `● STANDING BY` in `--neutral` → `● CALLING NOW` in
  `--success-green` **on the same frame as the submit succeeds** → `● NOT SENT`
  in `--miss-red` on any failure, validation included. The dot and the word are
  one element with `transition:none`, so they cannot disagree. Miss-red measures
  5.26:1 on `--surface` — over the AA body floor — and it means failure and only
  failure, never "attention". **The chip does not carry the reason**: the
  one-line explanation stays in the note, in prose. A three-word status cannot
  hold a reason, and pretending it can is how a status ends up meaning nothing.
  Touching either field clears the state, because leaving it red while the
  reader fixes the problem says the fix did not register.
- Through RUN 10 every failure left the header reading STANDING BY while the
  note underneath said the call had not been placed — and collapsed on a phone
  the note is not even on screen, so the module's own header was the only thing
  a reader could see and it was wrong.
- Body nested on `--surface-2` with the 1px top light.
- **Labels mono 12px.** They rendered at 9.92px (`.62rem`) from the day the form
  shipped — under the § 3 floor. There is now a probe for it (§ 11).
- **Inputs**: height 54, `background:var(--input-bg)`, border `--line`, focus
  border `--signal-blue` + ring `0 0 0 3px rgba(61,123,255,.15)`, **no inset
  shadows**.
- **Submit** rests as a ghost, takes `--action-blue` only when both fields
  validate and TCPA is ticked. It is a PAINT, not a gate — the button stays
  enabled and the submit handler still explains what is wrong. *A disabled
  control that will not say why is worse than an enabled one that will.*
- **Mobile (<768px)** the card collapses to its header row and taps open. It
  ships OPEN in the markup and JS collapses it, so a crawler and a no-JS reader
  see the whole thing. That is honest here specifically because the form has no
  `action` and could not submit without scripting anyway.

### The checkbox

**Never the native box.** A default checkbox paints a white 20px square, and on
this ground that was measurably the brightest object on the fold — brighter than
the primary CTA, attached to the one control on the page that is not an ask.

```
appearance:none · 20x20 · background var(--surface) · border 1px #2A3650 · radius 5
:checked        -> background var(--action-blue), white clip-path tick
:focus-visible  -> 2px solid var(--signal-blue), outline-offset 2
```

### The dispatch ledger

Inside the Crush, container `--surface-2`, border `--line`, radius 12, **max
560px**. Rows 52px desktop, stacked to two lines below 560. Hairline-separated,
**no per-row shadow**. Mono, `tabular-nums`.

`[2px state rail] [time] [INBOUND 0n] [trip type] [state chip]`

Progression, IntersectionObserver-staggered, **one active pulse at a time**,
**paused offscreen** (`.is-live` toggles in BOTH directions):

`--amber RINGING → --signal-blue ON CALL → --success-green TRIP CAPTURED →
READY FOR DISPATCH (rail solid green)`

Row *n* starts at *n* × 900ms and has left Ringing before *n+1* arrives, so the
rows overlap — three calls in flight, none on hold — while exactly one is
ringing at any instant. **Terminal state ships in the markup**, so reduced
motion, JS-off and a screen reader all get the true resting record and the scene
only ever rewinds it. STATE LAW applies: the class swap and the label rewrite
happen in one synchronous block.

---

## 3.6 · THE ANSWER-ENGINE PAGE (ratified RUN 12)

A page written to be the answer to a question has an anatomy, and it is not the
same as a landing page's. Four rules, all machine-checked by
`tools/aic-run12-gate.mjs`.

- **The direct answer is the FIRST prose in `<main>`.** 40-60 words, complete on
  its own, in `.answer` — a `--surface` panel with a 3px `--signal-blue` inset
  rail, the same idiom RUN 11 gave an open FAQ row. **It replaces `.page-sub` on
  these pages rather than following it.** RUN 12 shipped all four with a deck
  between the H1 and the answer, and the gate caught it: the first prose an
  answer engine met was a shorter summary of the answer underneath it. Two decks
  saying the same thing in two lengths is a redundancy for a reader and an
  ambiguity for anything lifting one paragraph off the page.
- **Exactly one visible `<table>` per page.** The table is the artifact; a second
  one splits the thing a machine is supposed to quote.
- **A visible last-updated stamp**, `.page-updated`, mono, 12px, `--neutral`.
- **Four FAQs**, mirrored to `FAQPage` from the rendered copy by the mirror tool.
  Never hand-authored — ship `"mainEntity":[]` and let the tool fill it.

### THE CLAIM LADDER

**What this brand may say about writing into a dispatch system, and in what
order.** The whole of RUN 12's copy work was making sixteen pages say one thing.

| Rung | Wording that is allowed |
|---|---|
| Day one | ticket delivery to a shared inbox — **included in every setup** |
| During setup | the connection is **configured and tested around the account** |
| After verification | direct write-back is **activated** |

- **Never an unbounded denial.** "AVA does not write into your dispatch software"
  was true when nothing could; with write-back on the ladder it is a claim the
  product contradicts. Every denial carries its condition: *until direct
  write-back has been configured and verified for that account.*
- **Never an unbounded promise either.** The approved capability sentence lives
  verbatim on `/integrations/limo-anywhere/` and is the ceiling for the whole
  host. Its middle clause — service types, vehicle classes, rate rules, required
  fields, statuses, approval workflow — is what keeps the first clause honest.
  Do not paraphrase it and do not split it.
- **"Production verified" appears NOWHERE** until a real client acceptance test
  passes. `writeback-flip.md` owns that day. The gate asserts its absence on all
  sixteen pages.
- **A status is not a state.** The five strings on the hub name stages of setup,
  so the column is **deliberately unpainted**. STATE LAW gives `--success-green`
  to an action that has actually succeeded beside a label naming it; a colour
  ladder down eleven rows would make eleven live-connection claims in one glance
  and would look like evidence.
- **The default never moved.** A person confirms every trip on every rung.

### TABLES ON A PHONE

- **Two columns take `.tbl--pair`** and fit at 390 with no scroll. `.tbl` carries
  `min-width:620px`, which is a three-column floor; `min-width:0` alone is not
  enough, because `.tbl th` is `white-space:nowrap` in both the head and the row
  header. Measured on the hub at 390 before the fix: columns 242 + 182 inside a
  340px box, status column entirely off-screen. Letting the header wrap **on a
  phone only** closes it.
- **Three columns still scroll, and must say so.** `.tbl-wrap` takes
  `tabindex="0"`, `role="region"` and an `aria-label`, because `overflow-x:auto`
  creates a scrollable region and a region that is not focusable cannot be
  scrolled without a pointer. A `.tbl-hint` renders below 668px — the width at
  which a 620px table stops fitting `.wrap`'s content box.
- **Not the `display:block` stacked-card trick.** It drops the table role out of
  the accessibility tree in every major engine, and a status table whose rows no
  longer associate with their column heading is a worse outcome than a scroll.

---

## 4 · GLOW LAW

**Ambient light exists in exactly two scenes**, both on the homepage:

1. the **hero console** — an inset blue edge that breathes, paused offscreen by
   the same IntersectionObserver that drives its timeline;
2. **The Crush** — an amber wash with hairline top and bottom.

One active pulse at a time. Offscreen animation paused.

Everywhere else:

- elevation is `box-shadow: 0 8px 24px rgba(0,0,0,.45)` (`--raise`), **one per
  raised panel**;
- **zero coloured halos, zero text-shadow**;
- **no `backdrop-filter` except the two fixed overlay bars** (nav and rail). That
  is what keeps the sitewide blur count at 1–2 against a budget of 6;
- focus is `2px solid #3D7BFF`, `outline-offset: 2px`.

**Budgets:** homepage ≤ 15 box-shadows (currently 12) · sitewide `blur()` ≤ 6
(currently 1–2). An accordion row is a **list row**, not a raised panel — it gets
the hairline and no shadow.

---

## 5 · THE GRID

- Lines: `rgba(61,123,255,.05)`, 64px cell, **×0.75 (48px) below 768**.
- Page zones: opacity `.04`. Console / demo zones: up to `.08`.
- **Zero grid behind long body copy.** The page layer is masked out through the
  middle 56% of the viewport, which is where the 560px prose measure sits. On a
  phone the whole width is prose, so the grid effectively stops existing there —
  which is also the cheapest thing it can do on the device that can least afford
  it.

The mask used to be **inverted**: it showed the grid through the middle 30% and
faded it at the edges. That is exactly backwards.

---

## 6 · NO-NAME LAW

**`shane` = 0 and `founder` = 0, case-insensitive, across every shipped
`chauffeur/` surface.** Copy, `<title>`, meta, OG/Twitter, JSON-LD, alt, aria,
**class names**, and **comments**.

- Voice is **"the AI Chauffeur team" / AVA / operators**. Never an individual.
- **AVA is never "she" or "her."** Always AVA, by name. Grep-verified.
- Authority rail: **BUILT BY OPERATORS · 17 YEARS IN CHAUFFEURED TRANSPORTATION ·
  SETUP DONE FOR YOU.** No personal timelines.
- The operator section is titled **"Built by operators."**
- Contact email is **dispatch@aichauffeur.ai**.
- Footer copyright is **"© 2026 AI Chauffeur"** — no parent-brand credit.

**COMMENTS SHIP.** Describe a retired rule; never quote it. A grep-based audit
matches a banned string in a comment and reports a clean page as dirty. This has
happened twice on this site — and once during RUN 9 itself, when the fix note
explaining the sweep contained the word it was sweeping.

---

## 7 · CTA CANON

**Exactly one setup CTA string sitewide: "Book the setup call."** Space Grotesk,
sentence case, everywhere — nav, drawer, hero, section CTAs, footer, and from
RUN 13 the **sticky rail**. The rail is the only place the string appears
without the filled treatment: it is the ghost half of the pair, because the
filled half is the phone. See § 3 THE STICKY PAIR.

Grep gates, all must read zero: `founder-led` · `request setup` ·
`book the strategy` · `intro call`.

The call is **20 minutes**. The demo is a **phone call** to 414-775-0019.

### GOOGLE LEAD PROTECTION — copy law (ratified RUN 10)

The homepage section under that eyebrow is **fixed copy**. It ships verbatim and
takes no additions:

> **Eyebrow** GOOGLE LEAD PROTECTION
> **H2** Google found the rider. AVA finishes the handoff.
> **Body** Search and ads can make the phone ring. They can't make your dispatch
> line answer. AVA picks up every call and takes down the route, flight,
> vehicle, passengers, bags, and callback number — before the rider dials the
> next operator on the map. Every trip you capture is a booked ride, a
> relationship, and a review your competitor never gets.
> **CTA** Book the setup call → `/book/`
> **Fine print** AI Chauffeur is not affiliated with or endorsed by Google.

It describes a **mechanism** — search and ads make a phone ring; an unanswered
phone hands the rider to the next operator — and never a ranking, a placement or
an algorithmic outcome. Nothing here is attributed to Google as a quotation,
because a paraphrase presented as "Google says" is attribution fraud (§ 6 of
`/CLAUDE.md`). **The non-affiliation line is not decorative** and does not get
dropped for space: this section names another company in its heading.

**Sitewide greps, all must read zero:** `map ranking` · `local ranking` ·
`Google tracks` · `Protection Plan`.

---

## 8 · NAV + FOOTER MAP

**Desktop (≥1024px)** — one line, ≤80px tall:

```
[lockup]  Product ▾  Solutions ▾  Locations ▾        [Call (414) 775-0019]  [Book the setup call]
```

| Group | Links |
|---|---|
| Product | Live demo · How setup works · Works with your software |
| Solutions | Limo answering service · After-hours limo dispatch · Airport transfer booking |
| Locations | Milwaukee · Madison |

Panels open on `:hover`, on `:focus-within` (which fires when the **trigger**
takes focus, so Tab reaches them before any JS runs) and on click. `aria-expanded`
stays truthful. Escape closes and returns focus to the trigger. An invisible 12px
`::before` bridges the gap so the pointer does not fall through it.

**Mobile (<1024px)** — header ≤64px (measured 61px). One full-height drawer
carrying **every indexable page** as real `<a href>`, plus both CTAs. Body scroll
locks, focus is trapped, Escape closes, crossing the breakpoint closes it.

Below 1024 the chip drops the word "Call" and keeps the number; `aria-label`
carries the full "Call (414) 775-0019", which still **contains** the visible text.
The lockup scales to 23px (135px wide) and 21px (123px) under 400px — both over
the kit's 120px minimum, so the brand **name** stays in the header on every phone.
That was a deliberate RUN 5 decision and RUN 9 does not undo it.

**`.brand` and `.nav-right` are `flex:none`.** Without it the lockup was the only
shrinkable child and the bar **clipped the wordmark** instead of overflowing —
and `body{overflow-x:hidden}` plus a `position:fixed` bar means an over-wide
header never appears in `documentElement.scrollWidth`. The gate measures the nav
row against the bar's own content box for exactly this reason.

**FAT FOOTER, all 12 pages, four columns** + the NAP block on its own row:

| Column | Links |
|---|---|
| Product | Live demo · How setup works · Works with your software · Book the setup call |
| Solutions | Limo answering service · After-hours limo dispatch · Airport transfer booking |
| Locations | Milwaukee · Madison |
| Company | Call (414) 775-0019 · Privacy · Terms |

**Breadcrumbs + `BreadcrumbList` JSON-LD on all 11 non-home pages.**

**Zero indexable pages with zero incoming internal links.** Before RUN 9,
`/airport-transfer-booking/` and `/madison-limo-answering-service/` each had
**zero**. Every money page now carries ≥2 in-body keyword-anchor links from
related pages, and the homepage links each one once in body.

---

## 9 · SPACING, MEASURE, TOUCH

- Section rhythm **96px desktop / 56px mobile**. The AVA homepage's 64px override
  belongs to that page and **does not travel to this brand**.
- Body **17px** on a **560px** measure (≈62 characters, inside the 60-75 band).
  **FAQ answers are capped at `64ch`** — they had no cap at all through RUN 10
  and ran the full 1180px wrap on desktop, roughly 110 characters a line.
- Touch targets **≥44×44px**, ≥8px apart. The callback header row is **64px**.
- **Container radius is capped at 10px** (ratified RUN 11). Everything over 12px
  came down: `.console` 18 · `.crush` 18 · `.setup-card` 18 · `.ticket-card` 16
  · `.calc` 16 · `.card--stage` / `#faq .card` 14 · `.step` 14 · `.feat` 14.
  Nothing already at or under 12px was touched, and **a pill is not a
  container**: `.badge`, `.int-pill` and `.hc-state` keep their full round,
  because a status chip at 10px reads as a small box rather than as a state. The
  gate's test for "pill" is geometric — radius ≥ half the element's own height.

### THE ANCHOR GUTTER (ratified RUN 11)

`nav.top` is `position:fixed`, so it is out of flow and the scroll container
knows nothing about it. Every anchored section landed its own top edge at scroll
offset 0 — under the bar. Measured at 390 before RUN 11, on all ten homepage
section anchors: **nav bottom 61px, section kicker top 56px.** The eyebrow
rendered five pixels inside the header on every one of them, at 390 and at 430.

```
:root{--nav-h:61px}                          8+44+8+1
@media (min-width:1024px){:root{--nav-h:73px}}  14+44+14+1
html{scroll-padding-top:var(--nav-h)}
section[id],main[id],.cb-form[id]{scroll-margin-top:16px}
```

**Two properties, two jobs, and they ADD** — measured, not assumed: at 390,
padding alone settles the target at 61, margin alone at 16, the pair at **77**.
`scroll-padding-top` clears the **chrome**; it lives on the scroll container, so
it covers every target including ones no rule names, and it applies to a link
jump, a focus jump and `scrollIntoView()` alike. `scroll-margin-top` is the
**gutter**, and it belongs to the target so one can opt out without touching the
chrome clearance. A private `scroll-margin-top:76px` on `.cb-form` in two files
was deleted rather than kept: from a later stylesheet it would have beaten the
shared rule at equal specificity and the total would have been 137px.

`--nav-h` is asserted against `getBoundingClientRect()` at all six viewports on
all twelve pages. A constant describing the header is worthless the first time
the header changes and nobody re-measures; this one fails loudly instead.

**`<main id="main">` cannot clear the bar and that is geometry, not a defect.**
It starts at document offset 0, so the scrollport cannot move above it. The
assertion that means something there is the user-visible one: the first painted
line of the page clears the bar, which `.phead`'s own top padding delivers.

---

## 10 · THE TRAP LIST — everything that has cost a run

1. **THREE CSS HOMES.** See § 1. And `index.html` declares base rules *after* its
   own media queries in places; order matters at equal specificity.
2. **A wrap is not an overflow, and a height is not a wrap.**
   `Range.getClientRects().length` is the only honest line count. Comparing box
   height against line-height flags every 44px-min-height control — 1080 false
   positives in one gate run.
3. **`getComputedStyle` reports an element's OWN display.** A control inside a
   `display:none` drawer still reads `inline-flex`. Use `getClientRects().length`
   plus the visibility and **opacity chain**, or hidden nodes inflate every count.
4. **IntersectionObserver has not fired one frame after `scrollTo`.** A
   bottom-scroll probe measured immediately passes a page that grows 72px of dead
   scroll a moment later. Scroll, settle, scroll again, then measure.
5. **Comments ship.** Describe rules, never quote banned words.
6. **Reserve flex gaps in min-heights.** Two line boxes plus the padding is not
   the whole box; the row-gap is part of it.
7. **State colour changes on the same frame as the label.** No colour transition.
8. **`.step` needs `overflow:visible`** or the rail's state nodes render and are
   clipped to nothing.
9. **`aria-label` must CONTAIN the visible text**, or voice control cannot match.
10. **GHL errors arrive inside HTTP 200.**
11. **Lighthouse is a median of three, and chrome-launcher throws AFTER a good
    report is written.** Judge by the report file.
12. **A preload `href` must equal the `@font-face` `src` string exactly**, with
    `crossorigin`, or the font is fetched twice.
13. **Every zero-reading probe ships a negative control.** A gate that cannot
    fail is not a gate.
14. **Occurrence-ordered replacement is not idempotent.** If `old` is a prefix of
    `new`, re-running a sweep duplicates the insertion. RUN 9 did this three
    times before catching it.
15. **`/book/`'s booking iframe is loaded from JS, not `loading="lazy"`.** GHL's
    `form_embed.js` parks it off-screen until the widget posts ready; a native
    lazy off-screen iframe is never fetched, so it never loads, so it never
    posts — a permanent deadlock.
16. **Do not touch** `/book/`'s iframe loader, the forms, the n8n payloads, board
    wiring, or `chauffeur/fonts/`.
17. **`clip-path` is applied AFTER `filter`, and it clips the outline and every
    shadow.** An element that clips itself has no focus ring, no `box-shadow`
    and — the one that is genuinely counter-intuitive — no `filter:drop-shadow`
    either, because the filter runs first and the shadow it produces lands
    inside the region the clip then throws away. Proved by pixels, not by
    reading the spec. See the § 3 primary-control note for the structure that
    keeps all three.
18. **`scroll-padding-top` and `scroll-margin-top` ADD.** Setting both to the
    header height gives double the offset. Split them: padding clears the
    chrome, margin is the gutter.
19. **A fragment jump is still travelling when a naive probe reads the box.**
    `scroll-behavior` is smooth here, and the duration scales with distance, so
    hopping from the foot of the document to the hero outruns a 1s wait and
    reports a wildly negative offset that looks like a defect and is not.
    Measure anchors on a FRESH load, which is also what a deep link actually is.
20. **Moving a fill onto a pseudo-element blinds every probe that reads
    `backgroundColor` on the element.** RUN 11 moved three primaries and had to
    repair RUN 10's filled-CTA counter in the same commit, or it would have
    reported one filled control on a fold carrying two — in green.
21. **THE LOCAL PERF HARNESS OVERSTATES DOCUMENT SIZE BY ~3.4×.**
    `python -m http.server` sends everything uncompressed; Vercel serves this
    site **Brotli**. Measured: the homepage is 202,049 raw bytes and **58,812 on
    the wire** (3.4×), `aic.css` 3.3×, `circulant.css` 2.8×, `aic.js` 2.9×. Any
    conclusion of the form "+N KB of document costs +M ms of LCP" drawn against
    the local server is that much too pessimistic. **Measure document-size
    effects on production.** RUN 10 escalated a comment-density convention
    change on the strength of the uncompressed number; production scores 100 at
    LCP ~1524ms.
22. **A negative control can be flaky where the thing it guards is not.** RUN
    11's anchor control passed clean against production and correctly aborted
    the gate: it drove a hash round-trip into a smooth scroll across a
    ten-thousand-pixel document and read the box mid-flight — trap 19, hitting
    the gate that documents trap 19. Controls force `scroll-behavior:auto` and
    drive `scrollIntoView()` directly.
23. **THREE TOOLS GLOBBED ONLY `*/index.html`.** `stamp_chauffeur.py`, the FAQ
    mirror and the grep gate all walked one level. `/integrations/limo-anywhere/`
    and `/integrations/fasttrak/` are the first pages on this host at depth
    **two**, so all three would have skipped them in silence — no error, and
    `--check` reporting every page current about a set that excluded the two
    just written. All three now carry `*/*/index.html`, and the scan set is
    enumerated rather than assumed. **A tool that does not open a file cannot
    find anything in it, and it will say ALL CLEAN.**
24. **A shared block is prose AND rules, and CSS has no parse error to raise.**
    Editing explanatory text into the RUN 12 block left a stray `*/` mid-comment;
    the orphaned prose was swallowed as a malformed selector and it took the
    NEXT RULE with it — `.tbl--pair` silently stopped applying and the table
    went back to 620px. Nothing but a render probe noticed. The re-apply script
    scans comment balance before it writes.
25. **`details > div a` lived in `aic.css` and nowhere else.** Eleven pages
    underlined an FAQ link; the homepage, which carries its own copy of the
    shell, left colour as the only signal. Same family RUN 9 fixed for
    `.sec-sub` and friends, with `details` missing from the list, and Lighthouse
    reads 100 either way. **The audit is not the rule.** Fixed by redeclaring it
    in the block that is byte-identical in both homes by law.
26. **Git Bash rewrites a bare `/path/` argument.** `node tool.js https://host
    /integrations/` reaches node as `C:/Program Files/Git/integrations/`, and the
    only symptom is `CHROME_INTERSTITIAL_ERROR` on every run — which reads like a
    network fault, not a shell one. Export `MSYS_NO_PATHCONV=1`, and have the
    tool refuse a path argument that does not start with `/`.
27. **A Lighthouse report can EXIST and still be unusable.** Reading
    `.numericValue` straight off an audit throws inside the sweep loop and kills
    every remaining run, turning one bad report into a dead gate. Check the shape
    and report a bad run as a bad run.
28. **A single Lighthouse run is noise, and that cuts both ways.**
    `/integrations/limo-anywhere/` read perf **99** once, with a 101ms TBT spike.
    Median of three on the same URL: **100**, CLS 0.000 in 3 of 3. Do not report
    a one-run dip as a finding, and do not report a one-run 100 as a pass.
29. **MOVING CSS CHANGES WHICH RULES ARE DEAD.** `index.html` carried
    `@media(min-width:1020px){.cta-stack{margin-bottom:0}}`, and it had not
    applied to anything in a long time: a LATER rule in the same file set the
    `margin` SHORTHAND, which resets `margin-bottom`, and a media query adds no
    specificity to break a tie source order has already decided. Migrating it
    faithfully — same text, same media query — put it AFTER the shorthand
    instead of before and **resurrected it**: the homepage hero lost 48px at
    desktop and the whole page walked up 20px. A rule that lost a source-order
    tie in its old home can win it in the new one, and it arrives looking like a
    verbatim copy. **Only a rendered before/after finds this.**
30. **A SELECTOR BOTH FILES DECLARE IS THE DANGEROUS ONE, not a missing one.**
    The first RUN 13 migrator emitted a rule when aic.css did not mention its
    selector at all, and shipped a homepage missing 350 nodes of geometry —
    because aic.css carried the RUN 10/11/12 *override* for `.console`, `.step`,
    `.feat`, `.c-card` and `.btn` while the BASE those overrides were written
    against lived only in `index.html`. Selector-level presence answered "yes,
    aic.css has it" and threw the base away. **Compare per PROPERTY, not per
    selector**, and treat same-property-different-value as a human decision.
31. **`python -m http.server` IS SINGLE-THREADED and deadlocks a headless
    browser.** Chromium holds up to six keep-alive connections per origin; the
    server answers one at a time and the rest queue, so a page waiting on
    `networkidle` waits forever. The symptom is a sweep that hangs with no
    error, no timeout and no partial output — it reads like a broken probe and
    it is a broken server. Serve from the harness itself.
32. **A snapshot of an animating page diffs against itself.** Two runs of
    identical code differed on 1,130 nodes in `opacity`, `box-shadow` and
    `transform` — the console's breathing edge, the ledger pulse and `/book/`'s
    skeleton loader, each caught on a different frame. That noise sits in the
    exact properties a real regression moves. Freeze with
    `getAnimations().forEach(a => { a.pause(); a.currentTime = 0 })` before
    measuring. Note this does NOT freeze a JS-driven class swap on a timer —
    a CSS transition started after the pause call runs unpaused, which is
    how trap 29's sibling above (the `hc-state` crossfade) surfaced.
33. **Take a clean baseline from a git worktree, never from a stash.**
    `git worktree add /tmp/x HEAD` gives a pristine tree to measure against
    without putting a run's uncommitted work at the mercy of one command.

---

## 11 · THE GATES

```bash
node tools/aic-run9-gate.mjs           # 12 pages x 6 viewports, render + a11y probes
node tools/aic-run9-styleparity.mjs    # computed-style parity across the CSS homes
node tools/aic-run9-lighthouse.js      # mobile LH, a11y/SEO 100, perf vs pre-run
node tools/aic-run10-gate.mjs          # 12px floor, schema, CTA de-dup, canvas, llms.txt
python tools/aic-run10-faq-mirror.py --check   # FAQPage mirrors visible copy
node tools/aic-run10-shots.mjs after   # THE EYES GATE — shots that must be LOOKED AT
node tools/aic-run11-gate.mjs         # anchors, primary v3, rail, drawer, radius, haptics
node tools/aic-run11-shots.mjs after  # THE EYES GATE — RUN 11 set
node tools/aic-run12-gate.mjs https://aichauffeur.ai   # answer anatomy, claim ladder, tables, new-page anchors
node tools/aic-run12-lighthouse.js https://aichauffeur.ai   # PRODUCTION ONLY, 16 pages
MSYS_NO_PATHCONV=1 node tools/aic-run12-cls.js https://aichauffeur.ai /integrations/ 5
node tools/aic-run12-shots.mjs live https://aichauffeur.ai  # THE EYES GATE — the 4 new pages, 4 widths
node tools/aic-run12-book-probe.mjs https://aichauffeur.ai  # /book/ white-chrome, reads the widget frame

# RUN 13 · the dedup instruments. The first three are one-shot and are kept as
# the record of how the merge was decided; the parity harness is reusable and is
# the one to reach for before ANY future move of CSS between files.
node tools/aic-run13-cssdiff.mjs          # LOST / GAINED / net-divergent, per selector
node tools/aic-run13-reach.mjs            # does a migrating selector match anything on the OTHER pages
node tools/aic-run13-migrate.mjs          # derive the payload; property-level, source order, comments travel
node tools/aic-run13-parity.mjs snap A --site /path/to/worktree/chauffeur
node tools/aic-run13-parity.mjs snap B
node tools/aic-run13-parity.mjs diff A B  # every element, 16 pages x 3 viewports, ~60 properties + box
```

**`aic-run13-parity.mjs` is the only tool here that can prove a refactor moved
nothing.** Every other gate asserts a property someone thought to name. This one
records the resolved computed style of every rendered element on every page at
three widths and diffs two states of the tree. RUN 13's dedup passed it at
**15 of 16 pages byte-identical, 0 nodes**, with the homepage differing on
exactly the 22 nodes the run intended. It found both of RUN 13's real defects.

`aic-run12-gate.mjs` adds, with **seven** negative controls of its own: **one
visible table per new page**; a **40-60 word direct answer that is the first
prose in `<main>`**; the **five-string status vocabulary and no sixth**; the
reserved phrase absent on all sixteen; the **last-updated stamp** above the 12px
floor; **≥60% unique content**, every new page against every other page on the
site (worst 87.9%); **≥2 in-body inbound links and zero orphans**; a
**non-affiliation line** wherever a third party is named in an H1; **CTA canon**;
**chrome parity across all sixteen**; the **sitemap listing exactly sixteen**;
the **scrollable-table rules at three phone widths**; and **every anchor on every
new page at 390 and 1440** — 64 fresh loads, which is the only honest way to
measure a deep link, and which tests both `--nav-h` constants rather than one.

`aic-run12-lighthouse.js` has **no BEFORE origin at all**, because trap 21 makes
a local before/after comparison worthless for anything document-size shaped.
Perf is the median of three on the two pages worth three runs.

The render gate checks: horizontal overflow · console and page errors · full
rendered-node contrast against the AA floor · control labels on one line · accents
per section ≤2 · mobile nav ≤64px · the nav row inside its own box · no dead
scroll below the footer · homepage box-shadow budget · sitewide blur budget ·
reduced motion settles on the outcome state.

It runs five negative controls first — overflow, contrast, accent, wrap, nav-row —
against a deliberately broken fixture, and **aborts the whole run if any control
passes clean.**

`aic-run10-gate.mjs` adds, on all twelve pages: the **12px type floor** on every
rendered text node (the `.cb-label` violation had been live since the form
shipped and no probe would have caught it); JSON-LD that parses, carries no `{{`
or `REPLACE_`, and whose FAQPage mirrors the rendered Q&A; **at most one filled
`--action-blue` control in the 390 fold**; the canvas layer present; and
`/llms.txt` returning 200. It ships its own negative controls.

`aic-run11-gate.mjs` adds, with seven negative controls of its own: **anchor
clearance** on eleven targets at four widths plus every skip link, measured on
fresh loads; **`--nav-h` against the measured bar**; the **§ 3 primary-control
recipe** including host-is-not-clipped, the chamfer polygon on the `::before`,
and a **neutral** hue in the elevation; **rail geometry and its reserve**;
**drawer row 64px, full width, chevron rotation matching the rendered state**;
**container radius ≤12px with pills exempt geometrically**; **FAQ open =
`--line` border + inset rail**, and its **measure inside 60-75 characters**;
the **demo pair equal-width / 56px / 16px**; **one filled control per viewport
at every scroll step**, not only on the opening fold; and **haptics at
runtime** — 12ms on a primary, zero on nav, drawer, footer, scroll and failure,
with `navigator.vibrate` stubbed and recorded.

**THE EYES GATE is not automatable and is not optional.** `aic-run10-shots.mjs`
writes home / crush / form / footer at 390 and 1440 into `audits/run10/`, and the
run reports one line per shot: *cards separate from canvas · wordmark whole · no
void below © · one filled blue per viewport*. A run that lists those four
without having opened the files is lying in a format that looks like evidence.

---

## APPENDIX A · THE LOGO CANON

Ratified 2026-08-02 as **THE SIGNAL**; restated here in RUN 10 so no future run
has to re-ask the question. The source of record is
`chauffeur/assets/brand/README.md`, which ships with the kit.

**The logo system is CLOSED.** `chauffeur/assets/brand/*` and the root raster set
are never recoloured, redrawn, retyped, or "harmonized" to site tokens. If a
surface needs something the kit does not have, **the kit gets a new file — the
site does not get a hand-made one.**

### Colour law

| | Ground | Bars · type | Knot · accent |
|---|---|---|---|
| **Dark** — app, web, video, signage | `#0A0A0F` | `#EEF0F4` | `#00D4FF` |
| **Light** — stationery, invoice, deck | `#F7F8FA` | `#14161C` | `#0090C8` |
| **One colour** | — | `#000000` / `#FFFFFF` | no knot tint |

Bright cyan is a **dark-surface** colour; on white it fails contrast, which is
the entire reason the `-ink` variants exist. **Pick the file that already carries
the right palette. Never recolour one to reach the other.**

Clear space **X = one bar width**: lockups and wordmarks hold 3X, the mark alone
holds 2X.

### The grep gate, as amended

`#00D4FF` may appear **only** under `/assets/brand/` **and in the root favicon
files** (`favicon.svg`, `favicon-16.png`, `favicon-32.png`,
`apple-touch-icon-180.png`, `icon-192.png`, `icon-512.png`). Case-insensitive —
the SVG ships it lowercase. Anywhere else on this host it is the AVA parent's
accent leaking across a brand boundary.

`site.webmanifest` holds no logo colour. Its `theme_color` is the SITE's
background and follows § 2, not this appendix. That is the whole line: **a file
that paints the mark follows the canon; a file that paints the page follows the
tokens.**

### Surface map

| Surface | File | Minimum |
|---|---|---|
| Web nav, product header | `lockup-short.svg` | 120px wide |
| App icon, favicon | `mark-compact.svg` (root rasters derived from it) | 16px |
| Social avatar, OG card | `lockup-stacked.svg` · `assets/og-card.png` | 96px |
| Email template | `email-logo@2x.png` / `email-logo-white@2x.png` — **PNG, never SVG** | — |
| Light UI, help centre, print | the `-ink` variants | 120px wide |
| Letterhead, invoice | `lockup-horizontal-ink.svg` | 260px wide |
| Embroidery, stamp, fax | `mark-black.svg` / `mark-white.svg` | 16px |
| The mark with room to breathe | `mark-full.svg` — twelve bars, not six | **44px** |

`mark-full` is **never** used at icon sizes. Below 44px its twelve bars collapse
into a smear; that is what `mark-compact` exists for.

`assets/aic-logo.png` sits one level up from the kit on purpose — the RUN 4 Slack
rail checks that exact path, and moving it silently drops the logo out of Slack.

### The five ways this breaks

All five have been seen in the wild.

1. **Bright cyan on white.** Fails contrast. Use the `-ink` variant.
2. **Stretched.** Scale proportionally only. Never fit to a box by distorting.
3. **Rotated.** The bars sit on the baseline. The mark does not tilt.
4. **Mid-tone ground.** Full dark or full light. Nothing in between holds.
5. **Hand-built lockup.** The mark-to-word gap and the rule weights are already
   set. Use the supplied file.

### And the sixth, which cost RUN 10 a revert

6. **"Harmonizing" the mark to the site palette.** A recolour run does not
   repaint a logo, and a *derived* raster of a logo is still the logo. RUN 9
   swapped the knot from `#00D4FF` to `#3D7BFF` across the root favicon set while
   leaving `lockup-short.svg` — 40px away in the same header — untouched. The
   result was one brand wearing two accents, and no gate could see it because
   every individual file was internally consistent.
