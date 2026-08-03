// WF-COMMIT · node "Verify + Normalize"
// Auth identical to WF-RATE. Then: validate RESERVATION_CORE + the trip-type extension,
// mint the trip id, hash the canonical payload, and build the GHL write payloads.
const crypto = require('crypto');

const item = $input.first().json || {};
const headers = item.headers || {};
const body = item.body || {};
const SECRET = ($vars && $vars.RATE_SHARED_SECRET) || '';

const hdr = (k) => {
  const lk = String(k).toLowerCase();
  const keys = Object.keys(headers);
  for (let i = 0; i < keys.length; i++) {
    if (String(keys[i]).toLowerCase() === lk) return String(headers[keys[i]] == null ? '' : headers[keys[i]]);
  }
  return '';
};
const ctEq = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = Buffer.from(a, 'utf8'); const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
};

let auth_ok = false, auth_mode = 'none', auth_reason = '';
if (!SECRET) {
  auth_reason = 'RATE_SHARED_SECRET is not set in n8n Variables';
} else {
  const sig = hdr('x-retell-signature'); const shared = hdr('x-rate-secret');
  if (sig) {
    auth_mode = 'hmac';
    const expected = crypto.createHmac('sha256', SECRET).update(JSON.stringify(body)).digest('hex');
    const parts = String(sig).split(/[,;\s]+/);
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]; if (!p) continue;
      const eq = p.indexOf('=');
      const cand = eq >= 0 ? p.slice(eq + 1).trim() : p.trim();
      if (ctEq(cand.toLowerCase(), expected)) { auth_ok = true; break; }
    }
    if (!auth_ok) auth_reason = 'x-retell-signature did not match HMAC-SHA256 of the request body';
  } else if (shared) {
    auth_mode = 'shared'; auth_ok = ctEq(shared, SECRET);
    if (!auth_ok) auth_reason = 'x-rate-secret did not match the shared secret';
  } else {
    auth_reason = 'neither x-retell-signature nor x-rate-secret was supplied';
  }
}

const args = body.args || body.arguments || body.parameters || body;
const call = body.call || {};
const R = args.reservation || args.Reservation || {};

const str = (v) => (v === undefined || v === null) ? '' : String(v).trim();
const numOrNull = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v); return isNaN(n) ? null : n;
};
const nn = (v) => { const s = str(v); return s === '' ? null : s; };

// --- identifiers -----------------------------------------------------------
const tenant_id = str(args.tenant_id || body.tenant_id || (R.ids || {}).tenant_id) || 'demo';
const call_id = str(args.call_id || body.call_id || call.call_id || (R.source || {}).call_id);
const intake_id = str(args.intake_id || body.intake_id || (R.ids || {}).intake_id);
const quote_id = nn(args.quote_id || body.quote_id);
// Idempotency key. The brief names retell_call_id; call_id is the same value on the
// Retell payload, so either spelling resolves to one key.
const retell_call_id = str(args.retell_call_id || body.retell_call_id || call_id);

// --- RESERVATION_CORE ------------------------------------------------------
const p = R.passenger || {};
const veh = R.vehicle || {};
const pick = R.pickup || {};
const drop = R.dropoff || {};
const flight = R.flight || {};
const billing = R.billing || {};
const booker = R.booker || {};
const src = R.source || {};

let mobile = str(p.mobile_e164 || p.phone);
let d = mobile.replace(/[^0-9]/g, '');
if (d.length === 10) d = '1' + d;
mobile = d ? ('+' + d) : '';

const stopsIn = Array.isArray(R.stops) ? R.stops : [];
const stops = [];
for (let i = 0; i < stopsIn.length; i++) {
  const a = str((stopsIn[i] || {}).address);
  if (a) stops.push(a);
}

const res = {
  trip_type: str(R.trip_type).toUpperCase(),
  first: str(p.first), last: str(p.last), mobile_e164: mobile,
  email: str(p.email).toLowerCase(), pax_count: numOrNull(p.pax_count),
  vehicle_class: str(veh.class).toUpperCase(), luggage_count: numOrNull(veh.luggage_count),
  pickup_datetime: str(pick.datetime_local), pickup_tz: str(pick.tz) || 'America/Chicago',
  pickup_address: str(pick.address), pickup_notes: str(pick.notes),
  dropoff_address: str(drop.address), stops: stops,
  hours_booked: numOrNull(R.hours_booked),
  airline: str(flight.airline), flight_number: str(flight.number),
  meet_style: str(flight.meet_style).toUpperCase(),
  billing_type: str(billing.type).toUpperCase(),
  booker_name: str(booker.name), booker_company: str(booker.company),
  special_notes: str(R.special_notes),
  consent: src.consent === true || String(src.consent).toLowerCase() === 'true',
  agent_id: str(src.agent_id), recording_url: str(src.recording_url)
};

// --- validation: core + per-trip-type extension ----------------------------
const missing = [];
if (!res.trip_type) missing.push('trip type');
if (!res.first) missing.push('first name');
if (!res.mobile_e164 || !/^\+[1-9]\d{7,14}$/.test(res.mobile_e164)) missing.push('mobile number');
if (!res.pickup_datetime) missing.push('pickup date/time');
if (!res.pickup_address) missing.push('pickup address');
if (!res.vehicle_class) missing.push('vehicle class');
if (res.pax_count === null) missing.push('passenger count');

const TT = ['HOURLY', 'ROADSHOW', 'AIRPORT_ARR', 'P2P'];
if (res.trip_type && TT.indexOf(res.trip_type) < 0) missing.push('a recognized trip type');
if (res.trip_type === 'AIRPORT_ARR') {
  if (!res.airline) missing.push('airline');
  if (!res.flight_number) missing.push('flight number');
  if (!res.meet_style) missing.push('meet style');
}
if (res.trip_type === 'HOURLY' || res.trip_type === 'ROADSHOW') {
  if (res.hours_booked === null) missing.push('hours booked');
}
if (res.trip_type === 'P2P' && !res.dropoff_address) missing.push('dropoff address');
if (!call_id) missing.push('call id');
if (!intake_id) missing.push('intake id');
if (!res.consent) missing.push('consent');

const slots_ok = missing.length === 0;

// --- canonical hash + trip id ---------------------------------------------
const canonical = JSON.stringify([
  tenant_id, intake_id, res.trip_type, res.first, res.last, res.mobile_e164,
  res.pax_count, res.vehicle_class, res.luggage_count, res.pickup_datetime,
  res.pickup_tz, res.pickup_address, res.dropoff_address, res.stops,
  res.hours_booked, res.airline, res.flight_number, res.meet_style,
  res.billing_type, res.booker_name, res.booker_company, res.special_notes, quote_id
]);
const payload_hash = crypto.createHash('sha256').update(canonical).digest('hex');

// AC-YYMMDD-XXXX. The suffix is derived from the payload hash, so the same reservation
// always mints the same trip id — a retry cannot invent a second trip number.
const nowChi = new Date();
const y = String(nowChi.getUTCFullYear()).slice(2);
const mo = ('0' + (nowChi.getUTCMonth() + 1)).slice(-2);
const da = ('0' + nowChi.getUTCDate()).slice(-2);
const suffix = payload_hash.replace(/[^0-9a-z]/gi, '').slice(0, 4).toUpperCase();
const trip_id = 'AC-' + y + mo + da + '-' + suffix;

// --- GHL contact custom fields (23 aic_* ids, verified live) ---------------
const CF = {
  trip_type: 'qta1B3kERujMTLNDlj66', pickup_datetime: 'HOfBlSbheMOtChBuK0vU',
  pickup_address: 'L9FS4ZqII0OvQe5KESh7', dropoff_address: 'ISMLWbZhk0V9eVHXut86',
  stops: 'Os3wL0uOEddjnDlRdVwl', pax_count: '5mLlo7JQv1s2PTjGHfBq',
  luggage_count: 'Yiyl1wPsGs927sT2l6KK', vehicle_class: 'OtmDBeaHItbSvOUHRTGY',
  hours_booked: 'DKJoMbtyRJE1VPpjuM20', airline: 'FQc1deemot7Um7yawjcz',
  flight_number: 'sLr1SgxWniXbbABjTYgu', meet_style: 'ugYKX5zQXK4UkclTYXbg',
  special_notes: 'jSoQ7iPIZp32m4DBlV1l', booker_name: 'T485WCP9WVkbeaP9VnSd',
  booker_company: 'uwGZ2sMwnLsNJAsRXaEY', billing_type: 'Z36xyFEoF9brVdNeKAIP',
  intake_id: 'rG7ddiPNaCtnVb6WpQ6q', call_id: 'qPEAuGHATmSwj5ZD0zDD',
  recording_url: 'vn8dhOTRYTLov1epE3Bf', crm_status: 'dKWoeh5ayPS7clTpAy4O',
  payload_hash: 'kKCOH83XaTlUAdaeCxh5', consent: 'NrB5VCwkvsSsBBcVPmSx',
  tenant: '16MIe7L45qETn9TtcOK5'
};

const cf = [];
const put = (id, v) => {
  if (v === null || v === undefined || v === '') return;
  cf.push({ id: id, value: String(v) });
};
put(CF.trip_type, res.trip_type);
put(CF.pickup_datetime, res.pickup_datetime ? (res.pickup_datetime.replace('T', ' ')) : '');
put(CF.pickup_address, res.pickup_address);
put(CF.dropoff_address, res.dropoff_address);
put(CF.stops, res.stops.length ? res.stops.join(' | ') : '');
put(CF.pax_count, res.pax_count);
put(CF.luggage_count, res.luggage_count);
put(CF.vehicle_class, res.vehicle_class);
put(CF.hours_booked, res.hours_booked);
put(CF.airline, res.airline);
put(CF.flight_number, res.flight_number);
put(CF.meet_style, res.meet_style);
put(CF.special_notes, res.special_notes);
put(CF.booker_name, res.booker_name);
put(CF.booker_company, res.booker_company);
put(CF.billing_type, res.billing_type);
put(CF.intake_id, intake_id);
put(CF.call_id, call_id);
put(CF.recording_url, res.recording_url);
put(CF.payload_hash, payload_hash);
put(CF.consent, res.consent ? 'true' : 'false');
put(CF.tenant, tenant_id);

// --- OWNER RAIL LAW § 9: our own numbers never create or mutate a real lead ---
const OURS = String(($vars && $vars.OUR_NUMBERS) || '').replace(/[^0-9,]/g, '').split(',');
const digits10 = (s) => String(s || '').replace(/[^0-9]/g, '').slice(-10);
let is_our_number = false;
for (let i = 0; i < OURS.length; i++) {
  const o = digits10(OURS[i]);
  if (o && o === digits10(res.mobile_e164)) { is_our_number = true; break; }
}
const zz = str(($vars && $vars.ZZ_TEST_CONTACT_ID) || '');

// --- RUN 3 QUARANTINE RAIL -------------------------------------------------
// THE single place WF-COMMIT decides a call is synthetic. Every suppression and
// every TEST tag downstream reads is_test from here — same one-node shape as the
// § 9 gate, so it cannot be edited out of one branch and left live in another.
//
//   is_test = NANP-reserved 555-01xx caller
//          OR an explicit test_mode flag on the payload
//          OR (tenant "demo" AND the caller is one of OUR OWN lines)
//
// The third clause is deliberately narrow. A REAL person dialling the demo line
// from an unknown public number is NOT a test — the receipt is the demo, and
// suppressing it would break the product. Only our own lines are quarantined.
// Area code 555 is NANP-reserved and can never be a real dialable line, so the
// prefix test is exact — no real caller is ever caught by it.
const d10 = digits10(res.mobile_e164);
const is_555 = d10.length === 10 && d10.slice(0, 3) === '555';
const test_mode = (args.test_mode === true || body.test_mode === true ||
                   String(args.test_mode).toLowerCase() === 'true');
const is_test = !!(is_555 || test_mode || (tenant_id === 'demo' && is_our_number));

let test_reason = '';
if (is_555) test_reason = 'caller is a NANP-reserved 555 test number';
else if (test_mode) test_reason = 'payload carried test_mode';
else if (is_test) test_reason = 'demo tenant calling from one of OUR_NUMBERS';

// Tags live here, not in a node expression, so the TEST marker is version-controlled
// and reviewable. A quarantined write is legible as synthetic in the CRM itself —
// not only in the ledger — so nobody works it as a real lead.
const tags = ['aichauffeur-lead', 'aic-reservation'];
if (is_test) { tags.push('TEST'); tags.push('zz-internal'); }

// Reservation custom-object record properties (object 6a70df48cf83fcd4097d738a).
const properties = {
  trip_id: trip_id, tenant_id: tenant_id, intake_id: intake_id, call_id: call_id,
  trip_type: res.trip_type, pickup_datetime: res.pickup_datetime,
  pickup_address: res.pickup_address, dropoff_address: res.dropoff_address,
  stops: res.stops.join(' | '), vehicle_class: res.vehicle_class,
  billing_type: res.billing_type, booker_name: res.booker_name,
  booker_company: res.booker_company, special_notes: res.special_notes,
  airline: res.airline, flight_number: res.flight_number, meet_style: res.meet_style,
  payload_hash: payload_hash, captured_at: new Date().toISOString()
};
// RUN 3: the record says so itself, so a reservation is legible as synthetic without
// cross-referencing the ledger.
if (is_test) properties.is_test = 'TEST';
if (quote_id) properties.quote_id = quote_id;
if (res.pax_count !== null) properties.pax_count = res.pax_count;
if (res.luggage_count !== null) properties.luggage_count = res.luggage_count;
if (res.hours_booked !== null) properties.hours_booked = res.hours_booked;
// Strip empties so the record never stores "" where the ticket should read NOT PROVIDED.
const propKeys = Object.keys(properties);
for (let i = 0; i < propKeys.length; i++) {
  if (properties[propKeys[i]] === '' || properties[propKeys[i]] === null) delete properties[propKeys[i]];
}

return [{
  json: {
    auth_ok: auth_ok, auth_mode: auth_mode, auth_reason: auth_reason,
    tenant_id: tenant_id, call_id: call_id, intake_id: intake_id,
    retell_call_id: retell_call_id, quote_id: quote_id,
    trip_id: trip_id, payload_hash: payload_hash, canonical: canonical,
    slots_ok: slots_ok, missing: missing,
    missing_sentence: missing.length ? ('Required details are missing: ' + missing.join(', ') + '.') : '',
    res: res, cf: cf, properties: properties,
    is_our_number: is_our_number, zz_test_contact_id: zz,
    is_test: is_test, test_reason: test_reason, tags: tags,
    started_ms: Date.now()
  }
}];
