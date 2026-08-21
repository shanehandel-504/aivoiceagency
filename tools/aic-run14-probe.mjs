/* AIC RUN 14 · targeted probe. node tools/aic-run14-probe.mjs
   Names the ELEMENT behind each odd recipe the audit counted, so a formatting
   fix lands on the rule that produced the pixel rather than on a guess. */
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/offic/Desktop/AVA-factory/adstage/package.json');
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8848';
const PAGES = ['/', '/reserve/', '/rates/', '/demo/', '/book/', '/how-setup-works/',
  '/works-with-your-software/', '/integrations/', '/integrations/limo-anywhere/',
  '/integrations/fasttrak/', '/limo-answering-service/', '/after-hours-limo-dispatch/',
  '/airport-transfer-booking/', '/limo-dispatch-automation/',
  '/milwaukee-limo-answering-service/', '/madison-limo-answering-service/',
  '/privacy/', '/terms/'];

const PROBE = () => {
  const px = v => parseFloat(v) || 0;
  const out = { labels: [], ghost: [], small: [] };
  for (const el of document.querySelectorAll('body *')) {
    if (el.children.length) continue;
    const t = (el.textContent || '').trim();
    if (!t) continue;
    const cs = getComputedStyle(el);
    const size = px(cs.fontSize);
    const ls = px(cs.letterSpacing);
    if (cs.textTransform === 'uppercase' && size <= 17) {
      out.labels.push({
        sel: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).trim().split(/\s+/).join('.') : ''),
        parent: el.parentElement ? el.parentElement.tagName.toLowerCase() + (el.parentElement.className ? '.' + String(el.parentElement.className).trim().split(/\s+/).join('.') : '') : '',
        size: +size.toFixed(2), ls: +ls.toFixed(3), em: +(ls / size).toFixed(3), fw: cs.fontWeight,
        fam: cs.fontFamily.split(',')[0].replace(/["']/g, ''), t: t.slice(0, 28),
      });
    }
    if (size < 12 && t.length > 1) out.small.push({
      sel: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).trim().split(/\s+/).join('.') : ''),
      size: +size.toFixed(2), t: t.slice(0, 34),
    });
  }
  for (const el of document.querySelectorAll('.btn')) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (!r.width) continue;
    out.ghost.push({
      cls: String(el.className).trim(), fs: cs.fontSize, h: +r.height.toFixed(1),
      parent: el.parentElement ? String(el.parentElement.className).trim() || el.parentElement.tagName : '',
      t: (el.textContent || '').trim().slice(0, 30),
    });
  }
  return out;
};

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const labels = new Map(), ghosts = new Map(), smalls = new Map();
for (const p of PAGES) {
  const page = await ctx.newPage();
  await page.goto(BASE + p, { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  const r = await page.evaluate(PROBE);
  for (const l of r.labels) {
    const k = l.fam + '|' + l.size + '|' + l.em + 'em|' + l.fw;
    if (!labels.has(k)) labels.set(k, []);
    const a = labels.get(k);
    if (a.length < 3) a.push(p + '  ' + l.sel + '  in ' + l.parent + '  "' + l.t + '"');
  }
  for (const g of r.ghost) {
    const k = g.cls + '|' + g.fs + '|' + g.h;
    if (!ghosts.has(k)) ghosts.set(k, p + '  in ' + g.parent + '  "' + g.t + '"');
  }
  for (const s of r.small) {
    const k = s.sel + '|' + s.size;
    if (!smalls.has(k)) smalls.set(k, p + '  "' + s.t + '"');
  }
  await page.close();
}
await b.close();

console.log('=== UPPERCASE LABEL RECIPES (desktop) ===');
for (const [k, v] of [...labels].sort()) { console.log(' ' + k); v.forEach(x => console.log('     ' + x)); }
console.log('\n=== .btn RECIPES ===');
for (const [k, v] of [...ghosts].sort()) console.log(' ' + k + '   <- ' + v);
console.log('\n=== TEXT UNDER 12px ===');
for (const [k, v] of [...smalls].sort()) console.log(' ' + k + '   <- ' + v);
