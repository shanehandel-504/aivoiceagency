#!/usr/bin/env node
/* ── AIC RUN 13 · § 2 — SELECTOR REACH ────────────────────────────────────────
   The dedup ledger says which rules move between files. It cannot say whether
   moving one MATTERS, because a rule only matters where an element matches it.

   Two questions, and they are not the same question:

     PUSH   a homepage-only rule appended to aic.css starts applying to the
            other fifteen pages. Safe only if none of them has a matching
            element. "`.console` is homepage-only" is an assertion about MARKUP,
            and it has been true because the rule lived somewhere those pages
            could not see it. The moment it moves, the claim needs evidence.

     PULL   an aic.css-only rule starts applying to the homepage. Safe only if
            the homepage has no matching element.

   Both are answered by asking a real browser to run the selector against the
   real DOM, which also gets `:has()`, attribute selectors and pseudo-elements
   right — none of which a grep over markup does.
   ─────────────────────────────────────────────────────────────────────────── */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, createReadStream } from 'node:fs';
import { resolve, dirname, join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';

const require = createRequire('C:/Users/offic/Desktop/AVA-factory/adstage/package.json');
const { chromium } = require('playwright');

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = resolve(ROOT, 'chauffeur');
const OUT = resolve(ROOT, 'audits/run13');

const PAGES = [
  ['/', 'home'], ['/demo/', 'demo'], ['/book/', 'book'],
  ['/how-setup-works/', 'how-setup-works'],
  ['/works-with-your-software/', 'works-with-your-software'],
  ['/limo-answering-service/', 'limo-answering-service'],
  ['/after-hours-limo-dispatch/', 'after-hours-limo-dispatch'],
  ['/airport-transfer-booking/', 'airport-transfer-booking'],
  ['/milwaukee-limo-answering-service/', 'milwaukee'],
  ['/madison-limo-answering-service/', 'madison'],
  ['/integrations/', 'integrations'],
  ['/integrations/limo-anywhere/', 'integrations-limo-anywhere'],
  ['/integrations/fasttrak/', 'integrations-fasttrak'],
  ['/limo-dispatch-automation/', 'limo-dispatch-automation'],
  ['/privacy/', 'privacy'], ['/terms/', 'terms'],
];

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json',
  '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json',
  '.mp3': 'audio/mpeg', '.ico': 'image/x-icon', '.jpg': 'image/jpeg', '.webp': 'image/webp' };

function startServer() {
  return new Promise((ok) => {
    const srv = createServer((req, res) => {
      let f = normalize(join(SITE, decodeURIComponent(req.url.split('?')[0])));
      if (!f.startsWith(SITE)) return res.writeHead(403).end();
      try { if (statSync(f).isDirectory()) f = join(f, 'index.html'); } catch { return res.writeHead(404).end(); }
      if (!existsSync(f)) return res.writeHead(404).end();
      res.writeHead(200, { 'content-type': MIME[extname(f).toLowerCase()] || 'application/octet-stream' });
      createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => ok({ srv, origin: `http://127.0.0.1:${srv.address().port}` }));
  });
}

/* Strip the at-rule context and any pseudo-element, which querySelectorAll
   cannot match but whose ORIGIN element it can. `.foo::before` reaching a page
   is exactly as significant as `.foo` reaching it. */
const toQuery = (key) => {
  const sel = key.split('||')[1];
  return sel
    .replace(/::(before|after|placeholder|-webkit-[a-z-]+|marker|selection|backdrop)/g, '')
    .replace(/:(hover|active|focus|focus-visible|focus-within|checked|disabled|last-child|first-child|visited|target)/g, '')
    .trim();
};

const led = JSON.parse(readFileSync(resolve(OUT, 'cssdiff.json'), 'utf8'));

/* DIVERGENT belongs in BOTH directions, and leaving it out of either is the
   easy mistake. A selector both files declare, where the homepage's copy holds
   declarations aic.css lacks, is pushed exactly like a homepage-only rule when
   those declarations move — and where aic.css holds the extra ones, they are
   pulled onto the homepage. The first pass of this tool tested LOST and GAINED
   only, which silently exempted `.demo-play-btn`, `.step`, `.feat` and a dozen
   others from the collision check they most needed. */
const div = led.divergent.map((d) => toQuery(d.key));
const push = [...new Set([...led.lost.map((l) => toQuery(l.key)), ...div])].filter((s) => s && !s.startsWith('@'));
const pull = [...new Set([...led.gained.map((g) => toQuery(g.key)), ...div])].filter((s) => s && !s.startsWith('@'));

const { srv, origin } = await startServer();
const browser = await chromium.launch();
const page = await (await browser.newContext()).newPage();
const hits = {};
for (const [path, name] of PAGES) {
  await page.goto(origin + path, { waitUntil: 'domcontentloaded' });
  hits[name] = await page.evaluate((sels) => {
    const o = {};
    for (const s of sels) {
      /* An invalid selector throws rather than returning nothing. Record it as
         a question mark instead of letting one bad string kill the sweep. */
      try { const n = document.querySelectorAll(s).length; if (n) o[s] = n; }
      catch { o[s] = 'INVALID'; }
    }
    return o;
  }, [...new Set([...push, ...pull])]);
}
await browser.close();
srv.close();

const others = PAGES.map(([, n]) => n).filter((n) => n !== 'home');

console.log('══ AIC RUN 13 · SELECTOR REACH ════════════════════════════════════\n');
console.log(`── PUSH · homepage-only rules that would reach the other 15 ────────`);
const pushHits = [];
for (const s of push) {
  const on = others.filter((n) => hits[n][s]);
  if (on.length) { pushHits.push([s, on]); console.log(`  ${s}   →  ${on.length} pages: ${on.slice(0, 6).join(', ')}${on.length > 6 ? ' …' : ''}`); }
}
if (!pushHits.length) console.log('  none — every homepage-only selector matches zero elements on the other 15.');

console.log(`\n── PULL · aic.css-only rules that would reach the homepage ─────────`);
const pullHits = [];
for (const s of pull) {
  if (hits.home[s]) { pullHits.push([s, hits.home[s]]); console.log(`  ${s}   →  ${hits.home[s]} element(s) on the homepage`); }
}
if (!pullHits.length) console.log('  none — every aic.css-only selector matches zero elements on the homepage.');

mkdirSync(OUT, { recursive: true });
writeFileSync(resolve(OUT, 'reach.json'), JSON.stringify({ push: pushHits, pull: pullHits, hits }, null, 2));
console.log(`\nPUSH collisions ${pushHits.length} / ${push.length} selectors`);
console.log(`PULL collisions ${pullHits.length} / ${pull.length} selectors`);
console.log('written: audits/run13/reach.json');
