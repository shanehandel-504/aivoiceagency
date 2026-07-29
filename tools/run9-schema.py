#!/usr/bin/env python3
# =============================================================================
# tools/run9-schema.py  ·  RUN 9 · SCHEMA (national architecture)
# -----------------------------------------------------------------------------
# AVA is a national service, not a storefront. 31 city pages shipped a
# LocalBusiness node naming a per-city "business" ("AI Voice Agency — Milwaukee
# HVAC") with a Kewaskum postal address. That asserts a physical location in
# every metro, which is false, and it fragments the entity across 31 pages.
#
# WHAT THIS DOES
#   1. Replaces every LocalBusiness node with the ONE canonical Organization,
#      carrying a stable @id so all pages resolve to a single entity.
#   2. Repoints each page's Service.provider at that same @id instead of
#      restating an inline Organization, which is what actually connects the
#      graph.
#   3. Asserts Organization + Service exist on the homepage and every vertical.
#
# WHAT IT DELIBERATELY DOES NOT DO
#   The per-city service area is NOT lost — it already lives on the Service
#   node as areaServed (City), which is the correct place for it. Only the
#   storefront claim goes.
#
# USAGE:
#   python tools/run9-schema.py --audit
#   python tools/run9-schema.py --apply
#
# IDEMPOTENT. Build-time only; tools/ is never deployed (.vercelignore).
# =============================================================================

import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APPLY = '--apply' in sys.argv
ORG_ID = 'https://aivoiceagency.ai/#organization'

CANONICAL_ORG = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    "name": "AI Voice Agency",
    "url": "https://aivoiceagency.ai/",
    "telephone": "+1-414-240-8930",
    "description": "AI receptionist for local service businesses. Answers every call 24/7 and books the job.",
    "founder": {"@type": "Person", "name": "Shane Handel"},
    "address": {
        "@type": "PostalAddress",
        "addressLocality": "Kewaskum",
        "addressRegion": "WI",
        "addressCountry": "US",
    },
    "sameAs": [
        "https://www.facebook.com/AIVoiceAgency",
        "https://www.instagram.com/aivoiceagency.ai",
        "https://x.com/AIVoiceAgency",
        "https://www.youtube.com/@aivoiceagency",
        "https://www.tiktok.com/@aivoiceagency.ai",
        "https://www.linkedin.com/company/aivoiceagency",
    ],
}

VERTICALS = ['hvac-answering-service', 'plumber-answering-service', 'electrician-answering-service',
             '24-hour-answering-service', 'home-services', 'hospitality', 'medical-practices',
             'professional-services', 'ground-transportation']

BLOCK = re.compile(r'<script type="application/ld\+json">\s*(.*?)\s*</script>', re.S)
changes = []

CITY_RE = re.compile(
    r'^(milwaukee|madison|green-bay|waukesha|west-bend|wisconsin-limo)(-[a-z]+)?/index\.html$')


def is_city(rel):
    return bool(CITY_RE.match(rel))


def top_level_types(s):
    """Types of nodes at the ROOT of a block or inside its @graph. An
    Organization nested inside Service.provider is NOT a standalone entity and
    deliberately does not count."""
    types = set()
    for m in BLOCK.finditer(s):
        try:
            d = json.loads(m.group(1))
        except Exception:
            continue
        nodes = d.get('@graph', [d]) if isinstance(d, dict) else d
        for n in (nodes if isinstance(nodes, list) else [nodes]):
            if isinstance(n, dict) and n.get('@type'):
                types.add(n['@type'])
    return types


def has_top_level_org(s):
    return 'Organization' in top_level_types(s)


def iter_html():
    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs
                   if d not in {'.git', 'node_modules', 'reports', 'retell-backups',
                                '.claude', 'audits', 'tools', 'legacy', '__pycache__',
                                'templates', 'voice-stack'}
                   and not d.startswith('.')]
        for fn in files:
            if fn.endswith('.html'):
                yield os.path.join(base, fn)


def process(path):
    rel = os.path.relpath(path, ROOT).replace('\\', '/')
    src = io.open(path, encoding='utf-8').read()
    out = src
    touched = []

    for m in list(BLOCK.finditer(src)):
        raw = m.group(1)
        try:
            data = json.loads(raw)
        except Exception:
            continue
        if not isinstance(data, dict):
            continue

        # 1 · LocalBusiness -> canonical Organization
        if data.get('@type') == 'LocalBusiness':
            new = json.dumps(CANONICAL_ORG, indent=2, ensure_ascii=False)
            out = out.replace(m.group(0),
                              '<script type="application/ld+json">\n' + new + '\n</script>', 1)
            touched.append('LocalBusiness "%s" -> Organization @id' % str(data.get('name', ''))[:48])

        # 2 · Service.provider -> @id reference
        elif data.get('@type') == 'Service' and isinstance(data.get('provider'), dict) \
                and '@id' not in data['provider']:
            data['provider'] = {"@id": ORG_ID}
            new = json.dumps(data, indent=2, ensure_ascii=False)
            out = out.replace(m.group(0),
                              '<script type="application/ld+json">\n' + new + '\n</script>', 1)
            touched.append('Service.provider inline Organization -> {"@id": org}')

    # 3 · a standalone Organization entity must exist on the homepage, every
    #     vertical and every city page. On the verticals the ONLY Organization
    #     was nested inside Service.provider — repointing that at an @id would
    #     have left the page with no Organization at all, so the canonical node
    #     is injected before </head>.
    if rel == 'index.html' or rel.split('/')[0] in VERTICALS or is_city(rel):
        if not has_top_level_org(out):
            block = ('<script type="application/ld+json">\n'
                     + json.dumps(CANONICAL_ORG, indent=2, ensure_ascii=False)
                     + '\n</script>\n</head>')
            if '</head>' in out:
                out = out.replace('</head>', block, 1)
                touched.append('injected standalone canonical Organization')

    if touched:
        changes.append((rel, touched))
        if APPLY and out != src:
            io.open(path, 'w', encoding='utf-8', newline='').write(out)
    return out


for p in iter_html():
    process(p)

print('RUN 9 SCHEMA · mode=%s' % ('apply' if APPLY else 'audit'))
print('%d file(s) touched\n' % len(changes))
for rel, t in sorted(changes):
    print('  %s' % rel)
    for x in t:
        print('      %s' % x)

# ---- assertions: Organization + Service present on homepage and verticals ----
print('\n--- Organization + Service presence (national architecture) ---')
missing = 0
for rel in ['index.html'] + [v + '/index.html' for v in VERTICALS]:
    p = os.path.join(ROOT, rel)
    if not os.path.exists(p):
        print('  SKIP (absent) %s' % rel)
        continue
    types = top_level_types(io.open(p, encoding='utf-8').read())
    ok_org, ok_svc = 'Organization' in types, 'Service' in types
    lb = 'LocalBusiness' in types
    if not (ok_org and ok_svc) or lb:
        missing += 1
    print('  %-42s Organization=%s Service=%s LocalBusiness=%s' %
          (rel, 'Y' if ok_org else 'N', 'Y' if ok_svc else 'N', 'PRESENT' if lb else 'none'))

# ---- global LocalBusiness sweep -------------------------------------------
left = [os.path.relpath(p, ROOT).replace('\\', '/') for p in iter_html()
        if '"LocalBusiness"' in io.open(p, encoding='utf-8').read()]
print('\nLocalBusiness still present on %d page(s)%s' % (len(left), (': ' + ', '.join(left[:6])) if left else ''))
print('ASSERTIONS: %s' % ('PASS' if missing == 0 and not left else 'FAIL'))
