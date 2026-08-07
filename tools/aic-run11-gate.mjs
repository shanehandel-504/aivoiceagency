#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// AIC RUN 11 · "TACTILE CUT" — THE GATE
// ---------------------------------------------------------------------------
// Adds what the RUN 9 and RUN 10 gates do not measure. It does not replace
// either; run all three.
//
//   node tools/aic-run11-gate.mjs [origin]
//
// EVERY ZERO-READING PROBE SHIPS A NEGATIVE CONTROL, run first against a
// deliberately broken page. If a control passes clean the run ABORTS, because a
// gate that cannot fail is not a gate.
// ═══════════════════════════════════════════════════════════════════════════
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
const require = createRequire('C:/Users/offic/Desktop/AVA-factory/adstage/package.json');
const { chromium } = require('playwright');

const ORIGIN = process.argv[2] || 'http://127.0.0.1:8848';
const OUT = new URL('../audits/run11/', import.meta.url).pathname.slice(1);
mkdirSync(OUT, { recursive: true });

const PAGES = [
  ['/', 'home'], ['/demo/', 'demo'], ['/book/', 'book'],
  ['/how-setup-works/', 'how-setup-works'],
  ['/works-with-your-software/', 'works-with-your-software'],
  ['/limo-answering-service/', 'limo-answering-service'],
  ['/after-hours-limo-dispatch/', 'after-hours-limo-dispatch'],
  ['/airport-transfer-booking/', 'airport-transfer-booking'],
  ['/milwaukee-limo-answering-service/', 'milwaukee'],
  ['/madison-limo-answering-service/', 'madison'],
  // RUN 12 · ALPHA — the integration cluster, two of them at depth two.
  ['/integrations/', 'integrations'],
  ['/integrations/limo-anywhere/', 'integrations-limo-anywhere'],
  ['/integrations/fasttrak/', 'integrations-fasttrak'],
  ['/limo-dispatch-automation/', 'limo-dispatch-automation'],
  ['/privacy/', 'privacy'], ['/terms/', 'terms'],
];
const VIEWPORTS = [[360, 800], [390, 844], [430, 932], [768, 1024], [1024, 800], [1440, 900]];

const AB = ['rgb(30, 86, 214)', 'rgb(42, 99, 232)', 'rgb(26, 76, 194)'];
const PRIMARY = '.btn-primary,.tel-btn,.demo-play-btn';

// ── shared in-page helpers, injected as source into every probe ────────────
const HELPERS = `
  const shown = (el) => {
    if (!el.getClientRects().length) return false;
    let n = el;
    while (n && n.nodeType === 1) {
      const cs = getComputedStyle(n);
      if (cs.visibility === 'hidden' || cs.visibility === 'collapse') return false;
      if (parseFloat(cs.opacity) === 0) return false;
      n = n.parentElement;
    }
    return true;
  };
  const hasText = (el) => {
    for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) return true;
    return false;
  };
  const firstText = (root) => {
    for (const n of root.querySelectorAll('*')) if (hasText(n) && shown(n)) return n;
    return null;
  };
  const sel = (el) => el.tagName.toLowerCase() +
    (typeof el.className === 'string' && el.className.trim()
      ? '.' + el.className.trim().split(/\\s+/).join('.') : '');
`;

// ═══ THE PROBES ════════════════════════════════════════════════════════════

// P2/P3/P5/P6/P7/P10 — everything readable from one settled page load.
const PROBE_STATIC = new Function(`${HELPERS}
  const AB = ${JSON.stringify(AB)};
  const out = { navH: null, navVar: null, primaries: [], rail: null, drawers: [],
                radii: [], faqOpen: null, faqMeasure: null, demoPair: null };

  const nav = document.querySelector('nav.top');
  out.navH = nav ? Math.round(nav.getBoundingClientRect().height * 100) / 100 : null;
  out.navVar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'));

  // ── § 2 · PRIMARY CONTROL v3 ─────────────────────────────────────────────
  for (const el of document.querySelectorAll('${PRIMARY}')) {
    if (!shown(el)) continue;
    const cs = getComputedStyle(el);
    const bf = getComputedStyle(el, '::before');
    out.primaries.push({
      sel: sel(el),
      hostClip: cs.clipPath,                       // MUST be none: the ring lives here
      hostShadow: cs.boxShadow,
      hostFilter: cs.filter,
      hostBg: cs.backgroundColor,
      hostRadius: cs.borderTopLeftRadius,
      beforeClip: bf.clipPath,                     // MUST be the chamfer polygon
      beforeBg: bf.backgroundColor,
      beforeBorder: bf.borderTopColor,
      beforeRadius: bf.borderTopLeftRadius,
      beforeShadow: bf.boxShadow,
      isAB: AB.includes(bf.backgroundColor),
      transition: cs.transitionDuration + ' / ' + cs.transitionTimingFunction,
      upper: cs.textTransform === 'uppercase',
      family: cs.fontFamily,
    });
  }

  // ── § 3 · RAIL GEOMETRY ──────────────────────────────────────────────────
  const rail = document.querySelector('.rail');
  if (rail) {
    const rcs = getComputedStyle(rail);
    const a = rail.querySelector('a');
    out.rail = {
      display: rcs.display,
      height: Math.round(rail.getBoundingClientRect().height),
      ctrl: a ? Math.round(a.getBoundingClientRect().height) : null,
      padBottomRaw: rcs.paddingBottom,
      reserve: null,
    };
    document.body.classList.add('rail-on');
    out.rail.reserve = parseFloat(getComputedStyle(document.body).paddingBottom);
    document.body.classList.remove('rail-on');
  }

  // ── § 5 · THE DRAWER ─────────────────────────────────────────────────────
  for (const f of document.querySelectorAll('.cb-form')) {
    const head = f.querySelector('.cb-head');
    const chev = f.querySelector('.cb-chev');
    const body = f.querySelector('.cb-body');
    if (!head) continue;
    const open = !!(body && body.getClientRects().length);
    const t = chev ? getComputedStyle(chev).transform : null;
    out.drawers.push({
      headH: Math.round(head.getBoundingClientRect().height),
      headW: Math.round(head.getBoundingClientRect().width),
      formW: Math.round(f.getBoundingClientRect().width),
      chev: !!chev,
      chevTransform: t,
      open,
      // rotate(90deg) => matrix(0,1,-1,0,..) ; rotate(0) => matrix(1,0,0,1,..)
      chevPointsDown: t ? /matrix\\(\\s*0[.,]?\\d*\\s*,\\s*1/.test(t.replace(/-?0\\b/g,'0')) || t.startsWith('matrix(6.12') || /matrix\\(0, 1,/.test(t) : null,
      statusColor: getComputedStyle(f.querySelector('.cb-status')).color,
      statusText: f.querySelector('.cb-status').textContent.trim(),
    });
  }

  // ── § 6 · CONTAINER RADIUS ───────────────────────────────────────────────
  // A pill is not a container: it is round because its radius exceeds its own
  // half-height. Anything else over 12px is a container that missed the cap.
  for (const el of document.querySelectorAll('body *')) {
    if (!shown(el)) continue;
    const cs = getComputedStyle(el);
    const r = parseFloat(cs.borderTopLeftRadius);
    if (!(r > 12)) continue;
    const h = el.getBoundingClientRect().height;
    if (r >= h / 2 - 0.5) continue;                  // pill / circle
    out.radii.push({ sel: sel(el), r: Math.round(r * 10) / 10, h: Math.round(h) });
  }

  // ── § 6 · FAQ OPEN STATE + MEASURE ───────────────────────────────────────
  const d = document.querySelector('#faq details') || document.querySelector('details');
  if (d) {
    const was = d.open; d.open = true;
    const cs = getComputedStyle(d);
    const div = d.querySelector('div');
    const dcs = getComputedStyle(div);
    // characters on the first rendered line, by binary search on a Range
    let chars = null;
    const tn = (function walk(n){ for (const c of n.childNodes){ if (c.nodeType===3 && c.textContent.trim().length>90) return c; const r = c.nodeType===1 ? walk(c) : null; if (r) return r; } return null; })(div);
    if (tn) {
      const rg = document.createRange();
      let lo = 1, hi = tn.textContent.length;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        rg.setStart(tn, 0); rg.setEnd(tn, mid);
        if (rg.getClientRects().length <= 1) lo = mid; else hi = mid - 1;
      }
      chars = lo;
    }
    out.faqOpen = {
      borderColor: cs.borderTopColor,
      boxShadow: cs.boxShadow,
      lineToken: getComputedStyle(document.documentElement).getPropertyValue('--line').trim(),
      signalToken: getComputedStyle(document.documentElement).getPropertyValue('--signal-blue').trim(),
    };
    out.faqMeasure = { chars, width: Math.round(div.getBoundingClientRect().width), maxWidth: dcs.maxWidth, fontSize: dcs.fontSize };
    d.open = was;
  }

  // ── § 4 · THE DEMO PAIR ──────────────────────────────────────────────────
  const bar = document.querySelector('.demo-play-bar');
  if (bar) {
    const kids = [...bar.children].filter((c) => c.tagName !== 'AUDIO' && shown(c));
    const rects = kids.map((c) => c.getBoundingClientRect());
    out.demoPair = {
      n: kids.length,
      widths: rects.map((r) => Math.round(r.width)),
      heights: rects.map((r) => Math.round(r.height)),
      gap: rects.length === 2 ? Math.round(rects[1].top - rects[0].bottom) : null,
      dir: getComputedStyle(bar).flexDirection,
    };
  }

  return out;
`);

// P4 — one filled action-blue per viewport, at EVERY scroll step, not just the
// opening fold. RUN 10 measured the fold because that was where the defect was
// found; the law does not stop applying once the reader scrolls.
const PROBE_FILLED = new Function(`${HELPERS}
  const AB = ${JSON.stringify(AB)};
  const CHROME = 'nav.top, .rail, .nav-drawer';
  const content = [], chrome = [], tel = [];
  for (const el of document.querySelectorAll('a,button')) {
    if (!shown(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.bottom <= 0 || r.top >= innerHeight) continue;
    const own = getComputedStyle(el).backgroundColor;
    const pseudo = getComputedStyle(el, '::before').backgroundColor;
    if (!AB.includes(own) && !AB.includes(pseudo)) continue;
    const id = sel(el) + '|' + el.textContent.trim().replace(/\\s+/g,' ').slice(0,24);
    (el.closest(CHROME) ? chrome : content).push(id);
    if ((el.getAttribute('href')||'').startsWith('tel:')) tel.push(id);
  }
  return { content, chrome, tel, y: Math.round(scrollY) };
`);

// P4a — document-space rects of every filled action-blue CONTENT control, for
// the exact co-occurrence test below. Chrome is exempt by § 3 and is dropped
// here rather than counted and forgiven later.
const PROBE_RECTS = new Function(`${HELPERS}
  const AB = ${JSON.stringify(AB)};
  const CHROME = 'nav.top, .rail, .nav-drawer';
  const out = [];
  for (const el of document.querySelectorAll('a,button')) {
    if (!shown(el)) continue;
    if (el.closest(CHROME)) continue;
    const own = getComputedStyle(el).backgroundColor;
    const pseudo = getComputedStyle(el, '::before').backgroundColor;
    if (!AB.includes(own) && !AB.includes(pseudo)) continue;
    const r = el.getBoundingClientRect();
    out.push({ id: sel(el) + '|' + el.textContent.trim().replace(/\\s+/g,' ').slice(0,24),
               top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY),
               tel: (el.getAttribute('href')||'').startsWith('tel:') });
  }
  return out.sort((a, b) => a.top - b.top);
`);

// P1 — anchor clearance. Measured on a FRESH load per anchor: scroll-behavior
// is smooth on this site and a fragment hop from the far end of the document is
// still travelling when a naive probe reads the box (RUN 10 trap 4, restated
// for fragments rather than for IntersectionObserver).
const PROBE_ANCHOR = new Function('id', `${HELPERS}
  const el = document.querySelector(id);
  if (!el) return null;
  const nav = document.querySelector('nav.top');
  const navBottom = nav ? nav.getBoundingClientRect().bottom : 0;
  const t = firstText(el);
  return {
    top: Math.round(el.getBoundingClientRect().top),
    navBottom: Math.round(navBottom),
    textTop: t ? Math.round(t.getBoundingClientRect().top) : null,
    text: t ? t.textContent.trim().slice(0, 30) : null,
    smt: getComputedStyle(el).scrollMarginTop,
    spt: getComputedStyle(document.documentElement).scrollPaddingTop,
  };
`);

// ── runner ─────────────────────────────────────────────────────────────────
const browser = await chromium.launch();
const fails = [];
const note = (name, bad, extra = '') => {
  const ok = bad.length === 0;
  if (!ok) fails.push(name);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(46)} ${ok ? extra : bad.length + ' ' + (extra || '')}`);
  if (!ok) for (const b of bad.slice(0, 8)) console.log('        ' + JSON.stringify(b));
};

// ── NEGATIVE CONTROLS ──────────────────────────────────────────────────────
console.log('\n══ NEGATIVE CONTROLS — each must FIND the planted defect ══\n');
const BREAK_CSS =
  // The control drives its own scroll below, and it must not be racing a smooth
  // animation while it does. Against a local server the re-scroll finished
  // inside the wait; against production it did not, and the anchor control read
  // DEAD on a page that was still travelling — trap 19, hitting the gate that
  // documents trap 19. Turn the animation off for the control.
  'html{scroll-behavior:auto!important}' +
  'html{scroll-padding-top:0px!important}' +
  'section[id]{scroll-margin-top:0px!important}' +
  '.btn-primary,.tel-btn,.demo-play-btn{clip-path:polygon(0 0,100% 0,100% 100%,0 100%)!important}' +
  '.btn-primary::before,.tel-btn::before,.demo-play-btn::before{clip-path:none!important}' +
  '.cb-head{min-height:44px!important}' +
  '.crush{border-radius:18px!important}' +
  'details[open]{box-shadow:none!important;border-color:rgb(61,123,255)!important}' +
  '.demo-play-bar>.demo-call-btn{min-height:64px!important}' +
  // re-creates exactly the defect RUN 11 removed: the two demoted section CTAs
  // filled again, 520-670px apart on a page whose shortest viewport is 800.
  '.btn-ghost{background:rgb(30,86,214)!important}' +
  '.rail{transform:none!important;visibility:visible!important}';
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  await p.goto(ORIGIN + '/#lead-protection', { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: BREAK_CSS });
  // scrollIntoView() honours scroll-padding/scroll-margin exactly as a fragment
  // jump does, and with scroll-behavior forced to auto it lands in one frame.
  // A hash round-trip would scroll to the top first and then animate all the way
  // back down a ten-thousand-pixel document, which is the race that broke it.
  await p.evaluate(() => document.querySelector('#lead-protection').scrollIntoView());
  await p.waitForTimeout(600);
  const anchor = await p.evaluate(PROBE_ANCHOR, '#lead-protection');
  const s = await p.evaluate(PROBE_STATIC);
  const f = await p.evaluate(PROBE_FILLED);
  const rects = await p.evaluate(PROBE_RECTS);
  let planted = false;
  for (let i = 1; i < rects.length; i++) if (rects[i].top - rects[i - 1].bottom < 844) planted = true;
  const controls = [
    ['co-occurrence probe sees the planted pair', planted],
    ['demo-pair probe sees the unequal heights', s.demoPair ? s.demoPair.heights[0] !== s.demoPair.heights[1] : false],
    ['anchor clearance sees the clip', anchor.textTop < anchor.navBottom],
    ['host-clip probe sees the clipped host', s.primaries.some((x) => x.hostClip !== 'none')],
    ['chamfer probe sees the missing chamfer', s.primaries.some((x) => !/polygon/.test(x.beforeClip))],
    ['drawer probe sees the 44px row', s.drawers.some((d) => d.headH < 64)],
    ['radius probe sees the 18px container', s.radii.some((r) => r.r > 12)],
    ['FAQ probe sees the blue perimeter', !/inset/.test(s.faqOpen.boxShadow)],
    ['filled probe sees the forced rail', f.chrome.length + f.content.length >= 2],
  ];
  let dead = 0;
  for (const [n, fired] of controls) {
    console.log(`${fired ? 'FIRED' : 'DEAD '}  ${n}`);
    if (!fired) dead++;
  }
  await ctx.close();
  if (dead) { console.log(`\nABORT — ${dead} negative control(s) passed clean. A gate that cannot fail is not a gate.`); process.exit(2); }
}

// ── P1 · ANCHOR CLEARANCE ──────────────────────────────────────────────────
console.log('\n══ § 1 · ANCHOR CLEARANCE ══\n');
const HOME_ANCHORS = ['#demo', '#integrations', '#how', '#pain', '#features', '#crush',
  '#lead-protection', '#setup', '#operators', '#faq', '#ava-callback'];
const anchorBad = [];
for (const [w, h] of [[360, 800], [390, 844], [430, 932], [1440, 900]]) {
  for (const id of HOME_ANCHORS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const p = await ctx.newPage();
    await p.goto(`${ORIGIN}/${id}`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1500);
    const r = await p.evaluate(PROBE_ANCHOR, id);
    await ctx.close();
    if (!r) { anchorBad.push({ w, id, why: 'MISSING' }); continue; }
    const wantTop = parseFloat(r.spt) + parseFloat(r.smt);
    if (Math.abs(r.top - wantTop) > 1.5) anchorBad.push({ w, id, top: r.top, want: wantTop });
    else if (r.textTop !== null && r.textTop < r.navBottom) anchorBad.push({ w, id, textTop: r.textTop, navBottom: r.navBottom, text: r.text });
  }
}
// the skip link on the eleven non-home pages
for (const [path, tag] of PAGES.slice(1)) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  await p.goto(`${ORIGIN}${path}#main`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);
  const r = await p.evaluate(PROBE_ANCHOR, '#main');
  await ctx.close();
  // <main> starts at document offset 0, so the scrollport CANNOT move above it.
  // The user-visible assertion is the only one that means anything here: the
  // first painted line of the page must clear the bar.
  if (r && r.textTop !== null && r.textTop < r.navBottom) anchorBad.push({ tag, id: '#main', textTop: r.textTop, navBottom: r.navBottom, text: r.text });
}
// RUN 12: the skip-link count is PAGES-derived, so it stops being wrong the
// next time a page is added. It read "11 skip links" while sweeping 15.
note('anchor targets clear the fixed header', anchorBad,
  `${HOME_ANCHORS.length} homepage anchors x 4 widths + ${PAGES.length - 1} skip links` +
  ` (the new pages' OWN anchors are swept by aic-run12-gate.mjs probe 13)`);

// ── P1b · THE THREE PATHS A READER ACTUALLY TAKES ──────────────────────────
// A direct #URL is one of them. The other two are a REAL click on an in-page
// link and the BACK button, and neither is covered by the sweep above.
//
// The real click is not ceremony: the AVA parent's site.js hijacks every
// #anchor click and ignores scroll-margin-top entirely. aic.js does not — but
// that is a thing to prove rather than assume, and only a real click proves it.
// The same probe answers § 5's "no duplicate callback controls while the drawer
// is open", because the rail's own link is what opens it.
{
  const pathBad = [];
  for (const [w, h] of [[390, 844], [430, 932]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const p = await ctx.newPage();

    // ── RUN 13 · THE RAIL'S SECOND CONTROL IS NOT THE CALLBACK ANY MORE ────
    // Through RUN 12 this drove the rail's own "Get a call back" link and got
    // three assertions out of one click: the anchor landed clear of the fixed
    // bar, the collapsed console opened, and the rail hid itself so there were
    // never two callback controls on screen at once.
    //
    // That link is gone — the rail is Call + Book now — so the click that used
    // to prove all three does not exist. Testing it against a `force: true`
    // click on a selector that matches nothing would have gone on "passing".
    //
    // The suppression claim is the one that still matters and it does not need
    // a click: scroll until the console is on screen and the rail must be
    // hidden. That is the actual law — one filled control per viewport — and
    // driving it by scroll tests it the way a reader meets it.
    await p.goto(ORIGIN + '/limo-answering-service/', { waitUntil: 'networkidle' });
    await p.evaluate(() => window.scrollTo(0, 1200));
    await p.waitForTimeout(900);                       // let the rail arm
    const armed = await p.evaluate(() => {
      const r = document.querySelector('.rail');
      return { vis: getComputedStyle(r).visibility,
               ctrls: r.querySelectorAll('a').length,
               book: r.querySelectorAll('a[href="/book/"]').length,
               call: r.querySelectorAll('a[href^="tel:"]').length };
    });
    if (armed.vis !== 'visible') pathBad.push({ w, why: 'rail never armed', ...armed });
    if (armed.call !== 1 || armed.book !== 1 || armed.ctrls !== 2) pathBad.push({ w, why: 'rail is not Call + Book', ...armed });

    // Trap 4: IntersectionObserver has not fired one frame after scrollTo.
    // Scroll, settle, then read — and read the console's own box to be sure it
    // really is on screen rather than trusting the scroll offset.
    for (const target of ['#ava-callback', 'footer']) {
      await p.evaluate((sel) => {
        document.documentElement.style.scrollBehavior = 'auto';
        document.querySelector(sel).scrollIntoView({ block: 'center' });
      }, target);
      await p.waitForTimeout(700);
      const s = await p.evaluate((sel) => {
        const el = document.querySelector(sel);
        const b = el.getBoundingClientRect();
        return { onScreen: b.top < innerHeight && b.bottom > 0,
                 railVis: getComputedStyle(document.querySelector('.rail')).visibility };
      }, target);
      if (!s.onScreen) pathBad.push({ w, why: `${target} never reached`, ...s });
      else if (s.railVis !== 'hidden') pathBad.push({ w, why: `rail not suppressed by ${target}`, ...s });
    }

    // A deep link to the console still has to land clear of the fixed bar.
    // This is now the ONLY link path to that form, so it is the one worth
    // measuring — on a fresh load, which is what a deep link actually is.
    //
    // about:blank first, and it is not ceremony. The page is already sitting on
    // /limo-answering-service/, so navigating to the same URL with a hash is a
    // SAME-DOCUMENT navigation. It does not reload — measured at 4ms against
    // production, versus 855ms for the real thing — and `waitUntil` has nothing
    // to wait for, so it returns instantly and clean.
    //
    // That is the trap: the probe reads a page that has been sitting there
    // through every step above it, with the console already opened and the
    // scroll position already settled, and calls it a deep link. Trap 19's
    // sibling — measure anchors on a FRESH load, which is what a deep link
    // actually is. Clearing the document first is what makes it one.
    await p.goto('about:blank');
    await p.goto(ORIGIN + '/limo-answering-service/#ava-callback', { waitUntil: 'load', timeout: 30000 });
    await p.waitForTimeout(1400);
    const deep = await p.evaluate(() => ({
      top: Math.round(document.querySelector('#ava-callback').getBoundingClientRect().top),
      navBottom: Math.round(document.querySelector('nav.top').getBoundingClientRect().bottom),
    }));
    if (deep.top < deep.navBottom) pathBad.push({ w, why: 'deep link to console lands clipped', ...deep });

    await p.goto(ORIGIN + '/limo-answering-service/', { waitUntil: 'networkidle' });
    await p.keyboard.press('Tab');
    await p.keyboard.press('Enter');
    await p.waitForTimeout(1200);
    const sk = await p.evaluate(new Function(`${HELPERS}
      const m = document.querySelector('#main');
      const t = firstText(m);
      return { navBottom: Math.round(document.querySelector('nav.top').getBoundingClientRect().bottom),
               firstTop: t ? Math.round(t.getBoundingClientRect().top) : null };`));
    if (sk.firstTop === null || sk.firstTop < sk.navBottom) pathBad.push({ w, why: 'skip link clipped', ...sk });

    await p.goto(ORIGIN + '/#lead-protection', { waitUntil: 'networkidle' });
    await p.waitForTimeout(1400);
    await p.goto(ORIGIN + '/#operators', { waitUntil: 'networkidle' });
    await p.waitForTimeout(1400);
    await p.goBack({ waitUntil: 'networkidle' });
    await p.waitForTimeout(1600);
    const bk = await p.evaluate(() => ({
      top: Math.round(document.querySelector('#lead-protection').getBoundingClientRect().top),
      navBottom: Math.round(document.querySelector('nav.top').getBoundingClientRect().bottom),
      hash: location.hash,
    }));
    if (bk.top < bk.navBottom || bk.hash !== '#lead-protection') pathBad.push({ w, why: 'back button', ...bk });
    await ctx.close();
  }
  note('§ 1 rail pair / suppression / deep link / keyboard / back button', pathBad,
    '2 widths x (rail shape + 2 suppressors + deep link + skip link + back button)');
}

// ── P2..P10 · the settled-page sweep ───────────────────────────────────────
console.log(`\n══ § 2-§ 6 · ${PAGES.length} PAGES x ${VIEWPORTS.length} VIEWPORTS ══\n`);
const rows = [];
const flaky = [];
for (const [w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  for (const [path, tag] of PAGES) {
    /* `networkidle` on /book/ is a coin flip and always has been: the page
       pulls GHL's form_embed.js from a third party, and if that fetch stalls
       the page never goes idle. An uncaught throw here does not fail ONE page
       — it kills the sweep, and the ninety-five measurements after it are
       never taken. Same shape as trap 27: one bad read turning into a dead
       gate.
       Verified environmental before this was added, not assumed: the identical
       navigation was run against the committed tree and the working tree, and
       both reached networkidle in ~2.4s on the retry.
       Falling back to `load` keeps the sweep alive, and the fallback is
       RECORDED and printed — a page that always needs it is a real finding
       about that page, and swallowing it silently would be the worse bug. */
    try {
      await p.goto(ORIGIN + path, { waitUntil: 'networkidle', timeout: 20000 });
    } catch {
      flaky.push({ page: tag, w });
      await p.goto(ORIGIN + path, { waitUntil: 'load', timeout: 20000 });
      await p.waitForTimeout(1200);
    }
    await p.waitForTimeout(260);
    rows.push({ tag, w, ...(await p.evaluate(PROBE_STATIC)) });
  }
  await ctx.close();
}
if (flaky.length) {
  console.log(`  NOTE  ${flaky.length} navigation(s) fell back from networkidle to load: ` +
    flaky.map((f) => `${f.page}@${f.w}`).join(', '));
  console.log('        (third-party fetch stalled; the page was still measured)\n');
}

const navBad = rows.filter((r) => r.navH !== null && Math.abs(r.navH - r.navVar) > 0.5)
  .map((r) => ({ page: r.tag, w: r.w, measured: r.navH, token: r.navVar }));
note('--nav-h equals the measured bar', navBad, `${rows.length} page x viewport reads`);

const prim = rows.flatMap((r) => r.primaries.map((x) => ({ page: r.tag, w: r.w, ...x })));
const primBad = prim.filter((x) =>
  x.hostClip !== 'none' ||                                    // ring must not be clipped
  !/polygon/.test(x.beforeClip) ||                            // chamfer must exist
  !x.isAB ||                                                  // fill must be action-blue
  Math.round(parseFloat(x.beforeRadius)) !== 10 ||
  !/drop-shadow/.test(x.hostFilter) ||
  !/inset/.test(x.beforeShadow) ||
  x.upper ||                                                  // no ALL-CAPS
  !/Space Grotesk/.test(x.family)
).map((x) => ({ page: x.page, w: x.w, sel: x.sel, hostClip: x.hostClip, beforeClip: x.beforeClip.slice(0, 30), r: x.beforeRadius, filter: x.hostFilter.slice(0, 30), upper: x.upper }));
note('§ 2 primary control v3 recipe', primBad, `${prim.length} rendered primaries`);

// the exterior elevation must be NEUTRAL — no hue in the drop-shadow
const haloBad = prim.filter((x) => {
  const m = x.hostFilter.match(/drop-shadow\(([^)]*)\)/);
  if (!m) return false;
  const c = m[1].match(/rgba?\(([^)]*)\)/);
  if (!c) return false;
  const [r, g, bl] = c[1].split(',').map((n) => parseFloat(n));
  return !(r === 0 && g === 0 && bl === 0);
}).map((x) => ({ page: x.page, sel: x.sel, filter: x.hostFilter }));
note('§ 2 elevation is neutral (Glow Law)', haloBad);

const rails = rows.filter((r) => r.rail && r.rail.display === 'grid');
const railBad = rails.filter((r) => r.rail.ctrl < 56 || r.rail.reserve < r.rail.height)
  .map((r) => ({ page: r.tag, w: r.w, ...r.rail }));
note('§ 3 rail 56px controls + reserve >= height', railBad, rails.length ? `rail height ${rails[0].rail.height} reserve ${rails[0].rail.reserve}` : 'no rail at these widths');
// The safe-area inset CANNOT be read from a computed style — the engine resolves
// env() to a px value, so a runtime test for it is a check that always passes,
// which is the one kind of check this repo does not ship. Assert the source.
// RUN 13 · there is ONE CSS home for components now. This used to read the same
// two assertions off aic.css AND the homepage's embedded copy, because a rule
// could be right in one and missing in the other. index.html no longer carries
// a stylesheet, so the pair-check is replaced by the stronger claim it was
// always a proxy for: the rules exist once, and the homepage has no second copy
// to disagree with. THAT absence is asserted here — if a future run reintroduces
// an embedded block, this fails rather than quietly going back to two heads.
const homeSrc = readFileSync(new URL('../chauffeur/index.html', import.meta.url).pathname.slice(1), 'utf8');
const aicSrc = readFileSync(new URL('../chauffeur/assets/aic.css', import.meta.url).pathname.slice(1), 'utf8');
const safeBad = [];
{
  const s = aicSrc.replace(/\n\s*/g, '');
  if (!/\.rail\{[^}]*env\(safe-area-inset-bottom/.test(s)) safeBad.push({ why: '.rail padding drops the safe-area inset' });
  if (!/rail-on\{padding-bottom:calc\(73px \+ env\(safe-area-inset-bottom/.test(s)) safeBad.push({ why: 'rail reserve is not 73px + safe area' });
  if (/^[ \t]*<style>[ \t]*$/m.test(homeSrc)) safeBad.push({ why: 'index.html has grown an embedded stylesheet again — back to two heads' });
  if (!/<link rel="stylesheet" href="\/assets\/aic\.css/.test(homeSrc)) safeBad.push({ why: 'index.html does not link assets/aic.css' });
}
note('§ 3 safe-area inset in the one CSS home + homepage carries no second copy', safeBad, '1 component home, 16 pages linking it');

const drawers = rows.flatMap((r) => r.drawers.map((d) => ({ page: r.tag, w: r.w, ...d })));
const drawerBad = drawers.filter((d) => d.headH < 64 || !d.chev || d.headW < d.formW - 2)
  .map((d) => ({ page: d.page, w: d.w, headH: d.headH, chev: d.chev, headW: d.headW, formW: d.formW }));
note('§ 5 drawer row 64px, full width, chevron', drawerBad, `${drawers.length} consoles`);

const chevBad = drawers.filter((d) => {
  const m = (d.chevTransform || '').match(/matrix\(([^)]*)\)/);
  if (!m) return true;
  const n = m[1].split(',').map(Number);
  const deg = Math.round(Math.atan2(n[1], n[0]) * 180 / Math.PI);
  return d.open ? Math.abs(deg - 90) > 2 : Math.abs(deg) > 2;
}).map((d) => ({ page: d.page, w: d.w, open: d.open, t: d.chevTransform }));
note('§ 5 chevron follows the RENDERED state', chevBad);

const radBad = rows.flatMap((r) => r.radii.map((x) => ({ page: r.tag, w: r.w, ...x })));
note('§ 6 no container over 12px radius', radBad, 'pills exempt (radius >= half height)');

// A token is a hex string and a computed border colour is rgb(). Comparing the
// two as text failed 48 of 48 compliant pages on the first run — the probe was
// wrong, not the CSS. Resolve the token before comparing.
const hexToRgb = (h) => {
  const m = h.trim().replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(m)) return h.trim();
  return `rgb(${parseInt(m.slice(0, 2), 16)}, ${parseInt(m.slice(2, 4), 16)}, ${parseInt(m.slice(4, 6), 16)})`;
};
const faq = rows.filter((r) => r.faqOpen);
const faqBad = faq.filter((r) => {
  const s = r.faqOpen.boxShadow;
  // whole layers, because rgba() carries commas of its own (RUN 10's method)
  const layers = s.match(/(?:[^,(]|\([^)]*\))+/g) || [];
  const rail = layers.some((l) => /\binset\b/.test(l) && /61, ?123, ?255/.test(l));
  const outer = layers.some((l) => !/\binset\b/.test(l) && l.trim() && l.trim() !== 'none');
  return !rail || outer || r.faqOpen.borderColor !== hexToRgb(r.faqOpen.lineToken);
}).map((r) => ({ page: r.tag, w: r.w, border: r.faqOpen.borderColor, want: hexToRgb(r.faqOpen.lineToken), shadow: r.faqOpen.boxShadow }));
note('§ 6 FAQ open = --line border + inset rail', faqBad, `${faq.length} FAQ pages`);

const meas = rows.filter((r) => r.faqMeasure && r.faqMeasure.chars && r.w >= 1024);
const measBad = meas.filter((r) => r.faqMeasure.chars < 60 || r.faqMeasure.chars > 75)
  .map((r) => ({ page: r.tag, w: r.w, ...r.faqMeasure }));
note('§ 6 FAQ measure inside 60-75 chars', measBad,
  meas.length ? `${Math.min(...meas.map((r) => r.faqMeasure.chars))}-${Math.max(...meas.map((r) => r.faqMeasure.chars))} chars` : '');

const pairs = rows.filter((r) => r.demoPair && r.demoPair.n === 2);
const pairBad = pairs.filter((r) => {
  const d = r.demoPair;
  return d.widths[0] !== d.widths[1] || d.heights[0] !== d.heights[1] ||
    d.heights.some((x) => x !== 56) || Math.abs(d.gap - 16) > 1;
}).map((r) => ({ page: r.tag, w: r.w, ...r.demoPair }));
note('§ 4 demo pair equal width, 56px, 16px gap', pairBad,
  pairs.length ? `${pairs[0].demoPair.widths.join('/')} px wide, ${pairs[0].demoPair.heights.join('/')} tall` : '');

// ── P4 · ONE FILLED BLUE PER VIEWPORT ──────────────────────────────────────
//
// TWO PASSES, because the question has a static half and a dynamic half and a
// scroll sweep answers neither of them properly.
//
// A · ANALYTIC, and it is EXACT. Two boxes A and B with A above B share some
//     viewport of height h iff B.top - A.bottom < h. There is no step size to
//     get wrong. The first cut of this probe stepped by h/2 and reported two
//     violations; the analytic pass found the same page also fails at 768 in a
//     28px window that no half-viewport step could ever land on. A granularity
//     that decides which defects exist is not a measurement.
// B · LIVE, for the RAIL, which is the half that genuinely cannot be computed
//     from static rects — it arms and suppresses on IntersectionObserver.
console.log('\n══ § 3 · ONE FILLED BLUE PER VIEWPORT ══\n');

const coBad = [];
for (const [w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  for (const [path, tag] of PAGES) {
    await p.goto(ORIGIN + path, { waitUntil: 'networkidle' });
    await p.waitForTimeout(300);
    const els = await p.evaluate(PROBE_RECTS);
    for (let i = 1; i < els.length; i++) {
      const gap = els[i].top - els[i - 1].bottom;
      if (gap < h) coBad.push({ page: tag, w, h, gap, a: els[i - 1].id, b: els[i].id });
    }
  }
  await ctx.close();
}
note('two content primaries can never co-occur', coBad, `${PAGES.length} pages x ${VIEWPORTS.length} viewports, exact`);

const filledBad = [];
let steps = 0;
for (const [w, h] of [[390, 844], [430, 932]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  for (const [path, tag] of PAGES) {
    await p.goto(ORIGIN + path, { waitUntil: 'networkidle' });
    await p.waitForTimeout(300);
    const total = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += Math.round(h / 3)) {
      await p.evaluate((yy) => window.scrollTo(0, yy), y);
      await p.waitForTimeout(220);           // let the observers land (trap 4)
      const f = await p.evaluate(PROBE_FILLED);
      steps++;
      if (f.content.length > 1 || f.chrome.length > 1 || f.tel.length > 1) {
        filledBad.push({ page: tag, w, y: f.y, content: f.content, chrome: f.chrome, tel: f.tel });
      }
    }
  }
  await ctx.close();
}
note('rail never arms over a content primary', filledBad, `${steps} live scroll steps`);

// ── P9 · HAPTICS ───────────────────────────────────────────────────────────
console.log('\n══ § 7 · HAPTICS ══\n');
const src = readFileSync(new URL('../chauffeur/assets/aic.js', import.meta.url).pathname.slice(1), 'utf8');
const srcBad = [];
if (!/'vibrate' in navigator/.test(src)) srcBad.push('no feature detection');
if (!/navigator\.vibrate\(/.test(src)) srcBad.push('no vibrate call');
if (!/try \{ navigator\.vibrate/.test(src)) srcBad.push('vibrate call is not wrapped');
note('§ 7 feature-detected and wrapped in source', srcBad);

{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    window.__buzz = [];
    Object.defineProperty(navigator, 'vibrate', {
      configurable: true, writable: true,
      value: function (x) { window.__buzz.push(x); return true; },
    });
    // a tel: or page navigation would end the probe; the haptic listener is a
    // bubble listener on document, so a capture-phase preventDefault here stops
    // the navigation without stopping the thing being measured.
    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a[href]');
      if (a) e.preventDefault();
    }, true);
  });
  await p.goto(ORIGIN + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  const hapBad = [];
  // Dispatch the click in-page rather than driving the mouse. What is under
  // test is EVENT DELEGATION — one bubble listener on document — and a real
  // pointer cannot reach a control inside a visibility:hidden drawer, which is
  // exactly one of the surfaces that has to stay silent.
  const tap = async (s) => p.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    return true;
  }, s).then(async (ok) => { await p.waitForTimeout(120); return ok; });

  await p.evaluate(() => { window.__buzz.length = 0; });
  await tap('.tel-btn');
  const onPrimary = await p.evaluate(() => window.__buzz.slice());
  if (onPrimary.length !== 1 || onPrimary[0] !== 12) hapBad.push({ where: 'primary CTA', got: onPrimary });

  await p.evaluate(() => { window.__buzz.length = 0; });
  await tap('nav.top .nav-cta');
  await tap('nav.top .nav-burger');
  await tap('.nav-drawer .dw-group a');
  await tap('footer a');
  const onNav = await p.evaluate(() => window.__buzz.slice());
  if (onNav.length !== 0) hapBad.push({ where: 'nav / drawer / footer', got: onNav });

  await p.evaluate(() => { window.__buzz.length = 0; window.scrollTo(0, 2000); });
  await p.waitForTimeout(400);
  const onScroll = await p.evaluate(() => window.__buzz.slice());
  if (onScroll.length !== 0) hapBad.push({ where: 'scroll', got: onScroll });

  // failure must NOT buzz
  await p.evaluate(() => { window.__buzz.length = 0; });
  const head = await p.$('[data-cb-toggle]');
  const shownBody = await p.evaluate(() => !!document.querySelector('.cb-body')?.getClientRects().length);
  if (head && !shownBody) { await head.click(); await p.waitForTimeout(200); }
  await p.click('[data-cb-submit]');
  await p.waitForTimeout(400);
  const onFail = await p.evaluate(() => window.__buzz.slice());
  if (onFail.length !== 0) hapBad.push({ where: 'callback failure', got: onFail });
  const errState = await p.evaluate(() => {
    const f = document.querySelector('.cb-form');
    return { isErr: f.classList.contains('is-err'), word: f.querySelector('.cb-status').textContent.trim(),
             colour: getComputedStyle(f.querySelector('.cb-status')).color,
             miss: getComputedStyle(document.documentElement).getPropertyValue('--miss-red').trim(),
             transition: getComputedStyle(f.querySelector('.cb-status')).transitionDuration };
  });
  if (!errState.isErr || errState.word.toLowerCase() !== 'not sent') hapBad.push({ where: 'error state word', got: errState });
  if (errState.transition !== '0s') hapBad.push({ where: 'STATE LAW: status must not transition', got: errState.transition });
  note('§ 7/§ 5 haptics + third state, runtime', hapBad,
    `primary=${JSON.stringify(onPrimary)} nav=${onNav.length} scroll=${onScroll.length} fail=${onFail.length} chip="${errState.word}" ${errState.colour}`);
  await ctx.close();
}

// ── P11 · THE STATES, DRIVEN AND MEASURED ──────────────────────────────────
// A resting-state probe cannot see a state rule, and this is not hypothetical:
// the first cut of § 2's hover rule declared only transform, so it lost `filter`
// to RUN 10's earlier `filter:none` at the same specificity and the elevation
// VANISHED under the pointer. The cascade resolves each PROPERTY independently;
// it does not merge two rules. Drive the pointer, then read.
console.log('\n══ § 2 · HOVER AND PRESS, DRIVEN ══\n');
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(ORIGIN + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  const read = () => p.evaluate(() => {
    const el = document.querySelector('.tel-btn');
    const cs = getComputedStyle(el), bf = getComputedStyle(el, '::before');
    return { transform: cs.transform, filter: cs.filter, bg: bf.backgroundColor,
             dur: cs.transitionDuration, ease: cs.transitionTimingFunction };
  });
  const box = await (await p.$('.tel-btn')).boundingBox();
  const rest = await read();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await p.waitForTimeout(320);
  const hover = await read();
  await p.mouse.down();
  await p.waitForTimeout(240);
  const press = await read();
  await p.mouse.up();
  await p.mouse.move(5, 5);
  await p.waitForTimeout(320);
  const back = await read();

  const stateBad = [];
  const has24 = (f) => /drop-shadow\(rgba\(0, 0, 0, 0\.35\) 0px 8px 24px\)/.test(f);
  const has8 = (f) => /drop-shadow\(rgba\(0, 0, 0, 0\.35\) 0px 2px 8px\)/.test(f);
  if (!has24(rest.filter)) stateBad.push({ state: 'rest', filter: rest.filter });
  if (!has24(hover.filter)) stateBad.push({ state: 'hover elevation lost', filter: hover.filter });
  if (hover.transform !== 'matrix(1, 0, 0, 1, 0, -1)') stateBad.push({ state: 'hover lift', t: hover.transform });
  if (hover.bg !== 'rgb(42, 99, 232)') stateBad.push({ state: 'hover fill', bg: hover.bg });
  if (!has8(press.filter)) stateBad.push({ state: 'press shadow', filter: press.filter });
  if (press.transform !== 'matrix(0.985, 0, 0, 0.985, 0, 2)') stateBad.push({ state: 'press transform', t: press.transform });
  if (press.bg !== 'rgb(26, 76, 194)') stateBad.push({ state: 'press fill', bg: press.bg });
  if (parseFloat(press.dur) !== 0.07) stateBad.push({ state: 'press 70ms', dur: press.dur });
  if (parseFloat(rest.dur) !== 0.16) stateBad.push({ state: 'release 160ms', dur: rest.dur });
  if (!/cubic-bezier\(0\.2, 0\.8, 0\.2, 1\)/.test(rest.ease)) stateBad.push({ state: 'easing', ease: rest.ease });
  if (!has24(back.filter) || back.transform !== 'none') stateBad.push({ state: 'returns to rest', ...back });
  note('§ 2 rest / hover / press / release', stateBad,
    `rest ${rest.dur} press ${press.dur} hover-t ${hover.transform} press-t ${press.transform}`);
  await ctx.close();
}
// negative control for it: strip the hover filter and the probe must object
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(ORIGIN + '/', { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: '.tel-btn:hover{filter:none!important}' });
  const box = await (await p.$('.tel-btn')).boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await p.waitForTimeout(320);
  const f = await p.evaluate(() => getComputedStyle(document.querySelector('.tel-btn')).filter);
  const fired = !/drop-shadow/.test(f);
  console.log(`${fired ? 'FIRED' : 'DEAD '}  state probe sees a stripped hover elevation`);
  await ctx.close();
  if (!fired) { fails.push('state negative control'); }
}

await browser.close();
writeFileSync(OUT + 'run11-gate.json', JSON.stringify({ rows: rows.length, fails }, null, 2));
console.log(`\nGATE aic-run11: ${fails.length ? 'FAIL (' + fails.join(', ') + ')' : 'ALL GREEN'}`);
process.exit(fails.length ? 1 : 0);
