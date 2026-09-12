// tools/aic-try/presolve-bench.mjs — what pre-solving the puzzle on load is worth.
//
//   node tools/aic-try/presolve-bench.mjs [--runs 3]
//
// Measures TAP -> THE CREATE-CALL REQUEST LEAVING THE PAGE, on v3 (the committed
// page at 5013e1d) and v4 (the working tree), at 4x CPU slowdown and Fast 3G.
//
// That span is the whole of what pre-solve changes. Everything after it — n8n's
// own checks, Retell creating the call, LiveKit joining — is byte-identical
// between the two versions, so measuring it twice would add noise and two real
// calls to the bill without adding evidence. The absolute tap-to-LIVE number for
// v4 comes from the one real call in call.mjs.
//
// The webhook is stubbed at the REAL difficulty (20 bits, ~1M hashes). A stub
// that hands out an easy puzzle measures nothing.

import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium, SITE, REPO, WEBHOOK_URL } from './lib.mjs';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const RUNS = Number(arg('--runs', '3'));
const OUT = path.join(REPO, 'audits', 'aic-try');
await mkdir(OUT, { recursive: true });

const V3 = execFileSync('git', ['show', '5013e1d:chauffeur/try/index.html'], { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 24 });
const V4 = execFileSync('git', ['show', ':chauffeur/try/index.html'], { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 24 });
const { readFile } = await import('node:fs/promises');
const V4NOW = await readFile(path.join(REPO, 'chauffeur', 'try', 'index.html'), 'utf8');

// Fast 3G, as Chrome's own throttling profile defines it.
const NET = { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 };
const CPU = 4;

const browser = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });

async function once(html) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.grantPermissions(['microphone'], { origin: SITE });
  // The page itself, and every same-origin asset it asks for.
  await context.route(`${SITE}/**`, async (route) => {
    const u = new URL(route.request().url());
    if (u.pathname === '/try/' || u.pathname === '/try/index.html') {
      return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html });
    }
    const file = path.join(REPO, 'chauffeur', decodeURIComponent(u.pathname));
    try {
      const body = await readFile(file);
      const ext = path.extname(file);
      const type = { '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' }[ext] || 'application/octet-stream';
      return route.fulfill({ status: 200, body, headers: { 'content-type': type } });
    } catch { return route.fulfill({ status: 404, body: '' }); }
  });

  let tTap = 0, tCall = 0;
  await context.route(WEBHOOK_URL, (route) => {
    const posted = route.request().postData() || '';
    const headers = { 'access-control-allow-origin': SITE, 'cache-control': 'no-store' };
    if (/step=challenge/.test(posted)) {
      return route.fulfill({ status: 200, headers, contentType: 'application/json',
        body: JSON.stringify({ nonce: Math.random().toString(16).slice(2).padEnd(32, '0').slice(0, 32), bits: 20 }) });
    }
    if (!tCall) tCall = Date.now();
    return route.fulfill({ status: 429, headers, contentType: 'application/json', body: '{"error":"rate_limited"}' });
  });

  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', NET);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });

  await page.goto(`${SITE}/try/`, { waitUntil: 'load' });
  // The reader is reading. Both versions get exactly the same pause; only v4
  // does anything with it.
  await page.waitForTimeout(12000);

  const b = await page.evaluate(() => { const r = document.getElementById('try-btn').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; });
  await page.mouse.move(b.x, b.y);
  await page.waitForTimeout(80);
  tTap = Date.now();
  await page.mouse.down();
  await page.mouse.up();

  await page.waitForFunction(() => document.getElementById('try-tag').dataset.state === 'failed', null, { timeout: 90000 }).catch(() => {});
  await context.close();
  return tCall ? tCall - tTap : null;
}

const rows = {};
for (const [name, html] of [['v3 (5013e1d)', V3], ['v4 (this run)', V4NOW]]) {
  const ms = [];
  for (let i = 0; i < RUNS; i++) {
    const t = await once(html);
    ms.push(t);
    console.log(`  ${name} run ${i + 1}: ${t == null ? 'no create-call request' : t + 'ms'}`);
  }
  const good = ms.filter((x) => x != null).sort((a, b) => a - b);
  rows[name] = { runs: ms, median: good.length ? good[Math.floor(good.length / 2)] : null };
}
await browser.close();

// THE TERM THE STUB GIVES v3 FOR FREE.
// route.fulfill answers from inside Playwright and never touches the network, so
// the emulated Fast 3G latency is not applied to it. v3 fetches its nonce AFTER
// the tap and therefore really does pay a round trip to n8n there; v4 paid it
// while the reader was reading. Measuring it on the wire is the only honest way
// to put it back into the comparison.
const rtt = [];
for (let i = 0; i < 5; i++) {
  const t = Date.now();
  await fetch('https://circulant.app.n8n.cloud/webhook/7b9e6dee2ce9ce780673725e0448791f', {
    method: 'POST', cache: 'no-store',
    headers: { Origin: SITE, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ step: 'challenge' }),
  }).then((r) => r.json()).catch(() => null);
  rtt.push(Date.now() - t);
  await new Promise((f) => setTimeout(f, 400));
}
const rttSorted = [...rtt].sort((x, y) => x - y);
const rttMed = rttSorted[Math.floor(rttSorted.length / 2)];

console.log('\nTAP -> CREATE-CALL REQUEST   4x CPU slowdown, Fast 3G, 390x844');
for (const [k, v] of Object.entries(rows)) console.log(`  ${k.padEnd(16)} median ${v.median}ms   [${v.runs.join(', ')}]`);
const a = rows['v3 (5013e1d)'].median, b = rows['v4 (this run)'].median;
if (a && b) console.log(`\n  measured on the stub:  ${a}ms -> ${b}ms   ${(a / b).toFixed(1)}x faster`);
console.log(`  live challenge round trip, wired: median ${rttMed}ms  [${rtt.join(', ')}]`);
if (a && b) console.log(`  so a real v3 tap pays about ${a}ms of hashing PLUS that round trip; a v4 tap pays ${b}ms and neither.`);
const gate = b != null && b <= 3000;
console.log(`\n  GATE tap-to-create <= 3000ms: ${gate ? 'PASS' : 'FAIL'} (${b}ms)`);
await writeFile(path.join(OUT, 'presolve-bench.json'), JSON.stringify({ cpu: CPU, net: 'Fast 3G', runs: RUNS, rows, liveChallengeRttMs: rtt, liveChallengeRttMedian: rttMed }, null, 2));
console.log(`  written: audits/aic-try/presolve-bench.json`);
process.exit(gate ? 0 : 1);
