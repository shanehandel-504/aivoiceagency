# AIC two rooms (2026-11-16): live on v30 (tested copy v58)

===== SHANE READBACK — COPY ALL =====
WHAT IS LIVE
- AI Chauffeur's agent is on version 30 on 414-775-0019, the demo pool line (DEMO-POOL-05) and the website button. It was tested as copy v58. Promoted at about 11:35 PM CT on your 11:26 PM word ("ship and then let ChatGPT check it") and your 5:57 PM CEO-mode word.
WHAT CHANGED
- Questions get a questions room: it answers first, in one or two short sentences, and asks nothing about his business.
- The call offer is read by fixed rules: it comes after two answers, a no is kept, an unclear answer gets "Twenty minute call with the team, yes or no?" once.
- The demo never prices a trip it was not given; with no count it gives the starting price for the smallest car.
- The front door: after a bare hello, noise or an echo it says "Run the airport pickup or ask how it works?" word for word.
- A website caller who only asks questions hears "What's the best cell so the team can reach you and I can text the link?" once before the goodbye; a no gets "That's fine. What else can I answer for you?" and no second ask.
- The nine new lines, knowledge base v4 on the questions room, end of call after 90 s of silence, 29 boosted words.
BEFORE AND AFTER
- Questions-room wait: middle 1.39 s (version 29: 2.57 s); slowest in twenty 2.89 s (version 29's slowest call 5.27 s). Talk-over: 0 against 0.
- Text runs on the final copy: zero criticals, zero banned words; the trip set clean.
- Model tokens per answer about 7,000 (version 29 about 6,200 to 7,100): reported, parked as a later cut.
PROOF CALLS (live v30, test lane, nothing reached a real person)
- ...bc41: the software question and the call center: every question answered before any question of ours. PASS.
- ...1211: your check script: plain yes, it agrees then the auto attendant line, month to month, no contract, same price at any size, "Still there? Ask me anything else." with no goodbye. PASS.
ROLLBACK
- C:\Users\offic\aic-tuning\sales-v3-2026-11-08> doppler run --project ava-prod --config prd -- node fin_repin.mjs 29 --go
- That re-pins version 29 on both numbers; the button follows the 0019 pin; it also puts knowledge base v3 back.
SPEND
- Retell $47.81 of $55 (the two live proof calls, $0.90, included), Claude API $7.85 of $10 (the whole run's 65).
OPEN, NOT BLOCKING
- P9: after a price question in the middle of the trip, the trip step can repeat the count and hand back instead of pricing. Version 29 does it too. A next fix is written up.
- The checker's two record items (the five after-call cases value by value; the class column in RUNS.csv). Next: the ChatGPT check you asked for.
THE AGENT IS FROZEN. No change without Shane's word.
SHANE'S ONE CHECK CALL
- Call the demo. After the greeting say "Does it work with Limo Anywhere?" You should hear a plain yes. Say "We already have a 24-hour call center." You should hear it agree, then the auto attendant line. Ask "What does it cost?" then say "That's expensive." You should hear month to month, no contract, the same price at any fleet size. Then stay quiet for about six seconds: you should hear "Still there? Ask me anything else." and no goodbye. Then say "That's all, thanks." Once on speaker: say nothing while the greeting plays; it should not start over.

Run folder: PASTE\aic-two-rooms (DECISIONS D1-D60, CANDIDATE.txt, LIVE-DIFF.txt, PROOF.txt, CHECK.txt, SELF-CHECK.txt).
