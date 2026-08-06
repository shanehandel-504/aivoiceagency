/* AIC RUN 7 · final proof shots — full viewport, and a full-page strip of the
 * homepage so the section lighting rhythm can be read as one sequence.
 *   node tools/run7_proof.js
 */
const path = require('path');
const fs = require('fs');
const PW = 'C:/Users/offic/Desktop/AVA-factory/adstage/node_modules/playwright';
const { chromium } = require(PW);
const AFTER = 'http://127.0.0.1:4177';
const BEFORE = 'http://127.0.0.1:4178';
const OUT = path.join(__dirname, '..', 'audits', 'run7');

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const shot = async (base, url, vw, vh, name, opts = {}) => {
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(base + url, { waitUntil: 'load' });
    if (opts.scrollTo !== undefined) await page.evaluate(y => window.scrollTo(0, y), opts.scrollTo);
    await page.waitForTimeout(opts.settle || 1200);
    await page.screenshot({ path: path.join(OUT, name), fullPage: !!opts.full });
    await ctx.close();
    console.log('   ' + name);
  };

  // the fold, both eras
  await shot(BEFORE, '/', 390, 844, 'FOLD-home-390-before.png', { settle: 1500 });
  await shot(AFTER, '/', 390, 844, 'FOLD-home-390-after.png', { settle: 1500 });
  await shot(BEFORE, '/', 1440, 900, 'FOLD-home-1440-before.png', { settle: 1500 });
  await shot(AFTER, '/', 1440, 900, 'FOLD-home-1440-after.png', { settle: 1500 });

  // the console at 390 with its own header clear of the fixed nav
  await shot(AFTER, '/', 390, 844, 'CONSOLE-header-390-after.png', { scrollTo: 620, settle: 9200 });

  // the whole homepage, so the lighting rhythm reads as one sequence
  await shot(BEFORE, '/', 1280, 900, 'STRIP-home-1280-before.png', { full: true, settle: 2500 });
  await shot(AFTER, '/', 1280, 900, 'STRIP-home-1280-after.png', { full: true, settle: 2500 });

  // an interior page, de-carded
  await shot(BEFORE, '/limo-answering-service/', 1280, 900, 'STRIP-limo-1280-before.png', { full: true, settle: 1200 });
  await shot(AFTER, '/limo-answering-service/', 1280, 900, 'STRIP-limo-1280-after.png', { full: true, settle: 1200 });

  // narrowest supported viewport, header + rail together
  await shot(AFTER, '/', 360, 780, 'FOLD-home-360-after.png', { settle: 1500 });

  await browser.close();
})();
