# RUN 1 — AVA BACKSTAGE: Foundation + Homepage — 2026-07-14

```
===== SHANE READBACK — COPY ALL =====

RUN 1 — AVA BACKSTAGE · FOUNDATION + HOMEPAGE — LIVE on aivoiceagency.ai

PLAIN ENGLISH
The homepage is now the Backstage page. Visitors see a clean text hero
("AVA answers calls and books jobs.") with WATCH AVA BOOK IT and CALL AVA
LIVE buttons, then a theater: tap once and a scripted 2:14 AM plumbing
call plays out across 16 glowing agent orbs in 4 lanes (INTAKE, TRIAGE,
TOOLS, OUTPUT). A live dot travels the wires between them, a log types
out each step, receipt chips pop, and at 11.3 seconds the clock stops
dead and a card docks: JOB BOOKED · TUESDAY 7:00 AM · YOU WERE ASLEEP —
with Book and Call buttons. Six trades are switchable (plumbing default,
HVAC, electrical, dental, roofing, black car). Tapping a finished log
line pops the recap SMS. There's a sun/moon theme toggle, and every
screen has a bottom bar with the 414 number + BOOK. Everything demo is
labeled sample/simulated — no invented results presented as real.
The old homepage is archived, not deleted; no audio files were touched.

FOUNDATION (this is the part future runs reuse)
- assets/guide.css — BACKSTAGE TOKENS merged in (lanes, elevations
  e0–e3, the 5 motion curves, light-theme twins). One system, no forks.
- css/backstage.css — ORB (idle/active/working/done), signal-pill,
  wiring-panel, receipt chips, callbar, the whole theater.
- js/backstage.js — THE SEQUENCER. Emits ava:call-start / ava:agent /
  ava:chip / ava:booked / ava:freeze / ava:replay. Everything binds here.
- data/calls.json — six trade scripts, same 16 agents, same voice.
- tools/render-audit.mjs — THE EYE (headless screenshots + fold report).

DONE TABLE
| What                         | Shipped                                   | Proof |
|------------------------------|-------------------------------------------|-------|
| Homepage rebuild (2 layers)  | index.html                                | live H1 + theater |
| Wave-0 tokens                | assets/guide.css (appended block)         | light/dark flip E2E |
| Components                   | css/backstage.css                         | E2E 17/17 |
| Sequencer                    | js/backstage.js                           | payoff docks, clock stops 11.3s |
| Six trade scripts            | data/calls.json                           | swap tested live |
| JSON-LD library              | Organization/#organization + WebSite + Service + $497 Offer | parses, SEO 100 |
| OG card = payoff frame       | assets/og-backstage.png (1200×630)        | captured from real render |
| THE EYE                      | tools/render-audit.mjs + /audits shots    | before/after committed |
| Cache headers /css /data     | vercel.json                               | SWR like /js |
| Sitemap lastmod              | sitemap.xml → 2026-07-14                  | grep |
| Board flip                   | hq/board.json Run-1 item + log            | parses |

GATES (all passed pre-push, local Slow-4G/4×CPU)
- Fold 390×844: H1 @146px · CTAs @319/383 · result strip @484 · callbar @777
- LCP 1,593 ms (gate ≤2,500) — LCP is the Layer-1 H1 text · CLS 0.00
- Lighthouse mobile: A11y 100 · SEO 100 · Agentic 100 · Best-Practices 77
  (the 77 is ONLY the Meta-pixel third-party cookie — site-wide tracking
  spine, same as before this run)
- E2E 17/17: first event <500ms after tap · one working agent at a time ·
  clock stops dead at 11.3s · all 16 orbs done · payoff docks · replay ·
  trade swap · party-trick SMS · theme flip+persist+meta · reduced-motion
  renders resolved state · Live Wire hidden under reduced motion
- Zero console errors · JSON-LD + calls.json + board.json all parse
- Grep guards: locked/100 free/sounds human/she-her/other-numbers = 0

ADVERSARIAL REVIEW (36-agent workflow, 5 lenses, every finding re-verified)
25 confirmed defects found and FIXED before ship. The big ones:
- "✓ BOOKED" chip was permanently invisible after every completed run
  (freeze paused its pop animation at scale 0) — exempted chips from pause
- "Zero missed calls." subhead violated your claims canon (same class THE
  MINE purged) → "One call. Sixteen agents. Watch every handoff."
- og:description presented 11.3s demo stat unlabeled → now "scripted sample call"
- Light theme failed WCAG AA (white-on-cyan CTAs 4.03:1, green/gold small
  text) → twins darkened to #00749C / #9A6200 / #0B7E56
- bridge.js scroll-reveal would flash-hide sections (it keyed on the retired
  .pod) → neutralized on this page
- Silent dead button if calls.json ever fails → console warning + TAP TO RETRY
- Offscreen-pause bug (IntersectionObserver read the oldest entry) + trade-swap
  could play invisibly offscreen + payoff-card orphan rAF + resize dot desync
- AEO block missed Growth's $1,500 setup · SMS placeholder drifted from JSON
- Keyboard/AT: log lines tabbable once fired, toggle-group semantics, focus
  handoff when TAP TO START hides, live-region muted during trade swap

IDS / ROLLBACK
- Rollback tag: pre-backstage-2026-07-14 (state before this run)
- One-line rollback: git revert <run1-commit> && git push
  (or: git checkout pre-backstage-2026-07-14 -- index.html && git push)
- Old homepage archived: legacy/index-funnel-v2-2026-07-14.html
- Frozen funnel assets (funnel.css/js, ava-pod/theater/webcall, audio)
  untouched on disk — only unreferenced by the new homepage.

WHAT'S NEXT
- Shane eyeball on phone: tap WATCH AVA BOOK IT, swap trades, flip theme
- Facebook/X share preview will show the new payoff-frame OG card
- Future runs bind to the sequencer events (ava:booked etc.) — that's the
  Wave-0 contract; don't fork it

GOTCHAS
- Spec deviations (flag for veto): "Zero missed calls" reworded per your
  own claims canon; light lane twins darkened past the spec values for
  WCAG AA; role=tablist swapped for toggle-group semantics (axe flagged
  the ARIA tab pattern without panels); role=log moved to a wrapper div
  so the <li>s keep list semantics.
- The homepage POLISH FREEZE was superseded by this run's explicit rebuild
  order; the page is now re-frozen at this commit under the same law.
- data-event beacons now fire from backstage.js (funnel.js no longer
  loads); tracking.js unchanged, all money events intact.
- stamp.py contract intact: BRIDGE:NAV/FOOTER markers preserved verbatim;
  the theme toggle is JS-injected so a re-stamp can't wipe it.
- Old JSON-LD @ids (/#org, FAQPage, AudioObjects) are gone from the
  homepage per spec — interior pages keep their own graphs.
- BP 77 = Meta-pixel cookie only; goes green if the pixel ever moves
  server-side. Not a regression.

===== END READBACK =====
```
