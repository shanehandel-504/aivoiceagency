#!/usr/bin/env node
/* ============================================================================
   AVA SEAL · STEP 3b — PUBLISH + VERIFY the booking rail
   ----------------------------------------------------------------------------
   THE TRAP THIS EXISTS FOR. An ACTIVE n8n workflow serves `activeVersionId`.
   Both API writes AND GET hit the DRAFT. So a GET straight after a PUT shows the
   new code and reads GREEN while production keeps running the old version. The
   only honest verdict is versionId === activeVersionId.
   ========================================================================== */
import { need, req, nH, saveJSON, trim, N8N_API, WF_BOOK, ISO } from './_lib.mjs';

need(['N8N_API_KEY']);
const DIR = 'config-snapshots/2026-08-18-ava-seal';
let failed = 0;
const bad = (m) => { console.log(`  FAIL — ${m}`); failed++; };
const good = (m) => console.log(`  PASS — ${m}`);
const note = (m) => console.log(`  ·  ${m}`);

console.log(`AVA SEAL · STEP 3b · PUBLISH + VERIFY · ${ISO()}`);
console.log('='.repeat(72));

const get = async () => (await req('GET', `${N8N_API}/workflows/${WF_BOOK}`, nH())).body;
let w = await get();
console.log(`\n[STATE] active=${w.active}`);
console.log(`  versionId        ${w.versionId}`);
console.log(`  activeVersionId  ${w.activeVersionId}`);

if (w.active && w.versionId !== w.activeVersionId) {
  console.log('\n  DRIFT — the draft holds the edit, production is still on the old version.');
  console.log('  [PUBLISH] trying the documented routes in order');
  const routes = [
    ['POST', `${N8N_API}/workflows/${WF_BOOK}/publish`, undefined],
    ['POST', `${N8N_API}/workflows/${WF_BOOK}/activate`, undefined],
    ['PATCH', `${N8N_API}/workflows/${WF_BOOK}`, { active: true }],
  ];
  for (const [m, u, b] of routes) {
    const r = await req(m, u, nH(), b);
    note(`${m} ${u.replace(N8N_API, '')} -> HTTP ${r.status}`);
    if (r.ok) break;
  }
  w = await get();
  console.log(`\n  after publish: versionId ${w.versionId} · activeVersionId ${w.activeVersionId}`);
}

if (!w.active) bad('workflow is not ACTIVE');
else good('workflow ACTIVE');

if (w.versionId === w.activeVersionId) good('versionId === activeVersionId — production runs THIS code');
else bad(`DRIFT — draft ${w.versionId} vs published ${w.activeVersionId}; production is NOT running the edit`);

/* ---- the edits, re-read from the live object ---------------------------- */
console.log('\n[CONTENT — re-read from the live workflow]');
const blob = JSON.stringify({ nodes: w.nodes, connections: w.connections, description: w.description, name: w.name });

if (!blob.includes('Strategy Call')) good('"Strategy Call" appears nowhere in the live workflow');
else {
  bad('"Strategy Call" still live');
  for (const n of w.nodes) if (JSON.stringify(n).includes('Strategy Call')) console.log(`      node: ${n.name}`);
  if ((w.description || '').includes('Strategy Call')) console.log('      workflow DESCRIPTION');
}

const appt = w.nodes.find((n) => n.name === 'GHL Create Appointment');
if (appt?.parameters?.jsonBody?.includes('AVA Discovery Call - ')) good('appointment title = "AVA Discovery Call - {name}"');
else bad('appointment title is not the Discovery Call form');

for (const n of ['Sim Guard?', 'Respond Sim Blocked', 'Owner Alert Body', 'Owner Alert SMS', 'Owner Alert Email']) {
  if (w.nodes.find((x) => x.name === n)) good(`node present: ${n}`);
  else bad(`node MISSING: ${n}`);
}

const norm = w.nodes.find((n) => n.name === 'Normalize');
if (norm?.parameters?.assignments?.assignments?.some((a) => a.name === 'is_sim')) good('Normalize carries is_sim');
else bad('Normalize has no is_sim');

/* ---- graph walk on the LIVE object -------------------------------------- */
const conns = w.connections;
const reach = (start) => {
  const seen = new Set(); const q = [start];
  while (q.length) { const c = q.shift();
    for (const br of (conns[c]?.main ?? [])) for (const t of (br ?? [])) if (!seen.has(t.node)) { seen.add(t.node); q.push(t.node); } }
  return seen;
};
const WRITES = ['GHL Upsert Contact', 'GHL Create Appointment', 'Owner Alert SMS', 'Owner Alert Email'];
const leak = WRITES.filter((n) => reach('Respond Sim Blocked').has(n));
if (!leak.length) good('LIVE graph: SIM branch reaches zero write nodes');
else bad(`LIVE graph: SIM branch reaches ${leak.join(', ')}`);

const realPath = reach('Sim Guard?');
const lost = WRITES.filter((n) => !realPath.has(n));
if (!lost.length) good('LIVE graph: REAL branch still reaches every write node');
else bad(`LIVE graph: REAL branch lost ${lost.join(', ')}`);

/* Alerts must sit BETWEEN the appointment and the response, and must not be able
   to break the booking. */
const okNode = w.nodes.find((n) => n.name === 'Respond OK');
if (okNode?.parameters?.responseBody?.includes("$('GHL Create Appointment')")) good('Respond OK reads the NAMED appointment node (survives the splice)');
else bad('Respond OK still reads $json — appointment_id would return null');

for (const n of ['Owner Alert SMS', 'Owner Alert Email']) {
  const node = w.nodes.find((x) => x.name === n);
  if (node?.onError === 'continueRegularOutput') good(`${n} · onError=continueRegularOutput — cannot break the booking response`);
  else bad(`${n} · onError=${node?.onError ?? '(default)'} — an alert failure WOULD break the booking`);
}

/* ---- the Error Sentry must still be attached ---------------------------- */
if (w.settings?.errorWorkflow === 'SlnAeMrVRORsF0w7') good('Error Sentry still attached (the PUT did not silently detach it)');
else bad(`errorWorkflow = ${w.settings?.errorWorkflow ?? '(NONE)'} — failures are now silent`);

saveJSON(`${DIR}/n8n-${WF_BOOK}-POST-EDIT.json`, w);
console.log('\n' + '='.repeat(72));
if (failed) { console.error(`RUN INCOMPLETE — STEP 3: ${failed} assertion(s) failed.`); process.exit(2); }
console.log('STEP 3 GREEN — booking rail edited, published, and verified against the LIVE object.');
