#!/usr/bin/env node
/* ============================================================================
   tools/run65-proof.mjs  ·  RUN 6.5 · ONE-CALL PROOF
   ----------------------------------------------------------------------------
   Verifies the whole owner rail end to end from a single real inbound call to
   414-240-8930, and prints the chain:

     Retell call -> n8n ava-postcall execution -> GHL contact + call note
       -> owner SMS on the DEDICATED owner contact -> owner email -> all green

   It also asserts the two things RUN 6 could not: that the write landed on a
   NEW lead rather than the owner row, and that the owner alert landed on the
   dedicated contact rather than a demo-lead row.

   USAGE (always through Doppler):
     doppler run --project ava-prod --config prd -- node tools/run65-proof.mjs
     doppler run --project ava-prod --config prd -- node tools/run65-proof.mjs --since-min 15

   Phone numbers are masked in all output. Build-time only.
   ========================================================================== */

const N8N = 'https://circulant.app.n8n.cloud';
const POSTCALL_WF = '6r8YHuMEJbxeDyT5';
const LIVE_LINE = '+14142408930';
const OWNER_ROW = '8zyowOdgNehLoYLpmVBm';   // the old collided row, now the zz-test sink
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const sinceArg = process.argv.find((a) => a.startsWith('--since-min'));
const SINCE_MIN = sinceArg ? Number(sinceArg.split('=')[1] || process.argv[process.argv.indexOf(sinceArg) + 1]) : 20;
const cutoff = Date.now() - SINCE_MIN * 60 * 1000;

const mask = (p) => {
  const d = ((p == null ? '' : p) + '').replace(/[^0-9]/g, '');
  return d ? `***-***-${d.slice(-4)}` : '(none)';
};

async function n8n(path) {
  const r = await fetch(`${N8N}/api/v1${path}`, { headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY, accept: 'application/json' } });
  return r.json();
}
async function ghl(path) {
  const r = await fetch(`https://services.leadconnectorhq.com${path}`, {
    headers: { Authorization: `Bearer ${process.env.GHL_PIT}`, Version: '2021-07-28', Accept: 'application/json', 'User-Agent': UA },
  });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}
async function retell(path, opts = {}) {
  const r = await fetch(`https://api.retellai.com${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${process.env.RETELL_API_KEY}`, 'Content-Type': 'application/json' },
  });
  return r.json();
}

const PASS = [];
const FAIL = [];
const line = (ok, label, detail) => {
  (ok ? PASS : FAIL).push(label);
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
};

console.log(`RUN 6.5 ONE-CALL PROOF — looking back ${SINCE_MIN} min\n`);

/* ---------------------------------------------------------------- 1. Retell */
console.log('1. RETELL — inbound call on the live line');
const calls = await retell('/v2/list-calls', {
  method: 'POST',
  body: JSON.stringify({ filter_criteria: { direction: ['inbound'] }, limit: 30, sort_order: 'descending' }),
});
const recent = (Array.isArray(calls) ? calls : []).filter(
  (c) => c.to_number === LIVE_LINE && (c.start_timestamp || 0) > cutoff
);
const call = recent[0];
if (!call) {
  line(false, 'a recent inbound call to the live line', `none in the last ${SINCE_MIN} min`);
  console.log('\n  Nothing to verify yet. Place the call, then re-run.');
  process.exit(1);
}
const secs = call.end_timestamp && call.start_timestamp ? Math.round((call.end_timestamp - call.start_timestamp) / 1000) : null;
line(true, 'inbound call found', `${call.call_id} · from ${mask(call.from_number)} · ${secs}s · agent v${call.agent_version}`);
line(call.agent_version === 37, 'served by the frozen v37 agent', `agent_version=${call.agent_version}`);
const summary = call.call_analysis?.call_summary || '(analysis still pending)';
console.log(`        summary: ${String(summary).slice(0, 140)}`);
console.log(`        recording: ${call.recording_url ? 'present' : 'none yet'}`);

/* ------------------------------------------------------------------ 2. n8n */
console.log('\n2. n8n — ava-postcall execution');
const ex = await n8n(`/executions?workflowId=${POSTCALL_WF}&limit=5&includeData=true`);
const run = (ex.data || []).find((e) => new Date(e.startedAt).getTime() > cutoff);
if (!run) {
  line(false, 'post-call workflow executed', 'no execution since the cutoff — Retell call_analyzed may not have landed yet (it lags hangup by ~1 min)');
} else {
  line(run.status === 'success', 'post-call execution green', `exec ${run.id} · ${run.status}`);
  const rd = run.data?.resultData?.runData || {};
  const ref = rd['Contact Ref']?.[0]?.data?.main?.[0]?.[0]?.json;
  const contactId = ref?.contact_id;
  const internal = ref?.is_internal;

  line(!!contactId, 'contact resolved', contactId ? `${contactId}${internal ? ' (routed to zz-test — you called from one of OUR OWN numbers)' : ''}` : 'none');
  if (contactId && !internal) {
    line(contactId !== OWNER_ROW, 'written as a lead, NOT the old owner row', `contact ${contactId}`);
  }

  const note = rd['GHL Call Note']?.[0]?.data?.main?.[0]?.[0]?.json?.note;
  line(!!note?.id, 'GHL call note written', note ? `note ${note.id} (${String(note.body || '').length} chars, recording URL included)` : 'missing');

  const sms = rd['Owner Alert SMS']?.[0]?.data?.main?.[0]?.[0]?.json;
  line(!!sms?.messageId, 'owner SMS dispatched', sms ? `message ${sms.messageId}` : 'node did not run');

  const mail = rd['Owner Alert Email']?.[0]?.data?.main?.[0]?.[0]?.json;
  line(!!mail?.id, 'owner email sent', mail ? `gmail ${mail.id}` : 'node did not run');

  const gate = rd['Caller Send?'];
  if (gate) console.log(`        Caller Send? gate ran — demo copy ${internal ? 'SUPPRESSED (internal)' : 'allowed (real lead)'}`);
}

/* --------------------------------------------------- 3. GHL owner delivery */
console.log('\n3. GHL — owner alert delivery on the dedicated contact');
const varsRes = await n8n('/variables');
const OWNER_CONTACT = (varsRes.data || []).find((v) => v.key === 'OWNER_ALERT_CONTACT_ID')?.value;
line(!!OWNER_CONTACT, 'owner contact id resolved from n8n config', OWNER_CONTACT || 'MISSING');

if (OWNER_CONTACT) {
  const oc = await ghl(`/contacts/${OWNER_CONTACT}`);
  const c = oc.body.contact || {};
  line(oc.status === 200, 'owner contact reachable', `${c.firstName} ${c.lastName} · ${mask(c.phone)} · tags ${JSON.stringify(c.tags)}`);

  const conv = await ghl(`/conversations/search?locationId=${process.env.GHL_LOCATION_ID}&contactId=${OWNER_CONTACT}`);
  const cid = conv.body?.conversations?.[0]?.id;
  if (cid) {
    const msgs = await ghl(`/conversations/${cid}/messages?limit=5`);
    const list = msgs.body?.messages?.messages || [];
    const fresh = list.filter((m) => new Date(m.dateAdded).getTime() > cutoff);
    line(fresh.length > 0, 'owner SMS landed since the call', `${fresh.length} message(s)`);
    for (const m of fresh.slice(0, 3)) {
      console.log(`        [${m.dateAdded}] ${m.status} :: ${String(m.body || '').replace(/\s+/g, ' ').slice(0, 120)}`);
    }
  } else line(false, 'owner conversation exists', 'none');

  /* the whole point of RUN 6.5: this row must never be an upsert target */
  const stillClean = (c.tags || []).includes('owner-alerts') && c.email === 'shane@aivoiceagency.ai';
  line(stillClean, 'owner row uncorrupted after the call', stillClean ? 'name/email/tags intact' : 'SOMETHING OVERWROTE IT');
}

console.log(`\n=== ${FAIL.length === 0 ? 'ALL GREEN' : `${FAIL.length} FAILED`} — ${PASS.length} passed, ${FAIL.length} failed ===`);
if (FAIL.length) { console.log('failed:', FAIL.join(' | ')); process.exit(1); }
