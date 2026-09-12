// tools/aic-try/render.mjs — the /try render + failure-path gate. Creates NO calls:
// every test stubs the n8n webhook, so nothing here reaches Retell or spends this
// machine's per-IP allowance.
//
//   node tools/aic-try/render.mjs            # chauffeur/ served locally as https://aichauffeur.ai
//   node tools/aic-try/render.mjs --prod     # the live page
//
// Per width (320, 390, 430, 1440): horizontal overflow, rendered-pixel AA contrast
// on every text node, the 12px floor, console/page errors, the banned-word gate.
// Then the v4 surfaces (chips, breathing, pre-solve, focus mode, sound, haptics,
// the ticket card and the player) and the failure paths in a real browser:
//   in-app user agent -> banner · mic blocked -> mic line · SDK blocked -> phone line
//   webhook refuses the proof -> phone line · webhook 429 -> phone line
// Negative control first: a fixture that overflows and fails contrast must be caught.

import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium, SITE, REPO, serveLocal, webhookStub, WEBHOOK_URL, probe } from './lib.mjs';

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
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e.message).slice(0, 160)));
  return { context, page, errors };
}

// PUSHING THE BUTTON, THE WAY A POINTER DOES.
// page.click() first waits for the element to be "stable" — the same bounding
// box across two frames — and the button breathes, so that wait never ends. A
// finger does not care: hit testing uses the live transform, and the control is
// hit wherever it is at that instant. So the gate drives the real mouse instead
// of asking Playwright to wait for the motion to stop. Moving onto the control
// also pauses the breathing, which is the behaviour being exercised.
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
    hint: 'Push once, then just talk. Stop any time.',
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
    // .try-act and not .try-push: the push breathes, so its box is scaled by
    // whatever frame the read lands on. Its non-animated parent holds the edge.
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
    const el = document.querySelector('.try-push');
    const s = getComputedStyle(el);
    return { name: s.animationName, dur: s.animationDuration, onBtn: getComputedStyle(document.getElementById('try-btn')).animationName };
  });
  check(br.name === 'try-breathe' && br.dur === '4s', 'the button breathes on a 4s loop at READY', `${br.name} ${br.dur}`);
  check(br.onBtn === 'none', 'and the animation is on the WRAPPER, so the control keeps its own hover and press', br.onBtn);

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
{ // reduced motion: the breathing stops, everything else still works
  const { context, page } = await newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }, { b: browserMic });
  await page.goto(URL_TRY, { waitUntil: 'load' });
  const rm = await page.evaluate(() => ({
    anim: getComputedStyle(document.querySelector('.try-push')).animationName,
    unfold: (document.getElementById('try-panel').hidden = false, getComputedStyle(document.getElementById('try-panel')).animationName),
  }));
  check(rm.anim === 'none', 'reduced motion: the breathing is off', rm.anim);
  check(rm.unfold === 'none', 'reduced motion: the panel appears without the unfold', rm.unfold);
  await context.close();
}

await browser.close();
await browserMic.close();
console.log(`\n${failed ? 'FAIL — ' + failed + ' check(s)' : 'ALL CHECKS PASS'}`);
process.exit(failed ? 1 : 0);
