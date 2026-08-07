#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// AIC RUN 10 · "SHOWROOM v2.0" — THE GATE
// ---------------------------------------------------------------------------
// Adds what RUN 9's gate does not measure. It does not replace it; run both.
//
//   node tools/aic-run10-gate.mjs [origin]
//
// EVERY ZERO-READING PROBE SHIPS A NEGATIVE CONTROL. The type-floor, the
// filled-CTA and the canvas probes are each run once against a deliberately
// broken fixture first and MUST report the defect. If a control passes clean the
// whole run aborts, because a gate that cannot fail is not a gate.
// ═══════════════════════════════════════════════════════════════════════════
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const require = createRequire('C:/Users/offic/Desktop/AVA-factory/adstage/package.json');
const { chromium } = require('playwright');

const ORIGIN = process.argv[2] || 'http://127.0.0.1:8848';
const OUT = new URL('../audits/run10/', import.meta.url).pathname.slice(1);
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

// ── in-page probes ─────────────────────────────────────────────────────────
const PROBE = () => {
  // Trap 3: getComputedStyle reports an element's OWN display, so a control
  // inside a display:none drawer still reads inline-flex. getClientRects()
  // plus the visibility and opacity chain is the only honest visibility test.
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

  // ── 12px TYPE FLOOR ──────────────────────────────────────────────────────
  const tiny = [];
  for (const el of document.querySelectorAll('body *')) {
    if (!hasText(el) || !shown(el)) continue;
    const px = parseFloat(getComputedStyle(el).fontSize);
    if (px < 11.995) {
      tiny.push({
        sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string'
          ? '.' + el.className.trim().split(/\s+/).join('.') : ''),
        px: Math.round(px * 100) / 100,
        text: el.textContent.trim().slice(0, 40),
      });
    }
  }

  // ── FILLED --action-blue CONTROLS IN THE VIEWPORT ────────────────────────
  // The law has two halves and one exemption, so the count does too.
  //
  //   CONTENT  at most ONE filled action-blue control in the page body.
  //   CHROME   at most ONE in the fixed bars. DESIGN-SYSTEM.md § 3 exempts the
  //            single filled chrome control by name: it is the same object in
  //            every section, so counting it would leave every section exactly
  //            one accent of room. Lumping the two together is what made the
  //            first cut of this probe fail a compliant desktop fold.
  //   TEL      at most ONE filled control that DIALS, across both. This is the
  //            de-duplication rule the run was actually asked for: three filled
  //            blue phone surfaces in one viewport.
  const AB = ['rgb(30, 86, 214)', 'rgb(42, 99, 232)', 'rgb(26, 76, 194)'];
  const CHROME = 'nav.top, .rail, .nav-drawer';
  const filledContent = [], filledChrome = [], filledTel = [];
  for (const el of document.querySelectorAll('a,button')) {
    if (!shown(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.bottom <= 0 || r.top >= innerHeight) continue;
    /* RUN 11 · THE FILL MOVED AND THIS PROBE WOULD HAVE GONE BLIND. § 2's
       chamfer is a clip-path, and clip-path clips everything the element
       paints — its outline and its shadows included — so the fill, the border
       and the bevels had to move onto a clipped ::before while the host stays
       unclipped and keeps the focus ring. The host's own background-color is
       rgba(0,0,0,0) from that moment on. Reading only the host, this probe
       would have reported ONE filled control on a fold carrying two, and
       reported it in green. Read both boxes. */
    const own = getComputedStyle(el).backgroundColor;
    const pseudo = getComputedStyle(el, '::before').backgroundColor;
    if (!AB.includes(own) && !AB.includes(pseudo)) continue;
    const id = (el.className || el.tagName).toString().trim().split(/\s+/)[0]
      + '|' + el.textContent.trim().replace(/\s+/g, ' ').slice(0, 28);
    (el.closest(CHROME) ? filledChrome : filledContent).push(id);
    if ((el.getAttribute('href') || '').startsWith('tel:')) filledTel.push(id);
  }

  // ── CANVAS LAYER ─────────────────────────────────────────────────────────
  const before = getComputedStyle(document.body, '::before');
  const after = getComputedStyle(document.body, '::after');
  const canvas = {
    horizon: /radial-gradient/.test(before.backgroundImage) &&
             /61, ?123, ?255/.test(before.backgroundImage),
    vignette: (before.backgroundImage.match(/radial-gradient/g) || []).length >= 2,
    gridPos: after.position,
    gridOpacity: after.opacity,
    gridLine: getComputedStyle(document.documentElement).getPropertyValue('--grid-line').trim(),
  };

  // ── HORIZONTAL OVERFLOW ──────────────────────────────────────────────────
  const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;

  // ── JSON-LD ──────────────────────────────────────────────────────────────
  const ld = [];
  for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
    const raw = s.textContent;
    let parsed = null, err = null;
    try { parsed = JSON.parse(raw); } catch (e) { err = e.message; }
    ld.push({
      ok: !err, err,
      hasMustache: raw.includes('{{'), hasReplace: raw.includes('REPLACE_'),
      types: parsed ? (parsed['@graph'] || [parsed]).map((n) => n && n['@type']).flat() : [],
      faq: parsed
        ? (parsed['@graph'] || [parsed]).filter((n) => n && n['@type'] === 'FAQPage')
            .map((n) => (n.mainEntity || []).map((q) => q.name + '\u0000' + q.acceptedAnswer.text))
        : [],
    });
  }

  // ── VISIBLE Q&A, for the mirror assertion ────────────────────────────────
  const faqSec = document.querySelector('#faq');
  let visibleFaq = [];
  if (faqSec) {
    const norm = (t) => t.replace(/\s+/g, ' ').trim();
    const det = [...faqSec.querySelectorAll('details')];
    visibleFaq = det.length
      ? det.map((d) => norm(d.querySelector('summary').textContent) + '\u0000' +
                       norm(d.querySelector('div').textContent))
      : [...faqSec.querySelectorAll('.card')].map((c) =>
          norm(c.querySelector('.card-h').textContent) + '\u0000' +
          norm(c.querySelector('.card-p').textContent));
  }

  return { tiny, filledContent, filledChrome, filledTel, canvas, overflow, ld, visibleFaq };
};

// ── negative controls ──────────────────────────────────────────────────────
const BREAK = () => {
  const s = document.createElement('style');
  s.textContent =
    '.sec-kicker,.cb-label,.lg-time{font-size:9px!important}' +
    'a[href^="tel:"],.nav-cta{background:rgb(30,86,214)!important}' +
    'body::before{background:none!important}';
  document.head.appendChild(s);
  const d = document.createElement('div');
  d.style.cssText = 'position:absolute;left:0;width:140vw;height:4px';
  document.body.appendChild(d);
};

const fail = [];
const note = (m) => { fail.push(m); console.log('  FAIL  ' + m); };

const b = await chromium.launch();

// ═══ NEGATIVE CONTROLS FIRST ═══════════════════════════════════════════════
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  await p.goto(ORIGIN + '/', { waitUntil: 'networkidle' });
  await p.evaluate(BREAK);
  await p.waitForTimeout(200);
  const r = await p.evaluate(PROBE);
  const controls = {
    'type-floor': r.tiny.length > 0,
    'filled-cta': r.filledTel.length > 1,
    'canvas': r.canvas.horizon === false,
    'overflow': r.overflow > 0,
  };
  for (const [k, caught] of Object.entries(controls)) {
    console.log(`  control ${k.padEnd(12)} ${caught ? 'caught the defect' : 'PASSED CLEAN'}`);
    if (!caught) {
      console.error(`\nABORT — negative control "${k}" passed clean. A gate that cannot fail is not a gate.`);
      await b.close();
      process.exit(2);
    }
  }
  await ctx.close();
  console.log('  all four negative controls fired\n');
}

// ═══ THE REAL RUN ══════════════════════════════════════════════════════════
const report = {};
for (const [w, h] of VIEWPORTS) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));

  for (const [path, name] of PAGES) {
    errs.length = 0;
    await p.goto(ORIGIN + path, { waitUntil: 'networkidle' });
    await p.waitForTimeout(250);
    const r = await p.evaluate(PROBE);
    const key = `${name}@${w}`;
    report[key] = r;

    if (r.tiny.length) note(`${key} type floor: ${r.tiny.map((t) => `${t.sel} ${t.px}px`).join(', ')}`);
    if (r.overflow > 0) note(`${key} horizontal overflow ${r.overflow}px`);
    if (errs.length) note(`${key} console: ${errs.slice(0, 2).join(' | ')}`);
    if (r.filledContent.length > 1) note(`${key} ${r.filledContent.length} filled action-blue controls in the CONTENT of one viewport: ${r.filledContent.join(' , ')}`);
    if (r.filledChrome.length > 1) note(`${key} ${r.filledChrome.length} filled action-blue controls in CHROME: ${r.filledChrome.join(' , ')}`);
    if (r.filledTel.length > 1) note(`${key} ${r.filledTel.length} filled blue PHONE surfaces in one viewport: ${r.filledTel.join(' , ')}`);
    if (!r.canvas.horizon) note(`${key} canvas horizon band missing`);
    if (!r.canvas.vignette) note(`${key} canvas vignette missing`);
    if (r.canvas.gridPos !== 'absolute') note(`${key} grid is ${r.canvas.gridPos}, expected absolute`);

    for (const l of r.ld) {
      if (!l.ok) note(`${key} JSON-LD parse: ${l.err}`);
      if (l.hasMustache) note(`${key} JSON-LD contains {{`);
      if (l.hasReplace) note(`${key} JSON-LD contains REPLACE_`);
      for (const f of l.faq) {
        if (JSON.stringify(f) !== JSON.stringify(r.visibleFaq)) {
          note(`${key} FAQPage does not mirror visible copy (${f.length} schema vs ${r.visibleFaq.length} visible)`);
        }
      }
    }
  }
  await ctx.close();
  console.log(`  swept ${PAGES.length} pages @ ${w}x${h}`);
}

// ═══ REDUCED MOTION — the ledger must settle on the outcome ════════════════
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(ORIGIN + '/', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.querySelector('#crush').scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(600);
  await p.evaluate(() => document.querySelector('#crush').scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(2500);
  const st = await p.evaluate(() => [...document.querySelectorAll('[data-lg-row]')].map((r) => ({
    cls: r.className, txt: r.querySelector('.lg-state').textContent.trim(),
    anim: getComputedStyle(r.querySelector('.lg-state'), '::before').animationName,
  })));
  const settled = st.length === 3 && st.every((r) => r.cls.includes('is-done') && r.txt === 'Ready for dispatch');
  const still = st.every((r) => r.anim === 'none');
  console.log(`  reduced-motion ledger settled: ${settled ? 'yes' : 'NO'} · no animation: ${still ? 'yes' : 'NO'}`);
  if (!settled) note('reduced motion: ledger did not settle on READY FOR DISPATCH — ' + JSON.stringify(st));
  if (!still) note('reduced motion: pulse animation still running');
  await ctx.close();
}

// ═══ llms.txt ══════════════════════════════════════════════════════════════
{
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  const res = await p.goto(ORIGIN + '/llms.txt');
  const body = await p.evaluate(() => document.body.innerText);
  console.log(`  /llms.txt ${res.status()} · ${body.length} chars`);
  if (res.status() !== 200) note(`/llms.txt returned ${res.status()}`);
  if (!/414\) 775-0019/.test(body)) note('/llms.txt does not carry the phone number');
  if (!/dispatch@aichauffeur\.ai/.test(body)) note('/llms.txt does not carry the contact email');
  if (/414-240-8930|414\) 240-8930/.test(body)) note('/llms.txt carries the PARENT brand phone number');
  await ctx.close();
}

await b.close();
writeFileSync(OUT + 'run10-gate.json', JSON.stringify({ fail, report }, null, 1));
console.log('\n' + (fail.length ? `  ${fail.length} FAILURE(S)` : '  ALL RUN 10 PROBES GREEN'));
process.exit(fail.length ? 1 : 0);
