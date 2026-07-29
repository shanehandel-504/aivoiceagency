#!/usr/bin/env node
/* ============================================================================
   tools/ghl-calendar-slot.mjs  ·  RUN 7-CODE
   ----------------------------------------------------------------------------
   MESSAGE FORMAT LAW names the booking "AVA strategy call — 15 minutes, never
   30." The live GHL calendar was configured at 30, so shipping "15 minutes"
   across the site would have contradicted the real booking system on every
   page. This aligns the system to the copy.

   ONLY the AVA Demo Call calendar is touched. The AIChauffeur and personal
   calendars stay at 30.

   USAGE:
     doppler run --project ava-prod --config prd -- node tools/ghl-calendar-slot.mjs --audit
     doppler run --project ava-prod --config prd -- node tools/ghl-calendar-slot.mjs --apply

   IDEMPOTENT. Build-time only; tools/ is never deployed (.vercelignore).
   ========================================================================== */

const PIT = process.env.GHL_PIT;
const LOC = process.env.GHL_LOCATION_ID;
if (!PIT || !LOC) { console.error('RUN INCOMPLETE — GHL creds missing'); process.exit(2); }

const MODE = process.argv.includes('--apply') ? 'apply' : 'audit';
const CAL = 'aCIv7rUnCGrysobt6Mlg';   // AVA Demo Call
const WANT = 15;

const H = { Authorization: 'Bearer ' + PIT, Version: '2021-04-15', Accept: 'application/json', 'content-type': 'application/json' };
const call = async (p, o = {}) => {
  const r = await fetch('https://services.leadconnectorhq.com' + p, { ...o, headers: H });
  const t = await r.text();
  return { status: r.status, ok: r.ok, body: t ? JSON.parse(t) : null };
};

const before = await call(`/calendars/${CAL}`);
if (!before.ok) { console.error('read failed', before.status, JSON.stringify(before.body).slice(0, 300)); process.exit(1); }
const c = before.body.calendar;
console.log(`calendar ${CAL} ${JSON.stringify(c.name)}`);
console.log(`  before: slotDuration=${c.slotDuration} ${c.slotDurationUnit} · slotInterval=${c.slotInterval} ${c.slotIntervalUnit || ''}`);

if (c.slotDuration === WANT && c.slotInterval === WANT) {
  console.log(`  already ${WANT} minutes — no-op`);
  process.exit(0);
}
if (MODE !== 'apply') { console.log(`  WOULD SET slotDuration=${WANT}, slotInterval=${WANT} (audit only)`); process.exit(0); }

/* Whitelist the keys we intend to change. Echoing the whole calendar object
   back is the trap that 400s on this API family (RUN 6.5, n8n PUT settings). */
const res = await call(`/calendars/${CAL}`, {
  method: 'PUT',
  body: JSON.stringify({ slotDuration: WANT, slotDurationUnit: 'mins', slotInterval: WANT, slotIntervalUnit: 'mins' }),
});
console.log(`  PUT ${res.status}`);
if (!res.ok) { console.error('  FAILED', JSON.stringify(res.body).slice(0, 400)); process.exit(1); }

const after = await call(`/calendars/${CAL}`);
const a = after.body.calendar;
console.log(`  after : slotDuration=${a.slotDuration} ${a.slotDurationUnit} · slotInterval=${a.slotInterval} ${a.slotIntervalUnit || ''}`);
console.log(a.slotDuration === WANT && a.slotInterval === WANT ? '  VERIFIED PASS' : '  VERIFY FAILED');
