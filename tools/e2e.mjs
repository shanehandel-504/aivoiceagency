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
    await pg.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 45000 });

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
    await pg.goto(BASE + path, { waitUntil: 'networkidle', timeout: 45000 });
    await pg.click('.bnav-burger'); await pg.waitForTimeout(150);
    const opened = await pg.evaluate(() => ({ open: document.querySelector('.bnav-menu').classList.contains('open'), ov: document.body.style.overflow, h: Math.round(document.querySelector('.bnav-menu').getBoundingClientRect().height) }));
    await pg.mouse.click(195, 780); await pg.waitForTimeout(150);
    const closed = await pg.evaluate(() => ({ open: document.querySelector('.bnav-menu').classList.contains('open'), ov: document.body.style.overflow }));
    ok(`menu ${path}: full-height, opens+closes on outside tap, overflow released`, opened.open && opened.h > 400 && opened.ov === 'hidden' && !closed.open && closed.ov === '', `open h=${opened.h}/${opened.ov} tap→${closed.open}/${closed.ov}`);
    ok(`theme toggle present ${path}`, await pg.evaluate(() => !!document.querySelector('.bs-theme')));
    ok(`${path}: zero console errors`, errs.length === 0, errs.join(' | '));
    await pg.close();
  }

  await browser.close();
}

await suite('chromium', chromium);
await suite('webkit', webkit);

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
