const EMPTY = 'EMPTY — NO RESULT';
const REVIEW = 'REVIEW REQUIRED';
const inp = $input.first().json || {};
const b = inp.body || inp || {};
const c = b.call || {};
const an = c.call_analysis || {};
const cad = an.custom_analysis_data || {};

const val = (v) => { if (v === null || v === undefined) return null; const t = (v + '').trim(); return (t && t !== 'undefined' && t !== 'null' && t.toLowerCase() !== 'n/a') ? t : null; };
const esc = (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const used = [];
const pick = (...keys) => { for (const k of keys) { used.push(k); const v = val(cad[k]); if (v !== null) return v; } return null; };
const markUsed = (...keys) => { for (const k of keys) used.push(k); };

// ── SECOND SOURCE: collected_dynamic_variables ──
// On the live Aug-30 booked call (call_44e2...99aab) the airport was NEVER in
// custom_analysis_data under any name. It was only ever cdv.airport_code = "MKE".
// CAD stays primary; CDV is a scoped fallback consulted by pick2 for named keys only.
// Deliberately NOT a merge: CDV also carries router noise (previous_node, current_node,
// message, rate_input_valid) that must never land in OTHER CAPTURED FIELDS.
const cdv = c.collected_dynamic_variables || {};
const pick2 = (...keys) => { const v = pick(...keys); if (v !== null) return v; for (const k of keys) { const x = val(cdv[k]); if (x !== null) return x; } return null; };
const fmtPhone = (p) => { const d = String(p == null ? '' : p).replace(/[^0-9]/g, ''); const t = (d.length === 11 && d.charAt(0) === '1') ? d.slice(1) : d; return t.length === 10 ? ('(' + t.slice(0, 3) + ') ' + t.slice(3, 6) + '-' + t.slice(6)) : val(p); };

// ── HUMANIZERS: no raw enum, no bare true/false, no snake_case ever reaches a human ──
const TITLE = (s) => String(s || '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, (m) => m.toUpperCase());
const isTrue = (v) => v !== null && v !== undefined && !/^(false|no|none|0|n)$/i.test((v + '').trim());
const isFalse = (v) => v !== null && v !== undefined && /^(false|no|none|0|n|declined)$/i.test((v + '').trim());
const hTrip = (t) => { const s = (t || '').toLowerCase(); if (!s) return null; if (s.indexOf('airport') > -1) return 'Airport transfer'; if (s.indexOf('point') > -1 || s === 'p2p' || s.indexOf('city_to_city') > -1) return 'Point-to-point'; if (s.indexOf('hour') > -1 || s.indexOf('directed') > -1) return 'Hourly charter'; return TITLE(t); };
const hVeh = (v) => { const s = (v || '').toLowerCase(); if (!s) return null; const M = { sedan_exec: 'Executive Sedan', sedan_luxury: 'Luxury Sedan', suv_exec: 'Executive SUV', suv_premium: 'Premium Executive SUV', van_exec: 'Executive Van', van_ada: 'ADA Accessible Van', sprinter_exec_14: 'Executive Sprinter Coach', sprinter_luxury: 'Luxury Sprinter Coach', limo_stretch: 'Stretch Limousine', limo_super_stretch: 'Super Stretch Limousine', limo_hummer: 'Hummer Limousine', party_bus_20: 'Party Bus (20)', party_bus_30: 'Party Bus (30)', party_bus_40: 'Party Bus (40)', mini_coach_32: 'Mini Coach (32)', mini_coach_38: 'Mini Coach (38)', motorcoach_56: 'Motorcoach (56)', motorcoach_premium: 'Premium Motorcoach' }; return M[s] || TITLE(v); };
const hMeet = (m) => { const s = (m || '').toLowerCase(); if (!s) return null; if (s.indexOf('inside') > -1 || s.indexOf('greet') > -1) return 'Inside meet — chauffeur with a name sign'; if (s.indexOf('curb') > -1) return 'Curbside pickup'; return TITLE(m); };
const hMeetShort = (m) => { const s = (m || '').toLowerCase(); if (s.indexOf('inside') > -1 || s.indexOf('greet') > -1) return 'INSIDE MEET'; if (s.indexOf('curb') > -1) return 'CURBSIDE'; return TITLE(m).toUpperCase(); };
const hSeats = (s) => { const t = val(s); if (!t) return null; if (isFalse(t)) return null; if (/^\d+$/.test(t)) return t + (t === '1' ? ' seat' : ' seats'); return t.split(/[,;]+/).map((x) => TITLE(x)).filter(Boolean).join(', '); };
const hDir = (d) => { const s = (d || '').toLowerCase(); if (!s) return null; if (s.indexOf('from') > -1 || s.indexOf('arriv') > -1 || s.indexOf('pickup_at_airport') > -1) return 'Airport pickup — arrival'; if (s.indexOf('to') > -1 || s.indexOf('depart') > -1) return 'Airport drop-off — departure'; return TITLE(d); };
const APT = { MKE:'Milwaukee Mitchell International', ORD:"O'Hare International", MDW:'Chicago Midway', MSN:'Dane County Regional', GRB:'Green Bay Austin Straubel', ATW:'Appleton International', JFK:'JFK International', LGA:'LaGuardia', EWR:'Newark Liberty', DFW:'Dallas Fort Worth International', DAL:'Dallas Love Field', IAH:'Houston Intercontinental', HOU:'Houston Hobby', AUS:'Austin Bergstrom', SAT:'San Antonio International', ATL:'Hartsfield Jackson Atlanta', LAX:'Los Angeles International', DEN:'Denver International', PHX:'Phoenix Sky Harbor', MIA:'Miami International', SFO:'San Francisco International', LAS:'Harry Reid International', MSP:'Minneapolis Saint Paul', DTW:'Detroit Metropolitan', SEA:'Seattle Tacoma International', BOS:'Boston Logan', PHL:'Philadelphia International', CLT:'Charlotte Douglas', IAD:'Washington Dulles', DCA:'Reagan National', BWI:'Baltimore Washington International', SLC:'Salt Lake City International', STL:'Saint Louis Lambert', MCI:'Kansas City International', BNA:'Nashville International', IND:'Indianapolis International', CMH:'John Glenn Columbus', CVG:'Cincinnati Northern Kentucky', PIT:'Pittsburgh International', SAN:'San Diego International', MCO:'Orlando International', TPA:'Tampa International', FLL:'Fort Lauderdale Hollywood', SMF:'Sacramento International', PDX:'Portland International', RDU:'Raleigh Durham International' };
// A three-letter code is warehouse language. The receipt names the terminal.
// A bare code, a full terminal name, or an unambiguous city all resolve to the same name.
// A metro with more than one commercial field stays UNRESOLVED on purpose — picking one
// would be fiction, and an unresolved airport trips REVIEW REQUIRED with the ambiguity named.
const aptNorm = (s) => String(s == null ? '' : s).toUpperCase().replace(/[^A-Z]/g, '').replace(/INTL/g, 'INTERNATIONAL');
const APT_NAME = {};
for (const code in APT) {
  const n = aptNorm(APT[code]);
  if (!APT_NAME[n]) APT_NAME[n] = code;
  const bare = n.replace(/INTERNATIONAL$/, '');
  if (bare && !APT_NAME[bare]) APT_NAME[bare] = code;
}
const APT_ALIAS = {
  MILWAUKEE: 'MKE', MITCHELL: 'MKE', GENERALMITCHELL: 'MKE',
  OHARE: 'ORD', CHICAGOOHARE: 'ORD',
  MIDWAY: 'MDW', CHICAGOMIDWAY: 'MDW',
  PHOENIX: 'PHX', SKYHARBOR: 'PHX',
  MADISON: 'MSN', DANECOUNTY: 'MSN',
  GREENBAY: 'GRB', AUSTINSTRAUBEL: 'GRB', APPLETON: 'ATW',
  NEWARK: 'EWR', LAGUARDIA: 'LGA', KENNEDY: 'JFK', JOHNFKENNEDY: 'JFK',
  DULLES: 'IAD', REAGAN: 'DCA', NATIONAL: 'DCA', BALTIMORE: 'BWI',
  HOBBY: 'HOU', INTERCONTINENTAL: 'IAH', BUSH: 'IAH',
  LOVEFIELD: 'DAL', DALLASLOVE: 'DAL', DFW: 'DFW',
  AUSTIN: 'AUS', BERGSTROM: 'AUS', SANANTONIO: 'SAT',
  ATLANTA: 'ATL', HARTSFIELD: 'ATL', CHARLOTTE: 'CLT',
  MINNEAPOLIS: 'MSP', STPAUL: 'MSP', SAINTPAUL: 'MSP',
  DETROIT: 'DTW', SEATTLE: 'SEA', SEATAC: 'SEA', TACOMA: 'SEA',
  BOSTON: 'BOS', LOGAN: 'BOS', PHILADELPHIA: 'PHL', PHILLY: 'PHL',
  PITTSBURGH: 'PIT', COLUMBUS: 'CMH', CINCINNATI: 'CVG',
  STLOUIS: 'STL', SAINTLOUIS: 'STL', LAMBERT: 'STL', KANSASCITY: 'MCI',
  NASHVILLE: 'BNA', INDIANAPOLIS: 'IND', RALEIGH: 'RDU', DURHAM: 'RDU',
  LASVEGAS: 'LAS', VEGAS: 'LAS', MCCARRAN: 'LAS', HARRYREID: 'LAS',
  SALTLAKE: 'SLC', SALTLAKECITY: 'SLC', DENVER: 'DEN',
  LOSANGELES: 'LAX', SANFRANCISCO: 'SFO', SANDIEGO: 'SAN',
  SACRAMENTO: 'SMF', PORTLAND: 'PDX',
  ORLANDO: 'MCO', TAMPA: 'TPA', MIAMI: 'MIA',
  FORTLAUDERDALE: 'FLL', FTLAUDERDALE: 'FLL', HOLLYWOOD: 'FLL'
};
const APT_AMBIGUOUS = {
  CHICAGO: "O'Hare or Midway", DALLAS: 'DFW or Love Field',
  HOUSTON: 'Intercontinental or Hobby', NEWYORK: 'JFK, LaGuardia or Newark',
  NYC: 'JFK, LaGuardia or Newark', WASHINGTON: 'Dulles, Reagan National or BWI',
  WASHINGTONDC: 'Dulles, Reagan National or BWI', DC: 'Dulles, Reagan National or BWI'
};
const aptKey = (a) => { const t = val(a); if (!t) return null; return aptNorm(t).replace(/^THE/, '').replace(/AIRPORT$/, '').replace(/AIRFIELD$/, '').replace(/FIELD$/, '') || null; };
// A caller says "flying into ORD, terminal three". One embedded IATA code resolves; two do not.
const aptToken = (a) => { const t = val(a); if (!t) return null; const seen = {}; const toks = String(t).toUpperCase().split(/[^A-Z]+/); for (let i = 0; i < toks.length; i++) { const tk = toks[i]; if (tk.length === 3 && APT[tk]) seen[tk] = true; } const hits = Object.keys(seen); return hits.length === 1 ? hits[0] : null; };
const aptCode = (a) => {
  const k = aptKey(a); if (!k) return null;
  if (APT[k]) return k;
  if (APT_NAME[k]) return APT_NAME[k];
  if (APT_ALIAS[k]) return APT_ALIAS[k];
  const bare = k.replace(/INTERNATIONAL$/, '');
  if (APT_NAME[bare]) return APT_NAME[bare];
  if (APT_ALIAS[bare]) return APT_ALIAS[bare];
  return aptToken(a);
};
const aptAmbiguous = (a) => { const k = aptKey(a); if (!k) return null; return APT_AMBIGUOUS[k] || APT_AMBIGUOUS[k.replace(/INTERNATIONAL$/, '')] || null; };
const hApt = (a) => { const code = aptCode(a); return code ? APT[code] : null; };
const hSource = (q) => { const s = (q || '').toUpperCase(); const M = { EXACT_ZONE: 'Approved zone rate', ROUTE_DISTANCE_TIME: 'Routed distance and time', HOURLY_MINIMUM: 'Hourly charter minimum', DEMO_GEO_FALLBACK: 'Estimated route (router unavailable)', CACHE: 'Repeat of earlier quote' }; return M[s] || (q ? TITLE(q) : null); };
const hMoney = (q) => { const t = val(q); if (!t) return null; if (t.charAt(0) === '$') return t; const n = Number(t.replace(/[^0-9.]/g, '')); if (isNaN(n) || !n) return t; const s = n.toFixed(2); return '$' + (s.slice(-3) === '.00' ? s.slice(0, -3) : s); };

const TENANTS = {
  'agent_367be6cf3c722e89fca03e34b5': { name: 'Reliable Limo & Charter', short: 'Reliable Limo', mode: 'CAPTURE-ONLY' },
  'agent_2d1d687eb85e6d5d0e720795c2': { name: 'AI Chauffeur', short: 'AI Chauffeur', mode: 'RATE CARD' }
};
const agentId = val(c.agent_id) || '';
const T = TENANTS[agentId] || { name: val(cad.tenant_name) || 'AI Chauffeur', short: val(cad.tenant_name) || 'AI Chauffeur', mode: 'DEMO' };
const isAIC = T.short === 'AI Chauffeur';
const RESERVE_URL = isAIC ? 'https://aichauffeur.ai/reserve' : null;

let secs = null;
if (typeof c.duration_ms === 'number' && c.duration_ms >= 0) secs = Math.round(c.duration_ms / 1000);
else if (c.end_timestamp && c.start_timestamp) secs = Math.round((c.end_timestamp - c.start_timestamp) / 1000);
const dur = secs !== null ? (Math.floor(secs / 60) + 'm ' + (secs % 60) + 's') : null;

const caller = val(c.from_number);
const callId = val(c.call_id) || '';
const alnum = callId.replace(/[^a-zA-Z0-9]/g, '');
const last4 = (caller || '').replace(/[^0-9]/g, '').slice(-4);
const prefix = (T.short === 'Reliable Limo') ? 'REL' : 'AIC';
const intake = prefix + '-' + ((alnum.slice(-8).toUpperCase()) || 'DEMO') + (last4 ? ('-' + last4) : '');

const tripTypeRaw = pick('trip_type', 'service_type', 'type');
const tripType = hTrip(tripTypeRaw);
const serviceMode = pick('service_mode');
const pickupDate = pick('pickup_date', 'date', 'trip_date');
const pickupTime = pick('pickup_time', 'time');
const flight = pick('airline_flight', 'flight', 'flight_number', 'airline', 'tail_number');
const flightType = pick('flight_type');
// Named airport keys first, CAD then CDV. pickup_location is consulted LAST and only when it
// actually resolves to a terminal, so a street address can never become "the airport".
const dirRaw = pick2('direction', 'route_direction', 'airport_direction', 'leg_direction', 'trip_direction');
const direction = hDir(dirRaw);
let airportRaw = pick2('airport', 'airport_code', 'pickup_airport', 'arrival_airport', 'departure_airport', 'airport_name', 'airport_iata', 'iata_code');
let airport = hApt(airportRaw);
// Only on a trip that is already airport-shaped, and only from the route keys — each probed on its
// own, because a departure carries the terminal in dropoff_or_duration while pickup_location holds a
// street address. A value that does not resolve to a terminal is never promoted to "the airport".
if (!airportRaw && (/airport/i.test(tripTypeRaw || '') || /airport/i.test(serviceMode || '') || /airport/i.test(dirRaw || '') || !!flight)) {
  const LOOSE = ['pickup_location', 'dropoff_or_duration'];
  for (let i = 0; i < LOOSE.length; i++) {
    const loose = pick2(LOOSE[i]);
    const hit = hApt(loose);
    if (hit) { airportRaw = loose; airport = hit; break; }
  }
}
const originCity = pick('origin_city', 'origin');
const pickupAddr = pick('pickup_address', 'pickup_location');
const dropAddr = pick('dropoff_address', 'destination', 'drop_off_address');
const pax = pick('passengers', 'party_size', 'passenger_count', 'pax');
const luggage = pick('luggage', 'bags', 'bag_count', 'luggage_count');
// FINAL vehicle wins: an explicit final_vehicle key beats any earlier preference captured mid-call.
const vehicle = hVeh(pick('final_vehicle', 'vehicle_final', 'vehicle_class', 'vehicle_key', 'vehicle_preference', 'vehicle', 'vehicle_type'));
// A superseded mid-call vehicle never reappears beside the final one.
markUsed('final_vehicle', 'vehicle_final', 'vehicle_class', 'vehicle_key', 'vehicle_preference', 'vehicle', 'vehicle_type');
const meetRaw = pick('pickup_method', 'meet_style', 'meet');
const meet = hMeet(meetRaw);
const signage = pick('signage_text', 'sign_text', 'sign_name');
const returnLegRaw = pick('return_leg', 'return_leg_requested', 'second_leg', 'return_trip');
const leg1 = pick('leg_1_summary');
const leg2 = pick('leg_2_summary');
const quote = hMoney(pick('quote_total', 'all_in_total', 'quoted_price', 'price'));
const quoteId = pick('quote_id');
const quoteSource = hSource(pick('quote_source', 'rate_source', 'calculation_source'));
const commitStateRaw = pick2('reservation_state', 'commit_state', 'commit_status', 'booking_state');
const tripRef = pick2('trip_id', 'reservation_id', 'booking_id', 'confirmation_number');
const callerName = pick('caller_name', 'caller_first', 'name', 'contact_name', 'booker_name');
const callerPhone = pick('caller_mobile', 'caller_callback_number', 'caller_phone', 'callback_number', 'mobile', 'phone') || caller;
const callerEmail = pick('caller_email', 'email', 'contact_email', 'reservation_email', 'booker_email');
const smsConsentRaw = pick('sms_consent', 'text_ok', 'ok_to_text', 'consent');
const callbackConsentRaw = pick('callback_consent', 'callback_ok', 'setup_callback', 'wants_callback');
const bookerIsPax = pick('booker_is_passenger');
const obc = pick('passenger_obc_number', 'on_board_contact', 'passenger_mobile');
const obcName = pick('passenger_name');
const urgent = pick('urgent_request_flag', 'urgent', 'escalation');
const oversized = pick('oversized_flag', 'oversized', 'oversized_party');
const oversizedNote = pick('oversized_note');
const correction = pick('correction_note');
const notes = pick('special_notes', 'notes', 'additional_notes');
const gateCode = pick('gate_code', 'entry_code', 'access_code');
const childSeats = hSeats(pick('child_seats', 'child_seat', 'car_seats'));
const appt = pick('appointment_booked', 'appointment_time', 'discovery_call');
// "DISCOVERY CALL: false" is machine spill. Say it in words, or say nothing.
const apptBooked = appt !== null && !isFalse(appt);
const apptShown = appt === null ? null : (isFalse(appt) ? 'not booked on this call' : (/^(true|yes|y|1|ok|booked)$/i.test(appt) ? 'yes — booked' : appt));
const feedback = pick('prospect_feedback', 'feedback', 'demo_feedback');
const interest = pick('interest_level', 'wants_followup', 'book_followup');

const has_trip = !!(tripType || pickupDate || leg1 || pickupAddr || dropAddr || flight || quote);
const urgentFlag = isTrue(urgent);
const oversizedFlag = isTrue(oversized);
const isAirportTrip = !!(airport || airportRaw || /airport/i.test(tripTypeRaw || '') || /airport/i.test(serviceMode || '') || /airport/i.test(dirRaw || ''));
const dirTxt = ((dirRaw || '') + ' ' + (tripTypeRaw || '') + ' ' + (serviceMode || '')).toLowerCase();
const isArrival = /arriv|from_airport|from airport|pickup_at_airport/.test(dirTxt);
const isDeparture = !isArrival && /depart|to_airport|to airport|dropoff_at_airport/.test(dirTxt);
const commitState = commitStateRaw ? TITLE(String(commitStateRaw).toLowerCase()) : null;
const commitFailed = !!(commitStateRaw && /fail|error|reject|incomplete/i.test(commitStateRaw));
// The desk wrote the reservation. The provider line and the summary must not disagree about that.
const commitConfirmed = !commitFailed && !!(commitStateRaw && /confirm|complete|success|booked|written|recorded/i.test(commitStateRaw));
// Dispatch cannot run a trip that is missing date, time, passengers, or vehicle.
const missingCritical = [];
if (has_trip) {
  if (!pickupDate) missingCritical.push('pickup date');
  if (!pickupTime) missingCritical.push('pickup time');
  if (!pax) missingCritical.push('passenger count');
  if (!vehicle) missingCritical.push('vehicle');
  if (isAirportTrip && !airport) missingCritical.push(airportRaw ? ('airport (heard "' + airportRaw + '" — ' + (aptAmbiguous(airportRaw) ? (aptAmbiguous(airportRaw) + '?') : 'not a terminal we recognize') + ')') : 'airport');
}
const reviewNeeded = urgentFlag || oversizedFlag || commitFailed || missingCritical.length > 0;
const critical = (v) => v || (has_trip ? REVIEW : EMPTY);

const L = [];
L.push(T.name.toUpperCase() + ' — DISPATCH TRIP TICKET (DEMO)');
L.push('INTAKE: ' + intake);
L.push('TYPE: ' + (tripType || critical(null)) + (serviceMode ? ('  ·  ' + TITLE(serviceMode)) : ''));
L.push('DATE / TIME: ' + critical(pickupDate) + '  ·  ' + critical(pickupTime));
L.push('PAX: ' + critical(pax) + '   BAGS: ' + (luggage || (has_trip ? '0 stated' : EMPTY)));
L.push('VEHICLE: ' + critical(vehicle));
if (isAirportTrip) L.push('AIRPORT: ' + (airport || (airportRaw ? (REVIEW + ' — heard "' + airportRaw + '"') : critical(null))) + (direction ? ('  ·  ' + direction) : ''));
if (flight || flightType) L.push('FLIGHT: ' + (flight || 'not stated') + (flightType ? ('   (' + TITLE(flightType) + ')') : ''));
if (meet || signage) L.push('MEET: ' + (meet || 'not stated') + (signage ? ('   SIGN TEXT: ' + signage) : ''));
if (originCity) L.push('ORIGIN CITY: ' + originCity);
if (pickupAddr) L.push('PICKUP: ' + pickupAddr);
if (dropAddr) L.push('DROP-OFF: ' + dropAddr);
if (gateCode) L.push('GATE / ENTRY: ' + gateCode);
if (childSeats) L.push('CHILD SEATS: ' + childSeats);
if (leg1) L.push('LEG 1: ' + leg1);
L.push('RETURN LEG: ' + (leg2 || (isFalse(returnLegRaw) ? 'not requested' : (returnLegRaw ? TITLE(returnLegRaw) : 'none captured'))));
L.push('CALLER: ' + (callerName || 'name not given') + '  ·  ' + (callerPhone || 'no number') + (callerEmail ? ('  ·  ' + callerEmail) : ''));
if (obc || obcName || bookerIsPax) L.push('ON-BOARD CONTACT: ' + (obcName || '') + (obcName && obc ? '  ·  ' : '') + (obc || (isTrue(bookerIsPax) ? 'same as caller' : 'not given')));
if (apptShown) L.push('DISCOVERY CALL: ' + apptShown);
if (callbackConsentRaw) L.push('SETUP CALLBACK: ' + (isTrue(callbackConsentRaw) ? 'yes — caller agreed' : 'declined'));
if (smsConsentRaw) L.push('TEXT CONSENT: ' + (isTrue(smsConsentRaw) ? 'yes' : 'declined'));
if (correction) L.push('CORRECTION: ' + correction);
if (urgentFlag) L.push('URGENT: ' + urgent);
if (oversizedFlag) L.push('OVERSIZED: ' + oversized);
if (oversizedNote) L.push('OVERSIZED NOTE: ' + oversizedNote);
L.push('SPECIAL NOTES: ' + (notes || 'none'));

const usedSet = {};
for (const k of used) usedSet[k] = true;
const extras = Object.keys(cad).filter((k) => !usedSet[k] && val(cad[k]) !== null && !isFalse(cad[k]));
if (extras.length) { L.push(''); L.push('OTHER CAPTURED FIELDS'); for (const k of extras) { const raw = val(cad[k]); const shown = /^(true|yes|y|1)$/i.test(raw) ? 'yes' : (/^[a-z0-9]+(_[a-z0-9]+)+$/.test(raw) ? TITLE(raw) : raw); L.push(k.replace(/_/g, ' ').toUpperCase() + ': ' + shown); } }

L.push('');
L.push('RATE: ' + (quote ? (quote + ' all-in, service fee included' + (quoteId ? ('  ·  quote ' + quoteId) : '') + '  ·  quoted, not confirmed') : 'dispatch confirms'));
if (quoteSource) L.push('RATE BASIS: ' + quoteSource);
if (commitState) L.push('COMMIT STATE: ' + commitState);
if (missingCritical.length) L.push('MISSING BEFORE DISPATCH: ' + missingCritical.join(', '));
L.push('PROVIDER: ' + T.mode + ' demo — ' + (commitConfirmed
  ? ('reservation written to the demo system' + (tripRef ? (' as ' + tripRef) : '') + ', not dispatched to a live fleet')
  : 'nothing was submitted or booked'));
L.push('SOURCE: voice call ' + (callId || 'id not reported') + (dur ? ('  ·  ' + dur) : ''));
// No trip, no ticket. The sentinel is the law's name, not a line a human reads.
const ticketText = has_trip ? L.join('\n') : 'No trip content was captured on this call.';

const label = (role) => { const r = ((role == null ? '' : role) + '').toLowerCase(); if (r === 'agent' || r === 'assistant') return 'AGENT'; if (r === 'user' || r === 'caller' || r === 'human') return 'CALLER'; return r ? r.toUpperCase() : 'UNKNOWN'; };
let turns = [];
const tobj = Array.isArray(c.transcript_object) ? c.transcript_object : null;
if (tobj && tobj.length) { turns = tobj.map((e) => { const t = val(e && e.content); return t ? { who: label(e && e.role), text: t.replace(/\s+/g, ' ').trim() } : null; }).filter(Boolean); }
if (!turns.length) { const flat = val(c.transcript); if (flat) { turns = flat.split('\n').map((ln) => { const m = ln.match(/^\s*(Agent|Assistant|User|Caller|Human)\s*:\s*(.*)$/i); if (m && val(m[2])) return { who: label(m[1]), text: m[2].trim() }; const t = val(ln); return t ? { who: 'UNKNOWN', text: t } : null; }).filter(Boolean); } }
const transcriptText = turns.length ? turns.map((t) => t.who + ': ' + t.text).join('\n') : EMPTY;
const summary = val(an.call_summary) || EMPTY;
const recording = val(c.recording_url);

// ═══════════════════════════════════════════════════════════════════
// AI CHAUFFEUR — THE TERMINAL SUITE v4
// ═══════════════════════════════════════════════════════════════════

const F    = "'Space Grotesk','Helvetica Neue',Helvetica,Arial,sans-serif";
const MONO = "'JetBrains Mono','SF Mono',Consolas,'Courier New',Courier,monospace";

const VOID  = '#050507';
const CARD  = '#0E1014';
const PANEL = '#16191F';
const RAISE = '#1D2129';
const ETCH  = '#232A34';
const EDGE  = '#2C3543';

const TXT   = '#EEF0F4';
const DIM   = '#9BA6B8';
const LBL   = '#68748A';

const CYAN  = '#00D4FF';
const CYAN_D= '#0090C8';
const GOOD  = '#2EE6A8';
const WARN  = '#FFB020';
const MISS  = '#FF3B4E';

const LOGO_URL = '';
const BARS = [40, 27, 16, 22, 16, 27, 40];
const markEl = (size) => {
  if (LOGO_URL) return '<img src="' + LOGO_URL + '" width="132" alt="AI Chauffeur" style="display:block;border:0;">';
  const k = size / 40;
  let cells = '';
  for (let i = 0; i < BARS.length; i++) {
    const h = Math.round(BARS[i] * k);
    const w = Math.max(3, Math.round(6 * k));
    const col = (i === 3) ? CYAN : TXT;
    cells += '<td width="' + w + '" valign="middle" style="padding:0 3px 0 0;"><div style="width:' + w + 'px;height:' + h + 'px;background:' + col + ';border-radius:' + w + 'px;line-height:' + h + 'px;font-size:0;">&nbsp;</div></td>';
  }
  return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="height:' + size + 'px;"><tr>' + cells + '</tr></table>';
};

const gridBand = (rows, bg) => {
  let cell = '<td width="5%" height="18" style="width:5%;border-right:1px solid ' + ETCH + ';border-bottom:1px solid ' + ETCH + ';font-size:0;line-height:0;">&nbsp;</td>';
  let row = '<tr>';
  for (let i = 0; i < 20; i++) row += cell;
  row += '</tr>';
  let all = '';
  for (let r = 0; r < rows; r++) all += row;
  return '<tr><td bgcolor="' + bg + '" style="background:' + bg + ';font-size:0;line-height:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-top:1px solid ' + ETCH + ';">' + all + '</table></td></tr>';
};

const esc2 = esc;
const shortTxt = (s, n) => { s = (s || '').trim(); return s.length > n ? (s.slice(0, n - 1) + '…') : s; };

// An arrival starts AT the terminal. Reading origin-city-to-address on an arrival described the
// trip backwards to the one person standing in baggage claim.
const originShort = originCity || (pickupAddr ? shortTxt(pickupAddr, 24) : null);
const dropShort = dropAddr ? shortTxt(dropAddr.split(',')[0], 28) : null;
let fromLeg, toLeg;
if (isAirportTrip && airport && isDeparture) { fromLeg = originShort; toLeg = airport; }
else if (isAirportTrip && airport) { fromLeg = airport; toLeg = dropShort || originShort; }
else { fromLeg = originShort; toLeg = dropShort; }
const routePlain = (fromLeg && toLeg) ? (fromLeg + ' → ' + toLeg) : (fromLeg || toLeg || (tripType ? tripType : null));
const whenLine = [pickupDate, pickupTime].filter(Boolean).join(' · ');

const pre = (t) => '<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">' + esc2(t) + '</div>';

const beacon = (col) => '<span style="display:inline-block;width:9px;height:9px;background:' + col + ';border-radius:9px;line-height:9px;font-size:0;">&nbsp;</span>';

const kicker = (t, col) => '<span style="font-family:' + MONO + ';font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:' + (col || LBL) + ';">' + t + '</span>';

const rule = () => '<tr><td bgcolor="' + CYAN + '" style="background:' + CYAN + ';font-size:0;line-height:0;height:3px;">&nbsp;</td></tr>';

const HALO = '#06323F';
const btn = (href, lbl, fill) => '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + HALO + '" style="background:' + HALO + ';"><tr><td style="padding:3px;">'
  + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + (fill || CYAN) + '" style="background:' + (fill || CYAN) + ';"><tr><td align="center">'
  + '<a href="' + href + '" style="display:block;padding:17px 20px;font-family:' + F + ';font-size:14px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#04121A;text-decoration:none;">' + lbl + '</a>'
  + '</td></tr></table></td></tr></table>';

const ghost = (href, lbl) => '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + HALO + '" style="background:' + HALO + ';"><tr><td style="padding:3px;">'
  + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + VOID + '" style="background:' + VOID + ';border:2px solid ' + CYAN + ';"><tr><td align="center">'
  + '<a href="' + href + '" style="display:block;padding:15px 20px;font-family:' + F + ';font-size:14px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:' + CYAN + ';text-decoration:none;">' + lbl + '</a>'
  + '</td></tr></table></td></tr></table>';

const section = (t) => '<tr><td style="padding:32px 28px 0;">' + kicker(t) + '</td></tr>';

const tile = (label, value, valCol, sub, big) => '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + PANEL + '" style="background:' + PANEL + ';border:1px solid ' + EDGE + ';"><tr><td style="padding:16px 16px 15px;">'
  + '<div style="font-family:' + MONO + ';font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:' + LBL + ';">' + label + '</div>'
  + '<div style="font-family:' + F + ';font-size:' + (big ? '34' : '19') + 'px;font-weight:800;letter-spacing:-0.3px;color:' + (valCol || TXT) + ';padding-top:' + (big ? '4' : '6') + 'px;line-height:1.15;">' + value + '</div>'
  + (sub ? ('<div style="font-family:' + F + ';font-size:11px;color:' + DIM + ';padding-top:6px;">' + sub + '</div>') : '')
  + '</td></tr></table>';

const bentoRow = (a, b) => '<tr><td style="padding:0 28px;"><table role="presentation" class="bento" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'
  + '<td class="bcell" width="48%" valign="top">' + a + '</td><td class="gap bcell" width="4%" style="font-size:0;">&nbsp;</td><td class="bcell" width="48%" valign="top">' + b + '</td>'
  + '</tr></table></td></tr>'
  + '<tr><td style="height:12px;font-size:0;line-height:0;">&nbsp;</td></tr>';

const meter = (pct, col) => {
  const on = Math.max(1, Math.round(pct / 10));
  let cells = '';
  for (let i = 0; i < 10; i++) cells += '<td width="10%" height="6" bgcolor="' + (i < on ? col : RAISE) + '" style="background:' + (i < on ? col : RAISE) + ';font-size:0;line-height:0;border-right:2px solid ' + PANEL + ';">&nbsp;</td>';
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>' + cells + '</tr></table>';
};

const masthead = (sub) => '<tr><td bgcolor="' + VOID + '" style="background:' + VOID + ';padding:28px 28px 24px;">'
  + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'
  + '<td valign="middle">' + markEl(34) + '</td>'
  + '<td valign="middle" align="right" style="font-family:' + MONO + ';font-size:10px;letter-spacing:.14em;color:' + GOOD + ';">' + esc2(intake) + '</td>'
  + '</tr></table>'
  + '<div class="hd" style="font-family:' + F + ';font-size:26px;font-weight:800;letter-spacing:.22em;color:' + TXT + ';padding-top:18px;line-height:1.1;">AI&nbsp;CHAUFFEUR</div>'
  + '<div style="padding-top:9px;">' + kicker(sub, CYAN) + '</div>'
  + (isAIC ? '' : '<div style="font-family:' + F + ';font-size:12px;color:' + DIM + ';padding-top:11px;">Reservation desk for ' + esc2(T.name) + '</div>')
  + '</td></tr>'
  + rule();

const heroRoute = () => (routePlain ? ('<tr><td style="padding:28px 28px 0;">'
  + '<div class="rt" style="font-family:' + F + ';font-size:28px;font-weight:800;letter-spacing:-0.5px;line-height:1.22;color:' + TXT + ';word-break:break-word;">' + esc2(routePlain).replace('→', '<span style="color:' + CYAN + ';">&rarr;</span>') + '</div>'
  + (whenLine ? ('<div style="font-family:' + MONO + ';font-size:14px;color:' + DIM + ';padding-top:10px;letter-spacing:.02em;">' + esc2(whenLine) + '</div>') : '')
  + '</td></tr><tr><td style="height:22px;font-size:0;line-height:0;">&nbsp;</td></tr>') : '');

const rateHero = (caption) => (quote ? ('<tr><td style="padding:0 28px 22px;">'
  + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + VOID + '" style="background:' + VOID + ';border:1px solid ' + CYAN_D + ';border-left:5px solid ' + CYAN + ';"><tr><td style="padding:22px 24px;">'
  + kicker('All-in rate', CYAN)
  + '<div class="big" style="font-family:' + F + ';font-size:52px;font-weight:800;letter-spacing:-1.6px;color:' + CYAN + ';padding-top:8px;line-height:1;">' + esc2(quote) + '</div>'
  + '<div style="font-family:' + F + ';font-size:12px;color:' + DIM + ';padding-top:12px;">' + caption + '</div>'
  + '</td></tr></table></td></tr>') : '');

const chatUI = () => {
  if (!turns.length) return '<tr><td style="padding:12px 28px 0;font-family:' + F + ';font-size:14px;color:' + DIM + ';">No words were recorded on this call.</td></tr>';
  let out = '';
  const cap = turns.slice(0, 40);
  for (let i = 0; i < cap.length; i++) {
    const t = cap[i];
    const isAgent = t.who === 'AGENT';
    const bg = isAgent ? PANEL : '#0A2430';
    const bd = isAgent ? EDGE : CYAN_D;
    const nameCol = isAgent ? LBL : CYAN;
    const bubble = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + bg + '" style="background:' + bg + ';border:1px solid ' + bd + ';"><tr><td style="padding:12px 15px;">'
      + '<div style="font-family:' + MONO + ';font-size:9px;letter-spacing:.18em;color:' + nameCol + ';padding-bottom:5px;">' + (isAgent ? 'AI CHAUFFEUR' : 'CALLER') + '</div>'
      + '<div style="font-family:' + F + ';font-size:14px;line-height:1.55;color:' + TXT + ';">' + esc2(t.text) + '</div>'
      + '</td></tr></table>';
    out += '<tr><td style="padding:0 28px 8px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'
      + (isAgent ? ('<td align="left" width="88%">' + bubble + '</td><td width="12%" style="font-size:0;">&nbsp;</td>')
                 : ('<td width="12%" style="font-size:0;">&nbsp;</td><td align="right" width="88%">' + bubble + '</td>'))
      + '</tr></table></td></tr>';
  }
  if (turns.length > 40) out += '<tr><td style="padding:6px 28px 0;font-family:' + MONO + ';font-size:11px;color:' + LBL + ';">+ ' + (turns.length - 40) + ' more turns in the recording</td></tr>';
  return out;
};

const brandFooter = (aud) => gridBand(2, VOID)
  + '<tr><td bgcolor="' + VOID + '" style="background:' + VOID + ';padding:30px 28px 34px;">'
  + markEl(30)
  + '<div style="font-family:' + F + ';font-size:19px;font-weight:800;letter-spacing:-0.2px;color:' + TXT + ';padding-top:20px;line-height:1.4;">'
  + (aud === 'alert' ? 'Every call lands on the board.' : (aud === 'owner' ? 'Nobody picked up. Nothing was lost.' : 'Every call answered. Every detail kept.'))
  + '</div>'
  + '<div style="font-family:' + F + ';font-size:14px;line-height:1.7;color:' + DIM + ';padding-top:11px;">'
  + (aud === 'alert'
      ? (!connected
          ? 'The call reached your line and dropped before it connected. It is logged with the number and the time. Nothing was said, so nothing about a trip is claimed here.'
          : (turns.length
              ? 'The line answered and kept every word. Nothing that belongs on a trip ticket was said, so nothing about a trip is claimed here.'
              : 'The line answered and logged the call &mdash; the number, and how long it lasted. Nothing was captured, so nothing about a trip is claimed here.'))
  : (aud === 'owner'
      ? (quote
          ? 'Somebody called, described the trip, heard a real rate, and confirmed it &mdash; with nobody on your side of the phone. Three in the morning runs the same as three in the afternoon.'
          : 'Somebody called, described the trip, and dispatch received a structured request &mdash; with nobody on your side of the phone. Three in the morning runs the same as three in the afternoon.')
      : 'The desk that handled your trip runs around the clock. Nothing rings out, nothing reaches voicemail, and every detail arrives exactly as you gave it.'))
  + '</div>'
  + '<div style="padding-top:22px;">' + kicker('AI Chauffeur &nbsp;/&nbsp; aichauffeur.ai', CYAN) + '</div>'
  + '<div style="font-family:' + MONO + ';font-size:10px;line-height:1.8;color:' + LBL + ';padding-top:14px;"><span style="color:' + GOOD + ';letter-spacing:.1em;">' + esc2(intake) + '</span> &middot; ' + esc2(T.mode) + ' DEMONSTRATION' + (quote ? ' &middot; SAMPLE RATE MODEL' : '') + '</div>'
  + '</td></tr>';

const MQ = '<style>@media only screen and (max-width:480px){'
  + '.rt{font-size:22px !important;line-height:1.25 !important;}'
  + '.hd{font-size:20px !important;letter-spacing:.16em !important;}'
  + '.big{font-size:40px !important;}'
  + '.bcell{display:block !important;width:100% !important;}'
  + '.gap{height:12px !important;font-size:0 !important;line-height:0 !important;}'
  + '}</style>';

const shell = (inner, p) => '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">' + MQ + '</head>'
  + '<body bgcolor="' + VOID + '" style="margin:0;padding:0;background:' + VOID + ';">' + pre(p)
  + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + VOID + '" style="background:' + VOID + ';"><tr><td align="center" style="padding:18px 8px 30px;">'
  + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + CARD + '" style="width:100%;max-width:620px;background:' + CARD + ';border:1px solid ' + EDGE + ';">'
  + inner + '</table></td></tr></table></body></html>';

const reviewWhy = missingCritical.length ? ('Missing before dispatch: ' + missingCritical.join(', ') + '.')
  : (commitFailed ? 'The reservation write did not complete — confirm with the caller before dispatching.'
  : ((oversizedFlag && oversizedNote) ? oversizedNote
  : (urgentFlag ? 'Marked urgent by the caller — review before contacting the passenger.' : 'Review before contacting the passenger.')));

const statusCol = reviewNeeded ? WARN : GOOD;
const statusTxt = reviewNeeded ? 'REVIEW REQUIRED' : (commitConfirmed ? 'RESERVATION RECORDED' : 'REQUEST RECEIVED');
// Duration in words. 0 seconds is not "0m 0s" to a human — it is a call that never connected.
const connected = !(secs === 0 || String(c.call_status || '') === 'not_connected');
const durPhrase = secs === null ? null : (connected ? dur : 'did not connect');

const sentRaw = val(an.user_sentiment);
const sentShown = sentRaw ? TITLE(sentRaw) : (feedback ? 'Engaged' : 'Not analyzed');
const sentPct = sentRaw ? (/positive/i.test(sentRaw) ? 85 : (/neutral/i.test(sentRaw) ? 50 : (/negative/i.test(sentRaw) ? 20 : 10))) : (feedback ? 70 : 0);
const sentCol = sentPct >= 70 ? GOOD : (sentPct >= 40 ? CYAN : WARN);

const paxTile = tile('Passengers / bags', (pax || '—') + ' <span style="color:' + LBL + ';">/</span> ' + (luggage || '0'), TXT, vehicle || null);
const rateTile = quote ? tile('All-in rate', quote, CYAN, quoteSource || null, true) : tile('Rate', 'Dispatch confirms', DIM, 'No rate quoted on this call');
const vehTile = tile('Vehicle', vehicle || REVIEW, vehicle ? TXT : WARN, meet || null);
const sentTile = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + PANEL + '" style="background:' + PANEL + ';border:1px solid ' + EDGE + ';"><tr><td style="padding:16px 16px 17px;">'
  + '<div style="font-family:' + MONO + ';font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:' + LBL + ';">Caller sentiment</div>'
  + '<div style="font-family:' + F + ';font-size:19px;font-weight:800;color:' + sentCol + ';padding-top:6px;">' + esc2(sentShown) + '</div>'
  + '<div style="padding-top:11px;">' + meter(sentPct, sentCol) + '</div></td></tr></table>';

const telHref = callerPhone ? ('tel:' + String(callerPhone).replace(/[^0-9+]/g, '')) : null;
const deskPhone = fmtPhone(c.to_number);

// ── NOTHING CAPTURED ──
// A call with no trip on it gets an alert, not a dispatch brief. No ticket block, no rate tile,
// no vehicle tile reading REVIEW REQUIRED for a vehicle nobody ever asked about. Only what is true:
// a call came in, from this number, for this long, and here is the button to call back.
const alertRows = [
  ['Number', fmtPhone(callerPhone) || callerPhone || 'not transmitted'],
  ['Length', secs === null ? 'not reported' : (connected ? dur : '0 seconds — did not connect')],
  ['Line', (deskPhone ? (deskPhone + ' · ') : '') + T.short]
];
const alertRowsHtml = alertRows.map((r) => '<tr>'
  + '<td valign="top" width="32%" style="width:32%;padding:12px 12px 12px 0;font-family:' + MONO + ';font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:' + LBL + ';border-top:1px solid ' + EDGE + ';">' + esc2(r[0]) + '</td>'
  + '<td valign="top" style="padding:12px 0;font-family:' + F + ';font-size:15px;line-height:1.55;color:' + TXT + ';font-weight:500;word-break:break-word;border-top:1px solid ' + EDGE + ';">' + esc2(r[1]) + '</td></tr>').join('');

const alertHtml = shell(
  masthead('Call alert')
  + gridBand(3, CARD)
  + '<tr><td style="padding:22px 28px 0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>'
    + '<td valign="middle" style="padding-right:9px;">' + beacon(WARN) + '</td>'
    + '<td valign="middle" style="font-family:' + MONO + ';font-size:11px;letter-spacing:.2em;color:' + WARN + ';font-weight:700;">CALL ALERT &nbsp;/&nbsp; NOTHING CAPTURED</td>'
  + '</tr></table></td></tr>'
  + '<tr><td class="rt" style="padding:20px 28px 0;font-family:' + F + ';font-size:28px;font-weight:800;letter-spacing:-0.5px;line-height:1.22;color:' + TXT + ';">A call came in. Nothing was captured.</td></tr>'
  + '<tr><td style="padding:14px 28px 0;font-family:' + F + ';font-size:15px;line-height:1.7;color:' + DIM + ';">'
    + (!connected
        ? 'It dropped before it connected &mdash; no words, no trip details, no recording.'
        : (turns.length
            ? 'The caller spoke, but nothing that could be written onto a trip ticket. The call is below, word for word.'
            : 'The line was open, but nothing was said that could be written down.'))
  + '</td></tr>'
  + '<tr><td style="height:22px;font-size:0;line-height:0;">&nbsp;</td></tr>'
  + '<tr><td style="padding:0 28px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' + alertRowsHtml + '</table></td></tr>'
  + '<tr><td style="height:26px;font-size:0;line-height:0;">&nbsp;</td></tr>'
  + (telHref ? ('<tr><td style="padding:0 28px 10px;">' + btn(telHref, '&#9742;&nbsp;&nbsp;Call ' + esc2(fmtPhone(callerPhone) || callerPhone), CYAN) + '</td></tr>') : '')
  + (recording ? ('<tr><td style="padding:0 28px 0;">' + ghost(esc2(recording), '&#9654;&nbsp;&nbsp;Listen to the call' + (dur ? ('&nbsp;&nbsp;&middot;&nbsp;&nbsp;' + dur) : '')) + '</td></tr>') : '')
  + (turns.length ? (section('The call') + '<tr><td style="height:14px;font-size:0;line-height:0;">&nbsp;</td></tr>' + chatUI()) : '')
  + '<tr><td style="height:30px;font-size:0;line-height:0;">&nbsp;</td></tr>'
  + brandFooter('alert'),
  'Call from ' + (callerPhone || 'an unknown number') + (durPhrase ? (' · ' + durPhrase) : ''));

const html = has_trip ? shell(
  masthead('Dispatch brief')
  + gridBand(3, CARD)
  + '<tr><td style="padding:22px 28px 0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>'
    + '<td valign="middle" style="padding-right:9px;">' + beacon(statusCol) + '</td>'
    + '<td valign="middle" style="font-family:' + MONO + ';font-size:11px;letter-spacing:.2em;color:' + statusCol + ';font-weight:700;">' + statusTxt + '</td>'
    + '<td valign="middle" style="padding-left:16px;font-family:' + MONO + ';font-size:10px;letter-spacing:.16em;color:' + LBL + ';">' + esc2(T.mode) + '</td>'
  + '</tr></table></td></tr>'
  + heroRoute()
  + bentoRow(rateTile, vehTile)
  + bentoRow(paxTile, sentTile)
  + (reviewNeeded ? ('<tr><td style="padding:0 28px 20px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#241B06" style="background:#241B06;border-left:4px solid ' + WARN + ';"><tr><td style="padding:15px 18px;"><div style="font-family:' + MONO + ';font-size:10px;letter-spacing:.2em;color:' + WARN + ';padding-bottom:6px;">DISPATCH REVIEW</div><div style="font-family:' + F + ';font-size:14px;line-height:1.6;color:' + TXT + ';">' + esc2(reviewWhy) + '</div></td></tr></table></td></tr>') : '')
  + (feedback ? ('<tr><td style="padding:0 28px 22px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + PANEL + '" style="background:' + PANEL + ';border-left:4px solid ' + CYAN + ';"><tr><td style="padding:20px 22px;"><div style="font-family:' + F + ';font-size:19px;line-height:1.5;font-weight:600;color:' + TXT + ';">&ldquo;' + esc2(feedback) + '&rdquo;</div></td></tr></table></td></tr>') : '')
  + section('Trip ticket')
  + '<tr><td style="padding:12px 28px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + VOID + '" style="background:' + VOID + ';border:1px solid ' + EDGE + ';"><tr><td style="padding:19px 20px;font-family:' + MONO + ';font-size:12.5px;line-height:1.9;color:' + TXT + ';white-space:pre-wrap;word-break:break-word;">' + esc2(ticketText) + '</td></tr></table></td></tr>'
  + (summary !== EMPTY ? (section('Summary')
  + '<tr><td style="padding:12px 28px 0;font-family:' + F + ';font-size:15px;line-height:1.7;color:' + DIM + ';">' + esc2(summary) + '</td></tr>') : '')
  + section('The call')
  + '<tr><td style="height:14px;font-size:0;line-height:0;">&nbsp;</td></tr>'
  + chatUI()
  + '<tr><td style="height:24px;font-size:0;line-height:0;">&nbsp;</td></tr>'
  + (telHref ? ('<tr><td style="padding:0 28px 10px;">' + btn(telHref, '&#9742;&nbsp;&nbsp;Call ' + esc2((callerName || 'the caller').split(' ')[0]), CYAN) + '</td></tr>') : '')
  + (recording ? ('<tr><td style="padding:0 28px 0;">' + ghost(esc2(recording), '&#9654;&nbsp;&nbsp;Listen to the call' + (dur ? ('&nbsp;&nbsp;&middot;&nbsp;&nbsp;' + dur) : '')) + '</td></tr>') : '')
  + '<tr><td style="height:30px;font-size:0;line-height:0;">&nbsp;</td></tr>'
  + brandFooter('owner'),
  [routePlain, whenLine, quote].filter(Boolean).join(' · ') || 'Dispatch brief inside.') : alertHtml;

const tripBits = [];
if (vehicle) tripBits.push(vehicle);
if (tripType) tripBits.push(tripType.toLowerCase());
if (pickupDate) tripBits.push(pickupDate + (pickupTime ? (' at ' + pickupTime) : ''));
const tripPhrase = tripBits.length ? tripBits.join(', ') : null;

const CL = [];
if (tripType) CL.push(['Trip', tripType + (airport ? (' · ' + airport) : '')]);
if (whenLine) CL.push(['When', whenLine]);
if (flight) CL.push(['Flight', flight]);
if (pickupAddr) CL.push(['Pickup', pickupAddr]);
if (dropAddr) CL.push(['Drop-off', dropAddr]);
if (pax || luggage) CL.push(['Party', (pax ? (pax + ' passengers') : '') + (pax && luggage ? ' · ' : '') + (luggage ? (luggage + ' bags') : '')]);
if (vehicle) CL.push(['Vehicle', vehicle]);
if (meet) CL.push(['Meet', meet]);
if (signage) CL.push(['Sign text', signage]);
if (gateCode) CL.push(['Gate / entry', gateCode]);
if (childSeats) CL.push(['Child seats', childSeats]);
if (leg2) CL.push(['Return trip', leg2]);
else if (isFalse(returnLegRaw)) CL.push(['Return trip', 'Not requested']);
else if (isTrue(returnLegRaw)) CL.push(['Return trip', 'Requested — dispatch will confirm']);
if (notes) CL.push(['Notes', notes]);
const contactBits = [callerName, callerPhone, callerEmail].filter(Boolean).join(' · ');
if (contactBits) CL.push(['Contact', contactBits]);

const callerRows = CL.map((r, i) => '<tr>'
  + '<td valign="top" width="32%" style="width:32%;padding:12px 12px 12px 0;font-family:' + MONO + ';font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:' + LBL + ';border-top:1px solid ' + EDGE + ';">' + esc2(r[0]) + '</td>'
  + '<td valign="top" style="padding:12px 0;font-family:' + F + ';font-size:15px;line-height:1.55;color:' + TXT + ';font-weight:500;word-break:break-word;border-top:1px solid ' + EDGE + ';">' + esc2(r[1]) + '</td></tr>').join('');

const callerHtml = shell(
  masthead('Trip request received')
  + gridBand(3, CARD)
  + '<tr><td style="padding:26px 28px 0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>'
    + '<td valign="middle" style="padding-right:9px;">' + beacon(GOOD) + '</td>'
    + '<td valign="middle" style="font-family:' + MONO + ';font-size:11px;letter-spacing:.2em;color:' + GOOD + ';font-weight:700;">RECEIVED &nbsp;/&nbsp; DISPATCH CONFIRMS NEXT</td>'
  + '</tr></table></td></tr>'
  + '<tr><td class="rt" style="padding:20px 28px 0;font-family:' + F + ';font-size:30px;font-weight:800;letter-spacing:-0.6px;line-height:1.2;color:' + TXT + ';">Your trip is in' + (callerName ? (', ' + esc2(callerName.split(' ')[0])) : '') + '.</td></tr>'
  + '<tr><td style="height:20px;font-size:0;line-height:0;">&nbsp;</td></tr>'
  + heroRoute()
  + rateHero('Service fee included &middot; pending dispatch confirmation')
  + section('Your itinerary')
  + '<tr><td style="padding:14px 28px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' + callerRows + '</table></td></tr>'
  + '<tr><td style="padding:24px 28px 0;font-family:' + F + ';font-size:14px;line-height:1.7;color:' + DIM + ';">' + esc2(T.name) + ' dispatch reviews every request, confirms the vehicle, rate and availability, then contacts you directly. This is not yet a confirmed reservation.</td></tr>'
  + '<tr><td style="height:26px;font-size:0;line-height:0;">&nbsp;</td></tr>'
  + (RESERVE_URL ? ('<tr><td style="padding:0 28px 10px;">' + btn(RESERVE_URL, 'Hold your reservation', CYAN) + '</td></tr>') : '')
  + (recording ? ('<tr><td style="padding:0 28px 0;">' + ghost(esc2(recording), '&#9654;&nbsp;&nbsp;Listen to your call' + (dur ? ('&nbsp;&nbsp;&middot;&nbsp;&nbsp;' + dur) : '')) + '</td></tr>') : '')
  + '<tr><td style="padding:26px 28px 0;font-family:' + F + ';font-size:14px;line-height:1.7;color:' + TXT + ';">Need to change something? '
    + (deskPhone
        ? ('Call the desk back at <a href="tel:' + String(c.to_number || '').replace(/[^0-9+]/g, '') + '" style="color:' + CYAN + ';text-decoration:none;font-weight:700;">' + esc2(deskPhone) + '</a> and give reference ' + esc2(intake) + '.')
        : ('Call the desk back on the number you dialed and give reference ' + esc2(intake) + '.'))
    + ' A reply to this email does not reach dispatch.</td></tr>'
  + '<tr><td style="height:30px;font-size:0;line-height:0;">&nbsp;</td></tr>'
  + brandFooter('caller'),
  'Request received — dispatch confirms next. ' + intake);

const ownerLines = [];
if (!has_trip) {
  ownerLines.push('CALL ALERT — ' + T.short.toUpperCase() + (secs !== null && secs < 90 ? ' — SHORT CALL, POSSIBLE MISSED LEAD' : ''));
} else {
  ownerLines.push((reviewNeeded ? 'REVIEW REQUIRED' : (commitConfirmed ? 'RESERVATION RECORDED' : 'NEW TRIP CALL')) + ' — ' + T.short.toUpperCase());
}
ownerLines.push((callerName || 'Unknown caller') + (callerPhone ? (', ' + callerPhone) : ''));
if (routePlain) ownerLines.push(routePlain + (whenLine ? (' · ' + whenLine) : ''));
else if (tripPhrase) ownerLines.push(tripPhrase);
if (!has_trip && durPhrase) ownerLines.push((connected ? ('Only ' + durPhrase + ' on the line') : 'The call did not connect') + ' — worth a callback.');
if (quote) ownerLines.push('Quoted: ' + quote);
if (missingCritical.length) ownerLines.push('Missing: ' + missingCritical.join(', '));
if (apptBooked) ownerLines.push('Discovery call: ' + apptShown);
if (feedback) ownerLines.push('Feedback: ' + feedback.slice(0, 80));
ownerLines.push(has_trip ? ('Ticket ' + intake + ' in your email.') : ('Details in your email · ' + intake));
const ownerSms = ownerLines.join('\n');

const smsLines = [];
smsLines.push(T.short + ': thanks for calling!');
if (quote) {
  smsLines.push('Your quote: ' + quote + ' all-in, service fee included.');
  if (tripPhrase) smsLines.push(tripPhrase + '.');
  smsLines.push('Dispatch will confirm availability shortly.');
} else {
  smsLines.push('We have your trip details' + (tripPhrase ? (' — ' + tripPhrase) : '') + '.');
  smsLines.push('Dispatch will confirm rate and availability shortly.');
}
smsLines.push('Reference: ' + intake);
if (callerEmail) smsLines.push('Full trip ticket is in your email.');
if (RESERVE_URL) smsLines.push('Hold your reservation — add a card on file:\n' + RESERVE_URL);
const callerSms = smsLines.join('\n\n');

const digits = (callerPhone || '').replace(/[^0-9]/g, '');
const e164 = digits.length === 11 && digits[0] === '1' ? ('+' + digits) : (digits.length === 10 ? ('+1' + digits) : null);
const consentBlocked = smsConsentRaw !== null && isFalse(smsConsentRaw);

return [{ json: {
  tenant: T.name, tenant_short: T.short, intake: intake, ticket: ticketText,
  has_trip: has_trip,
  review_needed: reviewNeeded,
  missing_critical: missingCritical,
  quote_source: quoteSource,
  callback_consent: callbackConsentRaw ? isTrue(callbackConsentRaw) : null,
  subject: has_trip
    ? (T.short.toUpperCase() + ' · ' + statusTxt + (routePlain ? (' · ' + routePlain) : '') + (pax ? (' · ' + pax + ' passengers') : '') + ' · ' + (callerName || 'new caller'))
    : (T.short.toUpperCase() + ' · CALL ALERT · ' + (callerPhone || 'unknown number') + (durPhrase ? (' · ' + durPhrase) : '')),
  html: html,
  caller_subject: T.short + ' received your trip request' + (quote ? (' — ' + quote + ' all-in') : ''),
  caller_html: callerHtml,
  caller_email: callerEmail, caller_name: callerName || 'Demo', caller_phone_e164: e164,
  owner_sms: ownerSms, caller_sms: callerSms,
  owner_sms_ok: true,
  caller_copy_ok: has_trip,
  sms_ok: !!(e164 && !consentBlocked && has_trip)
} }];