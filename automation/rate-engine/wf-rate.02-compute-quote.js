const crypto = require('crypto');

const RATE_CARD_VERSION = 'RCv2.3';
const SELF = this;

// ═══ SERVICE-FEE LAW (RCv2.1, Aug 22) ═══
// The word "gratuity" is retired everywhere: spoken lines, breakdown labels, receipt fields, contract keys.
// The 20% line is the house SERVICE FEE. It is not the chauffeur's tip, and calling it a gratuity
// tells a caller the chauffeur has been taken care of when they have not.
// This constant supersedes pricing_policies.service_charge_label at the code layer.
const SERVICE_FEE_LABEL = 'service fee';

// ═══ RCv2.0 — NATIONWIDE ALL-IN LADDER ═══
// 1. EXACT_ZONE           -> approved zone row + multiplier; legacy base + 20% service math preserved.
// 2. ROUTE_DISTANCE_TIME  -> every vehicle, every U.S. route: max(transfer floor, miles x rate, traffic-hours x time rate).
//                            Matrix values are ALL-IN (service fee included) — no service % stacked on top.
// 3. HOURLY_MINIMUM       -> hourly/as-directed: max(requested, vehicle minimum hours) x time rate, all-in.
// 4. DEMO_GEO_FALLBACK    -> same national math on deterministic haversine when the router blinks.
// 5. HUMAN_REVIEW         -> only invalid input or a true geocode failure. No valid U.S. itinerary leaves unpriced.
const DEMO_FRAMING = "For this demo I'm using a sample rate model — your version runs your own fleet rates.";

// National all-in demo matrix: transfer floor / per route mile / time rate per hour / hourly-service minimum hours.
const NAT = {
  sedan_exec:        { floor: 145,  per_mi: 2.55, time_rate: 115, min_hours: 2 },
  sedan_luxury:      { floor: 195,  per_mi: 3.45, time_rate: 155, min_hours: 2 },
  suv_exec:          { floor: 185,  per_mi: 3.25, time_rate: 145, min_hours: 2 },
  suv_premium:       { floor: 225,  per_mi: 3.95, time_rate: 175, min_hours: 2 },
  van_exec:          { floor: 315,  per_mi: 4.25, time_rate: 185, min_hours: 3 },
  van_ada:           { floor: 315,  per_mi: 4.25, time_rate: 185, min_hours: 3 },
  sprinter_exec_14:  { floor: 425,  per_mi: 5.00, time_rate: 225, min_hours: 3 },
  sprinter_luxury:   { floor: 495,  per_mi: 5.85, time_rate: 265, min_hours: 3 },
  limo_stretch:      { floor: 475,  per_mi: 5.50, time_rate: 225, min_hours: 3 },
  limo_super_stretch:{ floor: 550,  per_mi: 6.25, time_rate: 260, min_hours: 3 },
  limo_hummer:       { floor: 595,  per_mi: 6.75, time_rate: 285, min_hours: 3 },
  party_bus_20:      { floor: 750,  per_mi: 6.50, time_rate: 300, min_hours: 4 },
  party_bus_30:      { floor: 850,  per_mi: 7.25, time_rate: 340, min_hours: 4 },
  party_bus_40:      { floor: 950,  per_mi: 8.00, time_rate: 375, min_hours: 4 },
  mini_coach_32:     { floor: 895,  per_mi: 7.50, time_rate: 350, min_hours: 5 },
  mini_coach_38:     { floor: 995,  per_mi: 7.95, time_rate: 375, min_hours: 5 },
  motorcoach_56:     { floor: 1250, per_mi: 8.50, time_rate: 425, min_hours: 5 },
  motorcoach_premium:{ floor: 1450, per_mi: 9.50, time_rate: 475, min_hours: 5 }
};

const ADDON_FLAT = { meet_greet: 35, child_seat: 20, extra_stop: 25, curbside: 0 };
const MULT = { late_night: 1.15, same_day: 1.15, holiday: 1.20 };

const IATA = {
  MKE:[42.9472,-87.8966], ORD:[41.9742,-87.9073], MDW:[41.7868,-87.7522], MSN:[43.1399,-89.3375],
  GRB:[44.4851,-88.1296], ATW:[44.2581,-88.5191], JFK:[40.6413,-73.7781], LGA:[40.7769,-73.8740],
  EWR:[40.6895,-74.1745], DFW:[32.8998,-97.0403], DAL:[32.8471,-96.8517], IAH:[29.9902,-95.3368],
  HOU:[29.6454,-95.2789], AUS:[30.1975,-97.6664], SAT:[29.5312,-98.4683], ATL:[33.6407,-84.4277],
  LAX:[33.9416,-118.4085], DEN:[39.8561,-104.6737], PHX:[33.4353,-112.0078], MIA:[25.7959,-80.2870],
  SFO:[37.6213,-122.3790], LAS:[36.0840,-115.1537], MSP:[44.8848,-93.2223], DTW:[42.2162,-83.3554],
  SEA:[47.4502,-122.3088], BOS:[42.3656,-71.0096], PHL:[39.8744,-75.2424], CLT:[35.2144,-80.9473],
  IAD:[38.9531,-77.4565], DCA:[38.8512,-77.0402], BWI:[39.1774,-76.6684], SLC:[40.7899,-111.9791],
  STL:[38.7500,-90.3700], MCI:[39.2976,-94.7139], BNA:[36.1263,-86.6774], IND:[39.7169,-86.2956],
  CMH:[39.9980,-82.8919], CVG:[39.0508,-84.6673], PIT:[40.4915,-80.2329], SAN:[32.7338,-117.1933],
  MCO:[28.4312,-81.3081], TPA:[27.9772,-82.5311], FLL:[26.0742,-80.1506], SMF:[38.6951,-121.5908],
  PDX:[45.5898,-122.5951], RDU:[35.8801,-78.7880]
};

// Spoken airport names — the caller hears a terminal, not a three-letter code.
const AIRPORT_NAMES = {
  MKE:'Milwaukee Mitchell International', ORD:"O'Hare International", MDW:'Chicago Midway', MSN:'Dane County Regional',
  GRB:'Green Bay Austin Straubel', ATW:'Appleton International', JFK:'J F K International', LGA:'LaGuardia',
  EWR:'Newark Liberty', DFW:'Dallas Fort Worth International', DAL:'Dallas Love Field', IAH:'Houston Intercontinental',
  HOU:'Houston Hobby', AUS:'Austin Bergstrom', SAT:'San Antonio International', ATL:'Hartsfield Jackson Atlanta',
  LAX:'Los Angeles International', DEN:'Denver International', PHX:'Phoenix Sky Harbor', MIA:'Miami International',
  SFO:'San Francisco International', LAS:'Harry Reid International', MSP:'Minneapolis Saint Paul', DTW:'Detroit Metropolitan',
  SEA:'Seattle Tacoma International', BOS:'Boston Logan', PHL:'Philadelphia International', CLT:'Charlotte Douglas',
  IAD:'Washington Dulles', DCA:'Reagan National', BWI:'Baltimore Washington International', SLC:'Salt Lake City International',
  STL:'Saint Louis Lambert', MCI:'Kansas City International', BNA:'Nashville International', IND:'Indianapolis International',
  CMH:'John Glenn Columbus', CVG:'Cincinnati Northern Kentucky', PIT:'Pittsburgh International', SAN:'San Diego International',
  MCO:'Orlando International', TPA:'Tampa International', FLL:'Fort Lauderdale Hollywood', SMF:'Sacramento International',
  PDX:'Portland International', RDU:'Raleigh Durham International'
};
const airportSpoken = (code) => AIRPORT_NAMES[String(code).toUpperCase()] || String(code).toUpperCase();

// Whole dollars speak as whole dollars; cents survive only when they exist.
const fmtMoney = (n) => {
  const s = (Math.round(Number(n) * 100) / 100).toFixed(2);
  return '$' + (s.slice(-3) === '.00' ? s.slice(0, -3) : s);
};

const rows = (nodeName) => {
  try {
    const all = $(nodeName).all();
    const out = [];
    for (let i = 0; i < all.length; i++) {
      const j = all[i].json || {};
      if (j && Object.keys(j).length) out.push(j);
    }
    return out;
  } catch (e) {
    return [];
  }
};

const money = (x) => Math.round(x * 100) / 100;
const roundUp5 = (x) => Math.ceil(money(x) / 5) * 5;
const slug = (s) => String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]/g, '');

// ═══ RCv2.3 — SPOKEN PLACE RESOLVER ═══
// A direction field arrives however Retell heard it: a code ("MKE"), a full terminal name
// ("Milwaukee Mitchell International Airport"), or a plain town ("Kewaskum"). Airports resolve
// to the SAME terminal wording the zone lane already speaks, so the caller never hears a
// three-letter code and never hears two spellings of one airport. A town passes through verbatim.
const AIRPORT_NAME_INDEX = (() => {
  const idx = {};
  const codes = Object.keys(AIRPORT_NAMES);
  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    const name = AIRPORT_NAMES[code];
    idx[slug(code)] = name;
    idx[slug(name)] = name;
    idx[slug(name + ' airport')] = name;
    idx[slug(name + ' international airport')] = name;
  }
  return idx;
})();

const placeSpoken = (raw) => {
  const s = String(raw == null ? '' : raw).trim();
  if (!s) return '';
  const direct = AIRPORT_NAME_INDEX[slug(s)];
  if (direct) return direct;
  const stripped = s.replace(/\s+(international\s+)?airport$/i, '').trim();
  const trimmed = AIRPORT_NAME_INDEX[slug(stripped)];
  if (trimmed) return trimmed;
  return s;
};

const httpGetJson = async (url, extraHeaders) => {
  const headers = Object.assign({
    'User-Agent': 'AIChauffeurRateEngine/2.2 (+https://circulant.app.n8n.cloud)',
    'Accept': 'application/json'
  }, extraHeaders || {});
  if (SELF && SELF.helpers && typeof SELF.helpers.httpRequest === 'function') {
    return await SELF.helpers.httpRequest({ method: 'GET', url: url, headers: headers, json: true, timeout: 6500 });
  }
  if (typeof fetch === 'function') {
    const r = await fetch(url, { headers: headers });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  }
  throw new Error('no HTTP transport available in Code node');
};

const geocode = async (q) => {
  const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=us&q=' + encodeURIComponent(q);
  const res = await httpGetJson(url);
  if (Array.isArray(res) && res.length && res[0].lat && res[0].lon) {
    return { lat: Number(res[0].lat), lon: Number(res[0].lon), label: String(res[0].display_name || q) };
  }
  throw new Error('geocode returned no result for "' + q + '"');
};

const haversineMiles = (a, b) => {
  const R = 3958.7613;
  const toR = (d) => d * Math.PI / 180;
  const dLat = toR(b.lat - a.lat);
  const dLon = toR(b.lon - a.lon);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

const routeMilesMinutes = async (a, b) => {
  try {
    const url = 'https://router.project-osrm.org/route/v1/driving/' + a.lon + ',' + a.lat + ';' + b.lon + ',' + b.lat + '?overview=false';
    const res = await httpGetJson(url);
    if (res && res.code === 'Ok' && res.routes && res.routes.length) {
      const mi = res.routes[0].distance / 1609.344;
      const mins = (res.routes[0].duration / 60) * 1.2; // free-flow to traffic-adjusted
      return { miles: mi, minutes: mins, method: 'osrm' };
    }
    throw new Error('osrm returned ' + (res && res.code));
  } catch (e) {
    const mi = haversineMiles(a, b) * 1.28;
    return { miles: mi, minutes: (mi / 42) * 60, method: 'haversine' };
  }
};

// TOLERANT DATE PARSER — liberal in, strict out; date-only defaults to noon.
const parsePickupAt = (raw, TZ) => {
  let s = String(raw == null ? '' : raw).trim();
  if (!s) return DateTime.invalid('empty');
  s = s.replace(/(\d{1,2})(st|nd|rd|th)\b/gi, '$1');
  s = s.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').trim();
  const hasTime = /(\d{1,2}[:.]\d{2})|(\b\d{1,2}\s*(a\.?m\.?|p\.?m\.?)\b)/i.test(s);
  let dt = DateTime.fromISO(s, { zone: TZ });
  const tries = ['yyyy-MM-dd HH:mm','yyyy-MM-dd h:mm a','yyyy-MM-dd h a','MMMM d, yyyy, h:mm a','MMMM d, yyyy, h a','MMMM d, yyyy h:mm a','MMMM d, yyyy h a','MMMM d yyyy h:mm a','MMM d, yyyy, h:mm a','MMM d, yyyy h:mm a','M/d/yyyy h:mm a','M/d/yyyy H:mm','MMMM d, yyyy, HH:mm','MMMM d yyyy HH:mm','MMMM d, yyyy','MMM d, yyyy','M/d/yyyy'];
  for (let i = 0; i < tries.length && !dt.isValid; i++) {
    dt = DateTime.fromFormat(s, tries[i], { zone: TZ });
  }
  if (!dt.isValid) {
    const js = new Date(s);
    if (!isNaN(js.getTime())) {
      dt = DateTime.fromObject({ year: js.getFullYear(), month: js.getMonth() + 1, day: js.getDate(), hour: js.getHours(), minute: js.getMinutes() }, { zone: TZ });
    }
  }
  if (dt.isValid && !hasTime) dt = dt.set({ hour: 12, minute: 0 });
  return dt;
};

const v = $('Verify + Normalize').first().json;
const inp = v.inputs || {};

const out = {
  quote_id: null,
  all_in_total: null,
  breakdown: [],
  service_fee_included: true,
  service_fee_amount: 0,
  status: 'RATE_ENGINE_FAILED',
  rate_source: 'none',
  quote_source: 'NONE',
  rate_card_version: RATE_CARD_VERSION,
  calculation_version: RATE_CARD_VERSION,
  currency: 'USD',
  tenant_id: v.tenant_id,
  call_id: v.call_id,
  quote_only_vehicle: false,
  superseded_quote_id: null,
  demo_framing: '',
  year_rolled: false,
  route_miles: null,
  route_duration_minutes: null,
  distance_miles: null,
  drive_minutes: null,
  mileage_price: null,
  time_price: null,
  transfer_minimum: null,
  tolls: 0,
  suggested_vehicle: '',
  capacity_ok: true,
  minimum_applied: false,
  spoken_trip: '',
  multipliers_applied: [],
  normalized_origin: '',
  normalized_destination: '',
  exact_rate_row: '',
  reason: '',
  message: '',
  http_status: 200,
  write_audit: false,
  supersede_call_id: '',
  input_hash: v.input_hash,
  input_snapshot: v.canonical
};

try {
  if (!v.auth_ok) {
    out.status = 'UNAUTHORIZED';
    out.http_status = 401;
    out.reason = v.auth_reason || 'authentication failed';
    out.message = 'Unauthorized.';
    return [{ json: out }];
  }

  const policies = rows('Load Pricing Policy');
  let policy = null;
  for (let i = 0; i < policies.length; i++) {
    if (String(policies[i].tenant_id) === String(v.tenant_id)) { policy = policies[i]; break; }
  }
  if (!policy && policies.length) policy = policies[0];
  if (!policy) {
    out.status = 'RATE_ENGINE_FAILED';
    out.reason = 'pricing_policies has no row for tenant ' + v.tenant_id;
    out.message = 'Let me have dispatch confirm that rate and call you right back.';
    return [{ json: out }];
  }

  const SC_PCT = Number(policy.service_charge_percent);
  const SC_LABEL = SERVICE_FEE_LABEL; // code layer wins; the stored label is legacy
  const TZ = String(policy.timezone || 'America/Chicago');
  out.currency = String(policy.currency || 'USD');

  const mode = inp.pricing_mode_req || String(policy.pricing_mode || 'QUOTE_ENABLED').toUpperCase();
  if (mode === 'CAPTURE_ONLY') {
    out.status = 'CAPTURE_ONLY';
    out.rate_source = 'none';
    out.reason = 'pricing_mode is CAPTURE_ONLY for this tenant';
    out.message = 'I have the trip details. Dispatch will confirm the rate with you.';
    out.write_audit = true;
    out.quote_id = 'q_' + crypto.randomUUID();
    return [{ json: out }];
  }

  const is_corporate = !!(inp.corporate_flag || inp.account_type === 'corporate' || inp.account_type === 'affiliate' || inp.account_type === 'farm_out');

  const trip = inp.trip_type;
  if (trip !== 'hourly' && trip !== 'airport' && trip !== 'point_to_point') {
    out.status = 'INPUT_INCOMPLETE';
    out.reason = 'trip_type must be "hourly", "airport", or "point_to_point"; received "' + trip + '"';
    out.message = 'Is this an airport transfer, point-to-point service, or an hourly charter?';
    return [{ json: out }];
  }

  const vclasses = rows('Load Vehicle Classes');
  let vc = null;
  for (let i = 0; i < vclasses.length; i++) {
    if (slug(vclasses[i].vehicle_key) === slug(inp.vehicle_key) && String(vclasses[i].tenant_id) === String(v.tenant_id)) { vc = vclasses[i]; break; }
  }
  if (!vc) {
    out.status = 'INPUT_INCOMPLETE';
    out.reason = 'vehicle_key "' + inp.vehicle_key + '" is not in vehicle_classes for tenant ' + v.tenant_id;
    out.message = 'Which vehicle would you like? I can check sedans, SUVs, sprinters, limos, party buses and coaches.';
    return [{ json: out }];
  }
  const nat = NAT[String(vc.vehicle_key)] || NAT[slug(inp.vehicle_key)] || null;

  if (inp.passengers !== null && inp.passengers !== undefined) {
    const pax = inp.passengers;
    const bags = (inp.bags === null || inp.bags === undefined) ? 0 : inp.bags;
    let sug = 'motorcoach_56';
    if (pax <= 3 && bags <= 2) sug = 'sedan_exec';
    else if (pax <= 6 && bags <= 6) sug = 'suv_exec';
    else if (pax <= 3 && bags > 2) sug = 'suv_exec';
    else if (pax <= 14) sug = 'sprinter_exec_14';
    else if (pax <= 24) sug = 'party_bus_20';
    out.suggested_vehicle = sug;
    const cap = Number(vc.cap) || null;
    if (cap && pax > cap) out.capacity_ok = false;
  }

  if (!inp.pickup_at) {
    out.status = 'INPUT_INCOMPLETE';
    out.reason = 'pickup_at is required to determine day, occasion, and traffic pricing';
    out.message = 'What date and time do you need the pickup?';
    return [{ json: out }];
  }

  let dt = parsePickupAt(inp.pickup_at, TZ);
  if (!dt.isValid) {
    out.status = 'INPUT_INCOMPLETE';
    out.reason = 'pickup_at "' + inp.pickup_at + '" could not be parsed as a date/time';
    out.message = 'What date and time do you need the pickup?';
    return [{ json: out }];
  }
  if (String(inp.pickup_at).indexOf('Z') >= 0 || /[+-]\d{2}:?\d{2}$/.test(String(inp.pickup_at))) dt = dt.setZone(TZ);

  let rolls = 0;
  const nowTZ = DateTime.now().setZone(TZ);
  const nowGuard = nowTZ.minus({ hours: 24 });
  while (dt < nowGuard && rolls < 5) { dt = dt.plus({ years: 1 }); rolls++; }
  if (rolls > 0) out.year_rolled = true;

  const pickup_date = dt.toFormat('yyyy-MM-dd');
  const pickup_hour = dt.hour;
  const wd = dt.weekday;
  const day_type = (wd === 5 || wd === 6 || wd === 7) ? 'weekend' : 'weekday';

  let holiday_label = '';
  const holidays = rows('Load Holidays');
  for (let i = 0; i < holidays.length; i++) {
    const h = holidays[i];
    if (String(h.holiday_date) === pickup_date && String(h.tenant_id) === String(v.tenant_id)) { holiday_label = String(h.label); break; }
  }
  const is_late = (pickup_hour >= 23 || pickup_hour < 5);
  const is_same_day = (pickup_date === nowTZ.toFormat('yyyy-MM-dd'));

  if (inp.stops_count > 3) {
    out.status = 'HUMAN_REVIEW_REQUIRED';
    out.reason = 'stops_count ' + inp.stops_count + ' exceeds 3; multi-stop routing is priced by dispatch';
    out.message = 'With more than three stops dispatch prices the run. They will confirm it with you.';
    out.write_audit = true;
    out.quote_id = 'q_' + crypto.randomUUID();
    return [{ json: out }];
  }

  const priors_all = rows('Load Prior Quotes');
  const prior_rows = [];
  for (let i = 0; i < priors_all.length; i++) {
    const p = priors_all[i];
    if (String(p.call_id) !== String(v.call_id) || !v.call_id) continue;
    if (String(p.status) === 'SUPERSEDED') continue;
    prior_rows.push(p);
  }
  const is_first_quote = prior_rows.length === 0;

  const bd = [];
  let core = 0;
  let basis_label = '';   // internal / receipt detail only — never spoken
  let spoken_trip = '';   // what the caller actually hears
  let minimum_applied = false;
  let lane = '';

  if (trip === 'hourly') {
    if (!nat) {
      out.status = 'RATE_ENGINE_FAILED';
      out.reason = 'no national matrix row for ' + inp.vehicle_key;
      out.message = 'Let me have dispatch confirm that rate and call you right back.';
      return [{ json: out }];
    }
    if (inp.requested_hours === null) {
      out.status = 'INPUT_INCOMPLETE';
      out.reason = 'requested_hours is required for an hourly charter';
      out.message = 'How many hours do you need the vehicle for?';
      return [{ json: out }];
    }
    const billable = Math.max(inp.requested_hours, nat.min_hours);
    core = money(nat.time_rate * billable);
    lane = 'hourly';
    basis_label = billable + ' hours at $' + nat.time_rate + '/hr' + (billable > inp.requested_hours ? ' (' + nat.min_hours + '-hour executive minimum)' : '');
    minimum_applied = billable > inp.requested_hours;
    spoken_trip = billable + (billable === 1 ? ' hour' : ' hours') + ' of dedicated service';
    out.rate_source = 'hourly';
    out.quote_source = 'HOURLY_MINIMUM';
    bd.push({ label: String(vc.name) + ' - hourly charter', amount: core, detail: basis_label, billable_hours: billable, hourly_rate: nat.time_rate, minimum_hours: nat.min_hours, requested_hours: inp.requested_hours, day_type: day_type });
  } else {
    const is_airport = (trip === 'airport');
    if (is_airport && (!inp.origin || !inp.airport)) {
      out.status = 'INPUT_INCOMPLETE';
      out.reason = 'both origin and airport are required for an airport transfer';
      out.message = 'Which city are we picking up in, and which airport?';
      return [{ json: out }];
    }
    if (!is_airport && (!inp.origin || !inp.destination)) {
      out.status = 'INPUT_INCOMPLETE';
      out.reason = 'both origin and destination are required for point-to-point service';
      out.message = 'Where are we picking up, and where are we headed?';
      return [{ json: out }];
    }

    let zone = null;
    let adj_valid = false;
    let adj = null;
    if (is_airport) {
      const adjusts = rows('Load Airport Adjust');
      for (let i = 0; i < adjusts.length; i++) {
        if (slug(adjusts[i].vehicle_key) === slug(inp.vehicle_key) && String(adjusts[i].tenant_id) === String(v.tenant_id)) { adj = adjusts[i]; break; }
      }
      adj_valid = !!(adj && !(adj.review_required === true || String(adj.review_required) === 'true') && String(adj.basis) !== 'none' && Number(adj.multiplier) > 0);
      const zones = rows('Load Airport Zones');
      for (let i = 0; i < zones.length; i++) {
        const z = zones[i];
        if (String(z.tenant_id) !== String(v.tenant_id)) continue;
        if (slug(z.origin) === slug(inp.origin) && slug(z.airport) === slug(inp.airport)) { zone = z; break; }
      }
    }

    if (zone && adj_valid) {
      const basis = String(adj.basis);
      const basis_base = Number(basis === 'sedan' ? zone.sedan_base : zone.suv_base);
      const mult = Number(adj.multiplier);
      const base = money(basis_base * mult);
      const sc = money(base * (SC_PCT / 100));
      core = money(base + sc);
      lane = 'zone';
      basis_label = String(zone.origin) + ' to ' + String(zone.airport) + ', ' + basis + ' base $' + basis_base + (mult === 1 ? '' : ' x ' + mult);
      spoken_trip = String(zone.origin) + ' to ' + airportSpoken(zone.airport);
      out.rate_source = 'airport';
      out.quote_source = 'EXACT_ZONE';
      out.exact_rate_row = String(zone.origin) + '->' + String(zone.airport);
      out.normalized_origin = String(zone.origin);
      out.normalized_destination = String(zone.airport);
      bd.push({ label: String(vc.name) + ' - airport transfer', amount: base, detail: basis_label, zone_origin: String(zone.origin), zone_airport: String(zone.airport), basis: basis, basis_base: basis_base, multiplier: mult, zone_review_status: String(zone.review_status), day_type: day_type });
      bd.push({ label: SC_LABEL, amount: sc, detail: SC_PCT + '% of $' + base + ', included in the total' });
    } else {
      if (!nat) {
        out.status = 'RATE_ENGINE_FAILED';
        out.reason = 'no national matrix row for ' + inp.vehicle_key + ' — rate card gap is a true engine failure';
        out.message = 'Let me have dispatch confirm that rate and call you right back.';
        return [{ json: out }];
      }
      let od = null;
      let dd = null;
      try {
        if (is_airport) {
          const code = String(inp.airport).toUpperCase();
          dd = IATA[code] ? { lat: IATA[code][0], lon: IATA[code][1], label: code } : await geocode(code + ' airport');
          od = await geocode(inp.origin);
        } else {
          od = await geocode(inp.origin);
          dd = await geocode(inp.destination);
        }
      } catch (geoErr) {
        out.status = 'HUMAN_REVIEW_REQUIRED';
        out.reason = 'distance service failure: ' + String(geoErr && geoErr.message ? geoErr.message : geoErr);
        out.message = 'Dispatch will confirm the exact rate for that route and get right back to you.';
        out.write_audit = true;
        out.quote_id = 'q_' + crypto.randomUUID();
        return [{ json: out }];
      }
      const leg = await routeMilesMinutes(od, dd);
      const miles = Math.round(leg.miles * 10) / 10;
      const minutes = Math.round(leg.minutes);
      const mileage_price = money(miles * nat.per_mi);
      const time_price = money((minutes / 60) * nat.time_rate);
      core = money(Math.max(nat.floor, mileage_price, time_price));
      lane = 'national';
      const dest_label = is_airport ? String(inp.airport).toUpperCase() : inp.destination;
      basis_label = inp.origin + ' to ' + dest_label + ', about ' + Math.round(miles) + ' miles / ' + minutes + ' minutes';
      spoken_trip = inp.origin + ' to ' + (is_airport ? airportSpoken(dest_label) : dest_label);
      minimum_applied = (core === nat.floor);
      out.rate_source = 'distance_time';
      out.quote_source = (leg.method === 'haversine') ? 'DEMO_GEO_FALLBACK' : 'ROUTE_DISTANCE_TIME';
      out.route_miles = miles;
      out.route_duration_minutes = minutes;
      out.distance_miles = miles;
      out.drive_minutes = minutes;
      out.mileage_price = mileage_price;
      out.time_price = time_price;
      out.transfer_minimum = nat.floor;
      out.normalized_origin = od.label ? String(od.label).split(',').slice(0, 2).join(',') : inp.origin;
      out.normalized_destination = dd.label ? String(dd.label).split(',').slice(0, 2).join(',') : dest_label;
      const drivers = [];
      if (core === nat.floor) drivers.push('transfer minimum $' + nat.floor);
      else if (core === mileage_price) drivers.push(miles + ' mi x $' + nat.per_mi);
      else drivers.push(minutes + ' min at $' + nat.time_rate + '/hr');
      bd.push({ label: String(vc.name) + ' - ' + (is_airport ? 'airport transfer' : 'point-to-point'), amount: core, detail: basis_label + ' (' + drivers[0] + ')', miles: miles, minutes: minutes, per_mile: nat.per_mi, time_rate: nat.time_rate, transfer_minimum: nat.floor, route_method: leg.method, day_type: day_type });
    }
  }

  const requested_addons = [];
  for (let i = 0; i < inp.addons.length; i++) requested_addons.push(inp.addons[i]);

  let addon_total = 0;
  for (let i = 0; i < requested_addons.length; i++) {
    const req = requested_addons[i];
    const k = slug(req.key);
    if (k === 'latenight') continue; // occasion multiplier, not a chargeable row
    if (k === 'meetgreet') {
      const amt = ADDON_FLAT.meet_greet;
      addon_total = money(addon_total + amt);
      bd.push({ label: 'Inside meet-and-greet', amount: amt, detail: 'chauffeur at baggage claim with sign', addon_key: 'meet_greet', qty: 1 });
    } else if (k === 'childseat') {
      if (!req.seat_type) {
        out.status = 'INPUT_INCOMPLETE';
        out.reason = 'child_seat requires seat_type (infant, convertible, or booster)';
        out.message = 'What kind of child seat do you need: infant, convertible, or booster?';
        return [{ json: out }];
      }
      const qty = req.qty || 1;
      const amt = money(ADDON_FLAT.child_seat * qty);
      addon_total = money(addon_total + amt);
      bd.push({ label: 'Child seat', amount: amt, detail: qty + ' x $' + ADDON_FLAT.child_seat + ', ' + req.seat_type, addon_key: 'child_seat', qty: qty });
    } else if (k === 'curbside') {
      bd.push({ label: 'Curbside pickup', amount: 0, detail: 'included', addon_key: 'curbside', qty: 1 });
    } else {
      out.status = 'HUMAN_REVIEW_REQUIRED';
      out.reason = 'add-on "' + req.key + '" is not on the demo card';
      out.message = 'Dispatch will confirm the price for that extra.';
      out.write_audit = true;
      out.quote_id = 'q_' + crypto.randomUUID();
      return [{ json: out }];
    }
  }
  if (inp.stops_count > 0 && inp.stops_count <= 3) {
    const amt = money(ADDON_FLAT.extra_stop * inp.stops_count);
    addon_total = money(addon_total + amt);
    bd.push({ label: 'Additional stops', amount: amt, detail: inp.stops_count + ' x $' + ADDON_FLAT.extra_stop, addon_key: 'extra_stop', qty: inp.stops_count });
  }

  let mult_factor = 1;
  if (is_late) { mult_factor *= MULT.late_night; out.multipliers_applied.push('late_night x' + MULT.late_night); }
  if (is_same_day) { mult_factor *= MULT.same_day; out.multipliers_applied.push('same_day x' + MULT.same_day); }
  if (holiday_label) { mult_factor *= MULT.holiday; out.multipliers_applied.push('holiday x' + MULT.holiday + ' (' + holiday_label + ')'); }

  let all_in;
  if (mult_factor !== 1) {
    const pre = money((core + addon_total) * mult_factor);
    all_in = roundUp5(pre);
    bd.push({ label: 'Occasion adjustment', amount: money(all_in - core - addon_total), detail: out.multipliers_applied.join(', ') });
  } else if (lane === 'zone') {
    // CLEAN NUMBER LAW (RCv2.2): a premium desk never speaks cents. Whole-dollar ceiling on the
    // zone lane keeps $162 / $216 / $318 byte-identical while $663.10 lands as $664.
    all_in = Math.ceil(money(core + addon_total));
  } else {
    all_in = roundUp5(core + addon_total);
  }

  out.quote_id = 'q_' + crypto.randomUUID();
  out.all_in_total = all_in;
  out.breakdown = bd;
  out.status = 'QUOTED';
  out.write_audit = true;
  out.base_amount = core;
  out.service_charge_amount = (lane === 'zone') ? bd.filter(b => b.label === SC_LABEL).reduce((s, b) => s + b.amount, 0) : 0;
  out.addons_amount = addon_total;
  out.day_type = day_type;
  out.pickup_local = dt.toFormat('yyyy-MM-dd HH:mm ZZZZ');
  out.vehicle_name = String(vc.name);
  out.basis_label = basis_label;
  out.account_type = is_corporate ? 'corporate' : 'retail';
  out.rate_label = is_corporate ? 'corporate rate' : 'rate';
  out.tax_amount = Number(policy.tax_amount);
  out.fuel_included = true;
  out.tolls_included = true;
  out.service_fee_amount = out.service_charge_amount;
  out.minimum_applied = minimum_applied;
  // ═══ DIRECTION OVERRIDE (RCv2.3) ═══
  // The zone row is direction-agnostic: one (Kewaskum, MKE) row prices both the MKE arrival and
  // the MKE departure. Until now the spoken phrase always read origin-to-airport, so an arrival
  // was described backwards to the caller who was standing in the terminal. When Retell supplies
  // both direction fields, the route phrase and the normalized labels follow the real direction
  // of travel. Price, zone lookup, ladder, rounding and breakdown are untouched — wording only.
  // Both fields absent or blank => byte-identical to RCv2.2.
  // Hourly is excluded on purpose: its phrase is a duration ("3 hours of dedicated service"),
  // not a route, and overwriting it would drop the hours the caller is actually buying.
  if (trip !== 'hourly' && inp.trip_origin && inp.trip_destination) {
    const dir_from = placeSpoken(inp.trip_origin);
    const dir_to = placeSpoken(inp.trip_destination);
    if (dir_from && dir_to) {
      spoken_trip = dir_from + ' to ' + dir_to;
      out.normalized_origin = dir_from;
      out.normalized_destination = dir_to;
    }
  }
  out.spoken_trip = spoken_trip;
  out.reason = 'priced from ' + out.quote_source + ' on card ' + RATE_CARD_VERSION + (is_corporate ? ' (corporate account, demo card parity)' : '') + (out.year_rolled ? ' (pickup year rolled forward to next occurrence)' : '');
  // SPOKEN LINE: vehicle, route, one all-in number, service fee. No base price, no mileage,
  // no minutes, no minimum mechanics, no cents, and never the word gratuity.
  out.message = (is_corporate ? 'Your corporate rate. ' : '') + String(vc.name) + ', ' + spoken_trip + '. All in, that\'s ' + fmtMoney(all_in) + ', service fee included.';

  if (is_first_quote) {
    out.demo_framing = DEMO_FRAMING;
    out.message = DEMO_FRAMING + ' ' + out.message;
  }

  let live_match = null;
  let newest_prior = null;
  for (let i = 0; i < prior_rows.length; i++) {
    const p = prior_rows[i];
    if (String(p.input_hash) === String(v.input_hash)) live_match = p;
    newest_prior = p;
  }

  if (live_match) {
    out.quote_id = String(live_match.quote_id);
    out.write_audit = false;
    out.reason = 'idempotent replay: identical inputs already quoted on this call';
    try {
      const prevBd = JSON.parse(String(live_match.breakdown));
      if (Array.isArray(prevBd)) out.breakdown = prevBd;
      out.all_in_total = Number(live_match.all_in_total);
    } catch (e) { /* keep freshly computed values */ }
  } else if (newest_prior) {
    out.superseded_quote_id = String(newest_prior.quote_id);
    out.supersede_call_id = String(v.call_id);
  }

  return [{ json: out }];
} catch (err) {
  out.status = 'RATE_ENGINE_FAILED';
  out.all_in_total = null;
  out.breakdown = [];
  out.write_audit = false;
  out.reason = 'engine exception: ' + String(err && err.message ? err.message : err);
  out.message = 'Let me have dispatch confirm that rate and call you right back.';
  return [{ json: out }];
}
