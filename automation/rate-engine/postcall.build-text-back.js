const CHAUFFEUR_AGENT = 'agent_8e9e7d477949c6babcbdcc756d';

const wh = ($('Retell Webhook').first().json || {}).body || {};
const call = wh.call || {};
const ca = call.call_analysis || {};
const cad = ca.custom_analysis_data || {};
const nz = $('Normalize').first().json || {};
const cr = $('Contact Ref').first().json || {};

let should_send = true;
let skip_reason = '';
const stop = (r) => { if (should_send) { should_send = false; skip_reason = r; } };

const contact_id = cr.contact_id || '';
if (!contact_id) stop('no GHL contact id on this call');
if (cr.is_internal === true || String(cr.is_internal) === 'true') stop('internal number, suppressed by the owner rail');

let dur_ms = Number(call.duration_ms || 0);
if (!dur_ms && call.end_timestamp && call.start_timestamp) dur_ms = Number(call.end_timestamp) - Number(call.start_timestamp);
if (dur_ms > 0 && dur_ms < 10000) stop('call ran ' + Math.round(dur_ms / 1000) + 's, under the 10s floor');

const dir = String(call.direction || '').toLowerCase();
if (dir && dir !== 'inbound') stop('direction is ' + dir + ', text-back is inbound only');

const dispo = String(cad.disposition || '') + ' ' + String(cad.spam || '') + ' ' + String(ca.call_summary || '');
if (cad.spam === true || String(cad.spam) === 'true') stop('spam flag on the call analysis');
if (call.in_voicemail === true || String(call.in_voicemail) === 'true') stop('call reached voicemail');
if (/\b(spam|robocall|telemarket|wrong number)\b/i.test(dispo)) stop('spam disposition in the call analysis');

const isChauffeur = String(nz.agent_id || '') === CHAUFFEUR_AGENT;

const qrows = [];
try {
  const all = $('Load Quote For SMS').all();
  for (let i = 0; i < all.length; i++) {
    const j = all[i].json || {};
    if (j && j.quote_id) qrows.push(j);
  }
} catch (e) { /* no quote node output */ }

const q = qrows.length ? qrows[0] : null;
const qStatus = q ? String(q.status || '') : '';
const hasQuote = !!(q && qStatus === 'QUOTED' && Number(q.all_in_total) > 0);

let vehicle = '';
let basis = '';
if (q) {
  try {
    const bd = JSON.parse(String(q.breakdown || '[]'));
    if (Array.isArray(bd) && bd.length) {
      vehicle = String(bd[0].label || '').replace(/ - (airport transfer|hourly)$/, '');
      basis = String(bd[0].detail || '');
    }
  } catch (e) { /* leave blank */ }
}

const STATUS_LINE = {
  QUOTED: 'Dispatch will confirm the details with you.',
  NO_ROUTE_FOUND: 'Dispatch will confirm the price for that route.',
  HUMAN_REVIEW_REQUIRED: 'Dispatch is setting the rate and will confirm it with you.',
  CORPORATE_RATE_REQUIRED: 'Your account is on contract pricing; dispatch will confirm that rate.',
  CAPTURE_ONLY: 'Dispatch will confirm the rate with you.'
};

let message = '';

if (isChauffeur && hasQuote) {
  const statusLine = STATUS_LINE[qStatus] || 'Dispatch will confirm the details with you.';
  message = 'AI Chauffeur — your quote: ' + vehicle + ', ' + basis + '. '
          + 'Gratuity & service included. All-in $' + Number(q.all_in_total) + '. '
          + statusLine + ' — AI Chauffeur Dispatch. Reply STOP to opt out.';
} else if (isChauffeur) {
  const statusLine = (q && STATUS_LINE[qStatus]) ? STATUS_LINE[qStatus] : 'Dispatch will confirm your rate shortly.';
  message = 'AI Chauffeur — thanks for calling. We have your trip details. '
          + statusLine + ' Call us back any time. — AI Chauffeur Dispatch. Reply STOP to opt out.';
} else {
  message = 'AVA here from AI Voice Agency — thanks for calling. '
          + '$497/mo, done-for-you, answers every call 24/7. '
          + 'Book a walkthrough: book.aivoiceagency.ai — AVA Team. Reply STOP to opt out.';
}

return [{
  json: {
    should_send: should_send,
    skip_reason: skip_reason,
    line: isChauffeur ? 'chauffeur' : 'ava',
    contact_id: contact_id,
    message: message,
    has_quote: hasQuote,
    quote_id: q ? String(q.quote_id) : '',
    quote_status: qStatus,
    quote_total: q ? Number(q.all_in_total) : null,
    vehicle: vehicle,
    basis: basis,
    duration_ms: dur_ms,
    direction: dir || 'unknown',
    call_id: nz.call_id || ''
  }
}];
