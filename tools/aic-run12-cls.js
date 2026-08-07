/* AIC RUN 12 · SINGLE-PAGE CLS — the hub, N runs, every value printed.
 *
 * RUN 11's runner is hardcoded to `base + '/'`, so it can only ever measure the
 * homepage. The hub is the page this run introduced and the one carrying a new
 * component (the eleven-row status table), so it gets its own reading.
 *
 * There is no "before" for a page that did not exist yesterday, so this is not
 * an A/B and does not pretend to be one: it is N independent runs against
 * PRODUCTION with every value listed. That is the part of RUN 11's method that
 * actually mattered — RUN 10 GOTCHA 1 is that a median hides a one-in-three
 * shift by construction, and an intermittent CLS is worse than a steady one
 * because it passes review and fails users.
 *
 * Trap 11: chrome-launcher can throw AFTER a good report is written. The report
 * file is the verdict, never the exit code.
 *
 *   node tools/aic-run12-cls.js [origin] [path] [n]
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LH = 'C:/Users/offic/AppData/Local/npm-cache/_npx/8003d8991b0d346b/node_modules/lighthouse/cli/index.js';
const CHROME = 'C:/Users/offic/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const ORIGIN = process.argv[2] || 'https://aichauffeur.ai';
const PATH_ = process.argv[3] || '/integrations/';
const N = parseInt(process.argv[4] || '5', 10);
const OUT = path.join(__dirname, '..', 'audits', 'run12', 'cls');
fs.mkdirSync(OUT, { recursive: true });

// MSYS PATH CONVERSION. Git Bash rewrites a bare `/integrations/` argument into
// `C:/Program Files/Git/integrations/` before node ever sees it, and the only
// symptom is CHROME_INTERSTITIAL_ERROR on every run — which reads like a network
// problem, not a shell one. Refuse to run rather than produce five failed
// reports and a red gate about a page that is fine.
if (!PATH_.startsWith('/') || /^[A-Za-z]:|Program Files/.test(PATH_)) {
  console.error('\n  ABORT: path argument came through as "%s".', PATH_);
  console.error('  Git Bash converted it. Re-run with MSYS_NO_PATHCONV=1:\n');
  console.error('    MSYS_NO_PATHCONV=1 node tools/aic-run12-cls.js %s /integrations/ 5\n', ORIGIN);
  process.exit(2);
}

function one(tag) {
  const out = path.join(OUT, tag + '.json');
  try { fs.unlinkSync(out); } catch (e) { /* first run */ }
  try {
    execFileSync(process.execPath, [
      LH, ORIGIN + PATH_,
      '--only-categories=performance',
      '--form-factor=mobile', '--screenEmulation.mobile',
      '--output=json', '--output-path=' + out,
      '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
      '--quiet', '--max-wait-for-load=45000',
    ], { stdio: 'ignore', env: { ...process.env, CHROME_PATH: CHROME }, timeout: 240000 });
  } catch (e) { /* the file is the verdict */ }
  if (!fs.existsSync(out)) return null;
  const j = JSON.parse(fs.readFileSync(out, 'utf8'));
  // A report can EXIST and still carry a runtimeError, or an audit whose
  // numericValue is absent because the metric never resolved. Reading
  // .numericValue off it throws inside the loop and kills the whole sweep, so
  // the shape is checked here and a bad run is reported as a bad run.
  const num = (id) => {
    const a = j.audits && j.audits[id];
    return a && typeof a.numericValue === 'number' ? a.numericValue : null;
  };
  const cls = num('cumulative-layout-shift');
  if (cls === null) {
    console.error('   report has no usable CLS: ' +
      (j.runtimeError ? j.runtimeError.code : 'audit missing/errored'));
    return null;
  }
  return {
    cls,
    lcp: Math.round(num('largest-contentful-paint') || 0),
    tbt: Math.round(num('total-blocking-time') || 0),
    perf: j.categories.performance.score !== null
      ? Math.round(j.categories.performance.score * 100) : null,
  };
}

const runs = [];
for (let i = 1; i <= N; i++) {
  process.stderr.write('  run ' + i + '/' + N + ' ... ');
  const r = one('hub-' + i);
  runs.push(r);
  process.stderr.write(r ? ('cls ' + r.cls.toFixed(3) + ' lcp ' + r.lcp + 'ms perf ' + r.perf + '\n') : 'NO REPORT\n');
}

const ok = runs.filter(Boolean);
console.log('\n══ RUN 12 CLS · %s%s · mobile · %d runs ══\n', ORIGIN, PATH_, ok.length);
console.log('  run   CLS      LCP      TBT     perf');
ok.forEach((r, i) => console.log('  %s     %s    %sms   %sms   %s',
  String(i + 1), r.cls.toFixed(3), String(r.lcp).padEnd(5), String(r.tbt).padEnd(4), r.perf));

const worst = Math.max(...ok.map(r => r.cls));
console.log('\n  worst CLS across %d runs: %s', ok.length, worst.toFixed(3));
const pass = ok.length === N && worst < 0.0005;
console.log('\nGATE run12-cls: %s\n', pass ? 'PASS — 0.000 in ' + ok.length + ' of ' + ok.length : 'FAIL');
process.exit(pass ? 0 : 1);
