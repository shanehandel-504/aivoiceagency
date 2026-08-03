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

let auth_ok = false;
let auth_mode = 'none';
let auth_reason = '';

if (!SECRET) {
  auth_reason = 'RATE_SHARED_SECRET is not set in n8n Variables';
} else {
  const sig = hdr('x-retell-signature');
  const shared = hdr('x-rate-secret');
  if (sig) {
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
  } else if (shared) {
    auth_mode = 'shared';
    auth_ok = ctEq(shared, SECRET);
    if (!auth_ok) auth_reason = 'x-rate-secret did not match the shared secret';
  } else {
    auth_reason = 'neither x-retell-signature nor x-rate-secret was supplied';
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

const norm_addons = [];
for (let i = 0; i < addons_in.length; i++) {
  const a = addons_in[i] || {};
  const key = str(a.key || a.addon_key || a.name).toLowerCase().replace(/[\s-]+/g, '_');
  if (!key) continue;
  const qty = num(a.qty || a.quantity) || 1;
  norm_addons.push({ key: key, qty: qty, seat_type: str(a.seat_type || a.type) });
}
norm_addons.sort((x, y) => (x.key < y.key ? -1 : x.key > y.key ? 1 : 0));

const inputs = {
  trip_type: str(args.trip_type || args.tripType).toLowerCase(),
  vehicle_key: str(args.vehicle_key || args.vehicle || args.vehicle_class).toLowerCase().replace(/[\s-]+/g, '_'),
  pickup_at: str(args.pickup_at || args.pickup_time || args.pickup_datetime || args.datetime),
  requested_hours: num(args.requested_hours || args.hours || args.duration_hours),
  origin: str(args.origin || args.pickup_city || args.from),
  airport: str(args.airport || args.airport_code || args.to).toUpperCase(),
  direction: str(args.direction).toLowerCase(),
  stops_count: num(args.stops_count || args.stops) || 0,
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
  inputs.airport,
  inputs.stops_count,
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
