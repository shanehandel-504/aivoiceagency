# -*- coding: utf-8 -*-
"""AIC RUN 8 · FONT LOCK — the head-of-page half of the change.

Swaps the three Google Fonts <link>s on every chauffeur page for two preloads of
the self-hosted woff2 files. Exact-string replacement, one occurrence per file:
if the needle is not found byte-for-byte the file is REPORTED AND LEFT ALONE, so
a page whose head drifted can never be silently half-converted.

Idempotent. Re-running with the change already in place is a no-op.

    python tools/run8_fontlock.py            apply
    python tools/run8_fontlock.py --check    exit 1 if any page still references Google
"""
import glob
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CH = os.path.join(ROOT, 'chauffeur')

OLD = (
    '  <link rel="preconnect" href="https://fonts.googleapis.com">\n'
    '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    '  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700'
    '&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">\n'
)

NEW = (
    '  <!-- RUN 8 · FONT LOCK — self-hosted. The @font-face lives in the stylesheet,\n'
    '       so without a preload the browser cannot discover either file until the CSS\n'
    '       has parsed and matched a rule against it. The href must be the SAME STRING\n'
    '       as the src, and crossorigin is required even same-origin because fonts are\n'
    '       always fetched in CORS mode — miss either and the file is fetched twice. -->\n'
    '  <link rel="preload" as="font" type="font/woff2" href="/fonts/space-grotesk.woff2" crossorigin>\n'
    '  <link rel="preload" as="font" type="font/woff2" href="/fonts/jetbrains-mono.woff2" crossorigin>\n'
)

GOOGLE = re.compile(r'fonts\.(?:googleapis|gstatic)\.com')


def pages():
    return sorted(set(glob.glob(os.path.join(CH, '*.html')) +
                      glob.glob(os.path.join(CH, '*', 'index.html'))))


def main():
    check = '--check' in sys.argv
    converted, already, missed, dirty = 0, 0, [], []

    for p in pages():
        rel = os.path.relpath(p, CH).replace('\\', '/')
        s = io.open(p, encoding='utf-8').read()

        if NEW in s and OLD not in s:
            already += 1
        elif OLD in s:
            if check:
                print('  STALE   %s — still linking Google Fonts' % rel)
            else:
                # newline='' so the file keeps the line endings it already had
                io.open(p, 'w', encoding='utf-8', newline='').write(s.replace(OLD, NEW, 1))
                print('  swapped %s' % rel)
                converted += 1
                s = s.replace(OLD, NEW, 1)
        else:
            missed.append(rel)
            print('  NEEDLE NOT FOUND — left untouched: %s' % rel)

        hits = sorted(set(GOOGLE.findall(s)))
        if hits:
            # count them so the report can name the number, not just the fact
            n = len(GOOGLE.findall(s))
            dirty.append((rel, n))

    print()
    print('  pages scanned      : %d' % len(pages()))
    print('  converted this run : %d' % converted)
    print('  already converted  : %d' % already)
    if missed:
        print('  NEEDLE NOT FOUND   : %d -> %s' % (len(missed), ', '.join(missed)))
    if dirty:
        print('  STILL REFERENCE GOOGLE FONTS:')
        for rel, n in dirty:
            print('     X %-46s %d reference(s)' % (rel, n))
    else:
        print('  zero fonts.googleapis.com / fonts.gstatic.com references remain')
    return 1 if (missed or dirty) else 0


if __name__ == '__main__':
    sys.exit(main())
