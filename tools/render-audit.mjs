#!/usr/bin/env node
// THE EYE — tools/render-audit.mjs <url> [tag]
// Render audit: Chromium 390x844 + 1440x900 with a fold report, PLUS WebKit-390
// shots (dark + light) — iOS Safari is a permanent visual gate. Saves to /audits/.
// Build-time only (tools/ is never deployed). Playwright from AVA-factory/adstage.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire('C:/Users/offic/Desktop/AVA-factory/adstage/package.json');
const { chromium, webkit } = require('playwright');

const url = process.argv[2] || 'https://aivoiceagency.ai/';
const nt = (u) => { const [p, h] = String(u).split('#'); return p + (p.includes('?') ? '&' : '?') + 'notrack=1' + (h ? '#' + h : ''); };  // RUN 4: opt gate traffic out of analytics
const tag = process.argv[3] || 'shot';
mkdirSync(new URL('../audits', import.meta.url), { recursive: true });
const shot = (name) => new URL(`../audits/${tag}-${name}.png`, import.meta.url).pathname.slice(1);

// ---- Chromium: fold report + mobile/desktop ----
const cr = await chromium.launch();
for (const [w, h, name] of [[390, 844, 'mobile'], [1440, 900, 'desktop']]) {
  const page = await cr.newPage({ viewport: { width: w, height: h } });
  await page.goto(nt(url), { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => {
    const top = (el) => (el ? Math.round(el.getBoundingClientRect().top + scrollY) : null);
    const first = (sel) => [...document.querySelectorAll(sel)]
      .map((e) => top(e)).filter((y) => y !== null).sort((a, b) => a - b)[0] ?? null;
    return { h1: top(document.querySelector('h1')), tel: first('a[href^="tel:"],button[data-answer]'),
             cta: first('.btn,.bs-cta,a[href="/book"],a[href^="/book"]') };
  });
  console.log(`[${tag} chromium ${name} ${w}x${h}] H1 @ ${r.h1}px · first CTA @ ${r.cta}px · first tap-to-call @ ${r.tel}px · fold = ${h}px`);
  await page.screenshot({ path: shot(name) });
}
await cr.close();

// ---- WebKit (iOS Safari gate): 390, dark + light ----
const wk = await webkit.launch();
for (const theme of ['dark', 'light']) {
  const page = await wk.newPage({ viewport: { width: 390, height: 844 } });
  if (theme === 'light') await page.addInitScript(() => { try { localStorage.setItem('bs-theme', 'light'); } catch (e) {} });
  await page.goto(nt(url), { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(600);
  console.log(`[${tag} webkit-390 ${theme}] rendered`);
  await page.screenshot({ path: shot('webkit-390-' + theme) });
}
await wk.close();
