#!/usr/bin/env node
// ============================================================================
// brick.mjs — THE ANSWER PRESS · SEO-RECOVERY v1 · Oct 17 2026
// ----------------------------------------------------------------------------
// One brick text file in, one live answer page out. A brick is a question an
// owner types into a search box or an AI engine, answered in plain words that
// Shane has already approved. The press adds nothing to those words: it lays
// them into the site's own page shell, writes the schema from the same strings,
// and refuses to write anything a validator or the word laws reject.
//
// INPUT — plain text, exactly this shape (AVA bricks start "AVA BRICK #<n> — "):
//   AEO BRICK #<n> — <question>
//   SLUG: /answers/<kebab-slug>/
//   TITLE (60 chars max): <title>
//   META (155 chars max): <one-sentence answer>
//   BODY (300–450 words):
//   <paragraphs separated by blank lines; lines starting "1." "2." … become an <ol>>
//   FAQ (3 pairs, one line each):
//   Q: … A: …        (three lines)
//   CTA: <one line>
//
// FILES
//   bricks/inbox/aic/<slug>.txt  bricks/inbox/ava/<slug>.txt   waiting to build
//   bricks/built/aic/<slug>.txt  bricks/built/ava/<slug>.txt   moved here (git mv)
//   aic -> chauffeur/answers/<slug>/index.html  (aichauffeur.ai)
//   ava -> answers/<slug>/index.html            (aivoiceagency.ai)
//
// USAGE
//   node scripts/brick.mjs --site aic --file bricks/inbox/aic/<slug>.txt
//   node scripts/brick.mjs --site ava --file bricks/inbox/ava/<slug>.txt
//   node scripts/brick.mjs --all            every file in both inboxes
//   node scripts/brick.mjs --all --dry      build into a temp folder, validate,
//                                           print what it would write; the repo
//                                           is not touched
//
// EACH PAGE
//   The shell is that site's pricing page (nav, footer, fonts, analytics, the
//   AIC call-to-QR dialog), body class "page-answer" (aic.css already owns
//   ".answer" as its answer-box component, so the paste's "answer" would paint the
//   whole page as a bordered panel). Visible order: breadcrumb
//   (Answers > question) · H1 = question · META verbatim · BODY · H2 "Questions"
//   with the three pairs (Q <h3>, A <p>) · the CTA line · "See pricing" · the
//   site's book button · "Last reviewed: <build date>".
//   Schema: Organization + WebSite (the site's spine, copied from the shell) +
//   WebPage + FAQPage (the three pairs verbatim) + BreadcrumbList. Every claim
//   string is a verbatim substring of the page's visible text (checked here),
//   and tools/validate_jsonld.py must report 0 errors or nothing is written.
//
// AFTER A PAGE BUILDS
//   sitemap.xml gets the URL · llms.txt gets "- [<question>](<url>): <META>"
//   under "## Answers" · <host>/answers/index.html is rebuilt (newest first,
//   indexable) · IndexNow: a URL that is already live is pinged now through
//   scripts/indexnow-ping.mjs; one that is not live yet is pinged by the
//   production deploy hook (n8n "SEO — IndexNow daily", Trigger B) when the
//   push deploys, and the exact manual command is printed.
//
// IDEMPOTENT: a second run changes nothing — an unchanged page keeps its old
// "Last reviewed" date, and every list edit is skipped when already present.
//
// Vanilla Node 18+, zero npm deps. Runs on the Dell; never deployed (scripts/
// is in .vercelignore).
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, mkdtempSync, renameSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SITES = {
  aic: {
    key: 'aic', host: 'aichauffeur.ai', brand: 'AI Chauffeur', prefix: 'AEO BRICK',
    dir: 'chauffeur', shell: 'chauffeur/pricing/index.html',
    sitemap: 'chauffeur/sitemap.xml', llms: 'chauffeur/llms.txt',
    pricing: '/pricing/', book: { href: '/book/', label: 'Book the setup call' },
    foreignPhone: /414\)?[\s.-]*240[\s.-]*8930/,
  },
  ava: {
    key: 'ava', host: 'aivoiceagency.ai', brand: 'AI Voice Agency', prefix: 'AVA BRICK',
    dir: '', shell: 'pricing/index.html',
    sitemap: 'sitemap.xml', llms: 'llms.txt',
    pricing: '/pricing', book: { href: '/book', label: 'Book the AVA strategy call' },
    foreignPhone: /414\)?[\s.-]*775[\s.-]*0019/,
  },
};

// The paste's banned list, plus the CLAUDE.md word laws a brick could trip.
const BANNED = [
  [/one call or a thousand/i, '"one call or a thousand"'],
  [/\b1 or 1,000\b/i, '"1 or 1,000"'],
  [/\blocked\b/i, '"locked" / "locked in"'],
  [/100 free minutes/i, '"100 free minutes"'],
  [/sounds human/i, '"sounds human"'],
  [/\b17 years\b/i, '"17 years" (the team ran it 14)'],
  [/limo anywhere/i, '"Limo Anywhere" (a new page never names it)'],
  [/\bguaranteed?\b/i, '"guaranteed"'],
  [/350[\s.-]*220[\s.-]*5305|414[\s.-]*409[\s.-]*5008/, 'a private number'],
  [/\(?\b(305|480|786)\)?[\s.-]*\d{3}[\s.-]*\d{4}\b/, 'a private number (305 / 480 / 786)'],
];

// ---------------------------------------------------------------- args ------
const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f) => { const i = argv.indexOf(f); return i !== -1 ? argv[i + 1] : undefined; };
const DRY = has('--dry');
const ALL = has('--all');
const SITE = val('--site');
const FILE = val('--file');

// ---------------------------------------------------------------- utils -----
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date());
const words = (s) => (s.match(/[A-Za-z0-9$][A-Za-z0-9$'’.,%-]*/g) || []).length;
function readText(p) { return readFileSync(p, 'utf8').replace(/\r\n/g, '\n'); }
function writeKeepEol(p, text, like) {
  const crlf = like != null && like.includes('\r\n');
  mkdirSync(path.dirname(p), { recursive: true });
  writeFileSync(p, crlf ? text.replace(/\r?\n/g, '\r\n') : text);
}
function once(s, needle, rep) {
  const n = s.split(needle).length - 1;
  if (n !== 1) throw new Error(`shell anchor found ${n}x (want 1): ${needle.slice(0, 70)}`);
  return s.replace(needle, () => rep);
}
function swapRe(s, re, rep) {
  let n = 0;
  const out = s.replace(re, () => { n++; return rep; });
  if (n !== 1) throw new Error(`shell pattern matched ${n}x (want 1): ${re}`);
  return out;
}

// Visible text, folded the way tools/truth_audit.py folds it.
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '\u2019', lsquo: '\u2018', rdquo: '\u201D', ldquo: '\u201C', mdash: '\u2014', ndash: '\u2013', middot: '\u00B7', rarr: '\u2192', copy: '\u00A9' };
const decode = (s) => s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/&([a-z]+);/gi, (m, n) => ENT[n] ?? m);
const fold = (s) => s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\s+/g, ' ').replace(/ ([.,;:!?)])/g, '$1').trim();
const visible = (html) => fold(decode((html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i) || [, html])[1]
  .replace(/<!--[\s\S]*?-->/g, ' ').replace(/<(script|style|svg|noscript|template)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')));

// ---------------------------------------------------------------- parse -----
function parseBrick(text, site) {
  const errs = [];
  const lines = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').split('\n');
  let i = 0;
  const next = () => { while (i < lines.length && !lines[i].trim()) i++; return lines[i]; };

  const head = (next() || '').trim();
  const hm = head.match(/^(AEO|AVA) BRICK #(\d+)\s*[—–-]\s*(.+)$/);
  if (!hm) errs.push('first line is not "AEO BRICK #<n> — <question>" / "AVA BRICK #<n> — <question>"');
  else if (`${hm[1]} BRICK` !== site.prefix) errs.push(`header says "${hm[1]} BRICK" but --site ${site.key} wants "${site.prefix}"`);
  i++;
  const field = (name) => {
    const l = (next() || '').trim();
    const m = l.match(new RegExp(`^${name}(?:\\s*\\([^)]*\\))?:\\s*(.*)$`));
    if (!m) { errs.push(`expected "${name}:" at line ${i + 1}, found "${l.slice(0, 40)}"`); return ''; }
    i++;
    return m[1].trim();
  };
  const slugRaw = field('SLUG');
  const title = field('TITLE');
  const meta = field('META');
  const bodyHead = field('BODY');
  if (bodyHead) errs.push('BODY: must start on the line after "BODY (300–450 words):"');
  const bodyLines = [];
  while (i < lines.length && !/^FAQ(\s*\(|:)/.test(lines[i].trim())) bodyLines.push(lines[i++]);
  const faqHead = field('FAQ');
  if (faqHead) errs.push('FAQ: the pairs start on the line after "FAQ (3 pairs, one line each):"');
  const faq = [];
  while (i < lines.length && /^Q:/.test((next() || '').trim())) {
    const m = lines[i].trim().match(/^Q:\s*(.+?)\s+A:\s*(.+)$/);
    if (!m) errs.push(`FAQ line ${i + 1} is not "Q: … A: …"`); else faq.push({ q: m[1].trim(), a: m[2].trim() });
    i++;
  }
  const cta = field('CTA');
  if ((next() || '') !== undefined && i < lines.length && lines.slice(i).some((l) => l.trim())) errs.push(`unexpected text after CTA at line ${i + 1}`);

  const question = hm ? hm[3].trim() : '';
  const sm = slugRaw.match(/^\/answers\/([a-z0-9]+(?:-[a-z0-9]+)*)\/$/);
  if (!sm) errs.push(`SLUG "${slugRaw}" is not /answers/<kebab-slug>/`);
  if ([...title].length > 60) errs.push(`TITLE is ${[...title].length} chars (max 60)`);
  if (!title) errs.push('TITLE is empty');
  if ([...meta].length > 155) errs.push(`META is ${[...meta].length} chars (max 155)`);
  if (!meta) errs.push('META is empty');
  if (faq.length !== 3) errs.push(`FAQ has ${faq.length} pairs (want exactly 3)`);
  if (!cta) errs.push('CTA is empty');

  // BODY: blocks split on blank lines; runs of "1." lines become one <ol>.
  const blocks = [];
  let para = [];
  const flush = () => { if (para.length) { blocks.push({ t: 'p', text: para.join(' ') }); para = []; } };
  for (const raw of bodyLines) {
    const l = raw.trim();
    if (!l) { flush(); continue; }
    const om = l.match(/^\d+\.\s+(.+)$/);
    if (om) {
      flush();
      const last = blocks[blocks.length - 1];
      if (last && last.t === 'ol' && !last.closed) last.items.push(om[1]); else blocks.push({ t: 'ol', items: [om[1]] });
    } else {
      const last = blocks[blocks.length - 1];
      if (last && last.t === 'ol') last.closed = true;
      para.push(l);
    }
  }
  flush();
  const bodyText = blocks.map((b) => (b.t === 'p' ? b.text : b.items.join(' '))).join(' ');
  const bodyWords = words(bodyText);
  if (bodyWords < 300 || bodyWords > 450) errs.push(`BODY is ${bodyWords} words (want 300–450)`);

  const all = [question, title, meta, bodyText, ...faq.flatMap((f) => [f.q, f.a]), cta].join('\n');
  for (const [re, what] of BANNED) if (re.test(all)) errs.push(`banned: ${what}`);
  if (site.foreignPhone.test(all)) errs.push(`the other brand's phone number appears on a ${site.host} page`);
  if (site.key === 'ava' && /\b(she|her)\b/i.test(all)) errs.push('AVA is never "she" / "her"');

  return { errs, n: hm ? hm[2] : '?', question, slug: sm ? sm[1] : '', title, meta, blocks, bodyWords, faq, cta };
}

// ---------------------------------------------------------------- shell -----
// Answer pages and the answers index are both cut from the pricing page, so the
// chrome (and, on aivoiceagency.ai, the stamp.py marker regions) is the live one.
function shellParts(site) {
  const src = readText(path.join(ROOT, site.shell));
  const ld = JSON.parse(src.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/)[1]);
  const graph = ld['@graph'] || [];
  const org = graph.find((n) => n['@type'] === 'Organization');
  const web = graph.find((n) => n['@type'] === 'WebSite');
  if (!org || !web) throw new Error(`${site.shell}: no Organization/WebSite node to copy`);
  return { src, org, web };
}

function crumbAva(trail) {
  // Byte-identical to tools/stamp.py crumb_html(), so a stamp run is a no-op.
  const parts = ['<a href="/">Home</a>'];
  trail.forEach(([label, href], k) => {
    parts.push('<span class="bc-sep">/</span>');
    if (k === trail.length - 1) parts.push(`<span class="bc-here">${label}</span>`);
    else if (href) parts.push(`<a href="${href}">${label}</a>`);
    else parts.push(`<span>${label}</span>`);
  });
  return '<!-- BRIDGE:CRUMB -->\n<nav class="bcrumb" aria-label="Breadcrumb">' + parts.join('') + '</nav>\n<!-- /BRIDGE:CRUMB -->';
}

const CSS_AIC = `  /* ANSWER PAGES (scripts/brick.mjs · SEO-RECOVERY v1) — the pricing page's
     shell; only the reading column lives here. Colours are the aic.css tokens. */
  .answer-body{max-width:68ch}
  .answer-body p,.answer-body li{font-family:var(--sans);font-size:1.0625rem;line-height:1.65;color:var(--ink-soft)}
  .answer-body > * + *{margin-top:1.1rem}
  .answer-body ol{padding-left:1.4rem}
  .answer-body li + li{margin-top:.5rem}
  .answer-faq{max-width:68ch;margin-top:1.5rem}
  .answer-faq h3{font-family:var(--sans);font-size:1.125rem;font-weight:600;line-height:1.35;color:var(--ink);margin:1.75rem 0 .5rem}
  .answer-faq h3:first-child{margin-top:0}
  .answer-faq p{font-family:var(--sans);font-size:1.0625rem;line-height:1.6;color:var(--ink-soft);margin:0}
  .answer-links{margin:1rem 0 0;font-family:var(--sans);font-size:1.0625rem}
  .answer-links a{color:var(--ink);text-decoration:underline;text-underline-offset:3px}
  .answer-reviewed{margin:1.75rem 0 0;font-family:var(--mono);font-size:.8125rem;color:var(--ink-mute)}
  .answer-index{list-style:none;margin:0;padding:0;max-width:72ch}
  .answer-index li{padding:1.25rem 0}
  .answer-index li + li{border-top:1px solid var(--line)}
  .answer-index a{font-family:var(--sans);font-size:1.1875rem;font-weight:600;line-height:1.35;color:var(--ink);text-decoration:none}
  .answer-index a:hover{color:var(--signal-blue)}
  .answer-index p{margin:.4rem 0 0;font-family:var(--sans);font-size:1.0625rem;line-height:1.55;color:var(--ink-soft)}
  .page-go{margin-top:1.25rem}
`;

const CSS_AVA = `  /* ANSWER PAGES (scripts/brick.mjs · SEO-RECOVERY v1) on the /pricing shell
     (circulant + guide + bridge + calls.css). Only the reading column lives here. */
  *{ margin:0; padding:0; box-sizing:border-box; }
  html,body{ background:var(--e0); }
  body{
    color:var(--ink); font-family:'Space Grotesk',system-ui,-apple-system,Segoe UI,sans-serif;
    -webkit-font-smoothing:antialiased; min-height:100vh; min-height:100dvh; overflow-x:hidden;
  }
  .pr-hero{ padding:48px 0 0; }
  .pr-hero h1{ font-size:clamp(30px,4.6vw,48px); font-weight:700; letter-spacing:-.025em; line-height:1.08;
    color:var(--text); max-width:22ch; text-wrap:balance; }
  .pr-sub{ margin-top:16px; font-size:clamp(17px,1.6vw,20px); line-height:1.5; color:var(--body-dim); max-width:56ch; }
  .pr-sec{ padding:48px 0; }
  .ans-body{ max-width:68ch; }
  .ans-body p,.ans-body li{ font-size:17px; line-height:1.65; color:var(--body-dim); }
  .ans-body > * + *{ margin-top:18px; }
  .ans-body ol{ padding-left:22px; }
  .ans-body li + li{ margin-top:8px; }
  .ans h2{ margin-top:56px; font-size:clamp(24px,3vw,32px); font-weight:700; letter-spacing:-.02em; line-height:1.15; color:var(--text); }
  .ans-faq{ max-width:68ch; }
  .ans-faq h3{ margin:28px 0 8px; font-size:19px; font-weight:600; line-height:1.3; color:var(--text); }
  .ans-faq p{ font-size:16px; line-height:1.6; color:var(--body-dim); }
  .ans-cta{ margin-top:56px; font-size:18px; line-height:1.5; color:var(--text); max-width:60ch; }
  .ans-links{ margin-top:12px; font-size:16px; }
  .ans-links a{ color:var(--text); text-decoration:underline; text-underline-offset:3px; }
  .ans-links a:hover{ color:var(--cyan); }
  .ans-links a:focus-visible{ outline:2px solid var(--cyan); outline-offset:3px; }
  .ans .cx-btn{ margin-top:20px; }
  .ans-reviewed{ margin-top:28px; font-family:var(--g-mono); font-size:13px; color:var(--neutral); }
  .ans-index{ list-style:none; max-width:72ch; }
  .ans-index li{ padding:20px 0; }
  .ans-index li + li{ border-top:1px solid var(--line); }
  .ans-index a{ font-size:19px; font-weight:600; line-height:1.35; color:var(--text); text-decoration:none; }
  .ans-index a:hover{ color:var(--cyan); }
  .ans-index p{ margin-top:6px; font-size:16px; line-height:1.55; color:var(--body-dim); }
  @media(min-width:768px){ .pr-hero{ padding-top:96px; } .pr-sec{ padding:64px 0 96px; } }
`;

function pageHead(s, { title, desc, url }) {
  s = swapRe(s, /<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  s = desc == null
    ? swapRe(s, /\n[ \t]*<meta name="description" content="[^"]*">/, '')
    : swapRe(s, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">`);
  s = swapRe(s, /<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);
  s = swapRe(s, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(title)}">`);
  s = swapRe(s, /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(desc ?? title)}">`);
  s = swapRe(s, /<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  s = swapRe(s, /<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${esc(title)}">`);
  s = swapRe(s, /<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${esc(desc ?? title)}">`);
  return s;
}

function ldScript(graph) {
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2).replace(/<\//g, '<\\/');
  return `<script type="application/ld+json">\n${json}\n</script>`;
}

function crumbList(items) {
  return { '@type': 'BreadcrumbList', itemListElement: items.map(([name, item], k) => ({ '@type': 'ListItem', position: k + 1, name, item })) };
}

function render(site, shell, { title, desc, url, h1, sub, mainAic, mainAva, graph, trail }) {
  let s = pageHead(shell.src, { title, desc, url });
  s = swapRe(s, /<script type="application\/ld\+json">[\s\S]*?<\/script>/, ldScript(graph));
  if (site.key === 'aic') {
    // keep the QR dialog CSS from the pricing page, swap the price block CSS out
    const style = s.match(/  <style>\n([\s\S]*?)  <\/style>/);
    const qr = style[1].split('\n').filter((l) => /^\s*\.qr-/.test(l)).join('\n') + '\n';
    s = s.replace(style[0], () => `  <style>\n${CSS_AIC}  /* the desktop call-to-QR dialog, as on the homepage */\n${qr}  </style>`);
    s = once(s, '<body>', '<body class="page-answer">');
    s = s.split('<a href="/pricing/" aria-current="page">Pricing</a>').join('<a href="/pricing/">Pricing</a>');
    s = swapRe(s, /<main id="main">[\s\S]*?<\/main>/, mainAic);
  } else {
    s = swapRe(s, /<style>\n  \/\* \/pricing \(SEO-RECOVERY[\s\S]*?<\/style>/, `<style>\n${CSS_AVA}</style>`);
    s = swapRe(s, /<!-- BRIDGE:CRUMBLD -->[\s\S]*?<!-- \/BRIDGE:CRUMBLD -->\n?/, '');
    s = once(s, '<body>', '<body class="page-answer">');
    s = swapRe(s, /<!-- BRIDGE:CRUMB -->[\s\S]*?<!-- \/BRIDGE:CRUMB -->/, crumbAva(trail));
    s = swapRe(s, /<main>[\s\S]*?<\/main>/, mainAva);
  }
  return s;
}

function answerPage(site, shell, b, date) {
  const url = `https://${site.host}/answers/${b.slug}/`;
  const q = esc(b.question);
  const bodyAic = b.blocks.map((x) => (x.t === 'p' ? `      <p>${esc(x.text)}</p>` : `      <ol>\n${x.items.map((it) => `        <li>${esc(it)}</li>`).join('\n')}\n      </ol>`)).join('\n');
  const bodyAva = bodyAic.replace(/^ {2}/gm, '');
  const faqAic = b.faq.map((f) => `      <h3>${esc(f.q)}</h3>\n      <p>${esc(f.a)}</p>`).join('\n');
  const faqAva = faqAic.replace(/^ {2}/gm, '');
  const mainAic = `<main id="main">

<section class="phead" data-lit="bright" data-rail-after>
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb">
      <ol>
        <li><a href="/">Home</a></li>
        <li><a href="/answers/">Answers</a></li>
        <li aria-current="page">${q}</li>
      </ol>
    </nav>
    <h1 class="page-h">${q}</h1>
    <p class="page-sub">${esc(b.meta)}</p>
  </div>
</section>

<section id="answer" data-lit="flat">
  <div class="wrap">
    <div class="answer-body">
${bodyAic}
    </div>
  </div>
</section>

<section id="faq" data-lit="flat">
  <div class="wrap">
    <h2 class="sec-h">Questions</h2>
    <div class="answer-faq">
${faqAic}
    </div>
  </div>
</section>

<section id="close" data-lit="bright">
  <div class="wrap">
    <p class="sec-sub">${esc(b.cta)}</p>
    <p class="answer-links"><a href="${site.pricing}" data-event="pricing_link_answer">See pricing</a></p>
    <a href="${site.book.href}" class="btn btn-primary btn-go page-go" data-event="book_click_answer">${site.book.label}</a>
    <p class="answer-reviewed">Last reviewed: ${date}</p>
  </div>
</section>

</main>`;
  const mainAva = `<main>
<section class="pr-hero">
  <div class="g-wrap">
    <h1>${q}</h1>
    <p class="pr-sub">${esc(b.meta)}</p>
  </div>
</section>

<section class="pr-sec ans">
  <div class="g-wrap">
    <div class="ans-body">
${bodyAva.replace(/^/gm, '  ')}
    </div>
    <h2>Questions</h2>
    <div class="ans-faq">
${faqAva.replace(/^/gm, '  ')}
    </div>
    <p class="ans-cta">${esc(b.cta)}</p>
    <p class="ans-links"><a href="${site.pricing}" data-event="pricing_link_answer">See pricing</a></p>
    <a class="cx-btn cx-btn--go" href="${site.book.href}" data-event="book_click_answer">${site.book.label}</a>
    <p class="ans-reviewed">Last reviewed: ${date}</p>
  </div>
</section>
</main>`;
  const graph = [
    shell.org, shell.web,
    { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: b.question, description: b.meta, isPartOf: { '@id': shell.web['@id'] }, inLanguage: 'en-US' },
    { '@type': 'FAQPage', '@id': `${url}#faq`, mainEntity: b.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    crumbList([['Home', `https://${site.host}/`], ['Answers', `https://${site.host}/answers/`], [b.question, url]]),
  ];
  const html = render(site, shell, { title: b.title, desc: b.meta, url, mainAic, mainAva, graph, trail: [['Answers', '/answers/'], [q, null]] });
  return { url, html, claims: [b.question, b.meta, ...b.faq.flatMap((f) => [f.q, f.a]), 'Answers'] };
}

// The answers index: every built answer on the host, newest first.
function readAnswer(file) {
  const s = readText(file);
  const h1 = (s.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, ''])[1].trim();
  const sub = (s.match(/<p class="(?:page-sub|pr-sub)">([\s\S]*?)<\/p>/) || [, ''])[1].trim();
  const date = (s.match(/Last reviewed: (\d{4}-\d{2}-\d{2})/) || [, '0000-00-00'])[1];
  return { h1, sub, date };
}

function indexPage(site, shell, entries) {
  const url = `https://${site.host}/answers/`;
  const title = `Answers — ${site.brand}`;
  // the description is the questions themselves (newest first), never new words
  let desc = '';
  for (const e of entries) { const next = desc ? `${desc} ${decode(e.h1)}` : decode(e.h1); if ([...next].length > 155) break; desc = next; }
  const itemsAic = entries.map((e) => `      <li><a href="/answers/${e.slug}/">${e.h1}</a><p>${e.sub}</p></li>`).join('\n');
  const itemsAva = entries.map((e) => `      <li><a href="/answers/${e.slug}/">${e.h1}</a><p>${e.sub}</p></li>`).join('\n');
  const mainAic = `<main id="main">

<section class="phead" data-lit="bright" data-rail-after>
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb">
      <ol>
        <li><a href="/">Home</a></li>
        <li aria-current="page">Answers</li>
      </ol>
    </nav>
    <h1 class="page-h">Straight answers</h1>
  </div>
</section>

<section id="answers" data-lit="flat">
  <div class="wrap">
    <ul class="answer-index">
${itemsAic}
    </ul>
  </div>
</section>

</main>`;
  const mainAva = `<main>
<section class="pr-hero">
  <div class="g-wrap">
    <h1>Straight answers</h1>
  </div>
</section>

<section class="pr-sec ans">
  <div class="g-wrap">
    <ul class="ans-index">
${itemsAva}
    </ul>
  </div>
</section>
</main>`;
  const graph = [
    shell.org, shell.web,
    { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: 'Straight answers', isPartOf: { '@id': shell.web['@id'] }, inLanguage: 'en-US' },
    crumbList([['Home', `https://${site.host}/`], ['Answers', url]]),
  ];
  return { url, html: render(site, shell, { title, desc: desc || null, url, mainAic, mainAva, graph, trail: [['Answers', null]] }) };
}

// ---------------------------------------------------------------- checks ----
function truthCheck(html, claims) {
  const text = visible(html);
  return claims.filter((c) => !text.includes(fold(decode(esc(c))))).map((c) => `NOT-VERBATIM schema string: "${c.slice(0, 60)}"`);
}

function validateJsonld(absFile) {
  const r = spawnSync('python', ['tools/validate_jsonld.py', '--page', absFile], { cwd: ROOT, encoding: 'utf8' });
  const out = (r.stdout || '') + (r.stderr || '');
  const m = out.match(/(\d+) pages validated against schema\.org, (\d+) errors/);
  return { ok: r.status === 0 && m && m[2] === '0', summary: m ? m[0] : out.trim().split('\n').pop(), detail: out };
}

// ---------------------------------------------------------------- list edits
function addSitemap(xml, loc, date) {
  if (xml.includes(`<loc>${loc}</loc>`)) return null;
  const eol = xml.includes('\r\n') ? '\r\n' : '\n';
  const entry = ['  <url>', `    <loc>${loc}</loc>`, `    <lastmod>${date}T00:00:00-05:00</lastmod>`,
    '    <changefreq>monthly</changefreq>', '    <priority>0.7</priority>', '  </url>', ''].join(eol);
  if (xml.split('</urlset>').length !== 2) throw new Error('sitemap: expected one </urlset>');
  return xml.replace('</urlset>', () => entry + '</urlset>');
}

function addLlms(txt, url, question, meta) {
  if (txt.includes(`](${url})`)) return null;
  const eol = txt.includes('\r\n') ? '\r\n' : '\n';
  const line = `- [${question}](${url}): ${meta}`;
  const lines = txt.replace(/\r\n/g, '\n').split('\n');
  const h = lines.findIndex((l) => l.trim() === '## Answers');
  if (h === -1) {
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    lines.push('', '## Answers', '', line, '');
  } else {
    let end = h + 1;
    while (end < lines.length && !/^#{1,2} /.test(lines[end])) end++;
    let last = end - 1;
    while (last > h && !lines[last].trim()) last--;
    lines.splice(last + 1, 0, ...(last === h ? ['', line] : [line]));
  }
  return lines.join(eol === '\r\n' ? '\r\n' : '\n');
}

// ---------------------------------------------------------------- build -----
async function isLive(url, h1) {
  try {
    const r = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'aivoiceagency-brick/1.0' } });
    return r.status === 200 && (await r.text()).includes(h1);
  } catch { return false; }
}

async function buildOne(siteKey, file, ctx) {
  const site = SITES[siteKey];
  const label = `${siteKey} ${rel(file)}`;
  const b = parseBrick(readFileSync(file, 'utf8'), site);
  if (b.errs.length) { console.log(`FAIL  ${label}  (${b.bodyWords} words)\n${b.errs.map((e) => '      - ' + e).join('\n')}`); return { ok: false, label, words: b.bodyWords, errs: b.errs }; }

  const shell = ctx.shell(site);
  const target = path.join(ROOT, site.dir, 'answers', b.slug, 'index.html');
  const outFile = DRY ? path.join(ctx.tmp, site.dir, 'answers', b.slug, 'index.html') : target;

  let date = today();
  let existing = null;
  if (existsSync(target)) {
    existing = readText(target);
    const old = readAnswer(target);
    if (fold(decode(old.h1)) !== fold(b.question)) {
      const e = `slug /answers/${b.slug}/ already belongs to "${decode(old.h1)}"`;
      console.log(`FAIL  ${label}\n      - ${e}`);
      return { ok: false, label, words: b.bodyWords, errs: [e] };
    }
    date = old.date; // unchanged words keep their date (idempotent)
  }
  let page = answerPage(site, shell, b, date);
  if (existing && page.html !== existing) page = answerPage(site, shell, b, (date = today()));

  const errs = truthCheck(page.html, page.claims);
  mkdirSync(path.dirname(outFile), { recursive: true });
  const probe = DRY ? outFile : path.join(ctx.tmp, 'probe', site.dir, 'answers', b.slug, 'index.html');
  mkdirSync(path.dirname(probe), { recursive: true });
  writeFileSync(probe, page.html);
  const v = validateJsonld(probe);
  if (!v.ok) errs.push(`validate_jsonld: ${v.summary}\n${v.detail}`);
  if (errs.length) { console.log(`FAIL  ${label}  (${b.bodyWords} words)\n${errs.map((e) => '      - ' + e).join('\n')}`); return { ok: false, label, words: b.bodyWords, errs }; }

  const changes = [];
  if (!DRY) {
    if (page.html !== existing) { writeFileSync(target, page.html); changes.push(`wrote ${rel(target)}`); }
  } else {
    changes.push(`would write ${rel(target)}${existing ? (page.html === existing ? ' (unchanged)' : ' (update)') : ' (new)'}`);
  }
  ctx.touched.add(siteKey);
  ctx.newUrls.push({ url: page.url, h1: b.question, site: siteKey });

  // sitemap + llms.txt (in the temp mirror on --dry)
  for (const [kind, relPath, fn] of [
    ['sitemap', site.sitemap, (t) => addSitemap(t, page.url, date)],
    ['llms.txt', site.llms, (t) => addLlms(t, page.url, b.question, b.meta)],
  ]) {
    const cur = ctx.read(relPath);
    const next = fn(cur);
    if (next == null) { changes.push(`${kind}: already lists ${page.url}`); continue; }
    ctx.write(relPath, next, cur);
    changes.push(`${DRY ? 'would add' : 'added'} ${page.url} to ${relPath}`);
  }

  // move the brick out of the inbox
  const inbox = path.join(ROOT, 'bricks', 'inbox', siteKey) + path.sep;
  const built = path.join(ROOT, 'bricks', 'built', siteKey, `${b.slug}.txt`);
  if (path.resolve(file).startsWith(inbox)) {
    if (DRY) changes.push(`would git mv ${rel(file)} -> ${rel(built)}`);
    else {
      mkdirSync(path.dirname(built), { recursive: true });
      try { execFileSync('git', ['ls-files', '--error-unmatch', rel(file)], { cwd: ROOT, stdio: 'ignore' }); }
      catch { execFileSync('git', ['add', '--', rel(file)], { cwd: ROOT }); }
      execFileSync('git', ['mv', '--', rel(file), rel(built)], { cwd: ROOT });
      changes.push(`git mv ${rel(file)} -> ${rel(built)}`);
    }
  }
  console.log(`PASS  ${label}  (${b.bodyWords} words · ${v.summary})\n${changes.map((c) => '      ' + c).join('\n')}`);
  return { ok: true, label, words: b.bodyWords, url: page.url };
}

function rebuildIndex(siteKey, ctx) {
  const site = SITES[siteKey];
  const dir = path.join(DRY ? ctx.tmp : ROOT, site.dir, 'answers');
  const realDir = path.join(ROOT, site.dir, 'answers');
  const slugs = new Set();
  for (const d of [realDir, dir]) if (existsSync(d)) for (const n of readdirSync(d, { withFileTypes: true })) if (n.isDirectory() && n.name !== 'probe') slugs.add(n.name);
  const entries = [...slugs].map((slug) => {
    const f = [path.join(dir, slug, 'index.html'), path.join(realDir, slug, 'index.html')].find((p) => existsSync(p));
    return f ? { slug, ...readAnswer(f) } : null;
  }).filter(Boolean).sort((a, b) => (a.date === b.date ? a.slug.localeCompare(b.slug) : b.date.localeCompare(a.date)));
  if (!entries.length) return;
  const shell = ctx.shell(site);
  const idx = indexPage(site, shell, entries);
  const target = path.join(realDir, 'index.html');
  const out = path.join(dir, 'index.html');
  const v = (() => { const probe = path.join(ctx.tmp, 'probe-index', site.dir, 'answers', 'index.html'); mkdirSync(path.dirname(probe), { recursive: true }); writeFileSync(probe, idx.html); return validateJsonld(probe); })();
  if (!v.ok) { console.log(`FAIL  ${site.host}/answers/ index\n      - validate_jsonld: ${v.summary}`); ctx.failed = true; return; }
  const existing = existsSync(target) ? readText(target) : null;
  if (DRY) { mkdirSync(path.dirname(out), { recursive: true }); writeFileSync(out, idx.html); }
  else if (idx.html !== existing) writeFileSync(target, idx.html);
  const sm = ctx.read(site.sitemap);
  const smNext = addSitemap(sm, idx.url, today());
  if (smNext != null) ctx.write(site.sitemap, smNext, sm);
  console.log(`INDEX ${site.host}/answers/  ${entries.length} answer(s), newest first · ${v.summary} · ${DRY ? 'would write' : idx.html === existing ? 'unchanged' : 'wrote'} ${rel(target)}${smNext != null ? ` · ${DRY ? 'would add' : 'added'} it to ${site.sitemap}` : ''}`);
}

// ---------------------------------------------------------------- main ------
async function main() {
  if (!ALL && !(SITE && FILE)) {
    console.error('usage: node scripts/brick.mjs --site aic|ava --file <brick.txt> [--dry]\n       node scripts/brick.mjs --all [--dry]');
    process.exit(2);
  }
  if (SITE && !SITES[SITE]) { console.error(`--site must be aic or ava, not "${SITE}"`); process.exit(2); }

  const tmp = mkdtempSync(path.join(os.tmpdir(), 'brick-'));
  const shells = {};
  const mirror = new Map(); // relPath -> text, for --dry list edits
  const ctx = {
    tmp, touched: new Set(), newUrls: [], failed: false,
    shell: (site) => (shells[site.key] ||= shellParts(site)),
    read: (p) => (mirror.has(p) ? mirror.get(p) : readFileSync(path.join(ROOT, p), 'utf8')),
    write: (p, text, like) => { mirror.set(p, text); if (!DRY) writeKeepEol(path.join(ROOT, p), text.replace(/\r\n/g, '\n'), like); },
  };

  const jobs = [];
  if (ALL) {
    for (const k of Object.keys(SITES)) {
      const d = path.join(ROOT, 'bricks', 'inbox', k);
      if (!existsSync(d)) continue;
      for (const n of readdirSync(d).filter((x) => x.endsWith('.txt')).sort()) jobs.push([k, path.join(d, n)]);
    }
  } else jobs.push([SITE, path.resolve(FILE)]);

  console.log(`brick press · ${DRY ? 'DRY RUN (repo untouched) · temp ' + tmp : 'BUILD'} · ${jobs.length} brick(s)`);
  if (!jobs.length) { console.log('nothing in bricks/inbox/aic or bricks/inbox/ava'); return; }

  const results = [];
  for (const [k, f] of jobs) results.push(await buildOne(k, f, ctx));
  for (const k of ctx.touched) rebuildIndex(k, ctx);

  // IndexNow: live URLs now; the rest ride the production deploy hook.
  const pass = results.filter((r) => r.ok);
  if (pass.length) {
    const urls = [...ctx.newUrls.map((u) => u.url), ...[...ctx.touched].map((k) => `https://${SITES[k].host}/answers/`)];
    if (DRY) console.log(`IndexNow: would ping ${urls.length} URL(s) once live (deploy hook, or: node scripts/indexnow-ping.mjs --urls=${urls.join(',')})`);
    else {
      const live = [];
      for (const u of ctx.newUrls) if (await isLive(u.url, u.h1)) live.push(u.url);
      if (live.length) spawnSync('node', ['scripts/indexnow-ping.mjs', `--urls=${live.join(',')}`], { cwd: ROOT, stdio: 'inherit' });
      const pending = urls.filter((u) => !live.includes(u));
      if (pending.length) console.log(`IndexNow: ${pending.length} URL(s) not live yet. The production deploy hook pings the sitemaps when this push deploys; by hand: node scripts/indexnow-ping.mjs --urls=${pending.join(',')}`);
    }
  }
  const failed = results.length - pass.length;
  console.log(`\n${pass.length}/${results.length} brick(s) passed${failed ? `, ${failed} failed` : ''}${DRY ? ' · dry run: nothing was written in the repo' : ''}`);
  // exitCode, not exit(): on Windows, process.exit() while fetch sockets are
  // still closing aborts Node with a libuv assertion (exit 127).
  process.exitCode = failed || ctx.failed ? 1 : 0;
}

main().catch((e) => { console.error(e.stack || String(e)); process.exitCode = 1; });
