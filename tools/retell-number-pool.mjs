#!/usr/bin/env node
/* ============================================================================
   tools/retell-number-pool.mjs  ·  RUN 1 · HEAR AVA LIVE
   ----------------------------------------------------------------------------
   Buys and wires the 5-number DEMO POOL.

     OUTBOUND — the n8n dispatch node round-robins across these numbers so no
                single line carries the whole demo volume.
     INBOUND  — SNOWSHOE FIX: every pool number answers. Inbound is routed to
                the live AVA SALES agent, so a prospect who calls a pool number
                back reaches a real agent instead of a dead outbound-only ghost.
                Outbound-only numbers are exactly what carriers score as
                snowshoe spam.

   COSTS MONEY. Each number is a recurring Retell charge. --buy is guarded
   behind an explicit count and prints the bill before it runs.

   USAGE:
     doppler run --project ava-prod --config prd -- node tools/retell-number-pool.mjs --list
     doppler run --project ava-prod --config prd -- node tools/retell-number-pool.mjs --buy 5
     doppler run --project ava-prod --config prd -- node tools/retell-number-pool.mjs --rewire
   ========================================================================== */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const API = 'https://api.retellai.com';
const KEY = process.env.RETELL_API_KEY;
if (!KEY) { console.error('RETELL_API_KEY missing — run through doppler.'); process.exit(1); }

/* The live AVA SALES agent. Inbound on every pool number lands here. */
const INBOUND_AGENT = 'agent_d5ada9f774fe3ae7f034d2c677';
const AREA_CODE = 414;                      // Wisconsin, matches the brand line
const POOL_FILE = join(ROOT, 'automation', 'number-pool.json');
const AGENT_FILE = join(ROOT, 'automation', 'retell-agent-config.json');

const demoAgent = existsSync(AGENT_FILE)
  ? JSON.parse(readFileSync(AGENT_FILE, 'utf8')).agents.brand.agent_id
  : null;

async function call(method, path, body) {
  const r = await fetch(API + path, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const txt = await r.text();
  let j; try { j = txt ? JSON.parse(txt) : {}; } catch { j = { raw: txt }; }
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status} ${txt.slice(0, 400)}`);
  return j;
}

/* The API returns agent bindings as weighted ARRAYS (inbound_agents /
   outbound_agents) even though create/update take the singular *_agent_id. */
const agentsOf = (arr) => (Array.isArray(arr) && arr.length) ? arr.map(a => a.agent_id).join(',') : '-';
const BIND = (id) => ({ agent_id: id, agent_version: 'latest_published', weight: 1 });

const mode = process.argv[2] || '--list';

/* ------------------------------------------------------------------ list -- */
if (mode === '--list') {
  const nums = await call('GET', '/list-phone-numbers');
  console.log(`phone numbers on the account: ${nums.length}`);
  for (const n of nums) {
    console.log(`  ${n.phone_number}  nick=${n.nickname || '-'}  in=${agentsOf(n.inbound_agents)}  out=${agentsOf(n.outbound_agents)}`);
  }
  process.exit(0);
}

/* ------------------------------------------------------------------- buy -- */
if (mode === '--buy') {
  const want = parseInt(process.argv[3] || '0', 10);
  if (!want || want < 1 || want > 10) { console.error('pass a count 1-10, e.g. --buy 5'); process.exit(1); }
  if (!demoAgent) { console.error('automation/retell-agent-config.json missing — create the agents first.'); process.exit(1); }

  const existing = await call('GET', '/list-phone-numbers');
  const already = existing.filter(n => (n.nickname || '').startsWith('DEMO-POOL-'));
  if (already.length) {
    console.log(`DEMO-POOL numbers already exist (${already.length}). Refusing to double-buy.`);
    already.forEach(n => console.log(`  ${n.phone_number} ${n.nickname}`));
    process.exit(1);
  }

  console.log(`Buying ${want} numbers in area code ${AREA_CODE}. This is a recurring charge.`);
  const pool = [];
  for (let i = 1; i <= want; i++) {
    const nickname = `DEMO-POOL-${String(i).padStart(2, '0')}`;
    const n = await call('POST', '/create-phone-number', {
      area_code: AREA_CODE,
      nickname,
      // Weighted-array form. The singular inbound_agent_id / outbound_agent_id
      // fields were deprecated 2026-03-31 and now hard-fail with a 400.
      inbound_agents: [BIND(INBOUND_AGENT)],   // snowshoe fix — always answers
      outbound_agents: [BIND(demoAgent)]       // HEAR-IT-LIVE demo agent
    });
    pool.push({ slot: i, nickname, phone_number: n.phone_number });
    console.log(`  ${nickname}  ${n.phone_number}`);
  }
  writePool(pool);
  process.exit(0);
}

/* ---------------------------------------------------------------- rewire -- */
if (mode === '--rewire') {
  const nums = (await call('GET', '/list-phone-numbers')).filter(n => (n.nickname || '').startsWith('DEMO-POOL-'));
  for (const n of nums) {
    await call('PATCH', `/update-phone-number/${encodeURIComponent(n.phone_number)}`, {
      inbound_agents: [BIND(INBOUND_AGENT)],
      outbound_agents: [BIND(demoAgent)]
    });
    console.log(`rewired ${n.nickname} ${n.phone_number}`);
  }
  writePool(nums.map((n, i) => ({ slot: i + 1, nickname: n.nickname, phone_number: n.phone_number })));
  process.exit(0);
}

function writePool(pool) {
  mkdirSync(dirname(POOL_FILE), { recursive: true });
  const doc = {
    pool: 'AVA DEMO POOL',
    run: 'RUN 1 · HEAR AVA LIVE',
    written_at: new Date().toISOString(),
    note: 'INTERNAL ONLY. These numbers must never appear on a public page, in schema, or in marketing copy. The only public voice line is 414-240-8930 (CLAUDE.md · PHONE).',
    outbound_agent_id: demoAgent,
    outbound_strategy: 'round-robin in the n8n LIVE INTAKE dispatch node',
    inbound_agent_id: INBOUND_AGENT,
    inbound_strategy: 'every pool number answers -> AVA SALES (snowshoe fix, no outbound-only ghosts)',
    numbers: pool
  };
  writeFileSync(POOL_FILE, JSON.stringify(doc, null, 2) + '\n', 'utf8');
  console.log(`\nwrote ${POOL_FILE.replace(ROOT, '.')}`);
}
