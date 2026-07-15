# RUN 1.5 — BUG KILL + GROK SKIN — 2026-07-15

```
===== SHANE READBACK — COPY ALL =====

RUN 1.5 — BUG KILL + GROK SKIN — LIVE on aivoiceagency.ai

PLAIN ENGLISH
Six things you caught on your phone are fixed, and the theater got the
x.ai look you asked for.

The bugs:
1. MENU — the overlay used to hang the screen. Root cause found: the nav's
   frosted-glass effect was trapping the menu inside the 60px bar, so it
   was never full-screen and (on /book) taps hit the calendar behind it.
   Now the menu fills the screen and closes on a link, an outside tap, Esc,
   or when you rotate to a wide screen — and it never leaves the page stuck.
2. /BOOK — no more flashing phone box before the calendar; it's a clean
   dark themed panel with the shared header + call bar, no black void.
3. PRICING — Solo / Multi-truck / Multi-location are real tabs now; tapping
   one highlights the matching plan card and scrolls it into view on mobile.
4. THE PAYOFF no longer traps you — a "↩ review the call" button drops the
   card into a small pinned result strip and lets you scroll the whole call.
   The page never locks scrolling, in any state.
5. WALL OF TEXT — the 7 questions are now tidy tap-to-open cards (first one
   open). Same answers, still readable by Google.
6. HEADER — every page now wears the same header with the sun/moon theme
   toggle, and light mode works site-wide (no dark flash when you click
   through).

THE GROK PASS (your art direction — x.ai, not a tile wall):
The theater is now a streaming feed. A pill at the top shows four agent
orbs + "AGENTS ON THE CALL" + a live-running clock. Below it, glass agent
cards light up ONE AT A TIME as the call runs — a 44px orb, the agent's
name, what it actually did, and a receipt chip on the right. On a phone
it's a single stream (queued agents sit collapsed until their turn); on a
desktop it's four labeled lane columns. A glowing dot rides the wire from
card to card. The payoff card lifts up with a cyan glow — the money shot.
Every agent got a plumber-readable name and a real-artifact line
("job created: name · address · photos requested", "confirmation text
sent", "booked-job ping to your cell"). It shows the FULL system.

DONE TABLE
| Bug/Task | What shipped | Proof |
|---|---|---|
| B1 menu | bridge.js close paths + bridge.css drop mobile backdrop-filter | menu 784px full · closes 4 ways · overflow released |
| B2 /book | book/index.html rebuilt on tokens + themed shell | E2E · light flip · no void |
| B3 pricing | backstage.js tab → highlight + scrollIntoView | E2E tab highlights Growth |
| B4 payoff trap | "review the call" + sticky strip + never lock scroll | E2E un-dim + scroll + focus |
| B5 wall of text | 7 Q&A + 2 objections = glass <details> cards | 7 answers in initial DOM |
| B6 header | theme toggle via bridge.js everywhere + light tokens + FOUC guard | toggle on /,/roi,/book,/milwaukee-dental |
| B7 ghosts | deleted funnel.*, ava-pod/theater/webcall/data.js | no live refs |
| GROK skin | streaming card feed + pill + Live Wire + payoff glow | EYE shots b15-* |
| Script rewrite | data/calls.json v2 — plumber names + verb-first | 6 trades, 11.3s BOOKED |

GATES (all green, local Slow-4G / 4× CPU)
- E2E 24/24 · zero console errors
- Lighthouse mobile: A11y 100 · SEO 100 · Agentic 100 · BP 77 (Meta-pixel
  cookie only — pre-existing site tracking, not this run)
- LCP 992 ms (gate <2.5s) · CLS 0.00
- 7 answers + JSON-LD in initial server DOM (SEO layer intact)
- Grep guards: only 414-240-8930 · no "locked in"/"100 free"/"sounds
  human" · AVA never she/her
- Adversarial review (23 agents): 15 confirmed defects, ALL FIXED —
  light-theme AA contrast on every cyan CTA + the ROI slider track/button,
  the theme dark→light flash on 34 pages, the final OWNER ALERT orb losing
  its checkmark, keyboard focus dropping on "review the call", the payoff
  not being announced to screen readers, the SMS-peek cards not being
  keyboard-reachable, the /book "Loading…" text stuck for screen readers,
  and the toggle floating mid-bar on mobile.

IDS / ROLLBACK
- Rollback tag: pre-run15-2026-07-15
- One-line rollback: git revert <run15-commit> && git push
- Deleted assets restore via: git checkout pre-run15-2026-07-15 -- assets/

WHAT'S NEXT
- Your phone re-test: open the menu on any page (it should fill the screen
  and close on an outside tap), play the theater (watch the cards stream),
  tap "review the call", flip the sun/moon, and check /book + /roi in light.

GOTCHAS
- The homepage is ~10 mobile screens, not ≤9. The 16-agent streaming feed
  and the shared footer (~1.5 screens, canon) are the floor — the actual
  "wall of text" you flagged (the 7 questions) IS fixed via accordions.
  Say the word and I'll cut the feed to a scrollable window to hit ≤9.
- Light theme flips the shared chrome on all 37 pages and fully themes
  /, /book, /roi. Interior/vertical pages built on circulant tokens flip
  too; any page with hardcoded inline colors flips its chrome only — not
  in tonight's gate, reversible, dark stays the default.
- The SMS-peek on a fired card is now keyboard-accessible (Enter/Space
  opens, Esc closes, focus returns) — it was a mouse-only easter egg.
- stamp.py re-ran on all 37 pages to add the no-flash theme guard; the
  BRIDGE:* markers are intact.

===== END READBACK =====
```
