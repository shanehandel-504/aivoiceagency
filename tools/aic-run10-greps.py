# -*- coding: utf-8 -*-
"""AIC RUN 10 — the sitewide grep gates, in one runnable file.

Every term below has cost this brand something. The list is not decorative and
neither is the exit code: `python tools/aic-run10-greps.py` exits 1 on any hit.

TRAP 5 LIVES HERE. Comments ship. A comment that QUOTES a gated string makes
this file report a clean page as dirty, and it has happened three times now —
once in RUN 9's own fix note, and twice in RUN 10 (a favicon note that spelled
out the gated hex, and an a11y note that used a banned claim word as an ordinary
adjective). That is why the strings this file searches for appear here and
nowhere else on the host.
"""
import glob
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CH = os.path.join(ROOT, 'chauffeur')

# What ships to a browser. assets/brand/ is deliberately included so the cyan
# gate can prove the mark's colour is present THERE and only there.
#
# RUN 12 added '*/*/index.html'. The integration children sit two levels down,
# and a grep gate that does not open a file cannot find anything in it — it
# prints "ALL CLEAN" about a page it never read. The negative control at the
# bottom proves the scanner can see pages; it could not prove it saw THESE.
PATTERNS = ('*.html', '*/index.html', '*/*/index.html', '*.txt', '*.xml',
            '*.webmanifest', 'assets/*.css', 'assets/*.js',
            'assets/brand/*.svg', '*.svg')

# term, why it is banned
ZERO = [
    ('shane', 'NO-NAME LAW: the voice is the team, never an individual'),
    ('founder', 'NO-NAME LAW'),
    ('founder-led', 'CTA CANON'),
    ('request setup', 'CTA CANON: one setup CTA string sitewide'),
    ('book the strategy', 'CTA CANON'),
    ('intro call', 'CTA CANON: the call is the setup call, 20 minutes'),
    ('map ranking', 'COPY SOURCE: never claim a ranking or a placement'),
    ('local ranking', 'COPY SOURCE'),
    ('Google tracks', 'COPY SOURCE: never assert what Google does'),
    ('Protection Plan', 'not a product we sell'),
    ('414-240-8930', 'the AVA PARENT phone. Never on this host.'),
    ('414) 240-8930', 'the AVA PARENT phone, formatted'),
    ('100 free minutes', 'never offered'),
    ('locked in', 'FORBIDDEN WORDS: use "set" or "decided"'),
    ('guaranteed', 'FORBIDDEN WORDS in claims about the service'),
    ('{{', 'an unrendered template token reached production'),
    ('REPLACE_', 'a placeholder reached production'),
]

# The mark's own accent. Legal in the kit and in the root icon files it is
# derived from; anywhere else it is the parent brand leaking across a boundary.
CYAN = '#00D4FF'
CYAN_OK = re.compile(r'^(assets[\\/]brand[\\/]|favicon|apple-touch-icon|icon-)')


def files():
    out = []
    for pat in PATTERNS:
        out += glob.glob(os.path.join(CH, pat))
    return sorted(set(os.path.relpath(p, CH) for p in out))


def find(term, paths, ci=True):
    hits = []
    flags = re.I if ci else 0
    for rel in paths:
        s = io.open(os.path.join(CH, rel), encoding='utf-8', errors='replace').read()
        for m in re.finditer(re.escape(term), s, flags):
            hits.append('%s:%d' % (rel.replace('\\', '/'), s[:m.start()].count('\n') + 1))
    return hits


def main():
    paths = files()
    bad = 0
    print('  scanning %d shipped files\n' % len(paths))
    for term, why in ZERO:
        h = find(term, paths)
        if h:
            bad += 1
            print('  FAIL  %-20s %d  %s' % (term, len(h), ', '.join(h[:5])))
            print('        %s' % why)
        else:
            print('  ok    %-20s 0' % term)

    cy = find(CYAN, paths)
    leak = [p for p in cy if not CYAN_OK.match(p.split(':')[0])]
    if leak:
        bad += 1
        print('  FAIL  %-20s %d outside the kit + root icons: %s' % (CYAN, len(leak), leak[:5]))
    else:
        print('  ok    %-20s %d, all inside the kit + the root icon files' % (CYAN, len(cy)))

    # A gate that cannot fail is not a gate: prove the scanner reads these files.
    tel = find('414-775-0019', paths)
    print('  ok    %-20s %d  (negative control: the scanner CAN see the pages)'
          % ('414-775-0019', len(tel)))
    if not tel:
        bad += 1
        print('  FAIL  the brand phone number was not found anywhere. The scan is broken.')

    print()
    print('  GREP GATES: %s' % ('ALL CLEAN' if not bad else '%d FAILING' % bad))
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
