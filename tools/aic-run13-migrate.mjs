#!/usr/bin/env node
/* ── AIC RUN 13 · § 2 — THE MIGRATION PAYLOAD BUILDER ─────────────────────────
   Emits the homepage-only CSS as a block ready to paste into assets/aic.css.

   Doing this by hand means transcribing about a hundred and sixty rules, and a
   single dropped declaration would be invisible until someone looked at the
   right component at the right width. So the payload is DERIVED: a rule is
   emitted when, and only when, its (at-rule context + selector) key is absent
   from aic.css entirely.

   Three properties this has that a hand-copy does not:

     · SELECTOR-LEVEL, not rule-level. `.a,.b{x}` where only `.b` is
       homepage-only emits `.b{x}` alone. Emitting the pair would push a
       declaration onto fifteen pages that never had it.
     · SOURCE ORDER IS PRESERVED EXACTLY, at-rule wrappers reopened as the
       context changes. Grouping by media query instead would invert the
       relative order of a base rule and a breakpoint rule for the same
       selector, which is a cascade change disguised as tidying.
     · The comment immediately above a rule travels WITH it. Prose describing a
       homepage component belongs next to that component; § 6's COMMENTS SHIP
       law means the prose is part of the artifact, not decoration on it.

   What it deliberately does NOT do is decide the shared-selector cases — where
   both files declare the same selector with different values. Those are
   judgement calls about which value is correct, they are listed by
   aic-run13-cssdiff.mjs, and they are written by hand into the scope block.
   ─────────────────────────────────────────────────────────────────────────── */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'audits/run13');
const OPEN = '/' + '*';
const CLOSE = '*' + '/';

const html = readFileSync(resolve(ROOT, 'chauffeur/index.html'), 'utf8');
const aicRaw = readFileSync(resolve(ROOT, 'chauffeur/assets/aic.css'), 'utf8');

const TAG_OPEN = /^[ \t]*<style>[ \t]*$/m;
const TAG_CLOSE = /^[ \t]*<\/style>[ \t]*$/m;
const o = html.match(TAG_OPEN), c = html.match(TAG_CLOSE);
const inlineRaw = html.slice(o.index + o[0].length, c.index);

const norm = (s) => s.replace(/\s+/g, ' ').trim();

/* Walk raw source, keeping comments as first-class tokens so each can be
   attached to whatever rule follows it. */
function tokenize(css) {
  const toks = [];
  const stack = [];
  let buf = '';
  let i = 0;
  while (i < css.length) {
    if (css.startsWith(OPEN, i)) {
      const end = css.indexOf(CLOSE, i + 2);
      if (end < 0) throw new Error('unterminated comment');
      toks.push({ t: 'comment', raw: css.slice(i, end + 2) });
      i = end + 2;
      continue;
    }
    const ch = css[i];
    if (ch === '{') {
      const head = norm(buf);
      buf = '';
      if (head.startsWith('@media') || head.startsWith('@supports')) {
        stack.push(head);
        i++;
        continue;
      }
      let depth = 1, j = i + 1;
      while (j < css.length && depth > 0) {
        if (css[j] === '{') depth++;
        else if (css[j] === '}') depth--;
        j++;
      }
      toks.push({ t: 'rule', ctx: stack.slice(), head, body: css.slice(i + 1, j - 1) });
      i = j;
      continue;
    }
    if (ch === '}') { stack.pop(); buf = ''; i++; continue; }
    buf += ch;
    i++;
  }
  return toks;
}

/* ── What aic.css already says, per (context, selector), folded last-wins ────
   The first version of this tool keyed on the SELECTOR alone: emit a rule when
   aic.css does not mention that selector at all. It shipped a homepage missing
   350 nodes' worth of geometry, because the interesting selectors are exactly
   the ones BOTH files mention — aic.css carries the RUN 10/11/12 override for
   `.console`, `.step`, `.feat`, `.c-card`, `.btn` and a dozen more, and the
   BASE that the override was written against lived only in index.html.
   Selector-level presence said "aic.css has it" and dropped the base.

   So presence is measured per PROPERTY. Three cases, and the middle one is the
   one that matters:

     aic.css has the property, same value       → drop, it is already said
     aic.css does NOT have the property at all  → EMIT, this is the base
     aic.css has it with a DIFFERENT value      → drop, and decide by hand

   The third case is deliberately not automated. A tool cannot know whether
   1.25rem or 2.5rem is the right margin; it can only know they disagree.
   aic-run13-cssdiff.mjs lists every one of them. */
const aicProps = new Map();
for (const t of tokenize(aicRaw)) {
  if (t.t !== 'rule') continue;
  const ctx = t.ctx.join(' && ');
  for (const sel of t.head.split(',').map(norm).filter(Boolean)) {
    const k = `${ctx}||${sel}`;
    if (!aicProps.has(k)) aicProps.set(k, new Map());
    const m = aicProps.get(k);
    for (const d of t.body.split(';')) {
      const c = d.indexOf(':');
      if (c < 0) continue;
      m.set(norm(d.slice(0, c)), norm(d.slice(c + 1)));
    }
  }
}

/* ── DELIBERATE OMISSIONS ───────────────────────────────────────────────────
   Two declarations exist only on the homepage, would be emitted by the rule
   above, and are being dropped on purpose rather than migrated:

     summary::after  transition:transform .2s
       Dead. The open state swaps `content` from + to −; no rule anywhere
       changes this element's transform, so the transition has never had a
       property to animate. aic.css already omits it. Migrating it would push
       dead code onto eleven pages that correctly do not have it.

     .foot-nap  font-feature-settings:"tnum" 1
       Redundant. aic.css sets font-variant-numeric:tabular-nums on the same
       selector, which is the same request through the supported property.

   Named here rather than silently filtered, because an omission nobody wrote
   down is indistinguishable from a bug. */
const OMIT = new Map([
  ['||summary::after', new Set(['transition'])],
  ['||.foot-nap', new Set(['font-feature-settings'])],
]);

const toks = tokenize(inlineRaw);
const out = [];
let openCtx = [];
let pending = [];
let kept = 0, dropped = 0;

const closeTo = (n) => { while (openCtx.length > n) { openCtx.pop(); out.push('  '.repeat(openCtx.length) + '}'); } };

for (const t of toks) {
  if (t.t === 'comment') { pending.push(t.raw); continue; }
  const ctx = t.ctx.join(' && ');
  const decls = t.body.split(';').map(norm).filter(Boolean)
    .map((d) => { const c = d.indexOf(':'); return c < 0 ? null : [norm(d.slice(0, c)), norm(d.slice(c + 1))]; })
    .filter(Boolean);

  /* Group the selectors of this rule by which subset of its declarations each
     one still needs. Two selectors in the same list can need different
     subsets — `.a` brand new, `.b` already half-covered — and emitting the
     union under both would push declarations onto pages that already had a
     considered value for them. */
  const groups = new Map();
  for (const sel of t.head.split(',').map(norm).filter(Boolean)) {
    const k = `${ctx}||${sel}`;
    const have = aicProps.get(k);
    const omit = OMIT.get(k);
    const need = decls.filter(([p, v]) =>
      !(omit && omit.has(p)) && (!have || !have.has(p)));
    if (!need.length) continue;
    const sig = need.map(([p, v]) => `${p}:${v}`).join(';');
    if (!groups.has(sig)) groups.set(sig, []);
    groups.get(sig).push(sel);
  }
  if (!groups.size) { dropped++; pending = []; continue; }
  kept++;
  /* Reopen only the at-rule levels that actually changed, so a run of rules
     inside one media query stays inside one media query. */
  let same = 0;
  while (same < openCtx.length && same < t.ctx.length && openCtx[same] === t.ctx[same]) same++;
  closeTo(same);
  while (openCtx.length < t.ctx.length) {
    out.push('  '.repeat(openCtx.length) + t.ctx[openCtx.length] + '{');
    openCtx.push(t.ctx[openCtx.length]);
  }
  const pad = '  '.repeat(openCtx.length);
  for (const cm of pending) out.push(pad + cm.split('\n').map((l, k) => (k ? pad + l.trim() : l.trim())).join('\n'));
  pending = [];
  for (const [sig, sels] of groups) out.push(pad + sels.join(',') + '{' + sig + '}');
}
closeTo(0);

mkdirSync(OUT, { recursive: true });
const payload = out.join('\n') + '\n';
writeFileSync(resolve(OUT, 'migrate-payload.css'), payload);
console.log(`rules kept ${kept} · dropped as already-in-aic ${dropped}`);
console.log(`payload ${payload.length} bytes → audits/run13/migrate-payload.css`);
