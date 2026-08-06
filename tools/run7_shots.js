/* AIC RUN 7 · before/after proof shots.
 *
 * :4177 is the working tree, :4178 is a detached worktree at the pre-RUN-7
 * commit. The same selectors are shot on both, so the pairs are genuinely the
 * same section rather than the same scroll offset on two pages of different
 * height. Sections that RUN 7 renamed or restructured are shot by the selector
 * that exists on each side.
 *
 *   node tools/run7_shots.js
 */
const path = require('path');
const fs = require('fs');
const PW = 'C:/Users/offic/Desktop/AVA-factory/adstage/node_modules/playwright';
const { chromium } = require(PW);

const AFTER = 'http://127.0.0.1:4177';
const BEFORE = 'http://127.0.0.1:4178';
const OUT = path.join(__dirname, '..', 'audits', 'run7');

/* [name, page, selector-after, selector-before, viewport, settle-ms] */
const SHOTS = [
  ['nav',        '/', 'nav.top',   'nav.top',        390, 400],
  ['nav',        '/', 'nav.top',   'nav.top',        1440, 400],
  ['hero',       '/', '.hero',     '.hero',          390, 9200],
  ['hero',       '/', '.hero',     '.hero',          1440, 9200],
  ['console',    '/', '#hero-console', '#hero-console', 390, 9200],
  ['console',    '/', '#hero-console', '#hero-console', 1440, 9200],
  ['stages',     '/', '#how',      '#how',           1440, 3800],
  ['stages',     '/', '#how',      '#how',           390, 3800],
  ['pain',       '/', '#pain',     '#pain',          1440, 600],
  ['features',   '/', '#features', '#features',      1440, 600],
  ['crush',      '/', '#crush',    '#crush',         1440, 3200],
  ['crush',      '/', '#crush',    '#crush',         390, 3200],
  ['setup',      '/', '#setup',    '#setup',         1440, 600],
  ['founder',    '/', '#founder',  '#founder',       1440, 600],
  ['founder',    '/', '#founder',  '#founder',       390, 600],
  ['integrations','/','#integrations','#integrations',1440, 600],
  ['cards-interior', '/limo-answering-service/', '#problem', '#problem', 1440, 600],
  ['compare-interior','/limo-answering-service/','#compare','#compare',  1440, 600],
  ['cta-interior',   '/limo-answering-service/', '#talk',   '#talk',     390, 600],
  ['book-head',      '/book/',                   '.phead',  '.phead',    390, 600],
];

/* the rail has no "before" — it did not exist */
const RAIL_SHOTS = [
  ['rail', '/', 390], ['rail', '/limo-answering-service/', 390], ['rail', '/demo/', 390],
];

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  let n = 0, missing = [];

  for (const [name, page_, selA, selB, vw, settle] of SHOTS) {
    for (const [tag, base, sel] of [['before', BEFORE, selB], ['after', AFTER, selA]]) {
      const ctx = await browser.newContext({ viewport: { width: vw, height: 900 }, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      try {
        await page.goto(base + page_, { waitUntil: 'load' });
        // -110px so the fixed header does not sit on top of the element being
        // shot. The first pass scrolled the target flush to the viewport top and
        // photographed the nav lying across the console's own header row.
        await page.evaluate(s => {
          const e = document.querySelector(s);
          if (!e) return;
          const y = e.getBoundingClientRect().top + window.scrollY - 110;
          window.scrollTo(0, Math.max(0, y));
        }, sel);
        await page.waitForTimeout(settle);
        const el = await page.$(sel);
        if (!el) { missing.push(`${tag} ${page_} ${sel}`); await ctx.close(); continue; }
        const file = path.join(OUT, `${name}-${vw}-${tag}.png`);
        await el.screenshot({ path: file });
        n++;
      } catch (e) {
        missing.push(`${tag} ${page_} ${sel} :: ${String(e).slice(0, 70)}`);
      }
      await ctx.close();
    }
  }

  for (const [name, page_, vw] of RAIL_SHOTS) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: 844 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(AFTER + page_, { waitUntil: 'load' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
    await page.waitForTimeout(700);
    const slug = page_ === '/' ? 'home' : page_.replace(/\//g, '');
    await page.screenshot({ path: path.join(OUT, `${name}-${slug}-${vw}-after.png`) });
    n++;
    await ctx.close();
  }

  await browser.close();
  console.log(`  ${n} shots written to audits/run7/`);
  if (missing.length) { console.log('  MISSING:'); missing.forEach(m => console.log('   - ' + m)); }
  fs.readdirSync(OUT).sort().forEach(f => console.log('   ' + f));
})();
