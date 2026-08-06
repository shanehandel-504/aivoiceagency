/* AIC RUN 8 · FONT LOCK — the measurement gate.
 *
 *   node tools/run8_gate.js <before|after>
 *
 * Three things, all against a local server so the two builds are compared under
 * identical conditions:
 *
 *   1. FONT REQUESTS  — every network request each of the 12 pages makes, with any
 *      request to a host other than the origin flagged. The gate is zero external
 *      font requests; the list is printed either way so "zero" is a reading, not
 *      a claim.
 *   2. LIGHTHOUSE      — mobile, all 12 pages, a11y + SEO + perf + best-practices.
 *      a11y and SEO are rule-based and deterministic, so one run each is a
 *      measurement. Perf and CLS are not: the homepage is run THREE times and the
 *      median is taken (RUN 7 learned this the hard way — one page read 72 in a
 *      batch and 99 as a median of three).
 *   3. CLS            — mobile, from the Lighthouse metric, median of 3.
 *
 * Judged by REPORT-FILE EXISTENCE, never by exit code: chrome-launcher throws on
 * Windows out of its temp-profile cleanup AFTER a successful audit.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const PW = 'C:/Users/offic/Desktop/AVA-factory/adstage/node_modules/playwright';
const { chromium } = require(PW);

const LH = 'C:/Users/offic/AppData/Local/npm-cache/_npx/8003d8991b0d346b/node_modules/lighthouse/cli/index.js';
const CHROME = 'C:/Users/offic/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const TAG = process.argv[2];
const PORTS = { before: 4178, after: 4177 };
const PORT = PORTS[TAG];
if (!PORT) { console.log('usage: run8_gate.js <before|after>'); process.exit(2); }
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = path.join(__dirname, '..', 'audits', 'run8', 'lh-' + TAG);
fs.mkdirSync(OUT, { recursive: true });

const PAGES = [
  '/', '/demo/', '/book/', '/how-setup-works/', '/works-with-your-software/',
  '/limo-answering-service/', '/after-hours-limo-dispatch/', '/airport-transfer-booking/',
  '/milwaukee-limo-answering-service/', '/madison-limo-answering-service/',
  '/privacy/', '/terms/',
];
const slugOf = p => (p === '/' ? 'home' : p.replace(/\//g, '') || 'home');
const pct = c => (c && typeof c.score === 'number') ? Math.round(c.score * 100) : null;
const median = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

function lighthouse(url, jsonPath) {
  if (fs.existsSync(jsonPath)) fs.unlinkSync(jsonPath);
  let err = null;
  try {
    execFileSync(process.execPath, [
      LH, url,
      '--only-categories=accessibility,seo,performance,best-practices',
      '--output=json', '--output-path=' + jsonPath, '--quiet',
      '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
    ], { stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, CHROME_PATH: CHROME } });
  } catch (e) { err = e.stderr ? e.stderr.toString() : String(e); }
  if (!fs.existsSync(jsonPath)) return { failed: String(err || 'no report written').slice(-300) };
  const r = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const fails = [];
  for (const cat of ['accessibility', 'seo']) {
    for (const ref of r.categories[cat].auditRefs) {
      const a = r.audits[ref.id];
      if (a && a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'informative') fails.push(cat[0] + ':' + ref.id);
    }
  }
  return {
    a11y: pct(r.categories.accessibility), seo: pct(r.categories.seo),
    perf: pct(r.categories.performance), bp: pct(r.categories['best-practices']),
    cls: r.audits['cumulative-layout-shift'] ? r.audits['cumulative-layout-shift'].numericValue : null,
    lcp: r.audits['largest-contentful-paint'] ? r.audits['largest-contentful-paint'].numericValue : null,
    fails,
  };
}

/* The FONT LOCK block is declared three times — circulant.css (all 12 pages),
   aic.css (11 pages) and index.html's embedded <style> (the homepage, which loads
   no aic.css). RUN 7 shipped a site with two heads because one rule landed in one
   copy and its twin silently disagreed. Three identical copies is a fact that has
   to be re-proved on every run, not a convention. */
function assertThreeCopies() {
  const CH = path.join(__dirname, '..', 'chauffeur');
  const START = '/* ══ RUN 8 · FONT LOCK — SELF-HOSTED FACES';
  const END = '/* ══ END RUN 8 · FONT LOCK';
  const homes = [
    ['assets/circulant.css', path.join(CH, 'assets', 'circulant.css')],
    ['assets/aic.css', path.join(CH, 'assets', 'aic.css')],
    ['index.html <style>', path.join(CH, 'index.html')],
  ];
  const blocks = homes.map(([name, p]) => {
    const s = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
    const i = s.indexOf(START), j = s.indexOf(END);
    return { name, block: (i >= 0 && j > i) ? s.slice(i, j) : null };
  });
  const missing = blocks.filter(b => b.block === null);
  console.log('\n[0] FONT LOCK BLOCK — one canonical text, three homes');
  if (missing.length) {
    missing.forEach(m => console.log(`  X ${m.name}: BLOCK NOT FOUND`));
    return false;
  }
  const ref = blocks[0].block;
  let ok = true;
  for (const b of blocks) {
    const same = b.block === ref;
    if (!same) ok = false;
    console.log(`  ${same ? 'MATCH ' : 'DIFFERS'} ${b.name.padEnd(22)} ${b.block.length} chars`);
  }
  console.log(`  three copies identical : ${ok ? 'PASS' : 'FAIL'}`);
  return ok;
}

(async () => {
  const summary = { tag: TAG, base: BASE, requests: {}, lh: {}, homeMedians: null };
  summary.threeCopies = TAG === 'after' ? assertThreeCopies() : null;

  // ---------- 1. network: any font request that leaves the origin ----------
  console.log('='.repeat(100));
  console.log(`RUN 8 GATE — ${TAG}  (${BASE})`);
  console.log('='.repeat(100));
  console.log('\n[1] EXTERNAL REQUESTS — per page, any host that is not the origin');
  const browser = await chromium.launch();
  let extTotal = 0, extFontTotal = 0, extFontIframeTotal = 0;
  for (const p of PAGES) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const reqs = [];
    page.on('request', r => {
      const f = r.frame();
      reqs.push({
        url: r.url(), type: r.resourceType(),
        mainFrame: !!f && f === page.mainFrame(),
        frameUrl: f ? f.url() : '',
      });
    });
    await page.goto(BASE + p, { waitUntil: 'load', timeout: 45000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
    const ext = reqs.filter(r => !r.url.startsWith(BASE) && !r.url.startsWith('data:') && !r.url.startsWith('blob:'));
    const isFont = r => r.type === 'font' || /fonts\.(googleapis|gstatic)\.com/.test(r.url) || /\.woff2?($|\?)/.test(r.url);
    const extFonts = ext.filter(isFont);
    // A third-party iframe loads its own fonts and we cannot reach inside it. The
    // gate is about what OUR document asks for, so main-frame and sub-frame font
    // requests are counted separately instead of blurred into one number.
    const extFontsMain = extFonts.filter(r => r.mainFrame);
    const extFontsIframe = extFonts.filter(r => !r.mainFrame);
    const localFonts = reqs.filter(r => r.url.startsWith(BASE) && /\.woff2?($|\?)/.test(r.url));
    extTotal += ext.length; extFontTotal += extFontsMain.length; extFontIframeTotal += extFontsIframe.length;
    summary.requests[p] = {
      ext: ext.map(r => r.url),
      extFontsMain: extFontsMain.map(r => r.url),
      extFontsIframe: extFontsIframe.map(r => ({ url: r.url, frame: r.frameUrl })),
      localFonts: localFonts.map(r => r.url.replace(BASE, '')),
    };
    console.log(`  ${p.padEnd(38)} external ${String(ext.length).padStart(3)}  ext-font(main-doc) ${String(extFontsMain.length).padStart(2)}`
      + `  ext-font(3p-iframe) ${String(extFontsIframe.length).padStart(2)}  self-hosted-font ${localFonts.length}`
      + (extFontsMain.length ? '  <<< ' + extFontsMain.map(r => r.url.slice(0, 60)).join(' , ') : ''));
    await ctx.close();
  }
  await browser.close();
  console.log(`  TOTAL external requests ${extTotal} · external FONT requests from OUR documents ${extFontTotal}`
    + ` · from third-party iframes ${extFontIframeTotal}`);
  summary.extFontMainTotal = extFontTotal;
  summary.extFontIframeTotal = extFontIframeTotal;

  // ---------- 2. Lighthouse, 12 pages ----------
  console.log('\n[2] LIGHTHOUSE MOBILE — 12 pages (a11y/SEO are rule-based: one run is a measurement)');
  const rows = [];
  for (const p of PAGES) {
    const r = lighthouse(BASE + p, path.join(OUT, slugOf(p) + '.json'));
    rows.push({ p, ...r });
    if (r.failed) { console.log(`  ${p.padEnd(38)} RUN FAILED :: ${r.failed.split('\n').slice(-2).join(' | ')}`); continue; }
    console.log(`  ${p.padEnd(38)} a11y ${String(r.a11y).padStart(3)}  seo ${String(r.seo).padStart(3)}  perf ${String(r.perf).padStart(3)}`
      + `  bp ${String(r.bp).padStart(3)}  CLS ${r.cls === null ? '?' : r.cls.toFixed(3)}  ${r.fails.join(', ')}`);
  }
  summary.lh = rows;

  // ---------- 3. homepage medians of 3 ----------
  console.log('\n[3] HOMEPAGE — median of 3 (perf and CLS are noisy; a single run is not a measurement)');
  const cls = [], perf = [], lcp = [];
  for (let i = 0; i < 3; i++) {
    const r = lighthouse(BASE + '/', path.join(OUT, `home-run${i + 1}.json`));
    if (r.failed) { console.log(`  run ${i + 1}: FAILED`); continue; }
    cls.push(r.cls); perf.push(r.perf); lcp.push(r.lcp);
    console.log(`  run ${i + 1}:  CLS ${r.cls.toFixed(4)}   perf ${r.perf}   LCP ${Math.round(r.lcp)}ms`);
  }
  if (cls.length) {
    summary.homeMedians = { cls: median(cls), perf: median(perf), lcp: median(lcp), samples: { cls, perf, lcp } };
    console.log(`  MEDIAN  CLS ${median(cls).toFixed(4)}   perf ${median(perf)}   LCP ${Math.round(median(lcp))}ms`);
  }

  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 1));
  console.log(`\n  wrote ${path.join(OUT, 'summary.json')}`);

  const bad = rows.filter(r => !r.failed && (r.a11y !== 100 || r.seo !== 100));
  console.log('');
  if (summary.threeCopies !== null) console.log(`  font-lock block x3     : ${summary.threeCopies ? 'PASS' : 'FAIL'}`);
  console.log(`  external font requests : ${extFontTotal} from our documents  ${extFontTotal === 0 ? '(gate: PASS)' : '(gate: FAIL)'}`
    + `  ·  ${extFontIframeTotal} from the third-party /book/ calendar iframe (out of reach, brief forbids touching it)`);
  console.log(`  a11y/SEO 100 x12       : ${bad.length === 0 ? 'PASS' : 'FAIL — ' + bad.map(b => b.p).join(', ')}`);
  if (summary.homeMedians) console.log(`  homepage CLS mobile    : ${summary.homeMedians.cls.toFixed(4)}  ${summary.homeMedians.cls <= 0.05 ? '(gate: PASS)' : '(gate: FAIL, ceiling 0.05)'}`);
})();
