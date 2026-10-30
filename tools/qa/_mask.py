"""Masking for every call object tools/qa writes to disk or sends to the grading model.

Same rules as AGENT-MEASURE-v1 (public repo): keys, tokens, SIP/Twilio ids -> [masked]; URLs -> host/[path];
caller numbers -> last four; our own private lines (any phone-shaped Doppler value, plus the banned area codes)
-> [withheld]; emails -> [email]; spoken names and addresses from the call's own variables -> [caller] / [address].
Phase 0 files are already masked; running them through again changes nothing.
"""
import os
import re

PUBLIC = {"4142408930": "414-240-8930", "4147750019": "414-775-0019"}
BANNED_AC = ("305", "480", "786", "350")
SECRET_KEYS = re.compile(r"(secret|token|password|api[_-]?key|authorization|signature|credential|twilio|sid\b|accountsid|callsid)", re.I)
DROP_KEYS = {"access_token", "ice_servers", "gateway_ip", "telephony_identifier", "custom_sip_headers", "pcap_url",
             "diversion", "p-asserted-identity"}
ADDR_KEYS = ("pickup_address", "pickup_location", "dropoff_address", "dropoff_location", "stops")
ADDR_RE = re.compile(r"(?i)\b(road|rd|street|st|avenue|ave|drive|dr|lane|ln|way|court|ct|boulevard|blvd|highway|hwy)\b")
NAME_KEYS = ("caller_name", "real_name", "company", "company_name", "company_spelled", "business_name", "caller_first",
             "caller_first_name", "name", "sign_name", "sign_text", "caller_email", "email")
SKIP = {"demo", "test", "i", "you", "unknown", "none", "n/a", "caller", "[caller]", "[address]", ""}

PHONE_RE = re.compile(r"(?<![\w-])(?:\+?1[\s.-]?)?\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})(?![\w-])")
DIGIT_SPOKEN_RE = re.compile(r"(?<!\d)(\d(?:-\d){9,10})(?!\d)")
URL_RE = re.compile(r"https?://([^/\s\"'<>]+)[^\s\"'<>]*")
EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
SID_RE = re.compile(r"\b(AC|CA|PN|SK|MG|RE|CF|SM|MM|AP|QU|TR|WS|IS|ZS)[0-9a-fA-F]{32}\b")


def _private_last10():
    out = set()
    for k, v in os.environ.items():
        d = re.sub(r"\D", "", v or "")
        if 10 <= len(d) <= 12 and k.isupper():
            out.add(d[-10:])
    return out


PRIVATE = _private_last10()


def phone_label(d10):
    if d10 in PUBLIC:
        return PUBLIC[d10]
    if d10 in PRIVATE or d10[:3] in BANNED_AC:
        return "[withheld]"
    if d10[3:6] == "555" and d10[6:8] == "01":   # reserved fictional range used by test scripts
        return d10[:3] + "-555-" + d10[6:]
    return "…" + d10[-4:]


def mask_text(s, names=()):
    if not isinstance(s, str):
        return s
    s = URL_RE.sub(lambda m: f"{m.group(1)}/[path]", s)
    s = EMAIL_RE.sub("[email]", s)
    s = SID_RE.sub("[masked sid]", s)
    s = DIGIT_SPOKEN_RE.sub(lambda m: phone_label(re.sub(r"\D", "", m.group(1))[-10:]), s)
    s = PHONE_RE.sub(lambda m: phone_label(m.group(1) + m.group(2) + m.group(3)), s)
    for nm in names:
        text, label = nm if isinstance(nm, tuple) else (nm, "[address]" if ADDR_RE.search(nm) else "[caller]")
        s = re.sub(r"(?i)(?<![\w])" + re.escape(text) + r"(?![\w])", label, s)
    return s


def call_names(c):
    out = set()
    srcs = ((c.get("call_analysis") or {}).get("custom_analysis_data") or {}, c.get("collected_dynamic_variables") or {},
            c.get("retell_llm_dynamic_variables") or {})
    for src in srcs:
        for k, v in src.items():
            if not isinstance(v, str) or v.strip().lower() in SKIP:
                continue
            v = v.strip()
            if k in ADDR_KEYS and not re.search(r"(?i)airport|international|o'hare|mitchell|midway", v):
                out.add((v, "[address]"))
                # the core of a place as it is spoken back ("the Pfister Hotel in Milwaukee" -> "Pfister Hotel"),
                # so the caller's turn and the agent's read-back carry the same mask
                core = re.split(r"(?i),| in ", re.sub(r"(?i)^the\s+", "", v))[0].strip()
                if len(core) >= 5 and core.lower() not in SKIP:
                    out.add((core, "[address]"))
            elif k in NAME_KEYS and len(v) >= 3 and not re.fullmatch(r"[\d+\-() ]+", v):
                out.add((v, "[caller]"))
                out.update((p, "[caller]") for p in re.split(r"[,\s]+", v)
                           if len(p) >= 4 and p.lower() not in SKIP | {"limousine", "limo", "company", "services"})
    return sorted(out, key=lambda x: len(x[0]), reverse=True)


def mask_obj(o, names=(), key=None):
    if key in DROP_KEYS:
        return "[masked]"
    if isinstance(o, dict):
        out = {}
        for k, v in o.items():
            if k == "headers" and isinstance(v, dict):
                out[k] = {hk: "[masked]" for hk in v}
            elif k == "transfer_destination" and isinstance(v, dict):
                out[k] = {**v, "number": "[withheld]"} if v.get("number") else v
            elif SECRET_KEYS.search(k) and isinstance(v, str) and v:
                out[k] = "[masked]"
            else:
                out[k] = mask_obj(v, names, k)
        return out
    if isinstance(o, list):
        return [mask_obj(x, names, key) for x in o]
    if isinstance(o, str):
        return mask_text(o, names)
    return o


def mask_call(c):
    return mask_obj(c, call_names(c))
