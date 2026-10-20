# AIC words run v1.1 · 2026-10-20

Source: claude/PASTE-CC-AIC-WORDS-RUN-v1.1-2026-10-20.txt (Shane's OK: "CEO mode, you're good to go", Oct 20 2026, 4:52 PM CT).
Run from the cloud session on Opus 5.5, not the Dell. Backups of every changed file: infra/backups/2026-10-20/.

## Checkpoint A · words, prices, FAQ, AI search files

- 32 chauffeur pages: AI-sounding words out (trip ticket, capture, intake, configured, scoped, write-back, verification, your rules, hand off, lands in your texts, one call or a thousand, 18 vehicles, anywhere in the U.S., Spanish, connected and custom). The six lines in.
- Homepage H1: "Answers every call. Quotes your rates. Books the trip." Hero sub: two sentences. Price block: both plans + add-ons + the $99 line. FAQ: 12 questions (page + JSON-LD).
- /pricing/: two plan cards ($997 + $997 · $1,697 + $1,697), 13 FAQs word for word (talk time only in FAQ 6), two Offer nodes.
- /integrations/: every platform "Connected at setup", RideBits added, SantaCruz / LimoExpress spelling, Ground Alliance "Ask on the setup call", refund line, Last updated 20 October 2026.
- HubSpot and HighLevel are off this host (limo software only).
- /terms/: refund promise replaces non-refundable; both prices; booking frame.
- /rates/: no longer says the demo quotes from the card (the demo line books a sample trip and does not quote).
- New /compare/ page (in sitemap and every Product menu). Phone layout stacks the table.
- llms.txt rewritten (llms-verify --local: 123/123 verbatim, 33/33 links, GREEN). New llms-full.txt with all 25 FAQ answers.
- Buttons: Talk to AI (every tel: control) · Talk to a Human (every booking control) · /book/ "Pick a time for your discovery call."
- aivoiceagency.ai/ground-transportation: the AI Chauffeur price line and tier line only.

Rendered 390x844 + 1440 on /, /pricing/, /compare/, /integrations/, /works-with-your-software/: 0 overflow, 0 console errors.

## Checkpoint B · the text, the email, the trip page

- New text-card picture: chauffeur/assets/trip-text-card.jpg ("AI Chauffeur" / "Your trip is in." / "Trip sheet · recording · transcript" / "Right after every call · aichauffeur.ai", 42 KB). The September card stays in the repo as trip-text-card-2026-09.jpg.
- n8n trip-sheet workflow: new "Page Words v2" step (published). Every trip page, old and new: link preview "AI Chauffeur · Your trip is in.", header "Trip sheet", status "TRIP TAKEN · DEMO", empty 0-passenger and 0-bag rows dropped, the demo sentence and footer in the new words, "Talk to AI", the product block in the six lines with WITH YOUR CRM and ADD-ONS, the transcript as whole turns in left and right boxes, no amber. Verified: the live page matches the local test byte for byte.
- n8n post-call rail: new "Owner Words v2" step (published). The owner text opens with the status (CALL · no trip taken / TRIP TAKEN · DEMO / NEEDS DISPATCH · missing: … / BOOKED), then route and time, the facts, the caller, and "Trip sheet, recording, transcript: <link>". The owner text carries the card picture (MMS). The owner email: status line instead of EXCEPTIONS / REVIEW REQUIRED, "Trip sheet", "Call length", "Not taken on the call", "FOR DISPATCH", "Trip record", the new pitch, "Talk to AI", the card above THIS CALL, no amber. Fail-soft: if the step breaks, the old email still goes.
- The caller text on the demo line: "AI Chauffeur took your trip. This is what your dispatcher gets right after every call: the trip sheet, the recording and every word of it. <link>"
- The 0019 greeting and every phone agent are untouched.

## Checkpoint C · amber out, buttons, housekeeping

- Amber retired on this host (aic.css + circulant.css): ringing = sky, the Crush = midnight blue with blue hairlines, the "It's 5:28 PM" line = grey with a blue dot, the cost-of-the-miss numbers = miss red, the calculator link = sky. The --amber token stays defined with a "retired" comment.
- Gate: 7 pages × 390 and 1440, every element and ::before/::after: 0 computed rgb(255, 176, 32). 0 horizontal overflow. The only console error is the Vercel analytics script, which exists on the live host only.
- Asset versions re-stamped on 34 pages (tools/stamp_chauffeur.py).
- chauffeur/DESIGN-SYSTEM.md → Signal v1.7 (§ 12 round 5: amber retired, Talk to AI / Talk to a Human, the words, the prices, /compare/).
- CLAUDE.md PRICING block → the v3.1 prices (source claude/FACT-SHEET-v3.1-2026-10-20.md).
- hq/board.json: item aic-words-run-v1-1 (pending until the merge) + log line.

## Not done here

- GHL calendar rename to "Discovery Call": needs Doppler (Dell run).
- ZZ-sink test: skipped. The real test is the next call to the demo line.
- Words for Shane's OK: limo-answering-service row "One script for every company"; the airport buffer line; /book/ iframe titles still say "setup call scheduling calendar" (inside the GHL widget).

## Rollback

- Site: revert the merge commit on main (or Vercel: promote the deployment from commit 276ad15). Every changed file's prior copy: infra/backups/2026-10-20/.
- n8n: version history on the trip-sheet workflow and the post-call rail (prior versions 484c0a36 and c7bd86fd). Or delete "Page Words v2" and wire Build Page → Respond Page; wire Compose Owner Email → Email Ticket to Owner.
