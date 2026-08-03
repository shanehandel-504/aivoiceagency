"""RUN 3 — quarantine rail battery for the AVA Post-Call / text-back path.

Posts synthetic Retell `call_analyzed` payloads at the live webhook and then reads the
n8n execution record to see which nodes ACTUALLY RAN. Asserting on the response body is
not enough — the webhook answers {"status":"ok"} either way; what matters is whether the
owner-alert and text-back nodes executed.

Caller numbers:
  +1555*      NANP-reserved fiction, cannot ring anyone
  +1999*      unassigned NANP area code, cannot ring anyone — stands in for a REAL
              unknown public caller so the "receipts still flow" case can be proven
              without risking a message to a live person.

  python automation/ani-commit/quarantine_battery.py
"""
import io, json, os, subprocess, sys, time, urllib.error, urllib.request

N8N = 'https://circulant.app.n8n.cloud'
HOOK = N8N + '/webhook/ava-postcall'
WID = '6r8YHuMEJbxeDyT5'
CHAUFFEUR = 'agent_8e9e7d477949c6babcbdcc756d'
AVA_DEMO = 'agent_d5ada9f774fe3ae7f034d2c677'

KEY = subprocess.check_output(['doppler', 'secrets', 'get', 'N8N_API_KEY', '--plain'],
                              shell=True, text=True).strip()
NH = {'X-N8N-API-KEY': KEY}

results = []


def check(name, ok, detail=''):
    results.append((name, ok, detail))
    print('  %s  %-56s %s' % ('PASS' if ok else 'FAIL', name, detail))


def napi(p):
    r = urllib.request.Request(N8N + p, headers=NH)
    with urllib.request.urlopen(r, timeout=60) as x:
        return json.loads(x.read().decode('utf-8'))


sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
_GHL = 'https://services.leadconnectorhq.com'
_UA = 'aivoiceagency-run3/1.0 (+https://aivoiceagency.ai; ops tooling)'
_PIT = subprocess.check_output(['doppler', 'secrets', 'get', 'GHL_PIT', '--plain'],
                               shell=True, text=True).strip()
_LOC = subprocess.check_output(['doppler', 'secrets', 'get', 'GHL_LOCATION_ID', '--plain'],
                               shell=True, text=True).strip()


def tagged_test(e164):
    """Read the contact GHL actually holds for this number and confirm the TEST tag.
    GHL lowercases tags on write, so 'TEST' is stored as 'test'."""
    url = '%s/contacts/search/duplicate?locationId=%s&number=%s' % (
        _GHL, _LOC, e164.replace('+', '%2B'))
    r = urllib.request.Request(url, headers={
        'Authorization': 'Bearer ' + _PIT, 'Version': '2021-07-28',
        'Accept': 'application/json', 'User-Agent': _UA})
    try:
        with urllib.request.urlopen(r, timeout=45) as x:
            c = (json.loads(x.read().decode('utf-8')) or {}).get('contact') or {}
        return 'test' in [str(t).lower() for t in (c.get('tags') or [])]
    except Exception:
        return False


def payload(from_number, first='Quarantine', phone=None, agent=AVA_DEMO, test_mode=None):
    cid = 'q_' + str(int(time.time() * 1000))[-9:] + '_' + from_number[-4:]
    b = {
        'event': 'call_analyzed',
        'call': {
            'call_id': cid, 'agent_id': agent,
            'from_number': from_number, 'to_number': '+14142408930',
            'start_timestamp': 1785780000000, 'end_timestamp': 1785780090000,
            'transcript': 'Agent: Thanks for calling.\nUser: Just testing.',
            'call_analysis': {
                'call_summary': 'RUN 3 quarantine battery synthetic call.',
                'user_sentiment': 'Neutral',
                'custom_analysis_data': {
                    'caller_first': first,
                    'caller_email': '',
                    'caller_phone': phone if phone is not None else from_number,
                    'business_name': 'Quarantine Probe Co',
                },
            },
        },
    }
    if test_mode is not None:
        b['test_mode'] = test_mode
    return cid, b


def fire(body):
    data = json.dumps(body).encode('utf-8')
    req = urllib.request.Request(HOOK, data=data, method='POST',
                                 headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            return r.status, r.read().decode('utf-8')[:200]
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')[:200]


def ran_nodes(call_id, tries=10):
    """Find the execution for this call_id and return the set of nodes that ran."""
    for _ in range(tries):
        lst = napi('/api/v1/executions?workflowId=%s&limit=12&includeData=false' % WID)
        for e in lst.get('data', []):
            d = napi('/api/v1/executions/%s?includeData=true' % e['id'])
            rd = (((d.get('data') or {}).get('resultData') or {}).get('runData')) or {}
            hook = rd.get('Retell Webhook')
            if not hook:
                continue
            try:
                got = hook[0]['data']['main'][0][0]['json']['body']['call']['call_id']
            except Exception:
                continue
            if got == call_id:
                q = rd.get('Quarantine Gate')
                qj = {}
                if q:
                    try:
                        qj = q[0]['data']['main'][0][0]['json']
                    except Exception:
                        pass
                return set(rd.keys()), qj, e['id']
        time.sleep(2)
    return None, None, None


CASES = [
    ('OUR OWN LINE  +14142408930', '+14142408930', None, True,  'caller is one of OUR_NUMBERS'),
    ('OUR OWN LINE  +14147750019', '+14147750019', None, True,  'caller is one of OUR_NUMBERS'),
    ('OUR SMS LINE  +13502205305', '+13502205305', None, True,  'caller is one of OUR_NUMBERS'),
    ('555 TEST      +15550100801', '+15550100801', None, True,  'NANP-reserved 555'),
    ('REAL DEMO CALLER +1999...',  '+19995550188', None, False, 'unknown public number'),
]

print('=' * 80)
print('RUN 3 QUARANTINE BATTERY  ·  AVA Post-Call / text-back path')
print('=' * 80)

for label, frm, tm, want_test, why in CASES:
    print('\n[%s]  expect is_test=%s  (%s)' % (label, want_test, why))
    cid, body = payload(frm, first='QProbe', test_mode=tm)
    st, resp = fire(body)
    print('   webhook HTTP %s %s' % (st, resp.strip()[:60]))
    ran, qj, eid = ran_nodes(cid)
    if ran is None:
        check('%s — execution located' % label, False, 'no execution found for %s' % cid)
        continue
    print('   execution %s · is_test=%s · %s' % (eid, qj.get('is_test'), qj.get('test_reason') or '-'))
    check('%s · is_test == %s' % (label, want_test), qj.get('is_test') is want_test,
          'got %r' % qj.get('is_test'))
    if want_test:
        check('%s · owner SMS suppressed' % label, 'Owner Alert SMS' not in ran)
        check('%s · owner email suppressed' % label, 'Owner Alert Email' not in ran)
        check('%s · text-back suppressed' % label, 'Text Back SMS' not in ran)
        # The rail SPEC is: a test call still writes to GHL, tagged TEST — it is not
        # dropped. Only OUR OWN lines additionally route to the zz-test contact (§ 9),
        # because those must never touch a lead record at all.
        if 'GHL Upsert Contact' in ran:
            check('%s · write is TEST-tagged in the CRM' % label,
                  tagged_test(frm), 'checked the contact GHL actually holds')
        else:
            check('%s · routed to zz-test, no lead written' % label,
                  'Test Contact' in ran)
    else:
        check('%s · owner alert branch ENTERED' % label, 'Owner Alert SMS' in ran,
              'receipts must still flow for a real caller')
        check('%s · lead upsert ran' % label, 'GHL Upsert Contact' in ran)

p = sum(1 for _, ok, _ in results if ok)
print('\n' + '=' * 80)
print('QUARANTINE RAIL: %d/%d PASS' % (p, len(results)))
for n, ok, d in results:
    if not ok:
        print('  FAILED: %s %s' % (n, d))
print('=' * 80)
sys.exit(0 if p == len(results) else 1)
