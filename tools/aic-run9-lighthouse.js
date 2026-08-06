/* AIC RUN 9 · Lighthouse gate — mobile, all twelve pages, before vs after.
 *
 * Gate: Accessibility 100 and SEO 100 on every page; Performance no lower than
 * the pre-run tree. Best-Practices is PRINTED, not chased: /book/ embeds a
 * third-party booking iframe and its console output is not ours to fix.
 *
 * Lighthouse 12 is ESM-only, so this drives the CLI as a subprocess and does the
 * arithmetic here. Chrome is the Playwright Chromium already on this machine.
 *
 * TWO TRAPS THIS FILE IS BUILT AROUND, both learned the hard way:
 *   1. chrome-launcher can throw AFTER Lighthouse has already written a good
 *      report. Judge by the REPORT FILE, never by the exit code.
 *   2. One run is noise. Performance is the MEDIAN OF THREE; a11y and SEO are
 *      deterministic and run once.
 *
 *   node tools/aic-run9-lighthouse.js
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LH = 'C:/Users/offic/AppData/Local/npm-cache/_npx/8003d8991b0d346b/node_modules/lighthouse/cli/index.js';
const CHROME = 'C:/Users/offic/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const AFTER = process.env.RUN9_AFTER || 'http://127.0.0.1:8848';
const BEFORE = process.env.RUN9_BEFORE || 'http://127.0.0.1:8849';
const OUT = path.join(__dirname, '..', 'audits', 'run9', 'lh');

const PAGES = [
  '/', '/demo/', '/book/', '/how-setup-works/', '/works-with-your-software/',
  '/limo-answering-service/', '/after-hours-limo-dispatch/', '/airport-transfer-booking/',
  '/milwaukee-limo-answering-service/', '/madison-limo-answering-service/',
  '/privacy/', '/terms/',
];

fs.mkdirSync(OUT, { recursive: true });
const slug = (p) => (p === '/' ? 'home' : p.replace(/\//g, '').trim());

function run(base, p, tag) {
  const out = path.join(OUT, tag + '.json');
  try { fs.unlinkSync(out); } catch (e) { /* first run */ }
  try {
    execFileSync(process.execPath, [
      LH, base + p,
      '--only-categories=performance,accessibility,seo,best-practices',
      '--form-factor=mobile', '--screenEmulation.mobile',
      '--output=json', '--output-path=' + out,
      '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
      '--quiet', '--max-wait-for-load=45000',
    ], { stdio: 'ignore', env: { ...process.env, CHROME_PATH: CHROME }, timeout: 180000 });
  } catch (e) {
    // TRAP 1: the launcher can throw after a good report has been written.
    // Say nothing here; the file is the verdict.
  }
  if (!fs.existsSync(out)) return null;
  const j = JSON.parse(fs.readFileSync(out, 'utf8'));
  const s = (k) => (j.categories[k] && j.categories[k].score !== null ? Math.round(j.categories[k].score * 100) : null);
  return {
    perf: s('performance'), a11y: s('accessibility'), seo: s('seo'), bp: s('best-practices'),
    lcp: j.audits['largest-contentful-paint'] ? j.audits['largest-contentful-paint'].numericValue : null,
    cls: j.audits['cumulative-layout-shift'] ? j.audits['cumulative-layout-shift'].numericValue : null,
    a11yFails: Object.values(j.audits).filter(a => a.score === 0 && a.scoreDisplayMode === 'binary' &&
      (j.categories.accessibility.auditRefs || []).some(r => r.id === a.id)).map(a => a.id),
    seoFails: Object.values(j.audits).filter(a => a.score === 0 && a.scoreDisplayMode === 'binary' &&
      (j.categories.seo.auditRefs || []).some(r => r.id === a.id)).map(a => a.id),
  };
}

const median = (xs) => { const a = xs.filter(x => x !== null).sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : null; };

const rows = [];
for (const p of PAGES) {
  const name = slug(p);
  process.stderr.write('  ' + name + ' ... ');
  const afterRuns = [run(AFTER, p, 'after-' + name + '-1'), run(AFTER, p, 'after-' + name + '-2'), run(AFTER, p, 'after-' + name + '-3')].filter(Boolean);
  const beforeRuns = [run(BEFORE, p, 'before-' + name + '-1'), run(BEFORE, p, 'before-' + name + '-2'), run(BEFORE, p, 'before-' + name + '-3')].filter(Boolean);
  if (!afterRuns.length) { console.error('\nNO REPORT for ' + p); process.exit(2); }
  const a = afterRuns[0];
  rows.push({
    page: name,
    a11y: a.a11y, seo: a.seo, bp: a.bp,
    perfAfter: median(afterRuns.map(r => r.perf)),
    perfBefore: median(beforeRuns.map(r => r.perf)),
    lcp: Math.round(median(afterRuns.map(r => r.lcp))),
    cls: +median(afterRuns.map(r => r.cls)).toFixed(3),
    a11yFails: a.a11yFails, seoFails: a.seoFails,
    runsAfter: afterRuns.map(r => r.perf).join('/'),
    runsBefore: beforeRuns.map(r => r.perf).join('/'),
  });
  process.stderr.write('a11y ' + a.a11y + ' seo ' + a.seo + ' perf ' + median(afterRuns.map(r => r.perf)) + '\n');
}

console.log('\n══ RUN 9 LIGHTHOUSE · mobile · median of 3 for performance ══\n');
console.log('page                            a11y  seo   BP   perf(before -> after)   LCP    CLS');
let bad = 0;
for (const r of rows) {
  const drop = r.perfBefore !== null && r.perfAfter < r.perfBefore;
  if (r.a11y !== 100 || r.seo !== 100 || drop) bad++;
  console.log(
    r.page.padEnd(32) +
    String(r.a11y).padEnd(6) + String(r.seo).padEnd(6) + String(r.bp).padEnd(5) +
    (String(r.perfBefore) + ' -> ' + String(r.perfAfter)).padEnd(24) +
    (String(r.lcp) + 'ms').padEnd(7) + String(r.cls) +
    (r.a11y !== 100 ? '   A11Y:' + r.a11yFails.join(',') : '') +
    (r.seo !== 100 ? '   SEO:' + r.seoFails.join(',') : '') +
    (drop ? '   PERF REGRESSION' : ''));
}
console.log('\nraw perf runs (after / before):');
rows.forEach(r => console.log('  ' + r.page.padEnd(32) + r.runsAfter.padEnd(12) + r.runsBefore));
console.log('\nGATE lighthouse a11y=100 seo=100 perf>=pre-run: ' + (bad ? 'FAIL (' + bad + ')' : 'PASS'));
fs.writeFileSync(path.join(OUT, '..', 'lighthouse.json'), JSON.stringify(rows, null, 1));
process.exit(bad ? 1 : 0);
