# -*- coding: utf-8 -*-
"""Append the AIC-RUN7-POLISH entry to hq/board.json.

Surgical text insert, not a json.load/json.dump round trip: the file is
hand-formatted and a full re-serialise would reflow all 64 existing entries
into a diff nobody can read.
"""
import io
import os
import re
import sys
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOARD = os.path.join(ROOT, 'hq', 'board.json')

TS = datetime.now().astimezone().strftime('%Y-%m-%dT%H:%M:%S%z')
TS = TS[:-2] + ':' + TS[-2:]          # +0500 -> +05:00

ENTRY = (
    "AIC-RUN7-POLISH — aichauffeur.ai \"STATE & LIGHT\", all 12 pages. "
    "ONE CONVERSION PATH: 36 setup CTAs renamed to REQUEST FOUNDER-LED SETUP with zero synonyms "
    "left (\"Request setup\", \"Request local setup\", \"Book the strategy call\" and \"intro call\" "
    "all return 0), and a mobile sticky action rail — 60% tap-to-call / 40% call-me — that "
    "suppresses itself whenever the callback form, the booking calendar or the demo player is on "
    "screen. HEADER 72px -> 61px on a phone, both CSS copies. CONSOLE now runs a named 11.8s state "
    "progression (RINGING amber -> LISTENING cyan -> TRIP CAPTURED green -> QUOTE PREPARED -> READY "
    "FOR DISPATCH), starts on IntersectionObserver instead of looping off-screen forever, and "
    "carries a persistent result header plus the honesty chip INTERACTIVE DEMO · ILLUSTRATIVE TRIP "
    "DATA in place of the old \"live\" badge over an invented caller. DE-CARD: chrome survives only "
    "on the two consoles, the trip ticket, the four stage cards, FAQ items, the callback form and "
    "the calculator; prose separates by section tint and hairline. Four-stage rail with real state "
    "nodes; The Crush shifted to amber-black with three inbound lines resolving green; founder block "
    "cut to two paragraphs and a mono authority rail, uncarded. TRUST: 10 claim corrections — page "
    "title no longer says the AI books the ride, no sentence has AVA writing into dispatch software "
    "or putting trips on the board, the FAQ no longer implies AVA confirms, and 4 shipped comments "
    "that quoted retired claim wording were rewritten. GATE: Lighthouse mobile a11y 100 / SEO 100 on "
    "all 12 with zero failing audits, perf 92-99 (median 99); 1277 rendered text nodes measured for "
    "contrast, lowest 5.55:1; 72 page-viewport combinations at 360/390/430/768/1024/1440 with zero "
    "overflow and zero console errors; reduced motion verified for console, both rails and the "
    "Crush; sticky rail overlaps no input anywhere. An 11-agent adversarial pass then re-measured "
    "every task and found 1 blocker + 12 real defects my own gates were not looking for — all fixed "
    "and re-measured before push. OPEN: homepage CLS 0.126 mobile / 0.029 desktop is entirely the "
    "Google Fonts swap (pre-existing, unchanged by this run); self-hosting the two woff2 files "
    "already in the repo is the fix and wants its own run. /book/ Best-Practices 79 is the GHL "
    "iframe and is exempt. Confirm the GHL calendar UaxV0ENx2cEUYs6qeWZ7 really is a 20-minute slot "
    "— the site now says 20 minutes in one voice across 12 pages."
)


def main():
    s = io.open(BOARD, encoding='utf-8').read()
    if 'AIC-RUN7-POLISH' in s:
        print('  board.json already carries AIC-RUN7-POLISH — no-op')
        return 0

    m = re.search(r'("log"\s*:\s*\[)', s)
    if not m:
        print('  ERROR: no "log" array found in board.json')
        return 1

    block = '\n    {\n      "ts": "%s",\n      "entry": %s\n    },' % (
        TS, io.StringIO().__class__ and __import__('json').dumps(ENTRY, ensure_ascii=False))
    s = s[:m.end()] + block + s[m.end():]

    s = re.sub(r'("updated"\s*:\s*")[^"]*(")', lambda mm: mm.group(1) + TS + mm.group(2), s, count=1)

    io.open(BOARD, 'w', encoding='utf-8', newline='').write(s)
    print('  board.json: AIC-RUN7-POLISH logged at %s' % TS)
    return 0


if __name__ == '__main__':
    sys.exit(main())
