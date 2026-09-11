// tools/aic-try/unit.mjs — unit gate for chauffeur/api/web-call.js
//
//   node tools/aic-try/unit.mjs
//
// No network: global fetch is stubbed per case. Every case asserts the status,
// the response shape, AND which upstream calls were (or were not) made, because
// "403" alone cannot tell a Turnstile refusal from an Origin refusal.
// A negative control runs first: the comparator must be able to fail.

import assert from 'node:assert/strict';

process.env.RETELL_API_KEY = 'unit-test-retell-key';
process.env.TURNSTILE_SECRET = 'unit-test-turnstile-secret';

const { default: handler } = await import(new URL('../../chauffeur/api/web-call.js', import.meta.url));

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const CONC = 'https://api.retellai.com/get-concurrency';
const CREATE = 'https://api.retellai.com/v3/create-web-call';

const EXPECTED_CREATE_BODY = {
  agent_id: 'agent_2d1d687eb85e6d5d0e720795c2',
  agent_version: 'latest_published',
  agent_override: { agent: { max_call_duration_ms: 480000, end_call_after_silence_ms: 60000 } },
  metadata: { source: 'aichauffeur.ai/try' },
};

let calls = [];
let upstream = {};
const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });

globalThis.fetch = async (url, init = {}) => {
  const u = String(url);
  calls.push({ url: u, init });
  if (u === SITEVERIFY) return upstream.siteverify ? upstream.siteverify(init) : json(200, { success: true, hostname: 'aichauffeur.ai' });
  if (u === CONC) return upstream.conc ? upstream.conc() : json(200, { current_concurrency: 0, concurrency_limit: 20 });
  if (u === CREATE) return upstream.create ? upstream.create(init) : json(201, {
    call_id: 'call_unit', access_token: 'tok_unit', transport: 'gateway',
    ice_servers: [{ urls: ['stun:stun.example:3478'] }], url: 'https://gw.example', expires_at: 1,
  });
  throw new Error('unexpected fetch ' + u);
};

let ipSeq = 0;
function req({ method = 'POST', origin = 'https://aichauffeur.ai', ip, body = { turnstile: 'tok' } } = {}) {
  const headers = { 'x-forwarded-for': ip || `10.0.0.${++ipSeq}` };
  if (origin !== null) headers.origin = origin;
  return { method, headers, body };
}
function run(r) {
  return new Promise((resolve) => {
    const res = { statusCode: 0, headers: {}, setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
      end(s) { this.body = s; resolve(this); } };
    handler(r, res);
  });
}
const urls = () => calls.map((c) => c.url);

let pass = 0, fail = 0;
async function t(name, fn) {
  calls = []; upstream = {};
  try { await fn(); pass++; console.log('  PASS  ' + name); }
  catch (e) { fail++; console.log('  FAIL  ' + name + '\n        ' + e.message.split('\n')[0]); }
}

console.log('NEGATIVE CONTROL');
let controlCaught = false;
try { assert.deepEqual({ ...EXPECTED_CREATE_BODY, agent_version: 'latest' }, EXPECTED_CREATE_BODY); }
catch { controlCaught = true; }
if (!controlCaught) { console.log('  ABORT  the comparator cannot fail — gate is meaningless'); process.exit(2); }
console.log('  PASS  comparator rejects a body that says "latest"\n');

console.log('CASES');
await t('GET -> 405, no upstream call', async () => {
  const r = await run(req({ method: 'GET' }));
  assert.equal(r.statusCode, 405); assert.deepEqual(urls(), []);
});
await t('foreign Origin -> 403, no upstream call', async () => {
  const r = await run(req({ origin: 'https://evil.example' }));
  assert.equal(r.statusCode, 403); assert.equal(JSON.parse(r.body).error, 'origin'); assert.deepEqual(urls(), []);
});
await t('missing Origin -> 403', async () => {
  const r = await run(req({ origin: null }));
  assert.equal(r.statusCode, 403); assert.deepEqual(urls(), []);
});
await t('www origin -> 403 (the page is only served on the apex)', async () => {
  const r = await run(req({ origin: 'https://www.aichauffeur.ai' }));
  assert.equal(r.statusCode, 403);
});
await t('no Turnstile token -> 403 without calling siteverify', async () => {
  const r = await run(req({ body: {} }));
  assert.equal(r.statusCode, 403); assert.deepEqual(urls(), []);
});
await t('bad Turnstile token -> 403, Retell never called', async () => {
  upstream.siteverify = () => json(200, { success: false, 'error-codes': ['invalid-input-response'] });
  const r = await run(req());
  assert.equal(r.statusCode, 403); assert.equal(JSON.parse(r.body).error, 'verification');
  assert.deepEqual(urls(), [SITEVERIFY]);
});
await t('token minted on another hostname -> 403', async () => {
  upstream.siteverify = () => json(200, { success: true, hostname: 'aivoiceagency.ai' });
  const r = await run(req());
  assert.equal(r.statusCode, 403); assert.deepEqual(urls(), [SITEVERIFY]);
});
await t('Cloudflare test-key result (example.com + result_with_testing_key) is accepted', async () => {
  upstream.siteverify = () => json(200, { success: true, hostname: 'example.com', metadata: { result_with_testing_key: true } });
  const r = await run(req());
  assert.equal(r.statusCode, 200);
});
await t('siteverify gets secret, token and remote IP', async () => {
  await run(req({ ip: '203.0.113.7', body: { turnstile: 'tok-xyz' } }));
  const sent = new URLSearchParams(calls[0].init.body);
  assert.equal(sent.get('secret'), 'unit-test-turnstile-secret');
  assert.equal(sent.get('response'), 'tok-xyz');
  assert.equal(sent.get('remoteip'), '203.0.113.7');
});
await t('per-IP: 403, 403, 403, then 429 — the 4th makes no upstream call', async () => {
  upstream.siteverify = () => json(200, { success: false, 'error-codes': ['invalid-input-response'] });
  const codes = [];
  for (let i = 0; i < 4; i++) {
    const before = calls.length;
    const r = await run(req({ ip: '198.51.100.9' }));
    codes.push(r.statusCode);
    if (i === 3) assert.equal(calls.length, before, '4th attempt reached upstream');
  }
  assert.deepEqual(codes, [403, 403, 403, 429]);
});
await t('per-IP limit is per IP: a different IP still gets through', async () => {
  const r = await run(req({ ip: '198.51.100.10' }));
  assert.equal(r.statusCode, 200);
});
await t('capacity: 10 calls running -> 429 busy, create never called', async () => {
  upstream.conc = () => json(200, { current_concurrency: 10 });
  const r = await run(req());
  assert.equal(r.statusCode, 429); assert.equal(JSON.parse(r.body).error, 'busy');
  assert.deepEqual(urls(), [SITEVERIFY, CONC]);
});
await t('capacity: 9 running -> proceeds', async () => {
  upstream.conc = () => json(200, { current_concurrency: 9 });
  const r = await run(req());
  assert.equal(r.statusCode, 200);
});
await t('capacity read fails -> 502, create never called', async () => {
  upstream.conc = () => json(500, { error: 'x' });
  const r = await run(req());
  assert.equal(r.statusCode, 502); assert.deepEqual(urls(), [SITEVERIFY, CONC]);
});
await t('Retell create error -> 502 with a plain message, upstream text not echoed', async () => {
  upstream.create = () => new Response('internal detail that must not leak', { status: 500 });
  const r = await run(req());
  assert.equal(r.statusCode, 502);
  assert.deepEqual(JSON.parse(r.body), { error: 'upstream', message: 'The call could not be started.' });
});
await t('network throw -> 502', async () => {
  upstream.create = () => { throw new TypeError('fetch failed'); };
  const r = await run(req());
  assert.equal(r.statusCode, 502);
});
await t('success: create body is EXACTLY the pinned request', async () => {
  await run(req());
  const create = calls.find((c) => c.url === CREATE);
  assert.ok(create, 'create-web-call not called');
  assert.deepEqual(JSON.parse(create.init.body), EXPECTED_CREATE_BODY);
  assert.equal(create.init.headers.Authorization, 'Bearer unit-test-retell-key');
  assert.equal(create.init.method, 'POST');
});
await t('success: response carries exactly the five browser fields', async () => {
  const r = await run(req());
  assert.equal(r.statusCode, 200);
  assert.deepEqual(Object.keys(JSON.parse(r.body)).sort(), ['access_token', 'call_id', 'ice_servers', 'transport', 'url']);
});
await t('the key never appears in any response body', async () => {
  const bodies = [];
  for (const u of [{}, { create: () => new Response('x', { status: 500 }) }, { conc: () => json(200, { current_concurrency: 12 }) }]) {
    upstream = u; bodies.push((await run(req())).body);
  }
  assert.ok(bodies.every((b) => !b.includes('unit-test-retell-key')));
});
await t('responses are no-store and noindex', async () => {
  const r = await run(req());
  assert.equal(r.headers['cache-control'], 'no-store'); assert.equal(r.headers['x-robots-tag'], 'noindex');
});
await t('unconfigured -> 503 before any upstream call', async () => {
  const saved = process.env.TURNSTILE_SECRET; delete process.env.TURNSTILE_SECRET;
  try {
    const r = await run(req());
    assert.equal(r.statusCode, 503); assert.deepEqual(urls(), []);
  } finally { process.env.TURNSTILE_SECRET = saved; }
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
