#!/usr/bin/env node
/* ============================================================================
   AVA SEAL · STEP 3 — BOOKING RAIL EDITS  (n8n c5GPBkma1HyvonEa)
   ----------------------------------------------------------------------------
   a. SIM-GUARD   — a payload with no call.from_number is not a phone leg. It is
                    a simulation, and it must fail loudly and write NOTHING. The
                    gate sits between Normalize and Is Our Number?, which is the
                    only position upstream of BOTH the contact upsert and the
                    appointment create — gating any lower would let a sim mint a
                    CRM record before being turned away.
   b. TITLE       — "AVA Strategy Call - {name}" becomes "AVA Discovery Call -
                    {name}". The phrase also lived in the workflow DESCRIPTION,
                    not just the node, so both are rewritten.
   c. OWNER ALERT — instant SMS + email on the success path, between the
                    appointment create and the caller-facing response, so the
                    alert cannot be skipped by the response tearing the run down.

   THE TRAP THIS EDIT HAD TO DODGE. "Respond OK" read `$json.id` /
   `$json.startTime` — fine while it sat directly on GHL Create Appointment's
   output. Splicing the alert chain in front of it makes `$json` the EMAIL node's
   output, and the caller would silently receive `appointment_id: null` on a
   booking that really happened. Respond OK is rebound to the NAMED node, which
   is position-independent.

   n8n PUT LAW (RUN 6.5 / 6.6-C): the writable set is {name, nodes, connections,
   settings}, and `settings` is WHITELISTED, never echoed — the UI writes keys the
   API refuses. Omitting settings.errorWorkflow SILENTLY DETACHES the Error
   Sentry, so it is carried forward explicitly and asserted after the write.

   USAGE
     doppler run -p ava-prod -c prd -- node tools/ava-seal/03-booking-rail.mjs --audit
     doppler run -p ava-prod -c prd -- node tools/ava-seal/03-booking-rail.mjs --apply
   IDEMPOTENT: re-running after an apply is a no-op.
   ========================================================================== */
import { need, req, nH, saveJSON, trim, N8N_API, WF_BOOK, ISO } from './_lib.mjs';

need(['N8N_API_KEY']);
const APPLY = process.argv.includes('--apply');
const DIR = 'config-snapshots/2026-08-18-ava-seal';
const GHL_CRED = { httpHeaderAuth: { id: 'wOmBNtlzVgn2fVAc', name: 'GHL Header Auth' } };
const GMAIL_CRED = { gmailOAuth2: { id: '75yoiG46HfIX5VkQ', name: 'Gmail OAuth2 API' } };
const GHL_HEADERS = { parameters: [{ name: 'Version', value: '2021-07-28' }, { name: 'Accept', value: 'application/json' }] };

let failed = 0;
const bad = (m) => { console.log(`  FAIL — ${m}`); failed++; };
const good = (m) => console.log(`  PASS — ${m}`);
const note = (m) => console.log(`  ·  ${m}`);

console.log(`AVA SEAL · STEP 3 · BOOKING RAIL · ${ISO()}`);
console.log('='.repeat(72));

/* ---- pull live, keep the pre-edit copy ---------------------------------- */
const g0 = await req('GET', `${N8N_API}/workflows/${WF_BOOK}`, nH());
if (!g0.ok) { console.error(`RUN INCOMPLETE — GET workflow HTTP ${g0.status}`); process.exit(2); }
const wf = g0.body;
saveJSON(`${DIR}/n8n-${WF_BOOK}-PRE-EDIT.json`, wf);
note(`pre-edit copy saved · versionId ${wf.versionId} · activeVersionId ${wf.activeVersionId}`);

const nodes = JSON.parse(JSON.stringify(wf.nodes));
const conns = JSON.parse(JSON.stringify(wf.connections));
const byName = (n) => nodes.find((x) => x.name === n);
const has = (n) => !!byName(n);

/* ---- LAYOUT: open two clean columns rather than stacking nodes ---------- */
if (!has('Sim Guard?')) {
  for (const n of nodes) if (n.position[0] >= 336) n.position[0] += 220;   // room for the guard
  for (const n of nodes) if (n.position[0] >= 1788) n.position[0] += 660;  // room for the alert chain
}

/* ======================= a. SIM-GUARD ==================================== */
console.log('\n[a] SIM-GUARD');

/* is_sim rides on Normalize so the decision is visible in the execution record
   even on the branch that never reaches the guard. */
const norm = byName('Normalize');
if (!norm) { console.error('RUN INCOMPLETE — Normalize node missing'); process.exit(2); }
const assigns = norm.parameters.assignments.assignments;
const SIM_EXPR =
  "={{ (() => { const b = $json.body || {}; const c = b.call || {}; " +
  "const fn = ((c.from_number == null ? '' : c.from_number) + '').trim(); " +
  "return fn === ''; })() }}";
const existing = assigns.find((a) => a.name === 'is_sim');
if (existing) { existing.value = SIM_EXPR; existing.type = 'boolean'; note('is_sim assignment already present — expression refreshed'); }
else { assigns.push({ id: 'a7', name: 'is_sim', type: 'boolean', value: SIM_EXPR }); good('is_sim added to Normalize'); }

if (!has('Sim Guard?')) {
  nodes.push({
    parameters: {
      conditions: {
        combinator: 'and',
        conditions: [{
          leftValue: "={{ $json.is_sim ? 'SIM' : 'REAL' }}",
          operator: { operation: 'equals', type: 'string' },
          rightValue: 'SIM',
        }],
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
      },
    },
    id: 'sim-guard-if-0001', name: 'Sim Guard?', type: 'n8n-nodes-base.if', typeVersion: 2.3, position: [336, 240],
  });
  good('Sim Guard? IF node added');
}
if (!has('Respond Sim Blocked')) {
  nodes.push({
    parameters: {
      options: { responseCode: 200 },
      respondWith: 'json',
      /* Same shape as Respond Not Available so any caller of this webhook parses
         one contract, with a reason string that names the real cause. */
      responseBody:
        "={{ { \"success\": false, \"reason\": \"simulation_no_phone_leg\", " +
        "\"requested\": ($('Normalize').item.json.slot || ''), \"nearest_slot\": \"\", " +
        "\"nearest_slot_human\": \"\", \"alternatives\": [], " +
        "\"detail\": \"No call.from_number on the payload, so this is not a real phone leg. " +
        "No contact was created or updated and no appointment was booked.\" } }}",
    },
    id: 'sim-guard-resp-0001', name: 'Respond Sim Blocked', type: 'n8n-nodes-base.respondToWebhook',
    typeVersion: 1.5, position: [336, 560],
  });
  good('Respond Sim Blocked added');
}
/* Rewire: Normalize -> Sim Guard? -> (SIM) Respond Sim Blocked | (REAL) Is Our Number? */
conns['Normalize'] = { main: [[{ node: 'Sim Guard?', type: 'main', index: 0 }]] };
conns['Sim Guard?'] = { main: [
  [{ node: 'Respond Sim Blocked', type: 'main', index: 0 }],
  [{ node: 'Is Our Number?', type: 'main', index: 0 }],
] };
good('rewired Normalize -> Sim Guard? -> {Respond Sim Blocked | Is Our Number?}');

/* ======================= b. TITLE ======================================== */
console.log('\n[b] TITLE');
const appt = byName('GHL Create Appointment');
const beforeTitle = appt.parameters.jsonBody;
appt.parameters.jsonBody = beforeTitle.split('AVA Strategy Call - ').join('AVA Discovery Call - ');
if (appt.parameters.jsonBody !== beforeTitle) good('node title -> "AVA Discovery Call - {name}"');
else if (beforeTitle.includes('AVA Discovery Call - ')) note('node title already reads "AVA Discovery Call - {name}"');
else bad('title string not found in GHL Create Appointment');

const newDescription = (wf.description || '').split('AVA Strategy Call').join('AVA Discovery Call');
if (newDescription !== (wf.description || '')) good('workflow description -> "AVA Discovery Call calendar"');
else note('workflow description carries no "Strategy Call"');

/* ======================= c. OWNER INSTANT ALERTS ========================= */
console.log('\n[c] OWNER INSTANT ALERTS');

/* One body builder feeds both legs so SMS and email can never disagree. */
const ALERT_BODY_CODE = `// AVA Booking · node "Owner Alert Body"
// Builds the ONE owner-alert string used by both the SMS and the email leg, so
// the two can never drift apart.
//
// MESSAGE FORMAT LAW: status-led. "BOOKED" is the first token so the outcome is
// readable from a lock screen without opening anything.
const n = $('Normalize').first().json;
const gate = $('Slot Gate').first().json;
const appt = $('GHL Create Appointment').first().json;

// slot_human_ct already ends in " CT". Strip it before re-adding so the line
// reads "... at 2:00 PM CT" and never "... at 2:00 PM CT CT".
const rawSlot = ((gate.slot_human_ct || appt.startTime || '') + '').trim();
const slot = rawSlot.replace(/\\s*CT\\s*$/i, '').trim();

const name  = ((n.name  || '') + '').trim() || 'AVA Lead';
const cell  = ((n.cell  || '') + '').trim() || 'no cell given';
const email = ((n.email || '') + '').trim() || 'no email given';

const owner_msg = ['BOOKED', name, (slot ? slot + ' CT' : 'time unconfirmed'), cell, email].join(' — ');

const owner_email_body = [
  owner_msg,
  '',
  'Name:        ' + name,
  'When:        ' + (slot ? slot + ' CT' : 'time unconfirmed'),
  'Cell:        ' + cell,
  'Email:       ' + email,
  'Business:    ' + (((n.business_type || '') + '').trim() || 'not given'),
  'Appointment: ' + ((appt.id || 'id not returned') + ''),
  '',
  'Booked by AVA on the 414-240-8930 line.'
].join('\\n');

return [{ json: { owner_msg: owner_msg, owner_email_body: owner_email_body } }];
`;

if (!has('Owner Alert Body')) {
  nodes.push({
    parameters: { jsCode: ALERT_BODY_CODE },
    id: 'owner-alert-body-01', name: 'Owner Alert Body', type: 'n8n-nodes-base.code',
    typeVersion: 2, position: [1784, 48],
  });
  good('Owner Alert Body added');
} else { byName('Owner Alert Body').parameters.jsCode = ALERT_BODY_CODE; note('Owner Alert Body refreshed'); }

/* Both legs: onError continueRegularOutput + neverError + a hard timeout.
   A booking must never fail because an alert did. A node TIMEOUT throws past
   `neverError` (RUN 2), so onError is the belt to that suspenders. */
const ALERT_OPTS = { timeout: 8000, response: { response: { neverError: true } } };

if (!has('Owner Alert SMS')) {
  nodes.push({
    parameters: {
      method: 'POST',
      url: 'https://services.leadconnectorhq.com/conversations/messages',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendHeaders: true, headerParameters: GHL_HEADERS,
      sendBody: true, specifyBody: 'json',
      jsonBody: "={{ { type: 'SMS', contactId: $vars.OWNER_ALERT_CONTACT_ID, " +
                "fromNumber: $vars.OWNER_SMS_FROM, message: $('Owner Alert Body').item.json.owner_msg } }}",
      options: ALERT_OPTS,
    },
    id: 'owner-alert-sms-01', name: 'Owner Alert SMS', type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.4, position: [2004, 48], credentials: GHL_CRED, onError: 'continueRegularOutput',
  });
  good('Owner Alert SMS added (GHL conversations · $vars.OWNER_ALERT_CONTACT_ID / OWNER_SMS_FROM)');
}
if (!has('Owner Alert Email')) {
  nodes.push({
    parameters: {
      resource: 'message', operation: 'send',
      sendTo: '={{ $vars.OWNER_ALERT_EMAIL }}',
      subject: "={{ $('Owner Alert Body').item.json.owner_msg }}",
      emailType: 'text',
      message: "={{ $('Owner Alert Body').item.json.owner_email_body }}",
      options: { appendAttribution: false },
    },
    id: 'owner-alert-email-01', name: 'Owner Alert Email', type: 'n8n-nodes-base.gmail',
    typeVersion: 2.2, position: [2224, 48], credentials: GMAIL_CRED, onError: 'continueRegularOutput',
  });
  good('Owner Alert Email added (-> $vars.OWNER_ALERT_EMAIL)');
}

/* Splice the chain between the appointment create and the caller response. */
conns['GHL Create Appointment'] = { main: [
  [{ node: 'Owner Alert Body', type: 'main', index: 0 }],
  [{ node: 'Respond Error', type: 'main', index: 0 }],
] };
conns['Owner Alert Body'] = { main: [[{ node: 'Owner Alert SMS', type: 'main', index: 0 }]] };
conns['Owner Alert SMS'] = { main: [[{ node: 'Owner Alert Email', type: 'main', index: 0 }]] };
conns['Owner Alert Email'] = { main: [[{ node: 'Respond OK', type: 'main', index: 0 }]] };
good('spliced: Create Appointment -> Body -> SMS -> Email -> Respond OK');

/* THE POSITION-DEPENDENCE BUG. Respond OK must read the appointment from the
   NAMED node, not from whatever now happens to sit upstream of it. */
const ok = byName('Respond OK');
const beforeOK = ok.parameters.responseBody;
ok.parameters.responseBody =
  '={{ { "success": true, ' +
  '"appointment_id": ($(\'GHL Create Appointment\').item.json.id || null), ' +
  '"start_time": ($(\'GHL Create Appointment\').item.json.startTime || null), ' +
  '"start_time_human": ($(\'Slot Gate\').item.json.slot_human_ct || null) } }}';
if (beforeOK !== ok.parameters.responseBody) good('Respond OK rebound to the NAMED appointment node (was $json — would have gone null)');
else note('Respond OK already position-independent');

/* ---- assertions BEFORE the write ---------------------------------------- */
console.log('\n[PRE-WRITE ASSERTIONS]');
const draft = { name: wf.name, description: newDescription, nodes, connections: conns };
const blob = JSON.stringify(draft);
if (!blob.includes('Strategy Call')) good('"Strategy Call" appears nowhere in the workflow');
else bad('"Strategy Call" still present');
if (blob.includes('AVA Discovery Call - ')) good('"AVA Discovery Call - {name}" present');
else bad('Discovery Call title missing');

/* The guard is only real if it is UPSTREAM of every write. Walk the graph. */
const reach = (start) => {
  const seen = new Set(); const q = [start];
  while (q.length) {
    const cur = q.shift();
    for (const br of (conns[cur]?.main ?? [])) for (const t of (br ?? [])) {
      if (!seen.has(t.node)) { seen.add(t.node); q.push(t.node); }
    }
  }
  return seen;
};
const fromSim = reach('Respond Sim Blocked');
const WRITES = ['GHL Upsert Contact', 'GHL Create Appointment', 'Owner Alert SMS', 'Owner Alert Email'];
const leaked = WRITES.filter((w) => fromSim.has(w));
if (!leaked.length) good('SIM branch reaches ZERO write nodes (graph-walked, not assumed)');
else bad(`SIM branch can still reach: ${leaked.join(', ')}`);

const fromReal = reach('Sim Guard?');
const missing = WRITES.filter((w) => !fromReal.has(w));
if (!missing.length) good('REAL branch still reaches every write node — the guard did not sever the happy path');
else bad(`REAL branch lost: ${missing.join(', ')}`);

if (failed) { console.error(`\nRUN INCOMPLETE — ${failed} pre-write assertion(s) failed. NOTHING WRITTEN.`); process.exit(2); }
saveJSON(`${DIR}/n8n-${WF_BOOK}-PROPOSED.json`, draft);

if (!APPLY) { console.log('\n--audit only. Re-run with --apply to PUT.'); process.exit(0); }

/* ---- WRITE -------------------------------------------------------------- */
console.log('\n[PUT]');
/* settings is WHITELISTED, never echoed. Dropping errorWorkflow here silently
   detaches the Error Sentry — the alarm for "this rail broke" would itself be
   the thing that broke. */
const settings = { executionOrder: wf.settings?.executionOrder || 'v1' };
if (wf.settings?.errorWorkflow) settings.errorWorkflow = wf.settings.errorWorkflow;

let put = await req('PUT', `${N8N_API}/workflows/${WF_BOOK}`, nH(),
  { name: wf.name, description: newDescription, nodes, connections: conns, settings });
if (!put.ok && put.status === 400) {
  note(`PUT with description rejected (HTTP 400) — retrying without it`);
  note(`  ${trim(put.body, 200)}`);
  put = await req('PUT', `${N8N_API}/workflows/${WF_BOOK}`, nH(),
    { name: wf.name, nodes, connections: conns, settings });
  if (put.ok) bad('description NOT writable via this API — "Strategy Call" survives in the workflow description');
}
if (!put.ok) { console.error(`RUN INCOMPLETE — PUT failed HTTP ${put.status}\n${trim(put.body)}`); process.exit(2); }
good(`PUT HTTP ${put.status}`);
console.log('\nWrite complete. Run 03b to publish + verify.');
