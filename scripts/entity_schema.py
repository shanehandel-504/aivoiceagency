#!/usr/bin/env python3
# =============================================================================
# scripts/entity_schema.py  ·  RECOVERY v1 · 2026-10-28
# -----------------------------------------------------------------------------
# One entity on every page a machine reads. For each <loc> in sitemap.xml,
# mapped to the file Vercel serves for it, the page ends up with exactly one
# schema.org Organization, and that Organization is THE ENTITY below, verbatim.
#
#   * Organization already present (as a node inside an @graph, or as its own
#     <script type="application/ld+json"> block): only that object is replaced,
#     in place. Its text span is cut out and the entity is written back at the
#     same indentation. Every other node and block (WebSite, Service, FAQPage,
#     Article, WebPage, BreadcrumbList ...) stays byte for byte, and the script
#     proves it by re-parsing the block and comparing every other node.
#   * No Organization on the page: one standalone block is added in <head>,
#     right before </head>.
#   * More than one Organization: refused, nothing written for that page.
#
# The same file runs in both repos. The site is read off sitemap.xml's host:
#   aivoiceagency.ai  -> AI Voice Agency  (subOrganization AI Chauffeur)
#   aichauffeur.ai    -> AI Chauffeur     (parentOrganization AI Voice Agency)
#
# USAGE   python scripts/entity_schema.py            apply, print every page
#         python scripts/entity_schema.py --dry-run  print, write nothing
#         python scripts/entity_schema.py --check    exit 1 unless every page
#                                                    already carries the entity
# Standard library only. Line endings of each page are preserved. Idempotent.
# =============================================================================

import json
import pathlib
import re
import subprocess
import sys

AVA = {
    "@type": "Organization",
    "@id": "https://aivoiceagency.ai/#organization",
    "name": "AI Voice Agency",
    "url": "https://aivoiceagency.ai",
    "logo": "https://aivoiceagency.ai/og-image.png",
    "description": (
        "AI Voice Agency builds AI phone agents for local service businesses. AVA answers "
        "every call in the company's name, books the job on the calendar, and sends the "
        "details to the owner right after the call. Built in Kewaskum, Wisconsin; set up for "
        "businesses nationwide. Any voice. Any business."
    ),
    "telephone": "+1-414-240-8930",
    "email": "shane@aivoiceagency.ai",
    "address": {
        "@type": "PostalAddress",
        "postOfficeBoxNumber": "241",
        "addressLocality": "Kewaskum",
        "addressRegion": "WI",
        "postalCode": "53040",
        "addressCountry": "US",
    },
    "sameAs": [
        "https://www.facebook.com/AIVoiceAgency",
        "https://www.instagram.com/aivoiceagency.ai",
        "https://www.tiktok.com/@aivoiceagency.ai",
        "https://www.youtube.com/@aivoiceagency",
        "https://www.linkedin.com/company/aivoiceagency",
        "https://x.com/AIVoiceAgency",
        "https://aichauffeur.ai",
    ],
    "subOrganization": {
        "@type": "Organization",
        "name": "AI Chauffeur",
        "url": "https://aichauffeur.ai",
    },
}

# No email until the aichauffeur.ai mailbox is live.
AIC = {
    "@type": "Organization",
    "@id": "https://aichauffeur.ai/#organization",
    "name": "AI Chauffeur",
    "url": "https://aichauffeur.ai",
    "logo": None,  # filled from the site's own og:image at run time (see LOGO)
    "description": (
        "AI Chauffeur is the AI reservation desk for limousine and black car companies. It "
        "answers calls in your company's name, quotes from your rate sheet in your service "
        "area, books the trip, and sends dispatch the trip sheet with the recording and "
        "transcript right after the call. Built in Wisconsin, set up for operators nationwide."
    ),
    "telephone": "+1-414-775-0019",
    "address": {
        "@type": "PostalAddress",
        "postOfficeBoxNumber": "241",
        "addressLocality": "Kewaskum",
        "addressRegion": "WI",
        "postalCode": "53040",
        "addressCountry": "US",
    },
    "sameAs": [
        "https://www.instagram.com/aichauffeur",
        "https://www.youtube.com/@aichauffeur",
        "https://www.facebook.com/profile.php?id=61595146328236",
        "https://www.tiktok.com/@shanehandel",
        "https://www.linkedin.com/in/shane-handel",
        "https://aivoiceagency.ai",
    ],
    "parentOrganization": {
        "@type": "Organization",
        "name": "AI Voice Agency",
        "url": "https://aivoiceagency.ai",
    },
}

ENTITIES = {"aivoiceagency.ai": AVA, "aichauffeur.ai": AIC}
LOGO = {"aichauffeur.ai": "https://aichauffeur.ai/assets/og-card.png"}

LD_RE = re.compile(
    r'(<script\b[^>]*type\s*=\s*["\']application/ld\+json["\'][^>]*>)(.*?)(</script>)',
    re.S | re.I,
)


def repo_root():
    out = subprocess.run(["git", "rev-parse", "--show-toplevel"], capture_output=True, text=True, check=True)
    return pathlib.Path(out.stdout.strip())


# ------------------------------------------------------------- sitemap -> file
def sitemap_locs(root):
    xml = (root / "sitemap.xml").read_text(encoding="utf-8")
    xml = re.sub(r"<!--.*?-->", "", xml, flags=re.S)
    return [l.strip() for l in re.findall(r"<loc\b[^>]*>(.*?)</loc>", xml, flags=re.S)]


def vercel_cfg(root):
    try:
        return json.loads((root / "vercel.json").read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def source_file(root, cfg, host, loc):
    """Same rules as scripts/stamp-sitemap.mjs resolveSource()."""
    m = re.match(r"^https?://([^/]+)(/.*)?$", loc)
    if not m or m.group(1) != host:
        return None, "foreign or unparseable <loc>"
    p = m.group(2) or "/"
    rewrites = [
        r for r in cfg.get("rewrites", [])
        if isinstance(r.get("source"), str) and not re.search(r"[:(*]", r["source"])
        and str(r.get("destination", "")).startswith("/")
        and all(h.get("type") == "host" and h.get("value") == host for h in r.get("has", []))
    ]
    hit = next((r for r in rewrites if r["source"] == p), None)
    if hit:
        cands = [hit["destination"][1:]]
    elif p.endswith("/"):
        cands = [p[1:] + "index.html"]
    elif re.search(r"\.[a-z0-9]+$", p, re.I):
        cands = [p[1:]]
    else:
        cands = [p[1:] + "/index.html", p[1:] + ".html"] if cfg.get("cleanUrls") else [p[1:] + "/index.html"]
    found = [c for c in cands if (root / c).is_file()]
    if len(found) != 1:
        return None, f"no single source file (tried {', '.join(cands)})"
    return found[0], None


# ------------------------------------------------------------- JSON text spans
def _skip_string(s, i):
    i += 1
    while s[i] != '"':
        i += 2 if s[i] == "\\" else 1
    return i + 1


def _value_end(s, i):
    """Index just past the JSON value starting at s[i] (object/array/string/scalar)."""
    if s[i] == '"':
        return _skip_string(s, i)
    if s[i] in "{[":
        depth = 0
        while True:
            c = s[i]
            if c == '"':
                i = _skip_string(s, i)
                continue
            if c in "{[":
                depth += 1
            elif c in "}]":
                depth -= 1
                if depth == 0:
                    return i + 1
            i += 1
    m = re.compile(r"[^,\]}\s]+").match(s, i)
    return m.end()


def graph_element_spans(text):
    """(start, end) of each element of the top-level "@graph" array, or None."""
    i = text.index("{")
    i += 1
    while True:
        while text[i] in " \t\r\n,":
            i += 1
        if text[i] == "}":
            return None
        k_end = _skip_string(text, i)
        key = json.loads(text[i:k_end])
        i = k_end
        while text[i] in " \t\r\n:":
            i += 1
        v_end = _value_end(text, i)
        if key == "@graph":
            spans, j = [], i + 1
            while True:
                while text[j] in " \t\r\n,":
                    j += 1
                if text[j] == "]":
                    return spans
                e = _value_end(text, j)
                spans.append((j, e))
                j = e
        i = v_end


def is_org(node):
    t = node.get("@type") if isinstance(node, dict) else None
    return t == "Organization" or (isinstance(t, list) and "Organization" in t)


def dump_at(node, indent, eol):
    """JSON for node, its first line at the current column, later lines at `indent`."""
    lines = json.dumps(node, indent=2, ensure_ascii=False).split("\n")
    return (eol + indent).join(lines)


# ------------------------------------------------------------- one page
def process(html, entity):
    eol = "\r\n" if "\r\n" in html else "\n"
    blocks = list(LD_RE.finditer(html))
    hits = []  # (kind, block_match, span_or_None)
    for b in blocks:
        body = b.group(2)
        data = json.loads(body)
        if isinstance(data, dict) and isinstance(data.get("@graph"), list):
            spans = graph_element_spans(body)
            for (s, e) in spans:
                if is_org(json.loads(body[s:e])):
                    hits.append(("graph", b, (s, e)))
        elif isinstance(data, dict) and is_org(data):
            hits.append(("block", b, None))
        elif isinstance(data, list) and any(is_org(x) for x in data):
            hits.append(("list", b, None))

    if len(hits) > 1:
        return None, f"REFUSED: {len(hits)} Organization objects on the page"
    if hits and hits[0][0] == "list":
        return None, "REFUSED: Organization inside a bare JSON-LD array (not handled)"

    if not hits:
        head_end = html.lower().find("</head>")
        if head_end < 0:
            return None, "REFUSED: no </head>"
        line_start = html.rfind("\n", 0, head_end) + 1
        indent = re.match(r"[ \t]*", html[line_start:head_end]).group(0)
        node = {"@context": "https://schema.org", **entity}
        block = '<script type="application/ld+json">' + eol + dump_at(node, "", eol) + eol + "</script>" + eol + indent
        return html[:head_end] + block + html[head_end:], "inserted before </head>"

    kind, b, span = hits[0]
    body = b.group(2)
    before = json.loads(body)
    if kind == "graph":
        s, e = span
        current = json.loads(body[s:e])
        if current == entity:
            return html, "unchanged"
        line_start = body.rfind("\n", 0, s) + 1
        indent = re.match(r"[ \t]*", body[line_start:s]).group(0)
        new_body = body[:s] + dump_at(entity, indent, eol) + body[e:]
        after = json.loads(new_body)
        others_before = [n for n in before["@graph"] if not is_org(n)]
        others_after = [n for n in after["@graph"] if not is_org(n)]
        assert others_before == others_after, "a non-Organization node changed"
        assert [n for n in after["@graph"] if is_org(n)] == [entity], "entity not written"
        assert {k: v for k, v in before.items() if k != "@graph"} == {k: v for k, v in after.items() if k != "@graph"}
        action = "replaced Organization node in @graph"
    else:
        node = {"@context": before.get("@context", "https://schema.org"), **entity}
        if before == node:
            return html, "unchanged"
        lead = re.match(r"\s*", body).group(0)
        trail = re.search(r"\s*$", body).group(0)
        new_body = lead + dump_at(node, "", eol) + trail
        assert json.loads(new_body) == node
        action = "replaced Organization block"
    start, end = b.span(2)
    return html[:start] + new_body + html[end:], action


def main():
    args = sys.argv[1:]
    unknown = [a for a in args if a not in ("--dry-run", "--check")]
    if unknown:
        print(f"unknown argument(s): {' '.join(unknown)}  (use --dry-run or --check)")
        return 2
    dry, check = "--dry-run" in args, "--check" in args
    root = repo_root()
    locs = sitemap_locs(root)
    host = re.match(r"^https?://([^/]+)", locs[0]).group(1)
    if host not in ENTITIES:
        print(f"no entity for host {host}")
        return 2
    entity = dict(ENTITIES[host])
    if entity.get("logo") is None:
        entity["logo"] = LOGO[host]
    cfg = vercel_cfg(root)

    touched, problems, seen = [], [], set()
    for loc in locs:
        f, err = source_file(root, cfg, host, loc)
        if err:
            problems.append(f"{loc}: {err}")
            continue
        if f in seen:
            continue
        seen.add(f)
        path = root / f
        raw = path.read_bytes().decode("utf-8")
        try:
            new, action = process(raw, entity)
        except (ValueError, AssertionError) as e:
            problems.append(f"{f}: {e.__class__.__name__}: {e}")
            continue
        if new is None:
            problems.append(f"{f}: {action}")
            continue
        changed = new != raw
        print(f"{'~' if changed else '='} {f:62s} {action}")
        if changed:
            touched.append(f)
            if not dry and not check:
                path.write_bytes(new.encode("utf-8"))

    print()
    for p in problems:
        print(f"!! {p}")
    verb = "would touch" if (dry or check) else "touched"
    print(f"{host}: {len(seen)} sitemap pages | {verb} {len(touched)} | problems {len(problems)}")
    if check and (touched or problems):
        return 1
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
