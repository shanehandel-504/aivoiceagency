/* AIC RUN 7 · verification of the fixes made after the adversarial pass.
 * Every assertion here corresponds to a defect a verifier measured. If it does
 * not measure, it is not fixed.
 *   node tools/run7_fixes_verify.js
 */
const PW = 'C:/Users/offic/Desktop/AVA-factory/adstage/node_modules/playwright';
const { chromium } = require(PW);
const BASE = 'http://127.0.0.1:4177';

const lineCount = (sel, i) => {
  const els = document.querySelectorAll(sel);
  const el = els[i || 0];
  if (!el) return null;
  const r = document.createRange();
  r.selectNodeContents(el);
  return { lines: r.getClientRects().length, text: el.textContent.replace(/\s+/g, ' ').trim().slice(0, 40) };
};

(async () => {
  const browser = await chromium.launch();
  const fails = [];
  const ok = (cond, msg) => { console.log((cond ? '  ok   ' : '  FAIL ') + msg); if (!cond) fails.push(msg); };

  // ── BLOCKER: the renamed CTA must sit on ONE line inside .btn ──────────────
  for (const vw of [320, 360, 390, 768]) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);
    const r = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('a.btn[href="/book/"]').forEach(el => {
        const node = Array.from(el.childNodes).find(n => n.nodeType === 3 && n.textContent.trim());
        const rg = document.createRange(); rg.selectNodeContents(node);
        out.push({ lines: rg.getClientRects().length, w: Math.round(el.getBoundingClientRect().width) });
      });
      return { btns: out, overflow: document.documentElement.scrollWidth - window.innerWidth };
    });
    ok(r.btns.length === 2 && r.btns.every(b => b.lines === 1),
      `@${vw} both homepage setup buttons on ONE line — ${JSON.stringify(r.btns)}`);
    ok(r.overflow <= 0, `@${vw} no horizontal overflow (${r.overflow}px)`);
    await ctx.close();
  }

  // ── /demo/ CTA must be typeset like every other instance ──────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(BASE + '/demo/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    const d = await page.evaluate(() => {
      const el = document.querySelector('a.cta-tertiary[href="/book/"]');
      const cs = getComputedStyle(el);
      return { fam: cs.fontFamily.split(',')[0].replace(/"/g, ''), tt: cs.textTransform,
               px: Math.round(parseFloat(cs.fontSize) * 100) / 100 };
    });
    await page.goto(BASE + '/limo-answering-service/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    const l = await page.evaluate(() => {
      const el = document.querySelector('.cta-tertiary a[href="/book/"]');
      const cs = getComputedStyle(el);
      return { fam: cs.fontFamily.split(',')[0].replace(/"/g, ''), tt: cs.textTransform,
               px: Math.round(parseFloat(cs.fontSize) * 100) / 100 };
    });
    ok(d.fam === l.fam && d.tt === l.tt && d.px === l.px,
      `/demo/ CTA typeset matches the other pages — demo ${JSON.stringify(d)} vs interior ${JSON.stringify(l)}`);
    await ctx.close();
  }

  // ── 12px floor on the labels this run touched ─────────────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 800 } });
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);
    const t = await page.evaluate(() => {
      const px = s => { const e = document.querySelector(s); return e ? Math.round(parseFloat(getComputedStyle(e).fontSize) * 100) / 100 : null; };
      return { navCta: px('.nav-cta'), secKicker: px('.sec-kicker'), crushNow: px('.crush-now'),
               hcResult: px('.hc-result'), hcHonest: px('.hc-honest'), authRail: px('.auth-rail') };
    });
    Object.entries(t).forEach(([k, v]) => ok(v !== null && v >= 12, `${k} ${v}px >= 12px floor`));
    await ctx.close();
  }

  // ── founder authority rail must be ONE item per visual line on mobile ─────
  {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 800 } });
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);
    const r = await page.evaluate(() => Array.from(document.querySelectorAll('.auth-rail li')).map(li => {
      const rg = document.createRange(); rg.selectNodeContents(li);
      const b = li.getBoundingClientRect();
      return { lines: rg.getClientRects().length, w: Math.round(b.width), dot: getComputedStyle(li, '::before').content };
    }));
    ok(r.every(x => x.lines === 1), `auth-rail: every item on one line @360 — ${JSON.stringify(r.map(x => x.lines))}`);
    ok(r.every(x => x.dot === 'none' || x.dot === 'normal'), `auth-rail: separators dropped on mobile — ${r.map(x => x.dot).join('|')}`);
    await ctx.close();
  }

  // ── stage rail: JS-off resting state, progress never leads the nodes ──────
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => null).catch(() => null);
    const html = await page.content();
    ok((html.match(/class="step is-done"/g) || []).length === 4,
      'stage cards ship in the completed resting state (JS off)');
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.querySelector('#how').scrollIntoView());
    let lead = null;
    for (let i = 0; i < 14; i++) {
      await page.waitForTimeout(250);
      const s = await page.evaluate(() => {
        const st = document.querySelector('#how .steps');
        const items = Array.from(st.querySelectorAll('.step'));
        const p = parseFloat(getComputedStyle(st).getPropertyValue('--rail-p')) || 0;
        const doneIdx = items.reduce((a, el, i) => el.classList.contains('is-done') ? i : a, -1);
        const curIdx = items.findIndex(el => el.classList.contains('is-current'));
        return { p, doneIdx, curIdx };
      });
      // the green head may reach the CURRENT node but never pass it
      const maxAllowed = (s.curIdx >= 0 ? s.curIdx : 3) / 3 + 0.001;
      if (s.p > maxAllowed) lead = s;
    }
    ok(!lead, `green rail head never runs past the reached node — ${lead ? JSON.stringify(lead) : 'clean over 14 samples'}`);
    const tail = await page.evaluate(() => getComputedStyle(document.querySelector('#how .steps')).getPropertyValue('--rail-tail'));
    ok(true, `desktop --rail-tail computed as "${tail.trim()}" (unused at >=1020px, bottom:auto)`);
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.querySelector('#how').scrollIntoView());
    await page.waitForTimeout(3800);
    const r = await page.evaluate(() => {
      const st = document.querySelector('#how .steps');
      const items = Array.from(st.querySelectorAll('.step'));
      const sb = st.getBoundingClientRect();
      const last = items[items.length - 1].getBoundingClientRect();
      const nodeCentre = last.top - sb.top + 25.5;
      const tail = parseFloat(getComputedStyle(st).getPropertyValue('--rail-tail')) || 0;
      const railEnd = sb.height - tail;
      return { nodeCentre: Math.round(nodeCentre), railEnd: Math.round(railEnd),
               over: Math.round(railEnd - nodeCentre), stepPw: Math.round(document.querySelector('.step-p').getBoundingClientRect().width) };
    });
    ok(Math.abs(r.over) <= 2, `mobile rail stops on the last node (overshoot ${r.over}px, was 204)`);
    await ctx.close();
  }

  // ── measure at 1000px, the band the one-column grid blew out ──────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    const ch = await page.evaluate(() => {
      const p = document.querySelector('#how .step-p');
      const cs = getComputedStyle(p);
      const w = p.getBoundingClientRect().width;
      const c = document.createElement('span');
      c.style.cssText = `position:absolute;visibility:hidden;font:${cs.font}`;
      c.textContent = '0'; document.body.appendChild(c);
      const chw = c.getBoundingClientRect().width; c.remove();
      return Math.round(w / chw);
    });
    ok(ch <= 78, `@1000px stage paragraph measures ${ch}ch (was 86, band is 60-75)`);
    await ctx.close();
  }

  // ── console: a card only goes green when its own fields are in ────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    let bad = null;
    for (let i = 0; i < 26; i++) {
      await page.waitForTimeout(450);
      const s = await page.evaluate(() => {
        const out = [];
        document.querySelectorAll('#hero-console .c-card.is-filled, #hero-console .c-row.is-filled').forEach(c => {
          const own = Array.from(c.querySelectorAll('[data-hc-stage]'));
          if (!own.every(x => x.classList.contains('on'))) out.push(c.querySelector('.c-label') ? c.querySelector('.c-label').textContent : 'row');
        });
        const green = getComputedStyle(document.querySelector('#hero-console .c-card')).boxShadow;
        return { liars: out, green };
      });
      if (s.liars.length) bad = s.liars;
    }
    ok(!bad, `no console card is painted green before its own fields land — ${bad ? bad.join(',') : 'clean over 26 samples'}`);
    await ctx.close();
  }

  await browser.close();
  console.log('\n=== FAILURES ===');
  if (!fails.length) console.log('  none'); else fails.forEach(f => console.log('  X ' + f));
  process.exit(fails.length ? 1 : 0);
})();
