/* ── AIC RUN 14 · SHOWROOM AUDIT ──────────────────────────────────────────────
   node tools/aic-run14-audit.mjs [--base http://127.0.0.1:8848] [--out audits/run14]

   Reads the RENDERED page, never the stylesheet. A formatting pass judged from
   CSS is a formatting pass judged from intent; these are the numbers the
   browser actually produced. Per page, per viewport:

     · horizontal overflow at 390 — the one defect a stylesheet cannot show you
     · console errors
     · heading ladder: h1 count and every skipped level
     · paragraph measure in CHARACTERS, computed from the rendered face rather
       than from a max-width in the CSS, because a ch unit and a real glyph
       advance are not the same number
     · every distinct uppercase-label recipe (family|size|tracking|weight) —
       "one eyebrow system" becomes a count instead of a claim
     · every button recipe in use, same reason
     · CTA labels that wrap to two lines
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
const OUT = resolve(ROOT, arg('--out', 'audits/run14'));
mkdirSync(OUT, { recursive: true });

const PAGES = ['/', '/reserve/', '/rates/', '/demo/', '/book/', '/how-setup-works/',
  '/works-with-your-software/', '/integrations/', '/integrations/limo-anywhere/',
  '/integrations/fasttrak/', '/limo-answering-service/', '/after-hours-limo-dispatch/',
  '/airport-transfer-booking/', '/limo-dispatch-automation/',
  '/milwaukee-limo-answering-service/', '/madison-limo-answering-service/',
  '/privacy/', '/terms/'];

const VIEWS = [{ n: 'm390', w: 390, h: 844 }, { n: 'd1440', w: 1440, h: 900 }];

const PROBE = () => {
  const px = v => parseFloat(v) || 0;
  const seen = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };

  const heads = [...document.querySelectorAll('main h1,main h2,main h3,main h4,main h5,main h6')]
    .map(h => ({ lvl: +h.tagName[1], t: (h.textContent || '').trim().slice(0, 60) }));
  const skips = [];
  for (let i = 1; i < heads.length; i++) {
    if (heads[i].lvl - heads[i - 1].lvl > 1) skips.push('h' + heads[i - 1].lvl + ' to h' + heads[i].lvl + ' at ' + heads[i].t);
  }

  const cv = document.createElement('canvas').getContext('2d');
  const measure = [];
  for (const p of document.querySelectorAll('main p')) {
    if (!seen(p)) continue;
    const cs = getComputedStyle(p);
    const txt = (p.textContent || '').trim();
    if (txt.length < 60) continue;
    cv.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    const per = cv.measureText('0').width || px(cs.fontSize) * 0.55;
    const w = p.getBoundingClientRect().width - px(cs.paddingLeft) - px(cs.paddingRight);
    measure.push({ ch: +(w / per).toFixed(1), cls: p.className || '(none)', t: txt.slice(0, 40) });
  }

  const eyebrows = {};
  for (const el of document.querySelectorAll('main *,footer *')) {
    if (el.children.length) continue;
    const t = (el.textContent || '').trim();
    if (!t) continue;
    const cs = getComputedStyle(el);
    if (cs.textTransform !== 'uppercase') continue;
    const size = px(cs.fontSize);
    if (size > 17) continue;
    const key = cs.fontFamily.split(',')[0].replace(/["']/g, '') + '|' + size + 'px|' + cs.letterSpacing + '|' + cs.fontWeight;
    (eyebrows[key] = eyebrows[key] || []).push(t.slice(0, 34));
  }

  const btns = {};
  for (const el of document.querySelectorAll('a,button')) {
    if (!seen(el)) continue;
    const cls = (el.className || '').toString().trim();
    if (!/btn|cta|tel-|nav-book|nav-cta|rail-|submit|play/.test(cls)) continue;
    const cs = getComputedStyle(el);
    const key = cls.split(/\s+/).filter(c => /btn|cta|tel-|nav-book|nav-cta|rail-|submit|play/.test(c)).join(' ');
    const r = el.getBoundingClientRect();
    const lh = px(cs.lineHeight) || px(cs.fontSize) * 1.2;
    const label = el.querySelector('.tel-main') || el.querySelector('.rail-label') || el;
    const lr = label.getBoundingClientRect();
    (btns[key] = btns[key] || []).push({
      h: +r.height.toFixed(1), r: cs.borderRadius, fs: cs.fontSize, fw: cs.fontWeight,
      bg: cs.backgroundColor, color: cs.color,
      lines: Math.max(1, Math.round(lr.height / lh)),
      t: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 44),
    });
  }

  return {
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    h1: [...document.querySelectorAll('main h1')].map(h => h.textContent.trim()).slice(0, 4),
    skips, measure, eyebrows, btns,
  };
};

const b = await chromium.launch();
const report = {};
for (const v of VIEWS) {
  const ctx = await b.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 1 });
  for (const p of PAGES) {
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    await page.waitForTimeout(240);
    const r = await page.evaluate(PROBE);
    r.consoleErrors = errs;
    (report[p] = report[p] || {})[v.n] = r;
    await page.close();
  }
  await ctx.close();
}
await b.close();
writeFileSync(resolve(OUT, 'audit.json'), JSON.stringify(report, null, 1));

console.log('PAGE                                    OFLW390   H1  SKIPS  ERRS  MAXCH  FLAGS');
for (const [p, v] of Object.entries(report)) {
  const m = v.m390, d = v.d1440;
  const mx = d.measure.length ? Math.max(...d.measure.map(x => x.ch)) : 0;
  const flag = (m.overflowX > 0 ? 'OVERFLOW ' : '') + (d.h1.length !== 1 ? 'H1x' + d.h1.length + ' ' : '')
    + (d.skips.length ? 'SKIP ' : '') + (m.consoleErrors.length + d.consoleErrors.length ? 'ERR ' : '')
    + (mx > 75 ? 'WIDE' : '');
  console.log(p.padEnd(40), String(m.overflowX).padStart(5), String(d.h1.length).padStart(5),
    String(d.skips.length).padStart(5), String(m.consoleErrors.length + d.consoleErrors.length).padStart(5),
    String(mx).padStart(6), '  ', flag);
}

const wrapped = [];
for (const [p, v] of Object.entries(report))
  for (const [vn, r] of Object.entries(v))
    for (const [k, arr] of Object.entries(r.btns))
      for (const x of arr) if (x.lines > 1) wrapped.push(p + ' ' + vn + ' .' + k + ' ' + x.lines + 'L "' + x.t + '"');
console.log('\nWRAPPED CTA LABELS: ' + (wrapped.length ? '\n  ' + wrapped.join('\n  ') : 'none'));

const skipList = [];
for (const [p, v] of Object.entries(report)) for (const s of v.d1440.skips) skipList.push(p + '  ' + s);
console.log('\nHEADING SKIPS:' + (skipList.length ? '\n  ' + skipList.join('\n  ') : ' none'));

const wide = [];
for (const [p, v] of Object.entries(report)) for (const m of v.d1440.measure) if (m.ch > 75) wide.push(p + '  ' + m.ch + 'ch  .' + m.cls + '  "' + m.t + '"');
console.log('\nPARAGRAPHS OVER 75ch AT DESKTOP:' + (wide.length ? '\n  ' + wide.join('\n  ') : ' none'));

const allEye = {};
for (const v of Object.values(report)) for (const r of Object.values(v))
  for (const [k, arr] of Object.entries(r.eyebrows)) { allEye[k] = allEye[k] || new Set(); arr.forEach(t => allEye[k].add(t)); }
console.log('\nUPPERCASE-LABEL RECIPES (' + Object.keys(allEye).length + ' distinct):');
for (const [k, s] of Object.entries(allEye).sort()) console.log('   ' + k + '   n=' + s.size + '  e.g. ' + [...s][0]);

const allBtn = {};
for (const v of Object.values(report)) for (const r of Object.values(v))
  for (const [k, arr] of Object.entries(r.btns)) { allBtn[k] = allBtn[k] || new Set(); arr.forEach(x => allBtn[k].add(x.h + '|' + x.r + '|' + x.fs + '|' + x.fw + '|' + x.bg)); }
console.log('\nBUTTON RECIPES (' + Object.keys(allBtn).length + ' distinct class sets):');
for (const [k, s] of Object.entries(allBtn).sort()) { console.log('   .' + k); [...s].forEach(x => console.log('       ' + x)); }
