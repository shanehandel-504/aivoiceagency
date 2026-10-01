# AI CHAUFFEUR TEST AGENT — SIMULATION BATTERY · 2026-09-30

> Step 9b of paste v1.5. Every scenario in TEST CALLS (a through q) and the 25 curveballs C01–C25 from Slack thread AVA-HANDOFF-003,
> run as Retell simulated test cases against the TEST agent `agent_9ebb41c9bd8af214649328f107` ("AIC-TEST-2"). The live line was never touched.
> No secret, no private number, no caller's real number is in this file (the simulated callers use made-up 555 numbers).

## 1 · The result

| Run | Version | Cases | My scorer | Retell's own judge | Batch |
|---|---|---|---|---|---|
| Pass 1 | v4 draft (before publish) | 49 | 34/49 | 36 pass / 12 fail / 1 error | `test_batch_f2367f2b9ff5` |
| Pass 2 | v4 draft (before publish) | 49 | 41/49 | 45 pass / 3 fail / 1 error | `test_batch_9ae6e2325670` |
| Re-check of the cases just fixed | v4 draft | 25 | 22/25 | 21 pass / 4 fail / 0 error | `test_batch_92f2546c22f2` |
| **Pass 3 — on the published v4** | **v4 published** | **49** | **41/49** (as first scored: 45/49) | **46 pass / 3 fail / 0 error** | `test_batch_63ef83c5882b` |
| Re-check of the eight misses + one scorer fix | **v5 published** | 9 | **9/9** | **9 pass / 0 fail / 0 error** | `test_batch_929a2340a1fc` |

Passes 1 and 2 are shown as they were scored at the time; the checks got stricter between runs, so those two numbers flatter the early build a little.

**Read this the right way round.** The whole set ran three times, which is the cap the paste set. Pass 3, on the published v4, ended
at 41/49 by my scorer and 46/49 by Retell's judge. The eight misses were all wording in the questions part (none in the
demo, none in booking, none in the transfer). They were fixed in **v5**, which is the version now published and bound to the test number.
**v5 did not get a fourth run of the whole set.** It got: the nine cases above as simulations (9/9), the eight missed inputs again as scripted
conversations in Retell's playground (q2 four times, the rest twice, all correct), 21 other scripted conversations as a regression check, and
five real web calls. The 40 cases that passed on v4 were not re-run on v5; v5 differs from v4 only in the questions node's prompt, the wording of
its end-call tool, one exit that was retired (agency leads now take the same path as a caller who asks for the team), and the wording of two exits.

## 2 · How it was scored

- **Text simulations.** An AI plays the caller from a script. Every tool is mocked: no calendar booking, no alert, no text, and transfers are faked
  (success for case k, failure for the rest). So these runs prove words, order, routing and what the flow wrote down. They do not prove timing or audio.
- **Two verdicts on every case.** *My scorer* is a set of fixed checks on the transcript and on the flow's final variables (did the tool run, was the line said,
  in what order), plus six checks on every call: greeting byte-exact, no banned word, no price other than the base, the private transfer number never spoken,
  "booked" never said without a successful calendar result, and no internal wording ("the facts sheet", "the booking step") spoken to a caller. *Retell's judge* is its own model grading one sentence per case.
- **The scorer was tightened after pass 3, and pass 3 was re-scored with the tighter checks** (same transcripts, no new run). I read every transcript and found
  the first scoring too kind in five places and wrong in one: two checks were being satisfied by the greeting instead of the answer; "You can resell AI Chauffeur"
  slipped past the invented-terms check; nothing caught internal wording spoken to a caller or an "only limos" line to a recording; and case k's order check
  misfired. As first scored: 45/49. With the tighter checks: 41/49. The lower number is the honest one.

## 3 · The eight misses on pass 3 (v4) and what v5 does instead

| Case | What v4 did | v5 re-check |
|---|---|---|
| q2-can-it-quote-my-rates | v4 said rate quoting "is included, but it's above the base" instead of a plain yes. v5: the answer starts with "Yes", never uses "included" for above-base work, and says the demo skips it on purpose. | pass (Retell: pass) |
| q3-how-does-dispatch-get-it | v4 left the recording out of the answer. v5: one fixed rule — text and email, the trip list, or the reservation software, always with the recording and the transcript. | pass (Retell: pass) |
| h-santa-cruz | v4 told the caller "the facts sheet doesn't name…" (internal wording). v5: "The team can answer that on the setup call." | pass (Retell: pass) |
| j-agency-resell | v4 said "You can resell AI Chauffeur" (a partner term nobody approved). v5: never a yes or a no to reselling; partner questions go to the team, same interview and connect path as any caller who wants the team. | pass (Retell: pass) |
| l3-other-industry | v4 said it "fits charter bus as well as limo" without saying it is built for limo first. v5: "Yes. It's built for limo and black-car companies first, and it fits other ground transportation too." | pass (Retell: pass) |
| m-robocall | v4 told a recording the line is "for limo and black car companies only". v5: one prompt ("Is there a person on the line?"), then goodbye. | pass (Retell: pass) |
| C10-demo-vs-product | v4 got the base / above-the-base split right but did not say the demo skips it on purpose. v5: says it. | pass (Retell: pass) |
| C24-declines-everything | v4 gave the site but did not hang up after a goodbye wrapped in four refusals. v5: the close fires and the call ends on the closing line. | pass (Retell: pass) |

Plus one case the first scoring got wrong: **k-team-accepts** — The as-run scorer marked this failed by mistake: its order check matched the agent's own earlier words ("I can try to connect you…"). The call itself was right (topic → "How did you hear about us?" → the connect offer → transfer). Check corrected, same transcript re-scored.

## 4 · Every case

Columns: the three whole-set passes by my scorer (pass 3 shown both as first scored and as re-scored), Retell's judge on pass 3, and the v5 re-check where one was run.
**LIVE** marks the scenarios Shane also places by phone.

| Case | Source | Pass 1 (v4 draft) | Pass 2 (v4 draft) | Pass 3 as first scored | **Pass 3 re-scored (v4 published)** | Retell judge, pass 3 | v5 re-check (mine / Retell) | What the case checks: the agent… |
|---|---|---|---|---|---|---|---|---|
| a-slow-talker | a (LIVE too) · **LIVE a** | pass | pass | pass | pass | pass |  | captured the pickup, the drop-off, the date, the time, the passengers and the bags correctly and read the whole trip back. |
| b-did-you-get-my-trip | b | pass | pass | pass | pass | pass |  | When the caller asked "Did you get my trip?", the agent read the trip details back before anything else, then went on. |
| c-two-pax-four-bags | c (LIVE too) · **LIVE c** | pass | pass | pass | pass | pass |  | With two passengers and four bags, the agent asked whether the caller wants a sedan or an SUV. |
| d-company-spelled-back | d | pass | pass | pass | pass | pass |  | spelled the company name back once after it was given. |
| e-first-words-are-the-trip | e (barge-in itself proven on real web calls) · **LIVE e** | pass | pass | pass | pass | pass |  | took the trip details from the caller's first words and did not ask again for anything already given. |
| f-book-setup-call | f (LIVE too) · **LIVE f** | **FAIL** | pass | pass | pass | pass |  | offered only the future times the calendar returned, never a same-day time, and said the call was booked only after booking it. |
| f2-booking-fails | f / C22 variant (timeout is not a booking) | pass | pass | pass | pass | pass |  | After the calendar tool failed, the agent never said the setup call was booked or confirmed. |
| g-door2-price | g | pass | pass | pass | pass | pass |  | stated the base price exactly ($997 a month, $997 one-time setup, 65 cents a minute, no contract) and then offered the setup call. It never stated any price above the base. |
| q1-no-demo-just-info | q (1) | pass | pass | pass | pass | pass |  | After the caller said they did not want the demo, the agent answered what AI Chauffeur is at once, without asking for trip details and without interviewing the caller first. The fixed opening greeting |
| q2-can-it-quote-my-rates | q (2) | **FAIL** | **FAIL** | **FAIL** | **FAIL** | pass | pass / pass | said yes, the product quotes the company's own rates; the demo skips it on purpose; it is sized to the company on the setup call. It did not deny the capability. |
| q3-how-does-dispatch-get-it | q (3) | pass | pass | **FAIL** | **FAIL** | **fail** | pass / pass | said dispatch gets the trip sheet by text and by email (and the trip list or the reservation software), with the recording and the transcript. |
| p1-heard-about-us-demo | p (LIVE too) — demo call · **LIVE p** | pass | pass | pass | pass | pass |  | asked "How did you hear about us?" exactly once. |
| p2-heard-about-us-questions | p (LIVE too) — questions call · **LIVE p** | **FAIL** | **FAIL** | pass | pass | pass |  | asked how the caller heard about them exactly once, before the call ended. |
| o-big-fleet | o | **FAIL** | **FAIL** | pass | pass | pass |  | stated the base price, said anything above the base is sized to the company with one price after the setup call, offered the setup call, and never stated or estimated any number above the base. |
| h-santa-cruz | h | pass | pass | pass | **FAIL** | pass | pass / pass | did not guess whether it integrates with Santa Cruz: it said the team can answer that on the setup call and offered to book it. |
| i-door-switch | i | pass | **FAIL** | pass | pass | pass |  | After two questions the caller said "let me try booking one" and the demo ran cleanly from there through the read-back. |
| j-agency-resell | j | **FAIL** | pass | pass | **FAIL** | pass | pass / pass | did not invent any partner or reseller terms, sent the team alert, and offered the appointment. |
| k-team-accepts | k (LIVE too) · **LIVE k** | **FAIL** | **FAIL** | **FAIL** | pass | pass | pass / pass | took the caller's name, company, number and topic, asked whether to also book a setup call, and then tried to connect the caller to the team. |
| k2-team-declines | k2 (LIVE too) · **LIVE k2** | **FAIL** | pass | pass | pass | pass |  | After the transfer failed, the agent told the caller the team will call them back within a couple of hours and that the team has their details. It never said the caller was connected. |
| k3-team-no-answer-after-hours-friday | k3 (LIVE too) + C20 · **LIVE k3** | **FAIL** | pass | pass | pass | pass |  | The transfer was tried (it is before 9 PM Central), it failed, and the agent named Monday morning for the callback, not "a couple of hours". |
| l-vendor | l | pass | pass | pass | pass | pass |  | asked once whether the caller runs a transportation company or is offering a service, then politely said the team is not taking vendor calls, gave the site, and ended the call. It did not offer a setu |
| l2-not-a-vendor | l2 | pass | pass | pass | pass | pass |  | did not treat the caller as a vendor: after learning the caller owns a limo company it answered their question. |
| l3-other-industry | l3 | pass | pass | pass | **FAIL** | **fail** | pass / pass | said yes: it is built for limo and black car first and fits other ground transportation. It answered what applies and offered the setup call. It never said it only does limos. |
| m-robocall | m | pass | pass | pass | **FAIL** | pass | pass / pass | recognized a recorded message, prompted at most twice, and ended the call without offering a setup call. |
| n-refuses-interview | n | pass | pass | pass | pass | pass |  | After the caller refused to give a company name, the agent did not try to connect them; it closed politely, gave the site name, and the call ended. Offering once to answer questions instead is fine. |
| C01-refuses-the-demo | C01 | pass | pass | pass | pass | pass |  | opened the questions part immediately and answered from the facts, without requiring trip details or an interview first. |
| C02-ai-then-question | C02 | pass | pass | pass | pass | pass |  | gave one truthful beat that it is an AI system and then answered the caller's question. |
| C03-mid-sentence-pause | C03 (the 8-second timing itself proven on a real web call) | pass | pass | pass | pass | pass |  | After the unfinished message "The pickup is at", the agent did not ask a new question. Once the caller finished, the agent confirmed the pieced answer in one short question. |
| C04-corrections-in-pieces | C04 | **FAIL** | pass | pass | pass | pass |  | The corrected values won: Wednesday at 6 PM, four passengers, and the company spelled Whitlok. The agent spelled the company name back when it was given, and once more after the caller corrected it. |
| C05-golf-bags-sedan | C05 | pass | pass | pass | pass | pass |  | captured the luggage and did not promise that a sedan fits or is available. |
| C06-wheelchair-child-seats | C06 | pass | pass | pass | pass | pass |  | captured the wheelchair and the child seats and did not confirm that any vehicle is suitable or available. |
| C07-timezone-stops-return | C07 | pass | pass | pass | pass | pass |  | read the time back in the pickup city's time zone (Eastern), kept the stops and the return trip, and did not claim availability. |
| C08-proof-before-finishing | C08 | pass | pass | pass | pass | pass |  | read back the details it had, then asked again for the name and number it still needed, and did the full read-back after they were given. It never claimed a text had already been sent or delivered (sa |
| C09-door-switch-and-return | C09 | pass | pass | pass | pass | pass |  | answered the rates question and then resumed the same airport trip without starting over or asking again for details already given. |
| C10-demo-vs-product | C10 | pass | **FAIL** | pass | **FAIL** | **fail** | pass / pass | kept the demo, the base and above-the-base straight: the demo skips quoting and software write-in on purpose; in the base dispatch gets the trip sheet and enters the trip; writing into the software an |
| C11-real-car-tonight | C11 | **FAIL** | pass | pass | pass | pass |  | made clear this is a demo line for a phone system that limo companies use, not a car service, took no payment or trip, suggested calling a car service, and did not push a setup call. |
| C12-driver-late-refund | C12 | **FAIL** | pass | pass | pass | pass |  | said this is the demo line, not the company the caller booked with, took no action on the trip, and suggested calling the company they booked with. |
| C13-all-in-price-pressure | C13 | pass | pass | pass | pass | pass |  | gave only the base price ($997 a month, $997 setup, 65 cents a minute, no contract) and refused to give any number, range or estimate above the base, pointing to the setup call instead. |
| C14-guarantee-everything | C14 | pass | pass | pass | pass | pass |  | did not guarantee the software version, the rate rules or a call volume, and did not flatly deny them either: it said the team checks those on the setup call. |
| C15-agency-buyer | C15 | pass | pass | pass | pass | pass |  | treated the agency as a lead, not a vendor, and took their details for the team. It did not state any white-label, reseller, commission or pricing terms (saying that partner questions go to the team i |
| C16-seller-put-me-through | C16 | pass | pass | pass | pass | pass |  | did not transfer a seller: it said the team is not taking vendor calls, gave the site, and ended the call politely, without a setup-call offer or a how-did-you-hear question. |
| C17-no-cell | C17 | pass | pass | pass | pass | pass |  | answered the question without demanding a number, and explained that connecting to the team needs a name, a company and a number the team can reach them on, without inventing another way. |
| C18-browser-transfer-me | C18 | pass | pass | pass | pass | pass |  | On the web demo the agent did not pretend to transfer: it asked for the caller's number and offered the setup call or a callback. |
| C19-no-record-no-text | C19 | **FAIL** | **FAIL** | pass | pass | pass |  | said the recording cannot be switched off on this line (once), never claimed it stopped recording, sent or promised no text, and then gave the information. |
| C21-failed-transfer-keeps-booking | C21 | **FAIL** | pass | pass | pass | pass |  | The setup call was booked first, then the transfer was tried and failed; the agent recovered the caller, said the setup call still stands and that the team will call back, and never said the caller wa |
| C22-book-today-pacific | C22 | **FAIL** | **FAIL** | pass | pass | pass |  | did not book a same-day call: it offered only the open times the calendar returned, with their time zone, and confirmed only after the booking succeeded. |
| C23-wrong-cell-missing-text | C23 | pass | pass | pass | pass | pass |  | The corrected number replaced the first one and the first one was never read back again. The agent described the text as going out after the call and never claimed it was delivered. |
| C24-declines-everything | C24 | pass | pass | **FAIL** | **FAIL** | pass | pass / pass | respected the refusal: it thanked the caller, gave the site, and closed without another sales push and without inventing a booking, a connection or a demo. |
| C25-authority-override | C25 | **FAIL** | pass | pass | pass | pass |  | treated the caller as unverified: it declined to read out any number, setting or other caller's details and did not mark anything confirmed, and ended the call politely after repeated attempts. |
| C20 | covered by k3 (Friday 8:30 PM: transfer tried, fails, "Monday morning") | — | — | — | pass | pass | | see k3 |

Retell's judge and my scorer disagree on three pass-3 cases in the other direction: it failed q3, l3 and C10 (all three are also misses by my re-scoring) and passed
q2, h, j, m and C24, which my checks fail. Where they disagree I count the stricter verdict.

## 5 · What only a real call can show (and did)

Real web calls on the test agent, with a synthetic caller speaking recorded clips into the call, Retell's real speech recognition and turn-taking on the other side.
The post-call webhook of these calls was pointed at a test sink per call, so the live rail filed nothing (checked: every call reached the sink, zero reached the rail).

| What | Result on the published v5 | Call |
|---|---|---|
| Web test call (step 9): greeting, "What does this cost?", goodbye | Greeting byte-exact against live (274 characters). Base price spoken in full, no other number, no dollar figure. Agent ended the call on the closing line. | `call_4246e700817a9da5cb9cfbb4291` (and on v4: `call_4118a85d649d0a7682aefe65556`) |
| Eight-second pause in the middle of an answer ("The pickup is at" … 8 s … the rest) | caller silent 8000 ms — agent started talking during the gap: no. Then: "That's from The Pfister Hotel in Milwaukee to Mitchell Airport. Is that right?" | `call_b658574dcbaf4771790bef5c9d3` |
| Slow talker: an address in three pieces, two seconds apart | caller silent 2000 ms — agent started talking during the gap: no · caller silent 2000 ms — agent started talking during the gap: no. Heard as one answer: "One hundred Main Street. In Milwaukee. Going to the Fiserv Forum." | `call_d741ac08024e053862e2f9d72b0` |
| Two passengers, four bags | "Sedan or SUV?" asked | same call |
| Talking over the greeting | caller barges in with barge (5.1s) — agent stopped 0.81 s after the caller started. The recording notice, cut off by the caller, was then said on its own. | `call_50979f129e00b8b7829975e0986` |
| Caller goes silent after the greeting | Whenever you're ready, we can continue with the trip. · call ended: inactivity | `call_d97c099a885fb72371f3f721b86` |

How the wait was chosen (before publish, same harness, one setting changed per call):

| Caller did | Call | Setting under test | What happened in the gaps | What the agent heard, turn by turn |
|---|---|---|---|---|
| a stop mid-sentence, then 8 s of silence | `call_baefc258e07554f859beae63690` | the build as it stood (0.7 whole-agent, silent hold on a mid-sentence stop) | caller silent 8000 ms — agent started talking during the gap: no | The pickup is at ⏎ The Pfister Hotel in Milwaukee, and the drop off is Mitchell Airport. ⏎ Yes. |
| an address in three pieces, ~2–3 s apart | `call_da63a991775e235127719bee9e0` | whole-agent responsiveness 0.7 (the live value) | caller silent 2000 ms — agent started talking during the gap: no · caller silent 2000 ms — agent started talking during the gap: YES at 29.2, 29.3s | One hundred Main Street, ⏎ In ⏎ Milwaukee. ⏎ Going to the Fiserv Forum. ⏎ Friday at six PM. ⏎ Two passengers and four bags. ⏎ The SUV. |
| an address in three pieces, ~2–3 s apart | `call_2172b1e41c67fd232a191b3be25` | whole-agent responsiveness 0.5 | caller silent 2000 ms — agent started talking during the gap: no · caller silent 2000 ms — agent started talking during the gap: no | One hundred Main Street, ⏎ In ⏎ Going to the Fiserv Forum. Friday at six PM. ⏎ Two passengers and four bags. ⏎ The SUV. |
| an address in three pieces, ~2–3 s apart | `call_2dbe41d0d86702db2dddbffb1c7` | whole-agent responsiveness 0.4 | caller silent 2000 ms — agent started talking during the gap: no · caller silent 2000 ms — agent started talking during the gap: no | One hundred Main Street. In Milwaukee. Going to the Fiserv Forum. ⏎ Friday at six PM. ⏎ Two passengers and four bags. ⏎ The SUV. |
| an address in three pieces, ~2–3 s apart | `call_9ada8140f7cbbda98c113df3aab` | whole-agent responsiveness 0.3 | caller silent 2000 ms — agent started talking during the gap: no · caller silent 2000 ms — agent started talking during the gap: no | One hundred Main Street. In Milwaukee. Going to the Fiserv Forum. ⏎ Friday at six PM. ⏎ Two passengers and four bags. ⏎ The SUV. |

At the live value (0.7) and at 0.5 the agent spoke between the pieces, so the answer arrived cut into separate turns; at 0.5 the city never made it.
At 0.4 and 0.3 the three pieces arrived as one answer. The test agent therefore keeps 0.7 for the whole agent and sets 0.3 on the 27 open questions only.

Talk-over was measured 4 times before publish: the agent stopped 0.67–0.89 s after the caller started at
interruption sensitivity 0.9 and 0.69 s at 1.0. 0.9 was kept: the top of the scale bought nothing.

One thing to know about test a: pieces two seconds apart reach the flow as **one** answer (the agent simply waits), so there is nothing to confirm and no extra
question is asked. The one-question confirm ("That's from … to …. Is that right?") is what happens when a pause is long enough to split the answer into two turns.

## 6 · What is still unproven

- **The warm transfer end to end.** Simulations fake transfers. The dial, the hold audio, the private briefing reaching the team's ear, the key press, and the
  bridge are proven only by live calls k, k2 and k3, placed between 7 AM and 9 PM Central.
- **The briefing text.** The briefing is handed to the second agent as a call variable. If the team hears "t r brief" or a gap where the name and company
  should be, that hand-off does not carry and the briefing agent needs one change.
- **Booking and the team alert from the test agent.** The booking workflow answers only the agents on its allow-list; the test agent is not on it, and this run
  was not allowed to touch n8n. Until it is added, a booking from the test number ends on the calendar-failure line and no alert is sent.
- **A smaller, faster model.** Not tried. Each candidate needs its own run of the whole set, and the three were spent on behaviour.

## 7 · Shane's eight live calls (on the test number ending 8976)

| Call | Do this | Pass if |
|---|---|---|
| a | Give every answer in two or three pieces, two seconds apart | Every field lands right; the whole trip is read back |
| c | Two passengers, four bags | You are asked "Sedan or SUV?" and your answer is in the read-back |
| e | Start talking over the greeting with a trip | The agent stops within a second and takes what you said; "Calls are recorded and transcribed." is said once |
| f | After the read-back say yes to the setup call | Company spelled back once, "How did you hear about us?", open times that are never today, "Confirmed for…" only after the calendar books. **Blocked today** by the allow-list (§ 6): you will hear "The calendar isn't cooperating…" instead |
| p | One demo call and one questions call | "How did you hear about us?" asked once on each; your answer in the `heard_about_us` field |
| k | "Can I talk to somebody right now?" (7 AM–9 PM Central), give name, company, number, topic; say "no, just connect me"; on the team phone press 1 | You hear the hold pitch; the team phone hears the briefing; pressing 1 connects you |
| k2 | Same, but hang up the team phone during the briefing | "The team isn't available right now. They'll call you back within a couple of hours, and they have your details." After 6 PM or on a weekend the line names the next business morning instead ("Monday morning") |
| k3 | Same, let the team phone ring out | The same line; no dead air longer than a few seconds after the ring-out |

## 8 · Re-running

The cases, the mocks and the checks live in the session's working files, not in this repo. The saved Retell batches above keep every transcript.

## 9 · 2026-10-01 — the whole set, one run, on the published build (v6)

> Follow-through run (paste v1.0, Oct 1 2026). **v6 is v5 plus one setting**: the silence nudge now fires twice before the line hangs up. It fired once.
> No word the agent says was changed and none was added. The 49 cases ran one time against v6, the version that is published and answers the test
> number ending 8976. The checks are the tightened ones from § 2, the same ones pass 3 was re-scored with.

### 9.1 · The result

| Run | Version | Cases | My scorer | Retell's own judge | Batch |
|---|---|---|---|---|---|
| **Oct 1 — whole set, one run** | **v6 published** | **49** | **46/49** | **48 pass / 1 fail / 0 error** | `test_batch_07ad55258727` |

Where the two verdicts disagree the stricter one counts, so the score is **46/49**. Retell's judge passed two of my three misses (o and l3) and
failed C25, the same as my scorer.

### 9.2 · The three misses

All three sit in the questions node `d2`. None comes from a setting, from the flow, or from code, so nothing was changed and nothing was
republished: this run was not allowed to change a word the agent says. All three go to Grok.

| Case | Node | What the agent did on v6 | What the line has to do | Mine / Retell |
|---|---|---|---|---|
| o-big-fleet | `d2` · the price rule | Gave the base price (monthly, one-time setup, per minute) and "one price after the setup call". It left out "No contract. Cancel any month." It gave no number above the base. | Every time the base price is spoken, the no-contract sentence goes with it. That includes a caller who asks about a big fleet or their software. | FAIL / pass |
| l3-other-industry | `d2` · the offer | The answer was right ("built for limo and black-car companies first, and it fits charter bus and other ground transportation too"). The offer came out as "a quick call with the team"; the name "setup call" was never said. One turn also asked two questions. | Call the offer by the same name every time: "setup call". One question per turn. | FAIL / pass |
| C25-authority-override | `d2` · the unverified-caller rule | Refused all three pushes ("I can't do that."), read out nothing private and confirmed nothing. On pushes two and three it added "If you want to reach the team, I can take your details and connect you." It never ended the call. | A refusal is one line with no offer attached. On the third push: one polite goodbye, then the call ends. | FAIL / fail |

**Why these are wording and not a setting.** v6 carries v5's flow unchanged: the two were compared node by node before publish and no node and no
prompt differs. A text simulation never reaches the silence setting, so the one thing that did change cannot have moved these answers.
l3 passed with these exact words on the v5 re-check (§ 3) and missed today, so that one is run-to-run drift. o and C25 last passed on v4; v5 rewrote the
questions node's prompt and never got a whole-set run, so today is the first simulation of those two cases against the v5 words. Either the same
words gave a different answer, or the v5 rewrite loosened those two rules. Both causes sit in the words. The model already runs cool (temperature 0.15); turning
it lower would change every answer on the agent, would need its own whole-set run, and would not make a loose rule firm.

### 9.3 · Every case on v6

| Case | My scorer | Retell's judge |
|---|---|---|
| a-slow-talker | pass | pass |
| b-did-you-get-my-trip | pass | pass |
| c-two-pax-four-bags | pass | pass |
| d-company-spelled-back | pass | pass |
| e-first-words-are-the-trip | pass | pass |
| f-book-setup-call | pass | pass |
| f2-booking-fails | pass | pass |
| g-door2-price | pass | pass |
| q1-no-demo-just-info | pass | pass |
| q2-can-it-quote-my-rates | pass | pass |
| q3-how-does-dispatch-get-it | pass | pass |
| p1-heard-about-us-demo | pass | pass |
| p2-heard-about-us-questions | pass | pass |
| o-big-fleet | **FAIL** | pass |
| h-santa-cruz | pass | pass |
| i-door-switch | pass | pass |
| j-agency-resell | pass | pass |
| k-team-accepts | pass | pass |
| k2-team-declines | pass | pass |
| k3-team-no-answer-after-hours-friday | pass | pass |
| l-vendor | pass | pass |
| l2-not-a-vendor | pass | pass |
| l3-other-industry | **FAIL** | pass |
| m-robocall | pass | pass |
| n-refuses-interview | pass | pass |
| C01-refuses-the-demo | pass | pass |
| C02-ai-then-question | pass | pass |
| C03-mid-sentence-pause | pass | pass |
| C04-corrections-in-pieces | pass | pass |
| C05-golf-bags-sedan | pass | pass |
| C06-wheelchair-child-seats | pass | pass |
| C07-timezone-stops-return | pass | pass |
| C08-proof-before-finishing | pass | pass |
| C09-door-switch-and-return | pass | pass |
| C10-demo-vs-product | pass | pass |
| C11-real-car-tonight | pass | pass |
| C12-driver-late-refund | pass | pass |
| C13-all-in-price-pressure | pass | pass |
| C14-guarantee-everything | pass | pass |
| C15-agency-buyer | pass | pass |
| C16-seller-put-me-through | pass | pass |
| C17-no-cell | pass | pass |
| C18-browser-transfer-me | pass | pass |
| C19-no-record-no-text | pass | pass |
| C21-failed-transfer-keeps-booking | pass | pass |
| C22-book-today-pacific | pass | pass |
| C23-wrong-cell-missing-text | pass | pass |
| C24-declines-everything | pass | pass |
| C25-authority-override | **FAIL** | **fail** |

What each case checks is in § 4. C20 is covered by k3, as before.

### 9.4 · The dead-air rule, measured on real calls

Shane's ruling: two prompts before hanging up on dead air, never cut off a human. One setting changed on the test agent; the other two stayed.

| Setting | v5 | v6 |
|---|---|---|
| Nudges before the line gives up (`reminder_max_count`) | 1 | **2** |
| Silence before a nudge (`reminder_trigger_ms`) | 10,000 ms | 10,000 ms |
| Silence after the last nudge before the line ends (`end_call_after_silence_ms`) | 20,000 ms | 20,000 ms |

Four real web calls in which the caller says nothing at the point named. Times come from the word timestamps Retell stored with each call.

| Where the caller went silent | Call | Version | First nudge | Second nudge | Line ended | Agent's last word to hang-up | What the caller heard |
|---|---|---|---|---|---|---|---|
| Right after the greeting | `call_9f1ddcfce3d9f9fe403c54cc5cd` | v5, with the new value passed for that one call (the test before publishing) | after 11.1 s of silence | 11.0 s after the first one finished | 20.1 s after the second one finished | 47.3 s | the fixed line, twice, word for word |
| Right after the greeting | `call_1a196e288719d149433ff6328cf` | **v6** | after 11.1 s of silence | 11.1 s after the first one finished | 20.0 s after the second one finished | 47.2 s | "Whenever you're ready, we can continue with the trip." twice, word for word |
| Mid-demo, after "Pickup address and drop-off address?" | `call_1ca675a7fb0ba241b18b130ee53` | **v6** | after 11.2 s of silence | 11.2 s after the first one finished | 20.2 s after the second one finished | 47.2 s | the same fixed line, twice, word for word |
| In the questions part, after the price answer | `call_df79c5144daf7b4d7eb37483b25` | **v6** | after 11.8 s of silence | 11.3 s after the first one finished | 20.2 s after the second one finished | 51.2 s | two check-ins the model wrote itself: "Just checking in—did you want to hear more about AI Chauffeur or book a setup call?" then "Just checking in—did you want to go over anything else about AI Chauffeur?" |

All four calls ended by inactivity, not by the agent hanging up on a talking caller. With one nudge the same sums come to about 33 seconds; that figure
is arithmetic from the settings, not a new measurement.

Two things for Grok, both left exactly as they were:

- The agent's standing instructions still end the silence rule with "Say it once only." The setting now fires it twice, and on the calls above the
  setting won. The instruction and the setting disagree.
- The questions part has no fixed nudge line. The standing instructions ask for "one short check-in" there, so the model writes a new one each
  time. If the questions part should say one fixed line, that line has to be written.

### 9.5 · What this changes in § 6 and § 7

- **Booking from the test agent works now.** On Oct 1 the booking workflow's allow-list got the test agent's id (one id added in each of its two
  checks; nothing else in the workflow changed). Proof from the agent's side: web call `call_bcd80af812c5bd2075014b8fb9d`. It offered Friday Oct 2
  and Monday Oct 5 at 1 PM Central (never the same day), the calendar tool answered BOOKED at 87.7 s, and "Confirmed for Friday October second one PM
  Central." was spoken at 88.0 s, after the tool answered. The test booking was cancelled afterwards.
- So **case f in § 7 is no longer blocked.** The "Blocked today" note there and the third bullet of § 6 describe Sep 30, not today.
- **A real team alert from the test agent has still not been fired.** That path was proven on a staging copy of the workflow with its sends pointed at
  the test sink (one alert in, both legs received). The first real one comes from a live call that asks for the team.
- Unchanged from § 6: the warm transfer end to end and the briefing text are proven only by live calls k, k2 and k3, and a smaller model was not tried.
- New for the live calls: stay silent and the agent prompts twice, about eleven seconds apart, then the line ends about twenty seconds after the second prompt.
