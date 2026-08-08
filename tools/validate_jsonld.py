#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
validate_jsonld.py — RUN A

Validates every page's JSON-LD against the real schema.org vocabulary, from
disk, BEFORE anything ships.  Three classes of error, each of which the
public validators also flag but only after you have already deployed:

  1. UNKNOWN-TYPE      — an @type that is not a schema.org Class.
  2. UNKNOWN-PROPERTY  — a property that is not a schema.org Property.
  3. DOMAIN-MISMATCH   — a real property used on a type it does not belong
                         to (schema.org's domainIncludes, walked up the
                         class hierarchy).
  4. DANGLING-REF      — an {"@id": …} pointing at a node this page's graph
                         does not define.  This one no public validator
                         catches: the markup parses, validates, and means
                         nothing, because the node it references is not there.

Vocabulary: schemaorg-current-https.jsonld, cached under audits/run-a/.
Fetch once with --fetch; after that it runs offline.

Usage:
  python tools/validate_jsonld.py --fetch      # download the vocabulary
  python tools/validate_jsonld.py              # validate every page
  python tools/validate_jsonld.py --page index.html
"""

import argparse
import json
import os
import re
import subprocess
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOCAB = os.path.join(ROOT, "audits", "run-a", "schemaorg-current-https.jsonld")
VOCAB_URL = "https://schema.org/version/latest/schemaorg-current-https.jsonld"

LDJSON_RE = re.compile(
    r"<script\b[^>]*type\s*=\s*[\"']application/ld\+json[\"'][^>]*>(.*?)</script\s*>",
    re.S | re.I)

sys.path.insert(0, os.path.join(ROOT, "tools"))
from truth_audit import tracked_pages, split_doc          # noqa: E402

# JSON-LD keywords are not schema.org properties.
KEYWORDS = {"@context", "@type", "@id", "@graph", "@value", "@language",
            "@list", "@set", "@reverse"}


def load_vocab():
    if not os.path.isfile(VOCAB):
        sys.exit("vocabulary missing — run: python tools/validate_jsonld.py --fetch")
    with open(VOCAB, "r", encoding="utf-8") as fh:
        doc = json.load(fh)

    classes, props, parents, domains = set(), set(), {}, {}
    for node in doc["@graph"]:
        nid = node.get("@id", "")
        if not nid.startswith("schema:"):
            continue
        name = nid.split(":", 1)[1]
        types = node.get("@type")
        types = types if isinstance(types, list) else [types]
        if "rdfs:Class" in types:
            classes.add(name)
            sup = node.get("rdfs:subClassOf", [])
            sup = sup if isinstance(sup, list) else [sup]
            parents[name] = [s["@id"].split(":", 1)[1] for s in sup
                             if isinstance(s, dict)
                             and str(s.get("@id", "")).startswith("schema:")]
        if "rdf:Property" in types:
            props.add(name)
            dom = node.get("schema:domainIncludes", [])
            dom = dom if isinstance(dom, list) else [dom]
            domains[name] = {d["@id"].split(":", 1)[1] for d in dom
                             if isinstance(d, dict)
                             and str(d.get("@id", "")).startswith("schema:")}
    return classes, props, parents, domains


def ancestry(t, parents, seen=None):
    seen = seen or set()
    if t in seen:
        return seen
    seen.add(t)
    for p in parents.get(t, []):
        ancestry(p, parents, seen)
    return seen


def collect_ids(node, out):
    """@ids this graph DEFINES (a node with an @id and a @type)."""
    if isinstance(node, dict):
        if "@id" in node and "@type" in node and isinstance(node["@id"], str):
            out.add(node["@id"])
        for v in node.values():
            collect_ids(v, out)
    elif isinstance(node, list):
        for v in node:
            collect_ids(v, out)


def collect_refs(node, out):
    """@ids this graph REFERENCES (a bare {"@id": …} with no @type)."""
    if isinstance(node, dict):
        if set(node) == {"@id"} and isinstance(node["@id"], str):
            out.add(node["@id"])
        for v in node.values():
            collect_refs(v, out)
    elif isinstance(node, list):
        for v in node:
            collect_refs(v, out)


def check_node(node, V, errs, path=""):
    classes, props, parents, domains = V
    if isinstance(node, list):
        for i, v in enumerate(node):
            check_node(v, V, errs, "%s[%d]" % (path, i))
        return
    if not isinstance(node, dict):
        return

    types = node.get("@type")
    types = [types] if isinstance(types, str) else (types or [])
    for t in types:
        if t not in classes:
            errs.append(("UNKNOWN-TYPE", "%s @type=%s" % (path or "root", t)))

    allowed = set()
    for t in types:
        allowed |= ancestry(t, parents)

    for k, v in node.items():
        p = "%s.%s" % (path, k) if path else k
        if k in KEYWORDS:
            check_node(v, V, errs, p)
            continue
        if k not in props:
            errs.append(("UNKNOWN-PROPERTY", "%s" % p))
        elif types and domains.get(k) and not (domains[k] & allowed):
            errs.append(("DOMAIN-MISMATCH",
                         "%s — %s is not a property of %s"
                         % (p, k, "/".join(types))))
        check_node(v, V, errs, p)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--fetch", action="store_true")
    ap.add_argument("--page", action="append")
    args = ap.parse_args()

    if args.fetch:
        os.makedirs(os.path.dirname(VOCAB), exist_ok=True)
        print("fetching %s" % VOCAB_URL)
        urllib.request.urlretrieve(VOCAB_URL, VOCAB)
        print("wrote %s (%d bytes)" % (VOCAB, os.path.getsize(VOCAB)))
        return 0

    V = load_vocab()
    pages = args.page or tracked_pages()
    total = 0
    for rel in pages:
        with open(os.path.join(ROOT, rel), "r", encoding="utf-8") as fh:
            src = fh.read()
        head, body, _, _ = split_doc(src)
        errs, defined, refs = [], set(), set()
        for raw in LDJSON_RE.findall(head):
            try:
                data = json.loads(raw)
            except Exception as e:
                errs.append(("PARSE", str(e)))
                continue
            check_node(data, V, errs)
            collect_ids(data, defined)
            collect_refs(data, refs)
        for r in sorted(refs - defined):
            errs.append(("DANGLING-REF", r))
        if errs:
            total += len(errs)
            print("!! %s" % rel)
            for k, m in errs:
                print("     [%s] %s" % (k, m))

    print("\n%d pages validated against schema.org, %d errors" % (len(pages), total))
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main())
