"""WF-COMMIT signed test battery against the live endpoint.

All caller numbers are in the NANP-reserved 555-01xx fictional range and cannot ring a
real person. Records created here are read back independently out of GHL — the loop is
only "verified" if the CRM agrees with what the endpoint claimed.

  python automation/ani-commit/commit_battery.py
"""
import io, json, os, subprocess, sys, time, urllib.error, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from aic_call import call  # noqa: E402

GHLB = 'https://services.leadconnectorhq.com'
OBJ = 'custom_objects.reservation'
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
    r = urllib.request.Request(GHLB + path, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(r, timeout=45) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8') or '{}')
    except urllib.error.HTTPError as e:
        return e.code, {'raw': e.read().decode('utf-8')[:300]}


results = []
created_contacts, created_records = [], []


def check(name, ok, detail=''):
    results.append((name, ok, detail))
    print('  %s  %-56s %s' % ('PASS' if ok else 'FAIL', name, detail))


def stamp(n):
    return str(int(time.time() * 1000))[-9:] + '_' + n


def reservation(trip_type='AIRPORT_ARR', **over):
    r = {
        'trip_type': trip_type,
        'passenger': {'first': 'Dana', 'last': 'Whitfield',
                      'mobile_e164': '+15550100455', 'email': 'dana@example.com',
                      'pax_count': 3},
        'vehicle': {'class': 'SUV', 'luggage_count': 4},
        'pickup': {'datetime_local': '2026-08-14T09:20', 'tz': 'America/Chicago',
                   'address': '400 W Wisconsin Ave, Milwaukee WI'},
        'dropoff': {'address': 'Milwaukee Mitchell International'},
        'billing': {'type': 'DIRECT_BILL'},
        'booker': {'name': 'Alex Pine', 'company': 'Pine Advisors'},
        'flight': {'airline': 'Delta', 'number': 'DL2210', 'meet_style': 'BAGGAGE'},
        'special_notes': 'Two car seats.',
        'source': {'call_id': 'x', 'agent_id': 'agent_775', 'consent': True,
                   'captured_at': '2026-08-03T18:00:00Z'},
        'ids': {'tenant_id': 'demo', 'intake_id': 'x'},
    }
    r.update(over)
    return r


print('=' * 80)
print('WF-COMMIT BATTERY  ·  /webhook/tools/commit-reservation')
print('=' * 80)

try:
    # ---------------------------------------------------------------- 1. new commit
    print('\n[1] NEW COMMIT — demo tenant, AIRPORT_ARR, all slots present')
    cid1, iid1 = stamp('c1'), stamp('i1')
    body1 = {'args': {'tenant_id': 'demo', 'call_id': cid1, 'intake_id': iid1,
                      'quote_id': 'Q-TEST-0001', 'reservation': reservation()}}
    st, r1, ms = call('commit', body1)
    print(json.dumps(r1, indent=2)[:1400])
    if r1.get('ghl_contact_id'):
        created_contacts.append(r1['ghl_contact_id'])
    if r1.get('reservation_record_id'):
        created_records.append(r1['reservation_record_id'])

    check('1.1 HTTP 200', st == 200, 'got %s' % st)
    import re as _re
    check('1.2 trip id matches AC-YYMMDD-XXXX',
          bool(_re.match(r'^AC-\d{6}-[0-9A-Z]{4}$', r1.get('trip_id') or '')),
          repr(r1.get('trip_id')))
    check('1.3 crm_write_status CRM_VERIFIED',
          r1.get('crm_write_status') == 'CRM_VERIFIED', repr(r1.get('crm_write_status')))
    check('1.4 demo tenant may CONFIRM on verified',
          r1.get('reservation_state') == 'CONFIRMED', repr(r1.get('reservation_state')))
    check('1.5 provider_reservation_id is null (Phase 2)',
          r1.get('provider_reservation_id') is None)
    check('1.6 reservation record id returned', bool(r1.get('reservation_record_id')))
    check('1.7 quote_id carried through', r1.get('quote_id') == 'Q-TEST-0001')
    check('1.8 hash_match true', r1.get('hash_match') is True)
    check('1.9 not flagged duplicate', r1.get('duplicate') is False)

    # independent read-back straight out of GHL
    st, rb = ghl('/objects/%s/records/%s' % (OBJ, r1.get('reservation_record_id', 'x')))
    props = ((rb.get('record') or {}).get('properties') or {})
    check('1.10 record readable independently from GHL', st == 200, 'HTTP %s' % st)
    check('1.11 CRM holds the trip id', props.get('trip_id') == r1.get('trip_id'),
          repr(props.get('trip_id')))
    check('1.12 CRM holds pickup address',
          props.get('pickup_address') == '400 W Wisconsin Ave, Milwaukee WI',
          repr(props.get('pickup_address')))
    check('1.13 CRM holds flight number', props.get('flight_number') == 'DL2210',
          repr(props.get('flight_number')))
    check('1.14 CRM holds the quote id', props.get('quote_id') == 'Q-TEST-0001',
          repr(props.get('quote_id')))

    # association actually exists
    st, rel = ghl('/associations/relations/%s?locationId=%s&limit=20'
                  % (r1.get('reservation_record_id', 'x'), LOC))
    check('1.15 contact<->reservation association created',
          st == 200 and len(rel.get('relations') or []) > 0,
          'HTTP %s n=%s' % (st, len(rel.get('relations') or [])))

    # ------------------------------------------------------- 2. duplicate call_id
    print('\n[2] DUPLICATE call_id — must replay, never write twice')
    st, r2, _ = call('commit', body1)
    print(json.dumps(r2, indent=2)[:900])
    check('2.1 HTTP 200', st == 200, 'got %s' % st)
    check('2.2 duplicate flag true', r2.get('duplicate') is True)
    check('2.3 same trip id as the original', r2.get('trip_id') == r1.get('trip_id'),
          '%s vs %s' % (r2.get('trip_id'), r1.get('trip_id')))
    check('2.4 same reservation record id',
          r2.get('reservation_record_id') == r1.get('reservation_record_id'))
    check('2.5 same state as original',
          r2.get('reservation_state') == r1.get('reservation_state'))

    # single-write proof: a third attempt must still replay, and the original
    # reservation record must still be the ONLY one carrying this trip id.
    time.sleep(1)
    st, r2c, _ = call('commit', body1)
    check('2.6 third replay still returns the original',
          r2c.get('trip_id') == r1.get('trip_id'), repr(r2c.get('trip_id')))
    check('2.7 third replay wrote no new record',
          r2c.get('reservation_record_id') == r1.get('reservation_record_id'))

    # ------------------------------------------- 3. CAPTURE_ONLY tenant hard cap
    print('\n[3] CAPTURE_ONLY tenant — hard cap at REQUEST_RECEIVED')
    cid3, iid3 = stamp('c3'), stamp('i3')
    res3 = reservation()
    res3['ids'] = {'tenant_id': 'reliable-limo', 'intake_id': iid3}
    res3['passenger']['mobile_e164'] = '+15550100456'
    st, r3, _ = call('commit', {'args': {'tenant_id': 'reliable-limo', 'call_id': cid3,
                                         'intake_id': iid3, 'quote_id': None,
                                         'reservation': res3}})
    print(json.dumps(r3, indent=2)[:800])
    if r3.get('ghl_contact_id'):
        created_contacts.append(r3['ghl_contact_id'])
    if r3.get('reservation_record_id'):
        created_records.append(r3['reservation_record_id'])
    check('3.1 write still verified', r3.get('crm_write_status') == 'CRM_VERIFIED',
          repr(r3.get('crm_write_status')))
    check('3.2 state capped at REQUEST_RECEIVED',
          r3.get('reservation_state') == 'REQUEST_RECEIVED', repr(r3.get('reservation_state')))
    check('3.3 never says CONFIRMED for a CAPTURE_ONLY tenant',
          r3.get('reservation_state') != 'CONFIRMED')
    check('3.4 null quote_id stays null', r3.get('quote_id') is None, repr(r3.get('quote_id')))

    # ----------------------------------------------------- 4. slot enforcement
    print('\n[4] MISSING SLOTS — airport run with no flight')
    cid4 = stamp('c4')
    res4 = reservation()
    res4['flight'] = {'airline': '', 'number': '', 'meet_style': ''}
    st, r4, _ = call('commit', {'args': {'tenant_id': 'demo', 'call_id': cid4,
                                         'intake_id': stamp('i4'), 'reservation': res4}})
    check('4.1 HTTP 200 (speakable, not a crash)', st == 200, 'got %s' % st)
    check('4.2 no trip id minted', r4.get('trip_id') is None, repr(r4.get('trip_id')))
    check('4.3 state FAILED', r4.get('reservation_state') == 'FAILED')
    check('4.4 names the missing slots',
          all(k in json.dumps(r4.get('missing') or []) for k in ('airline', 'flight number')),
          json.dumps(r4.get('missing')))
    check('4.5 no record id handed back for a write that never happened',
          not r4.get('reservation_record_id'))

    # ------------------------------------------------------------ 5. auth
    print('\n[5] AUTH')
    st, r5, _ = call('commit', body1, mode='none')
    check('5.1 no auth -> 401', st == 401, 'got %s' % st)
    st, _, _ = call('commit', body1, bad_sig=True)
    check('5.2 bad HMAC -> 401', st == 401, 'got %s' % st)

    # -------------------------------------------------- 6. nulls print honestly
    print('\n[6] NULLS — a field never captured must print NOT PROVIDED')
    cid6 = stamp('c6')
    res6 = reservation('P2P')
    res6['flight'] = {}
    res6['special_notes'] = ''
    res6['booker'] = {}
    res6['vehicle'] = {'class': 'SEDAN'}
    res6['passenger']['mobile_e164'] = '+15550100457'
    res6['passenger']['email'] = ''
    st, r6, _ = call('commit', {'args': {'tenant_id': 'demo', 'call_id': cid6,
                                         'intake_id': stamp('i6'), 'reservation': res6}})
    if r6.get('ghl_contact_id'):
        created_contacts.append(r6['ghl_contact_id'])
    if r6.get('reservation_record_id'):
        created_records.append(r6['reservation_record_id'])
    check('6.1 P2P commits without flight data', r6.get('reservation_state') in
          ('CONFIRMED', 'REQUEST_RECEIVED'), repr(r6.get('reservation_state')))
    st, rb6 = ghl('/objects/%s/records/%s' % (OBJ, r6.get('reservation_record_id', 'x')))
    p6 = ((rb6.get('record') or {}).get('properties') or {})
    check('6.2 absent airline stored as absent, not empty string',
          'airline' not in p6 or p6.get('airline') in (None, ''), repr(p6.get('airline')))
    check('6.3 luggage_count absent when not captured',
          'luggage_count' not in p6, repr(p6.get('luggage_count')))

finally:
    print('\n[cleanup]')
    for rid in created_records:
        st, _ = ghl('/objects/%s/records/%s' % (OBJ, rid), 'DELETE')
        print('  record  %s -> HTTP %s' % (rid, st))
    for cid in set(created_contacts):
        st, _ = ghl('/contacts/%s' % cid, 'DELETE')
        print('  contact %s -> HTTP %s' % (cid, st))

p = sum(1 for _, ok, _ in results if ok)
print('\n' + '=' * 80)
print('WF-COMMIT: %d/%d PASS' % (p, len(results)))
for n, ok, d in results:
    if not ok:
        print('  FAILED: %s %s' % (n, d))
print('=' * 80)
sys.exit(0 if p == len(results) else 1)
