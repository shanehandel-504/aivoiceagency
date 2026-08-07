#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   AIC RUN 13 · § 2 — THE COMPUTED-STYLE PARITY HARNESS
   ---------------------------------------------------------------------------
     node tools/aic-run13-parity.mjs snap <label> [origin]
     node tools/aic-run13-parity.mjs diff <labelA> <labelB>

   § 2 deletes the homepage's inline copy of the shell and links assets/aic.css
   instead. The selector ledger (aic-run13-cssdiff.mjs) says WHICH rules move.
   It cannot say what the page LOOKS like afterwards, because a rule that is
   present in both files can still resolve differently once the cascade order
   changes, and a rule that is absent from both can still be inherited.

   So this measures the only thing that actually matters: the RESOLVED computed
   style of every rendered element on every page, before and after, plus its
   box. If the ledger is right and the migration is complete, the diff is empty
   everywhere except where this run intends a change — and every intended
   change is named in ALLOWED below rather than waved past.

   THIS IS A SNAPSHOT PAIR, NOT A GATE. It proves "nothing moved". It cannot
   prove "what moved is correct" — that is the eyes gate's job.

   Trap 3 applies: getComputedStyle reports an element's OWN display, so a node
   inside a display:none drawer reads as laid out. Elements are keyed and
   compared regardless of visibility on purpose — a hidden element whose style
   changed is still a change, and the drawer is exactly where a missed rule
   would hide.
   ═══════════════════════════════════════════════════════════════════════════ */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync, existsSync, statSync, createReadStream } from 'node:fs';
import { resolve, dirname, join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';

const require = createRequire('C:/Users/offic/Desktop/AVA-factory/adstage/package.json');
const { chromium } = require('playwright');

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
/* `--site <dir>` lets the baseline be taken from a git worktree at HEAD instead
   of from the working tree. Stashing to get a clean baseline puts every
   uncommitted change in this run at the mercy of one command; a worktree cannot
   lose work because it never touches the files you are editing. */
const siteArg = process.argv.indexOf('--site');
const SITE = siteArg > -1 ? resolve(process.argv[siteArg + 1]) : resolve(ROOT, 'chauffeur');
const SNAPDIR = resolve(ROOT, 'audits/run13/parity');
const OUT = resolve(ROOT, 'audits/run13');

/* ── The harness serves itself ─────────────────────────────────────────────
   `python -m http.server` is SINGLE-THREADED. Chromium opens up to six
   keep-alive connections per origin and holds them open; the server answers
   one at a time and the rest sit in the accept queue, so a page waiting on
   `networkidle` waits forever. The symptom is a snapshot that hangs with no
   error, no timeout and no partial output — it reads like a broken probe and
   it is a broken SERVER.

   Node's http server is async, so it does not have that failure mode. Owning
   the server also means the run cannot silently measure a stale process left
   listening on 8848 from an earlier session, which is its own quiet lie. */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon',
};

function startServer() {
  return new Promise((ok) => {
    const srv = createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      let f = normalize(join(SITE, p));
      if (!f.startsWith(SITE)) { res.writeHead(403).end(); return; }
      try {
        if (statSync(f).isDirectory()) f = join(f, 'index.html');
      } catch { res.writeHead(404).end('not found'); return; }
      if (!existsSync(f)) { res.writeHead(404).end('not found'); return; }
      res.writeHead(200, {
        'content-type': MIME[extname(f).toLowerCase()] || 'application/octet-stream',
        'cache-control': 'no-store',
      });
      createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => ok({ srv, origin: `http://127.0.0.1:${srv.address().port}` }));
  });
}

const PAGES = [
  ['/', 'home'],
  ['/demo/', 'demo'],
  ['/book/', 'book'],
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
  ['/privacy/', 'privacy'],
  ['/terms/', 'terms'],
];

const VIEWPORTS = [
  ['390', 390, 844],
  ['768', 768, 1024],
  ['1440', 1440, 900],
];

/* The properties design law in DESIGN-SYSTEM.md actually rules on. A wider set
   adds noise (every UA-computed longhand) without adding a single finding; a
   narrower one would let a radius or an underline through, which is the whole
   class of defect § 2 exists to close. */
const PROPS = [
  'display', 'position', 'visibility', 'opacity', 'z-index',
  'color', 'background-color', 'background-image',
  'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
  'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
  'border-top-style', 'border-bottom-style',
  'border-top-left-radius', 'border-top-right-radius',
  'border-bottom-left-radius', 'border-bottom-right-radius',
  'box-shadow', 'filter', 'backdrop-filter', 'transform',
  'font-family', 'font-size', 'font-weight', 'font-style',
  'letter-spacing', 'line-height', 'text-transform', 'text-align',
  'text-decoration-line', 'text-decoration-color', 'text-decoration-thickness',
  'text-underline-offset', 'text-wrap', 'white-space',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'min-height', 'max-width', 'width', 'height',
  'gap', 'grid-template-columns', 'flex-direction', 'flex-wrap',
  'align-items', 'justify-content',
  'overflow-x', 'overflow-y', 'isolation',
];

async function snap(label) {
  const { srv, origin } = await startServer();
  console.log(`serving chauffeur/ at ${origin}`);
  const browser = await chromium.launch();
  const out = {};
  /* The three viewports are independent, so they run as three concurrent
     contexts rather than in series. Serially this sweep took over fifteen
     minutes and timed out mid-run, which is long enough that a person stops
     re-running it — and a gate nobody runs is not a gate. */
  await Promise.all(VIEWPORTS.map(async ([w, vw, vh]) => {
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1 });
    /* Audio is the whole reason a page-load took ~19s: the homepage carries
       sample recordings and `load` waits for every one. No <audio> element on
       this site is sized by its media — they are all controls in a fixed box —
       so refusing the bytes cannot move a computed style, and it takes the
       sweep from minutes-per-page to seconds. */
    await ctx.route('**/*.{mp3,wav,m4a,ogg,mp4,webm}', (r) => r.abort());
    const page = await ctx.newPage();
    for (const [path, name] of PAGES) {
      await page.goto(origin + path, { waitUntil: 'load' });
      /* The GLOW GATE adds body.glow-ready on window load and the drawer/rail
         JS runs then too. Waiting for the class means the snapshot is of the
         settled page rather than of a frame mid-boot — otherwise every run
         diffs against itself. */
      await page.waitForFunction(() => document.body.classList.contains('glow-ready'), { timeout: 4000 })
        .catch(() => {});
      await page.waitForTimeout(200);
      /* ── FREEZE EVERY ANIMATION AT FRAME 0 ────────────────────────────────
         Without this the harness reads whatever frame the console's breathing
         edge, the ledger's state pulse and /book/'s skeleton loader happened to
         be on, and reports a few hundred nodes differing in opacity, transform
         and box-shadow between two runs of the SAME code. That is not a false
         positive that can be filtered afterwards — it is noise sitting in the
         same properties a real regression would move, which is exactly where
         noise does the most damage.

         Pausing at currentTime 0 is deterministic on both sides of the
         comparison. It measures the animation's first frame rather than its
         resting state, and that is fine for a diff: both snapshots measure the
         same thing. */
      await page.evaluate(() => {
        for (const a of document.getAnimations()) { a.pause(); a.currentTime = 0; }
      });
      await page.waitForTimeout(60);
      const data = await page.evaluate((props) => {
        const res = {};
        const counts = new Map();
        const keyOf = (el) => {
          const parts = [];
          let n = el;
          while (n && n !== document.body) {
            const p = n.parentElement;
            if (!p) break;
            let i = 0;
            for (const sib of p.children) {
              if (sib === n) break;
              if (sib.tagName === n.tagName) i++;
            }
            parts.unshift(n.tagName.toLowerCase() + (i ? `[${i}]` : ''));
            n = p;
          }
          return 'body/' + parts.join('/');
        };
        for (const el of document.body.querySelectorAll('*')) {
          if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') continue;
          let k = keyOf(el);
          /* Two elements can produce the same path only if the walk hit a
             shadow boundary or a detached node; disambiguate rather than
             silently overwrite, which would hide a real difference. */
          const seen = counts.get(k) || 0;
          counts.set(k, seen + 1);
          if (seen) k += `#${seen}`;
          const cs = getComputedStyle(el);
          const rec = {};
          for (const p of props) rec[p] = cs.getPropertyValue(p);
          const r = el.getBoundingClientRect();
          rec['@rect'] = [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)].join(',');
          rec['@cls'] = el.getAttribute('class') || '';
          res[k] = rec;
        }
        return res;
      }, PROPS);
      out[`${name}@${w}`] = data;
      process.stdout.write(`  ${label} ${name}@${w}  ${Object.keys(data).length} nodes\n`);
    }
    await ctx.close();
  }));
  await browser.close();
  srv.close();
  mkdirSync(SNAPDIR, { recursive: true });
  writeFileSync(resolve(SNAPDIR, `${label}.json`), JSON.stringify(out));
  console.log(`\nwritten: audits/run13/parity/${label}.json`);
}

function diff(a, b) {
  const A = JSON.parse(readFileSync(resolve(SNAPDIR, `${a}.json`), 'utf8'));
  const B = JSON.parse(readFileSync(resolve(SNAPDIR, `${b}.json`), 'utf8'));
  const report = {};
  let total = 0;
  for (const scope of Object.keys(A)) {
    const ea = A[scope], eb = B[scope] || {};
    const changes = [];
    for (const k of Object.keys(ea)) {
      if (!(k in eb)) { changes.push({ node: k, cls: ea[k]['@cls'], gone: true }); continue; }
      const d = {};
      for (const p of Object.keys(ea[k])) {
        if (p === '@cls') continue;
        if (ea[k][p] !== eb[k][p]) d[p] = [ea[k][p], eb[k][p]];
      }
      if (Object.keys(d).length) changes.push({ node: k, cls: ea[k]['@cls'], props: d });
    }
    for (const k of Object.keys(eb)) if (!(k in ea)) changes.push({ node: k, cls: eb[k]['@cls'], added: true });
    if (changes.length) { report[scope] = changes; total += changes.length; }
  }
  mkdirSync(OUT, { recursive: true });
  writeFileSync(resolve(OUT, `parity-${a}-to-${b}.json`), JSON.stringify(report, null, 2));

  console.log(`══ PARITY  ${a} → ${b} ═══════════════════════════════════════`);
  const scopes = Object.keys(report);
  if (!scopes.length) {
    console.log('  IDENTICAL — 0 nodes differ across all pages and viewports.');
  } else {
    for (const s of scopes) {
      console.log(`\n── ${s}  (${report[s].length} nodes) ──`);
      for (const c of report[s].slice(0, 24)) {
        if (c.gone) { console.log(`   GONE  ${c.node}  .${c.cls}`); continue; }
        if (c.added) { console.log(`   NEW   ${c.node}  .${c.cls}`); continue; }
        console.log(`   ${c.node}  .${c.cls}`);
        for (const [p, [x, y]] of Object.entries(c.props)) console.log(`        ${p}: ${x}  →  ${y}`);
      }
      if (report[s].length > 24) console.log(`   … ${report[s].length - 24} more (see JSON)`);
    }
  }
  const pagesTouched = new Set(scopes.map((s) => s.split('@')[0]));
  console.log(`\nTOTAL ${total} differing nodes across ${scopes.length} page-viewport scopes / ${pagesTouched.size} pages`);
  console.log(`written: audits/run13/parity-${a}-to-${b}.json`);
  return total;
}

const [, , cmd, x, y] = process.argv;
if (cmd === 'snap') await snap(x);
else if (cmd === 'diff') diff(x, y);
else { console.error('usage: snap <label> | diff <a> <b>'); process.exit(2); }
