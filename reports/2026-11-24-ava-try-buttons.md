# 2026-11-24 · ava-try-buttons · DONE

===== SHANE READBACK — COPY ALL =====
WHAT CHANGED (plain English)
aivoiceagency.ai/try now looks like the AI Chauffeur /try, in AVA's cyan. The call button is still the big bright bar. It now has a phone square on its left and a soft ring that pulses every few seconds. Right under it is your approved demo line. The other five boxes now all look the same: an icon square on the left, the words, and a small arrow on the right that slides when you hover or tap. A box shrinks a touch when pressed. No other words on the page changed.

DONE TABLE
| Line | What | Live | Proof |
| D1 | Read AI Chauffeur /try first | yes | aic\ screenshots at 390 and 1440 |
| D2 | Call bar: solid #00D4FF, full width, phone tile, slow ring | yes | ring off with reduced motion; still tel:+14142408930 |
| D3 | Demo note under the call bar, exact words | yes | 15px, 9.09:1 contrast |
| D4 | Five boxes, one style, icon tiles, chevron, press | yes | same border, fill, padding at every width; chevron 4px; press 0.98; iPhone tap too |
| D5 | Sizes at 390, 430, 1440 | yes | boxes 60px+ phone, 64px+ desktop; no sideways scroll; layout shift 0; Lighthouse accessibility 100 before, 100 after |
| D6 | Word and banned-word grep | yes | only the note added; 0 Partner Network, Anthropic, gold, amber, em dash |
| D7 | Production proof | yes | /try 200, noindex kept, all 6 box links work, live shots in after-live\ |
Gates 37/37 on local, preview and live. Fresh self-check sub-agent: ALL PASS.

IDS AND ROLLBACK
main before: cac02b9 · branch commits: 5c76a30 (boxes), b891306 (iPhone tap) · merge on main: 1223bff (live 5:08 PM)
Rollback: git checkout main && git pull && git revert --no-edit -m 1 1223bff && git push origin main
Slack: DONE line posted in #all-ai-voice-agency.

WHAT'S NEXT
Nothing open from this run. Still open from earlier runs: the 788 word items, and /book/ still says "strategy call".

GOTCHAS
1. The self-check caught that iPhone Safari does not show the press on a tap unless the page listens for touch. One empty listener fixed it, in its own commit (b891306).
2. The call bar's hover tint #5CE3FF was already live before this run. It was kept.
3. On a 390 phone the demo note ends on a short last line, "in it." The words are exact, so it stays.
4. js/tracking.js still does not report the /try box clicks (known from the last run).
