#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// AIC RUN 12 · "ALPHA — MONEY PAGES" — the run gate
// ---------------------------------------------------------------------------
//   node tools/aic-run12-gate.mjs [origin]
//
// RUN 9/10/11 assert the SHELL: overflow, contrast, type floor, anchors,
// controls, radius. None of them can see whether a page says something true.
// This one checks the things RUN 12 is actually about.
//
//   1  exactly ONE visible <table> per new page                    (§6)
//   2  a direct answer of 40-60 words, first prose inside <main>   (§6)
//   3  the status column uses the five approved strings and NOTHING else (§1)
//   4  "production verified" appears NOWHERE on the host           (§1)
//   5  a visible last-updated stamp on every new page              (§6)
//   6  >=60% unique content, every new page against every other    (§6)
//   7  >=2 in-body links INTO each new page, and no orphans        (§5, § 8)
//   8  a non-affiliation line wherever a page names a third party in its H1
//   9  CTA canon: one string, one target                           (§8)
//  10  chrome parity: all 16 pages carry the same nav/footer/drawer link set
//  11  the sitemap lists exactly the 16 indexable URLs
//
// EVERY ZERO-READING PROBE SHIPS A NEGATIVE CONTROL (DESIGN-SYSTEM trap 13).
// Six fixtures are injected into a real page first and each must be caught. If
// a control passes clean the whole run aborts, because a gate that cannot fail
// is not a gate.
//
// TRAP 3 applies throughout: getComputedStyle reports an element's OWN display,
// so a node inside a display:none drawer still reads as laid out. Visibility is
// getClientRects().length plus the walked visibility and opacity chain.
// ═══════════════════════════════════════════════════════════════════════════
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
const require = createRequire('C:/Users/offic/Desktop/AVA-factory/adstage/package.json');
const { chromium } = require('playwright');

const ORIGIN = process.argv[2] || 'http://127.0.0.1:8848';
const OUT = new URL('../audits/run12/', import.meta.url).pathname.slice(1);
mkdirSync(OUT, { recursive: true });

const NEW = [
  ['/integrations/', 'integrations'],
  ['/integrations/limo-anywhere/', 'integrations-limo-anywhere'],
  ['/integrations/fasttrak/', 'integrations-fasttrak'],
  ['/limo-dispatch-automation/', 'limo-dispatch-automation'],
];
const OLD = [
  ['/', 'home'], ['/demo/', 'demo'], ['/book/', 'book'],
  ['/how-setup-works/', 'how-setup-works'],
  ['/works-with-your-software/', 'works-with-your-software'],
  ['/limo-answering-service/', 'limo-answering-service'],
  ['/after-hours-limo-dispatch/', 'after-hours-limo-dispatch'],
  ['/airport-transfer-booking/', 'airport-transfer-booking'],
  ['/milwaukee-limo-answering-service/', 'milwaukee'],
  ['/madison-limo-answering-service/', 'madison'],
  ['/privacy/', 'privacy'], ['/terms/', 'terms'],
];
const ALL = [...OLD, ...NEW];

// § 1 — the whole status vocabulary. Five strings. A sixth is a defect, and so
// is a variant of one of these with a word moved.
const STATUS = [
  'Direct write-back available after setup verification',
  'Partner API integration scoped during setup',
  'Network workflow review',
  'Custom integration review',
  'Included in every setup',
];

const CTA = 'Book the setup call';

// ── the in-page probe ──────────────────────────────────────────────────────
const PROBE = () => {
  const painted = (el) => {
    if (!el || !el.getClientRects().length) return false;
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
  const txt = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

  const main = document.querySelector('main') || document.body;
  const out = {};

  // 1 · visible tables
  out.tables = [...document.querySelectorAll('table')].filter(painted).length;

  // 2 · the direct answer, and whether it is the FIRST prose in <main>.
  //     "First" is judged by document order against every other paragraph-like
  //     block, not by which section it sits in — a page could put an answer in
  //     section two and still be wrong about what a reader meets first.
  const ans = [...main.querySelectorAll('.answer')].filter(painted);
  out.answers = ans.length;
  if (ans.length) {
    const words = txt(ans[0].querySelector('p')).split(/\s+/).filter(Boolean).length;
    const prose = [...main.querySelectorAll('p, .answer')].filter(painted);
    const firstProse = prose.find(el => !el.closest('.crumbs'));
    out.answerWords = words;
    out.answerIsFirst = !!firstProse && (firstProse === ans[0] || ans[0].contains(firstProse));
  }

  // 3 · the status column
  out.status = [...document.querySelectorAll('td.st')].filter(painted).map(txt);

  // 4 · the reserved phrase, anywhere in rendered text
  out.reserved = /production[\s-]verified/i.test(document.body.innerText || '');

  // 5 · the last-updated stamp, and its rendered size
  const upd = [...document.querySelectorAll('.page-updated')].filter(painted)[0];
  out.updated = upd ? txt(upd) : null;
  out.updatedPx = upd ? parseFloat(getComputedStyle(upd).fontSize) : null;

  // 6 · content text, chrome removed. #talk is the CTA stack and is identical
  //     on every page BY LAW, so leaving it in would drag every uniqueness
  //     score down by the same amount and make the measure meaningless.
  const clone = main.cloneNode(true);
  clone.querySelectorAll('#talk, .cb-form, .crumbs').forEach(n => n.remove());
  out.content = clone.textContent.replace(/\s+/g, ' ').trim();

  // 7 · in-body links (inside <main>, CTA stack excluded), as pathnames
  const inBody = [...main.querySelectorAll('a[href]')]
    .filter(a => painted(a) && !a.closest('#talk'));
  out.links = inBody.map(a => a.getAttribute('href'))
    .filter(h => h && h.startsWith('/'));

  // 8 · third parties named in the H1, and the non-affiliation line
  out.h1 = txt(document.querySelector('h1'));
  out.nonAffil = /not affiliated with or endorsed by/i.test(document.body.innerText || '');

  // 9 · CTA canon — every control or link that targets /book/
  out.bookTargets = [...document.querySelectorAll('a[href="/book/"]')]
    .filter(painted).map(txt);

  // 12 · a table that scrolls has to be reachable and has to say so.
  //      RUN 12 photographed the hub at 390 with its entire status column off
  //      the right edge and nothing on screen indicating there was more. Two
  //      separate defects live in that one picture: a two-column table paying
  //      a three-column table's 620px floor, and a scrollable region with no
  //      keyboard access. Both are measured here rather than eyeballed.
  out.wraps = [...document.querySelectorAll('.tbl-wrap')].filter(painted).map(w => {
    const over = w.scrollWidth > w.clientWidth + 1;
    const hint = w.parentElement.querySelector('.tbl-hint');
    return {
      over,
      focusable: w.hasAttribute('tabindex'),
      role: w.getAttribute('role') || '',
      hinted: !!(hint && painted(hint)),
      scrollW: w.scrollWidth, clientW: w.clientWidth,
    };
  });

  // 10 · chrome link sets
  const setOf = (sel) => [...document.querySelectorAll(sel)]
    .map(a => a.getAttribute('href')).filter(h => h && h.startsWith('/')).sort().join(' ');
  out.chrome = {
    nav: setOf('nav.top .nav-panel a'),
    foot: setOf('footer .foot-col a'),
    drawer: setOf('.nav-drawer .dw-group a'),
  };

  return out;
};

// ── 13 · EVERY ANCHOR ON EVERY NEW PAGE ────────────────────────────────────
// RUN 11's anchor sweep covers the HOMEPAGE's eleven anchors and the skip link
// on every other page. It does not touch a new page's own section anchors, and
// four new pages carry thirty-two between them — so the rule RUN 11 exists to
// enforce would have been unenforced on exactly the pages this run added.
//
// Both widths matter and they are not redundant: --nav-h is 61px below 1024 and
// 73px at or above it, so a single width tests one of the two constants.
//
// TRAP 19 and TRAP 3: scroll-behavior is smooth here and a fragment jump is
// still travelling when a naive probe reads the box. Every anchor is measured
// on a FRESH context, which is also what a deep link actually is.
const ANCHOR_PROBE = (id) => {
  const el = document.querySelector(id);
  if (!el) return null;
  const nav = document.querySelector('nav.top');
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  // the first painted text inside the target — the user-visible assertion
  let textTop = null, text = '';
  for (const n of el.querySelectorAll('*')) {
    if (!n.getClientRects().length) continue;
    if (!n.textContent.trim()) continue;
    if (n.children.length) continue;
    textTop = n.getBoundingClientRect().top;
    text = n.textContent.trim().slice(0, 34);
    break;
  }
  return {
    top: +r.top.toFixed(1),
    navBottom: nav ? +nav.getBoundingClientRect().bottom.toFixed(1) : 0,
    spt: getComputedStyle(document.documentElement).scrollPaddingTop,
    smt: cs.scrollMarginTop,
    textTop: textTop === null ? null : +textTop.toFixed(1),
    text,
  };
};

const NEW_ANCHORS = {
  '/integrations/': ['#platforms', '#deep', '#ladder', '#ticket', '#talk', '#faq', '#more', '#ava-callback'],
  '/integrations/limo-anywhere/': ['#capability', '#ladder', '#fields', '#ticket', '#talk', '#faq', '#more', '#ava-callback'],
  '/integrations/fasttrak/': ['#status', '#operation', '#intake', '#ticket', '#talk', '#faq', '#more', '#ava-callback'],
  '/limo-dispatch-automation/': ['#layer', '#compare', '#cost', '#ticket', '#talk', '#faq', '#more', '#ava-callback'],
};

// ── shingles: 5-word windows, for the anti-doorway measure ────────────────
const shingles = (s) => {
  const w = s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean);
  const out = new Set();
  for (let i = 0; i + 5 <= w.length; i++) out.add(w.slice(i, i + 5).join(' '));
  return out;
};
const uniqueFraction = (a, b) => {
  if (!a.size) return 0;
  let novel = 0;
  for (const s of a) if (!b.has(s)) novel++;
  return novel / a.size;
};

const fail = [];
const note = (ok, label, detail) => {
  console.log('  %s %s%s', ok ? 'ok  ' : 'FAIL', label.padEnd(52),
    detail === undefined ? '' : detail);
  if (!ok) fail.push(label + (detail === undefined ? '' : '  ' + detail));
};

// ── negative controls ──────────────────────────────────────────────────────
async function controls(page) {
  await page.goto(ORIGIN + '/integrations/', { waitUntil: 'networkidle' });
  const r = await page.evaluate(() => {
    const main = document.querySelector('main');
    // a second visible table
    const t = document.createElement('table');
    t.innerHTML = '<tbody><tr><td>negative control</td></tr></tbody>';
    main.appendChild(t);
    // a sixth status string
    const td = document.createElement('td');
    td.className = 'st'; td.textContent = 'Production verified';
    const row = document.createElement('tr'); row.appendChild(td);
    document.querySelector('table tbody').appendChild(row);
    // an answer that is too long
    const extra = document.createElement('div');
    extra.className = 'answer';
    extra.innerHTML = '<p>' + Array(90).fill('word').join(' ') + '</p>';
    main.appendChild(extra);
    // an in-body link to a page nothing else points at
    const a = document.createElement('a');
    a.href = '/negative-control-orphan/'; a.textContent = 'ctl';
    main.appendChild(a);
    return true;
  });
  const p = await page.evaluate(PROBE);
  const missed = [];
  if (p.tables <= 1) missed.push('second-table control did not fire');
  if (p.status.every(s => s !== 'Production verified')) missed.push('status-vocabulary control did not fire');
  if (!p.reserved) missed.push('reserved-phrase control did not fire');
  if (p.answers < 2) missed.push('extra-answer control did not fire');
  if (!p.links.includes('/negative-control-orphan/')) missed.push('link-scan control did not fire');
  // and the uniqueness measure must be able to report a LOW number
  const self = shingles(p.content);
  if (uniqueFraction(self, self) !== 0) missed.push('uniqueness control did not fire');
  // ── control 7 · the anchor probe must SEE a section under the bar ────────
  // TRAP 22 (RUN 11): a negative control can be flaky where the thing it guards
  // is not. Driving a hash round-trip into a smooth scroll across a long
  // document reads the box mid-flight and reports a defect that is not there.
  // So the control forces scroll-behavior:auto and drives scrollIntoView()
  // itself, exactly as RUN 11's does.
  {
    const c = await page.context().browser().newContext({ viewport: { width: 390, height: 844 } });
    const p2 = await c.newPage();
    await p2.goto(ORIGIN + '/integrations/', { waitUntil: 'networkidle' });
    await p2.addStyleTag({ content:
      'html{scroll-behavior:auto!important;scroll-padding-top:0px!important}' +
      'section[id]{scroll-margin-top:0px!important}' });
    await p2.evaluate(() => document.querySelector('#platforms').scrollIntoView());
    await p2.waitForTimeout(400);
    const r = await p2.evaluate(ANCHOR_PROBE, '#platforms');
    await c.close();
    const caught = r && r.textTop !== null && r.textTop < r.navBottom;
    if (!caught) missed.push('anchor-clearance control did not fire');
  }

  console.log('\n══ NEGATIVE CONTROLS ══');
  if (missed.length) {
    missed.forEach(m => console.log('  ABORT  ' + m));
    console.log('\n  A gate that cannot fail is not a gate. Aborting.\n');
    process.exit(2);
  }
  console.log('  all 7 controls fired against the injected fixture\n');
}

// ── run ────────────────────────────────────────────────────────────────────
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

await controls(page);

const data = {};
for (const [path, slug] of ALL) {
  await page.goto(ORIGIN + path, { waitUntil: 'networkidle' });
  data[path] = await page.evaluate(PROBE);
  data[path].slug = slug;
}

// Probe 12 is a NARROW-VIEWPORT question and cannot be answered at 1280, where
// nothing overflows. Re-read the wraps at the three phone widths.
const narrow = {};
for (const [w, h] of [[360, 800], [390, 844], [430, 932]]) {
  await page.setViewportSize({ width: w, height: h });
  for (const [path] of ALL) {
    await page.goto(ORIGIN + path, { waitUntil: 'networkidle' });
    const r = await page.evaluate(PROBE);
    narrow[w + '|' + path] = r.wraps;
  }
}

// Probe 13 — every anchor on every new page, on a FRESH context each time.
const anchors = [];
for (const [w, h] of [[390, 844], [1440, 900]]) {
  for (const path of Object.keys(NEW_ANCHORS)) {
    for (const id of NEW_ANCHORS[path]) {
      const c = await b.newContext({ viewport: { width: w, height: h } });
      const p2 = await c.newPage();
      await p2.goto(ORIGIN + path + id, { waitUntil: 'networkidle' });
      await p2.waitForTimeout(1200);
      const r = await p2.evaluate(ANCHOR_PROBE, id);
      await c.close();
      anchors.push({ w, path, id, r });
    }
  }
}
await b.close();

console.log('══ RUN 12 GATE · %d pages ══\n', ALL.length);

// 1 · one visible table per new page
for (const [path] of NEW) {
  note(data[path].tables === 1, '1 · exactly one visible table  ' + path, data[path].tables);
}

// 2 · the direct answer
for (const [path] of NEW) {
  const d = data[path];
  note(d.answers >= 1, '2 · direct answer present      ' + path, d.answers);
  note(d.answerWords >= 40 && d.answerWords <= 60,
    '2 · answer is 40-60 words      ' + path, d.answerWords + ' words');
  note(d.answerIsFirst === true, '2 · answer is first prose      ' + path);
}

// 3 · the status vocabulary
{
  const s = data['/integrations/'].status;
  const bad = s.filter(v => !STATUS.includes(v));
  const seen = new Set(s);
  note(s.length === 11, '3 · status column has 11 rows', s.length);
  note(bad.length === 0, '3 · no status outside the five', bad.length ? bad.join(' | ') : '');
  note(STATUS.every(v => seen.has(v)), '3 · all five statuses present', [...seen].length + ' distinct');
  // and nowhere else on the site invents one
  for (const [path] of ALL) {
    if (path === '/integrations/') continue;
    const extra = data[path].status.filter(v => !STATUS.includes(v));
    if (extra.length) note(false, '3 · stray status ' + path, extra.join(' | '));
  }
}

// 4 · the reserved phrase
for (const [path] of ALL) {
  if (data[path].reserved) note(false, '4 · "production verified" rendered ' + path);
}
note(!ALL.some(([p]) => data[p].reserved), '4 · reserved phrase absent sitewide', '16/16');

// 5 · the last-updated stamp
for (const [path] of NEW) {
  const d = data[path];
  note(!!d.updated, '5 · visible last-updated       ' + path, d.updated || '');
  note(d.updatedPx >= 12, '5 · stamp at or over the 12px floor ' + path, d.updatedPx + 'px');
}

// 6 · anti-doorway
{
  let worst = 1, worstPair = '';
  for (const [a] of NEW) {
    const sa = shingles(data[a].content);
    for (const [c] of ALL) {
      if (a === c) continue;
      const f = uniqueFraction(sa, shingles(data[c].content));
      if (f < worst) { worst = f; worstPair = a + ' vs ' + c; }
    }
  }
  note(worst >= 0.60, '6 · >=60% unique, every new page vs every other',
    (worst * 100).toFixed(1) + '% worst — ' + worstPair);
}

// 7 · inbound in-body links, and orphans
{
  const inbound = {};
  for (const [path] of ALL) inbound[path] = [];
  for (const [from] of ALL) {
    for (const href of data[from].links) {
      if (inbound[href] && from !== href) inbound[href].push(from);
    }
  }
  const SOURCES = ['/', '/limo-answering-service/', '/works-with-your-software/'];
  for (const [path] of NEW) {
    const all = [...new Set(inbound[path])];
    const named = all.filter(f => SOURCES.includes(f));
    note(named.length >= 2 || all.length >= 2,
      '7 · >=2 in-body links in       ' + path,
      all.length + ' pages (' + named.length + ' from the three named)');
  }
  const orphans = ALL.filter(([p]) => p !== '/' && !inbound[p].length).map(([p]) => p);
  note(orphans.length === 0, '7 · zero orphaned indexable pages',
    orphans.length ? orphans.join(' ') : '16/16 reachable in body');
}

// 8 · non-affiliation wherever a third party is named in the H1
for (const [path] of NEW) {
  const h1 = data[path].h1;
  const names = /limo anywhere|fasttrak|santa cruz|google/i.test(h1);
  if (names) note(data[path].nonAffil, '8 · non-affiliation line       ' + path, h1);
}
note(data['/integrations/'].nonAffil, '8 · non-affiliation line       /integrations/');

// 9 · CTA canon
for (const [path] of ALL) {
  const bad = data[path].bookTargets.filter(t => t !== CTA && t !== CTA + ' →');
  if (bad.length) note(false, '9 · CTA string off canon ' + path, bad.join(' | '));
}
note(!ALL.some(([p]) => data[p].bookTargets.filter(t => t !== CTA && t !== CTA + ' →').length),
  '9 · one setup CTA string sitewide', CTA);

// 10 · chrome parity
{
  const ref = data['/'].chrome;
  for (const [path] of ALL) {
    const c = data[path].chrome;
    const same = c.nav === ref.nav && c.foot === ref.foot && c.drawer === ref.drawer;
    if (!same) {
      note(false, '10 · chrome link set differs ' + path);
      if (c.nav !== ref.nav) console.log('        nav    ', c.nav);
      if (c.foot !== ref.foot) console.log('        footer ', c.foot);
      if (c.drawer !== ref.drawer) console.log('        drawer ', c.drawer);
    }
  }
  note(ALL.every(([p]) => {
    const c = data[p].chrome;
    return c.nav === ref.nav && c.foot === ref.foot && c.drawer === ref.drawer;
  }), '10 · nav/footer/drawer identical on all 16');
}

// 11 · the sitemap
{
  const xml = readFileSync(new URL('../chauffeur/sitemap.xml', import.meta.url).pathname.slice(1), 'utf8');
  const locs = [...xml.matchAll(/<loc>https:\/\/aichauffeur\.ai([^<]*)<\/loc>/g)].map(m => m[1]);
  const missing = ALL.map(([p]) => p).filter(p => !locs.includes(p));
  const extra = locs.filter(l => !ALL.some(([p]) => p === l));
  note(!missing.length && !extra.length, '11 · sitemap lists exactly the 16 pages',
    locs.length + ' urls' + (missing.length ? ' MISSING ' + missing.join(' ') : '') +
    (extra.length ? ' EXTRA ' + extra.join(' ') : ''));
}

// 12 · scrollable tables, at the widths where they actually scroll
{
  let overflowing = 0, silent = 0, unreachable = 0, deadStop = 0, fits = 0;
  for (const key of Object.keys(narrow)) {
    const [w, path] = key.split('|');
    for (const s of narrow[key]) {
      if (s.over) {
        overflowing++;
        if (!s.focusable) { unreachable++; note(false, '12 · scrollable table not keyboard-reachable @' + w + ' ' + path, s.scrollW + '/' + s.clientW); }
        if (!s.hinted) { silent++; note(false, '12 · scrollable table with no visible hint @' + w + ' ' + path); }
      } else {
        fits++;
        if (s.focusable) { deadStop++; note(false, '12 · non-scrolling table is a dead tab stop @' + w + ' ' + path); }
      }
    }
  }
  note(!unreachable && !silent && !deadStop,
    '12 · scrollable tables reachable + hinted, no dead stops',
    overflowing + ' overflow / ' + fits + ' fit, across 3 phone widths');
}

// 13 · anchor clearance on the new pages
{
  const bad = [];
  for (const a of anchors) {
    if (!a.r) { bad.push(a.path + a.id + ' @' + a.w + ' MISSING'); continue; }
    const want = parseFloat(a.r.spt) + parseFloat(a.r.smt);
    if (Math.abs(a.r.top - want) > 1.5) {
      bad.push(a.path + a.id + ' @' + a.w + ' top ' + a.r.top + ' want ' + want);
    } else if (a.r.textTop !== null && a.r.textTop < a.r.navBottom) {
      bad.push(a.path + a.id + ' @' + a.w + ' text ' + a.r.textTop +
        ' under nav ' + a.r.navBottom + ' "' + a.r.text + '"');
    }
  }
  bad.slice(0, 8).forEach(m => note(false, '13 · anchor under the bar', m));
  const at390 = anchors.filter(a => a.w === 390 && a.r);
  const at1440 = anchors.filter(a => a.w === 1440 && a.r);
  note(!bad.length, '13 · every new-page anchor clears the fixed header',
    anchors.length + ' anchor loads · ' +
    (at390.length ? 'at 390 top=' + at390[0].r.top + ' navBottom=' + at390[0].r.navBottom : '') +
    (at1440.length ? ' · at 1440 top=' + at1440[0].r.top + ' navBottom=' + at1440[0].r.navBottom : ''));
}

writeFileSync(OUT + 'gate.json', JSON.stringify({ wide: data, narrow, anchors }, null, 1));
console.log('\n  wrote %sgate.json', OUT);
console.log('\nGATE run12: %s\n', fail.length ? 'FAIL (' + fail.length + ')' : 'ALL GREEN');
process.exit(fail.length ? 1 : 0);
