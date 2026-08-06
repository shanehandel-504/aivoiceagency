/* AIC RUN 7 · Lighthouse mobile gate.
 *
 * Gate requirement: Accessibility 100 and SEO 100 on every page, Performance
 * recorded. /book/ embeds a third-party GHL booking iframe, so its
 * Best-Practices score is not chased — printed, not hidden.
 *
 * Lighthouse 12 is ESM-only, so this drives the CLI as a subprocess and does
 * the score arithmetic here. Chrome is the Playwright Chromium already on this
 * machine; nothing is installed to run the gate.
 *
 *   node tools/run7_lighthouse.js
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LH = 'C:/Users/offic/AppData/Local/npm-cache/_npx/8003d8991b0d346b/node_modules/lighthouse/cli/index.js';
const CHROME = 'C:/Users/offic/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.RUN7_BASE || 'http://127.0.0.1:4177';
const OUT = path.join(__dirname, '..', 'audits', 'lh');

const PAGES = [
  '/', '/demo/', '/book/', '/how-setup-works/', '/works-with-your-software/',
  '/limo-answering-service/', '/after-hours-limo-dispatch/', '/airport-transfer-booking/',
  '/milwaukee-limo-answering-service/', '/madison-limo-answering-service/',
  '/privacy/', '/terms/',
];

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const pct = c => (c && typeof c.score === 'number') ? Math.round(c.score * 100) : null;
const rows = [];

for (const p of PAGES) {
  const slug = p === '/' ? 'home' : p.replace(/\//g, '') || 'home';
  const json = path.join(OUT, slug + '.json');
  // Delete first so a stale report from an earlier run can never be mistaken
  // for a fresh pass — the exit code is not trustworthy here (see below) and
  // the FILE is the evidence.
  if (fs.existsSync(json)) fs.unlinkSync(json);
  let launchErr = null;
  try {
    execFileSync(process.execPath, [
      LH, BASE + p,
      '--only-categories=accessibility,seo,performance,best-practices',
      '--output=json', '--output-path=' + json, '--quiet',
      '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
    ], { stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, CHROME_PATH: CHROME } });
  } catch (e) {
    launchErr = (e.stderr ? e.stderr.toString() : String(e));
  }
  // chrome-launcher on Windows throws out of destroyTmp() -> rmSync() while
  // tearing down its temp profile, AFTER the audit has run and the report has
  // been written. That is a cleanup failure, not an audit failure, and taking
  // the exit code at face value threw away twelve perfectly good reports. The
  // artifact is the evidence: if the JSON is on disk, the audit completed.
  if (!fs.existsSync(json)) {
    console.log('  RUN FAILED ' + p + ' :: '
      + String(launchErr || 'no report written').trim().split('\n').slice(-4).join(' | ').slice(0, 400));
    rows.push({ p, a11y: null, seo: null, perf: null, bp: null, fails: ['RUN FAILED'] });
    continue;
  }

  const r = JSON.parse(fs.readFileSync(json, 'utf8'));
  const a11y = pct(r.categories.accessibility);
  const seo = pct(r.categories.seo);
  const perf = pct(r.categories.performance);
  const bp = pct(r.categories['best-practices']);

  // name every failing audit inside the two categories the gate holds at 100
  const fails = [];
  for (const cat of ['accessibility', 'seo']) {
    for (const ref of r.categories[cat].auditRefs) {
      const a = r.audits[ref.id];
      if (a && a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'informative') {
        fails.push(cat[0] + ':' + ref.id);
      }
    }
  }
  rows.push({ p, a11y, seo, perf, bp, fails });
  console.log(`  ${p.padEnd(38)} a11y ${String(a11y).padStart(3)}  seo ${String(seo).padStart(3)}`
    + `  perf ${String(perf).padStart(3)}  bp ${String(bp).padStart(3)}  ${fails.join(', ')}`);
}

fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(rows, null, 1));

const bad = rows.filter(r => r.a11y !== 100 || r.seo !== 100);
console.log('');
if (bad.length) {
  console.log('GATE FAIL — pages under 100 on a required category:');
  bad.forEach(r => console.log(`  X ${r.p}  a11y ${r.a11y} seo ${r.seo}  ${r.fails.join(', ')}`));
  process.exit(1);
}
const perfs = rows.map(r => r.perf).sort((a, b) => a - b);
console.log(`GATE PASS — a11y 100 and SEO 100 on all ${rows.length} pages.`);
console.log(`Perf (mobile, throttled): min ${perfs[0]} · median ${perfs[Math.floor(perfs.length / 2)]} · max ${perfs[perfs.length - 1]}`);
console.log('Best-Practices: ' + rows.map(r => r.p.replace(/\//g, '') || 'home').map((n, i) => n + ' ' + rows[i].bp).join(' · '));
