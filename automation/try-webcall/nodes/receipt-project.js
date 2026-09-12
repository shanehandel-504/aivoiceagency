// WF-TRY-WEBCALL · the trip sheet the browser is allowed to see.
//
// Retell's call record carries the caller's name, mobile, email and the full
// transcript. None of that crosses this node. What leaves is the trip: where,
// when, how many, which car, what it was quoted at — plus the recording of the
// visitor's own call and a yes/no on whether a mobile was captured at all.
//
// THE TRANSCRIPT COMES BACK REDACTED, and the reason it comes back at all is a
// measured one. retell-client-js-sdk@3.0.1 does emit an `update` event carrying
// the running transcript — but these calls are allocated Retell's GATEWAY
// transport, whose "control" data channel delivered no transcript events at all
// on a real call (5 turns server-side, 0 on the page). So the page cannot draw
// the thread live and fills it from here once the call ends.
//
// A transcript is prose, and prose is where a spoken name, number or email
// lives. Three passes strip them: the exact values the analyser already
// extracted, then any email, then any run of digits long enough to be a phone
// number. Over-redaction is the safe direction and is chosen deliberately.
const WINDOW = 7200000;
const NOW = Date.now();
const r = $input.first().json;
const notFound = [{ json: { status: 404, body: { error: 'not_found' } } }];

if (!r || r.statusCode !== 200 || !r.body || typeof r.body !== 'object') return notFound;
const call = r.body;

// Only calls this page created, and only for two hours after they started. Any
// other call id on the account answers exactly like one that does not exist.
if (!call.metadata || call.metadata.source !== 'aichauffeur.ai/try') return notFound;
const started = Number(call.start_timestamp || 0);
if (!started || NOW - started > WINDOW) return notFound;

const a = call.call_analysis || null;
const d = (a && a.custom_analysis_data) || {};
const str = (v) => { const s = String(v == null ? '' : v).trim(); return s ? s.slice(0, 80) : null; };
const num = (v) => (typeof v === 'number' && isFinite(v) && v > 0 ? String(v) : null);

// caller_mobile is read as a yes/no and then dropped. The digits never leave.
const mobile = String(d.caller_mobile == null ? '' : d.caller_mobile).replace(/\D/g, '');

// The exact strings the analyser pulled out of this call, longest first so that
// a full name is removed before either of its halves can be matched separately.
const known = [d.caller_name, d.caller_mobile, d.caller_email]
  .map((v) => String(v == null ? '' : v).trim())
  .filter((v) => v.length >= 3)
  .sort((x, y) => y.length - x.length);

function scrub(line) {
  let out = String(line == null ? '' : line);
  for (const k of known) out = out.split(k).join('[removed]');
  out = out.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[removed]');
  out = out.replace(/(?:\+?\d[\s().-]*){7,}\d/g, '[removed]');
  return out.trim();
}

const turns = Array.isArray(call.transcript_object) ? call.transcript_object : [];
const thread = turns
  .filter((t) => t && typeof t.content === 'string' && t.content.trim())
  .map((t) => ({ role: t.role === 'user' ? 'user' : 'agent', content: scrub(t.content).slice(0, 400) }))
  .filter((t) => t.content)
  .slice(0, 120);

return [{ json: { status: 200, body: {
  status: a ? 'ready' : 'processing',
  pickup: str(d.origin_city),
  dropoff: str(d.dropoff_address),
  date: str(d.pickup_date),
  time: str(d.pickup_time),
  passengers: num(d.passenger_count),
  vehicle: str(d.vehicle_class),
  quote: str(d.quote_total),
  ticket: str(call.metadata.ticket),
  mobile_captured: mobile.length >= 10,
  recording_url: typeof call.recording_url === 'string' && /^https:\/\//.test(call.recording_url) ? call.recording_url : null,
  transcript: thread.length ? thread : null,
} } }];
