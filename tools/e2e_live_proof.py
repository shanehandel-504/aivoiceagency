#!/usr/bin/env python3
# =============================================================================
# tools/e2e_live_proof.py  ·  RUN 1.5
# -----------------------------------------------------------------------------
# One full live loop against the owner's own cell, with per-hop latency:
#
#   form POST -> TEXT 1 (READY gate) -> READY reply -> outbound call from a pool
#   number with dynamic variables -> post-call TEXT 2 / TEXT 3
#
# The target number is read from Doppler (OWNER_CELL_PHONE) at runtime and is
# NEVER printed or written to disk — CLAUDE.md keeps private numbers out of the
# repo and out of commits.
#
# The READY hop: we first WAIT for a genuine inbound reply (which would prove the
# GHL -> n8n webhook is wired). If none arrives inside READY_WAIT_S we synthesize
# the webhook call ourselves and record the GHL leg as UNVERIFIED — never as
# passing.
#
# USAGE:
#   doppler run --project ava-prod --config prd -- python tools/e2e_live_proof.py
# =============================================================================

import io
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'reports', '2026-07-22-run15-e2e-proof.md')

N8N = 'https://circulant.app.n8n.cloud'
WF = 'V6wAFgJ803xmLM0K'
RETELL = 'https://api.retellai.com'
CDT = timezone(timedelta(hours=-5))

READY_WAIT_S = 180      # how long to wait for a real READY reply
CALL_WAIT_S = 300       # how long to wait for the call to finish

LOG = []


def hop(name, t0, detail, ok=True):
    dt = time.time() - t0
    LOG.append({'hop': name, 'seconds': round(dt, 2), 'ok': ok, 'detail': detail})
    print('  [%6.2fs] %-34s %s%s' % (dt, name, '' if ok else 'FAIL ', detail))
    return dt


def api(url, method='GET', body=None, headers=None, timeout=45):
    h = {'Content-Type': 'application/json', 'Accept': 'application/json'}
    h.update(headers or {})
    r = urllib.request.Request(
        url, data=json.dumps(body).encode() if body is not None else None,
        headers=h, method=method)
    try:
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            raw = resp.read().decode()
            return json.loads(raw) if raw.strip() else {}
    except urllib.error.HTTPError as e:
        return {'__http__': e.code, '__body__': e.read().decode()[:300]}
    except Exception as e:
        return {'__err__': str(e)}


def n8n(path):
    return api(N8N + path, headers={'X-N8N-API-KEY': os.environ['N8N_API_KEY']})


def executions(limit=12):
    d = n8n('/api/v1/executions?workflowId=%s&limit=%d&includeData=true' % (WF, limit))
    return d.get('data', []) if isinstance(d, dict) else []


def nodes_of(e):
    return (e.get('data', {}).get('resultData', {}).get('runData') or {})


def first_json(e, node):
    try:
        return nodes_of(e)[node][0]['data']['main'][0][0]['json']
    except Exception:
        return {}


def owner():
    d = re.sub(r'\D', '', os.environ.get('OWNER_CELL_PHONE', ''))
    if len(d) == 11 and d[0] == '1':
        d = d[1:]
    return '+1' + d if len(d) == 10 else ''


def main():
    for k in ('N8N_API_KEY', 'RETELL_API_KEY', 'OWNER_CELL_PHONE'):
        if not os.environ.get(k):
            sys.exit('%s missing - run through doppler.' % k)

    target = owner()
    if not target:
        sys.exit('OWNER_CELL_PHONE is not a usable 10-digit US number.')
    masked = target[:5] + '***' + target[-2:]
    print('E2E target (masked): %s\n' % masked)

    started = datetime.now(timezone.utc)
    baseline = {e['id'] for e in executions(20)}

    # ---------------------------------------------------- HOP 1 · form POST
    t0 = time.time()
    resp = api(N8N + '/webhook/live-intake', 'POST', {
        'first_name': 'Shane',
        'phone': target,
        'website_url': 'aivoiceagency.ai',
        'has_website': True,
        'consent': True,
        'consent_text': 'E2E proof run 1.5',
        'source': 'live_page_e2e',
    })
    ok1 = resp.get('ok') is True
    hop('1 · form POST -> webhook', t0, json.dumps(resp)[:120], ok1)
    if not ok1:
        return finish(started, masked, 'form POST rejected')

    # ---------------------------------------------- HOP 2 · TEXT 1 dispatch
    t0 = time.time()
    intake = None
    for _ in range(20):
        for e in executions(12):
            if e['id'] in baseline:
                continue
            n = nodes_of(e)
            if 'SMS: READY Gate (TEXT 1)' in n:
                intake = e
                break
        if intake:
            break
        time.sleep(3)

    if not intake:
        hop('2 · TEXT 1 (READY gate) sent', t0, 'EMPTY - no result: no intake execution found', False)
        return finish(started, masked, 'TEXT 1 never dispatched')

    sms1 = first_json(intake, 'SMS: READY Gate (TEXT 1)')
    bv = first_json(intake, 'Build Variables')
    mid = sms1.get('messageId')
    hop('2 · TEXT 1 (READY gate) sent', t0,
        'GHL messageId=%s | scraped: %s / %s / %s' % (
            mid, bv.get('company_name'), bv.get('service_1'), bv.get('city')),
        bool(mid))
    baseline.add(intake['id'])

    # -------------------------------------- HOP 3 · READY reply (real or sim)
    print('\n  waiting up to %ds for a GENUINE "READY" reply (proves GHL -> n8n)...' % READY_WAIT_S)
    t0 = time.time()
    ready_exec, ghl_wired = None, False
    deadline = time.time() + READY_WAIT_S
    while time.time() < deadline:
        for e in executions(12):
            if e['id'] in baseline:
                continue
            if 'Parse Inbound SMS' in nodes_of(e):
                ready_exec, ghl_wired = e, True
                break
        if ready_exec:
            break
        time.sleep(6)

    if ready_exec:
        hop('3 · READY reply (via GHL)', t0, 'GENUINE inbound reply - GHL webhook IS wired', True)
    else:
        hop('3 · READY reply (via GHL)', t0,
            'no inbound in %ds - GHL -> n8n leg UNVERIFIED; synthesizing the webhook' % READY_WAIT_S,
            False)
        t0 = time.time()
        r = api(N8N + '/webhook/live-ready', 'POST',
                {'phone': target, 'message': {'body': 'READY'}})
        hop('3b · READY (synthesized)', t0, json.dumps(r)[:120], r.get('ok') is True)
        for _ in range(15):
            for e in executions(12):
                if e['id'] in baseline:
                    continue
                if 'Parse Inbound SMS' in nodes_of(e):
                    ready_exec = e
                    break
            if ready_exec:
                break
            time.sleep(3)

    if not ready_exec:
        return finish(started, masked, 'READY leg produced no execution', ghl_wired)
    baseline.add(ready_exec['id'])

    # ------------------------------------------------------- HOP 4 · the call
    t0 = time.time()
    pick = first_json(ready_exec, 'Pick Pool Number')
    dial = first_json(ready_exec, 'Retell Dial')
    call_id = dial.get('call_id')
    dvars = {k: pick.get(k) for k in
             ('company_name', 'website_url', 'city', 'service_1', 'service_2',
              'scraped_fact', 'services_typed', 'first_name')}
    hop('4 · outbound call placed', t0,
        'call_id=%s from=%s | vars populated=%d/8' % (
            call_id, pick.get('from_number'), sum(1 for v in dvars.values() if v)),
        bool(call_id))
    print('        dynamic variables: %s' % json.dumps(dvars)[:300])

    # ------------------------------------------------- HOP 5 · call completes
    t0 = time.time()
    outcome = {}
    if call_id:
        end = time.time() + CALL_WAIT_S
        while time.time() < end:
            outcome = api(RETELL + '/v2/get-call/' + call_id,
                          headers={'Authorization': 'Bearer ' + os.environ['RETELL_API_KEY']})
            if outcome.get('call_status') in ('ended', 'error'):
                break
            time.sleep(10)
    dur = round((outcome.get('duration_ms') or 0) / 1000)
    hop('5 · call completed', t0,
        'status=%s duration=%ss disconnect=%s' % (
            outcome.get('call_status'), dur, outcome.get('disconnection_reason')),
        outcome.get('call_status') == 'ended')

    # ---------------------------------------------------- HOP 6 · post-call SMS
    t0 = time.time()
    post, text_kind = None, None
    end = time.time() + 180
    while time.time() < end:
        for e in executions(12):
            if e['id'] in baseline:
                continue
            n = nodes_of(e)
            if 'SMS: TEXT 2 (answered)' in n:
                post, text_kind = e, 'TEXT 2 (answered)'
                break
            if 'SMS: TEXT 3 (voicemail)' in n:
                post, text_kind = e, 'TEXT 3 (voicemail)'
                break
        if post:
            break
        time.sleep(6)

    if post:
        s = first_json(post, 'SMS: %s' % ('TEXT 2 (answered)' if 'TEXT 2' in text_kind else 'TEXT 3 (voicemail)'))
        hop('6 · post-call SMS', t0, '%s | GHL messageId=%s' % (text_kind, s.get('messageId')),
            bool(s.get('messageId')))
    else:
        hop('6 · post-call SMS', t0, 'EMPTY - no result within 180s', False)

    # duplicate check — how many post-call texts fired for this one call?
    sends = 0
    for e in executions(20):
        n = nodes_of(e)
        if 'SMS: TEXT 2 (answered)' in n or 'SMS: TEXT 3 (voicemail)' in n:
            sends += 1
    print('\n  post-call SMS executions seen in the recent window: %d' % sends)

    finish(started, masked, None, ghl_wired, outcome, text_kind, call_id)


def finish(started, masked, failure=None, ghl_wired=False, outcome=None,
           text_kind=None, call_id=None):
    total = sum(h['seconds'] for h in LOG)
    L = []
    A = L.append
    A('# RUN 1.5 — END-TO-END LIVE PROOF\n')
    A('**Run:** %s CDT · **Target:** owner cell `%s` (redacted — read from Doppler at runtime, never stored)\n'
      % (started.astimezone(CDT).strftime('%Y-%m-%d %H:%M'), masked))
    if failure:
        A('> **RESULT: INCOMPLETE — %s**\n' % failure)
    else:
        A('> **RESULT: FULL LOOP COMPLETED**\n')
    A('## Per-hop latency\n')
    A('| Hop | Seconds | OK | Detail |')
    A('|---|---:|:--:|---|')
    for h in LOG:
        A('| %s | %.2f | %s | %s |' % (h['hop'], h['seconds'], '✅' if h['ok'] else '❌',
                                       str(h['detail']).replace('|', '\\|')[:170]))
    A('')
    A('**Wall clock across measured hops: %.1fs**\n' % total)
    A('## GHL → n8n READY webhook\n')
    if ghl_wired:
        A('**VERIFIED.** A genuine inbound SMS reply reached `/webhook/live-ready`, so the GHL')
        A('inbound-message webhook is correctly pointed at n8n.\n')
    else:
        A('**UNVERIFIED — not proven by this run.** No genuine inbound reply arrived inside the')
        A('wait window, so the READY webhook was synthesized to exercise everything downstream.')
        A('That means the GHL → n8n leg is the ONE hop this proof does not cover.\n')
        A('To close it, reply `READY` to the AVA text from the owner cell and confirm a new')
        A('execution appears on workflow `%s`. If none does, the GHL inbound-message webhook is' % WF)
        A('still not pointed at `https://circulant.app.n8n.cloud/webhook/live-ready`.\n')
    if outcome:
        A('## Call\n')
        A('- **call_id:** `%s`' % (call_id or 'EMPTY - no result'))
        A('- **status:** %s · **duration:** %ss · **ended:** %s'
          % (outcome.get('call_status'), round((outcome.get('duration_ms') or 0) / 1000),
             outcome.get('disconnection_reason')))
        A('- **post-call text:** %s' % (text_kind or '**EMPTY — no result**'))
        t = (outcome.get('transcript') or '').strip()
        if t:
            A('\n**Transcript (first 1200 chars):**\n')
            A('```')
            A(t[:1200])
            A('```')
        else:
            A('- **transcript:** **EMPTY — no result**')
    A('')
    if not os.path.isdir(os.path.dirname(OUT)):
        os.makedirs(os.path.dirname(OUT))
    with io.open(OUT, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write('\n'.join(L) + '\n')
    print('\nwrote %s' % OUT.replace(ROOT, '.'))


if __name__ == '__main__':
    main()
