# THE BRIDGE — Homepage + Nav + Site Unify — 2026-07-12

Commit `9c12d7c` on `main` · rollback tag `pre-bridge-2026-07-12` · merged 5-AI challenge build + same-day addendum (Phase 3B claims patch + Phase 4B 2028 visual pack), executed as ONE unit, ONE push, fully live.

===== SHANE READBACK — COPY ALL =====

**What happened, in plain English:** The whole site now hangs together as one site. Every one of the 37 public pages got the same top navigation (Verticals + Wisconsin dropdowns, Pricing, ROI, the book button, and the 414 number), the same big footer directory with all 37 internal links, a breadcrumb trail under the nav, and — on phones — a bottom bar with the only two doors we sell: HEAR AVA LIVE and BOOK A CALL. The homepage got its claims honest (no more "every call"), a typing terminal that shows a sample call flow, a "You stay in control" trust section, your founder line above pricing, a plain-English fact block for AI search engines, and a link hub so no visitor dead-ends. The 350 texting number and the last "locked in" are gone from the public site. www now permanently forwards to the bare domain. The booking page loads with a branded loader and has escape hatches if the calendar is slow.

**DONE table**

| # | Artifact | Live? | Proof |
|---|----------|-------|-------|
| 1 | www → apex 308 catch-all (vercel.json) | ✅ LIVE | `curl www.aivoiceagency.ai/milwaukee-hvac` → 308 → apex |
| 2 | Global nav + footer grid (37 links) + call bar, stamped on 37/37 pages | ✅ LIVE | live grep: nav=1/foot=1 on /, /milwaukee, /milwaukee-hvac, /hospitality, /book, /blog/what-happens… |
| 3 | Breadcrumbs (visual + JSON-LD) on all 36 interior pages | ✅ LIVE | 36/36 gate + live `Home/Wisconsin/Milwaukee/HVAC` |
| 4 | Homepage surgery: new H1 + support line, terminal observer, trust block, founder line, WHERE-AVA-FITS (13 links), AEO fact block, form labels/consent/states, disclosures, calc-bridge CTAs | ✅ LIVE | https://aivoiceagency.ai/ (H1 string verified live) |
| 5 | 350-220-5305 + "locked in" + book.aivoiceagency.ai links = 0 public | ✅ LIVE | grep gates 0/0/0; live pages 0 |
| 6 | Claims patch: operators-told-us ×3, talking-to-a-local, 200+-simultaneous-calls ×8 (HTML + JSON-LD), /roi 30–40% stat, overview "Never sleeps" hero | ✅ LIVE | gate greps all 0; scoped phrasing live |
| 7 | Pricing canon: tier lines identical everywhere (homepage untouched) | ✅ PASS | string-compare gate green (overview already synced at 5ed9355) |
| 8 | /book: skeleton + escape hatches above iframe + 920px auto wrapper + mobile 100svh | ✅ LIVE | live grep min-height:920px ×2 |
| 9 | 786 purge | ✅ ALREADY CLEAN | repo + live grep = 0 (purged in a prior run; blog post already retitled to 414) |
| 10 | /work: hub lists Ads + Social Run 1; ← Command Deck back link on 8 pages | ✅ LIVE | commit 9c12d7c |
| 11 | Schema: LocalBusiness + offers added to homepage @graph; FAQPage/HowTo/Service verified; JSON-LD parses 37/37 | ✅ LIVE | parse gate green |
| 12 | 2028 pack: ambient hero glow, cyan H1 accent, unified card hover, scroll hairline, dividers, phone-sim audio elevation, filter/width anims → transform/opacity | ✅ LIVE | funnel.css/bridge.css in 9c12d7c |
| 13 | Glass ≤2: only the nav renders backdrop-filter now (legal pages' bare `nav{}` rule that would have hijacked the new nav: removed) | ✅ LIVE | DOM count = 1 on /, lander, /book |
| 14 | Lighthouse mobile / and /milwaukee-hvac | ✅ MEASURED | A11y **100** / SEO **100** both · Perf: LCP **444ms**, CLS **0.00** unthrottled (PSI free quota exhausted today — official mobile perf score not obtainable; Best-Practices 77 pre-existing, not a gate) |

**IDs / rollback**
- Full rollback: `git checkout pre-bridge-2026-07-12` or `git revert 9c12d7c && git push`
- Re-stamp all pages after future edits: `python tools/stamp.py` (never deploys — vercelignored)

**GSC — request re-crawl of these URLs** (Search Console → URL Inspection → Request Indexing):
`/` · `/milwaukee` · `/madison` · `/green-bay` · `/wisconsin-limo` · `/milwaukee-hvac` · `/hospitality` · `/home-services` · `/roi` · `/overview` · `/book` · `/blog/what-happens-when-you-call-ava` · `/terms.html` · `/sms-policy.html` — plus resubmit `sitemap.xml` (all 37 lastmod bumped to 2026-07-12).

**What's next**
1. Eyeball the live site on your phone — nav, footer accordions, bottom call bar, /book.
2. GSC re-crawl list above (your hands — my env has no GSC auth).
3. The 350 number is now absent sitewide; if the GHL SMS program still sends from it, the SMS policy page wording ("our business messaging number") stays legally true either way.
4. PARKED P2 (per addendum): full post-call Stress Test flow — do not build without your GO.

**Gotchas for future runs**
- Legal pages (privacy/terms/sms/methodology) had a bare `nav{position:fixed}` CSS rule — any injected `<nav>` inherits it. It's deleted now; don't reintroduce bare-element nav selectors.
- Bridge tokens are `--bz-*` prefixed: `--ink`/`--line`/`--void` mean *different colors* in funnel.css vs circulant.css — redefining them at :root repaints paper cards. Never ship the spec's raw token names.
- `/roi` had its own bottom sticky CTA — removed, THE BRIDGE call bar owns the mobile bottom rail everywhere. Watch for the same pattern on any new lander.
- Homepage LCP moved 324ms → 444ms (one extra render-blocking stylesheet + bigger nav). Still CLS 0.00. If we ever chase the 400ms law again: inline the nav-critical slice of bridge.css on `/` only.
- The hero terminal + all new motion sit behind the existing `body.glow-ready` gate; in hidden tabs rAF is throttled so animation starts only when visible — by design, not a bug.
- Deviations from spec text, deliberate: LocalBusiness description says "Answers your phone in one ring" (spec draft said "every call" — contradicts the truth law we shipped); interior section-labels keep their existing `// CYAN` style (already on-format); homepage keeps its richer FINAL-CUT sticky bar instead of the generic call bar; terminal sits bottom-left of hero (right side is the phone sim's permit).

===== END READBACK =====
