// WF-TRY-WEBCALL · receipt limits. Every refusal here happens before anything
// reaches Retell, so a flood costs this workflow an execution and costs the
// Retell account nothing. State lives in workflow static data, same as the
// create-call side: a budget under concurrent runs, not a lock.
const NOW = Date.now();
const HOUR = 3600000;
const WINDOW = 7200000;   // a receipt is answered for two hours after the call started
const IP_POLLS = 60;      // per rolling hour — one call polls at most 15 times
const CALL_POLLS = 15;    // per call_id, ever: 45s of polling at 5s is 9
const MAX_CALLS = 500;

const req = $input.first().json;
const headers = req.headers || {};
const query = req.query && typeof req.query === 'object' ? req.query : {};
const callId = String(query.call_id || '');

// Same IP source as the create-call side: Cloudflare sets cf-connecting-ip and a
// client cannot forge it; a client CAN prepend its own x-forwarded-for entries.
function clientIp(h) {
  const cf = String(h['cf-connecting-ip'] || '').trim();
  if (cf) return cf;
  const xff = String(h['x-forwarded-for'] || '').split(',').map((s) => s.trim()).filter(Boolean);
  return xff.length ? xff[0] : 'unknown';
}
const ip = clientIp(headers);

const out = (json) => [{ json }];
const refuse = (status, error) => out({ next: false, status, body: { error } });

// A string that is not shaped like a call id never costs a request. 404 and not
// 400, so probing the endpoint tells an outsider nothing it did not already know.
if (!/^call_[0-9a-f]{16,64}$/.test(callId)) return refuse(404, 'not_found');

const S = $getWorkflowStaticData('global');
if (!S.rcIp || typeof S.rcIp !== 'object') S.rcIp = {};
if (!S.rcCall || typeof S.rcCall !== 'object') S.rcCall = {};
for (const k of Object.keys(S.rcIp)) {
  const kept = (Array.isArray(S.rcIp[k]) ? S.rcIp[k] : []).filter((t) => NOW - t < HOUR);
  if (kept.length) S.rcIp[k] = kept; else delete S.rcIp[k];
}
for (const k of Object.keys(S.rcCall)) {
  const e = S.rcCall[k];
  if (!e || typeof e !== 'object' || NOW - (e.t || 0) > WINDOW) delete S.rcCall[k];
}

// The ceiling is checked only for a call_id this workflow has not seen, so a
// visitor already polling is never evicted by a crowd arriving behind them.
const known = Object.prototype.hasOwnProperty.call(S.rcCall, callId);
if (!known && Object.keys(S.rcCall).length >= MAX_CALLS) return refuse(429, 'busy');

const seen = S.rcIp[ip] || [];
if (seen.length >= IP_POLLS) return refuse(429, 'rate_limited');
const entry = known ? S.rcCall[callId] : { n: 0, t: NOW };
if (entry.n >= CALL_POLLS) return refuse(429, 'rate_limited');

seen.push(NOW);
S.rcIp[ip] = seen;
entry.n += 1;
S.rcCall[callId] = entry;

return out({ next: true, call_id: callId });
