#!/usr/bin/env node
/* ============================================================================
   tools/retell-8930-analyze.mjs  ·  AVA 8930 TUNE
   ----------------------------------------------------------------------------
   Pure offline analysis of the dumps written by retell-8930-forensics.mjs.
   Touches no network and no Retell object.

   INTERRUPTION COUNT IS DERIVED, NOT REPORTED.
   Retell's call object carries no interruption field (verified: zero keys
   matching /interrupt/ across all 25 raw call objects). A barge-in is counted
   here as a USER turn whose first word starts BEFORE the preceding AGENT
   turn's last word ends — i.e. the caller began talking over AVA.

   USAGE:  node tools/retell-8930-analyze.mjs --in <dir>
   ========================================================================== */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const argOf = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; };
const IN = argOf('--in', null);
if (!IN) { console.error('--in <dir> required'); process.exit(1); }

const calls = JSON.parse(readFileSync(join(IN, 'calls-detail.json'), 'utf8'));

/* Retell's own taxonomy: only these two are a clean, expected end of call. */
const NORMAL_DISCONNECT = new Set(['user_hangup', 'agent_hangup']);

const iso = ms => ms ? new Date(ms).toISOString().replace('T', ' ').replace('.000Z', 'Z') : '—';
const n = (v, d = 1) => (v === null || v === undefined) ? null : Number(v.toFixed(d));

function bargeIns(call) {
  const turns = (call.transcript_object || []).filter(t => (t.words || []).length);
  let count = 0;
  for (let i = 1; i < turns.length; i++) {
    const prev = turns[i - 1], cur = turns[i];
    if (prev.role !== 'agent' || cur.role === 'agent') continue;
    const prevEnd = prev.words[prev.words.length - 1].end;
    const curStart = cur.words[0].start;
    if (curStart < prevEnd - 0.05) count++;   // 50ms guard against jitter
  }
  return count;
}

const rows = calls.map(c => {
  const L = c.latency || {};
  const g = (k, p) => n((L[k] || {})[p]);
  const disc = c.disconnection_reason || '—';
  return {
    call_id: c.call_id,
    start: iso(c.start_timestamp),
    dur_s: c.duration_ms ? n(c.duration_ms / 1000, 1) : 0,
    direction: c.direction,
    from: c.from_number,
    status: c.call_status,
    disconnect: disc,
    abnormal: !NORMAL_DISCONNECT.has(disc),
    e2e_p50: g('e2e', 'p50'), e2e_p90: g('e2e', 'p90'), e2e_p99: g('e2e', 'p99'),
    e2e_max: g('e2e', 'max'), e2e_n: (L.e2e || {}).num ?? 0,
    llm_p50: g('llm', 'p50'), llm_p90: g('llm', 'p90'), llm_p99: g('llm', 'p99'),
    tts_p50: g('tts', 'p50'), tts_p90: g('tts', 'p90'), tts_p99: g('tts', 'p99'),
    asr_p50: g('asr', 'p50'), asr_p90: g('asr', 'p90'), asr_p99: g('asr', 'p99'),
    barge_ins: bargeIns(c),
    turns: (c.transcript_object || []).length,
    voicemail: !!(c.call_analysis || {}).in_voicemail,
    sentiment: (c.call_analysis || {}).user_sentiment || '—',
    successful: (c.call_analysis || {}).call_successful,
    recording_url: c.recording_url || null,
    log_url: c.public_log_url || null
  };
});

/* ---- severity: e2e p90 is the spine, abnormal disconnect is a hard adder --- */
const P90S = rows.map(r => r.e2e_p90).filter(v => v !== null);
const worstP90 = Math.max(...P90S, 1);
for (const r of rows) {
  const latScore = r.e2e_p90 === null ? 0 : (r.e2e_p90 / worstP90) * 100;
  r.score = n(latScore + (r.abnormal ? 60 : 0) + Math.min(r.barge_ins, 10) * 3, 1);
}
rows.sort((a, b) => b.score - a.score);

/* ---- auto-classification per the run spec -------------------------------- */
function classify(r) {
  if (r.e2e_p90 === null) return ['D', 'no latency samples recorded'];
  const llm = r.llm_p90 ?? 0, tts = r.tts_p90 ?? 0, e2e = r.e2e_p90;
  const llmShare = llm / e2e, ttsShare = tts / e2e;
  const ttsSpread = (r.tts_p99 ?? 0) - (r.tts_p50 ?? 0);
  const ttsVar = (r.tts_p50 ?? 0) > 0 ? ttsSpread / r.tts_p50 : 0;
  if (llmShare >= 0.55) return ['A', `LLM p90 ${llm}ms = ${(llmShare * 100).toFixed(0)}% of e2e p90`];
  if (ttsVar >= 0.6 || ttsShare >= 0.45) return ['B', `TTS p50→p99 spread ${n(ttsSpread)}ms (${(ttsVar * 100).toFixed(0)}% of p50)`];
  if (r.barge_ins >= 3) return ['C', `${r.barge_ins} derived barge-ins over ${r.turns} turns`];
  return ['D', `no single dominant driver (LLM ${(llmShare * 100).toFixed(0)}%, TTS ${(ttsShare * 100).toFixed(0)}%)`];
}
for (const r of rows) { const [cl, why] = classify(r); r.class = cl; r.class_why = why; }

writeFileSync(join(IN, 'analysis.json'), JSON.stringify(rows, null, 2));

/* ---- console report ------------------------------------------------------ */
const pad = (s, w) => String(s ?? '—').padEnd(w).slice(0, w);
const rp = (s, w) => String(s ?? '—').padStart(w);

console.log('\n=== FORENSICS TABLE · TOP 10 WORST (e2e p90 + abnormal disconnects) ===\n');
console.log(pad('#', 3) + pad('call_id', 34) + pad('start (UTC)', 21) + rp('dur', 7) +
  rp('e2e50', 7) + rp('e2e90', 7) + rp('e2e99', 8) + rp('llm90', 7) + rp('tts90', 7) +
  rp('brg', 5) + '  ' + pad('disconnect', 22) + pad('cls', 4) + rp('score', 7));
console.log('-'.repeat(160));
rows.slice(0, 10).forEach((r, i) => {
  console.log(pad(i + 1, 3) + pad(r.call_id, 34) + pad(r.start, 21) + rp(r.dur_s + 's', 7) +
    rp(r.e2e_p50, 7) + rp(r.e2e_p90, 7) + rp(r.e2e_p99, 8) + rp(r.llm_p90, 7) + rp(r.tts_p90, 7) +
    rp(r.barge_ins, 5) + '  ' + pad(r.disconnect + (r.abnormal ? ' *' : ''), 22) + pad(r.class, 4) + rp(r.score, 7));
});

console.log('\n=== WORST 3 — FLAGGED ===');
rows.slice(0, 3).forEach((r, i) => {
  console.log(`\n[${i + 1}] ${r.call_id}   CLASS ${r.class}`);
  console.log(`    why        : ${r.class_why}`);
  console.log(`    start/dur  : ${r.start}  ·  ${r.dur_s}s  ·  ${r.direction}  ·  turns ${r.turns}`);
  console.log(`    disconnect : ${r.disconnect}${r.abnormal ? '   << ABNORMAL' : ''}`);
  console.log(`    e2e ms     : p50 ${r.e2e_p50} / p90 ${r.e2e_p90} / p99 ${r.e2e_p99} / max ${r.e2e_max}  (n=${r.e2e_n})`);
  console.log(`    llm ms     : p50 ${r.llm_p50} / p90 ${r.llm_p90} / p99 ${r.llm_p99}`);
  console.log(`    tts ms     : p50 ${r.tts_p50} / p90 ${r.tts_p90} / p99 ${r.tts_p99}`);
  console.log(`    asr ms     : p50 ${r.asr_p50} / p90 ${r.asr_p90} / p99 ${r.asr_p99}`);
  console.log(`    barge-ins  : ${r.barge_ins} (derived)   sentiment ${r.sentiment}   voicemail ${r.voicemail}`);
  console.log(`    RECORDING  : ${r.recording_url || 'NONE'}`);
  console.log(`    LOG        : ${r.log_url || 'NONE'}`);
});

/* ---- fleet aggregates ---------------------------------------------------- */
const withLat = rows.filter(r => r.e2e_p90 !== null);
const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? n(s[Math.floor(s.length / 2)]) : null; };
console.log('\n=== AGGREGATE OVER ' + rows.length + ' CALLS ===');
console.log('calls with latency samples : ' + withLat.length);
console.log('median e2e p90 across calls : ' + med(withLat.map(r => r.e2e_p90)) + ' ms');
console.log('median llm p90 across calls : ' + med(withLat.map(r => r.llm_p90).filter(Boolean)) + ' ms');
console.log('median tts p90 across calls : ' + med(withLat.map(r => r.tts_p90).filter(Boolean)) + ' ms');
console.log('abnormal disconnects        : ' + rows.filter(r => r.abnormal).length + ' / ' + rows.length);
const byDisc = {}; rows.forEach(r => byDisc[r.disconnect] = (byDisc[r.disconnect] || 0) + 1);
console.log('disconnect histogram        : ' + JSON.stringify(byDisc));
const byCls = {}; rows.forEach(r => byCls[r.class] = (byCls[r.class] || 0) + 1);
console.log('class histogram             : ' + JSON.stringify(byCls));
console.log('total derived barge-ins     : ' + rows.reduce((s, r) => s + r.barge_ins, 0));
console.log('calls with recording url    : ' + rows.filter(r => r.recording_url).length);
