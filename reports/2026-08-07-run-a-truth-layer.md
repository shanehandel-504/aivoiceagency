# RUN A — INVISIBLE TRUTH LAYER

**Date:** 2026-08-07 · **Commit:** `3b8d337` · **Hosts:** aivoiceagency.ai + aichauffeur.ai
**Scope:** `<head>` only. Zero visible wording, pricing, layout or copy changed.

---

## THE ONE-LINE VERSION

The structured data on both sites was telling search engines and answer engines
things the pages themselves never said. It now says only what the pages say —
and the machine that proves it runs on demand.

---

## WHAT SHIPPED

| # | Item | Live | Proof |
|---|---|---|---|
| 1 | Schema rebuilt on 76 pages, both hosts | ✅ | `truth_audit.py`: 567 defects → **0**, 79/79 pages clean |
| 2 | Zero `<body>` bytes changed | ✅ | `verify_head_only.py` vs the **staged index**: 76 files, **0 violations** |
| 3 | Organization + WebSite on every indexable page | ✅ | one `@id` per host; live nodes printed below |
| 4 | Service on every service/vertical surface | ✅ | built from each page's own `<h1>` + lede |
| 5 | Offer only where the price is printed as ours | ✅ | `/roi`'s `price: "0"` removed |
| 6 | BreadcrumbList only where a trail renders | ✅ | mirrored off the rendered `<nav>`; `/backstage`'s false one removed |
| 7 | No LocalBusiness · no Person · no founder · no per-minute rate | ✅ | live grep on 10 production pages: all zero |
| 8 | Self-canonical everywhere | ✅ | 0 missing, 0 duplicated on 79 indexable pages |
| 9 | Sitemaps accurate + complete, both hosts | ✅ | 60 + 16 URLs, all `lastmod 2026-08-07`, coverage checked **both ways** |
| 10 | robots.txt names every required agent, both hosts | ✅ | 7/7 present on each host, live |
| 11 | Vercel not challenging any answer engine | ✅ | 7 agents × 2 hosts, all 200 + full document |
| 12 | schema.org validation | ✅ | **0 errors** on 5 live pages per host |
| 13 | Lighthouse | ✅ | SEO **100** held on all six; A11Y / BP / CLS held exactly |

**Live:** https://aivoiceagency.ai/ · https://aichauffeur.ai/

---

## THE LAW THIS RUN ENFORCES

> Every claim-bearing schema string must be a verbatim substring of that page's
> own visible text. **Extract, never write.**

Anything that failed was **dropped**, never reworded. Where dropping left a real
entity with nothing to say, it was rebuilt from the page's own rendered heading
and lede — which are verbatim by construction.

---

## WHAT WAS ACTUALLY WRONG

**A founder's name in the markup of 48 pages.**
`Organization.founder → Person "Shane Handel"` on 45 pages, plus `author → Person`
on 3 blog posts. Gone. Articles are now authored by the Organization.

**330 schema strings that appeared nowhere on their own page.**
`serviceType`, `audience.audienceType`, Service descriptions, Offer descriptions —
copy written *for* schema. Also **6 FAQ answers that had drifted from the visible
Q&A they claim to mirror**, including two on the chauffeur homepage whose own
comment says the block is generated from the rendered copy so the two cannot
drift. They had drifted.

**A storefront claim from a business with no storefront.**
`chauffeur/madison-` and `milwaukee-limo-answering-service` declared
`@type: LocalBusiness`. The comment sitting directly above each one explained why
a fabricated street address would be a hard violation — and missed that
`LocalBusiness` *is itself* the claim that a place of business exists. Retyped to
`Service`; `areaServed` survives because it is true. Both comments were rewritten,
because a comment describing markup that no longer exists is the next run's trap.

**A free-price claim on /roi.**
`offers.price: "0"`. It survived a first-cut visibility check because the ROI
calculator renders **"$0" as its own default output** — "lost monthly revenue $0".
A number on the page for an entirely different reason. A price now requires a
price *context* (`$497`, `497/mo`, `497 flat`, `497 dollars`), not a matching
digit, and a zero price is refused outright.

**A breadcrumb for a trail that does not exist.**
`/backstage` carried a stamp.py-generated `BreadcrumbList` while rendering no
crumb nav at all.

**Breadcrumb labels that disagreed with the page.**
Schema said `West Bend Roofing`; the rendered trail says `Home / Wisconsin /
West Bend / Roofing`. All breadcrumbs are now read off the rendered `<nav>`.

---

## THE ENTITY SPINE

Both hosts now carry one `Organization` and one `WebSite`, with **one `@id` each**.

aichauffeur.ai previously had **two ids for the same entity** — `#org` / `#site`
on the homepage, `#organization` / `#website` on the legal pages. Unified, and the
nodes that referenced the old ids were remapped with it: renaming an `@id` without
remapping its referents produces a graph of orphans that validates clean and means
nothing. A `DANGLING-REF` check now fails the build on exactly that.

Served on production right now:

```json
{ "@type": "Organization", "@id": "https://aivoiceagency.ai/#organization",
  "name": "AI Voice Agency", "url": "https://aivoiceagency.ai/",
  "telephone": "+1-414-240-8930",
  "address": { "@type": "PostalAddress", "addressLocality": "Kewaskum",
               "addressRegion": "WI", "addressCountry": "US" },
  "sameAs": [ 6 profile URLs ] }
```

```json
{ "@type": "Organization", "@id": "https://aichauffeur.ai/#organization",
  "name": "AI Chauffeur", "url": "https://aichauffeur.ai/",
  "telephone": "+1-414-775-0019", "email": "dispatch@aichauffeur.ai",
  "address": { "@type": "PostalAddress", "addressRegion": "WI",
               "addressCountry": "US" } }
```

`parentOrganization → AI Voice Agency` is asserted **only** on the chauffeur pages
that actually print the parent's name. Elsewhere it was an unstated cross-brand
claim, and the two brands stay separate.

---

## THE ONE JUDGEMENT CALL, STATED OUT LOUD

The brief mandates the Organization's address and telephone **and** mandates that
every schema string be verbatim on the page. On a city page those collide:
"Kewaskum" is printed in the homepage foot band, not on `/madison-hvac`.

Resolved toward **identity**, on the law's own purpose clause — *"extract, never
write new **claims**."* A business address and phone number are identity facts
published on the live homepage, not marketing claims. Descriptions, service types,
audience types, area served, FAQ text and breadcrumb labels are claims, and they
are held to verbatim without exception.

**The carve-out is printed, not hidden.** `truth_audit.py` reports all 38 pages
that take it as `IDENTITY-FIELD` notes. A checker that conceals its own exemptions
is how the next run inherits a lie.

Two premises in the brief were checked against production before being used:

- *"address Kewaskum WI (already public in footer)"* — true, but of the **foot
  band** (`.bs-sig` → "AI VOICE AGENCY · KEWASKUM, WI"), which is homepage-only.
  The shared stamp.py footer carries neither the address nor the social links.
- *"sameAs = the six AVA profile URLs exactly as linked in the live footer"* —
  true, same foot band (`.bs-social`). Fetched from production and matched
  one-for-one.

---

## CRAWLER ACCESS

`robots.txt` on **both** hosts now names: Googlebot · Googlebot-Image · Bingbot ·
OAI-SearchBot · ChatGPT-User · GPTBot · Claude-SearchBot · Claude-User ·
ClaudeBot · PerplexityBot · Perplexity-User · Google-Extended.

**Every group repeats its own `Disallow` lines.** A crawler obeys exactly one
group — its most specific `User-agent` match — and ignores `*` entirely once a
named group exists for it. Adding these groups to the chauffeur file without
repeating the disallow would have **silently unblocked `/DESIGN-SYSTEM.md` for the
eleven bots that matter most here**. The long file is the correct file.

`vercel.json` is **unchanged, and that is a measurement, not an omission.** Each of
the seven required agents was pointed at both live homepages:

| Host | Agents tested | HTTP | Bytes | `<h1>` | ld+json | challenge markers |
|---|---|---|---|---|---|---|
| aivoiceagency.ai | 7/7 | 200 | 44,085 — identical to a browser fetch | ✅ | ✅ | 0 |
| aichauffeur.ai | 7/7 | 200 | 75,087 — identical to a browser fetch | ✅ | ✅ | 0 |

No firewall rule, bot challenge or UA-conditional variation exists to remove.

---

## SITEMAPS

| Host | URLs | lastmod | Coverage |
|---|---|---|---|
| aivoiceagency.ai | 60 | 60 × `2026-08-07` (60 corrected) | every indexable page present; no orphan URLs |
| aichauffeur.ai | 16 | 16 × `2026-08-07` (already accurate) | every indexable page present; no orphan URLs |

Coverage was checked **in both directions** — pages→sitemap and sitemap→pages —
because a sitemap can be complete and still list a URL nothing serves.

---

## VERIFICATION

### The head-only gate was red-green tested before it was trusted

```
python tools/verify_head_only.py
  OK   milwaukee-hvac/index.html   body byte-identical (17231 bytes)

# inject a single attribute into an <h1>, re-run:
  FAIL milwaukee-hvac/index.html
       body differs at byte 2125: b'<h1><span class="hero-line">No-heat call</s'
                               -> b'<h1 data-run-a-canary="1"><span class="hero'
```

Final state, run against the **staged index** (what actually shipped, not the
working tree): **76 html files checked, 0 body violations.**

### schema.org — live, after deploy

`validator.schema.org` POST, 5 sample pages per host:

```
aivoiceagency.ai/                              ERRORS=0
aivoiceagency.ai/milwaukee-hvac                ERRORS=0
aivoiceagency.ai/hvac-answering-service        ERRORS=0
aivoiceagency.ai/blog/wisconsin-limo-crush     ERRORS=0
aivoiceagency.ai/roi                           ERRORS=0
aichauffeur.ai/                                ERRORS=0
aichauffeur.ai/limo-answering-service/         ERRORS=0
aichauffeur.ai/madison-limo-answering-service/ ERRORS=0
aichauffeur.ai/integrations/                   ERRORS=0
aichauffeur.ai/privacy/                        ERRORS=0
```

Plus a local pass against the real schema.org vocabulary (1.5 MB
`schemaorg-current-https.jsonld`) over all 79 pages: **0 errors** — unknown types,
unknown properties, `domainIncludes` mismatches and dangling `@id` references. That
pass is what caught `telephone` on a `Service`, which schema.org does not define
there, after the LocalBusiness retype.

### Lighthouse — production only, median of 3 (topped up to 6 where a delta appeared)

| Page | PERF | A11Y | SEO | BP | CLS |
|---|---|---|---|---|---|
| ava-home | 95 → **96** | 97 → 97 | **100 → 100** | 77 → 77 | 0.000 → 0.000 |
| ava-milwaukee-hvac | 95 → 94 | 100 → 100 | **100 → 100** | 77 → 77 | 0.001 → 0.001 |
| ava-hvac-answering | 93 → 93 | 100 → 100 | **100 → 100** | 77 → 77 | 0.000 → 0.000 |
| aic-home | 100 → 100 | 98 → 98 | **100 → 100** | 100 → 100 | 0.000 → 0.000 |
| aic-limo-answering | 100 → 100 | 100 → 100 | **100 → 100** | 100 → 100 | 0.000 → 0.000 |
| aic-madison | 100 → 100 | 100 → 100 | **100 → 100** | 100 → 100 | 0.000 → 0.000 |

**SEO 100 held on all six — that is the category this run touches.** Accessibility,
Best-Practices and CLS held exactly.

**Two corrections to the brief's framing, both factual:**

1. *"the 100s hold or the run rolls back"* was not a true starting position for
   aivoiceagency.ai. Measured **before** the change: Performance 93–95,
   Accessibility 97 on the homepage, Best-Practices **77** on all three (from
   `third-party-cookies` and `inspector-issues` — the Meta Pixel and GA tags, not
   this run). The gate applied was therefore **no regression against the measured
   baseline**, which is what that instruction protects.

2. `ava-milwaukee-hvac` 95 → 94 is **inside the noise**, and the raw samples say so:

   ```
   BEFORE  [93, 95, 95]                     median 95
   AFTER   [92, 93, 93, 94, 95, 95]         median 94
   ```

   The distributions overlap almost completely. The physical change is **+670
   uncompressed bytes** of JSON-LD on a document Vercel serves Brotli-compressed at
   ~6.6 KB. Not rolled back. The samples are printed here rather than a claim of
   "no regressions".

---

## TOOLS ADDED — all re-runnable, all gates

| Tool | What it proves |
|---|---|
| `tools/truth_audit.py` | every claim string is verbatim on its page; prints its own carve-outs |
| `tools/run_a_truth_layer.py` | the transform; head-only, **idempotent**, aborts if a body would change |
| `tools/verify_head_only.py` | body bytes identical vs `git HEAD` or the staged index |
| `tools/validate_jsonld.py` | schema.org types, properties, domains, dangling `@id`s |
| `tools/sitemap_lastmod.py` | `lastmod` from real file history, not from memory |
| `tools/run-a-lighthouse.js` | production-only before/after with median-of-N |

**The transform is idempotent, and it took three fixes to get there** — worth
recording, because each one silently rewrites the site on every future run:

1. A trailing `\n?` that never matched on the CRLF city pages, so every run left
   the old line ending behind and **grew the file by one blank line**.
2. Unstable node order — a node *synthesised* this pass was *parsed* next pass and
   filed elsewhere, rewriting 21 files with identical content.
3. Unstable key order within a node — `{name, provider, description}` built vs
   `{name, description, provider}` parsed.

A transform whose output depends on how many times it has run cannot be trusted to
have run correctly once.

---

## GOTCHAS

**`tools/stamp.py` will re-add the `/backstage` breadcrumb.** Its `PAGES` row is
`dict(f='backstage/index.html', kind='circulant', trail=[('Backstage', None)],
jsonld=True)`. `stamp()` injects the `BreadcrumbList` whenever the string is absent
from the page, so the next stamp run restores the false claim this run removed.
The fix is `jsonld=False` on that one row — **not made here, because
`tools/stamp.py` is outside this run's head-only edit permission.**

**Do not run `tools/stamp.py` to "finish" this run.** It rewrites nav, footer,
crumb and call-bar regions inside `<body>`. Nothing this run changed needs it — no
asset bytes changed, so no cache-armor version needed to move.

**`/live` and `/lsa` lost their `areaServed: Wisconsin`.** Neither page prints the
word. If that signal matters on those two pages, the fix is one line of visible
copy, not a schema edit.

**Six FAQ answers were dropped, not fixed** — 2 on the chauffeur homepage, 2 on
`/live`, 2 on `/limo-answering-service`, plus 2 on `/works-with-your-software`.
They no longer match the rendered Q&A. Re-adding them means changing the visible
copy or the answer, both `<body>` work.

**`ai100x.ai` was left alone.** It is a third host, out of this brief's scope, and
it still ships `founder: Person "Shane Handel"` in its Organization schema plus the
name in its `<title>` and body. Same for `/ctr-report` and `/cockpit`, which are
noindex internal pages.

**`350-220-5305` still appears in `live/index.html`.** It is in `<body>`, which
this run may not touch. Nothing this run wrote contains any of the four forbidden
numbers — verified on 10 live pages.

**The IndexNow submission from `ec159f6` predates this change.** All 60
aivoiceagency.ai URLs now have new content and a new `lastmod`. A re-ping via
`scripts/indexnow-ping.mjs` is worth doing; it was not fired here because the brief
did not ask for it and it pushes to external services.

---

## ROLLBACK

```bash
git revert 3b8d337
```

One commit, one unit. Reverting restores the previous schema on both hosts; no
body, asset or config state depends on it.
