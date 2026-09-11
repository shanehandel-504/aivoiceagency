// tools/aic-try/call.mjs — ONE real web call through /try, start to finish.
//
//   doppler run -- node tools/aic-try/call.mjs --mode local --wav <file.wav> [--cap 60000]
//   doppler run -- node tools/aic-try/call.mjs --mode prod  --wav <file.wav> [--hold 25]
//
// local  chauffeur/ is served AS https://aichauffeur.ai, chauffeur/api/web-call.js runs
//        in-process with MAX_CALL_MS replaced by --cap, and ONLY Turnstile is swapped
//        for Cloudflare's published always-pass test keys. Nobody hangs up: the call
//        must end ITSELF at the cap, which is the agent_override proof.
// prod   the live page, the live function, real Turnstile. Hangs up after --hold s.
//
// Both   a fake microphone plays the WAV. Afterwards GET /v2/get-call/{id} must show
//        call_type web_call, a PUBLISHED agent version, metadata.source, and at least
//        one agent turn AND one user turn. Never speak a real phone number in the WAV.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, SITE, REPO, serveLocal, vercelAdapter, TURNSTILE_STUB, TURNSTILE_URL, STATE_RECORDER, retellGet } from './lib.mjs';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const MODE = arg('--mode', 'local');
const WAV = arg('--wav');
const CAP = Number(arg('--cap', '60000'));
const HOLD = Number(arg('--hold', '25'));
if (!['local', 'prod'].includes(MODE) || !WAV) { console.error('usage: --mode local|prod --wav <file.wav>'); process.exit(2); }
if (!process.env.RETELL_API_KEY) { console.error('RUN INCOMPLETE — RETELL_API_KEY missing (run under doppler)'); process.exit(2); }

const OUT = path.join(REPO, 'audits', 'aic-try');
await mkdir(OUT, { recursive: true });
const mask = (s) => String(s || '').replace(/\d[\d\s().-]{5,}\d/g, '[digits]');
let failed = 0;
const check = (ok, label, detail = '') => { if (!ok) failed++; console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`); };

// ── local: the real function, with only the cap swapped for the proof ──────
let apiHandler = null, apiResult = null;
if (MODE === 'local') {
  const src = await readFile(path.join(REPO, 'chauffeur', 'api', 'web-call.js'), 'utf8');
  const needle = 'const MAX_CALL_MS = 480000;';
  if (src.split(needle).length !== 2) { console.error('RUN INCOMPLETE — MAX_CALL_MS line not found exactly once'); process.exit(2); }
  const tmp = path.join(os.tmpdir(), `aic-try-webcall-${Date.now()}.mjs`);
  await writeFile(tmp, src.replace(needle, `const MAX_CALL_MS = ${CAP};`));
  const { default: handler } = await import(pathToFileURL(tmp).href);
  process.env.TURNSTILE_SECRET = '1x0000000000000000000000000000000AA'; // Cloudflare TEST secret: always passes
  apiHandler = vercelAdapter(handler, (out) => { apiResult = out; });
}

const browser = await chromium.launch({
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream',
    `--use-file-for-fake-audio-capture=${WAV}`, '--autoplay-policy=no-user-gesture-required'],
});
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
await context.grantPermissions(['microphone'], { origin: SITE });
if (MODE === 'local') {
  await serveLocal(context, apiHandler);
  await context.route(TURNSTILE_URL, (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: TURNSTILE_STUB }));
}
await context.addInitScript(STATE_RECORDER);
const page = await context.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
page.on('pageerror', (e) => errors.push('pageerror: ' + String(e.message).slice(0, 200)));
let created = null;
page.on('response', async (r) => {
  if (!r.url().endsWith('/api/web-call')) return;
  try { const j = await r.json(); created = { status: r.status(), call_id: j.call_id || null, keys: Object.keys(j).sort(), error: j.error || null }; }
  catch { created = { status: r.status(), call_id: null }; }
});

console.log(`/try live call — ${MODE.toUpperCase()}${MODE === 'local' ? ` (cap ${CAP} ms)` : ` (hold ${HOLD} s)`}\n`);
await page.goto(`${SITE}/try/`, { waitUntil: 'load' });
await page.waitForTimeout(4000);
const tStart = Date.now();
await page.click('#try-btn');

const waitState = (s, ms) => page.waitForFunction((x) => document.getElementById('try-tag').dataset.state === x, s, { timeout: ms }).then(() => true).catch(() => false);
let wentLive = await waitState('live', 60000);
if (!wentLive && MODE === 'prod') {
  // Real Turnstile may ask for a click. Try the visible checkbox once, then wait again.
  const frame = page.frameLocator('#try-ts iframe');
  await frame.locator('input[type="checkbox"], label').first().click({ timeout: 5000 }).catch(() => {});
  wentLive = await waitState('live', 30000);
}
console.log(`  create: ${JSON.stringify(created)}`);

let meterPeak = 0, tLive = Date.now();
if (wentLive) {
  tLive = Date.now();
  const sampler = setInterval(async () => {
    const v = await page.evaluate(() => Math.max(...[...document.querySelectorAll('#try-meter i')].map((i) => {
      const m = /scaleY\(([\d.]+)\)/.exec(i.style.transform || ''); return m ? Number(m[1]) : 0.08; }))).catch(() => 0);
    meterPeak = Math.max(meterPeak, v);
  }, 400);
  await page.waitForTimeout(8000);
  await page.screenshot({ path: path.join(OUT, `call-${MODE}-live-390.png`) });
  if (MODE === 'prod') {
    await page.waitForTimeout(Math.max(0, HOLD * 1000 - 8000));
    await page.click('#try-btn');
  }
  const endedOk = await waitState('ended', MODE === 'local' ? CAP + 45000 : 15000);
  clearInterval(sampler);
  await page.screenshot({ path: path.join(OUT, `call-${MODE}-ended-390.png`) });
  const liveFor = Math.round((Date.now() - tLive) / 1000);
  check(endedOk, 'call reached ENDED', `live for ~${liveFor}s`);
  check(meterPeak > 0.3, 'meter moved with AVA\'s voice', `peak scale ${meterPeak.toFixed(2)}`);
}
check(wentLive, 'call went LIVE', `${Math.round((tLive - tStart) / 1000)}s after tap`);

const states = await page.evaluate(() => window.__states.map((x) => x.s));
const seq = states.filter((s, i) => s !== states[i - 1]);
check(JSON.stringify(seq) === JSON.stringify(['ready', 'connecting', 'live', 'ended']), 'status sequence READY → CONNECTING → LIVE → ENDED', seq.join(' → '));
check(errors.length === 0, 'zero console / page errors', errors.slice(0, 4).join(' | '));
if (created) check(JSON.stringify(created.keys) === JSON.stringify(['access_token', 'call_id', 'ice_servers', 'transport', 'url']) || JSON.stringify(created.keys) === JSON.stringify(['access_token', 'call_id', 'ice_servers', 'transport']), 'function returned only the browser fields', created.keys.join(','));
await browser.close();

// ── the call record ─────────────────────────────────────────────────────────
const id = created && created.call_id;
if (!id) { console.log('\nRUN INCOMPLETE — no call_id (create: ' + JSON.stringify(created || apiResult) + ')'); process.exit(1); }
let call = null;
for (let i = 0; i < 24; i++) {
  const r = await retellGet(`/v2/get-call/${encodeURIComponent(id)}`);
  if (r.ok && r.body.call_status === 'ended' && Array.isArray(r.body.transcript_object)) { call = r.body; break; }
  await new Promise((f) => setTimeout(f, 5000));
}
if (!call) { console.log('\nRUN INCOMPLETE — call record never finalised for ' + id); process.exit(1); }
const turns = call.transcript_object || [];
const agentTurns = turns.filter((t) => t.role === 'agent'), userTurns = turns.filter((t) => t.role === 'user');
const durS = Math.round(((call.end_timestamp || 0) - (call.start_timestamp || 0)) / 1000);
const pub = await retellGet(`/get-agent/${call.agent_id}?version=${call.agent_version}`);

console.log(`\nCALL ${id}`);
console.log(`  call_type ${call.call_type} · agent ${call.agent_id} v${call.agent_version} · status ${call.call_status} · ${durS}s · disconnect ${call.disconnection_reason}`);
console.log(`  metadata ${JSON.stringify(call.metadata || {})}`);
console.log(`  first agent line: ${mask((agentTurns[0] || {}).content).slice(0, 140)}`);
console.log(`  first user line:  ${mask((userTurns[0] || {}).content).slice(0, 140)}`);
check(call.call_type === 'web_call', 'call_type web_call');
check(call.agent_id === 'agent_2d1d687eb85e6d5d0e720795c2', 'the (414) 775-0019 agent');
check(pub.ok && pub.body.is_published === true, 'agent_version is a PUBLISHED version', `v${call.agent_version}`);
check((call.metadata || {}).source === 'aichauffeur.ai/try', 'metadata.source = aichauffeur.ai/try');
check(agentTurns.length >= 1 && userTurns.length >= 1, 'transcript has an agent turn AND a user turn', `agent ${agentTurns.length} · user ${userTurns.length}`);
if (MODE === 'local') {
  check(Math.abs(durS - CAP / 1000) <= 12, 'call ended itself at the cap (agent_override works)', `${durS}s vs cap ${CAP / 1000}s`);
  check(/max_duration/i.test(String(call.disconnection_reason)), 'disconnect reason names the duration cap', String(call.disconnection_reason));
}
console.log(`\n${failed ? 'FAIL — ' + failed + ' check(s)' : 'ALL CHECKS PASS'}`);
process.exit(failed ? 1 : 0);
