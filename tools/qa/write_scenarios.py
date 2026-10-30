"""Write scripted callers for the text caller (Sonnet 5.5, Batch API).

  doppler run -p ava-prod -c prd -- python tools/qa/write_scenarios.py            # 49 AIC + 20 AVA (aic-001 is kept verbatim)
  doppler run -p ava-prod -c prd -- python tools/qa/write_scenarios.py --dry-run  # print the plan, spend nothing

Scenarios are CALLER scripts plus the behaviors to grade. They never script what the agent says
(PROMPT AUTHORITY LOCK). Output: tools/qa/scenarios/<id>.json, one file per scenario.
"""
import argparse
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import _claude as C  # noqa: E402

HERE = pathlib.Path(__file__).parent
OUT = HERE / "scenarios"

LINES = {
    "aic": """LINE: AI Chauffeur demo line, 414-775-0019. The agent is "AI Chauffeur", a reservation system for limousine, black car
and chauffeured transportation, answering its own demo line. The caller is asked to play a customer and request a trip:
airport (landing or flying out), point to point, or by the hour. The agent captures the trip request (date, time, pickup,
drop-off, airport, flight, passengers, bags, vehicle, name, cell) and sends it to dispatch. A caller who asks about the
product itself (what it is, how it works, software, price of AI Chauffeur, setup) moves to the questions part. A caller who
asks for a person moves to the team path (the team calls back, or a live connect may be tried).
SHANE'S RULINGS FOR WHAT TO EXPECT: never expect a fare or rate on the demo (the agent does not quote trip prices);
expect airports by their full name, never a code spoken aloud; expect "the team" or "dispatch", never "owner" or a person's name.""",
    "ava": """LINE: AVA, the AI Voice Agency line, 414-240-8930. The agent is AVA, an AI phone agent that answers calls and books jobs
for service businesses (plumbers, HVAC, electricians, dental offices and similar). The greeting says the call is recorded.
AVA asks what business the caller runs, explains how AVA would answer that business's calls, can answer price questions
(AVA is $497 a month plus a $497 one-time setup), and offers to book the 15-minute AVA setup call. A limousine or black-car
operator should be offered a transfer to the AI Chauffeur demo, the agent built for that trade. A caller who asks for a
person goes to the team path.
SHANE'S RULINGS FOR WHAT TO EXPECT: expect "the team", never "owner" or a person's name; never expect a made-up integration,
statistic or promise; AVA is never "she" or "her" in anything you write.""",
}

PLAN = {
    "aic": [
        ("airport_question_metro", 7, "airport trips where the caller asks which airport serves a named US metro (Chicago, Dallas, Houston, New York, Los Angeles, Atlanta, Phoenix, Seattle, Washington DC, Minneapolis - spread them) instead of naming it, mid-intake"),
        ("hesitant_stall", 6, "hesitant first-time callers who stall mid-address or mid-answer ('it's at, uh... hold on'), trail off, then finish on the next turn"),
        ("question_every_turn", 6, "callers who ask a question on every turn: the airport in a named metro, 'can I talk to somebody', 'does this work with my software', 'what does it cost'"),
        ("talk_to_somebody", 4, "callers who start a trip and partway through ask to talk to somebody / a real person"),
        ("software_question", 4, "limo operators who ask whether it works with their reservation software (name a real limo dispatch product) before or during a trip"),
        ("cost_question", 4, "callers who ask what the ride costs or what AI Chauffeur costs, mid-intake"),
        ("correction", 5, "callers who correct a detail they already gave ('actually make that Tuesday', a different pickup time, a different passenger count)"),
        ("fast_everything", 4, "fast callers who give every trip detail at once in the first answer"),
        ("wrong_city", 3, "callers who give a pickup in one city and an airport in a different, far-away city, or name a city the trip cannot sensibly start from"),
        ("hourly_wedding", 3, "by-the-hour bookings for a wedding (hours, stops, passengers, occasion)"),
        ("operator_testing", 3, "limo company owners deliberately testing the line with curveballs: interrupting, changing their mind, asking if it is AI"),
    ],
    "ava": [
        ("plumber", 3, "plumbing company owners trying AVA, asking how it would handle an emergency call"),
        ("trades_other", 2, "an HVAC owner and an electrician"),
        ("dental_office", 2, "a dental office manager and a medical clinic front-desk lead"),
        ("limo_operator", 3, "limousine / black-car operators calling the AVA line, who should be offered the transfer to the AI Chauffeur demo"),
        ("question_every_turn", 2, "callers who ask a question on every turn (price, how it works, can I talk to somebody, does it work with my CRM)"),
        ("cost_question", 2, "callers who lead with 'what does it cost'"),
        ("talk_to_somebody", 2, "callers who ask for a real person"),
        ("correction", 1, "a caller who corrects their business type or a detail"),
        ("hesitant_stall", 1, "a hesitant caller who stalls and trails off"),
        ("fast_everything", 1, "a caller who gives business, pain and request all at once"),
        ("wrong_number", 1, "a caller who thinks they reached a plumber and wants a repair"),
    ],
}

SCENARIO_SCHEMA = {
    "type": "object",
    "properties": {
        "scenarios": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "category": {"type": "string"},
                    "title": {"type": "string"},
                    "persona": {"type": "string"},
                    "goal": {"type": "string"},
                    "opening_line": {"type": "string"},
                    "turns": {"type": "array", "items": {
                        "type": "object",
                        "properties": {
                            "n": {"type": "integer"},
                            "caller": {"type": "string"},
                            "branches": {"type": "array", "items": {
                                "type": "object",
                                "properties": {"if_agent": {"type": "string"}, "caller": {"type": "string"}},
                                "required": ["if_agent", "caller"], "additionalProperties": False}},
                        },
                        "required": ["n", "caller", "branches"], "additionalProperties": False}},
                    "curveballs": {"type": "array", "items": {"type": "string"}},
                    "hesitation_rules": {"type": "string"},
                    "expected": {"type": "array", "items": {"type": "string"}},
                    "must_not": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["category", "title", "persona", "goal", "opening_line", "turns", "curveballs",
                             "hesitation_rules", "expected", "must_not"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["scenarios"],
    "additionalProperties": False,
}

SYSTEM = """You write scripted test callers for a phone-agent QA harness. A second model will play each caller over text,
turn by turn, against the live agent, and a grader will score the agent against the expected behaviors.

Write CALLER scripts only. Never write what the agent should say: "expected" and "must_not" describe what the agent
should DO or never do, in plain words (e.g. "names the airport by its full name before asking the next trip question",
"does not ask for the pickup time again"), never a line of agent dialogue.

Each scenario:
- persona: who is calling and how they talk (one or two sentences).
- goal: what the caller is trying to get done.
- opening_line: the caller's first words after the agent's greeting.
- turns: 6 to 10 numbered caller turns after the opening line, in order. Each turn is what the caller says next, with
  0 to 2 branches ("if_agent": a short description of an agent move, "caller": what the caller says instead).
- curveballs: the specific traps in this script.
- hesitation_rules: how the caller stalls (or "none").
- expected: 3 to 6 checkable behaviors for the grader.
- must_not: 2 to 4 things the agent must never do on this call.

Data rules (public repo): invented people only (common first/last names), never a real person; public landmarks (hotels,
airports, venues) are fine; street addresses are generic ("123 Main Street"); if a phone number is needed use only
555-0100 through 555-0199 with a 414 area code; no email addresses. Make the callers sound like real people on a phone:
short, spoken, sometimes ungrammatical. Vary names, cities, dates, and wording across scenarios."""


def build_requests():
    reqs = []
    for line, cats in PLAN.items():
        chunk, n_in_chunk = [], 0
        chunks = []
        for cat, n, desc in cats:
            chunk.append((cat, n, desc))
            n_in_chunk += n
            if n_in_chunk >= 10:
                chunks.append(chunk)
                chunk, n_in_chunk = [], 0
        if chunk:
            chunks.append(chunk)
        for i, ch in enumerate(chunks):
            total = sum(n for _, n, _ in ch)
            want = "\n".join(f"- {n} x category \"{cat}\": {desc}" for cat, n, desc in ch)
            prompt = f"{LINES[line]}\n\nWrite exactly {total} scenarios for this line:\n{want}\n\nUse the category names exactly as given."
            reqs.append((f"{line}-{i}", {
                "model": C.SONNET, "max_tokens": 32000,
                "output_config": {"effort": "medium", "format": {"type": "json_schema", "schema": SCENARIO_SCHEMA}},
                "system": SYSTEM,
                "messages": [{"role": "user", "content": prompt}],
            }, line, total))
    return reqs


def denver():
    """aic-001: the Denver script, verbatim from PASTE-CC-AIC-AGENT-BUILD-v1.1 T1."""
    lines = ["Airport.", "Flying out.", "What's the airport in Denver?", "123 Main Street in Denver.", "Tomorrow at 6 AM.",
             "United 1234 at 8:15.", "Two passengers, three bags.", "SUV is fine.", "John Smith.", "That number is fine."]
    return {
        "id": "aic-001", "line": "aic", "category": "airport_question_metro",
        "title": "T1 DENVER (the gate call), verbatim from PASTE-CC-AIC-AGENT-BUILD-v1.1",
        "persona": "A caller trying the demo with short answers; asks which airport serves Denver instead of naming it.",
        "goal": "Book an airport departure from Denver.",
        "opening_line": lines[0],
        "turns": [{"n": i, "caller": t, "branches": ([{"if_agent": "asks for a phone number", "caller": "414-555-0100"}] if i == 9 else [])}
                  for i, t in enumerate(lines[1:], start=1)],
        "curveballs": ["asks 'What's the airport in Denver?' in place of answering the airport ask"],
        "hesitation_rules": "none",
        "expected": ["answers the Denver airport question with the airport's full name (Denver International) before the next ask",
                     "does not ask again for any field already given",
                     "captures every trip field the caller gives",
                     "never speaks an airport code"],
        "must_not": ["skip the caller's airport question", "quote a fare", "say owner"],
        "verbatim_script": True,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    reqs = build_requests()
    for cid, _, line, total in reqs:
        print(f"  request {cid}: {total} {line} scenarios")
    if a.dry_run:
        return
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "aic-001.json").write_text(json.dumps(denver(), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    results, batch_id = C.run_batch("step4_scenarios", [(cid, p) for cid, p, _, _ in reqs], note="scenarios")
    counters = {"aic": 1, "ava": 0}
    written = []
    for cid, _, line, total in reqs:
        m = results.get(cid)
        if not hasattr(m, "content"):
            print(f"  {cid} FAILED: {m}")
            continue
        data = json.loads(C.text_of(m))
        got = data["scenarios"]
        if len(got) != total:
            print(f"  {cid}: asked {total}, got {len(got)}")
        for s in got:
            counters[line] += 1
            s = {"id": f"{line}-{counters[line]:03d}", "line": line, **s}
            p = OUT / f"{s['id']}.json"
            p.write_text(json.dumps(s, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            written.append(p.name)
    print(f"  wrote {len(written) + 1} scenario files (aic-001 verbatim) · batch {batch_id} · step spend ${C.spent('step4_scenarios'):.4f}")


if __name__ == "__main__":
    main()
