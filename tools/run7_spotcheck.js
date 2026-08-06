/* AIC RUN 7 · spot-check renders for pages not covered by the before/after pack.
 *   node tools/run7_spotcheck.js
 */
const path = require('path');
const PW = 'C:/Users/offic/Desktop/AVA-factory/adstage/node_modules/playwright';
const { chromium } = require(PW);
const BASE = 'http://127.0.0.1:4177';
const OUT = path.join(__dirname, '..', 'audits', 'run7');

const JOBS = [
  ['SPOT-how-setup-works-1280', '/how-setup-works/', 1280, 900, '#steps'],
  ['SPOT-demo-390', '/demo/', 390, 844, '#what-to-say'],
  ['SPOT-book-390', '/book/', 390, 844, '#talk'],
  ['SPOT-works-with-1280', '/works-with-your-software/', 1280, 900, '#honest'],
];

(async () => {
  const browser = await chromium.launch();
  for (const [name, url, vw, vh, sel] of JOBS) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(BASE + url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(900);
    await page.evaluate(s => {
      const e = document.querySelector(s);
      if (!e) return;
      window.scrollTo(0, Math.max(0, e.getBoundingClientRect().top + window.scrollY - 110));
    }, sel);
    await page.waitForTimeout(1100);
    await page.screenshot({ path: path.join(OUT, name + '.png') });
    console.log('   ' + name + '.png');
    await ctx.close();
  }
  await browser.close();
})();
