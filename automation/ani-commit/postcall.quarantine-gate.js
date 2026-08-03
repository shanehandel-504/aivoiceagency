// AVA Post-Call · node "Quarantine Gate"
// RUN 3. THE single place this workflow decides a call is synthetic.
//
// It sits directly after Normalize and BEFORE the fork to Build GHL Body /
// Format Call Log, so both the lead branch and the owner-alert branch inherit one
// decision. The owner-alert branch previously forked off Normalize and never passed
// through any internal check at all — a test call still paged the owner.
//
//   is_test = NANP-reserved 555 caller (spoken number or telephony ANI)
//          OR an explicit test_mode flag on the payload
//          OR the caller is one of OUR OWN lines (OUR_NUMBERS)
//
// A REAL person dialling the demo line from an unknown public number is NOT a test.
// They keep the full receipt — the receipt IS the demo. Only synthetic and internal
// traffic is quarantined.
const s = $('Normalize').first().json;
const body = $('Retell Webhook').first().json.body || {};
const c = body.call || {};

const d10 = (v) => String(v == null ? '' : v).replace(/[^0-9]/g, '').slice(-10);

const OUR = String(($vars && $vars.OUR_NUMBERS) || '')
  .split(',')
  .map((x) => d10(x))
  .filter((x) => x.length === 10);

const spoken = d10(s.phone);
const ani = d10(c.from_number);

const is555 = (n) => n.length === 10 && n.slice(0, 3) === '555';
const isOurs = (n) => n.length === 10 && OUR.indexOf(n) !== -1;

const is_555 = is555(spoken) || is555(ani);
const is_our_number = isOurs(spoken) || isOurs(ani);
const test_mode = (body.test_mode === true ||
                   String(body.test_mode).toLowerCase() === 'true' ||
                   (c.metadata && c.metadata.test_mode === true));

const is_test = !!(is_555 || test_mode || is_our_number);

let test_reason = '';
if (is_555) test_reason = 'caller is a NANP-reserved 555 test number';
else if (test_mode) test_reason = 'payload carried test_mode';
else if (is_our_number) test_reason = 'caller is one of OUR_NUMBERS';

// Pass the Normalize payload straight through so downstream nodes that read
// $json keep working unchanged; the quarantine fields ride alongside.
return [{
  json: Object.assign({}, s, {
    is_test: is_test,
    test_reason: test_reason,
    is_our_number: is_our_number,
    quarantine_note: is_test
      ? ('QUARANTINED — ' + test_reason + '; owner alert and text-back suppressed')
      : ''
  })
}];
