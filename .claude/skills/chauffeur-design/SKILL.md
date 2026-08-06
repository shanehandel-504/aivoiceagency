---
name: chauffeur-design
description: MANDATORY for any AI Chauffeur / aichauffeur.ai surface — load it before writing a single line of HTML or CSS for that brand. Dark luxury minimalist brand law for the chauffeur vertical - leather-black base, crisp white lettering, amber indicators, the Signal mark, Space Grotesk, and the 414-775-0019 line. Triggers on - chauffeur, AI Chauffeur, aichauffeur, aichauffeur.ai, limo, limousine, limo page, black car, livery, NEMT, charter, airport transfer, dispatch site, dispatch page, blue-brand, chauffeur re-skin, chauffeur reskin, chauffeur lander, "the other site", "the limo brand". AI Chauffeur is a SEPARATE brand and a SEPARATE Vercel project from aivoiceagency.ai - do NOT load circulant-landing for it and never cross tokens between the two. Pair with frontend-design + ui-ux-pro-max + taste per CLAUDE.md § SKILL ROUTER.
---

# CHAUFFEUR DESIGN — AI Chauffeur brand law

The vertical brand: **dark luxury minimalist.** Leather-black base, crisp white lettering, amber
indicators, one mark that is a voice and a bow tie at the same time. Quiet, expensive, and legible
to a dispatcher at 2AM.

Forged RUN S2 (2026-08-06). Every value below was **derived from the live pages** — production CSS
and production HTML on `aichauffeur.ai` — not proposed. Where something is genuinely undecided it
sits in AWAITING SHANE RATIFICATION at the bottom and is marked as such.

---

## 0 · HOST TOPOLOGY — read before you touch a file

- `aichauffeur.ai` is a **separate Vercel project rooted at `/chauffeur/`**. The repo-root
  `vercel.json` does not reach it and repo-root asset paths **404 in production**. Assets must exist
  under `chauffeur/`. Topology: `docs/aichauffeur-host.md`.
- The chauffeur homepage does **not** load `assets/aic.css` — it carries its own inline copy. Two
  CSS copies exist by design. Editing `aic.css` alone will not change the homepage.
- The parent brand's skills do not apply here. **Never load `circulant-landing` for a chauffeur
  surface** — that file is the AVA parent's landing anatomy and its CTA labels and phone number are
  wrong for this brand.

---

## 1 · TOKENS

**TOKENS: CLAUDE.md § 2 is the SOLE token authority. Legacy pages may show PRE-X values — when
patching a legacy section, match the surrounding page; anything NEW uses § 2.**

AI Chauffeur runs on the § 2 CIRCULANT-X token set. It does **not** get a private palette. What this
section records is which § 2 roles the brand uses and what each one *means here* — the meaning is the
brand, the hexes belong to § 2.

| Brand role | § 2 token | Verified live | Means, on this brand |
|---|---|---|---|
| **Leather-black base** | Background (void) | `--void` ✓ | The page. Never pure black. |
| **Raised leather** | raised surface | `--void-2` ✓ | Cards, panels, the one step up from base. |
| **Crisp white lettering** | Text | `--ink` ✓ | All copy. Never pure `#FFFFFF`. |
| **Amber indicator** | Amber | `--amber` ✓ | **Ringing · pending · the cost of the miss.** Indicator only. |
| Captured | Booked-Green | `--booked-green` ✓ | Confirmed · captured · ready. |
| Failure | Miss-Red | `--miss-red` ✓ | Failure only. Never "attention". |
| Inactive | Neutral | `--neutral` ✓ | Not-yet · n/a. |
| Interaction | Accent (cyan) | `--cyan` ✓ | **Currently the primary CTA/interaction color — see § 7.** |

**Measured on the live base** (recomputed RUN S2, not copied): amber 10.80:1 · accent 11.16:1 ·
text 17.31:1 · Booked-Green 12.23:1 · Miss-Red 5.63:1 · Neutral 6.40:1. All pass AA body on both the
base and the raised surface. Raised-on-base is **1.08:1** — invisible without a hairline, so the
hairline rule is required, exactly as § 2 says.

**Amber is an indicator, not a mood.** It may appear when something is literally ringing, pending, or
being lost. "It looks warm and premium" is not a licence to paint with it. Max two accents per
section (§ 3).

---

## 2 · TYPE

**Space Grotesk** for everything, **JetBrains Mono** for numerals-in-instruments (timestamps, call
durations, rate figures). Both verified live and both **self-hosted woff2** —
`/fonts/space-grotesk.woff2`, `/fonts/jetbrains-mono.woff2`.

- Self-hosting is load-bearing: it took homepage CLS from 0.126 to **0.000** (AIC RUN 8). Do not
  reintroduce a Google Fonts CDN link.
- A metric-matched fallback **must carry the same `unicode-range`** as the real face, or it silently
  steals glyphs like `→` and `✓`.
- No third family. No serif accent. No display pairing.

---

## 3 · THE MARK — Signal

**It already exists. Do not draw a new one.**

The mark is **Signal**: waveform bars — a voice on a line — tied by a **center knot**. The knot is
the bow tie *and* the handoff: the call becomes a booking. That is the "bow-tie mark that doubles as
an acoustic waveform" — built, shipped, and sitting in `chauffeur/assets/brand/` as a 24-file
production kit with its own surface map in that folder's `README.md`.

- Every file is supplied production SVG: outlined type, no embedded fonts, no external refs.
- **Do not redraw, retype, or rebuild these.** If a surface needs something the folder lacks, the
  kit gets a new file — the site does not get a hand-made one.
- Pick by surface from the README's map, and respect the minimum sizes (`mark-compact` 16px ·
  `lockup-short` 120px wide · `mark-full` 44px, twelve bars not six).
- SVGO on these files is **render-gated**: the default profile drifted pixels on all 11
  outlined-type marks. Never re-minify without an A/B render.

---

## 4 · HARD LAWS — same as the parent, no softening

Everything in `/CLAUDE.md` applies here in full. The ones that get broken most:

- **Vanilla HTML/CSS/JS only.** No React, Tailwind, npm, build systems.
- **Flat.** No shadows, no elevation, no glassmorphism. **Sharp 90° corners**, `border-radius: 0`.
- **AA 4.5:1** on body text, measured not eyeballed.
- **No multi-hue gradients. No badges/pills as ornament. No rounded template cards. No emoji as
  icons. No floating decorative orbs. Never gold.**
- **No spinners.** A spinner says "we don't know." Show the state.
- **No fabricated stats, testimonials, metrics, or ROI.** Ever.
- **Grade 5–7 readability.** A dispatcher reads it at 2AM on a cracked phone.
- **AVA is never "she" or "her."** Always AVA, by name.
- **"locked" / "locked in" is banned** in our own copy — use "set" or "decided".
- Motion 150–300ms, transform/opacity only, reduced-motion safe, behind the **GLOW GATE**.
- Section rhythm **96px desktop / 48px mobile**. The 64px override is the *AVA homepage's* alone and
  does not travel to this brand.

## 5 · PHONE

**414-775-0019 is the AI Chauffeur line, and the only voice number on any chauffeur surface.**
Verified live sitewide, twice on the homepage. The parent's `414-240-8930` must **never** appear on
a chauffeur page, and `414-775-0019` must never appear on an AVA parent page.

## 6 · PRE-FLIGHT — all must pass before commit

- [ ] Rendered at **390×844** and desktop. Actually rendered, actually inspected.
- [ ] Zero horizontal overflow at 390px. Zero console errors.
- [ ] Body text AA 4.5:1, measured.
- [ ] Assets resolve **under `/chauffeur/`** — check production, not local. A repo-root path 404s.
- [ ] Homepage change? Confirm whether the inline CSS or `aic.css` is the one actually serving it.
- [ ] Phone is `414-775-0019` everywhere; no `414-240-8930` anywhere.
- [ ] Mark taken from `assets/brand/`, correct variant, above its minimum size.
- [ ] CLS 0.00 — fonts self-hosted, media dimensions reserved.
- [ ] No gold, no radius, no shadow, no gradient, no spinner, no fabricated metric.
- [ ] `chauffeur/sitemap.xml` + `robots.txt` updated if a page was added.

---

## 7 · AWAITING SHANE RATIFICATION — do not treat as canon

Two real conflicts. Both are decisions, not facts, so neither is written as law. **Do not resolve
either one silently in a build.**

### 7a · Is the chauffeur accent cyan or amber?

- **On the wire today:** the accent (cyan) is the primary CTA/interaction color across the brand,
  with amber reserved for ringing/pending. Verified in production CSS.
- **The tension:** `/CLAUDE.md` § 8 calls for "deep muted amber indicators" and states plainly that
  *"AVA parent (cyan) and AI Chauffeur (blue) are separate brands. Never cross tokens."* The live
  site currently uses **the parent's own cyan** as its primary accent — which is the exact
  cross-brand condition § 8 forbids.
- **The decision:** keep cyan (accept that the brands share an accent), or move chauffeur to
  amber-led and free cyan back to the parent.
- If amber-led is chosen and a genuinely *deeper, muted* amber is wanted rather than the current
  bright one, these all pass AA body on both the base and the raised surface — measured this run:

  | Candidate | On base | On raised | Verdict |
  |---|---|---|---|
  | `#E8951A` | 8.23:1 | 7.63:1 | AA body ✓ |
  | `#D98514` | 6.88:1 | 6.38:1 | AA body ✓ |
  | `#C77A12` | 5.85:1 | 5.43:1 | AA body ✓ — deepest that still reads as amber |
  | `#B86E10` | 4.96:1 | 4.60:1 | AA body ✓ — at the edge |

  **None of these is canon.** They are AA-proofed options for a ratification decision.

### 7b · `/CLAUDE.md` § 8 is stale and should be corrected

§ 8 describes AI Chauffeur as *"Electric Blue `#3B82F6` / `#60A5FA` · Instrument Serif (display,
italic) · Inter (body)"* and describes the bow-tie mark as a future direction "not yet on the wire."

**Verified against production this run, all four claims are false:**

| § 8 says | Production actually serves |
|---|---|
| Electric Blue `#3B82F6` / `#60A5FA` | **Not present anywhere.** The accent is § 2 cyan. |
| Instrument Serif (display) | **Not present.** Space Grotesk. |
| Inter (body) | **Not present** as a font-family. Space Grotesk + JetBrains Mono only. |
| Bow-tie mark "not yet on the wire" | **Shipped** — the Signal kit, 24 files, live. |

RUN 7 and RUN 8 moved the brand onto CIRCULANT-X and § 8 was never updated. Correcting § 8 is a
CLAUDE.md edit and was **out of scope for RUN S2**, which was told to touch § 1 only. Until Shane
ratifies, **this skill is the accurate description of the brand and § 8 is not.**
