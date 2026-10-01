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
