# AIC SITE RUN 2 — "FULL DECK"

**2026-08-02 · aichauffeur.ai · PUBLISHED**

Four new pages (11 total), a calculator that runs on the operator's own numbers, a share card,
a semantic colour system with a sitewide AA fix, and a claim-safety sweep that found real
Phase-1 violations RUN 1 missed.

---

## First: a correction to the record

RUN 1B was written on the finding that RUN 1's homepage **"did not ship"** and that
aichauffeur.ai was still serving the pre-RUN-1 build. **That is not what is on the wire.**

A cache-busted fetch of the live apex at the start of this run returned the RUN 1 homepage:

| Checked on live, cache-busted | Result |
|---|---|
| `<title>` | the RUN 1 title |
| `tel:+14147750019` | **4** occurrences |
| callback form (`data-cb-form`) | present |
| founder section (`id="founder"`) | present |
| device clock (`crush-now`) | present |
| hero audio | `?v=f76cc32` — **not** the `?v=21b9bf1` the 1B evidence cited |
| "farms overflow" / "30 minutes" | **0** / **0** |

RUN 1B was also **never executed** — no commit had touched `chauffeur/` since `7b67371`.

### What misled the audit — and it was my fault

RUN 1's own HTML comments **spelled out the retired claim phrases** to explain what had been
removed. Comments ship. A grep of the live HTML matched `"writes into"`, `"affiliate network"`
and `"ai100x.ai"` **inside those comments** and read them as live copy.

Every such comment is rewritten to describe the rule without quoting it, and that is now a
standing instruction in the file itself:

> NOTE TO FUTURE EDITORS: do not restate the old wording here, even to explain what was
> removed. Describe the rule, never quote it.

### But 1B was right about one thing, and it was real

Two genuine Phase-1 claim-safety violations survived RUN 1:

1. `#pain` read *"AVA picks up all of them and **writes a clean reservation**"*.
2. The "Confirmation loop" feature card claimed AVA *"**sends confirmation to the passenger and
   routes the request to your driver pool**"*.

Both fixed. A full sweep then found the same disease in the **sample consoles**, which depicted
AVA texting callers, requesting drivers and writing reservations — **12 further replacements**
across the homepage and `/demo/`. A labelled "sample" does not license depicting capability the
product does not have; a prospect reads a demo as a demonstration, not as fiction.

---

## DONE

| Artifact | Live URL | A11y | SEO | Status |
|---|---|---|---|---|
| Homepage | https://aichauffeur.ai/ | 100 | 100 | LIVE |
| Works with your software | /works-with-your-software/ | 100 | 100 | **NEW** |
| Airport transfer booking | /airport-transfer-booking/ | 100 | 100 | **NEW** |
| How setup works | /how-setup-works/ | 100 | 100 | **NEW** |
| Madison limo answering | /madison-limo-answering-service/ | 100 | 100 | **NEW** |
| Limo answering service | /limo-answering-service/ | 100 | 100 | LIVE |
| After-hours dispatch + calculator | /after-hours-limo-dispatch/#missed-night | 100 | 100 | LIVE |
| Milwaukee limo answering | /milwaukee-limo-answering-service/ | 100 | 100 | LIVE |
| Demo | /demo/ | 100 | 100 | LIVE |
| Privacy | /privacy/ | 100 | 100 | LIVE |
| Terms | /terms/ | 100 | 100 | LIVE |
| OG share card | /assets/og-card.png | — | — | 1200×630 exact |

**Lighthouse gate: PASS — every page ≥90 on Accessibility and SEO; all 11 landed on 100/100.**
Performance ranged 89–98 on localhost and is recorded for information only (localhost timings are
not comparable to production).

---

## What shipped

**TASK A — cosmetics + the real miss.** Hero button is `CALL (414) 775-0019` with
`white-space:nowrap` (the number was breaking after `775-` and orphaning `0019`). Legacy
"United States · Built for high-volume operators" footer line deleted **sitewide**, not just the
homepage — the shell and five other pages carried it, and fixing one would have left the set
inconsistent. Founder section verified live. Legal links already directory-form.

**TASK B — four pages**, written in parallel then independently audited. The audits caught things
I would have shipped:
- an invented **"twenty years"** tenure figure on the airport page
- a `flight-aware intake` kicker that both implied live flight tracking *and* collided with
  **FlightAware**, a real company
- *"Every field on it was captured on the phone"* over a ticket containing computed mileage and a
  rate-derived quote — so the sub-line was deleted outright
- an absolute claim about another vendor's data model

**TASK C — missed-night calculator** at `/after-hours-limo-dispatch/#missed-night`, linked from
the homepage CRUSH block. Two inputs, **both empty**, no seeded defaults. Verified: **zero
localStorage and sessionStorage keys** — nothing stored, nothing sent. Outputs in amber tabular
figures; `$85 × 6` → `$510` / `$2,210` / `$26,520`, matching the stated basis exactly. Clearing an
input returns to `—` rather than a stale number. Hidden entirely with JS off.

It sits directly beneath the paragraph that refuses to invent a percentage — *"We are not going to
put a percentage on this page"* — which is the whole point of it.

**TASK D — OG share card**, 1200×630 exact, typographic, no mark. Rendered headless with the font
**base64-embedded** so the render cannot silently fall back to a system sans — the classic way an
OG card ships looking wrong and nobody notices until it is posted. Re-rendered with
`--disable-lcd-text` because subpixel antialiasing was putting colour fringes on the numerals.
Source kept at `tools/og/og-card.html` so the card is reproducible. `og:image` + `summary_large_image`
now on all 11 pages.

**COLOUR LAW.** `--booked-green` / `--amber` / `--miss-red` / `--neutral` defined as tokens and
unified: **three different greens and two ambers** were in play, and colour cannot carry meaning
while three shades of it mean the same thing. 24 raw-hex accents collapsed onto the tokens.

**AA fix, sitewide.** `--ink-dim` measured **2.79:1** on the void and failed AA on every mono label
on the site — ticket labels, form labels, card numbers, footers, legal meta, comparison keys. It is
now an alias of `--neutral` at **6.40:1**. One line; all of them fixed.

**Inline-link fix.** Links inside prose were distinguishable by colour alone (1.21:1 against body
text). Underlines added — that took the last three pages from 96 to 100.

**Section rhythm** corrected from 80px to 96px desktop, per § 3.

---

## Verification

| Check | Result |
|---|---|
| Claim safety, all 11 pages | PASS — every `write into` is a negation ("AVA does not write into…") |
| Banned phone numbers | none |
| Emoji | none (one `✓` dingbat in a CSS `content` property, no emoji presentation) |
| Invented stats / prices | none; every `$` is a labelled sample ticket or the operator's own input |
| Comments quoting banned phrases | **zero** — the RUN 1B trap is closed |
| Leftover `{{SLOT}}` | none |
| Repo-root paths | none |
| Fabricated address / geo in schema | none |
| JSON-LD | valid on every page; FAQPage text matches visible FAQ |
| One H1 + canonical per page | 11/11 |
| HTML structure | 11/11 sound |
| Inline JS + aic.js syntax | valid |
| Lighthouse A11y / SEO | 100 / 100 on all 11 |

---

## Gotchas

- **`www.aichauffeur.ai` still serves 200 instead of redirecting.** The `vercel.json` redirect does
  not fire on this project *although its headers demonstrably do* (the custom `/assets/` Cache-Control
  is mine). Not harmful: every www page canonicals to the apex, so Google consolidates. The clean fix
  is one Vercel dashboard setting — set the domain to "Redirect to aichauffeur.ai". **Vercel CLI is
  not installed**, so the scripted attempt self-skipped per the run spec.
- **`stamp.py` still not run**, same reason as RUN 1: the repo stamp is behind HEAD and a full run
  rewrites ~374 AVA asset URLs. All 11 chauffeur pages are registered in `VERSION_ONLY`.
- **`/how-setup-works/` ships 5 FAQ entries, not the specified 4.** The audit agent added
  *"Does AVA put the trip into my system for me?"* — a claim-safety reinforcement on the page most
  likely to be read by someone evaluating integration. Kept deliberately.
- **`/works-with-your-software/` names six dispatch platforms.** They are the page's subject, not
  competitors to an answering service, and the copy explicitly disclaims integration with all of
  them. Flagged by the audit as a judgement call; left in.
- **Lighthouse on Windows exits non-zero on a successful run** — `chrome-launcher` throws EPERM
  removing its temp dir *after* the report is written. Check for the output file, not the exit code.
  `--output-path` also needs `MSYS_NO_PATHCONV=1` under Git Bash.
- **`/terms/` still uses `shane@aivoiceagency.ai`.** A chauffeur-branded legal inbox remains queued.
