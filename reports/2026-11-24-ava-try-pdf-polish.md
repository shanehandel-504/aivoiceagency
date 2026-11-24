# 2026-11-24 · ava-try-pdf-polish · pass 1 · RUN INCOMPLETE

```
RUN INCOMPLETE
WHAT: /try and the AVA sales PDF (Paper + Night) are built, checked and on the preview only; 46 headline fixes + 1 layout fix sit on branch ava-try-pdf-polish; nothing is live (main untouched at 7da7bdc).
WHY: the self-check missed D7 twice (10 pages, then /pitch; both fixed on the branch after) and the run file says a second miss stops with live untouched. Every new word also waits for Shane's words ok.
NEXT: Shane answers NEEDS-SHANE.txt (words ok, the dashboard box, publish polish). The next pass starts at step 7 (fresh self-check on the branch), then 9 publish, 10 prove, 11 close.
Written Tue Nov 24 2026 2:54 PM CT (Dell clock) · preview https://aivoiceagency-git-ava-try-pdf-polish-shanehandel-504s-projects.vercel.app/try/
===== SHANE READBACK — COPY ALL =====
ava-try-pdf-polish · pass 1 · Tue Nov 24 2026 · Claude Code on the Dell · Next owner: AVA MAIN

WHAT HAPPENED, IN PLAIN WORDS
- The new /try page is built, with six big boxes:
  - Call the sample line
  - Book a Discovery Call
  - See the dashboard (hidden until you choose)
  - Get the PDF
  - Visit the website
  - Email us
- The AVA sales PDF is built in two looks: white for printing, dark for phones and email. It has 8 pages on the AI Chauffeur layout, with the recorded plumbing call as the example.
- Both are on a preview link only. Every word on them waits for your "words ok".
- I read all 107 pages of the website at phone size and desktop size. I fixed headlines that Google and AI tools read as one run-together word (on 43 pages and 3 templates) and one page that slid sideways on a phone. No word changed, and the screen looks the same.
- Those fixes are NOT live. My own checker missed a page twice, and the run rules say to stop and leave the live site alone when that happens. Both misses are now fixed on the branch.
- I listed 788 word problems on 79 live pages, each with a fix for you to approve: Scope My Setup, scope, flat, API, em dashes and made-up dollar math. None are placed.

DONE TABLE
Item                       | Where                                            | Live? | Proof
/try page                  | preview link below, /try/                        | no    | D1 and D2 pass (independent check, 2 runs)
AVA PDF, white (print)     | preview /pdf/ai-voice-agency-overview.pdf        | no    | 8 pages, fonts, links, QR codes, 0 banned words
AVA PDF, dark (screens)    | preview /pdf/ai-voice-agency-overview-night.pdf  | no    | same checks
Words for your ok          | WORDS-FOR-OK-v1.txt in the run folder            | n/a   | 2 ChatGPT passes + Claude's fact check
Headline and layout fixes  | branch ava-try-pdf-polish                        | no    | pixel-identical to the live site
Word problems list         | POLISH.txt, part C                               | n/a   | 788 items, none placed
Preview: https://aivoiceagency-git-ava-try-pdf-polish-shanehandel-504s-projects.vercel.app/try/

IDS AND ROLLBACK
- main is untouched at 7da7bdc. Nothing went live, so there is nothing to roll back.
- Branch ava-try-pdf-polish:
  - headline fixes: 9f6f6af, b9d7a57, 24e8266
  - /try and the PDF: 55bda1f, 3e4243b, d6ae1b8
  - then this report
- When the fixes go live, ROLLBACK.txt gets its one-line git revert before the push.

WHAT'S NEXT
1. Read WORDS-FOR-OK-v1.txt. Reply "words ok", or name the lines to change.
2. The dashboard box. Pick one:
   - keep it hidden
   - show it and open the PDF's dashboard page (recommended)
   - build a dashboard demo page later
3. Say "publish polish" to send the headline fixes live now, or keep them for the word-fix run.
4. Then one re-entry pass:
   - the checker runs again on the branch
   - the work goes live
   - it is proved on aivoiceagency.ai
   - Bing gets the IndexNow ping

GOTCHAS
- The emails can't use aivoiceagency.ai/try until it goes live. The preview link works today, but it is a vercel.app address.
- The polish pages keep their old banned words (665 hits) until you OK the word fixes. The run's own changes added none.
- Taps on the /try boxes are not counted yet: js/tracking.js only reports the events it names. Page views are counted.
- The PDF's print source, /pdf/ava-overview.html, is a public page marked noindex. It can stay, or be hidden in a later run.
- The Dell has no poppler, so the PDF checks use PyMuPDF.
- The IndexNow script exits with code 9 after a PASS (a Node 24 quirk on Windows). Trust its SUMMARY line.
```

