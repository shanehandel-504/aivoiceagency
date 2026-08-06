/* AIC RUN 7 · CLS probe at a real desktop viewport.
 *
 * Lighthouse runs a 412px mobile emulation, where the hero is one column and
 * .cta-stack's font-swap reflow dominates. The result header lives inside the
 * console, which on desktop sits BESIDE the stack — so its shift only shows up
 * at a two-column width. This measures with PerformanceObserver at 1440, which
 * is where the regression was found, and attributes each shift to its source.
 *
 *   node tools/run7_cls_probe.js [runs]
 */
const PW = 'C:/Users/offic/Desktop/AVA-factory/adstage/node_modules/playwright';
const { chromium } = require(PW);
const RUNS = +(process.argv[2] || 3);

/* One row PER SHIFT ENTRY. The first version of this added each entry's value
   to every one of its sources, so a single shift with four sources looked like
   four shifts and the attribution was worthless. */
const probe = () => new Promise(res => {
  let total = 0;
  const entries = [];
  new PerformanceObserver(list => {
    for (const e of list.getEntries()) {
      if (e.hadRecentInput) continue;
      total += e.value;
      entries.push({
        v: Math.round(e.value * 10000) / 10000,
        t: Math.round(e.startTime),
        src: (e.sources || []).slice(0, 3).map(s => {
          const n = s.node;
          if (!n) return '?';
          const name = n.nodeName === '#text' && n.parentElement
            ? 'text<' + n.parentElement.nodeName.toLowerCase() + '.'
              + String(n.parentElement.className || '').split(' ')[0] + '>'
            : n.nodeName.toLowerCase() + '.' + String(n.className || '').split(' ')[0];
          const dy = Math.round((s.currentRect.top || 0) - (s.previousRect.top || 0));
          return name + (dy ? `(Δy${dy})` : '');
        }).join(' + '),
      });
    }
  }).observe({ type: 'layout-shift', buffered: true });
  setTimeout(() => res({ cls: Math.round(total * 10000) / 10000, entries }), 5200);
});

(async () => {
  const browser = await chromium.launch();
  for (const [tag, base] of [['before', 'http://127.0.0.1:4178'], ['after', 'http://127.0.0.1:4177']]) {
    const vals = [];
    let last = {};
    for (let i = 0; i < RUNS; i++) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
      const r = await page.evaluate(probe);
      vals.push(r.cls); last = r.entries;
      await ctx.close();
    }
    vals.sort((a, b) => a - b);
    console.log(`  ${tag.padEnd(7)} CLS median ${vals[Math.floor(vals.length / 2)]}  [${vals.join(', ')}]`);
    last.sort((a, b) => b.v - a.v).slice(0, 5).forEach(e =>
      console.log(`          ${String(e.v).padEnd(8)} @${String(e.t).padStart(5)}ms  ${e.src}`));
  }
  await browser.close();
})();
