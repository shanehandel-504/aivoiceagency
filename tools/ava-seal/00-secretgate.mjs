#!/usr/bin/env node
/* ============================================================================
   COMMIT SECRET GATE — diff-aware.
   ----------------------------------------------------------------------------
   00-secretscan.mjs scans whole files, which is right for a fresh snapshot tree
   but wrong at a commit: hq/board.json is years of run history and legitimately
   contains audit lines that NAME retired numbers in order to assert they are
   absent — a LAWS-CHECK entry reads "zero <retired>/<retired>/<retired>". A
   whole-file scan flags those forever and trains you to wave the gate through,
   which is how a real leak eventually gets in.

   So this gate asks the only question that matters at commit time: does this
   change INTRODUCE a secret that is not already committed? A finding is blocked
   only if the exact matched string is absent from HEAD's copy of that file.

   Exit 0 = nothing new introduced. Exit 1 = blocked.
   ========================================================================== */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const PUBLIC_OK = new Set(['4142408930', '3502205305', '4147750019']);
const RULES = [
  [/"auth_username"\s*:\s*"[^"]+"/g, 'SIP auth_username'],
  [/"auth_password"\s*:\s*"[^"]+"/g, 'SIP auth_password'],
  [/"?(api[_-]?key|apikey|access_token|refresh_token|client_secret)"?\s*[:=]\s*"[^"]{16,}"/gi, 'credential-shaped key'],
  [/\bsk-[A-Za-z0-9]{16,}/g, 'sk- token'],
  [/\bpit-[A-Za-z0-9-]{16,}/g, 'GHL PIT'],
  [/\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/g, 'JWT'],
  [/\b(?:\+?1[ .-]?)?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}\b/g, 'phone number'],
];

const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' }).split('\n').filter(Boolean);
let blocked = 0, carried = 0;

for (const f of staged) {
  if (!/\.(json|mjs|js|md|py|html|css|txt)$/.test(f)) continue;
  let now = '';
  try { now = readFileSync(f, 'utf8'); } catch { continue; }
  let head = '';
  try { head = execSync(`git show HEAD:"${f}"`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }); } catch { head = ''; }

  for (const [re, label] of RULES) {
    const seen = new Set();
    for (const m of now.match(re) || []) {
      if (seen.has(m)) continue;
      seen.add(m);
      if (label === 'phone number') {
        const d10 = m.replace(/\D/g, '').slice(-10);
        if (d10.length !== 10 || PUBLIC_OK.has(d10) || d10.slice(0, 3) === '555') continue;
      }
      if (head.includes(m)) { carried++; continue; }          // already committed — not introduced here
      console.log(`  BLOCKED  ${f}`);
      console.log(`           ${label}: ${m.slice(0, 46)}`);
      blocked++;
    }
  }
}

console.log(`\nCOMMIT SECRET GATE — ${blocked} newly-introduced, ${carried} pre-existing and carried forward.`);
if (blocked) { console.error('COMMIT BLOCKED — this change would put a new secret or private number in the repo.'); process.exit(1); }
console.log('CLEAN — this change introduces no secret and no new private number.');
