#!/usr/bin/env node
/* ============================================================================
   tools/retell-sonic36-probe.mjs  ·  SONIC 3.6 PROBE (CLONE ONLY)
   ----------------------------------------------------------------------------
   Duplicates AI CHAUFFEUR FLOW v1 into a throwaway probe agent named
   "ZZ SONIC36 PROBE" and walks a voice_model ladder on the CLONE ONLY,
   reporting the exact string the Retell API accepts and the exact error body
   for every string it rejects.

   WHY THIS SCRIPT EXISTS AS A SCRIPT:
     The remote Claude Code session that authored it cannot reach
     api.retellai.com — every *.retellai.com host is denied by the container's
     organization egress policy (connect_rejected on CONNECT), and there is no
     Doppler CLI and no RETELL_API_KEY in that environment. So the probe is
     shipped as one command Shane runs on a machine that HAS both.

   ISOLATION — the live rail is READ-ONLY here:
     · A hard write-guard (see `call`) throws on ANY non-GET whose path names
       the live chauffeur agent, the live AVA agent, or either live LLM.
       The script cannot mutate a live object even if edited carelessly.
     · A NEW Retell LLM object carries a byte-identical copy of the source
       prompt. Pointing the clone at the live llm_id would make any later
       version fork mutate the live agent's brain (the shared-mutable-state
       trap RUN v37 documented the hard way).
     · webhook_url / webhook_events are DELIBERATELY DROPPED. The live agent
       posts call_analyzed into the CRM path; a probe firing that would upsert
       junk into GHL. Zero effect on voice, so dropping it costs nothing and
       honors CLAUDE.md Sec 9 OWNER RAIL LAW.
     · NO phone number is bound. Ever. Asserted against the live number list
       at the end of the run.

   ONE PROBE TOTAL:
     Step 1 lists agents (POST /v2/list-agents — the legacy /list-agents was
     capped at 100 rows and hid an agent) and REUSES an existing
     "ZZ SONIC36 PROBE" if a previous session already made one, rather than
     creating a second.

   USAGE:
     doppler run --project ava-prod --config prd -- \
       node tools/retell-sonic36-probe.mjs            # dry run, reads only
     doppler run --project ava-prod --config prd -- \
       node tools/retell-sonic36-probe.mjs --commit   # creates + probes
   ========================================================================== */

import { writeFileSync } from 'node:fs';

const API = 'https://api.retellai.com';
const KEY = process.env.RETELL_API_KEY;
if (!KEY) {
  console.error('RETELL_API_KEY missing — run through `doppler run --project ava-prod --config prd --`.');
  process.exit(1);
}

const COMMIT = process.argv.includes('--commit');

const SRC_AGENT = 'agent_2d1d687eb85e6d5d0e720795c2';   // AI CHAUFFEUR FLOW v1 — LIVE, read-only
const PROBE_NAME = 'ZZ SONIC36 PROBE';

/* Every live object this script must never write to. The chauffeur LLM id is
   resolved at runtime from the source agent and appended before any write. */
const LIVE_READONLY = new Set([
  SRC_AGENT,
  'agent_d5ada9f774fe3ae7f034d2c677',   // AVA SALES — live on 414-240-8930
  'llm_d0f4aff62bb8b60ff878055aa18c',   // AVA SALES brain
]);

/* The ladder. Order is the brief's: 3.6 first, then the -latest alias, then a
   control that is known-good so a total failure is distinguishable from a
   broken request. Each rung records status + verbatim body. */
const LADDER = [
  { model: 'sonic-3.6', note: 'brief target — Cartesia GA model id' },
  { model: 'sonic-3-latest', note: 'brief fallback — rolling alias' },
  { model: 'sonic-3.5', note: 'CONTROL — source agent already runs this' },
];

const results = [];

async function call(method, path, body) {
  if (method !== 'GET') {
    for (const id of LIVE_READONLY) {
      if (path.includes(id)) {
        throw new Error(`REFUSED: write against a LIVE object — ${method} ${path}`);
      }
    }
  }
  const r = await fetch(API + path, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* keep raw */ }
  return { status: r.status, ok: r.ok, body: json, raw: text };
}

function die(label, res) {
  console.error(`\nFAILED ${label} -> HTTP ${res.status}`);
  console.error(res.raw.slice(0, 1200));
  process.exit(1);
}

/* ---------- 1. source agent, read-only ------------------------------------ */
console.log('=== 1. SOURCE (read-only) ===');
const src = await call('GET', `/get-agent/${SRC_AGENT}`);
if (!src.ok) die(`GET /get-agent/${SRC_AGENT}`, src);
const srcLlmId = src.body?.response_engine?.llm_id;
if (srcLlmId) LIVE_READONLY.add(srcLlmId);

console.log(`  agent_name   : ${src.body.agent_name}`);
console.log(`  version      : v${src.body.version} (published=${src.body.is_published})`);
console.log(`  voice_id     : ${src.body.voice_id}`);
console.log(`  voice_model  : ${src.body.voice_model ?? '(unset)'}`);
console.log(`  llm_id       : ${srcLlmId ?? '(none)'} — added to write-guard`);

/* ---------- 2. existing probe? one probe total ---------------------------- */
console.log('\n=== 2. EXISTING PROBE CHECK (POST /v2/list-agents) ===');
const listed = [];
let pageKey = null;
for (let page = 0; page < 25; page++) {
  const res = await call('POST', '/v2/list-agents',
    pageKey ? { limit: 1000, pagination_key: pageKey } : { limit: 1000 });
  if (!res.ok) die('POST /v2/list-agents', res);
  const items = res.body?.items ?? [];
  listed.push(...items);
  pageKey = res.body?.pagination_key ?? null;
  if (!pageKey || items.length === 0) break;
}
console.log(`  ${listed.length} agents visible`);
const priorProbes = listed.filter(a => (a.agent_name ?? '').trim() === PROBE_NAME);
for (const p of priorProbes) {
  console.log(`  PRIOR PROBE FOUND: ${p.agent_id} — v${p.version} — voice_model=${p.voice_model ?? '(unset)'}`);
}
if (priorProbes.length > 1) {
  console.log(`  NOTE: ${priorProbes.length} agents share this name. Reusing the FIRST; delete the rest by hand.`);
}

if (!COMMIT) {
  console.log('\nDRY RUN — nothing created. Re-run with --commit to build and probe.');
  process.exit(0);
}

/* ---------- 3. clone (isolated LLM + agent, no number, no webhook) -------- */
let probeId = priorProbes[0]?.agent_id ?? null;

if (probeId) {
  console.log(`\n=== 3. CLONE — REUSING ${probeId} (one probe total) ===`);
} else {
  console.log('\n=== 3. CLONE — CREATING ===');

  const srcLlm = await call('GET', `/get-retell-llm/${srcLlmId}`);
  if (!srcLlm.ok) die(`GET /get-retell-llm/${srcLlmId}`, srcLlm);

  const L = srcLlm.body;
  const llmPayload = {
    model: L.model,
    model_temperature: L.model_temperature,
    model_high_priority: L.model_high_priority,
    tool_call_strict_mode: L.tool_call_strict_mode,
    general_prompt: L.general_prompt,
    general_tools: L.general_tools,
    states: L.states,
    starting_state: L.starting_state,
    begin_message: L.begin_message,
    default_dynamic_variables: L.default_dynamic_variables,
    knowledge_base_ids: L.knowledge_base_ids,
  };
  for (const k of Object.keys(llmPayload)) if (llmPayload[k] === undefined) delete llmPayload[k];

  const newLlm = await call('POST', '/create-retell-llm', llmPayload);
  if (!newLlm.ok) die('POST /create-retell-llm', newLlm);
  const newLlmId = newLlm.body.llm_id;
  console.log(`  isolated LLM : ${newLlmId} (copy of ${srcLlmId}, live brain untouched)`);

  const A = src.body;
  const agentPayload = {
    agent_name: PROBE_NAME,
    response_engine: { type: 'retell-llm', llm_id: newLlmId },
    /* voice: same Kate id, model probed below — 3.6 is backwards compatible
       with 3.5 voice ids, so the id does not change. */
    voice_id: A.voice_id,
    voice_model: A.voice_model,
    voice_speed: A.voice_speed,
    voice_temperature: A.voice_temperature,
    volume: A.volume,
    language: A.language,
    /* turn-taking + audio carried verbatim so the probe is a fair A/B */
    responsiveness: A.responsiveness,
    interruption_sensitivity: A.interruption_sensitivity,
    enable_backchannel: A.enable_backchannel,
    backchannel_frequency: A.backchannel_frequency,
    backchannel_words: A.backchannel_words,
    denoising_mode: A.denoising_mode,
    stt_mode: A.stt_mode,
    vocab_specialization: A.vocab_specialization,
    boosted_keywords: A.boosted_keywords,
    ambient_sound: A.ambient_sound,
    ambient_sound_volume: A.ambient_sound_volume,
    begin_message_delay_ms: A.begin_message_delay_ms,
    end_call_after_silence_ms: A.end_call_after_silence_ms,
    max_call_duration_ms: A.max_call_duration_ms,
    ring_duration_ms: A.ring_duration_ms,
    allow_user_dtmf: A.allow_user_dtmf,
    allow_dtmf_interruption: A.allow_dtmf_interruption,
    handbook_config: A.handbook_config,
    timezone: A.timezone,
    channel: A.channel,
    voicemail_option: A.voicemail_option,
    /* webhook_url / webhook_events / post_call_analysis DELIBERATELY OMITTED —
       a probe must never reach the CRM path. */
  };
  for (const k of Object.keys(agentPayload)) if (agentPayload[k] === undefined) delete agentPayload[k];

  const created = await call('POST', '/create-agent', agentPayload);
  if (!created.ok) die('POST /create-agent', created);
  probeId = created.body.agent_id;
  console.log(`  probe agent  : ${probeId} — v${created.body.version} published=${created.body.is_published}`);
  console.log(`  webhook_url  : ${JSON.stringify(created.body.webhook_url ?? null)} (must be null)`);
}

/* ---------- 4. the ladder ------------------------------------------------- */
console.log('\n=== 4. VOICE MODEL LADDER (clone only) ===');
let accepted = null;

for (const rung of LADDER) {
  const res = await call('PATCH', `/update-agent/${probeId}`, { voice_model: rung.model });
  const entry = {
    model: rung.model,
    note: rung.note,
    status: res.status,
    accepted: res.ok,
    /* verbatim error body — the brief asks for exactly this */
    body: res.ok ? null : res.raw.slice(0, 1500),
    readback: null,
  };

  if (res.ok) {
    /* An HTTP 200 is not proof the value stuck — Retell silently normalizes
       some fields. Only a fresh GET settles it. */
    const back = await call('GET', `/get-agent/${probeId}`);
    entry.readback = back.body?.voice_model ?? null;
    entry.accepted = entry.readback === rung.model;
  }

  results.push(entry);
  const verdict = entry.accepted ? 'ACCEPTED' : 'REJECTED';
  console.log(`  ${rung.model.padEnd(16)} HTTP ${entry.status}  ${verdict}` +
    (entry.readback !== null ? `  read-back=${entry.readback}` : ''));
  if (!res.ok) console.log(`     body: ${entry.body}`);
  if (entry.accepted && !accepted) { accepted = rung.model; break; }
}

/* If 3.6 was rejected the clone is now sitting on whatever the last accepted
   rung set. Leave it on the best accepted string so the clone stays testable. */

/* ---------- 5. read-back -------------------------------------------------- */
console.log('\n=== 5. READ-BACK (GET /get-agent) ===');
const final = await call('GET', `/get-agent/${probeId}`);
if (!final.ok) die(`GET /get-agent/${probeId}`, final);
console.log(`  agent_id    : ${final.body.agent_id}`);
console.log(`  agent_name  : ${final.body.agent_name}`);
console.log(`  voice       : ${final.body.voice_id}`);
console.log(`  voice_model : ${final.body.voice_model ?? '(unset)'}`);
console.log(`  version     : v${final.body.version} published=${final.body.is_published}`);

/* ---------- 6. assertions: zero numbers moved, zero live agents touched ---- */
console.log('\n=== 6. SAFETY ASSERTIONS ===');
const nums = await call('GET', '/v2/list-phone-numbers');
if (!nums.ok) die('GET /v2/list-phone-numbers', nums);
const numList = nums.body?.items ?? nums.body ?? [];
const bound = numList.filter(n =>
  JSON.stringify(n.inbound_agents ?? n.inbound_agent_id ?? '').includes(probeId) ||
  JSON.stringify(n.outbound_agents ?? n.outbound_agent_id ?? '').includes(probeId));
console.log(`  numbers bound to probe : ${bound.length} (must be 0)`);

const srcAfter = await call('GET', `/get-agent/${SRC_AGENT}`);
const untouched =
  srcAfter.body?.version === src.body.version &&
  srcAfter.body?.voice_model === src.body.voice_model &&
  srcAfter.body?.voice_id === src.body.voice_id;
console.log(`  source agent untouched : ${untouched ? 'YES' : 'NO *** INVESTIGATE'}` +
  ` (v${src.body.version}/${src.body.voice_model} -> v${srcAfter.body?.version}/${srcAfter.body?.voice_model})`);

/* ---------- 7. DONE table ------------------------------------------------- */
const dash = `https://dashboard.retellai.com/agents/${probeId}`;
console.log('\n=== DONE ===');
console.log('| field | value |');
console.log('|---|---|');
console.log(`| clone agent_id | ${probeId} |`);
console.log(`| clone name | ${final.body.agent_name} |`);
console.log(`| accepted model string | ${accepted ?? 'NONE — every rung rejected'} |`);
console.log(`| voice_id (read-back) | ${final.body.voice_id} |`);
console.log(`| voice_model (read-back) | ${final.body.voice_model ?? '(unset)'} |`);
console.log(`| phone numbers moved | ${bound.length} |`);
console.log(`| live agents modified | ${untouched ? '0' : 'CHECK'} |`);
console.log(`| dashboard | ${dash} |`);

const out = 'reports/sonic36-probe-result.json';
writeFileSync(out, JSON.stringify({
  probe_agent_id: probeId,
  source_agent_id: SRC_AGENT,
  accepted_model: accepted,
  ladder: results,
  readback: { voice_id: final.body.voice_id, voice_model: final.body.voice_model },
  numbers_bound_to_probe: bound.length,
  source_untouched: untouched,
  dashboard: dash,
}, null, 2));
console.log(`\nmachine-readable result -> ${out}`);

if (!accepted) {
  console.log('\nRUN INCOMPLETE — EVERY MODEL STRING REJECTED. See the ladder bodies above.');
  process.exit(2);
}
