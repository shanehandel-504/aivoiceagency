# RUN 1.8 — AVA PULSE + VIEWPORT LOCK + PAYOFF GLASS + LIGHT POLISH — 2026-07-15

```
===== SHANE READBACK — COPY ALL =====

RUN 1.8 — AVA PULSE + VIEWPORT LOCK + PAYOFF GLASS + LIGHT POLISH — LIVE
https://aivoiceagency.ai/

PLAIN ENGLISH
Skin + fixes only. No words, prices, or math changed anywhere — proven
byte-for-byte against the RUN 1.7 version.

P1 AVA PULSE — your main buttons now have a signature glow: a soft breathing
halo that drifts cyan → a hint of violet → a hint of gold and back, plus a
gentle "notification ping" ring that expands and fades. It's on the hero
buttons, the call bar on every page, the JOB BOOKED buttons, the three plan
buttons, and the /roi book button. The social links get a quieter cyan-only
version. Buttons are staggered so they never blink in unison. It's pure light
(no layout), so it can't push the page sideways or cause any jump, and if
someone has "reduce motion" on, it becomes a single still glow.

P2 VIEWPORT LOCK — the side-to-side slide you circled is DEAD. At phone width
the page was 526px wide in a 390px screen (136px of overhang). I found and
fixed the real causes: the buttons were sized wrong (their padding pushed them
past the edge), the two hero buttons were too wide so they now stack full-width
on narrow phones, and the hidden JOB BOOKED card's glow was secretly 148px too
wide on each side. Then a page-level clamp as a seatbelt. Proven on the LIVE
site: the page is exactly screen-width and can't be panned sideways on the home
page, /roi, /book and /overview — in BOTH Chrome and iPhone Safari. Pinch-to-zoom
still works (I did not disable it).

P3 JOB BOOKED GLASS — the money shot got a real glass upgrade: frosted panel
with depth, a 1-pixel top highlight, and a thin rim that runs cyan → violet →
gold around the corners. The key lines are now colored — TUESDAY · 7:00 AM in
gold, the 11.3-second count in cyan, YOU WERE ASLEEP in violet, JOB BOOKED stays
green. All readable (passes contrast) in both dark and light.

P4 LIGHT POLISH — swept the light theme at phone and desktop. Where dark uses
glow, light uses "paper" (soft layered shadows, crisp edges). The booked card in
light is paper, not glow, and slightly more solid so every colored word stays
readable. Dark was left exactly as it was.

DONE TABLE
| Phase | Shipped | Proof (LIVE) |
|---|---|---|
| P1 Pulse | assets/bridge.css .ava-pulse system + class on CTAs sitewide | b18-prod-home-dark-390 (halo/ring visible), no overflow |
| P2 Viewport lock | box-sizing + hero stack + payoff halo + overflow-x:clip | prod scrollWidth===390, canPan=false ×4 pages ×2 engines |
| P3 Payoff glass | css/backstage.css .bs-payoff glass + gradient rim + keyword colors | b18-prod-payoff-dark-390 + b18-prod-payoff-light-390 |
| P4 Light polish | light payoff paper override + full light sweep | b18-prod-home-light-1440, payoff-light shot |

GATES (all met, on PRODUCTION)
- Dual-engine E2E ALL GREEN (Chromium + WebKit @390) — incl the theater-streams
  check that flaked on prod in 1.7; passed clean this time.
- Overflow gate: scrollWidth===390 & canPan=false on /, /roi, /book, /overview,
  both engines.
- LCP 552ms (home390) / 380ms (home1440) / 512ms (roi390) — all < 2.5s.
- CLS 0.007 / 0.00 / 0.018 — all < 0.1.
- Zero console errors on /, /roi, /book — both engines.
- Content FROZEN: index.html + /roi visible text byte-identical vs RUN 1.7
  (9b1e192); my index.html diff = 7 lines, all just +ava-pulse class.
- Grep guards clean: only 414-240-8930; no banned words; AVA never she/her.
- Pinch-zoom preserved (no user-scalable=no / maximum-scale added).

IDS / ROLLBACK
- Rollback tag: pre-run18-2026-07-15
- Source commit: 7e40048 · Stamp/cache commit: 151293e · Prod ?v=7e40048
- One-line rollback: git revert 151293e 7e40048 && git push
  (or: git reset --hard pre-run18-2026-07-15 && git push --force-with-lease)

WHAT'S NEXT
- Optional: dial pulse intensity up/down to taste (it's deliberately tasteful).
- The pre-existing maximum-scale=5.0 on the city/trade pages is WCAG-fine
  (allows 5× zoom); flag if you want it removed for consistency.

GOTCHAS
- The pulse is box-shadow only ON PURPOSE — that's what guarantees it can never
  reintroduce the side-slide (P2) or a layout jump (CLS). Keep any future glow
  on that same rail (no transform/border-scale rings).
- The homepage call bar is .bs-cb-tel (its own element); the OTHER 36 pages use
  the bridge .bcall. Both now pulse — .bcall via tools/stamp.py (re-run stamp
  after editing that template).
- Root-cause note: the whole 390 overflow traced back to .bs-cta being
  content-box (no global box-sizing:border-box on this page). Fixed on .bs-cta;
  if new full-width buttons overflow later, that's the first thing to check.

===== END READBACK =====
```
