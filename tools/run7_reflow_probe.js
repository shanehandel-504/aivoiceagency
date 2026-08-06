/* AIC RUN 7 · which element inside the hero console changes height when the
 * webfont swaps in? Measures every child before document.fonts.ready and again
 * after, and prints the deltas. That is the CLS source, stated exactly.
 *   node tools/run7_reflow_probe.js [before|after]
 */
const PW = 'C:/Users/offic/Desktop/AVA-factory/adstage/node_modules/playwright';
const { chromium } = require(PW);
const BASE = process.argv[2] === 'before' ? 'http://127.0.0.1:4178' : 'http://127.0.0.1:4177';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // Freeze at first paint: grab heights before the font faces resolve.
  await page.goto(BASE + '/', { waitUntil: 'commit' });
  await page.waitForSelector('#hero-console', { timeout: 10000 });
  const snap = () => page.evaluate(() => {
    const out = {};
    const add = (k, el) => { if (el) out[k] = Math.round(el.getBoundingClientRect().height * 10) / 10; };
    add('console', document.querySelector('#hero-console'));
    add('console-bar', document.querySelector('#hero-console .console-bar'));
    add('hc-honest', document.querySelector('.hc-honest'));
    add('hc-state', document.querySelector('#hc-state'));
    add('hc-result', document.querySelector('.hc-result'));
    add('hc-transcript', document.querySelector('#hc-transcript'));
    add('console-title', document.querySelector('#hero-console .console-title'));
    add('h1', document.querySelector('h1.hero-h'));
    add('hero-sub', document.querySelector('.hero-sub'));
    add('cta-stack', document.querySelector('.cta-stack'));
    add('tel-btn', document.querySelector('.tel-btn'));
    add('cb-form', document.querySelector('.cb-form'));
    return out;
  });

  const a = await snap();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  const b = await snap();

  console.log(`  ${process.argv[2] === 'before' ? 'BEFORE' : 'AFTER'} — height change across the font swap (1440px):`);
  Object.keys(b).forEach(k => {
    const d = Math.round((b[k] - (a[k] || 0)) * 10) / 10;
    if (Math.abs(d) >= 0.5) console.log(`   ${k.padEnd(16)} ${a[k]} -> ${b[k]}   Δ ${d > 0 ? '+' : ''}${d}px`);
  });
  const unchanged = Object.keys(b).filter(k => Math.abs(b[k] - (a[k] || 0)) < 0.5);
  console.log('   unchanged: ' + unchanged.join(', '));
  await browser.close();
})();
