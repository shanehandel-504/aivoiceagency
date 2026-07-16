#!/usr/bin/env node
/* P0 RING PROOF — pixel-based, HEADED. Proves the AVA pulse ring actually moves on
 * real GPU compositing (the RUN 1.9 @property/conic ring froze on headed Chrome).
 *
 * NOT computed-style: it screenshots the button's ring band at t and t+800ms, decodes
 * both PNGs to raw pixels via an in-page canvas, and counts pixels that actually changed.
 * A frozen ring → ~0 changed pixels (FAIL). A moving comet → hundreds (PASS).
 *
 *   node tools/ring-proof.mjs                    # localhost:8847, headed chrome + webkit
 *   node tools/ring-proof.mjs https://aivoiceagency.ai
 */
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/offic/Desktop/AVA-factory/adstage/package.json');
const { chromium, webkit } = require('playwright');

const BASE = (process.argv[2] || 'http://localhost:8847').replace(/\/$/, '');
const GAP_MS = 800;
const DIFF_CH = 12;        // per-channel delta that counts a pixel as "changed"
const MIN_PX = 40;         // a real moving comet changes far more than this

async function bandPixels(page, clip) {
  const buf = await page.screenshot({ clip });
  const b64 = buf.toString('base64');
  return await page.evaluate(async (b64) => {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/png;base64,' + b64; });
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
    return Array.from(ctx.getImageData(0, 0, img.width, img.height).data);
  }, b64);
}
function countChanged(a, b) {
  let n = 0;
  for (let i = 0; i < a.length; i += 4) {
    if (Math.abs(a[i] - b[i]) > DIFF_CH || Math.abs(a[i + 1] - b[i + 1]) > DIFF_CH ||
        Math.abs(a[i + 2] - b[i + 2]) > DIFF_CH || Math.abs(a[i + 3] - b[i + 3]) > DIFF_CH) n++;
  }
  return n;
}

async function run(label, launcher, opts) {
  const rows = [];
  let browser;
  try { browser = await launcher.launch({ headless: false, ...opts }); }
  catch (e) {
    console.log(`\n### ${label} — could not launch headed (${e.message.split('\n')[0]}); retrying headless`);
    browser = await launcher.launch({ headless: true, ...opts });
    label += ' (headless fallback)';
  }
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE + '/', { waitUntil: 'load', timeout: 45000 });

  // (a) environment facts — logged, not used as proof
  const env = await page.evaluate(() => {
    let renderer = 'n/a';
    try {
      const gl = document.createElement('canvas').getContext('webgl') || document.createElement('canvas').getContext('experimental-webgl');
      const dbg = gl && gl.getExtension('WEBGL_debug_renderer_info');
      if (dbg) renderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
    } catch (e) {}
    return {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      renderer,
    };
  });

  // the ring is injected on load — wait for it (tolerant: old code has no .ava-lap, so we
  // can still run this same proof against the pre-fix tree to reproduce the freeze).
  await page.waitForSelector('.ava-pulse', { timeout: 8000 });
  await page.waitForSelector('.ava-pulse .ava-lap', { timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(400);
  const box = await page.evaluate(() => {
    const b = document.querySelector('.ava-pulse');
    if (b) b.scrollIntoView({ block: 'center' });
    const r = b.getBoundingClientRect();
    return { x: Math.floor(r.x), y: Math.floor(r.y), width: Math.ceil(r.width), height: Math.ceil(r.height) };
  });
  const clip = { x: Math.max(0, box.x), y: Math.max(0, box.y), width: box.width, height: box.height };

  // (b) pixel diff of the ring band
  const f1 = await bandPixels(page, clip);
  await page.waitForTimeout(GAP_MS);
  const f2 = await bandPixels(page, clip);
  const changed = countChanged(f1, f2);
  const pass = changed >= MIN_PX;

  rows.push([label, env.reducedMotion, env.renderer, changed, pass ? 'PASS' : 'FAIL']);
  await browser.close();
  return rows;
}

const out = [];
out.push(...await run('chrome (channel)', chromium, { channel: 'chrome' }));
out.push(...await run('webkit', webkit, {}));

console.log('\n=== P0 RING PROOF (pixel-based, headed) ===');
console.log('engine                 | reduced-motion | GPU renderer                                   | changed px | verdict');
for (const [l, rm, gpu, px, v] of out) {
  console.log(`${l.padEnd(22)} | ${String(rm).padEnd(14)} | ${String(gpu).slice(0, 46).padEnd(46)} | ${String(px).padEnd(10)} | ${v}`);
}
const failed = out.filter((r) => r[4] !== 'PASS').length;
console.log(`\n${failed === 0 ? 'RING MOVES on all engines (real pixels)' : failed + ' FROZEN/failed'}`);
process.exit(failed ? 1 : 0);
