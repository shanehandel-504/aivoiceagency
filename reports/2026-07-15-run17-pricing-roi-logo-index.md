# RUN 1.7 — TRUE PRICING SKIN + /ROI BRIDGE PASS + LOGO GLOW + INDEX LIST — 2026-07-15

```
===== SHANE READBACK — COPY ALL =====

RUN 1.7 — TRUE PRICING SKIN + /ROI BRIDGE PASS + LOGO GLOW + INDEX LIST — LIVE
https://aivoiceagency.ai/

PLAIN ENGLISH
Skin + fixes, no content changed anywhere.

P0 DONOR — I found the real card you meant: the purple glass tiers on
/overview (Starter cyan · Growth purple/featured · Operations gold). That's
the donor. (The "pitch" page is a slide deck; not it.)

P1 PRICING — the homepage plan cards now wear that treatment: per-card
accents (Starter cyan, Growth the purple hero — scaled up with a violet
glow, Operations gold), check-in-a-circle bullets, accent pill buttons,
a soft glow behind the row. Prices, names, bullets, buttons, tabs — all
byte-for-byte unchanged (proven by diff). Works in dark and light.

P2 /ROI — rebuilt to match the site:
- Killed the generic waveform header; clean bridge header + a soft glow.
- Tightened the calculator so the sliders fit ~1.3 screens on mobile.
- The bottom Answer/Book/Log cards got the donor glass skin (cyan/purple/gold).
- SCROLL BUG FIXED: the header waveform was being pushed down as you
  scrolled, which created endless extra scroll ("past the footer"). Removed
  it and locked overscroll. The page now ends where it should — verified on
  iPhone Safari.

P3 LOGO — the brand dot now radiates: a bright cyan halo with a slow breathing
pulse, both themes, respects reduced-motion, zero layout shift.

P4 INDEX LIST — below, priority-ordered for Google Search Console (10/day).

DONE TABLE
| Phase | Shipped | Proof |
|---|---|---|
| P0 Donor | overview.html identified | EYE shot b17-donor-overview-cards |
| P1 Pricing skin | css/backstage.css .bs-tier | diff-clean, per-card accents, AA CTAs |
| P2 /roi pass | roi/index.html | text diff-clean, panel 1.27 screens, scroll stable |
| P3 Logo glow | assets/bridge.css .bdot | breathing halo, CLS 0 |
| P4 Index list | (below) | 37 URLs priority-ordered |

GATES (all met, both engines)
- Dual-engine E2E 22/22 GREEN (Chromium + WebKit @390)
- Zero console errors on /, /roi, /book — both engines
- LCP 658ms (<2.5s) · CLS 0.00 · Lighthouse a11y/SEO/agentic 100 (≥ 1.6)
- Pricing HTML + /roi visible text both byte-identical (content frozen)
- /roi scroll bug proven dead on WebKit 390 (scrollHeight stable top→bottom)
- Grep guards clean (only 414-240-8930; no banned phrases; AVA never she/her)

===== GSC MANUAL-INDEXING LIST (priority order, 10/day) =====
# MONEY PAGES  (note: /pricing = the homepage #pricing anchor, not a separate URL)
https://aivoiceagency.ai/
https://aivoiceagency.ai/roi
https://aivoiceagency.ai/book
https://aivoiceagency.ai/overview
# VERTICAL HUBS
https://aivoiceagency.ai/home-services
https://aivoiceagency.ai/medical-practices
https://aivoiceagency.ai/professional-services
https://aivoiceagency.ai/hospitality
https://aivoiceagency.ai/ground-transportation
# CITY HUBS
https://aivoiceagency.ai/milwaukee
https://aivoiceagency.ai/madison
https://aivoiceagency.ai/green-bay
https://aivoiceagency.ai/wisconsin-limo
# CITY × TRADE
https://aivoiceagency.ai/milwaukee-hvac
https://aivoiceagency.ai/milwaukee-plumbing
https://aivoiceagency.ai/milwaukee-electrical
https://aivoiceagency.ai/milwaukee-dental
https://aivoiceagency.ai/milwaukee-roofing
https://aivoiceagency.ai/madison-hvac
https://aivoiceagency.ai/madison-plumbing
https://aivoiceagency.ai/madison-electrical
https://aivoiceagency.ai/madison-dental
https://aivoiceagency.ai/madison-roofing
https://aivoiceagency.ai/west-bend-hvac
https://aivoiceagency.ai/west-bend-plumbing
https://aivoiceagency.ai/west-bend-electrical
https://aivoiceagency.ai/west-bend-dental
https://aivoiceagency.ai/west-bend-roofing
# INSIGHTS
https://aivoiceagency.ai/blog
https://aivoiceagency.ai/blog/what-happens-when-you-call-ava
https://aivoiceagency.ai/blog/wisconsin-limo-crush
https://aivoiceagency.ai/blog/home-services-30-percent-missed
https://aivoiceagency.ai/videos
# LEGAL (lowest priority)
https://aivoiceagency.ai/methodology.html
https://aivoiceagency.ai/privacy.html
https://aivoiceagency.ai/terms.html
https://aivoiceagency.ai/sms-policy.html
===== END LIST (37 URLs) =====

IDS / ROLLBACK
- Rollback tag: pre-run17-2026-07-15
- One-line rollback: git revert <run17-commit> && git push

GOTCHAS
- Deviation flag (veto-able): the pricing prices stay GOLD (ACCENT LAW),
  where the /overview donor used white prices — I kept gold to honor the
  documented "gold = money" law. Say the word for white prices.
- /pricing is not a real page (it's /#pricing on the homepage). GSC list
  reflects that.
- /roi's own old sticky-CTA was already gone; it now relies on the shared
  bridge call bar. Its calculator MATH and every label/number are untouched.

===== END READBACK =====
```
