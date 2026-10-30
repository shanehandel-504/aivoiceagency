"""Play scripted callers against a Retell agent in TEXT, then grade each conversation.

  doppler run -p ava-prod -c prd -- python tools/qa/text_caller.py --line aic --scenarios aic-001,aic-002 --grade
  doppler run -p ava-prod -c prd -- python tools/qa/text_caller.py --line aic --n 10 --grade        # first 10 aic scenarios
  doppler run -p ava-prod -c prd -- python tools/qa/text_caller.py --agent agent_xxx --version 3 --scenarios aic-001

Channel: Retell's stateless Agent Playground Completion (POST /agent-playground-completion/{agent_id}?version=N,
docs.retellai.com/api-references/agent-playground-completion). It runs a conversation-flow or Retell-LLM agent on text,
"Nothing is persisted server-side", no phone number and no audio. The caller is Claude Sonnet 5.5 playing the scenario.

Safety: before the first turn every tool the agent can reach is enumerated from its live config and mocked
(`tool_mocks`), so no booking, alert, transfer or swap reaches n8n, GHL, Twilio or a phone. If a node points at a
tool this script cannot name, it refuses to run. Default version = the version bound to the line's public number.
No timing is measured here: text has no audio. Speed stays measured on real calls (grade_call.py).
"""
import argparse
import concurrent.futures as cf
import datetime
import json
import pathlib
import re
import sys
import time

HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(HERE))
import _claude as C  # noqa: E402
import _retell as R  # noqa: E402

REPO = HERE.parents[1]
SCEN = HERE / "scenarios"
STAGE = re.compile(r"\s*\([^)]*\)")
NUMBERS = {"aic": "+14147750019", "ava": "+14142408930"}
NEVER_MOCK = {"end_call"}  # ends the conversation inside the playground; reaches nothing outside
MOCK_OUTPUTS = {
    "get_open_slots": {"slot_1": "tomorrow at 10 AM Central", "slot_1_iso": "2026-10-30T10:00:00-05:00",
                       "slot_2": "tomorrow at 2 PM Central", "slot_2_iso": "2026-10-30T14:00:00-05:00", "slots_status": "ok"},
    "book_slot": {"appointment_booked": "true", "appointment_id": "qa-mock", "appointment_time": "tomorrow at 10 AM Central"},
}
TEST_CALLER_ID = "+14145550142"  # reserved fictional range; stands in for the caller ID a phone call carries
START_VARS = {"aic": {"channel": "phone", "user_number": TEST_CALLER_ID, "team_free_now": "false", "slot_1": "tomorrow at 10 AM Central",
                      "slot_1_iso": "2026-10-30T10:00:00-05:00", "slot_2": "tomorrow at 2 PM Central",
                      "slot_2_iso": "2026-10-30T14:00:00-05:00"},
              "ava": {"channel": "phone", "user_number": TEST_CALLER_ID, "team_free_now": "false"}}

CALLER_SYSTEM = """You are playing a phone caller in a QA test of a phone agent. The agent's words come to you as the user
messages. You reply with ONLY the words you say on the phone next: one short spoken turn, no stage directions, no quotes.

Who you are: {persona}
Your goal: {goal}
How you stall: {hesitation}
Your script (turn 1 comes after your opening line has been answered). Use a branch when the agent does what the branch
describes. {order_rule}
{script}

Rules:
- Your opening line was already said. Continue from turn 1.
- You are the CALLER. Never ask the agent's questions back to it and never answer on the agent's behalf.
- If the agent asks for something your script does not cover, answer briefly in character with invented, plausible details
  (an invented name; a phone number only from 414-555-0100 to 414-555-0199; never an email).
- To stall, end your turn on the trailing fragment ("It's at, uh...") and finish the thought on your next turn.
- If the agent says nothing and waits, carry on with your next words.
- Do not help the agent. Do not repeat a question the agent already answered unless your script says so.
- Never add stage directions or notes in parentheses.
- When your script is done and the agent has wrapped up, or the agent ends the call, reply exactly: [HANG UP]"""


def as_var(v):
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (dict, list)):
        return json.dumps(v)
    return str(v)


def load_scenarios(ids, line, n):
    if ids:
        return [json.loads((SCEN / f"{i.strip()}.json").read_text(encoding="utf-8")) for i in ids.split(",")]
    files = sorted(SCEN.glob(f"{line}-*.json"))[: n or None]
    return [json.loads(f.read_text(encoding="utf-8")) for f in files]


def resolve(agent, version, line):
    if not agent or version is None:
        s, num = R.get(f"/get-phone-number/{NUMBERS[line]}")
        ib = (num.get("inbound_agents") or [{}])[0]
        agent = agent or ib.get("agent_id")
        if version is None:
            if ib.get("agent_id") != agent:
                raise SystemExit(f"{agent} is not the agent bound to {NUMBERS[line][-4:]}; pass --version")
            version = ib.get("agent_version")
    s, ag = R.get(f"/get-agent/{agent}?version={version}")
    if s != 200:
        raise SystemExit(f"get-agent {agent} v{version} -> HTTP {s}")
    return agent, version, ag


def enumerate_tools(ag):
    """Every tool name the agent can call, from its live config. Raises if a reference cannot be resolved."""
    eng = ag["response_engine"]
    names, refs = {}, []
    if eng["type"] == "conversation-flow":
        s, fl = R.get(f"/get-conversation-flow/{eng['conversation_flow_id']}?version={eng['version']}")
        by_id = {t.get("tool_id"): t for t in fl.get("tools") or []}
        for t in fl.get("tools") or []:
            names[t["name"]] = t.get("type", "custom")
        for n in fl.get("nodes", []):
            if n.get("tool_id"):
                t = by_id.get(n["tool_id"])
                if not t:
                    raise SystemExit(f"REFUSED — node {n['id']} points at tool {n['tool_id']} not defined on the flow")
                refs.append((n["id"], t["name"]))
            for t in n.get("tools") or []:
                names[t["name"]] = t.get("type", "")
            if n["type"] == "transfer_call":
                names["transfer_call"] = "transfer_call"
                names[n.get("name") or n["id"]] = "transfer_call"
            if n["type"] in ("agent_swap", "mcp", "sms", "press_digit"):
                names[n.get("name") or n["id"]] = n["type"]
        source = f"conversation_flow {eng['conversation_flow_id']} v{eng['version']}"
    elif eng["type"] == "retell-llm":
        s, llm = R.get(f"/get-retell-llm/{eng['llm_id']}?version={eng.get('version')}")
        for t in llm.get("general_tools") or []:
            names[t["name"]] = t.get("type", "")
        for st in llm.get("states") or []:
            for t in st.get("tools") or []:
                names[t["name"]] = t.get("type", "")
        source = f"retell llm {eng['llm_id']} v{eng.get('version')}"
    else:
        raise SystemExit(f"REFUSED — response engine {eng['type']} is not handled")
    return names, refs, source


def build_mocks(names):
    mocks = []
    for name, typ in sorted(names.items()):
        if name in NEVER_MOCK:
            continue
        m = {"tool_name": name, "input_match_rule": {"type": "any"},
             "output": json.dumps(MOCK_OUTPUTS.get(name, {"ok": True, "qa_mock": "nothing was sent"}))}
        if typ in ("transfer_call", "agent_swap") or "transfer" in name or "handoff" in name:
            m["output"] = json.dumps({"qa_mock": "transfer not placed"})
            m["result"] = False
        mocks.append(m)
    return mocks


def caller_turn(scn, convo, step, sid):
    script = "\n".join(f"{t['n']}. {t['caller']}" + "".join(f"\n   - if the agent {b['if_agent']}: {b['caller']}" for b in t["branches"])
                       for t in scn["turns"])
    order_rule = ("This is a VERBATIM script: say each line exactly as written, one line per turn, in order, whatever the agent "
                  "asks (a branch replaces a line only when its condition happens)." if scn.get("verbatim_script") else
                  "The turns are what you have to say and the order you would naturally offer it. Answer what the agent just "
                  "asked using the script's details, keep the script's questions and curveballs, and keep its wording when it fits.")
    system = CALLER_SYSTEM.format(persona=scn["persona"], goal=scn["goal"], hesitation=scn["hesitation_rules"],
                                  script=script, order_rule=order_rule)
    m = C.create(step, note=f"caller {sid}", model=C.SONNET, max_tokens=2000, output_config={"effort": "low"},
                 cache_control={"type": "ephemeral"}, system=system, messages=convo)
    return STAGE.sub("", C.text_of(m)).strip()  # a "(stage direction)" is not something a caller says


def run_one(scn, agent, version, line, mocks, max_turns, out, step):
    sid = scn["id"]
    dv = dict(START_VARS.get(line, {}))
    hist, node = [], None
    convo = []  # Sonnet's view: agent words = user, caller words = assistant
    retell_requests = 0
    t0 = time.time()

    def agent_step(user_text):
        nonlocal dv, node, retell_requests
        if user_text is not None:
            hist.append({"role": "user", "content": user_text})
        body = {"messages": hist, "dynamic_variables": dv, "tool_mocks": mocks}
        if node:
            body["current_node_id"] = node
        s, b = R.post(f"/agent-playground-completion/{agent}?version={version}", body)
        retell_requests += 1
        if s != 200:
            raise RuntimeError(f"{sid}: playground HTTP {s}: {str(b)[:200]}")
        new = b.get("messages") or []
        hist.extend(new)
        dv = {k: as_var(v) for k, v in (b.get("dynamic_variables") or dv).items() if v is not None}
        node = b.get("current_node_id") or node
        said = " ".join(m.get("content", "") for m in new if m.get("role") == "agent").strip()
        return said, bool(b.get("call_ended"))

    said, ended = agent_step(None)
    convo.append({"role": "user", "content": said or "[silence — the agent waits for you]"})
    convo.append({"role": "assistant", "content": scn["opening_line"]})
    said, ended = agent_step(scn["opening_line"])
    reason = "agent ended the conversation" if ended else None
    turns = 1
    while not ended and turns < max_turns:
        convo.append({"role": "user", "content": said or "[silence — the agent waits for you to go on]"})
        line_out = caller_turn(scn, convo, step, sid)
        if "[HANG UP]" in line_out or not line_out:
            reason = "caller hung up (script done)"
            break
        convo.append({"role": "assistant", "content": line_out})
        said, ended = agent_step(line_out)
        turns += 1
        if ended:
            reason = "agent ended the conversation"
    reason = reason or f"max turns ({max_turns})"
    rec = {
        "call_id": f"text_{sid}_{datetime.datetime.now().strftime('%H%M%S')}", "_qa_source": "text_caller",
        "_read": "QA-CALLER-v1 text run · Retell agent-playground-completion (stateless, nothing persisted) · every tool mocked · fictional caller",
        "agent_id": agent, "agent_version": version, "line": line, "scenario_id": sid, "scenario_title": scn["title"],
        "call_type": "text_playground", "run_at": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
        "disconnection_reason": reason, "caller_turns": turns,
        "retell_requests": retell_requests, "retell_messages": len(hist),
        "retell_agent_messages": sum(m.get("role") == "agent" for m in hist),
        "wall_s": round(time.time() - t0, 1),
        "transcript_with_tool_calls": hist,
        "collected_dynamic_variables": dv,
        "expected": scn["expected"], "must_not": scn["must_not"],
    }
    (out / f"{rec['call_id']}.json").write_text(json.dumps(rec, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"  {sid}: {turns} caller turns · {rec['retell_agent_messages']} agent messages · {reason} · {rec['wall_s']} s", flush=True)
    return rec


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--line", choices=["aic", "ava"], default="aic")
    ap.add_argument("--agent")
    ap.add_argument("--version", type=int)
    ap.add_argument("--scenarios", help="comma-separated ids, e.g. aic-001,aic-005")
    ap.add_argument("--n", type=int, default=0, help="first N scenarios of the line")
    ap.add_argument("--max-turns", type=int, default=20)
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--grade", action="store_true", help="grade every transcript with grade_call.py afterwards")
    ap.add_argument("--out", default=str(REPO / "ops" / "tuning" / "qa" / datetime.date.today().isoformat() / "text"))
    ap.add_argument("--step", default="text_caller")
    a = ap.parse_args()

    scns = load_scenarios(a.scenarios, a.line, a.n)
    if not scns:
        ap.error("no scenarios")
    agent, version, ag = resolve(a.agent, a.version, a.line)
    names, refs, source = enumerate_tools(ag)
    mocks = build_mocks(names)
    print(f"agent {agent} v{version} ({ag.get('agent_name')}) · {source}")
    print(f"tools found: {sorted(names)} · mocked: {[m['tool_name'] for m in mocks]} · left real: {sorted(set(names) & NEVER_MOCK)}")
    out = pathlib.Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    recs = []
    with cf.ThreadPoolExecutor(max_workers=a.workers) as ex:
        futs = {ex.submit(run_one, s, agent, version, a.line, mocks, a.max_turns, out, a.step): s["id"] for s in scns}
        for f in cf.as_completed(futs):
            try:
                recs.append(f.result())
            except C.CapReached:
                raise
            except Exception as e:  # one scenario failing must not hide the others
                print(f"  {futs[f]}: FAILED — {e}", flush=True)
    req = sum(r["retell_requests"] for r in recs)
    msgs = sum(r["retell_messages"] for r in recs)
    agent_msgs = sum(r["retell_agent_messages"] for r in recs)
    print(f"Retell: {req} playground requests · {msgs} messages produced ({agent_msgs} agent messages). The endpoint returns no cost; "
          f"Retell's testing-pricing page bills text tests per message at the model's chat rate ($0.001–$0.05 per message).")
    print(f"Claude caller spend ({a.step}): ${C.spent(a.step):.4f}")
    if a.grade and recs:
        import subprocess
        cmd = [sys.executable, "-X", "utf8", str(HERE / "grade_call.py"), "--dir", str(out), "--label", f"text-{a.line}",
               "--out", str(out / "graded"), "--step", f"{a.step}_grade"]
        subprocess.run(cmd, check=True)


if __name__ == "__main__":
    main()
