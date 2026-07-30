#!/usr/bin/env node
/* ============================================================================
   tools/retell-aic-agent.mjs  ·  AIC VERIFIED RESERVATION LOOP · STEP R
   ----------------------------------------------------------------------------
   Deploys the AI Chauffeur agent prompt + capture schema to the 775 agent.

   PROMPT AUTHORITY: this tool never authors or edits prompt text. It ships
   docs/aic-agent-prompt.md between PROMPT:BEGIN/END byte-for-byte.

   SCOPE LAW: writes are resolved from the PHONE NUMBER, never from a pasted
   agent id (§ 9 — re-fetch opaque ids, verify the value not the id). The tool
   aborts if the resolved agent is the one serving the published AVA line.

   PUBLISH GATE: --publish REFUSES while write_reservation is unregistered.
   The prompt instructs the agent to call that tool and then say the reservation
   is "written ... and I verified the record." With no tool registered the agent
   cannot write anything and that sentence becomes a phantom booking — the exact
   failure the board recorded for trigger_dashboard_sms in RUN 1.6.

   USAGE:
     doppler run --project ava-prod --config prd -- node tools/retell-aic-agent.mjs --show
     doppler run --project ava-prod --config prd -- node tools/retell-aic-agent.mjs --deploy
     doppler run --project ava-prod --config prd -- node tools/retell-aic-agent.mjs --verify
     doppler run --project ava-prod --config prd -- node tools/retell-aic-agent.mjs --deploy --model claude-5-sonnet
     doppler run --project ava-prod --config prd -- node tools/retell-aic-agent.mjs --deploy --fn-url https://...
     doppler run --project ava-prod --config prd -- node tools/retell-aic-agent.mjs --publish

   Build-time only; tools/ is never deployed (.vercelignore).
   ========================================================================== */

import { readFileSync } from 'node:fs';

const KEY = process.env.RETELL_API_KEY;
if (!KEY) { console.error('RUN INCOMPLETE — RETELL_API_KEY missing'); process.exit(2); }

const API = 'https://api.retellai.com';
const TARGET_NUMBER = '+14147750019';
const FORBIDDEN_NUMBER = '+14142408930';
const VOICE = 'custom_voice_705a2cb49b0413f7fc1c456d02';   // Ava, as Retell exposes it (RUN 1)
const PROMPT_DOC = new URL('../docs/aic-agent-prompt.md', import.meta.url);

const arg = (f) => { const i = process.argv.indexOf(f); return i > -1 ? process.argv[i + 1] : null; };
const has = (f) => process.argv.includes(f);
const MODEL = arg('--model');
const FN_URL = arg('--fn-url');

/* ── the 18 capture keys — identical to write_reservation's parameters ────── */
const CAPTURE = [
  ['trip_type', 'enum', 'Shape of the trip.', ['HOURLY', 'ROADSHOW', 'AIRPORT_ARR', 'P2P']],
  ['caller_first', 'string', 'Passenger first name as given.'],
  ['caller_last', 'string', 'Passenger last name as given.'],
  ['caller_phone', 'string', 'Caller mobile, digits as spoken.'],
  ['caller_email', 'string', 'Caller email if given, else empty.'],
  ['pax_count', 'number', 'Number of passengers.'],
  ['luggage_count', 'number', 'Number of bags if given.'],
  ['vehicle_class', 'enum', 'Vehicle class, only from the tenant fleet.',
    ['SEDAN', 'SUV', 'STRETCH', 'MINIBUS', 'LIMOBUS', 'SPRINTER', 'COACH']],
  ['pickup_address', 'string', 'Pickup address exactly as read back and confirmed.'],
  ['dropoff_address', 'string', 'Dropoff address, empty for hourly as-directed.'],
  ['pickup_date', 'string', 'Pickup date as given.'],
  ['pickup_time', 'string', 'Pickup time as given, local.'],
  ['hours_booked', 'number', 'Hours booked for hourly or roadshow.'],
  ['airline', 'string', 'Airline for an airport run.'],
  ['flight_number', 'string', 'Flight or tail number.'],
  ['meet_style', 'enum', 'How the driver meets the passenger.', ['CURBSIDE', 'BAGGAGE', 'PLANESIDE']],
  ['special_notes', 'string', 'Special instructions in the caller words.'],
  ['consent', 'boolean', 'True only if the caller agreed to the reservation being written.'],
];

const cadEntry = ([name, type, description, choices]) => ({
  name, type, description, ...(choices ? { choices } : {}),
});

// Generic call analytics are preserved, not replaced — dropping them would lose
// ops signal that has nothing to do with the reservation schema.
const SYSTEM_PRESETS = ['call_summary', 'call_successful', 'user_sentiment'];

const BOOSTED = ['Kankakee', 'Illinois', 'Chicago', "O'Hare", 'Midway', 'Mitchell',
  'limo bus', 'mini bus', 'stretch', 'SUV', 'sedan'];

const req = async (method, p, body) => {
  const r = await fetch(API + p, {
    method,
    headers: { Authorization: 'Bearer ' + KEY, 'content-type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const t = await r.text();
  let b = null;
  try { b = t ? JSON.parse(t) : null; } catch { b = { _raw: t.slice(0, 300) }; }
  return { status: r.status, ok: r.ok, body: b };
};

const die = (m) => { console.error('\nRUN INCOMPLETE — ' + m); process.exit(1); };

/* ── prompt extraction ───────────────────────────────────────────────────── */
const doc = readFileSync(PROMPT_DOC, 'utf8');
const m = doc.match(/<!-- PROMPT:BEGIN -->\r?\n([\s\S]*?)\r?\n<!-- PROMPT:END -->/);
if (!m) die('PROMPT:BEGIN / PROMPT:END markers not found in docs/aic-agent-prompt.md');
const PROMPT = m[1].replace(/\r\n/g, '\n');
// begin_message is the OPENING line. This is a DEMO line built for one prospect,
// so the prospect greeting is the correct deterministic open; the prompt's
// non-prospect fallback still lets the model recover mid-call.
const BEGIN = PROMPT.split('\n')
  .find(l => l.includes('Hi {{prospect_name}}'))
  ?.replace(/^“|”$/g, '') ?? null;
if (!BEGIN) die('could not locate the OPENING line for begin_message');
if (!BEGIN.includes('{{company_name}}')) die('begin_message does not carry {{company_name}}');

/* ── resolve target from the phone number ────────────────────────────────── */
const nums = await req('GET', '/list-phone-numbers');
if (!nums.ok) die('list-phone-numbers -> ' + nums.status);
const tgt = nums.body.find(n => n.phone_number === TARGET_NUMBER);
if (!tgt) die(`${TARGET_NUMBER} not found on this account`);
const fbd = nums.body.find(n => n.phone_number === FORBIDDEN_NUMBER);
const forbiddenAgent = (fbd?.inbound_agents || [])[0]?.agent_id || fbd?.inbound_agent_id;
const AGENT = (tgt.inbound_agents || [])[0]?.agent_id || tgt.inbound_agent_id;
if (!AGENT) die(`${TARGET_NUMBER} has no inbound agent bound`);
if (AGENT === forbiddenAgent) die(`SCOPE VIOLATION — ${TARGET_NUMBER} resolves to the SAME agent as ${FORBIDDEN_NUMBER}. Refusing to write.`);

const ag0 = await req('GET', `/get-agent/${AGENT}`);
if (!ag0.ok) die('get-agent -> ' + ag0.status);
const LLM = ag0.body.response_engine?.llm_id;
if (!LLM) die('agent has no retell-llm bound');

console.log('=== TARGET (resolved from the number, not from a pasted id) ===');
console.log(`number   : ${TARGET_NUMBER}`);
console.log(`agent    : ${AGENT}  ${JSON.stringify(ag0.body.agent_name)}  v${ag0.body.version}  published=${ag0.body.is_published}`);
console.log(`llm      : ${LLM}`);
console.log(`forbidden: ${FORBIDDEN_NUMBER} -> ${forbiddenAgent}  (distinct: ${AGENT !== forbiddenAgent ? 'YES' : 'NO'})`);

const llm0 = await req('GET', `/get-retell-llm/${LLM}`);
if (!llm0.ok) die('get-retell-llm -> ' + llm0.status);
const tools0 = llm0.body.general_tools || [];
const hasFn = tools0.some(t => t.name === 'write_reservation');

if (has('--show')) {
  console.log('\n=== LIVE STATE ===');
  console.log(`voice_id      : ${ag0.body.voice_id}   (want ${VOICE})`);
  console.log(`model         : ${llm0.body.model}`);
  console.log(`begin_message : ${JSON.stringify((llm0.body.begin_message || '').slice(0, 120))}`);
  console.log(`prompt chars  : ${(llm0.body.general_prompt || '').length}   (file has ${PROMPT.length})`);
  console.log(`prompt matches file : ${llm0.body.general_prompt === PROMPT}`);
  console.log(`tools         : ${tools0.map(t => t.name).join(', ') || '(none)'}`);
  console.log(`write_reservation registered : ${hasFn}`);
  const cad = ag0.body.post_call_analysis_data || [];
  console.log(`capture keys  : ${cad.length} -> ${cad.map(c => c.name).join(', ')}`);
  console.log(`boosted_keywords : ${JSON.stringify(ag0.body.boosted_keywords || null)}`);
  process.exit(0);
}

/* ── verify ──────────────────────────────────────────────────────────────── */
if (has('--verify')) {
  let fail = 0;
  const ck = (n, c, d = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${d ? ' — ' + d : ''}`); if (!c) fail++; };
  console.log('\n=== VERIFY (live vs file) ===');
  const live = llm0.body.general_prompt || '';
  ck('prompt ships byte-for-byte', live === PROMPT, `live ${live.length} vs file ${PROMPT.length} chars`);
  ck('begin_message carries {{company_name}}', (llm0.body.begin_message || '').includes('{{company_name}}'));
  ck('voice is the Ava custom voice', ag0.body.voice_id === VOICE, ag0.body.voice_id);
  const cad = (ag0.body.post_call_analysis_data || []).map(c => c.name);
  const missing = CAPTURE.map(c => c[0]).filter(k => !cad.includes(k));
  ck('all 18 capture keys present', missing.length === 0, missing.join(',') || '18/18');
  ck('write_reservation registered', hasFn, hasFn ? 'yes' : 'NOT REGISTERED — publish is gated');
  console.log(`\n${fail === 0 ? 'ALL VERIFY CHECKS PASS' : fail + ' CHECK(S) FAILED'}`);
  process.exit(fail === 0 ? 0 : 1);
}

/* ── publish gate ────────────────────────────────────────────────────────── */
if (has('--publish')) {
  if (!hasFn) {
    die(`PUBLISH REFUSED — write_reservation is not registered on ${LLM}.
  The prompt instructs the agent to call write_reservation and then tell the caller the
  reservation is "written ... and I verified the record after writing it". With no tool
  registered the agent cannot write anything, so that sentence is a phantom booking.
  Supply the webhook URL first:  --deploy --fn-url https://...`);
  }
  const pub = await req('POST', `/publish-agent/${AGENT}`, {});
  if (!pub.ok) die(`publish-agent -> ${pub.status} ${JSON.stringify(pub.body).slice(0, 200)}`);
  console.log(`\nPUBLISHED agent ${AGENT}. ${TARGET_NUMBER} now serves this version.`);
  process.exit(0);
}

if (!has('--deploy')) {
  console.log('\nno action flag. use --show | --deploy | --verify | --publish');
  process.exit(0);
}

/* ── deploy (draft only — never publishes) ───────────────────────────────── */
console.log('\n=== DEPLOY (draft only — the number keeps serving latest_published) ===');

const llmPatch = { general_prompt: PROMPT, begin_message: BEGIN };
if (MODEL) llmPatch.model = MODEL;
if (FN_URL) {
  llmPatch.general_tools = [
    ...tools0.filter(t => t.name !== 'write_reservation'),
    {
      type: 'custom',
      name: 'write_reservation',
      description: 'Write the captured reservation to the CRM and read the record back. Call this only after the full recap and the caller\'s yes.',
      url: FN_URL,
      speak_during_execution: true,
      speak_after_execution: true,
      parameters: {
        type: 'object',
        required: ['trip_type', 'caller_first', 'caller_last', 'caller_phone',
          'pax_count', 'vehicle_class', 'pickup_address', 'pickup_date', 'pickup_time', 'consent'],
        properties: Object.fromEntries(CAPTURE.map(([n, t, d, c]) => [
          n, { type: t === 'enum' ? 'string' : t, description: d, ...(c ? { enum: c } : {}) },
        ])),
      },
    },
  ];
}

const lp = await req('PATCH', `/update-retell-llm/${LLM}`, llmPatch);
if (!lp.ok) die(`update-retell-llm -> ${lp.status} ${JSON.stringify(lp.body).slice(0, 300)}`);
console.log(`llm patched   : prompt ${PROMPT.length} chars · begin_message set${MODEL ? ' · model ' + MODEL : ''}${FN_URL ? ' · write_reservation registered' : ''}`);

const agPatch = {
  voice_id: VOICE,
  boosted_keywords: BOOSTED,
  post_call_analysis_data: [
    ...(ag0.body.post_call_analysis_data || []).filter(c => SYSTEM_PRESETS.includes(c.name)),
    ...CAPTURE.map(cadEntry),
  ],
};
const ap = await req('PATCH', `/update-agent/${AGENT}`, agPatch);
if (!ap.ok) die(`update-agent -> ${ap.status} ${JSON.stringify(ap.body).slice(0, 300)}`);
console.log(`agent patched : voice ${VOICE} · ${agPatch.post_call_analysis_data.length} capture keys · ${BOOSTED.length} boosted keywords`);

/* ── readback ────────────────────────────────────────────────────────────── */
const ag1 = await req('GET', `/get-agent/${AGENT}`);
const llm1 = await req('GET', `/get-retell-llm/${LLM}`);
const liveP = llm1.body.general_prompt || '';
console.log('\n=== READBACK ===');
console.log(`prompt byte-match : ${liveP === PROMPT ? 'PASS' : 'FAIL'} (${liveP.length} vs ${PROMPT.length})`);
console.log(`voice             : ${ag1.body.voice_id}`);
console.log(`model             : ${llm1.body.model}`);
console.log(`capture keys      : ${(ag1.body.post_call_analysis_data || []).length}`);
console.log(`tools             : ${(llm1.body.general_tools || []).map(t => t.name).join(', ') || '(none)'}`);
console.log(`agent version     : v${ag1.body.version}  published=${ag1.body.is_published}`);
console.log(`\nNOT PUBLISHED. ${TARGET_NUMBER} still serves latest_published.`);
if (!(llm1.body.general_tools || []).some(t => t.name === 'write_reservation')) {
  console.log('GATE: write_reservation unregistered — --publish will refuse until --fn-url is supplied.');
}
