// tools/aic-try/receipt-probe.mjs — the LIVE /try/receipt endpoint, from outside.
//
//   doppler run -- node tools/aic-try/receipt-probe.mjs [--call <call_id>]
//
// Everything here is a refusal except the one optional positive case, so the
// probe is safe to re-run. It asserts the shape of each refusal AND, for the ones
// that are supposed to be free, that the Retell node never ran — read back from
// the n8n execution list rather than assumed. A 404 that cost a Retell read and a
// 404 that cost nothing look identical from the outside, which is exactly why
// this reads the executions.

const RECEIPT = 'https://circulant.app.n8n.cloud/webhook/try/receipt';
const SITE = 'https://aichauffeur.ai';
const N8N = 'https://circulant.app.n8n.cloud/api/v1';
const WF = '9nKn8i2dRuALikuv';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const POSITIVE = arg('--call', null);

let failed = 0, ran = 0;
const check = (ok, label, detail = '') => { ran++; if (!ok) failed++; console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`); };
const sleep = (ms) => new Promise((f) => setTimeout(f, ms));

async function get(callId, origin = SITE) {
  const headers = {};
  if (origin) headers.Origin = origin;
  const t0 = Date.now();
  const r = await fetch(`${RECEIPT}?call_id=${encodeURIComponent(callId)}`, { headers });
  const text = await r.text();
  let body; try { body = JSON.parse(text); } catch { body = text; }
  return { status: r.status, body, ms: Date.now() - t0, text };
}

// Did the Retell node run in the execution this request created?
async function retellRan(since) {
  await sleep(2500);
  const r = await fetch(`${N8N}/executions?workflowId=${WF}&limit=8&includeData=true`, { headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY } });
  if (!r.ok) return null;
  const runs = (await r.json()).data || [];
  const mine = runs.filter((e) => new Date(e.startedAt).getTime() >= since - 1500);
  if (!mine.length) return null;
  return mine.map((e) => {
    const nodes = Object.keys(((e.data || {}).resultData || {}).runData || {});
    return { id: e.id, ran: nodes.includes('Read call'), nodes: nodes.length };
  });
}

console.log('/try receipt — LIVE probe\n');
console.log('ORIGIN');
{
  const r = await get('call_' + 'a'.repeat(27), 'https://evil.example.com');
  check(r.status === 403, 'a foreign Origin is 403', `${r.status} ${JSON.stringify(r.body)}`);
  const ex = await retellRan(Date.now() - 4000);
  check(ex === null || ex.every((e) => !e.ran), 'and the Retell node never ran', ex ? JSON.stringify(ex) : 'no execution read');
}
{
  const r = await get('call_' + 'a'.repeat(27), null);
  check(r.status === 403, 'a request with NO Origin header is 403', `${r.status}`);
}

console.log('\nSHAPE — refused before any Retell read');
for (const [id, label] of [['', 'an empty call_id'], ['nope', 'a call_id that is not shaped like one'],
  ['call_../../secret', 'a path-traversal call_id'], ['call_' + 'A'.repeat(27), 'an uppercase call_id'],
  ['call_' + 'a'.repeat(200), 'an over-long call_id']]) {
  const t0 = Date.now();
  const r = await get(id);
  const ex = await retellRan(t0);
  check(r.status === 404 && (!ex || ex.every((e) => !e.ran)), `${label} is 404 and costs no Retell read`, `${r.status}`);
}

console.log('\nSCOPE — a real call this page may not read');
const OLD = arg('--old', 'call_33583d539e09678fe50b72582af'); // a real /try call, hours old
{
  const r = await get(OLD);
  check(r.status === 404, 'a real /try call older than two hours is 404', `${r.status} ${r.text.slice(0, 60)}`);
  check(!/Milwaukee|cloudfront|airport|Sedan/i.test(r.text), 'and leaks no trip detail', r.text.slice(0, 80));
}

console.log('\nBUDGET');
{
  let last = null, n = 1; // the call above already spent one of this call_id's 15
  for (; n < 17; n++) { last = await get(OLD); if (last.status === 429) break; }
  check(last && last.status === 429, 'one call_id is capped at 15 polls', `refused on poll ${n}`);
  const t0 = Date.now();
  const after = await get(OLD);
  const ex = await retellRan(t0);
  check(after.status === 429 && (!ex || ex.every((e) => !e.ran)), 'and a capped poll costs no Retell read');
  check(JSON.stringify(after.body) === '{"error":"rate_limited"}', 'the refusal says only rate_limited', JSON.stringify(after.body));
}

if (POSITIVE) {
  console.log('\nPOSITIVE — a call from this run');
  const r = await get(POSITIVE);
  check(r.status === 200, 'a fresh /try call answers 200', String(r.status));
  const b = r.body || {};
  check(b.status === 'ready' || b.status === 'processing', 'status is ready or processing', String(b.status));
  check(Object.prototype.hasOwnProperty.call(b, 'mobile_captured'), 'mobile_captured present', String(b.mobile_captured));
  check(b.transcript === null, 'transcript is null');
  const allowed = ['status', 'pickup', 'dropoff', 'date', 'time', 'passengers', 'vehicle', 'quote', 'ticket', 'mobile_captured', 'recording_url', 'transcript'];
  check(Object.keys(b).every((k) => allowed.includes(k)), 'no field outside the allow list', Object.keys(b).join(','));
  console.log('  receipt:', JSON.stringify(b));
}

console.log(`\n${failed ? 'FAIL — ' + failed + ' of ' + ran : 'ALL ' + ran + ' CHECKS PASS'}`);
process.exit(failed ? 1 : 0);
