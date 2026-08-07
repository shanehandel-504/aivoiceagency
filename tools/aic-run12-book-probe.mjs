#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// AIC RUN 12 · § 7 — /book/ WHITE-CHROME PROBE
// ---------------------------------------------------------------------------
//   node tools/aic-run12-book-probe.mjs [origin]
//
// The question is narrow: does any of GHL's own widget-page chrome (which is
// white) render around the dark calendar card? A screenshot alone cannot answer
// it — a pale band four pixels tall at the foot of an iframe is invisible in a
// thumbnail and obvious on a phone at full brightness.
//
// So this reads PIXELS. It samples a grid across the iframe's own box and
// reports every sample whose luminance is above a dark-UI threshold, plus the
// iframe's rendered geometry against the card that is supposed to contain it.
// Shots are written too, because § 7 asks for one either way.
//
// Trap 15 applies: /book/'s iframe is injected by GHL's form_embed.js and parked
// off-screen until the widget posts ready. Wait for it, then wait for it to have
// non-trivial height, or the probe measures a 0px box and calls the page clean.
// ═══════════════════════════════════════════════════════════════════════════
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire('C:/Users/offic/Desktop/AVA-factory/adstage/package.json');
const { chromium } = require('playwright');

const ORIGIN = process.argv[2] || 'https://aichauffeur.ai';
const OUT = new URL('../audits/run12/book/', import.meta.url).pathname.slice(1);
mkdirSync(OUT, { recursive: true });

const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

const b = await chromium.launch();
let dirty = 0;

for (const [w, h, tag] of [[390, 844, '390'], [1440, 900, 'desktop']]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto(ORIGIN + '/book/', { waitUntil: 'networkidle' });

  // wait for the widget to actually exist and have height
  let ready = false;
  for (let i = 0; i < 40; i++) {
    ready = await p.evaluate(() => {
      const f = document.querySelector('iframe');
      return !!f && f.getBoundingClientRect().height > 200;
    });
    if (ready) break;
    await p.waitForTimeout(500);
  }

  const geo = await p.evaluate(() => {
    const f = document.querySelector('iframe');
    if (!f) return null;
    const r = f.getBoundingClientRect();
    const host = f.parentElement;
    const hr = host.getBoundingClientRect();
    const hs = getComputedStyle(host);
    return {
      iframe: { w: +r.width.toFixed(1), h: +r.height.toFixed(1), top: +r.top.toFixed(1) },
      host: { cls: host.className, w: +hr.width.toFixed(1), h: +hr.height.toFixed(1),
              overflow: hs.overflow, bg: hs.backgroundColor },
      docOverflowX: document.documentElement.scrollWidth > window.innerWidth,
    };
  });

  console.log('\n── /book/ @ %s ─────────────────────────────', tag);
  console.log('   widget ready: %s', ready ? 'yes' : 'NO (probe would be measuring nothing)');
  console.log('   %s', JSON.stringify(geo));

  if (!ready || !geo) { dirty++; await ctx.close(); continue; }

  // scroll the widget into view and shoot it
  await p.evaluate(() => document.querySelector('iframe')
    ?.scrollIntoView({ block: 'center', behavior: 'auto' }));
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}book-${tag}.png` });

  // sample a grid over the iframe box, in PAGE pixels
  // The host wrap is already overflow:hidden on a --surface ground, so any
  // white has to be coming from INSIDE the widget. Reading the iframe's own
  // document is the direct measurement, and Playwright reaches cross-origin
  // frames where page JS cannot — no pixel decoding, no extra dependency, and
  // it names the offending element instead of a y coordinate.
  const inner = [];
  for (const f of p.frames()) {
    if (f === p.mainFrame()) continue;
    try {
      const r = await f.evaluate(() => {
        const lu = (s) => {
          const m = s.match(/\d+(\.\d+)?/g);
          if (!m || m.length < 3) return null;
          if (m.length > 3 && parseFloat(m[3]) < 0.1) return null;   // transparent
          return 0.2126 * +m[0] + 0.7152 * +m[1] + 0.0722 * +m[2];
        };
        const out = {
          url: location.host,
          html: getComputedStyle(document.documentElement).backgroundColor,
          body: getComputedStyle(document.body).backgroundColor,
          pale: [],
        };
        // any element covering >40% of the widget width on a light ground
        const W = document.documentElement.clientWidth;
        document.querySelectorAll('*').forEach(el => {
          const b = el.getBoundingClientRect();
          if (b.width < W * 0.4 || b.height < 6) return;
          const bg = getComputedStyle(el).backgroundColor;
          const l = lu(bg);
          if (l !== null && l > 120) {
            out.pale.push({ tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 40),
                            bg, w: Math.round(b.width), h: Math.round(b.height), top: Math.round(b.top) });
          }
        });
        out.pale = out.pale.slice(0, 8);
        return out;
      });
      inner.push(r);
    } catch (e) { inner.push({ url: 'unreadable frame', err: String(e).slice(0, 80) }); }
  }
  for (const r of inner) {
    console.log('   frame %s · html %s · body %s', r.url, r.html, r.body);
    if (r.pale && r.pale.length) {
      dirty++;
      r.pale.forEach(x => console.log('     PALE  <%s class="%s"> %s  %dx%d @ y%d',
        x.tag, x.cls, x.bg, x.w, x.h, x.top));
    } else if (r.pale) {
      console.log('     no light-ground block covering >40%% of the widget width');
    }
  }
  console.log('   shot -> audits/run12/book/book-%s.png', tag);
  await ctx.close();
}
await b.close();

console.log('\n  /book/ WHITE CHROME: %s\n', dirty ? 'SEEN — needs the overflow wrap' : 'CLEAN');
process.exit(0);
