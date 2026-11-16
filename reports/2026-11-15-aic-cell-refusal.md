# AIC cell refusal: LIVE on v29 · Sun Nov 15 2026 (Dell clock, CT)

DONE
AIC CELL REFUSAL IS LIVE: agent_9ebb v29 on 414-775-0019, DEMO-POOL-05 and the website button (promoted 6:50 PM CT on Shane's 3:13 PM word; CHECK.txt PASS 6:35 PM).
WHAT CHANGED (v29 = v28 + copy v51's items, byte for byte; LIVE-DIFF.txt: 11 fields, no spoken line, HASH 1): a website caller who refuses the cell hears 'That's fine. What else can I answer for you?' and no calendar check; a second reach-out ask gets the close; a 0.7 wait on the cell question and on the line after it.
PROOF (PROOF.txt): P2-T ...a9e1 C2 and C3 hold, no start-over, N10N whole · P2-V5 ...feef $749 Mercedes-Benz executive Sprinter with the read-back · no N9 TRANSFER, no book_slot · both through the test lane.
ROLLBACK: C:\Users\offic\aic-tuning\sales-v3-2026-11-08> doppler run --project ava-prod --config prd -- node fin_repin.mjs 28 --go
THE AGENT IS FROZEN. No change without Shane's word.
PHONE LADDER: text proof only. A test call cannot take the phone path (the team check reads every test call as a website call); a real-call proof needs Shane's word.
SPEND: the promote Retell $0.48 of $1.20, Claude API $0.00 of $0.30 · the whole run Retell $6.37, Claude API $1.05 (the shared ledger since 3:00 PM; the promote's share inside it), under $10.
OUTSIDE CALL (counts against nothing): 4:34 PM CT, a phone call, inbound, on live v28; see the call list in DECISIONS.txt for any during the promote.
Written Sun Nov 15 2026, 7:06 PM CT (Dell clock). Run folder PASTE\aic-cell-refusal. STATUS-W3.txt rewritten. Next owner: Shane (his one check call when he has time).

SHANE'S ONE CHECK CALL, word for word:
  Press Call the demo. Say "Can I talk to a person?" When it asks for your cell, say "No, I'd rather not give my number." You should hear "That's fine. What else can I answer for you?" and no line about checking anything. Then say "I want a person." You should hear one offer of more questions or the team reaching out. Say "I want a person." once more and you should hear the goodbye.

## Readback

===== READBACK — AIC CELL REFUSAL · PROMOTE (run file v4) · Sun Nov 15 2026 =====
What is live: agent_9ebb version 29 on 414-775-0019, the DEMO-POOL-05 line and the website button, since 6:50 PM CT.
What changed:
  A website caller who refuses to give a cell now hears one plain answer, 'That's fine. What else can I answer for you?', and no calendar check.
  A caller who already heard the close offer and then asks for the team to reach out gets the goodbye, not the offer again.
  Two short waits (0.7), one after the cell question and one after the line that follows it, so the agent lets the caller finish.
  No spoken line was added or changed.
Before and after:
  The agent started talking inside the caller's refusal in 2 of 2 test calls on the old version, and in 0 of 5 on the new one.
  The close offer cut into 'A person ... Now.' in 2 of 6 with only the first wait, and in 0 of 5 with both.
  In text, 39 of 40 test runs are clean, with zero criticals.
  An answer to a question now starts about 3.9 seconds after the caller stops.
The two proof calls on live, through the test lane:
  The refusal script (...a9e1): N10N right after the refusal, no calendar, no talk-over.
  Shane's trip script (...feef): $749, the Mercedes-Benz executive Sprinter, and the read-back.
  No transfer and no booking in either.
The phone ladder still has text proof only: a test call cannot take the phone path, because the team check reads every test call as a website call.
Spend: the promote $0.48 on Retell. The whole run about $6.37 on Retell and $1.05 on the Claude API, under $10.
Rollback: C:\Users\offic\aic-tuning\sales-v3-2026-11-08> doppler run --project ava-prod --config prd -- node fin_repin.mjs 28 --go
THE AGENT IS FROZEN. No change without Shane's word.

## Proof calls

```
PROOF · AIC CELL REFUSAL · PROMOTE P2 (run file v4) · two proof calls on LIVE agent_9ebb v29 through the test lane · written Sun Nov 15 2026, 7:06 PM CT (Dell clock)
THE TEST LANE (confirmed in P0, read only, the active versions): every call is a browser test call (create-web-call) with metadata.test_mode true (cr_voice.mjs refuses any other);
  WF-POSTCALL v3 (serving 93a10b1b) sets test_lane from test_mode and gates every caller text, owner text and email on it (the ZZ test contact, rows dry_test); OWNER-ALERT v1 (867309a6) reads test_mode.
  A browser call cannot be transferred live. Nothing reached a real person.

P2-T ...a9e1 (script T: PL-08's caller lines, voice call V1's clips and timing; live v29; 37 s; ended agent_hangup; $0.10)
  trace: start > n0 > n1 > g_person > n9g > n9f0 > n9r > n9w > n10n > exit > close > end
  C2 HOLDS (get_open_slots not called) · C3 HOLDS (no agent turn on N8 TIMES) · the turn right after the refusal is the N10N line, whole · no N9 TRANSFER, no book_slot
  START-OVER at the refusal: no (refusal first word 20.58 s - last word 23.95 s; agent starts inside: none) · agent start inside the third clip: no (29.97 - 31.57 s)
  gaps on every turn: [1.92, 2.29, 3.51] · after 'A person, No.' (speech recognition heard 'Now' as 'No') N10N took it as done and the agent closed with L39 (as C5's ...e960 did on copy v51)
  blind auditor: criticals none (no agent start inside the refusal 20.58-23.95 or the third clip 29.97-31.57) · every agent line approved (n0, n1r, L26, n10n, L39) · no N9 TRANSFER, no book_slot
  RESULT: PASS (C2 and C3 hold; no start-over).

P2-V5 ...feef (Shane's check script from the last build, the V5 line word for word; live v29; 130 s; ended agent_hangup; $0.38)
  trace: start > n0 > n1 > qx > qpxc > qpx > gdep > qx > qpxc > qpx > n3 > qx > qpxc > qpx > qprep > n4 > qline > n5 > n5rp > n5w > n5x > n5wc > n5wb > n5n > n6 > n7in > n7x > n7r > n7l > n7b > n7 > n7x > n7r > exit > close > end
  the bar (bs_bar.bar's rule applied to the call's own quote-tool answer): one get_airport_quote answer, $749, Mercedes-Benz executive Sprinter, 19 miles, Chicago;
  PRICE said ('seven hundred forty-nine dollars ...', then '$749' again on 'Can you repeat that?') · CAR said with it · READ-BACK in one turn: '19 miles to Chicago, the Mercedes-Benz executive Sprinter, $749 with gratuity and fuel included, minimum rate applied.'
  no N9 TRANSFER, no book_slot · gaps on every turn: [1.47, 2.47, 3.51, 2.28, 1.04, 2.88, 3.08]
  blind auditor: criticals none · price, vehicle and the one-turn read-back said · unapproved 2 on the trip path (not touched by this change; the last promote's auditor found the same two on live v28's V5 call ...ba94): the trip read-back paragraph after the quote, and 'Got it.' before T2 · no N9 TRANSFER, no book_slot
  RESULT: PASS (a price, the car and the read-back are said).

Both proof calls PASS. No rollback. Version 28 makes the refusal talk-over; v29 did not on this call.
```

Run folder files: CANDIDATE.txt, DIFF.txt, LIVE-DIFF.txt, UNIT.txt, BEFORE.txt, RESCORE.txt, RUNS.csv, VOICE.txt, PHONE.txt, PROOF.txt, SPEND.txt, CHECK.txt, DECISIONS.txt (PASTE\aic-cell-refusal).
