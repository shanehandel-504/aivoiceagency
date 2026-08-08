#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
verify_head_only.py — RUN A gate

Proves the HEAD-ONLY law from the git index, not from intent: for every
modified .html file, the <body>…</body> byte range at HEAD must equal the
<body>…</body> byte range in the working tree.

Exit 0 only if every body is byte-identical.  Anything else — a changed
body, a file that no longer parses, a file that gained or lost a <body> —
is a hard failure and the run does not ship.

Usage:
  python tools/verify_head_only.py            # vs git HEAD
  python tools/verify_head_only.py --ref MAIN
"""

import argparse
import re
import subprocess
import sys
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BODY_RE = re.compile(rb"<body\b[^>]*>(.*?)</body\s*>", re.S | re.I)


def git(*args):
    return subprocess.run(["git"] + list(args), cwd=ROOT,
                          capture_output=True, check=False).stdout


def body_bytes(raw):
    m = BODY_RE.search(raw)
    if not m:
        return None
    # core.autocrlf is on in this clone: the blob `git show` returns is LF,
    # the working file is CRLF on the city pages.  Comparing them raw makes
    # every CRLF page look like a body rewrite at byte 0 — a gate that cries
    # wolf on all 60 pages is a gate nobody reads.  Line endings are not
    # content; normalise both sides and any REAL body edit still fails.
    return m.group(1).replace(b"\r\n", b"\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ref", default="HEAD")
    args = ap.parse_args()

    changed = git("diff", "--name-only", args.ref).decode("utf-8", "replace").split()
    pages = [p for p in changed if p.endswith(".html")]

    if not pages:
        print("no modified .html files")
        return 0

    bad = []
    for p in pages:
        before = git("show", "%s:%s" % (args.ref, p))
        if not before:
            print("NEW   %-58s (no %s version — skipped)" % (p, args.ref))
            continue
        after = open(os.path.join(ROOT, p), "rb").read()
        b0, b1 = body_bytes(before), body_bytes(after)
        if b0 is None or b1 is None:
            bad.append((p, "no <body> found (%s -> %s)"
                        % (b0 is not None, b1 is not None)))
            continue
        if b0 != b1:
            # Show where, so a failure is actionable rather than just red.
            n = min(len(b0), len(b1))
            i = next((k for k in range(n) if b0[k] != b1[k]), n)
            bad.append((p, "body differs at byte %d: %r -> %r"
                        % (i, b0[max(0, i - 40):i + 40], b1[max(0, i - 40):i + 40])))
            continue
        print("OK    %-58s body byte-identical (%d bytes)" % (p, len(b1)))

    print("\n%d html files checked, %d body violations" % (len(pages), len(bad)))
    for p, why in bad:
        print("  FAIL %s\n       %s" % (p, why))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
