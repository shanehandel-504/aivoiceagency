#!/usr/bin/env node
// ============================================================================
// indexnow-ping.mjs — INDEX VELOCITY RIG · Aug 7 2026
// ----------------------------------------------------------------------------
// Submits a host's full sitemap URL list to IndexNow, which fans the ping out
// to Bing, Yandex, Seznam, Naver and IndexNow's other participants in one POST.
// Google is NOT an IndexNow participant — that lane is Leg B (Search Console
// API) and nothing in this file speaks to Google.
//
// Vanilla Node, zero npm deps. Requires Node 18+ for global fetch (built and
// run on v24.14.0).
//
// WHY THE KEY-FILE PRECHECK EXISTS
// IndexNow authenticates by fetching https://<host>/<key>.txt and comparing its
// body to the `key` field. If that file is missing, stale, or served by the
// wrong Vercel project, the API answers 403 — and a 403 here looks exactly like
// a transport failure to anyone reading a log. So the script fetches the key
// file itself first and refuses to POST unless the body matches byte-for-byte.
// A run that cannot prove the precondition fails loudly instead of reporting a
// status code that means something other than what it appears to mean.
//
// WHY THE SAME-HOST GUARD EXISTS
// aivoiceagency.ai and aichauffeur.ai are two brands served from ONE repo —
// the parent from the root, the chauffeur project rooted at /chauffeur/. Their
// sitemaps sit two directories apart. IndexNow rejects a payload whose urlList
// contains any URL outside `host` (422), and a cross-brand URL leaking into the
// wrong submission is a live risk of that layout, not a hypothetical. Every URL
// is checked against the host before anything is sent.
//
// USAGE
//   node scripts/indexnow-ping.mjs                  # every registered host
//   node scripts/indexnow-ping.mjs --host=aichauffeur.ai
//   node scripts/indexnow-ping.mjs --dry-run        # build + validate, no POST
//   node scripts/indexnow-ping.mjs --sitemap=./sitemap.xml --host=aivoiceagency.ai
//
// EXIT CODES  0 = every host accepted · 1 = any host failed or was rejected
// ============================================================================

const ENDPOINT = 'https://api.indexnow.org/indexnow';
const KEY = '7f6e54227b2f4a609ddf3040a7d86dfb';

// IndexNow caps a single submission at 10,000 URLs. Both hosts are far under
// that today; the chunking below is here so a future sitemap growing past the
// cap degrades into several valid requests instead of one silent rejection.
const MAX_URLS_PER_REQUEST = 10000;

// The key file is published at each host's own root. One key serves both hosts
// because IndexNow scopes ownership per-host via keyLocation, not per-key.
const HOSTS = [
  {
    host: 'aivoiceagency.ai',
    sitemap: 'https://aivoiceagency.ai/sitemap.xml',
    keyLocation: `https://aivoiceagency.ai/${KEY}.txt`,
  },
  {
    host: 'aichauffeur.ai',
    sitemap: 'https://aichauffeur.ai/sitemap.xml',
    keyLocation: `https://aichauffeur.ai/${KEY}.txt`,
  },
];

// ---------------------------------------------------------------------------
// args
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
const flag = (name) => {
  const hit = argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  const eq = hit.indexOf('=');
  return eq === -1 ? true : hit.slice(eq + 1);
};

const ONLY_HOST = flag('host');
const DRY_RUN = flag('dry-run') === true;
const SITEMAP_OVERRIDE = flag('sitemap');
const SKIP_VERIFY = flag('no-verify') === true;

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

// Sitemaps are authored by hand here, so <loc> may carry escaped entities.
// Decoding is required before the same-host check: an un-decoded &amp; would
// not change the hostname, but a numeric-escaped one could, and the guard is
// only worth having if it reads the real value.
function decodeEntities(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, '&'); // last, so &amp;lt; does not become <
}

function extractLocs(xml) {
  const out = [];
  // Tolerates attributes on <loc>, CDATA, and arbitrary internal whitespace.
  const re = /<loc\b[^>]*>([\s\S]*?)<\/loc>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    let raw = m[1].trim();
    const cdata = raw.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
    if (cdata) raw = cdata[1].trim();
    if (raw) out.push(decodeEntities(raw));
  }
  return out;
}

async function readSitemap(source) {
  if (/^https?:\/\//i.test(source)) {
    const res = await fetch(source, {
      headers: { 'User-Agent': 'aivoiceagency-indexnow-ping/1.0' },
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`sitemap fetch ${res.status} ${res.statusText} — ${source}`);
    return await res.text();
  }
  const { readFile } = await import('node:fs/promises');
  return await readFile(source, 'utf8');
}

// The precondition IndexNow will itself check. Doing it here turns an opaque
// 403 into a named cause before a single URL is submitted.
async function verifyKeyFile(keyLocation) {
  const res = await fetch(keyLocation, {
    headers: { 'User-Agent': 'aivoiceagency-indexnow-ping/1.0' },
    redirect: 'follow',
    cache: 'no-store',
  });
  if (!res.ok) {
    return { ok: false, reason: `key file HTTP ${res.status} at ${keyLocation}` };
  }
  const body = (await res.text()).trim();
  if (body !== KEY) {
    // Never print the served body — on a catch-all-rewrite misconfiguration it
    // is a full HTML page, and dumping it buries the actual finding.
    return { ok: false, reason: `key file body mismatch at ${keyLocation} (got ${body.length} chars, expected the 32-char key)` };
  }
  return { ok: true };
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// 200 = accepted. 202 = accepted, key validation still pending — a normal
// answer on a key's first ever use, and NOT a failure.
const isAccepted = (status) => status === 200 || status === 202;

function explain(status) {
  switch (status) {
    case 200: return 'OK — submitted';
    case 202: return 'Accepted — key validation pending (normal on first use)';
    case 400: return 'Bad request — malformed payload';
    case 403: return 'Forbidden — key file not valid for this host';
    case 422: return 'Unprocessable — a URL does not belong to this host, or key mismatch';
    case 429: return 'Too many requests — rate limited';
    default:  return 'Unexpected status';
  }
}

// ---------------------------------------------------------------------------
// per-host submission
// ---------------------------------------------------------------------------
async function submitHost(entry) {
  const { host, keyLocation } = entry;
  const sitemap = SITEMAP_OVERRIDE || entry.sitemap;

  console.log(`\n=== ${host} ===`);
  console.log(`sitemap      ${sitemap}`);
  console.log(`keyLocation  ${keyLocation}`);

  let urls;
  try {
    urls = extractLocs(await readSitemap(sitemap));
  } catch (err) {
    console.log(`STATUS       FAIL — ${err.message}`);
    return false;
  }

  if (urls.length === 0) {
    console.log('STATUS       FAIL — sitemap parsed to zero URLs');
    return false;
  }

  // Same-host guard. Anything outside `host` is dropped and named, never sent.
  const kept = [];
  const foreign = [];
  for (const u of urls) {
    let parsed;
    try { parsed = new URL(u); } catch { foreign.push(`${u} (unparseable)`); continue; }
    if (parsed.hostname === host) kept.push(parsed.toString());
    else foreign.push(u);
  }

  const deduped = [...new Set(kept)];
  console.log(`urls         ${deduped.length} in-host${deduped.length !== kept.length ? ` (${kept.length - deduped.length} duplicate dropped)` : ''}`);

  if (foreign.length) {
    console.log(`FOREIGN      ${foreign.length} URL(s) not on ${host} — dropped, NOT submitted:`);
    for (const f of foreign) console.log(`               ${f}`);
  }

  if (deduped.length === 0) {
    console.log('STATUS       FAIL — nothing left to submit after the same-host guard');
    return false;
  }

  if (!SKIP_VERIFY) {
    const check = await verifyKeyFile(keyLocation);
    if (!check.ok) {
      console.log(`STATUS       FAIL — ${check.reason}`);
      console.log('             Not submitting. IndexNow would answer 403 and the cause would be invisible.');
      return false;
    }
    console.log('keyfile      verified live, body matches');
  }

  if (DRY_RUN) {
    console.log('STATUS       DRY RUN — payload valid, nothing sent');
    return true;
  }

  let allOk = true;
  const batches = chunk(deduped, MAX_URLS_PER_REQUEST);
  for (const [i, batch] of batches.entries()) {
    const label = batches.length > 1 ? ` [batch ${i + 1}/${batches.length}]` : '';
    const payload = { host, key: KEY, keyLocation, urlList: batch };

    let res;
    try {
      res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'User-Agent': 'aivoiceagency-indexnow-ping/1.0',
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.log(`STATUS${label}       FAIL — network: ${err.message}`);
      allOk = false;
      continue;
    }

    const body = (await res.text()).trim();
    const ok = isAccepted(res.status);
    console.log(`STATUS${label}       ${res.status} ${res.statusText || ''} — ${explain(res.status)}`.replace(/\s+$/, ''));
    console.log(`submitted    ${batch.length} URL(s)`);
    if (body) console.log(`response     ${body.slice(0, 400)}`);
    if (!ok) allOk = false;
  }

  return allOk;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
const targets = ONLY_HOST ? HOSTS.filter((h) => h.host === ONLY_HOST) : HOSTS;

if (targets.length === 0) {
  console.error(`No registered host matches --host=${ONLY_HOST}`);
  console.error(`Registered: ${HOSTS.map((h) => h.host).join(', ')}`);
  process.exit(1);
}

console.log('INDEXNOW PING');
console.log(`endpoint     ${ENDPOINT}`);
console.log(`hosts        ${targets.map((h) => h.host).join(', ')}${DRY_RUN ? '  (DRY RUN)' : ''}`);

const results = [];
for (const t of targets) {
  // Sequential on purpose: one writer, one host at a time, so a rate-limit or a
  // rejection is attributable to a specific host instead of a race.
  results.push([t.host, await submitHost(t)]);
}

console.log('\n=== SUMMARY ===');
for (const [host, ok] of results) console.log(`${ok ? 'PASS' : 'FAIL'}  ${host}`);

process.exit(results.every(([, ok]) => ok) ? 0 : 1);
