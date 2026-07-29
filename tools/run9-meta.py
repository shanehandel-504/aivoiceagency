#!/usr/bin/env python3
# =============================================================================
# tools/run9-meta.py  ·  RUN 9 · BUYER-INTENT META PASS
# -----------------------------------------------------------------------------
# EXISTING PAGES ONLY. No new pages, no city stamping.
#
# Aligns <title>, meta description, og:title/description and twitter:* toward
# the buyer-intent phrasing people actually search: "AI receptionist for HVAC
# companies", "after-hours answering service for plumbers", "AI receptionist
# that books appointments", "24/7 HVAC answering service".
#
# SCOPE CALL — H1s ARE DELIBERATELY NOT REWRITTEN.
#   These heroes are span-per-line compositions ("<span class='hero-line'>...")
#   that carry the page's visual rhythm; rewording them is a hero redesign, not
#   a meta pass, and it collides with the minimal-delta rule this run is under.
#   The two highest-intent pages already carry the phrase in the H1 ("The
#   answering service for HVAC companies that actually dispatches", "Your
#   answering service takes a message"). Flagged in the run report so an H1
#   pass can be commissioned as its own design run.
#
# NOT TOUCHED: the homepage <h1> "3AM. GOOGLE WAS LISTENING." (protected anchor
# A1, and explicitly out of scope this run) and every other protected anchor.
#
# USAGE:
#   python tools/run9-meta.py --audit
#   python tools/run9-meta.py --apply
#
# IDEMPOTENT. Build-time only; tools/ is never deployed (.vercelignore).
# =============================================================================

import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APPLY = '--apply' in sys.argv
changes = []

# page -> list of (old, new). Applied as plain string swaps so an already-run
# file simply matches nothing.
EDITS = {
    'index.html': [
        ('AI Receptionist for Local Service Businesses | AVA — AI Voice Agency',
         'AI Receptionist That Books Appointments 24/7 | AI Voice Agency'),
    ],
    'hvac-answering-service/index.html': [
        ('Answering Service for HVAC Companies, Statewide WI | AVA',
         '24/7 HVAC Answering Service | AI Receptionist for HVAC Companies'),
    ],
    'plumber-answering-service/index.html': [
        ('Answering Service for Plumbers in Wisconsin - 24/7 | AVA',
         'After-Hours Answering Service for Plumbers | AI Receptionist 24/7'),
    ],
    'electrician-answering-service/index.html': [
        ('Answering Service for Electricians in Wisconsin | AVA',
         '24/7 Answering Service for Electricians | AI Receptionist | AVA'),
    ],
    '24-hour-answering-service/index.html': [
        ('24 Hour Answering Service, Wisconsin Home Services | AVA',
         '24/7 Answering Service for Home Service Companies | AVA'),
    ],
    'home-services/index.html': [
        ('AI Phone Answering for Home Services Companies | AVA',
         'AI Receptionist for Home Service Companies | Books Jobs 24/7'),
    ],
    'hospitality/index.html': [
        ('AI Voice Agent for Hospitality &amp; Events | AVA',
         'AI Receptionist for Hotels and Event Venues | 24/7 Bookings'),
    ],
    'medical-practices/index.html': [
        ('AI Voice Agent for Medical Practices | AVA',
         'AI Receptionist for Medical Practices | Books Appointments 24/7'),
    ],
    'professional-services/index.html': [
        ('AI Phone Agent for Law Firms &amp; Professional Services | AVA',
         'AI Receptionist for Law Firms | Answers Client Calls 24/7'),
    ],
    'ground-transportation/index.html': [
        ('Ground Transportation Dispatch Intake | AI Voice Agency',
         'AI Receptionist for Limo and Black Car Dispatch | 24/7'),
    ],
    'book/index.html': [
        ('Book a Demo — AI Voice Agency',
         'Book the AVA Strategy Call — 15 Minutes | AI Voice Agency'),
    ],
}

# WHOLE-ATTRIBUTE description rewrites.
#
# These replace the entire content="..." of description / og:description /
# twitter:description rather than splicing a prefix onto the existing text.
# Two of the first-draft rules were SELF-NESTING — the replacement contained
# the string it matched, so a second --apply would have stapled the prefix on
# again and again. Whole-attribute replacement cannot nest, and the length is
# controllable (search snippets truncate around 155-160 characters).
#
# The homepage description is deliberately absent: it carries protected anchor
# A4, "AVA answers calls and books jobs."
FULL_DESCRIPTIONS = {
    'plumber-answering-service/index.html':
        'After-hours answering service for plumbers. AVA picks up every call 24/7, triages the '
        'emergency, and books the job straight into your calendar.',
    'ground-transportation/index.html':
        'AI receptionist for limo, black car and NEMT dispatch. AVA answers ride calls 24/7, captures '
        'trip details, and writes clean reservation records.',
    'medical-practices/index.html':
        'AI receptionist for medical practices that books appointments. AVA triages after-hours calls '
        'and routes refill requests for dental, primary care and specialty.',
    'hospitality/index.html':
        'AI receptionist for hotels, restaurants and event venues. AVA captures reservations, event '
        'inquiries and group bookings while your front desk handles guests.',
    'home-services/index.html':
        'AI receptionist for home service companies. AVA answers emergency calls when your team '
        'cannot, books jobs into ServiceTitan or Jobber, and routes the urgent ones.',
}

DESC_ATTRS = ('name="description"', 'property="og:description"', 'name="twitter:description"')


def apply_to(rel, pairs):
    p = os.path.join(ROOT, rel)
    if not os.path.exists(p):
        print('  SKIP (absent) %s' % rel)
        return
    s = io.open(p, encoding='utf-8').read()
    out = s
    for old, new in pairs:
        if old in out:
            n = out.count(old)
            changes.append((rel, n, old, new))
            out = out.replace(old, new)
    if out != s and APPLY:
        io.open(p, 'w', encoding='utf-8', newline='').write(out)


def set_descriptions(rel, text):
    """Rewrite the whole content="..." for each description-ish meta tag.
    Idempotent by construction: if the attribute already holds `text`, nothing
    is recorded and nothing is written."""
    p = os.path.join(ROOT, rel)
    if not os.path.exists(p):
        print('  SKIP (absent) %s' % rel)
        return
    s = io.open(p, encoding='utf-8').read()
    out = s
    for attr in DESC_ATTRS:
        pat = re.compile(r'(<meta\s+' + re.escape(attr) + r'\s+content=")(.*?)(">)', re.S)
        m = pat.search(out)
        if not m or m.group(2) == text:
            continue
        changes.append((rel, 1, attr + ' :: ' + m.group(2), text))
        out = out[:m.start()] + m.group(1) + text + m.group(3) + out[m.end():]
    if out != s and APPLY:
        io.open(p, 'w', encoding='utf-8', newline='').write(out)


for rel, pairs in EDITS.items():
    apply_to(rel, pairs)
for rel, text in FULL_DESCRIPTIONS.items():
    set_descriptions(rel, text)

print('RUN 9 BUYER-INTENT META · mode=%s' % ('apply' if APPLY else 'audit'))
print('%d replacement(s) across %d file(s)\n' % (len(changes), len({c[0] for c in changes})))
for rel, n, old, new in changes:
    print('  %s  (%dx)' % (rel, n))
    print('      OLD: %s' % old[:100])
    print('      NEW: %s' % new[:100])
if not changes:
    print('  nothing to change — already aligned.')
