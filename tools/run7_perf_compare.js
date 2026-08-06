/* AIC RUN 7 · perf/CLS regression check.
 *
 * A raw score means nothing without the number it replaced. This runs the same
 * Lighthouse config against :4178 (the pre-RUN-7 commit) and :4177 (the working
 * tree) three times each and reports the MEDIAN, because a single headless run
 * on a machine also hosting two Python servers is noisy enough to invent a
 * 27-point regression that is not there.
 *
 *   node tools/run7_perf_compare.js <path> [runs]
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LH = 'C:/Users/offic/AppData/Local/npm-cache/_npx/8003d8991b0d346b/node_modules/lighthouse/cli/index.js';
const CHROME = 'C:/Users/offic/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const OUT = path.join(__dirname, '..', 'audits', 'lh', 'cmp');
const P = process.argv[2] || '/';
const RUNS = +(process.argv[3] || 3);

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

function run(base, tag, i) {
  const json = path.join(OUT, `${tag}-${i}.json`);
  if (fs.existsSync(json)) fs.unlinkSync(json);
  try {
    execFileSync(process.execPath, [
      LH, base + P, '--only-categories=performance',
      '--output=json', '--output-path=' + json, '--quiet',
      '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
    ], { stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, CHROME_PATH: CHROME } });
  } catch (e) { /* chrome-launcher throws on temp cleanup; the report is the evidence */ }
  if (!fs.existsSync(json)) return null;
  const r = JSON.parse(fs.readFileSync(json, 'utf8'));
  const a = k => r.audits[k];
  return {
    perf: Math.round(r.categories.performance.score * 100),
    cls: a('cumulative-layout-shift').numericValue,
    lcp: Math.round(a('largest-contentful-paint').numericValue),
    fcp: Math.round(a('first-contentful-paint').numericValue),
    tbt: Math.round(a('total-blocking-time').numericValue),
    shifts: (a('layout-shifts').details && a('layout-shifts').details.items || [])
      .map(it => ({ score: Math.round(it.score * 1000) / 1000,
                    node: (it.node && it.node.selector || '?').slice(0, 60) })),
  };
}

const med = arr => arr.slice().sort((a, b) => a - b)[Math.floor(arr.length / 2)];

for (const [tag, base] of [['before', 'http://127.0.0.1:4178'], ['after', 'http://127.0.0.1:4177']]) {
  const rs = [];
  for (let i = 0; i < RUNS; i++) { const r = run(base, tag, i); if (r) rs.push(r); }
  if (!rs.length) { console.log(`  ${tag}: all runs failed`); continue; }
  console.log(`  ${tag.padEnd(7)} ${P}  perf ${med(rs.map(r => r.perf))}`
    + `  CLS ${med(rs.map(r => r.cls)).toFixed(3)}`
    + `  LCP ${med(rs.map(r => r.lcp))}ms  FCP ${med(rs.map(r => r.fcp))}ms  TBT ${med(rs.map(r => r.tbt))}ms`
    + `   [runs: ${rs.map(r => r.perf).join(',')}]`);
  const worst = rs.slice().sort((a, b) => b.cls - a.cls)[0];
  if (worst.shifts.length) {
    console.log('           shifting nodes: ' + worst.shifts.slice(0, 4)
      .map(s => `${s.node} (${s.score})`).join(' | '));
  }
}
