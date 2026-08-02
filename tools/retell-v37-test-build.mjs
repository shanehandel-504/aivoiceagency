#!/usr/bin/env node
/* ============================================================================
   tools/retell-v37-test-build.mjs  ·  AVA 8930 TUNE
   ----------------------------------------------------------------------------
   Builds "AVA SALES v37 TEST" as an isolated duplicate of the LIVE PUBLISHED
   agent (v38 — the version 414-240-8930 actually serves, not the v39 draft).

   ISOLATION, and why it is not optional:
     · A NEW Retell LLM object is created carrying a BYTE-IDENTICAL copy of the
       live general_prompt. Pointing the test agent at the live llm_id would
       make every later tuning edit mutate the LIVE agent's brain — the exact
       shared-mutable-state trap the shared ElevenLabs voice already sets.
     · webhook_url is DELIBERATELY OMITTED. The live agent posts call_analyzed
       to the CRM pipeline; a web test firing that would upsert junk into GHL.
       The webhook has zero effect on latency/voice/turn-taking, so dropping it
       costs nothing for tuning and protects real lead data.
     · NO phone number is bound. Ever.

   The live agent is READ-ONLY here: this script issues no PATCH/POST against
   agent_d5ada9f774fe3ae7f034d2c677 or llm_d0f4aff62bb8b60ff878055aa18c.

   USAGE:
     doppler run --project ava-prod --config prd -- \
       node tools/retell-v37-test-build.mjs --in <dumpdir> [--commit]
   ========================================================================== */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const API = 'https://api.retellai.com';
const KEY = process.env.RETELL_API_KEY;
if (!KEY) { console.error('RETELL_API_KEY missing — run through doppler.'); process.exit(1); }

const args = process.argv.slice(2);
const argOf = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; };
const IN = argOf('--in', null);
const COMMIT = args.includes('--commit');
if (!IN) { console.error('--in <dumpdir> required'); process.exit(1); }

const LIVE_AGENT = 'agent_d5ada9f774fe3ae7f034d2c677';
const LIVE_LLM = 'llm_d0f4aff62bb8b60ff878055aa18c';
const NAME = 'AVA SALES v37 TEST';

async function call(method, path, body) {
  /* hard guard: this tool must never write to the live objects */
  if (method !== 'GET' && (path.includes(LIVE_AGENT) || path.includes(LIVE_LLM))) {
    throw new Error('REFUSED: write attempt against a LIVE object — ' + method + ' ' + path);
  }
  const r = await fetch(API + path, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const txt = await r.text();
  let json = null; try { json = JSON.parse(txt); } catch { }
  if (!r.ok) { console.error(`${method} ${path} -> ${r.status}`); console.error(txt.slice(0, 800)); process.exit(1); }
  return json;
}

const srcAgent = JSON.parse(readFileSync(join(IN, 'published-v38-agent.json'), 'utf8'));
const srcLlm = JSON.parse(readFileSync(join(IN, 'published-v38-llm.json'), 'utf8'));

/* ---------- the tuning deltas, stated once -------------------------------- */
const HANDBOOK = {
  smart_matching: true,        // ON  — ordered
  ai_disclosure: true,         // ON  — ordered
  scope_boundaries: true,      // ON  — ordered
  default_personality: false,  // OFF — "ALL other modules OFF"
  natural_filler_words: false, // OFF
  high_empathy: false,         // OFF
  echo_verification: false,    // OFF
  speech_normalization: false, // OFF
  nato_phonetic_alphabet: false// OFF
};

console.log('=== SOURCE (LIVE PUBLISHED v38) ===');
console.log('interruption_sensitivity :', srcAgent.interruption_sensitivity);
console.log('enable_backchannel       :', srcAgent.enable_backchannel);
console.log('backchannel_frequency    :', srcAgent.backchannel_frequency ?? '(unset)');
console.log('denoising_mode           :', srcAgent.denoising_mode);
console.log('volume                   :', srcAgent.volume);
console.log('voice_id                 :', srcAgent.voice_id);
console.log('voice_temperature/speed  :', srcAgent.voice_temperature, '/', srcAgent.voice_speed);
console.log('handbook_config          :', JSON.stringify(srcAgent.handbook_config));

if (!COMMIT) { console.log('\nDRY RUN — pass --commit to build.'); process.exit(0); }

/* ---------- 1 · isolated LLM copy (prompt byte-identical) ----------------- */
const llmBody = {
  model: srcLlm.model,
  model_temperature: srcLlm.model_temperature,
  model_high_priority: srcLlm.model_high_priority,
  tool_call_strict_mode: srcLlm.tool_call_strict_mode,
  general_prompt: srcLlm.general_prompt,
  begin_message: srcLlm.begin_message,
  general_tools: srcLlm.general_tools,
  start_speaker: srcLlm.start_speaker,
  default_dynamic_variables: srcLlm.default_dynamic_variables || {},
  knowledge_base_ids: srcLlm.knowledge_base_ids || []
};
const newLlm = await call('POST', '/create-retell-llm', llmBody);
console.log('\nNEW LLM :', newLlm.llm_id, 'v' + newLlm.version);

const promptOk = newLlm.general_prompt === srcLlm.general_prompt;
console.log('prompt byte-identical to live :', promptOk, `(${(newLlm.general_prompt || '').length} chars)`);
if (!promptOk) { console.error('ABORT — prompt copy drifted.'); process.exit(1); }

/* ---------- 2 · the test agent -------------------------------------------- */
const agentBody = {
  agent_name: NAME,
  response_engine: { type: 'retell-llm', llm_id: newLlm.llm_id },

  /* voice — UNCHANGED from live (shared ElevenLabs custom voice) */
  voice_id: srcAgent.voice_id,
  voice_temperature: srcAgent.voice_temperature,
  voice_speed: srcAgent.voice_speed,
  volume: srcAgent.volume,

  /* the ordered tuning deltas */
  interruption_sensitivity: 0.82,
  enable_backchannel: true,
  backchannel_frequency: 0.35,
  denoising_mode: 'noise-cancellation',
  handbook_config: HANDBOOK,

  /* carried over verbatim so the baseline stays comparable */
  language: srcAgent.language,
  responsiveness: srcAgent.responsiveness,
  ambient_sound: srcAgent.ambient_sound,
  ambient_sound_volume: srcAgent.ambient_sound_volume,
  begin_message_delay_ms: srcAgent.begin_message_delay_ms,
  end_call_after_silence_ms: srcAgent.end_call_after_silence_ms,
  max_call_duration_ms: srcAgent.max_call_duration_ms,
  ring_duration_ms: srcAgent.ring_duration_ms,
  stt_mode: srcAgent.stt_mode,
  vocab_specialization: srcAgent.vocab_specialization,
  boosted_keywords: srcAgent.boosted_keywords || [],
  allow_user_dtmf: srcAgent.allow_user_dtmf,
  allow_dtmf_interruption: srcAgent.allow_dtmf_interruption,
  timezone: srcAgent.timezone,
  post_call_analysis_model: srcAgent.post_call_analysis_model,
  post_call_analysis_data: srcAgent.post_call_analysis_data,
  voicemail_option: srcAgent.voicemail_option
  /* webhook_url INTENTIONALLY OMITTED — see header */
};
const newAgent = await call('POST', '/create-agent', agentBody);
console.log('NEW AGENT :', newAgent.agent_id, '"' + newAgent.agent_name + '" v' + newAgent.version);

/* ---------- 3 · publish so it is callable --------------------------------- */
/* NOTE: POST /publish-agent/{id} was DEPRECATED 2026-07-20. The unified
   endpoint is POST /publish-agent-version/{id} with an explicit version. */
await call('POST', `/publish-agent-version/${newAgent.agent_id}`, {
  version: newAgent.version,
  version_title: 'v37 TEST baseline',
  version_description: 'AVA 8930 TUNE — tuning test agent, no phone number bound.'
});
console.log('publish-agent-version -> ok (v' + newAgent.version + ')');

/* ---------- 4 · VERIFY (re-fetch, never trust the write echo) ------------- */
const check = await call('GET', `/get-agent/${newAgent.agent_id}`);
const numbers = await call('GET', '/list-phone-numbers');
const bound = numbers.filter(n =>
  (n.inbound_agents || []).some(a => a.agent_id === check.agent_id) ||
  (n.outbound_agents || []).some(a => a.agent_id === check.agent_id) ||
  n.inbound_agent_id === check.agent_id || n.outbound_agent_id === check.agent_id);

/* live agent must be untouched */
const liveNow = await call('GET', `/get-agent/${LIVE_AGENT}`);

console.log('\n=== VERIFY (re-fetched) ===');
const rows = [
  ['agent_name', check.agent_name, NAME],
  ['interruption_sensitivity', check.interruption_sensitivity, 0.82],
  ['enable_backchannel', check.enable_backchannel, true],
  ['backchannel_frequency', check.backchannel_frequency, 0.35],
  ['denoising_mode', check.denoising_mode, 'noise-cancellation'],
  ['voice_id', check.voice_id, srcAgent.voice_id],
  ['voice_temperature', check.voice_temperature, srcAgent.voice_temperature],
  ['voice_speed', check.voice_speed, srcAgent.voice_speed],
  ['volume', check.volume, srcAgent.volume],
  ['is_published', check.is_published, true]
];
let pass = true;
for (const [k, got, want] of rows) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) pass = false;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${k.padEnd(26)} got=${JSON.stringify(got)} want=${JSON.stringify(want)}`);
}
for (const [k, want] of Object.entries(HANDBOOK)) {
  const got = (check.handbook_config || {})[k];
  const ok = got === want;
  if (!ok) pass = false;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  handbook.${k.padEnd(24)} got=${JSON.stringify(got)} want=${JSON.stringify(want)}`);
}
console.log(`  ${bound.length === 0 ? 'PASS' : 'FAIL'}  NO phone number bound        bound=${bound.length}`);
if (bound.length) pass = false;
console.log(`  ${check.webhook_url ? 'FAIL' : 'PASS'}  webhook_url omitted          got=${JSON.stringify(check.webhook_url || null)}`);
if (check.webhook_url) pass = false;

const liveOk = liveNow.agent_id === LIVE_AGENT &&
  liveNow.response_engine.llm_id === LIVE_LLM &&
  liveNow.voice_id === srcAgent.voice_id;
console.log(`  ${liveOk ? 'PASS' : 'FAIL'}  LIVE agent untouched         v${liveNow.version} llm=${liveNow.response_engine.llm_id}`);

/* ---------- 5 · prove web-test-callable ----------------------------------- */
let webCall = null;
try {
  webCall = await call('POST', '/v2/create-web-call', { agent_id: check.agent_id });
  console.log(`  PASS  web-test-callable        call_id=${webCall.call_id} status=${webCall.call_status}`);
} catch (e) {
  pass = false;
  console.log('  FAIL  web-test-callable        ' + e.message);
}

writeFileSync(join(IN, 'v37-test-built.json'), JSON.stringify({
  agent_id: check.agent_id, agent_name: check.agent_name, version: check.version,
  is_published: check.is_published, llm_id: newLlm.llm_id, llm_version: newLlm.version,
  prompt_chars: (newLlm.general_prompt || '').length,
  phone_numbers_bound: bound.length, web_call_probe: webCall ? webCall.call_id : null,
  verify_pass: pass
}, null, 2));
writeFileSync(join(IN, 'v37-test-agent.json'), JSON.stringify(check, null, 2));
writeFileSync(join(IN, 'v37-test-llm.json'), JSON.stringify(newLlm, null, 2));

console.log('\n' + (pass ? 'ALL CHECKS PASS' : 'CHECKS FAILED'));
process.exit(pass ? 0 : 1);
