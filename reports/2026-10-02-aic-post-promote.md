RUN INCOMPLETE — WHAT: V12 IS NOT ON 414-775-0019, 0019 STAYS ON V11 / WHY: TWO TARGETED SETS BELOW GATE (PRICE SENTENCE 3 OF 5, TALK-TO-SOMEONE WORDS 2 OF 5) / NEXT: GROK ROUND ON TEXTS 2 AND 3, RE-RUN THE TARGETED SETS, THEN RE-PIN

# 2026-10-02 — AI CHAUFFEUR · POST-PROMOTE POLISH ON THE LIVE TWO-DOOR BUILD (paste 38 v1)

```
===== SHANE READBACK — COPY ALL =====
RUN INCOMPLETE — WHAT / WHY / NEXT
WHAT: v12 (Grok 40 texts 1–3 + the today-in-yes fix) is published but NOT on 414-775-0019. 0019 still answers v11.
      Not done: the re-pin (step 8) and the three acceptance calls on 0019 (step 9).
WHY:  step 7's targeted gate failed on two of the four sets: the above-base sentence 3 of 5 (needs 4) and the
      "talk to someone now" words 2 of 5 (needs 5). Everything else passed: the whole set of 49 twice (46 and 48
      of 49 strict, all five safety checks both times), the third push 5 of 5, "Yes. Can I do it today?" 5 of 5.
NEXT: a Grok round on texts 2 and 3 (the failing lines are quoted below) → a new version → the four targeted sets
      again → re-pin, with the rollback ready.
MISSION: AI Chauffeur post-promote polish on the live two-door build. Paste 38 v1, Oct 2 2026.
LIVE NOW: 414-775-0019 → "AIC-LIVE two-door" v11 (unchanged since Oct 1) · board https://aivoiceagency.ai/hq/board.json
CHANGED FOR CALLERS TODAY:
  1. The briefing the team hears on a warm transfer (v1, live since 10:42 AM Central): say "connect" or press 1.
     It reaches 0019 even on v11, because the transfer step calls the briefing agent's latest published version.
  2. The AVA Demo Call calendar on GHL (10:45 AM Central): "15 minutes" in the description, and the on-screen
     booking confirmation is signed "- AVA Team, AI Voice Agency".

WHAT I DID, IN PLAIN ENGLISH
1. Checked first: 0019 answered v11, pinned. The greeting was the same 274 characters with the same fingerprint.
   The three bullets for texts 1–3 were each found exactly once. The rollback (re-pin v11) was ready.
2. Made v12 from v11 with texts 1–3 placed word for word. Nothing else in the prompt was touched.
3. Added the today fix to v12. When a caller's yes also asks for today, the first time the open times are read
   they come with the line that already exists: "Nothing's open today. The next open times are … — which works?"
   No new words. My first try said "Nothing's open today" three times on one path; I added a guard and re-tested
   before anything was published.
4. Published v12 at 10:29 AM Central. 0019 stayed on v11.
5. The briefing agent: placed texts 4a, 4b and 4c, added the one re-prompt step, and set the accept to "connect",
   "connect me" or a press of 1. Before the change a spoken "one" put the call through and "connect" was not
   understood. The six test cases passed 5 of 5 each; published at 10:42 AM Central.
6. The caller's own text: skipped. Doppler has no secret for a test phone.
7. The GHL calendar: changed the description and the on-screen confirmation through the API, read them back.
   The slot was already 15 minutes. The confirmation email and text live in a GHL workflow, which the API cannot
   edit: the click path is below.
8. Ran the tests on v12: the whole set of 49 passed twice; two of the four targeted sets did not. So I stopped:
   no re-pin, no acceptance calls on 0019.
9. Checked the end state (21 of 21), wrote the snapshot of what answers 0019 now, committed, pushed, checked the
   deploy, filed this to Notion.

DONE (the paste's order)
| Item | Result | Proof |
|---|---|---|
| Words placed (texts 1–4 byte-exact) | yes | texts 1–3 in v12's node d2 (780 · 602 · 853 characters; the three old bullets gone; d2 16,097 → 16,667 characters, still 79 lines) · 4a/4b/4c in briefing v1 (58 · 245 · 58); 4c is also the new re-prompt step's line · checked field by field: v12 13 of 13, briefing 10 of 10 |
| Today-in-yes fix | changed: d2_x · n07_extract · team_offer_x (two reads each), cal_prep (code), fn_slots (one new first edge), new node today_yes_mark → the existing n08_sameday line · words added: none | playground before publish: 5 paths as designed (after the guard) · on the published v12: 5 of 5 |
| Briefing agent | v1 published 10:42 AM Central · accept = a keypad 1, or exactly "connect" / "connect me" → bridge; anything else → the re-prompt once → cancel | playground, 5 runs each on the draft: connect 5/5 · connect me 5/5 · yes 5/5 · one (spoken) 5/5 · voicemail 5/5 · DTMF 1 5/5 · spot run after publish 6 of 6 · v11 and v12 both call the same agent id at latest published |
| Caller-text proof | phone set: no · text landed: no | needs a Doppler secret for the test phone |
| GHL fixes | description: done (30 → 15 minutes) · slot length: already 15, no change · email signature: by hand · SMS signature: by hand · on-screen confirmation: done (signed "- AVA Team") | read → write → read back; the email and text come from the workflow "AVA Demo Call — Reminder Engine v1" |
| Battery run 1 | strict 46/49 · safety all pass | test_batch_575ea05400b2 · Retell 48/49 · misses C09, C12, C15 (none in what v12 changed; each passed in run 2) |
| Battery run 2 | strict 48/49 · safety all pass | test_batch_2b48558299c3 · Retell 49/49 · miss: l-vendor (the checker's wording, as on Oct 1) |
| Targeted sets | third push 5/5 · price sentence 3/5 (FAIL, needs 4) · connect words 2/5 (FAIL, needs 5) · today-in-yes 5/5 | test_batch_1e0bf3071006 · the strict re-score matches Retell's own judge on every run |
| Greeting equality | yes, v12 = v11 byte for byte | 274 characters, SHA-256 6d9d1162bb841a01… (the browser greeting is equal too) |
| Re-pin (v11 → v12) | NOT DONE (the gate failed) | 0019 still on v11; the number's record untouched since Oct 1, 6:11 PM Central |
| Acceptance calls a / b / c | NOT RUN (no re-pin) | no bookings made, nothing to cancel |
| Snapshot written | yes: what answers 0019 now (v11 + briefing v1) | ops/tuning/0019-two-door-live-snapshot-2026-10-02.md · v11's fingerprints equal Oct 1's · secret sweep clean, 9 of 9 controls caught |
| Commits + deploy | 490361d pushed at 11:05 AM Central, live in about 12 seconds · this report is the next commit | the live board equals the commit byte for byte; ops/ and reports/ are not served (404) |
| Notion | report https://app.notion.com/p/3ed581219cb281e6b861ce9253c6adad · L5 wrap https://app.notion.com/p/3ed581219cb2817ba475cca999b76bdc · both read back | |
| Leftovers | the line ending 5008 and the aichauffeur.ai Try button still on the old desk (separate paste) · your real-phone proof of "connect" and press 1 · the Grok round on texts 2 and 3 | below |
| Rollback | number: nothing to undo (0019 is on v11); after any future re-pin → re-pin v11 · briefing: fork v0 → publish · calendar: put the old text back | below |

THE FAILING LINES (word for word, for Grok)
1. Text 3, asked "Can I talk to someone right now?":
   run 2: "You can talk to the team if they're free. I just need a few details first. What's your name?"
   runs 3 and 5: "You can ask to speak with the team, and I can try to connect you once I have a few details."
   Text 3 rules out both ("Never say the caller can speak with the team … never say the team is free").
   Worth weighing: text 3 writes the flag as {{transfer_open}}. Retell fills that in with its value on the call,
   so the model reads "When the true flag above is true". v9's text named the flag in plain words and said "try
   to connect" in 10 of 10.
2. Text 2, a big fleet asks for a ballpark: the exact sentence is spoken every time, but in 2 of 5 the next answer
   rewords it: "Anything above the base, like writing trips into your reservation software, is sized to the
   company, with one price after the setup call." Text 2 wants the sentence as written in any answer.
3. Briefing: "Yes, connect." puts the call through (3 of 3). Text 4b says the spoken accept is connect or connect
   me on its own. A strict check needs the reply read as text by code; the model judges it loosely.

GHL CLICK PATH (the confirmation email and text, by hand)
GHL → AI Voice Agency sub-account → Automation → Workflows → "AVA Demo Call — Reminder Engine v1" → the first
action (the instant confirmation email) → change the sign-off "- Shane" to "- AVA Team" → Save Action → the second
action (the instant confirmation text) → the same → Save Action → check the reminder emails and texts further down
for the same sign-off → Publish. Then open "AIChauffeur — Booking Response": in the July audit it also fired on AVA
Demo Call bookings; if it still does, fix its sign-off too or limit its trigger to the AI Chauffeur calendar.

IDS, COMMITS, ROLLBACK
- 0019 → agent_9ebb41c9bd8af214649328f107 v11, pinned, untouched. Versions 0–12 all there; v12 published at
  10:29 AM Central and not pinned.
- If v12 (or a later version) is pinned and must come off, one action: PATCH
  https://api.retellai.com/update-phone-number/%2B14147750019 with
  {"inbound_agents":[{"agent_id":"agent_9ebb41c9bd8af214649328f107","agent_version":11,"weight":1}]}
  or the dashboard: Phone Numbers → +1 (414) 775-0019 → "AIC-LIVE two-door", version 11 → Save. Never v10 or older.
- Briefing agent agent_63db656e3a68b737fe61cb78db: v1 is live through latest published; v0 is untouched. To go back
  to press 1 only: fork v0 into a new version and publish it.
- GHL "AVA Demo Call": to undo, put back "30 minutes" in the description and the old sign-off
  ("- Shane Handel, AI Voice Agency") in the on-screen confirmation.
- Batches: r1 test_batch_575ea05400b2 · r2 test_batch_2b48558299c3 · targeted test_batch_1e0bf3071006. The briefing
  cases and the today-fix paths ran on Retell's Agent Playground (no batch ids).
- Repo: 490361d (snapshot, build doc, battery file § 14, board), then this report. Undo the docs: git revert.
- n8n: nothing changed. No acceptance calls, so no bookings, no texts, no trip pages.

WHAT'S NEXT
1. Send Grok the two failing texts (2 and 3) with the lines above → a new version → the four targeted sets again
   → re-pin with the rollback ready.
2. Your real call to prove "connect" and press 1. The new briefing is live on 0019 now. From a phone that is NOT
   the cell the transfer rings: ask "Can I talk to somebody right now?", give a name, a company and a topic, say
   "No, just connect me", answer the cell, listen, say "connect". Another time, press 1.
3. The GHL email and text sign-off: the click path above.
4. A Doppler secret for a test phone, so the caller's own text can be proven.
5. The line ending 5008 and the aichauffeur.ai Try button still answer the old desk: a separate paste.

GOTCHAS
1. The briefing change is live on 0019 although 0019 stayed on v11: the transfer step calls the briefing agent's
   latest published version, not a pinned one. Any later publish of the briefing agent reaches the live line the
   same moment.
2. The test tool cannot press a key: the Agent Playground refuses a keypad message. The keypad case was sent the
   way Retell's call history writes it ("User pressed keypad: 1"). A bare "1" was also accepted in the extra
   tests, and "connect" works either way, but only your real call proves the key press.
3. My first scorer for the targeted sets was looser than the texts. It needed the exact sentence only once on T2,
   and it missed "You can ask to speak with the team" on T3, so it showed 5 of 5 and 4 of 5. The strict re-score
   from the saved transcripts agrees with Retell's own judge on every run: 3 of 5 and 2 of 5. The gate used those.
4. GHL wrote two default fields onto the calendar when it was saved (guest collection "email", count available
   days only "false"). Both were absent before. No setting I did not send changed value.
5. CLAUDE.md § 9 calls the owner contact's tag "owner-alerts"; the live contact carries "owner-alert" (singular),
   with zz-internal and do-not-drip. Not changed by this run (last modified Sep 28).
6. Doppler no longer lists AIC_TRANSFER_NUMBER, only AIC_TRANSFER_NUMBER_. The build's rule ("the first, else the
   second") lands on the same one.
7. The paste said to fetch, never pull; I did. No other session pushed during the run.
```
