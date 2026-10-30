"""Claude API client for tools/qa, with a token + dollar ledger and a hard spend cap.

Every request's usage is appended to <ledger dir>/ledger.jsonl (step, model, tokens, dollars).
Dollars = measured tokens x list price (claude-api skill price table, cached 2026-10-06);
Batch API requests bill at 50%. The cap (QA_CAP_USD, default 10) is checked before every
request against the ledger's total; at the cap the run stops with CapReached.
Key comes from the environment (ANTHROPIC_API_KEY, via Doppler ava-prod/prd).
"""
import datetime
import json
import os
import pathlib
import threading
import time

import anthropic

HAIKU = "claude-haiku-5-5"     # grading
SONNET = "claude-sonnet-5-5"   # scenario writing, playing the caller

# $ per million tokens: (input, output). Haiku 5.5 rate is for prompts up to 100K tokens.
PRICES = {HAIKU: (0.10, 0.50), SONNET: (2.00, 10.00)}
CACHE_WRITE_X = 1.25   # 5-minute cache write
CACHE_READ_X = 0.10
BATCH_X = 0.50

REPO = pathlib.Path(__file__).resolve().parents[2]
TODAY = datetime.date.today().isoformat()
LEDGER_DIR = pathlib.Path(os.environ.get("QA_LEDGER_DIR", REPO / "ops" / "tuning" / "qa" / TODAY))
LEDGER = LEDGER_DIR / "ledger.jsonl"
CAP = float(os.environ.get("QA_CAP_USD", "10"))


class CapReached(SystemExit):
    pass


_LOCK = threading.Lock()  # text_caller runs scenarios in threads; ledger lines must not interleave


_client = None


def client():
    global _client
    if _client is None:
        if not os.environ.get("ANTHROPIC_API_KEY"):
            raise SystemExit("ANTHROPIC_API_KEY not set — run under: doppler run -p ava-prod -c prd -- python ...")
        _client = anthropic.Anthropic(max_retries=4)
    return _client


def dollars(model, usage, batch=False):
    pin, pout = PRICES[model]
    u = usage if isinstance(usage, dict) else usage.model_dump()
    inp = u.get("input_tokens") or 0
    out = u.get("output_tokens") or 0
    cw = u.get("cache_creation_input_tokens") or 0
    cr = u.get("cache_read_input_tokens") or 0
    d = (inp * pin + cw * pin * CACHE_WRITE_X + cr * pin * CACHE_READ_X + out * pout) / 1e6
    return d * (BATCH_X if batch else 1.0)


def spent(step=None):
    if not LEDGER.exists():
        return 0.0
    total = 0.0
    for line in LEDGER.read_text(encoding="utf-8").splitlines():
        if line.strip():
            try:
                r = json.loads(line)
            except ValueError:  # a row another process is still writing
                continue
            if step is None or r["step"] == step:
                total += r["usd"]
    return total


def check_cap(next_estimate=0.0):
    s = spent()
    if s + next_estimate >= CAP:
        raise CapReached(f"SPEND CAP — ledger total ${s:.4f} (+${next_estimate:.4f} next) reaches the ${CAP:.2f} cap. Stopping.")


def record(step, model, usage, batch=False, note=""):
    u = usage if isinstance(usage, dict) else usage.model_dump()
    row = {"t": time.strftime("%Y-%m-%dT%H:%M:%S"), "step": step, "model": model, "batch": batch,
           "input_tokens": u.get("input_tokens") or 0, "output_tokens": u.get("output_tokens") or 0,
           "cache_creation_input_tokens": u.get("cache_creation_input_tokens") or 0,
           "cache_read_input_tokens": u.get("cache_read_input_tokens") or 0,
           "usd": round(dollars(model, u, batch), 6), "note": note}
    LEDGER_DIR.mkdir(parents=True, exist_ok=True)
    with _LOCK, _file_lock():
        with LEDGER.open("a", encoding="utf-8") as f:
            f.write(json.dumps(row) + "\n")
    return row


class _file_lock:
    """Cross-process lock on ledger.lock. Two graders appending at once on Windows overwrote part of a row
    (2026-10-29): text-mode append is seek-then-write there, not atomic."""

    def __enter__(self):
        self.f = open(LEDGER_DIR / "ledger.lock", "a+b")
        if os.name == "nt":
            import msvcrt
            self.f.seek(0)
            while True:
                try:
                    msvcrt.locking(self.f.fileno(), msvcrt.LK_LOCK, 1)
                    break
                except OSError:
                    time.sleep(0.05)
        else:
            import fcntl
            fcntl.flock(self.f, fcntl.LOCK_EX)
        return self

    def __exit__(self, *exc):
        if os.name == "nt":
            import msvcrt
            self.f.seek(0)
            msvcrt.locking(self.f.fileno(), msvcrt.LK_UNLCK, 1)
        self.f.close()


def text_of(msg):
    return "".join(b.text for b in msg.content if b.type == "text")


def create(step, note="", **params):
    """One Messages API call, recorded in the ledger. Returns the Message."""
    check_cap()
    msg = client().messages.create(**params)
    record(step, params["model"], msg.usage, False, note)
    if msg.stop_reason == "refusal":
        raise RuntimeError(f"refusal on {note}: {getattr(msg, 'stop_details', None)}")
    return msg


def run_batch(step, requests, poll_s=15, note=""):
    """requests: list of (custom_id, params). Returns {custom_id: Message or error str}. Records usage at 50%."""
    check_cap()
    from anthropic.types.message_create_params import MessageCreateParamsNonStreaming
    from anthropic.types.messages.batch_create_params import Request
    reqs = [Request(custom_id=cid, params=MessageCreateParamsNonStreaming(**p)) for cid, p in requests]
    b = client().messages.batches.create(requests=reqs)
    print(f"  batch {b.id} submitted · {len(reqs)} requests", flush=True)
    t0 = time.time()
    while True:
        b = client().messages.batches.retrieve(b.id)
        if b.processing_status == "ended":
            break
        time.sleep(poll_s)
    print(f"  batch {b.id} ended in {time.time() - t0:.0f} s · {b.request_counts}", flush=True)
    out = {}
    model_of = {cid: p["model"] for cid, p in requests}
    for r in client().messages.batches.results(b.id):
        if r.result.type == "succeeded":
            m = r.result.message
            record(step, model_of[r.custom_id], m.usage, True, f"{note} {r.custom_id}".strip())
            out[r.custom_id] = m
        else:
            out[r.custom_id] = f"{r.result.type}: {getattr(r.result, 'error', '')}"
    return out, b.id
