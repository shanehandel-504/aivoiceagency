#!/usr/bin/env node
/* ============================================================================
   tools/n8n-rail-repair.mjs  ·  RUN 6.6-C · n8n RAIL REPAIR
   ----------------------------------------------------------------------------
   Three repairs left open by RUN 6.5 (reports/2026-07-26-run65-owner-rail.md,
   "STILL OPEN"), plus one end-to-end proof.

     FIX 1  LIVE INTAKE v1 / Grok Extract — "invalid syntax".
            ROOT CAUSE: the jsonBody expression inlined an HTML-stripping regex
            chain. Written inline, `[\s\S]` and `<\/script>` survive the API
            round-trip DOUBLE-escaped and the expression no longer parses.
            Already repaired 2026-07-23 by moving the regexes into the
            `Strip HTML` Code node; this tool ASSERTS the repaired shape so a
            redeploy can never silently reintroduce it.

     FIX 2  WEBHOOK CONSOLIDATION. The account-level Retell webhook
            (-> /webhook/ava-postcall) is the only post-call rail. Duplicate
            agent-level hooks and duplicate/litter n8n workflows are removed.
            The frozen v37 sales agent is NOT touched — see THE V37 CARVE-OUT.

     FIX 3  "Booked: unknown". ROOT CAUSE: `custom_analysis_data` carries
            caller_* fields only and has never contained a booked flag, so
            `cad.booked === true` could only ever be false -> 'unknown'. Rewired
            to the real appointment result: the book_appointment tool call
            paired to its result by tool_call_id.

   THE V37 CARVE-OUT. Retell versions `webhook_url`, and on this account 36 of
   38 versions are auto-published. Stripping the legacy chat-dash hook off
   agent_d5ada9f774fe3ae7f034d2c677 would mint a v38 that becomes
   latest_published — which the live 414-240-8930 line resolves to — breaking
   the RUN 5 / 6.5 voice freeze. Shane's call, 2026-07-28: leave v37 frozen.
   The URL is recorded verbatim in the run report and stays open.

   NOTHING SENSITIVE LIVES IN THIS FILE. Contact ids and phone numbers are read
   at runtime from n8n Variables; this file only ever names the KEYS.

   USAGE (always through Doppler):
     doppler run --project ava-prod --config prd -- node tools/n8n-rail-repair.mjs --audit
     doppler run --project ava-prod --config prd -- node tools/n8n-rail-repair.mjs --apply

   IDEMPOTENT: re-running after an apply is a no-op.
   Build-time only. tools/ is never deployed (see .vercelignore).
   ========================================================================== */

import { mkdirSync, writeFileSync } from 'node:fs';

const N8N = 'https://circulant.app.n8n.cloud';
const RETELL = 'https://api.retellai.com';
const N8N_KEY = process.env.N8N_API_KEY;
const RETELL_KEY = process.env.RETELL_API_KEY;
if (!N8N_KEY) { console.error('RUN INCOMPLETE — N8N KEY MISSING'); process.exit(2); }

const MODE = process.argv.includes('--apply') ? 'apply' : 'audit';
const BACKUP_DIR = 'C:\\Users\\offic\\Desktop\\ava-backups';

const WF_POSTCALL = '6r8YHuMEJbxeDyT5';   // AVA Post-Call to GHL (Demo Send)
const WF_INTAKE = 'V6wAFgJ803xmLM0K';     // LIVE INTAKE v1

/* The account-level rail. Confirmed empirically, not from a settings endpoint:
   every call_analyzed for agent_d5ada…677 lands on this path even though that
   agent's own webhook_url points at chat-dash. Only an account-level hook can
   deliver that. */
const ACCOUNT_RAIL = `${N8N}/webhook/ava-postcall`;

/* Agent-level Retell hooks that duplicate or bypass the account rail. */
const CHAUFFEUR = 'agent_8e9e7d477949c6babcbdcc756d';   // -> ava-postcall (exact duplicate)
const FROZEN_V37 = 'agent_d5ada9f774fe3ae7f034d2c677';  // -> chat-dash (carve-out, untouched)

/* Inactive n8n workflows that hold a DUPLICATE webhook path of an active
   workflow, plus the ZZZ credential-probe litter. All verified inactive with
   zero executions ever (reports/2026-07-26-ops-map.md). */
const DUPLICATE_WORKFLOWS = [
  ['7QsfWg9wGFsGcItC', 'AVA · book_appointment · realtime', 'ava-book-appointment'],
  ['wuukPhgeAcGCQN7M', 'AVA · book_appointment · realtime', 'ava-book-appointment'],
  ['3D1g6QUNh1lRCkiX', 'AVA · send_link · realtime', 'ava-send-link'],
  ['ByJ5fbNTzuHTawTq', 'AVA · send_link · realtime', 'ava-send-link'],
  ['96FJXOWNynHYID7h', 'AVA · social_intake · realtime', 'social-intake'],
  ['Dkya7cBCx7QvNTUv', 'AVA · update_pipeline_stage · realtime', 'ava-update-pipeline-stage'],
  ['y5Ra35JfeOfhiIwk', 'AVA · update_pipeline_stage · realtime', 'ava-update-pipeline-stage'],
  ['jGXrnNH3XwtgPtDm', 'AVA · write_to_crm · realtime', 'ava-write-to-crm'],
  ['oEQv5YQ8KcqQ3Afm', 'AVA · write_to_crm · realtime', 'ava-write-to-crm'],
  ['IwG6SeFMB8D5c9RQ', 'ZZZ cred probe 2 (delete me)', 'zz-cred-probe2'],
  ['z3PQmGqUuRyMxTRr', 'ZZZ cred probe 3 (delete me)', 'zz-cred-probe3'],
  ['WKWD2ntPGo4vD3xN', 'ZZZ SAFE TO DELETE - cred probe + dial payload render', 'zzz-cred-probe-safe-to-delete'],
];

/* ---------------------------------------------------------------- transport */
async function n8n(path, opts = {}) {
  const r = await fetch(N8N + '/api/v1' + path, {
    ...opts,
    headers: { 'X-N8N-API-KEY': N8N_KEY, 'content-type': 'application/json', ...(opts.headers || {}) },
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`n8n ${r.status} ${path} :: ${t.slice(0, 400)}`);
  return t ? JSON.parse(t) : null;
}
async function retell(path, opts = {}) {
  const r = await fetch(RETELL + path, {
    ...opts,
    headers: { Authorization: 'Bearer ' + RETELL_KEY, 'content-type': 'application/json', ...(opts.headers || {}) },
  });
  const t = await r.text();
  return { status: r.status, ok: r.ok, body: t ? JSON.parse(t) : null };
}

/* n8n PUT /workflows/{id} rejects unknown keys — send only the writable set.
   (RUN 6.5: settings must be whitelisted, never echoed back verbatim.)

   errorWorkflow is carried forward EXPLICITLY. § 9 OWNER RAIL LAW requires every
   active workflow to keep its sentry, and a whitelist that silently drops the
   key would detach it — the exact silent-nothing failure the sentry exists to
   catch. Whitelist, but never by forgetting. */
function writable(wf) {
  const settings = { executionOrder: wf.settings?.executionOrder || 'v1' };
  if (wf.settings?.errorWorkflow) settings.errorWorkflow = wf.settings.errorWorkflow;
  return { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings };
}

const log = [];
const say = (s) => { console.log(s); log.push(s); };

/* ============================================================ FIX 3 payload */
/* Rewire "Booked" to the real appointment result. Reads the book_appointment
   tool call and pairs it to its result by tool_call_id. Reports yes / no /
   unknown honestly — 'unknown' ONLY when a booking was attempted and no result
   was recorded, which is the one case where we genuinely do not know. */
const FORMAT_CALL_LOG = `const c = $('Retell Webhook').item.json.body.call || {};
const s = $('Normalize').item.json;
const an = c.call_analysis || {};
const cad = an.custom_analysis_data || {};
const secs = (c.end_timestamp && c.start_timestamp) ? Math.round((c.end_timestamp - c.start_timestamp) / 1000) : null;
const duration = secs !== null ? Math.floor(secs / 60) + 'm ' + (secs % 60) + 's' : 'n/a';
const number = c.from_number || 'web-call';
const outcome = [an.user_sentiment || 'n/a', (an.call_successful === true ? 'successful' : an.call_successful === false ? 'unsuccessful' : ''), (c.disconnection_reason || '')].filter(Boolean).join(' \\u00b7 ');

/* --- BOOKED (RUN 6.6-C) ----------------------------------------------------
   custom_analysis_data carries caller_* fields only and has never held a booked
   flag, so the old \`cad.booked === true\` test could only ever yield 'unknown'.
   The authoritative record of whether THIS call booked is the book_appointment
   tool call paired to its result by tool_call_id. */
const tw = Array.isArray(c.transcript_with_tool_calls) ? c.transcript_with_tool_calls : [];
const results = new Map();
for (const e of tw) { if (e && e.role === 'tool_call_result') results.set(e.tool_call_id, e); }
const attempts = tw.filter(e => e && e.role === 'tool_call_invocation' && e.name === 'book_appointment');

let booked = 'no';
let apptId = null;
let apptWhen = null;
let note = 'no booking attempted';

if (attempts.length) {
  let sawResult = false;
  note = null;
  for (const a of attempts) {
    const r = results.get(a.tool_call_id);
    if (!r) continue;
    sawResult = true;
    let p = null;
    try { p = JSON.parse(r.content || ''); } catch (err) { p = null; }
    if (p && p.success === true) {
      booked = 'yes';
      apptId = p.appointment_id || null;
      apptWhen = p.start_time_human || p.start_time || null;
      note = null;
      break;
    }
    if (p && p.success === false) { booked = 'no'; note = p.reason || p.error || 'booking declined'; }
    else { booked = 'unknown'; note = 'unreadable booking result'; }
  }
  if (!sawResult) { booked = 'unknown'; note = 'booking attempted, no tool result recorded'; }
}

/* No transcript array at all: fall back to the flat tool_calls list, but only
   to detect an ATTEMPT. That list's \`success\` flag is transport-level, so it
   can never be used to claim a booking happened. */
if (!tw.length && Array.isArray(c.tool_calls)) {
  const tried = c.tool_calls.some(t => t && t.name === 'book_appointment');
  booked = tried ? 'unknown' : 'no';
  note = tried ? 'booking attempted, transcript unavailable' : 'no booking attempted';
}

/* Forward-compatible: honour an explicit analysis flag if the schema ever
   gains one. */
if (cad.booked === true || cad.booked_appointment === true) { booked = 'yes'; note = null; }

const bookedLine = booked
  + (apptId ? ' \\u00b7 appt ' + apptId + (apptWhen ? ' \\u00b7 ' + apptWhen : '') : (note ? ' \\u00b7 ' + note : ''));

let line = (an.call_summary || 'n/a').replace(/\\s+/g, ' ').trim();
if (line.length > 220) line = line.slice(0, 217) + '\\u2026';
const when = DateTime.now().setZone('America/Chicago').toFormat("LLL d, h:mm a") + ' CT';
const title = when + ' \\u00b7 ' + number + ' \\u00b7 ' + duration + ' \\u00b7 ' + (booked === 'yes' ? 'BOOKED' : '\\u2014');
const bodyText = 'Outcome: ' + outcome + '\\nBooked: ' + bookedLine + '\\nSummary: ' + line + '\\nRecording: ' + (c.recording_url || 'n/a') + '\\nCall ID: ' + (s.call_id || c.call_id || 'n/a');
return [{ json: { log_title: title, log_body: bodyText, booked: booked, appointment_id: apptId, appointment_when: apptWhen } }];`;

/* Owner SMS gains the same truth, compactly. */
const OWNER_SMS_BODY = "={{ (() => { const c = $('Retell Webhook').item.json.body.call || {}; const s = $('Normalize').item.json; const f = $('Format Call Log').item.json; const secs = (c.end_timestamp && c.start_timestamp) ? Math.round((c.end_timestamp - c.start_timestamp) / 1000) : null; const dur = secs !== null ? (Math.floor(secs / 60) + 'm ' + (secs % 60) + 's') : 'n/a'; const caller = c.from_number || 'web-call'; const bk = f.booked === 'yes' ? 'BOOKED \\u00b7 ' : (f.booked === 'unknown' ? 'BOOKING UNCONFIRMED \\u00b7 ' : ''); let sum = ((s.summary == null ? '' : s.summary) + '').replace(/\\s+/g, ' ').trim() || 'no summary'; if (sum.length > 100) sum = sum.slice(0, 97) + '...'; return { type: 'SMS', contactId: $vars.OWNER_ALERT_CONTACT_ID, fromNumber: $vars.OWNER_SMS_FROM, message: 'AVA call: ' + caller + ' \\u00b7 ' + dur + ' \\u00b7 ' + bk + sum }; })() }}";

/* ================================================================= FIX 1 */
async function fix1() {
  say('\n=== FIX 1 · LIVE INTAKE v1 / Grok Extract ===');
  const wf = await n8n('/workflows/' + WF_INTAKE);
  const grok = wf.nodes.find(n => n.name === 'Grok Extract');
  const strip = wf.nodes.find(n => n.name === 'Strip HTML');
  const body = grok?.parameters?.jsonBody || '';

  const hasBackslash = body.includes('\\');
  const readsPageText = body.includes('$json.page_text');
  const stripIsCode = strip?.type === 'n8n-nodes-base.code';

  say(`  Grok Extract reads $json.page_text : ${readsPageText ? 'YES' : 'NO'}`);
  say(`  Grok Extract contains a backslash  : ${hasBackslash ? 'YES  <-- regex leaked back inline' : 'NO'}`);
  say(`  Strip HTML is a Code node          : ${stripIsCode ? 'YES' : 'NO'}`);

  const clean = readsPageText && !hasBackslash && stripIsCode;
  say(clean
    ? '  RESULT: repaired shape confirmed. No inline regex, no double-escape. PASS'
    : '  RESULT: BROKEN — the inline-regex form is back. FAIL');
  return clean;
}

/* Publish the chauffeur draft only if the newest PUBLISHED version still
   carries the duplicate rail. Idempotent: a clean latest_published is a no-op. */
async function publishChauffeurIfStale() {
  const vs = await retell(`/get-agent-versions/${CHAUFFEUR}`);
  if (vs.status !== 200) { say(`    version list unavailable (${vs.status}) — cannot confirm published state`); return; }
  const published = vs.body.filter(v => v.is_published).sort((a, b) => a.version - b.version);
  const newest = published[published.length - 1];
  say(`    latest_published = v${newest?.version} webhook=${JSON.stringify(newest?.webhook_url ?? null)}`);
  if (!newest?.webhook_url) { say('    latest_published is already clean — no publish needed'); return; }

  const draft = vs.body.filter(v => !v.is_published).sort((a, b) => a.version - b.version).pop();
  if (!draft || draft.webhook_url) { say('    no clean draft to publish — LEFT ARMED, see report'); return; }

  const pub = await retell(`/publish-agent/${CHAUFFEUR}`, { method: 'POST', body: JSON.stringify({ version: draft.version }) });
  say(`    publish v${draft.version}: ${pub.status}`);
  const recheck = await retell(`/get-agent-versions/${CHAUFFEUR}`);
  const now = recheck.body.filter(v => v.is_published).sort((a, b) => a.version - b.version).pop();
  say(`    verify latest_published = v${now?.version} webhook=${JSON.stringify(now?.webhook_url ?? null)}`);
}

/* ================================================================= FIX 2 */
async function fix2() {
  say('\n=== FIX 2 · WEBHOOK CONSOLIDATION ===');
  say(`  Account-level rail (the only post-call rail): ${ACCOUNT_RAIL}`);

  /* -- Retell agent-level hooks -- */
  say('\n  -- Retell agent-level webhook_url --');
  const agents = await retell('/list-agents');
  const latest = {};
  for (const a of (agents.body || [])) {
    if (!latest[a.agent_id] || (a.version ?? 0) > (latest[a.agent_id].version ?? 0)) latest[a.agent_id] = a;
  }
  for (const a of Object.values(latest)) {
    if (!a.webhook_url) continue;
    const verdict = a.agent_id === FROZEN_V37 ? 'LEGACY — carve-out, left live (frozen v37)'
      : a.agent_id === CHAUFFEUR ? 'DUPLICATE of the account rail — remove'
        : a.webhook_url.endsWith('/live-postcall') ? 'KEEP — distinct /live demo rail (LIVE INTAKE v1 leg C)'
          : 'review';
    say(`    ${a.agent_id} v${a.version} ${JSON.stringify(a.agent_name)}`);
    say(`      ${a.webhook_url}`);
    say(`      -> ${verdict}`);
  }

  if (MODE === 'apply') {
    const cur = latest[CHAUFFEUR];
    if (cur && cur.webhook_url) {
      mkdirSync(BACKUP_DIR, { recursive: true });
      writeFileSync(`${BACKUP_DIR}\\run66c-chauffeur-agent-pre.json`, JSON.stringify(cur, null, 2));
      const res = await retell(`/update-agent/${CHAUFFEUR}`, { method: 'PATCH', body: JSON.stringify({ webhook_url: null }) });
      say(`\n    APPLY chauffeur webhook_url -> null : ${res.status} (version ${res.body?.version}, published=${res.body?.is_published})`);
      const after = await retell(`/get-agent/${CHAUFFEUR}`);
      say(`    verify: webhook_url is now ${JSON.stringify(after.body?.webhook_url ?? null)}`);
    } else {
      say('\n    chauffeur webhook_url already null — no-op');
    }

    /* The chauffeur number binds with NO agent_version, so the version that
       actually serves a call is the published one. Clearing the draft is not
       enough — latest_published must also be clean, or the duplicate stays
       armed. Verified before publishing: agent v10 vs v11 differ ONLY in
       webhook_url + the LLM version pointer, and LLM v10 vs v11 differ ONLY in
       is_published. Publishing therefore changes the webhook and nothing else. */
    await publishChauffeurIfStale();
  }

  /* -- n8n duplicate + litter workflows -- */
  say('\n  -- n8n duplicate / litter workflows holding a webhook path --');
  mkdirSync(BACKUP_DIR, { recursive: true });
  let removed = 0, missing = 0;
  for (const [id, name, path] of DUPLICATE_WORKFLOWS) {
    let wf;
    try { wf = await n8n('/workflows/' + id); }
    catch (e) { say(`    ${id} ${name} — already gone`); missing++; continue; }
    if (wf.active) { say(`    ${id} ${name} — ACTIVE, refusing to remove`); continue; }
    say(`    ${id} ${JSON.stringify(name)} path=/webhook/${path} active=false`);
    if (MODE === 'apply') {
      writeFileSync(`${BACKUP_DIR}\\run66c-wf-${id}.json`, JSON.stringify(wf, null, 2));
      await n8n('/workflows/' + id, { method: 'DELETE' });
      say('      -> backed up + DELETED');
      removed++;
    }
  }
  say(`  ${MODE === 'apply' ? `removed ${removed}, already gone ${missing}` : `${DUPLICATE_WORKFLOWS.length - missing} candidates (audit only)`}`);
  return true;
}

/* ================================================================= FIX 3 */
async function fix3() {
  say('\n=== FIX 3 · BOOKED FIELD ===');
  const wf = await n8n('/workflows/' + WF_POSTCALL);
  const fcl = wf.nodes.find(n => n.name === 'Format Call Log');
  const sms = wf.nodes.find(n => n.name === 'Owner Alert SMS');
  if (!fcl || !sms) throw new Error('Format Call Log / Owner Alert SMS not found');

  const already = fcl.parameters.jsCode.includes('transcript_with_tool_calls')
    && fcl.parameters.jsCode.includes('tool_call_id');
  say(`  Format Call Log already wired to the tool-call result: ${already ? 'YES (no-op)' : 'NO'}`);
  if (!already) {
    say("  current : const booked = (cad.booked === true || cad.booked_appointment === true) ? 'yes' : 'unknown';");
    say('  becomes : book_appointment tool call paired to its result by tool_call_id -> yes / no / unknown');
  }

  if (MODE === 'apply' && !already) {
    fcl.parameters.jsCode = FORMAT_CALL_LOG;
    sms.parameters.jsonBody = OWNER_SMS_BODY;
    await n8n('/workflows/' + WF_POSTCALL, { method: 'PUT', body: JSON.stringify(writable(wf)) });
    say('  APPLIED — Format Call Log + Owner Alert SMS rewritten');
    const back = await n8n('/workflows/' + WF_POSTCALL);
    const ok = back.nodes.find(n => n.name === 'Format Call Log').parameters.jsCode.includes('tool_call_id');
    say(`  verify round-trip: ${ok ? 'PASS' : 'FAIL'}`);
    say(`  workflow still active: ${back.active}`);
  }
  return true;
}

/* =================================================================== main */
say(`RUN 6.6-C · n8n RAIL REPAIR · mode=${MODE}`);
const r1 = await fix1();
await fix2();
await fix3();
say(`\nFIX 1 ${r1 ? 'PASS' : 'FAIL'} · FIX 2 done · FIX 3 done · mode=${MODE}`);
