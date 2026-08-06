#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// AIC RUN 10 · "SHOWROOM v2.0" — THE EYES GATE
// ---------------------------------------------------------------------------
// Writes the four mandated shots at two widths into audits/run10/<phase>/.
// These exist to be LOOKED AT, not counted: the acceptance bar for this run is
// "cards visibly separate from canvas on a phone at 50% brightness", which no
// numeric probe can answer.
//
//   node tools/aic-run10-shots.mjs <before|after> [origin]
//
// Trap 4 applies: IntersectionObserver has NOT fired one frame after scrollTo.
// Every scrolled shot settles, scrolls again and waits for the section's own
// resolved state before the shutter.
// ═══════════════════════════════════════════════════════════════════════════
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire('C:/Users/offic/Desktop/AVA-factory/adstage/package.json');
const { chromium } = require('playwright');

const PHASE = process.argv[2] || 'after';
const ORIGIN = process.argv[3] || 'http://127.0.0.1:8848';
const OUT = new URL(`../audits/run10/${PHASE}/`, import.meta.url).pathname.slice(1);
mkdirSync(OUT, { recursive: true });

const WIDTHS = [[390, 844], [1440, 900]];

// [name, path, selector-to-frame | null for full fold, open-the-form?]
// The callback card ships COLLAPSED below 768, so "form" at 390 photographs a
// 44px header row. That is the honest default state and it is worth a shot —
// but it is not the state anyone fills in, so the expanded card gets its own.
const SHOTS = [
  ['home', '/', null, false],
  ['crush', '/', '#crush', false],
  ['form', '/', '#ava-callback', false],
  ['form-open', '/', '#ava-callback', true],
  ['footer', '/', 'footer', false],
];

const settle = async (p, sel) => {
  if (!sel) { await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400); return; }
  await p.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: 'center' }), sel);
  await p.waitForTimeout(500);
  // scroll, settle, scroll again — the page can still be growing on the first pass
  await p.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: 'center' }), sel);
  await p.waitForTimeout(900);
};

const b = await chromium.launch();
for (const [w, h] of WIDTHS) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  for (const [name, path, sel, open] of SHOTS) {
    await p.goto(ORIGIN + path, { waitUntil: 'networkidle' });
    if (open) {
      const head = await p.$('[data-cb-toggle]');
      const shown = await p.evaluate(() => !!document.querySelector('.cb-body')?.getClientRects().length);
      if (head && !shown) { await head.click(); await p.waitForTimeout(200); }
    }
    await settle(p, sel);
    await p.screenshot({ path: `${OUT}${name}-${w}.png` });
    console.log(`  ${PHASE}/${name}-${w}.png`);
  }
  await ctx.close();
}
await b.close();
