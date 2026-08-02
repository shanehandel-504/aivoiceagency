#!/usr/bin/env node
/* ============================================================================
   tools/n8n-owner-rail.mjs  ·  RUN 6.5 · OWNER RAIL
   ----------------------------------------------------------------------------
   RUN 6 found that owner alerting pointed at a HARDCODED GHL contact id which
   was ALSO a demo-lead row. Any booking that upserted by phone/email could
   overwrite the address the system alerts the owner on, and lead-facing copy
   was landing in the owner's thread. See reports/2026-07-26-run6-ops-triage.md.

   This tool makes owner alerting un-corruptible:

     STEP 3  every owner-alert node points at $vars.OWNER_ALERT_CONTACT_ID —
             a dedicated GHL contact that is never an upsert target — and the
             post-call workflow gains a real owner SMS + owner email leg.
     STEP 4  before ANY upsert, if the other party's number is one of OUR OWN
             (every Retell number, the published SMS line, both owner cells)
             the write is routed to $vars.ZZ_TEST_CONTACT_ID instead of
             creating or mutating a real lead. This also fixes the RUN 5 `cell`
             defect, where book_appointment wrote AVA's own published line into
             the lead's phone field.

   NOTHING SENSITIVE LIVES IN THIS FILE. Contact ids and phone numbers are read
   at runtime from n8n Variables, which are set from Doppler + the live APIs by
   the RUN 6.5 provisioning step. This file only ever names the KEYS.

   n8n Variables consumed:
     OWNER_ALERT_CONTACT_ID · ZZ_TEST_CONTACT_ID · OWNER_SMS_FROM
     OWNER_ALERT_EMAIL      · OUR_NUMBERS (csv of last-10 digits)

   USAGE (always through Doppler):
     doppler run --project ava-prod --config prd -- node tools/n8n-owner-rail.mjs --audit
     doppler run --project ava-prod --config prd -- node tools/n8n-owner-rail.mjs --apply

   IDEMPOTENT: re-running after an apply is a no-op.
   Build-time only. tools/ is never deployed (see .vercelignore).
   ========================================================================== */

const HOST = 'https://circulant.app.n8n.cloud';
const KEY = process.env.N8N_API_KEY;
if (!KEY) { console.error('N8N_API_KEY missing — run through Doppler'); process.exit(2); }

const MODE = process.argv.includes('--apply') ? 'apply' : 'audit';

/* the workflows this run touches */
const WF = {
  postcall: '6r8YHuMEJbxeDyT5',   // AVA Post-Call to GHL (Demo Send)
  receipt: 'NMSWFtcyEQhSypSx',    // AVA Booking Receipt
  book: 'c5GPBkma1HyvonEa',       // AVA · book_appointment · realtime
  intake: '9FoLm4slBmM5nIus',     // AVA Client Intake
  drip: 'Pu661B1J1ZgezJT7',       // AVA Drip Engine v1
  alertowner: 'RH6POCJWU5CUdTyd', // AVA · alert_owner · realtime
};

/* the dead hardcoded target RUN 6 found, plus the staged placeholder */
const OLD_CONTACT = '8zyowOdgNehLoYLpmVBm';
const OLD_PLACEHOLDER = 'PASTE_SHANE_OWNER_CONTACT_ID';
const OLD_FROM = '+13502205305';

const GHL_CRED = { httpHeaderAuth: { id: 'wOmBNtlzVgn2fVAc', name: 'GHL Header Auth' } };
const GMAIL_CRED = { gmailOAuth2: { id: '75yoiG46HfIX5VkQ', name: 'Gmail OAuth2 API' } };

/* PUT /workflows/{id} rejects any settings key outside its own schema. The UI
   writes keys the public API will not accept back (availableInMCP, binaryMode,
   timeSavedMode, callerPolicy) — so settings is WHITELISTED, never echoed. */
const SETTINGS_OK = [
  'saveExecutionProgress', 'saveManualExecutions', 'saveDataErrorExecution',
  'saveDataSuccessExecution', 'executionTimeout', 'errorWorkflow',
  'timezone', 'executionOrder',
];
const pickSettings = (s) => {
  const o = {};
  for (const k of SETTINGS_OK) if (s && s[k] !== undefined) o[k] = s[k];
  return o;
};

async function api(method, path, body) {
  const r = await fetch(`${HOST}/api/v1${path}`, {
    method,
    headers: { 'X-N8N-API-KEY': KEY, 'Content-Type': 'application/json', accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  if (r.status >= 400) throw new Error(`n8n ${method} ${path} -> ${r.status}: ${t.slice(0, 400)}`);
  try { return JSON.parse(t); } catch { return t; }
}

const get = (id) => api('GET', `/workflows/${id}`);
const put = (id, w) => api('PUT', `/workflows/${id}`, {
  name: w.name, nodes: w.nodes, connections: w.connections, settings: pickSettings(w.settings),
});
const node = (w, name) => w.nodes.find((n) => n.name === name);
const has = (w, name) => !!node(w, name);

/* ---------------------------------------------------------------- fragments */

/* Detects "the other party on this call is one of our own numbers".
   Inbound  -> the other party is call.from_number.
   Outbound -> the other party is call.to_number.
   OUR_NUMBERS is a csv of last-10 digits, sourced from env at provisioning. */
const IS_INTERNAL_JS = `(() => { const call = ($json.body && $json.body.call) || {}; const dig = s => ((s == null ? '' : s) + '').replace(/[^0-9]/g, ''); const OUR = String($vars.OUR_NUMBERS || '').split(',').map(x => dig(x).slice(-10)).filter(x => x.length === 10); const dir = ((call.direction || '') + '').toLowerCase(); const isOut = dir.indexOf('out') === 0; const other = isOut ? call.to_number : call.from_number; return OUR.indexOf(dig(other).slice(-10)) !== -1; })()`;

const setNode = (id, name, pos, assignments) => ({
  id, name, type: 'n8n-nodes-base.set', typeVersion: 3.4, position: pos,
  parameters: { mode: 'manual', assignments: { assignments }, options: {} },
});

const ifNode = (id, name, pos, leftExpr) => ({
  id, name, type: 'n8n-nodes-base.if', typeVersion: 2.3, position: pos,
  parameters: {
    conditions: {
      combinator: 'and',
      conditions: [{
        leftValue: leftExpr,
        operator: { operation: 'equals', type: 'string' },
        rightValue: 'YES',
      }],
      options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
    },
  },
});

const ghlPost = (id, name, pos, url, jsonBody) => ({
  id, name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4.4, position: pos,
  credentials: GHL_CRED,
  parameters: {
    method: 'POST', url,
    authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth',
    sendHeaders: true,
    headerParameters: { parameters: [{ name: 'Version', value: '2021-07-28' }, { name: 'Accept', value: 'application/json' }] },
    sendBody: true, specifyBody: 'json', jsonBody,
    options: { response: { response: { neverError: true } } },
  },
});

const changes = [];
const record = (s) => { changes.push(s); console.log(`  ${MODE === 'apply' ? 'WROTE ' : 'WOULD '}: ${s}`); };

/* ------------------------------------------------- STEP 3a · repoint owners */

async function repoint() {
  console.log('\n=== STEP 3a — repoint every owner-alert reference ===');
  const targets = [
    [WF.receipt, 'Owner Alert SMS'],
    [WF.intake, 'Owner SMS Alert'],
    [WF.drip, 'Owner NEW LEAD SMS'],
    [WF.alertowner, 'Owner SMS (staged - needs number)'],
  ];
  for (const [id, nodeName] of targets) {
    const w = await get(id);
    const n = node(w, nodeName);
    if (!n) { console.log(`  SKIP  : ${w.name} / ${nodeName} — node not found`); continue; }
    const before = n.parameters.jsonBody || '';
    let after = before
      .split(`'${OLD_CONTACT}'`).join('$vars.OWNER_ALERT_CONTACT_ID')
      .split(`"${OLD_CONTACT}"`).join('$vars.OWNER_ALERT_CONTACT_ID')
      .split(`"${OLD_PLACEHOLDER}"`).join('$vars.OWNER_ALERT_CONTACT_ID')
      .split(`'${OLD_FROM}'`).join('$vars.OWNER_SMS_FROM')
      .split(`"${OLD_FROM}"`).join('$vars.OWNER_SMS_FROM');
    /* the staged node had no fromNumber at all — give it one */
    if (id === WF.alertowner && !after.includes('fromNumber')) {
      after = after.replace('"type": "SMS",', '"type": "SMS", "fromNumber": $vars.OWNER_SMS_FROM,');
    }
    if (after === before) { console.log(`  OK    : ${w.name} / ${nodeName} — already repointed`); continue; }
    n.parameters.jsonBody = after;
    if (MODE === 'apply') await put(id, w);
    record(`${w.name} / ${nodeName} -> $vars.OWNER_ALERT_CONTACT_ID`);
  }
}

/* -------------------------------------- STEP 3b + 4a · post-call owner rail */

async function postcall() {
  console.log('\n=== STEP 3b/4a — post-call owner legs + upsert guard ===');
  const w = await get(WF.postcall);

  /* --- 4a.1  Build GHL Body: OUR_NUMBERS from config, and flag internal calls */
  const bgb = node(w, 'Build GHL Body');
  if (bgb && !bgb.parameters.jsCode.includes('$vars.OUR_NUMBERS')) {
    let js = bgb.parameters.jsCode;
    js = js.replace(
      /\/\/ our own published lines[\s\S]*?const OUR_NUMBERS = \[[^\]]*\];/,
      `// RUN 6.5 — OUR OWN numbers come from config (every Retell line, the published\n// SMS line, both owner cells). A call from one of them is never a lead.\nconst OUR_NUMBERS = String($vars.OUR_NUMBERS || '').split(',').map((x) => ((x == null ? '' : x) + '').replace(/[^0-9]/g, '').slice(-10)).filter((x) => x.length === 10);`
    );
    js = js.replace(
      'return [{ json: { ghl_body: body, has_identifier: !!(phone || email) } }];',
      `// RUN 6.5 — an internal test call still needs a destination, so it reports an\n// identifier and is routed to the zz-test contact instead of upserting a lead.\nconst isInternal = OUR_NUMBERS.indexOf(((c.from_number == null ? '' : c.from_number) + '').replace(/[^0-9]/g, '').slice(-10)) !== -1;\nreturn [{ json: { ghl_body: body, is_internal: isInternal, has_identifier: !!(phone || email) || isInternal } }];`
    );
    if (js === bgb.parameters.jsCode) throw new Error('Build GHL Body patch did not match — aborting rather than guessing');
    bgb.parameters.jsCode = js;
    record('post-call / Build GHL Body -> $vars.OUR_NUMBERS + is_internal flag');
  } else if (bgb) console.log('  OK    : post-call / Build GHL Body — guard already present');

  /* --- 4a.2  branch the upsert: our own number never touches a real lead */
  if (!has(w, 'Is Our Number?')) {
    w.nodes.push(ifNode('r65if1', 'Is Our Number?', [980, -190], "={{ $json.is_internal ? 'YES' : 'NO' }}"));
    w.nodes.push(setNode('r65set1', 'Test Contact', [1150, -280], [
      { id: 'tc1', name: 'contact', type: 'object', value: '={{ { id: $vars.ZZ_TEST_CONTACT_ID } }}' },
    ]));
    w.nodes.push(setNode('r65set2', 'Contact Ref', [1150, -60], [
      { id: 'cr1', name: 'contact', type: 'object', value: '={{ $json.contact }}' },
      { id: 'cr2', name: 'contact_id', type: 'string', value: '={{ $json.contact.id }}' },
      { id: 'cr3', name: 'is_internal', type: 'boolean', value: "={{ $('Build GHL Body').item.json.is_internal }}" },
    ]));
    w.connections['Has Identifier'].main[0] = [{ node: 'Is Our Number?', type: 'main', index: 0 }];
    w.connections['Is Our Number?'] = { main: [
      [{ node: 'Test Contact', type: 'main', index: 0 }],
      [{ node: 'GHL Upsert Contact', type: 'main', index: 0 }],
    ] };
    w.connections['Test Contact'] = { main: [[{ node: 'Contact Ref', type: 'main', index: 0 }]] };
    w.connections['GHL Upsert Contact'] = { main: [[{ node: 'Contact Ref', type: 'main', index: 0 }]] };
    w.connections['Contact Ref'] = { main: [[{ node: 'GHL Call Note', type: 'main', index: 0 }]] };
    record('post-call / upsert guard: Is Our Number? -> Test Contact | GHL Upsert Contact -> Contact Ref');
  } else console.log('  OK    : post-call / upsert guard already wired');

  /* --- 4a.3  downstream must read the merged contact id, not the upsert node */
  for (const nm of ['Send Email', 'Send SMS']) {
    const n = node(w, nm);
    if (n && n.parameters.jsonBody && n.parameters.jsonBody.includes("$('GHL Upsert Contact').item.json.contact.id")) {
      n.parameters.jsonBody = n.parameters.jsonBody
        .split("$('GHL Upsert Contact').item.json.contact.id").join("$('Contact Ref').item.json.contact_id");
      record(`post-call / ${nm} -> reads Contact Ref (survives the test branch)`);
    }
  }

  /* --- 4a.4  never send caller-facing demo copy on an internal test call */
  if (!has(w, 'Caller Send?')) {
    w.nodes.push(ifNode('r65if2', 'Caller Send?', [1150, 176], "={{ $('Contact Ref').item.json.is_internal ? 'NO' : 'YES' }}"));
    w.connections['Send SMS'] = { main: [[{ node: 'Caller Send?', type: 'main', index: 0 }]] };
    w.connections['Caller Send?'] = { main: [
      [{ node: 'Send Email', type: 'main', index: 0 }],
      [{ node: 'Respond OK', type: 'main', index: 0 }],
    ] };
    record('post-call / Caller Send? gate — internal calls skip the demo email');
  } else console.log('  OK    : post-call / Caller Send? gate already wired');

  /* --- 3b  the owner legs, on their own branch so a failure is visible and
         never blocks the caller-facing path */
  if (!has(w, 'Owner Alert SMS')) {
    w.nodes.push(ghlPost('r65sms', 'Owner Alert SMS', [1540, -220],
      'https://services.leadconnectorhq.com/conversations/messages',
      "={{ (() => { const c = $('Retell Webhook').item.json.body.call || {}; const s = $('Normalize').item.json; const secs = (c.end_timestamp && c.start_timestamp) ? Math.round((c.end_timestamp - c.start_timestamp) / 1000) : null; const dur = secs !== null ? (Math.floor(secs / 60) + 'm ' + (secs % 60) + 's') : 'n/a'; const caller = c.from_number || 'web-call'; let sum = ((s.summary == null ? '' : s.summary) + '').replace(/\\s+/g, ' ').trim() || 'no summary'; if (sum.length > 110) sum = sum.slice(0, 107) + '...'; return { type: 'SMS', contactId: $vars.OWNER_ALERT_CONTACT_ID, fromNumber: $vars.OWNER_SMS_FROM, message: 'AVA call: ' + caller + ' \\u00b7 ' + dur + ' \\u00b7 ' + sum }; })() }}"));
    w.nodes.push({
      id: 'r65mail', name: 'Owner Alert Email', type: 'n8n-nodes-base.gmail', typeVersion: 2.2,
      position: [1760, -220], credentials: GMAIL_CRED, webhookId: 'r65-owner-mail',
      parameters: {
        resource: 'message', operation: 'send',
        sendTo: '={{ $vars.OWNER_ALERT_EMAIL }}',
        subject: "=AVA call — {{ $('Format Call Log').item.json.log_title }}",
        emailType: 'text',
        message: "={{ $('Format Call Log').item.json.log_body }}",
        options: { appendAttribution: false },
      },
    });
    w.connections['Format Call Log'].main[0].push({ node: 'Owner Alert SMS', type: 'main', index: 0 });
    w.connections['Owner Alert SMS'] = { main: [[{ node: 'Owner Alert Email', type: 'main', index: 0 }]] };
    record('post-call / Owner Alert SMS + Owner Alert Email (summary + recording URL)');
  } else console.log('  OK    : post-call / owner legs already present');

  /* Notion stays OFF, by instruction */
  const notion = node(w, 'Notion Call Log Append');
  console.log(`  NOTION: ${notion ? (notion.disabled ? 'disabled — correct' : 'ENABLED — expected disabled') : 'absent'}`);

  if (MODE === 'apply') await put(WF.postcall, w);
}

/* ------------------------------------------ STEP 4b · book_appointment guard */

async function book() {
  console.log('\n=== STEP 4b — book_appointment guard + `cell` fix ===');
  const w = await get(WF.book);

  /* 4b.1 flag internal callers on Normalize */
  const nrm = node(w, 'Normalize');
  const assigns = nrm.parameters.assignments.assignments;
  if (!assigns.find((a) => a.name === 'is_internal')) {
    assigns.push({ id: 'a6', name: 'is_internal', type: 'boolean', value: `={{ ${IS_INTERNAL_JS} }}` });
    record('book / Normalize -> is_internal flag from $vars.OUR_NUMBERS');
  } else console.log('  OK    : book / Normalize already flags internal calls');

  /* 4b.2 the `cell` fix — RUN 5 shipped AVA's own published line as the lead's
     phone because the reject list held exactly one number. It now holds every
     number we own, read from config. */
  const up = node(w, 'GHL Upsert Contact');
  if (!up.parameters.jsonBody.includes('$vars.OUR_NUMBERS')) {
    up.parameters.jsonBody = "={{ (() => { const b = $('Retell Webhook').item.json.body || {}; const call = b.call || {}; const a = b.args || {}; const dv = call.retell_llm_dynamic_variables || {}; const dig = s => ((s == null ? '' : s) + '').replace(/[^0-9]/g, ''); const OUR = String($vars.OUR_NUMBERS || '').split(',').map(x => dig(x).slice(-10)).filter(x => x.length === 10); const last10 = s => dig(s).slice(-10); const ours = s => OUR.indexOf(last10(s)) !== -1; const valid = s => { const d = dig(s); return d.length >= 10 && !/^0+$/.test(d) && !ours(s); }; const norm = s => { const raw = ((s == null ? '' : s) + '').trim(); const d = dig(raw); if (raw.charAt(0) === '+') return '+' + d; if (d.length === 10) return '+1' + d; if (d.length === 11 && d.charAt(0) === '1') return '+' + d; return d ? ('+' + d) : ''; }; const dir = ((call.direction || '') + '').toLowerCase(); const isOut = dir.indexOf('out') === 0 || ours(call.from_number); const primary = isOut ? call.to_number : call.from_number; const cands = [a.cell, a.phone, b.cell, dv.cell, primary]; let ph = ''; for (const c of cands) { if (valid(c)) { ph = norm(c); break; } } return Object.assign({ locationId: 'sdShCZCaxce8DHKbYcIl', name: $json.name, source: 'AVA Live Demo', tags: (ph ? ['AVA Demo Call'] : ['AVA Demo Call', 'phone-unresolved']) }, $json.email ? { email: $json.email } : {}, ph ? { phone: ph } : {}); })() }}";
    record('book / GHL Upsert Contact -> rejects EVERY number we own, not just one');
  } else console.log('  OK    : book / cell guard already widened');

  /* 4b.3 route our own numbers to the zz-test contact instead of a real lead */
  if (!has(w, 'Is Our Number?')) {
    w.nodes.push(ifNode('r65bif', 'Is Our Number?', [336, 240], "={{ $json.is_internal ? 'YES' : 'NO' }}"));
    w.nodes.push(setNode('r65btc', 'Test Contact', [560, 96], [
      { id: 'tc1', name: 'contact', type: 'object', value: '={{ { id: $vars.ZZ_TEST_CONTACT_ID } }}' },
    ]));
    w.nodes.push(setNode('r65bcr', 'Contact Ref', [700, 240], [
      { id: 'cr1', name: 'contact_id', type: 'string', value: '={{ $json.contact.id }}' },
    ]));
    w.connections['Normalize'] = { main: [[{ node: 'Is Our Number?', type: 'main', index: 0 }]] };
    w.connections['Is Our Number?'] = { main: [
      [{ node: 'Test Contact', type: 'main', index: 0 }],
      [{ node: 'GHL Upsert Contact', type: 'main', index: 0 }],
    ] };
    w.connections['Test Contact'] = { main: [[{ node: 'Contact Ref', type: 'main', index: 0 }]] };
    w.connections['GHL Upsert Contact'] = { main: [
      [{ node: 'Contact Ref', type: 'main', index: 0 }],
      [{ node: 'Respond Error', type: 'main', index: 0 }],
    ] };
    w.connections['Contact Ref'] = { main: [[{ node: 'GHL Get Free Slots', type: 'main', index: 0 }]] };
    record('book / upsert guard: Is Our Number? -> Test Contact | GHL Upsert Contact -> Contact Ref');
  } else console.log('  OK    : book / upsert guard already wired');

  const appt = node(w, 'GHL Create Appointment');
  if (appt.parameters.jsonBody.includes('$("GHL Upsert Contact").item.json.contact.id')) {
    appt.parameters.jsonBody = appt.parameters.jsonBody
      .split('$("GHL Upsert Contact").item.json.contact.id').join('$("Contact Ref").item.json.contact_id');
    record('book / GHL Create Appointment -> reads Contact Ref');
  }

  if (MODE === 'apply') await put(WF.book, w);
}

/* -------------------------------------------------------------------- audit */

async function report() {
  console.log('\n=== VERIFY — where does every owner-alert reference point now? ===');
  for (const [k, id] of Object.entries(WF)) {
    const w = await get(id);
    const s = JSON.stringify(w);
    const stale = s.includes(OLD_CONTACT) || s.includes(OLD_PLACEHOLDER);
    const wired = s.includes('$vars.OWNER_ALERT_CONTACT_ID');
    const guard = s.includes('$vars.OUR_NUMBERS');
    console.log(`  ${k.padEnd(11)} ${w.active ? 'active' : 'off   '}  ownerRef=${wired ? 'vars' : '—'}  guard=${guard ? 'yes' : '—'}  staleHardcode=${stale ? 'YES ***' : 'no'}`);
  }
}

/* ------------------------------------------------------- RUN 10 · LIVE GATES

   RUN 10 found the owner SMS had been dead for days while every check above
   still reported green. Two blind spots did it, and both are now assertions
   that EXIT NON-ZERO rather than lines of console output.

   GATE 1 — the value, not the reference. report() only proves a node says
   `$vars.OWNER_ALERT_CONTACT_ID`. It never asked whether that variable points
   at a contact that still exists. It did not: the GHL row had been rebuilt and
   the variable still held the deleted id, so every send answered
   400 CONVERSATIONS_CONTACT_NOT_FOUND — swallowed by neverError:true, which
   exists to stop an owner-alert failure from breaking the caller path. §9
   already says "verify the VALUE, not just the id"; this enforces it.

   GATE 2 — draft vs published. An ACTIVE n8n workflow keeps serving
   `activeVersionId`. Writes land on the draft, and GET /workflows/{id} returns
   the DRAFT nodes at the top level — so a structural check against the API
   passes while production still runs the old code. Only publishing swaps it.
   Same shape as the Retell trap: what you read is not what answers the phone. */

async function liveGates() {
  let failed = 0;

  console.log('\n=== GATE 1 — do the owner-rail VALUES resolve in GHL? ===');
  const PIT = process.env.GHL_PIT;
  if (!PIT) {
    console.log('  SKIPPED — GHL_PIT not in env. This gate is the one that catches a');
    console.log('  deleted alert contact; run through Doppler so it actually runs.');
    failed++;
  } else {
    const vs = (await api('GET', '/variables')).data || [];
    for (const key of ['OWNER_ALERT_CONTACT_ID', 'ZZ_TEST_CONTACT_ID']) {
      const row = vs.find((v) => v.key === key);
      if (!row || !row.value) { console.log(`  ${key}: UNSET ***`); failed++; continue; }
      const r = await fetch(`https://services.leadconnectorhq.com/contacts/${row.value}`, {
        headers: { Authorization: `Bearer ${PIT}`, Version: '2021-07-28', accept: 'application/json' },
      });
      if (r.status !== 200) { console.log(`  ${key} = ${row.value} -> DEAD (${r.status}) ***`); failed++; continue; }
      const ct = (await r.json()).contact || {};
      const tags = ct.tags || [];
      /* an alert target that is not tagged internal is an upsert target waiting
         to happen — that is the RUN 6 defect, not a style preference */
      const safe = tags.includes('zz-internal') || tags.includes('do-not-drip');
      const who = `${ct.firstName || ''} ${ct.lastName || ''}`.trim() || '(unnamed)';
      console.log(`  ${key} = ${row.value} -> resolves ("${who}", tags ${tags.join('/') || 'none'})${safe ? '' : '  *** NOT TAGGED INTERNAL'}`);
      if (!safe) failed++;
    }
  }

  console.log('\n=== GATE 2 — is the draft actually PUBLISHED? ===');
  for (const [k, id] of Object.entries(WF)) {
    const w = await get(id);
    if (!w.active) { console.log(`  ${k.padEnd(11)} inactive — skipped`); continue; }
    const live = w.versionId === w.activeVersionId;
    console.log(`  ${k.padEnd(11)} ${live ? 'published' : 'DRAFT NOT PUBLISHED *** production still runs ' + w.activeVersionId}`);
    if (!live) failed++;
  }

  return failed;
}

console.log(`n8n OWNER RAIL — mode: ${MODE.toUpperCase()}`);
const vars = (await api('GET', '/variables')).data || [];
const need = ['OWNER_ALERT_CONTACT_ID', 'ZZ_TEST_CONTACT_ID', 'OWNER_SMS_FROM', 'OWNER_ALERT_EMAIL', 'OUR_NUMBERS'];
const missing = need.filter((k) => !vars.find((v) => v.key === k));
if (missing.length) { console.error(`ABORT — n8n Variables missing: ${missing.join(', ')}`); process.exit(2); }
console.log(`config: all ${need.length} n8n Variables present`);

await repoint();
await postcall();
await book();
await report();
const gateFailures = await liveGates();

console.log(`\n${MODE === 'apply' ? 'APPLIED' : 'AUDIT ONLY'} — ${changes.length} change(s).`);
if (MODE !== 'apply') console.log('re-run with --apply to write.');

if (gateFailures) {
  console.error(`\nRAIL GATE FAILED — ${gateFailures} problem(s) above. The owner alert is NOT trustworthy.`);
  process.exit(1);
}
console.log('RAIL GATE PASSED — owner-alert values resolve live and every active workflow is published.');
