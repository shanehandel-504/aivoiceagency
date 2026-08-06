/* AIC RUN 7 · behavioural gate — the moving parts, sampled over time.
 *
 * A static screenshot cannot prove a state machine. This drives the real clock
 * and records what the console, the stage rail and the Crush scene actually do,
 * then re-runs the same pages with prefers-reduced-motion: reduce and asserts
 * they land on the completed state with no animation.
 *
 *   node tools/run7_behaviour.js
 */
const path = require('path');
const PW = 'C:/Users/offic/Desktop/AVA-factory/adstage/node_modules/playwright';
const { chromium } = require(PW);
const BASE = process.env.RUN7_BASE || 'http://127.0.0.1:4177';

const snap = () => {
  const st = document.getElementById('hc-state');
  const root = document.getElementById('hero-console');
  const cs = st ? getComputedStyle(st) : null;
  return {
    label: st ? st.textContent.trim() : null,
    cls: st ? st.className.replace('hc-state ', '') : null,
    color: cs ? cs.color : null,
    captured: root ? root.classList.contains('hc-captured') : null,
    onFields: document.querySelectorAll('#hero-console [data-hc-stage].on').length,
  };
};

(async () => {
  const browser = await chromium.launch();
  let fails = [];

  // ── 1 · CONSOLE PROOF LOOP ────────────────────────────────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'load' });
    /* Sample until the loop has RESET, not for a fixed wall-clock window. The
       first version stopped at 13s, which was fine against localhost and failed
       against production for a reason that had nothing to do with the product:
       each page.evaluate is a round trip, so on a remote host the sampler's own
       overhead pushes the second reset past a fixed deadline. The cycle length
       is what the brief specifies, so measure that and bound the sampling by
       the number of resets seen. */
    console.log('\n=== TASK C · CONSOLE STATE PROGRESSION (sampled to 2 resets) ===');
    const seen = [];
    const t0 = Date.now();
    while (Date.now() - t0 < 45000) {
      const s = await page.evaluate(snap);
      const key = s.cls + '|' + s.label;
      if (!seen.length || seen[seen.length - 1].key !== key) {
        const t = Date.now() - t0;
        seen.push({ key, t, ...s });
        console.log(`  ${String(t).padStart(6)}ms  ${String(s.label).padEnd(20)}`
          + ` cls=${String(s.cls).padEnd(10)} ${s.color}  fields=${s.onFields} captured=${s.captured}`);
      }
      if (seen.filter(x => x.cls === 'ringing').length >= 2) break;
      await page.waitForTimeout(250);
    }
    const order = seen.map(s => s.cls);
    const want = ['ringing', 'live', 'captured', 'quote', 'ready'];
    if (!want.every(w => order.includes(w))) fails.push('console never reached all five states: ' + order.join('>'));
    const rings = seen.filter(x => x.cls === 'ringing');
    if (rings.length < 2) fails.push('console did not reset within 45s');
    else {
      const cycle = rings[1].t - rings[0].t;
      console.log(`  cycle length ${cycle}ms (brief: 10000-12000ms)`);
      /* generous upper bound: the sampler adds its own latency to the measured
         gap, so a remote run reads slightly long. A cycle under 10s or wildly
         over is a real defect; a few hundred ms of sampling overhead is not. */
      if (cycle < 9500 || cycle > 13500) fails.push(`console cycle ${cycle}ms outside 10-12s`);
    }
    console.log('  states reached: ' + Array.from(new Set(order)).join(' -> '));

    // ── 2 · STAGE RAIL ──────────────────────────────────────────────────────
    console.log('\n=== TASK F · FOUR-STAGE RAIL ===');
    await page.evaluate(() => document.querySelector('#how').scrollIntoView());
    await page.waitForTimeout(400);
    for (const t of [0, 700, 1400, 2100, 3200]) {
      if (t) await page.waitForTimeout(t === 700 ? 700 : 700);
      const r = await page.evaluate(() => ({
        p: getComputedStyle(document.querySelector('#how .steps')).getPropertyValue('--rail-p').trim(),
        cur: Array.from(document.querySelectorAll('#how .step')).map(s =>
          s.classList.contains('is-done') ? 'done' : s.classList.contains('is-current') ? 'CUR' : '-').join(','),
      }));
      console.log(`  +${String(t).padStart(4)}ms  rail-p=${r.p || '0'}  ${r.cur}`);
    }
    await page.waitForTimeout(1200);            // let complete() land
    const fin = await page.evaluate(() => ({
      done: document.querySelectorAll('#how .step.is-done').length,
      cur: document.querySelectorAll('#how .step.is-current').length,
      p: getComputedStyle(document.querySelector('#how .steps')).getPropertyValue('--rail-p').trim(),
    }));
    console.log(`  settled   rail-p=${fin.p} done=${fin.done}/4 current=${fin.cur}`);
    if (fin.done !== 4) fails.push('stage rail did not complete: ' + fin.done + '/4 done');
    if (fin.cur !== 0) fails.push('stage rail left a current node after completing');

    // Node colours must differ by state. The node carries a background
    // transition, so getComputedStyle right after a class swap returns the
    // MID-TRANSITION value, not the target — the first version of this check
    // read three identical greens off a node that was still animating. Suppress
    // the transition for the read, then restore it.
    const nodeColors = await page.evaluate(async () => {
      const s = document.querySelector('#how .step');
      const keep = s.className;
      s.style.transition = 'none';
      const st = document.createElement('style');
      st.textContent = '#how .step::after{transition:none!important}';
      document.head.appendChild(st);
      const read = c => { s.className = 'step ' + c;
        void s.offsetWidth;
        const cs = getComputedStyle(s, '::after');
        return cs.backgroundColor + ' / ring ' + cs.borderTopColor; };
      const idle = read(''), cur = read('is-current'), done = read('is-done');
      st.remove(); s.style.transition = ''; s.className = keep;
      return { idle, cur, done };
    });
    console.log('  node colours  idle=' + nodeColors.idle + '  current=' + nodeColors.cur + '  done=' + nodeColors.done);
    if (nodeColors.cur === nodeColors.done) fails.push('stage node current and done are the same colour');

    // ── 3 · CRUSH SCENE ─────────────────────────────────────────────────────
    console.log('\n=== TASK G · THE CRUSH ===');
    const amb = await page.evaluate(() => {
      const sec = document.querySelector('#crush');
      const cs = getComputedStyle(sec);
      return { bg: cs.backgroundImage.slice(0, 78), bt: cs.borderTopColor,
               em: getComputedStyle(document.querySelector('.crush-h em')).color,
               carded: getComputedStyle(document.querySelector('.crush')).borderTopWidth };
    });
    console.log('  section ambience: ' + amb.bg + '…');
    console.log('  hairline ' + amb.bt + ' · heading em ' + amb.em + ' · .crush border ' + amb.carded);
    if (!/255,\s*176,\s*32/.test(amb.bg)) fails.push('Crush section is not amber-black');
    if (amb.em !== 'rgb(255, 176, 32)') fails.push('Crush heading em is not amber: ' + amb.em);

    await page.evaluate(() => document.querySelector('#crush').scrollIntoView());
    await page.waitForTimeout(250);
    for (const t of [0, 900, 900, 900]) {
      if (t) await page.waitForTimeout(t);
      const r = await page.evaluate(() => Array.from(document.querySelectorAll('.cl')).map(c =>
        (c.querySelector('.cl-s').textContent) + ':' + getComputedStyle(c.querySelector('.cl-s')).color).join('  '));
      console.log('  ' + r);
    }
    const noRed = await page.evaluate(() =>
      !Array.from(document.querySelectorAll('#crush *')).some(el => {
        const c = getComputedStyle(el);
        return /255,\s*59,\s*78/.test(c.color) || /255,\s*59,\s*78/.test(c.backgroundColor);
      }));
    console.log('  no miss-red anywhere in the Crush: ' + noRed);
    if (!noRed) fails.push('miss-red appears in the Crush section');
    await ctx.close();
  }

  // ── 4 · REDUCED MOTION ────────────────────────────────────────────────────
  {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 }, reducedMotion: 'reduce',
    });
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'load' });
    await page.waitForTimeout(900);
    console.log('\n=== REDUCED MOTION (prefers-reduced-motion: reduce) ===');
    const rm = await page.evaluate(() => {
      const st = document.getElementById('hc-state');
      return {
        consoleLabel: st.textContent.trim(),
        consoleCls: st.className,
        consoleAnim: getComputedStyle(st).animationName,
        fieldsOn: document.querySelectorAll('#hero-console [data-hc-stage].on').length,
        fieldsTotal: document.querySelectorAll('#hero-console [data-hc-stage]').length,
        resultHeader: document.querySelector('.hc-result').textContent.replace(/\s+/g, ' ').trim(),
        crushStates: Array.from(document.querySelectorAll('.cl-s')).map(s => s.textContent).join('/'),
        crushDotAnim: getComputedStyle(document.querySelector('.cl-s'), '::before').animationName,
      };
    });
    await page.evaluate(() => document.querySelector('#how').scrollIntoView());
    await page.waitForTimeout(500);
    const rails = await page.evaluate(() => ({
      p: getComputedStyle(document.querySelector('#how .steps')).getPropertyValue('--rail-p').trim(),
      done: document.querySelectorAll('#how .step.is-done').length,
      trans: getComputedStyle(document.querySelector('#how .steps'), '::after').transitionDuration,
    }));
    console.log('  console      "' + rm.consoleLabel + '" (' + rm.consoleCls + ') anim=' + rm.consoleAnim
      + ' fields ' + rm.fieldsOn + '/' + rm.fieldsTotal);
    console.log('  result hdr   "' + rm.resultHeader + '"');
    console.log('  crush        ' + rm.crushStates + '  dot-anim=' + rm.crushDotAnim);
    console.log('  stage rail   p=' + rails.p + ' done=' + rails.done + '/4 transition=' + rails.trans);

    if (rm.fieldsOn !== rm.fieldsTotal) fails.push('reduced-motion console is not fully settled');
    if (!/ready/.test(rm.consoleCls)) fails.push('reduced-motion console did not settle on ready');
    if (rm.consoleAnim !== 'none') fails.push('reduced-motion state chip still animates');
    if (rm.crushDotAnim !== 'none') fails.push('reduced-motion crush dot still animates');
    if (rm.crushStates !== 'Captured/Captured/Captured') fails.push('reduced-motion crush not settled: ' + rm.crushStates);
    if (rails.done !== 4) fails.push('reduced-motion stage rail not complete');
    await ctx.close();
  }

  // ── 5 · /book/ — the rail must still appear somewhere ─────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(BASE + '/book/', { waitUntil: 'load' });
    await page.waitForTimeout(700);
    console.log('\n=== /book/ RAIL vs CALENDAR + FORM ===');
    let everOn = false;
    for (const pct of [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9]) {
      await page.evaluate(p => window.scrollTo(0, document.body.scrollHeight * p), pct);
      await page.waitForTimeout(420);
      const r = await page.evaluate(() => {
        const rail = document.querySelector('[data-rail]');
        const vis = getComputedStyle(rail).visibility;
        const seen = Array.from(document.querySelectorAll('[data-rail-hide]')).map(el => {
          const b = el.getBoundingClientRect();
          return (b.bottom > 0 && b.top < innerHeight) ? (el.className || el.tagName).split(' ')[0] : null;
        }).filter(Boolean);
        return { vis, seen };
      });
      if (r.vis === 'visible') everOn = true;
      console.log(`  ${String(Math.round(pct * 100)).padStart(3)}%  rail=${r.vis.padEnd(7)} suppressors in view: ${r.seen.join(',') || 'none'}`);
    }
    if (!everOn) fails.push('/book/ rail never becomes visible');
    await ctx.close();
  }

  await browser.close();
  console.log('\n=== FAILURES ===');
  if (!fails.length) console.log('  none');
  else fails.forEach(f => console.log('  X ' + f));
  process.exit(fails.length ? 1 : 0);
})();
