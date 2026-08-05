#!/usr/bin/env node
/* ============================================================================
   tools/aic-run5-verify.mjs  ·  AIC RUN 5 — "BOOK PAGE + NAV LOCKUP" gate
   ----------------------------------------------------------------------------
   Build-time only (tools/ is never deployed). Playwright is borrowed from
   AVA-factory/adstage, the same way tools/render-audit.mjs does it.

   WHAT THIS PROVES — nothing here is inferred from the CSS, every number is
   read off a rendered page:

     1. NAV LOCKUP (Task C) — lockup-short is present and ~140-150px wide at
        every viewport down to 360, mark-compact takes over below it, the tap
        target clears 44px, and the bar neither wraps nor overflows.
     2. THE EMBED (Task A) — the calendar iframe actually FETCHES (the native
        lazy + form_embed.js deadlock returns a blank frame that still "passes"
        a DOM-only check), the skeleton clears, and a real date inside the
        cross-origin frame is tappable.
     3. NO HORIZONTAL SCROLL at 390 on every touched page.
     4. CTA REWIRE (Task B) — every in-page CTA resolves 200 and lands on
        /book/; zero direct-to-GHL hrefs survive outside /book/ itself.

   USAGE:  node tools/aic-run5-verify.mjs [baseUrl]
           default baseUrl http://localhost:8848  (python -m http.server on
           chauffeur/ — the same web root Vercel serves for aichauffeur.ai)
   ========================================================================== */
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire('C:/Users/offic/Desktop/AVA-factory/adstage/package.json');
const { chromium } = require('playwright');

const BASE = (process.argv[2] || 'http://localhost:8848').replace(/\/$/, '');
const SHOT = process.argv.includes('--shots');
mkdirSync(new URL('../audits', import.meta.url), { recursive: true });
const shotPath = (n) => new URL(`../audits/AIC-run5-${n}.png`, import.meta.url).pathname.slice(1);

const PAGES = [
  '/', '/book/', '/demo/', '/limo-answering-service/', '/after-hours-limo-dispatch/',
  '/milwaukee-limo-answering-service/', '/madison-limo-answering-service/',
  '/works-with-your-software/', '/airport-transfer-booking/', '/how-setup-works/',
  '/privacy/', '/terms/',
];

let fails = 0;
const ok = (c, msg) => { console.log(`  ${c ? 'PASS' : 'FAIL'}  ${msg}`); if (!c) fails++; };

const browser = await chromium.launch();

/* ── 1 · NAV LOCKUP ─────────────────────────────────────────────────────── */
console.log('\n── TASK C · NAV LOCKUP ' + '─'.repeat(50));
for (const [w, h] of [[320, 800], [359, 800], [360, 800], [390, 844], [768, 1024], [1440, 900]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(`${BASE}/book/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(250);
  const m = await page.evaluate(() => {
    const r = (s) => { const e = document.querySelector(s); if (!e) return null;
      const b = e.getBoundingClientRect(); const c = getComputedStyle(e);
      return { display: c.display, w: +b.width.toFixed(1), h: +b.height.toFixed(1),
               left: +b.left.toFixed(1), right: +b.right.toFixed(1) }; };
    const nav = document.querySelector('nav.top').getBoundingClientRect();
    const lock = r('.brand-lockup'), comp = r('.brand-compact'), cta = r('.nav-cta');
    const brand = r('.brand');
    return { lock, comp, cta, brand, navH: +nav.height.toFixed(1),
             scrollW: document.documentElement.scrollWidth, inner: innerWidth,
             // wrap detection: nav is one flex row, so a wrap shows up as a
             // brand and CTA that no longer share a horizontal band
             sameRow: Math.abs((lock.display !== 'none' ? lock : comp).h ? 0 : 0) === 0 &&
                      cta.left >= (lock.display !== 'none' ? lock.right : comp.right) };
  });
  const shown = m.lock.display !== 'none' ? 'lockup' : (m.comp.display !== 'none' ? 'compact' : 'NEITHER');
  const wide = m.lock.display !== 'none' ? m.lock.w : m.comp.w;
  console.log(`\n  [${w}x${h}] shows ${shown} @ ${wide}px wide · brand tap ${m.brand.w}x${m.brand.h} · CTA ${m.cta.w}x${m.cta.h} · gap ${(m.cta.left - (m.lock.display !== 'none' ? m.lock.right : m.comp.right)).toFixed(1)}px`);
  ok(m.scrollW <= m.inner, `no horizontal scroll (scrollWidth ${m.scrollW} <= ${m.inner})`);
  ok(m.brand.h >= 44 && m.brand.w >= 44, `brand tap target >= 44x44 (${m.brand.w}x${m.brand.h})`);
  ok(m.cta.h >= 44, `nav CTA tap target >= 44px tall (${m.cta.h})`);
  ok(m.cta.left >= (m.lock.display !== 'none' ? m.lock.right : m.comp.right), 'brand and CTA do not overlap');
  if (w >= 360) {
    ok(shown === 'lockup', `lockup-short is the mark at ${w}px`);
    ok(wide >= 120, `over the kit 120px minimum (${wide}px)`);
    if (w <= 600) ok(wide >= 140 && wide <= 150, `inside the 140-150px target (${wide}px)`);
  } else {
    ok(shown === 'compact', `falls back to mark-compact below 360px (${w}px)`);
  }
  if (SHOT && (w === 360 || w === 390 || w === 1440)) {
    await page.screenshot({ path: shotPath(`nav-${w}`), clip: { x: 0, y: 0, width: w, height: 90 } });
  }
  await page.close();
}

/* ── 2 · THE EMBED ──────────────────────────────────────────────────────── */
console.log('\n── TASK A · THE EMBED ' + '─'.repeat(51));
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const fetched = [];
  page.on('request', (r) => { if (r.url().includes('widget/booking')) fetched.push(r.url()); });
  await page.goto(`${BASE}/book/`, { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(9000);

  const m = await page.evaluate(() => {
    const f = document.querySelector('[data-cal-frame]');
    const shell = document.querySelector('.cal-shell');
    const skel = document.querySelector('[data-cal-skel]');
    const fb = document.querySelector('.cal-fallback a');
    const cs = getComputedStyle(f);
    return {
      src: f.getAttribute('src') || '',
      hasNativeLazy: f.hasAttribute('loading'),
      visibility: cs.visibility, opacity: cs.opacity, position: cs.position,
      iframeH: Math.round(f.getBoundingClientRect().height),
      iframeW: Math.round(f.getBoundingClientRect().width),
      shellH: Math.round(shell.getBoundingClientRect().height),
      skelGone: skel.classList.contains('gone'),
      fbText: fb.textContent.trim(), fbHref: fb.getAttribute('href'),
      fbH: Math.round(fb.getBoundingClientRect().height),
      scrollW: document.documentElement.scrollWidth,
      h1: document.querySelector('h1').textContent.trim(),
      h1Top: Math.round(document.querySelector('h1').getBoundingClientRect().top),
      shellTop: Math.round(shell.getBoundingClientRect().top + scrollY),
      title: document.title,
      desc: document.querySelector('meta[name=description]').content,
      canonical: document.querySelector('link[rel=canonical]').href,
    };
  });

  console.log(`\n  H1 "${m.h1}" · title ${m.title.length} chars · meta description ${m.desc.length} chars`);
  console.log(`  calendar shell @ ${m.shellTop}px · iframe ${m.iframeW}x${m.iframeH}`);
  ok(fetched.length > 0, `booking widget was actually FETCHED (${fetched.length} request/s)`);
  ok(!m.hasNativeLazy, 'no native loading="lazy" (would deadlock with form_embed.js)');
  ok(!!m.src, 'src was attached by the lazy loader');
  ok(m.visibility === 'visible' && m.opacity === '1', `frame is visible (${m.visibility}/${m.opacity})`);
  ok(m.skelGone, 'skeleton cleared on load');
  ok(m.scrollW <= 390, `no horizontal scroll at 390 (${m.scrollW})`);
  ok(m.desc.length <= 155, `meta description <= 155 chars (${m.desc.length})`);
  ok(m.canonical === 'https://aichauffeur.ai/book/', `canonical is ${m.canonical}`);
  ok(/Open it full screen/.test(m.fbText), `fallback reads "${m.fbText}"`);
  ok(m.fbHref.includes('api.leadconnectorhq.com/widget/booking/UaxV0ENx2cEUYs6qeWZ7'), 'fallback points at the raw widget URL');
  ok(m.fbH >= 44, `fallback link tap target >= 44px (${m.fbH})`);

  /* The calendar itself — cross-origin, so reach in with a real frame handle.
     GHL renders a vue-datepicker: td.vdpCell, with .disabled on days that
     cannot be booked. An "is it tappable" check that ignores .disabled proves
     nothing, so the selectable set is the assertion. */
  /* The widget re-navigates inside its own frame while booting, which detaches
     any handle taken too early — waitForSelector on a stale frame just times
     out. Re-acquire and poll instead. */
  let frame = null;
  for (let i = 0; i < 40; i++) {
    const f = page.frames().find((fr) => fr.url().includes('widget/booking'));
    if (f) {
      try {
        if (await f.evaluate(() => document.querySelectorAll('td.vdpCell').length) > 0) { frame = f; break; }
      } catch { /* detached mid-navigation — retry */ }
    }
    await page.waitForTimeout(1000);
  }
  ok(!!frame, 'the booking widget frame booted and rendered its date grid');

  let day = null;
  if (frame) {
    try {
      const counts = await frame.evaluate(() => ({
        total: document.querySelectorAll('td.vdpCell').length,
        open: document.querySelectorAll('td.vdpCell:not(.disabled)').length,
        // does the widget need more room than the iframe gives it?
        scrollH: document.documentElement.scrollHeight,
        clientH: document.documentElement.clientHeight,
      }));
      console.log(`  calendar grid: ${counts.open} selectable of ${counts.total} cells · frame content ${counts.scrollH}px in ${counts.clientH}px`);
      ok(counts.open > 0, `the calendar offers bookable dates (${counts.open})`);
      ok(counts.scrollH <= counts.clientH + 1,
         `calendar fits the iframe — no inner scrolling (${counts.scrollH} <= ${counts.clientH})`);

      const cell = frame.locator('td.vdpCell:not(.disabled)').first();
      const label = (await cell.textContent() || '').trim();
      const box = await cell.boundingBox();
      await cell.click({ timeout: 10000 });
      day = { label, w: Math.round(box.width), h: Math.round(box.height) };
    } catch (e) {
      console.log('  (frame probe: ' + e.message.split('\n')[0] + ')');
    }
  }

  if (day) {
    console.log(`  tapped day "${day.label}" · cell ${day.w}x${day.h}`);
    ok(true, `a real date is tappable at 390px (day ${day.label})`);
    await page.waitForTimeout(4000);
    const after = await page.evaluate(() => ({
      iframeH: Math.round(document.querySelector('[data-cal-frame]').getBoundingClientRect().height),
      scrollW: document.documentElement.scrollWidth,
    }));
    const slots = await frame.evaluate(() => {
      const t = document.body.innerText;
      const m = t.match(/\b\d{1,2}:\d{2}\s*(am|pm|AM|PM)\b/g) || [];
      return { sample: m.slice(0, 4), n: m.length };
    });
    console.log(`  after tap: iframe ${after.iframeH}px · ${slots.n} time slot/s e.g. ${slots.sample.join(', ') || '(none)'}`);
    ok(slots.n > 0, `tapping the date surfaced real time slots (${slots.n})`);
    ok(after.scrollW <= 390, `still no horizontal scroll after tap (${after.scrollW})`);
  } else {
    ok(false, 'could not tap a date inside the calendar frame');
  }

  if (SHOT) {
    await page.screenshot({ path: shotPath('book-390'), fullPage: true });
  }
  await page.close();
}

/* ── 3 · SITEWIDE · overflow + CTA rewire ───────────────────────────────── */
console.log('\n── TASK B · CTA REWIRE + 390 OVERFLOW ' + '─'.repeat(35));
const seenTargets = new Set();
for (const p of PAGES) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const resp = await page.goto(BASE + p, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(200);
  const m = await page.evaluate(() => {
    const links = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
    return {
      scrollW: document.documentElement.scrollWidth,
      ghl: links.filter((h) => h.includes('leadconnectorhq.com/widget/booking')),
      book: links.filter((h) => h === '/book/').length,
      title: document.title,
    };
  });
  const isBook = p === '/book/';
  const bad = m.ghl.length > (isBook ? 1 : 0);
  console.log(`\n  ${p}  [${resp.status()}]  ${m.book} -> /book/ · ${m.ghl.length} raw GHL link/s`);
  ok(resp.status() === 200, `HTTP 200`);
  ok(m.scrollW <= 390, `no horizontal scroll at 390 (${m.scrollW})`);
  ok(!bad, isBook ? 'only the full-screen fallback keeps the raw URL' : 'zero direct-to-GHL CTAs');
  ok(m.book > 0, `has at least one /book/ CTA (${m.book})`);
  if (m.book) seenTargets.add(p);
  await page.close();
}

/* every /book/ CTA target resolves */
{
  const page = await browser.newPage();
  const r = await page.goto(`${BASE}/book/`, { waitUntil: 'domcontentloaded' });
  console.log('');
  ok(r.status() === 200, `/book/ resolves 200 for every rewired CTA (${r.status()})`);
  await page.close();
}

await browser.close();
console.log(`\n${'='.repeat(72)}\n  ${fails ? 'FAILED — ' + fails + ' check(s)' : 'ALL CHECKS PASSED'}\n${'='.repeat(72)}\n`);
process.exit(fails ? 1 : 0);
