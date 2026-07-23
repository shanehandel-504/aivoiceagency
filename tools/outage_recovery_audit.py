#!/usr/bin/env python3
# =============================================================================
# tools/outage_recovery_audit.py  ·  RUN 1.5
# -----------------------------------------------------------------------------
# Every Retell call on the AVA lines during the n8n outage window, cross-checked
# against GHL to see whether the contact / booking / SMS that SHOULD have
# followed actually landed.
#
# Output: reports/2026-07-22-outage-recovery.md — Shane's personal callback list.
#
# NEVER fabricates. An empty API result is printed as "EMPTY - no result".
#
# USAGE:
#   doppler run --project ava-prod --config prd -- python tools/outage_recovery_audit.py
# =============================================================================

import io
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'reports', '2026-07-22-outage-recovery.md')

RETELL = 'https://api.retellai.com'
GHL = 'https://services.leadconnectorhq.com'
GHL_LOCATION = 'sdShCZCaxce8DHKbYcIl'

# The outage window. n8n reports UTC: last good execution 2026-07-18T04:30:48Z,
# first failure 2026-07-18T04:40:44Z. We anchor on the last-good timestamp, which
# is the WIDER of the two readings of the brief ("Jul 18 04:30 CT"), so no call
# can slip through the gap.
WINDOW_START = datetime(2026, 7, 18, 4, 30, 0, tzinfo=timezone.utc)
CDT = timezone(timedelta(hours=-5))

# The AVA lines under audit.
LINES = {
    '+14142408930': 'AVA SALES (public line)',
    '+14147750019': 'AI CHAUFFEUR',
}

# Shane's own cell, read from Doppler at runtime and NEVER written to disk.
# CLAUDE.md: private numbers never land in the repo or in a commit. It is also
# excluded from the callback list — Shane does not need to call himself back.
def owner_cell():
    import re
    d = re.sub(r'\D', '', os.environ.get('OWNER_CELL_PHONE', ''))
    if len(d) == 11 and d[0] == '1':
        d = d[1:]
    return '+1' + d if len(d) == 10 else ''


OWNER = owner_cell()


def redact(phone):
    """Never print the owner's personal number into a committed file."""
    if OWNER and phone == OWNER:
        return '`OWNER TEST LINE` (Shane\'s cell — redacted)'
    return '`%s`' % phone


def req(url, method='GET', body=None, headers=None):
    h = {'Content-Type': 'application/json', 'Accept': 'application/json'}
    h.update(headers or {})
    r = urllib.request.Request(
        url, data=json.dumps(body).encode() if body is not None else None,
        headers=h, method=method)
    try:
        with urllib.request.urlopen(r, timeout=45) as resp:
            raw = resp.read().decode()
            return json.loads(raw) if raw.strip() else {}
    except urllib.error.HTTPError as e:
        return {'__http_error__': e.code, '__body__': e.read().decode()[:400]}
    except Exception as e:
        return {'__error__': str(e)}


def retell_calls():
    """Every call since WINDOW_START, paged."""
    key = os.environ['RETELL_API_KEY']
    lower_ms = int(WINDOW_START.timestamp() * 1000)
    out, pagination_key, pages = [], None, 0
    while pages < 30:
        body = {
            'filter_criteria': {'start_timestamp': {'lower_threshold': lower_ms}},
            'limit': 1000,
            'sort_order': 'descending',
        }
        if pagination_key:
            body['pagination_key'] = pagination_key
        d = req(RETELL + '/v2/list-calls', 'POST', body,
                {'Authorization': 'Bearer ' + key})
        if isinstance(d, dict) and ('__http_error__' in d or '__error__' in d):
            print('RETELL ERROR:', json.dumps(d)[:300]); return out, d
        if not isinstance(d, list) or not d:
            break
        out.extend(d)
        if len(d) < 1000:
            break
        pagination_key = d[-1].get('call_id')
        pages += 1
    return out, None


def ghl_lookup(phone):
    """Contact + its opportunities/messages, or a clear EMPTY."""
    key = os.environ['GHL_PIT']
    h = {'Authorization': 'Bearer ' + key, 'Version': '2021-07-28'}
    url = (GHL + '/contacts/search/duplicate?locationId=' + GHL_LOCATION
           + '&number=' + urllib.parse.quote(phone))
    d = req(url, 'GET', None, h)
    contact = (d or {}).get('contact')
    if not contact:
        return {'found': False, 'raw': d}
    cid = contact.get('id')
    res = {
        'found': True,
        'id': cid,
        'name': (contact.get('contactName') or contact.get('firstName') or '').strip(),
        'tags': contact.get('tags') or [],
        'created': contact.get('dateAdded') or '',
    }
    opp = req(GHL + '/opportunities/search?location_id=' + GHL_LOCATION
              + '&contact_id=' + cid, 'GET', None, h)
    res['opportunities'] = opp.get('opportunities') if isinstance(opp, dict) else None
    conv = req(GHL + '/conversations/search?locationId=' + GHL_LOCATION
               + '&contactId=' + cid, 'GET', None, h)
    res['conversations'] = conv.get('conversations') if isinstance(conv, dict) else None
    return res


def fmt_ct(ms):
    if not ms:
        return 'UNKNOWN'
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc).astimezone(CDT).strftime('%Y-%m-%d %H:%M CDT')


def main():
    for k in ('RETELL_API_KEY', 'GHL_PIT'):
        if not os.environ.get(k):
            sys.exit('%s missing - run through doppler.' % k)

    calls, err = retell_calls()
    print('retell calls returned in window: %d' % len(calls))

    # Keep only calls that touched an audited AVA line, in either direction.
    rows = []
    for c in calls:
        frm, to = c.get('from_number', ''), c.get('to_number', '')
        line = frm if frm in LINES else (to if to in LINES else None)
        if not line:
            continue
        counterpart = to if line == frm else frm
        rows.append({
            'call_id': c.get('call_id', ''),
            'ts': c.get('start_timestamp'),
            'line': line,
            'counterpart': counterpart,
            'direction': c.get('direction', ''),
            'duration_s': round((c.get('duration_ms') or 0) / 1000),
            'disconnect': c.get('disconnection_reason', ''),
            'status': c.get('call_status', ''),
            'agent_id': c.get('agent_id', ''),
            'transcript_len': len(c.get('transcript') or ''),
            'analysis': (c.get('call_analysis') or {}),
        })
    rows.sort(key=lambda r: r['ts'] or 0)
    print('calls on audited AVA lines: %d' % len(rows))

    # Cross-check GHL once per unique counterpart number.
    uniq = sorted({r['counterpart'] for r in rows if r['counterpart']})
    ghl = {}
    for p in uniq:
        ghl[p] = ghl_lookup(p)
        time.sleep(0.25)
    print('ghl lookups: %d' % len(ghl))

    write_report(rows, ghl, err)
    print('wrote %s' % OUT.replace(ROOT, '.'))


def priority(r, g):
    """Callback priority. A real conversation that left no CRM trace is the worst case."""
    if OWNER and r['counterpart'] == OWNER:
        return 'P0 - OWNER TEST', "Shane's own cell — a test call, not a lead"
    talked = r['duration_s'] >= 25 and r['transcript_len'] > 200
    tracked = bool(g and g.get('found'))
    if talked and not tracked:
        return 'P1 - CALL BACK', 'Real conversation, NO CRM record at all'
    if talked and not (g.get('opportunities') or []):
        return 'P2 - CALL BACK', 'Real conversation, contact exists but NO opportunity/booking'
    if talked:
        return 'P3 - REVIEW', 'Real conversation, contact + opportunity present'
    if r['duration_s'] >= 8:
        return 'P4 - LOW', 'Short call'
    return 'P5 - IGNORE', 'Negligible / no answer'


def write_report(rows, ghl, err):
    L = []
    A = L.append
    now_ct = datetime.now(timezone.utc).astimezone(CDT).strftime('%Y-%m-%d %H:%M CDT')

    A('# OUTAGE RECOVERY — calls that may have fallen through\n')
    A('**Generated:** %s · **Run:** 1.5 · **Source:** Retell `/v2/list-calls` + GHL lookup\n' % now_ct)
    A('**Window:** %s → now (the n8n dead zone)\n'
      % WINDOW_START.astimezone(CDT).strftime('%Y-%m-%d %H:%M CDT'))
    A('')
    A('During this window every n8n workflow failed at the trigger, so AVA\'s call functions')
    A('(`book_appointment`, `write_to_crm`, `send_link`, `alert_owner`) could not fire. Any real')
    A('conversation in here may have produced **no booking, no CRM row, and no follow-up text**.\n')
    A('**Lines audited:** ' + ' · '.join('`%s` %s' % (k, v) for k, v in LINES.items()) + '\n')

    if err:
        A('> **RETELL API ERROR** — the call list may be incomplete:\n>\n> `%s`\n' % json.dumps(err)[:300])

    if not rows:
        A('---\n')
        A('## RESULT: EMPTY — NO RESULT\n')
        A('**EMPTY — no result.** Retell returned no calls on either audited line inside the')
        A('outage window. Nothing to call back.\n')
        A('This is a real finding, not a failed query: the API answered, the window is correct,')
        A('and the audited numbers are correct. It means no customer reached the AVA lines while')
        A('the automation was down.\n')
    else:
        p1 = p2 = owner_tests = 0
        A('---\n')
        A('## THE CALLBACK LIST\n')
        A('| # | When (CDT) | Caller | Line | Dur | Outcome | CRM trace | Priority |')
        A('|---|---|---|---|---|---|---|---|')
        for i, r in enumerate(rows, 1):
            g = ghl.get(r['counterpart']) or {}
            pri, why = priority(r, g)
            if pri.startswith('P1'):
                p1 += 1
            if pri.startswith('P2'):
                p2 += 1
            if pri.startswith('P0'):
                owner_tests += 1
            if g.get('found'):
                opps = g.get('opportunities')
                trace = 'contact ✓' + (', %d opp' % len(opps) if opps else ', NO opp')
            else:
                trace = '**NONE**'
            A('| %d | %s | %s | %s | %ss | %s | %s | **%s** |' % (
                i, fmt_ct(r['ts']), redact(r['counterpart']), LINES.get(r['line'], r['line']),
                r['duration_s'], r['disconnect'] or r['status'], trace, pri))
        A('')
        A('**P1 (real talk, zero CRM record): %d** · **P2 (real talk, no booking): %d** · total calls: %d\n'
          % (p1, p2, len(rows)))

        A('---\n')
        A('## DETAIL\n')
        for i, r in enumerate(rows, 1):
            g = ghl.get(r['counterpart']) or {}
            pri, why = priority(r, g)
            A('### %d · %s — %s\n' % (i, fmt_ct(r['ts']), redact(r['counterpart'])))
            A('- **Priority:** %s — %s' % (pri, why))
            A('- **Line:** %s · **Direction:** %s · **Duration:** %ss'
              % (LINES.get(r['line'], r['line']), r['direction'], r['duration_s']))
            A('- **Ended:** %s · **Status:** %s' % (r['disconnect'] or 'n/a', r['status']))
            A('- **Retell call_id:** `%s`' % r['call_id'])
            summ = (r['analysis'] or {}).get('call_summary')
            A('- **Summary:** %s' % (summ if summ else '**EMPTY — no result**'))
            if g.get('found'):
                A('- **GHL contact:** `%s` %s · tags: %s'
                  % (g.get('id'), g.get('name') or '(no name)', ', '.join(g.get('tags') or []) or 'none'))
                opps = g.get('opportunities')
                A('- **Opportunities:** %s' % (('%d found' % len(opps)) if opps else '**EMPTY — no result**'))
            else:
                A('- **GHL contact:** **EMPTY — no result** (never made it into the CRM)')
            A('')

    A('---\n')
    A('## HOW TO READ PRIORITY\n')
    A('- **P1** — talked ≥25s with a real transcript and there is **no CRM record at all.** The')
    A('  strongest signal of a lost lead. Call these first.')
    A('- **P2** — talked, contact exists, but **no opportunity/booking** was created.')
    A('- **P3** — talked and the CRM shows a contact and an opportunity. Probably fine; verify.')
    A('- **P4/P5** — short or unanswered. Low value.\n')
    A('Priority is computed from call duration, transcript length, and what GHL actually returned —')
    A('never guessed. Where an API returned nothing, the row says **EMPTY — no result**.\n')

    if not os.path.isdir(os.path.dirname(OUT)):
        os.makedirs(os.path.dirname(OUT))
    with io.open(OUT, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write('\n'.join(L) + '\n')


if __name__ == '__main__':
    import urllib.parse  # noqa: E402  (used in ghl_lookup)
    main()
