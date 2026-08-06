# AI CHAUFFEUR — DESIGN SYSTEM

**Signal v1.2** · ratified RUN 10 "SHOWROOM v2.0", 2026-08-06.
Supersedes Signal v1.1 (RUN 9) — which is still correct about everything it
covers; v1.2 adds a third elevation, a page-depth layer, a second-generation
button system, the callback console, the dispatch ledger and the logo canon.

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

## 1 · THE THREE CSS HOMES — the trap that has bitten every run since RUN 7

There is no single stylesheet. There are three, and a rule that lands in one of
them ships a site wearing two different heads:

| # | File | Loaded by |
|---|---|---|
| 1 | `chauffeur/assets/circulant.css` | all 12 pages |
| 2 | `chauffeur/assets/aic.css` | **11** pages — everything except `index.html` |
| 3 | the embedded `<style>` in `chauffeur/index.html` | the homepage only |

`index.html` does **not** load `aic.css`. It carries its own copy of the shell.

Two blocks are **byte-identical by law** and machine-checked:

- **SIGNAL v1.1 · TOKEN BLOCK** — in all three files.
- **§ G · THE NAV LAYER** — in `aic.css` and `index.html`.

Change one, change all. `node tools/aic-run9-styleparity.mjs` reads the RESOLVED
computed style of the shared chrome off a homepage and two `aic.css` pages and
fails on any difference. `/demo/`, `/terms/` and `/privacy/` carry `.rail--solo`
by design — they have no callback form — and that is asserted, not diffed away.

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

### The button system — v2 (ratified RUN 10)

| Level | Recipe |
|---|---|
| **Primary** | filled `--action-blue`, `#FFFFFF` label, `1px solid rgba(127,178,255,.30)` border, `inset 0 1px 0 rgba(127,178,255,.35)` bevel. **Hover: `background:var(--action-blue-hover)`, border `rgba(127,178,255,.55)`, `translateY(-1px)`, `filter:none`.** Active `#1A4CC2`, `translateY(0)`. **No halo.** |
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

- **Header chip** — the OUTLINED utility variant at every width. Digits always
  visible; the word "Call" survives to 380px and drops below it (measured at
  390: 123 lockup + 8 + 177 chip + 8 + 44 burger = 360 into 366 available). The
  `aria-label` still CONTAINS the visible text.
- **Hero** — keeps THE filled primary.
- **Rail** — arms only after the hero CTA cluster has left the top of the
  viewport, and suppresses itself whenever the callback form, the booking
  calendar or the footer is on screen.

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
- **Header row 44px**: mono module name left, status right — `● STANDING BY` in
  `--neutral`, flipping to `--success-green` `● CALLING NOW` **on the same frame
  as the submit succeeds**. The dot and the word are one element, so they cannot
  disagree, and `transition:none` is declared on the rule.
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
sentence case, everywhere — nav, drawer, hero, section CTAs, footer.

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
- Touch targets **≥44×44px**, ≥8px apart.
- Sharp-ish corners are **not** enforced here: this brand's live idiom is 8-18px
  radii throughout and matching it is deliberate. Corners get revisited when a
  surface is genuinely rebuilt, not patched.

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

---

## 11 · THE GATES

```bash
node tools/aic-run9-gate.mjs           # 12 pages x 6 viewports, render + a11y probes
node tools/aic-run9-styleparity.mjs    # computed-style parity across the CSS homes
node tools/aic-run9-lighthouse.js      # mobile LH, a11y/SEO 100, perf vs pre-run
node tools/aic-run10-gate.mjs          # 12px floor, schema, CTA de-dup, canvas, llms.txt
python tools/aic-run10-faq-mirror.py --check   # FAQPage mirrors visible copy
node tools/aic-run10-shots.mjs after   # THE EYES GATE — shots that must be LOOKED AT
```

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
