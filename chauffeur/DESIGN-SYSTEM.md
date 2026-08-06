# AI CHAUFFEUR — DESIGN SYSTEM

**Signal v1.1** · ratified RUN 9 "SIGNAL CUT v1.5", 2026-08-06.

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
| `--line` | `#1B2536` | hairline only | — |
| `--ink` | `#E8EDF5` | **16.74:1** | 15.70:1 |
| `--ink-soft` | `rgba(232,237,245,.78)` | 10.21:1 | 9.78:1 |
| `--ink-mute` | `rgba(232,237,245,.55)` | 5.47:1 | 5.38:1 |
| `--signal-blue` | `#3D7BFF` | **5.13:1** | 4.81:1 |
| `--action-blue` | `#1E56D6` | 3.15:1 *(control, needs 3)* | — |
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

The **root** icon set (`favicon.svg`, `favicon-*.png`, `apple-touch-icon-180.png`,
`icon-192/512.png`) is **not** in that exemption. Those are derived favicons and
RUN 9 redrew them in Signal from the mark's own geometry — colour-swapping them
would have left antialiased cyan halos on the new ground.

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

### The button system

| Level | Recipe |
|---|---|
| **Primary** | filled `--action-blue`, `#FFFFFF` label, `inset 0 1px 0 rgba(127,178,255,.35)` bevel. Hover `translateY(-1px)` + `brightness(1.08)`. Active `translateY(0)`. **No halo.** |
| **Secondary** | 1px `--line` on `--surface`. Border and label go `--sky` on hover. |
| **Tertiary** | `--sky` text link with an arrow. No box. |

**One primary per viewport.** In the header that means: on desktop the filled
control is "Book the setup call" and the number is a line button beside it; below
1024 the book button moves into the drawer, so the number becomes the filled one.

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
```

The render gate checks: horizontal overflow · console and page errors · full
rendered-node contrast against the AA floor · control labels on one line · accents
per section ≤2 · mobile nav ≤64px · the nav row inside its own box · no dead
scroll below the footer · homepage box-shadow budget · sitewide blur budget ·
reduced motion settles on the outcome state.

It runs five negative controls first — overflow, contrast, accent, wrap, nav-row —
against a deliberately broken fixture, and **aborts the whole run if any control
passes clean.**
