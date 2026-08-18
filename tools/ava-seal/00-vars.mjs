/* Audit the VALUE, not the reference (memory: audit-the-value-not-the-reference).
   Proving a node references $vars.X while X never resolves killed the owner SMS
   for 3 calls. Dereference against the live API. Prints presence + shape ONLY. */
import { need, req, nH, N8N_API, loadJSON } from './_lib.mjs';
need(['N8N_API_KEY']);
const r = await req('GET', `${N8N_API}/variables?limit=250`, nH());
if (!r.ok) { console.error(`RUN INCOMPLETE — variables HTTP ${r.status}`); process.exit(2); }
const rows = r.body.data ?? r.body ?? [];
const WANT = ['OWNER_ALERT_CONTACT_ID', 'OWNER_SMS_FROM', 'OWNER_ALERT_EMAIL', 'ZZ_TEST_CONTACT_ID', 'OUR_NUMBERS'];
console.log(`N8N VARIABLES — ${rows.length} defined\n`);
const mask = (v) => {
  const s = String(v ?? '');
  if (!s) return '(EMPTY — resolves to nothing)';
  if (/^\+?\d[\d\s().-]{6,}$/.test(s)) return `phone ending ${s.replace(/\D/g,'').slice(-4)} (len ${s.length})`;
  if (s.includes('@')) return `email ${s.split('@')[0].slice(0,2)}…@${s.split('@')[1]}`;
  if (s.includes(',')) return `${s.split(',').length} csv entries (len ${s.length})`;
  return `id ${s.slice(0,4)}…${s.slice(-4)} (len ${s.length})`;
};
for (const k of WANT) {
  const hit = rows.find(v => v.key === k);
  console.log(`  ${k.padEnd(24)} ${hit ? 'RESOLVES → ' + mask(hit.value) : '** ABSENT — every $vars reference to it is dead **'}`);
}
console.log('\nall keys:', rows.map(v => v.key).sort().join(', '));

/* credential ids in use on the neighbouring rails — needed to clone auth */
for (const slug of ['client-intake', 'postcall-demosend']) {
  const w = loadJSON(`config-snapshots/2026-08-18-ava-seal/_context/${slug}.json`);
  console.log(`\n[${w.name}] credentials in use:`);
  const seen = new Set();
  for (const n of w.nodes) {
    for (const [type, c] of Object.entries(n.credentials ?? {})) {
      const k = `${type}|${c.id}|${c.name}`;
      if (seen.has(k)) continue; seen.add(k);
      console.log(`   ${type.padEnd(22)} id=${c.id}  name=${c.name}   (on: ${n.name})`);
    }
  }
}
