// tools/aic-try/probe-fn.mjs — probes the LIVE /try webhook. Creates NO call.
//
//   node tools/aic-try/probe-fn.mjs            # origin gate + a refused proof
//   node tools/aic-try/probe-fn.mjs --limit    # then spends this IP's attempts until 429
//
// The call step is what counts against the 3-per-IP-per-hour allowance, so
// --limit is the LAST thing a verification run does. Nothing here can create a
// call: every request carries a nonce that was never issued, so the proof fails
// before the workflow reaches Retell. Read the n8n executions to confirm that.

import https from 'node:https';

const WEBHOOK = 'https://circulant.app.n8n.cloud/webhook/7b9e6dee2ce9ce780673725e0448791f';
const SITE = 'https://aichauffeur.ai';
const LIMIT = process.argv.includes('--limit');

function call(fields, headers = {}, method = 'POST') {
  const body = new URLSearchParams(fields).toString();
  return new Promise((resolve) => {
    const req = https.request(WEBHOOK, {
      method,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body), ...headers },
    }, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => {
        let j = null; try { j = JSON.parse(d); } catch {}
        resolve({ status: res.statusCode, error: j && j.error, nonce: j && j.nonce, bits: j && j.bits,
          acao: res.headers['access-control-allow-origin'], cache: res.headers['cache-control'] });
      });
    });
    req.on('error', (e) => resolve({ status: 0, error: e.message }));
    req.write(body);
    req.end();
  });
}

let failed = 0;
const check = (ok, label, got) => { if (!ok) failed++; console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}  -> ${JSON.stringify(got)}`); };
const BAD_NONCE = '00000000000000000000000000000000';

console.log(`probing ${WEBHOOK}\n`);
const evil = await call({ step: 'call', nonce: BAD_NONCE, counter: '1' }, { Origin: 'https://evil.example' });
check(evil.status === 403 && evil.error === 'forbidden', 'a foreign Origin is refused', evil);
const none = await call({ step: 'call', nonce: BAD_NONCE, counter: '1' });
check(none.status === 403 && none.error === 'forbidden', 'a missing Origin is refused', none);

const ch = await call({ step: 'challenge' }, { Origin: SITE });
check(ch.status === 200 && /^[0-9a-f]{32}$/.test(ch.nonce || '') && ch.bits === 20, 'the challenge step issues a 32-hex nonce at 20 bits', { status: ch.status, bits: ch.bits });
check(ch.acao === SITE, 'the response allows only aichauffeur.ai to read it', ch.acao);
check(ch.cache === 'no-store', 'responses are no-store', ch.cache);

const bad = await call({ step: 'call', nonce: BAD_NONCE, counter: '1' }, { Origin: SITE });
check(bad.status === 403 && bad.error === 'verification', 'a proof for a nonce that was never issued is refused (attempt 1)', bad);

if (LIMIT) {
  const seq = [bad.status];
  for (let i = 0; i < 5; i++) {
    const r = await call({ step: 'call', nonce: BAD_NONCE, counter: '1' }, { Origin: SITE });
    seq.push(r.status);
    if (r.status === 429) break;
  }
  check(seq.includes(429), 'the per-IP limit answers 429 once the hour\'s attempts are spent', seq);
}
console.log(`\n${failed ? 'FAIL — ' + failed : 'ALL CHECKS PASS'}`);
process.exit(failed ? 1 : 0);
