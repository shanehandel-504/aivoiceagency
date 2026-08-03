// WF-ANI · node "Verify + Normalize"
// Auth is byte-identical to WF-RATE: HMAC-SHA256 of the exact body under RATE_SHARED_SECRET,
// or the shared secret verbatim. Both compared with timingSafeEqual. Neither => 401.
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

// E.164 normalization. NANP numbers arrive as digits, +1XXXXXXXXXX, or spoken-with-punctuation.
const rawPhone = str(args.phone_e164 || args.phone || args.from_number || call.from_number);
let digits = rawPhone.replace(/[^0-9]/g, '');
if (digits.length === 10) digits = '1' + digits;
const phone_e164 = digits ? ('+' + digits) : '';
const phone_valid = /^\+[1-9]\d{7,14}$/.test(phone_e164);

return [{
  json: {
    auth_ok: auth_ok,
    auth_mode: auth_mode,
    auth_reason: auth_reason,
    phone_e164: phone_e164,
    phone_valid: phone_valid,
    phone_query: encodeURIComponent(phone_e164),
    tenant_id: str(args.tenant_id || body.tenant_id) || 'demo',
    call_id: str(args.call_id || body.call_id || call.call_id),
    started_ms: Date.now()
  }
}];
