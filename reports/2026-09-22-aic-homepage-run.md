===== SHANE READBACK — COPY ALL =====

🔒 READ ONLY — Claude Code (Dell) run report, aichauffeur.ai HOMEPAGE RUN, 2026-09-22. Filed by the agent; do not edit.

[2026-09-22] — [CLAUDE CODE (DELL)] — [AIC HOMEPAGE RUN · five tasks, five commits, one deploy] — [🟢 COMPLETE]

WHAT I DID (plain English)
Five changes to the aichauffeur.ai homepage, all live. The "100 calls at once" claim is
gone and the page now says one call or a thousand, with capacity described as a setting
that grows with you. Every call button used to be a phone-dial link, which does nothing on
a computer, so computers now get a pop-up with a QR code they scan with their phone; phones
still just dial. The words "intake" and "desk" are out of everything an operator reads, and
the sample quote that read $78 for a hotel-to-airport sedan run now reads $145. The card
under "Play the call" described a completely different trip from the one that plays, so I
transcribed the recording and set every field from it. And 38 developer notes that anyone
could read in view-source are deleted.

DONE
| Task | Files | Commit | Verify | Live |
|---|---|---|---|---|
| A · one call or a thousand | chauffeur/index.html | efe4212 | 12 copy hits changed (3 the brief did not list: the proof stat, the concurrency FAQ, its JSON-LD twin). The three description tags are byte-identical. Production: "100 calls" = 0, new title serves | https://aichauffeur.ai/ |
| B · device split | chauffeur/index.html | 55c7bdb | Production gate ALL PASS. QR screenshot decodes to `tel:+14147750019`. Desktop UA: 7/7 tel: links open the dialog, hero note rewritten, beacon swapped to qr_open_hero, ESC closes. iPhone UA: all 7 hrefs intact, note unchanged, dialog never opens. Zero console errors, zero overflow at 390 | https://aichauffeur.ai/ |
| C · plain words, $145 | chauffeur/index.html | 390707e | grep: "intake"/"desk" survive only in comments and class names; `$78` = 0, `$145` renders. No clipped console cells at 1280 or 390 | https://aichauffeur.ai/ |
| D · card matches the call | chauffeur/index.html, docs/aic-demo-maxim-v2-transcript.md | 6629435 | Transcribed locally (faster-whisper base, en). Every field traced to a timestamped line; 15 unstated fields removed rather than guessed | https://aichauffeur.ai/ |
| E · strip dev comments | chauffeur/index.html | 2331ea9 | 38 comments removed, 75.7KB → 59.1KB, production serves 0 comments. Pre/post rendered in ONE browser run at 1280 and 390 with the device clock masked: pixel-identical at both | https://aichauffeur.ai/ |
| Ledger | hq/board.json, this report | (this commit) | 2 items added live, 2 older items marked superseded, 5 log entries | — |

FINDINGS (reported, not changed)
| # | Finding | What I found | Shane rules |
|---|---|---|---|
| F1 | Footer "Limo Anywhere" → /integrations/limo-anywhere/ | First two sentences: "Yes — AI Chauffeur works beside Limo Anywhere." / "It answers your line, takes the whole trip, and delivers a complete ticket to the person on dispatch, who confirms it in Limo Anywhere." DOES IT CLAIM AN INTEGRATION? Not a built, live one in the body — delivery is a ticket to a human, and write-back is described as configured per account before it is switched on. But the `<title>` reads "Limo Anywhere Integration", the meta says "Write-back configured per account", and the body says "AI Chauffeur can create quote requests and reservation records in supported dispatch systems". That is a named system plus a capability claim, sitting against the capture-only law the homepage states and the two FAQ pages that deny write-back | Keep, reword, or retire the page |
| F2 | Nav/footer link text "After-hours limo dispatch" | 3 on the homepage (nav, footer, drawer); 61 across 19 pages of the host. URL untouched either way | Wording call |
| F3 | Newsletter box | Needs an n8n webhook first. Not in this run | — |

IDS / ROLLBACK
- Commits: efe4212 · 55c7bdb · 390707e · 6629435 · 2331ea9, pushed as c1b1a55..2331ea9. Revert any one task alone with `git revert <sha>`.
- c1b1a55 (the commit mine sit on) is the other session's AI100X ledger, already on origin — not part of this run.
- Transcript + field map: docs/aic-demo-maxim-v2-transcript.md (.vercelignore'd, never served).

GOTCHAS
1. The brief's CSS instruction assumed a `<style>` block that no longer exists: RUN 13 moved this
   page's stylesheet into assets/aic.css. The QR CSS is a page-scoped `<style>` instead, so it
   ships atomically with the markup and needs no ?v= re-stamp. Editing aic.css would have meant
   re-stamping 26 registered pages to bust its cache token.
2. `.qr-dialog` needs `margin:auto`. aic.css:36 resets `*{margin:0}`, which zeroes the UA
   stylesheet's dialog centering, so the modal rendered pinned to the top-left corner until that
   one declaration was added. Measured, not guessed: computed margin read 0px.
3. A QR is only proven by decoding it. The card at its shipped size (216px) decodes; an upscaled
   copy of the same SVG did NOT. Test the size you ship.
4. This page renders the visitor's own clock ("It's 7:17 PM on a Tuesday"), so a naive before/after
   screenshot diff reports a false difference when the minute ticks between passes. The E proof
   re-shot both versions in one browser run with that line masked.
5. On a local static server the page logs one console 404 for /_vercel/insights/script.js, which
   exists only on Vercel. Production is genuinely zero-error. Do not chase it locally.
6. /try/ is in neither stamp.py list, so a stamp run would not have touched it — but nothing in
   this run needed one.
7. The recording says "the one on Brickle" at 17.08; that is the model's phonetic guess at a street
   name. The card says "Home address on file" instead. Confirm the spelling before any surface
   prints a street.
