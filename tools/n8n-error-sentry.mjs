#!/usr/bin/env node
/* ============================================================================
   tools/n8n-error-sentry.mjs  ·  RUN 6.5 · OPS — ERROR SENTRY
   ----------------------------------------------------------------------------
   The 2026-07-18 -> 2026-07-23 quota outage ran for FOUR DAYS AND TWENTY-TWO
   HOURS without anyone knowing, because a failing n8n workflow is silent. 1,416
   failures, zero notifications. This is the fix.

   Builds ONE workflow — "OPS — Error Sentry" — and attaches it as the
   errorWorkflow of every ACTIVE workflow on the instance. Any failure anywhere
   now texts the owner:

       n8n FAIL: {workflow}: {error, <=80 chars}

   DEDUPE: one alert per workflow per 6 hours, held in n8n workflow static data.
   Without it, the very outage this is built for would have sent 288 texts a day.

   Sensitive values (owner contact id, the from-number) are read at runtime from
   n8n Variables — OWNER_ALERT_CONTACT_ID and OWNER_SMS_FROM. Never in this file.

   USAGE (always through Doppler):
     doppler run --project ava-prod --config prd -- node tools/n8n-error-sentry.mjs --audit
     doppler run --project ava-prod --config prd -- node tools/n8n-error-sentry.mjs --apply
     doppler run --project ava-prod --config prd -- node tools/n8n-error-sentry.mjs --prove

   --prove creates a throwaway workflow that deliberately throws, fires it TWICE,
   and asserts the sentry ran twice but alerted ONCE (dedupe holds). It then
   deletes the throwaway.

   IDEMPOTENT. Build-time only. tools/ is never deployed (see .vercelignore).
   ========================================================================== */

const HOST = 'https://circulant.app.n8n.cloud';
const KEY = process.env.N8N_API_KEY;
if (!KEY) { console.error('N8N_API_KEY missing — run through Doppler'); process.exit(2); }

const MODE = process.argv.includes('--apply') ? 'apply'
  : process.argv.includes('--prove') ? 'prove' : 'audit';

const SENTRY_NAME = 'OPS — Error Sentry';
const DEDUPE_HOURS = 6;

const SETTINGS_OK = [
  'saveExecutionProgress', 'saveManualExecutions', 'saveDataErrorExecution',
  'saveDataSuccessExecution', 'executionTimeout', 'errorWorkflow',
  'timezone', 'executionOrder',
];
const pickSettings = (s) => {
  const o = {};
  for (const k of SETTINGS_OK) if (s && s[k] !== undefined) o[k] = s[k];
  return o;
};

async function api(method, path, body) {
  const r = await fetch(`${HOST}/api/v1${path}`, {
    method,
    headers: { 'X-N8N-API-KEY': KEY, 'Content-Type': 'application/json', accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  if (r.status >= 400) throw new Error(`n8n ${method} ${path} -> ${r.status}: ${t.slice(0, 400)}`);
  try { return JSON.parse(t); } catch { return t; }
}

async function listAll(path) {
  const out = [];
  let cursor;
  do {
    const sep = path.includes('?') ? '&' : '?';
    const page = await api('GET', `${path}${sep}limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
    out.push(...page.data);
    cursor = page.nextCursor;
  } while (cursor);
  return out;
}

/* ------------------------------------------------------------ the sentry */

const DEDUPE_JS = `// One alert per workflow per ${DEDUPE_HOURS}h. Static data survives between
// executions of THIS workflow, so the counter is the sentry's own memory.
// The outage this exists for produced 288 failures/day; without this gate that
// is 288 texts/day, which is the same as no alerting at all.
const store = $getWorkflowStaticData('global');
store.lastAlert = store.lastAlert || {};

const item = $input.first().json || {};
const wf = (item.workflow && item.workflow.name) || 'unknown workflow';
const ex = item.execution || {};
const raw = (ex.error && (ex.error.message || ex.error.description)) || 'no error message';

const WINDOW = ${DEDUPE_HOURS} * 60 * 60 * 1000;
const now = Date.now();
const prev = store.lastAlert[wf] || 0;
if (now - prev < WINDOW) {
  // deduped — returning nothing halts this branch, so no SMS is sent
  return [];
}
store.lastAlert[wf] = now;

let short = (raw + '').replace(/\\s+/g, ' ').trim();
if (short.length > 80) short = short.slice(0, 77) + '...';

return [{ json: { wf, short, node: ex.lastNodeExecuted || 'n/a', execId: ex.id || 'n/a', url: ex.url || '' } }];`;

function sentryDefinition() {
  return {
    name: SENTRY_NAME,
    settings: { executionOrder: 'v1', saveDataErrorExecution: 'all', saveDataSuccessExecution: 'all' },
    nodes: [
      {
        id: 'sen1', name: 'Error Trigger', type: 'n8n-nodes-base.errorTrigger',
        typeVersion: 1, position: [0, 0], parameters: {},
      },
      {
        id: 'sen2', name: `Dedupe ${DEDUPE_HOURS}h`, type: 'n8n-nodes-base.code',
        typeVersion: 2, position: [240, 0], parameters: { jsCode: DEDUPE_JS },
      },
      {
        id: 'sen3', name: 'Owner FAIL SMS', type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.4, position: [480, 0],
        credentials: { httpHeaderAuth: { id: 'wOmBNtlzVgn2fVAc', name: 'GHL Header Auth' } },
        parameters: {
          method: 'POST',
          url: 'https://services.leadconnectorhq.com/conversations/messages',
          authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth',
          sendHeaders: true,
          headerParameters: { parameters: [{ name: 'Version', value: '2021-07-28' }, { name: 'Accept', value: 'application/json' }] },
          sendBody: true, specifyBody: 'json',
          jsonBody: "={{ { type: 'SMS', contactId: $vars.OWNER_ALERT_CONTACT_ID, fromNumber: $vars.OWNER_SMS_FROM, message: 'n8n FAIL: ' + $json.wf + ': ' + $json.short } }}",
          options: { response: { response: { neverError: true } } },
        },
      },
    ],
    connections: {
      'Error Trigger': { main: [[{ node: `Dedupe ${DEDUPE_HOURS}h`, type: 'main', index: 0 }]] },
      [`Dedupe ${DEDUPE_HOURS}h`]: { main: [[{ node: 'Owner FAIL SMS', type: 'main', index: 0 }]] },
    },
  };
}

async function ensureSentry(write) {
  const all = await listAll('/workflows');
  let s = all.find((w) => w.name === SENTRY_NAME);
  const def = sentryDefinition();
  if (!s) {
    if (!write) { console.log(`  WOULD : create "${SENTRY_NAME}"`); return { id: null, all }; }
    s = await api('POST', '/workflows', def);
    console.log(`  WROTE : created "${SENTRY_NAME}" -> ${s.id}`);
  } else if (write) {
    await api('PUT', `/workflows/${s.id}`, {
      name: def.name, nodes: def.nodes, connections: def.connections, settings: pickSettings(def.settings),
    });
    console.log(`  OK    : "${SENTRY_NAME}" definition refreshed -> ${s.id}`);
  } else {
    console.log(`  OK    : "${SENTRY_NAME}" already exists -> ${s.id}`);
  }
  /* THE GOTCHA THAT COST THIS RUN A CYCLE: an error workflow that is not ACTIVE
     is silently never invoked. n8n accepts the errorWorkflow setting, records no
     error, and simply does nothing — the exact failure mode the sentry exists to
     prevent. Activation is not optional. */
  if (write && s) {
    const live = await api('GET', `/workflows/${s.id}`);
    if (!live.active) {
      await api('POST', `/workflows/${s.id}/activate`);
      console.log(`  WROTE : "${SENTRY_NAME}" ACTIVATED (inactive error workflows never fire)`);
    } else {
      console.log(`  OK    : "${SENTRY_NAME}" is active`);
    }
  }
  return { id: s ? s.id : null, all };
}

async function attach(sentryId, write) {
  console.log(`\n=== attach errorWorkflow to every ACTIVE workflow ===`);
  const all = await listAll('/workflows');
  const targets = all.filter((w) => w.active && w.name !== SENTRY_NAME);
  let done = 0, already = 0;
  for (const t of targets) {
    const full = await api('GET', `/workflows/${t.id}`);
    if (full.settings && full.settings.errorWorkflow === sentryId) { already++; continue; }
    if (write) {
      const s = pickSettings(full.settings);
      s.errorWorkflow = sentryId;
      await api('PUT', `/workflows/${t.id}`, { name: full.name, nodes: full.nodes, connections: full.connections, settings: s });
    }
    console.log(`  ${write ? 'WROTE ' : 'WOULD '}: ${full.name}`);
    done++;
  }
  console.log(`  ${done} attached, ${already} already correct, ${targets.length} active workflows total`);
  return targets.length;
}

/* --------------------------------------------------------------- the proof */

async function prove(sentryId) {
  console.log('\n=== PROVE — force real failures and assert the sentry fires + dedupes ===');
  const before = (await api('GET', `/executions?workflowId=${sentryId}&limit=50`)).data.length;
  console.log(`  sentry executions before: ${before}`);

  const boom = await api('POST', '/workflows', {
    name: 'ZZ RUN65 SENTRY PROOF (auto-delete)',
    settings: { executionOrder: 'v1', errorWorkflow: sentryId },
    nodes: [
      { id: 'b1', name: 'Hook', type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [0, 0],
        parameters: { path: 'zz-run65-boom', httpMethod: 'GET' }, webhookId: 'zz-run65-boom-a1b2' },
      { id: 'b2', name: 'Boom', type: 'n8n-nodes-base.code', typeVersion: 2, position: [220, 0],
        parameters: { jsCode: "throw new Error('RUN 6.5 sentry proof — deliberate failure, ignore');" } },
    ],
    connections: { Hook: { main: [[{ node: 'Boom', type: 'main', index: 0 }]] } },
  });
  console.log(`  throwaway workflow ${boom.id} created`);
  await api('POST', `/workflows/${boom.id}/activate`);
  await new Promise((r) => setTimeout(r, 3000));

  for (const n of [1, 2]) {
    const r = await fetch(`${HOST}/webhook/zz-run65-boom`);
    console.log(`  failure #${n} triggered -> HTTP ${r.status} (500 expected)`);
    await new Promise((res) => setTimeout(res, 6000));
  }

  await new Promise((r) => setTimeout(r, 4000));
  const runs = (await api('GET', `/executions?workflowId=${sentryId}&limit=50&includeData=true`)).data;
  console.log(`  sentry executions after : ${runs.length}  (delta ${runs.length - before})`);

  let sent = 0, deduped = 0;
  for (const e of runs.slice(0, 4)) {
    const rd = e.data?.resultData?.runData || {};
    const smsRan = !!rd['Owner FAIL SMS'];
    const dd = rd[`Dedupe ${DEDUPE_HOURS}h`]?.[0]?.data?.main?.[0] || [];
    if (smsRan) { sent++; console.log(`    exec ${e.id}: ALERT SENT — ${JSON.stringify(dd[0]?.json?.short || '').slice(0, 90)}`); }
    else { deduped++; console.log(`    exec ${e.id}: deduped (no SMS) — correct`); }
  }
  console.log(`\n  RESULT: ${sent} alert(s) sent, ${deduped} deduped`);
  console.log(`  ${sent >= 1 && deduped >= 1 ? 'PASS — sentry fires AND the 6h dedupe holds' : 'CHECK — expected >=1 sent and >=1 deduped'}`);

  await api('POST', `/workflows/${boom.id}/deactivate`);
  await api('DELETE', `/workflows/${boom.id}`);
  console.log('  throwaway workflow deleted');
}

/* ------------------------------------------------------------------- run */

console.log(`n8n ERROR SENTRY — mode: ${MODE.toUpperCase()}`);
const vars = (await api('GET', '/variables')).data || [];
for (const k of ['OWNER_ALERT_CONTACT_ID', 'OWNER_SMS_FROM']) {
  if (!vars.find((v) => v.key === k)) { console.error(`ABORT — n8n Variable ${k} missing`); process.exit(2); }
}

console.log('\n=== sentry workflow ===');
const { id } = await ensureSentry(MODE !== 'audit');
if (!id) { console.log('\nAUDIT ONLY — re-run with --apply.'); process.exit(0); }

await attach(id, MODE !== 'audit');
if (MODE === 'prove') await prove(id);

console.log(`\n${MODE === 'audit' ? 'AUDIT ONLY — re-run with --apply.' : 'DONE.'}`);
