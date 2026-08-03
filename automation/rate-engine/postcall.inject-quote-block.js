const src = $('Format Call Log').first().json || {};

const F = "'Space Grotesk','Helvetica Neue',Helvetica,Arial,sans-serif";
const INK = '#14161C';
const MUTED = '#5C6573';
const LINE = '#DDE3EA';
const ACCENT_DEEP = '#00688F';
const EMPTY = 'EMPTY — NO RESULT';

const esc = (v) => String(v === undefined || v === null ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const block = (heading, inner) =>
  '<tr><td style="padding:26px 32px 0;font-family:' + F + ';font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:' + MUTED + ';font-weight:700;">' + heading + '</td></tr>' +
  '<tr><td style="padding:10px 32px 0;">' + inner + '</td></tr>';

const rows = [];
try {
  const all = $('Load Quote For Owner').all();
  for (let i = 0; i < all.length; i++) {
    const j = all[i].json || {};
    if (j && j.quote_id) rows.push(j);
  }
} catch (e) { /* no quote */ }

const q = rows.length ? rows[0] : null;

const shell = (innerRows) =>
  '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#FFFFFF" ' +
  'style="width:100%;background:#FFFFFF;border:1px solid ' + LINE + ';border-collapse:collapse;">' + innerRows + '</table>';

const line = (k, v, bold, isLast) =>
  '<tr>' +
  '<td style="padding:14px 18px;font-family:' + F + ';font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:' + MUTED + ';font-weight:700;' + (isLast ? '' : 'border-bottom:1px solid ' + LINE + ';') + '">' + esc(k) + '</td>' +
  '<td align="right" style="padding:14px 18px;font-family:' + F + ';font-size:' + (bold ? '18px' : '15px') + ';color:' + (bold ? ACCENT_DEEP : INK) + ';font-weight:' + (bold ? '700' : '600') + ';' + (isLast ? '' : 'border-bottom:1px solid ' + LINE + ';') + '">' + esc(v) + '</td>' +
  '</tr>';

let quoteInner;
let quote_text;

if (!q) {
  quoteInner = shell('<tr><td style="padding:16px 18px;font-family:' + F + ';font-size:15px;line-height:1.6;color:' + MUTED + ';">No quote was generated on this call.</td></tr>');
  quote_text = 'Quote: none generated on this call.';
} else {
  const money = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const status = String(q.status || EMPTY);
  const parts = [];
  const txt = [];

  let bd = [];
  try { const p = JSON.parse(String(q.breakdown || '[]')); if (Array.isArray(p)) bd = p; } catch (e) { bd = []; }

  let baseRow = null;
  let scRow = null;
  const addons = [];
  for (let i = 0; i < bd.length; i++) {
    const b = bd[i];
    const label = String(b.label || '');
    if (i === 0) baseRow = b;
    else if (/gratuity/i.test(label)) scRow = b;
    else addons.push(b);
  }

  if (baseRow) {
    parts.push(line('Base — ' + String(baseRow.label || ''), money(baseRow.amount), false, false));
    txt.push('Base (' + String(baseRow.label || '') + '): ' + money(baseRow.amount));
    if (baseRow.detail) {
      parts.push('<tr><td colspan="2" style="padding:0 18px 14px;font-family:' + F + ';font-size:13px;line-height:1.6;color:' + MUTED + ';border-bottom:1px solid ' + LINE + ';">' + esc(String(baseRow.detail)) + '</td></tr>');
      txt.push('  ' + String(baseRow.detail));
    }
    if (baseRow.billable_hours !== undefined) {
      parts.push(line('Billable hours', String(baseRow.billable_hours) + ' (requested ' + String(baseRow.requested_hours) + ', minimum ' + String(baseRow.minimum_hours) + ')', false, false));
      txt.push('Billable hours: ' + String(baseRow.billable_hours) + ' (requested ' + String(baseRow.requested_hours) + ', minimum ' + String(baseRow.minimum_hours) + ')');
    }
  }
  if (scRow) {
    parts.push(line(String(scRow.label || 'service charge'), money(scRow.amount), false, false));
    txt.push(String(scRow.label || 'service charge') + ': ' + money(scRow.amount));
  }
  for (let i = 0; i < addons.length; i++) {
    const a = addons[i];
    const lbl = String(a.label || '') + (a.detail ? ' (' + String(a.detail) + ')' : '');
    parts.push(line(lbl, money(a.amount), false, false));
    txt.push(lbl + ': ' + money(a.amount));
  }

  const total = (q.all_in_total === null || q.all_in_total === undefined || Number(q.all_in_total) === 0) ? null : Number(q.all_in_total);
  if (total !== null) {
    parts.push(line('All-in total', money(total), true, false));
    txt.push('ALL-IN TOTAL: ' + money(total));
  } else {
    parts.push(line('All-in total', 'no retail number — ' + status, false, false));
    txt.push('ALL-IN TOTAL: no retail number (' + status + ')');
  }

  parts.push(line('Status', status, false, false));
  parts.push(line('Quote ID', String(q.quote_id || EMPTY), false, true));
  txt.push('Status: ' + status);
  txt.push('Quote ID: ' + String(q.quote_id || EMPTY));

  quoteInner = shell(parts.join(''));
  quote_text = txt.join('\n');
}

const quoteBlock = block('Quote', quoteInner);

let html = String(src.log_html || '');
const anchor = '<tr><td style="padding:26px 32px 0;font-family:' + F + ';font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:' + MUTED + ';font-weight:700;">Transcript</td></tr>';
const idx = html.indexOf(anchor);
let injected = false;
if (idx >= 0) {
  html = html.slice(0, idx) + quoteBlock + html.slice(idx);
  injected = true;
} else {
  const fallback = html.lastIndexOf('</table>');
  if (fallback >= 0) { html = html.slice(0, fallback) + quoteBlock + html.slice(fallback); injected = true; }
}

return [{
  json: {
    log_title: src.log_title,
    log_html: html,
    log_body: String(src.log_body || '') + '\n\n----- QUOTE -----\n' + quote_text,
    log_status: src.log_status,
    booked: src.booked,
    appointment_id: src.appointment_id,
    appointment_when: src.appointment_when,
    owner_sms: src.owner_sms,
    transcript_lines: src.transcript_lines,
    quote_injected: injected,
    quote_present: !!q,
    quote_id: q ? String(q.quote_id) : ''
  }
}];
