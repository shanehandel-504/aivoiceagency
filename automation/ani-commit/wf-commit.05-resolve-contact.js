// WF-COMMIT · node "Resolve Contact"
// § 9 OWNER RAIL LAW enforcement point. Downstream nodes read the contact id from HERE,
// never from the upsert node directly, so the guard cannot be bypassed by a later edit.
//
// A call placed from one of OUR OWN numbers (every Retell line, the published SMS line,
// both owner cells — n8n Variable OUR_NUMBERS) must never create or mutate a real lead.
// On that path the upsert is skipped entirely and the reservation is associated to the
// dedicated zz-test contact instead.
const n = $('Verify + Normalize').first().json;
const inbound = $input.first().json || {};

let contact_id = '';
let route = '';

if (n.is_our_number) {
  contact_id = n.zz_test_contact_id || '';
  route = 'zz-test — caller is one of OUR_NUMBERS, upsert skipped (§ 9)';
} else {
  contact_id = ((inbound.contact || {}).id) || '';
  route = 'caller upsert';
}

return [{
  json: {
    contact_id: contact_id,
    route: route,
    is_our_number: !!n.is_our_number,
    upsert_raw: inbound
  }
}];
