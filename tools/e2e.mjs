#!/usr/bin/env node
/* THE GATE — permanent E2E suite, runs on Chromium AND WebKit at 390px.
 * iOS Safari (WebKit) is a shipping gate forever. Build-time tool (tools/ is
 * vercelignored); Playwright is borrowed from AVA-factory/adstage.
 *   node tools/e2e.mjs                 # localhost:8847, both engines
 *   node tools/e2e.mjs https://aivoiceagency.ai
 * Exit non-zero on any failure or console error. */
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/offic/Desktop/AVA-factory/adstage/package.json');
const { chromium, webkit } = require('playwright');

const BASE = (process.argv[2] || 'http://localhost:8847').replace(/\/$/, '');
const nt = (u) => { const [p, h] = String(u).split('#'); return p + (p.includes('?') ? '&' : '?') + 'notrack=1' + (h ? '#' + h : ''); };  // RUN 4: opt gate traffic out of analytics
const results = [];
const rec = (engine, name, pass, detail) =>
  results.push({ engine, name, pass, detail: detail || '' });

async function suite(engine, launcher) {
  const browser = await launcher.launch();
  const ok = (n, p, d) => rec(engine, n, p, d);

  // ---- homepage ----
  {
    const pg = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errs = [];
    pg.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    pg.on('pageerror', (e) => errs.push(e.message));
    await pg.goto(nt(BASE + '/'), { waitUntil: 'networkidle', timeout: 45000 });

    const fold = await pg.evaluate(() => {
      const y = (s) => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().top) : null; };
      return { h1: y('h1'), watch: y('[data-event="watch_tap_hero"]'), call: y('[data-event="tel_tap_hero"]'), callbar: y('.bs-callbar') };
    });
    ok('home fold: H1+CTAs+callbar in view', fold.h1 < 844 && fold.watch < 844 && fold.call < 844 && fold.callbar <= 844, JSON.stringify(fold));
    ok('7 answers in initial DOM', await pg.evaluate(() => document.querySelectorAll('.bs-qa .bs-qa-a p').length) >= 7);
    ok('JSON-LD present', await pg.evaluate(() => !!document.querySelector('script[type="application/ld+json"]')));
    ok('16 agent cards present', await pg.evaluate(() => document.querySelectorAll('.bs-feed .bs-card').length) === 16);
    ok('assets versioned (?v=)', await pg.evaluate(() => [...document.querySelectorAll('link[rel=stylesheet],script[src]')].filter(e => (e.href || e.src || '').match(/\/(assets|css|js)\//)).every(e => (e.href || e.src).includes('?v='))));

    // theater streams to payoff
    await pg.click('[data-start]');
    await pg.waitForTimeout(700);
    const early = await pg.evaluate(() => ({ on: document.querySelectorAll('.bs-card.on').length, working: document.querySelectorAll('.bs-card .orb[data-state="working"]').length }));
    ok('theater streams (one working)', early.on >= 1 && early.working <= 1, JSON.stringify(early));
    await pg.waitForTimeout(11200);
    const end = await pg.evaluate(() => ({ on: document.querySelectorAll('.bs-card.on').length, payoff: document.querySelector('[data-payoff]').classList.contains('in'), secs: document.querySelector('[data-clock]').textContent }));
    ok('all 16 cards + payoff docked + clock 11.3s', end.on === 16 && end.payoff && end.secs === '11.3s', JSON.stringify(end));

    // B4 review — never locks scroll
    await pg.evaluate(() => document.querySelector('[data-review]').click());
    await pg.waitForTimeout(250);
    const rev = await pg.evaluate(() => {
      document.querySelector('#watch').scrollIntoView();
      const b = window.scrollY; window.scrollBy(0, 120); const a = window.scrollY; window.scrollTo(0, 0);
      return { reviewed: document.querySelector('.bs-stage').classList.contains('is-reviewed'), strip: !document.querySelector('[data-strip]').hasAttribute('hidden'), scrolls: a !== b, ov: document.body.style.overflow };
    });
    ok('B4 review un-dims + strip + scroll never locked', rev.reviewed && rev.strip && rev.scrolls && rev.ov !== 'hidden', JSON.stringify(rev));

    // Hear AVA — preload none + plays one at a time (UI state; headless has no audio device)
    // preload=none is honored by both engines (zero .mp3 fetched on load, verified);
    // WebKit reports a misleading readyState, so gate on the attribute + not-autoplaying.
    const hear = await pg.evaluate(() => ({ clips: document.querySelectorAll('[data-clip]').length, preloadNone: [...document.querySelectorAll('[data-clip] audio')].every(a => a.getAttribute('preload') === 'none'), paused: [...document.querySelectorAll('[data-clip] audio')].every(a => a.paused) }));
    ok('Hear AVA: 3 clips, preload=none, not autoplaying', hear.clips === 3 && hear.preloadNone && hear.paused, JSON.stringify(hear));
    await pg.evaluate(() => document.querySelectorAll('[data-play]')[0].click());
    await pg.waitForTimeout(300);
    await pg.evaluate(() => document.querySelectorAll('[data-play]')[1].click());
    await pg.waitForTimeout(300);
    const audio = await pg.evaluate(() => ({ p0: document.querySelectorAll('[data-clip]')[0].classList.contains('is-playing'), p1: document.querySelectorAll('[data-clip]')[1].classList.contains('is-playing') }));
    ok('Hear AVA one-at-a-time (clip2 stops clip1)', !audio.p0 && audio.p1, JSON.stringify(audio));
    await pg.evaluate(() => document.querySelectorAll('[data-play]')[1].click());

    // pricing tab (B3, frozen behavior) + theme
    await pg.evaluate(() => document.querySelector('.bs-ptab[data-fit="growth"]').click());
    await pg.waitForTimeout(150);
    ok('B3 pricing tab highlights Growth', await pg.evaluate(() => document.querySelector('.bs-tier[data-tier="growth"]').classList.contains('is-reco')));
    await pg.click('.bs-theme'); await pg.waitForTimeout(150);
    ok('theme flips light', await pg.evaluate(() => getComputedStyle(document.body).backgroundColor === 'rgb(244, 246, 250)'));

    ok('home: zero console errors', errs.length === 0, errs.join(' | '));
    await pg.close();
  }

  // ---- menu (B1) on /, /roi, /book ----
  for (const path of ['/', '/roi', '/book']) {
    const pg = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errs = [];
    pg.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    pg.on('pageerror', (e) => errs.push(e.message));
    await pg.goto(nt(BASE + path), { waitUntil: 'networkidle', timeout: 45000 });
    await pg.click('.bnav-burger'); await pg.waitForTimeout(150);
    const opened = await pg.evaluate(() => ({ open: document.querySelector('.bnav-menu').classList.contains('open'), ov: document.body.style.overflow, h: Math.round(document.querySelector('.bnav-menu').getBoundingClientRect().height) }));
    await pg.mouse.click(195, 780); await pg.waitForTimeout(150);
    const closed = await pg.evaluate(() => ({ open: document.querySelector('.bnav-menu').classList.contains('open'), ov: document.body.style.overflow }));
    ok(`menu ${path}: full-height, opens+closes on outside tap, overflow released`, opened.open && opened.h > 400 && opened.ov === 'hidden' && !closed.open && closed.ov === '', `open h=${opened.h}/${opened.ov} tap→${closed.open}/${closed.ov}`);
    ok(`theme toggle present ${path}`, await pg.evaluate(() => !!document.querySelector('.bs-theme')));
    ok(`${path}: zero console errors`, errs.length === 0, errs.join(' | '));
    await pg.close();
  }

  // ---- RUN 2 · /watch ad lander (390) ----
  {
    const pg = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errs = [];
    pg.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    pg.on('pageerror', (e) => errs.push(e.message));
    await pg.goto(nt(BASE + '/watch'), { waitUntil: 'networkidle', timeout: 45000 });
    const w = await pg.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      cards: document.querySelectorAll('.bs-feed .bs-card').length,
      clips: document.querySelectorAll('[data-clip]').length,
      preloadNone: [...document.querySelectorAll('[data-clip] audio')].every(a => a.getAttribute('preload') === 'none'),
      slim: !document.querySelector('.bnav-menu'), theme: !!document.querySelector('.bs-theme'),
      h1: !!(document.querySelector('h1') && document.querySelector('h1').textContent.trim()),
      canonical: (document.querySelector('link[rel=canonical]') || {}).href,
      versioned: [...document.querySelectorAll('link[rel=stylesheet],script[src]')].filter(e => (e.href || e.src || '').match(/\/(assets|css|js)\//)).every(e => (e.href || e.src).includes('?v=')),
    }));
    ok('/watch: no h-overflow @390, 16 cards, 3 clips preload=none, slim header + theme, real H1, versioned',
      w.overflow <= 0 && w.cards === 16 && w.clips === 3 && w.preloadNone && w.slim && w.theme && w.h1 && w.versioned && /\/watch$/.test(w.canonical || ''), JSON.stringify(w));
    const wp = await pg.evaluate(async () => { await window.__backstage.skipToPayoff(); await new Promise(r => setTimeout(r, 120));
      return { on: document.querySelectorAll('.bs-card.on').length, payoff: document.querySelector('[data-payoff]').classList.contains('in'), secs: document.querySelector('[data-clock]').textContent }; });
    ok('/watch: theater streams to payoff (16 on · 11.3s)', wp.on === 16 && wp.payoff && wp.secs === '11.3s', JSON.stringify(wp));
    ok('/watch: zero console errors', errs.length === 0, errs.join(' | '));
    await pg.close();
  }

  // ---- RUN 2 · /overview rebuild (390) — pricing imported from homepage (drift guard) ----
  {
    const isLocal = /localhost|127\.0\.0\.1/.test(BASE);
    const pg = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errs = [];
    pg.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    pg.on('pageerror', (e) => errs.push(e.message));
    await pg.goto(nt(BASE + (isLocal ? '/overview.html' : '/overview')), { waitUntil: 'networkidle', timeout: 45000 });
    const o = await pg.evaluate(() => {
      const t = (sel) => { const e = document.querySelector(sel + ' .t-price'); return e ? e.textContent.replace(/\s/g, '') : null; };
      return {
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        starter: t('.bs-tier[data-tier="starter"]'), growth: t('.bs-tier[data-tier="growth"]'), ops: t('.bs-tier[data-tier="operations"]'),
        ptabs: document.querySelectorAll('.bs-ptab').length, h1: !!(document.querySelector('h1') && document.querySelector('h1').textContent.trim()),
        nav: !!document.querySelector('.bnav-menu'), crumb: !!document.querySelector('.bcrumb'),
        ld: document.querySelectorAll('script[type="application/ld+json"]').length,
      };
    });
    ok('/overview: no h-overflow @390, tiers match homepage ($497/$997/$1,997), 3 tabs, full nav+crumb+2 JSON-LD',
      o.overflow <= 0 && o.starter === '$497/mo' && o.growth === '$997/mo' && o.ops === 'From$1,997/mo' && o.ptabs === 3 && o.h1 && o.nav && o.crumb && o.ld >= 2, JSON.stringify(o));
    await pg.evaluate(() => document.querySelector('.bs-ptab[data-fit="growth"]').click());
    ok('/overview: pricing tab highlights Growth', await pg.evaluate(() => document.querySelector('.bs-tier[data-tier="growth"]').classList.contains('is-reco')));
    await pg.click('.bs-theme'); await pg.waitForTimeout(120);
    ok('/overview: theme flips light', await pg.evaluate(() => getComputedStyle(document.body).backgroundColor === 'rgb(244, 246, 250)'));
    ok('/overview: zero console errors', errs.length === 0, errs.join(' | '));
    await pg.close();
  }

  // ---- RUN 2 · /booked conversion page (390) — noindex + fires conversion ----
  {
    const pg = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errs = [];
    pg.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    pg.on('pageerror', (e) => errs.push(e.message));
    await pg.goto(nt(BASE + '/booked'), { waitUntil: 'networkidle', timeout: 45000 });
    const b = await pg.evaluate(() => {
      let convFired = false; try { convFired = sessionStorage.getItem('ava_booking_tracked') === '1'; } catch (e) {}
      const dl = window.dataLayer || [];
      const bookingComplete = dl.some((a) => a && a[0] === 'event' && a[1] === 'booking_complete');
      return {
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        robots: (document.querySelector('meta[name=robots]') || {}).content, convFired, bookingComplete,
        steps: document.querySelectorAll('.bk-steps li').length, clip: document.querySelectorAll('[data-clip]').length,
        cal: !!(document.getElementById('calBtn') && !document.getElementById('calBtn').hidden),
        h1: !!(document.querySelector('h1') && document.querySelector('h1').textContent.trim()),
      };
    });
    ok('/booked: no h-overflow @390, noindex,nofollow, conversion fired (booking_complete), 3 steps, clip, cal btn, H1',
      b.overflow <= 0 && /noindex/.test(b.robots || '') && /nofollow/.test(b.robots || '') && b.convFired && b.bookingComplete && b.steps === 3 && b.clip === 1 && b.cal && b.h1, JSON.stringify(b));
    ok('/booked: zero console errors', errs.length === 0, errs.join(' | '));
    await pg.close();
  }

  // ---- RUN 3 · compact demo pill on every hub + homepage ?trade= honor (390) ----
  const isLoc = /localhost|127\.0\.0\.1/.test(BASE);
  const HUBS = [
    ['/home-services', '/home-services/index.html', 'plumbing'], ['/medical-practices', '/medical-practices/index.html', 'dental'],
    ['/professional-services', '/professional-services/index.html', 'plumbing'], ['/hospitality', '/hospitality/index.html', 'plumbing'],
    ['/ground-transportation', '/ground-transportation/index.html', 'black-car'], ['/overview', '/overview.html', 'plumbing'],
    ['/roi', '/roi/index.html', 'plumbing'], ['/book', '/book/index.html', 'plumbing'],
  ];
  for (const [prod, loc, trade] of HUBS) {
    const pg = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const e2 = []; pg.on('console', (m) => { if (m.type() === 'error') e2.push(m.text()); }); pg.on('pageerror', (e) => e2.push(e.message));
    await pg.goto(nt(BASE + (isLoc ? loc : prod)), { waitUntil: 'networkidle', timeout: 45000 });
    const r = await pg.evaluate(() => {
      const p = document.querySelector('.dp-pill'), h1 = document.querySelector('h1');
      return { href: p ? p.getAttribute('href') : null, ev: p ? p.getAttribute('data-event') : null, trade: p ? p.getAttribute('data-trade') : null,
        ring: !!(p && p.querySelector('.ava-lap')), overflow: document.documentElement.scrollWidth - window.innerWidth,
        h1: h1 ? Math.round(h1.getBoundingClientRect().top) : null, css: [...document.querySelectorAll('link[rel=stylesheet]')].some((l) => /demo-pill\.css/.test(l.href)) };
    });
    ok(`${prod}: demo pill+ring, ?trade=${trade}, css linked, no h-overflow @390, H1 above fold`,
      r.href === `/?trade=${trade}#stage` && r.ev === 'demo_pill_tap' && r.trade === trade && r.ring && r.overflow <= 0 && r.css && r.h1 !== null && r.h1 < 844 && e2.length === 0,
      JSON.stringify({ ...r, e: e2.slice(0, 1) }));
    await pg.close();
  }
  for (const t of ['hvac', 'black-car']) {
    const pg = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await pg.goto(nt(BASE + `/?trade=${t}#stage`), { waitUntil: 'networkidle', timeout: 45000 });
    await pg.waitForTimeout(1500);
    const s = await pg.evaluate(() => ({ t: (document.querySelector('.bs-trade.is-on') || {}).getAttribute ? document.querySelector('.bs-trade.is-on').getAttribute('data-trade') : null, started: document.querySelector('[data-payoff]').classList.contains('in') }));
    ok(`homepage ?trade=${t} preselects chip, no autostart`, s.t === t && !s.started, JSON.stringify(s));
    await pg.close();
  }

  await browser.close();
}

/* ---- P0 RING GATE — HEADED pixel diff (RUN 3). The RUN 1.9 @property/conic ring
 * moved in HEADLESS but froze on headed Chrome's GPU compositor, so a headless-only
 * check could never catch it. This runs HEADED where the environment allows (real
 * Chrome + WebKit) and asserts the ring band's pixels actually CHANGE between two
 * frames. Green = pixels moved — never the computed --ava-angle (which advances even
 * when the paint is frozen). Falls back to headless (logged) on a headless CI box. */
async function ringGate() {
  for (const [engine, launcher, opts] of [['chromium', chromium, { channel: 'chrome' }], ['webkit', webkit, {}]]) {
    let browser, headed = true;
    try { browser = await launcher.launch({ headless: false, ...opts }); }
    catch (e1) { headed = false; try { browser = await launcher.launch({ headless: true }); } catch (e2) { rec(engine, 'ring gate: launch', false, e2.message); continue; } }
    try {
      const pg = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await pg.goto(nt(BASE + '/'), { waitUntil: 'load', timeout: 45000 });
      await pg.waitForSelector('.ava-pulse .ava-lap', { timeout: 8000 });
      const box = await pg.evaluate(() => { const b = document.querySelector('.ava-pulse'); b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { x: Math.max(0, Math.floor(r.x)), y: Math.max(0, Math.floor(r.y)), width: Math.ceil(r.width), height: Math.ceil(r.height) }; });
      const grab = async () => { const b64 = (await pg.screenshot({ clip: box })).toString('base64'); return pg.evaluate(async (b) => { const img = new Image(); await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/png;base64,' + b; }); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0); return Array.from(x.getImageData(0, 0, img.width, img.height).data); }, b64); };
      const a = await grab(); await pg.waitForTimeout(800); const z = await grab();
      let changed = 0; for (let i = 0; i < a.length; i += 4) { if (Math.abs(a[i] - z[i]) > 12 || Math.abs(a[i + 1] - z[i + 1]) > 12 || Math.abs(a[i + 2] - z[i + 2]) > 12) changed++; }
      rec(engine, `P0 ring moves${headed ? ' HEADED' : ' (headless fallback)'} — real pixel diff, not computed --ava-angle`, changed >= 40, `changed=${changed}`);
    } finally { await browser.close(); }
  }
}

await suite('chromium', chromium);
await suite('webkit', webkit);
await ringGate();

// ---- report ----
const byEngine = { chromium: [], webkit: [] };
results.forEach((r) => byEngine[r.engine].push(r));
let failed = 0;
for (const eng of ['chromium', 'webkit']) {
  console.log(`\n=== ${eng.toUpperCase()} @ 390 ===`);
  for (const r of byEngine[eng]) {
    if (!r.pass) failed++;
    console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.name}${r.detail && !r.pass ? ' — ' + r.detail : ''}`);
  }
}
console.log(`\n${failed === 0 ? 'ALL GREEN on both engines' : failed + ' FAILURE(S)'}`);
process.exit(failed ? 1 : 0);
