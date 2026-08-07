#!/usr/bin/env node
// RUN 9 · COMPUTED-STYLE PARITY GATE  (premise updated in RUN 13)
//
// This gate was written because index.html carried its own embedded <style>
// while the other pages consumed assets/aic.css. Two heads on one site is the
// defect RUN 7 shipped, and reading the RESOLVED chrome off both kinds of page
// was the only way to catch a rule that had landed on one of them.
//
// RUN 13 removed the second head: all sixteen pages link the same two files.
// The gate is NOT retired, because "same stylesheet" is not the same claim as
// "same rendered chrome" — a page can still diverge through its own markup, a
// stray attribute, a missing wrapper, or a rule that only matches under a
// class one page happens not to carry. What changed is the failure it is
// hunting: not a missing rule in a second copy, but a page that has drifted
// out of the shape the shared rule expects.
//
// The source-level "no second copy" assertion lives in aic-run11-gate.mjs.
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/offic/Desktop/AVA-factory/adstage/package.json');
const { chromium } = require('playwright');
const O = process.argv[2] || 'http://localhost:8848';

const TARGETS = [
  ['nav bar',            'nav.top',            ['backgroundColor','borderBottomColor','paddingTop','paddingBottom','paddingLeft','height','backdropFilter','gap']],
  ['nav group trigger',  '.nav-trigger',       ['fontFamily','fontSize','fontWeight','color','minHeight','letterSpacing','padding']],
  ['nav panel',          '.nav-panel',         ['backgroundColor','borderTopColor','borderRadius','boxShadow','minWidth','padding']],
  ['nav call chip',      '.nav-cta',           ['backgroundColor','color','borderTopColor','fontFamily','fontSize','fontWeight','minHeight','borderRadius']],
  ['primary button',     '.nav-book',          ['backgroundColor','color','boxShadow','fontFamily','fontSize','fontWeight','minHeight','borderRadius','padding']],
  ['drawer trigger',     '.nav-burger',        ['backgroundColor','color','borderTopColor','minWidth','minHeight','borderRadius','fontSize']],
  ['footer',             'footer',             ['paddingTop','paddingBottom','borderTopColor','marginTop']],
  ['footer column head', '.foot-col h2',       ['fontFamily','fontSize','letterSpacing','color','textTransform']],
  ['footer link',        '.foot-col a',        ['fontFamily','fontSize','color','minHeight','fontWeight']],
  ['footer mark',        '.foot-mark',         ['fontFamily','fontSize','color']],
  ['footer bottom',      '.foot-bottom',       ['fontFamily','fontSize','color','letterSpacing','borderTopColor','textTransform']],
  ['sticky rail',        '.rail',              ['backgroundColor','borderTopColor','gridTemplateColumns','padding']],
  ['rail primary',       '.rail-call',         ['backgroundColor','color','fontFamily','fontSize','minHeight','borderRadius']],
  ['body ground',        'body',               ['backgroundColor','color','fontFamily','fontSize','lineHeight']],
  ['page grid layer',    'body',               []],
];

const probe = (targets) => {
  const out = {};
  targets.forEach(([name, sel, props]) => {
    const el = document.querySelector(sel);
    if (!el) { out[name] = 'MISSING'; return; }
    const cs = getComputedStyle(el);
    out[name] = props.map(p => p + '=' + cs[p]).join(' | ');
  });
  const g = getComputedStyle(document.body, '::after');
  out['page grid layer'] = ['opacity','backgroundSize','maskImage'].map(p => p + '=' + g[p]).join(' | ');
  const tok = getComputedStyle(document.documentElement);
  out['tokens'] = ['--midnight','--surface','--line','--ink','--signal-blue','--action-blue','--sky','--success-green','--amber','--miss-red','--neutral','--raise','--grid-line'].map(v => v + '=' + tok.getPropertyValue(v).trim()).join(' | ');
  return out;
};

const b = await chromium.launch(); const p = await b.newPage();
await p.setViewportSize({ width: 1280, height: 900 });
const read = async (path) => { await p.goto(O + path, { waitUntil: 'networkidle' }); return p.evaluate(probe, TARGETS); };

const base = await read('/');                                  // embedded <style>
const a    = await read('/limo-answering-service/');            // aic.css, money page
const c    = await read('/works-with-your-software/');          // aic.css, second money page
// RUN 12 · a DEPTH-TWO aic.css page. Every page this gate had ever read sat one
// level down, so a relative-path or root-scoped regression on a nested page
// would have gone unseen. The chrome must resolve identically at any depth.
const d    = await read('/integrations/limo-anywhere/');        // aic.css, depth two

// RUN 13 · `.rail--solo` MOVED, AND THE REASON FOR IT MOVED WITH IT.
//
// Through RUN 12 the solo pages were /terms/, /privacy/ and /demo/, because the
// rail's second control was "Get a call back" and those three pages have no
// callback form to send anyone to. The second control is now "Book the setup
// call", which goes to /book/ — a page that exists on every one of the sixteen.
// So the old reason evaporates and all three of those pages get the pair.
//
// Exactly one page is solo now, for a different reason: on /book/ itself, a
// button offering to take the reader to /book/ is a control that does nothing.
// Call stays, because calling is still a real alternative there.
//
// This is asserted rather than diffed away, and it is asserted as an EXACT SET
// — solo where it should be and, just as important, NOT solo anywhere else.
// The old check only looked at the three pages it expected to be solo, so a
// fourth page going solo by accident would have passed clean.
const SOLO_EXPECTED = ['/book/'];
const soloCheck = ['/book/', '/terms/', '/privacy/', '/demo/', '/limo-answering-service/'];
const solo = [];
for (const path of soloCheck) {
  await p.goto(O + path, { waitUntil: 'networkidle' });
  solo.push([path, await p.evaluate(() => ({
    solo: !!document.querySelector('.rail--solo'),
    cols: getComputedStyle(document.querySelector('.rail')).gridTemplateColumns,
    ctrls: document.querySelectorAll('.rail a').length,
    book: document.querySelectorAll('.rail a[href="/book/"]').length,
    call: document.querySelectorAll('.rail a[href^="tel:"]').length,
  }))]);
}
await b.close();

let bad = 0;
console.log('\n══ COMPUTED-STYLE PARITY · index.html (embedded) vs 2 x aic.css pages ══\n');
for (const k of Object.keys(base)) {
  const same = base[k] === a[k] && base[k] === c[k] && base[k] === d[k];
  if (!same) {
    bad++;
    console.log('DIFF  ' + k);
    console.log('      index.html            ', base[k]);
    console.log('      limo-answering-service ', a[k]);
    console.log('      works-with-your-software', c[k]);
    console.log('      integrations/limo-anywhere', d[k]);
  } else {
    console.log('SAME  ' + k.padEnd(20), String(base[k]).slice(0, 96));
  }
}
console.log('');
let soloBad = 0;
for (const [path, s] of solo) {
  const want = SOLO_EXPECTED.includes(path);
  // Solo: one control, and it is the phone. Paired: two, one phone one /book/.
  // Every page carries Call either way — that is the rail's whole job.
  const ok = s.call === 1 && (want
    ? (s.solo && s.ctrls === 1 && s.book === 0)
    : (!s.solo && s.ctrls === 2 && s.book === 1 && s.cols !== '60fr 40fr'));
  if (!ok) soloBad++;
  console.log((ok ? 'SAME  ' : 'DIFF  ') + ((want ? 'rail solo ' : 'rail pair ') + path).padEnd(24) + '  ' + JSON.stringify(s));
}
console.log('\nGATE computed-style-parity: ' + (bad || soloBad ? 'FAIL (' + (bad + soloBad) + ')' : 'PASS'));
process.exit(bad || soloBad ? 1 : 0);
