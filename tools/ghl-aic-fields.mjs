#!/usr/bin/env node
/* ============================================================================
   tools/ghl-aic-fields.mjs  ·  AIC VERIFIED RESERVATION LOOP · STEP 2
   ----------------------------------------------------------------------------
   Creates the 23 aic_* contact custom fields and the "AI Chauffeur
   Reservations" pipeline on the AI Voice Agency location.

   WHY THE TYPES ARE WHAT THEY ARE:
     · Enums are TEXT, not SINGLE_OPTIONS. An automated write of an enum into a
       GHL options field fails when the option string does not match exactly —
       a silent data loss on the one field a chauffeur depends on.
     · aic_pickup_datetime is TEXT, not DATE. A GHL DATE field drops the time
       and the timezone. Pickup time IS the job; it stores whole.
     · aic_consent is TEXT ("true"/"false"). GHL has no boolean; CHECKBOX needs
       option matching, which is the same trap as the enums.

   USAGE:
     doppler run --project ava-prod --config prd -- node tools/ghl-aic-fields.mjs --audit
     doppler run --project ava-prod --config prd -- node tools/ghl-aic-fields.mjs --apply
     doppler run --project ava-prod --config prd -- node tools/ghl-aic-fields.mjs --apply --only aic_trip_type

   IDEMPOTENT — matches on fieldKey, never creates a duplicate.
   Build-time only; tools/ is never deployed (.vercelignore).
   ========================================================================== */

const PIT = process.env.GHL_PIT;
const LOC = process.env.GHL_LOCATION_ID;
if (!PIT || !LOC) { console.error('RUN INCOMPLETE — GHL_PIT / GHL_LOCATION_ID missing'); process.exit(2); }

const MODE = process.argv.includes('--apply') ? 'apply' : 'audit';
const ONLY = (() => { const i = process.argv.indexOf('--only'); return i > -1 ? process.argv[i + 1] : null; })();

// 23 fields, in brief order.
const FIELDS = [
  ['aic_trip_type', 'TEXT'],
  ['aic_pickup_datetime', 'TEXT'],
  ['aic_pickup_address', 'TEXT'],
  ['aic_dropoff_address', 'TEXT'],
  ['aic_stops', 'LARGE_TEXT'],
  ['aic_pax_count', 'NUMERICAL'],
  ['aic_luggage_count', 'NUMERICAL'],
  ['aic_vehicle_class', 'TEXT'],
  ['aic_hours_booked', 'NUMERICAL'],
  ['aic_airline', 'TEXT'],
  ['aic_flight_number', 'TEXT'],
  ['aic_meet_style', 'TEXT'],
  ['aic_special_notes', 'LARGE_TEXT'],
  ['aic_booker_name', 'TEXT'],
  ['aic_booker_company', 'TEXT'],
  ['aic_billing_type', 'TEXT'],
  ['aic_intake_id', 'TEXT'],
  ['aic_call_id', 'TEXT'],
  ['aic_recording_url', 'TEXT'],
  ['aic_crm_status', 'TEXT'],
  ['aic_payload_hash', 'TEXT'],
  ['aic_consent', 'TEXT'],
  ['aic_tenant', 'TEXT'],
];

const PIPELINE = {
  name: 'AI Chauffeur Reservations',
  stages: ['Demo Call Taken', 'CRM Verified', 'Ticket Sent', 'Follow-Up', 'Client Signed'],
};

const req = async (method, p, body, version = '2021-07-28') => {
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
  try { b = t ? JSON.parse(t) : null; } catch { b = { _raw: t.slice(0, 300) }; }
  return { status: r.status, ok: r.ok, body: b };
};

const norm = (k) => String(k || '').replace(/^contact\./, '');

console.log(`=== ghl-aic-fields · ${MODE.toUpperCase()} · location ${LOC} ===`);

const loc = await req('GET', `/locations/${LOC}`);
if (!loc.ok) { console.error('location read failed', loc.status); process.exit(1); }
console.log(`location: ${JSON.stringify((loc.body.location || loc.body).name)}\n`);

// ---------- custom fields ----------
const existingRes = await req('GET', `/locations/${LOC}/customFields?model=contact`);
if (!existingRes.ok) { console.error('field list failed', existingRes.status); process.exit(1); }
let existing = existingRes.body.customFields || [];
const byKey = new Map(existing.map(f => [norm(f.fieldKey), f]));

const created = [];
const already = [];
let failed = 0;

for (const [key, dataType] of FIELDS) {
  if (ONLY && key !== ONLY) continue;
  const hit = byKey.get(key);
  if (hit) {
    already.push([key, hit.id, hit.dataType]);
    console.log(`EXISTS  ${key.padEnd(22)} ${hit.id}  ${hit.dataType}`);
    continue;
  }
  if (MODE === 'audit') {
    console.log(`MISSING ${key.padEnd(22)} would create as ${dataType}`);
    continue;
  }
  const res = await req('POST', `/locations/${LOC}/customFields`, {
    name: key, dataType, model: 'contact',
  });
  if (res.ok) {
    const f = res.body.customField || res.body;
    created.push([key, f.id, f.dataType, norm(f.fieldKey)]);
    const keyOk = norm(f.fieldKey) === key;
    console.log(`CREATED ${key.padEnd(22)} ${f.id}  ${f.dataType}  fieldKey=${f.fieldKey} ${keyOk ? 'OK' : '*** KEY MISMATCH ***'}`);
  } else {
    failed++;
    console.log(`FAIL    ${key.padEnd(22)} ${res.status} ${JSON.stringify(res.body).slice(0, 200)}`);
  }
}

// ---------- pipeline ----------
console.log('\n=== PIPELINE ===');
const pls = await req('GET', `/opportunities/pipelines?locationId=${LOC}`);
const found = (pls.ok ? (pls.body.pipelines || []) : []).find(p => p.name === PIPELINE.name);
if (found) {
  console.log(`EXISTS  ${JSON.stringify(PIPELINE.name)}  ${found.id}`);
  console.log(`        stages: ${(found.stages || []).map(s => s.name).join(' > ')}`);
} else if (MODE === 'audit') {
  console.log(`MISSING ${JSON.stringify(PIPELINE.name)} — apply will probe POST capability`);
} else {
  const attempt = await req('POST', '/opportunities/pipelines', {
    locationId: LOC, name: PIPELINE.name,
    stages: PIPELINE.stages.map((n, i) => ({ name: n, position: i })),
  });
  if (attempt.ok) {
    const p = attempt.body.pipeline || attempt.body;
    console.log(`CREATED ${JSON.stringify(PIPELINE.name)}  ${p.id}`);
  } else {
    console.log(`PIPELINE API-BLOCKED — POST /opportunities/pipelines -> ${attempt.status}`);
    console.log(`  ${JSON.stringify(attempt.body).slice(0, 240)}`);
    console.log(`
  60-SECOND UI STEPS (Shane):
    1. GHL -> Opportunities -> Pipelines -> + Add Pipeline
    2. Name it exactly:  ${PIPELINE.name}
    3. Add these 5 stages in this order:
${PIPELINE.stages.map((s, i) => `         ${i + 1}. ${s}`).join('\n')}
    4. Save. Then re-run this tool with --audit to capture the pipeline id.`);
  }
}

// ---------- summary ----------
console.log('\n=== SUMMARY ===');
console.log(`fields already present : ${already.length}`);
console.log(`fields created         : ${created.length}`);
console.log(`fields failed          : ${failed}`);
if (created.length) {
  console.log('\n--- CREATED FIELD IDS (for the architect / n8n) ---');
  for (const [k, id] of created) console.log(`${k.padEnd(22)} ${id}`);
}
if (MODE === 'apply') {
  const after = await req('GET', `/locations/${LOC}/customFields?model=contact`);
  const keys = new Set((after.body.customFields || []).map(f => norm(f.fieldKey)));
  const missing = FIELDS.map(([k]) => k).filter(k => !keys.has(k));
  console.log(`\nreadback: ${23 - missing.length}/23 aic_* fields present on the location`);
  if (missing.length) console.log('still missing: ' + missing.join(', '));
}
process.exit(failed ? 1 : 0);
