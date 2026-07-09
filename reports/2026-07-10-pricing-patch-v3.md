# Pricing Patch v3 — Shane Readback (2026-07-10)

**Mission:** Freeze-exempt, founder-directed pricing update to the homepage.
**Canon:** 🔒 MASTER PRICE SHEET v3 — Notion Lane 1 (`398581219cb2818bbec4f174d2c18518`). Prompt copy = executable source; Notion = reference.
**Scope kept tight:** `index.html` (3 regions + the cost-FAQ JSON-LD, which is the machine copy of Region 3) and `assets/funnel.css` (3 new muted styles the swaps required). Hero, JS modules, other pages, and all other CSS untouched. Homepage POLISH FREEZE respected — this is the one sanctioned exception.

---

## Plain English (no code needed)

The pricing block on **aivoiceagency.ai** now sells three named "systems" instead of vague tiers:

- **Starter System — $497/mo** ("+ $497 setup · + voice usage"). "For businesses that need the phone answered and jobs booked." Five plain-English bullets (24/7 answering, qualify + book, missed-call recovery + text-back, call summaries/recordings/transcripts, owner alerts). Small grey footnote: *CRM writeback and campaigns are scoped separately.*
- **Growth System — $997/mo** ("+ $1,500 setup · + voice usage"). "For businesses that want AVA answering, following up, and updating their system." Exactly four bullets (everything in Starter, speed-to-lead callback, 7-day no-book follow-up, simple one-system CRM writeback). Footnote: *Cold outbound campaigns, payments, quoting, and dispatch are custom.* Button now says **"Build my Growth system."**
- **Operations System — From $1,997/mo** ("+ scoped setup · + voice usage"), flagged **"Custom build."** "For businesses where every call has rules, exceptions, or money attached." Four bullets (custom intake + routing, deep CRM/industry-software writeback, warm transfers + escalation, multi-line/location/language). Button "Scope it" (unchanged).

A one-line subhead sits under the header — *"Start simple. Scope the complex."* The gold **scope note** now spells out that transportation & dispatch (limo, chauffeur, shuttle, airport, flight, vehicle-class, dispatch software) are **custom intake builds, not part of the local plans**, plus "White Glove — by application." The bottom banner now reads **"Starts at $497/month. No contracts. Cancel anytime."** and the "What does it cost?" FAQ answer was rewritten to match the new numbers (and the invisible Google/AI structured-data copy was synced so search engines don't see stale pricing).

It looks the same as before — white cards, blue accents — just with the new numbers, the "who it's for" lines, and the tiny grey caveats. Verified on a real browser at desktop (3 columns, equal height, buttons line up) and at phone width (single column, big tappable buttons).

---

## DONE — what shipped (all live)

| Item | Live? | Proof (curl of `https://aivoiceagency.ai/`) |
|---|---|---|
| Section subline "Start simple. Scope the complex." | ✅ | grep hit = 1 |
| Starter psub "+ $497 setup · + voice usage" | ✅ | `$497 setup` = 1 |
| Starter positioning line + 5 bullets + footnote | ✅ | in live HTML |
| Growth psub "+ $1,500 setup · + voice usage" | ✅ | `$1,500 setup` = 1 |
| Growth = exactly 4 bullets, CTA "Build my Growth system" | ✅ | `Build my Growth system` = 1 |
| Operations flag "Custom build" | ✅ | `Custom build` = 1 |
| Operations price "From $1,997/mo" + "+ scoped setup" | ✅ | `From $1,997` = 1, `+ scoped setup` = 1 |
| Scope note transportation & dispatch carve-out | ✅ | `custom intake builds` = 1 |
| Banner "Starts at $497/month…" | ✅ | `Starts at $497` = 1 |
| Cost FAQ rewritten + JSON-LD schema synced | ✅ | `Voice minutes are billed by usage` = 2 (visible + schema) |
| Old copy removed | ✅ | `Custom quoted`=0, `Volume-driven scope`=0, `Typical starting point`=0, `custom-quoted`=0 |
| Site healthy | ✅ | HTTP 200 |

**QA (scoped to the diff):** she/her for AVA = 0 · founder = 0 · free-minute language = 0 · private numbers (305/480/786) = 0. Three independent verify agents (copy-fidelity, guardrails, a11y-layout) each returned PASS / zero mismatches, incl. a byte-level em-dash/middot audit.

**a11y / CLS (live-browser measured):** desktop 3-col heights 582/582/582 (equal), CTA baselines aligned (5825/5825/5825); mobile 390px single column, CTA buttons 52px tall × 298px wide. Contrast — positioning line & footnote `#4A5160` on white = **7.96:1**; subline `#9AA1AD` on void = **7.60:1**; "Custom build" flag `#0A7EA4` on white = **4.63:1** — all ≥ AA. New nodes are static HTML → zero CLS. Lighthouse a11y stays 100.

---

## IDs & rollback

- **Feature commit:** `2facd79` — `feat(/): pricing patch v3 …` (index.html + assets/funnel.css)
- **Push:** `37b4e89..2facd79 main -> main` (Vercel auto-deploy)
- **One-line rollback:** `git revert 2facd79 && git push` (restores previous pricing copy in one deploy)
- **CSS added (funnel.css):** `.tier .ppos`, `.tier .pfoot`, `.pricing-sub` — 3 rules, muted/AA-safe, no layout-model change.

---

## What's next
- None required — unit is complete and live. If Shane wants the Growth footnote to hug the last bullet instead of sitting just above the CTA, that's a one-line flex tweak (wrap `ul`+`pfoot`), not shipped to stay surgical.
- Optional: mirror the same three-system framing to `/overview`, `/deck`, and the ROI/pricing subpages if the v3 sheet is now canon everywhere (out of this mission's scope — homepage only).

## Gotchas
- **FAQ schema sync (line 56) was included on purpose.** It's the machine-readable twin of the visible cost FAQ; leaving it stale would have shipped contradictory pricing (old "custom-quoted", no $1,997) to Google's rich results. Same Q&A content, so it's Region 3, not scope creep. Uses "that is" (not "that's") to stay clean inside the JSON string.
- **Hero + meta/OG still say "From $497/month"** (index.html:162 / 7 / 15 / 21 / 48). Left intact — still accurate ($497 is still the entry price) and the hero is explicitly out of scope under the freeze.
- **Flag color `#0A7EA4` is 4.63:1** — passes AA but only by +0.13. Pre-existing and applied to all three flags (not introduced here); note it before ever darkening the paper background or the flags could tip below AA and drop a11y from 100.
- **Untracked repo cruft** (`.ava_build_tmp/`, `.claude/launch.json`, `sitemap.xml.bak-aichauffeur`, `voice-stack/*` backups, `.wrangler/`) was deliberately NOT committed — only the two intended files were staged.
