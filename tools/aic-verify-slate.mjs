#!/usr/bin/env node
/* ============================================================================
   tools/aic-verify-slate.mjs  ·  AIC VERIFIED RESERVATION LOOP · STEP 3
   ----------------------------------------------------------------------------
   Drives the four trip types plus the failure cases through write_reservation
   and then INDEPENDENTLY reads each claimed record back out of GHL. The loop is
   only "verified" if the CRM agrees with what the endpoint said.

   SAFETY: every caller_phone is in the NANP-reserved 555-01xx fictional range,
   which cannot ring a real person (same guard RUN 1.7 used). Records carry a
   ZZ-TEST marker in special_notes so they are identifiable and deletable.

   WHAT THIS DOES NOT TEST: conversational behavior. Retell exposes no
   API-key-accessible text simulation — /simulate-conversation is 401 Invalid JWT
   (dashboard-only), and the alternatives place a real call or need a browser
   WebRTC client. Mid-call correction, readback protocol, latency cover and the
   ACT 2 tour are PROMPT-level behaviors and remain unproven until a real dial.

   NOT IDEMPOTENT. Every run creates up to 6 new GHL contacts. Delete the ones
   from the previous run before re-running, or the CRM fills with test rows.

   USAGE:
     doppler run --project ava-prod --config prd -- node tools/aic-verify-slate.mjs
   ========================================================================== */

const FN = 'https://circulant.app.n8n.cloud/webhook/aic-write-reservation';
const PIT = process.env.GHL_PIT;
const LOC = process.env.GHL_LOCATION_ID;

const MARK = 'ZZ-TEST STEP3 SLATE';

const base = {
  caller_last: 'Testcase', caller_email: '', luggage_count: 2,
  consent: true, special_notes: MARK,
};

const CASES = [
  { id: 'A · AIRPORT_ARR', expect: 'WRITTEN', p: { ...base,
    trip_type: 'AIRPORT_ARR', caller_first: 'Airport', caller_phone: '+14145550101',
    pax_count: 3, vehicle_class: 'SUV',
    pickup_address: 'MKE General Mitchell Intl, Baggage Claim 4',
    dropoff_address: '875 E Wisconsin Ave, Milwaukee, WI',
    pickup_date: '2026-08-04', pickup_time: '14:30',
    airline: 'Delta', flight_number: 'DL2214', meet_style: 'BAGGAGE' } },

  { id: 'B · P2P', expect: 'WRITTEN', p: { ...base,
    trip_type: 'P2P', caller_first: 'Pointto', caller_phone: '+14145550102',
    pax_count: 2, vehicle_class: 'SEDAN',
    pickup_address: '1787 Edgewood Road, Kewaskum, WI 53040',
    dropoff_address: 'O\'Hare Intl Airport, Terminal 3, Chicago, IL',
    pickup_date: '2026-08-05', pickup_time: '06:15' } },

  { id: 'C · HOURLY', expect: 'WRITTEN', p: { ...base,
    trip_type: 'HOURLY', caller_first: 'Hourly', caller_phone: '+14145550103',
    pax_count: 6, vehicle_class: 'STRETCH',
    pickup_address: '200 E Wells St, Milwaukee, WI',
    dropoff_address: '', hours_booked: 5,
    pickup_date: '2026-08-08', pickup_time: '18:00' } },

  { id: 'D · ROADSHOW', expect: 'WRITTEN', p: { ...base,
    trip_type: 'ROADSHOW', caller_first: 'Roadshow', caller_phone: '+14145550104',
    pax_count: 4, vehicle_class: 'SPRINTER',
    pickup_address: '833 E Michigan St, Milwaukee, WI',
    dropoff_address: '411 E Wisconsin Ave, Milwaukee, WI', hours_booked: 8,
    pickup_date: '2026-08-11', pickup_time: '08:00' } },

  { id: 'E · FAIL missing flight', expect: 'REJECT_OR_FLAG', p: { ...base,
    trip_type: 'AIRPORT_ARR', caller_first: 'Noflight', caller_phone: '+14145550105',
    pax_count: 1, vehicle_class: 'SEDAN',
    pickup_address: 'MKE General Mitchell Intl',
    pickup_date: '2026-08-12', pickup_time: '09:00',
    airline: '', flight_number: '', meet_style: '' } },

  { id: 'F · FAIL vague address', expect: 'REJECT_OR_FLAG', p: { ...base,
    trip_type: 'P2P', caller_first: 'Vague', caller_phone: '+14145550106',
    pax_count: 2, vehicle_class: 'SEDAN',
    pickup_address: 'somewhere downtown', dropoff_address: 'the usual place',
    pickup_date: '2026-08-13', pickup_time: '10:00' } },

  { id: 'G · FAIL nothing captured', expect: 'REJECT', p: { consent: false } },
];

const post = async (p) => {
  const r = await fetch(FN, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p),
  });
  const t = await r.text();
  let b = null; try { b = JSON.parse(t); } catch { b = { _raw: t.slice(0, 200) }; }
  return { status: r.status, body: b };
};

const ghl = async (p) => {
  const r = await fetch('https://services.leadconnectorhq.com' + p, {
    headers: { Authorization: 'Bearer ' + PIT, Version: '2021-07-28', Accept: 'application/json' },
  });
  const t = await r.text();
  let b = null; try { b = JSON.parse(t); } catch { b = null; }
  return { status: r.status, ok: r.ok, body: b };
};

// Language the endpoint must never use — a capture is not a confirmed booking.
const PREMATURE = /\b(booked|confirmed|guaranteed|payment required)\b/i;

let fail = 0;
const ck = (n, c, d = '') => { console.log(`    ${c ? 'PASS' : 'FAIL'}  ${n}${d ? ' — ' + d : ''}`); if (!c) fail++; };
const written = [];

console.log('=== STEP 3 · VERIFY SLATE ===');
console.log(`endpoint: ${FN}`);
console.log(`caller numbers: NANP-reserved 555-01xx (cannot ring a real person)\n`);

for (const c of CASES) {
  const res = await post(c.p);
  const b = res.body || {};
  console.log(`${c.id}  ->  HTTP ${res.status}  crm_status=${b.crm_status}  record_id=${b.record_id || '(none)'}`);
  console.log(`    message: ${JSON.stringify(String(b.message || '').slice(0, 150))}`);

  ck('response carries the 4-key contract', ['crm_status', 'record_id', 'intake_id', 'message']
    .every(k => k in b), Object.keys(b).join(','));
  ck('no premature confirmed/booked language', !PREMATURE.test(String(b.message || '')),
    (String(b.message || '').match(PREMATURE) || ['clean'])[0]);
  ck('intake_id issued', !!b.intake_id, b.intake_id || 'MISSING');

  if (c.expect === 'WRITTEN') {
    ck('crm_status reports a write', /WRITTEN|VERIFIED|OK|SUCCESS/i.test(String(b.crm_status)), b.crm_status);
    ck('record_id returned', !!b.record_id, b.record_id || 'EMPTY');
    if (b.record_id) written.push([c.id, b.record_id, c.p]);
  } else {
    // A rejection must NOT hand back a record id it did not create.
    ck('no record_id on a rejection', !b.record_id, b.record_id || 'empty (correct)');
    ck('crm_status signals the problem', /FAIL|REJECT|MISSING|INVALID/i.test(String(b.crm_status)), b.crm_status);
  }
  console.log('');
}

/* ── independent read-back: does GHL actually agree? ─────────────────────── */
console.log('=== INDEPENDENT GHL READ-BACK (the "VERIFIED" in the loop) ===');
if (!PIT || !LOC) {
  console.log('  GHL creds absent — cannot read back');
  fail++;
} else {
  for (const [id, rec, sent] of written) {
    const g = await ghl(`/contacts/${rec}`);
    const c = g.body?.contact;
    console.log(`\n${id}  contact ${rec} -> HTTP ${g.status}`);
    if (!c) { ck('contact readable in GHL', false, 'not found'); continue; }
    ck('contact readable in GHL', true, JSON.stringify(c.firstName + ' ' + (c.lastName || '')));
    const cf = {};
    for (const f of (c.customFields || [])) cf[f.id] = f.value ?? f.fieldValue;
    const filled = Object.values(cf).filter(v => v !== undefined && v !== '' && v !== null).length;
    ck('aic_* fields populated on the record', filled > 0, `${filled} field values present`);
    ck('phone stored is the reserved test number', String(c.phone || '').includes(sent.caller_phone.slice(-7)),
      c.phone || '(none)');
  }
}

console.log(`\n=== SLATE RESULT ===`);
console.log(`records written: ${written.length}`);
for (const [id, rec] of written) console.log(`  ${id.padEnd(22)} ${rec}`);
console.log(`\n${fail === 0 ? 'ALL SLATE CHECKS PASS' : fail + ' CHECK(S) FAILED'}`);
console.log('\nNOT TESTED (no Retell text-simulation API): conversational behavior —');
console.log('mid-call correction, readback protocol, latency cover, ACT 2 tour.');
console.log('Those need one real dial to +14147750019.');
process.exit(fail ? 1 : 0);
