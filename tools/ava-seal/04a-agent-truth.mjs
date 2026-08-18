#!/usr/bin/env node
/* ============================================================================
   AVA SEAL · STEP 4a — WHAT ACTUALLY ANSWERS THE PHONE
   ----------------------------------------------------------------------------
   Before touching the agent's webhook_url, establish which of these is true,
   because they demand different actions and only one of them is safe:

     (A) webhook_url is AGENT-level  -> a PATCH changes the live behaviour now.
     (B) webhook_url is VERSION-level -> a PATCH edits the unpublished DRAFT only.
         The number serves `latest_published`, so production keeps the old URL and
         a GET of the draft reads GREEN while nothing changed. Making it real
         needs a NEW PUBLISHED VERSION, which also ships whatever else the draft
         is carrying — a voice-freeze decision, not a plumbing one.

   This tool does not write. It measures.
   ========================================================================== */
import { need, req, rH, loadJSON, RETELL, AGENT_ID, ISO } from './_lib.mjs';

need(['RETELL_API_KEY']);
console.log(`AVA SEAL · STEP 4a · AGENT TRUTH · ${ISO()}`);
console.log('='.repeat(72));

const versions = loadJSON('config-snapshots/2026-08-18-ava-seal/retell-agent-versions.json') ?? [];
const draft = loadJSON('config-snapshots/2026-08-18-ava-seal/retell-agent-draft.json');

/* ---- is webhook_url versioned? ------------------------------------------ */
const urls = new Map();
for (const v of versions) {
  const u = v.webhook_url ?? '(none)';
  if (!urls.has(u)) urls.set(u, []);
  urls.get(u).push(v.version);
}
console.log(`\n[IS webhook_url VERSIONED?]  ${versions.length} versions on this agent`);
for (const [u, vs] of urls) {
  const s = vs.sort((a, b) => a - b);
  console.log(`  ${s.length} version(s) carry: ${u}`);
  console.log(`      v${s[0]}…v${s[s.length - 1]}`);
}
if (urls.size > 1) console.log('  => VERSIONED. Different versions carry different URLs. Case (B).');
else console.log('  => every version carries the SAME url; versioning is not disproved, only unexercised.');

/* ---- which version answers the phone? ----------------------------------- */
const pub = versions.filter((v) => v.is_published).sort((a, b) => b.version - a.version);
const live = pub[0];
console.log(`\n[WHAT ANSWERS +1 414-240-8930]`);
console.log(`  number routes to  agent_version = "latest_published"`);
console.log(`  latest_published  v${live.version}  (published=${live.is_published})`);
console.log(`  its webhook_url   ${live.webhook_url ?? '(none)'}`);
console.log(`  DRAFT is          v${draft.version}  published=${draft.is_published}`);
console.log(`  draft webhook_url ${draft.webhook_url ?? '(none)'}`);
if (draft.version !== live.version)
  console.log(`\n  ** A PATCH lands on v${draft.version}. The phone serves v${live.version}. **`);

/* ---- what ELSE would ship if the draft were published? ------------------ */
console.log(`\n[BLAST RADIUS — what publishing the draft would also ship]`);
const liveFull = await req('GET', `${RETELL}/get-agent/${AGENT_ID}?version=${live.version}`, rH());
if (!liveFull.ok) { console.log(`  could not fetch v${live.version} in full (HTTP ${liveFull.status}) — cannot size the diff`); }
else {
  const a = liveFull.body, b = draft;
  const SKIP = new Set(['version', 'is_published', 'last_modification_timestamp', 'webhook_url', 'version_title']);
  const keys = new Set([...Object.keys(a), ...Object.keys(b)].filter((k) => !SKIP.has(k)));
  const diffs = [];
  for (const k of keys) {
    const x = JSON.stringify(a[k]), y = JSON.stringify(b[k]);
    if (x !== y) diffs.push([k, x, y]);
  }
  if (!diffs.length) console.log(`  NONE — draft v${b.version} is identical to live v${a.version} apart from webhook_url/version metadata.`);
  else {
    console.log(`  ${diffs.length} field(s) differ between live v${a.version} and draft v${b.version}:`);
    for (const [k, x, y] of diffs) {
      const short = (s) => (s == null ? '(absent)' : s.length > 110 ? s.slice(0, 110) + `… [${s.length} chars]` : s);
      console.log(`\n    ${k}`);
      console.log(`      live  ${short(x)}`);
      console.log(`      draft ${short(y)}`);
    }
    console.log(`\n  => Publishing to make a webhook change live would ALSO ship the above.`);
  }
}
