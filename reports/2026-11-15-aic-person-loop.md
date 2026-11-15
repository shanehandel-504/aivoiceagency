# AIC person loop: LIVE on v28 · Sun Nov 15 2026 (Dell clock, CT)

**DONE.** The person-loop fix is live as **agent_9ebb v28** on 414-775-0019, DEMO-POOL-05 and the website button. It was promoted at 2:10 PM CT on Shane's word at 2:02 PM ("So yeah, make it live. The money is fine. Everything is going good. Do what you think is best"). CHECK.txt read PASS (Nov 14, 10:16 PM CT).

## What is live, in plain words
A caller who keeps asking for a person now climbs a short ladder instead of hearing the same answer again:
1. **First ask:** the normal answer. On a phone call that is the team check, then a live handoff if the team is free, else "The team isn't on the phones right now" with two times. On the website button it is the cell ask.
2. **Next ask:** the close offer, "Would you like to ask more questions, or have the team reach out to you?"
3. **The ask after that:** the goodbye, "The team gets the message. Thanks for calling AI Chauffeur." The team is told to reach out.

The team check and the calendar each run once per call. A reply nobody planned for on N9 AFTER or N9 WEB now goes to the questions part instead of sitting on the step. **No spoken line was added or changed.**

## What changed (live v28 = v27 + the six items, byte for byte as tested on copy v48)
- G-PERSON counts the asks and picks check, offer or close.
- Two equation exits on n9g (close, then offer, in front of n9g_tried).
- One line of the close step.
- Three defaults.
- Else exits on N9 AFTER and N9 WEB to the questions gate.

LIVE-DIFF.txt walks every field of v28 against v27 and finds 14 differences, all item fields. HASH 1 holds three times: notice 05386b07fa07, greeting 768e6ad24cbd. Live keeps its own booking routing. The G-PERSON code went live with the Windows line ends it was tested with (FIX-3).

## Before and after
| Test caller | v27 / its twin (before) | v28 / copy v48 (after) |
|---|---|---|
| Phone caller who only asks for a person (PL-04) | heard the line 17 times, team check 17 times, call never ended | line once, offer once, the goodbye (3 of 3) |
| Website-button caller who only asks for a person (PL-06) | stuck on the cell question 17 times | cell ask once, offer, goodbye (3 of 3 in text, plus voice V2 and proof call 1) |
| Website caller who refuses the cell (PL-08) | stuck on the cell question 5 times | cell ask once, offer, goodbye (2 of 2, plus voice V1) |
| The 9 PM caller (PL-03, GK-20's script) | the line with times 3 times | the line with times once in every run (see the gotchas) |
| Text on the candidate | soak GK-20: 0 of 3 | simple 6/6, medium 14/15, regression 8/8, zero criticals |

## The two proof calls on live v28 (browser calls through the test lane)
Both had zero criticals per the blind auditor. No N9 TRANSFER, no book_slot, no cut-in.
1. **The browser pusher (PL-06's lines), call ending 48b9, 35 s: PASS.** L1 to L7 hold: the cell ask once, the close offer once, then "The team gets the message. Thanks for calling AI Chauffeur." The agent ended the call.
2. **Shane's check script (V5), call ending ba94, 123 s: PASS.** One quote from the tool: $749, the Mercedes-Benz executive Sprinter, 19 miles to Chicago. The price was said with the car and the read-back, and the same price again on "Can you repeat that?" The cell was asked, then the text close.

The test lane was checked before any call by reading the active versions:
- WF-POSTCALL gates every text, email and owner alert on `metadata.test_mode`.
- OWNER-ALERT skips on it.
- No one was texted or emailed.

## Live defects, listed and not caused by this change
- **THE TALK-OVER ON A TWO-SENTENCE CELL REFUSAL IS A LIVE CRITICAL.** On the website button, when a caller refuses the cell in two sentences, the cover line "I'm checking that now" starts in the pause between them. Version 27's twin does it at the same point (comparison call ending e4eb). It was not on either proof script.
- After a cell refusal, the times step speaks words of its own ("The team isn't available right now. I can answer a question or price an airport pickup.").
- The questions part can open an answer with "The team isn't on the phones right now." It can also say "The team checks it on the Discovery Call." twice in a row (PL-03).
- A reach-out ask from the questions part gets the close offer a second time (PL-03).
- Asked why nobody is there, the agent invents a reason ("the team is based in Wisconsin, where it's evening").
- N8 TIMES has no fallback exit.
- On Shane's check script, the trip read-back sentence and a "Got it." are not in the approved list. The trip path is unchanged by this run.
- The phone path was tested in text only. The voice harness makes browser calls only.

## Spend
- **Promote:** Retell $0.45 of $1.20, Claude API $0.00 of $0.30.
- **Whole run:** Retell $4.12, Claude API $1.03, total **$5.15 of $8**.

## Rollback (one line)
`C:\Users\offic\aic-tuning\sales-v3-2026-11-08> doppler run --project ava-prod --config prd -- node fin_repin.mjs 27 --go`

THE AGENT IS FROZEN. No change without Shane's word.

## SHANE'S CHECK CALLS (word for word)
1. On the Dell, open aichauffeur.ai and press Call the demo. Say: "I need a ride to O'Hare tomorrow at four PM, four people, eight bags." You should hear the demo line about one airport pickup and drop-off. Say "okay", then give a hotel as the drop-off. After the price say: "Can you repeat that?" Then say: "Okay, book it." Give your cell when it asks. You should hear the Sprinter both times, the same price both times, and get the text with the trip page right after.
2. Press Call the demo. Say "Airport pickup", then talk over the question with "Mitchell Airport, landing Friday at two, going to the Pfister Hotel, two of us." You should hear one price and no question about the landing date.
3. Press Call the demo. Say "Can I talk to a person?" When it asks for your cell, say "Just connect me." Then say "I want a person." You should hear the cell question once, then one offer of more questions or the team reaching out, then the goodbye. You should never hear the same sentence twice.

## Gotchas
- The ready result rests on two of the chat's rulings, made after misses:
  - FIX-1 corrected the not-on-the-phones check to the line with times.
  - FIX-2 classes a voice critical by a comparison call on the live twin.
  - Pass 1 read NOT READY. The checker judged both rulings fair.
- Check call 3 says "never the same sentence twice." The 9 PM script can still hear "The team isn't on the phones right now." a second time from the questions part (listed above). Check call 3 itself is the website path, where the proofs held.
