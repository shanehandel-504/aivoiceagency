// tools/aic-try/receipt-test.mjs — the receipt Code nodes, run as pure JS.
//
//   node tools/aic-try/receipt-test.mjs
//
// The two node bodies are read from automation/try-webcall/nodes/*.js and run in
// a sandbox that stands in for n8n's $input / $getWorkflowStaticData. Nothing
// here touches the network. A negative control runs FIRST: a harness that cannot
// fail proves nothing, so a deliberately leaky projection must be caught by the
// same string test that clears the real one.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = (n) => readFileSync(path.join(REPO, 'automation', 'try-webcall', 'nodes', n), 'utf8');

// n8n wraps a Code node body in a function and injects $input and
// $getWorkflowStaticData. Reproduce exactly that, and nothing else.
function runNode(src, items, store) {
  const $input = { first: () => items[0], all: () => items };
  const $getWorkflowStaticData = () => store;
  return new Function('$input', '$getWorkflowStaticData', src)($input, $getWorkflowStaticData);
}

let failed = 0, ran = 0;
const check = (ok, label, detail = '') => { ran++; if (!ok) failed++; console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`); };

const LIMITS = SRC('receipt-limits.js');
const PROJECT = SRC('receipt-project.js');
const ID = 'call_33583d539e09678fe50b72582af';
const ORIGIN = { 'cf-connecting-ip': '203.0.113.9' };
const limits = (call_id, headers = ORIGIN, store = {}) =>
  runNode(LIMITS, [{ json: { headers, query: { call_id } } }], store)[0].json;
const project = (statusCode, body) => runNode(PROJECT, [{ json: { statusCode, body } }], {})[0].json;

const NOW = Date.now();
const NAME = 'Dana Reeve';
const fullCall = {
  metadata: { source: 'aichauffeur.ai/try' },
  start_timestamp: NOW - 60000,
  recording_url: 'https://dxc03zgurdly9.cloudfront.net/abc/recording.wav',
  transcript: 'Agent: hello. User: my name is ' + NAME + ', mobile 414 555 0101, dana@example.com',
  transcript_object: [
    { role: 'agent', content: 'Thank you for calling. Where are we taking you?' },
    { role: 'user', content: 'Hi, this is ' + NAME + '. I need a ride to the airport.' },
    { role: 'agent', content: 'And a number for the driver?' },
    { role: 'user', content: 'It is (414) 555-0101, or email dana@example.com.' },
    { role: 'user', content: '   ' },
  ],
  call_analysis: {
    call_summary: 'a ride to the airport',
    custom_analysis_data: {
      origin_city: 'Milwaukee', dropoff_address: 'airport', pickup_date: '2026-09-12',
      pickup_time: 'morning', passenger_count: 4, vehicle_class: 'Executive Sedan',
      quote_total: '$240', caller_mobile: '(414) 555-0101', caller_name: NAME,
      caller_email: 'dana@example.com', sms_consent: true, appointment_booked: true, bag_count: 2,
    },
  },
};
const leaks = (body) => {
  const blob = JSON.stringify(body);
  return /Dana|Reeve/i.test(blob) || /555|0101/.test(blob) || /example\.com|dana@/i.test(blob);
};

// ── NEGATIVE CONTROL ────────────────────────────────────────────────────────
console.log('NEGATIVE CONTROL');
{
  const leaky = PROJECT.replace('transcript: thread.length ? thread : null,', 'transcript: call.transcript, caller_name: d.caller_name,');
  if (leaky === PROJECT) { console.log('  ABORT  the control could not patch the projection'); process.exit(2); }
  const out = runNode(leaky, [{ json: { statusCode: 200, body: fullCall } }], {})[0].json.body;
  const caught = leaks(out);
  console.log(`  ${caught ? 'PASS' : 'ABORT'}  a deliberately leaky projection IS caught by the same test that clears the real one`);
  if (!caught) process.exit(2);
}

// ── PROJECTION ──────────────────────────────────────────────────────────────
console.log('\nPROJECTION — what the browser may see');
{
  const { status, body } = project(200, fullCall);
  check(status === 200, 'a live /try call answers 200');
  check(body.status === 'ready', 'status ready once call_analysis exists', body.status);
  check(body.pickup === 'Milwaukee' && body.dropoff === 'airport', 'pickup and drop-off');
  check(body.date === '2026-09-12' && body.time === 'morning', 'date and time');
  check(body.passengers === '4' && body.vehicle === 'Executive Sedan', 'passengers and vehicle');
  check(body.quote === '$240', 'quote is the spoken figure', String(body.quote));
  check(body.mobile_captured === true, 'mobile_captured true when a mobile was given');
  check(body.recording_url === fullCall.recording_url, 'recording_url passed through');
  check(!leaks(body), 'NO caller name, phone digits or email anywhere in the response');
  check(!/summary|sms_consent|appointment|bag_count/i.test(JSON.stringify(body)), 'no analyzer field that was not asked for');
  const allowed = ['status', 'pickup', 'dropoff', 'date', 'time', 'passengers', 'vehicle', 'quote', 'ticket', 'mobile_captured', 'recording_url', 'transcript'];
  check(Object.keys(body).every((k) => allowed.includes(k)), 'every returned key is on the allow list', Object.keys(body).join(','));
}
console.log('\nTHE THREAD — the words come back, the identifiers do not');
{
  const { body } = project(200, fullCall);
  const t = body.transcript;
  check(Array.isArray(t) && t.length === 4, 'four turns come back and the blank one is dropped', `${t && t.length}`);
  check(t.every((x) => x.role === 'agent' || x.role === 'user'), 'every turn is agent or user', JSON.stringify(t.map((x) => x.role)));
  check(Object.keys(t[0]).join(',') === 'role,content', 'a turn carries role and content and nothing else', Object.keys(t[0]).join(','));
  check(/Where are we taking you/.test(t[0].content), 'the wording itself is untouched', t[0].content);
  check(!/Dana|Reeve/i.test(JSON.stringify(t)), 'the spoken NAME is gone', JSON.stringify(t[1]));
  check(!/555|0101|414/.test(JSON.stringify(t)), 'the spoken NUMBER is gone', JSON.stringify(t[3]));
  check(!/dana@|example\.com/i.test(JSON.stringify(t)), 'the spoken EMAIL is gone', JSON.stringify(t[3]));
  check(/\[removed\]/.test(t[1].content) && /\[removed\]/.test(t[3].content), 'and the removal is visible rather than silent');
  check(/I need a ride to the airport/.test(t[1].content), 'the rest of the sentence survives the redaction', t[1].content);
}
{
  // a number nobody extracted must still not survive
  const c = JSON.parse(JSON.stringify(fullCall));
  c.call_analysis.custom_analysis_data.caller_name = '';
  c.call_analysis.custom_analysis_data.caller_mobile = '';
  c.call_analysis.custom_analysis_data.caller_email = '';
  c.transcript_object = [{ role: 'user', content: 'Call me on 262 555 8899 or at rider@fleet.example.org' }];
  const { body } = project(200, c);
  check(!/8899|262|rider@|fleet\.example/i.test(JSON.stringify(body.transcript)),
    'a number and an email the analyser MISSED are still stripped by pattern', JSON.stringify(body.transcript));
}
{
  const bare = { metadata: { source: 'aichauffeur.ai/try' }, start_timestamp: NOW - 1000, call_analysis: { custom_analysis_data: {} } };
  check(project(200, bare).body.transcript === null, 'no turns means transcript is null, not an empty array');
}
{
  const pending = { ...fullCall, call_analysis: null, recording_url: null };
  const { body } = project(200, pending);
  check(body.status === 'processing', 'status processing before call_analysis lands');
  check(body.recording_url === null && body.pickup === null, 'nothing is invented while processing');
}
{
  const bare = {
    metadata: { source: 'aichauffeur.ai/try' }, start_timestamp: NOW - 1000,
    call_analysis: { custom_analysis_data: { passenger_count: 1, caller_mobile: '' } },
  };
  const { body } = project(200, bare);
  check(body.mobile_captured === false, 'mobile_captured false when nothing was given');
  check(body.passengers === '1' && body.dropoff === null, "the analyzer's own default survives; the rest stays null");
}
{
  const t = project(200, { ...fullCall, metadata: { source: 'aichauffeur.ai/try', ticket: 'AIC-4821' } });
  check(t.body.ticket === 'AIC-4821', 'a ticket in call metadata passes through if the rail ever writes one');
  check(project(200, fullCall).body.ticket === null, 'and is null when it is not there');
}

// ── THE 404s ────────────────────────────────────────────────────────────────
console.log('\n404 — calls this page may not read');
{
  check(project(200, { ...fullCall, metadata: { source: 'phone' } }).status === 404, 'a call NOT tagged aichauffeur.ai/try');
  check(project(200, { ...fullCall, metadata: {} }).status === 404, 'a call with no metadata at all');
  check(project(200, { ...fullCall, start_timestamp: NOW - 7200001 }).status === 404, 'a /try call older than two hours');
  check(project(200, { ...fullCall, start_timestamp: 0 }).status === 404, 'a call with no start timestamp');
  check(project(404, { error: 'not found' }).status === 404, "Retell's own 404 stays a 404");
  check(project(401, { error: 'unauthorized' }).status === 404, 'a Retell auth failure does not leak as a 401');
  const older = project(200, { ...fullCall, start_timestamp: NOW - 7200001 });
  check(!/Milwaukee|cloudfront/.test(JSON.stringify(older)), 'a refused call leaks no trip detail');
}

// ── THE LIMITS ──────────────────────────────────────────────────────────────
console.log('\nLIMITS — every refusal happens before anything reaches Retell');
{
  check(limits('').status === 404, 'a missing call_id is refused');
  check(limits('nope').status === 404, 'a call_id that is not shaped like one is refused');
  check(limits('call_../../etc').status === 404, 'a path-traversal call_id is refused');
  check(limits('call_' + 'a'.repeat(200)).status === 404, 'an over-long call_id is refused');
  check(limits('call_' + 'A'.repeat(27)).status === 404, 'a call_id that is not lowercase hex is refused');
  check(limits(ID).next === true, 'a well-formed call_id passes');
}
{
  const store = {};
  let last;
  for (let i = 0; i < 16; i++) last = limits(ID, ORIGIN, store);
  check(last.next === false && last.status === 429, 'the 16th poll of ONE call_id is 429 (45s at 5s is 9)');
  check(limits('call_' + 'b'.repeat(27), ORIGIN, store).next === true, 'a DIFFERENT call from the same visitor still works');
}
{
  const store = {};
  let n = 0, last;
  for (let i = 0; i < 5; i++) for (let j = 0; j < 15; j++) { last = limits('call_' + String(i).repeat(27), ORIGIN, store); n++; }
  check(last.next === false && last.status === 429, 'one IP is capped at 60 polls an hour', `refused at ${n}`);
  check(limits(ID, { 'cf-connecting-ip': '198.51.100.7' }, store).next === true, 'a DIFFERENT visitor is unaffected');
}
{
  const store = { rcCall: {}, rcIp: {} };
  const old = Date.now() - 7200001;
  for (let i = 0; i < 3; i++) store.rcCall['call_' + String(i).repeat(27)] = { n: 15, t: old };
  limits(ID, ORIGIN, store);
  check(Object.keys(store.rcCall).length === 1, 'entries older than the window are pruned', `${Object.keys(store.rcCall).length} left`);
}
{
  const store = { rcCall: {}, rcIp: {} };
  for (let i = 0; i < 500; i++) store.rcCall['call_' + String(i).padStart(27, '0')] = { n: 1, t: Date.now() };
  check(limits('call_' + 'f'.repeat(27), ORIGIN, store).status === 429, 'a NEW call_id is refused at the 500 ceiling');
  check(limits('call_' + '0'.repeat(27), ORIGIN, store).next === true, 'a call already being polled is NOT evicted by that ceiling');
}
{
  const h = { 'x-forwarded-for': '9.9.9.9, 10.0.0.1', 'cf-connecting-ip': '203.0.113.9' };
  const store = {};
  limits(ID, h, store);
  check(Object.keys(store.rcIp)[0] === '203.0.113.9', 'cf-connecting-ip wins over a client-supplied x-forwarded-for', Object.keys(store.rcIp)[0]);
}

console.log(`\n${failed ? 'FAIL — ' + failed + ' of ' + ran : 'ALL ' + ran + ' CHECKS PASS'}`);
process.exit(failed ? 1 : 0);
