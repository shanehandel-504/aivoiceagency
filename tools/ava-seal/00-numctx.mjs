/* Show the surrounding text for every phone-shaped match, so a broad regex hitting
   a hash or an id is not mistaken for a leaked number. */
import { readFileSync } from 'node:fs';
const t = readFileSync(process.argv[2], 'utf8');
const PUBLIC_OK = new Set(['4142408930', '3502205305', '4147750019']);
const re = /\b(?:\+?1[ .-]?)?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}\b/g;
const seen = new Set();
let m;
while ((m = re.exec(t)) !== null) {
  const d10 = m[0].replace(/\D/g, '').slice(-10);
  if (PUBLIC_OK.has(d10) || d10.slice(0, 3) === '555') continue;
  if (seen.has(m[0])) continue;
  seen.add(m[0]);
  const ctx = t.slice(Math.max(0, m.index - 60), m.index + m[0].length + 40).replace(/\s+/g, ' ');
  console.log(`\n  match "${m[0]}"  (d10 ${d10.slice(0, 3)}-***-${d10.slice(-4)})`);
  console.log(`    …${ctx}…`);
}
if (!seen.size) console.log('  no non-public phone-shaped strings');
