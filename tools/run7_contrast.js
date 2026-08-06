/* AIC RUN 7 · contrast gate.
 *
 * CLAUDE.md § 3 says AA 4.5:1 on all body text, "verified, not eyeballed".
 * RUN 7 put a background tint on nearly every section and an amber-black wash
 * on the Crush, so every previously-measured ratio on this site was measured
 * against a surface that no longer exists.
 *
 * This walks every element that renders visible text, composites its effective
 * background down through its ancestors (the tints are all rgba, so the value
 * on the element itself is meaningless in isolation), and measures the real
 * ratio. Large text uses the 3:1 threshold per WCAG; everything else 4.5:1.
 *
 *   node tools/run7_contrast.js
 */
const PW = 'C:/Users/offic/Desktop/AVA-factory/adstage/node_modules/playwright';
const { chromium } = require(PW);
const BASE = 'http://127.0.0.1:4177';

const PAGES = ['/', '/demo/', '/book/', '/how-setup-works/', '/works-with-your-software/',
  '/limo-answering-service/', '/after-hours-limo-dispatch/', '/airport-transfer-booking/',
  '/milwaukee-limo-answering-service/', '/madison-limo-answering-service/',
  '/privacy/', '/terms/'];

const measure = () => {
  const parse = c => {
    const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
    return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null;
  };
  const over = (fg, bg) => [0, 1, 2].map(i => fg[i] * fg[3] + bg[i] * (1 - fg[3])).concat([1]);
  const lum = c => {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };

  // Composite the real backdrop: start at the page canvas and paint every
  // ancestor's background-color down onto it, in document order.
  function backdrop(el) {
    const chain = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) chain.push(n);
    chain.push(document.documentElement);
    let bg = [10, 10, 15, 1];                       // --void, the page canvas
    for (let i = chain.length - 1; i >= 0; i--) {
      const c = parse(getComputedStyle(chain[i]).backgroundColor);
      if (c && c[3] > 0) bg = over(c, bg);
    }
    return bg;
  }

  const out = [];
  document.querySelectorAll('body *').forEach(el => {
    const direct = Array.from(el.childNodes)
      .filter(n => n.nodeType === 3 && n.textContent.trim().length > 1)
      .map(n => n.textContent.trim()).join(' ');
    if (!direct) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return;
    const b = el.getBoundingClientRect();
    if (b.width === 0 || b.height === 0) return;

    const fg = parse(cs.color);
    if (!fg) return;
    const bg = backdrop(el);
    const eff = fg[3] < 1 ? over(fg, bg) : fg;
    const px = parseFloat(cs.fontSize);
    const w = parseInt(cs.fontWeight, 10) || 400;
    const large = px >= 24 || (px >= 18.66 && w >= 700);
    const r = ratio(eff, bg);
    out.push({
      sel: (el.tagName.toLowerCase() + '.' + String(el.className || '').split(' ')[0]).slice(0, 40),
      text: direct.slice(0, 34), px: Math.round(px * 10) / 10, large,
      need: large ? 3 : 4.5, ratio: Math.round(r * 100) / 100,
      pass: r >= (large ? 3 : 4.5),
      fg: cs.color, bgc: 'rgb(' + bg.slice(0, 3).map(Math.round).join(',') + ')',
    });
  });
  return out;
};

(async () => {
  const browser = await chromium.launch();
  const fails = [];
  let checked = 0, minRatio = { ratio: 999 };

  for (const p of PAGES) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    // domcontentloaded, not load: /book/ embeds the GHL booking iframe, which
    // is a live third-party fetch. Waiting on `load` makes an outside network
    // hiccup look like a contrast failure. The 9.2s settle below is far more
    // than enough for our own stylesheet, which is all this measures.
    await page.goto(BASE + p, { waitUntil: 'domcontentloaded' });
    // let the console loop settle on its final state so the green/cyan values
    // that only exist mid-loop are measured too
    await page.waitForTimeout(9200);
    await page.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = true));
    await page.waitForTimeout(150);
    const rows = await page.evaluate(measure);
    checked += rows.length;
    rows.forEach(r => {
      if (r.ratio < minRatio.ratio) minRatio = { ...r, p };
      if (!r.pass) fails.push(`${p} ${r.sel} "${r.text}" ${r.px}px ${r.ratio}:1 (needs ${r.need}) fg=${r.fg} on ${r.bgc}`);
    });
    const worst = rows.slice().sort((a, b) => a.ratio - b.ratio)[0];
    console.log(`  ${p.padEnd(38)} ${String(rows.length).padStart(3)} text nodes · worst `
      + `${worst.ratio}:1 on ${worst.sel} (${worst.px}px, needs ${worst.need})`);
    await ctx.close();
  }
  await browser.close();

  console.log(`\n  ${checked} rendered text nodes measured across ${PAGES.length} pages`);
  console.log(`  lowest ratio anywhere: ${minRatio.ratio}:1 — ${minRatio.sel} "${minRatio.text}" on ${minRatio.p}`);
  console.log('\n=== BELOW AA ===');
  if (!fails.length) console.log('  none');
  else Array.from(new Set(fails)).forEach(f => console.log('  X ' + f));
  process.exit(fails.length ? 1 : 0);
})();
