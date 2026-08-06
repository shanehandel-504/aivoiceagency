---
name: circulant-landing
description: MANDATORY for any visual work on the AVA parent brand — load it before writing a single line of HTML or CSS. Landing-page anatomy for aivoiceagency.ai — the fixed six sections and their order, CTA patterns and wording, the terminal-loader component, and the trust micro-copy row. Triggers on - reskin, re-skin, skin, restyle, redesign, landing page, lander, ad lander, city page, trade page, vertical hub, homepage, hero, section, fold, above the fold, page layout, mockup, artifact, deck, wireframe, component, CTA, button, "make it look better", "clean this up", "make it pop", "give it a refresh". If the task changes what a page LOOKS like, this skill fires. Pair with frontend-design + ui-ux-pro-max + taste per CLAUDE.md § SKILL ROUTER.
---

# CIRCULANT Landing

**TOKENS: CLAUDE.md § 2 is the SOLE token authority. Legacy pages may show PRE-X values — when
patching a legacy section, match the surrounding page; anything NEW uses § 2.**

Colors, type, and every design constraint are inherited from `/CLAUDE.md` § 2 CIRCULANT TOKENS and
§ 3 DESIGN CONSTRAINTS. This skill does not restate them and does not get to override them. Where a
component spec below needs to name a surface it uses the **role** — panel, hairline, muted, text,
Booked-Green — never a hex. Resolve every role against § 2.
It covers one thing: **what goes on a landing page, in what order, and in what shape.**

Run the ENGINE PIPELINE (`/CLAUDE.md` § 1) around this. This skill is what pipeline step 3 lays out
and step 4 strips down.

---

## 1 · ANATOMY — the fixed six

Section order is not a suggestion. A contractor reading at 2AM on a cracked phone gets the answer,
the evidence, the mechanism, the price, the objection, and the door — in that order.

| # | Section | Its single job | Fails when |
|---|---|---|---|
| 1 | **HERO** | State what AVA does and give one way to prove it *right now*. | It describes a category ("AI-powered solutions") instead of an outcome. |
| 2 | **PROOF** | Show a real captured call. Recorded audio or a labeled transcript. | It's a testimonial, a logo wall, or a number with no source. |
| 3 | **MECHANISM** | Explain how it works in plain sentences a plumber repeats to a partner. | It becomes an architecture diagram or lists "16 AI agents" without saying what they do. |
| 4 | **PRICING TEASER** | Anchor on $497 and route to the full sheet. | It reprints the whole ladder inline and drifts from `/overview`. |
| 5 | **FAQ** | Kill the top three objections, out loud. | It answers questions nobody asked to pad the page for SEO. |
| 6 | **CTA** | One decision, two ways to take it. | It stacks a fourth and fifth option and the page ends in a shrug. |

**Fold law.** At **390×844**, above the fold: H1 + one sentence + the primary CTA. Nothing else is
owed a pixel. Verify by rendering, not by reading the CSS.

**One H1 per page**, and it states the page's single job. Every section below it is `<h2>`.

### Section rhythm
96px desktop / 48px mobile between sections. Sections separate by **surface change** (void → panel)
or a **hairline** rule — never by a shadow, never by a rounded card float.

---

## 2 · CTA PATTERNS

### The primary
```
[ ▶ HEAR AVA LIVE ]
```
Demo-first. The fastest proof AVA works is AVA working. Use `.bs-cta.bs-cta-cyan`, add `.ava-pulse`
when the CTA is the page's single focal action.

### The secondary
Ghost outline, `.bs-cta.bs-cta-line`. One of:
- `CALL AVA LIVE` → `tel:+14142408930`
- `Book My 15-Minute Call` → `/book`

### Rules
- **Two CTAs per section. Never three.** Primary filled, secondary outlined. Identical geometry.
- **Every CTA carries `data-event`**, named `verb_noun_location` (`hear_ava_hero`, `book_click_footer`).
  No `data-event` = the CTA does not exist as far as the business is concerned.
- **A label keeps its name through the whole flow.** The button that says "Book My 15-Minute Call"
  leads to a page that says "Book My 15-Minute Call." Never rename mid-journey.
- **≥44×44px touch target, ≥8px apart.** Sharp corners. No radius.
- **Public line only** — `414-240-8930`. Never any other number.
- Existing labels in the wild: `Book My 15-Minute Call` · `Call AVA Live` · `▶ WATCH AVA BOOK IT` ·
  `Put AVA on my line`. Reuse one of these before minting a new label — label sprawl is the enemy.

---

## 3 · TERMINAL LOADER — component spec

The signature loading element. A call being handled, rendered as a line-by-line log. It is the one
place the page is allowed to be theatrical, so everything around it stays quiet.

### Behavior
- Lines print sequentially, **~180ms apart**, each line appearing whole (no character-by-character —
  that reads as a gimmick and costs paint).
- Maximum **5 lines**. A sixth means the mechanism is too complicated to sell.
- Each line = `<timestamp> <verb-first payload>`. Verb-first: `CAPTURED caller name` not
  `Caller name was captured`.
- Terminal state is the **last line, held**. It never loops. A loop says "this is a decoration";
  holding says "this happened."

### Rules
- **Zero layout shift.** Reserve the block's full final height up front with `min-height`. CLS 0.00
  is a hard gate, not a target.
- **Behind the GLOW GATE** — `body.glow-ready` only, added on window `load`. It must never compete
  with the LCP paint.
- **Reduced-motion**: `prefers-reduced-motion: reduce` renders all lines immediately in final state.
  No animation, no delay, same height, fully readable.
- **Space Grotesk only** (§ 2 — there is no mono family in this brand). Get the terminal read from
  `font-variant-numeric: tabular-nums` + `letter-spacing: 0.04em` + uppercase labels, not a second face.
- Colors by ROLE, resolved against § 2: label in **muted**, payload in **text**, status in its
  **semantic** color — Booked-Green only when the line genuinely reports a success.
- Sharp corners, **hairline** border, **panel** fill. No glow, no scanline, no CRT filter.
- Not decorative — if the log is not describing a real capability, delete the component.

---

## 4 · TRUST MICRO-COPY ROW

One line directly under the primary CTA. Class `.bs-micro`. **Muted** role, small but ≥12px.

Three to four fragments, separated by ` · `. Each fragment removes one reason to hesitate:

```
Tap to start · Captions on · No form
Real recorded call · No signup · 11.3 seconds
```

### Rules
- **Friction removal only.** It says what the visitor does *not* have to do.
- **No claims live here.** No "trusted by," no counts, no ROI, no guarantees — § 4 HARD LAWS applies
  in full, and this row is where fake proof usually sneaks in.
- Never more than four fragments. Never a second row.
- Must survive 390px without wrapping to three lines.

---

## 5 · PRE-FLIGHT — all must pass before commit

- [ ] Rendered at **390×844** and desktop. Actually rendered.
- [ ] **Zero horizontal overflow** at 390px. Zero console errors.
- [ ] One `<h1>`. Unique per page. States the page's job.
- [ ] Every CTA has `data-event`; every phone link is `414-240-8930`.
- [ ] Body text AA 4.5:1 (§ 2 has the measured numbers — Deep Cyan is **not** a body color).
- [ ] No gold, no badges, no radius, no shadow, no multi-hue gradient (§ 3).
- [ ] No fabricated stat. Sourced set only (§ 4).
- [ ] No "locked in," no AVA/she/her, no "guaranteed" (§ FORBIDDEN WORDS).
- [ ] Canonical + OG + JSON-LD present and parsing; page added to `sitemap.xml`.
- [ ] Page registered in `tools/stamp.py` `PAGES` (or `VERSION_ONLY` for chrome-free landers) — an
      unregistered page never cache-busts.
- [ ] `js/tracking.js` loaded. No per-page tracking snippet.
- [ ] LCP ≤400ms · CLS 0.00.

## Starting material

`templates/lander-master.html` — the noindex master mold, 8 named slots (HOOK-KICKER, TIME-HEADLINE,
PROOF-TRANSCRIPTS, LOSS-CALCULATOR, CTA-STACK, WHAT-GOOGLE-HEARD, SCHEMA, OG-META). Clone it rather
than starting from a blank file. `/lsa` is the canonical built example — and is frozen as authored.
