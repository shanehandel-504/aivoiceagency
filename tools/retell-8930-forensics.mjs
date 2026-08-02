#!/usr/bin/env node
/* ============================================================================
   tools/retell-8930-forensics.mjs  ·  AVA 8930 TUNE
   ----------------------------------------------------------------------------
   READ-ONLY forensics on the live agent bound to +1 414-240-8930.

   Resolves the bound agent from the phone-number registry (never from a pasted
   id), pulls its last N calls, and dumps BOTH the raw JSON and a distilled
   per-call row set to the scratchpad for analysis.

   This tool NEVER writes to Retell. No PATCH, no POST except the read-only
   /v2/list-calls query endpoint.

   USAGE:
     doppler run --project ava-prod --config prd -- \
       node tools/retell-8930-forensics.mjs --out <dir> [--limit 25]
   ========================================================================== */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const API = 'https://api.retellai.com';
const KEY = process.env.RETELL_API_KEY;
if (!KEY) { console.error('RETELL_API_KEY missing — run through doppler.'); process.exit(1); }

const TARGET = '+14142408930';
const args = process.argv.slice(2);
const argOf = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; };
const OUT = argOf('--out', null);
const LIMIT = parseInt(argOf('--limit', '25'), 10);
if (!OUT) { console.error('--out <dir> required'); process.exit(1); }
mkdirSync(OUT, { recursive: true });

async function call(method, path, body) {
  const r = await fetch(API + path, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const txt = await r.text();
  let json = null;
  try { json = JSON.parse(txt); } catch { /* non-json */ }
  if (!r.ok) {
    console.error(`${method} ${path} -> ${r.status}`);
    console.error(txt.slice(0, 600));
    process.exit(1);
  }
  return json;
}

/* ---------- 1 · resolve the agent actually bound to the number ------------ */
const numbers = await call('GET', '/list-phone-numbers');
writeFileSync(join(OUT, 'phone-numbers.json'), JSON.stringify(numbers, null, 2));

const row = (Array.isArray(numbers) ? numbers : []).find(n => n.phone_number === TARGET);
if (!row) {
  console.error(`NUMBER NOT FOUND in Retell registry: ${TARGET}`);
  console.error('numbers present: ' + (numbers || []).map(n => n.phone_number).join(', '));
  process.exit(1);
}

/* Retell returns EITHER the legacy scalar inbound_agent_id OR the newer
   inbound_agents[] array (with agent_version, usually "latest_published").
   Handle both — the array form is what the account returns today. */
const inboundAgent  = row.inbound_agent_id  || (row.inbound_agents  || [])[0]?.agent_id || null;
const outboundAgent = row.outbound_agent_id || (row.outbound_agents || [])[0]?.agent_id || null;
const servedVersion = (row.inbound_agents || [])[0]?.agent_version || 'unknown';
console.log('=== BOUND NUMBER ===');
console.log(JSON.stringify(row, null, 2));

const AGENT = inboundAgent || outboundAgent;
if (!AGENT) { console.error('No agent bound to ' + TARGET); process.exit(1); }

/* ---------- 2 · the live agent config (READ ONLY) ------------------------- */
const agent = await call('GET', `/get-agent/${AGENT}`);
writeFileSync(join(OUT, 'live-agent.json'), JSON.stringify(agent, null, 2));
console.log('\n=== LIVE AGENT ===');
console.log('agent_id      : ' + agent.agent_id);
console.log('agent_name    : ' + agent.agent_name);
console.log('version       : ' + agent.version);
console.log('response_engine: ' + JSON.stringify(agent.response_engine));
console.log('top-level keys : ' + Object.keys(agent).join(', '));

/* the LLM / prompt lives on the response engine, fetched separately */
const eng = agent.response_engine || {};
let engineObj = null;
if (eng.type === 'retell-llm' && eng.llm_id) {
  engineObj = await call('GET', `/get-retell-llm/${eng.llm_id}`);
  writeFileSync(join(OUT, 'live-llm.json'), JSON.stringify(engineObj, null, 2));
  console.log('\n=== LIVE RETELL LLM ===');
  console.log('llm_id  : ' + engineObj.llm_id);
  console.log('version : ' + engineObj.version);
  console.log('model   : ' + engineObj.model);
  console.log('keys    : ' + Object.keys(engineObj).join(', '));
} else if (eng.type === 'conversation-flow' && eng.conversation_flow_id) {
  engineObj = await call('GET', `/get-conversation-flow/${eng.conversation_flow_id}`);
  writeFileSync(join(OUT, 'live-flow.json'), JSON.stringify(engineObj, null, 2));
  console.log('\n=== LIVE CONVERSATION FLOW ===');
  console.log('keys : ' + Object.keys(engineObj).join(', '));
}

/* ---------- 3 · last N calls on that agent -------------------------------- */
const calls = await call('POST', '/v2/list-calls', {
  filter_criteria: { agent_id: [AGENT] },
  sort_order: 'descending',
  limit: LIMIT
});
writeFileSync(join(OUT, 'calls-raw.json'), JSON.stringify(calls, null, 2));
console.log(`\n=== CALLS === pulled ${Array.isArray(calls) ? calls.length : 0}`);
if (Array.isArray(calls) && calls.length) {
  console.log('call keys      : ' + Object.keys(calls[0]).join(', '));
  console.log('latency keys   : ' + Object.keys(calls[0].latency || {}).join(', '));
  console.log('analysis keys  : ' + Object.keys(calls[0].call_analysis || {}).join(', '));
}

/* full detail per call — list-calls can be lighter than get-call */
const detail = [];
for (const c of (calls || [])) {
  detail.push(await call('GET', `/v2/get-call/${c.call_id}`));
}
writeFileSync(join(OUT, 'calls-detail.json'), JSON.stringify(detail, null, 2));
console.log(`detail pulled  : ${detail.length}`);
if (detail.length) {
  console.log('detail keys    : ' + Object.keys(detail[0]).join(', '));
  console.log('SAMPLE latency : ' + JSON.stringify(detail[0].latency, null, 2));
}

writeFileSync(join(OUT, 'resolved.json'), JSON.stringify({
  phone_number: TARGET, inbound_agent_id: inboundAgent, outbound_agent_id: outboundAgent,
  served_agent_version: servedVersion,
  agent_used: AGENT, agent_name: agent.agent_name, agent_version: agent.version,
  engine: eng, calls_pulled: detail.length
}, null, 2));
console.log('\nOK — raw dumps written to ' + OUT);
