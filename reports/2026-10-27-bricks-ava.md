```
===== SHANE READBACK — COPY ALL =====
BRICKS AVA · 2026-10-27 · 🟢 COMPLETE

WHAT HAPPENED (plain English)
Three new answer pages are live on aivoiceagency.ai. Each one answers a
question an owner might type into Google or ChatGPT:
  - Does it know my rates?
  - How do I get the recording of a call?
  - Can it take more than one call at a time?
Your words went on the pages exactly as written. The press checked them
against the word rules, laid them into the /pricing page's layout, and added
each page to the sitemap, llms.txt and the /answers list (now 10 answers).
The push went live, and the deploy hook told IndexNow (Bing and others) about
the new pages on its own.

DONE
slug                                       | host             | 200 | schema ok    | sitemap | llms.txt | IndexNow
does-ava-know-my-rates                     | aivoiceagency.ai | yes | yes, 0 errors | yes     | yes      | 200
how-do-i-get-the-recording-of-an-ava-call  | aivoiceagency.ai | yes | yes, 0 errors | yes     | yes      | 200
can-ava-take-more-than-one-call-at-a-time  | aivoiceagency.ai | yes | yes, 0 errors | yes     | yes      | 200
answers/ (the list page, 10 entries)       | aivoiceagency.ai | yes | yes, 0 errors | yes     | n/a      | 200

PROOF
- Press: dry run 3/3 PASS, build 3/3 PASS (354 · 354 · 369 words)
- tools/validate_jsonld.py: 72 pages, 0 errors (local) · the 4 live pages, 0 errors each
- llms.txt verifier --live: GREEN · 143/143 lines word for word · 47/47 links 200
- Render: Chromium 390x844 + 1440x900, WebKit 390x844 = 9/9 PASS. One H1.
  Answer sentence above the fold (ends at 314-372px on a phone). 0 sideways
  scroll. 0 console errors. Body text 10.68:1. Button 52px tall, square corners.
- Live check: every URL 200 with its H1 on aivoiceagency.ai
- IndexNow: n8n run 17037 (deploy hook) -> aivoiceagency.ai 200 (72 URLs,
  all 3 new ones in it) · aichauffeur.ai 200 (41 URLs)
- Board: hq/board.json LOG entry at 2026-10-27T11:52:13-05:00

IDS / ROLLBACK
- Commit 50fabfa "answers: 3 bricks 2026-10-27" -> dpl_CdFns7MV1aft1k6NxwsWVTUywbUh READY
- Rollback: Vercel instant rollback to dpl_68s7m6C5q6nJmDvB2ZyJkxqojbe4 (febd13d),
  or: git revert 50fabfa && git push
- Brick files: bricks/built/ava/ (the inbox is empty again)
- Report: reports/2026-10-27-bricks-ava.md

NEXT
- Nothing is waiting on this run. New bricks go in bricks/inbox/ava/ the same way.

GOTCHAS
- The Retell account takes 20 calls at the same time, shared across every
  line on it. Burst is off (read from get-concurrency today). Page 3's "no
  caller hears a busy signal" holds while fewer than 21 calls are live at
  once. More room can be bought (up to 180 more).
- Git Bash ignores TZ=America/Chicago and prints UTC. The board stamp first
  read 16:52; it was fixed to 11:52 before the commit.
- The pre-commit hook moved 4 sitemap dates to the commit time (11:52:38).
  That is expected.
- On Windows the llms verifier prints a libuv "Assertion failed" line after
  GREEN. It is harmless and known.
```
