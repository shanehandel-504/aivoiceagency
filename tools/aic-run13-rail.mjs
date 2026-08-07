#!/usr/bin/env node
/* ── AIC RUN 13 · § 1 — THE STICKY PAIR: CALL + BOOK ──────────────────────────
   Rewrites the sticky rail's markup on all sixteen pages.

     was    [ Call (414) 775-0019 ]  [ Get a call back → #ava-callback ]
     now    [ Call (414) 775-0019 ]  [ Book the setup call → /book/ ]

   and on /book/ itself the second control is dropped, because a button whose
   job is to take the reader to the page they are already on is a control that
   does nothing. Call stays there — calling is still a real alternative.

   THE SOLO SET MOVES, AND SO DOES ITS REASON. /demo/, /terms/ and /privacy/
   were solo because they have no callback form for the old second control to
   point at. /book/ exists on every page, so all three of them get the pair and
   /book/ becomes the only solo page on the site.

   The phone icon and the verb are restructured too. The label used to be one
   text node; it is now a single wrapper span holding an inner verb span, so
   that the verb can drop below 480px WITHOUT becoming its own flex item. That
   is not cosmetic: the header chip does exactly this with a bare span and the
   flex `gap` lands BETWEEN the word and the digits, so "Call (414) 775-0019"
   renders with a 7px hole in it at desktop. One wrapper, one flex item, no
   hole. `aria-label` carries the full string at every width and therefore
   still CONTAINS the visible text (trap 9).

   Idempotent by refusal, not by luck: it asserts the shape it expects before
   it writes anything, and exits non-zero if a page is already converted.
   ─────────────────────────────────────────────────────────────────────────── */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CH = resolve(ROOT, 'chauffeur');

const PAGES = [
  'index.html', 'demo/index.html', 'book/index.html', 'how-setup-works/index.html',
  'works-with-your-software/index.html', 'limo-answering-service/index.html',
  'after-hours-limo-dispatch/index.html', 'airport-transfer-booking/index.html',
  'milwaukee-limo-answering-service/index.html', 'madison-limo-answering-service/index.html',
  'integrations/index.html', 'integrations/limo-anywhere/index.html',
  'integrations/fasttrak/index.html', 'limo-dispatch-automation/index.html',
  'privacy/index.html', 'terms/index.html',
];
const SOLO = new Set(['book/index.html']);

const BOOK = '  <a class="rail-book" href="/book/" data-event="book_click_rail">Book the setup call</a>';

let changed = 0;
const report = [];

for (const rel of PAGES) {
  const file = resolve(CH, rel);
  let s = readFileSync(file, 'utf8');
  const before = s;

  if (s.includes('class="rail-book"')) { console.error(`REFUSED: ${rel} already converted`); process.exit(1); }

  /* Pull the existing phone glyph out of the file rather than retyping it, so
     the icon stays byte-identical to the one the other controls use. */
  const svg = s.match(/<a class="rail-call"[^>]*>(<svg[\s\S]*?<\/svg>)/);
  if (!svg) { console.error(`REFUSED: ${rel} has no .rail-call anchor`); process.exit(1); }

  const newCall = `<a class="rail-call" href="tel:+14147750019" data-event="tel_tap_rail" aria-label="Call (414) 775-0019">${svg[1]}<span class="rail-label"><span class="rail-verb">Call </span>(414) 775-0019</span></a>`;
  const callRe = /<a class="rail-call"[\s\S]*?<\/a>/;
  if ((s.match(/<a class="rail-call"/g) || []).length !== 1) { console.error(`REFUSED: ${rel} has !=1 rail-call`); process.exit(1); }
  s = s.replace(callRe, newCall);

  const hasCb = /<a class="rail-cb"[\s\S]*?<\/a>\n?/.test(s);
  if (SOLO.has(rel)) {
    if (hasCb) s = s.replace(/[ \t]*<a class="rail-cb"[\s\S]*?<\/a>\n/, '');
    if (!/<div class="rail rail--solo"/.test(s)) {
      s = s.replace('<div class="rail" data-rail>', '<div class="rail rail--solo" data-rail>');
    }
  } else {
    if (hasCb) s = s.replace(/[ \t]*<a class="rail-cb"[\s\S]*?<\/a>/, BOOK);
    else s = s.replace(newCall, newCall + '\n' + BOOK);
    /* /demo/, /terms/ and /privacy/ shed rail--solo: they get the pair now. */
    s = s.replace('<div class="rail rail--solo" data-rail>', '<div class="rail" data-rail>');
  }

  /* Post-conditions, asserted per page rather than trusted. */
  const nCall = (s.match(/class="rail-call"/g) || []).length;
  const nBook = (s.match(/class="rail-book"/g) || []).length;
  const nCb = (s.match(/class="rail-cb"/g) || []).length;
  const solo = /<div class="rail rail--solo"/.test(s);
  const wantBook = SOLO.has(rel) ? 0 : 1;
  if (nCall !== 1 || nBook !== wantBook || nCb !== 0 || solo !== SOLO.has(rel)) {
    console.error(`REFUSED: ${rel} post-condition failed  call=${nCall} book=${nBook} cb=${nCb} solo=${solo}`);
    process.exit(1);
  }

  if (s !== before) { writeFileSync(file, s); changed++; }
  report.push(`  ${SOLO.has(rel) ? 'solo' : 'pair'}  ${rel}`);
}

console.log(report.join('\n'));
console.log(`\n${changed}/${PAGES.length} pages rewritten · solo: ${[...SOLO].join(', ')}`);
