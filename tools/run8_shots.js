/* AIC RUN 8 · FONT LOCK — proof shots.
 *
 * / and /demo/ at mobile and desktop, from BOTH builds, so the pair can be put
 * side by side rather than asserted to be the same. Same determinism as the
 * line-map probe: reduced motion, frozen clock, fonts.ready + settle.
 *
 *   node tools/run8_shots.js            both builds
 *   node tools/run8_shots.js live       against production instead
 */
const fs = require('fs');
const path = require('path');
const PW = 'C:/Users/offic/Desktop/AVA-factory/adstage/node_modules/playwright';
const { chromium } = require(PW);

const OUT = path.join(__dirname, '..', 'audits', 'run8');
const PAGES = [['/', 'home'], ['/demo/', 'demo']];
const VIEWS = [['390', { width: 390, height: 844 }], ['1440', { width: 1440, height: 900 }]];
const FROZEN = Date.UTC(2026, 7, 5, 19, 30, 0);

const freezeClock = ts => {
  const Real = Date;
  const F = function (...a) { return a.length ? new Real(...a) : new Real(ts); };
  F.now = () => ts; F.parse = Real.parse; F.UTC = Real.UTC; F.prototype = Real.prototype;
  window.Date = F; Math.random = () => 0.42;
};

(async () => {
  const live = process.argv[2] === 'live';
  const builds = live
    ? [['LIVE', 'https://aichauffeur.ai']]
    : [['before', 'http://127.0.0.1:4178'], ['after', 'http://127.0.0.1:4177']];
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  for (const [tag, base] of builds) {
    for (const [url, name] of PAGES) {
      for (const [vname, viewport] of VIEWS) {
        const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
        await ctx.addInitScript(freezeClock, FROZEN);
        const page = await ctx.newPage();
        await page.goto(base + url, { waitUntil: 'load', timeout: 60000 });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(1600);
        const file = path.join(OUT, `${tag}-${name}-${vname}.png`);
        await page.screenshot({ path: file, fullPage: true });
        const px = await page.evaluate(() => document.documentElement.scrollHeight);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
        console.log(`  ${path.basename(file).padEnd(26)} page height ${String(px).padStart(6)}px  horizontal overflow: ${overflow ? 'YES' : 'no'}`);
        await ctx.close();
      }
    }
  }
  await browser.close();
})();
