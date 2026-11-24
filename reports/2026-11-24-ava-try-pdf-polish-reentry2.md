# 2026-11-24 · ava-try-pdf-polish · re-entry 2 · DONE

```
DONE
WHAT: the partner line is off /try and both PDFs (FIX-2); nothing in its place, no other word changed; "Partner Network" and "Anthropic" appear nowhere on /try or in either PDF.
LIVE: https://aivoiceagency.ai/try/ · https://aivoiceagency.ai/pdf/ai-voice-agency-overview-night.pdf · https://aivoiceagency.ai/pdf/ai-voice-agency-overview.pdf
MAIN: 96324c0 (merge 3) on 79a040e; rollback in ROLLBACK.txt. Self-check 4 on 682bd43: D1-D7 pass, (a) and (b) pass, no fixes.
Written Tue Nov 24 2026 4:34 PM CT (Dell clock) · re-entry 2 (FIX-2) · open, out of scope: POLISH.txt part C (788 word items, own run)
===== SHANE READBACK — COPY ALL =====
ava-try-pdf-polish · re-entry 2 (FIX-2) · Tue Nov 24 2026 · Claude Code on the Dell · Next owner: AVA MAIN

WHAT HAPPENED, IN PLAIN WORDS
- The partner line is off the live site: "We're a member of Anthropic's Claude Partner Network. We use Claude to build and run every setup we make."
  - It came off the /try page and both PDFs.
  - The partner rules don't allow that claim at your tier (Registered). Status wording starts at Certified.
- Nothing went in its place, and no other word changed. An independent checker compared before and after: that line was the only change a reader sees.
- /try still has its six boxes, and they all work. Tap-to-call 414-240-8930 is in place.
- The words "Partner Network" and "Anthropic" now appear nowhere on /try or in either PDF: not in the text, the PDF details or the page source.

DONE TABLE
Item                     | Live URL                                                        | Proof
/try page                | https://aivoiceagency.ai/try/                                   | 200, six boxes, tap-to-call, 0 partner words, checked at 390/430/1440
AVA PDF, dark            | https://aivoiceagency.ai/pdf/ai-voice-agency-overview-night.pdf | 200, 8 pages, 0 partner words, same file as the checked build
AVA PDF, white           | https://aivoiceagency.ai/pdf/ai-voice-agency-overview.pdf       | same checks
The rest of the site     | the headline fixes and /live                                    | unchanged by this pass

IDS AND ROLLBACK
- Live before this pass: 79a040e.
- Live now: 96324c0 (merge 3: the partner line removed).
- Undoing merge 3 would put the line back, so don't.
- The full undo for the whole run is in ROLLBACK.txt.

WHAT'S NEXT
1. Send the emails with https://aivoiceagency.ai/try/.
2. Your one check: open it on your phone and tap Call the sample line.
3. When your tier reaches Certified, a partner line can come back with your words ok.
4. Its own run: the 788 site word problems, starting with /book/ ("strategy call").

GOTCHAS
- No IndexNow this pass: /try is noindex and the PDFs are not sitemap pages, so no indexable page changed.
- /book/, where the Book box lands, still says "strategy call". That is for the word run.
- Taps on the /try boxes are not counted yet (js/tracking.js only reports the events it names).
```

