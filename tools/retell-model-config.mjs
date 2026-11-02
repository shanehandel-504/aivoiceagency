#!/usr/bin/env node
// tools/retell-model-config.mjs — Retell "Legacy model fields" deprecation, effective 01/31/2027
// (https://docs.retellai.com/deprecation-notice/2027/01-31_legacy_model_fields). For conversation flows:
//   model_temperature            -> model_config.temperature
//   model_choice                 -> model_config  ({type, primary:{model, tier}})
// Create Conversation Flow marks model_temperature "Deprecated, use model_config.temperature. Ignored when
// model_config is set." The live AIC flow (read 2026-11-02) already returns both shapes:
//   model_choice {type:'cascading', model, high_priority:true}  ==  model_config {type:'cascading', primary:{model, tier:'fast'}}
//
// ONE RUN v1 Part 4 (2026-11-02). NO RETELL WRITES: this file only ever issues GET.
//
//   node tools/retell-model-config.mjs --check     static scan; exit 1 if any conversation-flow WRITE payload
//                                                   builder sends model_temperature at the top level
//   doppler run --project ava-prod --config prd -- node tools/retell-model-config.mjs --dry-run
//                                                   read-only GETs; builds each known payload the old way and the
//                                                   new way and prints the two side by side
//
// Key: RETELL_API_KEY_NEW, else RETELL_API_KEY (Doppler ava-prod/prd has RETELL_API_KEY only, read 2026-11-02).
import fs from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const SCAN_ROOTS = [
  path.join(REPO, 'tools'),
  path.join(REPO, '..', 'aichauffeur', 'tools'),
  'C:/Users/offic/aic-tuning',            // the Dell's Retell helper scripts (not in a repo)
];
const SKIP_DIR = /[\\/](node_modules|out|data|dumps|snapshots|_backup[^\\/]*|\.git)([\\/]|$)/;
const WRITE_PATH = /(create|update)-conversation-flow(-component)?\b/;
// a body key, not a read: `model_temperature:` / "model_temperature": / 'model_temperature' (in a copied-keys list)
const BODY_KEY = /(^|[\s{,(])["']?model_temperature["']?\s*:|['"]model_temperature['"]\s*[,\]]/;

// ---------------------------------------------------------------- shared migration (import it, or copy it)
export function modelConfigFrom(flow) {
  if (flow.model_config && typeof flow.model_config === 'object') {
    const mc = JSON.parse(JSON.stringify(flow.model_config));
    if (mc.temperature === undefined && typeof flow.model_temperature === 'number') mc.temperature = flow.model_temperature;
    return mc;
  }
  const mch = flow.model_choice;
  if (!mch) return typeof flow.model_temperature === 'number' ? null : undefined;
  if (mch.ultrafast === true) throw new Error('model_choice.ultrafast has no verified model_config tier: map it by hand');
  const mc = { type: mch.type || 'cascading', primary: { model: mch.model } };
  if (mch.high_priority === true) mc.primary.tier = 'fast';     // pairing read off the live AIC flow, 2026-11-02
  if (typeof flow.model_temperature === 'number') mc.temperature = flow.model_temperature;
  return mc;
}
export function migrateFlowBody(body) {
  const out = { ...body };
  const mc = modelConfigFrom(body);
  if (mc === null) throw new Error('model_temperature with no model_choice/model_config: cannot build model_config.primary');
  delete out.model_temperature; delete out.model_choice;
  if (mc !== undefined) out.model_config = mc;
  return out;
}
export function assertModernFlowBody(method, p, body) {
  if (method === 'GET' || !WRITE_PATH.test(String(p)) || !body || typeof body !== 'object') return;
  if (Object.prototype.hasOwnProperty.call(body, 'model_temperature'))
    throw new Error(`LEGACY MODEL FIELD: ${method} ${String(p).split('?')[0]} sends model_temperature at the top level; use model_config.temperature`);
}

// ---------------------------------------------------------------- --check
function walk(dir, acc) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIR.test(p + path.sep)) walk(p, acc); }
    else if (/\.(mjs|js|cjs|py)$/.test(e.name)) acc.push(p);
  }
  return acc;
}
function check() {
  const files = SCAN_ROOTS.flatMap((r) => walk(r, []));
  const self = path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
  const hits = [];
  let writers = 0;
  for (const f of files) {
    if (path.resolve(f) === self) continue;
    const src = fs.readFileSync(f, 'utf8');
    const lines = src.split(/\r?\n/);
    // a WRITE to the endpoint: a non-GET call naming the path (POST/PATCH literal on the same line or the path in a write helper)
    const writes = lines.some((l) => WRITE_PATH.test(l) && /(POST|PATCH|PUT|method:\s*['"](POST|PATCH|PUT))/.test(l));
    if (!writes) continue;
    writers++;
    lines.forEach((l, i) => {
      const t = l.trim();
      if (t.startsWith('//') || t.startsWith('#') || t.startsWith('*')) return;
      const code = l.replace(/`[^`]*`/g, '``');            // template strings are output, not payloads
      if (BODY_KEY.test(code)) hits.push(`${f}:${i + 1}: ${t.slice(0, 140)}`);
    });
  }
  console.log(`scanned ${files.length} files under ${SCAN_ROOTS.length} roots · ${writers} write a conversation flow`);
  if (hits.length) { console.log(`FAIL · ${hits.length} top-level model_temperature in a conversation-flow write payload:`); hits.forEach((h) => console.log('  ' + h)); return 1; }
  console.log('PASS · no conversation-flow write payload sends model_temperature at the top level');
  return 0;
}

// ---------------------------------------------------------------- --dry-run (GET only)
async function get(p) {
  const key = process.env.RETELL_API_KEY_NEW || process.env.RETELL_API_KEY;
  if (!key) throw new Error('no RETELL_API_KEY_NEW / RETELL_API_KEY in the environment');
  const r = await fetch('https://api.retellai.com' + p, { method: 'GET', headers: { Authorization: 'Bearer ' + key } });
  if (!r.ok) throw new Error(`GET ${p.split('?')[0]} -> HTTP ${r.status}`);
  return r.json();
}
const MODEL_KEYS = ['model_choice', 'model_temperature', 'model_config'];
const pick = (b) => Object.fromEntries(MODEL_KEYS.filter((k) => b[k] !== undefined).map((k) => [k, b[k]]));
function side(name, oldB, newB) {
  const L = JSON.stringify(pick(oldB), null, 1).split('\n'), R = JSON.stringify(pick(newB), null, 1).split('\n');
  const w = Math.max(...L.map((l) => l.length), 30);
  console.log(`\n== ${name}`);
  console.log('OLD payload (model fields)'.padEnd(w + 3) + 'NEW payload (model fields)');
  for (let i = 0; i < Math.max(L.length, R.length); i++) console.log((L[i] || '').padEnd(w) + ' | ' + (R[i] || ''));
  const ok = !('model_temperature' in newB) && !('model_choice' in newB);
  const same = JSON.stringify(Object.keys(oldB).filter((k) => !MODEL_KEYS.includes(k)).sort()) === JSON.stringify(Object.keys(newB).filter((k) => !MODEL_KEYS.includes(k)).sort());
  const temp = (oldB.model_config && oldB.model_config.temperature !== undefined) ? oldB.model_config.temperature : oldB.model_temperature;
  console.log(`   other top-level keys unchanged: ${same} · new has no top-level model_temperature/model_choice: ${ok} · temperature kept: ${newB.model_config && newB.model_config.temperature === temp}`);
  return ok && same && newB.model_config && newB.model_config.temperature === temp;
}
async function dryRun() {
  const AIC = 'agent_9ebb41c9bd8af214649328f107', BRIEF = 'agent_63db656e3a68b737fe61cb78db';
  const a = await get('/get-agent/' + AIC);
  const wf = await get(`/get-conversation-flow/${a.response_engine.conversation_flow_id}?version=${a.response_engine.version}`);
  const results = [];
  // 1 + 2 · aic-tuning/agent-build-2026-10-29/{b5,p10}-promote.mjs: PATCH update-conversation-flow with FLOW_KEYS copied off a GET
  const OLD_KEYS = ['nodes', 'global_prompt', 'model_config', 'model_temperature', 'tools', 'default_dynamic_variables', 'start_node_id', 'start_speaker', 'knowledge_base_ids', 'kb_config'];
  const NEW_KEYS = OLD_KEYS.filter((k) => k !== 'model_temperature');
  const body12old = Object.fromEntries(OLD_KEYS.filter((k) => wf[k] !== undefined).map((k) => [k, wf[k]]));
  const body12new = Object.fromEntries(NEW_KEYS.filter((k) => wf[k] !== undefined).map((k) => [k, wf[k]]));
  results.push(side('b5-promote.mjs + p10-promote.mjs (update-conversation-flow, AIC flow as the source)', body12old, body12new));
  // 3 · discovery-words-2026-10-14/s4a-brief.mjs: POST create-conversation-flow copied from the briefing agent's flow
  let bf = wf;
  try { const b = await get('/get-agent/' + BRIEF); bf = await get(`/get-conversation-flow/${b.response_engine.conversation_flow_id}?version=${b.response_engine.version}`); } catch (e) { console.log('   (briefing agent not readable, AIC flow used as the source: ' + e.message + ')'); }
  const b3old = { is_transfer_cf: true, start_speaker: bf.start_speaker, start_node_id: bf.start_node_id, model_choice: bf.model_choice, model_temperature: bf.model_temperature };
  const b3new = { is_transfer_cf: true, start_speaker: bf.start_speaker, start_node_id: bf.start_node_id, model_config: modelConfigFrom(bf) };
  results.push(side('s4a-brief.mjs (create-conversation-flow)', b3old, b3new));
  // 4 · two-door-2026-09-30/s6-fork.mjs: PATCH update-conversation-flow with keys copied off the live flow
  const K4old = ['global_prompt', 'nodes', 'tools', 'default_dynamic_variables', 'model_choice', 'model_temperature', 'start_node_id', 'start_speaker', 'tool_call_strict_mode', 'kb_config', 'begin_tag_display_position'];
  const K4new = ['global_prompt', 'nodes', 'tools', 'default_dynamic_variables', 'model_config', 'start_node_id', 'start_speaker', 'tool_call_strict_mode', 'kb_config', 'begin_tag_display_position'];
  const b4old = {}, b4new = {};
  for (const k of K4old) if (wf[k] !== undefined) b4old[k] = wf[k];
  for (const k of K4new) if (wf[k] !== undefined) b4new[k] = k === 'model_config' ? modelConfigFrom(wf) : wf[k];
  results.push(side('s6-fork.mjs (update-conversation-flow, AIC flow as the source)', b4old, b4new));
  // 5 · two-door-2026-09-30/s7-transfer-agent.mjs: POST create-conversation-flow with literal model fields
  const b5old = { model_choice: { type: 'cascading', model: 'gpt-4.1', high_priority: true }, model_temperature: 0, tool_call_strict_mode: true };
  const b5new = { model_config: { type: 'cascading', primary: { model: 'gpt-4.1', tier: 'fast' }, temperature: 0 }, tool_call_strict_mode: true };
  results.push(side('s7-transfer-agent.mjs (create-conversation-flow, literal)', b5old, b5new));
  // the shared migration gives the same answer as the hand edits
  const canon = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x)) ? Object.fromEntries(Object.keys(x).sort().map((y) => [y, x[y]])) : x);
  const same = canon(migrateFlowBody(b5old)) === canon(b5new) && canon(migrateFlowBody(b3old).model_config) === canon(b3new.model_config);
  // the guard refuses the old shape and passes the new one
  let refused = false; try { assertModernFlowBody('PATCH', '/update-conversation-flow/x', body12old); } catch { refused = true; }
  let passed = true; try { assertModernFlowBody('PATCH', '/update-conversation-flow/x', body12new); } catch { passed = false; }
  console.log(`\nmigrateFlowBody() == hand edits: ${same} · guard refuses old: ${refused} · guard passes new: ${passed}`);
  console.log('Retell writes issued: 0 (this tool only calls GET)');
  return results.every(Boolean) && same && refused && passed ? 0 : 1;
}

const mode = process.argv[2];
if (mode === '--check') process.exit(check());
else if (mode === '--dry-run') dryRun().then((c) => process.exit(c), (e) => { console.error(e.message); process.exit(2); });
else if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))) { console.log('usage: --check | --dry-run'); process.exit(2); }
