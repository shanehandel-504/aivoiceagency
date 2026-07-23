#!/usr/bin/env node
/* ============================================================================
   tools/n8n-quota-hygiene.mjs  ·  RUN 1.6 · QUOTA HYGIENE
   ----------------------------------------------------------------------------
   The 2026-07-18 -> 2026-07-23 outage was a PLAN QUOTA exhaustion, not a bug
   (see reports/2026-07-22-outage-recovery.md). Two workflows firing every 10
   minutes burn 8,640 executions/month between them, which is most of a 10,000
   allowance before a single customer touches anything.

   This tool:
     --audit  list every ACTIVE workflow + every schedule trigger + its interval,
              compute projected monthly executions, flag anything under 30 min.
     --fix    retune every sub-30-minute schedule trigger to 30 minutes.
              IDEMPOTENT: a trigger already at >=30 min is left untouched, and
              re-running after a fix is a no-op.
     --stats  execution success/fail counts since the PRO upgrade.

   USAGE (always through Doppler):
     doppler run --project ava-prod --config prd -- node tools/n8n-quota-hygiene.mjs --audit

   Build-time only. tools/ is never deployed (see .vercelignore).
   ========================================================================== */

const HOST = 'https://circulant.app.n8n.cloud';
const KEY = process.env.N8N_API_KEY;
const TARGET_MIN = 30;          // floor, in minutes
const QUOTA = 10000;            // plan allowance / month
const HEADROOM = 0.30;          // must land >=30% under the cap

if (!KEY) {
  console.error('N8N_API_KEY missing. Run through: doppler run --project ava-prod --config prd -- node tools/n8n-quota-hygiene.mjs --audit');
  process.exit(1);
}

async function api(method, path, body) {
  const r = await fetch(HOST + '/api/v1' + path, {
    method,
    headers: { 'X-N8N-API-KEY': KEY, 'Content-Type': 'application/json', accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const txt = await r.text();
  let json; try { json = txt ? JSON.parse(txt) : {}; } catch { json = { raw: txt }; }
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status} ${txt.slice(0, 400)}`);
  return json;
}

async function listAll(path) {
  let out = [], cursor;
  do {
    const q = path + (path.includes('?') ? '&' : '?') + 'limit=250' + (cursor ? `&cursor=${cursor}` : '');
    const page = await api('GET', q);
    out = out.concat(page.data || []);
    cursor = page.nextCursor;
  } while (cursor);
  return out;
}

/* ------------------------------------------------------- interval decoding -- */
/* A scheduleTrigger holds rule.interval[] — each entry is one firing rule.
   Shapes: {field:'seconds',secondsInterval:N} {field:'minutes',minutesInterval:N}
           {field:'hours',hoursInterval:N} {field:'days'|'weeks'|'months',...}
           {field:'cronExpression',expression:'...'}
   Returns minutes, or null when it cannot be decided (cron). */
function intervalMinutes(entry) {
  const f = entry.field || 'days';
  if (f === 'seconds') return (entry.secondsInterval ?? 30) / 60;
  if (f === 'minutes') return entry.minutesInterval ?? 5;
  if (f === 'hours') return (entry.hoursInterval ?? 1) * 60;
  if (f === 'days') return (entry.daysInterval ?? 1) * 1440;
  if (f === 'weeks') return (entry.weeksInterval ?? 1) * 10080;
  if (f === 'months') return (entry.monthsInterval ?? 1) * 43200;
  return null; // cronExpression — report, never auto-rewrite
}

function describe(entry) {
  const f = entry.field || 'days';
  if (f === 'cronExpression') return `cron "${entry.expression}"`;
  const n = entry[f.replace(/s$/, '') + 'sInterval'] ?? entry[f + 'Interval'];
  return `every ${n ?? '?'} ${f}`;
}

const perMonth = (min) => (min ? Math.round((43200 / min)) : 0);

/* The only settings keys PUT /workflows/{id} accepts. Anything else 400s. */
const SETTINGS_OK = [
  'saveExecutionProgress', 'saveManualExecutions', 'saveDataErrorExecution',
  'saveDataSuccessExecution', 'executionTimeout', 'errorWorkflow',
  'timezone', 'executionOrder',
];
function pickSettings(s) {
  const out = {};
  for (const k of SETTINGS_OK) if (s && s[k] !== undefined) out[k] = s[k];
  return out;
}

/* --------------------------------------------------------------------- run -- */

const mode = process.argv[2] || '--audit';
const wfs = await listAll('/workflows?active=true');

if (mode === '--audit' || mode === '--fix') {
  console.log(`=== n8n ACTIVE WORKFLOWS (${wfs.length}) ===\n`);

  let totalBefore = 0, totalAfter = 0;
  const changes = [];

  for (const wf of wfs) {
    const full = await api('GET', `/workflows/${wf.id}`);
    const nodes = full.nodes || [];
    const sched = nodes.filter((n) => /scheduleTrigger|\bCron\b/i.test(n.type));
    const trig = nodes.filter((n) => /trigger|webhook/i.test(n.type)).map((n) => n.type.split('.').pop());

    console.log(`${wf.name}`);
    console.log(`  id      : ${wf.id}`);
    console.log(`  nodes   : ${nodes.length}   triggers: ${[...new Set(trig)].join(', ') || 'none'}`);

    if (!sched.length) {
      console.log(`  SCHEDULE: none — event-driven, costs nothing on a timer\n`);
      continue;
    }

    let dirty = false;
    for (const node of sched) {
      const rules = (node.parameters?.rule?.interval) || [];
      for (const entry of rules) {
        const before = intervalMinutes(entry);
        const beforeDesc = describe(entry);

        if (before === null) {
          console.log(`  SCHEDULE: ${beforeDesc} — CRON, not auto-retuned (manual review)`);
          continue;
        }

        totalBefore += perMonth(before);

        if (before < TARGET_MIN) {
          if (mode === '--fix') {
            // Collapse whatever shape it was into a clean minutes rule.
            for (const k of Object.keys(entry)) delete entry[k];
            entry.field = 'minutes';
            entry.minutesInterval = TARGET_MIN;
            dirty = true;
          }
          totalAfter += perMonth(TARGET_MIN);
          changes.push({ wf: wf.name, id: wf.id, before: beforeDesc, beforeMin: before, after: `every ${TARGET_MIN} minutes` });
          console.log(`  SCHEDULE: ${beforeDesc}  [${perMonth(before).toLocaleString()}/mo]  -> UNDER ${TARGET_MIN}min ` +
                      `${mode === '--fix' ? '· RETUNED to 30 minutes' : '· NEEDS RETUNE'}`);
        } else {
          totalAfter += perMonth(before);
          console.log(`  SCHEDULE: ${beforeDesc}  [${perMonth(before).toLocaleString()}/mo]  · OK (>= ${TARGET_MIN}min)`);
        }
      }
    }

    if (dirty && mode === '--fix') {
      // PUT requires a trimmed body — n8n rejects read-only props, AND rejects
      // any settings key outside its own schema ("must NOT have additional
      // properties"). The UI writes keys the public API will not accept back
      // (availableInMCP, binaryMode), so settings is whitelisted, not echoed.
      await api('PUT', `/workflows/${wf.id}`, {
        name: full.name,
        nodes: full.nodes,
        connections: full.connections,
        settings: pickSettings(full.settings),
      });
      console.log(`  WROTE   : workflow updated`);
    }
    console.log('');
  }

  console.log('=== PROJECTED MONTHLY EXECUTION MATH (schedule triggers only) ===');
  console.log(`  BEFORE : ${totalBefore.toLocaleString()} / ${QUOTA.toLocaleString()}`);
  console.log(`  AFTER  : ${totalAfter.toLocaleString()} / ${QUOTA.toLocaleString()}`);
  const headroom = 1 - totalAfter / QUOTA;
  console.log(`  HEADROOM: ${(headroom * 100).toFixed(1)}%  (need >= ${HEADROOM * 100}%)  -> ${headroom >= HEADROOM ? 'PASS' : 'FAIL'}`);
  if (changes.length) {
    console.log('\n  RETUNES:');
    for (const c of changes) console.log(`   · ${c.wf}: ${c.before} -> ${c.after}`);
  } else {
    console.log('\n  RETUNES: none needed — already clean (idempotent no-op)');
  }
  process.exit(0);
}

if (mode === '--stats') {
  const execs = await listAll('/executions?includeData=false');
  const byStatus = {};
  const byWf = {};
  let newest = null, oldest = null;

  for (const e of execs) {
    const s = e.status || 'unknown';
    byStatus[s] = (byStatus[s] || 0) + 1;
    const k = e.workflowName || e.workflowId;
    byWf[k] = byWf[k] || { success: 0, error: 0, other: 0 };
    if (s === 'success') byWf[k].success++;
    else if (s === 'error' || s === 'crashed') byWf[k].error++;
    else byWf[k].other++;
    const t = e.startedAt || e.createdAt;
    if (t) { if (!newest || t > newest) newest = t; if (!oldest || t < oldest) oldest = t; }
  }

  console.log(`=== EXECUTION STATS — ${execs.length} retained executions ===`);
  console.log(`  window: ${oldest} -> ${newest}\n`);
  console.log('  BY STATUS (whole retained window, includes the outage):');
  for (const [s, n] of Object.entries(byStatus).sort((a, b) => b[1] - a[1])) console.log(`   · ${s}: ${n}`);
  console.log('\n  BY WORKFLOW (whole retained window):');
  for (const [w, c] of Object.entries(byWf).sort((a, b) => (b[1].success + b[1].error) - (a[1].success + a[1].error))) {
    console.log(`   · ${w}: ${c.success} success / ${c.error} error / ${c.other} other`);
  }

  /* The retained window straddles the 4d22h quota outage, so a raw total reads
     as catastrophic even when everything is healthy now. Split on the PRO
     recovery so "is it working TODAY" is answerable. */
  const SINCE = process.argv[3] || '2026-07-23T02:40:00.000Z';
  const after = execs.filter((e) => (e.startedAt || e.createdAt || '') >= SINCE);
  const aStat = {}, aWf = {};
  for (const e of after) {
    const s = e.status || 'unknown';
    aStat[s] = (aStat[s] || 0) + 1;
    const k = e.workflowName || e.workflowId;
    aWf[k] = aWf[k] || { success: 0, error: 0 };
    if (s === 'success') aWf[k].success++; else aWf[k].error++;
  }
  console.log(`\n=== SINCE PRO UPGRADE / RECOVERY (${SINCE}) — ${after.length} executions ===`);
  console.log('  BY STATUS:');
  for (const [s, n] of Object.entries(aStat).sort((a, b) => b[1] - a[1])) console.log(`   · ${s}: ${n}`);
  console.log('  BY WORKFLOW:');
  for (const [w, c] of Object.entries(aWf).sort((a, b) => (b[1].success + b[1].error) - (a[1].success + a[1].error))) {
    const tot = c.success + c.error;
    console.log(`   · ${w}: ${c.success}/${tot} success (${((c.success / tot) * 100).toFixed(0)}%)${c.error ? ` — ${c.error} error` : ''}`);
  }
  const okRate = after.length ? (aStat.success || 0) / after.length : 0;
  console.log(`\n  RECOVERY VERDICT: ${(okRate * 100).toFixed(1)}% success since recovery -> ` +
              `${okRate >= 0.9 ? 'HEALTHY — quota outage is over' : 'DEGRADED — investigate'}`);
  process.exit(0);
}

console.error(`unknown mode ${mode} — use --audit | --fix | --stats`);
process.exit(1);
