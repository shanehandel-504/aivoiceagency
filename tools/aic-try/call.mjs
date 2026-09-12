// tools/aic-try/call.mjs — ONE real web call through /try, start to finish.
//
//   doppler run -- node tools/aic-try/call.mjs --mode prod  --wav <file.wav> [--hold 25]
//   doppler run -- node tools/aic-try/call.mjs --mode local --wav <file.wav> [--hold 25]
//   ... --expect-cap 60    the call must end ITSELF at ~60 s (the agent_override proof;
//                          publish WF-TRY-WEBCALL with max_call_duration_ms 60000 first)
//
// prod   the live page. local  chauffeur/ served as https://aichauffeur.ai, so an
//        unpushed page can be driven against the REAL published webhook.
// Both   the page solves the real proof of work, n8n creates the call, and a fake
//        microphone plays the WAV. Afterwards GET /v2/get-call/{id} must show
//        call_type web_call, a PUBLISHED agent version, metadata.source, and at
//        least one agent turn AND one user turn. Every run spends one of this
//        machine's three attempts per hour. Never speak a real number in the WAV.

import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium, SITE, REPO, serveLocal, WEBHOOK_URL, STATE_RECORDER, retellGet } from './lib.mjs';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const MODE = arg('--mode', 'prod');
const WAV = arg('--wav');
const HOLD = Number(arg('--hold', '25'));
const EXPECT_CAP = process.argv.includes('--expect-cap') ? Number(arg('--expect-cap')) : null;
if (!['local', 'prod'].includes(MODE) || !WAV) { console.error('usage: --mode prod|local --wav <file.wav> [--hold 25] [--expect-cap 60]'); process.exit(2); }
if (!process.env.RETELL_API_KEY) { console.error('RUN INCOMPLETE — RETELL_API_KEY missing (run under doppler)'); process.exit(2); }

const OUT = path.join(REPO, 'audits', 'aic-try');
await mkdir(OUT, { recursive: true });
const mask = (s) => String(s || '').replace(/\d[\d\s().-]{5,}\d/g, '[digits]');
let failed = 0;
const check = (ok, label, detail = '') => { if (!ok) failed++; console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`); };

const browser = await chromium.launch({
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream',
    `--use-file-for-fake-audio-capture=${WAV}`, '--autoplay-policy=no-user-gesture-required'],
});
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
await context.grantPermissions(['microphone'], { origin: SITE });
if (MODE === 'local') await serveLocal(context);
await context.addInitScript(STATE_RECORDER);
const page = await context.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
page.on('pageerror', (e) => errors.push('pageerror: ' + String(e.message).slice(0, 200)));
let created = null, challengeMs = 0, tChallenge = 0;
page.on('request', (r) => { if (WEBHOOK_URL.test(r.url()) && /step=challenge/.test(r.postData() || '')) tChallenge = Date.now(); });
page.on('response', async (r) => {
  // The receipt endpoint lives on the same host under the same /webhook/ path,
  // so it matches WEBHOOK_URL too. Without this line the LAST receipt poll
  // overwrites `created` and the run ends claiming it never got a call_id.
  if (!WEBHOOK_URL.test(r.url()) || /\/webhook\/try\/receipt/.test(r.url())) return;
  try {
    const j = await r.json();
    if (j.nonce) { challengeMs = Date.now() - tChallenge; return; }
    // THE FIRST CREATE IS THE ONE THIS RUN IS ABOUT. The second push is
    // deliberately refused with a 429 to prove the reset without opening another
    // call, and letting that refusal overwrite this made the run end with
    // "no call_id" for a call it had just finished making.
    if (created && created.call_id) return;
    created = { status: r.status(), call_id: j.call_id || null, keys: Object.keys(j).sort(), error: j.error || null };
  } catch { if (!(created && created.call_id)) created = { status: r.status(), call_id: null }; }
});

// The button breathes, so page.click() waits forever for a "stable" bounding
// box that never comes. A finger does not wait; hit testing uses the live
// transform. Drive the real mouse instead — which also pauses the breathing,
// exactly as a pointer arriving on the control does.
async function push() {
  const b = await page.evaluate(async () => {
    const el = document.getElementById('try-btn');
    // AFTER A CALL THE PAGE IS TALLER AND THE BUTTON CAN BE OFF SCREEN, so it
    // is scrolled back into view before being measured.
    //
    // 'instant' IS LOAD-BEARING. aic.css sets html{scroll-behavior:smooth}, and
    // behavior:'auto' means "use the CSS value" — so this scroll ANIMATED, the
    // rect was read while it was still moving, and the click landed on empty
    // space. It reported as "the second push did not clear the card": a missed
    // click wearing the costume of a broken feature. A short page finished the
    // animation inside the wait and passed; the tall post-call page did not.
    el.scrollIntoView({ block: 'center', behavior: 'instant' });
    await new Promise((f) => setTimeout(f, 250));
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  });
  await page.evaluate(() => { window.__pushes = 0; document.getElementById('try-btn').addEventListener('click', () => { window.__pushes++; }, { capture: true, once: true }); });
  await page.mouse.move(b.x, b.y);
  await page.waitForTimeout(80);
  await page.mouse.down();
  await page.mouse.up();
  // A push that never reached the control must never be reported as a feature
  // that did not work. This is the assertion that separates the two.
  return await page.evaluate(() => window.__pushes || 0);
}

console.log(`/try live call — ${MODE.toUpperCase()}${EXPECT_CAP ? ` (must end itself at ~${EXPECT_CAP}s)` : ` (hold ${HOLD}s)`}\n`);
await page.goto(`${SITE}/try/`, { waitUntil: 'load' });
await page.waitForTimeout(6000); // the nonce is fetched and solved while we wait
const preArmed = await page.evaluate(() => performance.getEntriesByType('resource')
  .filter((e) => /circulant\.app\.n8n\.cloud\/webhook\//.test(e.name)).length);
check(preArmed >= 1, 'the puzzle was solved BEFORE the push', `${preArmed} webhook request(s) before the tap`);
const tStart = Date.now();
await push();

const waitState = (s, ms) => page.waitForFunction((x) => document.getElementById('try-tag').dataset.state === x, s, { timeout: ms }).then(() => true).catch(() => false);
const wentLive = await waitState('live', 90000);
console.log(`  create: ${JSON.stringify(created)}`);
check(wentLive, 'call went LIVE', `${Math.round((Date.now() - tStart) / 1000)}s after tap, proof took ${challengeMs ? Math.round(challengeMs / 100) / 10 + 's' : 'n/a'}`);

let meterPeak = 0;
if (wentLive) {
  const tLive = Date.now();
  const sampler = setInterval(async () => {
    const v = await page.evaluate(() => Math.max(...[...document.querySelectorAll('#try-meter i')].map((i) => {
      const m = /scaleY\(([\d.]+)\)/.exec(i.style.transform || ''); return m ? Number(m[1]) : 0.08; }))).catch(() => 0);
    meterPeak = Math.max(meterPeak, v);
  }, 400);
  await page.waitForTimeout(8000);
  await page.screenshot({ path: path.join(OUT, `call-${MODE}-live-390.png`) });

  // DURING THE CALL. The thread is reported, not asserted: Retell allocates
  // these calls its GATEWAY transport, whose data channel delivers no
  // transcript events, so the live `update` listener draws nothing and the
  // words arrive with the receipt instead. If a call is ever allocated the
  // livekit transport this prints turns here, and that is worth seeing.
  const liveThread = await page.evaluate(() => ({
    turns: document.querySelectorAll('#try-turns .try-turn').length,
    focus: document.querySelector('.try').dataset.focus,
    dim: getComputedStyle(document.querySelector('.try-tell')).opacity,
  }));
  console.log(`  live thread during the call: ${liveThread.turns} turn(s) (0 is expected on the gateway transport)`);
  check(liveThread.focus === 'true' && liveThread.dim === '0.63', 'focus mode is on while live', `focus ${liveThread.focus}, surround ${liveThread.dim}`);

  if (!EXPECT_CAP) {
    await page.waitForTimeout(Math.max(0, HOLD * 1000 - 8000));
    await push();
  }
  const endedOk = await waitState('ended', EXPECT_CAP ? EXPECT_CAP * 1000 + 45000 : 15000);
  clearInterval(sampler);
  await page.screenshot({ path: path.join(OUT, `call-${MODE}-ended-390.png`) });
  check(endedOk, 'call reached ENDED', `live for ~${Math.round((Date.now() - tLive) / 1000)}s`);
  check(meterPeak > 0.3, 'the AGENT meter moved with the voice on the line', `peak scale ${meterPeak.toFixed(2)}`);
  check(await page.evaluate(() => document.querySelector('.try').dataset.focus === 'false'), 'focus mode released on ENDED');

  // THE TRIP SHEET. The page polls for 45s; give it 50 and then read what it put
  // on screen, which is the only thing a visitor ever sees of the receipt.
  const receiptReqs = [];
  page.on('response', (r) => { if (/\/webhook\/try\/receipt/.test(r.url())) receiptReqs.push(r.status()); });
  await page.waitForTimeout(52000);
  const sheet = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('#try-rows dt')].map((dt, i) => dt.textContent + '=' + (dt.nextElementSibling || {}).textContent);
    return {
      resultShown: !document.getElementById('try-result').hidden,
      building: !document.getElementById('try-building').hidden,
      card: !document.getElementById('try-ticket').hidden,
      rows,
      texted: !document.getElementById('try-texted').hidden,
      player: !document.getElementById('try-player').hidden,
      audio: (document.getElementById('try-audio').getAttribute('src') || '').slice(0, 48),
      note: document.getElementById('try-rnote').textContent,
      turns: document.querySelectorAll('#try-turns .try-turn').length,
      roles: [...document.querySelectorAll('#try-turns .try-turn')].map((t) => (t.className.match(/try-turn--(\w+)/) || [])[1]),
      marks: [...document.querySelectorAll('#try-turns .try-turn-t')].map((t) => t.textContent),
      lines: [...document.querySelectorAll('#try-turns .try-turn-s')].map((t) => t.textContent),
      emptyHidden: document.getElementById('try-empty').hidden,
    };
  });
  check(sheet.turns >= 2, 'the transcript thread filled after the call', `${sheet.turns} turn(s): ${sheet.roles.join(',')}`);
  check(sheet.emptyHidden === true, 'and the empty state stepped aside');
  check(sheet.marks.every((m) => m === 'YOU' || m === 'AGENT' || /^\d\d:\d\d$/.test(m)), 'every turn is marked with who spoke or when', sheet.marks.join(','));
  check(new Set(sheet.roles).size === 2, 'both sides of the conversation are on screen', [...new Set(sheet.roles)].join(','));
  const said = sheet.lines.join(' ');
  check(!/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(said), 'no email survived into the thread');
  check(!/(?:\d[\s().-]*){7,}\d/.test(said), 'no phone-length digit run survived into the thread');
  sheet.lines.slice(0, 3).forEach((l, i) => console.log(`  turn ${i + 1}: ${mask(l).slice(0, 88)}`));
  check(sheet.resultShown, 'the result region opened after the call');
  check(!sheet.building, 'and stopped saying it was still putting the sheet together');
  check(sheet.card || !!sheet.note, 'either a trip sheet or an honest line about why there is none',
    sheet.card ? `card with ${sheet.rows.length} rows` : `note: "${sheet.note}"`);
  if (sheet.card) console.log(`  rows: ${sheet.rows.join(' · ')}`);
  check(sheet.player || /still processing/.test(sheet.note), 'either the player or the processing line', sheet.player ? `audio ${sheet.audio}` : sheet.note);
  check(receiptReqs.length > 0 && receiptReqs.every((s) => s === 200 || s === 404), 'every receipt poll answered cleanly', receiptReqs.join(','));
  await page.screenshot({ path: path.join(OUT, `call-${MODE}-sheet-390.png`), fullPage: true });

  // THE SHARE LINK, and then a SECOND PUSH clearing everything the first left.
  const copied = await page.evaluate(async () => {
    document.getElementById('try-share').click();
    await new Promise((f) => setTimeout(f, 300));
    return { label: document.getElementById('try-share').textContent, msg: document.getElementById('try-share-copied').textContent };
  });
  check(/Copied|Press and hold/.test(copied.label + copied.msg), 'the copy-link control responded', JSON.stringify(copied));

  // The call itself is over. Judge the state sequence and the console on what
  // happened UP TO HERE: everything after this point is a refusal this run asks
  // for on purpose, and it writes both a 429 in the console and two more states.
  {
    const seq = (await page.evaluate(() => window.__states.map((x) => x.s))).filter((s, i, a) => s !== a[i - 1]);
    check(JSON.stringify(seq) === JSON.stringify(['ready', 'connecting', 'live', 'ended']),
      'status sequence READY → CONNECTING → LIVE → ENDED', seq.join(' → '));
    check(errors.length === 0, 'zero console / page errors during the call', errors.slice(0, 4).join(' | '));
  }

  const before = await page.evaluate(() => document.querySelectorAll('#try-turns .try-turn').length);
  // The second push must clear the first call's record. It must NOT open a
  // second call: the reset runs on the click itself, so refusing the create
  // proves the clearing without spending another of this machine's three
  // attempts an hour, or leaving a stray call on the account.
  await context.route(WEBHOOK_URL, (route) => route.fulfill({
    status: 429, contentType: 'application/json',
    headers: { 'access-control-allow-origin': SITE, 'cache-control': 'no-store' },
    body: '{"error":"rate_limited"}',
  }));
  const landed = await push();
  check(landed > 0, 'the second push actually reached the button', `${landed} click(s) registered`);
  await page.waitForTimeout(1200);
  const after = await page.evaluate(() => ({
    turns: document.querySelectorAll('#try-turns .try-turn').length,
    result: document.getElementById('try-result').hidden,
    card: document.getElementById('try-ticket').hidden,
    player: document.getElementById('try-player').hidden,
    audio: document.getElementById('try-audio').getAttribute('src'),
  }));
  check(after.turns === 0 && after.result && after.card && after.player && !after.audio,
    'a SECOND push cleared the card, the player and the thread', `was ${before} turn(s); now ${JSON.stringify(after)}`);
}

// The sequence and the console were judged above, before the deliberate refusal.
// What is left to confirm here is that the refusal landed where it was aimed:
// the run must end on 'failed', not on a second live call.
const states = await page.evaluate(() => window.__states.map((x) => x.s));
const seq = states.filter((s, i) => s !== states[i - 1]);
check(seq[seq.length - 1] === 'failed' || seq.length === 4,
  'the refused second push ended on NOT CONNECTED and opened no second call', seq.join(' → '));
if (created) check(JSON.stringify(created.keys) === JSON.stringify(['access_token', 'call_id', 'ice_servers', 'transport']) || JSON.stringify(created.keys) === JSON.stringify(['access_token', 'call_id', 'ice_servers', 'transport', 'url']), 'the webhook returned only the browser fields', created.keys.join(','));
await browser.close();

// ── the call record ─────────────────────────────────────────────────────────
const id = created && created.call_id;
if (!id) { console.log('\nRUN INCOMPLETE — no call_id (webhook answered ' + JSON.stringify(created) + ')'); process.exit(1); }
let call = null;
for (let i = 0; i < 24; i++) {
  const r = await retellGet(`/v2/get-call/${encodeURIComponent(id)}`);
  if (r.ok && r.body.call_status === 'ended' && Array.isArray(r.body.transcript_object)) { call = r.body; break; }
  await new Promise((f) => setTimeout(f, 5000));
}
if (!call) { console.log('\nRUN INCOMPLETE — call record never finalised for ' + id); process.exit(1); }
const turns = call.transcript_object || [];
const agentTurns = turns.filter((t) => t.role === 'agent'), userTurns = turns.filter((t) => t.role === 'user');
const durS = Math.round(((call.end_timestamp || 0) - (call.start_timestamp || 0)) / 1000);
const pub = await retellGet(`/get-agent/${call.agent_id}?version=${call.agent_version}`);

console.log(`\nCALL ${id}`);
console.log(`  call_type ${call.call_type} · agent ${call.agent_id} v${call.agent_version} · status ${call.call_status} · ${durS}s · disconnect ${call.disconnection_reason}`);
console.log(`  metadata ${JSON.stringify(call.metadata || {})}`);
console.log(`  first agent line: ${mask((agentTurns[0] || {}).content).slice(0, 140)}`);
console.log(`  first user line:  ${mask((userTurns[0] || {}).content).slice(0, 140)}`);
check(call.call_type === 'web_call', 'call_type web_call');
check(call.agent_id === 'agent_2d1d687eb85e6d5d0e720795c2', 'the (414) 775-0019 agent');
check(pub.ok && pub.body.is_published === true, 'agent_version is a PUBLISHED version', `v${call.agent_version}`);
check((call.metadata || {}).source === 'aichauffeur.ai/try', 'metadata.source = aichauffeur.ai/try');
check(agentTurns.length >= 1 && userTurns.length >= 1, 'transcript has an agent turn AND a user turn', `agent ${agentTurns.length} · user ${userTurns.length}`);
if (EXPECT_CAP) {
  check(Math.abs(durS - EXPECT_CAP) <= 12, 'the call ended itself at the cap (agent_override works)', `${durS}s vs cap ${EXPECT_CAP}s`);
  check(/max_duration/i.test(String(call.disconnection_reason)), 'disconnect reason names the duration cap', String(call.disconnection_reason));
}
console.log(`\n${failed ? 'FAIL — ' + failed + ' check(s)' : 'ALL CHECKS PASS'}`);
process.exit(failed ? 1 : 0);
