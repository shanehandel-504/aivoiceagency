/* Does the console header change height as the state label changes length?
 * "Ringing" -> "Ready for dispatch" is 7 chars -> 18. If that re-wraps the
 * console bar, every field below it moves, and that is a layout shift the loop
 * causes on its own — nothing to do with fonts.
 *   node tools/run7_bar_probe.js [width]
 */
const PW = 'C:/Users/offic/Desktop/AVA-factory/adstage/node_modules/playwright';
const { chromium } = require(PW);
const W = +(process.argv[2] || 1440);

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: W, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:4177/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  const seen = {};
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(250);
    const s = await page.evaluate(() => {
      const st = document.getElementById('hc-state');
      const bar = document.querySelector('#hero-console .console-bar');
      const tr = document.querySelector('#hc-transcript');
      return { label: st.textContent.trim(),
               chipW: Math.round(st.getBoundingClientRect().width),
               barH: Math.round(bar.getBoundingClientRect().height * 10) / 10,
               trTop: Math.round(tr.getBoundingClientRect().top * 10) / 10 };
    });
    seen[s.label] = s;
  }
  console.log(`  at ${W}px:`);
  Object.values(seen).forEach(s =>
    console.log(`   ${s.label.padEnd(20)} chip ${String(s.chipW).padStart(4)}px  bar ${s.barH}px  transcript-top ${s.trTop}`));
  const bars = Object.values(seen).map(s => s.barH);
  const tops = Object.values(seen).map(s => s.trTop);
  console.log(`   bar height spread: ${Math.max(...bars) - Math.min(...bars)}px `
    + `· transcript top spread: ${Math.round((Math.max(...tops) - Math.min(...tops)) * 10) / 10}px`);
  await browser.close();
})();
