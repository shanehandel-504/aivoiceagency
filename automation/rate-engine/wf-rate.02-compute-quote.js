const crypto = require('crypto');

const RATE_CARD_VERSION = 'RCv1.0';

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

const round5 = (x) => Math.round(x / 5) * 5;
const money = (x) => Math.round(x * 100) / 100;
const slug = (s) => String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]/g, '');

const v = $('Verify + Normalize').first().json;
const inp = v.inputs || {};

const out = {
  quote_id: null,
  all_in_total: null,
  breakdown: [],
  gratuity_included: true,
  status: 'RATE_ENGINE_FAILED',
  rate_source: 'none',
  rate_card_version: RATE_CARD_VERSION,
  currency: 'USD',
  tenant_id: v.tenant_id,
  call_id: v.call_id,
  quote_only_vehicle: false,
  superseded_quote_id: null,
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
  const SC_LABEL = String(policy.service_charge_label || 'chauffeur gratuity & service');
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

  if (inp.corporate_flag || inp.account_type === 'corporate' || inp.account_type === 'affiliate' || inp.account_type === 'farm_out') {
    out.status = 'CORPORATE_RATE_REQUIRED';
    out.rate_source = 'none';
    out.reason = 'account_type ' + inp.account_type + ' is not priced on the retail card';
    out.message = 'That account is on contract pricing, so I will not quote a retail rate. Dispatch will confirm your contract rate.';
    out.write_audit = true;
    out.quote_id = 'q_' + crypto.randomUUID();
    return [{ json: out }];
  }

  const trip = inp.trip_type;
  if (trip !== 'hourly' && trip !== 'airport') {
    out.status = 'INPUT_INCOMPLETE';
    out.reason = 'trip_type must be "hourly" or "airport"; received "' + trip + '"';
    out.message = 'Is this an airport transfer or an hourly charter?';
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

  if (!inp.pickup_at) {
    out.status = 'INPUT_INCOMPLETE';
    out.reason = 'pickup_at is required to determine weekday vs weekend pricing';
    out.message = 'What date and time do you need the pickup?';
    return [{ json: out }];
  }

  let dt = DateTime.fromISO(inp.pickup_at, { zone: TZ });
  if (!dt.isValid) dt = DateTime.fromFormat(inp.pickup_at, 'yyyy-MM-dd HH:mm', { zone: TZ });
  if (!dt.isValid) dt = DateTime.fromFormat(inp.pickup_at, 'yyyy-MM-dd h:mm a', { zone: TZ });
  if (!dt.isValid) {
    out.status = 'INPUT_INCOMPLETE';
    out.reason = 'pickup_at "' + inp.pickup_at + '" could not be parsed as a date/time';
    out.message = 'What date and time do you need the pickup?';
    return [{ json: out }];
  }
  if (String(inp.pickup_at).indexOf('Z') >= 0 || /[+-]\d{2}:?\d{2}$/.test(String(inp.pickup_at))) dt = dt.setZone(TZ);

  const pickup_date = dt.toFormat('yyyy-MM-dd');
  const pickup_hour = dt.hour;
  const wd = dt.weekday;
  const day_type = (wd === 5 || wd === 6 || wd === 7) ? 'weekend' : 'weekday';

  const holidays = rows('Load Holidays');
  for (let i = 0; i < holidays.length; i++) {
    const h = holidays[i];
    if (String(h.holiday_date) === pickup_date && String(h.tenant_id) === String(v.tenant_id)) {
      out.status = 'HUMAN_REVIEW_REQUIRED';
      out.reason = 'pickup date ' + pickup_date + ' is a holiday (' + String(h.label) + '); holiday pricing is not on the rate card';
      out.message = 'That date is a holiday, so dispatch sets the rate. They will confirm it with you.';
      out.write_audit = true;
      out.quote_id = 'q_' + crypto.randomUUID();
      return [{ json: out }];
    }
  }

  if (vc.quote_only === true || String(vc.quote_only) === 'true') {
    out.status = 'HUMAN_REVIEW_REQUIRED';
    out.quote_only_vehicle = true;
    out.reason = String(vc.name) + ' is a quote-only vehicle on RCv1.0';
    out.message = 'The ' + String(vc.name) + ' is quoted by dispatch. They will confirm the rate with you.';
    out.write_audit = true;
    out.quote_id = 'q_' + crypto.randomUUID();
    return [{ json: out }];
  }

  if (inp.stops_count > 3) {
    out.status = 'HUMAN_REVIEW_REQUIRED';
    out.reason = 'stops_count ' + inp.stops_count + ' exceeds 3; multi-stop routing is priced by dispatch';
    out.message = 'With more than three stops dispatch prices the run. They will confirm it with you.';
    out.write_audit = true;
    out.quote_id = 'q_' + crypto.randomUUID();
    return [{ json: out }];
  }

  const bd = [];
  let base = 0;
  let basis_label = '';

  if (trip === 'hourly') {
    if (vc.hourly_enabled === false || String(vc.hourly_enabled) === 'false') {
      out.status = 'HUMAN_REVIEW_REQUIRED';
      out.reason = String(vc.name) + ' is not enabled for hourly charter';
      out.message = 'Dispatch will confirm hourly availability for that vehicle.';
      out.write_audit = true;
      out.quote_id = 'q_' + crypto.randomUUID();
      return [{ json: out }];
    }
    const hrates = rows('Load Hourly Rates');
    let hr = null;
    for (let i = 0; i < hrates.length; i++) {
      if (slug(hrates[i].vehicle_key) === slug(inp.vehicle_key) && String(hrates[i].tenant_id) === String(v.tenant_id)) { hr = hrates[i]; break; }
    }
    if (!hr) {
      out.status = 'RATE_ENGINE_FAILED';
      out.reason = 'no hourly_rates row for ' + inp.vehicle_key;
      out.message = 'Let me have dispatch confirm that rate and call you right back.';
      return [{ json: out }];
    }
    const rate = Number(day_type === 'weekend' ? hr.weekend : hr.weekday);
    const minimum = Number(day_type === 'weekend' ? vc.min_wkend : vc.min_wkday);
    const requested = inp.requested_hours;
    if (requested === null) {
      out.status = 'INPUT_INCOMPLETE';
      out.reason = 'requested_hours is required for an hourly charter';
      out.message = 'How many hours do you need the vehicle for?';
      return [{ json: out }];
    }
    const billable = Math.max(requested, minimum);
    base = round5(rate * billable);
    basis_label = billable + ' hours at $' + rate + '/hr (' + day_type + ')';
    out.rate_source = 'hourly';
    bd.push({ label: String(vc.name) + ' - hourly', amount: money(base), detail: basis_label, billable_hours: billable, hourly_rate: rate, minimum_hours: minimum, requested_hours: requested, day_type: day_type });
  } else {
    if (!inp.origin || !inp.airport) {
      out.status = 'INPUT_INCOMPLETE';
      out.reason = 'both origin and airport are required for an airport transfer';
      out.message = 'Which city are we picking up in, and which airport?';
      return [{ json: out }];
    }
    const zones = rows('Load Airport Zones');
    let zone = null;
    for (let i = 0; i < zones.length; i++) {
      const z = zones[i];
      if (String(z.tenant_id) !== String(v.tenant_id)) continue;
      if (slug(z.origin) === slug(inp.origin) && slug(z.airport) === slug(inp.airport)) { zone = z; break; }
    }
    if (!zone) {
      out.status = 'NO_ROUTE_FOUND';
      out.reason = 'no airport_zones row for origin "' + inp.origin + '" to airport "' + inp.airport + '"; the engine never estimates and never substitutes a nearest city';
      out.message = 'I do not have a set rate for that route, so dispatch will confirm the price with you.';
      out.write_audit = true;
      out.quote_id = 'q_' + crypto.randomUUID();
      return [{ json: out }];
    }
    const adjusts = rows('Load Airport Adjust');
    let adj = null;
    for (let i = 0; i < adjusts.length; i++) {
      if (slug(adjusts[i].vehicle_key) === slug(inp.vehicle_key) && String(adjusts[i].tenant_id) === String(v.tenant_id)) { adj = adjusts[i]; break; }
    }
    if (!adj) {
      out.status = 'RATE_ENGINE_FAILED';
      out.reason = 'no airport_vehicle_adjust row for ' + inp.vehicle_key;
      out.message = 'Let me have dispatch confirm that rate and call you right back.';
      return [{ json: out }];
    }
    if (adj.review_required === true || String(adj.review_required) === 'true') {
      out.status = 'HUMAN_REVIEW_REQUIRED';
      out.reason = String(vc.name) + ' has no airport multiplier on RCv1.0; stretch, party bus and coach classes are priced by dispatch for airport runs';
      out.message = 'For an airport run in the ' + String(vc.name) + ', dispatch sets the rate. They will confirm it with you.';
      out.write_audit = true;
      out.quote_id = 'q_' + crypto.randomUUID();
      return [{ json: out }];
    }
    const basis = String(adj.basis);
    const basis_base = Number(basis === 'sedan' ? zone.sedan_base : zone.suv_base);
    const mult = Number(adj.multiplier);
    base = round5(basis_base * mult);
    basis_label = String(zone.origin) + ' to ' + String(zone.airport) + ', ' + basis + ' base $' + basis_base + (mult === 1 ? '' : ' x ' + mult);
    out.rate_source = 'airport';
    bd.push({ label: String(vc.name) + ' - airport transfer', amount: money(base), detail: basis_label, zone_origin: String(zone.origin), zone_airport: String(zone.airport), basis: basis, basis_base: basis_base, multiplier: mult, zone_review_status: String(zone.review_status), day_type: day_type });
  }

  const sc = money(base * (SC_PCT / 100));
  bd.push({ label: SC_LABEL, amount: sc, detail: SC_PCT + '% of $' + money(base) + ', included in the total' });

  const addonDefs = rows('Load Addons');
  const findAddon = (k) => {
    for (let i = 0; i < addonDefs.length; i++) {
      if (slug(addonDefs[i].addon_key) === slug(k) && String(addonDefs[i].tenant_id) === String(v.tenant_id)) return addonDefs[i];
    }
    return null;
  };

  const requested_addons = [];
  for (let i = 0; i < inp.addons.length; i++) requested_addons.push(inp.addons[i]);

  const isLate = (pickup_hour >= 23 || pickup_hour < 5);
  let hasLate = false;
  for (let i = 0; i < requested_addons.length; i++) if (slug(requested_addons[i].key) === 'latenight') hasLate = true;
  if (isLate && !hasLate) requested_addons.push({ key: 'late_night', qty: 1, seat_type: '', auto: true });

  let addon_total = 0;
  for (let i = 0; i < requested_addons.length; i++) {
    const req = requested_addons[i];
    const def = findAddon(req.key);
    if (!def) {
      out.status = 'HUMAN_REVIEW_REQUIRED';
      out.reason = 'add-on "' + req.key + '" is not on the rate card';
      out.message = 'Dispatch will confirm the price for that extra.';
      out.write_audit = true;
      out.quote_id = 'q_' + crypto.randomUUID();
      return [{ json: out }];
    }
    if (def.review_required === true || String(def.review_required) === 'true') {
      out.status = 'HUMAN_REVIEW_REQUIRED';
      out.reason = 'add-on "' + String(def.addon_key) + '" routes to human review: ' + String(def.condition_note);
      out.message = 'Dispatch will confirm the price for that extra.';
      out.write_audit = true;
      out.quote_id = 'q_' + crypto.randomUUID();
      return [{ json: out }];
    }
    if (String(def.requires_input) === 'seat_type' && !req.seat_type) {
      out.status = 'INPUT_INCOMPLETE';
      out.reason = 'child_seat requires seat_type (infant, convertible, or booster)';
      out.message = 'What kind of child seat do you need: infant, convertible, or booster?';
      return [{ json: out }];
    }
    const unit = String(def.unit);
    const qty = unit === 'each' ? (req.qty || 1) : 1;
    const amt = money(Number(def.amount) * qty);
    addon_total = money(addon_total + amt);
    const detailBits = [];
    if (unit === 'each') detailBits.push(qty + ' x $' + Number(def.amount));
    if (req.seat_type) detailBits.push(String(req.seat_type));
    if (req.auto) detailBits.push('auto-applied, pickup ' + dt.toFormat('HH:mm'));
    bd.push({ label: String(def.label), amount: amt, detail: detailBits.join(', '), addon_key: String(def.addon_key), qty: qty });
  }

  const all_in = money(base + sc + addon_total);

  out.quote_id = 'q_' + crypto.randomUUID();
  out.all_in_total = all_in;
  out.breakdown = bd;
  out.status = 'QUOTED';
  out.write_audit = true;
  out.base_amount = money(base);
  out.service_charge_amount = sc;
  out.addons_amount = addon_total;
  out.day_type = day_type;
  out.pickup_local = dt.toFormat('yyyy-MM-dd HH:mm ZZZZ');
  out.vehicle_name = String(vc.name);
  out.basis_label = basis_label;
  out.tax_amount = Number(policy.tax_amount);
  out.fuel_included = policy.fuel_included === true || String(policy.fuel_included) === 'true';
  out.tolls_included = policy.tolls_included === true || String(policy.tolls_included) === 'true';
  out.reason = 'priced from ' + out.rate_source + ' card ' + RATE_CARD_VERSION;
  out.message = String(vc.name) + ', ' + basis_label + '. Gratuity and service are included. All in, that is $' + all_in + '.';

  const priors = rows('Load Prior Quotes');
  let live_match = null;
  let newest_prior = null;
  for (let i = 0; i < priors.length; i++) {
    const p = priors[i];
    if (String(p.call_id) !== String(v.call_id) || !v.call_id) continue;
    if (String(p.status) === 'SUPERSEDED') continue;
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
