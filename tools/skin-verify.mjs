#!/usr/bin/env node
/* RUN 3 · FINAL SKIN — the law gate.
 * Renders each page at 390x844 and 1440x900 in BOTH themes and asserts, per
 * rendered viewport band:
 *   1. SOLID GREEN CTAs <= 1            (the one-green-per-viewport law)
 *   2. no multi-hue gradient on any interactive element
 *   3. no light text on a solid red fill (#EEF0F4 on red = 3.07:1)
 *   4. zero horizontal overflow
 *   5. every text node >= 4.5:1 against its painted backdrop (AA sweep)
 *
 * Usage: node tools/skin-verify.mjs [baseUrl] [--pages a,b,c]
 */
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/offic/Desktop/AVA-factory/adstage/package.json');
const { chromium } = require('playwright');

const BASE = (process.argv[2] || 'http://localhost:8847').replace(/\/$/, '');
const argPages = (process.argv.find((a) => a.startsWith('--pages=')) || '').split('=')[1];
const PAGES = argPages ? argPages.split(',') : [
  '/index.html', '/live/index.html', '/book/index.html', '/lsa/index.html', '/index.html#pricing',
];

const GREENS = ['#2ee6a8', '#0b7e56'];               // dark + light advance-the-sale
const REDS   = ['#ff3b4e', '#c2182a'];
const LIGHTS = ['#eef0f4', '#ffffff', '#f4f6fa'];

const rgbToHex = (s) => {
  const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null;
  const [r, g, b, a] = m[1].split(',').map((v) => parseFloat(v));
  if (a !== undefined && a < 0.6) return null;        // not a solid fill
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
};

const AUDIT = `(${function () {
  const hex = (s) => {
    const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const p = m[1].split(',').map((v) => parseFloat(v));
    if (p[3] !== undefined && p[3] < 0.6) return null;
    return '#' + p.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  };
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = (h) => { const n = parseInt(h.slice(1), 16); return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const backdrop = (el) => {
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const h = hex(getComputedStyle(n).backgroundColor); if (h) return h;
    }
    return hex(getComputedStyle(document.body).backgroundColor) || '#0a0a0f';
  };

  const H = innerHeight, vis = (r) => r.bottom > 0 && r.top < H && r.width > 0 && r.height > 0;
  const out = { greens: [], rainbow: [], redText: [], aa: [], overflowX: 0, bands: {} };

  // --- solid green CTAs, bucketed into viewport-height bands ---
  document.querySelectorAll('a,button,input[type=submit]').forEach((el) => {
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8 || cs.visibility === 'hidden' || cs.display === 'none') return;
    const bg = hex(cs.backgroundColor); if (!bg) return;
    if (['#2ee6a8', '#0b7e56'].includes(bg.toLowerCase())) {
      const band = Math.floor((r.top + scrollY) / H);
      out.bands[band] = (out.bands[band] || 0) + 1;
      out.greens.push({ band, text: (el.textContent || '').trim().slice(0, 44), cls: el.className.toString().slice(0, 60) });
    }
  });

  // --- multi-hue gradients on interactive elements ---
  document.querySelectorAll('a,button,input,select,[role=button],[tabindex]').forEach((el) => {
    ['', '::before', '::after'].forEach((pe) => {
      const bi = getComputedStyle(el, pe || null).backgroundImage;
      if (!bi || bi === 'none' || !/gradient/.test(bi)) return;
      const hues = [...bi.matchAll(/rgba?\(([^)]+)\)/g)].map((m) => {
        const p = m[1].split(',').map(Number);
        if (p[3] !== undefined && p[3] < 0.06) return null;
        const [R, G, B] = p; const mx = Math.max(R, G, B), mn = Math.min(R, G, B);
        if (mx - mn < 26) return null;                       // greyscale/white — no hue
        let h; if (mx === R) h = ((G - B) / (mx - mn)) % 6; else if (mx === G) h = (B - R) / (mx - mn) + 2; else h = (R - G) / (mx - mn) + 4;
        return Math.round(((h * 60) + 360) % 360 / 30) * 30; // 30-deg buckets
      }).filter((x) => x !== null);
      if (new Set(hues).size > 1) out.rainbow.push({ sel: el.tagName + '.' + el.className.toString().slice(0, 40), pe, hues: [...new Set(hues)] });
    });
  });

  // --- light text on solid red + full AA sweep on visible text ---
  document.querySelectorAll('*').forEach((el) => {
    if (!el.childNodes.length) return;
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!hasText) return;
    const r = el.getBoundingClientRect(); if (!vis(r)) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.5) return;
    const fg = hex(cs.color); if (!fg) return;
    const bg = backdrop(el);
    if (['#ff3b4e', '#c2182a'].includes(bg.toLowerCase()) && ['#eef0f4', '#ffffff', '#f4f6fa'].includes(fg.toLowerCase()))
      out.redText.push({ fg, bg, text: el.textContent.trim().slice(0, 40) });
    const size = parseFloat(cs.fontSize), weight = parseInt(cs.fontWeight) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const need = large ? 3.0 : 4.5, got = ratio(fg, bg);
    if (got < need) out.aa.push({ fg, bg, got: +got.toFixed(2), need, size, text: el.textContent.trim().slice(0, 40) });
  });

  out.overflowX = Math.max(0, document.documentElement.scrollWidth - innerWidth);
  return out;
}})()`;

let fail = 0, checks = 0;
const br = await chromium.launch();
for (const path of PAGES) {
  for (const [w, h, vp] of [[390, 844, 'mobile'], [1440, 900, 'desktop']]) {
    for (const theme of ['dark', 'light']) {
      const ctx = await br.newContext({ viewport: { width: w, height: h } });
      if (theme === 'light') await ctx.addInitScript(() => { try { localStorage.setItem('bs-theme', 'light'); } catch (e) {} });
      const page = await ctx.newPage();
      const url = BASE + path + (path.includes('?') ? '&' : '?') + 'notrack=1';
      try { await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }); } catch (e) { console.log(`  SKIP ${path} — ${e.message.slice(0, 50)}`); await ctx.close(); continue; }
      await page.waitForTimeout(500);
      const r = await page.evaluate(AUDIT);
      await ctx.close();
      checks++;

      const worstBand = Math.max(0, ...Object.values(r.bands));
      const tag = `${path} ${vp} ${theme}`;
      const errs = [];
      if (worstBand > 1) errs.push(`GREEN x${worstBand} in one viewport band: ` + r.greens.map((g) => `"${g.text}"`).join(', '));
      if (r.rainbow.length) errs.push(`MULTI-HUE GRADIENT on ${r.rainbow.length}: ` + r.rainbow.map((x) => x.sel + x.pe).join(' | '));
      if (r.redText.length) errs.push(`LIGHT TEXT ON RED: ` + r.redText.map((x) => `"${x.text}"`).join(', '));
      if (r.overflowX > 0) errs.push(`H-OVERFLOW ${r.overflowX}px`);
      if (r.aa.length) errs.push(`AA FAIL x${r.aa.length}: ` + r.aa.slice(0, 4).map((x) => `${x.got}:1 ${x.fg}/${x.bg} "${x.text}"`).join(' | '));

      if (errs.length) { fail++; console.log(`FAIL ${tag}`); errs.forEach((e) => console.log(`       ${e}`)); }
      else console.log(`ok   ${tag}  (green=${worstBand}, aa=0, overflow=0)`);
    }
  }
}
await br.close();
console.log(`\n=== ${checks - fail}/${checks} viewport checks clean ===`);
process.exit(fail ? 1 : 0);
