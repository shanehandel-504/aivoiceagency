#!/usr/bin/env node
/* ============================================================================
   AVA SEAL · STEP 4 — POST-CALL TRANSCRIPT RAIL
   "WF-POSTCALL-AVA · 8930 Call Wrap v1.0"
   ----------------------------------------------------------------------------
   On a Retell call_analyzed: email the owner the summary + FULL transcript, and
   write a GHL contact note when the caller's number matches a contact.

   THE PATH COLLISION, AND WHY THE BRIEF'S PATH IS NOT USED BLINDLY.
   The requested path `ava-postcall` is ALREADY REGISTERED by an ACTIVE workflow,
   6r8YHuMEJbxeDyT5 "AVA Post-Call to GHL (Demo Send)" — a mature rail carrying
   owner SMS + email, a Notion call log, a caller text-back and a quarantine gate.
   Two active workflows cannot both own one production webhook path, and that
   workflow is OUTSIDE this run's scope fence, so it may not be deactivated to
   free the name. Claiming the path would therefore either fail or silently steal
   live traffic from a rail this run was told not to touch.
   The collision is detected BEFORE creating anything, and the rail is built on a
   distinct path instead. Deviation reported, never silently absorbed.

   § 9 OWNER RAIL LAW: every active workflow carries the Error Sentry, and our own
   numbers never mutate a real lead — an internal caller is noted, never written.

   USAGE
     doppler run -p ava-prod -c prd -- node tools/ava-seal/04-postcall-rail.mjs --audit
     doppler run -p ava-prod -c prd -- node tools/ava-seal/04-postcall-rail.mjs --apply
   IDEMPOTENT: re-running updates the existing workflow rather than minting a second.
   ========================================================================== */
import { need, req, nH, saveJSON, trim, N8N_API, N8N_HOST, ISO } from './_lib.mjs';

need(['N8N_API_KEY']);
const APPLY = process.argv.includes('--apply');
const DIR = 'config-snapshots/2026-08-18-ava-seal';
const NAME = 'WF-POSTCALL-AVA · 8930 Call Wrap v1.0';
const WANT_PATH = 'ava-postcall';
const FALLBACK_PATH = 'ava-postcall-wrap';
const SENTRY = 'SlnAeMrVRORsF0w7';
const LOC = 'sdShCZCaxce8DHKbYcIl';
const GHL_CRED = { httpHeaderAuth: { id: 'wOmBNtlzVgn2fVAc', name: 'GHL Header Auth' } };
const GMAIL_CRED = { gmailOAuth2: { id: '75yoiG46HfIX5VkQ', name: 'Gmail OAuth2 API' } };
const GHL_HEADERS = { parameters: [{ name: 'Version', value: '2021-07-28' }, { name: 'Accept', value: 'application/json' }] };

let failed = 0;
const bad = (m) => { console.log(`  FAIL — ${m}`); failed++; };
const good = (m) => console.log(`  PASS — ${m}`);
const note = (m) => console.log(`  ·  ${m}`);

console.log(`AVA SEAL · STEP 4 · POST-CALL RAIL · ${ISO()}`);
console.log('='.repeat(72));

/* ---- who owns the requested path? --------------------------------------- */
console.log('\n[PATH OWNERSHIP]');
const all = [];
let cursor = null;
do {
  const r = await req('GET', `${N8N_API}/workflows?limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, nH());
  if (!r.ok) { console.error(`RUN INCOMPLETE — list workflows HTTP ${r.status}`); process.exit(2); }
  all.push(...(r.body.data ?? [])); cursor = r.body.nextCursor ?? null;
} while (cursor);

let mine = all.find((w) => w.name === NAME) ?? null;
const owners = [];
for (const w of all) {
  if (!w.active || w.id === mine?.id) continue;
  const full = await req('GET', `${N8N_API}/workflows/${w.id}`, nH());
  if (!full.ok) continue;
  for (const n of full.body.nodes) {
    if (n.type === 'n8n-nodes-base.webhook' && n.parameters?.path === WANT_PATH) owners.push(`${w.id} "${w.name}"`);
  }
}
let PATH = WANT_PATH;
if (owners.length) {
  console.log(`  "${WANT_PATH}" is ALREADY OWNED by an ACTIVE workflow: ${owners.join(', ')}`);
  console.log(`  That workflow is outside this run's scope fence, so it is not deactivated.`);
  PATH = FALLBACK_PATH;
  console.log(`  => building on "${PATH}" instead. DEVIATION FROM BRIEF — reported, not hidden.`);
} else good(`"${WANT_PATH}" is free`);
const HOOK_URL = `${N8N_HOST}/webhook/${PATH}`;
note(`webhook URL: ${HOOK_URL}`);

/* ---- the wrap payload --------------------------------------------------- */
const WRAP_CODE = `// AVA POST-CALL · node "Wrap Payload"
// The ONE place that reads the Retell call_analyzed envelope, so the owner email
// and the CRM note can never disagree about what happened on the call.
const body = $('Retell Webhook').first().json.body || {};
const c = body.call || {};
const an = c.call_analysis || {};

const d10 = (v) => ((v == null ? '' : v) + '').replace(/[^0-9]/g, '').slice(-10);
const OUR = String(($vars && $vars.OUR_NUMBERS) || '').split(',').map(d10).filter((x) => x.length === 10);

// On an OUTBOUND call the lead is the to_number; inbound it is the from_number.
// Reading from_number unconditionally would file every outbound call under our
// own line and note it on the wrong contact.
const dir = ((c.direction || '') + '').toLowerCase();
const isOut = dir.indexOf('out') === 0;
const caller = (isOut ? c.to_number : c.from_number) || '';
const caller10 = d10(caller);
const is_internal = OUR.indexOf(caller10) !== -1;

const secs = (c.end_timestamp && c.start_timestamp)
  ? Math.round((c.end_timestamp - c.start_timestamp) / 1000)
  : (c.duration_ms ? Math.round(c.duration_ms / 1000) : null);
const duration = secs === null ? 'n/a' : (Math.floor(secs / 60) + 'm ' + (secs % 60) + 's');

const summary = ((an.call_summary || '') + '').trim() || 'No summary returned by Retell.';
const sentiment = an.user_sentiment || 'n/a';
const transcript = ((c.transcript || '') + '').trim() || '(no transcript on this call)';
const started = c.start_timestamp ? new Date(c.start_timestamp).toISOString() : 'n/a';

const subject = 'AVA CALL — ' + (caller || 'unknown caller') + ' — ' + duration + ' — ' + sentiment;

const email_body = [
  subject,
  '',
  'From:      ' + (caller || 'unknown'),
  'To:        ' + (c.to_number || 'n/a'),
  'Direction: ' + (dir || 'n/a'),
  'Duration:  ' + duration,
  'Sentiment: ' + sentiment,
  'Ended:     ' + (c.disconnection_reason || 'n/a'),
  'Call ID:   ' + (c.call_id || 'n/a'),
  'Started:   ' + started,
  'Recording: ' + (c.recording_url || 'n/a'),
  '',
  'SUMMARY',
  summary,
  '',
  'FULL TRANSCRIPT',
  transcript,
].join('\\n');

// A GHL note has a practical size ceiling. Cut the transcript and SAY it was cut,
// pointing at the recording, rather than losing the tail silently.
const MAX = 3500;
const cut = transcript.length > MAX;
const note_body = [
  'AVA CALL LOG — ' + sentiment + ' · ' + duration,
  'From: ' + (caller || 'unknown') + ' · Call ID: ' + (c.call_id || 'n/a'),
  '',
  'SUMMARY',
  summary,
  '',
  'RECORDING',
  (c.recording_url || 'n/a'),
  '',
  'TRANSCRIPT',
  transcript.slice(0, MAX) + (cut ? '\\n…[truncated — full audio at the recording link]' : ''),
].join('\\n');

return [{ json: {
  call_id: c.call_id || '', caller: caller, caller10: caller10, is_internal: is_internal,
  duration: duration, sentiment: sentiment, summary: summary,
  subject: subject, email_body: email_body, note_body: note_body,
  agent_id: c.agent_id || '', transcript_chars: transcript.length,
} }];
`;

const nodes = [
  { parameters: { httpMethod: 'POST', path: PATH, responseMode: 'responseNode', options: {} },
    id: 'pc-webhook-0001', name: 'Retell Webhook', type: 'n8n-nodes-base.webhook', typeVersion: 2.1, position: [0, 240] },

  { parameters: { conditions: { combinator: 'and', conditions: [{
        leftValue: '={{ $json.body.event }}', operator: { type: 'string', operation: 'equals' }, rightValue: 'call_analyzed' }],
      options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' } } },
    id: 'pc-isanalyzed-01', name: 'Is Call Analyzed', type: 'n8n-nodes-base.if', typeVersion: 2.3, position: [220, 240] },

  { parameters: { jsCode: WRAP_CODE },
    id: 'pc-wrap-000001', name: 'Wrap Payload', type: 'n8n-nodes-base.code', typeVersion: 2, position: [440, 160] },

  { parameters: { resource: 'message', operation: 'send',
      sendTo: '={{ $vars.OWNER_ALERT_EMAIL }}',
      subject: "={{ $('Wrap Payload').item.json.subject }}",
      emailType: 'text',
      message: "={{ $('Wrap Payload').item.json.email_body }}",
      options: { appendAttribution: false } },
    id: 'pc-email-00001', name: 'Owner Call Email', type: 'n8n-nodes-base.gmail', typeVersion: 2.2,
    position: [660, 160], credentials: GMAIL_CRED, onError: 'continueRegularOutput' },

  { parameters: { method: 'GET', url: 'https://services.leadconnectorhq.com/contacts/',
      authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth',
      sendQuery: true, specifyQuery: 'keypair',
      queryParameters: { parameters: [
        { name: 'locationId', value: LOC },
        { name: 'query', value: "={{ $('Wrap Payload').item.json.caller10 }}" }] },
      sendHeaders: true, headerParameters: GHL_HEADERS,
      options: { timeout: 12000, response: { response: { neverError: true } } } },
    id: 'pc-find-000001', name: 'GHL Find Contact', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.4,
    position: [880, 160], credentials: GHL_CRED, onError: 'continueRegularOutput' },

  /* Matched AND not one of our own lines. § 9: our numbers never mutate a lead. */
  { parameters: { conditions: { combinator: 'and', conditions: [{
        leftValue: "={{ (() => { const w = $('Wrap Payload').item.json; if (w.is_internal) return 'NO'; if (!w.caller10 || w.caller10.length < 10) return 'NO'; const d = s => ((s == null ? '' : s) + '').replace(/[^0-9]/g, ''); const list = ($json.contacts || []); const hit = list.find(c => d(c.phone).slice(-10) === w.caller10); return hit ? 'YES' : 'NO'; })() }}",
        operator: { operation: 'equals', type: 'string' }, rightValue: 'YES' }],
      options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' } } },
    id: 'pc-matched-0001', name: 'Contact Matched?', type: 'n8n-nodes-base.if', typeVersion: 2.3, position: [1100, 160] },

  { parameters: { method: 'POST',
      url: "=https://services.leadconnectorhq.com/contacts/{{ (() => { const w = $('Wrap Payload').item.json; const d = s => ((s == null ? '' : s) + '').replace(/[^0-9]/g, ''); const hit = ($('GHL Find Contact').item.json.contacts || []).find(c => d(c.phone).slice(-10) === w.caller10); return hit ? hit.id : ''; })() }}/notes",
      authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth',
      sendHeaders: true, headerParameters: GHL_HEADERS,
      sendBody: true, specifyBody: 'json',
      jsonBody: "={{ { body: $('Wrap Payload').item.json.note_body } }}",
      options: { timeout: 12000, response: { response: { neverError: true } } } },
    id: 'pc-note-000001', name: 'GHL Call Note', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.4,
    position: [1320, 80], credentials: GHL_CRED, onError: 'continueRegularOutput' },

  /* `noted` RECOMPUTES the match predicate rather than asking whether the IF node
     produced output — `$('Contact Matched?').all().length > 0` is true on BOTH
     branches, so it reported noted:true on calls where nothing was ever written.
     Sharing the predicate with the IF means the response cannot disagree with
     what actually happened. */
  { parameters: { options: { responseCode: 200 }, respondWith: 'json',
      responseBody: "={{ { ok: true, call_id: $('Wrap Payload').item.json.call_id, emailed: true, noted: (() => { const w = $('Wrap Payload').item.json; if (w.is_internal || !w.caller10 || w.caller10.length < 10) return false; const d = s => ((s == null ? '' : s) + '').replace(/[^0-9]/g, ''); return (($('GHL Find Contact').item.json.contacts) || []).some(c => d(c.phone).slice(-10) === w.caller10); })() } }}" },
    id: 'pc-respok-0001', name: 'Respond OK', type: 'n8n-nodes-base.respondToWebhook', typeVersion: 1.5, position: [1540, 160] },

  { parameters: { options: { responseCode: 200 }, respondWith: 'json',
      responseBody: '={{ { ok: true, ignored: true, event: ($json.body && $json.body.event) || null } }}' },
    id: 'pc-respign-001', name: 'Respond Ignored', type: 'n8n-nodes-base.respondToWebhook', typeVersion: 1.5, position: [440, 400] },
];

const connections = {
  'Retell Webhook': { main: [[{ node: 'Is Call Analyzed', type: 'main', index: 0 }]] },
  'Is Call Analyzed': { main: [
    [{ node: 'Wrap Payload', type: 'main', index: 0 }],
    [{ node: 'Respond Ignored', type: 'main', index: 0 }]] },
  'Wrap Payload': { main: [[{ node: 'Owner Call Email', type: 'main', index: 0 }]] },
  'Owner Call Email': { main: [[{ node: 'GHL Find Contact', type: 'main', index: 0 }]] },
  'GHL Find Contact': { main: [[{ node: 'Contact Matched?', type: 'main', index: 0 }]] },
  'Contact Matched?': { main: [
    [{ node: 'GHL Call Note', type: 'main', index: 0 }],
    [{ node: 'Respond OK', type: 'main', index: 0 }]] },
  'GHL Call Note': { main: [[{ node: 'Respond OK', type: 'main', index: 0 }]] },
};
const settings = { executionOrder: 'v1', errorWorkflow: SENTRY };
const spec = { name: NAME, nodes, connections, settings };

console.log('\n[SHAPE]');
note(`${nodes.length} nodes · Error Sentry ${SENTRY} attached`);
for (const n of nodes) console.log(`    · ${n.name}  [${n.type.replace('n8n-nodes-base.', '')}]`);
saveJSON(`${DIR}/n8n-postcall-PROPOSED.json`, spec);

if (!APPLY) { console.log('\n--audit only. Re-run with --apply to create + activate.'); process.exit(0); }

/* ---- create or update --------------------------------------------------- */
console.log('\n[WRITE]');
let id;
if (mine) {
  id = mine.id;
  const u = await req('PUT', `${N8N_API}/workflows/${id}`, nH(), spec);
  if (!u.ok) { console.error(`RUN INCOMPLETE — PUT HTTP ${u.status}\n${trim(u.body)}`); process.exit(2); }
  good(`updated existing workflow ${id}`);
} else {
  const c = await req('POST', `${N8N_API}/workflows`, nH(), spec);
  if (!c.ok) { console.error(`RUN INCOMPLETE — create HTTP ${c.status}\n${trim(c.body)}`); process.exit(2); }
  id = c.body.id;
  good(`created workflow ${id}`);
}

/* ---- activate ----------------------------------------------------------- */
let w = (await req('GET', `${N8N_API}/workflows/${id}`, nH())).body;
if (!w.active) {
  const a = await req('POST', `${N8N_API}/workflows/${id}/activate`, nH());
  note(`activate -> HTTP ${a.status}`);
  if (!a.ok) console.log(`      ${trim(a.body, 300)}`);
  w = (await req('GET', `${N8N_API}/workflows/${id}`, nH())).body;
}
if (w.active) good('workflow ACTIVE'); else bad('workflow is NOT active');
if (w.versionId === w.activeVersionId) good('versionId === activeVersionId — production runs this code');
else bad(`DRIFT — draft ${w.versionId} vs published ${w.activeVersionId}`);
if (w.settings?.errorWorkflow === SENTRY) good('Error Sentry attached');
else bad(`errorWorkflow = ${w.settings?.errorWorkflow ?? '(NONE)'}`);

/* ---- the collision must NOT have disturbed the incumbent ---------------- */
if (owners.length) {
  const incumbentId = owners[0].split(' ')[0];
  const inc = await req('GET', `${N8N_API}/workflows/${incumbentId}`, nH());
  if (inc.ok && inc.body.active) good(`incumbent ${incumbentId} still ACTIVE and untouched`);
  else bad(`incumbent ${incumbentId} is no longer active — this run disturbed an out-of-scope rail`);
}

saveJSON(`${DIR}/n8n-postcall-CREATED.json`, w);
console.log('\n' + '='.repeat(72));
if (failed) { console.error(`RUN INCOMPLETE — STEP 4: ${failed} assertion(s) failed.`); process.exit(2); }
console.log(`POST-CALL RAIL LIVE — ${id} on ${HOOK_URL}`);
console.log(`\nexport SEAL_POSTCALL_WF_ID=${id}`);
console.log(`export SEAL_POSTCALL_PATH=${PATH}`);
