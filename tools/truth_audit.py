#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
truth_audit.py — RUN A · INVISIBLE TRUTH LAYER  (2026-08-07)

Audits the head-only truth layer on BOTH hosts:
  aivoiceagency.ai  (repo root)
  aichauffeur.ai    (repo /chauffeur/, its own Vercel project)

It answers four questions per page, from the FILE, not from belief:

  1. Which JSON-LD blocks exist, and are any of them in <body>?
     (Schema in <body> is out of this run's edit scope AND is a
      structural smell — this run only owns <head>.)

  2. Does every CLAIM-BEARING schema string appear verbatim in that page's
     own visible body text?  This is the run's central law: extract,
     never write new claims.  Structural strings (@type, urls, sameAs,
     currency codes) are exempt because they are machine plumbing, not
     claims.

  3. Which banned constructs are present?  LocalBusiness · Person /
     founder / author-as-Person · aggregateRating · review ·
     per-minute rates · forbidden phone numbers.

  4. Is the entity spine present (Organization + WebSite), is the
     canonical self-referential, and does a BreadcrumbList have a real
     visible trail behind it?

Nothing here writes.  It is a gate, not a fixer.

Usage:
  python tools/truth_audit.py                 # both hosts, summary + defects
  python tools/truth_audit.py --full          # every page, every check
  python tools/truth_audit.py --page milwaukee-hvac/index.html
  python tools/truth_audit.py --json out.json
"""

import argparse
import html
import json
import os
import re
import subprocess
import sys
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------------------------------------------------------------- scope

# Directories whose pages are NOT public surfaces of the two hosts.
# work/ + hq/ are robots-disallowed cockpits; legacy/ + infra/ are archives;
# templates/ + tools/ are build inputs; ai100x/ is a THIRD host (ai100x.ai)
# and is explicitly out of this run's scope.
EXCLUDE_PREFIXES = (
    ".claude/", "legacy/", "infra/", "templates/", "tools/",
    "work/", "hq/", "ai100x/", "retell-backups/", "voice-stack/",
    "staging/", "cockpit/", "ad-stage/", "voice-ab/", "ctr-report/",
    "brand/", "pitch/", "chatgpt-example/", "new/",
)

def host_of(relpath):
    return "aichauffeur.ai" if relpath.startswith("chauffeur/") else "aivoiceagency.ai"

# ---------------------------------------------------------------- banned

BANNED_NUMBERS = [
    "305-315-6562", "3053156562",
    "480-800-9511", "4808009511",
    "786-937-1218", "7869371218",
    "350-220-5305", "3502205305",
]

# A per-minute RATE — a number bound to a minute — is what the brief bans.
# The bare phrase "per-minute" is not a rate: this site's own copy says
# "497 flat, no per-minute", which is a promise ABOUT not metering. Matching
# the phrase flagged four pages for saying the opposite of the thing banned.
PER_MINUTE = re.compile(
    r"(\$\s*\d[\d.,]*\s*(?:/|per\s+)\s*min(?:ute)?\b)"
    r"|(\b\d[\d.,]*\s*(?:cents?|dollars?)\s+(?:a|per)\s+minute\b)"
    r"|(\bbilled\s+(?:by|per)\s+the\s+minute\s+at\b)",
    re.I,
)

# Organization identity fields.  See the header note in
# tools/run_a_truth_layer.py: the brief mandates these AND mandates verbatim,
# and on a city page the two collide.  Resolved in favour of identity, because
# the law's purpose clause is "never write new CLAIMS" and a business address
# is not a claim.  Reported as a named exemption, never silently skipped — a
# checker that hides its own carve-outs is how the next run inherits a lie.
IDENTITY_KEYS = {"addressLocality", "addressRegion", "streetAddress",
                 "postalCode", "telephone"}

BANNED_TYPES = {"LocalBusiness", "Person", "AggregateRating", "Review",
                "ProfessionalService", "HomeAndConstructionBusiness"}

# Keys whose string values are machine plumbing, not claims.
STRUCTURAL_KEYS = {
    "@context", "@type", "@id", "url", "item", "sameAs", "image", "logo",
    "contentUrl", "embedUrl", "thumbnailUrl", "priceCurrency", "addressCountry",
    "inLanguage", "encodingFormat", "target", "urlTemplate", "query-input",
    "datePublished", "dateModified", "uploadDate", "duration", "availability",
    "priceValidUntil", "itemListOrder", "potentialAction", "mainEntityOfPage",
    "identifier", "email", "@graph", "width", "height", "position",
}

# Keys whose string values ARE claims and must be verbatim on the page.
CLAIM_KEYS = {
    "name", "alternateName", "description", "serviceType", "headline",
    "text", "audienceType", "slogan", "disambiguatingDescription",
    "articleBody", "abstract", "about", "category", "brand",
}

# Keys checked with a looser, purpose-built rule.
SPECIAL_KEYS = {"telephone", "price", "addressLocality", "addressRegion",
                "areaServed", "value", "minPrice", "maxPrice"}

# ---------------------------------------------------------------- text

COMMENT_RE = re.compile(r"<!--.*?-->", re.S)
SCRIPT_RE = re.compile(r"<script\b[^>]*>.*?</script\s*>", re.S | re.I)
STYLE_RE = re.compile(r"<style\b[^>]*>.*?</style\s*>", re.S | re.I)
SVG_RE = re.compile(r"<svg\b[^>]*>.*?</svg\s*>", re.S | re.I)
TAG_RE = re.compile(r"<[^>]+>")
LDJSON_RE = re.compile(
    r"<script\b[^>]*type\s*=\s*[\"']application/ld\+json[\"'][^>]*>(.*?)</script\s*>",
    re.S | re.I,
)


def normalize(s):
    """Fold a string to its comparable core.

    Typographic apostrophes, en/em dashes, non-breaking spaces and case are
    presentation, not content.  A claim that reads identically to a human but
    differs by one U+2019 is still the same claim; failing it would push the
    next run toward inventing NEW copy to satisfy the checker, which is the
    exact failure this gate exists to prevent.
    """
    s = unicodedata.normalize("NFKC", s)
    s = (s.replace("’", "'").replace("‘", "'")
          .replace("“", '"').replace("”", '"')
          .replace("—", "-").replace("–", "-")
          .replace("→", "->").replace(" ", " ")
          .replace("…", "..."))
    s = re.sub(r"[\s]+", " ", s)
    return s.strip().lower()


def visible_text(body_html):
    t = body_html
    t = COMMENT_RE.sub(" ", t)
    t = SCRIPT_RE.sub(" ", t)
    t = STYLE_RE.sub(" ", t)
    t = SVG_RE.sub(" ", t)
    # <noscript> content is visible to a crawler with JS off — keep it.
    t = TAG_RE.sub(" ", t)
    t = html.unescape(t)
    return normalize(t)


def split_doc(src):
    m = re.search(r"<head\b[^>]*>(.*?)</head\s*>", src, re.S | re.I)
    head = m.group(1) if m else ""
    head_span = m.span() if m else (0, 0)
    b = re.search(r"<body\b[^>]*>(.*?)</body\s*>", src, re.S | re.I)
    if b:
        body, body_span = b.group(1), b.span()
    else:
        body = src[head_span[1]:]
        body_span = (head_span[1], len(src))
    return head, body, head_span, body_span


# ---------------------------------------------------------------- walk

def walk_strings(node, path=""):
    """Yield (json_path, key, value) for every string leaf."""
    if isinstance(node, dict):
        for k, v in node.items():
            p = "%s.%s" % (path, k) if path else k
            if isinstance(v, str):
                yield (p, k, v)
            else:
                yield from walk_strings(v, p)
    elif isinstance(node, list):
        for i, v in enumerate(node):
            p = "%s[%d]" % (path, i)
            if isinstance(v, str):
                # A bare string in a list inherits its parent's key.
                yield (p, path.split(".")[-1] if path else "", v)
            else:
                yield from walk_strings(v, p)


def collect_types(node, out):
    if isinstance(node, dict):
        t = node.get("@type")
        if isinstance(t, str):
            out.add(t)
        elif isinstance(t, list):
            out.update(x for x in t if isinstance(x, str))
        for v in node.values():
            collect_types(v, out)
    elif isinstance(node, list):
        for v in node:
            collect_types(v, out)


def digits(s):
    return re.sub(r"\D", "", s)


# ---------------------------------------------------------------- audit

def audit_page(relpath):
    abspath = os.path.join(ROOT, relpath)
    with open(abspath, "r", encoding="utf-8") as fh:
        src = fh.read()

    head, body, head_span, body_span = split_doc(src)
    vis = visible_text(body)
    host = host_of(relpath)

    rec = {
        "path": relpath, "host": host,
        "defects": [], "notes": [],
        "types": [], "ld_head": 0, "ld_body": 0,
        "canonical": None, "noindex": False,
        "has_org": False, "has_website": False,
        "has_breadcrumb": False, "has_offer": False,
    }

    # --- robots / canonical -------------------------------------------------
    if re.search(r'name=["\']robots["\'][^>]*noindex', head, re.I):
        rec["noindex"] = True
    cm = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]*>', head, re.I)
    if cm:
        hm = re.search(r'href=["\']([^"\']+)["\']', cm.group(0), re.I)
        rec["canonical"] = hm.group(1) if hm else None
    if len(re.findall(r'rel=["\']canonical["\']', head, re.I)) > 1:
        rec["defects"].append(("CANONICAL", "more than one rel=canonical in <head>"))
    if not rec["canonical"] and not rec["noindex"]:
        rec["defects"].append(("CANONICAL", "indexable page with no rel=canonical"))

    # --- JSON-LD location ---------------------------------------------------
    head_blocks = LDJSON_RE.findall(head)
    body_blocks = LDJSON_RE.findall(body)
    rec["ld_head"] = len(head_blocks)
    rec["ld_body"] = len(body_blocks)
    if body_blocks:
        rec["defects"].append(
            ("LD-IN-BODY", "%d JSON-LD block(s) live in <body>; this run cannot "
                           "edit them" % len(body_blocks)))

    # --- parse + claim law --------------------------------------------------
    types = set()
    for i, raw in enumerate(head_blocks):
        try:
            data = json.loads(raw)
        except Exception as e:
            rec["defects"].append(("LD-PARSE", "block %d does not parse: %s" % (i, e)))
            continue
        collect_types(data, types)

        for jpath, key, val in walk_strings(data):
            if key in STRUCTURAL_KEYS:
                continue
            if val.startswith(("http://", "https://", "tel:", "mailto:", "/")):
                continue

            if key == "telephone":
                # Compare on the last 10 digits.  Schema carries the E.164
                # country code ("+1-414-…"); the page prints "414-240-8930".
                # Matching the full string would fail every correct page —
                # a checker that fails on truth is worse than no checker.
                d = digits(val)[-10:]
                for bad in BANNED_NUMBERS:
                    if digits(bad) and digits(bad)[-10:] == d:
                        rec["defects"].append(
                            ("BANNED-PHONE", "schema carries %s" % val))
                if d and d not in digits(vis):
                    rec["notes"].append(
                        ("IDENTITY-FIELD",
                         "telephone %s not printed on this page" % val))
                continue

            if key in IDENTITY_KEYS:
                if normalize(val) not in vis:
                    rec["notes"].append(
                        ("IDENTITY-FIELD", "%s = %r not printed on this page"
                         % (jpath, val)))
                continue

            if key in ("price", "minPrice", "maxPrice", "value"):
                # A price may only be asserted where that exact number is on
                # the page.  Accept "497", "$497" or "497/month" in the text.
                num = re.sub(r"[^\d.]", "", val)
                if num and num.rstrip(".0") not in digits(vis) and num not in vis:
                    rec["defects"].append(
                        ("PRICE-NOT-VISIBLE",
                         "%s=%r but that price is not printed on this page"
                         % (key, val)))
                continue

            if key not in CLAIM_KEYS and key not in SPECIAL_KEYS:
                # Unknown key — report it rather than silently exempting it.
                # Silent exemption is how a checker starts passing pages it
                # never actually read.
                rec["notes"].append(("UNCHECKED-KEY", "%s = %r" % (jpath, val[:60])))
                continue

            n = normalize(val)
            if not n:
                continue
            if n not in vis:
                rec["defects"].append(
                    ("NOT-VERBATIM", "%s: %r" % (jpath, val[:110])))

    rec["types"] = sorted(types)

    # --- banned constructs --------------------------------------------------
    for t in sorted(types & BANNED_TYPES):
        rec["defects"].append(("BANNED-TYPE", "@type %s present" % t))
    if re.search(r'"founder"', head):
        rec["defects"].append(("FOUNDER-FIELD", "Organization carries founder"))
    if re.search(r"\bshane\b", head, re.I):
        rec["defects"].append(("NAME-SHANE", "the name appears in <head>"))
    for bad in BANNED_NUMBERS:
        if bad in head:
            rec["defects"].append(("BANNED-PHONE", "%s in <head>" % bad))
    pm = PER_MINUTE.search(head)
    if pm:
        rec["defects"].append(("PER-MINUTE-RATE", pm.group(0)))

    # --- entity spine -------------------------------------------------------
    rec["has_org"] = "Organization" in types
    rec["has_website"] = "WebSite" in types
    rec["has_breadcrumb"] = "BreadcrumbList" in types
    rec["has_offer"] = bool({"Offer", "PriceSpecification",
                             "UnitPriceSpecification"} & types)

    if not rec["noindex"]:
        if not rec["has_org"]:
            rec["defects"].append(("NO-ORG", "no Organization on an indexable page"))
        if not rec["has_website"]:
            rec["defects"].append(("NO-WEBSITE", "no WebSite on an indexable page"))

    # A BreadcrumbList is a claim about navigation.  It is only true if the
    # page actually renders that trail.  RUN 13's lesson: a probe that never
    # loads the thing it certifies passes on a broken page.
    if rec["has_breadcrumb"]:
        has_trail = bool(re.search(r"BRIDGE:CRUMBS|class=[\"'][^\"']*crumb", body, re.I))
        if not has_trail:
            rec["defects"].append(
                ("BREADCRUMB-NO-TRAIL", "BreadcrumbList with no visible trail"))

    return rec


# ---------------------------------------------------------------- driver

def tracked_pages():
    out = subprocess.run(["git", "ls-files", "*.html"], cwd=ROOT,
                         capture_output=True, text=True, check=True).stdout
    pages = []
    for line in out.splitlines():
        line = line.strip().replace("\\", "/")
        if not line:
            continue
        if any(line.startswith(p) for p in EXCLUDE_PREFIXES):
            continue
        pages.append(line)
    return sorted(pages)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--page", action="append", default=None)
    ap.add_argument("--full", action="store_true")
    ap.add_argument("--json", default=None)
    ap.add_argument("--notes", action="store_true")
    args = ap.parse_args()

    pages = args.page if args.page else tracked_pages()
    recs = [audit_page(p) for p in pages]

    total_def = 0
    by_kind = {}
    for r in recs:
        for kind, msg in r["defects"]:
            by_kind[kind] = by_kind.get(kind, 0) + 1
            total_def += 1

    print("=" * 78)
    print("RUN A · TRUTH AUDIT — %d pages" % len(recs))
    print("=" * 78)

    for r in recs:
        if not args.full and not r["defects"] and not (args.notes and r["notes"]):
            continue
        flag = "OK " if not r["defects"] else "!! "
        print("\n%s%s  [%s]%s" % (flag, r["path"], r["host"],
                                  "  (noindex)" if r["noindex"] else ""))
        print("     types: %s" % (", ".join(r["types"]) or "(none)"))
        print("     ld: head=%d body=%d  canonical=%s"
              % (r["ld_head"], r["ld_body"], r["canonical"]))
        for kind, msg in r["defects"]:
            print("     [%s] %s" % (kind, msg))
        if args.notes:
            for kind, msg in r["notes"]:
                print("     .%s. %s" % (kind, msg))

    print("\n" + "-" * 78)
    print("DEFECTS BY KIND")
    for k in sorted(by_kind, key=lambda x: -by_kind[x]):
        print("  %-22s %d" % (k, by_kind[k]))
    print("  %-22s %d" % ("TOTAL", total_def))
    clean = sum(1 for r in recs if not r["defects"])
    print("\n  pages clean: %d / %d" % (clean, len(recs)))

    if args.json:
        with open(args.json, "w", encoding="utf-8") as fh:
            json.dump(recs, fh, indent=2)
        print("  wrote %s" % args.json)

    return 1 if total_def else 0


if __name__ == "__main__":
    sys.exit(main())
