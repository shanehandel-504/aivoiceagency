/* AIC RUN 14 · element crop + geometry.
   node tools/aic-run14-zoom.mjs --page /reserve/ --sel ".demo-card" --w 390 --tag demo
   Crops the element (plus a little air) and prints the boxes of its children, so
   a layout defect is looked at AND measured rather than inferred from a full-page
   render at 20% scale. */
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire('C:/Users/offic/Desktop/AVA-factory/adstage/package.json');
const { chromium } = require('playwright');
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (f, d) => { const i = process.argv.indexOf(f); return i > -1 ? process.argv[i + 1] : d; };
const OUT = resolve(ROOT, 'audits/run14/zoom'); mkdirSync(OUT, { recursive: true });

const PAGE = arg('--page', '/reserve/'), SEL = arg('--sel', '.demo-card');
const W = +arg('--w', 390), TAG = arg('--tag', 'zoom');

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: W, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:8848' + PAGE, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
const el = page.locator(SEL).first();
await el.scrollIntoViewIfNeeded();
await page.waitForTimeout(150);
const file = resolve(OUT, TAG + '-' + W + '.png');
await el.screenshot({ path: file });
const boxes = await page.evaluate(({ sel }) => {
  const root = document.querySelector(sel);
  const out = [];
  const walk = (n, d) => {
    for (const c of n.children) {
      const r = c.getBoundingClientRect(); const cs = getComputedStyle(c);
      out.push('  '.repeat(d) + (c.tagName.toLowerCase() + (c.className ? '.' + String(c.className).trim().split(/\s+/).join('.') : ''))
        .padEnd(40 - d * 2) + ' w=' + r.width.toFixed(1).padStart(6) + ' h=' + r.height.toFixed(1).padStart(6)
        + ' x=' + r.x.toFixed(1).padStart(6) + '  ' + cs.display + '  fs=' + cs.fontSize);
      if (d < 3) walk(c, d + 1);
    }
  };
  const r = root.getBoundingClientRect();
  out.unshift(sel.padEnd(40) + ' w=' + r.width.toFixed(1) + ' h=' + r.height.toFixed(1) + ' x=' + r.x.toFixed(1));
  walk(root, 1);
  return out.join('\n');
}, { sel: SEL });
console.log(boxes);
console.log('\nwrote', file);
await b.close();
