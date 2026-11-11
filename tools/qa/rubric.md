# QA RUBRIC — the house rules both phone lines are graded against

`tools/qa/grade_call.py` sends this file, word for word, to the grading model with every transcript.
Edit the rules here; no code change is needed. Timing (gaps, duration), the greeting byte check and the
recorded-line check are computed in code and handed to the grader as facts. Do not re-judge them.

## The transcript you get

Numbered utterances: `[n] CALLER:` or `[n] AGENT:`. Lines starting `[tool]` are tools the agent ran, with the
result. A text-caller transcript has no timing. Grade only what is in the transcript. Quote words verbatim.

## Rules

**R1 — Answer, then resume.** When the caller asks a question, the agent's very next turn answers it (or says
plainly that the team will answer it) before asking the caller for anything else. A question counts as answered
only if the reply addresses what was asked. Asking the next trip question instead, or repeating the ask without
addressing the question, is a SKIPPED question. Count every caller question, including questions folded into an
answer ("Two people — do you go to O'Hare?") and requests phrased as questions ("Can I talk to somebody?").
NOT questions: a trip request or any statement ("I'd like to book a ride to the airport tomorrow" is a request
the intake handles, not a question); an answer ("Yes.", "Two people."); a tag on the caller's own statement
("…right?", "what do you think?" after a pitch); "hello?" / "are you there?" checks. If the caller hangs up
before the agent's next turn, the question is not skipped — leave it out.

**R2 — One question per turn.** The agent asks for one thing per turn. A fixed bundled trip ask counts as one
ask (examples: "Pickup address, pickup time, and which airport?", "How many passengers and how many bags?",
"What airline, flight number, and landing time?"). Two separate asks in one turn ("What's the date? And how
many bags?") break the rule.

**R3 — Airports by full name.** The agent names an airport by its full name ("Denver International",
"O'Hare International", "Milwaukee Mitchell International"). An airport code spoken aloud (DEN, ORD, M-K-E,
"L-A-X") is an invented-fact finding of kind `airport_code`. The caller saying a code is fine.

**R4 — No rates on the demo.** The agent never quotes or estimates a fare, a trip price, an hourly rate or a
deposit. Stating the product's own monthly price, setup fee or talk-time rate when asked is NOT a rate finding.

**R5 — Nothing booked or confirmed before a tool says so.** The agent never says a trip, time or appointment is
"booked", "confirmed", "scheduled" or "all set" unless a `[tool]` line earlier in the call shows a booking tool
succeeded. Saying the request is captured, taken, or goes to dispatch is fine.

**R6 — No invented facts.** Flag any of these stated as fact: a trip rate (R4); a service area or coverage claim
("we cover all of Texas", "we don't serve Denver"); a claim that it works with or writes into a named software,
CRM or app as a done fact (saying the team checks the caller's software on the setup or Discovery Call is fine);
live availability ("a car is available", "a chauffeur is assigned", "we have an SUV at 6"); an airport code
(R3); any other specific claim (a statistic, a guarantee, a person's name, a phone number the caller did not
give). Kinds: `rate` · `service_area` · `software_integration` · `live_availability` · `airport_code` · `other`.
Statements that match the LINE FACTS below are true and are never findings. A phone number the agent reads back
that matches the CALLER ID fact is the caller's own number, not invented. `[caller]` and `[address]` are masks the
harness puts over names and places: the same mask is the same value, and a masked value is never an invented fact. Times offered right after a
`[tool]` result that returned them are tool-backed, not invented. Every item in a finding list carries `is_finding`:
true only when you are confident it breaks a rule; anything you conclude is fine gets `is_finding: false`.

**R7 — No dead ends.** When the caller hesitates, stalls, trails off, says "I don't know", or goes off track, the
agent gives a way forward (repeats or narrows the ask, offers the choices) instead of ending
the call, going quiet, or answering a half-sentence as if it were complete. A caller left with no next step is a
dead end. NOT dead ends: the caller hanging up by itself; an agent turn that asks a question or offers a
next step (even if the caller then leaves); a skipped question (that is R1 only — do not list it twice).

**R8 — Never re-ask a given field.** Once the caller has given a trip field (date, time, pickup, drop-off,
airport, flight, passengers, bags, vehicle, name, number) the agent does not ask for it again. A read-back
for confirmation is not a re-ask; asking for it as if it were missing is. A caller's correction is not a re-ask.

**R9 — "The team", never "owner".** The agent refers to the team or dispatch. Saying "owner" or naming a
person on our side (staff, founder, a team member) is a finding (`said_owner_or_name`). Addressing the caller by
the caller's own name is fine.

**R10 — Recorded-line notice** (computed in code). Both lines' greetings carry the recorded-line notice; AVA's
must ("This call is recorded").

**R11 — Greeting byte-exact** (computed in code). The first agent words match the line's stored greeting.

**R12 — AIC discovery ladder (added Nov 10 2026, round 7).** Applies to the AIC questions part (the caller asks
about the product, not a sample trip). Findings of kind `ladder`:
- CRITICAL: the same discovery question or topic asked twice (fleet, name/company, software, phones, rates…).
- CRITICAL: a coverage, phones, overflow, after-hours, nights/weekends or missed-calls question after one such
  question was already asked, or after the caller already said how their calls are covered.
- CRITICAL: a coverage, phones or missed-calls question as the first discovery question.
- CRITICAL: a made-up fact about software (a named software "connects", "is connected" or "is confirmed"), rate
  sheets (how many prices it holds), corporate accounts (verified, an account rate) or departments. "It connects at
  setup the way your software allows" and "The team checks it on the Discovery Call" are approved, never findings.
- FAIL: a questions-part agent turn that ends with no question while the caller hasn't ended (except after six
  discovery questions); name and company not asked by the third discovery turn; two separate questions in one
  turn; more than six discovery questions in one call.
Round 8 update (Nov 10 2026): a named software not on the list above (SantaCruz included) gets W-2 the first time and W-2B when asked
again; L8.5 right after such a name is a connection claim (CRITICAL). The questions part asks at most six ladder questions; when they are
used up every turn still ends on a question ("What else can I answer for you?").
Put `"critical": true` on the critical ones in `outcome_note`.

**R13 — AIC round 8 (added Nov 10 2026).** Findings of kind `round8`:
- CRITICAL: the agent reads a phone number aloud (a caller's number included); a price for a trip with an extra stop that is not the
  as-directed minimum the quote tool returned; "booked" before the booking tool said so; the team alert or "The team gets the message."
  after a booking.
- FAIL: a questions-part turn that ends with no question while the caller is still on (a hold's short okay excepted); a quote promised
  ("I'll quote it", "move on to the quote", "next") with no quote in that same turn; the text promised more than once; the same two
  Discovery Call times offered twice; "I can't arrange"; an apology line; L19 or L38 after a goodbye; L41 after a booking; a
  founder line that is not L33 word for word.
- TOOL: a wrong place, miles or a NO_ADDRESS when the town or ZIP was given is the quote tool's, not the agent's (type starts with "TOOL:").

## Outcome — pick one

- `trip_captured` — the caller gave a trip and the agent took it through to the end of the intake (a read-back,
  a "goes to dispatch", or the name/number step), whether or not every field was filled.
- `questions_door` — the call became questions about the product (what it is, how it works, price of the
  product, software, setup), with or without a Discovery / setup call offer or booking.
- `team_path` — the caller asked for a person, the team, a callback, or was transferred (including AVA's
  transfer to the AI Chauffeur demo).
- `abandoned` — the call ended before any of the above: the caller hung up early, went silent, or the agent
  ended it.

When two apply, pick the one the call ended in.

## LINE FACTS — true statements, never findings

- **AIC.** It answers a company's line under the company name, 24 hours a day, one call or a thousand at once.
  It is built for limo and black car first and fits charter bus, shuttle, airport van and other
  ground-transportation companies. It takes the trip, sends dispatch the trip sheet by text and email within about
  a minute, with the call recording and the full transcript, delivered the way the company wants (text, email,
  the company's own trip list, a client login with call history). Price (line L27, said word for word on the demo line): $997 a month;
  with reservation software and CRM connected, $1,697 a month; month to month, no contract; same price for 3 cars or 300. Setup and talk
  time are separate from the monthly price and the team gives both numbers on the Discovery Call; the demo line never says a setup or
  per-minute number. Every company gets a dashboard in its own colors with its name (every call, the recording, the transcript), included.
  Setup takes about 14 to 15 days. The reservation software it writes into is connected at setup the way that software allows (Limo
  Anywhere, FASTTRAK, Moovs, Livery Coach, GNet, Hudson, LimoExpress, A to Z Dispatch, RideBits); any other name, SantaCruz included, is
  not confirmed and the team checks it. Flight tracking is an add-on, and "We'll be tracking the flight." on a sample quote with a
  flight number is an approved line, never an invented fact.
  Multi-language is an add-on. It picks the vehicle class from passengers and bags. The team can be connected live 7 AM to 9 PM Central
  or calls back within a couple of hours during business hours (8 AM to 6 PM Central, seven days a week); the Discovery Call is 20 minutes, any day, today included when the time is at least three hours out (the calendar's own buffers decide which times are open). The site is aichauffeur.ai.
- **AVA.** It answers every call, 24/7, answers questions, qualifies the caller, books the job or appointment on
  the business's calendar and sends the details to the team. $497 a month is the base price; there is a
  one-time setup fee and 65 cents a minute of talk time; "you get the full price in writing before you start".
  The setup call with the team is fifteen minutes. The standard setup answers and books; other software or CRM
  connections are confirmed by the team. Limousine and black-car operators can be transferred to the AI
  Chauffeur demo.

## Line notes

- **AIC (414-775-0019, AI Chauffeur demo).** The caller plays a customer booking a trip. A question about a
  real-world fact the trip needs (which airport serves a city) must be answered (R1), with the full name (R3).
  The product's price, the software question and "can I talk to somebody" each have a ruled path; reaching it
  is not a finding, skipping the question is.
- **AVA (414-240-8930).** A sales line for service businesses. A limousine or black-car operator should be
  offered the transfer to the AI Chauffeur demo; note in `outcome_note` whether that offer was made when the
  caller runs a limo company.
