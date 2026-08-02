#!/usr/bin/env node
/* ============================================================================
   tools/retell-v37-test-verify.mjs  ·  AVA 8930 TUNE
   ----------------------------------------------------------------------------
   Publishes (if needed) and re-verifies "AVA SALES v37 TEST" from a fresh
   fetch. Never trusts a write echo. Never touches the live agent.

     doppler run --project ava-prod --config prd -- \
       node tools/retell-v37-test-verify.mjs --in <dumpdir> [--publish]
   ========================================================================== */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const API = 'https://api.retellai.com';
const KEY = process.env.RETELL_API_KEY;
if (!KEY) { console.error('RETELL_API_KEY missing.'); process.exit(1); }
const args = process.argv.slice(2);
const IN = args[args.indexOf('--in') + 1];
const DO_PUB = args.includes('--publish');

const LIVE_AGENT = 'agent_d5ada9f774fe3ae7f034d2c677';
const LIVE_LLM = 'llm_d0f4aff62bb8b60ff878055aa18c';

async function call(method, path, body) {
  if (method !== 'GET' && (path.includes(LIVE_AGENT) || path.includes(LIVE_LLM)))
    throw new Error('REFUSED: write against LIVE object');
  const r = await fetch(API + path, {
    method, headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch { }
  if (!r.ok) { console.error(`${method} ${path} -> ${r.status}`); console.error(t.slice(0, 600)); process.exit(1); }
  return j ?? {};
}

const built = JSON.parse(readFileSync(join(IN, 'v37-test-built.json'), 'utf8'));
const src = JSON.parse(readFileSync(join(IN, 'published-v38-agent.json'), 'utf8'));
const AID = built.agent_id;

if (DO_PUB) {
  const cur = await call('GET', `/get-agent/${AID}`);
  if (!cur.is_published) {
    await call('POST', `/publish-agent-version/${AID}`, {
      version: cur.version,
      version_title: 'v37 TEST baseline',
      version_description: 'AVA 8930 TUNE — tuning test agent, no phone number bound.'
    });
    console.log(`published ${AID} v${cur.version}`);
  } else console.log('already published');
}

const a = await call('GET', `/get-agent/${AID}`);
const numbers = await call('GET', '/list-phone-numbers');
const bound = numbers.filter(n =>
  (n.inbound_agents || []).some(x => x.agent_id === AID) ||
  (n.outbound_agents || []).some(x => x.agent_id === AID));
const live = await call('GET', `/get-agent/${LIVE_AGENT}`);
const liveNums = numbers.find(n => n.phone_number === '+14142408930');

const HB = {
  smart_matching: true, ai_disclosure: true, scope_boundaries: true,
  default_personality: false, natural_filler_words: false, high_empathy: false,
  echo_verification: false, speech_normalization: false, nato_phonetic_alphabet: false
};
let pass = true;
const chk = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) pass = false;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(30)} got=${JSON.stringify(got)} want=${JSON.stringify(want)}`);
};

console.log('=== v37 TEST — VERIFY (fresh fetch) ===');
chk('agent_name', a.agent_name, 'AVA SALES v37 TEST');
chk('is_published', a.is_published, true);
chk('interruption_sensitivity', a.interruption_sensitivity, 0.82);
chk('enable_backchannel', a.enable_backchannel, true);
chk('backchannel_frequency', a.backchannel_frequency, 0.35);
chk('denoising_mode', a.denoising_mode, 'noise-cancellation');
chk('voice_id (unchanged)', a.voice_id, src.voice_id);
chk('voice_temperature (unchanged)', a.voice_temperature, src.voice_temperature);
chk('voice_speed (unchanged)', a.voice_speed, src.voice_speed);
chk('volume (unchanged)', a.volume, src.volume);
for (const [k, v] of Object.entries(HB)) chk('handbook.' + k, (a.handbook_config || {})[k], v);
chk('phone numbers bound', bound.length, 0);
chk('webhook_url omitted', a.webhook_url ?? null, null);
chk('llm isolated from live', a.response_engine.llm_id !== LIVE_LLM, true);

console.log('\n=== LIVE 8930 RAIL — UNTOUCHED ===');
chk('live agent_id', live.agent_id, LIVE_AGENT);
chk('live llm_id', live.response_engine.llm_id, LIVE_LLM);
chk('live voice_id', live.voice_id, src.voice_id);
chk('live interruption_sensitivity', live.interruption_sensitivity, 0.82);
chk('live enable_backchannel', live.enable_backchannel, false);
chk('live handbook untouched', live.handbook_config, src.handbook_config);
chk('8930 still bound to live', (liveNums.inbound_agents || [])[0].agent_id, LIVE_AGENT);
chk('8930 serves', (liveNums.inbound_agents || [])[0].agent_version, 'latest_published');

const wc = await call('POST', '/v2/create-web-call', { agent_id: AID });
console.log(`\n  ${wc.call_id ? 'PASS' : 'FAIL'}  web-test-callable              call_id=${wc.call_id} status=${wc.call_status} agent_v=${wc.agent_version}`);
if (!wc.call_id) pass = false;

writeFileSync(join(IN, 'v37-verify.json'), JSON.stringify({ agent: a, bound: bound.length, web_call: wc.call_id, pass }, null, 2));
console.log('\n' + (pass ? 'ALL CHECKS PASS' : 'CHECKS FAILED'));
process.exit(pass ? 0 : 1);
