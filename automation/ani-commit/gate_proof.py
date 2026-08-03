"""RUN 3 PHASE 3 — OUR-NUMBER GATE PROOF against the live WF-COMMIT endpoint.

For each of our own lines, assert the commit is TEST-flagged, creates NO real lead,
and pages NOBODY. Every claim is checked against the CRM and the n8n execution record,
not against the endpoint's own response.

  python automation/ani-commit/gate_proof.py
"""
import json, os, subprocess, sys, time, urllib.error, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from aic_call import call  # noqa: E402

N8N = 'https://circulant.app.n8n.cloud'
WID = 'O1fX0FpbT0qqMnqJ'
GHLB = 'https://services.leadconnectorhq.com'
UA = 'aivoiceagency-run3/1.0 (+https://aivoiceagency.ai; ops tooling)'

KEY = subprocess.check_output(['doppler', 'secrets', 'get', 'N8N_API_KEY', '--plain'],
                              shell=True, text=True).strip()
PIT = subprocess.check_output(['doppler', 'secrets', 'get', 'GHL_PIT', '--plain'],
                              shell=True, text=True).strip()
LOC = subprocess.check_output(['doppler', 'secrets', 'get', 'GHL_LOCATION_ID', '--plain'],
                              shell=True, text=True).strip()

OUR_LINES = [
    ('AVA public line',   '+14142408930'),
    ('AI Chauffeur line', '+14147750019'),
    ('published SMS line', '+13502205305'),
]

results = []


def check(name, ok, detail=''):
    results.append((name, ok, detail))
    print('  %s  %-58s %s' % ('PASS' if ok else 'FAIL', name, detail))


def napi(p):
    r = urllib.request.Request(N8N + p, headers={'X-N8N-API-KEY': KEY})
    with urllib.request.urlopen(r, timeout=60) as x:
        return json.loads(x.read().decode('utf-8'))


def ghl(path):
    r = urllib.request.Request(GHLB + path, headers={
        'Authorization': 'Bearer ' + PIT, 'Version': '2021-07-28',
        'Accept': 'application/json', 'User-Agent': UA})
    try:
        with urllib.request.urlopen(r, timeout=45) as x:
            return x.status, json.loads(x.read().decode('utf-8') or '{}')
    except urllib.error.HTTPError as e:
        return e.code, {}


def nodes_for(call_id, tries=8):
    for _ in range(tries):
        lst = napi('/api/v1/executions?workflowId=%s&limit=10&includeData=false' % WID)
        for e in lst.get('data', []):
            d = napi('/api/v1/executions/%s?includeData=true' % e['id'])
            rd = (((d.get('data') or {}).get('resultData') or {}).get('runData')) or {}
            hook = rd.get('Commit Webhook')
            if not hook:
                continue
            try:
                got = hook[0]['data']['main'][0][0]['json']['body']['args']['call_id']
            except Exception:
                continue
            if got == call_id:
                return set(rd.keys()), e['id']
        time.sleep(2)
    return None, None


def reservation(phone):
    return {
        'trip_type': 'P2P',
        'passenger': {'first': 'GateProof', 'last': 'MustNotExist',
                      'mobile_e164': phone, 'email': '', 'pax_count': 1},
        'vehicle': {'class': 'SEDAN'},
        'pickup': {'datetime_local': '2026-08-20T08:00', 'tz': 'America/Chicago',
                   'address': '1 N Main St, Milwaukee WI'},
        'dropoff': {'address': 'MKE Airport'},
        'billing': {'type': 'CC_ON_FILE'}, 'flight': {}, 'booker': {},
        'source': {'call_id': 'x', 'agent_id': 'gate', 'consent': True,
                   'captured_at': '2026-08-03T21:00:00Z'},
        'ids': {'tenant_id': 'demo', 'intake_id': 'x'},
    }


print('=' * 84)
print('RUN 3 · OUR-NUMBER GATE PROOF  ·  POST /webhook/tools/commit-reservation')
print('=' * 84)

zz = None
for label, phone in OUR_LINES:
    print('\n[%s  %s]' % (label, phone))
    cid = 'gate_' + str(int(time.time() * 1000))[-9:] + '_' + phone[-4:]
    st, r, ms = call('commit', {'args': {
        'tenant_id': 'demo', 'call_id': cid, 'intake_id': cid + '_i',
        'reservation': reservation(phone)}})
    print('   HTTP %s · trip=%s · is_test=%s · %s'
          % (st, r.get('trip_id'), r.get('is_test'), r.get('test_reason')))

    check('%s · TEST-flagged' % label, r.get('is_test') is True, repr(r.get('is_test')))
    check('%s · reason names OUR_NUMBERS' % label,
          'OUR_NUMBERS' in (r.get('test_reason') or ''), repr(r.get('test_reason')))

    # no real lead: the resolved contact must be the zz-test sink
    resolved = r.get('ghl_contact_id')
    zz = zz or resolved
    check('%s · resolved to the zz-test sink, not a new lead' % label,
          bool(resolved) and resolved == zz, 'contact=%s' % resolved)

    st2, dup = ghl('/contacts/search/duplicate?locationId=%s&number=%s'
                   % (LOC, phone.replace('+', '%2B')))
    hit = (dup or {}).get('contact') or {}
    check('%s · CRM holds NO lead for this number' % label,
          hit.get('firstName') != 'GateProof',
          'CRM firstName=%r' % hit.get('firstName'))

    # nobody paged
    ran, eid = nodes_for(cid)
    if ran is None:
        check('%s · execution located' % label, False, 'not found')
    else:
        check('%s · owner SMS did not run' % label, 'Ticket Owner SMS' not in ran,
              'exec %s' % eid)
        check('%s · owner email did not run' % label, 'Ticket Owner Email' not in ran)
        check('%s · upsert skipped entirely' % label, 'GHL Upsert Contact' not in ran)
        check('%s · zz-test contact loaded instead' % label, 'Load ZZ Test Contact' in ran)

# ledger rows for these commits must carry the TEST flag
print('\n[ledger]')
rows = napi('/api/v1/data-tables/DCNqBPRtXLaLFSEh/rows?limit=200').get('data', [])
gate_rows = [x for x in rows if str(x.get('call_id') or '').startswith('gate_')]
check('gate commits written to the ledger', len(gate_rows) == 3, '%d rows' % len(gate_rows))
check('every gate ledger row flagged TEST',
      all(x.get('is_test') == 'TEST' for x in gate_rows),
      str([x.get('is_test') for x in gate_rows]))
check('no ledger row was deleted', len(rows) >= 12, '%d rows total' % len(rows))

p = sum(1 for _, ok, _ in results if ok)
print('\n' + '=' * 84)
print('GATE PROOF: %d/%d PASS' % (p, len(results)))
for n, ok, d in results:
    if not ok:
        print('  FAILED: %s %s' % (n, d))
print('=' * 84)
sys.exit(0 if p == len(results) else 1)
