// Replay harness: runs a Build Trip Ticket body against a saved Retell webhook payload.
// usage: node replay.js <builder.js> <payload.json> [--html out.html]
const fs = require('fs');
const path = require('path');

const builderPath = process.argv[2];
const payloadPath = process.argv[3];
const htmlFlag = process.argv.indexOf('--html');

const body = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
const code = fs.readFileSync(builderPath, 'utf8');

const $input = { first: () => ({ json: { body: body } }) };

const fn = new Function('$input', '"use strict";\n' + code);
let out;
try {
  out = fn($input);
} catch (e) {
  console.error('THROW: ' + e.message + '\n' + e.stack);
  process.exit(2);
}
const j = out[0].json;

if (htmlFlag > -1) {
  fs.writeFileSync(process.argv[htmlFlag + 1], j.html);
  if (j.caller_html) fs.writeFileSync(process.argv[htmlFlag + 1].replace(/\.html$/, '.caller.html'), j.caller_html);
}

const scalar = {};
for (const k of Object.keys(j)) {
  if (k === 'html' || k === 'caller_html') { scalar[k] = '<' + j[k].length + ' chars>'; continue; }
  scalar[k] = j[k];
}
console.log(JSON.stringify(scalar, null, 1));
