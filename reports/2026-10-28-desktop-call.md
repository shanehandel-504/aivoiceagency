```
===== SHANE READBACK — COPY ALL =====
DESKTOP-CALL v1 · Wed Oct 28 2026 · 21:41 CT · Claude Code (Opus 5.5) · both sites

PLAIN ENGLISH
- On a phone nothing changed: every call button on both sites still dials the line.
- On a desktop or laptop the same buttons now start the call in the browser. The line from
  WORDS appears under the button, the browser asks for the mic, the agent picks up, and the
  button reads "End call" with a timer (same size, same colour). End call, or 5:00, puts it
  back. A browser's 4th call in a day shows the fallback line and the number instead.
- The QR pop-up is gone from the aichauffeur.ai homepage.
- Three facts in the PASTE were not true on the wire: /try has been a tel: page since Oct 9;
  WF-TRY-WEBCALL was switched off and aimed at the old capture-desk agent; aivoiceagency.ai
  never had a QR pop-up. There was no DESKTOP-CALL board item; it is created now.
- DUPLICATED, not reused: the AIC call-start did not take an agent id. Both call-starts now
  read which agent and version answer the line from Retell at call time, and fetch that line's
  own start variables, so a browser call opens exactly like a phone call (AVA's greeting,
  setup-call times).

DONE
| # | item | what shipped | status | proof |
|---|------|--------------|--------|-------|
| 1 | wiring summary | PASTE\desktop-call-wiring-2026-10-28T2110-0500.txt, 10 lines, written before any change | paste ready | file on disk |
| 2 | n8n AVA web call-start | VDiBEwZ8FB28ME8b published 264920cd, webhook /webhook/5b8e2f0c71d94a36be0f1c8a92d47e53, 16 nodes, Sentry attached; staged first as ZZ copy bKy1bk7wwQ29Okcu (2 browser calls, then unpublished) | LIVE | Doppler ava-prod/prd AVA_WEBCALL_URL set and read back |
| 3 | n8n WF-TRY-WEBCALL | 9nKn8i2dRuALikuv published 40de931f: reads 0019's inbound agent at call time (agent_9ebb… v15), 5-min cap, receipt + email triggers OFF | LIVE | exec 17446 (challenge); try/email + try/receipt run nothing |
| 4 | aivoiceagency.ai | js/desktop-call.js on 69 pages (67 call-bar pages + home + /live), tools/stamp.py CALLBAR carries it | LIVE | 5ffa61d -> dpl_8zSP26cGKk6DQNUU1hTeroksKh7p READY; served hash acfce72d |
| 5 | aichauffeur.ai | assets/desktop-call.js on the 62 sticky-rail pages; homepage QR dialog + script removed; /go/ QR text moved to tools/go-qr-block.html | LIVE | 742522d -> dpl_5FnthMdzrvAdo5BxYov8R4YDLj11 READY; served hash ea8c7c36; stamp-go --check 0 of 16 stale |
| 6 | live desktop call, AVA homepage | call_f33edfad895a9ee8da271048091 · agent_d5ada… v53 · 21 s · 4/4 turns · greeting variables in | LIVE | AVA rail run 17462: owner alert text + email (no number spoken, no lead) |
| 7 | live desktop call, AIC homepage | call_be90bff036c6c4e79ff4263e5e9 · agent_9ebb… v15 · 21 s · 3/3 turns · slot variables in | LIVE | demo rail run 17468: trip sheet stored, sheet row, owner email + text |
| 8 | phones unchanged | iPhone profile on both prod homepages: tel tap not prevented, script builds nothing, no request | LIVE | dc-test phone: ALL PASS x2 |
| 9 | 5-minute cutoff | staging call_8943c8a5764344e109a63f4292e ended itself at 300.8 s (Retell 300 s) | proven | test_mode; AVA rail run 17454 quarantined it |
| 10 | 3-a-day guard | 4th press shows the fallback line + number, nothing reaches n8n | proven | prod cap case ALL PASS on both sites |
| 11 | fallbacks | mic refused and token failure both show the fallback line + number, label kept | proven | local cases ALL PASS on both sites |
| 12 | recordings | PASTE\desktop-call-proof-ava-2026-10-28T2128-0500.mp4 · PASTE\desktop-call-proof-aic-2026-10-28T2132-0500.mp4 (30 s each, page only, no caller data) | paste ready | files on disk |
| 13 | rollback JSON | PASTE\rollback\9nKn8i2dRuALikuv-2026-10-28T2130-0500.json (before) + 9nKn8i2dRuALikuv-AFTER-…, VDiBEwZ8FB28ME8b-…, bKy1bk7wwQ29Okcu-… | on disk | 4 files |
| 14 | Error Sentry | SlnAeMrVRORsF0w7 active, attached to all three call-starts; no rail touched | LIVE | n8n state read |
| 15 | copy | no title, meta, H1 or body copy changed; the two new lines live in desktop-call.js | LIVE | AVA diff 69 x +1 script line; AIC 61 x +1, home +1 -24 (QR) |
| 16 | render gate | 390x844 + 1440 on 8 pages: 0 overflow, 0 console errors; line contrast 16.33:1 AVA, 15.70:1 AIC | proven | dc-render ALL PASS |

LESSON: a brief's FACTS can be weeks stale. /try, WF-TRY-WEBCALL and the AVA "QR" were all different on the wire. Read the wire first, then build.

MINUTES WATCH (for the ops chat)
- every browser call ends by 5:00 (page timer + n8n cap) · 3 per browser per day · 40 per site
  per day and 3 per IP per hour (n8n) · steps aside at 10 of the 20 shared Retell slots
- tonight's test minutes: AVA 0:25 + 5:00 + 0:21 · AIC 0:25 + 0:21 (about 6.5 minutes)

ROLLBACK
- kill switch, no deploy: unpublish VDiBEwZ8FB28ME8b (AVA) / 9nKn8i2dRuALikuv (AIC). Every
  desktop press then shows the fallback line + number; phones are untouched.
- AVA site: promote dpl_7gpGNiCWqitqWuWYraYKC46NcwHr, or git revert 5ffa61d
- AIC site: promote dpl_DhN7FTsTSXzi3Zf6NGvewYNJtXxU, or git revert 742522d
- WF-TRY-WEBCALL as it was: unpublished, draft = rollback JSON (before)

NEXT
- Shane: three owner alerts tonight came from my test calls (AVA 1, AI Chauffeur 2). The
  caller audio said "this is a test call from Claude Code".
- Shane, if wanted: words for the 4th-call and token-failure case (today they show "Your
  browser blocked the mic", per WORDS, though the mic was not blocked).

GOTCHAS
- The fallback line also shows on a token failure and on the 4th call of the day, where the
  mic was not blocked. WORDS gave one line for all three; the words are Shane's to change.
- A touch-screen Windows laptop reports maxTouchPoints > 1, so it counts as a phone and keeps
  dialing tel:, per the detection line in the PASTE.
- A browser call carries no caller number. AVA files a lead only when the caller SAYS a number
  or an email; the owner alert still goes. The zz-test route keys on from_number and cannot
  catch a web call, so staging used metadata.test_mode (quarantined, no alert).
- AIC Google-ad visitors on desktop now reach the 0019 agent in the browser, not the tracking
  line. The call carries metadata.ad_channel, but the demo rail's Channel node reads to_number
  and files web calls as "other". aic-track.js counts the desktop press as call_tap (plus the
  AW conversion once the AW ids are filled in); on pages that still hold QR markup it labels
  the placement "qr".
- 36 AIC pages (incl. the 16 /go/ ad landers) still carry the QR markup ("delete nothing
  else"); the script keeps it shut and starts the browser call instead.
- stamp_chauffeur.py --check is RED on this Dell before and after this run: CRLF working copies
  of aic.css / aic.js / circulant.css hash differently from git. desktop-call.js is current.
  Do not run it without --check here.
- The pre-commit hooks refreshed 69 (AVA) + 45 (AIC) sitemap lastmods, so IndexNow will
  resubmit those URLs on its next run.
- The page's own 5:00 timer fired first in the cutoff test, so Retell logged user_hangup; the
  n8n cap (300000 ms) is the backstop for a tab whose timer does not run.
- Retell's client is retell-client-js-sdk@3.0.2 (RetellWebClient, a deprecated class that 4.0
  removes), pinned and fetched from jsdelivr only when a desktop visitor presses a call button.
  The PASTE allowed it "if the /try page already loads it"; /try is a tel: page today, and a
  browser call cannot join without it.
- The AIC homepage already says "Push it and talk to AI Chauffeur like a customer (about two
  minutes)" under the hero. Copy freeze: untouched.
```
