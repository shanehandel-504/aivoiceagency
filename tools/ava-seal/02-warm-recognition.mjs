#!/usr/bin/env node
/* ============================================================================
   AVA SEAL · STEP 2 — WARM RECOGNITION
   ----------------------------------------------------------------------------
   Points the live 8930 number's inbound_webhook_url at the caller-lookup rail
   so Retell can hydrate dynamic variables BEFORE AVA speaks.

   ORDER OF OPERATIONS IS DELIBERATE. The endpoint is probed BEFORE the number is
   patched. Pointing a live phone line at an untested URL and *then* testing it
   means every real caller in the gap is the experiment. Probe → patch → re-probe.

   FAIL-OPEN IS THE WHOLE POINT. Retell blocks the call opening on this response.
   A hang, a 500, or a slow reply is worse than no lookup at all — the caller
   hears dead air. The contract asserted here: HTTP 200, well under 5s, carrying
   caller_known="false" for a number the CRM has never seen.

   USAGE
     doppler run -p ava-prod -c prd -- node tools/ava-seal/02-warm-recognition.mjs --probe
     doppler run -p ava-prod -c prd -- node tools/ava-seal/02-warm-recognition.mjs --apply
   ========================================================================== */
import { need, req, rH, saveJSON, loadJSON, trim, RETELL, N8N_HOST, NUMBER, ISO } from './_lib.mjs';

need(['RETELL_API_KEY']);
const APPLY = process.argv.includes('--apply');
const HOOK = `${N8N_HOST}/webhook/ava-inbound-lookup`;
const DIR = 'config-snapshots/2026-08-18-ava-seal';
const BUDGET_MS = 5000;
let failed = 0;
const bad = (m) => { console.log(`  FAIL — ${m}`); failed++; };
const good = (m) => console.log(`  PASS — ${m}`);

/* An unknown caller. 555 is NANP-reserved and can never be a real person, which
   is exactly why it is the honest probe for the cold path. */
const UNKNOWN = '+15550001234';

async function probe(label) {
  console.log(`\n[${label}] POST call_inbound · unknown from_number ${UNKNOWN}`);
  const payload = {
    event: 'call_inbound',
    call_inbound: {
      agent_id: 'agent_d5ada9f774fe3ae7f034d2c677',
      from_number: UNKNOWN,
      to_number: NUMBER,
    },
  };
  const r = await req('POST', HOOK, { accept: 'application/json' }, payload,
    { label: 'inbound-lookup probe', timeoutMs: 15000 });

  console.log(`  HTTP ${r.status}  ·  ${r.ms}ms`);
  if (r.status !== 200) { bad(`expected HTTP 200, got ${r.status}${r.err ? ' — ' + r.err : ''}`); return r; }
  good('HTTP 200');

  if (r.ms >= BUDGET_MS) bad(`${r.ms}ms exceeds the ${BUDGET_MS}ms fail-open budget — a caller hears dead air`);
  else good(`${r.ms}ms — inside the ${BUDGET_MS}ms budget`);

  /* Retell's contract nests the vars under call_inbound. Accept either shape so
     the probe reports what is actually on the wire rather than what it hoped. */
  const dv = r.body?.call_inbound?.dynamic_variables ?? r.body?.dynamic_variables ?? null;
  const path = r.body?.call_inbound?.dynamic_variables ? 'call_inbound.dynamic_variables'
             : r.body?.dynamic_variables ? 'dynamic_variables' : '(absent)';
  if (!dv) { bad(`no dynamic_variables in the response body → ${trim(r.body, 300)}`); return r; }
  console.log(`  found at: ${path}`);

  const ck = dv.caller_known;
  if (String(ck) === 'false') good(`dynamic_variables.caller_known = "false" (type ${typeof ck})`);
  else bad(`caller_known = ${JSON.stringify(ck)} — expected the string "false"`);

  if (dv.opening_mode) good(`opening_mode = "${dv.opening_mode}"`);
  console.log(`  keys: ${Object.keys(dv).join(', ')}`);
  return r;
}

console.log(`AVA SEAL · STEP 2 · WARM RECOGNITION · ${ISO()}`);
console.log('='.repeat(72));

/* ---- PRE-FLIGHT: does the endpoint honour the contract at all? ---------- */
const pre = await probe('PRE-FLIGHT');
if (failed) {
  console.error(`\nRUN INCOMPLETE — the lookup endpoint failed its contract BEFORE the patch.`);
  console.error('The number was NOT touched. Fix the rail first; do not point a live line at it.');
  process.exit(2);
}

if (!APPLY) { console.log('\n--probe only. Re-run with --apply to patch the number.'); process.exit(0); }

/* ---- PATCH: one field, nothing else ------------------------------------- */
console.log(`\n[PATCH] ${NUMBER} · inbound_webhook_url`);
const before = loadJSON(`${DIR}/retell-number-14142408930.json`);
const p = await req('PATCH', `${RETELL}/update-phone-number/${encodeURIComponent(NUMBER)}`, rH(),
  { inbound_webhook_url: HOOK }, { label: 'update-phone-number' });
if (!p.ok) { console.error(`RUN INCOMPLETE — PATCH failed HTTP ${p.status}\n${trim(p.body)}`); process.exit(2); }
console.log(`  HTTP ${p.status}`);

/* ---- VERIFY BY GET, and prove nothing ELSE moved ------------------------ */
console.log(`\n[VERIFY] GET ${NUMBER}`);
const g = await req('GET', `${RETELL}/get-phone-number/${encodeURIComponent(NUMBER)}`, rH());
if (!g.ok) { console.error(`RUN INCOMPLETE — verify GET failed HTTP ${g.status}`); process.exit(2); }
const after = g.body;

if (after.inbound_webhook_url === HOOK) good(`inbound_webhook_url = ${HOOK}`);
else bad(`inbound_webhook_url reads ${JSON.stringify(after.inbound_webhook_url)}`);

/* "change nothing else" is a claim that has to be MEASURED, not asserted. */
const VOLATILE = new Set(['inbound_webhook_url', 'last_modification_timestamp', 'sip_outbound_trunk_config']);
const drift = [];
for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
  if (VOLATILE.has(k)) continue;
  const a = JSON.stringify(before[k]), b = JSON.stringify(after[k]);
  if (a !== b) drift.push(`${k}: ${a} -> ${b}`);
}
if (drift.length) { bad(`${drift.length} unintended field change(s):`); drift.forEach(d => console.log(`      ${d}`)); }
else good('every other field byte-identical to the pre-edit snapshot');

/* Routing must still resolve to the same agent on latest_published. */
const ia = after.inbound_agents?.[0];
if (ia?.agent_id === 'agent_d5ada9f774fe3ae7f034d2c677' && ia?.agent_version === 'latest_published')
  good('inbound routing intact — agent_d5ada…677 @ latest_published');
else bad(`inbound routing moved: ${JSON.stringify(after.inbound_agents)}`);

const outSafe = { ...after };
outSafe.sip_outbound_trunk_config = '[REDACTED — live SIP trunk credential, never committed]';
saveJSON(`${DIR}/retell-number-14142408930-POST-PATCH.json`, outSafe);

/* ---- RE-PROBE: the rail must still fail open now that it is load-bearing */
const post = await probe('POST-PATCH');

console.log('\n' + '='.repeat(72));
if (failed) { console.error(`RUN INCOMPLETE — STEP 2: ${failed} assertion(s) failed.`); process.exit(2); }
console.log(`STEP 2 GREEN — warm recognition live on ${NUMBER}, fail-open proven at ${post.ms}ms.`);
