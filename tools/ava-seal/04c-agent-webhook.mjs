#!/usr/bin/env node
/* ============================================================================
   AVA SEAL · STEP 4c — POINT THE AGENT AT THE POST-CALL RAIL
   ----------------------------------------------------------------------------
   PATCHes the 8930 agent's webhook_url and verifies by GET, exactly as briefed.

   AND THEN SAYS THE PART A GREEN GET WOULD HIDE. `webhook_url` is VERSIONED on
   this agent — measured in 04a: v0–v5 carry none, v6 carried an n8n URL, v7–v43
   carry chat-dash. `get-agent` returns the unpublished DRAFT (v43). The number
   routes with `agent_version: "latest_published"`, which resolves to v42. So the
   PATCH lands on v43, the GET reads back the new URL, everything looks green —
   and every real call keeps firing the old URL until v43 is PUBLISHED.

   Publishing is a separate, outward-facing, hard-to-reverse act on a live
   customer phone line, and this repo carries a standing decision that minting a
   published version on THIS agent is Shane's call (the V37 CARVE-OUT in
   tools/n8n-rail-repair.mjs). It is therefore gated behind --publish and never
   happens as a side effect of the PATCH.

   The carve-out's stated reason was the voice freeze. 04b measured that reason
   and found it absent here: LLM v42 and v43 are byte-identical, so publishing
   would ship no change to anything AVA says. That is a finding for Shane to act
   on, not a licence for this tool to act on it.

   USAGE
     doppler run -p ava-prod -c prd -- node tools/ava-seal/04c-agent-webhook.mjs --apply
     doppler run -p ava-prod -c prd -- node tools/ava-seal/04c-agent-webhook.mjs --publish
   ========================================================================== */
import { need, req, rH, saveJSON, trim, RETELL, N8N_HOST, NUMBER, AGENT_ID, ISO } from './_lib.mjs';

need(['RETELL_API_KEY']);
const APPLY = process.argv.includes('--apply');
const PUBLISH = process.argv.includes('--publish');
const HOOK = process.env.SEAL_POSTCALL_URL || `${N8N_HOST}/webhook/ava-postcall-wrap`;
const DIR = 'config-snapshots/2026-08-18-ava-seal';
let failed = 0;
const bad = (m) => { console.log(`  FAIL — ${m}`); failed++; };
const good = (m) => console.log(`  PASS — ${m}`);
const note = (m) => console.log(`  ·  ${m}`);

console.log(`AVA SEAL · STEP 4c · AGENT WEBHOOK · ${ISO()}`);
console.log('='.repeat(72));
note(`target webhook_url: ${HOOK}`);

const getAgent = async (v) => (await req('GET', `${RETELL}/get-agent/${AGENT_ID}${v ? `?version=${v}` : ''}`, rH())).body;
const livePublished = async () => {
  const r = await req('GET', `${RETELL}/get-agent-versions/${AGENT_ID}`, rH());
  const pub = (r.body ?? []).filter((v) => v.is_published).sort((a, b) => b.version - a.version);
  return pub[0];
};

if (APPLY) {
  console.log('\n[PATCH] update-agent · webhook_url');
  const p = await req('PATCH', `${RETELL}/update-agent/${AGENT_ID}`, rH(), { webhook_url: HOOK });
  if (!p.ok) { console.error(`RUN INCOMPLETE — PATCH failed HTTP ${p.status}\n${trim(p.body)}`); process.exit(2); }
  good(`HTTP ${p.status}`);
}

/* ---- verify by GET (this is the DRAFT) ---------------------------------- */
console.log('\n[VERIFY BY GET]');
const draft = await getAgent();
saveJSON(`${DIR}/retell-agent-draft-POST-PATCH.json`, draft);
console.log(`  draft version     v${draft.version}  published=${draft.is_published}`);
console.log(`  draft webhook_url ${draft.webhook_url}`);
if (draft.webhook_url === HOOK) good('GET confirms the draft carries the new webhook_url');
else bad(`GET returned ${draft.webhook_url}`);

/* ---- and now the part the GET does not tell you -------------------------- */
console.log('\n[WHAT ANSWERS THE PHONE]');
let live = await livePublished();
const num = await req('GET', `${RETELL}/get-phone-number/${encodeURIComponent(NUMBER)}`, rH());
const routing = num.body?.inbound_agents?.[0];
console.log(`  ${NUMBER} routes to  agent_version="${routing?.agent_version}"`);
console.log(`  latest_published        v${live.version}`);
console.log(`  its webhook_url         ${live.webhook_url}`);

if (PUBLISH) {
  console.log('\n[PUBLISH] minting a published version so the phone serves the new URL');
  const routes = [
    ['POST', `${RETELL}/publish-agent-version/${AGENT_ID}`, { version: draft.version }],
    ['POST', `${RETELL}/publish-agent/${AGENT_ID}`, { version: draft.version }],
  ];
  let done = false;
  for (const [m, u, b] of routes) {
    const r = await req(m, u, rH(), b);
    note(`${m} ${u.replace(RETELL, '')} -> HTTP ${r.status}`);
    if (r.ok) { done = true; break; }
    console.log(`      ${trim(r.body, 240)}`);
  }
  if (!done) bad('no publish route succeeded — the phone still serves the old version');
  live = await livePublished();
  console.log(`\n  latest_published now  v${live.version}`);
  console.log(`  its webhook_url       ${live.webhook_url}`);
}

console.log('\n' + '='.repeat(72));
if (live.webhook_url === HOOK) {
  good(`LIVE — ${NUMBER} serves v${live.version}, which posts call events to the new rail.`);
  console.log(`\nROLLBACK: pin the number back to the previous version —`);
  console.log(`  PATCH ${RETELL}/update-phone-number/${NUMBER}`);
  console.log(`  { "inbound_agents": [{ "agent_id": "${AGENT_ID}", "agent_version": <older>, "weight": 1 }] }`);
} else {
  console.log('RUN INCOMPLETE — POST-CALL RAIL IS NOT ON THE PHONE.');
  console.log(`  what   the draft (v${draft.version}) points at the new rail; the number serves v${live.version}, which still posts to:`);
  console.log(`         ${live.webhook_url}`);
  console.log(`  why    webhook_url is versioned on this agent and a PATCH only edits the unpublished draft.`);
  console.log(`         Publishing is outward-facing and hard to reverse on a live line, and this repo`);
  console.log(`         records it as Shane's call (V37 CARVE-OUT). It was not taken unasked.`);
  console.log(`  risk   measured, not guessed: LLM v42 vs v43 are byte-identical, so publishing would`);
  console.log(`         ship NO change to anything AVA says. Agent diff is version metadata only.`);
  console.log(`  next   one command, when you want it:`);
  console.log(`         doppler run -p ava-prod -c prd -- node tools/ava-seal/04c-agent-webhook.mjs --publish`);
}
process.exit(failed ? 2 : 0);
