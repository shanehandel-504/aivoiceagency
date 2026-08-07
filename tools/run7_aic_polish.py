# -*- coding: utf-8 -*-
"""AIC RUN 7 · "STATE & LIGHT" — the mechanical half of the polish pass.

*** SUPERSEDED — DO NOT RE-RUN. Historical record only. ***
RUN 13 replaced the sticky rail's second control: it is "Book the setup call"
to /book/ now, not a callback link. This file still emits the RUN 7 form of
that markup, so re-running it would silently put the retired control back on
every page. The rail's current shape is owned by tools/aic-run13-rail.mjs and
asserted by tools/aic-run9-styleparity.mjs and tools/aic-run13-railfit.mjs.
Its idempotence note below is about RUN 7's own transforms and does not protect
against this: the markup it matches no longer exists, so "matches only the OLD
form" now means "matches nothing, then writes the old form".

WHY A SCRIPT AND NOT TWELVE HAND EDITS
--------------------------------------
Task A's requirement is "one name for one action, sitewide — zero synonyms
remain." That is 36 CTA labels across 12 files, and the failure mode is not
getting one wrong, it is getting ELEVEN right and leaving the twelfth. A script
either hits every occurrence or reports that it did not, and --check re-runs the
same assertions after the fact.

IDEMPOTENT BY CONSTRUCTION. Every transform matches only the OLD form, so a
second run is a no-op and reports 0 changes. That matters because the homepage
was partly hand-edited before this ran.

RUN:    python tools/run7_aic_polish.py
CHECK:  python tools/run7_aic_polish.py --check    (exit 1 if anything is stale)
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CH = os.path.join(ROOT, 'chauffeur')

PAGES = [
    'index.html',
    'demo/index.html',
    'book/index.html',
    'how-setup-works/index.html',
    'works-with-your-software/index.html',
    'limo-answering-service/index.html',
    'after-hours-limo-dispatch/index.html',
    'airport-transfer-booking/index.html',
    'milwaukee-limo-answering-service/index.html',
    'madison-limo-answering-service/index.html',
    'privacy/index.html',
    'terms/index.html',
]

TEL = '+14147750019'
TEL_DISPLAY = '(414) 775-0019'

PHONE_SVG = (
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" '
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 '
    '19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 '
    '2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>'
)

# ── TASK A · ONE NAME FOR ONE ACTION ────────────────────────────────────────
# Ordered longest-first so the arrow variant is consumed before the bare one.
# Every one of these renders uppercase — .nav-links a, .cta-tertiary a, .btn and
# .foot-links a all carry text-transform:uppercase — so the source stays
# sentence case and the page shows REQUEST FOUNDER-LED SETUP.
CTA_RENAMES = [
    ('Request local setup →', 'Request founder-led setup →'),
    ('>Request setup<', '>Request founder-led setup<'),
    # Catch-all, and it must run LAST: the homepage's two .btn labels sit on
    # their own line with the chevron in a sibling <svg>, so there is no ">" or
    # "→" adjacent to anchor against. Recon confirmed this string appears
    # nowhere in prose, only as a CTA label.
    ('Request local setup', 'Request founder-led setup'),
]

# ── COPY UNIFICATION ────────────────────────────────────────────────────────
# "Local" contradicts "Serving operators nationwide" in our own footer, and one
# meeting was carrying three names ("intro call", "setup call", "strategy call")
# and two lengths across the site. One name, one length, everywhere.
COPY = [
    ('Schedules a 20-min intro call.', 'Schedules the 20-minute setup call.'),
    ('20-minute intro call', '20-minute setup call'),
    ('the intro call', 'the setup call'),
    ('an intro call', 'a setup call'),
    ('Local setup, <em>handled directly.</em>', 'Founder-led setup, <em>handled directly.</em>'),
    ('Local setup is founder-led right now.', 'Setup is founder-led right now.'),
]

# ── TASK I · TRUST AUDIT ────────────────────────────────────────────────────
# "The board" is the OPERATOR's dispatch board. A sentence where AVA is the
# subject putting something on it is a present-tense writeback claim, and the
# same page's own FAQ denies writeback. Sentences where the DISPATCHER opens
# their own board are true and are left alone.
CLAIMS = {
    'after-hours-limo-dispatch/index.html': [
        ('that run is sitting on the board as a trip ticket with every field filled in.',
         'that run is waiting for your dispatcher as a trip ticket with every field filled in.'),
        ('A finished ticket sits on the board, ready for a dispatcher on Monday morning.',
         'A finished ticket is waiting, ready for a dispatcher on Monday morning.'),
        ('A sample morning, as it would land on your board:',
         'A sample morning, as it would reach your dispatcher:'),
        ('Your dispatcher walks in, opens the board, and reads three finished trip tickets. '
         '<strong>All three on the board.</strong>',
         'Your dispatcher walks in and reads three finished trip tickets. '
         '<strong>All three captured.</strong>'),
        ('It takes the entire trip and puts it on the board.',
         'It takes the entire trip and hands it over as a finished ticket.'),
    ],
    'demo/index.html': [
        ('Book the strategy call. Setup is founder-led and scoped to how your operation runs '
         '— your rate rules, your service area, your dispatch process.',
         'Request founder-led setup. It is scoped to how your operation runs '
         '— your rate rules, your service area, your dispatch process.'),
    ],
    # /book/ is the DESTINATION of the renamed CTA, so it owes the same name.
    # A first pass only swapped "Setup Call" for "Founder-Led Setup" and left the
    # verb, which meant a click on REQUEST FOUNDER-LED SETUP landed on a page
    # titled "Book Founder-Led Setup" — one action, two verbs, and one of them
    # only visible in a search result. Title, description, og, twitter and the H1
    # all say Request now; "book" survives only where it means picking a slot on
    # the calendar, which is a different act.
    'book/index.html': [
        ('<title>Book a Setup Call — AI Chauffeur | Limo Answering Service</title>',
         '<title>Request Founder-Led Setup — AI Chauffeur | Limo Answering Service</title>'),
        ('Book a Setup Call — AI Chauffeur', 'Request Founder-Led Setup — AI Chauffeur'),
        ('content="Book a 20-minute setup call with the founder.',
         'content="Request founder-led setup — a 20-minute call with the founder.'),
        ('<span class="kicker">Setup call · 20 minutes</span>',
         '<span class="kicker">Founder-led setup · 20 minutes</span>'),
        ('<h1 class="page-h">Book the <em>setup call.</em></h1>',
         '<h1 class="page-h">Request <em>founder-led setup.</em></h1>'),
    ],
}

# ── TASK D · SECTION LIGHTING ───────────────────────────────────────────────
# Named by what the section IS, never by what colour someone wanted. phead and
# the CTA section are the bright beats; a section that shows a ticket or a
# calculator is technical; compatibility copy is calm; an ordered sequence is
# connected; operator-pain copy is dense; FAQ and link lists are flat.
# index.html was attributed by hand and is deliberately absent here.
LIT = {
    'demo/index.html': {'PHEAD': 'bright', 'what-to-say': 'connected', 'after': 'flat', 'faq': 'flat'},
    'book/index.html': {'PHEAD': 'bright', 'talk': 'bright', 'more': 'flat'},
    'how-setup-works/index.html': {'PHEAD': 'bright', 'steps': 'connected', 'need': 'flat',
                                   'cost': 'calm', 'talk': 'bright', 'faq': 'flat', 'more': 'flat'},
    'works-with-your-software/index.html': {'PHEAD': 'bright', 'no-rip-out': 'calm', 'ticket': 'technical',
                                            'honest': 'calm', 'talk': 'bright', 'faq': 'flat', 'more': 'flat'},
    'limo-answering-service/index.html': {'PHEAD': 'bright', 'problem': 'dense', 'how': 'flat',
                                          'ticket': 'technical', 'compare': 'calm', 'talk': 'bright',
                                          'faq': 'flat', 'more': 'flat'},
    'after-hours-limo-dispatch/index.html': {'PHEAD': 'bright', 'nights': 'dense', 'weekends': 'flat',
                                             'mornings': 'technical', 'overflow': 'flat', 'cost': 'technical',
                                             'talk': 'bright', 'faq': 'flat', 'more': 'flat'},
    'airport-transfer-booking/index.html': {'PHEAD': 'bright', 'fields': 'technical', 'buffer': 'flat',
                                            'hubs': 'calm', 'early': 'technical', 'talk': 'bright',
                                            'faq': 'flat', 'more': 'flat'},
    'milwaukee-limo-answering-service/index.html': {'PHEAD': 'bright', 'mke': 'technical', 'downtown': 'flat',
                                                    'festival': 'dense', 'operator': 'warm', 'talk': 'bright',
                                                    'faq': 'flat', 'more': 'flat'},
    'madison-limo-answering-service/index.html': {'PHEAD': 'bright', 'msn': 'technical', 'downtown': 'flat',
                                                  'gameday': 'dense', 'verona': 'flat', 'weddings': 'technical',
                                                  'operator': 'warm', 'talk': 'bright', 'faq': 'flat',
                                                  'more': 'flat'},
    'privacy/index.html': {'PHEAD': 'bright'},
    'terms/index.html': {'PHEAD': 'bright'},
}


def rail_markup(has_form):
    """The mobile sticky action rail.

    No aria-hidden anywhere: the hidden state is visibility:hidden in CSS, which
    already removes it from the accessibility tree AND the tab order. Marking a
    container aria-hidden while it still holds focusable links is the
    aria-hidden-focus violation, and this gate requires a11y 100.

    Pages with no callback form (/demo/, /privacy/, /terms/) get the solo
    variant — the call button at full width. A "CALL ME" button that scrolls to
    a form which is not on the page is a dead control, and a dead control on the
    only persistent bar is worse than no bar.
    """
    call = (
        '  <a class="rail-call" href="tel:%s" data-event="tel_tap_rail">%s Call %s</a>\n'
        % (TEL, PHONE_SVG, TEL_DISPLAY)
    )
    if not has_form:
        return (
            '<!-- RUN 7 · TASK A — mobile sticky action rail (solo: no callback form here) -->\n'
            '<div class="rail rail--solo" data-rail>\n' + call + '</div>\n\n'
        )
    return (
        '<!-- RUN 7 · TASK A — mobile sticky action rail -->\n'
        '<div class="rail" data-rail>\n' + call +
        '  <a class="rail-cb" href="#ava-callback" data-event="rail_call_me">Call me</a>\n'
        '</div>\n\n'
    )


def transform(rel, s):
    notes = []

    def sub(old, new, label):
        nonlocal s
        n = s.count(old)
        if n:
            s = s.replace(old, new)
            notes.append('%s x%d' % (label, n))

    # 1 · CTA renames
    for old, new in CTA_RENAMES:
        sub(old, new, 'cta-rename')

    # 2 · copy unification
    for old, new in COPY:
        sub(old, new, 'copy')

    # 3 · per-page claim + title corrections
    for old, new in CLAIMS.get(rel, []):
        if old in s:
            s = s.replace(old, new)
            notes.append('claim')
        elif new not in s:
            notes.append('!! CLAIM MISS: %s' % old[:52])

    # 4 · nav phone chip gets a glyph (icon + number, per Task B)
    old_nav = '<a href="tel:%s" class="nav-cta" data-event="tel_tap_nav">%s</a>' % (TEL, TEL_DISPLAY)
    # The accessible name must CONTAIN the visible text (WCAG 2.5.3, Label in
    # Name). A first pass here read "Call AI Chauffeur at 414 775 0019", which
    # spells the digits differently from the "(414) 775-0019" on screen —
    # Lighthouse flagged label-content-name-mismatch and a voice-control user
    # saying the number they can see would not have activated the link.
    new_nav = ('<a href="tel:%s" class="nav-cta" data-event="tel_tap_nav" '
               'aria-label="Call %s">%s%s</a>' % (TEL, TEL_DISPLAY, PHONE_SVG, TEL_DISPLAY))
    sub(old_nav, new_nav, 'nav-chip')

    # 5 · rail anchors ------------------------------------------------------
    # data-rail-after ARMS the rail once the hero has scrolled away. On the
    # homepage that is the CTA stack itself; everywhere else the page head is
    # the hero and the CTA stack sits mid-document, so arming on it would fire
    # too late to be of any use.
    if rel == 'index.html':
        if 'data-rail-after' not in s:
            s = s.replace('<div class="cta-stack">', '<div class="cta-stack" data-rail-after>', 1)
            notes.append('rail-after')
    else:
        if 'data-rail-after' not in s:
            s2 = re.sub(r'<section class="phead([^"]*)"', r'<section class="phead\1" data-rail-after', s, count=1)
            if s2 != s:
                s = s2
                notes.append('rail-after')
            else:
                notes.append('!! NO PHEAD')

    # data-rail-hide SUPPRESSES it while its own targets are on screen — the
    # callback form, the booking calendar, and the missed-night calculator.
    # All three hold inputs, and the rail must never sit on top of an input.
    if 'data-cb-form' in s and 'data-rail-hide' not in s:
        s = s.replace('data-cb-form', 'data-cb-form data-rail-hide', 1)
        notes.append('rail-hide:form')
    if '<div class="cal-shell">' in s:
        s = s.replace('<div class="cal-shell">', '<div class="cal-shell" data-rail-hide>', 1)
        notes.append('rail-hide:cal')
    m = re.search(r'<(div|section)([^>]*\sdata-calc\b[^>]*)>', s)
    if m and 'data-rail-hide' not in m.group(0):
        s = s[:m.start()] + '<%s%s data-rail-hide>' % (m.group(1), m.group(2)) + s[m.end():]
        notes.append('rail-hide:calc')

    # the rail's second button needs a target
    if 'data-cb-form' in s and 'id="ava-callback"' not in s:
        s = s.replace('<form class="cb-form" data-cb-form',
                      '<form class="cb-form" id="ava-callback" data-cb-form', 1)
        notes.append('form-id')

    # 6 · inject the rail before the shared script
    if 'data-rail>' not in s:
        anchor = '<script src="/assets/aic.js'
        i = s.find(anchor)
        if i == -1:
            notes.append('!! NO AIC.JS ANCHOR')
        else:
            s = s[:i] + rail_markup('data-cb-form' in s) + s[i:]
            notes.append('rail')

    # 7 · numbered cards stay carded — they are an ordered sequence, which is a
    #     record, not prose. Applied in markup so the CSS does not need :has().
    s2, n = re.subn(r'<div class="card">(\s*\n\s*<div class="card-num">)',
                    r'<div class="card card--stage">\1', s)
    if n:
        s = s2
        notes.append('card--stage x%d' % n)

    # 8 · section lighting
    for key, val in LIT.get(rel, {}).items():
        if key == 'PHEAD':
            s2 = re.sub(r'<section class="(phead[^"]*)"(?![^>]*data-lit)',
                        r'<section class="\1" data-lit="%s"' % val, s, count=1)
        else:
            s2 = re.sub(r'<section id="%s"(?![^>]*data-lit)' % re.escape(key),
                        r'<section id="%s" data-lit="%s"' % (key, val), s, count=1)
        if s2 != s:
            s = s2
            notes.append('lit:%s' % key)

    return s, notes


def main():
    check = '--check' in sys.argv
    total, bad = 0, 0
    for rel in PAGES:
        p = os.path.join(CH, rel.replace('/', os.sep))
        src = io.open(p, encoding='utf-8').read()
        out, notes = transform(rel, src)
        misses = [n for n in notes if n.startswith('!!')]
        bad += len(misses)
        if out != src:
            total += 1
            if not check:
                io.open(p, 'w', encoding='utf-8', newline='').write(out)
        tag = 'STALE  ' if (check and out != src) else ('changed' if out != src else '   ok  ')
        print('  %s %-46s %s' % (tag, rel, ', '.join(notes) if notes else '-'))
    print()
    print('  %d page(s) %s, %d miss(es)' % (total, 'stale' if check else 'changed', bad))
    if bad:
        return 1
    if check and total:
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
