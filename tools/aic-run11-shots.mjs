#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// AIC RUN 11 · "TACTILE CUT" — THE EYES GATE
// ---------------------------------------------------------------------------
//   node tools/aic-run11-shots.mjs <before|after|live> [origin]
//
// RUN 10's set plus what RUN 11 changed and no numeric probe can answer:
//   · the 430 nav row, which is the tightest bar on this site (RUN 10 gotcha 3)
//   · the two sections the brief named, photographed AS A DEEP LINK LANDS ON
//     THEM, which is the only view in which the § 1 defect was ever visible
//   · the primary control close enough to see the chamfer, at rest and pressed
//   · the callback header row collapsed and open, so the chevron can be read
//
// Trap 4 applies throughout: IntersectionObserver has NOT fired one frame after
// scrollTo, and scroll-behavior on this site is smooth, so a fragment jump from
// the far end of the document is still travelling when a naive probe measures.
// Every anchor shot is a FRESH context, which is also the honest test — it is
// what a reader following a deep link actually gets.
// ═══════════════════════════════════════════════════════════════════════════
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire('C:/Users/offic/Desktop/AVA-factory/adstage/package.json');
const { chromium } = require('playwright');

const PHASE = process.argv[2] || 'after';
const ORIGIN = process.argv[3] || 'http://127.0.0.1:8848';
const OUT = new URL(`../audits/run11/${PHASE}/`, import.meta.url).pathname.slice(1);
mkdirSync(OUT, { recursive: true });

const b = await chromium.launch();
const shot = async (name, w, h, fn, clip) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await fn(p);
  await p.screenshot({ path: `${OUT}${name}.png`, ...(clip ? { clip } : {}) });
  console.log(`  ${PHASE}/${name}.png`);
  await ctx.close();
};

const settle = async (p, sel) => {
  if (!sel) { await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400); return; }
  await p.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: 'center' }), sel);
  await p.waitForTimeout(500);
  await p.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: 'center' }), sel);
  await p.waitForTimeout(900);
};

// ── RUN 10's five, kept so the two sets are comparable ────────────────────
for (const [w, h] of [[390, 844], [1440, 900]]) {
  for (const [name, sel, open] of [
    ['home', null, false], ['crush', '#crush', false],
    ['form', '#ava-callback', false], ['form-open', '#ava-callback', true],
    ['footer', 'footer', false],
  ]) {
    await shot(`${name}-${w}`, w, h, async (p) => {
      await p.goto(ORIGIN + '/', { waitUntil: 'networkidle' });
      if (open) {
        const head = await p.$('[data-cb-toggle]');
        const shown = await p.evaluate(() => !!document.querySelector('.cb-body')?.getClientRects().length);
        if (head && !shown) { await head.click(); await p.waitForTimeout(250); }
      }
      await settle(p, sel);
    });
  }
}

// ── § 1 · the two named sections, as a deep link lands on them ────────────
for (const w of [390, 430]) {
  for (const id of ['lead-protection', 'operators']) {
    await shot(`anchor-${id}-${w}`, w, w === 390 ? 844 : 932, async (p) => {
      await p.goto(`${ORIGIN}/#${id}`, { waitUntil: 'networkidle' });
      await p.waitForTimeout(1600);
    });
  }
}

// ── the 430 nav row — the tightest bar on the site ────────────────────────
await shot('nav-430', 430, 932, async (p) => {
  await p.goto(ORIGIN + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);
}, { x: 0, y: 0, width: 430, height: 120 });

// ── § 2 · the primary control, close enough to read the chamfer ───────────
for (const [name, w, h] of [['primary-390', 390, 844], ['primary-1440', 1440, 900]]) {
  await shot(name, w, h, async (p) => {
    await p.goto(ORIGIN + '/', { waitUntil: 'networkidle' });
    await p.waitForTimeout(500);
  }, await (async () => {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    const q = await ctx.newPage();
    await q.goto(ORIGIN + '/', { waitUntil: 'networkidle' });
    await q.waitForTimeout(400);
    const r = await q.evaluate(() => {
      const el = document.querySelector('.tel-btn');
      const b = el.getBoundingClientRect();
      return { x: Math.max(0, b.x - 26), y: Math.max(0, b.y - 26), width: b.width + 52, height: b.height + 52 };
    });
    await ctx.close();
    return r;
  })());
}

// § 2 · pressed. :active cannot be forced by CSS state, so the pointer is
// actually held down on the control and the shutter fires while it is.
await shot('primary-pressed-390', 390, 844, async (p) => {
  await p.goto(ORIGIN + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);
  const el = await p.$('.tel-btn');
  const box = await el.boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await p.mouse.down();
  await p.waitForTimeout(220);
});

// ── § 5 · the callback header row, both states, close up ──────────────────
for (const [name, open] of [['drawer-closed-390', false], ['drawer-open-390', true]]) {
  await shot(name, 390, 844, async (p) => {
    await p.goto(ORIGIN + '/', { waitUntil: 'networkidle' });
    await p.waitForTimeout(400);
    const head = await p.$('[data-cb-toggle]');
    const shown = await p.evaluate(() => !!document.querySelector('.cb-body')?.getClientRects().length);
    if (head && shown !== open) { await head.click(); await p.waitForTimeout(300); }
    await p.evaluate(() => document.querySelector('.cb-form')?.scrollIntoView({ block: 'center' }));
    await p.waitForTimeout(600);
  });
}

// ── § 5 · the third state, painted ────────────────────────────────────────
await shot('drawer-error-390', 390, 844, async (p) => {
  await p.goto(ORIGIN + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  const head = await p.$('[data-cb-toggle]');
  const shown = await p.evaluate(() => !!document.querySelector('.cb-body')?.getClientRects().length);
  if (head && !shown) { await head.click(); await p.waitForTimeout(250); }
  // a real submit with an empty number takes the real failure path
  await p.click('[data-cb-submit]');
  await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('.cb-form')?.scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(500);
});

// ── § 6 · an open FAQ row ─────────────────────────────────────────────────
for (const w of [390, 1440]) {
  await shot(`faq-open-${w}`, w, w === 390 ? 844 : 900, async (p) => {
    await p.goto(ORIGIN + '/#faq', { waitUntil: 'networkidle' });
    await p.waitForTimeout(1400);
    await p.evaluate(() => { const d = document.querySelector('#faq details'); if (d) d.open = true; });
    await p.waitForTimeout(400);
  });
}

// ── § 4 · the demo pair ───────────────────────────────────────────────────
for (const w of [390, 1440]) {
  await shot(`demo-pair-${w}`, w, w === 390 ? 844 : 900, async (p) => {
    await p.goto(ORIGIN + '/#demo', { waitUntil: 'networkidle' });
    await p.waitForTimeout(1400);
  });
}

await b.close();
console.log(`\nwrote to audits/run11/${PHASE}/`);
