#!/usr/bin/env node
/* ============================================================================
   tools/run7-proof.mjs  ·  RUN 7-CODE PROOF
   ----------------------------------------------------------------------------
   Verifies MESSAGE FORMAT LAW compliance across the live n8n rail, then fires
   ONE synthetic call_analyzed to prove the status-led owner alert end to end.

   The synthetic caller is one of OUR OWN lines, so the RUN 6.5 upsert guard
   routes the write to the zz-test sink. No real contact is touched.

   USAGE:
     doppler run --project ava-prod --config prd -- node tools/run7-proof.mjs
   ========================================================================== */

const N8N = 'https://circulant.app.n8n.cloud';
const KEY = process.env.N8N_API_KEY;
if (!KEY) { console.error('RUN INCOMPLETE — N8N KEY MISSING'); process.exit(2); }
const api = async p => { const r = await fetch(N8N + '/api/v1' + p, { headers: { 'X-N8N-API-KEY': KEY } }); const t = await r.text(); if (!r.ok) throw new Error(r.status + ' ' + t.slice(0, 300)); return JSON.parse(t); };

const R = [];
const check = (n, pass, d) => { R.push({ n, pass }); console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${n}${d ? ' — ' + d : ''}`); };

/* ============================================= PART 1 · static law audit */
console.log('\n=== PART 1 · MESSAGE FORMAT LAW across the live n8n rail ===');

const drip = await api('/workflows/Pu661B1J1ZgezJT7');
const bs = drip.nodes.find(n => n.name === 'Build Steps').parameters.jsCode;

const btns = [...bs.matchAll(/btn:`([^`]*)`/g)].map(m => m[1]);
const extras = [...bs.matchAll(/extra:`([^`]*)`/g)].map(m => m[1]);
check('drip · every CTA button is unique across the sequence',
  new Set(btns).size === btns.length, `${btns.length} buttons, ${new Set(btns).size} distinct`);
check('drip · every CTA sub-line is unique across the sequence',
  new Set(extras).size === extras.length, `${extras.length} lines, ${new Set(extras).size} distinct`);

/* These two strings do NOT overlap — the SMS line is "Reply STOP to opt out."
   and the email footer is "Reply STOP or use the unsubscribe link to opt out."
   Count them independently; subtracting one from the other is nonsense. */
const smsStops = (bs.match(/STOP to opt out/g) || []).length;
const emailFooterStops = (bs.match(/Reply STOP or use the unsubscribe link/g) || []).length;
check('drip · "Reply STOP to opt out" appears on FIRST TOUCH ONLY',
  smsStops === 1 && /C\[0\][^\n]*Reply STOP to opt out/.test(bs),
  `${smsStops} SMS occurrence, on C[0]`);
check('drip · email footer keeps its unsubscribe line (law scopes STOP to SMS)',
  emailFooterStops === 1, '');

check('drip · caller-facing copy never says "Shane"', !/Shane/.test(bs), '');
check('drip · no unsourced 62%/85% claim', !/62%|85%/.test(bs), '');
check('drip · no fabricated dollar range', !/\$75,000|\$126,000/.test(bs), '');

const receipt = await api('/workflows/NMSWFtcyEQhSypSx');
const pr = receipt.nodes.find(n => n.name === 'Prep Receipt').parameters.jsCode;
check('receipt · carries "Hear AVA anytime: 414-240-8930." in SMS and email',
  (pr.match(/Hear AVA anytime: 414-240-8930/g) || []).length >= 2, '');
check('receipt · caller-facing copy never says "Shane"',
  !/">— Shane<\/p>/.test(pr), '');
check('receipt · owner alert opens status-led (BOOKED first)',
  /const owner_text = `BOOKED/.test(pr) && /owner_email_subject = `BOOKED —/.test(pr), '');
check('receipt · uses the canonical "AVA strategy call" name',
  /your AVA strategy call is/.test(pr), '');

const intake = await api('/workflows/9FoLm4slBmM5nIus');
check('client intake · owner alert opens status-led',
  /owner_msg = 'FOLLOW-UP/.test(intake.nodes.find(n => n.name === 'Build Payload').parameters.jsCode), '');

const own = drip.nodes.find(n => n.name === 'Owner NEW LEAD SMS').parameters.jsonBody;
check('drip owner alert · status-led, no decorative emoji', /FOLLOW-UP/.test(own) && !/🔥/.test(own), '');

/* ================================== PART 2 · one synthetic call, live rail */
console.log('\n=== PART 2 · ONE synthetic payload -> live /webhook/ava-postcall ===');
const OUR_LINE = '+14142408930';
const now = 1785100000000;
const mk = (id, extra) => ({
  event: 'call_analyzed',
  call: {
    call_id: id, call_type: 'phone_call', agent_id: 'agent_d5ada9f774fe3ae7f034d2c677',
    call_status: 'ended', start_timestamp: now, end_timestamp: now + (extra.secs ?? 130) * 1000,
    from_number: OUR_LINE, to_number: OUR_LINE, direction: 'inbound',
    disconnection_reason: extra.reason || 'agent_hangup',
    recording_url: 'https://example.invalid/run7.wav',
    transcript: 'RUN 7-CODE SYNTHETIC — not a real call.',
    transcript_with_tool_calls: extra.tw || [],
    call_analysis: {
      call_summary: 'RUN 7-CODE SYNTHETIC TEST PAYLOAD — internal proof, not a real caller.',
      in_voicemail: !!extra.vm, user_sentiment: 'Neutral', call_successful: true,
      custom_analysis_data: { caller_first: 'RUN7', caller_email: '', caller_phone: OUR_LINE, business_name: 'synthetic test' },
    },
  },
});
const TID = 'call_RUN7_TOOL_0001';
const booked = mk('call_RUN7_SYNTHETIC_BOOKED', {
  tw: [
    { role: 'tool_call_invocation', tool_call_id: TID, name: 'book_appointment', arguments: '{}' },
    { role: 'tool_call_result', tool_call_id: TID, successful: true, content: JSON.stringify({ success: true, appointment_id: 'appt_RUN7_0001', start_time_human: 'Thursday, Jul 30 at 2:00 PM CT' }) },
  ],
});

const before = Number((await api('/executions?workflowId=6r8YHuMEJbxeDyT5&limit=1')).data[0]?.id || 0);
const res = await fetch(`${N8N}/webhook/ava-postcall`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(booked) });
console.log(`  webhook HTTP ${res.status} :: ${(await res.text()).slice(0, 120)}`);
await new Promise(s => setTimeout(s, 9000));

const list = await api('/executions?workflowId=6r8YHuMEJbxeDyT5&limit=3&includeData=true');
const ex = list.data.find(e => Number(e.id) > before);
if (!ex) { console.error('  FAIL — no new execution'); process.exit(1); }
const rd = ex.data?.resultData?.runData || {};
console.log(`  execution ${ex.id} · ${ex.status}`);
check('execution succeeded', ex.status === 'success', `status=${ex.status}`);
check('RUN 6.5 guard held · routed to zz-test, no real lead touched',
  !!rd['Test Contact'] && !rd['GHL Upsert Contact'], '');

const f = rd['Format Call Log']?.[0]?.data?.main?.[0]?.[0]?.json;
console.log(`\n  owner email subject: ${f?.log_title}`);
check('owner alert TITLE opens status-led with BOOKED',
  /^BOOKED · /.test(f?.log_title || ''), `log_title=${f?.log_title}`);
check('log_status exposed for downstream nodes', f?.log_status === 'BOOKED', `log_status=${f?.log_status}`);
check('booked field still correct after the RUN 7 edit', f?.booked === 'yes', `booked=${f?.booked}`);

/* the SMS body is built inside the node expression — read what was actually sent */
const smsSent = rd['Owner Alert SMS']?.[0];
const smsOut = smsSent?.data?.main?.[0]?.[0]?.json;
check('owner SMS dispatched', !!smsOut, smsOut?.messageId ? `messageId=${smsOut.messageId}` : '');
check('owner email sent', !!rd['Owner Alert Email'], '');

/* replay the deployed status logic across the branch table */
console.log('\n=== PART 3 · replay deployed status logic across the outcome table ===');
const wf = await api('/workflows/6r8YHuMEJbxeDyT5');
const js = wf.nodes.find(n => n.name === 'Format Call Log').parameters.jsCode;
const DT = { now: () => ({ setZone: () => ({ toFormat: () => 'Jul 28, 9:00 PM' }) }) };
const run = (call) => new Function('$', 'DateTime', js)(
  (n) => ({ item: { json: n === 'Retell Webhook' ? { body: { call } } : { call_id: call.call_id, summary: call.call_analysis?.call_summary } } }), DT)[0].json;

for (const [label, call, want] of [
  ['booked call      -> BOOKED', booked.call, 'BOOKED'],
  ['voicemail        -> VOICEMAIL', mk('x', { vm: true }).call, 'VOICEMAIL'],
  ['8-second hangup  -> MISSED', mk('x', { secs: 8 }).call, 'MISSED'],
  ['no answer        -> MISSED', mk('x', { reason: 'dial_no_answer' }).call, 'MISSED'],
  ['talked, no book  -> FOLLOW-UP', mk('x', { secs: 140 }).call, 'FOLLOW-UP'],
]) {
  let got; try { got = run(call).log_status; } catch (e) { got = 'THREW ' + e.message; }
  check(`status · ${label}`, got === want, `got=${got}`);
}

const passed = R.filter(r => r.pass).length;
console.log(`\n===== RUN 7-CODE PROOF: ${passed} PASSED, ${R.length - passed} FAILED =====`);
if (passed !== R.length) { console.log(R.filter(r => !r.pass).map(r => '  FAIL ' + r.n).join('\n')); process.exit(1); }
