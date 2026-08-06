/* Sample the hero console's own geometry every 50ms through first paint and
 * report the exact frame where anything above the field grid gains height.
 *   node tools/run7_5px.js
 */
const PW = 'C:/Users/offic/Desktop/AVA-factory/adstage/node_modules/playwright';
const { chromium } = require(PW);

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:4177/', { waitUntil: 'commit' });
  await page.addScriptTag({ content: `
    window.__samples = [];
    (function tick(){
      const g = document.querySelector('#hero-console .console-grid');
      if (g) {
        const q = s => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().height*10)/10 : null; };
        window.__samples.push({
          t: Math.round(performance.now()),
          gridTop: Math.round(g.getBoundingClientRect().top*10)/10,
          bar: q('#hero-console .console-bar'),
          title: q('#hero-console .console-title'),
          honest: q('.hc-honest'),
          result: q('.hc-result'),
          resultLines: (function(){ const e=document.querySelector('.hc-result'); if(!e) return null;
            const r=document.createRange(); r.selectNodeContents(e); return r.getClientRects().length; })(),
        });
      }
      if (performance.now() < 2500) setTimeout(tick, 50);
    })();
  `}).catch(() => {});
  await page.waitForTimeout(3000);
  const s = await page.evaluate(() => window.__samples || []);
  let prev = null;
  console.log('  t(ms)  gridTop   bar  title  honest  result  resLines   <- change');
  s.forEach(x => {
    const changed = !prev || ['gridTop','bar','title','honest','result','resultLines']
      .some(k => x[k] !== prev[k]);
    if (changed) {
      console.log(`  ${String(x.t).padStart(5)}  ${String(x.gridTop).padStart(7)}  `
        + `${String(x.bar).padStart(4)}  ${String(x.title).padStart(5)}  ${String(x.honest).padStart(6)}  `
        + `${String(x.result).padStart(6)}  ${String(x.resultLines).padStart(8)}`);
    }
    prev = x;
  });
  await browser.close();
})();
