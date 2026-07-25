#!/usr/bin/env node
/* RUN 4 · BACKSTAGE 2.0 — the component gate.
 * Asserts, against a real headless render at 390x844:
 *   1. FINAL STATE present in RAW HTML (no JS) — a no-JS visitor gets the story
 *   2. autoplay-once guard — a second 60% entry must not replay
 *   3. offscreen pause/resume — resumes where it stopped, never restarts
 *   4. replay idempotent — two replays land on the identical locked DOM
 *   5. roster tap targets >= 44px
 *   6. component <= 680px @390 (closed AND roster-open)
 *   7. reduced-motion path lands on the final locked state with no animation
 *   8. green CTA count <= 1 page-wide
 *   9. ZERO timer / waveform / playhead visible in ANY summary state
 *  10. AA >= 4.5:1 on every text node inside the component, both themes
 *
 * Usage: node tools/feed-verify.mjs [baseUrl]
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire('C:/Users/offic/Desktop/AVA-factory/adstage/package.json');
const { chromium } = require('playwright');

const BASE = (process.argv[2] || 'http://localhost:8847').replace(/\/$/, '');
const URL_ = BASE + '/index.html?notrack=1';

let fails = [];
const ok   = (n, extra = '') => console.log(`ok   ${n}${extra ? '  (' + extra + ')' : ''}`);
const bad  = (n, why) => { fails.push(n); console.log(`FAIL ${n}\n       ${why}`); };

const br = await chromium.launch();

/* ---------- 1 · FINAL STATE IN RAW HTML (JS disabled) --------------------- */
{
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 45000 });
  const r = await page.evaluate(() => {
    const fd = document.querySelector('[data-feed]');
    if (!fd) return { missing: true };
    const vis = (el) => { if (!el) return false; const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
    return {
      state: fd.getAttribute('data-state'),
      chip: (fd.querySelector('[data-chip]') || {}).textContent || '',
      chipVisible: vis(fd.querySelector('[data-chip]')),
      phasesDone: fd.querySelectorAll('.fd-phase.is-done').length,
      phasesTotal: fd.querySelectorAll('.fd-phase').length,
      outcomeVisible: vis(fd.querySelector('[data-outcome]')),
      outcome: (fd.querySelector('[data-outcome]') || {}).textContent || '',
      ctas: [...fd.querySelectorAll('.fd-cta')].filter(vis).length,
      deepLink: !!fd.querySelector('a[href="/backstage/"]'),
      disclosure: /Disclosed scripted sample/.test(fd.textContent),
    };
  });
  await ctx.close();
  if (r.missing) bad('1 raw-HTML final state', 'no [data-feed] component found');
  else if (r.phasesDone !== 4 || r.phasesTotal !== 4) bad('1 raw-HTML final state', `phases done ${r.phasesDone}/${r.phasesTotal}, need 4/4`);
  else if (!/JOB BOOKED/.test(r.chip) || !r.chipVisible) bad('1 raw-HTML final state', 'result chip missing or invisible without JS');
  else if (!r.outcomeVisible) bad('1 raw-HTML final state', 'outcome strip not visible without JS');
  else if (r.ctas < 2) bad('1 raw-HTML final state', `only ${r.ctas} CTAs visible without JS, need >=2`);
  else if (!r.deepLink) bad('1 raw-HTML final state', 'no /backstage/ deep link');
  else if (!r.disclosure) bad('1 raw-HTML final state', 'disclosure line missing');
  else ok('1 raw-HTML final state', `4/4 phases · chip · outcome · ${r.ctas} CTAs · deep link · disclosure`);
}

/* helper: fresh page scrolled so the component is >=60% in view */
async function open(opts = {}) {
  const ctx = await br.newContext({
    viewport: { width: opts.w || 390, height: opts.h || 844 },
    reducedMotion: opts.reduced ? 'reduce' : 'no-preference',
    colorScheme: 'dark',
  });
  if (opts.light) await ctx.addInitScript(() => { try { localStorage.setItem('bs-theme', 'light'); } catch (e) {} });
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: 'networkidle', timeout: 45000 });
  return { ctx, page };
}
const bring = (page) => page.evaluate(() => new Promise((res) => {
  document.querySelector('[data-feed]').scrollIntoView({ block: 'center' });
  setTimeout(res, 300);
}));
const st = (page) => page.evaluate(() => document.querySelector('[data-feed]').getAttribute('data-state'));

/* ---------- 2 · autoplay-once guard --------------------------------------- */
{
  const { ctx, page } = await open();
  await bring(page);
  await page.waitForTimeout(9500);
  const first = await st(page);
  // scroll far away and back — must NOT replay
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  await bring(page);
  await page.waitForTimeout(900);
  const second = await st(page);
  await ctx.close();
  if (first !== 'summary-locked') bad('2 autoplay-once', `first pass ended in "${first}", expected summary-locked`);
  else if (second !== 'summary-locked') bad('2 autoplay-once', `re-entry replayed: state became "${second}"`);
  else ok('2 autoplay-once', 'locked, and re-entry did not replay');
}

/* ---------- 3 · offscreen pause / resume (never restart) ------------------ */
{
  const { ctx, page } = await open();
  await bring(page);
  await page.waitForTimeout(3200);                       // mid-play
  const midDone = await page.evaluate(() => document.querySelector('[data-feed]').querySelectorAll('.fd-phase.is-in').length);
  await page.evaluate(() => window.scrollTo(0, 0));      // offscreen
  await page.waitForTimeout(700);
  const paused = await st(page);
  const afterPauseDone = await page.evaluate(() => document.querySelector('[data-feed]').querySelectorAll('.fd-phase.is-in').length);
  await bring(page);                                      // back
  await page.waitForTimeout(400);
  const resumedDone = await page.evaluate(() => document.querySelector('[data-feed]').querySelectorAll('.fd-phase.is-in').length);
  await ctx.close();
  if (paused !== 'offscreen-paused') bad('3 offscreen pause/resume', `state was "${paused}", expected offscreen-paused`);
  else if (afterPauseDone !== midDone) bad('3 offscreen pause/resume', `phases kept arriving while offscreen (${midDone} -> ${afterPauseDone})`);
  else if (resumedDone < midDone) bad('3 offscreen pause/resume', `RESTARTED instead of resuming (${midDone} -> ${resumedDone})`);
  else ok('3 offscreen pause/resume', `paused at ${midDone} rows, resumed to ${resumedDone}`);
}

/* ---------- 4 · replay idempotent ----------------------------------------- */
{
  const { ctx, page } = await open();
  await bring(page);
  await page.waitForTimeout(9200);
  const snap = async () => {
    await page.click('[data-replay]');
    await page.waitForTimeout(9200);
    return page.evaluate(() => {
      const fd = document.querySelector('[data-feed]');
      return [fd.getAttribute('data-state'),
              fd.querySelectorAll('.fd-phase.is-done').length,
              (fd.querySelector('[data-status]') || {}).textContent,
              (fd.querySelector('[data-more]') || {}).textContent].join('|');
    });
  };
  const a = await snap();
  const b = await snap();
  await ctx.close();
  if (a !== b) bad('4 replay idempotent', `two replays diverged:\n         A=${a}\n         B=${b}`);
  else if (!/summary-locked\|4\|/.test(a)) bad('4 replay idempotent', `replay did not reach a clean lock: ${a}`);
  else ok('4 replay idempotent', a.replace(/\|/g, ' · '));
}

/* ---------- 5+6 · tap targets and the 680px height law -------------------- */
{
  const { ctx, page } = await open();
  await bring(page);
  await page.waitForTimeout(9200);
  const closed = await page.evaluate(() => Math.round(document.querySelector('[data-feed]').getBoundingClientRect().height));
  await page.click('[data-expand]');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const fd = document.querySelector('[data-feed]');
    const small = [...fd.querySelectorAll('.fd-agent, .fd-cta')]
      .map((e) => ({ t: (e.textContent || '').trim().slice(0, 24), h: Math.round(e.getBoundingClientRect().height) }))
      .filter((x) => x.h < 44);
    return {
      open: Math.round(fd.getBoundingClientRect().height),
      small,
      phasesHidden: getComputedStyle(fd.querySelector('.fd-phases')).display === 'none',
      stripShown: getComputedStyle(fd.querySelector('.fd-strip')).display !== 'none',
      state: fd.getAttribute('data-state'),
    };
  });
  await ctx.close();
  if (closed > 680) bad('6 height law (closed)', `${closed}px > 680px`); else ok('6 height law (closed)', `${closed}px`);
  if (r.open > 680) bad('6 height law (roster open)', `${r.open}px > 680px`); else ok('6 height law (roster open)', `${r.open}px`);
  if (!r.phasesHidden || !r.stripShown) bad('6 phase collapse', 'roster opened but the 4 phase rows did not collapse to the strip');
  else ok('6 phase collapse', `phases -> "4 phases complete" strip · state ${r.state}`);
  if (r.small.length) bad('5 tap targets >=44px', r.small.map((x) => `"${x.t}" ${x.h}px`).join(', '));
  else ok('5 tap targets >=44px');
}

/* ---------- 6b · the height law also binds AUDIO mode --------------------- */
{
  const { ctx, page } = await open();
  await bring(page);
  await page.waitForTimeout(9200);
  await page.click('[data-hear]');
  await page.waitForTimeout(2600);
  const r = await page.evaluate(() => {
    const fd = document.querySelector('[data-feed]');
    return { h: Math.round(fd.getBoundingClientRect().height), state: fd.getAttribute('data-state') };
  });
  await page.click('[data-expand]');
  await page.waitForTimeout(500);
  const rosterPlay = await page.evaluate(() => {
    const fd = document.querySelector('[data-feed]');
    return { h: Math.round(fd.getBoundingClientRect().height), state: fd.getAttribute('data-state') };
  });
  await ctx.close();
  if (!/^audio/.test(r.state)) bad('6b height law (audio)', `never reached audio mode, state "${r.state}"`);
  else if (r.h > 680) bad('6b height law (audio)', `${r.h}px > 680px in ${r.state}`);
  else ok('6b height law (audio)', `${r.h}px in ${r.state}`);
  if (rosterPlay.h > 680) bad('6b height law (roster during play)', `${rosterPlay.h}px > 680px in ${rosterPlay.state}`);
  else ok('6b height law (roster during play)', `${rosterPlay.h}px in ${rosterPlay.state}`);
}

/* ---------- 7 · reduced-motion path --------------------------------------- */
{
  const { ctx, page } = await open({ reduced: true });
  await bring(page);
  await page.waitForTimeout(700);
  const r = await page.evaluate(() => {
    const fd = document.querySelector('[data-feed]');
    const anim = [...fd.querySelectorAll('*')].filter((e) => {
      const a = getComputedStyle(e).animationName;
      return a && a !== 'none';
    }).length;
    return { state: fd.getAttribute('data-state'), done: fd.querySelectorAll('.fd-phase.is-done').length, anim,
             outcome: fd.querySelector('[data-outcome]').getBoundingClientRect().height > 0 };
  });
  await ctx.close();
  if (r.state !== 'reduced-motion-final') bad('7 reduced-motion', `state "${r.state}", expected reduced-motion-final`);
  else if (r.done !== 4) bad('7 reduced-motion', `${r.done}/4 phases locked`);
  else if (!r.outcome) bad('7 reduced-motion', 'outcome strip not shown');
  else if (r.anim > 0) bad('7 reduced-motion', `${r.anim} element(s) still running an animation`);
  else ok('7 reduced-motion', 'straight to final locked state, zero animations');
}

/* ---------- 8 · green CTA count page-wide --------------------------------- */
for (const theme of ['dark', 'light']) {
  const { ctx, page } = await open({ light: theme === 'light' });
  await bring(page);
  await page.waitForTimeout(9200);
  const greens = await page.evaluate(() => {
    const GREEN = ['#2ee6a8', '#0b7e56'];
    const hex = (s) => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null;
      const p = m[1].split(',').map(Number); if (p[3] !== undefined && p[3] < 0.6) return null;
      return '#' + p.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join(''); };
    const H = innerHeight, out = {};
    [...document.querySelectorAll('a,button,input[type=submit]')].forEach((e) => {
      const c = getComputedStyle(e), b = e.getBoundingClientRect();
      if (b.width < 8 || b.height < 8 || c.visibility === 'hidden' || c.display === 'none') return;
      const bg = hex(c.backgroundColor); if (!bg || !GREEN.includes(bg.toLowerCase())) return;
      const band = Math.floor((b.top + scrollY) / H);
      (out[band] = out[band] || []).push((e.textContent || '').trim().slice(0, 30));
    });
    return out;
  });
  await ctx.close();
  const worst = Math.max(0, ...Object.values(greens).map((a) => a.length));
  if (worst > 1) bad(`8 one-green-CTA (${theme})`, `${worst} green CTAs in one viewport band: ` + JSON.stringify(greens));
  else ok(`8 one-green-CTA (${theme})`, `max ${worst} per band`);
}

/* ---------- 9 · ZERO timer/waveform/playhead in summary states ------------ */
{
  const { ctx, page } = await open();
  const probe = () => page.evaluate(() => {
    const fd = document.querySelector('[data-feed]');
    const shown = (sel) => {
      const e = fd.querySelector(sel); if (!e) return false;
      const b = e.getBoundingClientRect();
      return b.width > 0 && b.height > 0 && getComputedStyle(e).visibility !== 'hidden';
    };
    return { state: fd.getAttribute('data-state'),
             timer: shown('[data-time]'), wave: shown('[data-wave]'), scrub: shown('[data-scrub]'),
             label: (fd.querySelector('[data-sumlabel]') || {}).textContent || '' };
  });
  const seen = [];
  await bring(page);
  seen.push(await probe());                       // boot / early autoplay
  await page.waitForTimeout(4000); seen.push(await probe());   // mid autoplay-summary
  await page.waitForTimeout(5500); seen.push(await probe());   // summary-locked
  await page.click('[data-expand]'); await page.waitForTimeout(400); seen.push(await probe()); // roster-open
  await page.click('[data-expand]'); await page.waitForTimeout(300);
  await page.click('[data-replay]'); await page.waitForTimeout(500); seen.push(await probe()); // replay
  await ctx.close();
  const dirty = seen.filter((s) => s.timer || s.wave || s.scrub);
  if (dirty.length) bad('9 no summary timer artifacts', dirty.map((d) => `${d.state}: timer=${d.timer} wave=${d.wave} scrub=${d.scrub}`).join(' | '));
  else ok('9 no summary timer artifacts', seen.map((s) => s.state).join(' -> '));
  const lbl = seen[2].label || '';
  if (!/summary/i.test(lbl)) bad('9 summary label', `label reads "${lbl}"`);
  else ok('9 summary label', `"${lbl.trim()}"`);
}

/* ---------- 10 · AA inside the component, both themes --------------------- */
for (const theme of ['dark', 'light']) {
  const { ctx, page } = await open({ light: theme === 'light' });
  await bring(page);
  await page.waitForTimeout(9200);
  const aa = await page.evaluate(() => {
    const fd = document.querySelector('[data-feed]');
    const hex = (s) => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null;
      const p = m[1].split(',').map(Number); if (p[3] !== undefined && p[3] < 0.6) return null;
      return '#' + p.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join(''); };
    const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const lum = (h) => { const n = parseInt(h.slice(1), 16); return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const backdrop = (el) => { for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const h = hex(getComputedStyle(n).backgroundColor); if (h) return h; }
      return hex(getComputedStyle(document.body).backgroundColor) || '#0a0a0f'; };
    const out = [];
    fd.querySelectorAll('*').forEach((e) => {
      const hasText = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
      if (!hasText) return;
      const b = e.getBoundingClientRect(); if (b.width < 1 || b.height < 1) return;
      const c = getComputedStyle(e);
      if (c.visibility === 'hidden' || c.display === 'none' || parseFloat(c.opacity) < 0.5) return;
      const fg = hex(c.color); if (!fg) return;
      const bg = backdrop(e);
      const size = parseFloat(c.fontSize), weight = parseInt(c.fontWeight) || 400;
      const need = (size >= 24 || (size >= 18.66 && weight >= 700)) ? 3.0 : 4.5;
      const got = ratio(fg, bg);
      if (got < need) out.push(`${got.toFixed(2)}:1 ${fg}/${bg} "${e.textContent.trim().slice(0, 34)}"`);
    });
    return out;
  });
  await ctx.close();
  if (aa.length) bad(`10 AA in component (${theme})`, aa.slice(0, 6).join(' | '));
  else ok(`10 AA in component (${theme})`);
}

await br.close();
console.log(`\n=== feed-verify: ${fails.length ? 'FAIL — ' + fails.join(', ') : 'ALL CHECKS CLEAN'} ===`);
process.exit(fails.length ? 1 : 0);
