#!/usr/bin/env node
// RUN 9 · COMPUTED-STYLE PARITY GATE
// index.html carries its own embedded <style>; the other eleven pages consume
// assets/aic.css. Two heads on one site is the defect RUN 7 shipped. This reads
// the RESOLVED style of the shared chrome off both kinds of page and diffs it.
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

// /terms/, /privacy/ and /demo/ carry `.rail--solo` BY DESIGN: they have no
// callback form, so the rail is one full-width control instead of a 60/40 split.
// That is a real difference in what the page offers, not chrome drift, so it is
// asserted explicitly rather than diffed away.
const solo = [];
for (const path of ['/terms/', '/privacy/', '/demo/']) {
  await p.goto(O + path, { waitUntil: 'networkidle' });
  solo.push([path, await p.evaluate(() => ({
    solo: !!document.querySelector('.rail--solo'),
    cols: getComputedStyle(document.querySelector('.rail')).gridTemplateColumns,
    forms: document.querySelectorAll('[data-cb-form]').length
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
  const ok = s.solo && s.forms === 0 && s.cols !== '60fr 40fr';
  if (!ok) soloBad++;
  console.log((ok ? 'SAME  ' : 'DIFF  ') + ('rail--solo ' + path).padEnd(20) + '  ' + JSON.stringify(s));
}
console.log('\nGATE computed-style-parity: ' + (bad || soloBad ? 'FAIL (' + (bad + soloBad) + ')' : 'PASS'));
process.exit(bad || soloBad ? 1 : 0);
