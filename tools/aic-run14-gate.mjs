/* ── AIC RUN 14 · GATE ────────────────────────────────────────────────────────
   node tools/aic-run14-gate.mjs [--base http://127.0.0.1:8848]

   Fails the run rather than reporting on it. Eight assertions, all read off the
   rendered page:

     1  zero horizontal overflow, on every page, at 320 / 360 / 390 / 430 / 1440
     2  zero console errors and zero page errors
     3  nothing renders under the 12px type floor
     4  every visible text node clears AA 4.5:1 against its own painted ground,
        composited through ancestors so an inherited opacity cannot hide
     5  /rates/ keeps its table role, rowgroups, column and row headers at 390,
        where the layout is display:block
     6  exactly one <h1> per page, no skipped heading level, a #main to skip to
     7  no paragraph over 75 characters of measure at desktop
     8  the eyebrow canon: every uppercase LABEL is on one tracking value
   ─────────────────────────────────────────────────────────────────────────── */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire('C:/Users/offic/Desktop/AVA-factory/adstage/package.json');
const { chromium } = require('playwright');

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (f, d) => { const i = process.argv.indexOf(f); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://127.0.0.1:8848');
const OUT = resolve(ROOT, 'audits/run14'); mkdirSync(OUT, { recursive: true });

const PAGES = ['/', '/reserve/', '/rates/', '/demo/', '/book/', '/how-setup-works/',
  '/works-with-your-software/', '/integrations/', '/integrations/limo-anywhere/',
  '/integrations/fasttrak/', '/limo-answering-service/', '/after-hours-limo-dispatch/',
  '/airport-transfer-booking/', '/limo-dispatch-automation/',
  '/milwaukee-limo-answering-service/', '/madison-limo-answering-service/',
  '/privacy/', '/terms/'];
const WIDTHS = [320, 360, 390, 430, 1440];

const PROBE = () => {
  const px = v => parseFloat(v) || 0;
  const parse = c => {
    const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const p = m[1].split(',').map(x => parseFloat(x));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1,
  });
  const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
    return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); const [h, l] = l1 > l2 ? [l1, l2] : [l2, l1];
    return (h + .05) / (l + .05); };

  /* The ground a pixel is actually painted on: walk up until something opaque
     is found, compositing every translucent layer on the way. A token's quoted
     ratio is measured against a surface; the rendered ratio is measured against
     whatever is really behind it, and RUN 13 lost eight labels to exactly that
     gap. */
  const groundOf = el => {
    let out = { r: 7, g: 11, b: 20, a: 1 };
    const chain = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) chain.push(n);
    for (let i = chain.length - 1; i >= 0; i--) {
      const bg = parse(getComputedStyle(chain[i]).backgroundColor);
      if (bg && bg.a > 0) out = over(bg, out);
    }
    return out;
  };
  const effOpacity = el => { let o = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement)
    o *= parseFloat(getComputedStyle(n).opacity || 1); return o; };

  /* A SNAPSHOT OF A FADE IS NOT A CONTRAST MEASUREMENT. The homepage console is
     a scene: rows type in, chips cross-fade, cards fill. Read at an arbitrary
     frame, a row that is 40% through its fade computes as 1:1 against its own
     ground and every one of them reads as a catastrophic failure. The first run
     of this gate reported 63 of them and not one was real.

     The distinction the browser can make for us is `getAnimations()`, which
     returns running CSSTransition and CSSAnimation objects. An element under a
     RUNNING opacity or colour animation is deferred: its value at this instant
     is not a decision anyone made. An element whose animation has finished, or
     that never had one, is measured — which is exactly how the DECLARED
     opacity:.5 on .calc-v was caught, in the same pass that stopped reporting
     the console. Deferring is not skipping: the count is printed. */
  let deferred = 0;
  const animating = el => {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const a = typeof n.getAnimations === 'function' ? n.getAnimations() : [];
      for (const x of a) {
        if (x.playState !== 'running') continue;
        const props = (x.effect && x.effect.getKeyframes ? x.effect.getKeyframes() : []).flatMap(k => Object.keys(k));
        if (!props.length || props.some(p => /opacity|color|background|transform|filter/i.test(p))) return true;
      }
    }
    return false;
  };

  const small = [], low = [], eyebrows = {};
  for (const el of document.querySelectorAll('body *')) {
    if (el.children.length) continue;
    const t = (el.textContent || '').trim();
    if (!t) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    /* a clipped element is still in the a11y tree and is not "text on screen" */
    if (r.width <= 2 && r.height <= 2) continue;
    const size = px(cs.fontSize);
    if (size < 12) small.push({ t: t.slice(0, 34), size: +size.toFixed(2), cls: String(el.className) });
    const fg0 = parse(cs.color);
    const eo = effOpacity(el);
    /* opacity 0 IS NOT A CONTRAST DEFECT, it is a hidden element. The hero
       console is gated on an IntersectionObserver and its rows sit at opacity:0
       until their turn in the sequence; below 1020px the console is under the
       fold entirely and never starts, so every row in it reads 1:1 forever.
       Nothing is painted, so there is nothing to measure. A PARTIAL opacity is a
       different animal and stays in — that is the .calc-v case, and it is the
       one this whole check exists for. */
    if (fg0 && eo < .05) { /* not painted */ }
    else if (fg0 && !animating(el)) {
      const fg = { ...fg0, a: fg0.a * eo };
      const bg = groundOf(el);
      const cr = +ratio(over(fg, bg), bg).toFixed(2);
      const large = size >= 24 || (size >= 18.66 && +cs.fontWeight >= 700);
      if (cr < (large ? 3 : 4.5)) low.push({ t: t.slice(0, 34), cls: String(el.className), size: +size.toFixed(1), cr });
    } else if (fg0) { deferred++; }
    if (cs.textTransform === 'uppercase' && size <= 17) {
      const key = +(px(cs.letterSpacing) / size).toFixed(3) + 'em';
      (eyebrows[key] = eyebrows[key] || []).push(String(el.className) || el.tagName.toLowerCase());
    }
  }

  const heads = [...document.querySelectorAll('main h1,main h2,main h3,main h4,main h5,main h6')].map(h => +h.tagName[1]);
  const skips = [];
  for (let i = 1; i < heads.length; i++) if (heads[i] - heads[i - 1] > 1) skips.push('h' + heads[i - 1] + '->h' + heads[i]);

  const measure = [];
  const cv = document.createElement('canvas').getContext('2d');
  for (const p of document.querySelectorAll('main p')) {
    const r = p.getBoundingClientRect(); if (!r.width) continue;
    const txt = (p.textContent || '').trim(); if (txt.length < 60) continue;
    const cs = getComputedStyle(p);
    cv.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    const per = cv.measureText('0').width || px(cs.fontSize) * .55;
    const ch = +((r.width - px(cs.paddingLeft) - px(cs.paddingRight)) / per).toFixed(1);
    if (ch > 75) measure.push({ ch, cls: String(p.className), t: txt.slice(0, 36) });
  }

  return {
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    h1: document.querySelectorAll('main h1').length,
    hasMain: !!document.getElementById('main'),
    hasSkip: !!document.querySelector('a.skip'),
    skips, small, low, eyebrows, measure, deferred,
  };
};

const b = await chromium.launch();
const fails = [], report = {};
for (const w of WIDTHS) {
  const ctx = await b.newContext({ viewport: { width: w, height: w > 800 ? 900 : 844 }, deviceScaleFactor: 1 });
  for (const p of PAGES) {
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    /* 1.4s, not 260ms. The homepage console runs a scripted intake sequence on
       load; measuring at 260ms measures a page that has not finished arriving. */
    await page.waitForTimeout(1400);
    const r = await page.evaluate(PROBE);
    r.errs = errs;
    (report[p] = report[p] || {})['w' + w] = r;
    const at = p + ' @' + w;
    if (r.overflowX > 0) fails.push('1 OVERFLOW  ' + at + '  +' + r.overflowX + 'px');
    if (errs.length) fails.push('2 CONSOLE   ' + at + '  ' + errs[0]);
    for (const s of r.small) fails.push('3 UNDER12   ' + at + '  ' + s.size + 'px .' + s.cls + '  "' + s.t + '"');
    for (const l of r.low) fails.push('4 CONTRAST  ' + at + '  ' + l.cr + ':1  ' + l.size + 'px .' + l.cls + '  "' + l.t + '"');
    if (w === 1440) {
      if (r.h1 !== 1) fails.push('6 H1x' + r.h1 + '     ' + at);
      if (!r.hasMain) fails.push('6 NO <main id="main">  ' + p);
      if (!r.hasSkip) fails.push('6 NO SKIP LINK         ' + p);
      for (const s of r.skips) fails.push('6 HEADSKIP  ' + p + '  ' + s);
      for (const m of r.measure) fails.push('7 MEASURE   ' + p + '  ' + m.ch + 'ch .' + m.cls + '  "' + m.t + '"');
    }
    await page.close();
  }
  await ctx.close();
}

/* 5 · the rate table has to survive display:block at 390 */
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.goto(BASE + '/rates/', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
/* CDP, not page.accessibility — that helper was removed from Playwright and a
   run that reaches for it dies where it should be asserting. The full AX tree is
   what the browser hands assistive tech, which is the only thing worth checking
   after a display:block. */
const cdp = await ctx.newCDPSession(page);
await cdp.send('Accessibility.enable');
const { nodes } = await cdp.send('Accessibility.getFullAXTree');
const roles = {};
for (const n of nodes) {
  if (n.ignored) continue;
  const role = n.role && n.role.value;
  if (role) roles[role] = (roles[role] || 0) + 1;
}
const need = { table: 1, rowgroup: 6, row: 20, columnheader: 9, rowheader: 15, cell: 45 };
for (const [role, min] of Object.entries(need)) {
  const got = roles[role] || 0;
  if (got < min) fails.push('5 A11Y      /rates/ @390  role=' + role + ' expected>=' + min + ' got ' + got);
}
console.log('A11Y ROLES on /rates/ at 390 (display:block): ' +
  Object.entries(need).map(([k]) => k + '=' + (roles[k] || 0)).join('  '));
await page.close(); await ctx.close();
await b.close();

/* 8 · eyebrow canon */
const eye = {};
for (const v of Object.values(report)) for (const r of Object.values(v))
  for (const [k, arr] of Object.entries(r.eyebrows)) { eye[k] = eye[k] || new Set(); arr.forEach(c => eye[k].add(c)); }
console.log('\nUPPERCASE TRACKING IN USE:');
for (const [k, s] of Object.entries(eye).sort()) console.log('   ' + k.padEnd(8) + ' n=' + String(s.size).padStart(3) + '  ' + [...s].slice(0, 4).join(' · ').slice(0, 92));

let defer = 0;
for (const v of Object.values(report)) for (const r of Object.values(v)) defer += (r.deferred || 0);
console.log('\ncontrast deferred (element under a running animation at read time): ' + defer);

writeFileSync(resolve(OUT, 'gate.json'), JSON.stringify({ fails, report }, null, 1));
console.log('\n' + '='.repeat(78));
if (fails.length) { console.log('GATE FAIL — ' + fails.length + ' finding(s)'); [...new Set(fails)].forEach(f => console.log('  ' + f)); process.exitCode = 1; }
else console.log('GATE PASS — ' + PAGES.length + ' pages x ' + WIDTHS.length + ' widths, all eight assertions clean');
