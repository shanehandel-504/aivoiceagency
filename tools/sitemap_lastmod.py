#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
sitemap_lastmod.py — RUN A

Sets <lastmod> on both sitemaps from the truth on disk, not from memory.

For every <loc>, resolve the file that serves it, then take:
  · TODAY, if this run has that file modified in the working tree, or
  · the file's last commit date from `git log -1 --format=%cs`.

A lastmod is a claim about a page like any other, and it is the one claim a
crawler acts on immediately: an inflated date burns crawl budget on pages
that did not change, and a stale one keeps a rewritten page out of the index.
This run rewrote the structured data in 76 heads — that is exactly the kind
of change a recrawl is for, so those pages move; nothing else does.

Usage:
  python tools/sitemap_lastmod.py --today 2026-08-07 --check
  python tools/sitemap_lastmod.py --today 2026-08-07 --apply
"""

import argparse
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SITEMAPS = [
    ("sitemap.xml", "https://aivoiceagency.ai", ""),
    ("chauffeur/sitemap.xml", "https://aichauffeur.ai", "chauffeur/"),
]


def sh(*args):
    return subprocess.run(args, cwd=ROOT, capture_output=True,
                          text=True).stdout.strip()


def resolve(loc, base, prefix):
    """Map a public URL back to the repo file that serves it."""
    path = loc[len(base):].strip("/")
    cands = []
    if not path:
        cands.append(prefix + "index.html")
    else:
        if path.endswith(".html"):
            cands.append(prefix + path)
        cands.append(prefix + path + "/index.html")
        cands.append(prefix + path + ".html")
    for c in cands:
        if os.path.isfile(os.path.join(ROOT, c)):
            return c
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--today", required=True)
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    dirty = set(sh("git", "diff", "--name-only").split())
    dirty |= set(sh("git", "diff", "--cached", "--name-only").split())

    problems = 0
    for smap, base, prefix in SITEMAPS:
        p = os.path.join(ROOT, smap)
        with open(p, "r", encoding="utf-8", newline="") as fh:
            src = fh.read()
        out, moved, unresolved = src, 0, []

        for m in re.finditer(
                r"<url>\s*<loc>([^<]+)</loc>\s*<lastmod>([^<]+)</lastmod>",
                src, re.S):
            loc, old = m.group(1).strip(), m.group(2).strip()
            f = resolve(loc, base, prefix)
            if not f:
                unresolved.append(loc)
                problems += 1
                continue
            new = args.today if f in dirty else (sh(
                "git", "log", "-1", "--format=%cs", "--", f) or old)
            if new != old:
                block = m.group(0)
                out = out.replace(block, block.replace(
                    "<lastmod>%s</lastmod>" % old,
                    "<lastmod>%s</lastmod>" % new), 1)
                moved += 1
                print("  %-58s %s -> %s" % (loc[len(base):] or "/", old, new))

        print("%s: %d lastmod updated" % (smap, moved))
        for u in unresolved:
            print("  UNRESOLVED (sitemap URL with no file behind it): %s" % u)
        if args.apply and out != src:
            with open(p, "w", encoding="utf-8", newline="") as fh:
                fh.write(out)

    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
