# -*- coding: utf-8 -*-
"""Chauffeur-only asset cache-buster.

WHY THIS EXISTS
---------------
chauffeur/vercel.json sets `Cache-Control: public, max-age=86400` on /assets/.
That is correct for immutable assets — but the chauffeur pages referenced
/assets/aic.css and /assets/aic.js with NO version query, so a returning visitor
kept yesterday's copy for a full day. RUN 2 shipped the missed-night calculator
and the colour law inside those two files; without a version token, nobody who
had already visited would have seen either of them until the cache expired.

The main tools/stamp.py cannot be used for this. It rewrites EVERY registered
page in the repo, and the repo stamp is behind HEAD, so a full run drags ~374
unrelated aivoiceagency.ai asset rewrites into a chauffeur push. This tool
touches chauffeur/ only.

CONTENT HASH, NOT COMMIT HASH
-----------------------------
stamp.py keys the token off the git commit, which changes the URL of every asset
on every deploy and throws away cache hits that were still perfectly good. This
keys off the sha256 of the asset itself: the token changes when, and only when,
the file changes. Re-running with no asset edits is a no-op.

Usage:  python tools/stamp_chauffeur.py [--check]
        --check exits 1 if any reference is missing or stale (for CI / gates).
"""
import glob
import hashlib
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CH = os.path.join(ROOT, 'chauffeur')

# Assets that are mutable and therefore need a token. Fonts are excluded on
# purpose: their filenames are immutable, which is the whole point of woff2.
ASSETS = ['assets/aic.css', 'assets/aic.js', 'assets/circulant.css']


def digest(rel):
    p = os.path.join(CH, rel)
    if not os.path.exists(p):
        return None
    return hashlib.sha256(io.open(p, 'rb').read()).hexdigest()[:8]


def main():
    check = '--check' in sys.argv
    tokens = {rel: digest(rel) for rel in ASSETS}
    for rel, tok in tokens.items():
        if tok is None:
            print('  MISSING ASSET: chauffeur/%s' % rel)
            return 1
        print('  %-24s v=%s' % (rel, tok))

    # RUN 12 · depth two. The integration children are nested a level deeper
    # than anything before them; without this glob they would ship referencing
    # /assets/aic.css with NO version token at all, which is the exact
    # stale-cache failure this tool was written to prevent — and --check would
    # have reported every page current.
    pages = sorted(set(glob.glob(os.path.join(CH, '*.html')) +
                       glob.glob(os.path.join(CH, '*', 'index.html')) +
                       glob.glob(os.path.join(CH, '*', '*', 'index.html'))))
    changed, stale = 0, 0
    for p in pages:
        s = io.open(p, encoding='utf-8').read()
        orig = s
        for rel, tok in tokens.items():
            # match /rel with or without an existing ?v=..., inside href/src
            pat = re.compile(r'(["\'])(/%s)(\?v=[0-9a-f]+)?\1' % re.escape(rel))
            s = pat.sub(lambda m: '%s%s?v=%s%s' % (m.group(1), m.group(2), tok, m.group(1)), s)
        if s != orig:
            stale += 1
            if not check:
                io.open(p, 'w', encoding='utf-8', newline='').write(s)
                changed += 1
            print('  %s chauffeur/%s' % ('STALE  ' if check else 'stamped',
                                         os.path.relpath(p, CH).replace('\\', '/')))

    print()
    if check:
        print('  %d page(s) stale' % stale if stale else '  all pages carry current asset tokens')
        return 1 if stale else 0
    print('  %d page(s) stamped, %d already current' % (changed, len(pages) - changed))
    return 0


if __name__ == '__main__':
    sys.exit(main())
