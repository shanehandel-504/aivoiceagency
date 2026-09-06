/* tools/callback-gate/03-gate-livefire.mjs
 *
 *   node tools/callback-gate/03-gate-livefire.mjs
 *
 * Live-fire proof of WF-CALLBACK-GATE against the PRODUCTION webhook.
 *
 * SAFETY: every case in this file is a case the gate must BLOCK. None of them
 * can reach `Dial via Retell`, so running this places no call and spends no
 * telephony. The ALLOW path is deliberately not exercised here — proving it
 * would mean dialling a real phone, and a test that costs a real call is a test
 * that gets skipped. The allow path is proven instead by the fact that the only
 * change on that branch is a pass-through Object.assign, and by the first real
 * lead landing in callback_gate_log with verdict=ALLOWED.
 *
 * Each blocked attempt fires ONE owner SMS by design — that is the rail under
 * test, not a side effect.
 */

const URL_PROD = 'https://circulant.app.n8n.cloud/webhook/ava-call';

const base = {
  first_name: 'Gate Test',
  source: 'gate-livefire',
  brand: 'AI Chauffeur',
  tag: 'aichauffeur',
  business_type: 'Ground Transportation',
  tcpa_consent: true,
};

const CASES = [
  {
    name: 'THE ACTUAL FRAUD VECTOR — UK +44 121',
    expect: 'non-nanp-country',
    payload: { ...base, phone: '+441215295880' },
  },
  {
    name: 'Caribbean revenue-share NPA — reads as domestic (+1 876)',
    expect: 'caribbean-npa:876',
    payload: { ...base, phone: '+18765550147' },
  },
  {
    name: 'US premium 900',
    expect: 'premium-npa:900',
    payload: { ...base, phone: '+19005550147' },
  },
  {
    name: 'TCPA consent absent — fail closed',
    expect: 'tcpa-missing',
    payload: { ...base, phone: '+14145550147', tcpa_consent: undefined },
  },
  {
    name: 'Honeypot filled',
    expect: 'honeypot-filled',
    payload: { ...base, phone: '+14145550147', company_url: 'http://spam.example' },
  },
];

let pass = 0;
let fail = 0;

for (const c of CASES) {
  let status = 0;
  let body = null;
  try {
    const res = await fetch(URL_PROD, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(c.payload),
    });
    status = res.status;
    const text = await res.text();
    try { body = JSON.parse(text); } catch { body = { _raw: text.slice(0, 200) }; }
  } catch (e) {
    body = { _network: e.message };
  }

  /* A 200 with status:"calling" is the FAILURE mode here — it means the gate
     let the case through. Judge on the body, never on the HTTP code alone. */
  const blocked = status === 403 && body && body.status === 'blocked';
  const reasonOk = blocked && String(body.reason || '').startsWith(c.expect);
  const ok = blocked && reasonOk;
  ok ? pass++ : fail++;

  console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.name}`);
  console.log(`      HTTP ${status}  status=${body?.status ?? '?'}  reason=${body?.reason ?? '?'}`);
  if (!ok) console.log(`      expected a 403 blocked with reason starting "${c.expect}"`);
  console.log('');
}

console.log(`GATE LIVE-FIRE — ${pass} passed, ${fail} failed`);
if (fail) {
  console.log('RUN INCOMPLETE — the gate did not block a case it must block.');
  process.exit(1);
}
