import { loadJSON } from './_lib.mjs';
const w = loadJSON('config-snapshots/2026-08-18-ava-seal/n8n-c5GPBkma1HyvonEa-PRE-EDIT.json');
console.log(`${w.name}  active=${w.active}  errorWorkflow=${w.settings?.errorWorkflow}`);
console.log('\n--- CONNECTIONS ---');
for (const [from, o] of Object.entries(w.connections)) {
  (o.main ?? []).forEach((br, i) => (br ?? []).forEach(t =>
    console.log(`  ${from}  --[${i}]-->  ${t.node}`)));
}
console.log('\n--- NODES ---');
for (const n of w.nodes) {
  console.log('\n' + '='.repeat(72));
  console.log(`${n.name}  [${n.type}]  onError=${n.onError ?? '(default)'}`);
  if (n.credentials) console.log('  creds:', JSON.stringify(n.credentials));
  console.log(JSON.stringify(n.parameters, null, 2));
}
