# 2026-11-24 · ava-try-pdf-polish · re-entry 1 · DONE

```
DONE
WHAT: aivoiceagency.ai/try (six boxes, partner line, noindex) and the AVA sales PDF (Paper + Night) are live; 46 headline fixes + 1 layout fix are live; IndexNow sent for 42 pages.
LIVE: https://aivoiceagency.ai/try/ · https://aivoiceagency.ai/pdf/ai-voice-agency-overview-night.pdf · https://aivoiceagency.ai/pdf/ai-voice-agency-overview.pdf
MAIN: 7e33b06 (merge 2) on dcaa60c (merge 1); before the run 7da7bdc. Rollback one-liners in ROLLBACK.txt.
Written Tue Nov 24 2026 3:21 PM CT (Dell clock) · re-entry 1 (FIX-1) · open, out of this pass: POLISH.txt part C (788 word items, own run)
===== SHANE READBACK — COPY ALL =====
ava-try-pdf-polish · re-entry 1 (FIX-1) · Tue Nov 24 2026 · Claude Code on the Dell · Next owner: AVA MAIN

WHAT HAPPENED, IN PLAIN WORDS
- aivoiceagency.ai/try is live. It is the page for your emails tonight, with six big boxes:
  - Call the sample line
  - Book a Discovery Call
  - See the dashboard (it opens the sample dashboard page of the PDF)
  - Get the PDF
  - Visit the website
  - Email us
- Under the boxes is the partner line. Google won't list the page (noindex), so only people with the link see it.
- The AVA sales PDF is live in two looks: dark for phones and email, white for printing. It has 8 pages. Page 8 carries the partner line.
- The page 8 line "Call it from your phone and talk to AVA like a customer would." was retired by your 1:05 PM note. It went live for about 4 minutes, then came off. The heading and the number stay.
- 46 headline fixes and 1 layout fix are live on the site. Google and AI tools now read those headlines as real words. No word changed, and the screen looks the same.
- Bing and the other IndexNow engines got the 42 changed public pages.
- An independent checker passed the /try page, the PDF, the prices and the polish report. The only open item is the 788 old site word problems, which get their own run.

DONE TABLE
Item                            | Live URL                                                     | Proof
/try page                       | https://aivoiceagency.ai/try/                                | 200, noindex, six boxes, partner line, tap-to-call 414-240-8930, checked at 390/430/1440
AVA PDF, dark (phones, email)   | https://aivoiceagency.ai/pdf/ai-voice-agency-overview-night.pdf | 200, 8 pages, partner line, retired line gone, 0 banned words
AVA PDF, white (print)          | https://aivoiceagency.ai/pdf/ai-voice-agency-overview.pdf       | same checks
Sample dashboard page           | the dark PDF, page 6 (the See the dashboard box)             | page 6 reads Sample dashboard
46 headline fixes + 1 layout    | 43 live pages and 3 templates                                | live, pixel-identical, no run-together headlines left
IndexNow                        | 42 indexable changed pages (not /try)                        | 200 OK, submitted
/live                           | unchanged                                                    | same bytes as before

IDS AND ROLLBACK
- Live before: 7da7bdc.
- Live now: 7e33b06 (merge 2: page 8 line off) on top of dcaa60c (merge 1: /try, the PDFs, the partner line, the polish).
- Undo everything: git revert -m 1 --no-edit 7e33b06; git revert -m 1 --no-edit dcaa60c; git push origin main (the full line is in ROLLBACK.txt).

WHAT'S NEXT
1. Send the emails with https://aivoiceagency.ai/try/.
2. Your one check: open it on your phone and tap Call the sample line.
3. Its own run: the 788 site word problems (POLISH.txt part C). First up:
   - /book/, which still says "strategy call" and is the page the Book box opens
   - the Scope My Setup button
   - 911
   - the made-up dollar math

GOTCHAS
- /book/ (where Book a Discovery Call lands) still says "strategy call" and "20 Minutes" in its title. It needs your words ok in the word run.
- Taps on the /try boxes are not counted yet: js/tracking.js only reports the events it names. Page views are counted.
- The INBOX note came in during the publish step. My publish command printed it but did not stop on it, so the retired line went live for about 4 minutes. Fixed, and the second deploy is proved.
- The pages the polish touched still carry their old banned words (em dashes, scope, flat, 911) until the word run. The polish added none.
- The PDF's print source, /pdf/ava-overview.html, is public and noindex.
- PDF page 6 cuts one sample row short ("Price on a new wa..."). It is cosmetic, for a later touch.
```

