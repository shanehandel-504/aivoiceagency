/* ── AIC RUN 14 · SHOTS ───────────────────────────────────────────────────────
   node tools/aic-run14-shots.mjs --tag before --pages /reserve/,/rates/,/,/demo/

   Full-page renders at 390x844 and 1440x900 into audits/run14/<tag>/. Full page
   rather than viewport, because a formatting pass is judged on rhythm down the
   whole document and a fold crop hides every spacing decision below it.

   MSYS NOTE: run this from PowerShell, or export MSYS_NO_PATHCONV=1 first. Bash
   on Windows rewrites a leading-slash argument into a drive path, which silently
   eats the FIRST entry of a comma-joined --pages list.
   ─────────────────────────────────────────────────────────────────────────── */
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire('C:/Users/offic/Desktop/AVA-factory/adstage/package.json');
const { chromium } = require('playwright');

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (f, d) => { const i = process.argv.indexOf(f); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://127.0.0.1:8848');
const TAG = arg('--tag', 'shot');
const PAGES = arg('--pages', '/,/reserve/,/rates/,/demo/').split(',').filter(Boolean);
const FOLD = process.argv.includes('--fold');
const OUT = resolve(ROOT, 'audits/run14', TAG);
mkdirSync(OUT, { recursive: true });

const VIEWS = [{ n: '390', w: 390, h: 844 }, { n: 'desk', w: 1440, h: 900 }];
const b = await chromium.launch();
for (const v of VIEWS) {
  const ctx = await b.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 1 });
  for (const p of PAGES) {
    const page = await ctx.newPage();
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const slug = (p.replace(/^\/|\/$/g, '') || 'home').replace(/\//g, '-');
    const file = resolve(OUT, slug + '-' + v.n + (FOLD ? '-fold' : '') + '.png');
    await page.screenshot({ path: file, fullPage: !FOLD });
    console.log('wrote', file);
    await page.close();
  }
  await ctx.close();
}
await b.close();
