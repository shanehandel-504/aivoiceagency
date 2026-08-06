/* AIC RUN 7 · the STICKY action rail under prefers-reduced-motion.
 *
 * The behavioural gate covers the console, the four-stage rail and the Crush.
 * The sticky rail also moves (translateY), so it owes the same proof: it must
 * still appear and still hide, without a slide.
 *
 *   node tools/run7_rail_reduced.js
 */
const PW = 'C:/Users/offic/Desktop/AVA-factory/adstage/node_modules/playwright';
const { chromium } = require(PW);
const BASE = 'http://127.0.0.1:4177';
const PAGES = ['/', '/limo-answering-service/', '/book/', '/demo/'];

(async () => {
  const browser = await chromium.launch();
  const fails = [];
  for (const p of PAGES) {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 }, reducedMotion: 'reduce',
    });
    const page = await ctx.newPage();
    await page.goto(BASE + p, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(900);

    const top = await page.evaluate(() => {
      const r = document.querySelector('[data-rail]');
      return r ? getComputedStyle(r).visibility : 'MISSING';
    });

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.95));
    await page.waitForTimeout(700);
    const bottom = await page.evaluate(() => {
      const r = document.querySelector('[data-rail]');
      if (!r) return null;
      const cs = getComputedStyle(r);
      const b = r.getBoundingClientRect();
      let overlap = null;
      document.querySelectorAll('input,textarea,select,iframe,button').forEach(el => {
        const q = el.getBoundingClientRect();
        if (q.width === 0 && q.height === 0) return;
        if (q.bottom > b.top && q.top < b.bottom && q.right > b.left && q.left < b.right) {
          overlap = overlap || el.tagName;
        }
      });
      return {
        visibility: cs.visibility, transitionDuration: cs.transitionDuration,
        h: Math.round(b.height), onScreen: b.top < innerHeight && b.bottom > 0,
        overlap, pad: getComputedStyle(document.body).paddingBottom,
      };
    });

    console.log(`  ${p.padEnd(28)} top:${top}  bottom:${bottom.visibility}`
      + ` h:${bottom.h} onScreen:${bottom.onScreen} transition:${bottom.transitionDuration}`
      + ` overlap:${bottom.overlap || 'none'} pad:${bottom.pad}`);

    if (top !== 'hidden') fails.push(`${p} rail is visible at the top of the page`);
    if (bottom.visibility !== 'visible' || !bottom.onScreen) fails.push(`${p} rail never appeared under reduced motion`);
    if (bottom.overlap) fails.push(`${p} rail overlaps ${bottom.overlap} under reduced motion`);
    // reduced motion must not SLIDE it in; a 0s (or effectively instant) transform is required
    if (parseFloat(bottom.transitionDuration) > 0.05) fails.push(`${p} rail still slides: ${bottom.transitionDuration}`);
    await ctx.close();
  }
  await browser.close();
  console.log('\n=== FAILURES ===');
  if (!fails.length) console.log('  none'); else fails.forEach(f => console.log('  X ' + f));
  process.exit(fails.length ? 1 : 0);
})();
