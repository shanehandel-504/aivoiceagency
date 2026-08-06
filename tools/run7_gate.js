/* AIC RUN 7 · render gate.
 *
 * Playwright resolves from AVA-factory/adstage — this repo has no node_modules
 * and is not getting one for a gate script.
 *
 * Measures, per page per viewport: header height, horizontal overflow, console
 * result-header presence, sticky-rail geometry and overlap against every input
 * on the page, and the four-stage rail state. Nothing here is eyeballed.
 *
 *   node tools/run7_gate.js            full sweep
 *   node tools/run7_gate.js --shots    also write audits/RUN7-*.png
 */
const path = require('path');
const fs = require('fs');
const PW = 'C:/Users/offic/Desktop/AVA-factory/adstage/node_modules/playwright';
const { chromium } = require(PW);

const BASE = process.env.RUN7_BASE || 'http://127.0.0.1:4177';
const OUT = path.join(__dirname, '..', 'audits');
const SHOTS = process.argv.includes('--shots');

const PAGES = [
  '/', '/demo/', '/book/', '/how-setup-works/', '/works-with-your-software/',
  '/limo-answering-service/', '/after-hours-limo-dispatch/', '/airport-transfer-booking/',
  '/milwaukee-limo-answering-service/', '/madison-limo-answering-service/',
  '/privacy/', '/terms/',
];
const VIEWPORTS = [360, 390, 430, 768, 1024, 1440];

const probe = () => {
  const r = {};
  const nav = document.querySelector('nav.top');
  r.headerH = nav ? Math.round(nav.getBoundingClientRect().height) : null;
  r.overflow = document.documentElement.scrollWidth - window.innerWidth;

  // every element wider than the viewport, so an overflow is attributable
  r.wide = [];
  document.querySelectorAll('body *').forEach(el => {
    const b = el.getBoundingClientRect();
    if (b.width > window.innerWidth + 1 || b.right > window.innerWidth + 1) {
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed') return;
      r.wide.push((el.tagName + '.' + (el.className || '').toString().split(' ')[0]).slice(0, 44)
        + '@' + Math.round(b.right));
    }
  });
  r.wide = r.wide.slice(0, 5);

  const rail = document.querySelector('[data-rail]');
  r.rail = rail ? {
    display: getComputedStyle(rail).display,
    h: Math.round(rail.getBoundingClientRect().height),
    solo: rail.classList.contains('rail--solo'),
    links: rail.querySelectorAll('a').length,
    ariaHidden: rail.getAttribute('aria-hidden'),
  } : null;

  const h1 = document.querySelector('h1');
  r.h1px = h1 ? Math.round(parseFloat(getComputedStyle(h1).fontSize)) : null;
  const secH = document.querySelector('.sec-h');
  r.secHpx = secH ? Math.round(parseFloat(getComputedStyle(secH).fontSize)) : null;
  const body = document.querySelector('.sec-sub, .page-sub, .hero-sub');
  r.bodypx = body ? Math.round(parseFloat(getComputedStyle(body).fontSize) * 10) / 10 : null;
  r.bodyLh = body ? Math.round(parseFloat(getComputedStyle(body).lineHeight)
    / parseFloat(getComputedStyle(body).fontSize) * 100) / 100 : null;

  r.resultHeader = !!document.querySelector('.hc-result');
  r.honest = (document.querySelector('.hc-honest') || {}).textContent || null;
  r.setupCtas = Array.from(document.querySelectorAll('a[href="/book/"]'))
    .map(a => a.textContent.replace(/\s+/g, ' ').trim());
  r.telCtas = Array.from(document.querySelectorAll('a[href^="tel:"]')).length;
  r.railHide = document.querySelectorAll('[data-rail-hide]').length;
  r.railAfter = document.querySelectorAll('[data-rail-after]').length;
  r.steps = document.querySelectorAll('#how .step').length;
  return r;
};

(async () => {
  const browser = await chromium.launch();
  if (SHOTS && !fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  const rows = [];
  const fails = [];

  for (const vw of VIEWPORTS) {
    for (const p of PAGES) {
      const ctx = await browser.newContext({
        viewport: { width: vw, height: 844 },
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      const errs = [];
      page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
      page.on('pageerror', e => errs.push('PAGEERROR ' + String(e).slice(0, 120)));
      await page.goto(BASE + p, { waitUntil: 'load' });
      await page.waitForTimeout(450);
      const r = await page.evaluate(probe);
      r.errs = errs;

      // Rail behaviour: scroll past the hero and re-measure, then check the rail
      // against every input on the page. "Never overlaps inputs" is the law and
      // it is checked by rectangle intersection, not by looking at it.
      await page.evaluate(() => window.scrollTo(0, Math.round(document.body.scrollHeight * 0.45)));
      await page.waitForTimeout(500);
      r.scrolled = await page.evaluate(() => {
        const rail = document.querySelector('[data-rail]');
        if (!rail) return null;
        const cs = getComputedStyle(rail);
        const rb = rail.getBoundingClientRect();
        const on = rail.classList.contains('is-on');
        let overlap = null;
        if (cs.display !== 'none' && cs.visibility === 'visible') {
          document.querySelectorAll('input, textarea, select, iframe, button').forEach(el => {
            const b = el.getBoundingClientRect();
            if (b.width === 0 && b.height === 0) return;
            if (b.bottom > rb.top && b.top < rb.bottom && b.right > rb.left && b.left < rb.right) {
              overlap = overlap || (el.tagName + '#' + (el.id || el.className || '')).slice(0, 40);
            }
          });
        }
        return { on, visibility: cs.visibility, h: Math.round(rb.height), overlap,
                 bodyPadBottom: getComputedStyle(document.body).paddingBottom };
      });

      rows.push({ vw, p, ...r });

      // gate assertions
      if (vw <= 600 && r.headerH !== null && r.headerH > 64) fails.push(`${p}@${vw} header ${r.headerH}px > 64`);
      if (r.overflow > 0) fails.push(`${p}@${vw} h-overflow ${r.overflow}px :: ${r.wide.join(' | ')}`);
      if (errs.length) fails.push(`${p}@${vw} console: ${errs.join(' ; ')}`);
      if (r.rail && r.rail.ariaHidden) fails.push(`${p}@${vw} rail carries aria-hidden (a11y)`);
      if (r.scrolled && r.scrolled.overlap) fails.push(`${p}@${vw} rail overlaps ${r.scrolled.overlap}`);
      if (r.scrolled && r.scrolled.h && r.scrolled.h < 56 && r.scrolled.visibility === 'visible')
        fails.push(`${p}@${vw} rail ${r.scrolled.h}px < 56`);

      if (SHOTS && (vw === 390 || vw === 1440)) {
        const name = 'RUN7-' + (p === '/' ? 'home' : p.replace(/\//g, '')) + '-' + vw + '.png';
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(250);
        await page.screenshot({ path: path.join(OUT, name), fullPage: false });
      }
      await ctx.close();
    }
  }

  await browser.close();
  fs.writeFileSync(path.join(__dirname, '..', 'audits', 'run7-gate.json'), JSON.stringify(rows, null, 1));

  console.log('\n=== HEADER HEIGHT (mobile ceiling 64px) ===');
  [360, 390, 430].forEach(vw => {
    const hs = rows.filter(r => r.vw === vw).map(r => r.headerH);
    console.log(`  ${vw}px  min ${Math.min(...hs)}  max ${Math.max(...hs)}`);
  });

  console.log('\n=== TYPE SCALE ===');
  [390, 1440].forEach(vw => {
    const r = rows.find(x => x.vw === vw && x.p === '/');
    const q = rows.find(x => x.vw === vw && x.p === '/limo-answering-service/');
    console.log(`  ${vw}px  home h1 ${r.h1px}px · sec-h ${r.secHpx}px · body ${r.bodypx}px/lh ${r.bodyLh}`
      + ` | interior h1 ${q.h1px}px · sec-h ${q.secHpx}px · body ${q.bodypx}px/lh ${q.bodyLh}`);
  });

  console.log('\n=== RAIL @390 ===');
  rows.filter(r => r.vw === 390).forEach(r => {
    const s = r.scrolled || {};
    console.log(`  ${r.p.padEnd(36)} display:${r.rail && r.rail.display} solo:${r.rail && r.rail.solo}`
      + ` links:${r.rail && r.rail.links} on:${s.on} vis:${s.visibility} h:${s.h}`
      + ` pad:${s.bodyPadBottom} hideAnchors:${r.railHide} after:${r.railAfter}`);
  });

  console.log('\n=== SETUP CTA LABELS (uniqueness) ===');
  const labels = new Set();
  rows.filter(r => r.vw === 390).forEach(r => r.setupCtas.forEach(l => labels.add(l)));
  Array.from(labels).forEach(l => console.log('  "' + l + '"'));

  console.log('\n=== FAILURES ===');
  if (!fails.length) console.log('  none');
  else Array.from(new Set(fails)).forEach(f => console.log('  X ' + f));
  console.log(`\n  ${rows.length} page-viewport combinations checked`);
  process.exit(fails.length ? 1 : 0);
})();
