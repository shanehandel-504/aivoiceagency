// WF-COMMIT · node "Build Duplicate Response"
// A repeated call_id returns the ORIGINAL stored result verbatim. No second contact
// upsert, no second reservation record, no second trip id. The ledger row written by
// the first commit is the source of truth; this node only replays it.
const prior = $input.first().json || {};

let original = {};
try {
  original = JSON.parse(prior.response_json || '{}');
} catch (e) {
  original = {};
}

// If the stored envelope is unreadable, rebuild the essentials from the ledger columns
// rather than inventing a fresh commit.
if (!original.trip_id) {
  original = {
    trip_id: prior.trip_id || null,
    reservation_state: prior.reservation_state || 'REQUEST_RECEIVED',
    crm_write_status: prior.crm_write_status || 'WRITE_UNVERIFIED',
    provider_reservation_id: null,
    ghl_contact_id: prior.contact_id || null,
    reservation_record_id: prior.record_id || null,
    quote_id: prior.quote_id || null,
    intake_id: prior.intake_id || null,
    call_id: prior.call_id || null,
    tenant_id: prior.tenant_id || null,
    reason: 'replayed from the commit ledger; the original response envelope was unreadable',
    message: 'That trip is already on file. Reference ' + (prior.trip_id || 'on record') + '.'
  };
}

original.duplicate = true;
original.replayed_at = new Date().toISOString();
if (!original.message) {
  original.message = 'That trip is already on file. Reference ' + (original.trip_id || 'on record') + '.';
}

return [{ json: original }];
