# 2026-10-01 — AVA HOMEPAGE · CONVERSION PAGE + FOUR RECORDED SAMPLE CALLS

```
===== SHANE READBACK — COPY ALL =====
MISSION: turn the aivoiceagency.ai homepage into a conversion page built around recorded sample calls.
STATUS: COMPLETE. Shane's go: Oct 1 2026, 3:08 PM CT ("approved everything, run it to post, commit").
LIVE: https://aivoiceagency.ai/ · board https://aivoiceagency.ai/hq/board.json
RAN IN: the cloud session of the AVA website chat (not the Dell). No Doppler, no API key, no phone agent.

WHAT CHANGED, IN PLAIN ENGLISH
1. New top of the page. Headline: "AVA answers your phone. Every call. Books the job." One sentence under
   it, a button that plays a sample call, and a button that dials AVA. Nothing else above the fold.
2. Four recorded sample calls: limousine, plumbing, heating and cooling, dental. Each plays with a job
   ticket that fills in on the real voice timing. The limousine call ends on "Sent to dispatch" with the
   dispatch wording. The other three end on "Booked".
3. Voices: Zara is AVA on all four. Four different men call: Chris (limousine), Mark (plumbing),
   Jarnathan (heating and cooling), Hale (dental). Recorded on Eleven v4 for 0 credits.
4. "Where the job goes": calendar, the customer's phone, the dashboard, the owner's software.
5. One price card: $497 a month base. Under it: limousine and black car companies run on AI Chauffeur,
   from $997 a month. CRM and scheduling software: "Book a call with the team and we scope your build."
   No per-minute rate, no CRM price, and the word "custom" is not on the page.
6. Left the homepage: the 3AM headline, the status rail, the 3AM strip, the 16-agent replay, the old
   three-clip player and the three-tier pricing. /lsa, /backstage and /watch are unchanged.
7. For AI search: all four transcripts are in the page HTML, four AudioObject entries with transcripts
   are in the page's structured data, and llms.txt carries the new pricing and the four audio links.

DONE TABLE
| What | Where | Proof |
|---|---|---|
| Homepage rebuilt | index.html | rendered at 390x844 and 1440x900: one h1, zero overflow, zero console errors |
| Player | css/calls.css, js/calls.js | play, pause, tab switch, scrub and end state driven in a headless browser |
| Audio (additive) | audio/samples/v2/ (4 x m4a + mp3) | 62 to 67 s each, about -16.5 LUFS, speech-to-text heard every line |
| Old homepage kept | legacy/index-3am-2026-10-01.html | byte copy of the page before this run |
| Rules file | CLAUDE.md § 5 and POLISH FREEZE | A1 and A2 marked off the homepage, un-freeze recorded |
| AI search file | llms.txt | pricing lines and sample-call links |
| Board | hq/board.json | item ava-homepage-sample-calls = live, one LOG entry |

ROLLBACK (one line): git revert the commit titled "AVA HOMEPAGE · conversion page + four recorded sample calls".
The old page is also at legacy/index-3am-2026-10-01.html.

GOTCHAS
- Words that were not on the approved price card: "Setup and call minutes are quoted on your call."
  The old page said "+ $497 setup + voice usage". The new card shows no setup number and no rate, so this
  line keeps the page honest without quoting either. Change it or give the setup number and it is one edit.
- Three calls have one sentence finished that the script cut off ("Best number to reach you?", "...this
  afternoon."). The caller still jumps in. The on-page transcript matches the recording word for word.
- On a phone the player plus ticket is about 1,000 px tall. The old 680 px component ceiling was written
  for the retired pod; the ticket is the point of the page, so it was not cut down to fit.
- The sample voice (Zara, ElevenLabs) is not the voice on the live 414-240-8930 line (Cartesia). The
  disclosure reads: "Sample calls: scripted scenarios, sample data, recorded voices. Not customer recordings."
- css/calls.css and js/calls.js carry a hand stamp (?v=s1001a). The next full tools/stamp.py run restamps them.
- sitemap.xml lastmod for / was not touched; the indexing tool derives it from git on its next run.
- tools/feed-verify.mjs, tools/run9-meta.py and tools/run9-claim-sweep.py still describe the old homepage.
- Chris is an ElevenLabs default voice due to retire Dec 31 2026. The finished recording is unaffected.
```

## REV B · same evening · Shane's phone test

```
===== SHANE READBACK — COPY ALL =====
MISSION: fix what Shane hit on his iPhone the first hour the page was live.
STATUS: COMPLETE. Live on https://aivoiceagency.ai/ and /book.

WHAT CHANGED
1. The page follows the call. Tap play and the transcript comes up under the menu; as the job ticket
   fills, the page eases down so the newest line stays on screen; at the end it stops on the result
   card. The moment the visitor scrolls, the page lets go.
2. The waveform no longer grabs a scroll. Swipe up or down over it and the page scrolls. A tap jumps
   to that point. A sideways drag scrubs.
3. The "page grows and floats" bug: the waveform canvas could feed its own pixel width back into the
   layout on big, sharp phones (seen once at 440 px wide, 3x), which widened the whole page and made
   Safari zoom. The canvas is now out of layout. The site-wide slide-in effect is also off on the
   homepage, so sections hold still while you scroll.
4. The transcript box scrolls itself again (it was stuck on the first two lines).
5. The four calls are boxed buttons (two by two on a phone), the picked one in cyan, with a label
   "Four sample calls · Pick one". Green stays reserved for "booked".
6. When a call ends, a "Next: the plumbing call →" button sits under the result card.
7. FAQ rewritten in plain words ("routes the call by your rules" is gone).
8. Price card line is now "Setup is quoted on your call." (call minutes no longer mentioned there).
9. iPhone no longer turns the sample phone numbers and addresses in the ticket into links.
10. /book has "← Back to the homepage" at the top.
11. The eight hub-page pills now say "1-MIN SAMPLE CALL · HEAR THE FULL CALL" and open the matching
    recorded call (plumbing pages → plumbing, medical → dental, transportation → limousine).

GOTCHAS
- Not fixed here, lives in GoHighLevel: the booking calendar description says "30 minutes" (law: 15),
  and the confirmation message is signed "- Shane" (law: caller-facing copy never names Shane).
- tools/stamp.py was NOT run in full: it would have rewritten 23 AI Chauffeur pages while another
  session works on that site. Pills were applied with its own inject_pill only.
```

---

## REV C — Oct 1 2026, evening (Shane's 6 PM asks)

```
===== SHANE READBACK — COPY ALL =====
MISSION: text + email at the end of every call, a live-transfer call, base price only, cleaner /book.
STATUS: COMPLETE. Live on https://aivoiceagency.ai/ and /book.

WHAT CHANGED
1. Every sample call now ends with AVA saying "I'm sending you a text and an email right now" and
   what the email has (trip details, visit details and company info, the new patient form). You hear
   a text ping and then an email chime.
2. New fifth call: Live transfer. Brightline Electric. A restaurant loses half its kitchen power on a
   Friday night. AVA checks it is safe, takes the details, gets the owner, briefs him, and the owner
   picks up. The ticket ends on "Connected to the owner · Mike on the line".
3. The player now rests READY: empty ticket, 0:00, "Waiting for the call". Press play and it fills.
4. When a call ends: "Want AVA answering your phone?" + Book the AVA strategy call + Next call.
5. Price card: Base price, $497 a month, "Full price in writing before you start." No setup line,
   no minutes line. AI Chauffeur from $997 a month stays under it.
6. FAQ cost answer matches. The urgent-call answer now points at the live transfer call.
7. /book: headline "Book the AVA strategy call", pill removed, the Book buttons that pointed at the
   page you are already on are hidden there.
8. Search/AI files (llms.txt, page data) list five calls and drop the old Google line.

DONE
| What                         | Live | Proof                                         |
| Five calls, audio v3         | yes  | /audio/samples/v3/*.m4a + .mp3, STT-checked   |
| Ready state + after-call CTA | yes  | rendered 375 / 390 / 440 / 1440, 0 errors     |
| Base-price-only card         | yes  | #pricing                                      |
| /book cleanup                | yes  | /book                                         |
Rollback: git revert the rev C commit (v2 audio is untouched and still on the server).

GOTCHAS
- The sample calls say "a text and an email", but AVA never asks the caller for an email. A sharp
  owner may ask how. The page's own claims stay to what ships today: a text to the customer, a text
  and an email to the owner. Fix if wanted: one email question per call, free re-record until Oct 12.
- GoHighLevel, not the repo: the calendar on /book still reads "AVA Demo Call" and "30 minutes",
  and the booking confirmation is signed "- Shane".
- tools/stamp.py still not run in full (it rewrites 23 AI Chauffeur pages).
```
