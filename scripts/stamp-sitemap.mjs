#!/usr/bin/env node
// ============================================================================
// stamp-sitemap.mjs — INDEXING RUN 1 · Sep 28 2026
// ----------------------------------------------------------------------------
// Every <lastmod> in both sitemaps comes from git:
//
//   sitemap.xml            aivoiceagency.ai  (Vercel project rooted at /)
//   chauffeur/sitemap.xml  aichauffeur.ai    (Vercel project rooted at /chauffeur/)
//
// For each <url>, the <loc> is mapped to the file Vercel serves for it, and the
// lastmod becomes, verbatim:
//
//   git log -1 --format=%cI -- <file>
//
// the date of the last commit that touched that page's own source file. This
// supersedes the content-only dating in sitemap-hygiene.mjs (Aug 7): a commit
// that re-stamps a page's cache-armor tokens now moves its lastmod too. Where
// every entry shares a date, it is because git says so.
//
// Vanilla Node, zero npm deps.
//
// USAGE
//   node scripts/stamp-sitemap.mjs            stamp both sitemaps, print before/after
//   node scripts/stamp-sitemap.mjs --dry-run  print before/after, write nothing
//   node scripts/stamp-sitemap.mjs --check    write nothing; exit 1 unless every
//                                             lastmod equals git for its page
//   node scripts/stamp-sitemap.mjs --hook     the pre-commit hook (below)
//
// THE PRE-COMMIT HOOK — .githooks/pre-commit
// One-time setup per clone:   git config core.hooksPath .githooks
//
// A pre-commit hook runs BEFORE its commit exists, so `git log -1` still names a
// staged page's PREVIOUS commit. For a page staged in this commit the hook writes
// the committer date the commit is about to receive (`git var
// GIT_COMMITTER_IDENT`, printed the way %cI prints it); every other page gets
// plain `git log`. The stamped sitemap is written to the index, so it lands in
// this very commit, and the same values go into the working tree, whose line
// endings and unstaged edits are left alone. The hook does nothing unless the
// commit stages a sitemap page, a sitemap, or a vercel.json.
// Known edge: a pathspec commit (`git commit -- page.html`) stamps its temporary
// index only; run `git add sitemap.xml chauffeur/sitemap.xml` after it.
//
// EXIT CODES  0 = done / in sync · 1 = drift (--check), or a <loc> with no
//             committed source file. A sitemap URL that cannot be dated is a URL
//             that will not deploy, so this refuses rather than guess a date.
// ============================================================================

import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';

const execFileP = promisify(execFile);

// root = the directory that host's Vercel project serves from.
const SITES = [
  { host: 'aivoiceagency.ai', sitemap: 'sitemap.xml', root: '', vercel: 'vercel.json' },
  { host: 'aichauffeur.ai', sitemap: 'chauffeur/sitemap.xml', root: 'chauffeur/', vercel: 'chauffeur/vercel.json' },
];

const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
const HOOK = argv.includes('--hook');
const DRY = argv.includes('--dry-run');

function git(args, input) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    input,
    stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
}

process.chdir(git(['rev-parse', '--show-toplevel']).trim());

// ---------------------------------------------------------------------------
// sitemap text
// ---------------------------------------------------------------------------
function decodeEntities(s) {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, '&');
}

// Comments are masked before any markup is read: both sitemaps carry long
// explanatory comment blocks, and prose that mentions a tag is not an entry.
function mapUrlBlocks(xml, fn) {
  const masks = [];
  const masked = xml.replace(/<!--[\s\S]*?-->/g, (m) => {
    masks.push(m);
    return `\u0000C${masks.length - 1}\u0000`;
  });
  return masked
    .replace(/<url\b[^>]*>[\s\S]*?<\/url>/gi, fn)
    .replace(/\u0000C(\d+)\u0000/g, (_, i) => masks[Number(i)]);
}

function readEntries(xml) {
  const entries = [];
  mapUrlBlocks(xml, (block) => {
    const loc = block.match(/<loc\b[^>]*>([\s\S]*?)<\/loc>/i);
    const lastmod = block.match(/<lastmod\b[^>]*>([\s\S]*?)<\/lastmod>/i);
    if (loc) entries.push({ loc: decodeEntities(loc[1].trim()), lastmod: lastmod ? lastmod[1].trim() : null });
    return block;
  });
  return entries;
}

// Rewrites only the text inside <lastmod>. Everything else, line endings
// included, passes through byte for byte.
function stampXml(xml, dateFor) {
  const eol = xml.includes('\r\n') ? '\r\n' : '\n';
  return mapUrlBlocks(xml, (block) => {
    const loc = block.match(/<loc\b[^>]*>([\s\S]*?)<\/loc>/i);
    if (!loc) return block;
    const next = dateFor(decodeEntities(loc[1].trim()));
    if (!next) return block;
    if (/<lastmod\b[^>]*>[\s\S]*?<\/lastmod>/i.test(block)) {
      return block.replace(/(<lastmod\b[^>]*>)[\s\S]*?(<\/lastmod>)/i, (_, open, close) => open + next + close);
    }
    const indent = (block.match(/\n([ \t]*)<loc\b/) || [null, '    '])[1];
    return block.replace(/<\/loc>/i, (close) => `${close}${eol}${indent}<lastmod>${next}</lastmod>`);
  });
}

// ---------------------------------------------------------------------------
// <loc> -> the file Vercel serves for it
// ---------------------------------------------------------------------------
function readVercel(site) {
  try { return JSON.parse(readFileSync(site.vercel, 'utf8')); } catch { return {}; }
}

// Static rewrites only (no params), and only those that apply to this host.
function staticRewrites(site, cfg) {
  return (cfg.rewrites || []).filter((r) =>
    typeof r.source === 'string' && !/[:(*]/.test(r.source) &&
    typeof r.destination === 'string' && r.destination.startsWith('/') &&
    (!r.has || r.has.every((h) => h.type === 'host' && h.value === site.host)));
}

function resolveSource(site, cfg, rewrites, loc) {
  let u;
  try { u = new URL(loc); } catch { return { error: 'unparseable <loc>' }; }
  if (u.hostname !== site.host) return { error: `foreign host ${u.hostname} in ${site.sitemap}` };
  let p;
  try { p = decodeURIComponent(u.pathname); } catch { return { error: 'undecodable path' }; }

  const hit = rewrites.find((r) => r.source === p);
  let candidates;
  if (hit) candidates = [hit.destination.slice(1)];
  else if (p.endsWith('/')) candidates = [`${p.slice(1)}index.html`];
  else if (/\.[a-z0-9]+$/i.test(p)) candidates = [p.slice(1)];
  // Without cleanUrls, Vercel serves /x from x/index.html and never from x.html.
  else candidates = cfg.cleanUrls ? [`${p.slice(1)}/index.html`, `${p.slice(1)}.html`] : [`${p.slice(1)}/index.html`];

  const paths = candidates.map((c) => site.root + c);
  const found = paths.filter((f) => existsSync(f) && statSync(f).isFile());
  if (found.length === 0) return { error: `no source file (tried ${paths.join(', ')})` };
  if (found.length > 1) return { error: `ambiguous source (${found.join(', ')})` };
  return { file: found[0] };
}

// ---------------------------------------------------------------------------
// dates
// ---------------------------------------------------------------------------
async function gitDates(files) {
  const out = new Map();
  const queue = [...files];
  const worker = async () => {
    while (queue.length) {
      const f = queue.shift();
      const { stdout } = await execFileP('git', ['log', '-1', '--format=%cI', '--', f], { encoding: 'utf8' });
      out.set(f, stdout.trim());
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
  return out;
}

// The committer date the pending commit will carry, printed the way %cI prints
// it: `Z` for +0000, `±hh:mm` otherwise (checked against git 2.54 commits).
// Honours GIT_COMMITTER_DATE when the caller sets one.
function pendingCommitDate() {
  const ident = git(['var', 'GIT_COMMITTER_IDENT']).trim();
  const m = ident.match(/(\d+) ([+-])(\d{2})(\d{2})$/);
  if (!m) throw new Error('cannot read the pending commit date from GIT_COMMITTER_IDENT');
  const [, epoch, sign, hh, mm] = m;
  const offsetMin = (sign === '-' ? -1 : 1) * (Number(hh) * 60 + Number(mm));
  const d = new Date((Number(epoch) + offsetMin * 60) * 1000);
  const p = (n) => String(n).padStart(2, '0');
  const base = `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
  return offsetMin === 0 ? `${base}Z` : `${base}${sign}${hh}:${mm}`;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  const staged = HOOK
    ? new Set(git(['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMRT']).split('\0').filter(Boolean))
    : new Set();

  const plan = SITES.map((site) => {
    const wt = readFileSync(site.sitemap, 'utf8');
    let idx = null;
    if (HOOK) { try { idx = git(['show', `:${site.sitemap}`]); } catch { idx = null; } }
    const cfg = readVercel(site);
    const rewrites = staticRewrites(site, cfg);
    const before = new Map();
    for (const e of readEntries(wt)) before.set(e.loc, e.lastmod);
    if (idx !== null) for (const e of readEntries(idx)) if (!before.has(e.loc)) before.set(e.loc, e.lastmod);
    const rows = [...before].map(([loc, lastmod]) => ({ loc, before: lastmod, ...resolveSource(site, cfg, rewrites, loc) }));
    return { site, wt, idx, rows };
  });

  if (HOOK) {
    const touched = [...staged].some((f) =>
      SITES.some((s) => s.sitemap === f || s.vercel === f) || plan.some((p) => p.rows.some((r) => r.file === f)));
    if (!touched) return 0;
  }

  const unresolved = plan.flatMap((p) => p.rows.filter((r) => r.error).map((r) => `  ${r.loc}  —  ${r.error}`));
  if (unresolved.length) {
    console.error(`stamp-sitemap: ${unresolved.length} <loc> cannot be mapped to a source file:\n${unresolved.join('\n')}`);
    return 1;
  }

  const files = [...new Set(plan.flatMap((p) => p.rows.map((r) => r.file)))];
  const dates = await gitDates(files.filter((f) => !staged.has(f)));
  // Read last, so the gap to the commit's own timestamp is as short as it can be.
  const pending = files.some((f) => staged.has(f)) ? pendingCommitDate() : null;

  const undated = [];
  for (const p of plan) {
    for (const r of p.rows) {
      r.after = staged.has(r.file) ? pending : dates.get(r.file);
      if (!r.after) undated.push(`  ${r.loc}  —  ${r.file} has no commit (untracked?)`);
    }
  }
  if (undated.length) {
    console.error(`stamp-sitemap: ${undated.length} page(s) cannot be dated from git:\n${undated.join('\n')}`);
    return 1;
  }

  const changed = plan.flatMap((p) => p.rows.filter((r) => r.before !== r.after));

  if (HOOK) {
    for (const p of plan) {
      const dateFor = (loc) => p.rows.find((r) => r.loc === loc)?.after;
      if (p.idx !== null) {
        const next = stampXml(p.idx, dateFor);
        if (next !== p.idx) {
          const sha = git(['hash-object', '-w', '--stdin'], next).trim();
          const mode = git(['ls-files', '-s', '--', p.site.sitemap]).split(/\s+/)[0] || '100644';
          git(['update-index', '--cacheinfo', `${mode},${sha},${p.site.sitemap}`]);
        }
      }
      const nextWt = stampXml(p.wt, dateFor);
      if (nextWt !== p.wt) writeFileSync(p.site.sitemap, nextWt);
    }
    if (changed.length) {
      const fresh = changed.filter((r) => staged.has(r.file)).length;
      console.error(`stamp-sitemap: ${changed.length} lastmod(s) refreshed${fresh ? ` (${fresh} staged page(s) -> ${pending})` : ''}`);
    }
    return 0;
  }

  for (const p of plan) {
    const moved = p.rows.filter((r) => r.before !== r.after).length;
    console.log(`\n${p.site.sitemap}  ·  ${p.site.host}  ·  ${p.rows.length} <url>  ·  ${moved} ${CHECK ? 'out of sync' : 'changed'}`);
    for (const r of p.rows) {
      const path = new URL(r.loc).pathname;
      const mark = r.before === r.after ? '  ' : (CHECK ? '✗ ' : '~ ');
      console.log(`${mark}${path.padEnd(38)} ${String(r.before).padEnd(26)} -> ${r.after.padEnd(26)} ${r.file}`);
    }
  }

  if (CHECK) {
    const total = plan.reduce((n, p) => n + p.rows.length, 0);
    console.log(`\n${changed.length === 0 ? 'IN SYNC' : 'DRIFT'}  ${total - changed.length}/${total} lastmod values equal git log -1 --format=%cI for their page`);
    return changed.length === 0 ? 0 : 1;
  }

  if (!DRY) {
    for (const p of plan) {
      const next = stampXml(p.wt, (loc) => p.rows.find((r) => r.loc === loc)?.after);
      if (next !== p.wt) writeFileSync(p.site.sitemap, next);
    }
  }
  console.log(`\n${DRY ? 'DRY RUN — would change' : 'WROTE'}  ${changed.length} lastmod value(s)`);
  return 0;
}

process.exitCode = await main();
