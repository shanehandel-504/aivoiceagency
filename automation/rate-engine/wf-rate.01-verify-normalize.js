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
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
};

// AUTH PRIORITY FIX (Aug 20): shared secret first; HMAC only when no shared-secret header.
let auth_ok = false;
let auth_mode = 'none';
let auth_reason = '';

if (!SECRET) {
  auth_reason = 'RATE_SHARED_SECRET is not set in n8n Variables';
} else {
  const shared = hdr('x-rate-secret');
  const sig = hdr('x-retell-signature');
  if (shared) {
    auth_mode = 'shared';
    auth_ok = ctEq(shared, SECRET);
    if (!auth_ok) auth_reason = 'x-rate-secret did not match the shared secret';
  } else if (sig) {
    auth_mode = 'hmac';
    const expected = crypto.createHmac('sha256', SECRET).update(JSON.stringify(body)).digest('hex');
    const parts = String(sig).split(/[,;\s]+/);
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (!p) continue;
      const eq = p.indexOf('=');
      const cand = eq >= 0 ? p.slice(eq + 1).trim() : p.trim();
      if (ctEq(cand.toLowerCase(), expected)) { auth_ok = true; break; }
    }
    if (!auth_ok) auth_reason = 'x-retell-signature did not match HMAC-SHA256 of the request body';
  } else {
    auth_reason = 'neither x-rate-secret nor x-retell-signature was supplied';
  }
}

const args = body.args || body.arguments || body.parameters || body;
const call = body.call || {};

const str = (v) => (v === undefined || v === null) ? '' : String(v).trim();
const num = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
};

const call_id = str(args.call_id || body.call_id || call.call_id);
const tenant_id = str(args.tenant_id || body.tenant_id) || 'demo';

let addons_in = args.addons || args.add_ons || [];
if (!Array.isArray(addons_in)) {
  if (addons_in && typeof addons_in === 'object') {
    const conv = [];
    const ks = Object.keys(addons_in);
    for (let i = 0; i < ks.length; i++) {
      const v = addons_in[ks[i]];
      if (v === false || v === 0 || v === null || v === undefined) continue;
      conv.push({ key: ks[i], qty: (typeof v === 'number' ? v : 1) });
    }
    addons_in = conv;
  } else if (typeof addons_in === 'string' && addons_in) {
    const parts = addons_in.split(',');
    const conv = [];
    for (let i = 0; i < parts.length; i++) { const t = parts[i].trim(); if (t) conv.push({ key: t, qty: 1 }); }
    addons_in = conv;
  } else {
    addons_in = [];
  }
}

// TOLERANT NORMALIZATION (Aug 20): phrasings collapse onto exact keys; seat flavors carry seat_type.
const SEAT_ALIAS = { booster_seat: 'booster', infant_seat: 'infant', convertible_seat: 'convertible', booster: 'booster', infant: 'infant', convertible: 'convertible', car_seat: '', childseat: '', child_seat: '', baby_seat: 'infant' };
const ADDON_ALIAS = { meet_and_greet: 'meet_greet', meetgreet: 'meet_greet', meet_greet: 'meet_greet', greeter: 'meet_greet', curb_side: 'curbside', curbside: 'curbside', late_night: 'late_night', latenight: 'late_night' };

const norm_addons = [];
for (let i = 0; i < addons_in.length; i++) {
  const a = addons_in[i] || {};
  let key = str(a.key || a.addon_key || a.name).toLowerCase().replace(/[\s-]+/g, '_');
  if (!key) continue;
  let seat_type = str(a.seat_type || a.type).toLowerCase();
  if (SEAT_ALIAS[key] !== undefined) {
    if (!seat_type && SEAT_ALIAS[key]) seat_type = SEAT_ALIAS[key];
    key = 'child_seat';
  } else if (ADDON_ALIAS[key]) {
    key = ADDON_ALIAS[key];
  }
  const qty = num(a.qty || a.quantity) || 1;
  norm_addons.push({ key: key, qty: qty, seat_type: seat_type });
}
norm_addons.sort((x, y) => (x.key < y.key ? -1 : x.key > y.key ? 1 : 0));

// M1 VEHICLE ALIAS EXPANSION (Aug 22): every phrasing lands on a card key; contains-net gated by KNOWN_KEYS.
const KNOWN_KEYS = { sedan_exec: 1, sedan_luxury: 1, suv_exec: 1, suv_premium: 1, van_exec: 1, sprinter_exec_14: 1, sprinter_luxury: 1, limo_stretch: 1, limo_super_stretch: 1, limo_hummer: 1, party_bus_20: 1, party_bus_30: 1, party_bus_40: 1, mini_coach_32: 1, mini_coach_38: 1, motorcoach_56: 1, motorcoach_premium: 1, van_ada: 1 };
const VEH_ALIAS = { sedan: 'sedan_exec', executive_sedan: 'sedan_exec', town_car: 'sedan_exec', black_car: 'sedan_exec', luxury_sedan: 'sedan_luxury', suv: 'suv_exec', executive_suv: 'suv_exec', premium_suv: 'suv_premium', luxury_suv: 'suv_premium', van: 'van_exec', executive_van: 'van_exec', sprinter: 'sprinter_exec_14', sprinter_van: 'sprinter_exec_14', van_sprinter: 'sprinter_exec_14', sprinter_exec: 'sprinter_exec_14', executive_sprinter: 'sprinter_exec_14', luxury_sprinter: 'sprinter_luxury', limo: 'limo_stretch', stretch: 'limo_stretch', stretch_limo: 'limo_stretch', stretch_limousine: 'limo_stretch', super_stretch: 'limo_super_stretch', hummer: 'limo_hummer', hummer_limo: 'limo_hummer', party_bus: 'party_bus_20', minibus: 'mini_coach_32', mini_bus: 'mini_coach_32', mini_coach: 'mini_coach_32', motorcoach: 'motorcoach_56', coach: 'motorcoach_56', charter_bus: 'motorcoach_56', ada_van: 'van_ada', wheelchair_van: 'van_ada' };
let vehicle_key = str(args.vehicle_key || args.vehicle || args.vehicle_class).toLowerCase().replace(/[\s-]+/g, '_');
if (VEH_ALIAS[vehicle_key]) {
  vehicle_key = VEH_ALIAS[vehicle_key];
} else if (vehicle_key && !KNOWN_KEYS[vehicle_key]) {
  if (vehicle_key.indexOf('sprinter') >= 0) vehicle_key = vehicle_key.indexOf('lux') >= 0 ? 'sprinter_luxury' : 'sprinter_exec_14';
  else if (vehicle_key.indexOf('party') >= 0) vehicle_key = 'party_bus_20';
  else if (vehicle_key.indexOf('stretch') >= 0) vehicle_key = vehicle_key.indexOf('super') >= 0 ? 'limo_super_stretch' : 'limo_stretch';
  else if (vehicle_key.indexOf('hummer') >= 0) vehicle_key = 'limo_hummer';
  else if (vehicle_key.indexOf('coach') >= 0) vehicle_key = vehicle_key.indexOf('mini') >= 0 ? 'mini_coach_32' : 'motorcoach_56';
}

// RCv2.0: trip-type tolerance — point-to-point joins airport and hourly as a first-class lane.
let trip_type = str(args.trip_type || args.tripType).toLowerCase().replace(/[\s-]+/g, '_');
if (trip_type === 'p2p' || trip_type === 'point_to_point_service' || trip_type === 'transfer' || trip_type === 'city_to_city') trip_type = 'point_to_point';

const inputs = {
  trip_type: trip_type,
  vehicle_key: vehicle_key,
  pickup_at: str(args.pickup_at || args.pickup_time || args.pickup_datetime || args.datetime),
  requested_hours: num(args.requested_hours || args.hours || args.duration_hours || args.billable_hours),
  origin: str(args.origin || args.pickup_city || args.pickup_address || args.from),
  destination: str(args.destination || args.dropoff || args.dropoff_address || args.to_address || args.drop_off),
  airport: str(args.airport || args.airport_code).toUpperCase(),
  direction: str(args.direction).toLowerCase(),
  // DIRECTION FIELDS (RCv2.3): the true direction of travel, as the caller experiences it.
  // On an airport arrival trip_origin is the airport and trip_destination is the drop-off —
  // the reverse of the (origin, airport) zone key, which stays the pricing key untouched.
  // Deliberately ABSENT from `canonical` below: these are wording-only, so they must not move
  // input_hash and must not change idempotency, supersede or quote_id behavior.
  trip_origin: str(args.trip_origin || args.tripOrigin),
  trip_destination: str(args.trip_destination || args.tripDestination),
  stops_count: num(args.stops_count || args.stops) || 0,
  passengers: num(args.passengers || args.pax || args.passenger_count),
  bags: num(args.bags || args.luggage || args.bag_count),
  account_type: (str(args.account_type || args.rate_type) || 'retail').toLowerCase(),
  corporate_flag: (args.corporate === true || args.affiliate === true || args.farm_out === true || args.is_corporate === true) ? true : false,
  addons: norm_addons,
  pricing_mode_req: str(args.pricing_mode).toUpperCase()
};

const canonical = JSON.stringify([
  tenant_id,
  inputs.trip_type,
  inputs.vehicle_key,
  inputs.pickup_at,
  inputs.requested_hours,
  inputs.origin.toLowerCase().replace(/[^a-z0-9]/g, ''),
  inputs.destination.toLowerCase().replace(/[^a-z0-9]/g, ''),
  inputs.airport,
  inputs.stops_count,
  inputs.passengers,
  inputs.bags,
  inputs.account_type,
  inputs.corporate_flag,
  inputs.addons,
  inputs.pricing_mode_req
]);

const input_hash = crypto.createHash('sha256').update(tenant_id + '|' + call_id + '|' + canonical).digest('hex');

return [{
  json: {
    auth_ok: auth_ok,
    auth_mode: auth_mode,
    auth_reason: auth_reason,
    call_id: call_id,
    tenant_id: tenant_id,
    inputs: inputs,
    canonical: canonical,
    input_hash: input_hash,
    prior_quote_id: str(args.prior_quote_id || args.supersedes),
    received_at: new Date().toISOString()
  }
}];

