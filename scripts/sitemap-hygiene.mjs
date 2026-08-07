#!/usr/bin/env node
// ============================================================================
// sitemap-hygiene.mjs — INDEX VELOCITY RIG · Aug 7 2026
// ----------------------------------------------------------------------------
// Two checks, per host, read-only:
//
//   1. LASTMOD  — every <url> has a <lastmod>, and that date matches the last
//                 commit that actually touched the page's source file.
//   2. ORPHANS  — every sitemap URL is linked from at least one OTHER public
//                 page on the same host. A page in the sitemap with no inbound
//                 internal link is asking a crawler to value something the site
//                 itself does not link to.
//
// Vanilla Node, zero npm deps.
//
// WHY THE PAGE WALK IS RECURSIVE
// RUN 12 lost a run to three tools that globbed `*/index.html` and silently
// skipped every depth-two page while printing ALL CLEAN. aichauffeur.ai now has
// /integrations/limo-anywhere/ and /integrations/fasttrak/ at depth two. This
// walker descends without a depth limit, and prints the file count it actually
// opened so an undercount is visible rather than inferred.
//
// WHY TWO HOSTS, ONE REPO
// The AVA parent deploys from the repo root; the aichauffeur Vercel project is
// rooted at /chauffeur/. So chauffeur/ is EXCLUDED from the parent's page tree
// and IS the whole tree for the chauffeur host. Treating them as one site would
// invent inbound links across a boundary crawlers never cross.
//
// USAGE
//   node scripts/sitemap-hygiene.mjs
//   node scripts/sitemap-hygiene.mjs --host=aichauffeur.ai
//
// EXIT CODES  0 = clean · 1 = at least one defect found
// ============================================================================

import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';

const argv = process.argv.slice(2);
const flagVal = (n) => {
  const hit = argv.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.slice(hit.indexOf('=') + 1) : undefined;
};
const ONLY_HOST = flagVal('host');
const WRITE = argv.includes('--write');

// Directories that are never a public page of the parent site: internal
// cockpits, noindex staging, build scratch, vendored history, the other brand.
const PARENT_EXCLUDES = new Set([
  '.git', '.claude', '.ava_build_tmp', '.playwright-mcp', 'node_modules',
  'chauffeur', 'ai100x', 'legacy', 'work', 'hq', 'cockpit', 'staging',
  'ad-stage', 'audits', 'reports', 'docs', 'tools', 'scripts', 'automation',
  'infra', 'api', 'data', 'assets', 'js', 'css', 'fonts', 'audio', 'brand',
  'templates',
]);

const CHAUFFEUR_EXCLUDES = new Set([
  '.git', 'node_modules', 'assets', 'fonts', 'audio',
]);

const HOSTS = [
  {
    host: 'aivoiceagency.ai',
    sitemapFile: 'sitemap.xml',
    root: '.',
    excludes: PARENT_EXCLUDES,
  },
  {
    host: 'aichauffeur.ai',
    sitemapFile: 'chauffeur/sitemap.xml',
    root: 'chauffeur',
    excludes: CHAUFFEUR_EXCLUDES,
  },
];

// ---------------------------------------------------------------------------
// parsing
// ---------------------------------------------------------------------------
function decodeEntities(s) {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, '&');
}

// Strip XML comments first — both sitemaps carry long explanatory comment
// blocks, and a <url> mentioned inside one is documentation, not an entry.
function parseSitemap(xml) {
  const clean = xml.replace(/<!--[\s\S]*?-->/g, '');
  const entries = [];
  const re = /<url\b[^>]*>([\s\S]*?)<\/url>/gi;
  let m;
  while ((m = re.exec(clean)) !== null) {
    const block = m[1];
    const loc = block.match(/<loc\b[^>]*>([\s\S]*?)<\/loc>/i);
    const lastmod = block.match(/<lastmod\b[^>]*>([\s\S]*?)<\/lastmod>/i);
    if (loc) {
      entries.push({
        loc: decodeEntities(loc[1].trim()),
        lastmod: lastmod ? lastmod[1].trim() : null,
      });
    }
  }
  return entries;
}

// ---------------------------------------------------------------------------
// lastmod rewrite (--write)
// ----------------------------------------------------------------------------
// Operates on the RAW sitemap so the explanatory comment blocks both files carry
// survive untouched. Comments are masked first: prose that happens to mention a
// tag must never be matched as markup.
// ---------------------------------------------------------------------------
function rewriteLastmods(xml, updates) {
  const masks = [];
  let out = xml.replace(/<!--[\s\S]*?-->/g, (m) => {
    masks.push(m);
    return `\u0000C${masks.length - 1}\u0000`;
  });

  out = out.replace(/<url\b[^>]*>[\s\S]*?<\/url>/gi, (block) => {
    const loc = block.match(/<loc\b[^>]*>([\s\S]*?)<\/loc>/i);
    if (!loc) return block;
    const key = decodeEntities(loc[1].trim());
    if (!updates.has(key)) return block;
    const next = updates.get(key);
    if (/<lastmod\b[^>]*>[\s\S]*?<\/lastmod>/i.test(block)) {
      return block.replace(/(<lastmod\b[^>]*>)[\s\S]*?(<\/lastmod>)/i, `$1${next}$2`);
    }
    return block.replace(/<\/loc>/i, `</loc>\n    <lastmod>${next}</lastmod>`);
  });

  return out.replace(/\u0000C(\d+)\u0000/g, (_, i) => masks[Number(i)]);
}

// ---------------------------------------------------------------------------
// path normalisation — /a, /a/, /a/index.html and /a.html are one page
// ---------------------------------------------------------------------------
function normalisePath(p) {
  let s = p.split('#')[0].split('?')[0];
  if (!s.startsWith('/')) s = '/' + s;
  s = s.replace(/\/index\.html?$/i, '/');
  if (s.length > 1) s = s.replace(/\/+$/, '');
  return s === '' ? '/' : s;
}

// A sitemap URL can be served by any of these files. The first that exists on
// disk is the page's source.
function candidateFiles(root, urlPath) {
  const p = normalisePath(urlPath);
  if (p === '/') return [path.join(root, 'index.html')];
  const bare = p.slice(1);
  if (/\.html?$/i.test(bare)) return [path.join(root, bare)];
  return [
    path.join(root, bare, 'index.html'),
    path.join(root, `${bare}.html`),
  ];
}

async function exists(f) {
  try { await stat(f); return true; } catch { return false; }
}

// ---------------------------------------------------------------------------
// recursive page walk — no depth limit, by design
// ---------------------------------------------------------------------------
async function walkHtml(dir, excludes, acc = []) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (excludes.has(e.name)) continue;
      await walkHtml(full, excludes, acc);
    } else if (/\.html?$/i.test(e.name)) {
      acc.push(full);
    }
  }
  return acc;
}

// ---------------------------------------------------------------------------
// git: last commit that changed the page's CONTENT
// ----------------------------------------------------------------------------
// `git log -1` is the wrong answer here and it is wrong in a way that would have
// shipped a lie. Commit b34d9b8 ("re-stamp cache armor") rewrote all 60 parent
// pages on 2026-08-05 and its own message says the diff is "version-token only.
// No nav, footer, or content region changed." Copying that date into 60 lastmod
// fields would tell Google every page on the site gained new content that day.
// Google's documented response to a sitemap whose lastmod it cannot trust is to
// ignore lastmod for the whole site — so the dishonest version of this field is
// strictly worse than no field at all.
//
// Two classes of churn are therefore skipped when dating a page:
//   1. version tokens  — ?v=<hash> and __ASSET_V='<hash>' cache-armor bumps
//   2. shared chrome   — the stamp.py-owned nav / footer / crumbs / call bar
// Both are boilerplate. Neither means the page says anything new.
// ---------------------------------------------------------------------------

const VERSION_TOKEN_RE = /(\?v=)[0-9a-f]{6,40}/gi;
const ASSET_V_RE = /(__ASSET_V\s*=\s*')[0-9a-f]{6,40}(')/gi;
// The stamp.py-owned marker regions, verbatim: BRIDGE:NAV, BRIDGE:FOOTER,
// BRIDGE:CALLBAR, BRIDGE:CRUMBS, BRIDGE:HEAD.
const BRIDGE_BLOCK_RE = /<!--\s*BRIDGE:([A-Z]+)\s*-->[\s\S]*?<!--\s*\/BRIDGE:\1\s*-->/g;

// A line-level chrome filter is not good enough: `<a href="/privacy">Privacy</a>`
// sits INSIDE the footer block but carries no class of its own, so a per-line
// test waves it through and a footer-only sweep reads as a content change on 59
// pages. Comparing the marker-stripped body is exact instead of heuristic.
function fingerprint(html) {
  return createHash('sha256')
    .update(
      html
        .replace(BRIDGE_BLOCK_RE, '')
        .replace(VERSION_TOKEN_RE, '$1<V>')
        .replace(ASSET_V_RE, '$1<V>$2')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .digest('hex');
}

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024,
  });
}

const fpCache = new Map();
function fingerprintAt(hash, gitPath) {
  const k = `${hash}:${gitPath}`;
  if (fpCache.has(k)) return fpCache.get(k);
  let fp;
  try { fp = fingerprint(git(['show', `${hash}:${gitPath}`])); }
  catch { fp = null; } // file did not exist at this commit
  fpCache.set(k, fp);
  return fp;
}

function gitLastContentDate(file) {
  const gitPath = file.split(path.sep).join('/').replace(/^\.\//, '');
  let log;
  try { log = git(['log', '--format=%H %cs', '--', gitPath]).trim(); } catch { return null; }
  if (!log) return null;

  const commits = log.split('\n').map((l) => {
    const [hash, date] = l.trim().split(/\s+/);
    return { hash, date };
  });

  // Newest first. The answer is the newest commit whose stripped body differs
  // from the previous commit that touched the same file.
  for (let i = 0; i < commits.length; i++) {
    const now = fingerprintAt(commits[i].hash, gitPath);
    const prev = i + 1 < commits.length ? fingerprintAt(commits[i + 1].hash, gitPath) : null;
    if (now !== prev) return commits[i].date;
  }

  return commits[commits.length - 1]?.date ?? null;
}

// ---------------------------------------------------------------------------
// per-host audit
// ---------------------------------------------------------------------------
async function auditHost(cfg) {
  const { host, sitemapFile, root, excludes } = cfg;
  console.log(`\n${'='.repeat(72)}`);
  console.log(`HOST  ${host}`);
  console.log(`${'='.repeat(72)}`);

  const xml = await readFile(sitemapFile, 'utf8');
  const entries = parseSitemap(xml);
  console.log(`sitemap        ${sitemapFile}  —  ${entries.length} <url> entries`);

  const pages = await walkHtml(root, excludes);
  console.log(`page tree      ${root}/  —  ${pages.length} HTML files opened`);

  // Build the inbound-link index once: normalised target path -> Set(source file)
  const inbound = new Map();
  const hrefRe = /(?:href|content)\s*=\s*["']([^"']+)["']/gi;
  for (const f of pages) {
    const html = await readFile(f, 'utf8');
    let m;
    while ((m = hrefRe.exec(html)) !== null) {
      const raw = m[1].trim();
      let target = null;
      if (raw.startsWith('/')) {
        target = raw;
      } else if (/^https?:\/\//i.test(raw)) {
        try {
          const u = new URL(raw);
          if (u.hostname === host) target = u.pathname;
        } catch { /* not a URL we can use */ }
      }
      if (!target) continue;
      const key = normalisePath(target);
      if (!inbound.has(key)) inbound.set(key, new Set());
      inbound.get(key).add(f);
    }
  }

  const missingLastmod = [];
  const staleLastmod = [];
  const missingFile = [];
  const orphans = [];

  for (const { loc, lastmod } of entries) {
    let u;
    try { u = new URL(loc); } catch { continue; }
    const key = normalisePath(u.pathname);

    // --- lastmod present? ---
    if (!lastmod) { missingLastmod.push(loc); }

    // --- lastmod accurate? ---
    const cands = candidateFiles(root, u.pathname);
    let src = null;
    for (const c of cands) if (await exists(c)) { src = c; break; }

    if (!src) {
      missingFile.push({ loc, tried: cands });
    } else if (lastmod) {
      const gitDate = gitLastContentDate(src);
      if (gitDate && gitDate !== lastmod) {
        staleLastmod.push({ loc, src, lastmod, gitDate });
      }
    }

    // --- orphan? (inbound links from a DIFFERENT file) ---
    const linkers = inbound.get(key);
    const external = linkers
      ? [...linkers].filter((f) => path.resolve(f) !== path.resolve(src || ''))
      : [];
    if (external.length === 0) orphans.push({ loc, key });
  }

  // ---- report ----
  console.log(`\n-- 1. LASTMOD PRESENT --`);
  if (missingLastmod.length === 0) console.log(`   PASS  all ${entries.length} entries carry <lastmod>`);
  else { console.log(`   FAIL  ${missingLastmod.length} missing:`); missingLastmod.forEach((l) => console.log(`         ${l}`)); }

  console.log(`\n-- 2. LASTMOD ACCURATE (vs last commit touching the source file) --`);
  if (missingFile.length) {
    console.log(`   WARN  ${missingFile.length} sitemap URL(s) have no source file on disk:`);
    missingFile.forEach((x) => console.log(`         ${x.loc}\n           tried: ${x.tried.join(' , ')}`));
  }
  if (staleLastmod.length === 0) {
    console.log(`   PASS  every resolvable entry matches its git date`);
  } else {
    console.log(`   FAIL  ${staleLastmod.length} drifted:`);
    for (const s of staleLastmod) {
      console.log(`         ${s.loc}`);
      console.log(`           sitemap says ${s.lastmod}  ·  git says ${s.gitDate}  ·  ${s.src}`);
    }
  }

  console.log(`\n-- 3. ORPHAN CHECK (>=1 inbound internal link) --`);
  if (orphans.length === 0) console.log(`   PASS  every sitemap URL is linked from at least one other page`);
  else { console.log(`   FAIL  ${orphans.length} orphan(s):`); orphans.forEach((o) => console.log(`         ${o.loc}   (looked for links to ${o.key})`)); }

  if (WRITE && (staleLastmod.length || missingLastmod.length)) {
    const updates = new Map();
    for (const s of staleLastmod) updates.set(s.loc, s.gitDate);
    // An entry with no <lastmod> still needs one; resolve it the same way.
    for (const loc of missingLastmod) {
      let u; try { u = new URL(loc); } catch { continue; }
      const cands = candidateFiles(root, u.pathname);
      let src = null;
      for (const c of cands) if (await exists(c)) { src = c; break; }
      const d = src && gitLastContentDate(src);
      if (d) updates.set(loc, d);
    }
    if (updates.size) {
      await writeFile(sitemapFile, rewriteLastmods(xml, updates), 'utf8');
      console.log(`\nWROTE  ${updates.size} lastmod value(s) into ${sitemapFile}`);
    }
  }

  const defects = missingLastmod.length + staleLastmod.length + orphans.length + missingFile.length;
  console.log(`\nDEFECTS  ${defects}`);
  return defects;
}

// ---------------------------------------------------------------------------
const targets = ONLY_HOST ? HOSTS.filter((h) => h.host === ONLY_HOST) : HOSTS;
let total = 0;
for (const t of targets) total += await auditHost(t);
console.log(`\n${'='.repeat(72)}`);
console.log(total === 0 ? 'SITEMAP HYGIENE: CLEAN' : `SITEMAP HYGIENE: ${total} DEFECT(S)`);
process.exit(total === 0 ? 0 : 1);
