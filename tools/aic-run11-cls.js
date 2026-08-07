/* AIC RUN 11 · SINGLE-PAGE CLS A/B — the homepage, five runs each way.
 *
 * RUN 10 GOTCHA 1: a twelve-page median can hide an intermittent CLS. The suite
 * reported 0.000 while a direct A/B reported 0.130 in two runs of three, and an
 * intermittent 0.13 is worse than a steady one — it passes review and fails
 * users. This run adds post-load DOM work (the drawer chevron, the rail's larger
 * suppressor set, the haptics listener), so the single page gets its own A/B.
 *
 * EVERY VALUE IS PRINTED, not just the median. A median of three hides a
 * one-in-three shift by construction, which is the exact failure mode the
 * gotcha describes.
 *
 * Trap 11 applies: chrome-launcher can throw AFTER a good report is written.
 * The report file is the verdict, never the exit code.
 *
 *   node tools/aic-run11-cls.js            # after=8848, before=8849
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LH = 'C:/Users/offic/AppData/Local/npm-cache/_npx/8003d8991b0d346b/node_modules/lighthouse/cli/index.js';
const CHROME = 'C:/Users/offic/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const AFTER = process.env.RUN11_AFTER || 'http://127.0.0.1:8848';
const BEFORE = process.env.RUN11_BEFORE || 'http://127.0.0.1:8849';
const N = parseInt(process.env.RUN11_N || '5', 10);
const OUT = path.join(__dirname, '..', 'audits', 'run11', 'cls');
fs.mkdirSync(OUT, { recursive: true });

function one(base, tag) {
  const out = path.join(OUT, tag + '.json');
  try { fs.unlinkSync(out); } catch (e) { /* first run */ }
  try {
    execFileSync(process.execPath, [
      LH, base + '/',
      '--only-categories=performance',
      '--form-factor=mobile', '--screenEmulation.mobile',
      '--output=json', '--output-path=' + out,
      '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
      '--quiet', '--max-wait-for-load=45000',
    ], { stdio: 'ignore', env: { ...process.env, CHROME_PATH: CHROME }, timeout: 180000 });
  } catch (e) { /* the file is the verdict */ }
  if (!fs.existsSync(out)) return null;
  const j = JSON.parse(fs.readFileSync(out, 'utf8'));
  return {
    cls: +j.audits['cumulative-layout-shift'].numericValue.toFixed(4),
    lcp: Math.round(j.audits['largest-contentful-paint'].numericValue),
    tbt: Math.round(j.audits['total-blocking-time'].numericValue),
    perf: Math.round(j.categories.performance.score * 100),
  };
}

const side = (base, label) => {
  const rows = [];
  for (let i = 1; i <= N; i++) {
    process.stderr.write(`  ${label} ${i}/${N} ... `);
    const r = one(base, `${label}-${i}`);
    rows.push(r);
    process.stderr.write(r ? `cls ${r.cls} lcp ${r.lcp} tbt ${r.tbt} perf ${r.perf}\n` : 'NO REPORT\n');
  }
  return rows.filter(Boolean);
};

const before = side(BEFORE, 'before');
const after = side(AFTER, 'after');
const col = (rows, k) => rows.map((r) => r[k]);
const med = (xs) => { const a = [...xs].sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };

console.log('\n══ RUN 11 · HOMEPAGE CLS A/B · mobile · every run printed ══\n');
for (const [label, rows] of [['BEFORE', before], ['AFTER', after]]) {
  if (!rows.length) { console.log(label + '  NO REPORTS'); continue; }
  console.log(label.padEnd(8) +
    'cls ' + col(rows, 'cls').join(' / ').padEnd(34) +
    ' max ' + Math.max(...col(rows, 'cls')));
  console.log(''.padEnd(8) +
    'lcp ' + col(rows, 'lcp').join(' / ').padEnd(34) +
    ' median ' + med(col(rows, 'lcp')) + 'ms');
  console.log(''.padEnd(8) +
    'tbt ' + col(rows, 'tbt').join(' / ').padEnd(34) +
    ' median ' + med(col(rows, 'tbt')) + 'ms');
  console.log(''.padEnd(8) +
    'perf ' + col(rows, 'perf').join(' / ').padEnd(33) +
    ' median ' + med(col(rows, 'perf')));
  console.log('');
}

const worstAfter = after.length ? Math.max(...col(after, 'cls')) : 1;
const worstBefore = before.length ? Math.max(...col(before, 'cls')) : 0;
// The bar is the WORST run, not the median. That is the whole point of the gotcha.
const ok = after.length >= 3 && worstAfter <= 0.005 && worstAfter <= worstBefore + 0.005;
console.log(`worst-case CLS  before ${worstBefore}  after ${worstAfter}`);
console.log('GATE homepage CLS (worst of ' + N + ', not the median): ' + (ok ? 'PASS' : 'FAIL'));
fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify({ before, after }, null, 1));
process.exit(ok ? 0 : 1);
