#!/usr/bin/env node
// THE EYE — tools/render-audit.mjs <url> [tag]
// Headless-Chromium render audit: screenshots 390x844 + 1440x900 into /audits/,
// prints a fold report (y of first tap-to-call, H1, first CTA). Build-time only
// (tools/ is never deployed). Playwright is borrowed from AVA-factory/adstage.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire('C:/Users/offic/Desktop/AVA-factory/adstage/package.json');
const { chromium } = require('playwright');

const url = process.argv[2] || 'https://aivoiceagency.ai/';
const tag = process.argv[3] || 'shot';
mkdirSync(new URL('../audits', import.meta.url), { recursive: true });

const browser = await chromium.launch();
for (const [w, h, name] of [[390, 844, 'mobile'], [1440, 900, 'desktop']]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => {
    const top = (el) => (el ? Math.round(el.getBoundingClientRect().top + scrollY) : null);
    const first = (sel) => [...document.querySelectorAll(sel)]
      .map((e) => top(e)).filter((y) => y !== null).sort((a, b) => a - b)[0] ?? null;
    return { h1: top(document.querySelector('h1')), tel: first('a[href^="tel:"],button[data-answer]'),
             cta: first('.btn,.bs-cta,a[href="/book"],a[href^="/book"]') };
  });
  console.log(`[${tag} ${name} ${w}x${h}] H1 @ ${r.h1}px · first CTA @ ${r.cta}px · first tap-to-call @ ${r.tel}px · fold = ${h}px`);
  await page.screenshot({ path: new URL(`../audits/${tag}-${name}.png`, import.meta.url).pathname.slice(1) });
}
await browser.close();
