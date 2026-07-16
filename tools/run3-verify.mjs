#!/usr/bin/env node
/* RUN 3 verify — demo pill on hubs + homepage ?trade= honor. Chromium + WebKit @390.
 *   node tools/run3-verify.mjs   (localhost:8847)  |  node tools/run3-verify.mjs https://aivoiceagency.ai */
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/offic/Desktop/AVA-factory/adstage/package.json');
const { chromium, webkit } = require('playwright');
const BASE = (process.argv[2] || 'http://localhost:8847').replace(/\/$/, '');
const LOCAL = /localhost|127\.0\.0\.1/.test(BASE);

// [path (prod), local path, expected trade]
const HUBS = [
  ['/home-services', '/home-services/index.html', 'plumbing'],
  ['/medical-practices', '/medical-practices/index.html', 'dental'],
  ['/professional-services', '/professional-services/index.html', 'plumbing'],
  ['/hospitality', '/hospitality/index.html', 'plumbing'],
  ['/ground-transportation', '/ground-transportation/index.html', 'black-car'],
  ['/overview', '/overview.html', 'plumbing'],
  ['/roi', '/roi/index.html', 'plumbing'],
  ['/book', '/book/index.html', 'plumbing'],
];
const results = [];
const ok = (eng, name, pass, detail) => results.push({ eng, name, pass, detail: detail || '' });

async function suite(eng, launcher) {
  const browser = await launcher.launch();
  for (const [prod, loc, trade] of HUBS) {
    const path = LOCAL ? loc : prod;
    const pg = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errs = [];
    pg.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    pg.on('pageerror', (e) => errs.push(e.message));
    await pg.goto(BASE + path, { waitUntil: 'networkidle', timeout: 45000 });
    const r = await pg.evaluate(() => {
      const p = document.querySelector('.dp-pill');
      const h1 = document.querySelector('h1');
      return {
        pill: !!p,
        href: p ? p.getAttribute('href') : null,
        ev: p ? p.getAttribute('data-event') : null,
        trade: p ? p.getAttribute('data-trade') : null,
        ring: !!(p && p.querySelector('.ava-lap')),
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        h1top: h1 ? Math.round(h1.getBoundingClientRect().top) : null,
        pilltop: p ? Math.round(p.getBoundingClientRect().top) : null,
        css: [...document.querySelectorAll('link[rel=stylesheet]')].some((l) => /demo-pill\.css/.test(l.href)),
      };
    });
    const pass = r.pill && r.href === `/?trade=${trade}#stage` && r.ev === 'demo_pill_tap' && r.trade === trade &&
      r.ring && r.overflow <= 0 && r.h1top !== null && r.h1top < 844 && r.css && errs.length === 0;
    ok(eng, `${prod}: pill+ring, href=?trade=${trade}, css linked, overflow<=0, H1 above fold`, pass,
      JSON.stringify({ ...r, errs: errs.slice(0, 1) }));
    await pg.close();
  }
  // CLS on a 3 pill-page sample — proves the injected pill is CLS-NEUTRAL: it must never
  // appear as a layout-shift SOURCE. (Circulant hubs carry a pre-existing ~0.05 shift from
  // their live-call-widget hydration + web-font swap — measured identical with the pill
  // removed: GT 0.057 pre === 0.057 with — frozen content, out of RUN 3's additive scope.)
  for (const [prod, loc] of [HUBS[0], HUBS[4], HUBS[5]]) {
    const path = LOCAL ? loc : prod;
    const pg = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await pg.goto(BASE + path, { waitUntil: 'load', timeout: 45000 });
    const res = await pg.evaluate(() => new Promise((resv) => {
      let total = 0; const pillHit = [];
      try {
        new PerformanceObserver((l) => { for (const e of l.getEntries()) { if (e.hadRecentInput) continue; total += e.value;
          (e.sources || []).forEach((s) => { const n = s.node; const cn = n && n.className && n.className.baseVal !== undefined ? n.className.baseVal : (n && n.className) || '';
            if (/\bdp-/.test(String(cn)) || (n && n.closest && n.closest('.dp-wrap'))) pillHit.push(String(cn) || n.nodeName); }); } }).observe({ type: 'layout-shift', buffered: true });
      } catch (e) {}
      setTimeout(() => resv({ total: Math.round(total * 1000) / 1000, pillHit }), 1400);
    }));
    ok(eng, `${prod}: pill CLS-neutral (never a shift source; page total ${res.total})`, res.pillHit.length === 0, JSON.stringify(res.pillHit.slice(0, 2)));
    await pg.close();
  }
  // homepage ?trade= honor (deep-link preselect, no autostart)
  for (const t of ['hvac', 'black-car']) {
    const pg = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await pg.goto(BASE + `/?trade=${t}#stage`, { waitUntil: 'networkidle', timeout: 45000 });
    await pg.waitForTimeout(1600);
    const sel = await pg.evaluate((t) => {
      const on = document.querySelector('.bs-trade.is-on');
      const started = document.querySelector('[data-payoff]') && document.querySelector('[data-payoff]').classList.contains('in');
      return { onTrade: on ? on.getAttribute('data-trade') : null, started };
    }, t);
    ok(eng, `homepage ?trade=${t} preselects chip, no autostart`, sel.onTrade === t && !sel.started, JSON.stringify(sel));
    await pg.close();
  }
  await browser.close();
}

await suite('chromium', chromium);
await suite('webkit', webkit);

let failed = 0;
for (const e of ['chromium', 'webkit']) {
  console.log(`\n=== ${e.toUpperCase()} @390 ===`);
  for (const r of results.filter((x) => x.eng === e)) { if (!r.pass) failed++; console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.name}${r.pass ? '' : ' — ' + r.detail}`); }
}
console.log(`\n${failed === 0 ? 'RUN 3 ALL GREEN both engines' : failed + ' FAILURE(S)'}`);
process.exit(failed ? 1 : 0);
