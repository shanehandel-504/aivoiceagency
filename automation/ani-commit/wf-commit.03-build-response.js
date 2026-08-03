// WF-COMMIT · node "Build Response + Ticket"
// Final contract for the agent, plus the dispatch ticket used by the SMS/email path.
// A field the caller never gave prints "— NOT PROVIDED". It is never inferred, never
// defaulted, and never left blank in a way that reads as "nothing needed here".
const n = $('Verify + Normalize').first().json;
const v = $('Verify + Status').first().json;
const r = n.res || {};

const NP = '— NOT PROVIDED';
const show = (x) => {
  if (x === null || x === undefined) return NP;
  const s = String(x).trim();
  return s === '' ? NP : s;
};

const TRIP_LABEL = {
  HOURLY: 'Hourly · as directed', ROADSHOW: 'Roadshow',
  AIRPORT_ARR: 'Airport arrival', P2P: 'Point to point'
};
const MEET_LABEL = { CURBSIDE: 'Curbside', BAGGAGE: 'Baggage claim', PLANESIDE: 'Planeside' };
const BILL_LABEL = { CC_ON_FILE: 'Card on file', DIRECT_BILL: 'Direct bill', NEW_ACCOUNT: 'New account' };

const lines = [];
lines.push('AI CHAUFFEUR — DISPATCH TICKET');
lines.push('Trip ID        : ' + show(v.trip_id));
lines.push('State          : ' + show(v.reservation_state));
lines.push('CRM write      : ' + show(v.crm_write_status));
lines.push('Trip type      : ' + (TRIP_LABEL[r.trip_type] || show(r.trip_type)) +
           '  [' + show(r.trip_type) + ']');
lines.push('');
lines.push('Passenger      : ' + show((String(r.first || '') + ' ' + String(r.last || '')).trim()));
lines.push('Mobile         : ' + show(r.mobile_e164));
lines.push('Email          : ' + show(r.email));
lines.push('Passengers     : ' + show(r.pax_count));
lines.push('Luggage        : ' + show(r.luggage_count));
lines.push('');
lines.push('Pickup         : ' + show(r.pickup_datetime) + '  (' + show(r.pickup_tz) + ')');
lines.push('Pickup address : ' + show(r.pickup_address));
lines.push('Dropoff        : ' + show(r.dropoff_address));
lines.push('Stops          : ' + show((r.stops || []).join(' | ')));
lines.push('Hours booked   : ' + show(r.hours_booked));
lines.push('Vehicle        : ' + show(r.vehicle_class));
lines.push('');
lines.push('Airline        : ' + show(r.airline));
lines.push('Flight         : ' + show(r.flight_number));
lines.push('Meet style     : ' + (MEET_LABEL[r.meet_style] || show(r.meet_style)));
lines.push('');
lines.push('Booker         : ' + show(r.booker_name) + '  /  ' + show(r.booker_company));
lines.push('Billing        : ' + (BILL_LABEL[r.billing_type] || show(r.billing_type)));
lines.push('Notes          : ' + show(r.special_notes));
lines.push('');
lines.push('Quote ID       : ' + show(v.quote_id));
lines.push('Intake ID      : ' + show(v.intake_id));
lines.push('Call ID        : ' + show(v.call_id));
lines.push('Record ID      : ' + show(v.reservation_record_id));
lines.push('Provider res.  : ' + show(v.provider_reservation_id));
lines.push('Verify         : ' + v.fields_matched + '/' + v.fields_compared +
           ' fields matched on read-back · hash ' + (v.hash_match ? 'match' : 'MISMATCH'));
const ticket_text = lines.join('\n');

// Owner SMS: status first, readable from a lock screen without opening anything.
const owner_sms = [
  v.reservation_state + ' · ' + show(v.trip_id),
  (TRIP_LABEL[r.trip_type] || show(r.trip_type)) + ' · ' + show(r.vehicle_class),
  show(r.pickup_datetime) + ' · ' + show(r.pickup_address),
  show((String(r.first || '') + ' ' + String(r.last || '')).trim()) + ' · ' + show(r.mobile_e164),
  'CRM ' + v.crm_write_status
].join('\n');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const email_subject = v.reservation_state + ' — ' + show(v.trip_id) + ' · ' +
                      (TRIP_LABEL[r.trip_type] || show(r.trip_type));
const email_html =
  '<div style="background:#06080F;padding:28px 14px;font-family:Inter,Helvetica,Arial,sans-serif;">' +
  '<div style="max-width:640px;margin:0 auto;">' +
  '<p style="margin:0 0 6px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;' +
  'color:#3B82F6;font-weight:700;">AI CHAUFFEUR · DISPATCH</p>' +
  '<h1 style="margin:0 0 10px;font-size:22px;color:#EEF2FA;font-weight:800;">' +
  esc(v.reservation_state) + ' — ' + esc(show(v.trip_id)) + '</h1>' +
  '<p style="margin:0 0 14px;font-size:13px;line-height:1.7;color:#9AA6BD;">' +
  esc(v.reason) + '</p>' +
  '<pre style="margin:0;padding:18px;background:#0B0F1A;border:1px solid #1E293B;' +
  'color:#EEF2FA;font-family:SFMono-Regular,Consolas,Menlo,monospace;font-size:12px;' +
  'line-height:1.65;white-space:pre-wrap;">' + esc(ticket_text) + '</pre>' +
  '</div></div>';

const response = {
  trip_id: v.trip_id,
  reservation_state: v.reservation_state,
  crm_write_status: v.crm_write_status,
  provider_reservation_id: v.provider_reservation_id,
  ghl_contact_id: v.ghl_contact_id,
  reservation_record_id: v.reservation_record_id,
  quote_id: v.quote_id,
  intake_id: v.intake_id,
  call_id: v.call_id,
  tenant_id: v.tenant_id,
  duplicate: false,
  fields_matched: v.fields_matched,
  fields_compared: v.fields_compared,
  hash_match: v.hash_match,
  reason: v.reason,
  message: v.message,
  commit_ms: v.commit_ms
};

return [{
  json: Object.assign({}, response, {
    response_json: JSON.stringify(response),
    ticket_text: ticket_text,
    owner_sms: owner_sms,
    email_subject: email_subject,
    email_html: email_html,
    send_ticket: v.crm_write_status !== 'WRITE_FAILED',
    caller_mobile: r.mobile_e164 || '',
    caller_email: r.email || ''
  })
}];
