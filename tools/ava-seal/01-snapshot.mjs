#!/usr/bin/env node
/* AVA SEAL · STEP 1 — SNAPSHOT FIRST.
   Reads the live Retell number, the live Retell agent (draft + published), and
   the booking workflow, and writes them to config-snapshots/ stamped with the
   run's ISO date. Nothing is mutated here. This is the rollback floor. */
import { need, req, rH, nH, saveJSON, trim, RETELL, N8N_API, NUMBER, AGENT_ID, WF_BOOK, ISO } from './_lib.mjs';

/* REDACTION LAW. This snapshot is committed, so it may not carry a credential.
   Retell returns sip_outbound_trunk_config on the number — auth_username /
   auth_password are live Twilio SIP trunk credentials. They are NOT part of what
   this run mutates and are NOT needed to roll back inbound_webhook_url, so they
   are stripped before the file is written. The key is kept with a marker so the
   snapshot never reads as "the API did not return this". */
function redact(o) {
  const c = JSON.parse(JSON.stringify(o));
  if (c.sip_outbound_trunk_config) {
    c.sip_outbound_trunk_config = '[REDACTED — live SIP trunk credential, never committed]';
  }
  return c;
}

need(['RETELL_API_KEY', 'N8N_API_KEY']);
const stamp = ISO();
const day = stamp.slice(0, 10);
const DIR = `config-snapshots/${day}-ava-seal`;
const out = [];
const say = (s) => { console.log(s); out.push(s); };

say(`AVA SEAL · SNAPSHOT · ${stamp}`);
say('='.repeat(72));

/* ---- Retell phone number ------------------------------------------------ */
const num = await req('GET', `${RETELL}/get-phone-number/${encodeURIComponent(NUMBER)}`, rH(), undefined,
  { label: 'get-phone-number' });
if (!num.ok) { console.error(`RUN INCOMPLETE — get-phone-number failed HTTP ${num.status}\n${trim(num.body)}`); process.exit(2); }
saveJSON(`${DIR}/retell-number-${NUMBER.replace('+', '')}.json`, redact(num.body));
say(`\n[NUMBER] ${NUMBER}`);
/* The routing lives in the inbound_agents ARRAY, not a flat inbound_agent_id.
   Reading the flat key prints "(none)" on a correctly-bound number — the exact
   shape trap that makes a live rail look empty. */
for (const a of num.body.inbound_agents ?? []) {
  say(`  inbound_agent         ${a.agent_id}  version=${a.agent_version}  weight=${a.weight}`);
}
for (const a of num.body.outbound_agents ?? []) {
  say(`  outbound_agent        ${a.agent_id}  version=${a.agent_version}`);
}
say(`  inbound_webhook_url   ${num.body.inbound_webhook_url ?? '(NONE — no warm recognition)'}`);
say(`  nickname              ${num.body.nickname ?? '(none)'}`);

/* ---- Retell agent · DRAFT ----------------------------------------------- */
/* TRAP (memory: retell-api-traps-8930-tune): get-agent returns the DRAFT, not
   what answers the phone. A number serves latest_published. Snapshot both. */
const agD = await req('GET', `${RETELL}/get-agent/${AGENT_ID}`, rH(), undefined, { label: 'get-agent draft' });
if (!agD.ok) { console.error(`RUN INCOMPLETE — get-agent failed HTTP ${agD.status}\n${trim(agD.body)}`); process.exit(2); }
saveJSON(`${DIR}/retell-agent-draft.json`, agD.body);
say(`\n[AGENT · DRAFT] ${AGENT_ID}`);
say(`  agent_name        ${agD.body.agent_name ?? '(none)'}`);
say(`  version           ${agD.body.version}`);
say(`  is_published      ${agD.body.is_published}`);
say(`  webhook_url       ${agD.body.webhook_url ?? '(NONE)'}`);
say(`  response_engine   ${agD.body.response_engine?.type} ${agD.body.response_engine?.llm_id ?? ''} v${agD.body.response_engine?.version ?? '?'}`);

/* ---- Retell agent · ALL VERSIONS (which one answers the phone) ---------- */
const vers = await req('GET', `${RETELL}/get-agent-versions/${AGENT_ID}`, rH(), undefined, { label: 'get-agent-versions' });
if (vers.ok && Array.isArray(vers.body)) {
  saveJSON(`${DIR}/retell-agent-versions.json`, vers.body);
  const pub = vers.body.filter(v => v.is_published).sort((a, b) => b.version - a.version);
  const live = pub[0];
  say(`\n[AGENT · VERSIONS] ${vers.body.length} total · ${pub.length} published`);
  say(`  latest_published  v${live?.version ?? '?'}   <- THIS is what answers ${NUMBER}`);
  say(`  its webhook_url   ${live?.webhook_url ?? '(NONE)'}`);
  saveJSON(`${DIR}/retell-agent-latest-published.json`, live ?? {});
} else {
  say(`\n[AGENT · VERSIONS] unavailable (HTTP ${vers.status}) — not fatal, draft captured`);
}

/* ---- n8n booking workflow ------------------------------------------------ */
const wf = await req('GET', `${N8N_API}/workflows/${WF_BOOK}`, nH(), undefined, { label: 'get workflow' });
if (!wf.ok) { console.error(`RUN INCOMPLETE — get workflow failed HTTP ${wf.status}\n${trim(wf.body)}`); process.exit(2); }
saveJSON(`${DIR}/n8n-${WF_BOOK}-PRE-EDIT.json`, wf.body);
say(`\n[N8N] ${wf.body.name}  (${WF_BOOK})`);
say(`  active           ${wf.body.active}`);
say(`  versionId        ${wf.body.versionId ?? '?'}   <- DRAFT`);
say(`  activeVersionId  ${wf.body.activeVersionId ?? '(none)'}   <- what production RUNS`);
if (wf.body.active && wf.body.activeVersionId && wf.body.versionId !== wf.body.activeVersionId) {
  say('  ** DRIFT — draft is ahead of published. This GET does NOT describe production. **');
}
say(`  errorWorkflow    ${wf.body.settings?.errorWorkflow ?? '(NONE — failures are silent)'}`);
say(`  nodes            ${wf.body.nodes.length}`);
for (const n of wf.body.nodes) say(`    · ${n.name}  [${n.type.replace('n8n-nodes-base.', '')}]`);

saveJSON(`${DIR}/_snapshot-manifest.json`, {
  stamp, number: NUMBER, agent_id: AGENT_ID, workflow_id: WF_BOOK,
  files: ['retell-number', 'retell-agent-draft', 'retell-agent-versions',
          'retell-agent-latest-published', `n8n-${WF_BOOK}-PRE-EDIT`],
});
say(`\nSNAPSHOT WRITTEN → ${DIR}/`);
