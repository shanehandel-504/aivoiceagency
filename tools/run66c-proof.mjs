#!/usr/bin/env node
/* ============================================================================
   tools/run66c-proof.mjs  ·  RUN 6.6-C PROOF
   ----------------------------------------------------------------------------
   ONE synthetic call_analyzed payload, POSTed to the LIVE ava-postcall webhook,
   proving all three RUN 6.6-C fixes at once.

   The caller number is one of OUR OWN lines, so the RUN 6.5 upsert guard routes
   the write to $vars.ZZ_TEST_CONTACT_ID. No real contact is created or mutated.

   Part 2 replays the DEPLOYED "Format Call Log" code (fetched live from n8n, not
   a local copy) against four payload shapes to prove the booked branch table —
   yes / no / unknown — without firing four executions.

   USAGE:
     doppler run --project ava-prod --config prd -- node tools/run66c-proof.mjs
   ========================================================================== */

const N8N = 'https://circulant.app.n8n.cloud';
const KEY = process.env.N8N_API_KEY;
if (!KEY) { console.error('RUN INCOMPLETE — N8N KEY MISSING'); process.exit(2); }

const WF_POSTCALL = '6r8YHuMEJbxeDyT5';
const OUR_LINE = '+14142408930';                 // the published AVA line — ours, so the guard fires
const CALL_ID = 'call_RUN66C_SYNTHETIC_BOOKED';
const TOOL_ID = 'call_RUN66C_TOOLCALL_0001';
const APPT_ID = 'appt_RUN66C_SYNTHETIC_0001';

const api = async (p, o = {}) => {
  const r = await fetch(N8N + '/api/v1' + p, { ...o, headers: { 'X-N8N-API-KEY': KEY, 'content-type': 'application/json', ...(o.headers || {}) } });
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${p} :: ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : null;
};

const results = [];
const check = (n, pass, detail) => { results.push({ n, pass, detail }); console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${n}${detail ? ' — ' + detail : ''}`); };

/* ------------------------------------------------- the synthetic payload */
const now = 1785000000000;
const payload = {
  event: 'call_analyzed',
  call: {
    call_id: CALL_ID,
    call_type: 'phone_call',
    agent_id: 'agent_d5ada9f774fe3ae7f034d2c677',
    agent_version: 37,
    call_status: 'ended',
    start_timestamp: now,
    end_timestamp: now + 132000,
    duration_ms: 132000,
    from_number: OUR_LINE,
    to_number: OUR_LINE,
    direction: 'inbound',
    disconnection_reason: 'agent_hangup',
    recording_url: 'https://example.invalid/run66c-synthetic.wav',
    transcript: 'RUN 6.6-C SYNTHETIC TEST — not a real call.',
    transcript_with_tool_calls: [
      { role: 'agent', content: 'RUN 6.6-C synthetic.' },
      { role: 'tool_call_invocation', tool_call_id: TOOL_ID, name: 'book_appointment', type: 'custom', time_sec: 100, arguments: JSON.stringify({ name: 'RUN66C Synthetic', slot: 'Wednesday, July 29, 2026 at 2:00 PM CDT' }) },
      { role: 'tool_call_result', tool_call_id: TOOL_ID, successful: true, time_sec: 103, content: JSON.stringify({ success: true, appointment_id: APPT_ID, start_time: null, start_time_human: 'Wednesday, Jul 29 at 2:00 PM CT' }) },
    ],
    tool_calls: [{ tool_call_id: TOOL_ID, name: 'book_appointment', type: 'custom', success: true }],
    call_analysis: {
      call_summary: 'RUN 6.6-C SYNTHETIC TEST PAYLOAD — internal rail proof, not a real caller.',
      in_voicemail: false,
      user_sentiment: 'Neutral',
      call_successful: true,
      custom_analysis_data: { caller_first: 'RUN66C', caller_email: '', caller_phone: OUR_LINE, business_name: 'synthetic test' },
    },
  },
};

/* ============================================ PART 1 — live end-to-end fire */
console.log('\n=== PART 1 · ONE synthetic payload -> LIVE /webhook/ava-postcall ===');
const before = await api(`/executions?workflowId=${WF_POSTCALL}&limit=1`);
const beforeId = Number(before.data[0]?.id || 0);

const res = await fetch(`${N8N}/webhook/ava-postcall`, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
});
console.log(`  webhook HTTP ${res.status} :: ${(await res.text()).slice(0, 160)}`);

await new Promise(s => setTimeout(s, 9000));
const after = await api(`/executions?workflowId=${WF_POSTCALL}&limit=3&includeData=true`);
const exec = after.data.find(e => Number(e.id) > beforeId);
if (!exec) { console.error('  FAIL — no new execution appeared'); process.exit(1); }

const rd = exec.data?.resultData?.runData || {};
console.log(`  execution ${exec.id} · ${exec.status}`);
check('execution succeeded', exec.status === 'success', `status=${exec.status}`);

/* FIX 2 — the account rail carried it, and only one execution exists for this call */
const sameCall = after.data.filter(e => {
  const b = e.data?.resultData?.runData?.['Retell Webhook']?.[0]?.data?.main?.[0]?.[0]?.json?.body;
  return b?.call?.call_id === CALL_ID;
});
check('FIX 2 · exactly one execution for this call_id (no duplicate rail)', sameCall.length === 1, `${sameCall.length} execution(s)`);

/* RUN 6.5 guard still holds — the write must land on the zz-test sink */
const ourNumber = rd['Is Our Number?'];
const testContact = rd['Test Contact'];
const upsert = rd['GHL Upsert Contact'];
check('RUN 6.5 guard · routed to zz-test, no real lead touched',
  !!testContact && !upsert, `Test Contact=${!!testContact} GHL Upsert Contact=${!upsert ? 'not run' : 'RAN — REAL LEAD RISK'}`);

/* FIX 3 — the booked field */
const fcl = rd['Format Call Log']?.[0]?.data?.main?.[0]?.[0]?.json;
if (fcl) {
  console.log('\n  --- Format Call Log body ---');
  console.log(fcl.log_body.split('\n').map(l => '    ' + l).join('\n'));
  console.log(`    (title: ${fcl.log_title})`);
}
check('FIX 3 · booked resolves to "yes"', fcl?.booked === 'yes', `booked=${fcl?.booked}`);
check('FIX 3 · no longer reports "Booked: unknown"', !!fcl && !/Booked: unknown/.test(fcl.log_body), '');
check('FIX 3 · real appointment id surfaced', fcl?.appointment_id === APPT_ID, `appointment_id=${fcl?.appointment_id}`);

/* owner rail still intact */
const smsRun = rd['Owner Alert SMS']?.[0]?.data?.main?.[0]?.[0]?.json;
const mailRun = rd['Owner Alert Email']?.[0]?.data?.main?.[0]?.[0]?.json;
check('owner SMS dispatched', !!smsRun, smsRun?.messageId ? `messageId=${smsRun.messageId}` : JSON.stringify(smsRun || {}).slice(0, 120));
check('owner email sent', !!mailRun, mailRun?.id ? `gmail=${mailRun.id}` : '');
const caller = rd['Caller Send?'];
check('caller-facing demo copy suppressed on an internal call', !!caller && !rd['Send Email'], `Send Email ${rd['Send Email'] ? 'RAN' : 'not run'}`);

/* ================================ PART 2 — deployed branch table, replayed */
console.log('\n=== PART 2 · replay the DEPLOYED Format Call Log across the booked branch table ===');
const wf = await api('/workflows/' + WF_POSTCALL);
const jsCode = wf.nodes.find(n => n.name === 'Format Call Log').parameters.jsCode;
check('replaying live deployed code (not a local copy)', jsCode.includes('tool_call_id'), `${jsCode.length} chars`);

const DateTimeMock = { now: () => ({ setZone: () => ({ toFormat: () => 'Jul 28, 12:00 PM' }) }) };
function runDeployed(call) {
  const $ = (n) => ({ item: { json: n === 'Retell Webhook' ? { body: { call } } : { call_id: call.call_id, summary: call.call_analysis?.call_summary } } });
  return new Function('$', 'DateTime', jsCode)($, DateTimeMock)[0].json;
}

const base = () => JSON.parse(JSON.stringify(payload.call));
const cases = [
  ['booked ok            -> yes', base(), 'yes'],
  ['no tool call at all  -> no', (() => { const c = base(); c.transcript_with_tool_calls = [{ role: 'agent', content: 'hi' }]; c.tool_calls = []; return c; })(), 'no'],
  ['tool returned failure-> no', (() => { const c = base(); c.transcript_with_tool_calls[2].content = JSON.stringify({ success: false, reason: 'slot_unavailable' }); return c; })(), 'no'],
  ['attempted, no result -> unknown', (() => { const c = base(); c.transcript_with_tool_calls.splice(2, 1); return c; })(), 'unknown'],
];
for (const [label, call, want] of cases) {
  let got;
  try { got = runDeployed(call).booked; } catch (e) { got = 'THREW: ' + e.message; }
  check(`FIX 3 branch · ${label}`, got === want, `got=${got}`);
}

/* the real historical payload that used to read "unknown" */
const hist = await api('/executions/4840?includeData=true');
const histCall = hist.data.resultData.runData['Retell Webhook'][0].data.main[0][0].json.body.call;
const histOut = runDeployed(histCall);
check('FIX 3 · real 2026-07-26 booked call now reads yes (was "unknown")',
  histOut.booked === 'yes' && histOut.appointment_id === 'zWAdbE9q4SQ62OUGWcjL',
  `booked=${histOut.booked} appt=${histOut.appointment_id}`);

const hist2 = await api('/executions/4885?includeData=true');
const histCall2 = hist2.data.resultData.runData['Retell Webhook'][0].data.main[0][0].json.body.call;
check('FIX 3 · real non-booking call reads no (not a false yes)', runDeployed(histCall2).booked === 'no', `booked=${runDeployed(histCall2).booked}`);

/* ======================================================= FIX 1 re-assertion */
console.log('\n=== PART 3 · FIX 1 re-assert on the live LIVE INTAKE workflow ===');
const li = await api('/workflows/V6wAFgJ803xmLM0K');
const grok = li.nodes.find(n => n.name === 'Grok Extract').parameters.jsonBody;
check('FIX 1 · Grok Extract holds no inline regex / double-escape', !grok.includes('\\') && grok.includes('$json.page_text'), '');
check('FIX 1 · Strip HTML Code node present', li.nodes.some(n => n.name === 'Strip HTML' && n.type === 'n8n-nodes-base.code'), '');

/* ===================================================================== tally */
const passed = results.filter(r => r.pass).length;
console.log(`\n===== RUN 6.6-C PROOF: ${passed} PASSED, ${results.length - passed} FAILED =====`);
if (passed !== results.length) { console.log(results.filter(r => !r.pass).map(r => '  FAIL ' + r.n).join('\n')); process.exit(1); }
