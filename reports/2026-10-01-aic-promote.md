# 2026-10-01 — AI CHAUFFEUR · PROMOTE THE TWO-DOOR BUILD TO LIVE 414-775-0019 (paste 34 v1.2)

```
===== SHANE READBACK — COPY ALL =====
MISSION: Put the two-door build on the live AI Chauffeur line 414-775-0019. Paste 34 v1.2, Oct 1 2026.
STATUS: COMPLETE. The two-door agent answers 414-775-0019 since 5:38 PM Central. The secret is rotated and the
        old value is gone from n8n. Two things could not be proven on a web call, and both are listed below:
        your cell ringing with press 1 (Retell can only transfer a phone call), and the caller's own text (our
        own test number sends that copy to a test contact that has no phone on file).
LIVE: 414-775-0019 → "AIC-LIVE two-door" v11 · board https://aivoiceagency.ai/hq/board.json
GATE: the whole set of 49 on v9 before the switch: 48 of 49 strict (the one miss is the scorer's), Retell 48 of 49,
      all five safety checks pass. Greeting byte-identical to Sep 30.

WHAT I DID, IN PLAIN ENGLISH
1. Checked the live line first: the agent answering 0019 was still exactly the Sep 30 snapshot. The newest
   published test version was v9, with no newer draft.
2. Ran all 49 test cases on v9. 48 passed. The one fail is my checker's: the agent said "The team isn't taking
   vendor calls" and the checker only looks for "not taking". All five safety checks passed.
3. Compared the greeting the live line says today with the greeting the new build says. Byte for byte the same.
4. Picked path A (point the number at the two-door agent). The two-door agent already sends its after-call
   reports to the same n8n rail as the live desk, the rail already treats it as the same desk, and both booking
   lists already accept it. So nothing in n8n had to change, and the old desk stayed untouched as the rollback.
5. Renamed the agent "AIC-LIVE two-door". Retell won't rename a published version, so that is v10: v9 with the
   new name and nothing else, checked field by field. Then pointed 0019 at it, at 5:38 PM Central.
6. Made real test calls on the live build from the computer (not your cell): a demo trip, two setup calls with
   real bookings (then cancelled), and a "can I talk to somebody right now" call.
7. Gave the test number ending 8976 back to the AVA sales test agent.
8. Rotated the booking secret that was on screen Sep 30. For 60 minutes n8n accepted both old and new, every
   agent that answers a number got the new one, one real booking went through on the new value, and then the
   old value was deleted from n8n.
9. Read the live line back, wrote the snapshot, committed, pushed, checked the deploy, filed this to Notion.

DONE
| Item | Result | Proof |
|---|---|---|
| Pre-flight battery (v9, the whole set) | strict 48/49 · Retell 48/49 · every safety case passes: yes | batch test_batch_c7f0245bae60 · battery file § 13 · the miss: l-vendor (scorer wording, not the agent) · Retell's one fail: C10 · safety: C25 + n (unverified caller ends the call), 0 price-above-base on 49 runs + C13 + g + o, C22 + f (never same day), 0 "booked" without the calendar + f2, C19 (recording line said once) |
| Greeting equality | yes | live v4 and the new build: the same 274 characters, SHA-256 6d9d1162bb841a01… (also the browser greeting, 246 characters) · re-checked on v11 |
| Path chosen + reason | A · REBIND | the two-door agent's webhook is already the live post-call rail (v6–v9), the rail's desk list and tenant map already hold it, and both allow-lists in the booking workflow already hold it, so path A needed 0 n8n changes and 0 writes to the live desk (the desk's one new version, v5, came later from the secret rotation in step 7: header only). Path B would have meant copying 221 nodes into the live flow, and its publish would also have moved the line ending 5008 and the site's Try button (all three follow the desk's newest version) |
| One-action rollback | PATCH https://api.retellai.com/update-phone-number/%2B14147750019 with {"inbound_agents":[{"agent_id":"agent_e41b2e957f1de46cf23dc25a84","agent_version":"latest_published","weight":1}]} | that is the Sep 30 record of the number · by hand: Retell → Phone Numbers → +1 (414) 775-0019 → Inbound agent "AI CHAUFFEUR — CAPTURE DESK" (latest published) → Save · proven read-only before the switch: the desk's newest published version was v4, nothing newer (today it is v5 = v4 with the rotated header, the same calls word for word) · written down before the switch |
| Switch time | 5:38:40 PM Central (22:38:40Z) | 0019 inbound → agent_9ebb41c9bd8af214649328f107 v10, pinned · outbound left on the desk (nothing calls out from 0019) · re-pinned to v11 at 6:11 PM for the secret rotation |
| Acceptance call a (demo trip) | trip sheet text: yes · email: yes · recording: yes · ZZ sink empty: yes · the caller's own text: no | call_07e644078815be94789cf874b3e (94 s): trip, name, read-back, "comes by text after the call", goodbye · n8n: owner text and owner email (the trip sheet) sent, trip page stored · the caller's text ran but GHL refused it (422 "Missing phone number"): the caller number was our own test line, so the rail sends that copy to the ZZ test contact, and that contact has no phone. The same would happen on the old desk |
| Acceptance call b (setup call) | today line heard: yes on the second call (no on the first) · booking made: yes · cancelled in both places: yes | call_b58f65ab482e67d7f89f1a5d0cc: "Yes. Can I do it today?" → the booking step took over without the today line · call_f91419eb6468e2d6c746220e959: "Do you have anything today at four?" → "Nothing's open today. The next open times are Friday October second at one PM Central and Saturday October third at one PM Central — which works?" word for word → booked Fri 1 PM through the live calendar · both bookings: Cal.com cancelled, the GHL copy set to cancelled (not deleted) |
| Acceptance call c (live connect) | hold pitch played: no · briefing spoke name + company: no · press 1 bridged: no · callback path + owner alert fired: yes · dead air: none | call_296294ebe90f3660ab6595ca8e1 (100 s) after the 60-second heads-up: the whole path ran (name, company spelled, number, topic, how did you hear, the connect offer, "No, just connect me", "I'm connecting you with the team now…"). Retell answered the transfer with "Cannot perform transfer call in web call", so nothing rang. 0.5 s later: "The team isn't available right now. They'll call you back within a couple of hours, and they have your details." · team alert: owner text + owner email sent during the call · the press-1 path is proven on your next real call (see WHAT'S NEXT) |
| 8976 → AVA test agent | yes · latest published = v8 (v7 at the rebind, v8 after the secret rotation, header only) | before: AIC-TEST-2 @ latest published · after: agent_44b48507d38c0bfc29a3150a74 @ latest published · outbound untouched |
| SALES_CAL_SECRET rotated | yes · old dropped: yes, at 7:10 PM Central (00:10:01Z) | new value in Doppler ava-prod/prd and in n8n, never printed · both booking workflows accepted old + new for 60 minutes (a second n8n variable), staged first on inactive copies (20 of 20 checks), Error Sentry attached · header-only new versions on the three agents that answer a number (two-door v11, old desk v5, AVA test v8), each checked field by field · one booking round trip on the new value via the ZZ sink: call_86d4db675f585a480417d242790, booked, cancelled · checked live right after the drop, on both booking workflows: the old value is refused (401), the new value answers (200), no header is refused (401) · end-state check 24 of 24 |
| Live read-back | agent "AIC-LIVE two-door" · v11, pinned · dead air 2 prompts (10 s, then 20 s to hang up) · KB "AIC-FACTS-v1.1" on the two answering nodes · calendar "AI Chauffeur Setup Call hours" Mon–Sun 1–6 PM Central, six holidays closed | greeting the same 274 characters · transfer target = Doppler AIC_TRANSFER_NUMBER_ (the build's rule: AIC_TRANSFER_NUMBER, else AIC_TRANSFER_NUMBER_), equal to what the flow dials · booking headers = the new Doppler value · after-call reports to the live rail |
| Snapshot written | ops/tuning/0019-two-door-live-snapshot-2026-10-01.md | same format as Sep 30, prompts verbatim, header values, transfer number and webhook paths withheld · secret sweep clean (9 of 9 planted values caught) |
| Commits and deploy | dc396eb pushed to main at 7:11 PM Central, live in about 36 seconds · this report is the commit after it | the live board equals the commit byte for byte (70 items, 129 log lines) · the snapshot, the build doc, the battery file and this report return 404 on the site · aivoiceagency.ai, aichauffeur.ai and its Try page answer 200 |
| Notion | report https://app.notion.com/p/3ed581219cb28137a2ddce5ceb31ef0b · L5 wrap https://app.notion.com/p/3ed581219cb281f299a8fb503642aa33 | both read back |
| Leftovers for the next paste | Grok 37 items (below) · the transfer's voice-accept words + the bridge condition | below |
| Rollback | the one action above, plus the n8n and version notes below | nothing was deleted except the old secret's n8n variable (the paste's step 7) |

GROK 37 ITEMS (words only; nothing was changed for any of them)
1. Unverified caller, third push (text D): "I can't do that. A I chauffeur dot A I." on the battery run, no goodbye
   (v9: goodbye missing 2 of 5). It has to be one polite goodbye and nothing else.
2. "## PRICE", second bullet (text E): "Anything above the base is sized to the company, with one price after the
   setup call." is still never spoken as written.
3. New: a caller who asks for today inside the yes ("Yes. Can I do it today?") goes straight into the booking
   step and never hears "Nothing's open today". The times offered are right (never today); the line is missing.
4. Seen on v9: 2 of 10 "try to connect" answers add a callback sentence ending "during business hours".
5. The transfer's voice-accept, for your ruling "say connect first, press 1 as the fallback": the three places
   that need Grok's words are the last sentence of the briefing line ("Press 1 to take the call."), the briefing
   agent's standing instruction ("Only a keypad press of the digit 1 accepts the call. Spoken words never accept
   it."), and its re-prompt ("Press 1 to take the call."). The setting that goes with them is the condition on
   the briefing agent's bridge step. Also to rule on: the briefing agent cannot be talked over today, so a
   spoken word is heard only after its line ends.

IDS, COMMITS, ROLLBACK
- 0019 → "AIC-LIVE two-door" agent_9ebb41c9bd8af214649328f107 v11 (pinned). v10 = v9 renamed. v11 = v10 with the new
  booking header. v9 is the battery-tested build. Nothing deleted: versions 0 to 11 all there.
- Undo the promote (one action): the PATCH above, or the dashboard click. The old desk answers at once.
  Its newest published version is v5 = v4 with the new booking header and nothing else, so it speaks exactly
  as on Sep 30. v4 itself was never written.
- Do NOT pin 0019 back to v10 or any older two-door version: those carry the retired booking header, so booking
  and the team alert would fail. To bring back older words, publish a copy with the current header.
- n8n: WF-AIC-SALES-CAL serves 14bce088 (before a0a29858); WF-AVA-SALES-CAL serves 0968c734 (before 8e0c5c3a).
  The only change: the secret check also reads a second variable while it exists. With that variable deleted,
  the new check accepts exactly what the old one did, so publishing the old version back is safe.
  Staging copies left inactive: HbNQRsCGvKEY80NY, embkVS0CvwJD4K5l. The post-call rail was not touched.
- The secret: Doppler and n8n hold the new value. The old one cannot be brought back on purpose. If the new
  one leaks, rotate again the same way.
- 8976: back on the AVA sales test agent (latest published). Undo is not needed.
- Battery: test_batch_c7f0245bae60. Calls: c call_296294ebe90f3660ab6595ca8e1 · a call_07e644078815be94789cf874b3e ·
  b call_b58f65ab482e67d7f89f1a5d0cc · b2 call_f91419eb6468e2d6c746220e959 · round trip call_86d4db675f585a480417d242790.
- Repo: commit dc396eb (snapshot, build doc, battery file, board), then this report. Undo the docs: git revert dc396eb.

WHAT'S NEXT
1. Prove press 1 on a real call: call 0019 between 7 AM and 9 PM Central from a phone that is NOT the cell the
   transfer rings (that is the owner cell held in n8n as OWNER_CELL; calling from it means it is busy when the
   transfer dials it). Say "Can I talk to somebody right now?", give a name, a company and a topic, say "No,
   just connect me", answer the cell when it rings, listen for the name and company, press 1.
   Before that, confirm that Doppler AIC_TRANSFER_NUMBER_ holds the cell you will answer (it equals the n8n
   OWNER_CELL value, not Doppler OWNER_CELL_PHONE). If that phone is no longer yours, the transfer rings the
   wrong phone or nothing, and every caller gets the callback line. Details in my chat note, not here.
2. The caller's own text: either give the ZZ test contact a phone that can receive texts (your call), or
   watch the first outside caller's text land.
3. Send the Grok 37 items, with the voice-accept words if you want "connect" by voice.
4. The line ending 5008 and the site's Try button still answer the old desk (v5). Moving them is a separate paste.

GOTCHAS
1. A Retell web call can never transfer. Retell's docs say so and the call proved it: the transfer tool answers
   "Cannot perform transfer call in web call". The build itself never even tries on a web call; call c used the
   build's own test hook (it marks the call as a phone call) so the whole connection path would run up to the
   transfer. That is how the failure line, the alert and the zero dead air got proven. The ring itself needs a
   real phone call.
2. The paste said the test agent's after-call reports went to the ZZ sink. They did not: v6 to v9 all post to the
   live rail. The ZZ-sink line in paste 22's gotcha 4 was about two lab calls that set the sink per call. That is
   why path A needed no n8n work.
3. The booking secret was used by more than the paste named. Two live n8n workflows check it (the AI Chauffeur
   setup-call calendar and the AVA discovery-call calendar), and three agents that answer numbers carry it: the
   two-door agent, the old desk (line ending 5008, the Try button, and the 0019 rollback) and the AVA sales test
   agent (now on 8976). Dropping the old value without new versions of all three would have broken bookings on
   the Try button and on 5008, and the rollback. So each got a header-only version (two-door v11, desk v5, AVA
   test v8), and 0019 was re-pinned from v10 to v11. The desk's v4 stays untouched.
4. Retell will not rename a published version (HTTP 422 "Cannot update published agent other than version
   title"). The rename is v10.
5. Our own numbers go to the ZZ test contact for the caller's text, and that contact has no phone, so a test call
   from any number we own cannot prove the caller's text. The owner's copy (text + email) is the proof that works.
6. Questions-only calls still file a trip-style ticket to the owner: the after-call run of call c marked it as
   a trip and stored a trip page, because the analysis always picks a trip type. That is the lead-sheet branch
   of the rail, its own run.
7. After the first question the caller waits about 6 seconds (the questions part opening and reading the facts
   sheet). Later turns: at most 5.1 seconds, 8 of 33 turns over 4 seconds.
8. 0019 is pinned to v11 on purpose. A later publish on this agent does not reach the live line until the number
   is re-pinned.
9. Left in place, nothing deleted: the four acceptance calls' trip pages (unlisted, the caller number masked to
   its last four), 49 test case definitions in Retell, the two inactive n8n staging copies.
10. My slip, owned: one debug print in this session showed the transfer number in full. My masking pattern
    missed the "(xxx) xxx-xxxx" shape, and the n8n alert text it was reading uses that shape. It went to the
    session screen only, not to any file, board line, commit, report or Notion page. The pattern is fixed, and
    the pre-commit sweep, which catches that shape, passed on every file this run committed.
11. The paste said git pull --rebase first. The folder holds uncommitted files from other work, so I fetched
    instead. Another session pushed twice during the run (AVA homepage rev b and rev c, both also writing the
    board); I fast-forwarded before each board step and did not touch its files.
```
