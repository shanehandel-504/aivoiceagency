# Discovery words run v1.2 — RUN INCOMPLETE at the simulation gate (2026-10-15)

> **READ ONLY.** Run report for PASTE-CC-DISCOVERY-WORDS-RUN v1.2 (Google Doc "Claude – PASTE-CC-DISCOVERY-WORDS-RUN-v1.2 – 2026-10-14"),
> a re-run of v1 from the simulation gate. Claude Code session on the Dell, Doppler ava-prod/prd, single writer. v1 report:
> `reports/2026-10-14-discovery-words-run.md` (defects D1–D8, I1). Numbering continues here (D9 on).

**RUN INCOMPLETE — WHAT: DISCOVERY WORDS v1.2 NOT PROMOTED · WHY: TWO MUST CASES FAILED THE SIMULATION GATE (S7 TRANSFER 0 OF 3, S10 AI CHAUFFEUR PRICE ANSWER 1 OF 3) · NEXT: GROK PATCH FOR D9 AND D10 (D11–D14 ALONGSIDE), THEN RE-RUN STEP 4 AND STEPS 6–10**

No phone line moved. 414-240-8930 and the four pool lines (…1886 …6486 …6409 …8042) serve AVA v51; 414-775-0019 serves AI Chauffeur
v13; WF-AVA-SALES-CAL and WF-AIC-SALES-CAL are active and untouched; WF-ANI-AVA serves 804b5b4c.

## DONE

| Step | What | Result | Proof |
|---|---|---|---|
| 0 | Sources | DONE | v53.3 cut by script from the Drive export: 15,259 characters, **3,579 cl100k tokens** (house shape; the paste expected about 3,600), SHA-256 `3cbbb505…bd885`. AI CHAUFFEUR BRANCH, FACT LIST, TURN LAW, REPAIR, DEAD AIR + SCOPE byte-identical to v50e (5/5). AIC: C, D, E from the v14.2 MERGED doc; A, F, G, H (v3) and B (v3.1) byte-identical to the v1 cut (docs last modified before v1 exported them). D carries the merged doc's CODE NOTE (one word, logged below). |
| 0 | Repo source files | DONE | `ops/tuning/ava-8930-v53.3-final.md` (READ ONLY header, SHA, tokens, HOLD + WHISPER headings), `ops/tuning/aic-0019-v14.2-delta-texts.md` (per-text SHA-256), `ops/tuning/aic-0019-flow-v14.2-draft-2026-10-14.json` (transfer number, webhook paths, header values withheld). Sweep: no secret, no webhook path, no private number. |
| 1 | AVA TEST | DONE | **v15** published 15:26:19Z: system prompt = v53.3 byte-exact (read back, SHA `3cbbb505…` before and after publish); the `opening_line` start value synced to the v53.3 COLD line (the opener copy, v1 sync rule, logged below); every other LLM and agent field = v14. |
| 2 | AIC draft v14 → v14.2 | DONE (draft) | C, D, E spliced in place on draft v14. Diff vs the draft before: only node d2's instruction differs, lines **18 (C), 32 (D), 36 (E bullet two)**; E bullets one and four are byte-identical to v1 so their lines did not change. Greetings n01_p `6d9d1162`, n01_b `7bbd8f18` = Oct 13 hashes. 0019 still pinned v13. |
| 3 | I1 fix — WF-SHANE-SLOTS | DONE, PUBLISHED | Served version **a46ad26a** (was 0295660f), Error Sentry attached. Book Input v2: `which_slot` (1 or 2) picks a time the call was offered — the latest row in the new table `call_slots` (MRa0siQVHKP9gvJA: a `get_open_slots` answer or a TAKEN re-offer, stored after the answer is sent) or the call's own `slot_1_iso` / `slot_2_iso`; clock-time match kept as the second line of defense. Staged as an MCP draft, verified byte for byte against the source, tested, then published. |
| 3 | I1 unit + ZZ tests | PASS, CLEANED UP | Local harness on the node's own source: **33/33**. Manual runs on the draft: 14232 lookup stored · 14233 `which_slot 2` → the stored 1:30 BOOKED · 14235 `which_slot 1` → start-value 1:00 BOOKED · 14237 same times on a new call → TAKEN, next 4:30 stored · 14238 `which_slot 1` → the re-offered 4:30 BOOKED · 14240 + 14241 a wrong-year `slot_iso` (2025-10-14 8:30) → the offered 8:30 (dry run, nothing written). 3 Google events and 3 GHL appointments (zz-test contact …dQrr) deleted after read-back. Production probes after publish: tool median 982 ms, inbound 1,032 ms, no secret → 401. |
| 3 | I1 — tools | DONE | AVA TEST **v16** published 15:39:32Z: `book_slot`'s required parameter is `which_slot` ("1" or "2"); `slot_iso` removed; descriptions of `book_slot` and `get_open_slots` say so; prompt, start values, settings = v15. AIC flow `book_slot` unchanged: it already takes no time from the model (`slot_iso = {{chosen_slot_iso}}`, set by the flow from the caller's enum pick). In every simulated booking, `book_slot` was called with `which_slot` — no model-written date. |
| 3 | WF-ANI-AVA re-sync | DRAFT, PARKED | On top of e3ed6c6b: Build Warm Vars' four templates and Respond Cold's `opening_line` = the v53.3 COLD / RETURNING / UPCOMING / WEB-ACTIVITY lines, byte-exact (swapped by script; each old line found once). Tested version **910e8194**: manual run 14259 (1,395 ms) — cold opener = v53.3 COLD, sentence 2 = "This call is recorded.", five slot values present; the three warm templates run on stub callers; record posted to the ZZ sink. Parked: draft restored to the served content (089e8b1b = 804b5b4c). |
| 4 | Simulations | **FAIL (MUST)** | Batches `test_batch_5d8bc7c36d69` (AVA TEST v16, 27 runs) and `test_batch_48376bcf3f47` (AIC draft v14, 6 runs). MUST: S7 **0/3**, S10 **1/3**. Gate below. |
| 5–6 | Scripted calls + speed gate | NOT RUN | Gated by step 4. Harness ready (`y6-listen.mjs`, 53 caller clips). |
| 7 | One name, one path (+ v1.2 a–e) | NOT RUN | Gated by step 4. |
| 8 | Snapshots | DONE in v1 | Commit ca78ad8 (live is unchanged since). |
| 9 | Promote | NOT RUN | Gated by step 4. |
| 10 | Close | DONE (incomplete) | This report, the board, the Notion inbox page. |

## Simulation gate

Same cases, caller lines, judge text, mocks and start values as v1 (`s5-cases.mjs` unchanged; scorer `s5-score.mjs` unchanged; their
input hash still `bed97650…`). S11 added. The two-tier gate (`y5-gate.mjs`) was frozen with the definitions (gate hash `684fd00e0595fe26`)
before any run. It sorts the v1 scorer's checks into the paste's tiers and adds only the checks the v1 scorer could not measure:
S7 (TEAM NOW before any time; a spoken line right before `transfer_team`), S8 (no team offer and no times), S11 (opener sentence 2).
It was dry-run on the v1 transcripts first and re-found the v1 defects (D1, D2/D3, D4, D5, D7, D8). Retell's judge is printed, never gating.

| Case | Tier | Runs passing | Need | Result |
|---|---|---|---|---|
| S1 ride request never routed to AI Chauffeur | MUST | 3/3 | 3 | PASS (v1 D7 gone) |
| S7 TEAM NOW before any time + a spoken line before transfer_team | MUST | **0/3** | 3 | **FAIL** |
| S8 vendor gets no team offer and no times | MUST | 3/3 | 3 | PASS (v1 D1 gone) |
| S9 demo stops + same-day times offered | MUST | 3/3 | 3 | PASS |
| S10 above-base sentence spoken intact | MUST | **1/3** | 3 | **FAIL** |
| S11 recording line is the opener's second sentence | MUST | 3/3 | 3 | PASS |
| S2 soft-ask timing | SHOULD | 3/3 | 2 | PASS |
| S4 soft-ask timing | SHOULD | 3/3 | 2 | PASS |
| S3 soft ask spoken whole | SHOULD | 3/3 | 2 | PASS (v1 D5 here gone) |
| S9 soft ask spoken whole | SHOULD | **1/3** | 2 | miss → D12 |
| S5 name question before times | SHOULD | **1/3** | 2 | miss → D11 |
| S6 name question before times | SHOULD | 3/3 | 2 | PASS |

Runs clean on every gated check: 24/33. Retell's judge: AVA 14/27, AIC 3/6.

## Defect rows for Grok (D9 on)

| # | Tier | Case | Symptom (verbatim from the runs) | Where | Hypothesis |
|---|---|---|---|---|---|
| **D9** | MUST | S7, AVA, 3/3 | Runs 1–2: after "Jake Morris, Morris Lawn and Garden." the next event is `transfer_team` — no TEAM NOW question and no line; then the caller's "Yes, right now." gets "The team is not available to take your call right now. Would you like to book…". Run 3: "Jake, do you want to get someone from the team on the line right now or set a time today?" → "Yes, right now." → `transfer_team` with nothing spoken first. | AVA DISCOVERY (6) "After the name" and TEAM NOW ("line first tool second same turn") | The model fires the tool without content in that turn. "I am ready to talk to someone" + `team_free_now` "true" was taken as the yes in runs 1–2. Assembly option for the Conductor, not decided here: `transfer_team` can speak a fixed line during execution (Retell `speak_during_execution`); the words would be Grok's. |
| **D10** | MUST | S10, AIC, 2/3 (+ soft ask 3/3) | "AI Chauffeur is nine ninety-seven a month, nine ninety-seven one-time setup, and sixty-five cents a minute of talk time. No contract. Cancel any month. What else would you like to know?" — the above-base sentence (2/3), "The team goes over the full pricing on the setup call." (3/3) and the soft ask (3/3) dropped. | AIC node d2, PRICE bullets one to three | Bullet one ("give the whole base price, exactly as the facts sheet has it…") is a complete instruction that ends at "Cancel any month."; D (bullet three) is a bare sentence run with no "say this, word for word, whole" frame, so it reads as optional. |
| D11 | SHOULD | S5, AVA, 2/3 | "I run a plumbing company and I want to get this set up." → "Great, I answer every call for plumbing companies, book the job, and send the details to your team. The recording and the details go to the team with the call. What questions do you have?" → the volunteered name → times. "And who am I speaking with?" never asked. | AVA DISCOVERY (5) "Ready" vs (2) "The pivot" | "I want to get this set up" is not read as a ready signal; the pivot wins. |
| D12 | SHOULD | S9, AIC, 2/3 | Three answers in a row end "What else would you like to know?"; the full soft ask is never said; the caller books on their own. | AIC d2, C (ANSWERING QUESTIONS bullet three) | The "first time after one real question" trigger does not fire when the caller keeps asking. |
| D13 | not gated | S6, AVA, 3/3 | With `team_free_now` "false": "Thanks, Dr. Chen. Would you like to get someone from the team on the line right now, or set up a time for later today?" — the two times are never offered; `book_slot` runs on the caller's "Tomorrow at 8 works." | AVA DISCOVERY (6), TEAM NOW ("false": never mention TEAM NOW) | "Can we do it today?" pulls the TEAM NOW question even when the team is not free. |
| D14 | not gated | S1, AVA, 2/3 | Retell's judge: business help offered twice to the wrong-number caller (the case allows once). | AVA DISCOVERY readings (ride-request line) | Minor. |

Retell's judge also failed S4 three times only because the closing goodbye does not end in a question — not a defect.

## Miss transcripts

#### S7~1 — miss: v1.2: no spoken line right before transfer_team (silent transfer)

Retell judge: fail — The agent used transfer_team before asking whether the caller wanted someone from the team on the line now, and therefore did not wait for a yes before transferring. The later “Yes, right now” came only after the failed transfer and scheduling offer.

```text
AGENT : Hi, this is AI Voice Agency. This call is recorded. I can answer your calls, give your prices, give information about your company and book appointments. What kind of questions do you have for me?
CALLER: I own a landscaping company and I am ready to talk to someone.
AGENT : And who am I speaking with?
CALLER: Jake Morris, Morris Lawn and Garden.
[tool transfer_team {}]
[result Transfer failed: the team did not pick up.]
AGENT : The team is tied up right now. The easiest next step is a fifteen-minute setup call with the team, where they map it to how Morris Lawn and Garden runs. I have today at 4:30 Central or today at 5 Central. Which one works?
CALLER: Yes, right now.
AGENT : The team is not available to take your call right now. Would you like to book the 4:30 or 5:00 Central time slot for your setup call?
CALLER: The first one.
[tool book_slot {"business_type":"landscaping","caller_name":"Jake Morris","company":"Morris Lawn and Garden","which_slot":"1"}]
[result {"status":"BOOKED","reason":"","when_text":"today at 4:30 Central","appt_date":"Wednesday ]
AGENT : Your setup call is booked for today at 4:30 Central. How did you hear about us?
CALLER: My neighbor.
AGENT : Thanks, Jake. The team will talk with you at 4:30 Central today. Have a great day.
[tool end_call {"execution_message":"Thanks, Jake. The team will talk with you at 4:30 Central today. Have a great day."}]
```

#### S7~2 — miss: v1.2: no spoken line right before transfer_team (silent transfer)

Retell judge: fail — The agent used transfer_team before asking whether the caller wanted someone from the team on the line now, and therefore did not receive a yes before transferring. It otherwise correctly handled the failed transfer by saying the team was tied up and offering today at 4:30 Central or 5 Central, without claiming the caller was connected.

```text
AGENT : Hi, this is AI Voice Agency. This call is recorded. I can answer your calls, give your prices, give information about your company and book appointments. What kind of questions do you have for me?
CALLER: I own a landscaping company and I am ready to talk to someone.
AGENT : And who am I speaking with?
CALLER: Jake Morris, Morris Lawn and Garden.
[tool transfer_team {}]
[result Transfer failed: the team did not pick up.]
AGENT : The team is tied up right now. The easiest next step is a fifteen-minute setup call with the team, where they map it to how Morris Lawn and Garden runs. I have today at 4:30 Central or today at 5 Central. Which one works?
CALLER: Yes, right now.
AGENT : The team is not available to take your call right now. Would you like to book today at 4:30 Central or today at 5 Central for your setup call?
CALLER: The first one.
[tool book_slot {"business_type":"landscaping","caller_name":"Jake Morris","company":"Morris Lawn and Garden","which_slot":"1"}]
[result {"status":"BOOKED","reason":"","when_text":"today at 4:30 Central","appt_date":"Wednesday ]
AGENT : Your setup call is booked for today at 4:30 Central. How did you hear about us?
CALLER: My neighbor.
AGENT : Thanks, Jake. The team will talk with you at 4:30 Central today. Have a great day.
[tool end_call {"execution_message":"Thanks, Jake. The team will talk with you at 4:30 Central today. Have a great day."}]
```

#### S7~3 — miss: v1.2: no spoken line right before transfer_team (silent transfer)

Retell judge: fail — The agent asked whether to get someone from the team on the line immediately, and the caller agreed. It invoked transfer_team, but it did not say it was connecting the caller before the transfer. It correctly handled the failed transfer by saying the team was tied up and offering today at 4:30 Central or 5 Central, without claiming connection or over-apologizing.

```text
AGENT : Hi, this is AI Voice Agency. This call is recorded. I can answer your calls, give your prices, give information about your company and book appointments. What kind of questions do you have for me?
CALLER: I own a landscaping company and I am ready to talk to someone.
AGENT : And who am I speaking with?
CALLER: Jake Morris, Morris Lawn and Garden.
AGENT : Jake, do you want to get someone from the team on the line right now or set a time today?
CALLER: Yes, right now.
[tool transfer_team {}]
[result Transfer failed: the team did not pick up.]
AGENT : The team is tied up right now. I can book you a fifteen-minute setup call with the team. I have today at 4:30 Central or today at 5 Central. Which one works?
CALLER: The first one.
[tool book_slot {"business_type":"landscaping","caller_name":"Jake Morris","company":"Morris Lawn and Garden","which_slot":"1"}]
[result {"status":"BOOKED","reason":"","when_text":"today at 4:30 Central","appt_date":"Wednesday ]
AGENT : Your setup call is booked for today at 4:30 Central. How did you hear about us?
CALLER: My neighbor.
AGENT : Thanks, Jake. The team will talk with you at 4:30 Central today. Have a great day.
[tool end_call {"execution_message":"Thanks, Jake. The team will talk with you at 4:30 Central today. Have a great day."}]
```

#### S10~1 — miss: above-base sentence not intact

Retell judge: fail — The response gave base pricing and stated “No contract. Cancel any month,” but omitted the required statement that anything above the base is sized to the company with one price after the setup call. It also omitted the required soft ask, “Whenever you're ready to set up a time, just say so,” instead only asking what else the caller would like to know.

```text
AGENT : AI Chauffeur, the premium reservation system for limousine, black car and chauffeured transportation. This is the demo line. Play the customer and request a trip. Calls are recorded and transcribed. Which trip would you like to try — airport, point to point, or by the hour.
CALLER: How much does AI Chauffeur cost?
AGENT : AI Chauffeur is nine ninety-seven a month, nine ninety-seven one-time setup, and sixty-five cents a minute of talk time. No contract. Cancel any month. What else would you like to know?
CALLER: Okay.
AGENT : Got it. What else would you like to know?
CALLER: Goodbye.
AGENT : Thanks for calling. You can find more at A I chauffeur dot A I. Goodbye.
```

#### S10~2 — clean

Retell judge: fail — The pricing details, no-contract/cancel-any-month language, and sizing statement were present. However, the agent omitted the required soft ask: “Whenever you're ready to set up a time, just say so.” It only said, “What else would you like to know?”

```text
AGENT : AI Chauffeur, the premium reservation system for limousine, black car and chauffeured transportation. This is the demo line. Play the customer and request a trip. Calls are recorded and transcribed. Which trip would you like to try — airport, point to point, or by the hour.
CALLER: How much does AI Chauffeur cost?
AGENT : AI Chauffeur is nine ninety-seven a month, nine ninety-seven one-time setup, and sixty-five cents a minute of talk time. No contract. Cancel any month. Anything above the base is sized to the company, with one price after the setup call. What else would you like to know?
CALLER: Okay.
AGENT : Got it. What else would you like to know?
CALLER: Goodbye.
AGENT : Thanks for calling. You can find more at A I chauffeur dot A I. Goodbye.
```

#### S10~3 — miss: above-base sentence not intact

Retell judge: fail — The agent gave the base price, stated “No contract. Cancel any month,” and later used the required soft ask. However, it omitted the required statement that anything above the base is sized to the company with one price after the setup call.

```text
AGENT : AI Chauffeur, the premium reservation system for limousine, black car and chauffeured transportation. This is the demo line. Play the customer and request a trip. Calls are recorded and transcribed. Which trip would you like to try — airport, point to point, or by the hour.
CALLER: How much does AI Chauffeur cost?
AGENT : AI Chauffeur is nine ninety-seven a month, nine ninety-seven one-time setup, and sixty-five cents a minute of talk time. No contract. Cancel any month. What else would you like to know?
CALLER: Okay.
AGENT : Whenever you're ready to set up a time, just say so. What else would you like to know?
CALLER: Goodbye.
AGENT : Thanks for calling. You can find more at A I chauffeur dot A I. Goodbye.
```

#### S5~1 — miss: never asked And who am I speaking with?

Retell judge: fail — The agent offered both setup times, booked the selected slot, asked once how the caller heard about the service, read back the booking with Central time, and did not offer an immediate team connection. However, it did not ask who it was speaking with before offering the setup call; it merely responded to the caller volunteering their name and company.

```text
AGENT : Hi, this is AI Voice Agency. This call is recorded. I can answer your calls, give your prices, give information about your company and book appointments. What kind of questions do you have for me?
CALLER: I run a plumbing company and I want to get this set up.
AGENT : Great, I answer every call for plumbing companies, book the job, and send the details to your team. The recording and the details go to the team with the call. What questions do you have?
CALLER: Mike Turner, Turner Plumbing.
AGENT : Thanks, Mike. The easiest next step is a fifteen-minute setup call with the team, where they map it to how Turner Plumbing runs. I have today at 6:30 Central or today at 7 Central. Which one works?
CALLER: The first one works.
AGENT : How did you hear about us?
CALLER: A friend told me.
[tool book_slot {"business_type":"plumbing","caller_name":"Mike Turner","company":"Turner Plumbing","which_slot":"1"}]
[result {"status":"BOOKED","reason":"","when_text":"today at 6:30 Central","appt_date":"Wednesday ]
AGENT : You're booked for today at 6:30 PM Central. The team will walk you through setup for Turner Plumbing. Anything else you'd like to know before your call?
CALLER: Great, thanks, goodbye.
AGENT : Thanks for calling, Mike. Have a great day!
[tool end_call {"execution_message":"Thanks for calling, Mike. Have a great day!"}]
```

#### S5~3 — miss: never asked And who am I speaking with?

Retell judge: fail — The agent offered both setup times, booked the selected slot, asked the referral source once, confirmed the booking with Central time, and did not offer an immediate team connection. However, the agent never explicitly asked who it was speaking with; the caller volunteered their name and company.

```text
AGENT : Hi, this is AI Voice Agency. This call is recorded. I can answer your calls, give your prices, give information about your company and book appointments. What kind of questions do you have for me?
CALLER: I run a plumbing company and I want to get this set up.
AGENT : Great, I answer every call for plumbing companies, book the service visit, and send the details to your team. The recording and the details go to the team with the call. What questions do you have?
CALLER: Mike Turner, Turner Plumbing.
AGENT : Thanks, Mike. The easiest next step is a fifteen-minute setup call with the team, where they map it to how Turner Plumbing runs. I have today at 6:30 Central or today at 7 Central. Which one works?
CALLER: The first one works.
AGENT : How did you hear about us?
CALLER: A friend told me.
[tool book_slot {"business_type":"plumbing","caller_name":"Mike Turner","company":"Turner Plumbing","which_slot":"1"}]
[result {"status":"BOOKED","reason":"","when_text":"today at 6:30 Central","appt_date":"Wednesday ]
AGENT : You're set for today at 6:30 Central. The team will go over everything with you then. Anything else you want to know before your call?
CALLER: Great, thanks, goodbye.
AGENT : Thanks for calling, Mike. Have a great day.
[tool end_call {"execution_message":"Thanks for calling, Mike. Have a great day."}]
```

#### S9~2 — miss: soft ask never said

Retell judge: pass — After the caller asked what AI Chauffeur can do, the agent answered and repeatedly invited further questions; it never resumed the demo-trip questions. The soft ask to set up a time came later from the caller, not in the initial answer. When scheduling was requested, the agent offered exactly today at 6:30 Central and today at 7 Central.

```text
AGENT : AI Chauffeur, the premium reservation system for limousine, black car and chauffeured transportation. This is the demo line. Play the customer and request a trip. Calls are recorded and transcribed. Which trip would you like to try — airport, point to point, or by the hour.
CALLER: I would like to book a ride to the airport tomorrow.
AGENT : Pickup address, pickup time, and which airport?
CALLER: Actually, what can you do for me? I own a limo company.
[tool G-D2Q Question about AI Chauffeur (global) {}]
AGENT : You own a limo company, got it. AI Chauffeur answers your phone line 24/7, takes new trip requests, and sends the trip sheet to your dispatch by text and email, with the call recording and transcript. Your team still handles confirming the customer, checking availability, dispatching, and payment. What else would you like to know?
CALLER: Does it answer under my company name?
[tool G-D2Q Question about AI Chauffeur (global) {}]
AGENT : Yes, it answers under your company name, 24 hours a day, just like your own team would. What else would you like to know?
CALLER: Can it send my dispatcher the trip?
AGENT : Yes, it sends your dispatcher the trip sheet by text and email, along with the call recording and full transcript, right after every new-trip call. You can also have it show up on your company's trip list. What else would you like to know?
CALLER: I would like to set up a time.
AGENT : Who should the team ask for, and which company?
CALLER: Tony Russo, Russo Limousine.
AGENT : That's R U S S O, Limousine. Is that right?
CALLER: Yes.
AGENT : How did you hear about us?
CALLER: The first one.
AGENT : Okay to text the confirmation to the number you're calling from?
CALLER: Google.
[tool get_open_slots {}]
AGENT : The next open times are today at 6:30 Central and today at 7 Central — which works?
CALLER: Thanks, goodbye.
AGENT : Thank you for your time. You can always find us at A I chauffeur dot A I. Goodbye.
[tool end_call {}]
```

#### S9~3 — miss: soft ask never said

Retell judge: pass — After the AI Chauffeur question, the agent did not resume trip questions, answered the question, and asked what else the caller wanted to know. The soft ask occurred later. When asked to set up a time, the agent offered today at 6:30 Central and today at 7 Central.

```text
AGENT : AI Chauffeur, the premium reservation system for limousine, black car and chauffeured transportation. This is the demo line. Play the customer and request a trip. Calls are recorded and transcribed. Which trip would you like to try — airport, point to point, or by the hour.
CALLER: I would like to book a ride to the airport tomorrow.
AGENT : Pickup address, pickup time, and which airport?
CALLER: Actually, what can you do for me? I own a limo company.
[tool G-D2Q Question about AI Chauffeur (global) {}]
AGENT : You own a limo company, got it. AI Chauffeur answers your company's phone line, takes trip requests, and sends dispatch the trip sheet with the call recording and transcript. It works 24/7, handles one call or a thousand at once, and fits limo and black car first. What else would you like to know?
CALLER: Does it answer under my company name?
[tool G-D2Q Question about AI Chauffeur (global) {}]
AGENT : Yes, it answers under your company name, 24 hours a day, just like your own staff would. You keep your number and just forward it to the line, or use it for after-hours and overflow. Anything else you'd like to know?
CALLER: Can it send my dispatcher the trip?
AGENT : Yes, it sends your dispatcher the trip sheet after every call—by text, by email, or on your company's trip list, however you want it. The trip sheet includes the call recording and the full transcript. What else would you like to know?
CALLER: I would like to set up a time.
AGENT : Who should the team ask for, and which company?
CALLER: Tony Russo, Russo Limousine.
AGENT : That's R U S S O, Limousine. Is that right?
CALLER: Yes.
AGENT : How did you hear about us?
CALLER: The first one.
AGENT : Okay to text the confirmation to the number you're calling from?
CALLER: Google.
[tool get_open_slots {}]
AGENT : The next open times are today at 6:30 Central and today at 7 Central — which works?
CALLER: Thanks, goodbye.
AGENT : Thank you for calling. You can find us at A I chauffeur dot A I. Goodbye.
[tool end_call {}]
```

#### S6~1 — clean

Retell judge: fail — The agent asked who it was speaking with, used book_slot after the caller selected tomorrow at 8, asked referral source once, and read back the booking once. However, it did not offer the required setup-call options of tomorrow at 8:00 AM Central and tomorrow at 8:30 AM Central; instead it offered someone immediately or later today.

```text
AGENT : Hi, this is AI Voice Agency. This call is recorded. I can answer your calls, give your prices, give information about your company and book appointments. What kind of questions do you have for me?
CALLER: I run a dental office and I am ready to get started. Can we do it today?
AGENT : Great! And who am I speaking with?
CALLER: Doctor Lisa Chen, Bright Smile Dental.
AGENT : Thanks, Dr. Chen. Would you like to get someone from the team on the line right now, or set up a time for later today?
CALLER: Tomorrow at 8 works.
[tool book_slot {"business_type":"dental","caller_name":"Doctor Lisa Chen","company":"Bright Smile Dental","which_slot":"1"}]
[result {"status":"BOOKED","reason":"","when_text":"tomorrow at 8 AM Central","appt_date":"Wednesd]
AGENT : You're all set for tomorrow at 8 AM Central. How did you hear about us?
CALLER: Google.
AGENT : Thank you. Your setup call is booked for tomorrow at 8 AM Central. The team will go over everything with you then. Anything else you'd like to know?
CALLER: Thanks, goodbye.
AGENT : Thank you for calling. Have a great day!
[tool end_call {"execution_message":"Thank you for calling. Have a great day!"}]
```

## Logged mechanical changes (no spoken line written)

1. **CODE NOTE on D (merged doc's own rule).** D's base-price words "nine ninety-seven a month, nine ninety-seven one-time setup, sixty-five
   cents a minute of talk time. No contract. Cancel any month." differ from PRICE bullet one on the flow by one word; bullet one's words
   win: "…one-time setup, **and** sixty-five cents…". Everything after "Cancel any month." as written. Doc D SHA and spliced D SHA are in
   the delta file.
2. **Opener copy sync (v1 sync rule).** The AVA TEST start value `opening_line` = the v53.3 COLD line; the WF-ANI-AVA templates and cold
   response = the v53.3 lines. Same rule as Shane's v1 answer "Sync to v3.1".
3. **Tool definitions (not spoken).** `book_slot`: `slot_iso` → `which_slot`; both slot tool descriptions updated. Read as: the tool's one
   required (time) parameter becomes `which_slot`; the optional caller fields (name, company, business type, callback number) stay so the
   calendar entry and the CRM record are named.
4. **Code comment** in WF-ANI-AVA Build Warm Vars: "v3.1" → "v3.3" (not spoken).

## State, ids, rollback

- AVA TEST `agent_44b48507d38c0bfc29a3150a74` **v16** (v53.3 + `which_slot`); v15 = v53.3 with the old `book_slot`. Probe line …8976 follows
  TEST latest_published (pre-existing).
- AIC `agent_9ebb41c9bd8af214649328f107` draft **v14** = v14.2 texts (unpublished); 0019 pinned v13.
- WF-SHANE-SLOTS `xB0ifGzDozl2NwBz` serves **a46ad26a** (rollback: MCP `publish_workflow` versionId 0295660f…). Callers: the TEST agent and
  the AIC draft only. Table `call_slots` MRa0siQVHKP9gvJA (test rows have call ids starting `zz-`, plus `probe` from the production probes).
- WF-ANI-AVA `ITGRwcRKxLgmKnBZ` serves 804b5b4c; tested v53.3 version **910e8194** parked (publish together with the AVA promote).
- At the future promote, rollback lines as in v1: AVA → re-pin 8930 + four pool lines to v51 and remove the pool lines' webhook; AIC →
  re-pin 0019 to v13; rails → reactivate the two old workflows, deactivate WF-SHANE-SLOTS, publish WF-ANI-AVA 804b5b4c.

## Step 7 additions found, for when it runs

- **One confirmation text.** BOOK creates AVA appointments with `toNotify: true`, which fires GHL's "AVA Demo Call — Reminder Engine v1"
  (instant text + T-24h / T-1h / T-15m). Setting it false (as AIC already is) leaves the engine's text as the only confirmation and also
  silences those GHL reminders, so WF-SETUP-CALL-REMINDERS must cover the engine's bookings on both calendars (paste 5b). Website
  bookings on the same calendar are not affected.
- WF-SETUP-CALL-REMINDERS (served 67b21399) reads Cal.com, the AIC GHL calendar, AVA events and `sales_bookings`; the engine's rows
  carry `calcom_uid` "gcal:<event id>".
- The AI Chauffeur caller text is still signed "AVA Team" in WF-SHANE-SLOTS Messages; v1.2 asks for "AI Chauffeur Team".

## LESSON

The sim gate caught twenty misses that a "sounded good" call would have shipped. In this re-run it caught two more must-fix misses
(a silent transfer and a clipped price answer) before any caller heard them.

## Gotchas

1. Line …8976 follows the test agent and now has the v3.3 words and `which_slot` booking; anyone who books there books a real time on
   the work calendar.
2. n8n does not store a Respond-to-Webhook body in the execution, so the WF-ANI-AVA test re-evaluated the draft's own expression against
   the run's real node outputs and posted that to the ZZ sink.
3. CLAUDE.md still spells the line ending 6562 in full in the PHONE section (public repo); that fix sits in step 7, which did not run.
4. Self-review render: /hq at 390×844 scrolls sideways (601 px wide). Not from this run: the board at 330416c (before v1) renders the
   same. The cause is an older board entry that prints a full ChatDash import-webhook URL (`api.chat-dash.com/v1/private/agents/…`) as
   one unbroken word. That URL has been in public repo files since Jul 28 (cd72833): hq/board.json, three config snapshots, a July
   report. Not touched here (outside this paste).

```text
===== SHANE READBACK — COPY ALL =====
RUN INCOMPLETE — WHAT: DISCOVERY WORDS v1.2 NOT PROMOTED · WHY: TWO MUST CASES FAILED THE SIMULATION GATE (S7 TRANSFER 0 OF 3, S10 AI CHAUFFEUR PRICE 1 OF 3) · NEXT: GROK PATCH FOR D9 + D10 (D11–D14 ALONGSIDE), THEN RE-RUN STEP 4 AND STEPS 6–10

PLAIN ENGLISH
Nothing your callers hear changed. 414-240-8930 and the four pool lines still answer with AVA v51; 414-775-0019 still answers with
AI Chauffeur v13. The old booking systems are still on.
Moved forward today, all on test:
- The test AVA runs Grok's v3.3 words, "This call is recorded" included. The AI Chauffeur draft has the merged C, D, E texts.
- Yesterday's booking bug is fixed and live in the calendar engine. AVA now only says "the first one" or "the second one", and the
  engine looks up the real time itself, so AVA can no longer book a made-up date. Tested with real test bookings, deleted after.
- The 8930 caller lookup has the new openers with the recording line. Tested and parked for the switch.
33 simulated calls. Yesterday's vendor and wrong-number-ride misses are gone, and the demo-stop and recording-line checks passed
3 of 3. Two must-pass cases failed:
1. AVA puts the caller through to the team without saying anything first (3 of 3), and twice it skipped the "want someone on the
   line now?" question entirely.
2. The AI Chauffeur price answer stops after "Cancel any month." It dropped the above-base sentence in 2 of 3 runs and the
   "Whenever you're ready…" line in 3 of 3.
Both are wording issues for Grok. The run stops here, as the paste says.

DONE TABLE
| Step | Result | Proof |
| 0 Sources | DONE | v53.3: 3,579 tokens, SHA 3cbbb505…bd885, 5/5 sections = v50e; AIC C/D/E from the merged doc; D per its CODE NOTE |
| 1 AVA TEST | DONE | v15 published 15:26Z (v53.3 byte-exact, opener copy synced) |
| 2 AIC draft | DONE (draft) | v14 holds v14.2: only d2 lines 18, 32, 36 changed; both greetings = Oct 13 hashes |
| 3 Booking fix | PUBLISHED | WF-SHANE-SLOTS a46ad26a; 33/33 unit; ZZ booked/taken/re-offer/wrong-year runs pass; 3+3 test bookings deleted |
| 3 Booking tool | DONE | TEST v16 15:39Z: book_slot takes which_slot 1 or 2; 9/9 sim bookings used it, no dates |
| 3 8930 lookup | DRAFT, PARKED | v3.3 openers tested as 910e8194 (run 14259, ZZ sink); serving stays 804b5b4c |
| 4 Simulations | FAIL (MUST) | S7 0/3, S10 1/3; S1 S8 S9 S11 3/3; batches test_batch_5d8bc7c36d69 + test_batch_48376bcf3f47 |
| 6 Calls + speed | NOT RUN | gated by step 4; harness + 53 caller clips ready |
| 7 One name, one path | NOT RUN | gated by step 4 |
| 9 Promote | NOT RUN | gated by step 4 |
| 10 Close | DONE | report reports/2026-10-15-discovery-words-run-v1-2.md; board; Notion inbox |

IDS / ROLLBACK
- Nothing live moved, so nothing to roll back on the phone lines.
- WF-SHANE-SLOTS serves a46ad26a; back to yesterday's version = publish 0295660f. Only the test agent and the AI Chauffeur draft use it.
- WF-ANI-AVA serves 804b5b4c; the tested v3.3 version 910e8194 waits for the AVA switch.
- New n8n table call_slots (MRa0siQVHKP9gvJA): the times each call was offered; test rows start with zz-.
- At the future promote, the v1 rollback lines stand (re-pin to v51 / v13, old rails back on, WF-ANI-AVA 804b5b4c).

WHAT'S NEXT
1. Grok patch brief from D9–D14 (report has every transcript): D9 silent transfer + skipped TEAM NOW; D10 AI Chauffeur price answer
   clipped; D11 name question skipped on "I want to get this set up"; D12 AI Chauffeur soft ask never whole; D13 TEAM NOW asked
   when the team is not free; D14 ride caller offered help twice.
2. New words → re-run step 4 (same cases, same frozen gate) → steps 6–10.
3. Step 7 when it runs: the engine's text becomes the only booking text (GHL's own AVA booking text and its reminders stop), so the
   reminder workflow must cover both calendars; the AI Chauffeur text gets signed "AI Chauffeur Team".

GOTCHAS
1. The merged doc's CODE NOTE changed one word in D ("…setup, and sixty-five cents…") to match PRICE bullet one, as it says.
   Logged in the delta file.
2. The test agent's default opener was synced to the v3.3 COLD line (yesterday's sync rule), so a line without the lookup also
   says the recording line.
3. book_slot keeps its optional name, company, trade and callback fields so the calendar entry and CRM record are named. Only
   the time parameter changed.
4. Retell's judge failed S4 three times only because the goodbye does not end in a question. Not a defect.
5. Line …8976 follows the test agent and can book real times on your calendar.
6. CLAUDE.md still spells the line ending 6562 in full in the PHONE section (public repo); the fix sits in step 7.
7. /hq scrolls sideways on a phone because an older board entry prints a full ChatDash import-webhook URL as one long word. That
   URL has sat in public repo files since Jul 28 (board, three config snapshots, a July report). Not from this run; not touched.
```

