/* AIC RUN 12 · Lighthouse gate — PRODUCTION ONLY.
 *
 * RUN 9's runner compares a local "after" tree against a local "before" tree.
 * RUN 11 proved that arithmetic is worthless for anything document-size shaped:
 * `python -m http.server` sends everything uncompressed and Vercel serves this
 * site Brotli, so the local harness overstates page weight by ~3.4x. The brief
 * for this run says it plainly — perf is measured on PRODUCTION only — so this
 * runner has no BEFORE origin at all and nothing to be wrong about.
 *
 * Gate: Accessibility 100 and SEO 100 on all sixteen, CLS 0 on all sixteen
 * except /book/, whose third-party booking iframe has contributed 0.001 since
 * RUN 11 and is not ours to fix. Best-Practices is PRINTED, not chased, for the
 * same reason. Performance is the MEDIAN OF THREE and only on the pages worth
 * three runs — the homepage, which is the heaviest document on the host, and
 * the new hub.
 *
 * TRAP 1 (RUN 9, still true): chrome-launcher can throw AFTER Lighthouse has
 * written a good report. Judge by the report FILE, never by the exit code.
 *
 *   node tools/aic-run12-lighthouse.js [origin]
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LH = 'C:/Users/offic/AppData/Local/npm-cache/_npx/8003d8991b0d346b/node_modules/lighthouse/cli/index.js';
const CHROME = 'C:/Users/offic/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const ORIGIN = process.argv[2] || 'https://aichauffeur.ai';
const OUT = path.join(__dirname, '..', 'audits', 'run12', 'lh');
fs.mkdirSync(OUT, { recursive: true });

const PAGES = [
  '/', '/demo/', '/book/', '/how-setup-works/', '/works-with-your-software/',
  '/limo-answering-service/', '/after-hours-limo-dispatch/', '/airport-transfer-booking/',
  '/milwaukee-limo-answering-service/', '/madison-limo-answering-service/',
  '/integrations/', '/integrations/limo-anywhere/', '/integrations/fasttrak/',
  '/limo-dispatch-automation/', '/privacy/', '/terms/',
];
// three runs only where a median is worth the minutes
const TRIPLE = new Set(['/', '/integrations/']);
const slug = (p) => (p === '/' ? 'home' : p.replace(/\//g, '-').replace(/^-|-$/g, ''));

function run(p, tag) {
  const out = path.join(OUT, tag + '.json');
  try { fs.unlinkSync(out); } catch (e) { /* first run */ }
  try {
    execFileSync(process.execPath, [
      LH, ORIGIN + p,
      '--only-categories=performance,accessibility,seo,best-practices',
      '--form-factor=mobile', '--screenEmulation.mobile',
      '--output=json', '--output-path=' + out,
      '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
      '--quiet', '--max-wait-for-load=45000',
    ], { stdio: 'ignore', env: { ...process.env, CHROME_PATH: CHROME }, timeout: 240000 });
  } catch (e) { /* TRAP 1 — the file is the verdict */ }
  if (!fs.existsSync(out)) return null;
  const j = JSON.parse(fs.readFileSync(out, 'utf8'));
  const s = (k) => (j.categories[k] && j.categories[k].score !== null ? Math.round(j.categories[k].score * 100) : null);
  const refIds = (k) => new Set((j.categories[k].auditRefs || []).map(r => r.id));
  const fails = (k) => {
    const ids = refIds(k);
    return Object.values(j.audits)
      .filter(a => a.score === 0 && a.scoreDisplayMode === 'binary' && ids.has(a.id))
      .map(a => a.id);
  };
  return {
    perf: s('performance'), a11y: s('accessibility'), seo: s('seo'), bp: s('best-practices'),
    lcp: j.audits['largest-contentful-paint'] ? j.audits['largest-contentful-paint'].numericValue : null,
    cls: j.audits['cumulative-layout-shift'] ? j.audits['cumulative-layout-shift'].numericValue : null,
    tbt: j.audits['total-blocking-time'] ? j.audits['total-blocking-time'].numericValue : null,
    a11yFails: fails('accessibility'), seoFails: fails('seo'),
  };
}

const median = (xs) => {
  const a = xs.filter(x => x !== null).sort((x, y) => x - y);
  return a.length ? a[Math.floor(a.length / 2)] : null;
};

const rows = [];
for (const p of PAGES) {
  const name = slug(p);
  process.stderr.write('  ' + name + ' ... ');
  const n = TRIPLE.has(p) ? 3 : 1;
  const runs = [];
  for (let i = 1; i <= n; i++) runs.push(run(p, name + '-' + i));
  const ok = runs.filter(Boolean);
  if (!ok.length) { console.error('\nNO REPORT for ' + p); process.exit(2); }
  const a = ok[0];
  rows.push({
    page: name, a11y: a.a11y, seo: a.seo, bp: a.bp,
    perf: median(ok.map(r => r.perf)),
    lcp: Math.round(median(ok.map(r => r.lcp))),
    cls: +median(ok.map(r => r.cls)).toFixed(3),
    tbt: Math.round(median(ok.map(r => r.tbt))),
    a11yFails: a.a11yFails, seoFails: a.seoFails,
    runs: ok.map(r => r.perf).join('/'),
  });
  process.stderr.write('a11y ' + a.a11y + ' seo ' + a.seo + ' perf ' + median(ok.map(r => r.perf)) + '\n');
}

console.log('\n══ RUN 12 LIGHTHOUSE · PRODUCTION · mobile ══\n');
console.log('page                             a11y  seo   BP    perf  LCP      CLS    TBT');
let bad = 0;
for (const r of rows) {
  // /book/ embeds a third-party booking iframe; its 0.001 has been recorded
  // since RUN 11 and is not this codebase's shift to remove.
  const clsFloor = r.page === 'book' ? 0.002 : 0.0005;
  const clsOk = r.cls < clsFloor;
  if (r.a11y !== 100 || r.seo !== 100 || !clsOk) bad++;
  console.log(
    r.page.padEnd(33) + String(r.a11y).padEnd(6) + String(r.seo).padEnd(6) +
    String(r.bp).padEnd(6) + String(r.perf).padEnd(6) +
    (String(r.lcp) + 'ms').padEnd(9) + String(r.cls).padEnd(7) + String(r.tbt) +
    (r.a11y !== 100 ? '   A11Y:' + r.a11yFails.join(',') : '') +
    (r.seo !== 100 ? '   SEO:' + r.seoFails.join(',') : '') +
    (!clsOk ? '   CLS OVER FLOOR' : ''));
}
console.log('\nperf runs (median of the listed values):');
rows.forEach(r => console.log('  ' + r.page.padEnd(33) + r.runs));
fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(rows, null, 1));
console.log('\nGATE run12-lighthouse: ' + (bad ? 'FAIL (' + bad + ')' : 'ALL GREEN') + '\n');
process.exit(bad ? 1 : 0);
