/* tools/callback-gate/02-agent-draft-caps.mjs
 *
 *   doppler run -- node tools/callback-gate/02-agent-draft-caps.mjs         (dry run)
 *   doppler run -- node tools/callback-gate/02-agent-draft-caps.mjs --write
 *
 * Caps runaway-call exposure on the two agents that can be dialled outbound:
 *
 *   max_call_duration_ms       -> 720000  (12 min)
 *   end_call_after_silence_ms  ->  60000  (1 min)
 *
 * DRAFT ONLY. This script has no publish path and cannot acquire one: the
 * transport below refuses any URL that is not /update-agent/. Numbers serve
 * `latest_published`, so nothing here changes what answers the phone until
 * Shane publishes. That is the point.
 *
 * THE TRAP THIS SCRIPT EXISTS TO DEFEAT (RUN "8930 TUNE"): Retell SILENTLY
 * ACCEPTS unknown agent fields. A PATCH with a misspelled key returns HTTP 200
 * and changes nothing. `end_call_after_silence_ms` is currently ABSENT on both
 * agents, so there is no before-value to diff against and a typo would be
 * invisible. Every write here is therefore read back and asserted on the VALUE.
 */

const KEY = process.env.RETELL_API_KEY;
if (!KEY) {
  console.error('RUN INCOMPLETE — missing from env: RETELL_API_KEY');
  console.error('Run through Doppler:  doppler run -- node <script>');
  process.exit(2);
}

const BASE = 'https://api.retellai.com';
const H = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const WRITE = process.argv.includes('--write');

const TARGET = {
  max_call_duration_ms: 720000,
  end_call_after_silence_ms: 60000,
};

const AGENTS = [
  ['AI CHAUFFEUR', 'agent_2d1d687eb85e6d5d0e720795c2'],
  ['RELIABLE',     'agent_367be6cf3c722e89fca03e34b5'],
];

/* Write transport, hard-scoped. Publishing an agent version is a different
   endpoint and this function will not reach it. */
async function patchAgent(agentId, body) {
  const path = `/update-agent/${agentId}`;
  if (!/^\/update-agent\/agent_[A-Za-z0-9]+$/.test(path)) {
    throw new Error(`GUARD — refused: ${path} is not an agent draft update`);
  }
  const res = await fetch(`${BASE}${path}`, { method: 'PATCH', headers: H, body: JSON.stringify(body) });
  const text = await res.text();
  let parsed = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = { _raw: text.slice(0, 300) }; }
  return { ok: res.ok, status: res.status, body: parsed };
}

async function readAgent(agentId) {
  const res = await fetch(`${BASE}/get-agent/${agentId}`, { headers: { Authorization: `Bearer ${KEY}` } });
  const text = await res.text();
  return res.ok ? JSON.parse(text) : null;
}

let failures = 0;

for (const [label, id] of AGENTS) {
  console.log(`\n${label}  ${id}`);

  const before = await readAgent(id);
  if (!before) { console.log('  READ FAILED — skipped'); failures++; continue; }

  console.log(`  draft version              v${before.version}  (is_published=${before.is_published})`);
  for (const k of Object.keys(TARGET)) {
    console.log(`  ${k.padEnd(26)} before: ${before[k] === undefined ? '(absent)' : before[k]}   ->  target: ${TARGET[k]}`);
  }

  if (!WRITE) { console.log('  DRY RUN — no PATCH issued. Re-run with --write.'); continue; }

  const r = await patchAgent(id, TARGET);
  if (!r.ok) {
    console.log(`  PATCH FAILED — HTTP ${r.status} ${JSON.stringify(r.body).slice(0, 300)}`);
    failures++;
    continue;
  }

  /* Read back. A 200 is not evidence — an unknown field returns 200 and does
     nothing, and this API's silence is exactly what a typo looks like. */
  const after = await readAgent(id);
  if (!after) { console.log('  VERIFY READ FAILED'); failures++; continue; }

  let agentOk = true;
  for (const [k, want] of Object.entries(TARGET)) {
    const got = after[k];
    const ok = got === want;
    if (!ok) { agentOk = false; failures++; }
    console.log(`  ${ok ? 'VERIFIED' : 'NOT SET '}  ${k.padEnd(26)} = ${got === undefined ? '(absent — field name rejected silently)' : got}`);
  }

  console.log(`  draft version now          v${after.version}  (is_published=${after.is_published})`);
  if (after.is_published) {
    console.log('  WARNING — this draft reads as published. Investigate before trusting the cap as unshipped.');
    failures++;
  }
  if (agentOk) console.log('  DRAFT UPDATED. Not published — the phone still serves latest_published.');
}

console.log(failures
  ? `\nRUN INCOMPLETE — ${failures} assertion(s) failed.`
  : `\nALL ASSERTIONS PASSED.${WRITE ? ' Drafts updated, nothing published.' : ' Dry run only.'}`);
process.exit(failures ? 1 : 0);
