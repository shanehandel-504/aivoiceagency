#!/usr/bin/env node
/* ============================================================================
   AVA SEAL · STEP 4b — WOULD PUBLISHING SHIP A PROMPT CHANGE?
   ----------------------------------------------------------------------------
   Making a versioned webhook_url actually answer the phone requires publishing a
   new agent version. Agent and LLM are forked as a PAIR, so publishing agent v43
   also publishes LLM v43. If LLM v43's prompt differs from the live LLM v42, that
   publish ships words AVA speaks — which is not this run's to ship
   (CLAUDE.md § SKILL ROUTER, PROMPT AUTHORITY LOCK).

   Read-only. It reports the diff; it does not resolve it.
   ========================================================================== */
import { need, req, rH, saveJSON, RETELL, ISO } from './_lib.mjs';

need(['RETELL_API_KEY']);
const LLM = 'llm_d0f4aff62bb8b60ff878055aa18c';
const LIVE = 42, DRAFT = 43;

console.log(`AVA SEAL · STEP 4b · LLM v${LIVE} vs v${DRAFT} · ${ISO()}`);
console.log('='.repeat(72));

const grab = async (v) => {
  const r = await req('GET', `${RETELL}/get-retell-llm/${LLM}?version=${v}`, rH());
  if (!r.ok) { console.error(`RUN INCOMPLETE — get-retell-llm v${v} HTTP ${r.status}`); process.exit(2); }
  return r.body;
};
const a = await grab(LIVE), b = await grab(DRAFT);
saveJSON(`config-snapshots/2026-08-18-ava-seal/retell-llm-v${LIVE}.json`, a);
saveJSON(`config-snapshots/2026-08-18-ava-seal/retell-llm-v${DRAFT}.json`, b);

const SKIP = new Set(['version', 'is_published', 'last_modification_timestamp']);
const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => !SKIP.has(k)).sort();

const SPEECH = new Set(['general_prompt', 'begin_message', 'states', 'starting_state',
                        'general_tools', 'default_dynamic_variables', 'model', 'model_temperature']);
let speechDiffs = 0, otherDiffs = 0;

for (const k of keys) {
  const x = JSON.stringify(a[k]), y = JSON.stringify(b[k]);
  if (x === y) continue;
  const isSpeech = SPEECH.has(k);
  isSpeech ? speechDiffs++ : otherDiffs++;
  console.log(`\n  ${isSpeech ? '** SPEECH **' : '   (meta)   '} ${k}`);
  const la = (x ?? '').length, lb = (y ?? '').length;
  console.log(`      live  v${LIVE}  ${la} chars`);
  console.log(`      draft v${DRAFT}  ${lb} chars   (delta ${lb - la >= 0 ? '+' : ''}${lb - la})`);
  if (la < 300 && lb < 300) {
    console.log(`      live  = ${x}`);
    console.log(`      draft = ${y}`);
  }
}

console.log('\n' + '='.repeat(72));
console.log(`SPEECH-BEARING DIFFS: ${speechDiffs}     metadata-only diffs: ${otherDiffs}`);
if (speechDiffs === 0) {
  console.log(`\nVERDICT: publishing v${DRAFT} would ship NO change to what AVA says.`);
  console.log('The prompt, begin message, states and tools are byte-identical to the live version.');
} else {
  console.log(`\nVERDICT: publishing v${DRAFT} WOULD change what AVA says. That is a prompt change,`);
  console.log('and PROMPT AUTHORITY LOCK puts it outside this run. Do not publish.');
}
