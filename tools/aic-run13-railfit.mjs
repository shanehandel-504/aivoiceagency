#!/usr/bin/env node
/* ── AIC RUN 13 · § 1 — THE RAIL FITS, MEASURED ───────────────────────────────
   The two labels do not fit side by side on a phone at full length, so the verb
   drops at 480 and the type steps at 400. Those two numbers came from measuring
   text, and a text budget that is only ever computed is a budget nobody has
   checked.

   This renders the real bar and measures the real boxes:

     · scrollWidth vs clientWidth on each control — the only honest overflow
       test for a nowrap label in a grid track. A control whose text does not
       fit does NOT make the page scroll (trap: the bar is position:fixed and
       body is overflow-x:hidden), so document-level overflow probes read clean
       on a bar that is visibly clipped;
     · the control's own height, against the 56px law;
     · the verb's presence against the breakpoint that is supposed to drop it;
     · and the gap between the verb and the digits, which is the defect the
       header chip shipped — a flex `gap` spacing the word from the number.

   Run against production after deploy, and against the local tree before it.
   ─────────────────────────────────────────────────────────────────────────── */
import { createRequire } from 'node:module';
import { existsSync, statSync, createReadStream } from 'node:fs';
import { resolve, dirname, join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';

const require = createRequire('C:/Users/offic/Desktop/AVA-factory/adstage/package.json');
const { chromium } = require('playwright');

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = resolve(ROOT, 'chauffeur');
const ORIGIN_ARG = process.argv[2];

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

// Every width the render gate uses that is below the rail's 880px breakpoint,
// plus 320 — under the tested floor, and the place a text budget fails first.
const WIDTHS = [320, 360, 390, 430, 480, 560, 768, 879];
const PAGES = [['/', 'home'], ['/limo-answering-service/', 'money'], ['/book/', 'book'], ['/terms/', 'terms']];

const { srv, origin } = ORIGIN_ARG ? { srv: null, origin: ORIGIN_ARG } : await startServer();
const browser = await chromium.launch();
const bad = [];
const rows = [];

/* ── NEGATIVE CONTROL (DESIGN-SYSTEM trap 13) ──────────────────────────────
   A zero-reading probe ships a control or it is decoration. Lengthen the Book
   label on a real page at the tightest tested width and require the measure to
   catch it. If a deliberately broken bar reads clean, the whole run aborts —
   because then the PASS below means nothing. */
{
  const ctx = await browser.newContext({ viewport: { width: 360, height: 780 } });
  const p = await ctx.newPage();
  await p.goto(origin + '/limo-answering-service/', { waitUntil: 'load' });
  await p.waitForTimeout(250);
  const caught = await p.evaluate(() => {
    const rail = document.querySelector('.rail');
    rail.style.transform = 'none'; rail.style.visibility = 'visible';
    const a = rail.querySelector('.rail-book');
    const before = rail.getBoundingClientRect().width;
    a.textContent = 'Book the setup call today with our dispatch team';
    const cs = getComputedStyle(rail);
    const box = rail.getBoundingClientRect();
    const inner = box.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    let tracks = 0;
    const kids = [...rail.querySelectorAll('a')];
    for (const k of kids) tracks += k.getBoundingClientRect().width;
    tracks += parseFloat(cs.columnGap || 0) * (kids.length - 1);
    return { over: Math.ceil(tracks - inner), railW: Math.round(box.width), before: Math.round(before),
             ctrlSays: Math.ceil(a.scrollWidth - a.clientWidth) };
  });
  await ctx.close();
  console.log(`negative control @360: overstuffed label pushes the bar's tracks ${caught.over}px past its box` +
    `  (measuring the CONTROL would have reported ${caught.ctrlSays})`);
  if (caught.over <= 0) {
    console.error('ABORT — the overflow measure did not catch a deliberately overstuffed control.');
    await browser.close(); if (srv) srv.close();
    process.exit(2);
  }
  console.log('');
}

for (const [path, tag] of PAGES) {
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 780 } });
    await ctx.route('**/*.{mp3,wav,m4a,ogg,mp4,webm}', (r) => r.abort());
    const p = await ctx.newPage();
    await p.goto(origin + path, { waitUntil: 'load' });
    await p.waitForTimeout(300);
    // Force the bar visible rather than scrolling it into arming range: this
    // probe is about geometry, and the arm/suppress logic has its own gate.
    const r = await p.evaluate(() => {
      const rail = document.querySelector('.rail');
      rail.style.transform = 'none';
      rail.style.visibility = 'visible';
      const out = { solo: rail.classList.contains('rail--solo'), ctrls: [] };
      /* ── THE CONTROL IS THE WRONG ELEMENT TO MEASURE ─────────────────────
         Two dead ends, both of which read a clean zero on a visibly broken bar:

           scrollWidth on the control — the controls are `overflow:visible`, so
           they have no scrolling box and the engine reports scrollWidth ==
           clientWidth however far a nowrap label runs.

           content-vs-box on the control — a grid item's default `min-width` is
           `auto`, which resolves to its MIN-CONTENT size. With `white-space:
           nowrap` that is the whole label, so a `1fr` track simply GROWS to fit
           the text. The control never overflows. It cannot.

         What overflows is the BAR: the two grown tracks plus the gap exceed the
         rail's content box, and the second control runs off the right edge of
         the screen. And the page-level overflow probes cannot see that either,
         because the rail is `position:fixed` and `body` is `overflow-x:hidden`
         — RUN 9's "a fixed bar never hits scrollWidth".

         So the measure is: sum the tracks and the gap, compare against the
         rail's own content box. Recorded per control as its share, with the
         bar-level total carrying the verdict. */
      const cs = getComputedStyle(rail);
      const box = rail.getBoundingClientRect();
      out.inner = box.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const kids = [...rail.querySelectorAll('a')];
      out.tracks = kids.reduce((s, k) => s + k.getBoundingClientRect().width, 0)
        + parseFloat(cs.columnGap || 0) * (kids.length - 1);
      out.over = Math.ceil(out.tracks - out.inner);
      for (const a of kids) {
        const verb = a.querySelector('.rail-verb');
        const label = a.querySelector('.rail-label');
        let verbGap = null;
        if (verb && verb.getClientRects().length && label) {
          // The digits are a text node inside .rail-label, after the verb span.
          const tn = [...label.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
          if (tn) {
            const rg = document.createRange(); rg.selectNodeContents(tn);
            verbGap = Math.round(rg.getBoundingClientRect().left - verb.getBoundingClientRect().right);
          }
        }
        out.ctrls.push({
          cls: a.className,
          text: a.textContent.replace(/\s+/g, ' ').trim(),
          clientW: a.clientWidth,
          h: Math.round(a.getBoundingClientRect().height),
          verbShown: !!(verb && verb.getClientRects().length),
          verbGap,
        });
      }
      return out;
    });
    await ctx.close();

    if (r.over > 0) bad.push({ tag, w, why: `rail tracks overflow the bar by ${r.over}px`, tracks: Math.round(r.tracks), inner: Math.round(r.inner) });
    for (const c of r.ctrls) {
      rows.push({ tag, w, cls: c.cls, clientW: c.clientW, inner: Math.round(r.inner), over: r.over, h: c.h, verb: c.verbShown, verbGap: c.verbGap });
      if (c.h < 56) bad.push({ tag, w, cls: c.cls, why: `control is ${c.h}px, under the 56px law` });
      if (c.verbGap !== null && c.verbGap > 2) bad.push({ tag, w, cls: c.cls, why: `${c.verbGap}px hole between the verb and the digits` });
      // The verb must be present above 480 and absent below it.
      if (c.cls.includes('rail-call')) {
        const want = w >= 480;
        if (c.verbShown !== want) bad.push({ tag, w, cls: c.cls, why: `verb ${c.verbShown ? 'shown' : 'hidden'} at ${w}, expected ${want ? 'shown' : 'hidden'}` });
      }
    }
    // Shape: two controls everywhere except /book/, which is Call alone.
    const wantSolo = path === '/book/';
    if (r.solo !== wantSolo || r.ctrls.length !== (wantSolo ? 1 : 2)) {
      bad.push({ tag, w, why: `rail shape wrong: solo=${r.solo} ctrls=${r.ctrls.length}` });
    }
  }
}
await browser.close();
if (srv) srv.close();

console.log('══ AIC RUN 13 · RAIL FIT ══════════════════════════════════════════');
console.log('page    w    control      ctrlW   barInner  over   h   verb  verbGap');
for (const r of rows) {
  console.log(`${r.tag.padEnd(7)}${String(r.w).padEnd(5)}${r.cls.replace('rail-', '').padEnd(12)}${String(r.clientW).padStart(6)}${String(r.inner).padStart(10)}${String(r.over).padStart(6)}${String(r.h).padStart(5)}${String(r.verb).padStart(7)}${String(r.verbGap ?? '-').padStart(9)}`);
}
console.log('');
if (bad.length) {
  console.log(`FAIL — ${bad.length} finding(s):`);
  for (const b of bad) console.log('  ' + JSON.stringify(b));
  process.exit(1);
}
console.log(`PASS — ${rows.length} controls across ${WIDTHS.length} widths x ${PAGES.length} pages: no overflow, all >=56px, verb drops at 480, no verb/digit hole.`);
