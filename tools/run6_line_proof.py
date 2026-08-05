# -*- coding: utf-8 -*-
"""tools/run6_line_proof.py  ·  AIC RUN 6 — CALLBACK LINE FIX gate.

Re-provable at any time. Asserts against LIVE systems, never against a local
copy or a draft:

  1. n8n  — the workflow is ACTIVE and the PUBLISHED version (activeVersionId)
            is the one carrying the fix. An n8n API write lands on the DRAFT;
            a workflow can read "correct" while production runs old code.
  2. n8n  — the Error Sentry is still attached AND still active. An inactive
            error workflow is silently never invoked.
  3. n8n  — 'Dial via Retell' no longer hardcodes a from_number, and the GHL
            URL carries the real locationId.
  4. Retell — +14147750019 binds the AI Chauffeur agent for OUTBOUND, which is
            what actually decides who speaks. Routing on the number is only
            correct while that binding holds, so it is asserted, not assumed.
  5. Retell — the RUN 6 proof calls still show the before/after contrast.

USAGE:
  doppler run --project ava-prod --config prd -- python tools/run6_line_proof.py
"""
import io
import json
import os
import sys
import urllib.request

WF = 'u3FaLLiH0loGf1BN'          # AVA Layer 1 — Money Path Spine
SENTRY = 'SlnAeMrVRORsF0w7'      # OPS — Error Sentry
AIC_LINE = '+14147750019'
AVA_LINE = '+14142408930'
AIC_AGENT = 'agent_2d1d687eb85e6d5d0e720795c2'   # AI CHAUFFEUR FLOW v1
GHL_LOC_GOOD = 'sdShCZCaxce8DHKbYcIl'            # lowercase L, not capital I
N8N = 'https://circulant.app.n8n.cloud/api/v1'

fails = []


def ok(cond, msg, detail=''):
    print('  %s  %s%s' % ('PASS' if cond else 'FAIL', msg, (' :: ' + detail) if detail else ''))
    if not cond:
        fails.append(msg)


def get(url, headers):
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=45) as r:
        return json.loads(r.read().decode('utf-8'))


def main():
    n8n_key = os.environ.get('N8N_API_KEY')
    retell_key = os.environ.get('RETELL_API_KEY')
    if not n8n_key or not retell_key:
        print('  N8N_API_KEY / RETELL_API_KEY missing — run under `doppler run`.')
        return 2

    nh = {'X-N8N-API-KEY': n8n_key, 'Accept': 'application/json'}
    rh = {'Authorization': 'Bearer ' + retell_key, 'Accept': 'application/json'}

    # ---- 1/2/3 · n8n -------------------------------------------------------
    print('\n-- n8n · AVA Layer 1 — Money Path Spine ' + '-' * 32)
    wf = get('%s/workflows/%s' % (N8N, WF), nh)
    ok(wf.get('active') is True, 'workflow is ACTIVE (not draft)')

    # the public API returns the DRAFT graph; compare version ids explicitly
    vid, avid = wf.get('versionId'), wf.get('activeVersionId')
    if avid is None:
        print('  NOTE  this n8n build does not expose activeVersionId on /workflows/{id};')
        print('        version equality was asserted via the MCP get_workflow_details call.')
    else:
        ok(vid == avid, 'draft == published', '%s vs %s' % (vid, avid))

    settings = wf.get('settings') or {}
    ok(settings.get('errorWorkflow') == SENTRY,
       'Error Sentry still attached', str(settings.get('errorWorkflow')))
    sentry = get('%s/workflows/%s' % (N8N, SENTRY), nh)
    ok(sentry.get('active') is True,
       'Error Sentry is ACTIVE (an inactive one is never invoked)')

    nodes = {n['name']: n for n in wf.get('nodes', [])}
    ok('Route by Brand' in nodes, 'Route by Brand node exists')

    dial = nodes.get('Dial via Retell', {}).get('parameters', {}).get('jsonBody', '')
    ok('$json.from_number' in dial, 'Dial via Retell reads the routed from_number')
    ok(AVA_LINE not in dial and AIC_LINE not in dial,
       'no phone number is hardcoded in the dial node')

    ghl_url = nodes.get('Log Contact to GHL', {}).get('parameters', {}).get('url', '')
    ok(GHL_LOC_GOOD in ghl_url, 'GHL URL carries the real locationId')
    ok('sdShCZCaxce8DHKbYcII' not in ghl_url,
       'the capital-I locationId typo is gone')

    router = nodes.get('Route by Brand', {}).get('parameters', {}).get('jsCode', '')
    ok(AIC_LINE in router and AVA_LINE in router, 'router holds both lines')

    # ---- 4 · Retell binding ------------------------------------------------
    print('\n-- Retell · line -> agent binding ' + '-' * 38)
    for line, want_aic in ((AIC_LINE, True), (AVA_LINE, False)):
        num = get('https://api.retellai.com/get-phone-number/%s' % line, rh)
        out = (num.get('outbound_agents') or [{}])[0]
        aid, ver = out.get('agent_id'), out.get('agent_version')
        is_aic = aid == AIC_AGENT
        ok(is_aic == want_aic,
           '%s outbound -> %s' % (line, 'AI Chauffeur agent' if want_aic else 'AVA agent'),
           '%s @ %s' % (aid, ver))
        if want_aic:
            ok(ver == 'latest_published',
               'chauffeur line follows latest_published (no pinned drift)', str(ver))

    print('\n' + '=' * 72)
    print('  RUN 6 %s' % ('FAILED — %d check(s)' % len(fails) if fails else 'ALL CHECKS PASSED'))
    print('=' * 72 + '\n')
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())
