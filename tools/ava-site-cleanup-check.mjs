const EXPLICIT_PATHS = [
  '/',
  '/book/',
  '/lsa/',
  '/overview.html',
  '/pricing/',
  '/watch/',
  '/backstage/',
  '/booked/',
  '/deck/',
  '/live/',
  '/staging/xray.html',
  '/templates/lander-master.html',
  '/ai100x/cockpit/',
  '/chatgpt-example/',
  '/cockpit/',
  '/legacy/index-funnel-v2-2026-07-14.html',
  '/legacy/index-legacy-2026-07-07.html',
  '/templates/city.html',
  '/templates/vertical.html',
  '/work/emails/receipt.html',
  '/answers/',
  '/answers/does-it-work-with-my-scheduling-software/',
];

const FETCH_TIMEOUT_MS = 20_000;
const MAX_CONCURRENCY = 8;
const RETIRED_STAMPS = new Set(['42f3d1c', 'd7c20e7']);

function usage() {
  console.error('Usage: node tools/ava-site-cleanup-check.mjs <base-url>');
  process.exit(2);
}

function publicUrl(url) {
  return `${url.pathname}${url.search}` || '/';
}

function firstParty(url, baseUrl) {
  const hostname = (value) => value.hostname.toLowerCase().replace(/^www\./, '');
  return /^https?:$/.test(url.protocol) && hostname(url) === hostname(baseUrl);
}

async function fetchText(url) {
  let response;
  try {
    response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { 'user-agent': 'AVA-site-cleanup-check/1.0' },
    });
  } catch (error) {
    const kind = error?.name === 'TimeoutError' ? 'timeout' : 'request failed';
    return { ok: false, error: `${publicUrl(url)} (${kind})` };
  }

  if (!response.ok) {
    return { ok: false, error: `${publicUrl(url)} (HTTP ${response.status})` };
  }

  return { ok: true, text: await response.text(), url: new URL(response.url) };
}

function extractSitemapUrls(xml, baseUrl) {
  const urls = [];
  for (const match of xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)) {
    try {
      const url = new URL(match[1].replace(/&amp;/g, '&'), baseUrl);
      if (firstParty(url, baseUrl) && !/\.xml$/i.test(url.pathname)) urls.push(url);
    } catch {
      // Invalid sitemap entries are reported through the incomplete sitemap scan below.
    }
  }
  return urls;
}

function pageKey(url) {
  return `${url.pathname}${url.search}`;
}

async function mapLimit(values, limit, worker) {
  const results = new Array(values.length);
  let next = 0;

  async function run() {
    while (next < values.length) {
      const index = next++;
      results[index] = await worker(values[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, run));
  return results;
}

function attribute(tag, name) {
  const quoted = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  if (quoted) return quoted[2];
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*([^\\s>]+)`, 'i'))?.[1] ?? null;
}

function extractLinkedAssets(html, pageUrl, baseUrl) {
  const assets = [];
  for (const tagMatch of html.matchAll(/<(?:link|script)\b[^>]*>/gi)) {
    const tag = tagMatch[0];
    const raw = /^<script\b/i.test(tag) ? attribute(tag, 'src') : attribute(tag, 'href');
    if (!raw || /^(?:data|javascript):/i.test(raw)) continue;

    try {
      const url = new URL(raw, pageUrl);
      if (!firstParty(url, baseUrl) || !/\.(?:css|js)$/i.test(url.pathname)) continue;
      assets.push(url);
    } catch {
      // A malformed public asset URL is not a usable first-party CSS/JS link.
    }
  }
  return assets;
}

function decodeHtml(value) {
  return value
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
    .replace(/&#x([\da-f]+);/gi, (_, number) => String.fromCodePoint(parseInt(number, 16)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function htmlToPublicText(html) {
  const metadata = [];
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const content = attribute(match[0], 'content');
    if (content) metadata.push(content);
  }

  const bodyText = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(?:script|style|noscript|template)\b[^>]*>[\s\S]*?<\/(?:script|style|noscript|template)>/gi, ' ')
    .replace(/<\/(?:address|article|aside|blockquote|div|footer|h[1-6]|header|li|main|nav|ol|p|section|table|td|th|tr|ul)>/gi, '. ')
    .replace(/<[^>]+>/g, ' ');

  return decodeHtml(`${metadata.join('. ')}. ${bodyText}`).replace(/\s+/g, ' ').trim();
}

function uniqueMatches(text, regex, capture = 0) {
  const values = [];
  for (const match of text.matchAll(regex)) {
    const value = match[capture];
    if (value && !values.includes(value)) values.push(value);
  }
  return values;
}

function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, ' ');
}

function cssRules(css) {
  const rules = [];
  const clean = stripCssComments(css);
  for (const match of clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = match[1].trim();
    if (!selector.startsWith('@')) rules.push({ selector, body: match[2] });
  }
  return rules;
}

function normalizeSelector(selector) {
  return selector.replace(/\s+/g, ' ').replace(/\s*([>+~])\s*/g, '$1').trim().toLowerCase();
}

function rulesEndingWith(css, target) {
  const wanted = normalizeSelector(target);
  return cssRules(css).filter(({ selector }) =>
    selector.split(',').some((part) => normalizeSelector(part).endsWith(wanted)),
  );
}

function rulesExactly(css, target) {
  const wanted = normalizeSelector(target);
  return cssRules(css).filter(({ selector }) =>
    selector.split(',').some((part) => normalizeSelector(part) === wanted),
  );
}

function animationRulesFor(css, target) {
  const wanted = normalizeSelector(target);
  const endings = [wanted, `${wanted}::before`, `${wanted}::after`];
  return cssRules(css).filter(({ selector }) =>
    selector.split(',').some((part) => {
      const normalized = normalizeSelector(part);
      return endings.some((ending) => normalized === ending || normalized.endsWith(` ${ending}`));
    }),
  );
}

function reducedMotionCss(css) {
  const blocks = [];
  const pattern = /@media\s*\([^)]*prefers-reduced-motion\s*:\s*reduce[^)]*\)\s*\{/gi;
  let match;
  while ((match = pattern.exec(css)) !== null) {
    const open = pattern.lastIndex - 1;
    let depth = 1;
    let cursor = open + 1;
    while (cursor < css.length && depth > 0) {
      if (css[cursor] === '{') depth += 1;
      if (css[cursor] === '}') depth -= 1;
      cursor += 1;
    }
    if (depth === 0) blocks.push(css.slice(open + 1, cursor - 1));
  }
  return blocks.join('\n');
}

function animationEvidence(css, selector) {
  const candidates = animationRulesFor(css, selector);
  for (const rule of candidates) {
    const declarations = [...rule.body.matchAll(/animation(?:-duration)?\s*:\s*([^;}]*)/gi)];
    for (const declaration of declarations) {
      if (/\bnone\b/i.test(declaration[1])) continue;
      const duration = declaration[1].match(/(?:^|\s)(\d*\.?\d+)s\b/i);
      if (duration) return { selector: rule.selector, seconds: Number(duration[1]) };
    }
  }
  return null;
}

function reducedMotionDisables(css, selector) {
  const reduced = reducedMotionCss(css);
  return animationRulesFor(reduced, selector).some(({ body }) =>
    /animation(?:-name)?\s*:\s*none\b/i.test(body),
  );
}

function extractStyleText(html) {
  return [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((match) => match[1]).join('\n');
}

function result(id, passText, failText, failures, evidence = []) {
  return {
    id,
    pass: failures.length === 0,
    summary: failures.length === 0 ? passText : `${failText} (${failures.length})`,
    details: failures.length === 0 ? evidence : failures,
  };
}

async function main() {
  if (process.argv.length !== 3) usage();

  let baseUrl;
  try {
    baseUrl = new URL(process.argv[2]);
  } catch {
    usage();
  }
  if (!/^https?:$/.test(baseUrl.protocol)) usage();
  if (!baseUrl.pathname.endsWith('/')) baseUrl.pathname += '/';

  const sitemapUrl = new URL('sitemap.xml', baseUrl);
  const sitemap = await fetchText(sitemapUrl);
  const scanErrors = [];
  const urls = new Map();

  if (!sitemap.ok) {
    scanErrors.push(`sitemap scan incomplete: ${sitemap.error}`);
  } else {
    for (const url of extractSitemapUrls(sitemap.text, baseUrl)) urls.set(pageKey(url), url);
  }
  for (const path of EXPLICIT_PATHS) {
    const url = new URL(path, baseUrl);
    urls.set(pageKey(url), url);
  }

  const pageEntries = await mapLimit([...urls.values()], MAX_CONCURRENCY, async (url) => {
    const fetched = await fetchText(url);
    return { requestedUrl: url, fetched };
  });

  const pages = new Map();
  for (const { requestedUrl, fetched } of pageEntries) {
    if (!fetched.ok) {
      scanErrors.push(`page scan incomplete: ${fetched.error}`);
      continue;
    }
    pages.set(pageKey(requestedUrl), { url: fetched.url, html: fetched.text });
  }

  const d1Failures = [...scanErrors];
  const d2Failures = [...scanErrors];
  const d7Failures = [...scanErrors];

  for (const [path, page] of pages) {
    const starterMatches = uniqueMatches(page.html, /Starter is month-to-month\./gi);
    for (const phrase of starterMatches) d1Failures.push(`${path}: "${phrase}"`);

    const text = htmlToPublicText(page.html);
    const durationMatches = [
      ...uniqueMatches(text, /\b15\s+minutes\b/gi),
      ...uniqueMatches(text, /\b15[\s-]+minute\b/gi),
      ...uniqueMatches(text, /\bfifteen-minute\b/gi),
      ...uniqueMatches(text, /(?:^|[.!?]\s+)\s*(Fifteen minutes)\b/g, 1),
    ].filter((value, index, all) => all.indexOf(value) === index);
    for (const phrase of durationMatches) d2Failures.push(`${path}: "${phrase}"`);

    const seenAssets = new Set();
    for (const asset of extractLinkedAssets(page.html, page.url, baseUrl)) {
      const assetPath = publicUrl(asset);
      if (seenAssets.has(assetPath)) continue;
      seenAssets.add(assetPath);
      const stamp = asset.searchParams.get('v')?.trim() ?? '';
      if (!stamp) {
        d7Failures.push(`${path} -> ${assetPath}`);
      } else if (RETIRED_STAMPS.has(stamp)) {
        d7Failures.push(`${path} -> ${assetPath} uses retired stamp ${stamp}`);
      }
    }
  }

  const d3Failures = [];
  const d3Evidence = [];
  const homepage = pages.get('/');
  let bridgeCss = null;
  let bridgeUrl = null;

  if (!homepage) {
    d3Failures.push('/: homepage unavailable');
  } else {
    bridgeUrl = extractLinkedAssets(homepage.html, homepage.url, baseUrl)
      .find((url) => url.pathname === '/assets/bridge.css') ?? null;
    if (!bridgeUrl) {
      d3Failures.push('/: linked /assets/bridge.css not found');
    } else {
      const fetched = await fetchText(bridgeUrl);
      if (!fetched.ok) {
        d3Failures.push(`/assets/bridge.css unavailable: ${fetched.error}`);
      } else {
        bridgeCss = fetched.text;
        const breathing = animationEvidence(bridgeCss, '.bdot');
        if (!breathing) {
          d3Failures.push('/assets/bridge.css .bdot: breathing animation duration not found');
        } else if (breathing.seconds < 1.7 || breathing.seconds > 2.3) {
          d3Failures.push(`/assets/bridge.css ${breathing.selector}: ${breathing.seconds}s is outside 1.7s-2.3s`);
        } else {
          d3Evidence.push(`/assets/bridge.css ${breathing.selector}: ${breathing.seconds}s`);
        }
        if (!reducedMotionDisables(bridgeCss, '.bdot')) {
          d3Failures.push('/assets/bridge.css .bdot: reduced-motion animation:none not found');
        } else {
          d3Evidence.push('/assets/bridge.css .bdot: reduced-motion animation:none');
        }
      }
    }
  }

  const livePage = pages.get('/live/');
  if (!livePage) {
    d3Failures.push('/live/: page unavailable');
  } else {
    const liveCss = extractStyleText(livePage.html);
    const breathing = animationEvidence(liveCss, '.ldot');
    if (!breathing) {
      d3Failures.push('/live/ .ldot: breathing animation duration not found');
    } else if (breathing.seconds < 1.7 || breathing.seconds > 2.3) {
      d3Failures.push(`/live/ ${breathing.selector}: ${breathing.seconds}s is outside 1.7s-2.3s`);
    } else {
      d3Evidence.push(`/live/ ${breathing.selector}: ${breathing.seconds}s`);
    }
    if (!reducedMotionDisables(liveCss, '.ldot')) {
      d3Failures.push('/live/ .ldot: reduced-motion animation:none not found');
    } else {
      d3Evidence.push('/live/ .ldot: reduced-motion animation:none');
    }
  }

  const d4Failures = [];
  const d4Evidence = [];
  const cssSources = new Map();
  if (bridgeCss !== null) cssSources.set('/assets/bridge.css', bridgeCss);

  const directCssPaths = [
    '/assets/circulant.css',
    '/assets/guide.css',
    '/styles.css',
    '/css/backstage.css',
    '/css/calls.css',
    '/css/feed.css',
    '/css/demo-pill.css',
    '/deck/styles.css',
  ];
  await Promise.all(directCssPaths.map(async (path) => {
    const fetched = await fetchText(new URL(path, baseUrl));
    if (!fetched.ok) d4Failures.push(`${path}: source unavailable`);
    else cssSources.set(path, fetched.text);
  }));

  const lsaPage = pages.get('/lsa/');
  const bookedPage = pages.get('/booked/');
  if (!lsaPage) d4Failures.push('/lsa/: source unavailable');
  else cssSources.set('/lsa/', extractStyleText(lsaPage.html));
  if (!bookedPage) d4Failures.push('/booked/: source unavailable');
  else cssSources.set('/booked/', extractStyleText(bookedPage.html));

  const centralPaths = ['/assets/bridge.css', '/assets/circulant.css'];
  const definitionEvidence = [];
  for (const path of centralPaths) {
    const css = cssSources.get(path);
    if (!css) continue;
    for (const rule of cssRules(css)) {
      if (/--status-booked\s*:\s*[^;}{]+/i.test(rule.body)) {
        definitionEvidence.push(`${path} ${rule.selector}`);
      }
    }
  }
  if (definitionEvidence.length === 0) {
    d4Failures.push('/assets/bridge.css or /assets/circulant.css: --status-booked definition/alias missing');
  } else {
    d4Evidence.push(...definitionEvidence.map((item) => `${item}: --status-booked`));
  }

  const bookedSelectors = new Map([
    ['/css/backstage.css', ['.bs-chip.ok', '.bs-result-line b', '.bs-cchip.ok', '.bs-card.final', '.bs-card.final .bs-cname', '.bs-card.final .bs-cpay', '.bs-strip-r b', '.bs-strip-check', '.bs-pr']],
    ['/css/calls.css', ['.cx-chap.booked.on', '.cx-chap.booked.on::before', '.cx-booked.on', '.cx-booked.on .cx-blab']],
    ['/css/feed.css', ['.fd-chip', '.fd-phase[data-phase="output"].is-done', '.fd-phase[data-phase="output"].is-done .fd-ph-eyebrow', '.fd-outcome b']],
    ['/css/demo-pill.css', ['.dp-pill--booked .dp-orbs i:nth-child(4)', '.dp-result--booked b', 'html[data-theme="light"] .dp-result--booked b']],
    ['/lsa/', ['.t-book', '.t-book .bar .dot', '.t-book .bar span:first-child', '.grade-book']],
    ['/deck/styles.css', ['.chip-booked', '.ba-cal span.f']],
    ['/booked/', ['.bk-check']],
  ]);
  const legacyBookedPaint = /var\(\s*--(?:green|live-green|live-green-bright|good|good-soft)\s*\)|#(?:2ee6a8|077a50|9bf3d6|22e6a4)\b|rgba?\(\s*(?:46\s*,\s*230\s*,\s*168|34\s*,\s*230\s*,\s*164)/i;

  for (const [path, selectors] of bookedSelectors) {
    const css = cssSources.get(path);
    if (!css) continue;
    for (const selector of selectors) {
      const matches = rulesExactly(css, selector);
      if (matches.length === 0) {
        d4Failures.push(`${path} ${selector}: selector not found`);
        continue;
      }
      for (const match of matches) {
        if (!/var\(\s*--status-booked\s*\)/i.test(match.body)) {
          d4Failures.push(`${path} ${match.selector}: --status-booked not used`);
        } else if (legacyBookedPaint.test(match.body)) {
          d4Failures.push(`${path} ${match.selector}: noncanonical BOOKED paint remains`);
        } else {
          d4Evidence.push(`${path} ${match.selector}: var(--status-booked)`);
        }
      }
    }
  }

  const nonBookedSelectors = new Map([
    ['/css/demo-pill.css', ['.dp-orbs i:nth-child(4)', '.dp-result b', 'html[data-theme="light"] .dp-result b']],
    ['/css/calls.css', ['.cx-booked.resolved', '.cx-booked.resolved .cx-blab']],
    ['/deck/styles.css', ['.chip-ok']],
  ]);
  for (const [path, selectors] of nonBookedSelectors) {
    const css = cssSources.get(path);
    if (!css) continue;
    for (const selector of selectors) {
      const matches = rulesExactly(css, selector);
      if (matches.length === 0) {
        d4Failures.push(`${path} ${selector}: selector not found`);
        continue;
      }
      for (const match of matches) {
        if (/var\(\s*--status-booked\s*\)/i.test(match.body) || legacyBookedPaint.test(match.body)) {
          d4Failures.push(`${path} ${match.selector}: non-BOOKED state uses green paint`);
        } else if (!/var\(\s*--cyan\s*\)/i.test(match.body)) {
          d4Failures.push(`${path} ${match.selector}: non-BOOKED state does not use cyan`);
        } else {
          d4Evidence.push(`${path} ${match.selector}: var(--cyan)`);
        }
      }
    }
  }

  const results = [
    result('D1', 'no fetched HTML contains the retired Starter phrase', 'retired Starter phrase found or scan incomplete', d1Failures),
    result('D2', 'no Discovery Call/setup-call 15-minute wording found', 'Discovery Call/setup-call duration violation or scan incomplete', d2Failures),
    result('D3', 'homepage .bdot and /live/ .ldot breathe about every 2 seconds and stop for reduced motion', 'header-dot motion violation', d3Failures, d3Evidence),
    result('D4', 'all known BOOKED paint uses the canonical --status-booked property', 'BOOKED status token violation', d4Failures, d4Evidence),
    result('D7', 'all first-party CSS/JS links on fetched HTML have new non-empty ?v= stamps', 'unstamped or retired first-party CSS/JS pair or scan incomplete', d7Failures),
  ];

  for (const check of results) console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.id} ${check.summary}`);
  for (const check of results) {
    for (const detail of check.details) console.log(`  ${check.id} ${detail}`);
  }

  process.exitCode = results.every((check) => check.pass) ? 0 : 1;
}

await main();
