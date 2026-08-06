#!/usr/bin/env node
// RUN 9 · LIVE-DIFF GATE
// ---------------------------------------------------------------------------
// Fetches all twelve production pages plus the three CSS homes and the shared JS
// with a cache-busting query, and asserts each is BYTE-IDENTICAL to the file in
// the repo. This is the only gate that proves what shipped is what was written:
// a Vercel project rooted at /chauffeur/ can silently serve a stale build, and
// the asset ?v= tokens are git-hash-derived, so a missed stamp shows up here.
//
// Line endings are normalised before comparison and reported separately: git on
// this machine runs core.autocrlf=true, so the working copy and the blob differ
// by \r on purpose and that is not a content difference.
//
//   node tools/aic-run9-livediff.mjs [origin]
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ORIGIN = process.argv[2] || 'https://aichauffeur.ai';
const ROOT = new URL('../chauffeur/', import.meta.url).pathname.slice(1);
const BUST = 'run9diff=' + Date.now();

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
  ['/assets/circulant.css', 'assets/circulant.css'],
  ['/assets/aic.css', 'assets/aic.css'],
  ['/assets/aic.js', 'assets/aic.js'],
  ['/sitemap.xml', 'sitemap.xml'],
  ['/robots.txt', 'robots.txt'],
  ['/site.webmanifest', 'site.webmanifest'],
];

const norm = (s) => s.replace(/\r\n/g, '\n');
const rows = [];

async function check(url, file) {
  const u = ORIGIN + url + (url.includes('?') ? '&' : '?') + BUST;
  let res, txt;
  try {
    res = await fetch(u, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' } });
    txt = await res.text();
  } catch (e) {
    rows.push({ url, status: 'FETCH ERROR', ok: false, note: e.message });
    return;
  }
  const local = norm(readFileSync(join(ROOT, file), 'utf8'));
  const live = norm(txt);
  const ok = live === local;
  let note = '';
  if (!ok) {
    let i = 0; while (i < Math.min(live.length, local.length) && live[i] === local[i]) i++;
    note = 'first difference at char ' + i + ' · live ' + live.length + 'b vs repo ' + local.length + 'b · live[' +
      JSON.stringify(live.slice(i, i + 60)) + '] repo[' + JSON.stringify(local.slice(i, i + 60)) + ']';
  }
  rows.push({ url, status: res.status, ok: ok && res.status === 200, note, bytes: live.length });
}

for (const [u, f] of [...PAGES, ...ASSETS]) await check(u, f);

// the version tokens the pages actually reference must resolve 200
const home = await (await fetch(ORIGIN + '/?' + BUST, { cache: 'no-store' })).text();
const stamped = [...home.matchAll(/(?:href|src)="(\/[^"?]+\.(?:css|js))\?v=([^"]+)"/g)].map(m => [m[1], m[2]]);
const stampRows = [];
for (const [path, v] of stamped) {
  const r = await fetch(ORIGIN + path + '?v=' + v, { cache: 'no-store' });
  stampRows.push({ path, v, status: r.status });
}

console.log('\n══ RUN 9 LIVE-DIFF · ' + ORIGIN + ' vs repo ══\n');
let bad = 0;
for (const r of rows) {
  if (!r.ok) bad++;
  console.log((r.ok ? 'MATCH ' : 'DIFF  ') + String(r.status).padEnd(5) + r.url.padEnd(40) + (r.bytes || '') + (r.note ? '\n        ' + r.note : ''));
}
console.log('');
for (const s of stampRows) {
  if (s.status !== 200) bad++;
  console.log((s.status === 200 ? 'OK    ' : 'FAIL  ') + s.path + '?v=' + s.v + ' -> ' + s.status);
}
console.log('\nGATE live-diff ' + (rows.length) + ' resources + ' + stampRows.length + ' stamped assets: ' + (bad ? 'FAIL (' + bad + ')' : 'PASS'));
process.exit(bad ? 1 : 0);
