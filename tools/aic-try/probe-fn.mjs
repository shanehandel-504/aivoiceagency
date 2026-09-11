// tools/aic-try/probe-fn.mjs — probes the LIVE /api/web-call. Creates NO call.
//
//   node tools/aic-try/probe-fn.mjs            # method, origin, configuration, verification
//   node tools/aic-try/probe-fn.mjs --limit    # then spends this IP's attempts until 429
//
// Every same-origin POST counts against this machine's 3-per-hour allowance, so
// --limit is the LAST thing a verification run does. No request here can create a
// call: every POST carries an empty or invalid Turnstile token. A 503 means the
// Vercel env vars are missing; the Turnstile refusal reason is in the runtime logs.

import https from 'node:https';

const FN = 'https://aichauffeur.ai/api/web-call';
const SITE = 'https://aichauffeur.ai';
const LIMIT = process.argv.includes('--limit');

function call(method, headers = {}, body = null) {
  return new Promise((resolve) => {
    const req = https.request(FN, { method, headers: { 'Content-Type': 'application/json', ...headers } }, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => {
        let j = null; try { j = JSON.parse(d); } catch {}
        resolve({ status: res.statusCode, error: j && j.error, cache: res.headers['cache-control'] });
      });
    });
    req.on('error', (e) => resolve({ status: 0, error: e.message }));
    if (body !== null) req.write(JSON.stringify(body));
    req.end();
  });
}

let failed = 0;
const check = (ok, label, got) => { if (!ok) failed++; console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}  -> ${JSON.stringify(got)}`); };

console.log(`probing ${FN}\n`);
const g = await call('GET');
check(g.status === 405, 'GET is refused', g);
const evil = await call('POST', { Origin: 'https://evil.example' }, {});
check(evil.status === 403 && evil.error === 'origin', 'foreign Origin is refused before anything else', evil);
const none = await call('POST', {}, {});
check(none.status === 403 && none.error === 'origin', 'missing Origin is refused', none);

const empty = await call('POST', { Origin: SITE }, {});
if (empty.status === 503) {
  console.log('\n  ENV MISSING — the function answers not_configured. Add RETELL_API_KEY and');
  console.log('  TURNSTILE_SECRET to Vercel -> aichauffeur -> Settings -> Environment Variables, then redeploy.');
  process.exit(3);
}
check(empty.status === 403 && empty.error === 'verification', 'no Turnstile token is refused (attempt 1)', empty);
const bad = await call('POST', { Origin: SITE }, { turnstile: 'probe-invalid-token' });
check(bad.status === 403 && bad.error === 'verification', 'an invalid Turnstile token is refused (attempt 2)', bad);
check(bad.cache === 'no-store', 'responses are no-store', bad.cache);

if (LIMIT) {
  const seq = [];
  for (let i = 0; i < 5; i++) {
    const r = await call('POST', { Origin: SITE }, { turnstile: 'probe-invalid-token' });
    seq.push(r.status);
    if (r.status === 429) break;
  }
  check(seq.includes(429), 'per-IP limit answers 429 once the hour\'s attempts are spent', seq);
}
console.log(`\n${failed ? 'FAIL — ' + failed : 'ALL CHECKS PASS'}`);
process.exit(failed ? 1 : 0);
