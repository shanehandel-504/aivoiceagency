#!/usr/bin/env node
/* AVA SEAL · STEP 6 — BOARD LAW.
   Flips the four seal items to LIVE with one ISO log entry each. Refuses to run
   unless the gate result on disk says every item actually passed — the board is a
   claim about production, so it may not be written from intent. */
import { readFileSync, writeFileSync } from 'node:fs';
import { loadJSON } from './_lib.mjs';

const gate = loadJSON('config-snapshots/2026-08-18-ava-seal/gate-result.json');
if (!gate) { console.error('RUN INCOMPLETE — no gate result on disk. Run 06-gate.mjs first.'); process.exit(2); }
const failing = Object.entries(gate.result).filter(([, v]) => v.fail > 0);
if (failing.length) {
  console.error(`RUN INCOMPLETE — the gate has failures; the board may not be flipped: ${failing.map(([k]) => k).join(', ')}`);
  process.exit(2);
}

/* CT stamp — the log is kept in Shane's local wall clock, not UTC. */
const now = new Date();
const ct = new Date(now.getTime() - 5 * 3600 * 1000).toISOString().replace('Z', '-05:00');
const REPO = 'https://github.com/shanehandel-504/aivoiceagency/blob/main/tools/ava-seal';

const ITEMS = [
  ['WARM-RECOGNITION-8930', 'WARM RECOGNITION — 8930 hydrates the caller before AVA speaks',
   `${REPO}/02-warm-recognition.mjs`,
   'The live +1(414)240-8930 number now carries inbound_webhook_url -> /webhook/ava-inbound-lookup, so Retell hydrates caller dynamic variables BEFORE the opening line. One field changed and nothing else: every other key on the number object was diffed byte-for-byte against the pre-edit snapshot, and inbound routing still resolves agent_d5ada…677 @ latest_published. FAIL-OPEN IS THE CONTRACT, because Retell blocks the call opening on this response — a hang is dead air on a customer call. Proven twice, before the patch and after it: an unknown caller returns HTTP 200 carrying dynamic_variables.caller_known="false" and opening_mode="cold" in 517–1256ms against a 5s budget. The endpoint was probed BEFORE the number was pointed at it; pointing a live line at an untested URL makes every real caller in the gap the experiment.'],

  ['SIM-GUARD', 'SIM-GUARD — a payload with no phone leg fails loudly and writes nothing',
   `${REPO}/03-booking-rail.mjs`,
   'Booking workflow c5GPBkma1HyvonEa now gates on call.from_number. A real call always carries one; a simulator does not. Missing means is_sim=true and the run answers with success=false / reason="simulation_no_phone_leg" and an explicit detail line, in the same response shape the not-available path already used. THE GATE SITS BETWEEN Normalize AND Is Our Number? — the only position upstream of BOTH the contact upsert and the appointment create. Gating any lower would have let a sim mint a CRM record before being turned away. Zero-write is not claimed from a 200: it is proved three ways — the response refuses by name, the n8n execution record shows exactly four nodes ran (Retell Webhook, Normalize, Sim Guard?, Respond Sim Blocked) with every write node absent, and GHL itself is searched for the probe identity and does not know it.'],

  ['OWNER-ALERTS-8930', 'OWNER INSTANT ALERTS — SMS + email the moment a booking lands',
   `${REPO}/03b-publish-verify.mjs`,
   'On the booking success path, spliced between GHL Create Appointment and Respond OK: Owner Alert Body -> Owner Alert SMS -> Owner Alert Email. Status-led per MESSAGE FORMAT LAW — "BOOKED — {name} — {slot} CT — {cell} — {email}" reads from a lock screen without opening anything. One code node builds the string so SMS and email can never drift apart, and it strips the trailing CT that slot_human_ct already carries rather than printing "CT CT". Both legs run onError=continueRegularOutput with an 8s timeout, so an alert failure can never break the caller-facing booking response. $vars.OWNER_ALERT_CONTACT_ID / OWNER_SMS_FROM / OWNER_ALERT_EMAIL were dereferenced against the live API, not merely referenced. THE BUG THIS EDIT ALMOST SHIPPED: Respond OK read $json.id, which was correct only while it sat directly on the appointment node — splicing three nodes in front of it would have returned appointment_id:null on real bookings. It is now bound to the NAMED node and is position-independent. Appointment title is now "AVA Discovery Call - {name}", and "Strategy Call" is gone from the node AND from the workflow description, which is where the second copy was hiding.'],

  ['POSTCALL-RAIL-8930', 'POST-CALL RAIL — owner gets the summary + full transcript after every call',
   `${REPO}/04-postcall-rail.mjs`,
   'New workflow kpYlhLbwSD0W1sE0 "WF-POSTCALL-AVA · 8930 Call Wrap v1.0", ACTIVE, Error Sentry attached. On call_analyzed it emails the owner the summary and the FULL transcript and writes a GHL contact note when the caller number matches a contact. Outbound calls read the to_number, not the from_number, so an outbound call is not filed under our own line. Our own numbers are noted, never written (§ 9). TWO THINGS THE BRIEF COULD NOT HAVE KNOWN. (1) The requested path ava-postcall was ALREADY REGISTERED by ACTIVE workflow 6r8YHuMEJbxeDyT5 "AVA Post-Call to GHL (Demo Send)", which the scope fence forbade touching; claiming it would have failed or silently stolen live traffic, so the rail was built on ava-postcall-wrap and the incumbent was verified still ACTIVE afterwards. (2) webhook_url is VERSIONED on this agent — v0–v5 carry none, v6 carried an n8n URL, v7–v43 carried chat-dash — and get-agent returns the unpublished DRAFT while the number routes via latest_published. A PATCH plus a GET would have read green while every real call kept firing chat-dash. Blast radius was measured before publishing: LLM v42 and v43 are BYTE-IDENTICAL, so v43 shipped no change to anything AVA says. Published on Shane\'s explicit approval; latest_published is now v43 and the phone posts to the new rail. ROLLBACK: pin the number\'s inbound_agents to agent_version 42.'],
];

const LOGS = [
  `AVA SEAL — WARM RECOGNITION LIVE on +1(414)240-8930. inbound_webhook_url -> /webhook/ava-inbound-lookup so Retell hydrates caller variables before AVA's first word. The endpoint was probed BEFORE the number was pointed at it, then again after: HTTP 200 with caller_known="false" in 517ms and 1119ms against a 5s budget. Fail-open matters here more than the lookup does — Retell blocks the call opening on this response, so a slow or 500ing rail is dead air on a customer call; GHL Find Contact carries onError=continueRegularOutput and falls through to the cold opening. Every other field on the number object was diffed byte-for-byte against the pre-edit snapshot to make "change nothing else" a measurement instead of a promise.`,

  `AVA SEAL — SIM-GUARD LIVE on booking workflow c5GPBkma1HyvonEa. A payload with no call.from_number is not a phone leg; it now answers success=false / reason="simulation_no_phone_leg" and writes NOTHING. Placement was the whole design: the guard sits between Normalize and Is Our Number?, the only point upstream of both the contact upsert and the appointment create — one node lower and a sim would have minted a CRM record before being refused. The zero-write claim is not resting on a 200. Three independent proofs: the response refuses by name; the n8n execution record shows exactly four nodes ran with every write node absent; and GHL is searched for the probe identity and returns nothing. A graph walk over the live connections object also confirms the SIM branch can reach no write node and that the REAL branch still reaches all of them.`,

  `AVA SEAL — OWNER INSTANT ALERTS LIVE. Booking success now fires an owner SMS and email between the appointment create and the caller response, status-led per MESSAGE FORMAT LAW: "BOOKED — {name} — {slot} CT — {cell} — {email}". THE DEFECT THE SPLICE ALMOST INTRODUCED: Respond OK read $json.id, valid only while it sat directly on GHL Create Appointment. Inserting three nodes ahead of it would have made $json the Gmail node's output and returned appointment_id:null on bookings that really happened — a silent lie to the caller. Rebound to the NAMED node. Both alert legs are onError=continueRegularOutput with an 8s timeout so they can never break a booking, and the three $vars were dereferenced against the live API rather than merely referenced. Title moved to "AVA Discovery Call - {name}"; "Strategy Call" also lived in the workflow DESCRIPTION, not just the node, and both are gone.`,

  `AVA SEAL — POST-CALL RAIL LIVE. kpYlhLbwSD0W1sE0 "WF-POSTCALL-AVA · 8930 Call Wrap v1.0" emails the owner the summary and full transcript on every call_analyzed and notes the matching GHL contact. TWO TRAPS THE BRIEF WALKED INTO. (1) PATH: ava-postcall was already owned by ACTIVE workflow 6r8YHuMEJbxeDyT5, a mature rail carrying owner SMS+email, a Notion log, a text-back and a quarantine gate — and outside the scope fence. Ownership was checked BEFORE creating anything rather than gambling on activation, the rail was built on ava-postcall-wrap, and the incumbent was re-read afterwards and confirmed still ACTIVE. (2) VERSIONING: webhook_url is versioned on this agent (v0–v5 none, v6 an n8n URL, v7–v43 chat-dash) and get-agent returns the unpublished DRAFT while the number routes via latest_published — so PATCH + GET would have read fully green while every real call kept firing chat-dash. Publishing was gated behind explicit approval because it is outward-facing on a live line and this repo records it as Shane's call (V37 CARVE-OUT). Its stated reason, the voice freeze, was MEASURED and found absent: LLM v42 and v43 are byte-identical, and the agent diff is version metadata only. Published on approval — latest_published is now v43. Rollback is one call: pin inbound_agents to agent_version 42.`,
];

const b = JSON.parse(readFileSync('hq/board.json', 'utf8'));
for (const [id, title, url, label] of ITEMS) {
  const row = { id, title, url, status: 'live', label };
  const i = b.items.findIndex((x) => x.id === id);
  if (i >= 0) b.items[i] = row; else b.items.unshift(row);
  console.log(`  ${i >= 0 ? 'updated' : 'added  '}  ${id} -> live`);
}
for (const entry of LOGS) b.log.unshift({ ts: ct, entry });
b.updated = ct;
writeFileSync('hq/board.json', JSON.stringify(b, null, 2) + '\n', 'utf8');
console.log(`\nboard.json updated · ${b.items.length} items · ${b.log.length} log entries · ${ct}`);
