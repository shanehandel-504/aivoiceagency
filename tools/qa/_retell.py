"""Retell transport for tools/qa — reads, plus the one stateless text endpoint.

GET only, except two POSTs on a hard allowlist:
  /v3/list-calls                       a read Retell moved onto POST (CLAUDE.md § RETELL API RULES)
  /agent-playground-completion/{id}    stateless text turn; the docs say "Nothing is persisted
                                       server-side" (docs.retellai.com/api-references/agent-playground-completion)
Anything else raises READ-ONLY GUARD. No agent, flow, number or workflow is ever written from here.
Key comes from the environment (run under `doppler run -p ava-prod -c prd --`).
"""
import json
import os
import time
import urllib.error
import urllib.request

BASE = "https://api.retellai.com"
GET_PREFIXES = ("/v2/get-call/", "/get-agent/", "/get-conversation-flow/", "/get-retell-llm/",
                "/get-phone-number/", "/v2/list-phone-numbers", "/list-agent-versions/")
POST_EXACT = {"/v3/list-calls"}
POST_PREFIXES = ("/agent-playground-completion/",)

REQUEST_LOG = []  # (method, path) for the report's ENDPOINTS line


def _key():
    k = os.environ.get("RETELL_API_KEY", "")
    if not k:
        raise SystemExit("RETELL_API_KEY not set — run under: doppler run -p ava-prod -c prd -- python ...")
    return k


def _send(method, path, body=None, timeout=90):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method)
    req.add_header("Authorization", "Bearer " + _key())
    if data is not None:
        req.add_header("Content-Type", "application/json")
    for attempt in range(6):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                raw = r.read().decode("utf-8")
                REQUEST_LOG.append((method, path.split("?")[0]))
                return r.status, (json.loads(raw) if raw else {})
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 5:
                time.sleep(1.5 * (attempt + 1))
                continue
            raw = e.read().decode("utf-8", "replace")
            REQUEST_LOG.append((method, path.split("?")[0]))
            try:
                return e.code, json.loads(raw)
            except ValueError:
                return e.code, {"_raw": raw[:400]}
    raise RuntimeError("unreachable")


def get(path):
    if not path.startswith(GET_PREFIXES):
        raise SystemExit(f"READ-ONLY GUARD — GET path not on the allowlist: {path}")
    return _send("GET", path)


def post(path, body):
    bare = path.split("?")[0]
    if bare not in POST_EXACT and not bare.startswith(POST_PREFIXES):
        raise SystemExit(f"READ-ONLY GUARD — POST refused: {bare}")
    return _send("POST", path, body)


def get_call(call_id):
    s, b = get(f"/v2/get-call/{call_id}")
    if s != 200:
        raise SystemExit(f"get-call {call_id} -> HTTP {s}: {str(b)[:200]}")
    return b


def list_call_ids(agent_id, last_n):
    """Newest-first call ids for one agent. /v3 returns {items, pagination_key, has_more}."""
    ids, key = [], None
    while len(ids) < last_n:
        body = {"filter_criteria": {"agent_id": [agent_id]}, "sort_order": "descending",
                "limit": min(100, last_n - len(ids))}
        if key:
            body["pagination_key"] = key
        s, b = post("/v3/list-calls", body)
        if s != 200:
            raise SystemExit(f"list-calls -> HTTP {s}: {str(b)[:200]}")
        items = b.get("items") or []
        ids += [c["call_id"] for c in items]
        key = b.get("pagination_key")
        if not b.get("has_more") or not items:
            break
    return ids[:last_n]
