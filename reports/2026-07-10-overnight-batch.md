# OVERNIGHT BATCH — bug fixes + pulses + Voice A/B (2026-07-10)

```
===== SHANE READBACK — COPY ALL =====

THE STORY (plain English)
Nine things, all live. The big one: /book is no longer a dead end — it's a slim page with a
"← Back to AI Voice Agency" bar at the top and your GHL calendar filling the rest, and EVERY
"book" button on the site now opens it in the SAME tab (so the back bar is always the way out).
The bottom "Talk to AVA" button used to drop people on the pre-recorded demo — now it jumps
to the "Hear AVA call you" form, which is what people expect. Three visual bugs you screenshotted
are fixed: the little glowing dot up in the header no longer bleeds onto the white pricing cards;
the page stops cleanly at the footer instead of scrolling into black; and the seven transcript
cards now line up perfectly — every ▶ is the same size in the same spot. The ROI calculator's
slot-machine digits (that ghosted on your iPhone) are gone, replaced by a smooth count-up that's
crisp everywhere — same gold flip at $497, same "≈ N× the $497 plan." Your two pulse ideas are in:
the Growth pricing card breathes a soft cyan rim, and the four main buttons have a gentle green
breathing outline. The hero demo now plays its calls in a different order than the transcript list
so top and bottom feel different. And there's a new private page — aivoiceagency.ai/voice-ab — with
four versions of the same 20-second AVA call (A Closer, B Bold, C Warm, D Natural). Listen, then
text me the winning letter.

DONE TABLE (item → live → proof)
| # | Item | Live | Proof |
|---|------|------|-------|
| 1 | /book dead-end → slim back-bar + full-height GHL calendar; ALL CTAs → /book same tab | ✅ | /book screenshot (back bar + calendar renders); 6 CTAs href=/book, 0 target=_blank |
| 2 | Sticky "Talk to AVA" jumps to the Hear-AVA-call-you form (not the demo pod) | ✅ | sticky btn has data-open-gate, not data-scroll-pod |
| 3 | Orb bleed: nav glow contained, never over white pricing cards | ✅ | .nav overflow:hidden+isolation; screenshot: clean white card under nav |
| 4 | Overscroll void stopped at the footer | ✅ | overscroll-behavior-y:none + html bg void; DOM can't scroll past footer |
| 5 | Transcript ▶ / + normalized — all 7 cards identical | ✅ | measured: every card 76px, ▶ 56px at +10px; screenshot uniform |
| 6 | ROI odometer → smooth rAF count-up (crisp iOS/Safari), same gold flip | ✅ | $8 cyan below \$497, $108,000 gold + "≈ 217× the \$497 plan"; safety-net timeout |
| 7 | Pulses: Growth cyan breathing rim + green outline on 4 unlit CTAs (staggered) | ✅ | computed anim tier-rim-cyan + 4× cta-rim-green (delays 0/1/2/2.6s); reduced-motion off |
| 8 | Demo variety: pod order ≠ transcript order | ✅ | pod [medspa,corporate-car,plumbing,hvac] vs transcripts [HVAC…Med-Spa] |
| 9 | Voice A/B court: 4 eleven_v3 renders + noindex chooser | ✅ | /voice-ab noindex+nofollow, 4× 56px A-D; /audio/ab/profile-a..d.mp3 → 200 audio/mpeg |

PRODUCTION MEASUREMENTS (aivoiceagency.ai, mobile)
- Lighthouse mobile: Accessibility 100 · Best Practices 100 · SEO 100 · 0 failed audits
- CLS: 0.00  ·  LCP: ~450–495 ms (trace sample 494 ms; varies, within band — a11y+CLS are the gates)
- Console errors: 0  ·  greps clean on the diff (no she/her, no 305/480/786, no free-minutes, no frameworks)

COMMITS + ROLLBACK
- items 1-8  938cc52  → rollback: git revert --no-edit 938cc52 && git push
- item 9     68bf225  → rollback: git revert --no-edit 68bf225 && git push  (additive; safe)
  (Items 1-8 share index.html/funnel.css/funnel.js, so they landed as one documented commit —
   per-item hunk-splitting wasn't possible without interactive staging.)

VOICE A/B PROFILES (voice gJx1vCzNCD1EQHT212Ls, model eleven_v3, ~20s HVAC opening)
- A Closer   stability .78 · style 0    · speed 1.07     (profile-a.mp3, 408 KB)
- B Bold     stability .80 · sim .85 · style .70          (profile-b.mp3, 384 KB)
- C Warm     stability .85 · sim .90 · style .35 · speed .97 (profile-c.mp3, 399 KB)
- D Natural  stability .85 · sim .90 · style .45 · speed .98 (profile-d.mp3, 407 KB)

WHAT'S NEXT
- Voice A/B: listen at aivoiceagency.ai/voice-ab and text me the winning letter. The winner
  re-render + swapping the LIVE demo audio is a separate, founder-gated mission (untouched here).
- Homepage stays FROZEN — items 1-6 were freeze-legal bug fixes; 7-8 founder-directed; 9 additive.
- The dormant web-call slot under the Answer button still wakes automatically when data-webcall="on".

GOTCHAS
- ROI count-up is rAF-driven with a setTimeout safety net, so it always settles even if the browser
  throttles animation frames (background/headless tabs). Real foreground users see the smooth count.
- Transcript problem chips were shortened (e.g. "Water-heater leak" → "Heater leak") so the row stays
  single-line and every card is identical; a long chip would ellipsis-shrink rather than wrap.
- eleven_v3 rendered all four profiles cleanly (no fallback needed). Do NOT swap any live demo audio
  until you pick a winner — the A/B files are brand-new, additive only.
- /voice-ab is noindex+nofollow and out of the sitemap (public URL, not crawled). /book stays indexable.
  This report lives in /reports (git-committed, .vercelignore'd — not served publicly).
- A concurrent session's retell/drip commits are interleaved in git history; they touch different files.

HOW COULD THIS PROMPT BE BETTER
- One line I had to infer: what "📥 RUN REPORTS INBOX" is (Notion? Drive? the /reports folder?).
  I filed to /reports/. If it's an external inbox, give me the Notion DB id / Drive folder id once.
- The A/B descriptors (Closer/Bold/Warm/Natural) were my call — if you have preferred one-word labels
  or the exact ~20s line you want spoken, drop them in and I'll re-render in place.
- "commit per item" collides with shared-file edits + the 5-push/hr cap; say "one batch commit is fine"
  (or "hunk-split where clean") to remove the ambiguity.

PRODUCTION URL
https://aivoiceagency.ai/   ·   booking: https://aivoiceagency.ai/book   ·   A/B: https://aivoiceagency.ai/voice-ab

===== END SHANE READBACK =====
```
