#!/usr/bin/env node
// ============================================================================
// llms-verify.mjs — the llms.txt truth gate · SEO-RECOVERY v1 · Oct 17 2026
// ----------------------------------------------------------------------------
// The law: every line of a host's llms.txt quotes text that is LIVE on that
// same host. AI answer engines read llms.txt as a summary of the site; a line
// the site no longer says is a claim nobody can check, so it does not ship.
//
// INDEXING RUN 1 (Sep 28 2026) ran a verifier like this one but never committed
// it. This is the rebuild, so the check can be re-run by anyone after any edit.
//
// HOW IT READS A LINE
//   - "# ..." headings and "Last reviewed:" are structure, not claims: skipped.
//   - "- " / "> " list and quote markers are stripped.
//   - every [label](url): the label is a segment, the url must answer 200.
//   - a bare (https://...) inside a sentence must answer 200 and is removed
//     from the sentence before matching.
//   - what is left is split into sentences; each one is a segment.
//   A segment passes when it is a verbatim substring of the visible text of
//   some page on the host (the host root + every sitemap <loc> + every
//   same-host page the file links to). Curly quotes fold to straight ones and
//   whitespace collapses; nothing else is forgiven — dashes, case and digits
//   must match exactly.
//
// VISIBLE TEXT = <body> minus <script>/<style>/<noscript>/<template>/<svg> and
// comments, tags turned into spaces, entities decoded. The space a closing tag
// leaves before punctuation ("the <a>pricing page</a>.") is folded back, the
// same fold tools/truth_audit.py uses.
//
// USAGE
//   node scripts/llms-verify.mjs                       # both hosts, local files
//   node scripts/llms-verify.mjs --host=aichauffeur.ai
//   node scripts/llms-verify.mjs --live                # verify the SERVED llms.txt
//   node scripts/llms-verify.mjs --local               # pre-deploy: repo files, not prod
//   node scripts/llms-verify.mjs --red                 # negative control
//
// --local reads the corpus and resolves links from the working tree (repo root
// for aivoiceagency.ai, chauffeur/ for aichauffeur.ai) so a change can be
// proven before it ships. It is a preview, never the gate: green means green
// against production, without --local.
//
// --red appends planted defects (a retired line, an invented sentence, a dead
// link) to each file in memory and passes only if the gate catches every one.
//
// EXIT 0 = every segment live and every link 200 · 1 = anything else.
// Vanilla Node 18+, zero npm deps. Read-only: it writes nothing.
// ============================================================================

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UA = 'aivoiceagency-llms-verify/1.0';

const HOSTS = [
  { host: 'aivoiceagency.ai', file: path.join(ROOT, 'llms.txt'), dir: ROOT },
  { host: 'aichauffeur.ai', file: path.join(ROOT, 'chauffeur', 'llms.txt'), dir: path.join(ROOT, 'chauffeur') },
];

const argv = process.argv.slice(2);
const flag = (name) => {
  const hit = argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  const eq = hit.indexOf('=');
  return eq === -1 ? true : hit.slice(eq + 1);
};
const ONLY_HOST = flag('host');
const LIVE = flag('live') === true;
const LOCAL = flag('local') === true;
const RED = flag('red') === true;

// ---------------------------------------------------------------- text ------
const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’',
  lsquo: '‘', rdquo: '”', ldquo: '“', mdash: '—', ndash: '–',
  hellip: '…', middot: '·', times: '×', rarr: '→', larr: '←',
  copy: '©', reg: '®', trade: '™', shy: '',
};
function decode(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z]+);/g, (m, n) => (n in ENTITIES ? ENTITIES[n] : m));
}

// Both sides of every comparison go through norm(): quotes fold, whitespace
// collapses, and the space a tag leaves before closing punctuation is removed.
function norm(s) {
  return s
    .replace(/[‘’‛′]/g, "'")
    .replace(/[“”‟″]/g, '"')
    .replace(/[   ]/g, ' ')
    .replace(/­/g, '')
    .replace(/\s+/g, ' ')
    .replace(/ ([.,;:!?)\]])/g, '$1')
    .replace(/([(\[]) /g, '$1')
    .trim();
}

function visibleText(html) {
  const body = (html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i) || [, html])[1];
  return norm(decode(body
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|template|svg)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')));
}

// ---------------------------------------------------------------- fetch -----
async function get(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow', cache: 'no-store' });
    const type = res.headers.get('content-type') || '';
    const body = /text|xml|json/.test(type) ? await res.text() : '';
    if (!body) { try { await res.body?.cancel(); } catch {} }
    return { status: res.status, type, body, finalUrl: res.url };
  } catch (err) {
    return { status: 0, type: '', body: '', finalUrl: url, error: String(err.message || err) };
  }
}

// --local: the same answer get() would give, read from the working tree.
// /x/ -> x/index.html · /x -> x.html, else x/index.html · /x.mp3 -> x.mp3
async function getLocal(url) {
  let u;
  try { u = new URL(url); } catch { return { status: 0, type: '', body: '' }; }
  const entry = HOSTS.find((h) => h.host === u.hostname.replace(/^www\./, ''));
  if (!entry) return get(url); // a third-party link is still checked live
  const p = decodeURIComponent(u.pathname);
  const tries = p.endsWith('/') ? [p + 'index.html']
    : /\.[a-z0-9]+$/i.test(p) ? [p] : [p + '.html', p + '/index.html'];
  for (const t of tries) {
    try {
      const buf = await readFile(path.join(entry.dir, t));
      const html = /\.html$/.test(t);
      return { status: 200, type: html ? 'text/html' : /\.xml$/.test(t) ? 'text/xml' : 'application/octet-stream', body: html || /\.xml$/.test(t) ? buf.toString('utf8') : '' };
    } catch {}
  }
  return { status: 404, type: '', body: '' };
}
const fetchPage = (url) => (LOCAL ? getLocal(url) : get(url));

async function pool(items, size, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
}

const locs = (xml) => [...xml.matchAll(/<loc\b[^>]*>\s*([\s\S]*?)\s*<\/loc>/gi)].map((m) => decode(m[1].trim()));

// ---------------------------------------------------------------- parse -----
const LINK = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
const BARE = /\s*\((https?:\/\/[^)\s]+)\)/g;

function parse(text) {
  const segments = []; // { line, text }
  const links = [];    // { line, url }
  text.split(/\r?\n/).forEach((raw, idx) => {
    const line = idx + 1;
    let s = raw.trim();
    if (!s || s.startsWith('#') || /^Last reviewed:/i.test(s)) return;
    s = s.replace(/^([-*>]\s+)+/, '');
    s = s.replace(LINK, (_, label, url) => {
      links.push({ line, url });
      segments.push({ line, text: label.trim() });
      return '\u0000';
    });
    s = s.replace(BARE, (_, url) => { links.push({ line, url }); return ''; });
    // "[label](url): description" leaves "\0: description"
    s = s.replace(/^\u0000\s*:?\s*/, '').replace(/\u0000/g, ' ').trim();
    if (!s) return;
    for (const sentence of s.split(/(?<=[.!?])\s+(?=\S)/)) {
      const t = sentence.trim();
      if (t) segments.push({ line, text: t });
    }
  });
  return { segments, links };
}

// ---------------------------------------------------------------- run -------
async function verifyHost({ host, file }) {
  console.log(`\n=== ${host} ===`);
  let text;
  if (LIVE) {
    const r = await get(`https://${host}/llms.txt`);
    if (r.status !== 200) { console.log(`FAIL  served llms.txt HTTP ${r.status}`); return false; }
    text = r.body;
    console.log(`source  https://${host}/llms.txt (served)`);
  } else {
    text = await readFile(file, 'utf8');
    console.log(`source  ${path.relative(ROOT, file)} (local)`);
  }

  let planted = 0;
  if (RED) {
    const red = [
      '- One call or a thousand. Every one answered. Every one booked.',
      '- Our team ran a chauffeured transportation company for 17 years.',
      '- This sentence was invented by the red test and is live nowhere.',
      `- [Planted dead link](https://${host}/llms-verify-red-404/): One price.`,
    ];
    text += '\n' + red.join('\n') + '\n';
    // at least: line 1 (one retired sentence), line 2, line 3, the dead link,
    // and its invented label "Planted dead link"
    planted = 5;
  }

  const { segments, links } = parse(text);

  // Corpus: host root + sitemap + every same-host HTML page the file links to.
  const sm = await fetchPage(`https://${host}/sitemap.xml`);
  const pages = new Set([`https://${host}/`]);
  if (sm.status === 200) locs(sm.body).forEach((u) => pages.add(u));
  links.forEach(({ url }) => {
    try { const u = new URL(url); if (u.hostname === host && !/\.(mp3|wav|m4a|ogg|png|jpe?g|svg|webp|pdf|txt|xml)$/i.test(u.pathname)) pages.add(u.origin + u.pathname); } catch {}
  });
  const fetched = await pool([...pages], 6, async (u) => ({ u, r: await fetchPage(u) }));
  const corpus = fetched.filter((x) => x.r.status === 200 && /html/.test(x.r.type)).map((x) => ({ u: x.u, t: visibleText(x.r.body) }));
  console.log(`corpus  ${corpus.length} ${LOCAL ? 'LOCAL (pre-deploy preview)' : 'live'} pages (sitemap ${sm.status})`);

  const misses = segments.filter((seg) => !corpus.some((p) => p.t.includes(norm(seg.text))));
  const uniqueLinks = [...new Map(links.map((l) => [l.url, l])).values()];
  const linkRes = await pool(uniqueLinks, 6, async (l) => ({ ...l, r: await fetchPage(l.url) }));
  const dead = linkRes.filter((l) => l.r.status !== 200);

  console.log(`segments ${segments.length - misses.length}/${segments.length} verbatim on ${host}`);
  misses.forEach((m) => console.log(`  NOT LIVE  line ${m.line}: ${m.text}`));
  console.log(`links    ${linkRes.length - dead.length}/${linkRes.length} answer 200`);
  dead.forEach((d) => console.log(`  DEAD      line ${d.line}: ${d.url} -> ${d.r.status || d.r.error}`));

  if (RED) {
    const caught = misses.length + dead.length;
    const ok = caught >= planted;
    console.log(`red      planted ${planted} defects, caught ${caught} -> ${ok ? 'GATE WORKS' : 'GATE MISSED SOME'}`);
    return ok;
  }
  const green = misses.length === 0 && dead.length === 0;
  console.log(green ? 'GREEN' : 'RED');
  return green;
}

const targets = HOSTS.filter((h) => !ONLY_HOST || h.host === ONLY_HOST);
if (!targets.length) { console.error(`unknown --host=${ONLY_HOST}`); process.exit(1); }
let allOk = true;
for (const t of targets) allOk = (await verifyHost(t)) && allOk;
process.exit(allOk ? 0 : 1);
