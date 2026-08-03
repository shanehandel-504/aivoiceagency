// WF-ANI · node "Build ANI Response"
// One GHL round trip only. /contacts/search/duplicate carries customFields (measured
// 2026-08-03: median ~200ms, cf present), so identity + last trip + billing all come
// from a single call and the 400ms budget holds. A second fetch would blow it.
const n = $('Verify + Normalize').first().json;
const res = $input.first().json || {};

// Hard endpoint budget. The GHL node's own timeout is set below this so a slow CRM
// degrades to a fast-miss instead of holding the agent on a silent line.
const BUDGET_MS = 400;

// GHL contact custom-field ids (contact model). Verified against the live location.
const F = {
  trip_type: 'qta1B3kERujMTLNDlj66',
  pickup_datetime: 'HOfBlSbheMOtChBuK0vU',
  pickup_address: 'L9FS4ZqII0OvQe5KESh7',
  dropoff_address: 'ISMLWbZhk0V9eVHXut86',
  vehicle_class: 'OtmDBeaHItbSvOUHRTGY',
  billing_type: 'Z36xyFEoF9brVdNeKAIP',
  tenant: '16MIe7L45qETn9TtcOK5'
};

const elapsed = Date.now() - (n.started_ms || Date.now());

// neverError is on the HTTP node, so a timeout / 401 / 5xx arrives as an ITEM, not a throw.
// A failed lookup must never be reported as a verified "not a customer" — that is the
// false-verification shape this endpoint exists to avoid. Any non-2xx, any error field,
// or a body with neither `contact` nor a trace id counts as a failure, not a miss.
const sc = Number(res.statusCode || res.status || 0);
const httpFailed = !!(
  res.error ||
  res.message === 'error' ||
  res.code ||
  (sc && (sc < 200 || sc >= 300)) ||
  (!Object.prototype.hasOwnProperty.call(res, 'contact') && !res.traceId)
);
const contact = (!httpFailed && res && res.contact) ? res.contact : null;

const cfMap = {};
const cfArr = (contact && Array.isArray(contact.customFields)) ? contact.customFields : [];
for (let i = 0; i < cfArr.length; i++) {
  const f = cfArr[i] || {};
  const id = f.id || f.fieldId || '';
  const v = (f.value !== undefined && f.value !== null) ? f.value : f.field_value;
  if (id) cfMap[id] = (v === undefined || v === null) ? '' : String(v);
}
const cf = (k) => (cfMap[F[k]] || '').trim();

const nn = (v) => {
  const s = (v === undefined || v === null) ? '' : String(v).trim();
  return s === '' ? null : s;
};

let reason = '';
let data_verified = false;
let known = false;

if (!n.auth_ok) {
  reason = 'unauthorized';
} else if (!n.phone_valid) {
  reason = 'NO_ANI — caller id was absent or not a dialable number';
} else if (httpFailed) {
  reason = 'FAST_MISS — CRM lookup failed or did not answer inside the ' + BUDGET_MS +
           'ms budget (http ' + (sc || 'n/a') + ')';
} else if (!contact || !contact.id) {
  reason = 'NO_MATCH — no CRM record for this number';
  data_verified = true; // the lookup completed; "not a customer" is a verified answer
} else {
  known = true;
  data_verified = true;
  reason = 'MATCH';
}

// account_type: corporate when the CRM says so (direct bill / new account) or a company
// is on file. Never guessed from the area code.
const billing = cf('billing_type').toUpperCase();
let account_type = null;
if (known) {
  if (billing === 'DIRECT_BILL' || billing === 'NEW_ACCOUNT') account_type = 'corporate';
  else if (billing === 'CC_ON_FILE') account_type = 'retail';
  else account_type = nn(contact.companyName) ? 'corporate' : 'retail';
}

// last_trip is only reported when the CRM actually holds one. Never invented.
let last_trip = null;
if (known) {
  const when = cf('pickup_datetime');
  const what = cf('trip_type');
  const from = cf('pickup_address');
  const to = cf('dropoff_address');
  const veh = cf('vehicle_class');
  if (when || what || from) {
    last_trip = {
      trip_type: nn(what),
      pickup_datetime: nn(when),
      pickup_address: nn(from),
      dropoff_address: nn(to),
      vehicle_class: nn(veh)
    };
  }
}

// rate_plan mirrors the billing arrangement on the record. Null when unset — a
// missing plan prints "— NOT PROVIDED" rather than defaulting a customer onto retail.
const rate_plan = known ? (nn(billing) ? billing : null) : null;

return [{
  json: {
    known_caller: known,
    first_name: known ? nn(contact.firstName) : null,
    company_name: known ? nn(contact.companyName) : null,
    account_type: account_type,
    last_trip: last_trip,
    rate_plan: rate_plan,
    ghl_contact_id: known ? nn(contact.id) : null,
    data_verified: data_verified,
    reason: reason,
    phone_e164: n.phone_e164 || null,
    tenant_id: n.tenant_id,
    call_id: n.call_id,
    lookup_ms: elapsed
  }
}];
