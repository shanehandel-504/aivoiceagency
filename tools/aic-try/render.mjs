// tools/aic-try/render.mjs — the /try render + failure-path gate. Creates NO calls:
// every test stubs the n8n webhook, so nothing here reaches Retell or spends this
// machine's per-IP allowance.
//
//   node tools/aic-try/render.mjs            # chauffeur/ served locally as https://aichauffeur.ai
//   node tools/aic-try/render.mjs --prod     # the live page
//   node tools/aic-try/render.mjs --base <ref>   # also prove nothing else moved since <ref>
//
// Per width (320, 390, 430, 1440): horizontal overflow, rendered-pixel AA contrast
// on every text node, the 12px floor, console/page errors, the banned-word gate.
// Then the live surfaces (the v7 push button at DPR 2, pre-solve, focus mode,
// sound, haptics, the ticket card and the player) and the failure paths:
//   in-app user agent -> banner · mic blocked -> mic line · SDK blocked -> phone line
//   webhook refuses the proof -> phone line · webhook 429 -> phone line
// Negative control first: a fixture that overflows and fails contrast must be caught.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { chromium, SITE, REPO, serveLocal, webhookStub, WEBHOOK_URL, probe, BTN_FACE, STATE_RECORDER } from './lib.mjs';

const PROD = process.argv.includes('--prod');
const BASE = (() => { const i = process.argv.indexOf('--base'); return i > 0 ? process.argv[i + 1] : null; })();
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
// The analytics script (/_vercel/insights/script.js) 404s until Web Analytics is
// enabled on the Vercel project. That one resource is counted and reported as a
// WARN at the end; every other console error still fails. (2026-09-13)
let insights404 = 0;
const check = (ok, label, detail = '') => { if (!ok) failed++; console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`); };

async function newPage(opts = {}, { b = browser, answer, receipt } = {}) {
  const context = await b.newContext(opts);
  if (!PROD) await serveLocal(context);
  await context.route(WEBHOOK_URL, (route) => {
    if (/\/webhook\/try\/receipt/.test(route.request().url())) {
      const headers = { 'access-control-allow-origin': SITE, 'cache-control': 'no-store' };
      if (!receipt) return route.fulfill({ status: 404, headers, contentType: 'application/json', body: '{"error":"not_found"}' });
      return route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify(receipt) });
    }
    return webhookStub(answer)(route);
  });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    // exact: a failed LOAD of the insights script; an error thrown from that URL still fails
    if (/^Failed to load resource/.test(m.text()) && ((m.location() || {}).url || '').includes('/_vercel/insights/')) { insights404++; return; }
    errors.push(m.text().slice(0, 160));
  });
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e.message).slice(0, 160)));
  return { context, page, errors };
}

// PUSHING THE BUTTON, THE WAY A POINTER DOES.
// The gate drives the real mouse, not page.click(): arriving on the control
// pauses its light and pressing it kills the light and lands the site's drop,
// so hover and press are exercised the way a pointer exercises them. (Until v7
// the control also breathed in size, which page.click()'s wait for a "stable"
// box could never satisfy.)
// 'instant' is load-bearing: aic.css sets html{scroll-behavior:smooth} and
// behavior:'auto' means "use the CSS value", so the scroll animates and the
// rect is read while it is still moving.
export async function push(page, sel = '#try-btn') {
  const b = await page.evaluate(async (s) => {
    const el = document.querySelector(s);
    el.scrollIntoView({ block: 'center', behavior: 'instant' });
    await new Promise((f) => setTimeout(f, 200));
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  }, sel);
  await page.mouse.move(b.x, b.y);
  await page.waitForTimeout(80);
  await page.mouse.down();
  await page.mouse.up();
}

console.log(`/try render gate — ${PROD ? 'PRODUCTION' : 'LOCAL (chauffeur/ as ' + SITE + ')'}\n`);

// ── negative control ────────────────────────────────────────────────────────
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.setContent('<body style="margin:0;background:rgb(7,11,20)"><p style="color:rgb(20,24,34);width:600px">low contrast and too wide</p></body>');
  const p = await probe(page);
  const caught = p.failures.length > 0 && p.scrollWidth > p.innerWidth;
  console.log(`NEGATIVE CONTROL  ${caught ? 'PASS  broken fixture caught (contrast ' + p.minRatio + ', width ' + p.scrollWidth + ')' : 'ABORT  the probe cannot fail'}`);
  await context.close();
  if (!caught) { await browser.close(); await browserMic.close(); process.exit(2); }
}
// the console filter forgives ONE resource; a failed load of anything else must still fail
{
  const { context, page, errors } = await newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(URL_TRY, { waitUntil: 'load' });
  await page.evaluate(() => { const s = document.createElement('script'); s.src = '/negative-control-missing.js'; document.head.appendChild(s); });
  await page.waitForTimeout(800);
  const caught = errors.some((e) => /Failed to load resource/.test(e));
  console.log(`NEGATIVE CONTROL  ${caught ? 'PASS  a failed load that is not the analytics script still fails' : 'ABORT  the console filter forgives more than the analytics script'}`);
  await context.close();
  if (!caught) { await browser.close(); await browserMic.close(); process.exit(2); }
}

// ── the words ───────────────────────────────────────────────────────────────
// Two scopes, and the difference is the point. "100%" is in every stylesheet
// ever written and "retell" is in the SDK's own URL, so those two are judged on
// what a visitor can SEE. The name is judged on the whole file, because it can be.
const SEEN = ['booked', 'confirmed', 'locked in', 'nobody', 'sounds human', 'seamless', 'revolutionary', 'game-changing', '100%', 'retell'];
{
  console.log('\nTHE WORDS');
  const { context, page } = await newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(URL_TRY, { waitUntil: 'load' });
  const seen = await page.evaluate(() => {
    const metas = [...document.querySelectorAll('meta[name],meta[property]')].map((m) => m.content || '').join(' ~ ');
    return (document.body.innerText + ' ~ ' + document.title + ' ~ ' + metas).toLowerCase();
  });
  for (const w of SEEN) check(!seen.includes(w), `"${w}" is absent from everything a visitor can read`);
  const src = (await page.content());
  check(!/\bAVA\b/.test(src) && !/\bAva\b/.test(src), 'the name appears NOWHERE in the page source, not only on screen');
  const words = await page.evaluate(() => ({
    h1: document.querySelector('h1').textContent,
    sub: document.querySelector('.try-sub').textContent,
    rec: document.querySelector('.try-rec').textContent.trim(),
    btn: document.getElementById('try-btn').textContent,
    hint: document.querySelector('.try-hint').textContent,
    lvl: document.querySelector('.try-lvl-tag').textContent,
    tl: document.querySelector('.try-tl').textContent,
    empty: document.getElementById('try-empty').textContent,
    title: document.title,
    og: (document.querySelector('meta[property="og:description"]') || {}).content,
    tw: (document.querySelector('meta[name="twitter:description"]') || {}).content,
    ogt: (document.querySelector('meta[property="og:title"]') || {}).content,
    twt: (document.querySelector('meta[name="twitter:title"]') || {}).content,
  }));
  const want = {
    h1: "Push the button. Book a trip like you're the customer.",
    sub: 'This is the AI Chauffeur demo. Act like a customer, answer its questions. About two minutes.',
    rec: 'Recorded so you can hear it back — right here when the call ends. · Privacy',
    btn: 'PUSH TO BOOK',
    hint: 'Not a phone call. AI Chauffeur talks to you right here on this page — push once, then just talk. Stop any time.',
    lvl: 'AGENT',
    tl: 'TRANSCRIPT',
    empty: 'Your conversation shows up here.',
    ogt: 'Try AI Chauffeur in your browser',
    twt: 'Try AI Chauffeur in your browser',
    og: "Push the button and book a trip like you're the customer.",
    tw: "Push the button and book a trip like you're the customer.",
  };
  for (const k of Object.keys(want)) {
    const got = k === 'rec' ? words.rec.replace(/\s+/g, ' ') : words[k];
    check(got === want[k], `locked copy · ${k}`, got === want[k] ? '' : `got "${got}"`);
  }
  // v4.1 REMOVED these. Judged on the served source, not only on what renders,
  // because "hidden" is not "removed".
  const GONE = ['Read one of these', 'try it as the passenger', "There's no right way to ask", 'Push. Talk. Trip sheet sent.',
    'I need a ride to the airport tomorrow morning at six', 'I need a Sprinter for ten people to the airport',
    'I need a car for four hours Saturday night', 'try-chip', 'try-prompts', 'try-role', 'try_chip_read'];
  const served = PROD ? await (await fetch(URL_TRY, { cache: 'no-store' })).text() : await readFile(path.join(REPO, 'chauffeur', 'try', 'index.html'), 'utf8');
  for (const g of GONE) check(!src.includes(g) && !served.includes(g), `removed · "${g}" is absent from the built page`);
  await context.close();
}

// ── widths ──────────────────────────────────────────────────────────────────
for (const [w, h] of WIDTHS) {
  console.log(`\n${w}x${h}`);
  const { context, page, errors } = await newPage({ viewport: { width: w, height: h } });
  await page.goto(URL_TRY, { waitUntil: 'load' });
  await page.waitForTimeout(3500); // the idle preload of the SDK has run
  const p = await probe(page);
  check(p.scrollWidth <= p.innerWidth, 'no horizontal overflow', `scrollWidth ${p.scrollWidth} / viewport ${p.innerWidth}`);
  check(p.failures.length === 0, 'AA contrast on every text node', `min ${p.minRatio}:1 over ${p.rows.length} nodes` + (p.failures.length ? ' ' + JSON.stringify(p.failures.slice(0, 3)) : ''));
  check(p.under12.length === 0, '12px floor', p.under12.length ? JSON.stringify(p.under12.slice(0, 3)) : '');
  check(!p.retellVisible, 'the SDK vendor is absent from visible text and title');
  check(errors.length === 0, 'zero console / page errors', errors.slice(0, 3).join(' | '));
  // AT REST: exactly five things plus the one small line. Every visible leaf —
  // an image, a control, or an element carrying its own text — is named by the
  // block it belongs to, and the set must be exactly this one.
  const rest = await page.evaluate(() => {
    const shown = (el) => {
      if (!el.getClientRects().length) return false;
      for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') return false; }
      return true;
    };
    const BLOCKS = { '.try-brand': 'wordmark', '.try-h': 'headline', '.try-sub': 'sub-line', '.try-push': 'button', '.try-hint': 'small line', '.try-rec': 'recording line' };
    const seen = new Set(), stray = [];
    for (const el of document.body.querySelectorAll('*')) {
      const leaf = el.tagName === 'IMG' || el.tagName === 'BUTTON' || [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!leaf || !shown(el) || el.closest('[aria-hidden="true"]')) continue;
      const hit = Object.keys(BLOCKS).find((s) => el.closest(s));
      if (hit) seen.add(BLOCKS[hit]); else stray.push((el.id || el.className || el.tagName) + ': ' + (el.textContent || '').trim().slice(0, 30));
    }
    const panel = document.querySelector('.try-panel');
    // .try-act and not .try-push: the parent block is the column's edge; the
    // push itself is judged in PUSH BUTTON v7.
    const box = (s) => { const r = document.querySelector(s).getBoundingClientRect(); return { l: Math.round(r.left), w: Math.round(r.width) }; };
    return { seen: [...seen], stray, panelHidden: !!panel && !panel.getClientRects().length,
      cols: ['.try-brand', '.try-h', '.try-sub', '.try-act', '.try-hint', '.try-rec'].map(box) };
  });
  const FIVE = ['wordmark', 'headline', 'sub-line', 'button', 'small line', 'recording line'];
  check(rest.stray.length === 0 && FIVE.every((f) => rest.seen.includes(f)) && rest.seen.length === 6,
    'at rest: the five things + the small line, and nothing else', rest.stray.length ? 'STRAY ' + JSON.stringify(rest.stray.slice(0, 4)) : rest.seen.join(' · '));
  check(rest.panelHidden, 'at rest: the panel does not exist on screen');
  const lefts = new Set(rest.cols.map((c) => c.l));
  check(lefts.size === 1 && rest.cols.every((c) => c.w <= 720), 'one column, every block on one left edge, nothing wider than 720px', JSON.stringify(rest.cols));
  if (w === 1440) {
    const wrap = await page.evaluate(() => { const r = document.querySelector('.try-wrap').getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right) }; });
    check(Math.abs((wrap.l + wrap.r) / 2 - w / 2) <= 1 && wrap.r - wrap.l <= 720, 'desktop: the column is centred and 720px at most', `${wrap.l}–${wrap.r}`);
  }
  if (w === 390) {
    check(p.btn && p.btn.top < 560, 'button top edge above 560px at 390x844', p.btn ? `top ${p.btn.top}px, height ${p.btn.height}px` : 'no button');
    check(p.title === 'Try AI Chauffeur in your browser | AI Chauffeur', 'title', p.title);
    check(p.robots === 'noindex,follow', 'robots noindex,follow', p.robots);
    check(p.canonical === 'https://aichauffeur.ai/try/', 'canonical', p.canonical);
    // WCAG 2.5.8 exempts a link sitting inline in a sentence — the Privacy link
    // in the recording line is one, and enlarging it would break the line it is
    // written into. The brand lockup is a block link and is unchanged from v3.
    const touch = await page.evaluate(() => [...document.querySelectorAll('button,a.btn,input:not([type=hidden])')]
      .filter((e) => e.offsetParent !== null && !e.hasAttribute('aria-hidden'))
      .map((e) => { const r = e.getBoundingClientRect(); return { t: (e.textContent || e.id).trim().slice(0, 24), w: Math.round(r.width), h: Math.round(r.height) }; })
      .filter((e) => e.h > 0 && e.h < 44));
    check(touch.length === 0, 'every button is at least 44px tall', JSON.stringify(touch));
  }
  await page.screenshot({ path: path.join(OUT, `${PROD ? 'prod' : 'local'}-${w}.png`), fullPage: true });
  await context.close();
}

// ── v4 behaviour ────────────────────────────────────────────────────────────
console.log('\nALIVE');
{
  const { context, page } = await newPage({ viewport: { width: 390, height: 844 } }, { b: browserMic });
  await page.goto(URL_TRY, { waitUntil: 'load' });
  await page.waitForTimeout(3500);
  const br = await page.evaluate(() => {
    const b = getComputedStyle(document.getElementById('try-btn'));
    return { name: b.animationName, dur: b.animationDuration, wrap: getComputedStyle(document.querySelector('.try-push')).animationName };
  });
  check(br.name === 'try-glow' && br.dur === '3.2s', 'the button pulses light on a 3.2s loop at READY', `${br.name} ${br.dur}`);
  check(br.wrap === 'none', 'and nothing breathes in size: the wrapper carries no animation', br.wrap);

  // The dim is a 300ms transition, so it is read AFTER it has settled.
  // getComputedStyle in the same tick returns the value mid-flight, which is
  // how a working fade reads as "no fade at all".
  const focus = await page.evaluate(async () => {
    const r = document.querySelector('.try');
    r.dataset.focus = 'true';
    await new Promise((f) => setTimeout(f, 500));
    const dim = getComputedStyle(document.querySelector('.try-tell')).opacity;
    const panel = getComputedStyle(document.querySelector('.try-panel')).opacity;
    r.dataset.focus = 'false';
    return { dim, panel };
  });
  check(focus.dim === '0.63' && focus.panel === '1', 'focus mode steps the surround back and leaves the instrument at full', JSON.stringify(focus));

  // The mute lives in the panel, which is hidden at rest. Its behaviour is
  // judged on the element; its placement is judged in THE PUSH below.
  const mute = await page.evaluate(async () => {
    const b = document.getElementById('try-mute');
    const before = b.getAttribute('aria-pressed');
    b.click();
    await new Promise((r) => setTimeout(r, 50));
    return { before, after: b.getAttribute('aria-pressed'), stored: localStorage.getItem('aic.try.sound') };
  });
  check(mute.before === 'false' && mute.after === 'true' && mute.stored === 'off', 'the mute toggle writes to localStorage', JSON.stringify(mute));
  await page.reload({ waitUntil: 'load' });
  const kept = await page.evaluate(() => document.getElementById('try-mute').getAttribute('aria-pressed'));
  check(kept === 'true', 'and it survives a reload', kept);

  const hap = await page.evaluate(async () => {
    // back to the top first: elementFromPoint works in viewport coordinates,
    // and a scrolled page reads "nothing" at the button's centre.
    window.scrollTo(0, 0);
    await new Promise((f) => setTimeout(f, 250));
    const h = document.getElementById('try-haptic');
    const s = getComputedStyle(h);
    const r = h.getBoundingClientRect();
    const btn = document.getElementById('try-btn');
    const b = btn.getBoundingClientRect();
    const hit = document.elementFromPoint(Math.round(b.left + b.width / 2), Math.round(b.top + b.height / 2));
    return {
      hidden: h.getAttribute('aria-hidden'), tab: h.tabIndex, pe: s.pointerEvents,
      op: s.opacity, area: Math.round(r.width * r.height),
      hit: hit ? (hit.id || hit.className || hit.tagName) : 'nothing',
      isBtn: hit === btn,
    };
  });
  check(hap.hidden === 'true' && hap.tab === -1 && hap.pe === 'none', 'the haptic switch is hidden from tab order and assistive tech', JSON.stringify(hap));
  check(hap.isBtn === true, 'and the button is still the only thing under the finger', `hit ${hap.hit}`);
  await context.close();
}

// ── the push, stubbed ───────────────────────────────────────────────────────
// One push against a webhook that holds the create step open for six seconds,
// so CONNECTING can be looked at. No call exists at any point.
console.log('\nTHE PUSH');
{
  const { context, page, errors } = await newPage({ viewport: { width: 390, height: 844 } }, { b: browserMic, answer: { status: 403, body: { error: 'verification' }, delay: 6000 } });
  await page.goto(URL_TRY, { waitUntil: 'load' });
  await page.waitForTimeout(3500);
  await push(page);
  const tPush = Date.now();
  await page.waitForFunction(() => document.getElementById('try-tag').dataset.state === 'connecting', null, { timeout: 5000 }).catch(() => {});
  const at = await page.evaluate(() => {
    const panel = document.getElementById('try-panel');
    const s = getComputedStyle(panel);
    const pr = panel.getBoundingClientRect(), br = document.getElementById('try-btn').getBoundingClientRect();
    return { state: document.getElementById('try-tag').dataset.state, hidden: panel.hidden, shown: panel.getClientRects().length > 0,
      anim: s.animationName, dur: parseFloat(s.animationDuration) * 1000, under: Math.round(pr.top) >= Math.round(br.bottom),
      focus: document.querySelector('.try').dataset.focus, note: document.getElementById('try-note').textContent,
      chips: !!document.querySelector('.try-chip, .try-chips, .try-prompts, .try-role, .try-cl') };
  });
  check(at.state === 'connecting' && !at.hidden && at.shown, 'push -> the panel exists', `${at.state} after ${Date.now() - tPush}ms`);
  check(at.anim === 'try-unfold' && at.dur > 0 && at.dur <= 300, 'and it unfolds in 300ms or less', `${at.anim} ${at.dur}ms`);
  check(at.under, 'and it unfolds UNDER the button');
  check(at.note === 'Your browser will ask to use your mic. Choose Allow.', 'the mic hint shows in CONNECTING', at.note);
  check(!at.chips, 'the chips region does not exist in the DOM');
  await page.waitForTimeout(500);
  const f = await page.evaluate(() => ({ focus: document.querySelector('.try').dataset.focus,
    tell: getComputedStyle(document.querySelector('.try-tell')).opacity, rec: getComputedStyle(document.querySelector('.try-rec')).opacity,
    panel: getComputedStyle(document.getElementById('try-panel')).opacity }));
  check(f.focus === 'true' && f.tell === '0.63' && f.rec === '0.63' && f.panel === '1', 'focus mode applies: surround at .63, panel at full', JSON.stringify(f));
  const p = await probe(page);
  check(p.failures.length === 0, 'AA contrast on every text node in CONNECTING, dim included', `min ${p.minRatio}:1 over ${p.rows.length} nodes` + (p.failures.length ? ' ' + JSON.stringify(p.failures.slice(0, 3)) : ''));
  check(p.scrollWidth <= p.innerWidth, 'no horizontal overflow with the panel open', `${p.scrollWidth}/${p.innerWidth}`);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: path.join(OUT, `${PROD ? 'prod' : 'local'}-push-390.png`) });
  await page.waitForFunction(() => document.getElementById('try-tag').dataset.state === 'failed', null, { timeout: 15000 }).catch(() => {});
  const end = await page.evaluate(() => ({ state: document.getElementById('try-tag').dataset.state, panel: !document.getElementById('try-panel').hidden }));
  check(end.state === 'failed' && end.panel, 'the refusal lands in the panel, which stays open', JSON.stringify(end));
  check(errors.filter((e) => !/403|Failed to load resource/.test(e)).length === 0, 'zero console errors beyond the 403 the stub asks for', errors.slice(0, 3).join(' | '));
  await context.close();
}

// ── the receipt, rendered ───────────────────────────────────────────────────
console.log('\nTHE RECEIPT');
{
  const { context, page } = await newPage({ viewport: { width: 390, height: 844 } }, { b: browserMic });
  await page.goto(URL_TRY, { waitUntil: 'load' });
  const at = await page.evaluate(() => ({
    result: document.getElementById('try-result').hidden,
    ticket: document.getElementById('try-ticket').hidden,
    player: document.getElementById('try-player').hidden,
  }));
  check(at.result && at.ticket && at.player, 'nothing about a trip is on screen before a call has happened', JSON.stringify(at));
  await context.close();
}

// ── failure paths (the webhook is stubbed in every one) ─────────────────────
console.log('\nFAILURE PATHS');
const tagState = (page) => page.evaluate(() => document.getElementById('try-tag').dataset.state);
const noteText = (page) => page.evaluate(() => document.getElementById('try-note').textContent);
const telInNote = (page) => page.evaluate(() => !!document.querySelector('#try-note a[href="tel:+14147750019"]'));
const waitFailed = (page, ms) => page.waitForFunction(() => document.getElementById('try-tag').dataset.state === 'failed', null, { timeout: ms }).catch(() => {});

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
  await push(page);
  await waitFailed(page, 15000);
  const s = await tagState(page), n = await noteText(page);
  check(s === 'failed' && n.startsWith("We couldn't reach your mic.") && await telInNote(page), 'mic blocked -> NOT CONNECTED + mic line + tel link', `${s} | ${n}`);
  await page.screenshot({ path: path.join(OUT, `${PROD ? 'prod' : 'local'}-micdenied-390.png`) });
  await context.close();
}
{ // SDK blocked at the CDN
  const { context, page } = await newPage({ viewport: { width: 390, height: 844 } }, { b: browserMic });
  await context.route(/cdn\.jsdelivr\.net/, (r) => r.abort());
  await page.goto(URL_TRY, { waitUntil: 'load' });
  await push(page);
  await waitFailed(page, 30000);
  const s = await tagState(page), n = await noteText(page);
  check(s === 'failed' && n.startsWith("The call didn't start.") && await telInNote(page), 'SDK load failure -> NOT CONNECTED + phone line', `${s} | ${n}`);
  await context.close();
}
{ // the webhook refuses the proof — and this is where pre-solve is measured
  const { context, page } = await newPage({ viewport: { width: 390, height: 844 } }, { b: browserMic, answer: { status: 403, body: { error: 'verification' } } });
  let challenges = 0, tFirstChallenge = 0;
  page.on('request', (r) => {
    if (WEBHOOK_URL.test(r.url()) && /step=challenge/.test(r.postData() || '')) { challenges++; if (!tFirstChallenge) tFirstChallenge = Date.now(); }
  });
  const tLoad = Date.now();
  await page.goto(URL_TRY, { waitUntil: 'load' });
  await page.waitForTimeout(3500);
  check(challenges >= 1, 'a nonce is fetched on LOAD, before anything is tapped', `${challenges} challenge(s), first at +${tFirstChallenge ? tFirstChallenge - tLoad : '-'}ms`);
  const t0 = Date.now();
  await push(page);
  await waitFailed(page, 30000);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  const s = await tagState(page);
  check(s === 'failed' && Number(secs) <= 10, 'webhook refuses the proof -> phone line', `${secs}s`);
  await context.close();
}
{ // the webhook is out of allowance (429)
  const { context, page } = await newPage({ viewport: { width: 390, height: 844 } }, { b: browserMic, answer: { status: 429, body: { error: 'rate_limited' } } });
  await page.goto(URL_TRY, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  await push(page);
  await waitFailed(page, 30000);
  const s = await tagState(page), n = await noteText(page);
  check(s === 'failed' && n.startsWith("The call didn't start."), 'webhook 429 -> NOT CONNECTED + phone line', `${s} | ${n}`);
  await page.screenshot({ path: path.join(OUT, `${PROD ? 'prod' : 'local'}-failed-390.png`) });
  await context.close();
}
{ // reduced motion: the push holds still, everything else still works
  const { context, page } = await newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }, { b: browserMic });
  await page.goto(URL_TRY, { waitUntil: 'load' });
  const rm = await page.evaluate(() => ({
    wrap: getComputedStyle(document.querySelector('.try-push')).animationName,
    btn: getComputedStyle(document.getElementById('try-btn')).animationName,
    unfold: (document.getElementById('try-panel').hidden = false, getComputedStyle(document.getElementById('try-panel')).animationName),
  }));
  check(rm.wrap === 'none' && rm.btn === 'none', 'reduced motion: nothing on the push animates', `wrapper ${rm.wrap} · button ${rm.btn}`);
  check(rm.unfold === 'none', 'reduced motion: the panel appears without the unfold', rm.unfold);
  await context.close();
}

// ── PUSH BUTTON v7 ──────────────────────────────────────────────────────────
// Green, bordered, lit, steady. Judged at DPR 2 at both phone sizes on the
// page's own computed style: the face and the edge live on the ::before, the
// light and the motion on the host. The item numbers in the labels are the
// brief's verification list.
const GREEN_RAMP = /^linear-gradient\((?:180deg, |to bottom, )?rgb\(74, 243, 190\) 0%, rgb\(46, 230, 168\) 55%, rgb\(38, 214, 155\) 100%\)$/;
const GLOW = 'rgba(46, 230, 168';
// Any trace of either light, at any alpha. Chromium writes an opaque colour as
// rgb(), so a check keyed on "rgba(170, 255, 225" misses the core at full strength.
const LIT = (f) => /46, 230, 168|170, 255, 225/.test(f || '');
const STARTER = "You're live. Start with: I need a ride to the airport tomorrow. It will ask you the rest.";
const bright = (f) => { const m = /brightness\(([\d.]+)\)/.exec(f || ''); return m ? Number(m[1]) : null; };
const lum = (c) => c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
  .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const faceLine = (x) => `${x.label} · face ${x.face} · edge ${x.bw} ${x.bc} · letters ${x.color} · opacity ${x.opacity} · anim ${x.anim} · ${x.filter}`;

// Stands in for the call SDK so the page's own state machine runs a whole cycle
// with no call behind it: startCall resolves, and the page goes LIVE on its own.
const FAKE_SDK = [
  'export class RetellWebClient {',
  '  constructor() { this.h = {}; }',
  '  on(e, f) { (this.h[e] = this.h[e] || []).push(f); return this; }',
  '  removeAllListeners() { this.h = {}; }',
  '  async startCall() {}',
  '  stopCall() {}',
  '  startAudioPlayback() { return Promise.resolve(); }',
  '}',
  'export default { RetellWebClient };',
].join('\n');

// Reads pixels back out of a screenshot, inside a blank page so no page policy
// can refuse the data: URL.
async function pixels(page, png, pts) {
  return page.evaluate(async ({ b64, pts }) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    return pts.map(([x, y]) => [...g.getImageData(Math.round(x), Math.round(y), 1, 1).data.slice(0, 3)]);
  }, { b64: png.toString('base64'), pts });
}

// THE NOTCH SLIVER. aic.css still paints the button HOST blue on :hover and
// :active (1785/1788), from before the fill moved onto ::before. The host's 10px
// corner radius reaches past the ::before's 8px diagonal cut, so any host fill
// shows as a sliver along the notch — read at (right-3.5, top+3.5), which sits
// between the diagonal and the arc. DPR 2 is assumed, as everywhere in v7.
async function sliver(page, scratch) {
  const r = await page.evaluate(() => { const x = document.getElementById('try-btn').getBoundingClientRect(); return { r: x.right, t: x.top }; });
  const clip = { x: Math.floor(r.r - 24), y: Math.floor(r.t - 8), width: 32, height: 24 };
  const png = await page.screenshot({ clip });
  const [px] = await pixels(scratch, png, [[(r.r - 3.5 - clip.x) * 2, (r.t + 3.5 - clip.y) * 2]]);
  const host = await page.evaluate(() => getComputedStyle(document.getElementById('try-btn')).backgroundColor);
  return { px, host, blue: px[2] > px[1] + 40 };
}

console.log('\nPUSH BUTTON v7 — DPR 2');
const where = PROD ? 'prod' : 'local';
for (const [w, h] of [[390, 844], [430, 932]]) {
  const tag = `${w}x${h}@2x`;

  { // 1 · 2 · 6 · 3 · 4 · 5, on one load, in that order
    const { context, page, errors } = await newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    await page.goto(URL_TRY, { waitUntil: 'load' });
    await page.waitForTimeout(1500);

    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    check(sw === w, `${tag} · 1 documentElement.scrollWidth equals the viewport`, `${sw} / ${w}`);

    const f = await page.evaluate(BTN_FACE);
    const refClip = await page.evaluate(() => {
      const a = document.createElement('a');
      a.className = 'btn btn-primary';
      a.textContent = 'reference';
      document.body.append(a);
      const clip = getComputedStyle(a, '::before').clipPath;
      a.remove();
      return clip;
    });
    check(f.color === 'rgb(7, 11, 20)' && f.weight === '700', `${tag} · 2 READY letters and weight`, `${f.color} · ${f.weight}`);
    check(f.bw === '2px', `${tag} · 2 ::before border 2px`, `${f.bw} ${f.bc}`);
    check(GREEN_RAMP.test(f.img), `${tag} · 2 ::before face is the green ramp`, f.img);
    check(/^polygon\(/.test(f.clip) && f.clip === refClip, `${tag} · 2 ::before notch identical to the site's own .btn-primary`, f.clip);

    // 6 BEFORE anything scripts the animation: once a script pauses or seeks a
    // CSS animation, animation-play-state no longer controls it, and the hover
    // rule would be judged on an animation it can no longer reach.
    const c = await page.evaluate(() => { const r = document.getElementById('try-btn').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await page.mouse.move(c.x, c.y);
    await page.waitForTimeout(250);
    const hov = await page.evaluate(() => {
      const b = document.getElementById('try-btn');
      const a = b.getAnimations().find((x) => x.animationName === 'try-glow');
      return { css: getComputedStyle(b).animationPlayState, api: a ? a.playState : 'no animation' };
    });
    check(hov.css === 'paused' && hov.api === 'paused', `${tag} · 6 hover pauses the pulse`, `css ${hov.css} · animation ${hov.api}`);
    await page.mouse.down();
    await page.waitForTimeout(250);
    const prs = await page.evaluate(BTN_FACE);
    // leave before releasing, so the press never becomes a click that starts a call
    await page.mouse.move(2, 2);
    await page.mouse.up();
    await page.waitForTimeout(400);
    const still = await page.evaluate(() => document.getElementById('try-tag').dataset.state);
    check(prs.transform === 'matrix(0.985, 0, 0, 0.985, 0, 2)' && prs.anim === 'none', `${tag} · 6 press: the site's drop lands and the pulse is killed`, `${prs.transform} · anim ${prs.anim} · ${prs.filter}`);
    check(still === 'ready', `${tag} · 6 and the press test opened no call`, still);

    const pulse = await page.evaluate(async () => {
      const b = document.getElementById('try-btn'), wrap = document.querySelector('.try-push');
      const a = b.getAnimations().find((x) => x.animationName === 'try-glow');
      if (!a) return null;
      const read = () => {
        const s = getComputedStyle(b).filter;
        const m = /brightness\(([\d.]+)\)/.exec(s);
        return { b: m ? Number(m[1]) : null, n: (s.match(/drop-shadow\(/g) || []).length };
      };
      a.pause();
      const seek = [0, 400, 800, 1200, 1600].map((t) => { a.currentTime = t; return { t, ...read() }; });
      a.currentTime = 0;
      a.play();
      const t0 = performance.now(), frames = [], tf = new Set();
      await new Promise((done) => {
        const step = () => {
          frames.push({ at: Math.round(a.currentTime || 0), ...read() });
          tf.add(getComputedStyle(b).transform + ' | ' + getComputedStyle(wrap).transform);
          if (performance.now() - t0 < 3300) requestAnimationFrame(step); else done();
        };
        requestAnimationFrame(step);
      });
      return { seek, frames, transforms: [...tf] };
    });
    const s = pulse ? pulse.seek.map((x) => x.b) : [];
    const rising = s.length === 5 && s.every((v, i) => i === 0 || v > s[i - 1]);
    check(!!pulse && Math.abs(s[0] - 1) < 0.002 && Math.abs(s[4] - 1.06) < 0.002 && rising,
      `${tag} · 3 brightness at 0/400/800/1200/1600 ms (seeked)`, s.join(' → '));
    check(!!pulse && pulse.seek.every((x) => x.n === 3), `${tag} · 3 every sample carries brightness + three drop-shadows, so the lists interpolate`, pulse ? pulse.seek.map((x) => x.n).join(',') : 'no animation');
    const half = pulse ? pulse.frames.filter((x) => x.at <= 1600) : [];
    const distinct = new Set(half.map((x) => x.b)).size;
    const maxStep = half.reduce((m, x, i) => (i ? Math.max(m, Math.abs(x.b - half[i - 1].b)) : 0), 0);
    const near = (t) => pulse.frames.reduce((best, x) => (Math.abs(x.at - t) < Math.abs(best.at - t) ? x : best));
    const rt = pulse ? [0, 400, 800, 1200, 1600].map((t) => { const x = near(t); return `${x.at}ms ${x.b}`; }).join(' · ') : '';
    check(distinct >= 20 && maxStep < 0.01, `${tag} · 3 real time: it moves, it does not snap`, `${distinct} distinct values over ${half.length} frames, largest frame step ${maxStep.toFixed(4)} · ${rt}`);
    check(!!pulse && pulse.transforms.length === 1 && pulse.transforms[0] === 'none | none', `${tag} · 4 button | wrapper transform through a full pulse`, pulse ? `${pulse.transforms.join(' / ')} over ${pulse.frames.length} frames` : '');

    const r = await page.evaluate(() => { const x = document.getElementById('try-btn').getBoundingClientRect(); return { l: x.left, t: x.top, r: x.right, w: x.width, h: x.height }; });
    const clip = { x: Math.max(0, Math.floor(r.l - 16)), y: Math.max(0, Math.floor(r.t - 16)), width: Math.ceil(r.w + 32), height: Math.ceil(r.h + 32) };
    const scratch = await context.newPage();
    const shot = async (ms) => {
      const filter = await page.evaluate((t) => {
        const b = document.getElementById('try-btn');
        const a = b.getAnimations().find((x) => x.animationName === 'try-glow');
        a.pause();
        a.currentTime = t;
        return getComputedStyle(b).filter;
      }, ms);
      const png = await page.screenshot({ clip });
      const px = (x, y) => [(x - clip.x) * 2, (y - clip.y) * 2];
      const [edge, rim, notch, far] = await pixels(scratch, png,
        [px(r.l + 1, r.t + r.h / 2), px(r.r + 2, r.t + r.h / 2), px(r.r - 2, r.t + 2), px(clip.x + 1, clip.y + 1)]);
      return { filter, png, edge, rim, notch, far };
    };
    const crest = await shot(1600), trough = await shot(0);
    await writeFile(path.join(OUT, `${where}-v7-crest-${w}@2x.png`), crest.png);
    await writeFile(path.join(OUT, `${where}-v7-rest-${w}@2x.png`), trough.png);
    const bc = bright(crest.filter);
    check(bc > 1.055 && crest.filter.includes('drop-shadow(rgb(170, 255, 225) 0px 0px 5px)') && crest.filter.includes(`drop-shadow(${GLOW}, 0.85) 0px 0px 20px)`),
      `${tag} · 5 crest: brightness and both lights at their peak`, crest.filter);
    check(crest.rim[1] > trough.rim[1] && crest.rim[1] > crest.far[1], `${tag} · 5 the rim light hugs the edge and swells at the crest`, `2px outside the right edge: crest ${crest.rim} · trough ${trough.rim} · clip corner ${crest.far}`);
    check(crest.notch[1] > trough.notch[1] && crest.notch[1] > crest.far[1], `${tag} · 5 the light follows the notched corner`, `inside the cut: crest ${crest.notch} · trough ${trough.notch}`);
    check(crest.edge[1] >= 230 && trough.edge[1] >= 230, `${tag} · 5 the 2px mint edge reads at crest and trough`, `crest ${crest.edge} · trough ${trough.edge}`);
    const ink = [7, 11, 20], darkStop = [38, 214, 155], up = (col, k) => col.map((v) => Math.min(255, v * k));
    const legible = [contrast(ink, darkStop), contrast(up(ink, bc || 1), up(darkStop, bc || 1))];
    check(legible.every((x) => x >= 4.5), `${tag} · 5 letters against the darkest stop of the ramp`, `trough ${legible[0].toFixed(2)}:1 · crest ${legible[1].toFixed(2)}:1`);
    // The notch under a pointer, after the pulse checks so the scratch page cannot
    // throttle their frames. Negative control first, at 390: force a host fill
    // back and the check has to see blue, or it is not looking.
    const cc = await page.evaluate(() => { const x = document.getElementById('try-btn').getBoundingClientRect(); return { x: x.left + x.width / 2, y: x.top + x.height / 2 }; });
    await page.mouse.move(cc.x, cc.y);
    await page.waitForTimeout(300);
    if (w === 390) {
      const forced = await page.addStyleTag({ content: '.try .try-btn:hover{background:rgb(42,99,232)!important}' });
      await page.waitForTimeout(250);
      const ctl = await sliver(page, scratch);
      check(ctl.blue, `${tag} · 6 NEGATIVE CONTROL: host fill forced back under hover, the sliver check sees blue`, `host ${ctl.host} · sliver ${ctl.px}`);
      await forced.evaluate((n) => n.remove());
      await page.waitForTimeout(250);
    }
    const sh = await sliver(page, scratch);
    check(sh.host === 'rgba(0, 0, 0, 0)' && !sh.blue, `${tag} · 6 hover: the host paints no fill and no blue shows along the notch`, `host ${sh.host} · sliver ${sh.px}`);
    await page.mouse.down();
    await page.waitForTimeout(250);
    const sp = await sliver(page, scratch);
    await page.mouse.move(2, 2);
    await page.mouse.up();
    check(sp.host === 'rgba(0, 0, 0, 0)' && !sp.blue, `${tag} · 6 press: the host paints no fill and no blue shows along the notch`, `host ${sp.host} · sliver ${sp.px}`);
    await scratch.close();
    check(errors.length === 0, `${tag} · zero console errors`, errors.slice(0, 3).join(' | '));
    await context.close();
  }

  { // 7 · a whole cycle through the page's own state machine, no call behind it
    const { context, page } = await newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 },
      { b: browserMic, answer: { status: 200, body: { call_id: 'call_v7_stub', access_token: 'stub', transport: 'livekit', ice_servers: [] }, delay: 2500 } });
    await context.route(/cdn\.jsdelivr\.net\/npm\/retell-client-js-sdk/, (route) => route.fulfill({
      status: 200, contentType: 'text/javascript; charset=utf-8', headers: { 'access-control-allow-origin': '*' }, body: FAKE_SDK }));
    await context.addInitScript(STATE_RECORDER);
    const blank7 = await context.newPage();
    await page.goto(URL_TRY, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const reach = (st) => page.waitForFunction((x) => document.getElementById('try-tag').dataset.state === x, st, { timeout: 10000 }).then(() => true).catch(() => false);
    // off the control before each read, so the read is the state and not the state under hover
    const settle = async () => { await page.mouse.move(2, 2); await page.waitForTimeout(600); };
    await push(page);
    const c1 = await reach('connecting');
    // read once with the pointer still resting on the control, as iOS leaves :hover after a tap
    await page.waitForTimeout(400);
    const s7 = await sliver(page, blank7);
    await settle();
    const conn = await page.evaluate(BTN_FACE);
    if (w === 390) await page.screenshot({ path: path.join(OUT, `${where}-v7-connecting-390@2x.png`) });
    const l1 = await reach('live');
    await settle();
    const live = await page.evaluate(BTN_FACE);
    if (w === 390) await page.screenshot({ path: path.join(OUT, `${where}-v7-live-390@2x.png`) });
    await push(page);
    const e1 = await reach('ended');
    await settle();
    const end1 = await page.evaluate(BTN_FACE);
    await page.waitForTimeout(800);
    const end2 = await page.evaluate(BTN_FACE);
    if (w === 390) await page.screenshot({ path: path.join(OUT, `${where}-v7-ended-390@2x.png`) });
    const seq = (await page.evaluate(() => window.__states.map((x) => x.s))).filter((x, i, a) => x !== a[i - 1]);
    const dark = (x) => x.face === 'rgb(13, 20, 32)' && x.bw === '2px' && x.bc === 'rgba(46, 230, 168, 0.75)'
      && x.color === 'rgb(232, 237, 245)' && x.anim === 'none' && !LIT(x.filter);
    check(c1 && dark(conn), `${tag} · 7 CONNECTING: surface face, 2px green edge, ink letters, no animation, no glow`, faceLine(conn));
    check(conn.label === 'Connecting' && conn.note === 'Your browser will ask to use your mic. Choose Allow.', `${tag} · 7 CONNECTING keeps its own label and note (strings this brief left alone)`, `${conn.label} | ${conn.note}`);
    check(s7.host === 'rgba(0, 0, 0, 0)' && !s7.blue, `${tag} · 7 CONNECTING under a resting pointer: no host fill, no blue along the notch`, `host ${s7.host} · sliver ${s7.px}`);
    check(l1 && dark(live) && live.label === 'End demo', `${tag} · 7 LIVE: the same dark face, labelled End demo`, faceLine(live));
    check(live.note === STARTER, `${tag} · 7 LIVE note is the starter line`, live.note);
    check(e1 && end1.label === 'PUSH TO BOOK' && GREEN_RAMP.test(end1.img) && end1.color === 'rgb(7, 11, 20)' && end1.bw === '2px'
      && end1.anim === 'none' && end1.filter.includes(`${GLOW}, 0.5)`) && end1.filter === end2.filter,
      `${tag} · 7 ENDED: green again, lit, still, PUSH TO BOOK`, faceLine(end1));
    check(JSON.stringify(seq) === JSON.stringify(['ready', 'connecting', 'live', 'ended']), `${tag} · 7 the page's own state machine ran the cycle`, seq.join(' → '));
    await context.close();
  }

  { // 8 · reduced motion
    const { context, page } = await newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    await page.goto(URL_TRY, { waitUntil: 'load' });
    await page.waitForTimeout(500);
    const a = await page.evaluate(BTN_FACE);
    await page.waitForTimeout(1000);
    const z = await page.evaluate(BTN_FACE);
    check(a.anim === 'none' && a.filter.includes(`${GLOW}, 0.55)`) && a.filter === z.filter, `${tag} · 8 reduced motion: no animation, the glow holds steady`, a.filter);
    await context.close();
  }
}

// ── nothing else moved ──────────────────────────────────────────────────────
// Against --base: the script differs by exactly the two named lines, the markup
// by exactly the hint, the head outside <style> not at all — and every untouched
// element renders with the same markup, size and computed style.
if (BASE && !PROD) {
  console.log(`\nUNCHANGED vs ${BASE}`);
  const norm = (x) => x.replace(/\r\n/g, '\n');
  const old = norm(execFileSync('git', ['show', `${BASE}:chauffeur/try/index.html`], { cwd: REPO }).toString('utf8'));
  const cur = norm(await readFile(path.join(REPO, 'chauffeur', 'try', 'index.html'), 'utf8'));
  const cut = (x, a, b) => { const i = x.indexOf(a); return x.slice(i, x.indexOf(b, i)).split('\n'); };
  const lineDiff = (x, y) => {
    const d = [];
    for (let i = 0; i < Math.max(x.length, y.length); i++) if (x[i] !== y[i]) d.push({ was: (x[i] || '').trim(), now: (y[i] || '').trim() });
    return d;
  };
  const sOld = cut(old, '<script type="module">', '</script>'), sNew = cut(cur, '<script type="module">', '</script>');
  const sd = lineDiff(sOld, sNew);
  const lab = sd.find((d) => d.was.includes("live: 'End call'"));
  const nt = sd.find((d) => d.was === `live: "You're live. Say where you're going and when.",`);
  check(sOld.length === sNew.length && sd.length === 2 && !!lab && lab.now === lab.was.replace("live: 'End call'", "live: 'End demo'")
    && !!nt && nt.now === `live: "${STARTER}",`, '9 script: exactly two lines differ, and they are LABEL.live and NOTE.live', `${sd.length} of ${sNew.length} lines`);
  const bd = lineDiff(cut(old, '<body>', '<script type="module">'), cut(cur, '<body>', '<script type="module">'));
  check(bd.length === 1 && bd[0].now === '<p class="try-hint">Not a phone call. AI Chauffeur talks to you right here on this page — push once, then just talk. Stop any time.</p>',
    '9 markup: exactly one line differs, and it is the hint', bd.map((d) => d.now.slice(0, 70)).join(' | '));
  const outsideStyle = (x) => x.slice(0, x.indexOf('<style>')) + x.slice(x.indexOf('</style>'), x.indexOf('<body>'));
  check(outsideStyle(old) === outsideStyle(cur), '9 <head> outside the <style> block is byte-identical');

  const SEL = ['.try-brand', '.try-h', '.try-sub', '#try-inapp', '#try-inapp p', '#try-copy', '#try-url', '#try-mute', '#try-panel', '.try-head',
    '#try-tag', '#try-time', '.try-body', '.try-lvl-tag', '#try-meter', '.try-tl', '#try-empty', '#try-note', '.try-rec', '.try-rec a', '#try-alt',
    '#try-alt a', '#try-result', '#try-building', '#try-ticket', '#try-ticket h2', '#try-texted', '#try-player', '#try-player h2', '#try-rnote',
    '#try-share', '#try-share-url'];
  const PROPS = ['color', 'background-color', 'background-image', 'border-top-width', 'border-top-style', 'border-top-color', 'border-left-width',
    'border-left-color', 'border-radius', 'font-family', 'font-size', 'font-weight', 'letter-spacing', 'line-height', 'text-transform',
    'text-decoration-line', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'margin-top', 'margin-bottom', 'opacity',
    'display', 'filter', 'transform', 'animation-name', 'box-shadow', 'outline-style', 'cursor'];
  const snap = async (html) => {
    const { context, page } = await newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    if (html) await context.route(URL_TRY, (route) => route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html }));
    await page.goto(URL_TRY, { waitUntil: 'load' });
    const out = await page.evaluate(async ({ SEL, PROPS }) => {
      for (const id of ['try-inapp', 'try-url', 'try-panel', 'try-result', 'try-building', 'try-ticket', 'try-texted', 'try-player', 'try-rnote', 'try-alt', 'try-share-url']) {
        document.getElementById(id).hidden = false;
      }
      document.getElementById('try-rnote').textContent = 'parity';
      await new Promise((f) => setTimeout(f, 700));
      return {
        clip: getComputedStyle(document.getElementById('try-btn'), '::before').clipPath,
        els: SEL.map((sel) => {
          const el = document.querySelector(sel);
          if (!el) return { s: sel, missing: true };
          const cs = getComputedStyle(el), rr = el.getBoundingClientRect();
          return { s: sel, html: el.outerHTML, w: Math.round(rr.width), h: Math.round(rr.height), css: Object.fromEntries(PROPS.map((p) => [p, cs.getPropertyValue(p)])) };
        }),
      };
    }, { SEL, PROPS });
    await context.close();
    return out;
  };
  const A = await snap(old), B = await snap(null);
  const diffs = [];
  A.els.forEach((x, i) => {
    const y = B.els[i];
    if (x.missing || y.missing) { diffs.push(`${x.s} missing`); return; }
    if (x.html !== y.html) diffs.push(`${x.s} markup`);
    if (x.w !== y.w || x.h !== y.h) diffs.push(`${x.s} size ${x.w}x${x.h} -> ${y.w}x${y.h}`);
    for (const p of PROPS) if (x.css[p] !== y.css[p]) diffs.push(`${x.s} ${p}: ${x.css[p]} -> ${y.css[p]}`);
  });
  check(diffs.length === 0, `9 ${SEL.length} untouched elements x ${PROPS.length} properties + markup + size identical to ${BASE}`, diffs.slice(0, 6).join(' | '));
  check(A.clip === B.clip, `9 the notch is the polygon it was at ${BASE}`, B.clip);
}

await browser.close();
await browserMic.close();
if (insights404) console.log(`\n  WARN  analytics script 404 — Web Analytics not enabled on the project yet (${insights404} ignored)`);
console.log(`\n${failed ? 'FAIL — ' + failed + ' check(s)' : 'ALL CHECKS PASS'}`);
process.exit(failed ? 1 : 0);
