"""WF-ANI signed test battery. Runs against the live endpoint.

Seeds one probe contact carrying trip data (NANP-reserved 555-01xx, cannot ring anyone),
exercises known / unknown / auth / budget, then deletes the probe.

  python automation/ani-commit/ani_battery.py
"""
import io, json, os, subprocess, sys, time, urllib.error, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from aic_call import call  # noqa: E402

GHL = 'https://services.leadconnectorhq.com'
UA = 'aivoiceagency-run2/1.0 (+https://aivoiceagency.ai; ops tooling)'


def dop(n):
    return subprocess.check_output(['doppler', 'secrets', 'get', n, '--plain'],
                                   shell=True, text=True).strip()


PIT, LOC = dop('GHL_PIT'), dop('GHL_LOCATION_ID')
GH = {'Authorization': 'Bearer ' + PIT, 'Version': '2021-07-28',
      'Accept': 'application/json', 'User-Agent': UA}


def ghl(path, method='GET', body=None):
    h = dict(GH)
    data = None
    if body is not None:
        data = json.dumps(body).encode('utf-8')
        h['Content-Type'] = 'application/json'
    r = urllib.request.Request(GHL + path, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(r, timeout=45) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8') or '{}')
    except urllib.error.HTTPError as e:
        return e.code, {'raw': e.read().decode('utf-8')[:300]}


PROBE_PHONE = '+15550100812'
F = {'trip_type': 'qta1B3kERujMTLNDlj66', 'pickup_dt': 'HOfBlSbheMOtChBuK0vU',
     'pickup_addr': 'L9FS4ZqII0OvQe5KESh7', 'billing': 'Z36xyFEoF9brVdNeKAIP'}

results = []


def check(name, ok, detail=''):
    results.append((name, ok, detail))
    print('  %s  %-52s %s' % ('PASS' if ok else 'FAIL', name, detail))


print('=' * 78)
print('WF-ANI BATTERY  ·  https://circulant.app.n8n.cloud/webhook/tools/ani-lookup')
print('=' * 78)

print('\n[seed] probe contact with trip history')
st, up = ghl('/contacts/upsert', 'POST', {
    'locationId': LOC, 'firstName': 'Marcus', 'lastName': 'Reed', 'phone': PROBE_PHONE,
    'companyName': 'Northshore Capital', 'source': 'RUN2 ANI battery',
    'tags': ['zz-internal', 'run2-probe'],
    'customFields': [
        {'id': F['trip_type'], 'value': 'AIRPORT_ARR'},
        {'id': F['pickup_dt'], 'value': '2026-07-28 06:15'},
        {'id': F['pickup_addr'], 'value': '875 E Wisconsin Ave, Milwaukee WI'},
        {'id': F['billing'], 'value': 'DIRECT_BILL'}]})
probe_id = ((up.get('contact') or {}).get('id')) if st in (200, 201) else None
print('       HTTP %s  id=%s' % (st, probe_id))
time.sleep(1.5)

try:
    print('\n[1] KNOWN caller — corporate, with trip history')
    st, r, ms = call('ani', {'args': {'phone_e164': PROBE_PHONE, 'tenant_id': 'demo',
                                      'call_id': 'ani_known_1'}})
    print(json.dumps(r, indent=2))
    check('1.1 HTTP 200', st == 200, 'got %s' % st)
    check('1.2 known_caller true', r.get('known_caller') is True)
    check('1.3 first_name = Marcus', r.get('first_name') == 'Marcus', repr(r.get('first_name')))
    check('1.4 company_name = Northshore Capital',
          r.get('company_name') == 'Northshore Capital', repr(r.get('company_name')))
    check('1.5 account_type = corporate', r.get('account_type') == 'corporate',
          repr(r.get('account_type')))
    check('1.6 last_trip populated', isinstance(r.get('last_trip'), dict))
    lt = r.get('last_trip') or {}
    check('1.7 last_trip.pickup_datetime correct',
          lt.get('pickup_datetime') == '2026-07-28 06:15', repr(lt.get('pickup_datetime')))
    check('1.8 rate_plan = DIRECT_BILL', r.get('rate_plan') == 'DIRECT_BILL',
          repr(r.get('rate_plan')))
    check('1.9 ghl_contact_id echoed', r.get('ghl_contact_id') == probe_id)
    check('1.10 data_verified true', r.get('data_verified') is True)
    check('1.11 server-side inside 400ms budget', (r.get('lookup_ms') or 9999) < 400,
          'server=%dms wall=%.0fms' % (r.get('lookup_ms') or -1, ms))

    print('\n[2] UNKNOWN caller')
    st, r2, ms2 = call('ani', {'args': {'phone_e164': '+15550100999', 'tenant_id': 'demo',
                                        'call_id': 'ani_unknown_1'}})
    print(json.dumps(r2, indent=2))
    check('2.1 HTTP 200', st == 200, 'got %s' % st)
    check('2.2 known_caller false', r2.get('known_caller') is False)
    check('2.3 all identity fields null',
          all(r2.get(k) is None for k in
              ('first_name', 'company_name', 'account_type', 'last_trip',
               'rate_plan', 'ghl_contact_id')))
    check('2.4 data_verified true (miss is a verified answer)', r2.get('data_verified') is True)
    check('2.5 reason names NO_MATCH', 'NO_MATCH' in (r2.get('reason') or ''),
          repr(r2.get('reason')))
    check('2.6 server-side inside 400ms budget', (r2.get('lookup_ms') or 9999) < 400,
          'server=%dms wall=%.0fms' % (r2.get('lookup_ms') or -1, ms2))

    print('\n[3] AUTH')
    st, r3, _ = call('ani', {'args': {'phone_e164': PROBE_PHONE}}, mode='none')
    check('3.1 no auth header -> 401', st == 401, 'got %s' % st)
    check('3.2 401 body leaks no identity', r3.get('known_caller') is False
          and r3.get('ghl_contact_id') is None)
    st, _, _ = call('ani', {'args': {'phone_e164': PROBE_PHONE}}, bad_sig=True)
    check('3.3 bad HMAC -> 401', st == 401, 'got %s' % st)
    st, _, _ = call('ani', {'args': {'phone_e164': PROBE_PHONE}}, mode='shared')
    check('3.4 shared-secret header accepted', st == 200, 'got %s' % st)

    print('\n[4] EDGE — no ANI on the call')
    st, r4, _ = call('ani', {'args': {'phone_e164': '', 'call_id': 'ani_noani'}})
    check('4.1 HTTP 200 (agent always gets something speakable)', st == 200, 'got %s' % st)
    check('4.2 known_caller false', r4.get('known_caller') is False)
    check('4.3 data_verified false', r4.get('data_verified') is False)
    check('4.4 reason names NO_ANI', 'NO_ANI' in (r4.get('reason') or ''), repr(r4.get('reason')))

    print('\n[5] LATENCY — 6 consecutive known-caller lookups')
    # The 400ms budget is an ENDPOINT budget: webhook in -> response out, inside n8n.
    # Wall-clock from this laptop also carries the residential round trip to n8n cloud,
    # which Retell (cloud-hosted) does not pay. The 401 path does zero GHL work, so it
    # measures that transport baseline directly and is subtracted for the honest number.
    base = []
    for i in range(3):
        _, _, m = call('ani', {'args': {'phone_e164': PROBE_PHONE}}, mode='none')
        base.append(m)
    rtt = sorted(base)[len(base) // 2]
    print('      transport baseline (401 path, no CRM call): %.0fms median' % rtt)

    srv, wall = [], []
    for i in range(6):
        _, rr, m = call('ani', {'args': {'phone_e164': PROBE_PHONE, 'call_id': 'lat_%d' % i}})
        srv.append(rr.get('lookup_ms') or 9999)
        wall.append(m)
    p50 = sorted(srv)[len(srv) // 2]
    worst = sorted(srv)[-1]
    print('      server ms: %s' % ' '.join(str(x) for x in srv))
    print('      wall   ms: %s' % ' '.join('%.0f' % x for x in wall))
    check('5.1 server-side median < 400ms', p50 < 400, 'p50=%dms' % p50)
    check('5.2 server-side worst case < 400ms', worst < 400, 'max=%dms' % worst)

finally:
    if probe_id:
        st, _ = ghl('/contacts/%s' % probe_id, 'DELETE')
        print('\n[cleanup] probe contact deleted  HTTP %s' % st)

p = sum(1 for _, ok, _ in results if ok)
print('\n' + '=' * 78)
print('WF-ANI: %d/%d PASS' % (p, len(results)))
for n, ok, d in results:
    if not ok:
        print('  FAILED: %s %s' % (n, d))
print('=' * 78)
sys.exit(0 if p == len(results) else 1)
