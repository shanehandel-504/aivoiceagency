// tools/aic-try/lib.mjs — shared by render.mjs and call.mjs.

import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire('C:/Users/offic/Desktop/AVA-factory/adstage/package.json');
export const { chromium } = require('playwright');

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SITE = 'https://aichauffeur.ai';
const CHAUFFEUR = path.join(REPO, 'chauffeur');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.woff2': 'font/woff2', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
};

// Serve chauffeur/ AS https://aichauffeur.ai inside the test browser only, so the
// page's Origin header is the production one. apiHandler answers /api/web-call.
export async function serveLocal(context, apiHandler) {
  await context.route(`${SITE}/**`, async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    if (u.pathname === '/api/web-call') {
      if (!apiHandler) return route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"no_handler"}' });
      return route.fulfill(await apiHandler(req));
    }
    let p = decodeURIComponent(u.pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(CHAUFFEUR, p);
    if (!file.startsWith(CHAUFFEUR)) return route.fulfill({ status: 403, body: '' });
    try {
      const body = await readFile(file);
      return route.fulfill({ status: 200, body, headers: { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' } });
    } catch {
      return route.fulfill({ status: 404, body: 'not found' });
    }
  });
}

// Run a Vercel-style (req, res) handler in-process for one intercepted request.
export function vercelAdapter(handler, onResult) {
  return async (request) => {
    const headers = { ...request.headers(), 'x-forwarded-for': '127.0.0.1' };
    let body = {};
    try { body = JSON.parse(request.postData() || '{}'); } catch {}
    const out = await new Promise((resolve) => {
      const res = {
        statusCode: 200, headers: {},
        setHeader(k, v) { this.headers[k.toLowerCase()] = String(v); },
        end(s) { resolve({ status: this.statusCode, headers: this.headers, body: s }); },
      };
      handler({ method: request.method(), headers, body }, res);
    });
    if (onResult) onResult(out);
    return out;
  };
}

// Stands in for Turnstile and hands out Cloudflare's published dummy token.
// Only ever paired with the always-pass TEST secret, which siteverify accepts.
export const TURNSTILE_STUB = `(() => {
  const TOKEN = 'XXXX.DUMMY.TOKEN.XXXX'; const widgets = [];
  const issue = (w) => setTimeout(() => w.callback && w.callback(TOKEN), 60);
  window.turnstile = {
    render(el, o) { const w = { callback: o.callback }; widgets.push(w); issue(w); return String(widgets.length - 1); },
    reset(id) { const w = widgets[Number(id)]; if (w) issue(w); },
    execute(id) { const w = widgets[Number(id)]; if (w) issue(w); },
    remove() {}, getResponse() { return TOKEN; },
  };
  const m = /[?&]onload=([^&]+)/.exec(document.currentScript ? document.currentScript.src : '');
  if (m && typeof window[m[1]] === 'function') window[m[1]]();
})();`;
export const TURNSTILE_URL = /challenges\.cloudflare\.com\/turnstile\/v0\/api\.js/;

// Watch the status chip from inside the page: every change, timestamped.
export const STATE_RECORDER = () => {
  window.__states = [];
  document.addEventListener('DOMContentLoaded', () => {
    const tag = document.getElementById('try-tag');
    if (!tag) return;
    const log = () => window.__states.push({ s: tag.dataset.state, word: tag.textContent, t: Math.round(performance.now()) });
    log();
    new MutationObserver(log).observe(tag, { attributes: true, attributeFilter: ['data-state'] });
  });
};

// Rendered-pixel contrast for every visible text element, with ancestor
// opacity folded in and ::before fills counted (the primary button paints its
// fill there). Also the 12px floor, overflow and the visible-text "retell" check.
export async function probe(page) {
  return page.evaluate(() => {
    const parse = (c) => {
      const m = /rgba?\(([^)]+)\)/.exec(c || '');
      if (!m) return null;
      const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    };
    const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
    const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const shown = (el) => {
      if (!el.getClientRects().length) return false;
      for (let e = el; e; e = e.parentElement) {
        const s = getComputedStyle(e);
        if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
      }
      return true;
    };
    const bgOf = (el) => {
      const layers = [];
      for (let e = el; e; e = e.parentElement) {
        const own = parse(getComputedStyle(e).backgroundColor);
        const pre = getComputedStyle(e, '::before');
        const fill = pre.content !== 'none' && pre.position === 'absolute' ? parse(pre.backgroundColor) : null;
        if (own && own.a > 0) layers.push(own);
        if (fill && fill.a > 0) layers.push(fill);
      }
      let base = { r: 7, g: 11, b: 20, a: 1 };
      for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
      return base;
    };
    const rows = [];
    for (const el of document.body.querySelectorAll('*')) {
      const direct = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!direct || !shown(el)) continue;
      const s = getComputedStyle(el);
      let alpha = 1;
      for (let e = el; e; e = e.parentElement) alpha *= Number(getComputedStyle(e).opacity);
      const fg = parse(s.color); fg.a *= alpha;
      const bg = bgOf(el);
      const size = parseFloat(s.fontSize), weight = Number(s.fontWeight) || 400;
      const large = size >= 24 || (size >= 18.66 && weight >= 700);
      const cr = ratio(over(fg, bg), bg);
      rows.push({ text: el.textContent.trim().slice(0, 48), size, cr: Math.round(cr * 100) / 100, need: large ? 3 : 4.5 });
    }
    const de = document.documentElement;
    return {
      rows,
      failures: rows.filter((r) => r.cr < r.need),
      under12: rows.filter((r) => r.size < 12),
      minRatio: rows.reduce((m, r) => Math.min(m, r.cr), 99),
      scrollWidth: Math.max(de.scrollWidth, document.body.scrollWidth),
      innerWidth,
      retellVisible: /retell/i.test(document.body.innerText) || /retell/i.test(document.title),
      title: document.title,
      robots: (document.querySelector('meta[name="robots"]') || {}).content || null,
      canonical: (document.querySelector('link[rel="canonical"]') || {}).href || null,
      btn: (() => { const b = document.getElementById('try-btn'); if (!b) return null; const r = b.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height), label: b.textContent }; })(),
    };
  });
}

export async function retellGet(pathname) {
  const r = await fetch('https://api.retellai.com' + pathname, { headers: { Authorization: `Bearer ${process.env.RETELL_API_KEY}` } });
  const text = await r.text();
  let body; try { body = JSON.parse(text); } catch { body = text; }
  return { ok: r.ok, status: r.status, body };
}
