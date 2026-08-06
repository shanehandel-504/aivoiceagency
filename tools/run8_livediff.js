/* AIC RUN 8 · LIVE-DIFF — production against the repo, cache-busted.
 *
 * "It pushed" is not "it shipped", and a CDN that hands back yesterday's copy
 * looks exactly like a deploy that landed. Every one of the 12 production URLs is
 * fetched with a unique query string AND no-store request headers, so nothing in
 * between can answer from cache, then compared to the file on disk byte for byte
 * (line endings normalised: git checks out CRLF here, Vercel serves what it got).
 *
 * It also proves the two woff2 files are actually reachable at the paths the
 * @font-face and the preload name — a self-hosted font that 404s is a silent
 * fallback to Arial on every page, and every other check in this run would still
 * pass while the site rendered in the wrong face.
 *
 *   node tools/run8_livediff.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const CH = path.join(__dirname, '..', 'chauffeur');
const HOST = 'https://aichauffeur.ai';
const BUST = 'run8-' + process.pid + '-' + Math.floor(Math.random() * 1e9);

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

const ASSETS = [
  ['/fonts/space-grotesk.woff2', 'fonts/space-grotesk.woff2'],
  ['/fonts/jetbrains-mono.woff2', 'fonts/jetbrains-mono.woff2'],
];

const norm = s => s.replace(/\r\n/g, '\n').trimEnd();

const get = (url, binary) => new Promise((res, rej) => {
  https.get(url, {
    headers: {
      'User-Agent': 'aic-run8-livediff',
      'Cache-Control': 'no-cache, no-store, max-age=0',
      Pragma: 'no-cache',
    },
  }, r => {
    if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
      r.resume(); return get(r.headers.location, binary).then(res, rej);
    }
    const chunks = [];
    r.on('data', d => chunks.push(d));
    r.on('end', () => {
      const buf = Buffer.concat(chunks);
      res({ status: r.statusCode, headers: r.headers, body: binary ? buf : buf.toString('utf8') });
    });
  }).on('error', rej);
});

(async () => {
  let same = 0; const bad = [];
  console.log('='.repeat(100));
  console.log(`RUN 8 LIVE-DIFF — ${HOST}, cache-buster ?${BUST}`);
  console.log('='.repeat(100));

  for (const [url, rel] of PAGES) {
    const local = norm(fs.readFileSync(path.join(CH, rel.replace(/\//g, path.sep)), 'utf8'));
    let r;
    try { r = await get(`${HOST}${url}?${BUST}`); }
    catch (e) { bad.push(`${url} FETCH FAILED`); console.log(`  ${url.padEnd(38)} FETCH FAILED ${String(e).slice(0, 60)}`); continue; }
    if (r.status !== 200) { bad.push(`${url} HTTP ${r.status}`); console.log(`  ${url.padEnd(38)} HTTP ${r.status}`); continue; }
    const liveBody = norm(r.body);
    // The gate of this run, checked on the served bytes rather than the repo:
    const googleRefs = (liveBody.match(/fonts\.(googleapis|gstatic)\.com/g) || []).length;
    const preloads = (liveBody.match(/rel="preload" as="font"/g) || []).length;
    if (liveBody === local && googleRefs === 0 && preloads === 2) {
      same++;
      console.log(`  ${url.padEnd(38)} 200  IDENTICAL  ${String(liveBody.length).padStart(6)}B  google-refs 0  font-preloads 2`);
    } else {
      let i = 0; while (i < liveBody.length && i < local.length && liveBody[i] === local[i]) i++;
      const why = liveBody !== local ? `DIFFERS at byte ${i}` : `google-refs ${googleRefs} · preloads ${preloads}`;
      bad.push(`${url} ${why}`);
      console.log(`  ${url.padEnd(38)} 200  ${why}`);
      if (liveBody !== local) {
        const ctx = s => s.slice(Math.max(0, i - 40), i + 60).replace(/\n/g, '\\n');
        console.log(`       live : …${ctx(liveBody)}…`);
        console.log(`       repo : …${ctx(local)}…`);
      }
    }
  }

  console.log(`\n  ${same}/${PAGES.length} live pages byte-identical to the repo, zero Google font refs, 2 preloads each`);

  console.log('\n  SELF-HOSTED FONT FILES ON PRODUCTION — a 404 here is a silent site-wide fallback');
  for (const [url, rel] of ASSETS) {
    const localBuf = fs.readFileSync(path.join(CH, rel.replace(/\//g, path.sep)));
    const r = await get(HOST + url, true);
    const ok = r.status === 200 && Buffer.compare(localBuf, r.body) === 0;
    if (!ok) bad.push(`${url} HTTP ${r.status} or byte mismatch`);
    console.log(`  ${url.padEnd(38)} ${r.status}  ${r.body.length}B  ${ok ? 'BYTE-IDENTICAL to repo' : 'MISMATCH'}`
      + `  cache-control: ${r.headers['cache-control'] || '(none)'}`);
  }

  if (bad.length) { console.log('\n  MISMATCHES:'); bad.forEach(d => console.log('   X ' + d)); }
  else console.log('\n  LIVE-DIFF PASS');
  process.exit(bad.length ? 1 : 0);
})();
