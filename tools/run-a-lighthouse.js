/* RUN A · INVISIBLE TRUTH LAYER — Lighthouse gate. PRODUCTION ONLY.
 *
 * Three pages per host, measured on the live origin before the deploy and
 * again after it. Local measurement is not offered here at all: RUN 11 proved
 * `python -m http.server` overstates document weight ~3.4x because it does not
 * compress and Vercel serves Brotli, so a local before/after on a run that
 * changes document bytes is arithmetic about the wrong number.
 *
 * TRAP (RUN 9, still true): chrome-launcher can throw AFTER Lighthouse has
 * already written a good report. Judge by the report FILE, never the exit code.
 *
 * TRAP (RUN 11): one run is not a measurement. Performance is the median of
 * three; the deterministic categories are run once because they do not vary.
 *
 *   node tools/run-a-lighthouse.js before
 *   node tools/run-a-lighthouse.js after
 *   node tools/run-a-lighthouse.js compare
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PHASE = process.argv[2] || 'before';
const OUT = path.join(__dirname, '..', 'audits', 'run-a', 'lh', PHASE);

const TARGETS = [
  ['https://aivoiceagency.ai', '/', 'ava-home'],
  ['https://aivoiceagency.ai', '/milwaukee-hvac', 'ava-milwaukee-hvac'],
  ['https://aivoiceagency.ai', '/hvac-answering-service', 'ava-hvac-answering'],
  ['https://aichauffeur.ai', '/', 'aic-home'],
  ['https://aichauffeur.ai', '/limo-answering-service/', 'aic-limo-answering'],
  ['https://aichauffeur.ai', '/madison-limo-answering-service/', 'aic-madison'],
];

function findLighthouse() {
  const base = path.join(process.env.LOCALAPPDATA || '', 'npm-cache', '_npx');
  if (!fs.existsSync(base)) return null;
  for (const d of fs.readdirSync(base)) {
    const p = path.join(base, d, 'node_modules', 'lighthouse', 'cli', 'index.js');
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function findChrome() {
  const cands = [
    path.join(process.env.LOCALAPPDATA || '', 'ms-playwright', 'chromium-1228',
              'chrome-win64', 'chrome.exe'),
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  ];
  return cands.find(c => fs.existsSync(c)) || null;
}

const LH = findLighthouse();
const CHROME = findChrome();

function run(url, tag) {
  const out = path.join(OUT, tag + '.json');
  try { fs.unlinkSync(out); } catch (e) { /* first run */ }
  try {
    execFileSync(process.execPath, [
      LH, url,
      '--only-categories=performance,accessibility,seo,best-practices',
      '--form-factor=mobile', '--screenEmulation.mobile',
      '--output=json', '--output-path=' + out,
      '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
      '--quiet', '--max-wait-for-load=45000',
    ], { stdio: 'ignore', env: { ...process.env, CHROME_PATH: CHROME }, timeout: 300000 });
  } catch (e) { /* TRAP — the file is the verdict */ }
  if (!fs.existsSync(out)) return null;
  const j = JSON.parse(fs.readFileSync(out, 'utf8'));
  const s = k => (j.categories[k] && j.categories[k].score !== null
    ? Math.round(j.categories[k].score * 100) : null);
  const a = id => (j.audits[id] || {});
  return {
    perf: s('performance'), a11y: s('accessibility'),
    seo: s('seo'), bp: s('best-practices'),
    cls: a('cumulative-layout-shift').numericValue,
    lcp: a('largest-contentful-paint').numericValue,
    bytes: a('total-byte-weight').numericValue,
    seoFails: (j.categories.seo.auditRefs || [])
      .map(r => j.audits[r.id])
      .filter(x => x && x.score !== null && x.score < 1)
      .map(x => x.id),
  };
}

function median(xs) {
  const v = xs.filter(x => x !== null && x !== undefined).sort((a, b) => a - b);
  return v.length ? v[Math.floor(v.length / 2)] : null;
}

function summarise() {
  const rows = {};
  for (const [origin, p, tag] of TARGETS) {
    const runs = [];
    for (const f of fs.readdirSync(OUT)) {
      if (f === tag + '.json' || f.startsWith(tag + '-run')) {
        const j = JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8'));
        const s = k => (j.categories[k] && j.categories[k].score !== null
          ? Math.round(j.categories[k].score * 100) : null);
        runs.push({
          perf: s('performance'), a11y: s('accessibility'),
          seo: s('seo'), bp: s('best-practices'),
          cls: (j.audits['cumulative-layout-shift'] || {}).numericValue,
          lcp: (j.audits['largest-contentful-paint'] || {}).numericValue,
        });
      }
    }
    if (!runs.length) continue;
    rows[tag] = {
      url: origin + p,
      perf: median(runs.map(r => r.perf)),
      a11y: median(runs.map(r => r.a11y)),
      seo: median(runs.map(r => r.seo)),
      bp: median(runs.map(r => r.bp)),
      cls: median(runs.map(r => r.cls)),
      lcp: Math.round(median(runs.map(r => r.lcp)) || 0),
      n: runs.length,
    };
  }
  return rows;
}

if (PHASE === 'compare') {
  const load = ph => {
    const f = path.join(__dirname, '..', 'audits', 'run-a', 'lh', ph + '.json');
    return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {};
  };
  const b = load('before'), a = load('after');
  console.log('PAGE'.padEnd(26) + ' ' + 'PERF'.padEnd(11) + ' ' +
    'A11Y'.padEnd(11) + ' ' + 'SEO'.padEnd(11) + ' ' + 'BP'.padEnd(11) + ' CLS');
  let regressed = 0;
  for (const tag of Object.keys(a)) {
    const B = b[tag] || {}, A = a[tag];
    const cell = (k) => (B[k] === undefined ? `   ->${A[k]}` :
      `${B[k]}->${A[k]}`) + (B[k] !== undefined && A[k] < B[k] ? ' !' : '');
    console.log([
      tag.padEnd(26), cell('perf').padEnd(11), cell('a11y').padEnd(11),
      cell('seo').padEnd(11), cell('bp').padEnd(11),
      `${(B.cls ?? 0).toFixed(3)}->${(A.cls ?? 0).toFixed(3)}`,
    ].join(' '));
    for (const k of ['perf', 'a11y', 'seo', 'bp']) {
      if (B[k] !== undefined && A[k] < B[k]) regressed++;
    }
    if (B.cls !== undefined && A.cls > B.cls + 0.0005) regressed++;
  }
  console.log(regressed ? `\n${regressed} REGRESSION(S) — see the ! marks`
                        : '\nno regressions');
  process.exit(regressed ? 1 : 0);
}

// Re-derive the medians from reports already on disk. Lighthouse runs cost
// minutes; a formatting bug in the summary is no reason to pay for them twice.
if (PHASE === 'resummarise') {
  const ph = process.argv[3];
  const dir = path.join(__dirname, '..', 'audits', 'run-a', 'lh', ph);
  const saved = OUT;
  Object.defineProperty(global, '_', {});          // no-op, keeps lint quiet
  const rows = (function () {
    const o = {};
    for (const [origin, p, tag] of TARGETS) {
      const runs = [];
      for (const f of fs.readdirSync(dir)) {
        if (f === tag + '.json' || f.startsWith(tag + '-run')) {
          const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
          const s = k => (j.categories[k] && j.categories[k].score !== null
            ? Math.round(j.categories[k].score * 100) : null);
          runs.push({
            perf: s('performance'), a11y: s('accessibility'),
            seo: s('seo'), bp: s('best-practices'),
            cls: (j.audits['cumulative-layout-shift'] || {}).numericValue,
            lcp: (j.audits['largest-contentful-paint'] || {}).numericValue,
            seoFails: (j.categories.seo.auditRefs || []).map(r => j.audits[r.id])
              .filter(x => x && x.score !== null && x.score < 1).map(x => x.id),
            bpFails: (j.categories['best-practices'].auditRefs || [])
              .map(r => j.audits[r.id])
              .filter(x => x && x.score !== null && x.score < 1).map(x => x.id),
          });
        }
      }
      if (!runs.length) continue;
      o[tag] = {
        url: origin + p,
        perf: median(runs.map(r => r.perf)), a11y: median(runs.map(r => r.a11y)),
        seo: median(runs.map(r => r.seo)), bp: median(runs.map(r => r.bp)),
        cls: median(runs.map(r => r.cls)),
        lcp: Math.round(median(runs.map(r => r.lcp)) || 0),
        n: runs.length,
        seoFails: [...new Set(runs.flatMap(r => r.seoFails))],
        bpFails: [...new Set(runs.flatMap(r => r.bpFails))],
      };
    }
    return o;
  })();
  fs.writeFileSync(path.join(__dirname, '..', 'audits', 'run-a', 'lh', ph + '.json'),
                   JSON.stringify(rows, null, 2));
  console.log('MEDIANS (' + ph + ')');
  for (const [tag, r] of Object.entries(rows)) {
    console.log('  ' + tag.padEnd(24) +
      ' perf=' + String(r.perf).padEnd(4) + 'a11y=' + String(r.a11y).padEnd(4) +
      'seo=' + String(r.seo).padEnd(4) + 'bp=' + String(r.bp).padEnd(4) +
      'cls=' + (r.cls ?? 0).toFixed(3) + '  lcp=' + r.lcp + 'ms  (n=' + r.n + ')' +
      (r.seoFails.length ? '\n      SEO fails: ' + r.seoFails.join(', ') : '') +
      (r.bpFails.length ? '\n      BP  fails: ' + r.bpFails.join(', ') : ''));
  }
  process.exit(0);
}

if (!LH || !CHROME) {
  console.error('lighthouse or chrome not found  LH=%s CHROME=%s', LH, CHROME);
  process.exit(2);
}
fs.mkdirSync(OUT, { recursive: true });
console.log('phase=%s  chrome=%s', PHASE, CHROME);

for (const [origin, p, tag] of TARGETS) {
  const url = origin + p;
  // Performance is noisy; three runs on every target, median taken later.
  for (let i = 1; i <= 3; i++) {
    const r = run(url, i === 1 ? tag : `${tag}-run${i}`);
    if (!r) { console.log('  %s run%d NO REPORT', tag, i); continue; }
    // Node's util.format knows %s/%d and NOT printf padding: '%-24s' is left
    // literal and every later argument slides one position left, so the run
    // that printed "perf=1 a11y=95" was really run 1 with perf 95. Padding is
    // done in JS here so the numbers sit under their own headings.
    console.log('  ' + tag.padEnd(24) + ' run' + i +
      '  perf=' + String(r.perf).padEnd(4) +
      'a11y=' + String(r.a11y).padEnd(4) +
      'seo=' + String(r.seo).padEnd(4) +
      'bp=' + String(r.bp).padEnd(4) +
      'cls=' + (r.cls ?? 0).toFixed(3) +
      '  lcp=' + Math.round(r.lcp || 0) + 'ms' +
      (r.seoFails.length ? '  SEO-FAILS:' + r.seoFails.join(',') : ''));
  }
}

const rows = summarise();
fs.writeFileSync(path.join(__dirname, '..', 'audits', 'run-a', 'lh', PHASE + '.json'),
                 JSON.stringify(rows, null, 2));
console.log('\nMEDIANS (' + PHASE + ')');
for (const [tag, r] of Object.entries(rows)) {
  console.log('  ' + tag.padEnd(24) +
    ' perf=' + String(r.perf).padEnd(4) +
    'a11y=' + String(r.a11y).padEnd(4) +
    'seo=' + String(r.seo).padEnd(4) +
    'bp=' + String(r.bp).padEnd(4) +
    'cls=' + (r.cls ?? 0).toFixed(3) +
    '  lcp=' + r.lcp + 'ms  (n=' + r.n + ')');
}
