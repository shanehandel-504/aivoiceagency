#!/usr/bin/env node
/* ============================================================================
   tools/retell-v37-assemble.mjs  ·  AVA v37 TEST ASSEMBLY
   ----------------------------------------------------------------------------
   Assembles "AVA SALES v37 TEST" (agent_44b48507d38c0bfc29a3150a74):
     1 · KB   — creates Retell KB "AVA-SALES-KB-v1", one text document
     2 · LLM  — replaces general_prompt byte-exact, attaches the KB
     3 · PIN  — re-points agent.response_engine.version at the NEW llm version
     4 · SET  — interruption 0.82 · backchannel 0.35 · denoise ON · handbook · voice
     5 · PUB  — publish-agent-version, then verify from a FRESH fetch
     6 · LIVE — asserts the 8930 rail is byte-identical before and after

   WHY STEP 3 EXISTS (the trap this run hit):
     agent.response_engine pins {llm_id, version:N}. Updating the LLM mints a
     NEW llm version; the agent keeps serving the OLD pinned one. Patching the
     prompt WITHOUT re-pinning verifies green on the LLM object while the agent
     still speaks the previous prompt. Always re-pin, then re-fetch the AGENT
     (not the LLM) and diff the prompt that the agent actually resolves.

   The LIVE 8930 agent is READ-ONLY: every non-GET against the live agent or
   live LLM throws before the request is issued.

   USAGE:
     doppler run --project ava-prod --config prd -- \
       node tools/retell-v37-assemble.mjs --prompt <f> --kb <f> --out <dir> [--commit]
   ========================================================================== */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const API = 'https://api.retellai.com';
const KEY = process.env.RETELL_API_KEY;
if (!KEY) { console.error('RETELL_API_KEY missing — run through doppler.'); process.exit(1); }

const args = process.argv.slice(2);
const argOf = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; };
const PROMPT_F = argOf('--prompt');
const KB_F = argOf('--kb');
const OUT = argOf('--out');
const COMMIT = args.includes('--commit');
if (!PROMPT_F || !KB_F || !OUT) { console.error('--prompt <f> --kb <f> --out <dir> required'); process.exit(1); }
mkdirSync(OUT, { recursive: true });

/* ---------- identities (re-verified against the API, never pasted-trusted) -- */
const TEST_AGENT = 'agent_44b48507d38c0bfc29a3150a74';
const LIVE_AGENT = 'agent_d5ada9f774fe3ae7f034d2c677';
const LIVE_LLM = 'llm_d0f4aff62bb8b60ff878055aa18c';
const KB_NAME = 'AVA-SALES-KB-v1';
const VOICE = 'custom_voice_705a2cb49b0413f7fc1c456d02'; // ElevenLabs "Ava – Eager, Helpful and Understanding" (gJx1vCzNCD1EQHT212Ls)

const HANDBOOK = {
  smart_matching: true,          // ON  — ordered
  ai_disclosure: true,           // ON  — ordered
  scope_boundaries: true,        // ON  — ordered
  default_personality: false,    // OFF — "Default Tone OFF"
  natural_filler_words: false,   // OFF — "Filler Words OFF"
  high_empathy: false,           // OFF — "High Empathy OFF"
  echo_verification: false,      // OFF — ALL others
  speech_normalization: false,   // OFF
  nato_phonetic_alphabet: false  // OFF
};

/* ---------- transport with a live-object write guard ---------------------- */
async function call(method, path, body, raw) {
  if (method !== 'GET' && (path.includes(LIVE_AGENT) || path.includes(LIVE_LLM)))
    throw new Error('REFUSED: write against a LIVE object — ' + method + ' ' + path);
  const headers = { Authorization: `Bearer ${KEY}` };
  let payload;
  if (raw) { payload = body; }
  else if (body) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  const r = await fetch(API + path, { method, headers, body: payload });
  const t = await r.text();
  let j = null; try { j = JSON.parse(t); } catch { }
  if (!r.ok) { const e = new Error(`${method} ${path} -> ${r.status}: ${t.slice(0, 500)}`); e.status = r.status; throw e; }
  return j ?? {};
}
const get = p => call('GET', p);

/* ---------- byte-exact sources -------------------------------------------- */
const PROMPT = readFileSync(PROMPT_F, 'utf8').replace(/\r\n/g, '\n').replace(/\n+$/, '');
const KB_TEXT = readFileSync(KB_F, 'utf8').replace(/\r\n/g, '\n').replace(/\n+$/, '');
console.log(`prompt source : ${PROMPT.length} chars, ${PROMPT.split('\n').length} lines`);
console.log(`kb source     : ${KB_TEXT.length} chars, ${KB_TEXT.split('\n').length} lines`);

/* ---------- BEFORE snapshot of the live rail ------------------------------ */
const liveBefore = await get(`/get-agent/${LIVE_AGENT}?version=38`);
const liveLlmBefore = await get(`/get-retell-llm/${LIVE_LLM}`);
const numsBefore = await get('/list-phone-numbers');
const n8930 = numsBefore.find(n => n.phone_number === '+14142408930');
writeFileSync(join(OUT, 'live-v38-before.json'), JSON.stringify(liveBefore, null, 2));
console.log(`\nLIVE v38 before : voice=${liveBefore.voice_id} llm=${liveBefore.response_engine.llm_id}@v${liveBefore.response_engine.version} promptChars=${(liveLlmBefore.general_prompt || '').length}`);
console.log(`8930 bound to   : ${(n8930.inbound_agents || [])[0]?.agent_id}@${(n8930.inbound_agents || [])[0]?.agent_version}`);

const agentBefore = await get(`/get-agent/${TEST_AGENT}`);
console.log(`TEST before     : v${agentBefore.version} pub=${agentBefore.is_published} llm=${agentBefore.response_engine.llm_id}@v${agentBefore.response_engine.version}`);
const LLM_ID = agentBefore.response_engine.llm_id;
if (LLM_ID === LIVE_LLM) { console.error('ABORT: test agent points at the LIVE llm.'); process.exit(1); }

if (!COMMIT) { console.log('\nDRY RUN — pass --commit to write.'); process.exit(0); }

/* ========================= 1 · KNOWLEDGE BASE ============================== */
console.log('\n=== 1 · KNOWLEDGE BASE ===');
const existing = (await get('/list-knowledge-bases')).find(k => k.knowledge_base_name === KB_NAME);
let kb;
if (existing) {
  console.log(`reusing existing "${KB_NAME}" -> ${existing.knowledge_base_id}`);
  kb = existing;
} else {
  /* Retell /create-knowledge-base is multipart/form-data. knowledge_base_texts
     must be a JSON-encoded ARRAY of {title,text} — a bare object 400s with
     "not an array". */
  const DOC = { title: 'AVA SALES KB v1 — LIMO VERTICAL FACTS', text: KB_TEXT };
  const fd = new FormData();
  fd.append('knowledge_base_name', KB_NAME);
  fd.append('enable_auto_refresh', 'false');
  fd.append('knowledge_base_texts', JSON.stringify([DOC]));
  kb = await call('POST', '/create-knowledge-base', fd, true);
  console.log(`created ${kb.knowledge_base_id} status=${kb.status}`);
}
const KB_ID = kb.knowledge_base_id;

/* poll to completion — an in-progress KB retrieves nothing at call time */
for (let i = 0; i < 40 && kb.status !== 'complete'; i++) {
  await new Promise(r => setTimeout(r, 3000));
  kb = await get(`/get-knowledge-base/${KB_ID}`);
  process.stdout.write(`  poll ${i + 1}: ${kb.status}\r`);
}
console.log(`\nKB status: ${kb.status}  sources=${(kb.knowledge_base_sources || []).length}`);
if (kb.status !== 'complete') { console.error('ABORT: KB never reached complete.'); process.exit(1); }
writeFileSync(join(OUT, 'kb.json'), JSON.stringify(kb, null, 2));

/* ========================= 2 · FORK an editable draft ===================== */
/* Retell version semantics, learned the hard way this run:
     · PATCH /update-agent on a published version   -> 422 "Cannot update published agent"
     · PATCH /update-retell-llm on a published one  -> 400 "Cannot update published LLM"
     · no /create-retell-llm-version endpoint exists (404)
     · response_engine.version MUST equal the agent version (400 otherwise)
   POST /create-agent-version forks the agent AND its paired LLM to the same new
   UNPUBLISHED version number. That paired draft is the only writable surface,
   and it keeps the test brain on its own llm_id — still isolated from live. */
console.log('\n=== 2 · fork an editable draft (agent + paired LLM) ===');
let draftV;
const allVersions = await get(`/get-agent/${TEST_AGENT}`).then(x => x.version);
const head = await get(`/get-agent/${TEST_AGENT}?version=${allVersions}`);
if (!head.is_published) {
  draftV = head.version;
  console.log(`reusing existing unpublished draft v${draftV}`);
} else {
  const forked = await call('POST', `/create-agent-version/${TEST_AGENT}`, { base_version: head.version });
  draftV = forked.version;
  console.log(`forked v${head.version} -> v${draftV} (published=${forked.is_published})`);
  if (forked.is_published) { console.error('ABORT: fork came back published.'); process.exit(1); }
}
/* the fork takes base_version ONLY — any extra key 400s "must NOT have
   additional properties" — so the deltas go on in the PATCHes below. */

/* ========================= 3 · LLM draft: prompt + KB ===================== */
console.log('\n=== 3 · LLM draft (prompt byte-exact + KB attach) ===');
const llmPatched = await call('PATCH', `/update-retell-llm/${LLM_ID}?version=${draftV}`, {
  general_prompt: PROMPT,
  knowledge_base_ids: [KB_ID]
});
console.log(`patched ${LLM_ID}@v${llmPatched.version}`);
console.log(`  prompt chars=${(llmPatched.general_prompt || '').length} byte-exact=${llmPatched.general_prompt === PROMPT}`);
console.log(`  kb_ids=${JSON.stringify(llmPatched.knowledge_base_ids)}  tools=${(llmPatched.general_tools || []).map(t => t.name).join(', ')}`);
if (llmPatched.general_prompt !== PROMPT) { console.error('ABORT — prompt drifted on write.'); process.exit(1); }
const NEW_LLM_ID = LLM_ID, NEW_LLM_V = draftV;

/* ========================= 3b · agent draft: settings ===================== */
console.log('\n=== 3b · agent draft settings ===');
const agentPatched = await call('PATCH', `/update-agent/${TEST_AGENT}?version=${draftV}`, {
  voice_id: VOICE,
  interruption_sensitivity: 0.82,
  enable_backchannel: true,
  backchannel_frequency: 0.35,
  denoising_mode: 'noise-cancellation',
  handbook_config: HANDBOOK
});
console.log(`patched draft v${agentPatched.version}: llm=${agentPatched.response_engine.llm_id}@v${agentPatched.response_engine.version} int=${agentPatched.interruption_sensitivity} bc=${agentPatched.enable_backchannel}/${agentPatched.backchannel_frequency} denoise=${agentPatched.denoising_mode} voice=${agentPatched.voice_id}`);

/* ========================= 4 · publish ==================================== */
console.log('\n=== 4 · publish ===');
await call('POST', `/publish-agent-version/${TEST_AGENT}`, {
  version: agentPatched.version,
  version_title: 'v37 TEST — prompt+KB assembly',
  version_description: 'AVA v37 TEST ASSEMBLY: final prompt, AVA-SALES-KB-v1, tuned turn-taking. No phone number bound.'
});
console.log(`published v${agentPatched.version}`);

/* ========================= 5 · VERIFY (fresh fetch) ======================= */
console.log('\n=== 5 · VERIFY (fresh fetch — write echoes not trusted) ===');
const a = await get(`/get-agent/${TEST_AGENT}`);
/* resolve the prompt the AGENT actually serves, via its pinned llm version */
const servedLlm = await get(`/get-retell-llm/${a.response_engine.llm_id}?version=${a.response_engine.version}`);
const nums = await get('/list-phone-numbers');
const bound = nums.filter(n =>
  (n.inbound_agents || []).some(x => x.agent_id === TEST_AGENT) ||
  (n.outbound_agents || []).some(x => x.agent_id === TEST_AGENT));

let pass = true;
const chk = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) pass = false;
  const show = v => { const s = JSON.stringify(v); return s && s.length > 60 ? s.slice(0, 57) + '...' : s; };
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(32)} got=${show(got)} want=${show(want)}`);
};

chk('agent_name', a.agent_name, 'AVA SALES v37 TEST');
chk('is_published', a.is_published, true);
chk('prompt byte-exact (as served)', servedLlm.general_prompt === PROMPT, true);
chk('prompt chars', (servedLlm.general_prompt || '').length, PROMPT.length);
chk('KB attached (as served)', servedLlm.knowledge_base_ids, [KB_ID]);
chk('agent pins new llm_id', a.response_engine.llm_id, NEW_LLM_ID);
chk('agent pins new llm version', a.response_engine.version, NEW_LLM_V);
chk('llm isolated from live', a.response_engine.llm_id !== LIVE_LLM, true);
chk('voice_id (EL Ava)', a.voice_id, VOICE);
chk('interruption_sensitivity', a.interruption_sensitivity, 0.82);
chk('enable_backchannel', a.enable_backchannel, true);
chk('backchannel_frequency', a.backchannel_frequency, 0.35);
chk('denoising_mode (denoise ON)', a.denoising_mode, 'noise-cancellation');
for (const [k, v] of Object.entries(HANDBOOK)) chk('handbook.' + k, (a.handbook_config || {})[k], v);
chk('NO phone number bound', bound.length, 0);
chk('webhook_url omitted', a.webhook_url ?? null, null);

/* ---------- 6 · LIVE 8930 rail must be byte-identical --------------------- */
console.log('\n=== 6 · LIVE 8930 RAIL — UNTOUCHED ===');
const liveAfter = await get(`/get-agent/${LIVE_AGENT}?version=38`);
const liveLlmAfter = await get(`/get-retell-llm/${LIVE_LLM}`);
const n8930After = (await get('/list-phone-numbers')).find(n => n.phone_number === '+14142408930');
chk('live v38 agent byte-identical', JSON.stringify(liveAfter), JSON.stringify(liveBefore));
chk('live llm prompt unchanged', liveLlmAfter.general_prompt === liveLlmBefore.general_prompt, true);
chk('live llm version unchanged', liveLlmAfter.version, liveLlmBefore.version);
chk('live llm KB still empty', liveLlmAfter.knowledge_base_ids ?? [], liveLlmBefore.knowledge_base_ids ?? []);
chk('8930 -> live agent', (n8930After.inbound_agents || [])[0]?.agent_id, LIVE_AGENT);
chk('8930 serves latest_published', (n8930After.inbound_agents || [])[0]?.agent_version, 'latest_published');

/* ---------- 7 · prove web-test-callable ----------------------------------- */
console.log('\n=== 7 · WEB TEST CALL ===');
let wc = null;
try {
  wc = await call('POST', '/v2/create-web-call', { agent_id: TEST_AGENT });
  console.log(`  PASS  web-test-callable  call_id=${wc.call_id} status=${wc.call_status} agent_v=${wc.agent_version}`);
  if (!wc.access_token) { console.log('  FAIL  no access_token returned'); pass = false; }
} catch (e) { pass = false; console.log('  FAIL  web-test-callable  ' + e.message); }

writeFileSync(join(OUT, 'v37-assembled.json'), JSON.stringify({
  agent_id: TEST_AGENT, agent_version: a.version, is_published: a.is_published,
  llm_id: a.response_engine.llm_id, llm_version: a.response_engine.version,
  knowledge_base_id: KB_ID, knowledge_base_name: KB_NAME, kb_status: kb.status,
  prompt_chars: PROMPT.length, prompt_byte_exact: servedLlm.general_prompt === PROMPT,
  voice_id: a.voice_id, phone_numbers_bound: bound.length,
  web_call_id: wc?.call_id ?? null, verify_pass: pass
}, null, 2));
writeFileSync(join(OUT, 'v37-agent-after.json'), JSON.stringify(a, null, 2));
writeFileSync(join(OUT, 'v37-llm-served.json'), JSON.stringify(servedLlm, null, 2));

console.log('\n' + (pass ? 'ALL CHECKS PASS' : 'CHECKS FAILED'));
process.exit(pass ? 0 : 1);
