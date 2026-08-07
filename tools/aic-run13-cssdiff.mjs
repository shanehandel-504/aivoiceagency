#!/usr/bin/env node
/* ── AIC RUN 13 · § 2 — THE HOMEPAGE CSS DEDUP LEDGER ─────────────────────────
   The homepage is the only page on this host carrying an inline copy of the
   shell. Deleting that copy and linking assets/aic.css instead is a two-sided
   risk and the two sides are not symmetric:

     LOST     a rule that lives ONLY in the inline copy. The homepage stops
              being styled by it. This is the loud failure — you see it.
     GAINED   a rule that lives ONLY in aic.css and has never applied to the
              homepage. It starts applying the moment the link lands. This is
              the quiet one, and it is the reason this tool exists.

   Neither is visible in a byte diff of the two files, because the files are
   not supposed to be identical — aic.css legitimately carries selectors that
   only exist on the other fifteen pages, and the inline copy legitimately
   carries selectors that only exist on the homepage.

   So this compares RULE SETS, keyed on (at-rule context + selector), and it
   prints three ledgers. A selector that appears in both with different
   declarations is the third case and the most dangerous of all, because it
   changes the homepage without adding or removing anything.

   This tool does NOT decide anything. It produces the list a human then reads
   against the homepage's own markup. The proof that the swap was safe is the
   computed-style before/after in aic-run13-parity.mjs, not this file.
   ─────────────────────────────────────────────────────────────────────────── */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HOME = resolve(ROOT, 'chauffeur/index.html');
const AIC  = resolve(ROOT, 'chauffeur/assets/aic.css');
const OUT  = resolve(ROOT, 'audits/run13');

/* ── Extract the inline sheet ──────────────────────────────────────────────
   The homepage has exactly one real style element, and the naive search for its
   tag finds TEN — because the CSS inside it is full of prose explaining which
   of the three CSS homes a block lives in, and that prose names the element.
   A tool that took the first-and-last pair would have been right by luck; one
   that counted them would have aborted on a correct file.

   The real tag is the one that owns its own line. Every mention is mid-sentence
   inside a comment. Anchor on the line, and assert the count, so a future run
   that adds a second style element is told rather than silently mis-parsed. */
const TAG_OPEN = /^[ \t]*<style>[ \t]*$/m;
const TAG_CLOSE = /^[ \t]*<\/style>[ \t]*$/m;

function inlineSheet(html) {
  const opens = [...html.matchAll(new RegExp(TAG_OPEN.source, 'gm'))];
  const closes = [...html.matchAll(new RegExp(TAG_CLOSE.source, 'gm'))];
  if (opens.length !== 1 || closes.length !== 1) {
    throw new Error(`expected exactly 1 line-anchored <style>…</style> pair in index.html, found ${opens.length} open / ${closes.length} close`);
  }
  const start = opens[0].index + opens[0][0].length;
  const end = closes[0].index;
  if (end <= start) throw new Error('style close precedes open');
  return { css: html.slice(start, end), start: opens[0].index, end: closes[0].index + closes[0][0].length };
}

/* ── Comment strip, with a balance assertion ───────────────────────────────
   RUN 12 trap 24: a stray close-comment token mid-comment let the orphaned
   prose be swallowed as a malformed selector, and it took the NEXT RULE with
   it. CSS raises no parse error, so the only way that surfaces is a probe.
   Checking balance here means this tool refuses to analyse a file it cannot
   read correctly, instead of confidently analysing the wrong thing.

   This function's own source is a live demonstration: writing that token as a
   literal inside this comment ends the comment. Describe it, never quote it —
   which is the § 6 COMMENTS SHIP law applied to a tool instead of to a page. */
const OPEN = '/' + '*';
const CLOSE = '*' + '/';

function stripComments(css, label) {
  let out = '';
  let i = 0;
  let opened = 0;
  while (i < css.length) {
    const open = css.indexOf(OPEN, i);
    if (open < 0) { out += css.slice(i); break; }
    out += css.slice(i, open);
    const close = css.indexOf(CLOSE, open + 2);
    if (close < 0) throw new Error(`${label}: unterminated comment at offset ${open}`);
    opened++;
    i = close + 2;
  }
  /* A close-comment token with no opener before it survives into `out` and is
     the exact RUN 12 signature. Catch it explicitly rather than letting it
     corrupt a selector. */
  if (out.includes(CLOSE)) {
    const at = out.indexOf(CLOSE);
    throw new Error(`${label}: orphaned close-comment token at offset ${at} — ${JSON.stringify(out.slice(Math.max(0, at - 90), at + 10))}`);
  }
  return { css: out, comments: opened };
}

/* ── Parse into flat (context, selector, declarations) rules ───────────────
   Brace-depth walk. Enough for this codebase: vanilla CSS, no nesting beyond
   at-rules, no CSS-in-strings containing braces. Keyframes are kept whole as
   one context-level entry because their inner blocks are percentages, not
   selectors, and comparing them stop-by-stop adds noise without adding truth. */
function parse(css, label) {
  const rules = [];
  const stack = [];
  let buf = '';
  let i = 0;

  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  const normDecl = (s) => norm(s)
    .split(';')
    .map((d) => norm(d))
    .filter(Boolean)
    .map((d) => {
      const c = d.indexOf(':');
      if (c < 0) return d;
      return `${norm(d.slice(0, c))}:${norm(d.slice(c + 1))}`;
    })
    .sort()
    .join(';');

  while (i < css.length) {
    const ch = css[i];
    if (ch === '{') {
      const head = norm(buf);
      buf = '';
      if (head.startsWith('@media') || head.startsWith('@supports')) {
        stack.push(head);
        i++;
        continue;
      }
      /* A rule block (or @font-face / @keyframes). Consume to the matching
         close so nested braces inside keyframes do not desync the walk. */
      let depth = 1;
      let j = i + 1;
      while (j < css.length && depth > 0) {
        if (css[j] === '{') depth++;
        else if (css[j] === '}') depth--;
        j++;
      }
      const body = css.slice(i + 1, j - 1);
      const ctx = stack.join(' && ');
      /* Split a selector list so `.a,.b{x}` and `.b{x}` compare equal. Each
         selector carries its own copy of the declarations, which is exactly how
         the cascade sees it. */
      for (const sel of head.split(',').map(norm).filter(Boolean)) {
        rules.push({ ctx, sel, decl: head.startsWith('@keyframes') ? norm(body) : normDecl(body), raw: norm(body) });
      }
      i = j;
      continue;
    }
    if (ch === '}') { stack.pop(); buf = ''; i++; continue; }
    buf += ch;
    i++;
  }
  if (stack.length) throw new Error(`${label}: unclosed at-rule (${stack.join(' && ')})`);
  return rules;
}

const key = (r) => `${r.ctx}||${r.sel}`;

function index(rules) {
  const m = new Map();
  for (const r of rules) {
    if (!m.has(key(r))) m.set(key(r), []);
    m.get(key(r)).push(r);
  }
  return m;
}

const html = readFileSync(HOME, 'utf8');
const { css: rawInline } = inlineSheet(html);
const inlineClean = stripComments(rawInline, 'index.html inline <style>');
const aicClean = stripComments(readFileSync(AIC, 'utf8'), 'assets/aic.css');

const inlineRules = parse(inlineClean.css, 'inline');
const aicRules = parse(aicClean.css, 'aic.css');
const I = index(inlineRules);
const A = index(aicRules);

const lostKeys = [...I.keys()].filter((k) => !A.has(k));
const gainedKeys = [...A.keys()].filter((k) => !I.has(k));
const bothKeys = [...I.keys()].filter((k) => A.has(k));

/* Divergence on a shared key, measured on the NET value rather than on the raw
   declaration list.

   The raw list overstates the problem badly. A file that declares `.sec-h` once
   with the final value and a file that declares it twice — a base and a later
   override landing on the same value — are byte-different and pixel-identical.
   Fifty-four keys differ by declaration list; only the ones whose FOLDED value
   differs can move a pixel, and those are the only ones worth a human decision.

   Fold last-wins within each file, then compare the resulting property maps.
   This is still selector-local: it cannot see a different selector of higher
   specificity winning the property elsewhere. That is what the computed-style
   harness is for. This narrows the reading list; it does not replace the gate. */
function fold(rules) {
  const m = {};
  for (const r of rules) {
    for (const d of r.decl.split(';')) {
      if (!d) continue;
      const c = d.indexOf(':');
      if (c < 0) continue;
      m[d.slice(0, c)] = d.slice(c + 1);
    }
  }
  return m;
}

const netDiff = [];
for (const k of bothKeys) {
  const fa = fold(I.get(k));
  const fb = fold(A.get(k));
  const props = new Set([...Object.keys(fa), ...Object.keys(fb)]);
  const delta = {};
  for (const p of props) if (fa[p] !== fb[p]) delta[p] = [fa[p] ?? '—', fb[p] ?? '—'];
  if (Object.keys(delta).length) netDiff.push({ key: k, delta });
}
const divergent = netDiff.map((d) => d.key);

const report = {
  generated: 'AIC RUN 13 § 2',
  inline: { rules: inlineRules.length, selectors: I.size, comments: inlineClean.comments },
  aic: { rules: aicRules.length, selectors: A.size, comments: aicClean.comments },
  counts: { lost: lostKeys.length, gained: gainedKeys.length, shared: bothKeys.length, divergent: divergent.length },
  lost: lostKeys.map((k) => ({ key: k, decl: I.get(k).map((r) => r.decl) })),
  gained: gainedKeys.map((k) => ({ key: k, decl: A.get(k).map((r) => r.decl) })),
  divergent: netDiff,
};

mkdirSync(OUT, { recursive: true });
writeFileSync(resolve(OUT, 'cssdiff.json'), JSON.stringify(report, null, 2));

const short = (k) => k.replace('||', '  ⟨').concat('⟩').replace(/^\s*⟨/, '⟨');
console.log('══ AIC RUN 13 · CSS DEDUP LEDGER ══════════════════════════════════');
console.log(`inline  ${inlineRules.length} rules / ${I.size} selector-keys / ${inlineClean.comments} comments`);
console.log(`aic.css ${aicRules.length} rules / ${A.size} selector-keys / ${aicClean.comments} comments`);
console.log('');
console.log(`── LOST if the inline copy is deleted (${lostKeys.length}) ────────────────`);
for (const k of lostKeys) console.log('  ' + short(k));
console.log('');
console.log(`── GAINED by the homepage when aic.css links (${gainedKeys.length}) ───────`);
for (const k of gainedKeys) console.log('  ' + short(k));
console.log('');
console.log(`── DIVERGENT — same selector, different NET value (${netDiff.length}) ────`);
for (const { key: k, delta } of netDiff) {
  console.log('  ' + short(k));
  for (const [p, [a, b]] of Object.entries(delta)) {
    console.log(`      ${p}:  inline ${a}   →   aic ${b}`);
  }
}
console.log('');
console.log('written: audits/run13/cssdiff.json');
