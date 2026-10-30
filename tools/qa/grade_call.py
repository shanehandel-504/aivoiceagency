"""Grade phone-agent calls against the house rules (tools/qa/rubric.md).

  doppler run -p ava-prod -c prd -- python tools/qa/grade_call.py call_abc123...            # one or more call ids
  doppler run -p ava-prod -c prd -- python tools/qa/grade_call.py --agent agent_9ebb... --last 20
  doppler run -p ava-prod -c prd -- python tools/qa/grade_call.py --dir ops/tuning/calls/2026-10-28 --batch

Computed in code (Phase 0 method, never by the model): per-turn gap = agent's first word start − caller's last word
end from transcript_object word timestamps, overlaps (agent started before the caller finished) excluded; an agent
turn after 5 s or more of the agent's own silence is a silence prompt; p50/p95 by linear interpolation; max gap and
its turn; duration; disconnection reason; extracted variables present/empty; greeting byte check; recorded notice.
Judged by Claude Haiku 5.5 with the rubric: every caller question and whether it was answered before the next ask,
fields re-asked, invented facts, dead ends, one-question-per-turn, booked-before-tool, "owner", outcome.
Then a second, narrow Haiku pass re-asks each skipped question, invented fact, dead end and re-asked field on its
own, with only the turns around it; an item counts only if both passes find it (--no-verify skips this pass).

Writes one JSON per call and a Markdown + JSON summary to --out (default ops/tuning/qa/<today>/). Live calls are
masked (tools/qa/_mask.py) before they are saved or sent to the model. Read-only on Retell.
"""
import argparse
import datetime
import json
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(HERE))
import _claude as C  # noqa: E402
import _mask as M  # noqa: E402

REPO = HERE.parents[1]
RUBRIC = (HERE / "rubric.md").read_text(encoding="utf-8")
LINES = json.loads((HERE / "lines.json").read_text(encoding="utf-8"))
SILENCE_PROMPT_S = 5.0
GAP_FLAG_S = 3.0
TRIP_KEYS = ("trip_type", "pickup_date", "pickup_time", "pickup_address", "pickup_location", "dropoff_address",
             "dropoff_location", "airport", "airline_flight", "passenger_count", "bag_count", "hours", "vehicle_class",
             "caller_name", "real_name", "caller_mobile", "caller_phone", "company_name", "company")
TOOL_SKIP_TYPES = {"code", "extract_dynamic_variable"}

FINDING = lambda extra: {"type": "object", "properties": {"turn": {"type": "integer"}, **extra},  # noqa: E731
                         "required": ["turn", *extra.keys()], "additionalProperties": False}
IS = {"is_finding": {"type": "boolean"}}  # the model must commit; items it marks false are dropped in code
FINDING_LISTS = ("fields_reasked", "invented_facts", "dead_ends", "multi_question_turns", "booked_before_tool", "said_owner_or_name")
QUESTION_START = re.compile(r"(?i)^\W*(and |so |but |okay,? |well,? |um,? |uh,? )*(what|which|where|when|who|whose|how|why|can|could|do|does|did|is|are|was|will|would|should|may|might|have|has)(?![a-z])")
VERDICT_SCHEMA = {
    "type": "object",
    "properties": {
        "caller_questions": {"type": "array", "items": FINDING({
            "question": {"type": "string"}, "answered_before_next_ask": {"type": "boolean"},
            "agent_reply": {"type": "string"}, "note": {"type": "string"}})},
        "fields_reasked": {"type": "array", "items": FINDING({**IS,
            "field": {"type": "string"}, "given_at_turn": {"type": "integer"}, "agent_words": {"type": "string"}})},
        "invented_facts": {"type": "array", "items": FINDING({**IS,
            "kind": {"type": "string", "enum": ["rate", "service_area", "software_integration", "live_availability", "airport_code", "other"]},
            "agent_words": {"type": "string"}, "why": {"type": "string"}})},
        "dead_ends": {"type": "array", "items": FINDING({**IS, "caller_words": {"type": "string"}, "what_happened": {"type": "string"}})},
        "multi_question_turns": {"type": "array", "items": FINDING({**IS, "agent_words": {"type": "string"}})},
        "booked_before_tool": {"type": "array", "items": FINDING({**IS, "agent_words": {"type": "string"}})},
        "said_owner_or_name": {"type": "array", "items": FINDING({**IS, "agent_words": {"type": "string"}})},
        "outcome": {"type": "string", "enum": ["trip_captured", "questions_door", "team_path", "abandoned"]},
        "outcome_note": {"type": "string"},
        "summary": {"type": "string"},
    },
    "required": ["caller_questions", "fields_reasked", "invented_facts", "dead_ends", "multi_question_turns",
                 "booked_before_tool", "said_owner_or_name", "outcome", "outcome_note", "summary"],
    "additionalProperties": False,
}


# ---------- loading ----------

def line_of(c):
    aid = c.get("agent_id") or ""
    for key in ("aic", "ava"):
        if aid in LINES[key]["agent_ids"]:
            return key
    name = (c.get("agent_name") or "").upper()
    if "AIC" in name or "CHAUFFEUR" in name:
        return "aic"
    if "AVA" in name:
        return "ava"
    return c.get("line") or "unknown"


def load_dir(d):
    p = pathlib.Path(d)
    files = sorted(p.rglob("*.json")) if p.is_dir() else [p]
    out = []
    for f in files:
        try:
            c = json.loads(f.read_text(encoding="utf-8"))
        except (ValueError, OSError) as e:  # another session may be mid-write; skip, never touch it
            print(f"  skipped unreadable {f.name}: {e.__class__.__name__}")
            continue
        if isinstance(c, dict) and isinstance(c.get("call"), dict):  # Session A harness wrapper {agentKey, test, label, call}
            tag = " ".join(str(c.get(k)) for k in ("agentKey", "test", "label") if c.get(k))
            c = {**c["call"], "_qa_tag": tag}
        if (isinstance(c, dict) and str(c.get("call_id", "")).startswith(("call_", "text_")) and ("agent_id" in c or "call_status" in c)
                and "verdict" not in c):  # skip the grader's own output files
            out.append(c)
    return out


def fetch_live(ids):
    import _retell as R
    return [M.mask_call(R.get_call(cid)) for cid in ids]


# ---------- code metrics ----------

def utterances(c):
    to = c.get("transcript_object")
    if to is None:  # text-caller transcript: derive from the message list
        to = [{"role": m["role"], "content": m.get("content", "")} for m in c.get("transcript_with_tool_calls") or []
              if m.get("role") in ("agent", "user")]
    return [u for u in to if u.get("role") in ("agent", "user")]


def pct(vals, q):
    s = sorted(v for v in vals if v is not None)
    if not s:
        return None
    k = (len(s) - 1) * q
    lo = int(k)
    hi = min(lo + 1, len(s) - 1)
    return s[lo] + (s[hi] - s[lo]) * (k - lo)


def timing(U):
    turns = []
    for i in range(1, len(U)):
        u, p = U[i], U[i - 1]
        if u["role"] != "agent" or not u.get("words"):
            continue
        a_start = u["words"][0]["start"]
        if p["role"] == "agent":
            if p.get("words"):
                sil = a_start - p["words"][-1]["end"]
                turns.append({"turn": i, "kind": "silence prompt" if sil >= SILENCE_PROMPT_S else "agent continuation",
                              "silence_s": round(sil, 3), "agent_words": u["content"]})
            continue
        if not p.get("words"):
            continue
        gap = a_start - p["words"][-1]["end"]
        turns.append({"turn": i, "kind": "overlap" if gap < 0 else "response", "gap_s": round(gap, 3),
                      "caller_words": p["content"], "agent_words": u["content"]})
    resp = [t for t in turns if t["kind"] == "response"]
    gaps = [t["gap_s"] for t in resp]
    mx = max(resp, key=lambda t: t["gap_s"]) if resp else None
    return {
        "measured": bool(gaps),
        "response_turns": len(resp), "overlaps_excluded": sum(t["kind"] == "overlap" for t in turns),
        "silence_prompts": [t for t in turns if t["kind"] == "silence prompt"],
        "gap_p50_s": round(pct(gaps, 0.5), 2) if gaps else None,
        "gap_p95_s": round(pct(gaps, 0.95), 2) if gaps else None,
        "gap_max_s": round(mx["gap_s"], 2) if mx else None,
        "gap_max_turn": ({"turn": mx["turn"], "caller_words": mx["caller_words"].strip(), "agent_words": mx["agent_words"].strip()} if mx else None),
        "turns": turns,
    }


def norm(s):
    return re.sub(r"\s+", " ", s or "").strip()


def greeting_check(c, line, U):
    cfg = LINES.get(line)
    if not cfg or not U:
        return {"status": "no greeting (no speech on the call)" if not U else "no stored greeting", "said": "", "expected_source": None}
    # what the agent said before the first caller turn it answered (agent pieces split by overlapping caller speech join up)
    spoken = []
    i = next((k for k, u in enumerate(U) if u["role"] == "agent"), len(U))  # a caller who speaks first is not the greeting
    while i < len(U):
        u = U[i]
        if u["role"] == "agent":
            prev = U[i - 1] if i else None
            if (spoken and prev and prev["role"] == "agent" and prev.get("words") and u.get("words")
                    and u["words"][0]["start"] - prev["words"][-1]["end"] >= SILENCE_PROMPT_S):
                break  # a silence prompt after the greeting is not part of it
            spoken.append(u["content"])
        else:
            nxt = U[i + 1] if i + 1 < len(U) else None
            overlap = (nxt and nxt["role"] == "agent" and u.get("words") and nxt.get("words")
                       and nxt["words"][0]["start"] < u["words"][-1]["end"])
            if not overlap:
                break
        i += 1
    said = norm(" ".join(spoken))
    expected, source = [], None
    var = cfg.get("greeting_variable")
    dv = c.get("retell_llm_dynamic_variables") or {}
    if var and dv.get(var):
        expected, source = [dv[var]], f"call variable {var}"
    else:
        expected, source = list(cfg["greetings"].values()), cfg["greeting_source"]  # a {{var}} template matches any filled-in value
    status = "changed"
    for e in expected:
        if "{{" in e:
            rx = re.escape(norm(e))
            rx = re.sub(r"\\\{\\\{[^}]*\\\}\\\}", r".{1,40}?", rx)
            if re.fullmatch(rx, said):
                status = "exact"
                break
            head = norm(e.split("{{")[0])
            if said and head.startswith(said):
                status = "cut short (caller spoke or hung up)"
            continue
        ne = norm(e)
        if said == ne:
            status = "exact"
            break
        if said and ne.startswith(said):
            status = "cut short (caller spoke or hung up)"
    if not said:
        status = "no agent greeting"
    return {"status": status, "said": said, "expected_source": source}


def recorded_notice(U, line):
    agent_text = " ".join(u["content"] for u in U if u["role"] == "agent")
    return bool(re.search(r"(?i)\brecorded\b", agent_text))


def extracted(c):
    srcs = {}
    cad = (c.get("call_analysis") or {}).get("custom_analysis_data") or {}
    if cad:
        srcs["post_call_analysis"] = cad
    cdv = c.get("collected_dynamic_variables") or {}
    if cdv:
        srcs["dynamic_variables"] = {k: v for k, v in cdv.items() if k in TRIP_KEYS}
    out = {}
    for name, d in srcs.items():
        present = sorted(k for k, v in d.items() if v not in ("", None, [], {}, 0, False, "0", "not_stated", "unknown"))
        empty = sorted(k for k in d if k not in present)
        out[name] = {"present": present, "empty": empty}
    trip = {}
    for name, d in srcs.items():
        for k in TRIP_KEYS:
            if k in d:
                trip[k] = trip.get(k) or (d[k] not in ("", None, 0, "0", "not_stated", "unknown"))
    out["trip_fields_present"] = sorted(k for k, v in trip.items() if v)
    out["trip_fields_empty"] = sorted(k for k, v in trip.items() if not v)
    return out


def render(c, U):
    """Numbered transcript for the model; [tool] lines interleaved where the call recorded them."""
    tw = c.get("transcript_with_tool_calls") or []
    seq = [m for m in tw if m.get("role") in ("agent", "user")]
    lines = []
    if tw and len(seq) == len(U):
        k = 0
        results = {m.get("tool_call_id"): m for m in tw if m.get("role") == "tool_call_result"}
        for m in tw:
            r = m.get("role")
            if r in ("agent", "user"):
                lines.append(f"[{k}] {'AGENT' if r == 'agent' else 'CALLER'}: {norm(m.get('content'))}")
                k += 1
            elif r == "tool_call_invocation" and m.get("type") not in TOOL_SKIP_TYPES:
                res = results.get(m.get("tool_call_id")) or {}
                ok = res.get("successful")
                body = norm(str(res.get("content", "")))[:160]
                lines.append(f"[tool] {m.get('name')} -> {'success' if ok else 'failed' if ok is False else 'no result'}: {body}")
    else:
        lines = [f"[{k}] {'AGENT' if u['role'] == 'agent' else 'CALLER'}: {norm(u['content'])}" for k, u in enumerate(U)]
    return "\n".join(lines)


def call_date(c):
    ct = datetime.timezone(datetime.timedelta(hours=-5))  # CDT; DST ends Nov 1 2026
    if c.get("start_timestamp"):
        d = datetime.datetime.fromtimestamp(c["start_timestamp"] / 1000, ct)
    elif c.get("run_at"):
        d = datetime.datetime.fromisoformat(c["run_at"])
    else:
        d = datetime.datetime.now(ct)
    return d.strftime("%A %Y-%m-%d")


def code_facts(c, line, U, T, G, notice, X):
    return {
        "call_id": c["call_id"], "line": line, "agent_id": c.get("agent_id"), "agent_version": c.get("agent_version"),
        "source": c.get("_qa_tag") or c.get("_qa_source", "retell_call"), "call_type": c.get("call_type"),
        "call_date": call_date(c),
        "caller_id": (c.get("from_number") if c.get("call_type") == "phone_call" else None)
                     or (c.get("retell_llm_dynamic_variables") or {}).get("user_number")
                     or (c.get("collected_dynamic_variables") or {}).get("user_number"),
        "duration_s": round((c.get("duration_ms") or 0) / 1000, 2) if c.get("duration_ms") else None,
        "disconnection_reason": c.get("disconnection_reason"),
        "utterances": len(U), "caller_utterances": sum(u["role"] == "user" for u in U),
        "timing": T, "greeting": G, "recorded_notice_present": notice, "extracted": X,
    }


# ---------- model ----------

def request_params(facts, transcript):
    user = (f"DATE OF THE CALL: {facts['call_date']} (America/Chicago). Judge dates and weekdays against this date.\n"
            f"LINE: {facts['line']} ({LINES.get(facts['line'], {}).get('name', 'unknown line')})\n"
            f"SOURCE: {facts['source']}\n"
            f"CALLER ID on this call: {facts['caller_id'] or 'none'} (the agent may read this number back; it is not invented)\n"
            f"COMPUTED IN CODE (facts, do not re-judge): greeting = {facts['greeting']['status']}; "
            f"recorded notice present = {facts['recorded_notice_present']}; disconnection = {facts['disconnection_reason']}\n\n"
            f"TRANSCRIPT\n{transcript}\n\nGrade this call against the rubric. Use the utterance numbers as turn numbers.")
    return {
        "model": C.HAIKU, "max_tokens": 16000,
        "output_config": {"effort": "medium", "format": {"type": "json_schema", "schema": VERDICT_SCHEMA}},
        "system": [{"type": "text", "text": RUBRIC, "cache_control": {"type": "ephemeral"}}],
        "messages": [{"role": "user", "content": user}],
    }


def finish(facts, verdict, U, usage_row=None):
    T = facts["timing"]
    by_turn = {t["turn"]: t for t in T["turns"]}
    filtered = []
    for k in FINDING_LISTS:
        real = lambda x: x.get("is_finding", True) and "not a finding" not in json.dumps(x).lower()  # noqa: E731
        keep = [x for x in verdict.get(k) or [] if real(x)]
        filtered += [{"list": k, **x} for x in verdict.get(k) or [] if not real(x)]
        verdict[k] = keep
    qs = []
    for q in verdict.get("caller_questions") or []:
        caller = norm(U[q["turn"]]["content"]) if 0 <= q["turn"] < len(U) and U[q["turn"]]["role"] == "user" else ""
        ended = caller.rstrip()[-1:] in (".", "!") if caller else False
        if "?" in caller or (not ended and QUESTION_START.search(caller or q["question"])):
            qs.append(q)
        else:  # a statement or request the model counted as a question (rubric R1 says it is not)
            filtered.append({"list": "caller_questions", **q})
    verdict["caller_questions"] = qs
    for q in qs:
        nxt = next((i for i in range(q["turn"] + 1, len(U)) if U[i]["role"] == "agent"), None)
        t = by_turn.get(nxt) if nxt is not None else None
        q["agent_reply_turn"] = nxt
        if nxt is not None:
            q["agent_reply"] = norm(U[nxt]["content"])  # the transcript's words, not the model's paraphrase
        q["reply_gap_s"] = t.get("gap_s") if t else None
    skipped = [q for q in qs if not q["answered_before_next_ask"]]
    return {**facts, "verdict": verdict, "grader_filtered": filtered, "question_skipped": bool(skipped),
            "questions_asked": len(qs), "questions_skipped": len(skipped), "red_flags": flags_of(facts, verdict, skipped),
            "verification": [], "grader": {"model": C.HAIKU if usage_row else None, "usage": usage_row}}


def flags_of(facts, verdict, skipped):
    T = facts["timing"]
    flags = []
    if skipped:
        flags.append("question skipped")
    if T["gap_max_s"] is not None and T["gap_max_s"] > GAP_FLAG_S:
        flags.append(f"gap over {GAP_FLAG_S:.0f} s")
    if verdict.get("invented_facts"):
        flags.append("invented fact")
    if facts["greeting"]["status"] == "changed":
        flags.append("greeting changed")
    if verdict.get("dead_ends"):
        flags.append("dead end")
    if verdict.get("fields_reasked"):
        flags.append("field re-asked")
    if verdict.get("booked_before_tool"):
        flags.append("booked before tool")
    if verdict.get("said_owner_or_name"):
        flags.append("said owner/name")
    if (LINES.get(facts["line"], {}).get("recorded_notice_required") and not facts["recorded_notice_present"]
            and facts["greeting"]["status"] in ("exact", "changed")):  # a greeting cut off before the notice proves nothing
        flags.append("no recorded notice")
    if facts["line"] == "aic" and verdict.get("outcome") == "trip_captured" and not facts["extracted"]["trip_fields_present"]:
        flags.append("no trip sheet")
    return flags


VERIFY_SCHEMA = {"type": "object", "properties": {"holds": {"type": "boolean"}, "reason": {"type": "string"}},
                 "required": ["holds", "reason"], "additionalProperties": False}


def window(U, lo, hi):
    lo, hi = max(0, lo), min(len(U) - 1, hi)
    return "\n".join(f"[{k}] {'AGENT' if U[k]['role'] == 'agent' else 'CALLER'}: {norm(U[k]['content'])}" for k in range(lo, hi + 1))


def verify(r, U, step):
    """Second, narrow pass: each skipped question and each invented fact is re-asked on its own.
    An item counts only if this pass upholds it ("holds": true)."""
    v = r["verdict"]
    asks = []
    for q in v["caller_questions"]:
        if not q["answered_before_next_ask"] and q.get("agent_reply_turn") is not None:
            asks.append(("question", q, f"Rule R1. The caller's question is at [{q['turn']}]. The agent's next turn is [{q['agent_reply_turn']}].\n\n"
                         f"{window(U, q['turn'] - 2, q['agent_reply_turn'])}\n\nDoes the rule break HOLD — i.e. does turn [{q['agent_reply_turn']}] "
                         f"fail to answer or address the caller's question (and the caller did not answer it themselves)? holds=true means the question was skipped."))
    for f in v["invented_facts"]:
        asks.append(("invented", f, f"Rule R6 and the LINE FACTS (line: {r['line']}). The agent said at [{f['turn']}]: \"{f['agent_words']}\" "
                     f"(flagged as {f['kind']}: {f['why']}).\n\n{window(U, f['turn'] - 2, f['turn'] + 1)}\n\nDoes the finding HOLD — is this a "
                     f"specific claim that is false or not covered by the LINE FACTS or a tool result? holds=true means it is an invented fact."))
    for d in v["dead_ends"]:
        asks.append(("dead_end", d, f"Rule R7. Flagged dead end at [{d['turn']}]: {d['what_happened']}\n\n{window(U, d['turn'] - 2, d['turn'] + 2)}\n\n"
                     f"Does the finding HOLD — did the caller hesitate, stall or go off track and the agent leave them with no way forward "
                     f"(remember: a caller hanging up by itself, an agent turn that asks or offers a next step, and a skipped question are not dead ends)?"))
    for f in v["fields_reasked"]:
        asks.append(("reasked", f, f"Rule R8. Flagged re-ask of '{f['field']}' at [{f['turn']}] (given at [{f['given_at_turn']}]): \"{f['agent_words']}\"\n\n"
                     f"{window(U, f['given_at_turn'] - 1, f['turn'] + 1)}\n\nDoes the finding HOLD — did the agent ask for this field again as if it were "
                     f"missing (not a read-back, not after the caller's own correction, and the caller had clearly given it)?"))
    if not asks:
        return r
    for kind, item, prompt in asks:
        m = C.create(step, note=f"verify {r['call_id']} {kind} t{item['turn']}", model=C.HAIKU, max_tokens=4000,
                     output_config={"effort": "medium", "format": {"type": "json_schema", "schema": VERIFY_SCHEMA}},
                     system=[{"type": "text", "text": RUBRIC, "cache_control": {"type": "ephemeral"}}],
                     messages=[{"role": "user", "content": prompt}])
        ans = json.loads(C.text_of(m))
        r["verification"].append({"kind": kind, "turn": item["turn"], "holds": ans["holds"], "reason": ans["reason"]})
        if not ans["holds"]:
            if kind == "question":
                item["answered_before_next_ask"] = True
                item["note"] = f"overturned by the verification pass: {ans['reason']}"
            else:
                lst = {"invented": "invented_facts", "dead_end": "dead_ends", "reasked": "fields_reasked"}[kind]
                v[lst].remove(item)
                r["grader_filtered"].append({"list": lst, "verification": ans["reason"], **item})
    skipped = [q for q in v["caller_questions"] if not q["answered_before_next_ask"]]
    r["questions_skipped"], r["question_skipped"] = len(skipped), bool(skipped)
    r["red_flags"] = flags_of(r, v, skipped)
    return r


def empty_verdict(note):
    return {"caller_questions": [], "fields_reasked": [], "invented_facts": [], "dead_ends": [], "multi_question_turns": [],
            "booked_before_tool": [], "said_owner_or_name": [], "outcome": "abandoned", "outcome_note": note, "summary": note}


# ---------- output ----------

def fmt(v, nd=2):
    return "—" if v is None else (f"{v:.{nd}f}" if isinstance(v, float) else str(v))


def summary_md(results, label):
    rows = ["| # | call | line | ver | src | dur s | disconnect | gap p50 / p95 / max s (turn) | Qs asked / skipped | re-asks | invented | dead ends | greeting | notice | outcome | red flags |",
            "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|"]
    for n, r in enumerate(results, 1):
        T, v = r["timing"], r["verdict"]
        mt = T["gap_max_turn"]
        gap = f"{fmt(T['gap_p50_s'])} / {fmt(T['gap_p95_s'])} / {fmt(T['gap_max_s'])}" + (f" (t{mt['turn']})" if mt else "")
        rows.append(f"| {n} | `{r['call_id']}` | {r['line']} | {fmt(r['agent_version'])} | {r['source'].replace('retell_call', 'call')} | "
                    f"{fmt(r['duration_s'], 1)} | {fmt(r['disconnection_reason'])} | {gap} | {r['questions_asked']} / {r['questions_skipped']} | "
                    f"{len(v['fields_reasked'])} | {len(v['invented_facts'])} | {len(v['dead_ends'])} | {r['greeting']['status']} | "
                    f"{'yes' if r['recorded_notice_present'] else 'no'} | {v['outcome']} | {', '.join(r['red_flags']) or '—'} |")
    skipped = [(r, q) for r in results for q in r["verdict"]["caller_questions"] if not q["answered_before_next_ask"]]
    lines = [f"## QA grade — {label} ({len(results)} calls)", "", *rows, ""]
    if skipped:
        lines += ["**Skipped questions** (caller turn → agent reply, gap):", ""]
        for r, q in skipped:
            lines.append(f"- `{r['call_id']}` t{q['turn']} \"{q['question']}\" → t{q['agent_reply_turn']} \"{q['agent_reply']}\" · gap {fmt(q['reply_gap_s'])} s")
        lines.append("")
    inv = [(r, f) for r in results for f in r["verdict"]["invented_facts"]]
    if inv:
        lines += ["**Invented facts:**", ""] + [f"- `{r['call_id']}` t{f['turn']} [{f['kind']}] \"{f['agent_words']}\" — {f['why']}" for r, f in inv] + [""]
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("call_ids", nargs="*")
    ap.add_argument("--agent")
    ap.add_argument("--last", type=int, default=20)
    ap.add_argument("--dir")
    ap.add_argument("--batch", action="store_true", help="grade through the Batch API (50%% price, minutes not seconds)")
    ap.add_argument("--no-model", action="store_true", help="code metrics only, no Claude spend")
    ap.add_argument("--no-verify", action="store_true", help="skip the second, narrow pass on skipped questions and invented facts")
    ap.add_argument("--label", default=None)
    ap.add_argument("--out", default=str(REPO / "ops" / "tuning" / "qa" / datetime.date.today().isoformat()))
    ap.add_argument("--step", default="grade", help="ledger step name")
    a = ap.parse_args()

    calls = []
    if a.dir:
        calls += [M.mask_call(c) for c in load_dir(a.dir)]
    if a.agent:
        import _retell as R
        calls += fetch_live(R.list_call_ids(a.agent, a.last))
    if a.call_ids:
        calls += fetch_live(a.call_ids)
    if not calls:
        ap.error("nothing to grade: give call ids, --agent, or --dir")
    label = a.label or (pathlib.Path(a.dir).name if a.dir else a.agent or "calls")
    out = pathlib.Path(a.out)
    out.mkdir(parents=True, exist_ok=True)

    prepared = []
    for c in calls:
        line = line_of(c)
        U = utterances(c)
        T = timing(U)
        facts = code_facts(c, line, U, T, greeting_check(c, line, U), recorded_notice(U, line), extracted(c))
        prepared.append((c, U, facts, render(c, U)))

    need = [(c, U, f, tx) for c, U, f, tx in prepared if f["caller_utterances"] and not a.no_model]
    verdicts = {}
    spend0 = C.spent(a.step)
    if need and a.batch:
        res, batch_id = C.run_batch(a.step, [(c["call_id"], request_params(f, tx)) for c, U, f, tx in need], note=label)
        for cid, m in res.items():
            verdicts[cid] = (json.loads(C.text_of(m)), m.usage.model_dump()) if hasattr(m, "content") else (empty_verdict(f"grader error: {m}"), None)
    else:
        for c, U, f, tx in need:
            m = C.create(a.step, note=c["call_id"], **request_params(f, tx))
            verdicts[c["call_id"]] = (json.loads(C.text_of(m)), m.usage.model_dump())

    results = []
    for c, U, f, tx in prepared:
        if c["call_id"] in verdicts:
            v, usage = verdicts[c["call_id"]]
        else:
            v, usage = empty_verdict("no caller words — not sent to the grader" if not f["caller_utterances"] else "code metrics only (--no-model)"), None
        r = finish(f, v, U, usage)
        if usage is not None and not a.no_verify:
            r = verify(r, U, a.step)
        (out / f"{c['call_id']}.json").write_text(json.dumps(r, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        results.append(r)

    md = summary_md(results, label)
    step_usd = C.spent(a.step) - spend0
    md += f"\nGrader spend this run: ${step_usd:.4f} ({'Batch API, 50%' if a.batch else 'standard'}) · model {C.HAIKU}\n"
    (out / f"summary-{label}.md").write_text(md, encoding="utf-8")
    (out / f"summary-{label}.json").write_text(json.dumps([{k: r[k] for k in ("call_id", "line", "agent_version", "question_skipped", "questions_asked", "questions_skipped", "red_flags")} | {"gap_p50_s": r["timing"]["gap_p50_s"], "gap_p95_s": r["timing"]["gap_p95_s"], "gap_max_s": r["timing"]["gap_max_s"], "outcome": r["verdict"]["outcome"], "greeting": r["greeting"]["status"]} for r in results], indent=2) + "\n", encoding="utf-8")
    print(md)
    print(f"wrote {len(results)} call files + summary-{label}.md to {out}")


if __name__ == "__main__":
    main()
