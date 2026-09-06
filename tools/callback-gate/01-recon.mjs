/* tools/callback-gate/01-recon.mjs — READ ONLY.
 *
 *   doppler run -- node tools/callback-gate/01-recon.mjs
 *
 * Incident recon for the 2026-09-06 international revenue-share fraud call
 * (AI Chauffeur agent, +44 121 destination, 13m14s). Answers, from the wire and
 * not from memory:
 *
 *   1. Both agents: live version, max_call_duration_ms, end_call_after_silence_ms,
 *      reminder settings — read at the DRAFT *and* at latest_published, because
 *      get-agent returns the draft and the phone serves the published version.
 *   2. Every number on the account: provisioned vs imported, and EVERY key the
 *      API actually exposes (so "there is no international flag" is a measured
 *      claim, not an assumption).
 *   3. Every outbound call in the last 72h: destination country, duration, cost.
 *
 * SECRET LAW — no key is ever printed. sip_outbound_trunk_config is redacted.
 * BOARD LAW — any number ending 6562 or 9511 is masked before it can reach stdout.
 */

import { get, postList, requireEnv, safe } from '../codex-read/_http.mjs';

requireEnv(['RETELL_API_KEY']);
const H = { Authorization: `Bearer ${process.env.RETELL_API_KEY}` };
const BASE = 'https://api.retellai.com';

const AGENTS = [
  ['AI CHAUFFEUR', 'agent_2d1d687eb85e6d5d0e720795c2'],
  ['RELIABLE',     'agent_367be6cf3c722e89fca03e34b5'],
];

/* BOARD LAW — two suffixes never appear in output, in any format. Strip the
   separators before testing, or "(305) 315-6562" walks straight past a
   naive endsWith on the formatted string. */
const FORBIDDEN_SUFFIX = ['6562', '9511'];
const redact = (s) => {
  const d = String(s ?? '').replace(/\D/g, '');
  if (!d) return String(s ?? '');
  return FORBIDDEN_SUFFIX.some((f) => d.endsWith(f)) ? '[REDACTED — board law]' : String(s);
};

/* Country resolution. NANP is +1, so a bare "+1" tells you nothing about risk:
   the Caribbean revenue-share NPAs are all +1 too. Split them out by area code. */
const CARIBBEAN_NPA = new Set(['242','246','264','268','284','345','441','473','649','664','721','758','767','784','809','829','849','868','869','876']);
const PREMIUM_NPA = new Set(['900','976']);
const TOLLFREE_NPA = new Set(['800','833','844','855','866','877','888']);
const CC = [
  ['+44','GB — United Kingdom'], ['+7','RU/KZ'], ['+20','EG'], ['+27','ZA'],
  ['+30','GR'], ['+31','NL'], ['+33','FR'], ['+34','ES'], ['+39','IT'],
  ['+40','RO'], ['+43','AT'], ['+46','SE'], ['+47','NO'], ['+48','PL'],
  ['+49','DE'], ['+52','MX'], ['+55','BR'], ['+61','AU'], ['+63','PH'],
  ['+81','JP'], ['+86','CN'], ['+91','IN'], ['+92','PK'], ['+94','LK'],
  ['+211','SS'], ['+212','MA'], ['+216','TN'], ['+218','LY'], ['+220','GM'],
  ['+221','SN'], ['+225','CI'], ['+232','SL'], ['+234','NG'], ['+236','CF'],
  ['+238','CV'], ['+239','ST'], ['+240','GQ'], ['+242','CG'], ['+243','CD'],
  ['+245','GW'], ['+246','IO'], ['+247','AC'], ['+248','SC'], ['+252','SO'],
  ['+253','DJ'], ['+257','BI'], ['+261','MG'], ['+262','RE'], ['+265','MW'],
  ['+269','KM'], ['+290','SH'], ['+297','AW'], ['+298','FO'], ['+299','GL'],
  ['+355','AL'], ['+370','LT'], ['+371','LV'], ['+372','EE'], ['+373','MD'],
  ['+375','BY'], ['+380','UA'], ['+381','RS'], ['+383','XK'], ['+385','HR'],
  ['+386','SI'], ['+387','BA'], ['+389','MK'], ['+420','CZ'], ['+421','SK'],
  ['+423','LI'], ['+500','FK'], ['+501','BZ'], ['+502','GT'], ['+503','SV'],
  ['+504','HN'], ['+505','NI'], ['+506','CR'], ['+507','PA'], ['+508','PM'],
  ['+509','HT'], ['+590','GP'], ['+591','BO'], ['+592','GY'], ['+593','EC'],
  ['+597','SR'], ['+598','UY'], ['+599','CW'], ['+670','TL'], ['+672','NF'],
  ['+673','BN'], ['+674','NR'], ['+675','PG'], ['+676','TO'], ['+677','SB'],
  ['+678','VU'], ['+679','FJ'], ['+680','PW'], ['+681','WF'], ['+682','CK'],
  ['+683','NU'], ['+685','WS'], ['+686','KI'], ['+687','NC'], ['+688','TV'],
  ['+689','PF'], ['+690','TK'], ['+691','FM'], ['+692','MH'], ['+850','KP'],
  ['+852','HK'], ['+853','MO'], ['+855','KH'], ['+856','LA'], ['+880','BD'],
  ['+886','TW'], ['+960','MV'], ['+961','LB'], ['+962','JO'], ['+963','SY'],
  ['+964','IQ'], ['+965','KW'], ['+966','SA'], ['+967','YE'], ['+968','OM'],
  ['+970','PS'], ['+971','AE'], ['+972','IL'], ['+973','BH'], ['+974','QA'],
  ['+975','BT'], ['+976','MN'], ['+977','NP'], ['+992','TJ'], ['+993','TM'],
  ['+994','AZ'], ['+995','GE'], ['+996','KG'], ['+998','UZ'],
].sort((a, b) => b[0].length - a[0].length); // longest prefix first

function classify(num) {
  const s = String(num ?? '');
  if (!s.startsWith('+')) return 'UNKNOWN (not E.164)';
  if (s.startsWith('+1')) {
    const npa = s.slice(2, 5);
    if (PREMIUM_NPA.has(npa)) return `US PREMIUM +1-${npa} — HIGH RISK`;
    if (CARIBBEAN_NPA.has(npa)) return `CARIBBEAN +1-${npa} — HIGH RISK (revenue share)`;
    if (TOLLFREE_NPA.has(npa)) return `NANP TOLL-FREE +1-${npa}`;
    return `NANP +1-${npa}`;
  }
  for (const [p, name] of CC) if (s.startsWith(p)) return `INTERNATIONAL ${name}`;
  return 'INTERNATIONAL (unmapped country code)';
}

const line = (k, v) => console.log(`    ${String(k).padEnd(28)} ${v}`);
const rule = (t) => console.log(`\n${'='.repeat(78)}\n${t}\n${'='.repeat(78)}`);

/* ── 1 · AGENTS ─────────────────────────────────────────────────────────── */
rule('1 · AGENTS — draft vs what actually answers the phone');

const DURATION_KEYS = [
  'max_call_duration_ms', 'end_call_after_silence_ms',
  'reminder_trigger_ms', 'reminder_max_count',
  'begin_message_delay_ms', 'ring_duration_ms', 'voicemail_option',
];

for (const [label, id] of AGENTS) {
  console.log(`\n  ${label}  ${id}`);
  const draft = await get(`${BASE}/get-agent/${id}`, H, { label: 'get-agent' });
  if (!draft.ok) { line('READ FAILED', `HTTP ${draft.status} ${safe(draft.body, 200)}`); continue; }
  const a = draft.body;
  line('agent_name', a.agent_name ?? '(unnamed)');
  line('DRAFT version', a.version);
  line('is_published (draft)', a.is_published);

  const vr = await get(`${BASE}/get-agent-versions/${id}`, H, { label: 'get-agent-versions' });
  let published = null;
  if (vr.ok) {
    const vs = Array.isArray(vr.body) ? vr.body : (vr.body.items ?? []);
    const pub = vs.filter((v) => v.is_published);
    published = pub.sort((x, y) => (y.version ?? 0) - (x.version ?? 0))[0] ?? null;
    line('versions on record', vs.length);
    line('LATEST PUBLISHED', published ? `v${published.version}  <- THIS ANSWERS THE PHONE` : '(none published)');
  } else {
    line('versions', `read failed HTTP ${vr.status}`);
  }

  console.log('    ── duration / silence / reminder ──   DRAFT            PUBLISHED');
  for (const k of DURATION_KEYS) {
    const d = a[k];
    const p = published ? published[k] : undefined;
    const fmt = (v) => (v === undefined ? '(absent)' : v === null ? 'null' : typeof v === 'object' ? JSON.stringify(v) : String(v));
    console.log(`    ${k.padEnd(28)} ${fmt(d).padEnd(18)} ${fmt(p)}`);
  }
}

/* ── 2 · NUMBERS ────────────────────────────────────────────────────────── */
rule('2 · PHONE NUMBERS — provenance and every flag the API actually exposes');

const nr = await get(`${BASE}/v2/list-phone-numbers`, H, { label: 'v2/list-phone-numbers' });
if (!nr.ok) {
  console.log(`  READ FAILED — HTTP ${nr.status} ${safe(nr.body, 300)}`);
} else {
  const nums = nr.body.items ?? [];
  console.log(`  ${nums.length} number(s) on the account\n`);
  const allKeys = new Set();
  for (const n of nums) {
    /* DO NOT reintroduce a sip_outbound_trunk_config test here. The first cut
       of this script read a truthy config object as "imported" and printed
       IMPORTED for all 8 numbers. Retell returns that object — termination_uri,
       transport, auth_username — on EVERY number as its own elastic-SIP
       plumbing, so `{}` is truthy and the heuristic was wrong on every row.
       phone_number_type is the actual provenance: retell-* is provisioned by
       Retell; a BYO number carries a custom/BYO type. */
    const imported = /custom|byo|import/i.test(String(n.phone_number_type ?? ''));
    console.log(`  ${redact(n.phone_number)}  ${n.nickname ? `(${n.nickname})` : ''}`);
    line('phone_number_type', n.phone_number_type ?? '(absent)');
    line('provenance', imported ? 'IMPORTED (BYO / elastic SIP trunk)' : 'RETELL-PROVISIONED');
    line('inbound_agents', (n.inbound_agents ?? []).map((x) => `${x.agent_id}@${x.agent_version}`).join(', ') || '(none)');
    line('outbound_agents', (n.outbound_agents ?? []).map((x) => `${x.agent_id}@${x.agent_version}`).join(', ') || '(none)');
    Object.keys(n).forEach((k) => allKeys.add(k));
    const extra = Object.keys(n).filter((k) => !['phone_number','nickname','phone_number_type','inbound_agents','outbound_agents','sip_outbound_trunk_config'].includes(k));
    line('other keys returned', extra.join(', ') || '(none)');
    console.log('');
  }
  console.log('  UNION OF EVERY KEY THE API RETURNS ON A NUMBER:');
  console.log(`    ${[...allKeys].sort().join('\n    ')}`);
  const flagLike = [...allKeys].filter((k) => /intl|international|country|geo|allow|block|restrict|limit|permission|region/i.test(k));
  console.log(`\n  KEYS THAT LOOK LIKE AN OUTBOUND/INTERNATIONAL CONTROL: ${flagLike.length ? flagLike.join(', ') : 'NONE — the API exposes no per-number destination control.'}`);
}

/* ── 3 · OUTBOUND CALLS, LAST 72h ───────────────────────────────────────── */
rule('3 · OUTBOUND CALLS — last 72h, destination country, duration, cost');

const since = Date.now() - 72 * 60 * 60 * 1000;
/* RETELL API RULES — /v3/list-calls tightened filter_criteria. `direction` must be
   an enum object, and `start_timestamp` a typed number op. The v2 shapes 400. */
const cr = await postList(`${BASE}/v3/list-calls`, H, {
  filter_criteria: {
    direction: { type: 'enum', op: 'in', value: ['outbound'] },
    start_timestamp: { type: 'number', op: 'ge', value: since },
  },
  sort_order: 'descending',
  limit: 500,
}, { label: 'v3/list-calls' });

if (!cr.ok) {
  console.log(`  READ FAILED — HTTP ${cr.status} ${safe(cr.body, 400)}`);
} else {
  const calls = cr.body.items ?? [];
  console.log(`  ${calls.length} outbound call(s) since ${new Date(since).toISOString()}\n`);
  let total = 0;
  for (const c of calls) {
    /* v3 list omits cost detail; take the id and hydrate. */
    const d = await get(`${BASE}/v2/get-call/${c.call_id}`, H, { label: 'get-call' });
    const f = d.ok ? d.body : c;
    const secs = Math.round((f.duration_ms ?? 0) / 1000);
    const cost = f.call_cost?.combined_cost;
    if (typeof cost === 'number') total += cost;
    const dest = classify(f.to_number);
    const flag = /HIGH RISK|INTERNATIONAL/.test(dest) ? '  <<< FLAG' : '';
    console.log(`  ${new Date(f.start_timestamp ?? 0).toISOString()}  ${f.call_id}`);
    line('from -> to', `${redact(f.from_number)} -> ${redact(f.to_number)}`);
    line('destination', dest + flag);
    line('agent', `${f.agent_id ?? '?'} @ v${f.agent_version ?? '?'}`);
    line('duration', `${secs}s (${Math.floor(secs / 60)}m${String(secs % 60).padStart(2, '0')}s)`);
    line('disconnection_reason', f.disconnection_reason ?? '?');
    line('combined_cost', cost === undefined ? '(absent)' : `${cost} (Retell cost units)`);
    line('cost breakdown', f.call_cost?.product_costs ? f.call_cost.product_costs.map((p) => `${p.product}:${p.cost}`).join(' ') : '(absent)');
    console.log('');
  }
  console.log(`  TOTAL combined_cost across window: ${total}`);
}

console.log('\nRECON COMPLETE — read-only, no writes issued.');
