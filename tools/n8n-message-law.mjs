#!/usr/bin/env node
/* ============================================================================
   tools/n8n-message-law.mjs  ·  RUN 7-CODE
   ----------------------------------------------------------------------------
   Brings every message-emitting n8n node into MESSAGE FORMAT LAW compliance
   (CLAUDE.md, "MESSAGE FORMAT LAW (Jul 28 2026)"). Every change is recorded
   old -> new and printed.

   WHAT IT ENFORCES
     · owner alerts open STATUS-LED — BOOKED / MISSED / VOICEMAIL / FOLLOW-UP
     · one canonical name, "AVA strategy call", 15 minutes
     · booking receipts carry "Hear AVA anytime: 414-240-8930."
     · SMS "Reply STOP to opt out" on FIRST TOUCH ONLY
     · no two messages in a sequence share an identical CTA sentence
     · no fabricated stats or dollar amounts; caller-facing copy never says
       "Shane"

   NOTE ON THE EMAIL FOOTERS. The law scopes the STOP rule to SMS. The drip's
   email footer keeps "Reply STOP or use the unsubscribe link to opt out" on
   every send, because a commercial email needs an unsubscribe mechanism on
   every message. Only the SMS repeats are stripped.

   USAGE:
     doppler run --project ava-prod --config prd -- node tools/n8n-message-law.mjs --audit
     doppler run --project ava-prod --config prd -- node tools/n8n-message-law.mjs --apply

   IDEMPOTENT. Build-time only; tools/ is never deployed (.vercelignore).
   ========================================================================== */

const HOST = 'https://circulant.app.n8n.cloud';
const KEY = process.env.N8N_API_KEY;
if (!KEY) { console.error('RUN INCOMPLETE — N8N KEY MISSING'); process.exit(2); }
const MODE = process.argv.includes('--apply') ? 'apply' : 'audit';

const api = async (p, o = {}) => {
  const r = await fetch(HOST + '/api/v1' + p, { ...o, headers: { 'X-N8N-API-KEY': KEY, 'content-type': 'application/json', ...(o.headers || {}) } });
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${p} :: ${t.slice(0, 400)}`);
  return t ? JSON.parse(t) : null;
};

/* Carry errorWorkflow forward explicitly — a whitelist that drops it silently
   detaches the Error Sentry (RUN 6.6-C gotcha). */
const writable = (wf) => {
  const settings = { executionOrder: wf.settings?.executionOrder || 'v1' };
  if (wf.settings?.errorWorkflow) settings.errorWorkflow = wf.settings.errorWorkflow;
  return { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings };
};

const ledger = [];
/* replace ALL occurrences */
function sub(ctx, s, old, nw) {
  if (!s.includes(old)) return s;
  const n = s.split(old).length - 1;
  ledger.push({ ctx, n, old, nw });
  return s.split(old).join(nw);
}
/* replace only the NEXT occurrence — used where an identical string
   (e.g. btn:`Book`) repeats and each instance needs a DIFFERENT replacement */
function subOnce(ctx, s, old, nw) {
  const i = s.indexOf(old);
  if (i < 0) return s;
  ledger.push({ ctx, n: 1, old, nw });
  return s.slice(0, i) + nw + s.slice(i + old.length);
}

/* =============================== POST-CALL — status-led owner alert ======= */
/* Status is derived from the booked field RUN 6.6-C wired to the real
   appointment result, plus the call analysis. One job per line, outcome first. */
const POSTCALL_STATUS = `
/* --- STATUS (RUN 7-CODE) — owner alerts open status-led ------------------- */
let status = 'FOLLOW-UP';
if (booked === 'yes') status = 'BOOKED';
else if (an.in_voicemail === true) status = 'VOICEMAIL';
else if (secs !== null && secs < 20) status = 'MISSED';
else if (c.disconnection_reason === 'dial_no_answer' || c.disconnection_reason === 'dial_busy' || c.disconnection_reason === 'voicemail_reached') status = 'MISSED';
`;

async function postcall() {
  const wf = await api('/workflows/6r8YHuMEJbxeDyT5');
  const fcl = wf.nodes.find(n => n.name === 'Format Call Log');
  const sms = wf.nodes.find(n => n.name === 'Owner Alert SMS');
  const mail = wf.nodes.find(n => n.name === 'Owner Alert Email');
  const C = 'Post-Call · ';
  let code = fcl.parameters.jsCode;

  if (!code.includes("let status = 'FOLLOW-UP'")) {
    code = sub(C + 'Format Call Log', code,
      "const bookedLine = booked",
      POSTCALL_STATUS + "\nconst bookedLine = booked");
    // title leads with the status instead of trailing a BOOKED/— marker
    code = sub(C + 'Format Call Log', code,
      "const title = when + ' \\u00b7 ' + number + ' \\u00b7 ' + duration + ' \\u00b7 ' + (booked === 'yes' ? 'BOOKED' : '\\u2014');",
      "const title = status + ' \\u00b7 ' + number + ' \\u00b7 ' + duration + ' \\u00b7 ' + when;");
    code = sub(C + 'Format Call Log', code,
      "return [{ json: { log_title: title, log_body: bodyText, booked: booked,",
      "return [{ json: { log_title: title, log_body: bodyText, log_status: status, booked: booked,");
    fcl.parameters.jsCode = code;
  }

  // SMS opens with the status word, details after
  sms.parameters.jsonBody = sub(C + 'Owner Alert SMS', sms.parameters.jsonBody,
    "const bk = f.booked === 'yes' ? 'BOOKED \\u00b7 ' : (f.booked === 'unknown' ? 'BOOKING UNCONFIRMED \\u00b7 ' : '');",
    "const st = f.log_status || 'FOLLOW-UP';");
  sms.parameters.jsonBody = sub(C + 'Owner Alert SMS', sms.parameters.jsonBody,
    "message: 'AVA call: ' + caller + ' \\u00b7 ' + dur + ' \\u00b7 ' + bk + sum",
    "message: st + '\\n' + caller + ' \\u00b7 ' + dur + '\\n' + sum");

  // email subject leads with the status too
  mail.parameters.subject = sub(C + 'Owner Alert Email subject', mail.parameters.subject,
    "=AVA call — {{ $('Format Call Log').item.json.log_title }}",
    "={{ $('Format Call Log').item.json.log_title }}");

  if (MODE === 'apply') await api('/workflows/6r8YHuMEJbxeDyT5', { method: 'PUT', body: JSON.stringify(writable(wf)) });
}

/* ================================ BOOKING RECEIPT ======================== */
async function receipt() {
  const wf = await api('/workflows/NMSWFtcyEQhSypSx');
  const pr = wf.nodes.find(n => n.name === 'Prep Receipt');
  const C = 'Booking Receipt · Prep Receipt · ';
  let s = pr.parameters.jsCode;

  // caller-facing receipt: canonical name + the required hear-AVA line, no emoji
  s = sub(C + 'sms_text', s,
    "const sms_text = `✅ You're set, ${first_name} — your 15-min call is ${appt_human}. Calendar invite just hit your email. Talk soon — AVA Team`;",
    "const sms_text = `You're set, ${first_name} — your AVA strategy call is ${appt_human}. Calendar invite just hit your email. Hear AVA anytime: 414-240-8930. — AVA Team`;");
  s = sub(C + 'email_html reschedule block', s,
    "Need to reschedule? The link is in your calendar invite.</p>",
    "Need to reschedule? The link is in your calendar invite.<br>Hear AVA anytime: 414-240-8930.</p>");
  s = sub(C + 'email_html signature', s,
    '">— Shane</p>', '">— AVA Team</p>');

  // owner alerts: status first
  s = sub(C + 'owner_text', s,
    "const owner_text = `✅ BOOKED: ${full_name}",
    "const owner_text = `BOOKED\\n${full_name}");
  s = sub(C + 'owner_email_subject', s,
    "const owner_email_subject = `AVA BOOKED — ${full_name}",
    "const owner_email_subject = `BOOKED — ${full_name}");

  pr.parameters.jsCode = s;

  // the receipt SMS node appends a second job onto the message — one job per message
  const rs = wf.nodes.find(n => n.name === 'Receipt SMS');
  rs.parameters.jsonBody = sub('Booking Receipt · Receipt SMS', rs.parameters.jsonBody,
    "$('Prep Receipt').item.json.sms_text + '. Reply here if that email looks wrong.'",
    "$('Prep Receipt').item.json.sms_text");

  if (MODE === 'apply') await api('/workflows/NMSWFtcyEQhSypSx', { method: 'PUT', body: JSON.stringify(writable(wf)) });
}

/* ====================================== DRIP ============================= */
async function drip() {
  const wf = await api('/workflows/Pu661B1J1ZgezJT7');
  const bs = wf.nodes.find(n => n.name === 'Build Steps');
  const C = 'Drip · Build Steps · ';
  let s = bs.parameters.jsCode;

  /* SMS: STOP on first touch only. C[0] carries "Reply STOP to opt out." and is
     left alone; the 7 later SMS carry ". STOP to opt out." and lose it. */
  s = sub(C + 'STOP repeats (SMS 2-8)', s, '. STOP to opt out.', '.');

  /* caller-facing copy never says "Shane" — longest form first */
  s = sub(C + 'signature', s, '— Shane Handel, AI Voice Agency', '— The AVA Team, AI Voice Agency');
  s = sub(C + 'signature', s, 'sign:`— Shane`', 'sign:`— AVA Team`');

  /* no fabricated stats or dollar amounts */
  s = sub(C + 'unsourced 62%/85% claim', s,
    'Industry data: 62% of calls to small businesses go unanswered — and 85% of those callers never call back.',
    'Every missed call is someone who dialled you first and ended up somewhere else. Nobody tells you when it happens — that is what makes it expensive.');
  s = sub(C + 'fabricated dollar range', s, 'stat:`$75,000–$126,000`', 'stat:``');
  s = sub(C + 'fabricated dollar subtitle', s,
    'statSub:`a year walking out the door for a local service business.`', 'statSub:``');
  s = sub(C + 'headline implying figures', s, 'The math on your missed calls.', 'The calls you never hear about.');

  /* CTA phrasing varies across the sequence — six identical btn:`Book` buttons
     and five identical "414-240-8930" lines become distinct sentences. */
  const BTNS = ['Find a 15-minute slot', 'See where your calls leak', 'Run your own numbers',
    'Pick a time that suits you', 'Get AVA on your line', 'Scope AVA around your calls'];
  for (const b of BTNS) s = subOnce(C + 'CTA button', s, 'btn:`Book`', 'btn:`' + b + '`');

  /* C[1] and C[14] both shipped btn:`Book your 15-min call`. Anchor each edit on
     its own unique `extra:` line rather than on occurrence order — an
     occurrence-ordered rule re-fires on a second apply and silently rewrites
     the WRONG step, which is exactly what happened the first time this ran. */
  s = sub(C + 'final CTA (was a duplicate of C[1])',
    s, 'btn:`Book your 15-min call`, extra:`Hear AVA: 414-240-8930`',
    'btn:`Take the last 15-minute slot`, extra:`Hear AVA: 414-240-8930`');
  s = sub(C + 'restore C[1] CTA', // idempotent repair of the mis-fire above
    s, 'btn:`Take the last 15-minute slot`, extra:`Or hear AVA again: 414-240-8930`',
    'btn:`Book your 15-min call`, extra:`Or hear AVA again: 414-240-8930`');

  const EXTRAS = ['Hear AVA answer for yourself: 414-240-8930', 'Call the line and listen: 414-240-8930',
    'Try it live: 414-240-8930', 'AVA is answering right now: 414-240-8930', 'One ring, any hour: 414-240-8930'];
  for (const e of EXTRAS) s = subOnce(C + 'CTA sub-line', s, 'extra:`414-240-8930`', 'extra:`' + e + '`');

  bs.parameters.jsCode = s;

  const own = wf.nodes.find(n => n.name === 'Owner NEW LEAD SMS');
  own.parameters.jsonBody = sub('Drip · Owner NEW LEAD SMS', own.parameters.jsonBody,
    "'🔥 NEW LEAD: '", "'FOLLOW-UP\\n' + 'NEW LEAD: '");

  if (MODE === 'apply') await api('/workflows/Pu661B1J1ZgezJT7', { method: 'PUT', body: JSON.stringify(writable(wf)) });
}

/* ================================ CLIENT INTAKE ========================== */
async function intake() {
  const wf = await api('/workflows/9FoLm4slBmM5nIus');
  const bp = wf.nodes.find(n => n.name === 'Build Payload');
  bp.parameters.jsCode = sub('Client Intake · Build Payload · owner_msg', bp.parameters.jsCode,
    "const owner_msg = '📋 INTAKE COMPLETE: '", "const owner_msg = 'FOLLOW-UP\\nINTAKE COMPLETE: '");
  if (MODE === 'apply') await api('/workflows/9FoLm4slBmM5nIus', { method: 'PUT', body: JSON.stringify(writable(wf)) });
}

/* ================================ ALERT OWNER ============================ */
async function alertOwner() {
  const wf = await api('/workflows/RH6POCJWU5CUdTyd');
  const em = wf.nodes.find(n => n.name === 'Email Shane');
  em.parameters.subject = sub('alert_owner · Email subject', em.parameters.subject,
    "=AVA owner alert — {{ $('Normalize').item.json.first_name }}",
    "=FOLLOW-UP — AVA passed you a caller: {{ $('Normalize').item.json.first_name }}");
  const st = wf.nodes.find(n => n.name && n.name.startsWith('Owner SMS'));
  if (st) st.parameters.jsonBody = sub('alert_owner · staged Owner SMS', st.parameters.jsonBody,
    '"message": "AVA owner alert — "', '"message": "FOLLOW-UP\\nAVA passed you a caller — "');
  if (MODE === 'apply') await api('/workflows/RH6POCJWU5CUdTyd', { method: 'PUT', body: JSON.stringify(writable(wf)) });
}

/* ============================ CANONICAL NAME (caller-facing) ============= */
async function canonical() {
  const wf = await api('/workflows/CteKZ4wdebtbkBmh');
  for (const n of wf.nodes.filter(n => /Send (Booking|PDF) SMS/.test(n.name))) {
    n.parameters.jsonBody = sub('send_link · ' + n.name, n.parameters.jsonBody,
      'link to book your strategy call', 'link to book your AVA strategy call');
    n.parameters.jsonBody = sub('send_link · ' + n.name, n.parameters.jsonBody,
      'Link to book your strategy call', 'Link to book your AVA strategy call');
  }
  if (MODE === 'apply') await api('/workflows/CteKZ4wdebtbkBmh', { method: 'PUT', body: JSON.stringify(writable(wf)) });

  const soc = await api('/workflows/GHWEirHNxDF39NP1');
  const q = soc.nodes.find(n => n.name === 'Question Auto Reply');
  q.parameters.jsonBody = sub('social_intake · Question Auto Reply', q.parameters.jsonBody,
    'Fastest way to see it work is a 3-minute call', 'Fastest way to see it work is the 15-minute AVA strategy call');
  const cons = soc.nodes.find(n => n.name === 'Consent Ask Reply');
  cons.parameters.jsonBody = sub('social_intake · Consent Ask Reply', cons.parameters.jsonBody,
    'Happy to walk you through it on a quick call.', 'Happy to walk you through it on the 15-minute AVA strategy call.');
  if (MODE === 'apply') await api('/workflows/GHWEirHNxDF39NP1', { method: 'PUT', body: JSON.stringify(writable(wf === soc ? wf : soc)) });
}

/* ===================================================================== main */
console.log(`RUN 7-CODE · n8n MESSAGE FORMAT LAW · mode=${MODE}\n`);
await postcall();
await receipt();
await drip();
await intake();
await alertOwner();
await canonical();

if (!ledger.length) { console.log('No changes needed — already compliant.'); process.exit(0); }
let last = '';
for (const e of ledger) {
  if (e.ctx !== last) { console.log(`\n### ${e.ctx}`); last = e.ctx; }
  console.log(`  (${e.n}x) OLD: ${JSON.stringify(e.old).slice(0, 150)}`);
  console.log(`        NEW: ${JSON.stringify(e.nw).slice(0, 150)}`);
}
console.log(`\n${ledger.length} edit rules applied · ${ledger.reduce((a, e) => a + e.n, 0)} replacements · mode=${MODE}`);
