// WF-COMMIT · node "Verify + Status"
// READ-AFTER-WRITE. The record is re-fetched from GHL and hash-compared against what we
// intended to store. crm_write_status is decided by what the CRM actually returned, never
// by what the write call claimed. A write that 201s but reads back wrong is UNVERIFIED.
const crypto = require('crypto');

const n = $('Verify + Normalize').first().json;
const up = $('GHL Upsert Contact').first().json || {};
const rec = $('Create Reservation Record').first().json || {};
const assoc = $('Associate To Contact').first().json || {};
const note = $('GHL Trip Note').first().json || {};
const rb = $input.first().json || {};

const bad = (r) => {
  const sc = Number((r || {}).statusCode || (r || {}).status || 0);
  return !!((r || {}).error || (sc && (sc < 200 || sc >= 300)));
};

const contact_id = ((up.contact || {}).id) || '';
const record_id = ((rec.record || {}).id) || rec.id || '';
const assoc_id = assoc.id || '';
const note_ok = !!((note.note && note.note.id) || note.id);

const rbRec = rb.record || {};
const stored = rbRec.properties || {};

// --- field-by-field comparison against the intended properties -------------
const intended = n.properties || {};
const keys = Object.keys(intended);
const mismatches = [];
let compared = 0, matched = 0;
for (let i = 0; i < keys.length; i++) {
  const k = keys[i];
  if (k === 'captured_at') continue; // server clock, not a caller fact
  compared++;
  const want = String(intended[k] === null || intended[k] === undefined ? '' : intended[k]).trim();
  const got = String(stored[k] === null || stored[k] === undefined ? '' : stored[k]).trim();
  if (want === got) matched++;
  else mismatches.push(k + ': wrote "' + want + '", CRM holds "' + got + '"');
}

// Hash both sides over the same key order so the comparison is one value, not a vibe.
const hashOf = (obj) => {
  const ks = keys.slice().sort();
  const parts = [];
  for (let i = 0; i < ks.length; i++) {
    if (ks[i] === 'captured_at') continue;
    const v = obj[ks[i]];
    parts.push(ks[i] + '=' + String(v === null || v === undefined ? '' : v).trim());
  }
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
};
const intended_hash = hashOf(intended);
const stored_hash = hashOf(stored);
const hash_match = intended_hash === stored_hash;

// --- crm_write_status ------------------------------------------------------
const writeFailed = bad(up) || bad(rec) || !contact_id || !record_id;
let crm_write_status;
if (writeFailed) {
  crm_write_status = 'WRITE_FAILED';
} else if (bad(rb) || !rbRec.id) {
  crm_write_status = 'WRITE_UNVERIFIED';   // wrote, but could not read it back
} else if (hash_match && assoc_id) {
  crm_write_status = 'CRM_VERIFIED';
} else {
  crm_write_status = 'WRITE_UNVERIFIED';
}

// --- reservation state policy ---------------------------------------------
// demo tenant may say CONFIRMED, and only on CRM_VERIFIED. Every other tenant is
// CAPTURE_ONLY and is hard-capped at REQUEST_RECEIVED no matter how clean the write was.
const CONFIRM_TENANTS = ['demo'];
const mayConfirm = CONFIRM_TENANTS.indexOf(String(n.tenant_id)) >= 0;

let reservation_state;
if (crm_write_status === 'WRITE_FAILED') reservation_state = 'FAILED';
else if (crm_write_status === 'CRM_VERIFIED' && mayConfirm) reservation_state = 'CONFIRMED';
else reservation_state = 'REQUEST_RECEIVED';

const capped = (crm_write_status === 'CRM_VERIFIED' && !mayConfirm);

let message;
if (reservation_state === 'CONFIRMED') {
  message = 'Your trip is set. Reference ' + n.trip_id +
            ' — every detail was checked against the stored record.';
} else if (reservation_state === 'REQUEST_RECEIVED') {
  message = 'Your request is in, reference ' + n.trip_id +
            '. Dispatch will confirm the details with you.';
} else {
  message = 'I could not store that reservation. Dispatch will call you back to take it directly.';
}

const reason = crm_write_status === 'CRM_VERIFIED'
  ? (capped ? 'record verified; tenant is CAPTURE_ONLY so state is capped at REQUEST_RECEIVED'
            : 'record written and verified by read-after-write hash compare')
  : (crm_write_status === 'WRITE_FAILED'
     ? ('write failed — contact_id=' + (contact_id || 'none') + ' record_id=' + (record_id || 'none'))
     : ('written but not verified — ' + (mismatches.length ? mismatches.join(' · ')
                                        : 'record could not be read back')));

return [{
  json: {
    trip_id: n.trip_id,
    reservation_state: reservation_state,
    crm_write_status: crm_write_status,
    provider_reservation_id: null,           // Phase 2: no provider submission yet
    ghl_contact_id: contact_id || null,
    reservation_record_id: record_id || null,
    association_id: assoc_id || null,
    note_written: note_ok,
    quote_id: n.quote_id,
    intake_id: n.intake_id,
    call_id: n.call_id,
    tenant_id: n.tenant_id,
    payload_hash: n.payload_hash,
    intended_hash: intended_hash,
    stored_hash: stored_hash,
    hash_match: hash_match,
    fields_compared: compared,
    fields_matched: matched,
    mismatches: mismatches,
    capture_only_capped: capped,
    reason: reason,
    message: message,
    commit_ms: Date.now() - (n.started_ms || Date.now())
  }
}];
