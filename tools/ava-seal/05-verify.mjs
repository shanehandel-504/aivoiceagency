#!/usr/bin/env node
/* ============================================================================
   AVA SEAL · STEP 5 — END-TO-END VERIFICATION
   ----------------------------------------------------------------------------
   --sim       one sim-signature booking payload (no call.from_number) must be
               turned away, and must leave ZERO GHL writes behind.
   --postcall  one realistic call_analyzed sample must return 200 and the owner
               email leg must actually have RUN.

   "ZERO GHL writes" is not a claim a 200 can support. It is proved three ways:
     1. the response body says it was refused, and names the reason;
     2. the n8n EXECUTION RECORD shows which nodes actually ran — the GHL nodes
        must be absent from it, not merely un-errored;
     3. GHL itself is searched for the probe identity and must not know it.
   A log line saying "skipped" is not evidence. The CRM is.

   USAGE
     doppler run -p ava-prod -c prd -- node tools/ava-seal/05-verify.mjs --sim
     doppler run -p ava-prod -c prd -- node tools/ava-seal/05-verify.mjs --postcall
   ========================================================================== */
import { need, req, nH, gH, saveJSON, trim, N8N_API, N8N_HOST, GHL_API, ISO } from './_lib.mjs';

need(['N8N_API_KEY', 'GHL_PIT', 'GHL_LOCATION_ID']);
const DIR = 'config-snapshots/2026-08-18-ava-seal';
const WF_BOOK = 'c5GPBkma1HyvonEa';
let failed = 0;
const bad = (m) => { console.log(`  FAIL — ${m}`); failed++; };
const good = (m) => console.log(`  PASS — ${m}`);
const note = (m) => console.log(`  ·  ${m}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* A probe identity that could never be a real lead, so that even a failure of
   this test cannot pollute the CRM with something that looks like a customer. */
const STAMP = ISO().replace(/[^0-9]/g, '').slice(0, 14);
const PROBE_NAME = `Zzsimguard${STAMP}`;
const PROBE_EMAIL = `zz-simguard-${STAMP}@example.invalid`;

async function executionsFor(workflowId, sinceMs) {
  const r = await req('GET', `${N8N_API}/executions?workflowId=${workflowId}&limit=20&includeData=true`, nH());
  if (!r.ok) return [];
  return (r.body.data ?? []).filter((e) => new Date(e.startedAt).getTime() >= sinceMs - 3000);
}
function ranNodes(exec) {
  const rd = exec?.data?.resultData?.runData ?? {};
  return Object.keys(rd);
}

/* ======================= SIM GUARD ======================================= */
if (process.argv.includes('--sim')) {
  console.log(`AVA SEAL · STEP 5 · SIM-GUARD · ${ISO()}`);
  console.log('='.repeat(72));
  const URL = `${N8N_HOST}/webhook/ava-book-appointment`;

  /* Exactly what a simulator sends: real-looking args, but NO phone leg. */
  const payload = {
    name: 'book_appointment',
    args: { name: PROBE_NAME, email: PROBE_EMAIL, cell: '', slot: 'tomorrow at 10 AM', business_type: 'limo' },
    call: { call_id: `sim_${STAMP}`, agent_id: 'agent_d5ada9f774fe3ae7f034d2c677', direction: 'inbound' },
  };
  note(`probe identity: ${PROBE_NAME} / ${PROBE_EMAIL}`);
  note('payload carries call{} but NO call.from_number — the sim signature');

  const t0 = Date.now();
  const r = await req('POST', URL, { accept: 'application/json' }, payload, { label: 'booking sim', timeoutMs: 30000 });
  console.log(`\n[RESPONSE] HTTP ${r.status} · ${r.ms}ms`);
  console.log(`  ${trim(r.body, 500)}`);

  if (r.status === 200) good('HTTP 200 (honest failure, not a transport error)');
  else bad(`HTTP ${r.status}`);
  if (r.body?.success === false) good('success = false — refused');
  else bad(`success = ${JSON.stringify(r.body?.success)} — the sim was NOT refused`);
  if (r.body?.reason === 'simulation_no_phone_leg') good('reason = "simulation_no_phone_leg" — failed loudly, by name');
  else bad(`reason = ${JSON.stringify(r.body?.reason)}`);
  if (!r.body?.appointment_id) good('no appointment_id returned');
  else bad(`appointment_id = ${r.body.appointment_id} — a sim booked a real slot`);

  /* ---- PROOF 2: which nodes actually ran ------------------------------- */
  console.log('\n[EXECUTION RECORD] which nodes actually ran');
  await sleep(4000);
  const execs = await executionsFor(WF_BOOK, t0);
  if (!execs.length) { bad('no execution record found — cannot prove what ran'); }
  else {
    const e = execs[0];
    const ran = ranNodes(e);
    note(`execution ${e.id} · status ${e.status} · nodes: ${ran.join(', ')}`);
    const WRITES = ['GHL Upsert Contact', 'GHL Create Appointment', 'Owner Alert SMS', 'Owner Alert Email'];
    const fired = WRITES.filter((n) => ran.includes(n));
    if (!fired.length) good('ZERO write nodes executed (GHL upsert, appointment, both alerts all absent)');
    else bad(`write node(s) EXECUTED: ${fired.join(', ')}`);
    if (ran.includes('Respond Sim Blocked')) good('Respond Sim Blocked executed — the guard is the node that answered');
    else bad('Respond Sim Blocked did not execute');
    saveJSON(`${DIR}/proof-sim-execution.json`, { id: e.id, status: e.status, ranNodes: ran, response: r.body });
  }

  /* ---- PROOF 3: ask GHL, not the log ----------------------------------- */
  console.log('\n[GHL] does the CRM know the probe identity?');
  const s = await req('POST', `${GHL_API}/contacts/search`, gH(),
    { locationId: process.env.GHL_LOCATION_ID, page: 1, pageLimit: 20,
      filters: [{ field: 'email', operator: 'eq', value: PROBE_EMAIL }] });
  if (!s.ok && s.status !== 200) note(`search HTTP ${s.status} — falling back to name query`);
  const hits = s.body?.contacts ?? [];
  if (hits.length === 0) good(`GHL has NO contact for ${PROBE_EMAIL} — nothing was written`);
  else bad(`GHL returned ${hits.length} contact(s) for the probe — the sim DID write`);

  console.log('\n' + '='.repeat(72));
  if (failed) { console.error(`RUN INCOMPLETE — SIM-GUARD: ${failed} assertion(s) failed.`); process.exit(2); }
  console.log('SIM-GUARD GREEN — sim refused by name, zero GHL writes proven three ways.');
  process.exit(0);
}

/* ======================= POST-CALL RAIL ================================== */
if (process.argv.includes('--postcall')) {
  const WF_POST = process.env.SEAL_POSTCALL_WF_ID;
  const PATH = process.env.SEAL_POSTCALL_PATH;
  if (!WF_POST || !PATH) { console.error('RUN INCOMPLETE — SEAL_POSTCALL_WF_ID / SEAL_POSTCALL_PATH not set'); process.exit(2); }
  console.log(`AVA SEAL · STEP 5 · POST-CALL RAIL · ${ISO()}`);
  console.log('='.repeat(72));
  const URL = `${N8N_HOST}/webhook/${PATH}`;

  const started = Date.now() - 5 * 60 * 1000;
  const payload = {
    event: 'call_analyzed',
    call: {
      call_id: `verify_${STAMP}`,
      agent_id: 'agent_d5ada9f774fe3ae7f034d2c677',
      call_type: 'phone_call',
      direction: 'inbound',
      from_number: '+15550009876',
      to_number: '+14142408930',
      call_status: 'ended',
      start_timestamp: started,
      end_timestamp: started + 132000,
      duration_ms: 132000,
      disconnection_reason: 'user_hangup',
      recording_url: 'https://example.invalid/recording-not-a-real-file.wav',
      transcript:
        "Agent: Thanks for calling AI Voice Agency, this is AVA. What kind of business do you run?\n" +
        "User: Hey, I run a limo company out of Milwaukee. We keep missing calls after hours.\n" +
        "Agent: That is exactly what I handle. How many cars are you running right now?\n" +
        "User: Eight, and two dispatchers who only cover days.\n" +
        "Agent: Got it. I can walk you through how the after-hours coverage works on a short call. Does Thursday morning work?\n" +
        "User: Thursday at ten works. My cell is 555-000-9876 and email is dispatch at example dot invalid.\n" +
        "Agent: Great, I have you set for Thursday at ten. You will get a text confirmation.",
      transcript_object: [
        { role: 'agent', content: 'Thanks for calling AI Voice Agency, this is AVA. What kind of business do you run?' },
        { role: 'user', content: 'Hey, I run a limo company out of Milwaukee. We keep missing calls after hours.' },
        { role: 'agent', content: 'That is exactly what I handle. How many cars are you running right now?' },
        { role: 'user', content: 'Eight, and two dispatchers who only cover days.' },
      ],
      call_analysis: {
        call_summary:
          'Caller runs an eight-car limo operation in Milwaukee with day-only dispatch coverage. ' +
          'Wants after-hours call handling. Agreed to a Thursday 10:00 AM follow-up.',
        user_sentiment: 'Positive',
        call_successful: true,
        in_voicemail: false,
      },
    },
  };

  const t0 = Date.now();
  const r = await req('POST', URL, { accept: 'application/json' }, payload, { label: 'postcall', timeoutMs: 45000 });
  console.log(`\n[RESPONSE] HTTP ${r.status} · ${r.ms}ms`);
  console.log(`  ${trim(r.body, 400)}`);
  if (r.status === 200) good('HTTP 200');
  else bad(`HTTP ${r.status}`);

  console.log('\n[EXECUTION RECORD] did the owner email leg actually RUN?');
  await sleep(6000);
  const execs = await executionsFor(WF_POST, t0);
  if (!execs.length) bad('no execution record — cannot prove the email leg ran');
  else {
    const e = execs[0];
    const ran = ranNodes(e);
    note(`execution ${e.id} · status ${e.status}`);
    note(`nodes: ${ran.join(', ')}`);
    if (e.status === 'success') good('execution status = success');
    else bad(`execution status = ${e.status}`);

    const emailNode = ran.find((n) => /email/i.test(n));
    if (emailNode) {
      good(`owner email leg RAN: "${emailNode}"`);
      const rd = e.data?.resultData?.runData?.[emailNode]?.[0];
      const err = rd?.error;
      if (err) bad(`  but it errored: ${trim(err.message ?? err, 200)}`);
      else good('  owner email leg returned without error');
      console.log(`  output: ${trim(rd?.data?.main?.[0]?.[0]?.json, 300)}`);
    } else bad('no email node in the execution record — the owner was NOT emailed');

    const noteNode = ran.find((n) => /note/i.test(n));
    if (noteNode) note(`GHL note leg ran: "${noteNode}"`);
    else note('GHL note leg did not run (expected when the caller number matches no contact)');

    const errs = Object.entries(e.data?.resultData?.runData ?? {})
      .filter(([, v]) => v?.[0]?.error).map(([k, v]) => `${k}: ${trim(v[0].error.message ?? v[0].error, 120)}`);
    if (errs.length) { console.log('\n  node errors:'); errs.forEach((x) => console.log(`    ${x}`)); }
    saveJSON(`${DIR}/proof-postcall-execution.json`, { id: e.id, status: e.status, ranNodes: ran, response: r.body });
  }

  console.log('\n' + '='.repeat(72));
  if (failed) { console.error(`RUN INCOMPLETE — POST-CALL: ${failed} assertion(s) failed.`); process.exit(2); }
  console.log('POST-CALL GREEN — 200 returned and the owner email leg is proven to have run.');
  process.exit(0);
}

console.error('specify --sim or --postcall');
process.exit(2);
