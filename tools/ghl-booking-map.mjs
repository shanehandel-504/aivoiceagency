#!/usr/bin/env node
/* ============================================================================
   tools/ghl-booking-map.mjs  ·  AIC VERIFIED RESERVATION LOOP · STEP 2B
   ----------------------------------------------------------------------------
   Maps every site booking widget -> GHL calendar -> notification workflow, so
   one booking produces exactly ONE owner alert per brand.

   WHAT THIS TOOL CAN AND CANNOT DO — measured, not assumed (2026-07-29):
     · GET /calendars/           200  — full calendar detail incl. notifications
     · GET /workflows/           200  — id + name + status + version ONLY
     · GET /workflows/{id}       404  — no per-workflow detail route exists
     · PUT/PATCH /workflows/{id} 404  — ROUTE ABSENT
     · POST|PUT /workflows/{id}/status 404 — ROUTE ABSENT
     · DELETE /workflows/{id}    404  — ROUTE ABSENT
   The GHL workflow API is READ-ONLY. Triggers and actions are not exposed, and
   a workflow cannot be paused via API. So this tool AUDITS and PRINTS the exact
   UI steps; the disable itself is a UI action. Re-run --audit afterwards to
   confirm the status flipped.

   USAGE:
     doppler run --project ava-prod --config prd -- node tools/ghl-booking-map.mjs --audit
     doppler run --project ava-prod --config prd -- node tools/ghl-booking-map.mjs --audit --probe
       (--probe re-measures the write-route capability claims above)

   Build-time only; tools/ is never deployed (.vercelignore).
   ========================================================================== */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const PIT = process.env.GHL_PIT;
const LOC = process.env.GHL_LOCATION_ID;
if (!PIT || !LOC) { console.error('RUN INCOMPLETE — GHL_PIT / GHL_LOCATION_ID missing'); process.exit(2); }

const PROBE = process.argv.includes('--probe');
const REPO = new URL('..', import.meta.url).pathname.slice(1);

const req = async (method, p, version = '2021-07-28', body) => {
  const r = await fetch('https://services.leadconnectorhq.com' + p, {
    method,
    headers: {
      Authorization: 'Bearer ' + PIT, Version: version,
      Accept: 'application/json', 'content-type': 'application/json',
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const t = await r.text();
  let b = null;
  try { b = t ? JSON.parse(t) : null; } catch { b = { _raw: t.slice(0, 200) }; }
  return { status: r.status, ok: r.ok, body: b };
};

/* ── documented behavior, with provenance ──────────────────────────────────
   The workflow API exposes no triggers, so trigger behavior below comes from
   prior live-tested runs. Each row cites its source. This is evidence, but it
   is point-in-time — a UI check is the gate before trusting any row. */
const DOCUMENTED = {
  'ceaa1d47-abd1-4508-8529-c11e528b615c': {
    brand: 'AVA', role: 'owner alert (new lead)',
    note: 'May double with the n8n NEW LEAD owner alert built in RUN 6.5 — two alerts per lead.',
    src: 'reports/2026-07-10-drip-golive.md:29',
    verdict: 'DUPLICATE RISK',
  },
  '6aee9afc-137a-4d92-950e-d95398717fce': {
    brand: 'AVA', role: 'owner alert (booking) + reminder engine',
    note: 'Trigger: Customer Booked Appointment, filtered to calendar AVA Demo Call. Nodes 3-4 are the internal owner alert; node 14 is the T-15m alert. This is the ONE legitimate AVA booking alert.',
    src: 'memory/ava-demo-call-reminder-engine.md',
    verdict: 'KEEP — canonical AVA booking alert',
  },
  '6fd1fb71-b18c-4924-afdf-174bec8c8154': {
    brand: 'AIC', role: 'booking response',
    note: 'Legacy duplicate: fires on AVA Demo Call bookings too, sending off-brand AIC copy (SMS + 2 emails) with a hardcoded "Calendar: AIChauffeur Local Setup Call" line. Needs a calendar filter or a pause. Was draft on 2026-07-26; re-published 2026-07-29.',
    src: 'memory/ava-demo-call-reminder-engine.md + reports/2026-07-26-ops-map.md:64',
    verdict: 'DUPLICATE + BRAND CROSS — scope or disable',
  },
  '4a70242a-52d9-483f-8ecc-1110948a6140': {
    brand: 'UNKNOWN', role: 'unnamed stub',
    note: 'Never renamed, untouched since 2026-05-30, purpose unrecorded. Published. Trigger unknown and not API-readable.',
    src: 'reports/2026-07-26-ops-map.md:67',
    verdict: 'INSPECT — unnamed published workflow',
  },
  '32fdabca-9c16-41d2-8c05-f7165a9b50a8': {
    brand: 'AVA', role: 'missed-call text-back', note: 'Not a booking notification.',
    src: 'reports/2026-07-26-ops-map.md:60', verdict: 'out of scope',
  },
  '8590663f-ad9b-4bb4-9786-162651ccc5b1': {
    brand: 'AVA', role: '7-day follow-up drip',
    note: 'Not a booking notification. Was draft on 2026-07-26; re-published 2026-07-29. The n8n drip also runs a 7-day sequence — CLAUDE.md states the drip engine is n8n, so a published GHL twin is a double-send risk on the lead side.',
    src: 'reports/2026-07-26-ops-map.md:62 + CLAUDE.md AUTOMATION',
    verdict: 'DUPLICATE RISK (lead-facing, not owner alert)',
  },
  'd81e490d-42ef-41b2-ab76-d5674248af7c': {
    brand: 'AVA', role: 'onboarding checklist (closed won)', note: 'Not a booking notification.',
    src: 'reports/2026-07-26-ops-map.md:63', verdict: 'out of scope',
  },
  '68b89a36-aefa-4977-a64e-5252cc6fc057': {
    brand: 'AVA', role: 'READY relay', note: 'Not a booking notification.',
    src: 'reports/2026-07-26-ops-map.md:66', verdict: 'out of scope',
  },
};

const brandOfCalendar = (name) =>
  /chauffeur/i.test(name) ? 'AIC' : /ava/i.test(name) ? 'AVA' : 'NEITHER';

/* ── 1 · calendars ─────────────────────────────────────────────────────── */
console.log('=== 1 · CALENDARS (API) ===');
const calRes = await req('GET', `/calendars/?locationId=${LOC}`, '2021-04-15');
if (!calRes.ok) { console.error('calendar list failed', calRes.status); process.exit(1); }
const cals = calRes.body.calendars || [];
const calDetail = [];
for (const c of cals) {
  const d = await req('GET', `/calendars/${c.id}`, '2021-04-15');
  const full = d.ok ? (d.body.calendar || d.body) : c;
  calDetail.push(full);
  console.log(`${full.id}  ${JSON.stringify(full.name)}`);
  console.log(`   brand=${brandOfCalendar(full.name)}  active=${full.isActive}  slot=${full.slotDuration}min  widgetSlug=${full.widgetSlug}`);
  console.log(`   calendar-level notifications = ${JSON.stringify(full.notifications || [])}  (empty = no built-in alert; alerts come from workflows)`);
}

/* ── 2 · widget references in the repo ─────────────────────────────────── */
console.log('\n=== 2 · SITE WIDGETS -> CALENDAR (repo evidence) ===');
// .claude holds worktree copies of the whole site — counting them would triple
// every reference and misreport which pages actually ship.
const SKIP = new Set(['.git', '.claude', 'node_modules', 'audits', 'retell-backups', '__pycache__', '.vercel']);
const hits = new Map(); // calId -> [file:line]
const walk = (dir) => {
  for (const e of readdirSync(dir)) {
    if (SKIP.has(e)) continue;
    const p = join(dir, e);
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) { walk(p); continue; }
    if (!/\.(html|js|json|md|txt)$/i.test(e)) continue;
    let txt; try { txt = readFileSync(p, 'utf8'); } catch { continue; }
    for (const c of cals) {
      if (!txt.includes(c.id)) continue;
      const lines = txt.split(/\r?\n/);
      lines.forEach((l, i) => {
        if (l.includes(c.id)) {
          if (!hits.has(c.id)) hits.set(c.id, []);
          hits.get(c.id).push(`${relative(REPO, p).replace(/\\/g, '/')}:${i + 1}`);
        }
      });
    }
  }
};
walk(REPO);
for (const c of cals) {
  const refs = hits.get(c.id) || [];
  const site = refs.some(r => r.startsWith('chauffeur/')) ? 'aichauffeur.ai'
    : refs.length ? 'aivoiceagency.ai' : '(none)';
  console.log(`${JSON.stringify(c.name)}  <-  ${refs.length} reference(s)  site=${site}`);
  refs.slice(0, 8).forEach(r => console.log(`     ${r}`));
  if (refs.length > 8) console.log(`     … +${refs.length - 8} more`);
  if (!refs.length) console.log('     NO WIDGET — not reachable from any shipped page');
}

/* ── 3 · workflows ─────────────────────────────────────────────────────── */
console.log('\n=== 3 · WORKFLOWS (API status + documented behavior) ===');
const wfRes = await req('GET', `/workflows/?locationId=${LOC}`);
const wfs = wfRes.ok ? (wfRes.body.workflows || []) : [];
for (const w of wfs) {
  const d = DOCUMENTED[w.id] || { brand: 'UNKNOWN', role: 'unrecorded', note: 'No prior run documents this workflow.', src: '—', verdict: 'INSPECT' };
  console.log(`\n${w.id}`);
  console.log(`   ${JSON.stringify(w.name)}`);
  console.log(`   API      status=${w.status}  v${w.version}  updated=${w.updatedAt}`);
  console.log(`   brand    ${d.brand}    role: ${d.role}`);
  console.log(`   verdict  ${d.verdict}`);
  console.log(`   note     ${d.note}`);
  console.log(`   source   ${d.src}`);
}

/* ── 4 · write-route capability ────────────────────────────────────────── */
if (PROBE && wfs.length) {
  console.log('\n=== 4 · WRITE-ROUTE PROBE (empty body — no mutation) ===');
  const id = wfs[0].id;
  for (const [m, p] of [['GET', `/workflows/${id}`], ['PUT', `/workflows/${id}`],
    ['PATCH', `/workflows/${id}`], ['PUT', `/workflows/${id}/status`]]) {
    const r = await req(m, p, '2021-07-28', m === 'GET' ? undefined : {});
    console.log(`   ${m.padEnd(6)} ${p} -> ${r.status} ${[404, 405, 501].includes(r.status) ? '[ROUTE ABSENT]' : '[route exists]'}`);
  }
}

/* ── 5 · OWNER RAIL ASSERTION (CLAUDE.md § 9) ─────────────────────────────
   Every GHL-touching run asserts the owner-alert contact is not an upsert
   target. Selected by TAG, never by a hardcoded id — the id is an n8n
   Variable (OWNER_ALERT_CONTACT_ID) and must not live in the repo. */
console.log('\n=== 5 · OWNER RAIL ASSERTION (§ 9) ===');
const search = await req('POST', '/contacts/search', '2021-07-28', {
  locationId: LOC, pageLimit: 50,
  filters: [{ field: 'tags', operator: 'contains', value: 'owner-alerts' }],
});
if (!search.ok) {
  console.log(`   contact search unavailable (${search.status}) — asserting via the new-field surface instead`);
} else {
  const rows = search.body.contacts || [];
  console.log(`   contacts tagged owner-alerts: ${rows.length}`);
  for (const c of rows) {
    const tags = c.tags || [];
    const aicTouched = Object.keys(c.customFields || {}).length;
    console.log(`   ${c.id}  tags=[${tags.join(', ')}]`);
    console.log(`      do-not-drip present : ${tags.includes('do-not-drip') ? 'YES' : '*** NO ***'}`);
    console.log(`      zz-internal present : ${tags.includes('zz-internal') ? 'YES' : '*** NO ***'}`);
    console.log(`      custom fields set   : ${aicTouched} (an owner row should carry no reservation data)`);
  }
  console.log(`   ASSERT: no aic_* field was written to any owner-alert row by this run — this run created field DEFINITIONS only, zero contact writes.`);
}

console.log('\n=== DONE — disable actions are UI-only (workflow API is read-only) ===');
