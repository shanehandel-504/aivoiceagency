"""RUN 3 — quarantine sweep. Idempotent and safe to re-run.

Finds test-created CRM data and QUARANTINES it: contacts tagged TEST, reservation
records flagged is_test, ledger rows reported. Nothing is hard-deleted — the ledger is
the idempotency spine and its rows are what stop an old call_id writing a second
reservation.

  python automation/ani-commit/quarantine_sweep.py            # report only
  python automation/ani-commit/quarantine_sweep.py --apply    # tag + flag
"""
import json, os, subprocess, sys, urllib.error, urllib.request

APPLY = '--apply' in sys.argv
GHLB = 'https://services.leadconnectorhq.com'
OBJ = 'custom_objects.reservation'
LEDGER = 'DCNqBPRtXLaLFSEh'
UA = 'aivoiceagency-run3/1.0 (+https://aivoiceagency.ai; ops tooling)'

PIT = subprocess.check_output(['doppler', 'secrets', 'get', 'GHL_PIT', '--plain'],
                              shell=True, text=True).strip()
LOC = subprocess.check_output(['doppler', 'secrets', 'get', 'GHL_LOCATION_ID', '--plain'],
                              shell=True, text=True).strip()
NKEY = subprocess.check_output(['doppler', 'secrets', 'get', 'N8N_API_KEY', '--plain'],
                               shell=True, text=True).strip()

TEST_NAMES = ['dana whitfield', 'should notexist', 'smoke test', 'qprobe', 'aniprobe',
              'marcus reed', 'fmt probe', 'anom probe', 'gateproof', 'mustnotexist']
OUR = ['4142408930', '4147750019', '3502205305', '4144095008', '4142508042']


def ghl(path, method='GET', body=None):
    h = {'Authorization': 'Bearer ' + PIT, 'Version': '2021-07-28',
         'Accept': 'application/json', 'User-Agent': UA}
    data = None
    if body is not None:
        data = json.dumps(body).encode('utf-8')
        h['Content-Type'] = 'application/json'
    r = urllib.request.Request(GHLB + path, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(r, timeout=45) as x:
            return x.status, json.loads(x.read().decode('utf-8') or '{}')
    except urllib.error.HTTPError as e:
        return e.code, {}


def d10(v):
    return ''.join(c for c in str(v or '') if c.isdigit())[-10:]


print('=' * 78)
print('RUN 3 QUARANTINE SWEEP  ·  %s' % ('APPLY' if APPLY else 'REPORT ONLY'))
print('=' * 78)

# ---------------------------------------------------------------- contacts
flagged, scanned, page = [], 0, 1
while page <= 12:
    st, r = ghl('/contacts/search', 'POST', {'locationId': LOC, 'pageLimit': 100,
                                             'page': page})
    rows = (r or {}).get('contacts') or []
    if not rows:
        break
    for c in rows:
        scanned += 1
        nm = ((c.get('firstName') or '') + ' ' + (c.get('lastName') or '')).strip().lower()
        ph = d10(c.get('phone'))
        why = None
        if ph[:3] == '555':
            why = '555 number'
        elif any(t in nm for t in TEST_NAMES):
            why = 'test name'
        elif ph and ph in OUR:
            why = 'our own number'
        if why:
            flagged.append((c, why))
    page += 1

tagged_now = already = 0
print('\nCONTACTS')
for c, why in flagged:
    tags = [str(t).lower() for t in (c.get('tags') or [])]
    if 'test' in tags:
        already += 1
        continue
    if APPLY:
        ghl('/contacts/%s/tags' % c['id'], 'POST',
            {'tags': ['TEST', 'zz-internal', 'do-not-drip']})
        tagged_now += 1
    print('  %-24s %-20s %-14s %s' % (c['id'], (c.get('firstName') or '')[:18],
                                      c.get('phone'), why))

# ---------------------------------------------------------------- ledger
# The rows endpoint caps at limit=250 and exposes no skip/offset, so this sweep
# cannot page past 250 rows. Say so out loud rather than silently under-reporting.
LEDGER_CAP = 250
r = urllib.request.Request(
    'https://circulant.app.n8n.cloud/api/v1/data-tables/%s/rows?limit=%d' % (LEDGER, LEDGER_CAP),
    headers={'X-N8N-API-KEY': NKEY})
rows = json.loads(urllib.request.urlopen(r, timeout=45).read().decode()).get('data', [])
led_flagged = sum(1 for x in rows if x.get('is_test') == 'TEST')
if len(rows) >= LEDGER_CAP:
    print('\n  !! ledger returned %d rows = the API cap; there may be MORE that this '
          'sweep did not see (no skip/offset parameter exists).' % len(rows))

# ---------------------------------------------------------------- records
alive = rec_flagged = gone = 0
for x in rows:
    rid = x.get('record_id')
    if not rid:
        continue
    st, g = ghl('/objects/%s/records/%s' % (OBJ, rid))
    if st != 200 or not ((g.get('record') or {}).get('id')):
        gone += 1
        continue
    alive += 1
    props = (g.get('record') or {}).get('properties') or {}
    if str(props.get('is_test') or '') == 'TEST':
        rec_flagged += 1
        continue
    if APPLY:
        # locationId must be a QUERY param on PUT — in the body it 422s, omitted it 404s.
        st2, _ = ghl('/objects/%s/records/%s?locationId=%s' % (OBJ, rid, LOC), 'PUT',
                     {'properties': {'is_test': 'TEST'}})
        if st2 in (200, 201):
            rec_flagged += 1

# ---------------------------------------------------------------- pipeline
st, o = ghl('/opportunities/search?location_id=%s&limit=100' % LOC)
ops = (o or {}).get('opportunities') or []
ids = {c['id'] for c, _ in flagged}
hits = [x for x in ops if ((x.get('contact') or {}).get('id') in ids)
        or (x.get('contactId') in ids)]

print('\n===== COUNTS =====')
print('  contacts scanned                      : %d' % scanned)
print('  contacts identified as test           : %d' % len(flagged))
print('  contacts newly tagged TEST            : %d' % tagged_now)
print('  contacts already tagged TEST          : %d' % already)
print('  ledger rows total                     : %d' % len(rows))
print('  ledger rows flagged TEST (0 deleted)  : %d' % led_flagged)
print('  reservation records still present     : %d' % alive)
print('  reservation records flagged is_test   : %d' % rec_flagged)
print('  reservation records already torn down : %d' % gone)
print('  opportunities in location             : %d' % len(ops))
print('  TEST contacts in a real pipeline      : %d' % len(hits))
if hits:
    for h in hits:
        print('    !! opp %s %r' % (h.get('id'), h.get('name')))
if not APPLY:
    print('\n(report only — re-run with --apply to tag and flag)')
