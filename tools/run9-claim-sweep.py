#!/usr/bin/env python3
# =============================================================================
# tools/run9-claim-sweep.py  ·  RUN 9 · CLAIM SWEEP  (commit 1 — Skin First)
# -----------------------------------------------------------------------------
# CLAIM-TIER RULES enforced here:
#   * Penalty language ("Google penalizes missed calls") is allowed ONLY on /lsa
#     and paid landers, and only beside the verbatim Google quotes already there.
#   * Every other surface: Google-behaviour voltage is fine (throttle, dead-end,
#     "the next name on the map"), customer-behaviour claims are always safe —
#     but NO categorical penalty claims and NO invented stats.
#   * "Google says" = verbatim quotes only. Full product names front-stage.
#
# AUDIT RESULT (measured, not assumed):
#   /lsa            penalty language sits directly beside the VERBATIM Google
#                   quote ("Missed calls may negatively affect your
#                   responsiveness." - support.google.com/localservices/
#                   answer/7527305) and every figure carries a named source
#                   (411 Locals / ServiceTitan, PATLive / Aircall). COMPLIANT,
#                   left untouched. The hero "3AM. GOOGLE WAS LISTENING." is a
#                   protected anchor and is NOT changed.
#   verticals/city  the 47% / 73% figures carry "Source: AgentZap" inline.
#                   COMPLIANT, left untouched.
#   /staging/xray   noindex,nofollow - not a front-stage surface.
#   BLOG            the single real violation. /blog/home-services-30-percent-
#                   missed is built on an invented statistical model: a "30% of
#                   inbound calls" figure attributed only to "the trade
#                   publications", a fabricated $480 average ticket compounded
#                   into "$720,000 a year", plus 40% / 30x / 5% / 10% / 12x.
#                   None of it is in the CLAUDE.md sourced set. It is indexed
#                   and in the sitemap.
#
# THE FIX KEEPS THE VOLTAGE AND LOSES THE CATEGORICAL CLAIM. The clustering
# windows, the "they hang up and dial the next number" behaviour, and the
# after-hours emergency framing are all CUSTOMER-behaviour claims and survive
# intact. Only the invented arithmetic goes, replaced by a pointer at the ROI
# calculator so the reader runs their OWN numbers.
#
# The URL slug is deliberately NOT changed - it is indexed and linked.
#
# USAGE:
#   python tools/run9-claim-sweep.py --audit
#   python tools/run9-claim-sweep.py --apply
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

BLOG = 'blog/home-services-30-percent-missed/index.html'
INDEX = 'blog/index.html'

# --- plain string swaps (title / OG / Twitter / JSON-LD headline / card) -----
OLD_TITLE = 'Why Most Home Service Businesses Lose 30% of Their Calls'
NEW_TITLE = 'Why Home Service Businesses Miss Calls (And Where Those Jobs Go)'

STRINGS = [
    (BLOG, OLD_TITLE, NEW_TITLE),
    (INDEX, OLD_TITLE, NEW_TITLE),
    # H1 - the cyan span carried the invented figure
    (BLOG,
     'Why most home service businesses lose <span class="hero-line-cyan" style="color: var(--cyan);">30%</span> of their calls.',
     'Why home service businesses <span class="hero-line-cyan" style="color: var(--cyan);">miss calls</span> — and where those jobs go.'),

    # META DESCRIPTIONS — the worst of it. These are what render in the search
    # result, and they opened with the words "Industry data:" in front of a
    # figure that has no source at all. Rewritten to buyer-intent phrasing.
    (BLOG,
     'Industry data: 30% of home-service inbound calls hit voicemail. At $480 average ticket, '
     'a five-truck operation loses $720K a year to a ringing phone. The math — and the fix.',
     'Home-service calls get missed in predictable windows — after hours, lunch, storm surge, '
     'three-at-once. Where those callers go, and how a 24/7 AI receptionist that books '
     'appointments catches them.'),
    (BLOG,
     'Industry data: 30% of home-service inbound calls hit voicemail. At $480 average ticket, '
     'a five-truck operation loses $720K a year to a ringing phone.',
     'Home-service calls get missed in predictable windows. Where those callers go, and how a '
     '24/7 AI receptionist that books appointments catches them.'),
    (BLOG,
     '30% of home-service calls hit voicemail. The math, and the fix.',
     'Home-service calls get missed in predictable windows. Where those callers go — and how to '
     'catch them.'),

    # the blog index card carried the same fabricated model in its preview
    (INDEX,
     'Industry data says 30% of inbound home-service calls hit voicemail. At an average ticket of '
     '$480, a five-truck operation loses $2,400 a day — $720,000 a year — to a ringing phone. '
     'Why it happens. What it costs. How to stop it.',
     'Home-service calls get missed in predictable windows — after hours, lunch, storm surge, '
     'three-at-once. Why it happens, where those callers go, and how to catch them.'),
]

# --- whole-paragraph rewrites, anchored on a unique opening ------------------
# (file, regex, replacement, label)
PARAS = [
    (BLOG,
     r'<p>The trade publications have been quoting the same number for a decade\..*?</p>',
     '<p>Ask a home-service operator what happens to the calls nobody picks up and you get a shrug. '
     'Nobody measures it, because a missed call leaves no record — <strong>the caller simply hangs up '
     'and dials the next number.</strong> That is what makes it expensive: from inside the business, the '
     'loss is invisible.</p>',
     'lede: "30% of inbound calls ... worse than 40%" (unsourced categorical stat)'),

    (BLOG,
     r'<h2>The math at a five-truck operation</h2>',
     '<h2>What a missed call actually costs</h2>',
     'H2 promising a fabricated model'),

    (BLOG,
     r'<p>A typical Wisconsin five-truck HVAC operation runs 40 inbound calls per day\..*?</p>',
     '<p>The honest answer is that it depends on two numbers nobody else can tell you: your call volume '
     'and your average ticket. What is not in doubt is the shape of it. A missed call at a home-service '
     'business is rarely a small call — emergency work carries the highest tickets and the highest intent, '
     'and it is exactly the work that arrives outside business hours.</p>',
     'fabricated model: $480 ticket compounded to "$720,000 a year"'),

    (BLOG,
     r'<p>For an emergency plumbing operation with higher tickets.*?</p>',
     '<p>Emergency plumbing runs higher tickets and higher intent. Pest control runs lower tickets and more '
     'shopping around. The pattern holds across the vertical even where the numbers do not.</p>',
     '"the order of magnitude holds" - inherits the fabricated model'),

    (BLOG,
     r'<li><strong>Storm and freeze surge\.</strong>.*?</li>',
     '<li><strong>Storm and freeze surge.</strong> When the temperature drops below zero in Wisconsin, every '
     'HVAC line in the state maxes at once. No staffing model is built for that spike, because it would sit '
     'idle the rest of the year.</li>',
     'invented "variance is 30x normal volume"'),

    (BLOG,
     r'<li><strong>Lunch hour\.</strong>.*?</li>',
     '<li><strong>Lunch hour.</strong> Solo and small operators have nobody answering between noon and 1 PM '
     '— and the highest-intent residential customers call during their own lunch break, because that is '
     'when they are free to.</li>',
     'invented "5% of daily call volume"'),

    (BLOG,
     r'<p>AVA Starter is \$497/month plus \$497 setup\..*?</p>',
     '<p>AVA Starter is $497/month plus $497 setup. Whether that pays for itself depends on your own call '
     'volume and average ticket — run them through the ROI calculator and see what recapture looks like on '
     'your numbers instead of somebody else’s.</p>',
     'invented "$720K/year", "10% recapture", "pays 12x over"'),
]


def load(rel):
    with io.open(os.path.join(ROOT, rel), encoding='utf-8') as fh:
        return fh.read()


def save(rel, s):
    with io.open(os.path.join(ROOT, rel), 'w', encoding='utf-8', newline='') as fh:
        fh.write(s)


files = {}
for rel, old, new in STRINGS:
    s = files.get(rel, load(rel))
    if old in s:
        changes.append((rel, s.count(old), old, new))
        s = s.replace(old, new)
    files[rel] = s

for rel, pat, new, label in PARAS:
    s = files.get(rel, load(rel))
    m = re.search(pat, s, re.S)
    if m:
        changes.append((rel, 1, m.group(0), new))
        s = s[:m.start()] + new + s[m.end():]
    files[rel] = s

if APPLY:
    for rel, s in files.items():
        save(rel, s)

print('RUN 9 CLAIM SWEEP · mode=%s' % ('apply' if APPLY else 'audit'))
print('%d replacement(s) across %d file(s)\n' % (len(changes), len({c[0] for c in changes})))
for rel, n, old, new in changes:
    o = re.sub(r'\s+', ' ', old)
    w = re.sub(r'\s+', ' ', new)
    print('--- %s  (%dx)' % (rel, n))
    print('    OLD: %s' % (o[:230] + ('...' if len(o) > 230 else '')))
    print('    NEW: %s\n' % (w[:230] + ('...' if len(w) > 230 else '')))

if not changes:
    print('No violations remaining — already compliant.')
