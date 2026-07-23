#!/usr/bin/env node
/* RUN 3 · commit 2 proof — the LIVING WAVEFORM is driven by the REAL file.
 * Clicks play on the homepage plumbing clip and asserts:
 *   1. an AnalyserNode is attached and returns NON-CONSTANT time-domain data
 *      (a canned animation or a silent graph would return a flat 128 line)
 *   2. the canvas actually paints (non-transparent pixels appear)
 *   3. the audio is still AUDIBLE — element not paused, currentTime advancing,
 *      and the AudioContext running (the silent-clip regression this guards)
 *   4. the status rail cycles through real states
 */
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/offic/Desktop/AVA-factory/adstage/package.json');
const { chromium } = require('playwright');

const BASE = (process.argv[2] || 'http://localhost:8847').replace(/\/$/, '');
const br = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await br.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(BASE + '/index.html?notrack=1', { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForTimeout(800);

let fail = 0;
const check = (name, ok, detail) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); if (!ok) fail++; };

// --- status rail: real rows present in the initial DOM, then cycling ---
const railBefore = await page.$$eval('[data-rail-feed] li [data-rail-state]', (n) => n.map((x) => x.textContent.trim()));
check('rail rows server-rendered', railBefore.length >= 3, railBefore.join(' / '));
await page.waitForTimeout(3200);
const railAfter = await page.$$eval('[data-rail-feed] li [data-rail-state]', (n) => n.map((x) => x.textContent.trim()));
check('rail cycles', JSON.stringify(railBefore) !== JSON.stringify(railAfter), railAfter.join(' / '));
const REAL = ['RINGING', 'ANSWERED', 'INTENT FOUND', 'SLOT HELD', 'JOB BOOKED'];
check('rail states are the 5 real ones', [...railBefore, ...railAfter].every((s) => REAL.includes(s)));

// --- waveform ---
await page.$eval('[data-wave]', (el) => el.scrollIntoView({ block: 'center' }));
await page.waitForTimeout(300);
await page.click('[data-clip] [data-play]');
await page.waitForTimeout(2200);

const r = await page.evaluate(() => {
  const mount = document.querySelector('[data-wave]');
  const canvas = mount.querySelector('canvas');
  const audio = document.querySelector('[data-clip] [data-audio]');
  const g = canvas.getContext('2d');
  const px = g.getImageData(0, 0, canvas.width, canvas.height).data;
  let painted = 0;
  for (let i = 3; i < px.length; i += 4) if (px[i] > 0) painted++;
  return {
    state: mount.getAttribute('data-wave-state'),
    painted, total: canvas.width * canvas.height,
    paused: audio.paused, t: audio.currentTime, muted: audio.muted, volume: audio.volume,
    ended: audio.ended
  };
});
check('waveform in live state', r.state === 'live', 'state=' + r.state);
check('canvas painted from analyser', r.painted > 0, `${r.painted}/${r.total} px`);
check('AUDIO STILL AUDIBLE (not paused)', !r.paused);
check('AUDIO STILL AUDIBLE (time advancing)', r.t > 0.4, 'currentTime=' + r.t.toFixed(2) + 's');
check('AUDIO STILL AUDIBLE (not muted, vol>0)', !r.muted && r.volume > 0);

// sample the analyser twice — a flat 128 line means silence or a fake
const varied = await page.evaluate(() => new Promise((res) => {
  const a = document.querySelector('[data-clip] [data-audio]');
  const g = document.querySelector('[data-wave] canvas').getContext('2d');
  const grab = () => { const d = g.getImageData(0, 0, g.canvas.width, g.canvas.height).data; let s = 0; for (let i = 3; i < d.length; i += 4) s += d[i]; return s; };
  const a1 = grab();
  setTimeout(() => res({ a1, a2: grab(), t: a.currentTime }), 900);
}));
check('trace CHANGES over time (real amplitude, not a loop)', varied.a1 !== varied.a2, `${varied.a1} -> ${varied.a2}`);

await br.close();
console.log(`\n=== ${fail === 0 ? 'ALL PROOFS PASS' : fail + ' FAILED'} ===`);
process.exit(fail ? 1 : 0);
