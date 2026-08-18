#!/usr/bin/env node
/* ============================================================================
   AVA SEAL · STEP 6 — THE GATE
   ----------------------------------------------------------------------------
   Independently re-reads every claim from the LIVE APIs. It shares no state with
   the tools that made the changes — it trusts no earlier green, no saved file and
   no assertion this run already printed. A board flip is only honest if something
   that did not do the work can still see it from outside.

   Exit 0 = every board item may read LIVE. Exit 2 = at least one may not.
   ========================================================================== */
import { need, req, rH, nH, gH, saveJSON, trim, RETELL, N8N_API, N8N_HOST, GHL_API, NUMBER, AGENT_ID, WF_BOOK, ISO } from './_lib.mjs';

need(['RETELL_API_KEY', 'N8N_API_KEY', 'GHL_PIT', 'GHL_LOCATION_ID']);
const WF_POST = 'kpYlhLbwSD0W1sE0';
const LOOKUP = `${N8N_HOST}/webhook/ava-inbound-lookup`;
const POSTCALL = `${N8N_HOST}/webhook/ava-postcall-wrap`;
const BOOKING = `${N8N_HOST}/webhook/ava-book-appointment`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const RESULT = {};
let cur = null;
const item = (k) => { cur = k; RESULT[k] = { pass: 0, fail: 0, notes: [] }; console.log(`\n${'='.repeat(72)}\n${k}\n${'='.repeat(72)}`); };
const good = (m) => { RESULT[cur].pass++; console.log(`  PASS — ${m}`); };
const bad = (m) => { RESULT[cur].fail++; RESULT[cur].notes.push(m); console.log(`  FAIL — ${m}`); };
const note = (m) => console.log(`  ·  ${m}`);

console.log(`AVA SEAL · GATE · ${ISO()}`);

/* ======================= WARM-RECOGNITION-8930 ========================== */
item('WARM-RECOGNITION-8930');
{
  const n = (await req('GET', `${RETELL}/get-phone-number/${encodeURIComponent(NUMBER)}`, rH())).body;
  if (n.inbound_webhook_url === LOOKUP) good(`number inbound_webhook_url -> ${LOOKUP}`);
  else bad(`inbound_webhook_url = ${n.inbound_webhook_url ?? '(none)'}`);

  const r = await req('POST', LOOKUP, { accept: 'application/json' },
    { event: 'call_inbound', call_inbound: { agent_id: AGENT_ID, from_number: '+15550004321', to_number: NUMBER } },
    { timeoutMs: 15000 });
  const dv = r.body?.call_inbound?.dynamic_variables;
  if (r.status === 200) good(`unknown caller -> HTTP 200 in ${r.ms}ms`); else bad(`HTTP ${r.status}`);
  if (r.ms < 5000) good(`${r.ms}ms inside the 5s fail-open budget`); else bad(`${r.ms}ms exceeds 5s`);
  if (String(dv?.caller_known) === 'false') good('dynamic_variables.caller_known = "false"');
  else bad(`caller_known = ${JSON.stringify(dv?.caller_known)}`);
}

/* ======================= SIM-GUARD ====================================== */
item('SIM-GUARD');
{
  const stamp = ISO().replace(/[^0-9]/g, '').slice(0, 14);
  const email = `zz-gate-${stamp}@example.invalid`;
  const t0 = Date.now();
  const r = await req('POST', BOOKING, { accept: 'application/json' },
    { name: 'book_appointment',
      args: { name: `Zzgate${stamp}`, email, cell: '', slot: 'tomorrow at 2 PM', business_type: 'limo' },
      call: { call_id: `gate_${stamp}`, agent_id: AGENT_ID, direction: 'inbound' } },
    { timeoutMs: 30000 });
  if (r.status === 200 && r.body?.success === false) good('sim payload refused (200, success=false)');
  else bad(`sim not refused: HTTP ${r.status} ${trim(r.body, 200)}`);
  if (r.body?.reason === 'simulation_no_phone_leg') good('reason = "simulation_no_phone_leg"');
  else bad(`reason = ${JSON.stringify(r.body?.reason)}`);

  await sleep(4000);
  const ex = (await req('GET', `${N8N_API}/executions?workflowId=${WF_BOOK}&limit=10&includeData=true`, nH())).body?.data ?? [];
  const mine = ex.find((e) => new Date(e.startedAt).getTime() >= t0 - 3000);
  const ran = Object.keys(mine?.data?.resultData?.runData ?? {});
  note(`execution ${mine?.id} nodes: ${ran.join(', ')}`);
  const WRITES = ['GHL Upsert Contact', 'GHL Create Appointment', 'Owner Alert SMS', 'Owner Alert Email'];
  const fired = WRITES.filter((w) => ran.includes(w));
  if (!fired.length) good('zero write nodes executed');
  else bad(`write nodes executed: ${fired.join(', ')}`);

  const s = await req('POST', `${GHL_API}/contacts/search`, gH(),
    { locationId: process.env.GHL_LOCATION_ID, page: 1, pageLimit: 20,
      filters: [{ field: 'email', operator: 'eq', value: email }] });
  if ((s.body?.contacts ?? []).length === 0) good('GHL has no record of the probe — nothing written');
  else bad(`GHL returned ${s.body.contacts.length} contact(s) for the probe`);
}

/* ======================= OWNER-ALERTS-8930 ============================== */
item('OWNER-ALERTS-8930');
{
  const w = (await req('GET', `${N8N_API}/workflows/${WF_BOOK}`, nH())).body;
  if (w.active) good('booking workflow ACTIVE'); else bad('booking workflow inactive');
  if (w.versionId === w.activeVersionId) good('versionId === activeVersionId — production runs this code');
  else bad(`DRIFT draft ${w.versionId} vs published ${w.activeVersionId}`);

  const names = w.nodes.map((n) => n.name);
  for (const n of ['Owner Alert Body', 'Owner Alert SMS', 'Owner Alert Email'])
    names.includes(n) ? good(`node present: ${n}`) : bad(`node MISSING: ${n}`);

  /* alerts must sit BETWEEN the appointment create and the caller response */
  const hop = (from) => (w.connections[from]?.main?.[0] ?? []).map((t) => t.node);
  const chain = ['GHL Create Appointment', 'Owner Alert Body', 'Owner Alert SMS', 'Owner Alert Email'];
  let ok = true;
  for (let i = 0; i < chain.length - 1; i++) if (!hop(chain[i]).includes(chain[i + 1])) ok = false;
  if (ok && hop('Owner Alert Email').includes('Respond OK'))
    good('chain: Create Appointment -> Body -> SMS -> Email -> Respond OK');
  else bad('owner-alert chain is not spliced between the appointment and the response');

  for (const n of ['Owner Alert SMS', 'Owner Alert Email']) {
    const node = w.nodes.find((x) => x.name === n);
    node?.onError === 'continueRegularOutput'
      ? good(`${n} cannot break the booking (onError=continueRegularOutput)`)
      : bad(`${n} onError=${node?.onError ?? '(default)'}`);
  }

  const sms = w.nodes.find((x) => x.name === 'Owner Alert SMS');
  const body = sms?.parameters?.jsonBody ?? '';
  body.includes('$vars.OWNER_ALERT_CONTACT_ID') ? good('SMS uses $vars.OWNER_ALERT_CONTACT_ID') : bad('SMS does not reference OWNER_ALERT_CONTACT_ID');
  body.includes('$vars.OWNER_SMS_FROM') ? good('SMS uses $vars.OWNER_SMS_FROM') : bad('SMS does not reference OWNER_SMS_FROM');
  const mail = w.nodes.find((x) => x.name === 'Owner Alert Email');
  (mail?.parameters?.sendTo ?? '').includes('$vars.OWNER_ALERT_EMAIL') ? good('email uses $vars.OWNER_ALERT_EMAIL') : bad('email does not reference OWNER_ALERT_EMAIL');

  /* audit the VALUE, not the reference — a $vars that resolves to nothing is dead */
  const vars = (await req('GET', `${N8N_API}/variables?limit=250`, nH())).body?.data ?? [];
  for (const k of ['OWNER_ALERT_CONTACT_ID', 'OWNER_SMS_FROM', 'OWNER_ALERT_EMAIL']) {
    const v = vars.find((x) => x.key === k);
    v && String(v.value).length ? good(`$vars.${k} RESOLVES (len ${String(v.value).length})`) : bad(`$vars.${k} is absent or empty — the reference is dead`);
  }

  const blob = JSON.stringify({ n: w.nodes, c: w.connections, d: w.description, t: w.name });
  !blob.includes('Strategy Call') ? good('"Strategy Call" appears nowhere in the workflow') : bad('"Strategy Call" still present');
  blob.includes('AVA Discovery Call - ') ? good('title = "AVA Discovery Call - {name}"') : bad('Discovery Call title missing');
  w.settings?.errorWorkflow === 'SlnAeMrVRORsF0w7' ? good('Error Sentry attached') : bad('Error Sentry detached');
}

/* ======================= POSTCALL-RAIL-8930 ============================= */
item('POSTCALL-RAIL-8930');
{
  const w = (await req('GET', `${N8N_API}/workflows/${WF_POST}`, nH())).body;
  if (w.name === 'WF-POSTCALL-AVA · 8930 Call Wrap v1.0') good(`workflow named "${w.name}"`);
  else bad(`workflow name = ${w.name}`);
  w.active ? good('workflow ACTIVE') : bad('workflow inactive');
  w.versionId === w.activeVersionId ? good('versionId === activeVersionId') : bad('DRIFT');
  w.settings?.errorWorkflow === 'SlnAeMrVRORsF0w7' ? good('Error Sentry attached') : bad('Error Sentry missing');

  /* the agent version that ACTUALLY answers the phone must carry the URL */
  const vers = (await req('GET', `${RETELL}/get-agent-versions/${AGENT_ID}`, rH())).body ?? [];
  const live = vers.filter((v) => v.is_published).sort((a, b) => b.version - a.version)[0];
  note(`latest_published = v${live.version}`);
  if (live.webhook_url === POSTCALL) good(`v${live.version} (what answers ${NUMBER}) posts to ${POSTCALL}`);
  else bad(`v${live.version} posts to ${live.webhook_url}`);

  const num = (await req('GET', `${RETELL}/get-phone-number/${encodeURIComponent(NUMBER)}`, rH())).body;
  const ia = num.inbound_agents?.[0];
  if (ia?.agent_id === AGENT_ID && ia?.agent_version === 'latest_published')
    good('number routes to this agent @ latest_published');
  else bad(`number routing = ${JSON.stringify(num.inbound_agents)}`);

  /* live end-to-end: does a call_analyzed actually produce an owner email? */
  const t0 = Date.now();
  const started = t0 - 200000;
  const r = await req('POST', POSTCALL, { accept: 'application/json' }, {
    event: 'call_analyzed',
    call: { call_id: `gate_${t0}`, agent_id: AGENT_ID, direction: 'inbound',
      from_number: '+15550007777', to_number: NUMBER, call_status: 'ended',
      start_timestamp: started, end_timestamp: started + 95000,
      disconnection_reason: 'user_hangup', recording_url: 'https://example.invalid/none.wav',
      transcript: 'Agent: Thanks for calling AI Voice Agency, this is AVA.\nUser: Checking the wrap rail.',
      call_analysis: { call_summary: 'Gate probe for the 8930 call wrap rail.', user_sentiment: 'Neutral', call_successful: true } },
  }, { timeoutMs: 45000 });
  r.status === 200 ? good(`call_analyzed -> HTTP 200 in ${r.ms}ms`) : bad(`HTTP ${r.status}`);

  await sleep(6000);
  const ex = (await req('GET', `${N8N_API}/executions?workflowId=${WF_POST}&limit=10&includeData=true`, nH())).body?.data ?? [];
  const mine = ex.find((e) => new Date(e.startedAt).getTime() >= t0 - 3000);
  const ran = Object.keys(mine?.data?.resultData?.runData ?? {});
  note(`execution ${mine?.id} status ${mine?.status} nodes: ${ran.join(', ')}`);
  mine?.status === 'success' ? good('execution succeeded') : bad(`execution status ${mine?.status}`);
  if (ran.includes('Owner Call Email')) {
    good('owner email leg RAN');
    const err = mine?.data?.resultData?.runData?.['Owner Call Email']?.[0]?.error;
    err ? bad(`email leg errored: ${trim(err.message ?? err, 160)}`) : good('owner email leg returned without error');
  } else bad('owner email leg did NOT run');
}

/* ---- verdict ------------------------------------------------------------ */
console.log(`\n${'='.repeat(72)}\nGATE VERDICT\n${'='.repeat(72)}`);
let anyFail = 0;
for (const [k, v] of Object.entries(RESULT)) {
  const ok = v.fail === 0;
  if (!ok) anyFail++;
  console.log(`  ${ok ? 'LIVE     ' : 'NOT LIVE '} ${k.padEnd(26)} ${v.pass} pass · ${v.fail} fail`);
  v.notes.forEach((n) => console.log(`             - ${n}`));
}
saveJSON('config-snapshots/2026-08-18-ava-seal/gate-result.json', { stamp: ISO(), result: RESULT });
if (anyFail) { console.error(`\nRUN INCOMPLETE — ${anyFail} board item(s) may not read LIVE.`); process.exit(2); }
console.log('\nALL FOUR BOARD ITEMS VERIFIED LIVE FROM THE LIVE APIs.');
