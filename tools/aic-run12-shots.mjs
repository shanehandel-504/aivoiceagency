#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// AIC RUN 12 · "ALPHA" — THE EYES GATE
// ---------------------------------------------------------------------------
//   node tools/aic-run12-shots.mjs <before|after|live> [origin]
//
// The four new pages, at four widths, framed on the three things no numeric
// probe can answer:
//
//   fold    — does the H1 clear the bar, and is the direct answer the first
//             thing a reader's eye lands on after it
//   table   — does an 11-row two-column table read as a fact table on a phone,
//             or as a wall, and does the mono status column stay legible at 12px
//   ticket  — does the sample card still separate from the canvas at 50%
//             brightness now that it sits under a table
//
// A run that lists those three without having opened the files is lying in a
// format that looks like evidence.
//
// Trap 4: IntersectionObserver has not fired one frame after scrollTo, and
// scroll-behavior on this site is smooth. Every framed shot settles, scrolls
// again, and waits before the shutter. Trap 19: anchor-position shots are taken
// on a FRESH context, which is what a deep link actually is.
// ═══════════════════════════════════════════════════════════════════════════
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire('C:/Users/offic/Desktop/AVA-factory/adstage/package.json');
const { chromium } = require('playwright');

const PHASE = process.argv[2] || 'after';
const ORIGIN = process.argv[3] || 'http://127.0.0.1:8848';
const OUT = new URL(`../audits/run12/${PHASE}/`, import.meta.url).pathname.slice(1);
mkdirSync(OUT, { recursive: true });

const PAGES = [
  ['hub', '/integrations/', '#platforms', '#ticket'],
  ['limo-anywhere', '/integrations/limo-anywhere/', '#fields', '#ticket'],
  ['fasttrak', '/integrations/fasttrak/', '#intake', '#ticket'],
  ['automation', '/limo-dispatch-automation/', '#compare', '#ticket'],
];
const FOLD_W = [[390, 844], [430, 932], [768, 1024], [1440, 900]];
const FRAME_W = [[390, 844], [1440, 900]];

const settle = async (p, sel) => {
  if (!sel) { await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400); return; }
  await p.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: 'start' }), sel);
  await p.waitForTimeout(500);
  await p.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: 'start' }), sel);
  await p.waitForTimeout(900);
};

const b = await chromium.launch();
let n = 0;

for (const [name, path, tableSel, ticketSel] of PAGES) {
  for (const [w, h] of FOLD_W) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    const p = await ctx.newPage();
    await p.goto(ORIGIN + path, { waitUntil: 'networkidle' });
    await settle(p, null);
    await p.screenshot({ path: `${OUT}${name}-fold-${w}.png` });
    console.log('  %s/%s-fold-%d.png', PHASE, name, w); n++;
    await ctx.close();
  }
  for (const [w, h] of FRAME_W) {
    for (const [tag, sel] of [['table', tableSel], ['ticket', ticketSel]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
      const p = await ctx.newPage();
      await p.goto(ORIGIN + path, { waitUntil: 'networkidle' });
      await settle(p, sel);
      await p.screenshot({ path: `${OUT}${name}-${tag}-${w}.png` });
      console.log('  %s/%s-%s-%d.png', PHASE, name, tag, w); n++;
      await ctx.close();
    }
  }
}
await b.close();
console.log('\n  %d shots -> audits/run12/%s/  — THESE EXIST TO BE LOOKED AT\n', n, PHASE);
