#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
run_a_truth_layer.py — RUN A · INVISIBLE TRUTH LAYER  (2026-08-07)

Rewrites the <head> JSON-LD of every public page on BOTH hosts into one
canonical @graph per page, under one law:

    A schema string is either EXTRACTED from that page's own visible text,
    or it is an identity fact about the entity.  Nothing else ships.

Everything that fails that test is DROPPED, never rewritten.  A dropped
claim costs an attribute; an invented claim costs the site's credibility
with the exact engines this layer exists to talk to.

WHAT IT WILL NOT DO
  · touch <body> — the transform operates on the head slice only, and
    verify_no_body_diff() re-reads both files and asserts byte equality of
    the body span before the write is allowed to land.
  · touch a stamp.py marker region.  BRIDGE:CRUMBLD holds a
    stamp.py-generated BreadcrumbList on 8 pages; those are left exactly
    as found and those pages get NO BreadcrumbList in the @graph, because
    two BreadcrumbLists on one page are two answers to one question.
  · invent a price, an address, a rating, a review, a founder, or a person.

IDENTITY vs CLAIM — the one judgement call in this file
  The brief mandates Organization fields (name, url, telephone, address,
  sameAs) AND mandates that every schema string be verbatim on the page.
  On a city page those two rules collide: "Kewaskum" is printed on the
  homepage footer, not on /madison-hvac.
  Resolved by reading the law's own purpose clause — "extract, never write
  NEW CLAIMS."  An address and a phone number are identity facts about the
  business, published on the live homepage (verified against production
  this run), not marketing claims.  Descriptions, service types, audience
  types, area served, FAQ answers and breadcrumb labels ARE claims, and
  they are held to verbatim without exception.

Usage:
  python tools/run_a_truth_layer.py --dry-run     # report, write nothing
  python tools/run_a_truth_layer.py --apply
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

EXCLUDE_PREFIXES = (
    ".claude/", "legacy/", "infra/", "templates/", "tools/",
    "work/", "hq/", "ai100x/", "retell-backups/", "voice-stack/",
    "staging/", "cockpit/", "ad-stage/", "voice-ab/", "ctr-report/",
    "brand/", "pitch/", "chatgpt-example/", "new/",
)

# ---------------------------------------------------------------- entities

AVA = "https://aivoiceagency.ai"
AIC = "https://aichauffeur.ai"

# The six profile URLs, exactly as linked in the live homepage foot band
# (verified against production 2026-08-07, section.bs-footband a.bs-social).
AVA_SAMEAS = [
    "https://www.facebook.com/AIVoiceAgency",
    "https://www.instagram.com/aivoiceagency.ai",
    "https://x.com/AIVoiceAgency",
    "https://www.youtube.com/@aivoiceagency",
    "https://www.tiktok.com/@aivoiceagency.ai",
    "https://www.linkedin.com/company/aivoiceagency",
]

ENTITY = {
    "aivoiceagency.ai": {
        "org_id": AVA + "/#organization",
        "site_id": AVA + "/#website",
        "org": {
            "@type": "Organization",
            "@id": AVA + "/#organization",
            "name": "AI Voice Agency",
            "url": AVA + "/",
            "telephone": "+1-414-240-8930",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": "Kewaskum",
                "addressRegion": "WI",
                "addressCountry": "US",
            },
            "sameAs": list(AVA_SAMEAS),
        },
        "site": {
            "@type": "WebSite",
            "@id": AVA + "/#website",
            "url": AVA + "/",
            "name": "AI Voice Agency",
            "inLanguage": "en-US",
            "publisher": {"@id": AVA + "/#organization"},
        },
    },
    "aichauffeur.ai": {
        "org_id": AIC + "/#organization",
        "site_id": AIC + "/#website",
        "org": {
            "@type": "Organization",
            "@id": AIC + "/#organization",
            "name": "AI Chauffeur",
            "url": AIC + "/",
            "telephone": "+1-414-775-0019",
            "email": "dispatch@aichauffeur.ai",
            "logo": AIC + "/assets/brand/lockup-short.svg",
            "address": {
                "@type": "PostalAddress",
                "addressRegion": "WI",
                "addressCountry": "US",
            },
        },
        "site": {
            "@type": "WebSite",
            "@id": AIC + "/#website",
            "url": AIC + "/",
            "name": "AI Chauffeur",
            "inLanguage": "en-US",
            "publisher": {"@id": AIC + "/#organization"},
        },
    },
}

# The old @ids that other nodes still point at.  Rewriting an @id without
# rewriting the references that target it produces a graph of orphans that
# validates clean and means nothing.
ID_ALIASES = {
    AIC + "/#org": AIC + "/#organization",
    AIC + "/#site": AIC + "/#website",
    AVA + "/#organization": AVA + "/#organization",
}

BANNED_TYPES = {"LocalBusiness", "Person", "AggregateRating", "Review",
                "ProfessionalService", "HomeAndConstructionBusiness",
                "AutoRental", "TaxiService"}

CLAIM_KEYS = {
    "name", "alternateName", "description", "serviceType", "headline",
    "text", "audienceType", "slogan", "disambiguatingDescription",
    "abstract", "about", "category", "articleBody", "priceRange",
    "featureList", "keywords",
}

# Strings under these keys are machine plumbing, not claims.
STRUCTURAL_KEYS = {
    "@context", "@type", "@id", "url", "item", "sameAs", "image", "logo",
    "contentUrl", "embedUrl", "thumbnailUrl", "priceCurrency", "addressCountry",
    "addressRegion", "addressLocality", "streetAddress", "postalCode",
    "inLanguage", "encodingFormat", "target", "urlTemplate", "query-input",
    "datePublished", "dateModified", "uploadDate", "duration", "availability",
    "priceValidUntil", "identifier", "email", "telephone", "width", "height",
    "position", "applicationCategory", "operatingSystem", "itemListOrder",
    "numberOfItems", "@graph",
}

# ---------------------------------------------------------------- text

COMMENT_RE = re.compile(r"<!--.*?-->", re.S)
SCRIPT_RE = re.compile(r"<script\b[^>]*>.*?</script\s*>", re.S | re.I)
STYLE_RE = re.compile(r"<style\b[^>]*>.*?</style\s*>", re.S | re.I)
SVG_RE = re.compile(r"<svg\b[^>]*>.*?</svg\s*>", re.S | re.I)
TAG_RE = re.compile(r"<[^>]+>")
LDJSON_RE = re.compile(
    # The trailing newline must be consumed as \r?\n, not \n.  On the CRLF
    # city pages a bare \n never matches (the next byte is \r), so the old
    # line ending survived every removal and the file grew one blank line
    # per run — a transform that is not idempotent silently rewrites the
    # site on every future run.
    r"[ \t]*<script\b[^>]*type\s*=\s*[\"']application/ld\+json[\"'][^>]*>.*?</script\s*>[ \t]*\r?\n?",
    re.S | re.I,
)
CRUMBLD_RE = re.compile(r"<!-- BRIDGE:CRUMBLD -->.*?<!-- /BRIDGE:CRUMBLD -->", re.S)


def normalize(s):
    s = unicodedata.normalize("NFKC", s)
    for a, b in (("’", "'"), ("‘", "'"), ("“", '"'),
                 ("”", '"'), ("—", "-"), ("–", "-"),
                 ("→", "->"), (" ", " "), ("…", "..."),
                 ("·", "-")):
        s = s.replace(a, b)
    return re.sub(r"\s+", " ", s).strip().lower()


def visible_text(body_html):
    t = COMMENT_RE.sub(" ", body_html)
    t = SCRIPT_RE.sub(" ", t)
    t = STYLE_RE.sub(" ", t)
    t = SVG_RE.sub(" ", t)
    t = TAG_RE.sub(" ", t)
    return normalize(html.unescape(t))


def split_doc(src):
    hm = re.search(r"<head\b[^>]*>(.*?)</head\s*>", src, re.S | re.I)
    bm = re.search(r"<body\b[^>]*>(.*?)</body\s*>", src, re.S | re.I)
    if not hm or not bm:
        return None
    return {"head": hm.group(1), "head_span": hm.span(1),
            "body": bm.group(1), "body_span": bm.span(1)}


def host_of(rel):
    return "aichauffeur.ai" if rel.startswith("chauffeur/") else "aivoiceagency.ai"


# ---------------------------------------------------------------- crumbs

LEAF_RE = re.compile(
    r"<(span|li)\b([^>]*(?:aria-current\s*=\s*[\"']page[\"']|class\s*=\s*[\"'][^\"']*bc-here)[^>]*)>(.*?)</\1>",
    re.S | re.I)
LINK_RE = re.compile(r"<a\b([^>]*href\s*=\s*[\"'][^\"']+[\"'][^>]*)>(.*?)</a>", re.S | re.I)


def visible_trail(body, base):
    """Return the crumb chain the page actually renders.

    Two markup families ship on these hosts and both must parse: the AVA
    stamp.py trail (flat <a>/<span> with .bc-sep separators) and the
    chauffeur trail (<ol><li>, leaf marked aria-current="page").  Matching
    only one family is how a probe reports "no trail" about a page that
    renders a perfectly good one.
    """
    m = re.search(r"<nav[^>]*(?:class=[\"'][^\"']*(?:bcrumb|crumbs)|aria-label=[\"']Breadcrumb[\"'])"
                  r"[^>]*>(.*?)</nav>", body, re.S | re.I)
    if not m:
        return []
    inner = m.group(1)

    found = []
    for mm in LINK_RE.finditer(inner):
        href = re.search(r'href=["\']([^"\']+)["\']', mm.group(1)).group(1)
        label = normalize_label(mm.group(2))
        if label:
            found.append((mm.start(), label, href))
    for mm in LEAF_RE.finditer(inner):
        label = normalize_label(mm.group(3))
        if label:
            found.append((mm.start(), label, None))

    found.sort(key=lambda x: x[0])
    # Drop an unlinked node that is not the last one: it is a visual grouping
    # ("Wisconsin" on the city pages) with nowhere to point.
    return [(lbl, href) for _, lbl, href in found]


HEADING_RE = re.compile(r"<h1\b[^>]*>(.*?)</h1>", re.S | re.I)
PARA_RE = re.compile(r"<p\b[^>]*>(.*?)</p>", re.S | re.I)
EYEBROW_RE = re.compile(
    r"<[^>]*class=[\"'][^\"']*\b(?:g-eyebrow|eyebrow)\b[^\"']*[\"'][^>]*>(.*?)</", re.S | re.I)


def page_anchors(body):
    """The strings this page already shows that a Service node can honestly
    borrow: the eyebrow, the H1, and the first real paragraph under it.
    Every one of them is verbatim by construction."""
    a = {"eyebrow": None, "h1": None, "lede": None}
    m = EYEBROW_RE.search(body)
    if m:
        t = normalize_label(m.group(1))
        if 3 < len(t) < 90:
            a["eyebrow"] = t
    h = HEADING_RE.search(body)
    if h:
        a["h1"] = normalize_label(h.group(1)) or None
        for p in PARA_RE.finditer(body[h.end():]):
            t = normalize_label(p.group(1))
            if len(t) > 70:
                a["lede"] = t
                break
    return a


def normalize_label(raw):
    # Tags collapse to a SPACE, not to nothing.  A city-page <h1> is four
    # lines separated by <br>/<span>; stripping the tags to nothing welds
    # them into "No-heat callat 2 AM.AVA answers" — a string no human ever
    # saw, shipped as the page's own words.  visible_text() uses the same
    # substitution, so the two always agree.
    return re.sub(r"\s+", " ", html.unescape(TAG_RE.sub(" ", raw))).strip()


def abs_url(href, base):
    if not href:
        return None
    if href.startswith("http"):
        return href
    return base.rstrip("/") + "/" + href.lstrip("/")


def build_breadcrumb(trail, base, self_url):
    """Mirror the RENDERED trail.  Linked crumbs keep their href; the leaf
    carries the page's own canonical.  An unlinked middle crumb ("Wisconsin"
    on the city pages) is a visual grouping with no destination — it is
    omitted rather than emitted without an `item`, which Google flags."""
    items, pos = [], 1
    for i, (label, href) in enumerate(trail):
        last = i == len(trail) - 1
        if last:
            url = self_url
        elif href:
            url = abs_url(href, base)
        else:
            continue
        items.append({"@type": "ListItem", "position": pos,
                      "name": label, "item": url})
        pos += 1
    if len(items) < 2:
        return None
    return {"@type": "BreadcrumbList", "itemListElement": items}


# ---------------------------------------------------------------- filter

def flatten(blocks):
    nodes = []
    for d in blocks:
        if isinstance(d, dict) and "@graph" in d:
            g = d["@graph"]
            nodes.extend(g if isinstance(g, list) else [g])
        elif isinstance(d, list):
            nodes.extend(d)
        elif isinstance(d, dict):
            nodes.append(d)
    return nodes


def type_of(node):
    t = node.get("@type")
    if isinstance(t, list):
        return t[0] if t else None
    return t


def remap_ids(node):
    if isinstance(node, dict):
        out = {}
        for k, v in node.items():
            if k == "@id" and isinstance(v, str) and v in ID_ALIASES:
                out[k] = ID_ALIASES[v]
            else:
                out[k] = remap_ids(v)
        return out
    if isinstance(node, list):
        return [remap_ids(v) for v in node]
    return node


def price_visible(val, vis):
    """A price ships only if that exact number is printed on the page AS A PRICE.

    Two ways to get this wrong, both caught here:
      · digit-soup matching — "497" occurs inside "1,497" and inside a phone
        number, so the match needs digit boundaries;
      · context-free matching — `price: "0"` passed the boundary test on the
        ROI page because SOME bare 0 appears in the copy.  A price claim needs
        a price context: a currency mark, or a rate word next to the number.
    """
    num = re.sub(r"[^\d]", "", str(val))
    if not num:
        return False
    if int(num) == 0:
        # A zero price is a FREE claim.  /roi carried `price: "0"` and it
        # passed a visibility check because the calculator renders "$0" as
        # its own default output ("lost monthly revenue $0") — a number on
        # the page for an entirely different reason.  No page here states a
        # price of zero, and CLAUDE.md bans free-offer claims outright.
        return False
    n = re.escape(num)
    return re.search(
        r"(\$\s*%s(?!\d))"                                   # $497
        r"|((?<!\d)%s\s*(?:/\s*mo|/\s*month|\s*flat)\b)"     # 497/mo, 497 flat
        r"|((?<!\d)%s\s+dollars?\b)"                         # 497 dollars
        r"|((?<!\d)%s\s+a\s+month\b)" % (n, n, n, n), vis) is not None


# A price ships as an Offer only from a page that presents it as OUR price.
PRICE_CONTEXT = re.compile(
    r"(\$\s*497)|((?<!\d)497\s*(?:/\s*mo|/\s*month|\s*flat))"
    r"|((?<!\d)497\s+dollars?\s+a\s+month)", re.I)

# Pages whose job is not to sell a service.  Everything else on both hosts is
# a service or vertical surface and gets a Service node built from its own
# rendered heading and lede.
NON_SERVICE = {
    "backstage/index.html", "book/index.html", "blog/index.html",
    "blog/home-services-30-percent-missed/index.html",
    "blog/what-happens-when-you-call-ava/index.html",
    "blog/wisconsin-limo-crush/index.html",
    "guides/ac-running-but-not-cooling.html",
    "guides/furnace-short-cycling.html",
    "deck/index.html", "roi/index.html", "videos/index.html",
    "methodology.html", "privacy/index.html", "terms.html", "sms-policy.html",
    "chauffeur/book/index.html", "chauffeur/privacy/index.html",
    "chauffeur/terms/index.html",
}


def filter_node(node, vis, drops, path=""):
    """Recursively strip every claim string that is not verbatim on the page.

    Returns the filtered node, or None if it lost the content that made it
    worth publishing.
    """
    if isinstance(node, list):
        out = [filter_node(v, vis, drops, "%s[%d]" % (path, i))
               for i, v in enumerate(node)]
        out = [v for v in out if v is not None]
        return out or None

    if not isinstance(node, dict):
        return node

    t = type_of(node)
    if t in BANNED_TYPES:
        drops.append(("BANNED-TYPE", "%s dropped (%s)" % (path or "root", t)))
        return None

    out = {}
    for k, v in node.items():
        p = "%s.%s" % (path, k) if path else k

        if k == "founder":
            drops.append(("FOUNDER", "dropped founder"))
            continue

        if k == "author":
            # An Article needs an author.  The publisher IS the author here;
            # a named Person is exactly what this run removes.
            out[k] = {"@id": AUTHOR_ORG_ID}
            drops.append(("AUTHOR", "Person author -> Organization"))
            continue

        if k in ("aggregateRating", "review", "reviews"):
            drops.append(("RATING", "dropped %s" % k))
            continue

        if k in ("price", "minPrice", "maxPrice", "lowPrice", "highPrice"):
            if price_visible(v, vis):
                out[k] = v
            else:
                drops.append(("PRICE", "%s=%r not printed on page" % (p, v)))
            continue

        if isinstance(v, str):
            if k in STRUCTURAL_KEYS or v.startswith(("http://", "https://",
                                                     "tel:", "mailto:", "/")):
                out[k] = v
                continue
            if k in CLAIM_KEYS:
                if normalize(v) and normalize(v) in vis:
                    out[k] = v
                else:
                    drops.append(("NOT-VERBATIM", "%s: %s" % (p, v[:90])))
                continue
            # Unknown scalar key: keep only if verbatim.  Defaulting to KEEP
            # is how an invented string survives a checker that never named it.
            if normalize(v) in vis:
                out[k] = v
            else:
                drops.append(("NOT-VERBATIM", "%s: %s" % (p, v[:90])))
            continue

        if isinstance(v, (dict, list)):
            fv = filter_node(v, vis, drops, p)
            if fv is not None:
                out[k] = fv
            elif k in ("mainEntity", "itemListElement"):
                drops.append(("EMPTY", "%s emptied" % p))
            continue

        out[k] = v

    # An Offer whose price did not survive is a currency code and nothing
    # else.  /roi carried `price: "0"` — a free-tool claim the page never
    # makes — and dropping the number alone would have left the Offer
    # standing with no offer in it.
    if t in ("Offer", "PriceSpecification", "UnitPriceSpecification") \
            and not ({"price", "priceSpecification", "lowPrice", "highPrice"} & set(out)):
        drops.append(("OFFER", "%s dropped — no price survived" % (path or "offers")))
        return None

    # A Question with no surviving answer is not a Question.
    if t == "Question" and "acceptedAnswer" not in out:
        return None
    if t == "Answer" and "text" not in out:
        return None
    if t in ("FAQPage",) and not out.get("mainEntity"):
        return None
    if t == "ItemList" and not out.get("itemListElement"):
        return None
    # A node reduced to nothing but its own identity carries no information.
    meaningful = set(out) - {"@type", "@id", "@context", "url", "inLanguage",
                             "isPartOf", "publisher", "provider", "position"}
    if not meaningful:
        return None
    return out


AUTHOR_ORG_ID = AVA + "/#organization"

KEY_ORDER = ["@context", "@type", "@id", "name", "headline", "alternateName",
             "url", "serviceType", "applicationCategory", "operatingSystem",
             "description", "text", "about", "telephone", "email", "logo",
             "image", "address", "areaServed", "audience", "provider",
             "publisher", "author", "parentOrganization", "isPartOf",
             "mainEntityOfPage", "datePublished", "dateModified", "inLanguage",
             "offers", "featureList", "sameAs", "position", "item",
             "acceptedAnswer", "itemListElement", "mainEntity"]


def order_keys(node):
    """Serialise every node with the same key order every time.

    Node order alone was not enough to make this transform idempotent: a
    node BUILT this pass got {name, provider, description} while the same
    node PARSED BACK next pass got {name, description, provider}, and 21
    files rewrote themselves with identical content in a different order.
    """
    if isinstance(node, list):
        return [order_keys(v) for v in node]
    if not isinstance(node, dict):
        return node
    def rank(k):
        return (KEY_ORDER.index(k) if k in KEY_ORDER else len(KEY_ORDER), k)
    return {k: order_keys(node[k]) for k in sorted(node, key=rank)}


# ---------------------------------------------------------------- page

def process(rel, apply_changes):
    abspath = os.path.join(ROOT, rel)
    with open(abspath, "r", encoding="utf-8", newline="") as fh:
        src = fh.read()

    parts = split_doc(src)
    if not parts:
        return {"path": rel, "skip": "no head/body"}

    global AUTHOR_ORG_ID
    host = host_of(rel)
    ent = ENTITY[host]
    AUTHOR_ORG_ID = ent["org_id"]
    base = AVA if host == "aivoiceagency.ai" else AIC

    head, body = parts["head"], parts["body"]
    vis = visible_text(body)

    noindex = bool(re.search(r'name=["\']robots["\'][^>]*noindex', head, re.I))
    cm = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]*>', head, re.I)
    self_url = None
    if cm:
        h = re.search(r'href=["\']([^"\']+)["\']', cm.group(0))
        self_url = h.group(1) if h else None

    rec = {"path": rel, "host": host, "noindex": noindex,
           "canonical": self_url, "drops": [], "kept": [], "skip": None}

    if noindex:
        rec["skip"] = "noindex — left alone"
        return rec
    if not self_url:
        rec["skip"] = "no canonical — cannot anchor a graph"
        return rec

    # --- stamp.py-owned crumb region: quarantine, never edit ---------------
    # One exception.  /backstage carries a stamp-generated BreadcrumbList for a
    # trail the page never renders — a navigation claim about navigation that
    # does not exist.  A false claim is a bug, and the head is in scope, so it
    # goes.  stamp.py will re-add it on the next stamp run; the one-line fix
    # (jsonld=False on that PAGES row) is named in the run report.
    stamp_crumb = CRUMBLD_RE.search(head)
    renders_trail = bool(visible_trail(body, base))
    if stamp_crumb and not renders_trail:
        head = CRUMBLD_RE.sub("", head)
        rec["drops"].append(
            ("STAMP-CRUMB", "removed stamp BreadcrumbList — page renders no trail"))
        stamp_crumb = None
    head_wo_stamp = CRUMBLD_RE.sub("\x00CRUMBLD\x00", head) if stamp_crumb else head

    # --- collect hand-authored blocks --------------------------------------
    raw_blocks = LDJSON_RE.findall(head_wo_stamp)
    parsed = []
    for blk in raw_blocks:
        inner = re.search(r">(.*)</script", blk, re.S | re.I)
        if not inner:
            continue
        try:
            parsed.append(json.loads(inner.group(1)))
        except Exception as e:
            rec["drops"].append(("PARSE", str(e)))

    nodes = [remap_ids(n) for n in flatten(parsed)]

    # --- rebuild -----------------------------------------------------------
    graph = [json.loads(json.dumps(ent["org"])),
             json.loads(json.dumps(ent["site"]))]

    # parentOrganization is a real corporate fact, but on aichauffeur.ai it
    # is only asserted where the parent's name is actually printed.
    if host == "aichauffeur.ai" and normalize("AI Voice Agency") in vis:
        graph[0]["parentOrganization"] = {"@type": "Organization",
                                          "name": "AI Voice Agency",
                                          "url": AVA + "/"}

    anchors = page_anchors(body)
    seen_types = set()
    for n in nodes:
        t = type_of(n)
        if t in ("Organization", "WebSite"):
            continue                       # replaced by the canonical entity
        if t == "BreadcrumbList":
            continue                       # rebuilt below from the render

        # A LocalBusiness is a storefront claim this brand has no storefront
        # for.  The node's real content is its service area, which is true —
        # so it is RETYPED to Service rather than thrown away.  Dropping it
        # would lose a true signal to remove a false one.
        if t == "LocalBusiness":
            n = dict(n)
            n["@type"] = "Service"
            n.pop("priceRange", None)
            n.pop("openingHours", None)
            n.pop("openingHoursSpecification", None)
            n.pop("geo", None)
            n.pop("hasMap", None)
            # telephone is a property of LocalBusiness, NOT of Service —
            # schema.org's domainIncludes says so and the validator flags it.
            # Nothing is lost: the number lives on the Organization node this
            # Service names as its provider.
            n.pop("telephone", None)
            rec["drops"].append(("RETYPE", "LocalBusiness -> Service"))
            t = "Service"

        ANCHORED = ("Service", "SoftwareApplication", "WebApplication", "WebPage",
                    "CollectionPage", "PresentationDigitalDocument", "Blog")

        fn = filter_node(n, vis, rec["drops"])
        if fn is None:
            # The node lost every claim it carried.  If the page still has a
            # heading and a lede, rebuild it from those rather than deleting a
            # real entity off the graph — the entity is true, only the copy
            # written about it was not.
            if t in ANCHORED and (anchors["h1"] or anchors["eyebrow"]):
                fn = {"@type": t}
                if isinstance(n.get("@id"), str):
                    fn["@id"] = n["@id"]
                rec["drops"].append(("REBUILD", "%s rebuilt from rendered copy" % t))
            else:
                continue
        fn.pop("@context", None)

        # A node that lost its name/description to the verbatim law gets the
        # page's OWN heading and lede instead of nothing.  These are extracts,
        # not replacements written for schema — which is the whole point.
        if t in ANCHORED:
            if "name" not in fn:
                pick = anchors["eyebrow"] or anchors["h1"]
                if pick:
                    fn["name"] = pick
                    rec["drops"].append(("EXTRACT", "name <- rendered %s"
                                         % ("eyebrow" if anchors["eyebrow"] else "h1")))
            if "description" not in fn and anchors["lede"]:
                fn["description"] = anchors["lede"]
                rec["drops"].append(("EXTRACT", "description <- rendered lede"))

        if t == "Service":
            # Applied to EVERY Service, not just one freshly retyped from
            # LocalBusiness.  A node that already went through the retype in
            # an earlier pass comes back as a plain Service, so a fix that
            # only lives in the retype branch never reaches it again.
            for bad in ("telephone", "priceRange", "openingHours",
                        "openingHoursSpecification", "geo", "hasMap",
                        "parentOrganization"):
                if fn.pop(bad, None) is not None:
                    rec["drops"].append(
                        ("DOMAIN", "%s is not a property of Service" % bad))
            if "provider" not in fn:
                fn["provider"] = {"@id": ent["org_id"]}
        if t in ("SoftwareApplication",) and "provider" not in fn:
            fn["provider"] = {"@id": ent["org_id"]}
        if t in ("BlogPosting", "Article", "WebPage", "CollectionPage", "Blog"):
            fn.setdefault("publisher", {"@id": ent["org_id"]})
            fn.setdefault("isPartOf", {"@id": ent["site_id"]})
        graph.append(fn)
        seen_types.add(t)

    # --- Service on every service / vertical surface ------------------------
    # The brief asks for Service on service and vertical pages.  Several city
    # hubs and every chauffeur money page had none.  The node is built purely
    # from what the page already shows — heading, lede, and the place names it
    # actually prints — so it adds structure without adding a claim.
    if "Service" not in seen_types and rel not in NON_SERVICE:
        pick = anchors["h1"] or anchors["eyebrow"]
        if pick:
            svc = {"@type": "Service", "name": pick,
                   "provider": {"@id": ent["org_id"]}}
            if anchors["lede"]:
                svc["description"] = anchors["lede"]
            graph.append(svc)
            seen_types.add("Service")
            rec["drops"].append(("ADD", "Service synthesised from rendered copy"))

    # --- Offer: only from a page that prints the price as ours --------------
    if PRICE_CONTEXT.search(vis):
        for node in graph:
            if type_of(node) == "Service" and "offers" not in node:
                node["offers"] = {"@type": "Offer", "price": "497",
                                  "priceCurrency": "USD", "url": self_url}
                rec["drops"].append(("ADD", "Offer 497 USD — price printed on page"))
                break

    # --- breadcrumb: mirror what the page renders --------------------------
    if not stamp_crumb:
        trail = visible_trail(body, base)
        bc = build_breadcrumb(trail, base, self_url) if trail else None
        if bc:
            graph.append(bc)
            seen_types.add("BreadcrumbList")
        else:
            rec["drops"].append(("BREADCRUMB", "no rendered trail — none emitted"))

    # Stable node order.  Without it the run is not idempotent: a node this
    # pass SYNTHESISES lands at the end, and the next pass reads it back as an
    # existing node and files it earlier — so a second run rewrites 21 files
    # for no semantic reason.  A transform whose output depends on how many
    # times it has run cannot be trusted to have run correctly once.
    ORDER = ["Organization", "WebSite", "Service", "SoftwareApplication",
             "WebApplication", "Article", "BlogPosting", "Blog", "WebPage",
             "CollectionPage", "PresentationDigitalDocument", "ItemList",
             "FAQPage", "BreadcrumbList"]
    graph.sort(key=lambda n: (ORDER.index(type_of(n)) if type_of(n) in ORDER
                              else len(ORDER), str(type_of(n))))
    graph = [order_keys(n) for n in graph]

    rec["kept"] = sorted(seen_types)

    # Match the file's own line endings.  This repo is mixed — the city pages
    # are CRLF, the homepage and the whole chauffeur tree are LF — and writing
    # LF into a CRLF file turns a 30-line schema edit into a whole-file diff
    # that no reviewer can read.
    eol = "\r\n" if src.count("\r\n") > src.count("\n") - src.count("\r\n") else "\n"
    block = ('<script type="application/ld+json">\n'
             + json.dumps({"@context": "https://schema.org", "@graph": graph},
                          ensure_ascii=False, indent=2)
             + "\n</script>\n")
    if eol == "\r\n":
        block = block.replace("\n", "\r\n")

    # --- splice, head only --------------------------------------------------
    new_head = head_wo_stamp
    if raw_blocks:
        first = new_head.find(raw_blocks[0])
        for blk in raw_blocks:
            new_head = new_head.replace(blk, "", 1)
        # re-locate: removals shifted everything after the first block
        insert_at = min(first, len(new_head))
        new_head = new_head[:insert_at] + block + new_head[insert_at:]
    else:
        anchor = new_head.find("<!-- BRIDGE:HEAD -->")
        if anchor == -1:
            new_head = new_head.rstrip() + "\n" + block
        else:
            new_head = new_head[:anchor] + block + new_head[anchor:]

    if stamp_crumb:
        new_head = new_head.replace("\x00CRUMBLD\x00", stamp_crumb.group(0))

    hs, he = parts["head_span"]
    new_src = src[:hs] + new_head + src[he:]

    # --- the gate: the body must be byte-identical --------------------------
    np = split_doc(new_src)
    if np is None or np["body"] != body:
        rec["skip"] = "ABORT — body would change"
        return rec

    rec["changed"] = new_src != src
    if apply_changes and rec["changed"]:
        with open(abspath, "w", encoding="utf-8", newline="") as fh:
            fh.write(new_src)
    return rec


def tracked_pages():
    out = subprocess.run(["git", "ls-files", "*.html"], cwd=ROOT,
                         capture_output=True, text=True, check=True).stdout
    pages = []
    for line in out.splitlines():
        line = line.strip().replace("\\", "/")
        if line and not any(line.startswith(p) for p in EXCLUDE_PREFIXES):
            pages.append(line)
    return sorted(pages)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--page", action="append")
    args = ap.parse_args()
    if not args.apply and not args.dry_run:
        args.dry_run = True

    pages = args.page or tracked_pages()
    changed = aborted = skipped = 0
    for rel in pages:
        rec = process(rel, args.apply)
        if rec.get("skip"):
            tag = "ABORT" if "ABORT" in rec["skip"] else "skip "
            if "ABORT" in rec["skip"]:
                aborted += 1
            else:
                skipped += 1
            print("%s %-58s %s" % (tag, rel, rec["skip"]))
            continue
        if rec.get("changed"):
            changed += 1
        print("%s %-58s kept: %s" % ("EDIT " if rec.get("changed") else "same ",
                                     rel, ", ".join(rec["kept"]) or "(entity only)"))
        for kind, msg in rec["drops"]:
            print("        - [%s] %s" % (kind, msg))

    print("\n%s: %d changed, %d skipped, %d aborted, %d pages"
          % ("APPLIED" if args.apply else "DRY RUN",
             changed, skipped, aborted, len(pages)))
    return 1 if aborted else 0


if __name__ == "__main__":
    sys.exit(main())
