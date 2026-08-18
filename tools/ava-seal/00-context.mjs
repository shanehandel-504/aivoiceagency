/* Read-only: pull the neighbouring rails this run must not collide with. */
import { need, req, nH, saveJSON, N8N_API } from './_lib.mjs';
need(['N8N_API_KEY']);
const DIR = 'config-snapshots/2026-08-18-ava-seal/_context';
const ids = {
  '6r8YHuMEJbxeDyT5': 'postcall-demosend',
  'ITGRwcRKxLgmKnBZ': 'ani-inbound-lookup',
  '9FoLm4slBmM5nIus': 'client-intake',
};
for (const [id, slug] of Object.entries(ids)) {
  const r = await req('GET', `${N8N_API}/workflows/${id}`, nH());
  if (!r.ok) { console.error(`FAIL ${id} HTTP ${r.status}`); continue; }
  saveJSON(`${DIR}/${slug}.json`, r.body);
  console.log(`\n=== ${r.body.name} (${id}) active=${r.body.active} ===`);
  for (const n of r.body.nodes) console.log(`  · ${n.name}  [${n.type.replace('n8n-nodes-base.', '')}]`);
}
