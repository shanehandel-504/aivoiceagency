/* AIC RUN 7 · LIVE-DIFF — the live HTML against the repo file, byte for byte.
 *
 * "It pushed" is not "it shipped". Vercel builds from main, and a build that
 * half-landed looks exactly like a build that landed. This fetches every one of
 * the 12 production URLs and compares the body to the file on disk, normalising
 * only line endings (git checks out CRLF on Windows; Vercel serves what it got).
 *
 *   node tools/run7_livediff.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const CH = path.join(__dirname, '..', 'chauffeur');
const HOST = 'https://aichauffeur.ai';
const PAGES = [
  ['/', 'index.html'],
  ['/demo/', 'demo/index.html'],
  ['/book/', 'book/index.html'],
  ['/how-setup-works/', 'how-setup-works/index.html'],
  ['/works-with-your-software/', 'works-with-your-software/index.html'],
  ['/limo-answering-service/', 'limo-answering-service/index.html'],
  ['/after-hours-limo-dispatch/', 'after-hours-limo-dispatch/index.html'],
  ['/airport-transfer-booking/', 'airport-transfer-booking/index.html'],
  ['/milwaukee-limo-answering-service/', 'milwaukee-limo-answering-service/index.html'],
  ['/madison-limo-answering-service/', 'madison-limo-answering-service/index.html'],
  ['/privacy/', 'privacy/index.html'],
  ['/terms/', 'terms/index.html'],
];

const norm = s => s.replace(/\r\n/g, '\n').trimEnd();

const get = url => new Promise((res, rej) => {
  https.get(url, { headers: { 'User-Agent': 'aic-run7-livediff', 'Cache-Control': 'no-cache' } }, r => {
    if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
      r.resume(); return get(r.headers.location).then(res, rej);
    }
    let b = ''; r.setEncoding('utf8');
    r.on('data', d => b += d);
    r.on('end', () => res({ status: r.statusCode, body: b }));
  }).on('error', rej);
});

(async () => {
  let same = 0, diff = [];
  for (const [url, rel] of PAGES) {
    const local = norm(fs.readFileSync(path.join(CH, rel.replace(/\//g, path.sep)), 'utf8'));
    let r;
    try { r = await get(HOST + url); }
    catch (e) { diff.push(`${url} FETCH FAILED ${String(e).slice(0, 80)}`); console.log(`  ${url.padEnd(38)} FETCH FAILED`); continue; }
    const live = norm(r.body);
    if (r.status !== 200) { diff.push(`${url} HTTP ${r.status}`); console.log(`  ${url.padEnd(38)} HTTP ${r.status}`); continue; }
    if (live === local) { same++; console.log(`  ${url.padEnd(38)} 200  IDENTICAL  (${live.length} bytes)`); }
    else {
      // find the first divergence so a mismatch is actionable, not just "differs"
      let i = 0; while (i < live.length && i < local.length && live[i] === local[i]) i++;
      const ctx = s => s.slice(Math.max(0, i - 40), i + 60).replace(/\n/g, '\\n');
      diff.push(`${url} DIFFERS at byte ${i}`);
      console.log(`  ${url.padEnd(38)} 200  DIFFERS at byte ${i}`);
      console.log(`       live : …${ctx(live)}…`);
      console.log(`       repo : …${ctx(local)}…`);
    }
  }
  console.log(`\n  ${same}/${PAGES.length} live pages byte-identical to the repo`);
  if (diff.length) { console.log('  MISMATCHES:'); diff.forEach(d => console.log('   X ' + d)); }
  process.exit(diff.length ? 1 : 0);
})();
