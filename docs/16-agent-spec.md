# The 16-Agent Spec

Canonical roster for AVA's call-handling stack. **One source of truth** for the Backstage theater,
content scripts, ad copy, sales decks, page copy, and agent prompts. If a surface names an agent, it
names it from this file.

Implemented in `data/calls.json` (`agents[]` + 6 trade scripts) and driven by `js/backstage.js`
(`ava:agent {id, lane, t, text, state}` events on `#stage`). **This document and `data/calls.json`
must agree** — change one, change the other.

Copy law: `/CLAUDE.md` § 4 HARD LAWS and § FORBIDDEN WORDS apply to every word lifted from here.

---

## The four lanes

A call moves left to right. Each lane is four agents; each agent does one job and hands off.

| Lane | Token | Dark | Light | What the lane does |
|---|---|---|---|---|
| **Intake** | `--lane-intake` | `#00D4FF` | `#00749C` | Get the call, get it clean, get it into text |
| **Triage** | `--lane-triage` | `#FFB020` | `#9A6200` | Work out what they want and how badly |
| **Tools** | `--lane-tools` | `#9A8CFF` | `#6355E6` | Touch the calendar and the CRM |
| **Output** | `--lane-output` | `#34E39B` | `#0B7E56` | Leave a trail everyone can act on |

---

## Roster

`behavior` is the observable action, written verb-first — that is exactly the form the theater and
the copy use. Sample payloads are the real plumbing script from `data/calls.json`.

### Lane 1 · INTAKE

| Code | Canonical | `id` | Display | Purpose | Behavior |
|---|---|---|---|---|---|
| **A-01** | `INTAKE_LISTENER` | `listener` | LISTENER | Pick up before the caller gives up | Answers on ring 1, every hour, no queue — *"answered on ring 1"* |
| **A-02** | `CALLER_ID_RESOLVER` | `callerid` | CALLER ID | Know who is calling before they say it | Captures name + mobile from the line, matches against known contacts — *"captured caller name + mobile number"* |
| **A-03** | `AUDIO_CLEANUP` | `audio` | AUDIO CLEANUP | Make a bad line usable | Filters background noise — running water, traffic, a truck cab — so the words survive |
| **A-04** | `TRANSCRIBER` | `transcriber` | TRANSCRIBER | Turn speech into something the rest can act on | Transcribes live — *"transcribed: 'water heater is leaking'"* |

### Lane 2 · TRIAGE

| Code | Canonical | `id` | Display | Purpose | Behavior |
|---|---|---|---|---|---|
| **A-05** | `REQUEST_CLASSIFIER` | `request` | REQUEST | Name the job | Maps the words to a real service type — *"identified request: water heater repair"* |
| **A-06** | `URGENCY_SCORER` | `urgency` | URGENCY | Separate "tonight" from "next week" | Scores time-sensitivity from the described condition — *"flagged active leak · time-sensitive"* |
| **A-07** | `EMERGENCY_RULES` | `emergency` | EMERGENCY RULES | Apply the owner's own after-hours policy | Matches against the rules the owner set, runs the safety step — *"matched your after-hours rule · shutoff confirmed"* |
| **A-08** | `TONE_READER` | `tone` | TONE READ | Match the caller's state | Reads stress or calm and adjusts pace and length — *"read stressed caller · kept it short"* |

### Lane 3 · TOOLS

| Code | Canonical | `id` | Display | Purpose | Behavior |
|---|---|---|---|---|---|
| **A-09** | `CALENDAR_READER` | `calendar` | CALENDAR | See the real schedule, not a guess | Opens the owner's live service calendar |
| **A-10** | `AVAILABILITY_MATCHER` | `availability` | AVAILABILITY | Offer a slot that actually works | Finds an opening that fits the route and the job length — *"found Tue · 7:00 AM open on the route"* |
| **A-11** | `SCHEDULER` | `scheduler` | SCHEDULER | Hold it before it's gone | Holds the slot against the calendar — *"held the 7:00 AM slot"* |
| **A-12** | `CRM_WRITER` | `crmwrite` | CRM WRITE | Leave a record a tech can work from | Creates the job with name, address, and requested photos — *"job created: name · address · photos requested"* |

### Lane 4 · OUTPUT

| Code | Canonical | `id` | Display | Purpose | Behavior |
|---|---|---|---|---|---|
| **A-13** | `MORNING_BOARD` | `board` | MORNING BOARD | Make the night visible at 6AM | Adds the job to tomorrow's board — *"added to tomorrow's morning board"* |
| **A-14** | `CONFIRMATION_TEXT` | `conftext` | CONFIRMATION TEXT | Close the loop with the caller | Sends the caller a confirmation text with the time |
| **A-15** | `CALL_RECORDING` | `recording` | CALL RECORDING | Make it auditable | Records the call and attaches the transcript to the job — *"recorded · transcript saved to the job"* |
| **A-16** | `OWNER_ALERT_PAGER` | `owneralert` | OWNER ALERT | Tell the owner something happened | Pings the owner's cell with the result — *"booked-job ping sent to your cell"* |

**Terminal state.** After A-16 the theater renders the payoff: result · when · elapsed seconds · tag
(e.g. `JOB BOOKED` · `TUESDAY · 7:00 AM` · `11.3` · `YOU WERE ASLEEP`). The payoff is the outcome of
the *sample call shown*, not a claim about the service.

---

## Using this in copy

**Verb-first, past tense, lowercase payload.** `captured caller name + mobile number` — not
`Caller name and mobile number were captured` and not `Caller Information Capture Module`.

**Plain language over agent names.** In public copy the *behavior* sells; the codename does not. Say
"AVA reads your calendar and holds the slot," not "A-09 and A-11 execute." Codes are for internal
reference, prompts, and this document.

**One call. Sixteen agents.** — protected anchor (`/CLAUDE.md` § 5). Use verbatim.

### Never claim
- That the sample outcome is a typical or guaranteed result.
- "booked / confirmed / guaranteed" as a claim about the service. Demo language is
  **captured · routed · dispatcher will confirm**. Booking language is allowed only inside a clearly
  labeled sample-call transcript — which is exactly what the theater is.
- Any number not in the sourced set (`/CLAUDE.md` § 4).
- AVA as "she" or "her." Always "AVA."

---

## Trade coverage

Six trade scripts, same 16 agents, trade-accurate payloads:
`plumbing` · `hvac` · `electrical` · `dental` · `roofing` · `black-car`.

Adding a trade means adding a `trades[]` entry with all 16 agent events plus a payoff — never a
subset. An agent that has nothing to do in a trade still reports; a missing agent breaks the lane
pill progress in `js/backstage.js`.

## Change control

1. Edit `data/calls.json`.
2. Edit this file to match.
3. Re-check the homepage theater renders all four lanes to completion at 390×844.

The roster is 16. Adding a 17th agent changes a protected anchor and needs a CEO order.
