#!/usr/bin/env node
/* ── AIC RUN 13 · § 2 — APPLY THE DEDUP ───────────────────────────────────────
   Splices the migration payload into assets/aic.css and strips the homepage's
   embedded stylesheet. Written as a script rather than done by hand because it
   moves thirty-two kilobytes of CSS and a hand-copy of that size fails silently
   — a dropped declaration shows up as one component, at one width, weeks later.

   IT REFUSES TO RUN TWICE. Trap 14: occurrence-ordered replacement is not
   idempotent, and re-running a half-applied migration is how a file ends up
   with two copies of the thing the migration existed to de-duplicate. Every
   step asserts its precondition and the script exits non-zero rather than
   doing something approximately right.
   ─────────────────────────────────────────────────────────────────────────── */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const AIC = resolve(ROOT, 'chauffeur/assets/aic.css');
const HOME = resolve(ROOT, 'chauffeur/index.html');
const PAYLOAD = resolve(ROOT, 'audits/run13/migrate-payload.css');

const die = (m) => { console.error('REFUSED: ' + m); process.exit(1); };

let aic = readFileSync(AIC, 'utf8');
let home = readFileSync(HOME, 'utf8');
let payload = readFileSync(PAYLOAD, 'utf8');

if (aic.includes('RUN 13 · THE HOMEPAGE COMES HOME')) die('aic.css already carries the RUN 13 block');
if (!/^[ \t]*<style>[ \t]*$/m.test(home)) die('index.html has no embedded stylesheet to remove');

/* ── the one line in the payload that is not a verbatim move ────────────────
   `.cta-stack` at >=1020px is the single homepage-only rule whose selector
   matches elements on thirteen OTHER pages (aic-run13-reach.mjs). Moved as-is
   it would zero the CTA stack's bottom margin across the site on desktop. It
   comes out of the payload here and goes into the scoped block instead. */
const STRAY = '  .cta-stack{margin-bottom:0}\n';
const strayCount = payload.split(STRAY).length - 1;
if (strayCount !== 1) die(`expected exactly 1 unscoped .cta-stack rule in the payload, found ${strayCount}`);
payload = payload.replace(STRAY, '');

const HEADER = `/* ══ RUN 13 · THE HOMEPAGE COMES HOME ════════════════════════════════════════
   Everything below this line rendered the homepage from an embedded <style> in
   index.html until RUN 13. That block was this site's THIRD CSS home, and it is
   why § 1's trap has cost a run every time it has fired: a rule written for
   "the stylesheet" landed in one head, and the site shipped wearing two.
   RUN 12's FAQ-answer link was the most recent instance — underlined on eleven
   pages, colour-only on the homepage, live since the section shipped, with
   Lighthouse reading 100 either way. THE AUDIT IS NOT THE RULE.

   There are TWO CSS homes now. The homepage loads exactly what the other
   fifteen pages load, so a shared rule has nowhere left to diverge to.

   POSITION IS LOAD-BEARING, exactly as it was inside index.html: these are the
   BASE rules, and the RUN 10 / 11 / 12 blocks below still override them. Move
   this block below those and the container radii, the primary-control physics
   and the 12px type floor all silently revert — no error, no warning, just an
   older-looking page.

   Nothing in here matches an element on the other fifteen pages. That is
   asserted rather than assumed: \`node tools/aic-run13-reach.mjs\` runs every
   migrating selector against every page's real DOM. Exactly one collided and it
   is scoped at the foot of this file.
   ══════════════════════════════════════════════════════════════════════════ */

`;

const FOOTER = `
/* ── RUN 13 · THE TWO VALUES THE HOMEPAGE KEEPS ──────────────────────────────
   Merging two heads meant meeting the places where they genuinely disagreed
   rather than merely differed in wording. Two of them would have moved the
   homepage if aic.css's value had simply won:

       .sec-sub    margin-bottom   2.5rem  (home)   1.25rem  (the other 15)
       .cta-stack  margin-bottom   3rem    (home)   1rem     (the other 15)

   That is the homepage's original standalone rhythm, from before there were
   other pages to be consistent with. RUN 13 is housekeeping: it removes the
   drift SOURCE, and it is not licensed to restyle the page on the way past. So
   the rendered result is preserved and the disagreement is written down here
   instead of living in a second file where nobody can see both values at once.

   A scope is not a fork. A fork is two copies that can drift apart; this is one
   copy, in the shared home, next to the value it differs from.

   Whether the homepage should keep a wider rhythm than the content pages is a
   real design question with a real answer, and it belongs to a design run.
   ─────────────────────────────────────────────────────────────────────────── */
body.home .sec-sub{margin-bottom:2.5rem}
body.home .cta-stack{margin:0 0 3rem}

/* ── AND ONE RULE THAT WAS ALREADY DEAD, KEPT DEAD ──────────────────────────
   index.html carried \`@media(min-width:1020px){.cta-stack{margin-bottom:0}}\`,
   and it had not applied to anything for a long time: a LATER \`.cta-stack\`
   rule in the same file set the \`margin\` SHORTHAND, which resets
   margin-bottom, and a media query adds no specificity to break a tie that
   source order has already decided.

   Migrating it faithfully is what resurrected it — the move put it after the
   shorthand instead of before, and the homepage hero lost 48px at desktop,
   which walked the whole page up 20px. The parity harness caught it; nothing
   else would have, because both the rule and the shorthand are correct in
   isolation and the file reads exactly as it did before.

   MOVING CSS CHANGES WHICH RULES ARE DEAD. A rule that lost a source-order tie
   in its old home can win it in the new one, and it arrives looking like a
   faithful copy. It is not restored here, because it was not doing anything
   when the run started and this run does not change how the page looks.
   ─────────────────────────────────────────────────────────────────────────── */
`;

const ANCHOR = '/* ══ RUN 10 · SHOWROOM v2.0 ══';
if (aic.split(ANCHOR).length - 1 !== 1) die('RUN 10 block header is not unique in aic.css');
aic = aic.replace(ANCHOR, HEADER + payload + '\n' + ANCHOR) + FOOTER;
writeFileSync(AIC, aic);
console.log(`aic.css  +${(HEADER + payload + FOOTER).length} bytes`);

/* ── index.html ────────────────────────────────────────────────────────────
   The stylesheet link replaces the block in place, so aic.css still loads
   AFTER circulant.css exactly as it does on the other fifteen pages. The
   version token is left off deliberately: tools/stamp_chauffeur.py owns it and
   writes it on the next stamp run, which is also what proves the page is
   registered with that tool. */
const so = home.match(/^[ \t]*<style>[ \t]*$/m);
const sc = home.match(/^[ \t]*<\/style>[ \t]*$/m);
if (!so || !sc || sc.index < so.index) die('cannot bracket the embedded stylesheet');
const removed = sc.index + sc[0].length - so.index;
home = home.slice(0, so.index) +
  '  <link rel="stylesheet" href="/assets/aic.css">' +
  home.slice(sc.index + sc[0].length);

if (home.split('\n<body>\n').length - 1 !== 1) die('index.html <body> tag is not the expected bare form');
home = home.replace('\n<body>\n', '\n<body class="home">\n');

writeFileSync(HOME, home);
console.log(`index.html  -${removed} bytes of embedded CSS, +link, body.home`);
console.log('\nNEXT: python tools/stamp_chauffeur.py   (writes the ?v= token on the new link)');
