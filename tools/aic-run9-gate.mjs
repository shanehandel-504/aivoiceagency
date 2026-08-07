#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// AIC RUN 9 · "SIGNAL CUT v1.5" — THE RENDER GATE
// ---------------------------------------------------------------------------
// Build-time only; tools/ is never deployed. Playwright resolves from
// AVA-factory/adstage, which is where the browsers are installed on this box.
//
// EVERY ZERO-READING PROBE SHIPS A NEGATIVE CONTROL. A gate that cannot fail is
// not a gate, so the overflow probe, the contrast probe and the accent probe are
// each run once against a deliberately broken fixture first and must report the
// defect. If a control passes clean, the whole run aborts.
//
//   node tools/aic-run9-gate.mjs [origin]
//
// ═══════════════════════════════════════════════════════════════════════════
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const require = createRequire('C:/Users/offic/Desktop/AVA-factory/adstage/package.json');
const { chromium } = require('playwright');

const ORIGIN = process.argv[2] || 'http://localhost:8848';
const OUT = new URL('../audits/run9/', import.meta.url).pathname.slice(1);
mkdirSync(OUT, { recursive: true });

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
  ['/privacy/', 'privacy'],
  ['/terms/', 'terms'],
];
const VIEWPORTS = [[360, 800], [390, 844], [430, 932], [768, 1024], [1024, 800], [1440, 900]];

// ── the in-page probe ──────────────────────────────────────────────────────
const PROBE = () => {
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const ratio = (a, b) => { const la = lum(a), lb = lum(b); const hi = Math.max(la, lb), lo = Math.min(la, lb); return (hi + 0.05) / (lo + 0.05); };
  const parse = (s) => { const m = String(s).match(/[\d.]+/g); return m ? m.map(Number) : null; };
  const over = (fg, bg) => {
    const a = fg.length > 3 ? fg[3] : 1;
    return [0, 1, 2].map(i => Math.round(fg[i] * a + bg[i] * (1 - a)));
  };
  const bgOf = (el) => {
    let stack = [], n = el;
    while (n && n.nodeType === 1) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && (c.length < 4 || c[3] > 0)) stack.push(c);
      if (c && (c.length < 4 || c[3] >= 1)) break;
      n = n.parentElement;
    }
    let base = [7, 11, 20];
    for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base);
    return base;
  };

  const out = {
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    navH: (document.querySelector('nav.top') || {}).getBoundingClientRect
      ? document.querySelector('nav.top').getBoundingClientRect().height : null,
    contrast: [],
    wraps: [],
    shadows: 0,
    insets: 0,
    dropShadows: 0,
    blurs: 0,
    accents: [],
    docBottom: null,
    lastContentBottom: null,
    navRow: null,
  };

  // ── the nav row must fit INSIDE the bar's own content box ────────────────
  // body{overflow-x:hidden} plus a position:fixed bar means an over-wide header
  // never shows up in documentElement.scrollWidth. The first cut of this nav
  // was 6px too wide at 360 and the overflow probe read clean; before that, the
  // lockup was the only shrinkable child and the bar silently CLIPPED the
  // wordmark instead of growing. Measure the row against the box it lives in.
  (function () {
    const nav = document.querySelector('nav.top');
    if (!nav) return;
    const cs = getComputedStyle(nav);
    const r = nav.getBoundingClientRect();
    const inner = { l: r.left + parseFloat(cs.paddingLeft), r: r.right - parseFloat(cs.paddingRight) };
    let min = Infinity, max = -Infinity, over = false;
    [...nav.children].forEach(c => {
      if (!c.getClientRects().length) return;
      const b = c.getBoundingClientRect();
      min = Math.min(min, b.left); max = Math.max(max, b.right);
    });
    // the lockup must also render at or above the kit's 120px minimum width
    const lock = nav.querySelector('.brand-lockup');
    const lockW = lock && lock.getClientRects().length ? lock.getBoundingClientRect().width : null;
    over = (min < inner.l - 0.5) || (max > inner.r + 0.5) || (lockW !== null && lockW < 120);
    out.navRow = { over, left: +min.toFixed(1), right: +max.toFixed(1), boxL: +inner.l.toFixed(1), boxR: +inner.r.toFixed(1), lockW: lockW === null ? null : +lockW.toFixed(1) };
  })();

  // contrast — every element whose own text node is visible
  const SEEN = new Set();
  document.querySelectorAll('body *').forEach(el => {
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const own = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim()).map(n => n.textContent.trim()).join(' ');
    if (!own) return;
    const fg = parse(cs.color); if (!fg) return;
    const bg = bgOf(el);
    const eff = over(fg, bg);
    const cr = ratio(eff, bg);
    const px = parseFloat(cs.fontSize);
    const bold = (parseInt(cs.fontWeight, 10) || 400) >= 700;
    const large = px >= 24 || (px >= 18.66 && bold);
    const floor = large ? 3 : 4.5;
    if (cr < floor) {
      const key = el.tagName + '.' + el.className + '|' + own.slice(0, 40);
      if (!SEEN.has(key)) {
        SEEN.add(key);
        out.contrast.push({
          sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''),
          text: own.slice(0, 60), px: +px.toFixed(2), ratio: +cr.toFixed(2), floor,
          color: cs.color, bg: 'rgb(' + bg.join(',') + ')'
        });
      }
    }
  });

  // ── is this node actually painted? ───────────────────────────────────────
  // getComputedStyle reports an element's OWN display, so a control inside a
  // display:none drawer still reads inline-flex. Counting those inflated the
  // first shadow reading by five. getClientRects() is empty for anything an
  // ancestor has removed from the box tree, and visibility is checked on top of
  // it because a visibility:hidden node keeps its layout box.
  const painted = (el) => {
    if (!el.getClientRects().length) return false;
    // opacity has to be walked, not read once. The hero console ships its state
    // badges in the markup at opacity:0 and fades them in on a timeline; reading
    // only the element's own style counted a green badge that was not on screen
    // and reported the hero as carrying three accents at an instant it carried
    // two. Effective opacity is the product of the chain.
    let n = el, o = 1;
    while (n && n.nodeType === 1) {
      const cs = getComputedStyle(n);
      if (cs.visibility === 'hidden' || cs.display === 'none') return false;
      o *= parseFloat(cs.opacity);
      if (o <= 0.05) return false;
      n = n.parentElement;
    }
    return true;
  };

  // ── control labels must fit ONE line ─────────────────────────────────────
  // A WRAP IS NOT A HEIGHT. The first version of this probe compared box height
  // against line-height, which flags every 44px-min-height control that holds a
  // 20px line — 1080 false positives, all of them single-line. Range rects are
  // the only honest count: one rect per rendered line box.
  document.querySelectorAll('a.nav-book,a.nav-cta,button.nav-trigger,button.nav-burger,a.btn,a.tel-btn .tel-main,button.cb-submit,a.cta-tertiary,.cta-tertiary a,.rail a,.demo-play-btn,.demo-call-btn,.foot-col a,.nav-panel a,.dw-group a,.dw-actions a').forEach(el => {
    if (!painted(el)) return;
    const label = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim());
    if (!label.length) return;
    const rng = document.createRange();
    rng.setStart(label[0], 0);
    rng.setEnd(label[label.length - 1], label[label.length - 1].textContent.length);
    const lines = rng.getClientRects().length;
    if (lines > 1) {
      out.wraps.push({ sel: el.className || el.tagName, text: el.textContent.trim().slice(0, 44), lines });
    }
  });

  // shadow + blur budgets, counted on PAINTED nodes only
  document.querySelectorAll('*').forEach(el => {
    if (!painted(el)) return;
    const cs = getComputedStyle(el);
    /* RUN 10 · INSET IS NOT ELEVATION. This counter fed a budget whose stated
       purpose is capping the elevation ladder — "one --raise per raised panel".
       An `inset 0 1px 0` is a hairline drawn with the shadow property: it
       paints nothing outside the box, casts nothing on the page, and stacks no
       ladder. Counting it took the homepage to 30 of a 15 cap the moment the
       nested surfaces got their 1px top light, which would have failed a page
       that had gained exactly zero elevation. Outset shadows feed the budget;
       insets are counted separately so they are still visible in the report and
       cannot grow unwatched. */
    if (cs.boxShadow && cs.boxShadow !== 'none') {
      /* Computed box-shadow is comma-separated and rgba() carries commas of its
         own, so a plain .split(',') shreds the value. This matches whole layers:
         any run of characters that is neither a comma nor an open paren, plus
         any complete parenthesised group. A rule counts as a hairline only if
         EVERY layer is inset; one outset layer makes the whole rule elevation. */
      const layers = cs.boxShadow.match(/(?:[^,(]|\([^)]*\))+/g) || [];
      if (layers.length && layers.every((l) => /\binset\b/.test(l))) out.insets++;
      else out.shadows++;
    }
    /* RUN 11 · A drop-shadow IS elevation and this budget could not see it.
       § 2's primary control chamfers itself with clip-path, and clip-path clips
       box-shadow away entirely — so its exterior elevation had to be a
       filter:drop-shadow instead. Counted only as box-shadow, the homepage
       would have read 7 of 15 while painting three more shadows on the page.
       Elevation is elevation whichever property draws it. */
    if (cs.filter && cs.filter.includes('drop-shadow')) { out.shadows++; out.dropShadows++; }
    if ((cs.backdropFilter && cs.backdropFilter.includes('blur')) ||
        (cs.webkitBackdropFilter && cs.webkitBackdropFilter.includes('blur')) ||
        (cs.filter && cs.filter.includes('blur'))) out.blurs++;
  });

  // accents per section: how many DISTINCT signal hues are painted inside one
  const HUES = {
    '61,123,255': 'signal-blue', '30,86,214': 'action-blue', '127,178,255': 'sky',
    '46,230,168': 'success-green', '255,176,32': 'amber', '255,59,78': 'miss-red'
  };
  // The single filled action control is CHROME, not content. It is the same
  // object in every section on the site, so counting it as one of that
  // section's two accents would leave every section exactly one accent of room
  // and make the rule impossible to satisfy anywhere a CTA appears. What the
  // rule is really about is how many meanings the CONTENT is asking the reader
  // to hold at once.
  const CHROME = 'a.btn-primary,a.nav-book,a.tel-btn,a.rail-call,button.demo-play-btn,button.cb-submit,a.nav-cta,a.skip';
  document.querySelectorAll('section').forEach(sec => {
    const found = new Set();
    sec.querySelectorAll('*').forEach(el => {
      if (!painted(el)) return;
      if (el.closest(CHROME)) return;
      const cs = getComputedStyle(el);
      [cs.color, cs.backgroundColor, cs.borderTopColor, cs.borderLeftColor].forEach(v => {
        const c = parse(v); if (!c) return;
        if (c.length > 3 && c[3] < 0.30) return;          // a wash is not an accent
        const k = c.slice(0, 3).join(',');
        if (HUES[k]) found.add(HUES[k]);
      });
    });
    // the two blues are ONE accent wearing a control state and a text state
    const norm = new Set([...found].map(h => (h === 'action-blue' || h === 'sky') ? 'signal-blue' : h));
    if (norm.size > 2) out.accents.push({ id: sec.id || sec.className, hues: [...norm] });
  });

  return out;
};

// ── negative controls ──────────────────────────────────────────────────────
async function negativeControls(page) {
  await page.goto(ORIGIN + '/', { waitUntil: 'networkidle' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    const d = document.createElement('div');
    d.id = 'NEGCTL';
    d.style.cssText = 'position:relative;width:3000px;color:#101828;background:#0D1420;font-size:14px';
    d.textContent = 'negative control: overflows the viewport and fails AA';
    document.body.appendChild(d);
    const s = document.querySelector('section');
    ['#2EE6A8', '#FFB020', '#FF3B4E'].forEach((c, i) => {
      const t = document.createElement('p');
      t.style.cssText = 'color:' + c; t.textContent = 'ctl' + i; s.appendChild(t);
    });
    // a control whose label genuinely takes two line boxes
    const a = document.createElement('a');
    a.className = 'foot-col'; a.href = '#';
    const wrap = document.createElement('div'); wrap.className = 'foot-col';
    a.style.cssText = 'display:block;width:60px;white-space:normal';
    a.textContent = 'negative control label that must wrap';
    wrap.appendChild(a); document.body.appendChild(wrap);
  });
  const r = await page.evaluate(PROBE);
  const failures = [];
  const PROBE_SRC_NAVONLY = new Function('return (' + PROBE.toString() + ')().navRow.over');
  if (!r.overflow) failures.push('overflow probe did not fire');
  if (!r.contrast.length) failures.push('contrast probe did not fire');
  if (!r.accents.length) failures.push('accent probe did not fire');
  if (!r.wraps.length) failures.push('wrap probe did not fire');
  const navCtl = await page.evaluate(() => {
    const nav = document.querySelector('nav.top');
    const d = document.createElement('div');
    d.style.cssText = 'width:900px;height:10px;flex:none';
    nav.appendChild(d);
    return true;
  }) && await page.evaluate(PROBE_SRC_NAVONLY);
  if (!navCtl) failures.push('nav-row probe did not fire');
  await page.evaluate(() => location.reload());
  return failures;
}

// ── run ────────────────────────────────────────────────────────────────────
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

const ctl = await negativeControls(page);
if (ctl.length) { console.error('NEGATIVE CONTROL FAILED:', ctl.join(' · ')); process.exit(2); }
console.log('negative controls: all three probes fired on a broken fixture  OK\n');

const results = [];
let consoleErrors = [];
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', e => consoleErrors.push('PAGEERROR ' + e.message));

for (const [path, tag] of PAGES) {
  for (const [w, h] of VIEWPORTS) {
    consoleErrors = [];
    await page.setViewportSize({ width: w, height: h });
    await page.goto(ORIGIN + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(450);
    const r = await page.evaluate(PROBE);
    // ── bottom-scroll clamp, measured AFTER the observers settle ────────────
    // The first version measured this inside PROBE, one frame after scrollTo.
    // The rail's suppressor is an IntersectionObserver, so at that instant the
    // footer had not yet been seen, body.rail-on was still off and the reserved
    // 72px was still absent — the probe read a clamped document and passed a
    // page that had 72px of dead scroll a moment later. Two scrolls and a
    // settle: the first can change the document height, so the second lands on
    // the real bottom.
    // SCROLL UNTIL THE DOCUMENT STOPS GROWING, then measure. A fixed two-scroll
    // settle was enough on localhost and NOT enough on production: at 360 the
    // homepage is still getting taller ~1s in (fonts settle, the stage rail
    // measures its own tail through a ResizeObserver, the console timeline runs),
    // so scrollTo(scrollHeight) landed 800px short of the real bottom, the footer
    // never intersected, and the probe reported 72px of dead scroll on a page
    // that has none. Measured on prod: footer top was +811px at 900ms and -281px
    // at 2.9s. The gate was impatient, not the page.
    let lastH = -1;
    for (let i = 0; i < 12; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(350);
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      if (h === lastH && i >= 2) break;
      lastH = h;
    }
    await page.waitForTimeout(300);
    const bottom = await page.evaluate(() => {
      const f = document.querySelector('footer');
      return {
        docBottom: document.documentElement.scrollHeight,
        lastContentBottom: f ? Math.round(f.getBoundingClientRect().bottom + window.scrollY) : null,
        railVisible: document.querySelector('.rail') ? getComputedStyle(document.querySelector('.rail')).visibility : 'none',
      };
    });
    results.push({ page: tag, path, w, h, ...r, ...bottom, consoleErrors: [...consoleErrors] });
    if (w === 390 || w === 1440) {
      await page.screenshot({ path: `${OUT}${tag}-${w}.png`, fullPage: false });
    }
  }
}

// reduced motion settles
await page.setViewportSize({ width: 1440, height: 900 });
const rmCtx = await browser.newContext({ reducedMotion: 'reduce' });
const rmPage = await rmCtx.newPage();
await rmPage.goto(ORIGIN + '/', { waitUntil: 'networkidle' });
await rmPage.waitForTimeout(1400);
const rm = await rmPage.evaluate(() => {
  const running = [];
  document.querySelectorAll('*').forEach(el => {
    el.getAnimations({ subtree: false }).forEach(a => {
      if (a.playState === 'running') running.push((el.className || el.tagName) + ' :: ' + (a.animationName || 'anim'));
    });
  });
  return {
    running,
    state: (document.getElementById('hc-state') || {}).textContent,
    crush: [...document.querySelectorAll('.cl-s')].map(x => x.textContent),
    rail: (document.querySelector('.steps') || document.body).style.getPropertyValue('--rail-p'),
  };
});
await rmCtx.close();

// ── report ─────────────────────────────────────────────────────────────────
const fails = [];
const overflow = results.filter(r => r.overflow);
const contrast = results.flatMap(r => r.contrast.map(c => ({ ...c, page: r.page, w: r.w })));
const wraps = results.flatMap(r => r.wraps.map(c => ({ ...c, page: r.page, w: r.w })));
const errs = results.filter(r => r.consoleErrors.length);
const accents = results.flatMap(r => r.accents.map(a => ({ ...a, page: r.page, w: r.w })));
const navTall = results.filter(r => r.w <= 430 && r.navH > 64);
const navRow = results.filter(r => r.navRow && r.navRow.over).map(r => ({ page: r.page, w: r.w, ...r.navRow }));
const deadScroll = results.filter(r => r.w <= 430 && (r.docBottom - r.lastContentBottom > 2 || r.railVisible === 'visible'))
  .map(r => ({ page: r.page, w: r.w, dead: r.docBottom - r.lastContentBottom, rail: r.railVisible }));
const homeShadow = Math.max(...results.filter(r => r.page === 'home').map(r => r.shadows));
const maxBlur = Math.max(...results.map(r => r.blurs));

const line = (name, bad, extra = '') =>
  console.log(`${bad.length === 0 ? 'PASS' : 'FAIL'}  ${name.padEnd(42)} ${bad.length ? bad.length + ' ' + extra : ''}`);

console.log(`\n══ RUN 9 RENDER GATE · ${PAGES.length} pages x ${VIEWPORTS.length} viewports = ${results.length} renders ══\n`);
line('horizontal overflow', overflow);
line('console / page errors', errs);
line('contrast below floor', contrast);
line('control labels wrapping', wraps);
line('accents per section > 2', accents);
line('mobile nav height > 64px', navTall);
line('nav row outside its own box', navRow);
line('dead scroll below footer', deadScroll);
const homeInset = Math.max(...results.filter(r => r.page === 'home').map(r => r.insets));
const homeDrop = Math.max(...results.filter(r => r.page === 'home').map(r => r.dropShadows));
console.log(`${homeShadow <= 15 ? 'PASS' : 'FAIL'}  ${'homepage elevation shadows <= 15'.padEnd(42)} ${homeShadow} (${homeShadow - homeDrop} box-shadow + ${homeDrop} drop-shadow)`);
console.log(`${homeInset <= 40 ? 'PASS' : 'FAIL'}  ${'homepage inset hairlines <= 40'.padEnd(42)} ${homeInset}`);
console.log(`${maxBlur <= 6 ? 'PASS' : 'FAIL'}  ${'sitewide blur() <= 6'.padEnd(42)} ${maxBlur}`);
console.log(`${rm.running.length === 0 ? 'PASS' : 'FAIL'}  ${'reduced motion settles'.padEnd(42)} ${rm.running.length ? rm.running.join(', ') : `state="${rm.state}" crush=${JSON.stringify(rm.crush)}`}`);

for (const [name, arr] of [['OVERFLOW', overflow], ['ERRORS', errs], ['CONTRAST', contrast], ['WRAPS', wraps], ['ACCENTS', accents], ['NAV>64', navTall], ['NAV ROW', navRow], ['DEAD SCROLL', deadScroll]]) {
  if (!arr.length) continue;
  console.log(`\n--- ${name} ---`);
  arr.slice(0, 40).forEach(x => console.log('   ', JSON.stringify(x).slice(0, 300)));
}

writeFileSync(OUT + 'gate.json', JSON.stringify({ results, rm }, null, 1));
console.log(`\nshots + json -> audits/run9/`);
await browser.close();
process.exit(overflow.length || errs.length || contrast.length || wraps.length || accents.length || navTall.length || navRow.length || deadScroll.length || homeShadow > 15 || homeInset > 40 || maxBlur > 6 || rm.running.length ? 1 : 0);
