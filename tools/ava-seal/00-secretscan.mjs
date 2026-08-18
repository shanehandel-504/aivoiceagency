/* Nothing sensitive may enter the repo (CLAUDE.md GUARDRAILS + § PHONE).
   Scans the snapshot tree for credential-shaped values and private numbers. */
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
const ROOT = process.argv[2];
const PUBLIC_OK = new Set(['4142408930', '3502205305', '4147750019']); // AVA line, published SMS, chauffeur
const HITS = [];
const RULES = [
  [/"auth_username"\s*:\s*"[^"]+"/g, 'SIP auth_username'],
  [/"auth_password"\s*:\s*"[^"]+"/g, 'SIP auth_password'],
  [/"?(api[_-]?key|apikey|access_token|refresh_token|client_secret|bearer)"?\s*[:=]\s*"[^"]{16,}"/gi, 'credential-shaped key'],
  [/\bsk-[A-Za-z0-9]{16,}/g, 'sk- token'],
  [/\bpit-[A-Za-z0-9-]{16,}/g, 'GHL PIT'],
  [/\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/g, 'JWT'],
];
function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!/\.(json|mjs|js|md)$/.test(f)) continue;
    const t = readFileSync(p, 'utf8');
    for (const [re, label] of RULES) {
      for (const m of t.match(re) || []) HITS.push([p, label, m.slice(0, 60)]);
    }
    for (const m of t.match(/\b(?:\+?1[ .-]?)?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}\b/g) || []) {
      const d10 = m.replace(/\D/g, '').slice(-10);
      if (d10.length === 10 && !PUBLIC_OK.has(d10) && !/^(\d)\1{9}$/.test(d10) && d10.slice(0,3) !== '555') {
        HITS.push([p, 'phone number (verify it is not private)', d10.slice(0,3) + '-***-' + d10.slice(-4)]);
      }
    }
  }
}
walk(ROOT);
if (!HITS.length) { console.log('SECRET SCAN — CLEAN'); process.exit(0); }
console.log(`SECRET SCAN — ${HITS.length} FINDING(S), commit BLOCKED until redacted\n`);
const seen = new Set();
for (const [p, label, m] of HITS) {
  const k = p + label + m; if (seen.has(k)) continue; seen.add(k);
  console.log(`  ${label.padEnd(38)} ${p}\n      ${m}`);
}
process.exit(1);
