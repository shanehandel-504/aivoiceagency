#!/usr/bin/env python3
# =============================================================================
# tools/run7-copy-sweep.py  ·  RUN 7-CODE
# -----------------------------------------------------------------------------
# Two sweeps over every visible surface in the repo, recording old -> new for
# every single change.
#
#   A · MESSAGE FORMAT LAW — one canonical name, "AVA strategy call", 15 minutes
#       never 30. The live GHL calendar was flipped to a 15-minute slot in the
#       same run, so copy and booking system agree.
#
#   B · LSA SWEEP — "LSA" spelled out as "Google Local Services Ads" on FIRST
#       mention per page, then "Google's ads" / "these Google leads" after. The
#       /lsa URL slug is untouched; that page's title + meta use the full name.
#
# Nav and footer CTAs are stamp.py-owned — they are changed in tools/stamp.py
# and propagated by re-running the stamper, never edited inline here.
#
# USAGE:
#   python tools/run7-copy-sweep.py --audit
#   python tools/run7-copy-sweep.py --apply
#
# IDEMPOTENT. Build-time only; tools/ is never deployed (.vercelignore).
# =============================================================================

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APPLY = '--apply' in sys.argv

# Directories that are not visible surfaces: history, vendored skills, backups.
SKIP_DIRS = {'.git', 'node_modules', 'reports', 'retell-backups', '.claude',
             'audits', 'automation', 'tools', '__pycache__', 'voice-stack'}
SKIP_FILES = {'board.json'}

# --- A · MESSAGE FORMAT LAW -------------------------------------------------
# Ordered: longest / most specific first so a shorter rule cannot pre-empt one.
LAW = [
    ('Book a 30-minute call',      'Book the AVA strategy call'),
    ('Book My 30-Minute Call',     'Book My AVA Strategy Call'),
    ('BOOK A 30-MINUTE CALL',      'BOOK THE AVA STRATEGY CALL'),
    ('Book a 30 minute call',      'Book the AVA strategy call'),
    ('book a 30-minute call',      'book the AVA strategy call'),
    # prose durations — the calendar is now a 15-minute slot
    ('Your 30-minute call is set', 'Your AVA strategy call is set'),
    ('30 minutes, live on your line', '15 minutes, live on your line'),
    ('The intro call is 30 minutes.', 'The AVA strategy call is 15 minutes.'),
    ('Twenty-minute call.',        'Fifteen-minute call.'),
    ('<b>30 minutes</b>',          '<b>15 minutes</b>'),
    ('Book your AVA demo — 30 minutes', 'Book your AVA strategy call — 15 minutes'),
    ('AVA Strategy Call — AI Voice Agency', 'AVA strategy call — AI Voice Agency'),
    ('Book the strategy call',     'Book the AVA strategy call'),
]

# --- B · LSA SWEEP ----------------------------------------------------------
# First mention per page becomes the full product name; later mentions become
# plain-English Google references. Applied longest-first.
LSA_PHRASES = [
    ('Missed LSA Calls Drop Your Ranking',
     'Missed Google Local Services Ads Calls Drop Your Ranking'),
    ('Missed LSA calls lower your responsiveness',
     "Missed calls on these Google leads lower your responsiveness"),
    ('Every missed LSA call is graded against you.',
     "Every missed call on Google's ads is graded against you."),
    ('Every LSA call runs through Google&#39;s own number.',
     "Every Google Local Services Ads call runs through Google's own number."),
    ("Every LSA call runs through Google's own number.",
     "Every Google Local Services Ads call runs through Google's own number."),
    ('LSA calls are routed through Google&#39;s number.',
     "These Google leads are routed through Google's number."),
    ("LSA calls are routed through Google's number.",
     "These Google leads are routed through Google's number."),
    ('LSA CALL RECORD', 'GOOGLE ADS CALL RECORD'),
    ('YOUR LSA PLACEMENT', 'YOUR GOOGLE ADS PLACEMENT'),
    ('LSA industry reporting, 2026', 'Google Local Services Ads industry reporting, 2026'),
    ('LSA agency benchmarks, 2026', 'Google Local Services Ads agency benchmarks, 2026'),
    ('Home-services LSA analysis, 2026', 'Home-services Google Local Services Ads analysis, 2026'),
    ('answering 95%+ of LSA calls', "answering 95%+ of Google's ad calls"),
    ('the highest-intent lead LSA sends', 'the highest-intent lead Google sends'),
    ('so every LSA lead gets caught', 'so every one of these Google leads gets caught'),
    ('What missed LSA calls do to your ranking',
     'What missed Google Local Services Ads calls do to your ranking'),
]

changes = []


def sweep(path, rel):
    with open(path, 'r', encoding='utf-8') as fh:
        src = fh.read()
    out = src
    for old, new in LAW + LSA_PHRASES:
        if old in out:
            n = out.count(old)
            out = out.replace(old, new)
            changes.append((rel, n, old, new))
    if out != src and APPLY:
        with open(path, 'w', encoding='utf-8', newline='') as fh:
            fh.write(out)
    return out != src


touched = 0
for base, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith('.')]
    for fn in files:
        if not fn.endswith(('.html', '.js', '.json', '.md', '.webmanifest')):
            continue
        if fn in SKIP_FILES:
            continue
        p = os.path.join(base, fn)
        rel = os.path.relpath(p, ROOT).replace('\\', '/')
        if rel.upper().startswith('CLAUDE.MD'):
            continue
        try:
            if sweep(p, rel):
                touched += 1
        except UnicodeDecodeError:
            continue

print('RUN 7-CODE COPY SWEEP · mode=%s' % ('apply' if APPLY else 'audit'))
print('files changed: %d · replacements: %d\n' % (touched, sum(c[1] for c in changes)))

agg = {}
for rel, n, old, new in changes:
    agg.setdefault((old, new), []).append((rel, n))
for (old, new), hits in sorted(agg.items(), key=lambda kv: -sum(h[1] for h in kv[1])):
    total = sum(h[1] for h in hits)
    print('%4d x  %-46s -> %s' % (total, repr(old)[:46], repr(new)[:60]))
    if total <= 6:
        for rel, n in hits:
            print('          %s (%d)' % (rel, n))
    else:
        print('          across %d files' % len(hits))
