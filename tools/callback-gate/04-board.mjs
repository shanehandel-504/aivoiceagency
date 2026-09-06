/* tools/callback-gate/04-board.mjs — board law for the CALLBACK GATE run.
 *
 *   node tools/callback-gate/04-board.mjs
 *
 * Flips statuses, appends ONE ISO-timestamped log entry, and files the SMS /
 * caller-ID work as a scoped T-item. Idempotent: re-running replaces the two
 * items by id and refuses to append a second identical log entry.
 *
 * BOARD LAW — no phone number ending 6562 or 9511 appears in anything written
 * here, and the assertion at the bottom proves it against the file that lands
 * on disk rather than against the strings this script intended to write.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const PATH = 'hq/board.json';
const board = JSON.parse(readFileSync(PATH, 'utf8'));

const now = new Date();
const iso = now.toISOString();
/* The board stamps local time with an offset, matching every existing row. */
const pad = (n) => String(n).padStart(2, '0');
const off = -now.getTimezoneOffset();
const stampLocal =
  `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T` +
  `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.` +
  `${String(now.getMilliseconds()).padStart(3, '0')}` +
  `${off >= 0 ? '+' : '-'}${pad(Math.floor(Math.abs(off) / 60))}:${pad(Math.abs(off) % 60)}`;

const ITEMS = [
  {
    id: 'CALLBACK-GATE',
    title: 'WF-CALLBACK-GATE v1.0 — international revenue-share fraud gate',
    url: 'https://circulant.app.n8n.cloud/workflow/u3FaLLiH0loGf1BN',
    status: 'live',
    latest_published: '82bd9f69-c7b1-4a1c-b828-ed816eae384b',
    label:
      'On 2026-09-06 the AI Chauffeur line placed a 13m14s OUTBOUND call to a +44 121 number that ' +
      'answered with a "test call connected, you are all set to earn" recording — international ' +
      'revenue-share fraud, dialled off a public web form. THE CAUSE WAS NOT A BUG IN ONE FORM: the ' +
      'n8n dialer normalised any "+"-prefixed input to "+" + digits and both brand forms validated ' +
      'with /^\\+[1-9]\\d{7,14}$/, which is every country on earth. Two brands, one webhook, one hole. ' +
      'CALLBACK GATE now sits as the single chokepoint in front of Dial via Retell and fails closed: ' +
      'E.164 +1 only; blocks 900/976, the twenty Caribbean revenue-share NPAs (they read as domestic ' +
      'because they are +1), toll-free NPAs and our own lines; requires tcpa_consent === true; ' +
      'requires an empty company_url honeypot; one outbound per number per 24h off the new ' +
      'callback_gate_log data table. Every attempt is logged allowed-or-blocked with its reason, and ' +
      'a block texts the owner status-led on the Error Sentry\'s own GHL rail. PROVEN AGAINST ' +
      'PRODUCTION: 5/5 hostile cases returned 403 with the right reason and wrote 5 log rows; the UK ' +
      'number, a Caribbean +1, a 900, an absent TCPA and a filled honeypot. Client-side halves ' +
      'shipped in site.js and chauffeur/assets/aic.js and were render-verified in a real browser at ' +
      '390x844 and desktop, zero console errors. ONE DEFECT THE FIRST LIVE-FIRE CAUGHT: Respond ' +
      'Blocked sat downstream of the SMS node, so its $json was the GHL API response and every ' +
      'refusal returned an empty reason — it now reads the gate by name. ROLLBACK: publish n8n ' +
      'version 5f891259-c517-410a-a85e-0801644d1e91 (the pre-gate spine).',
  },
  {
    id: 'T-OUTBOUND-IDENTITY',
    title: 'T — Twilio number + 10DLC + CNAM "AI CHAUFFEUR" + Turnstile (SCOPED, NOT EXECUTED)',
    url: 'https://console.twilio.com',
    status: 'pending',
    label:
      'SCOPE ONLY — nothing bought, nothing registered, no key created. All eight numbers on the ' +
      'Retell account are retell-twilio (Retell-provisioned, not imported), custom_sms_enabled is ' +
      'false on every one of them, and the API exposes NO per-number outbound or international ' +
      'control — allowed_inbound_country_list is INBOUND only. So caller ID and SMS both need our ' +
      'own Twilio identity. (1) Twilio A2P 10DLC brand registration: one-time ~$4 brand vet + ~$15 ' +
      'campaign vet, ~$1.50-10/mo campaign, 1-3 business days for a standard low-volume brand, up ' +
      'to 3-4 weeks if the brand vet is appealed. (2) Numbers: ~$1.15/mo each. (3) CNAM registration ' +
      'to "AI CHAUFFEUR": ~$0.30-1.00/mo per number plus a one-time set fee; propagation across ' +
      'carriers is 5-10 business days and is NEVER guaranteed on every carrier — CNAM is a ' +
      'best-effort database, not a display promise, so do not sell it as one. (4) Import to Retell ' +
      'as the outbound/SMS line: same-day once 10DLC clears. (5) Cloudflare Turnstile: free, ' +
      'same-day; needs a site key on both forms and a TURNSTILE_SECRET n8n Variable, then the gate ' +
      'flips its token check from record-only to enforced. TOTAL: roughly $20-25 one-time and ' +
      '$5-15/mo, 3-5 business days of real elapsed time gated on the 10DLC vet, with CNAM display ' +
      'trailing 1-2 weeks behind. DEPENDENCY: nothing here is required to hold the fraud gate — the ' +
      'gate is already live without it.',
  },
];

const byId = new Map(board.items.map((i) => [i.id, i]));
for (const it of ITEMS) byId.set(it.id, it);
board.items = [...byId.values()];

/* L2 Voice carries the agent drafts that are capped but NOT published, and the
   board must not read "live" as though that cap were shipped. */
/* L2 Voice carries the agent drafts that are capped but NOT published.
   PREPEND, NEVER REPLACE. This field is the lane's accumulated ledger — the
   first cut of this script assigned over ~8.7k chars of history in one line
   and the loss was invisible in the tool output; only the git diff showed it.
   The file's own convention is a ' | PREV: ' chain, so follow it, and strip a
   prior run of this same block first so re-running does not nest. */
const voice = board.lanes.find((l) => l.id === 'L2');
if (voice) {
  voice.status = 'live';
  const HEAD_LINE =
    'CALLBACK GATE LIVE (2026-09-06). The ava-call webhook can no longer dial outside +1. ' +
    'PENDING SHANE: both outbound-capable Retell agents have DRAFT caps applied and verified — ' +
    'AI CHAUFFEUR v28 and Reliable v29, max_call_duration_ms 720000 and end_call_after_silence_ms ' +
    '60000 — and drafts are not what answers the phone. Numbers serve latest_published (v27 / v28), ' +
    'so the caps do not take effect until Shane publishes.';
  const existing = String(voice.note || '');
  const history = existing.startsWith('CALLBACK GATE LIVE')
    ? existing.split(' | PREV: ').slice(1).join(' | PREV: ')
    : existing;
  voice.note = history ? `${HEAD_LINE} | PREV: ${history}` : HEAD_LINE;
}

const ENTRY =
  `CALLBACK GATE LIVE — n8n u3FaLLiH0loGf1BN activeVersionId 82bd9f69-c7b1-4a1c-b828-ed816eae384b ` +
  `(rollback: 5f891259-c517-410a-a85e-0801644d1e91). Closes the hole that produced ` +
  `call_54e89c60b6b97ae97170d0f4162 — the AI Chauffeur line dialling a +44 121 revenue-share ` +
  `recording for 13m14s off a public form, 372.09 Retell cost units of which 132.33 was UK ` +
  `telephony. THE DIALER WAS NEITHER "IN THE REPO" NOR GHL: it is the ACTIVE n8n workflow ` +
  `"AVA Layer 1 — Money Path Spine", and BOTH brands' forms POST to its one ava-call webhook, so ` +
  `gating a separate WF-CALLBACK-GATE alongside it would have left the vulnerable endpoint open. ` +
  `The gate went in at the chokepoint instead. +1 only, 900/976 + 20 Caribbean NPAs + toll-free + ` +
  `our own lines blocked, TCPA true required, honeypot required empty, one call per number per 24h; ` +
  `fails closed; every attempt logged to data table callback_gate_log with a reason; a block texts ` +
  `the owner on the Error Sentry rail. 5/5 hostile cases proven against PRODUCTION. Client halves ` +
  `in site.js + chauffeur/assets/aic.js render-verified at 390x844 and desktop, 0 console errors. ` +
  `Retell drafts capped and read-back-verified (720000 / 60000) on BOTH outbound agents — NOT ` +
  `published; the phone still serves v27 / v28 until Shane publishes. Turnstile is NOT live (no key ` +
  `exists); the token is recorded, never trusted. THREE THINGS THE BRIEF COULD NOT HAVE KNOWN: ` +
  `(1) all 8 numbers are retell-twilio PROVISIONED, not imported, and Retell exposes no per-number ` +
  `outbound/international flag at all — allowed_inbound_country_list is inbound-only, so there was ` +
  `no platform switch to throw. (2) The first live-fire returned 403 with an EMPTY reason: ` +
  `Respond Blocked sat behind the SMS node and was reading the GHL response as $json. The block ` +
  `worked; the explanation did not, and only a live test could see the difference. (3) The parent ` +
  `AVA form carried the identical permissive regex, so the fraud could have arrived through ` +
  `aivoiceagency.ai just as easily — it was never a chauffeur-only defect.`;

board.log = board.log.filter((l) => !String(l.entry || '').startsWith('CALLBACK GATE LIVE —'));
board.log.unshift({ ts: stampLocal, entry: ENTRY });
board.updated = stampLocal;

writeFileSync(PATH, JSON.stringify(board, null, 2) + '\n', 'utf8');

/* Assert on what actually landed, not on what was intended — but scoped to the
   rows THIS run wrote. Two older log entries already carry the retired numbers
   (inside a laws-check that was quoting them as the things it had found zero
   of). They are the historical ledger and are not retro-edited, the same way
   /reports/ files predating PROMPT-FOOTER KILL keep their tails. Scanning the
   whole file would fail forever on someone else's rows and teach us to ignore
   the alarm. Read back from disk, not from the in-memory objects. */
const written = JSON.parse(readFileSync(PATH, 'utf8'));
const mine = [
  written.log[0].entry,
  ...written.items.filter((i) => i.id === 'CALLBACK-GATE' || i.id === 'T-OUTBOUND-IDENTITY')
    .flatMap((i) => [i.title, i.label, i.url]),
  written.lanes.find((l) => l.id === 'L2')?.note ?? '',
].join('\n');
const digitRuns = mine.match(/\d[\d\s().-]{8,}\d/g) || [];
const offenders = digitRuns
  .map((s) => s.replace(/\D/g, ''))
  .filter((d) => d.length >= 10 && (d.endsWith('6562') || d.endsWith('9511')));

console.log(`board.json written — ${board.items.length} items, ${board.log.length} log entries`);
console.log(`  CALLBACK-GATE        ${byId.get('CALLBACK-GATE').status}`);
console.log(`  T-OUTBOUND-IDENTITY  ${byId.get('T-OUTBOUND-IDENTITY').status}`);
console.log(`  L2 Voice lane        ${voice ? voice.status : '(not found)'}`);
if (offenders.length) {
  console.log(`RUN INCOMPLETE — board law violation: ${offenders.length} forbidden suffix(es) in the written file.`);
  process.exit(1);
}
console.log('BOARD LAW — no forbidden phone suffix in any row this run wrote. OK.');
