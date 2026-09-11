// tools/aic-try/render.mjs — the /try render + failure-path gate. Creates NO calls.
//
//   node tools/aic-try/render.mjs            # chauffeur/ served locally as https://aichauffeur.ai
//   node tools/aic-try/render.mjs --prod     # the live page
//
// Per width (320, 390, 430, 1440): horizontal overflow, rendered-pixel AA contrast
// on every text node, the 12px floor, console/page errors, "retell" in visible text.
// Then the failure paths in a real browser, none of which reaches Retell:
//   in-app user agent -> banner · mic blocked -> mic line · SDK blocked -> phone line
//   /api/web-call 429 -> phone line
// Negative control first: a fixture that overflows and fails contrast must be caught.

import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium, SITE, REPO, serveLocal, TURNSTILE_STUB, TURNSTILE_ERROR_STUB, TURNSTILE_URL, probe } from './lib.mjs';

const PROD = process.argv.includes('--prod');
const OUT = path.join(REPO, 'audits', 'aic-try');
await mkdir(OUT, { recursive: true });
const URL_TRY = `${SITE}/try/`;
const WIDTHS = [[320, 700], [390, 844], [430, 932], [1440, 900]];

// Two browsers, because headless Chromium only grants the mic through the
// fake-UI flag (a Playwright permission grant answers NotSupportedError). The
// plain one is the "mic blocked" visitor; the fake-UI one says yes to the mic.
const browser = await chromium.launch({ args: ['--use-fake-device-for-media-stream'] });
const browserMic = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
let failed = 0;
const check = (ok, label, detail = '') => { if (!ok) failed++; console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`); };

async function newPage(opts = {}, { turnstileStub = !PROD, b = browser } = {}) {
  const context = await b.newContext(opts);
  if (!PROD) await serveLocal(context, opts.api);
  if (turnstileStub) await context.route(TURNSTILE_URL, (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: TURNSTILE_STUB }));
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e.message).slice(0, 160)));
  return { context, page, errors };
}

console.log(`/try render gate — ${PROD ? 'PRODUCTION' : 'LOCAL (chauffeur/ as ' + SITE + ')'}\n`);

// ── negative control ────────────────────────────────────────────────────────
{
  const { context, page } = await newPage({ viewport: { width: 390, height: 844 } }, { turnstileStub: false });
  await page.setContent('<body style="margin:0;background:rgb(7,11,20)"><p style="color:rgb(20,24,34);width:600px">low contrast and too wide</p></body>');
  const p = await probe(page);
  const caught = p.failures.length > 0 && p.scrollWidth > p.innerWidth;
  console.log(`NEGATIVE CONTROL  ${caught ? 'PASS  broken fixture caught (contrast ' + p.minRatio + ', width ' + p.scrollWidth + ')' : 'ABORT  the probe cannot fail'}`);
  await context.close();
  if (!caught) { await browser.close(); process.exit(2); }
}

// ── widths ──────────────────────────────────────────────────────────────────
for (const [w, h] of WIDTHS) {
  console.log(`\n${w}x${h}`);
  const { context, page, errors } = await newPage({ viewport: { width: w, height: h } });
  await page.goto(URL_TRY, { waitUntil: 'load' });
  await page.waitForTimeout(3500); // idle preload of the SDK + Turnstile has run
  const p = await probe(page);
  check(p.scrollWidth <= p.innerWidth, 'no horizontal overflow', `scrollWidth ${p.scrollWidth} / viewport ${p.innerWidth}`);
  check(p.failures.length === 0, 'AA contrast on every text node', `min ${p.minRatio}:1 over ${p.rows.length} nodes` + (p.failures.length ? ' ' + JSON.stringify(p.failures.slice(0, 3)) : ''));
  check(p.under12.length === 0, '12px floor', p.under12.length ? JSON.stringify(p.under12.slice(0, 3)) : '');
  check(!p.retellVisible, '"retell" absent from visible text and title');
  check(errors.length === 0, 'zero console / page errors', errors.slice(0, 3).join(' | '));
  if (w === 390) check(p.btn && p.btn.bottom <= h, 'button inside the 390x844 fold', p.btn ? `bottom ${p.btn.bottom}px, height ${p.btn.height}px` : 'no button');
  if (w === 390) {
    check(p.title === 'Try AI Chauffeur in your browser | AI Chauffeur', 'title', p.title);
    check(p.robots === 'noindex,follow', 'robots noindex,follow', p.robots);
    check(p.canonical === 'https://aichauffeur.ai/try/', 'canonical', p.canonical);
  }
  await page.screenshot({ path: path.join(OUT, `${PROD ? 'prod' : 'local'}-${w}.png`), fullPage: true });
  await context.close();
}

// ── failure paths (no call is ever created) ─────────────────────────────────
console.log('\nFAILURE PATHS');
const tagState = (page) => page.evaluate(() => document.getElementById('try-tag').dataset.state);
const noteText = (page) => page.evaluate(() => document.getElementById('try-note').textContent);
const telInNote = (page) => page.evaluate(() => !!document.querySelector('#try-note a[href="tel:+14147750019"]'));

{ // in-app browser
  const { context, page } = await newPage({ viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [LinkedInApp]/9.31.1' });
  await page.goto(URL_TRY, { waitUntil: 'load' });
  const banner = await page.isVisible('#try-inapp');
  const above = await page.evaluate(() => document.getElementById('try-inapp').getBoundingClientRect().bottom <= document.getElementById('try-btn').getBoundingClientRect().top);
  check(banner && above, 'in-app user agent shows the banner above the button');
  await page.screenshot({ path: path.join(OUT, `${PROD ? 'prod' : 'local'}-inapp-390.png`) });
  await context.close();
}
{ // mic blocked: no permission granted, so getUserMedia rejects
  const { context, page } = await newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(URL_TRY, { waitUntil: 'load' });
  await page.click('#try-btn');
  await page.waitForFunction(() => document.getElementById('try-tag').dataset.state === 'failed', null, { timeout: 15000 }).catch(() => {});
  const s = await tagState(page), n = await noteText(page);
  check(s === 'failed' && n.startsWith("We couldn't reach your mic.") && await telInNote(page), 'mic blocked -> NOT CONNECTED + mic line + tel link', `${s} | ${n}`);
  await page.screenshot({ path: path.join(OUT, `${PROD ? 'prod' : 'local'}-micdenied-390.png`) });
  await context.close();
}
{ // SDK blocked at the CDN
  const { context, page } = await newPage({ viewport: { width: 390, height: 844 } }, { b: browserMic });
  await context.route(/cdn\.jsdelivr\.net/, (r) => r.abort());
  await page.goto(URL_TRY, { waitUntil: 'load' });
  await page.click('#try-btn');
  await page.waitForFunction(() => document.getElementById('try-tag').dataset.state === 'failed', null, { timeout: 30000 }).catch(() => {});
  const s = await tagState(page), n = await noteText(page);
  check(s === 'failed' && n.startsWith("The call didn't start.") && await telInNote(page), 'SDK load failure -> NOT CONNECTED + phone line', `${s} | ${n}`);
  await context.close();
}
{ // Turnstile refuses (110200, a domain missing from the widget): the phone line
  // must arrive in seconds, and no request may reach the function
  const { context, page } = await newPage({ viewport: { width: 390, height: 844 } }, { b: browserMic, turnstileStub: false });
  await context.route(TURNSTILE_URL, (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: TURNSTILE_ERROR_STUB }));
  let posted = false;
  page.on('request', (r) => { if (r.url().endsWith('/api/web-call')) posted = true; });
  await page.goto(URL_TRY, { waitUntil: 'load' });
  await page.waitForTimeout(3500);
  const t0 = Date.now();
  await page.click('#try-btn');
  await page.waitForFunction(() => document.getElementById('try-tag').dataset.state === 'failed', null, { timeout: 30000 }).catch(() => {});
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  const s = await tagState(page), n = await noteText(page);
  check(s === 'failed' && n.startsWith("The call didn't start.") && Number(secs) <= 6 && !posted,
    'Turnstile refusal -> phone line within 6 s, nothing sent to the function', `${secs}s | ${s} | posted=${posted}`);
  await context.close();
}
{ // the function refuses (429)
  const { context, page } = await newPage({ viewport: { width: 390, height: 844 } }, { b: browserMic });
  await context.route(`${SITE}/api/web-call`, (r) => r.fulfill({ status: 429, contentType: 'application/json', body: '{"error":"rate_limited"}' }));
  await page.goto(URL_TRY, { waitUntil: 'load' });
  await page.click('#try-btn');
  await page.waitForFunction(() => document.getElementById('try-tag').dataset.state === 'failed', null, { timeout: 45000 }).catch(() => {});
  const s = await tagState(page), n = await noteText(page);
  check(s === 'failed' && n.startsWith("The call didn't start."), '/api/web-call 429 -> NOT CONNECTED + phone line', `${s} | ${n}`);
  await page.screenshot({ path: path.join(OUT, `${PROD ? 'prod' : 'local'}-failed-390.png`) });
  await context.close();
}

await browser.close();
await browserMic.close();
console.log(`\n${failed ? 'FAIL — ' + failed + ' check(s)' : 'ALL CHECKS PASS'}`);
process.exit(failed ? 1 : 0);
