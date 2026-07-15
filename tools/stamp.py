#!/usr/bin/env python3
"""THE BRIDGE stamp — injects global nav / breadcrumbs / footer / call bar
into every indexable page between BRIDGE:* markers. Build-time only, never
deployed (tools/ is in .vercelignore). Re-runnable: if markers exist the
block between them is replaced; legacy nav/footer/mobile-cta blocks are
replaced once on first stamp. Run from repo root:  python tools/stamp.py
"""
import re, sys, io, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

HEAD = '''<!-- BRIDGE:HEAD -->
<script>(function(){try{var t=localStorage.getItem('bs-theme');if(t==='light'){document.documentElement.setAttribute('data-theme','light');var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content','#F4F6FA')}}catch(e){}})()</script>
<link rel="stylesheet" href="/assets/bridge.css">
<script src="/js/bridge.js" defer></script>
<!-- /BRIDGE:HEAD -->'''

NAV = '''<!-- BRIDGE:NAV -->
<nav class="bnav" aria-label="Main">
  <a class="bnav-brand" href="/"><span class="bdot" aria-hidden="true"></span>AI VOICE AGENCY</a>
  <button class="bnav-burger" aria-expanded="false" aria-controls="bnavMenu" aria-label="Menu">MENU</button>
  <div class="bnav-menu" id="bnavMenu">
    <div class="bnav-group">
      <button class="bnav-top" type="button" aria-expanded="false">Verticals</button>
      <div class="bnav-drop">
        <a href="/home-services">AI receptionist for home services</a>
        <a href="/medical-practices">AI receptionist for medical practices</a>
        <a href="/professional-services">AI receptionist for professional services</a>
        <a href="/hospitality">AI receptionist for hospitality &amp; events</a>
        <a href="/ground-transportation">AI receptionist for transportation</a>
      </div>
    </div>
    <div class="bnav-group">
      <button class="bnav-top" type="button" aria-expanded="false">Wisconsin</button>
      <div class="bnav-drop">
        <a href="/milwaukee">Milwaukee answering service</a>
        <a href="/madison">Madison answering service</a>
        <a href="/green-bay">Green Bay answering service</a>
        <a href="/wisconsin-limo">Wisconsin limo &amp; livery</a>
      </div>
    </div>
    <a class="bnav-top" href="/#pricing">Pricing</a>
    <a class="bnav-top" href="/roi">ROI</a>
    <a class="bnav-cta" href="/book" data-event="book_click_nav">Book a 15-minute call</a>
    <a class="bnav-tel" href="tel:+14142408930" data-event="tel_tap_nav">414-240-8930</a>
  </div>
</nav>
<!-- /BRIDGE:NAV -->'''

FOOTER = '''<!-- BRIDGE:FOOTER -->
<footer class="bfoot">
  <div class="bfoot-wrap">
    <div class="bfoot-grid">
      <div class="bfoot-brand">
        <span class="bmark"><span class="bdot" aria-hidden="true"></span>AI VOICE AGENCY</span>
        <p class="bfoot-tag">The AI receptionist for local service businesses. Answers in one ring. Books the job.</p>
        <span class="bfoot-built">Built in Wisconsin</span>
      </div>
      <details class="bfoot-col" open>
        <summary>Verticals</summary>
        <div class="bfoot-items">
          <a href="/home-services">AI receptionist for home services</a>
          <a href="/medical-practices">AI receptionist for medical practices</a>
          <a href="/professional-services">AI receptionist for professional services</a>
          <a href="/hospitality">AI receptionist for hospitality &amp; events</a>
          <a href="/ground-transportation">AI receptionist for transportation</a>
        </div>
      </details>
      <details class="bfoot-col" open>
        <summary>Wisconsin</summary>
        <div class="bfoot-items">
          <a href="/milwaukee">Milwaukee</a>
          <a href="/madison">Madison</a>
          <a href="/green-bay">Green Bay</a>
          <a href="/wisconsin-limo">Wisconsin Limo</a>
        </div>
      </details>
      <details class="bfoot-col" open>
        <summary>By city &amp; trade</summary>
        <div class="bfoot-items">
          <span class="bfoot-sub">Milwaukee</span>
          <a href="/milwaukee-hvac">HVAC answering</a>
          <a href="/milwaukee-plumbing">Plumbing answering</a>
          <a href="/milwaukee-electrical">Electrical answering</a>
          <a href="/milwaukee-dental">Dental answering</a>
          <a href="/milwaukee-roofing">Roofing answering</a>
          <span class="bfoot-sub">Madison</span>
          <a href="/madison-hvac">HVAC answering</a>
          <a href="/madison-plumbing">Plumbing answering</a>
          <a href="/madison-electrical">Electrical answering</a>
          <a href="/madison-dental">Dental answering</a>
          <a href="/madison-roofing">Roofing answering</a>
          <span class="bfoot-sub">West Bend</span>
          <a href="/west-bend-hvac">HVAC answering</a>
          <a href="/west-bend-plumbing">Plumbing answering</a>
          <a href="/west-bend-electrical">Electrical answering</a>
          <a href="/west-bend-dental">Dental answering</a>
          <a href="/west-bend-roofing">Roofing answering</a>
        </div>
      </details>
      <details class="bfoot-col" open>
        <summary>Insights</summary>
        <div class="bfoot-items">
          <a href="/blog">The AVA blog</a>
          <a href="/blog/what-happens-when-you-call-ava">What happens when you call AVA</a>
          <a href="/blog/wisconsin-limo-crush">The Wisconsin limo call crush</a>
          <a href="/blog/home-services-30-percent-missed">The 30% missed-call problem</a>
          <a href="/videos">Videos</a>
        </div>
      </details>
      <details class="bfoot-col" open>
        <summary>Company</summary>
        <div class="bfoot-items">
          <a href="/overview">Overview</a>
          <a href="/roi">ROI Calculator</a>
          <a href="/methodology.html">Methodology</a>
          <a href="/privacy.html">Privacy</a>
          <a href="/terms.html">Terms</a>
          <a href="/sms-policy.html">SMS Policy</a>
        </div>
      </details>
    </div>
    <div class="bfoot-action">
      <a class="bf-tel" href="tel:+14142408930" data-event="tel_tap_footer">Hear AVA live — 414-240-8930</a>
      <a class="bf-book" href="/book" data-event="book_click_footer">Book a 15-minute call</a>
    </div>
    <p class="bfoot-legal">AVA is an AI assistant. Demo calls are scripted samples using AVA's demo voice and sample data. &copy; 2026 AI Voice Agency.</p>
  </div>
</footer>
<!-- /BRIDGE:FOOTER -->'''

CALLBAR = '''<!-- BRIDGE:CALLBAR -->
<div class="bcallbar" role="region" aria-label="Contact AVA">
  <a class="bcall" href="tel:+14142408930" data-event="tel_tap_callbar">&#9654; HEAR AVA LIVE</a>
  <a class="bbook" href="/book" data-event="book_click_callbar">BOOK A CALL</a>
</div>
<!-- /BRIDGE:CALLBAR -->'''

# (label, href-or-None). Last item is always the current page (rendered unlinked).
V = [('Verticals', None)]
W = [('Wisconsin', None)]
PAGES = [
    dict(f='index.html',                                   kind='home',      trail=None),
    dict(f='book/index.html',                              kind='book',      trail=[('Book', None)], jsonld=True),
    dict(f='home-services/index.html',                     kind='circulant', trail=V+[('Home Services', None)]),
    dict(f='medical-practices/index.html',                 kind='circulant', trail=V+[('Medical Practices', None)]),
    dict(f='professional-services/index.html',             kind='circulant', trail=V+[('Professional Services', None)]),
    dict(f='hospitality/index.html',                       kind='circulant', trail=V+[('Hospitality', None)]),
    dict(f='ground-transportation/index.html',             kind='circulant', trail=V+[('Transportation', None)]),
    dict(f='milwaukee/index.html',                         kind='circulant', trail=W+[('Milwaukee', None)]),
    dict(f='madison/index.html',                           kind='circulant', trail=W+[('Madison', None)]),
    dict(f='green-bay/index.html',                         kind='circulant', trail=W+[('Green Bay', None)]),
    dict(f='wisconsin-limo/index.html',                    kind='circulant', trail=W+[('Wisconsin Limo', None)]),
    dict(f='blog/index.html',                              kind='circulant', trail=[('Insights', None)]),
    dict(f='blog/what-happens-when-you-call-ava/index.html', kind='circulant', trail=[('Insights', '/blog'), ('What happens when you call AVA', None)]),
    dict(f='blog/wisconsin-limo-crush/index.html',         kind='circulant', trail=[('Insights', '/blog'), ('Wisconsin limo call crush', None)]),
    dict(f='blog/home-services-30-percent-missed/index.html', kind='circulant', trail=[('Insights', '/blog'), ('The 30% missed-call problem', None)]),
    dict(f='videos/index.html',                            kind='circulant', trail=[('Videos', None)]),
    dict(f='overview.html',                                kind='insert',    trail=[('Overview', None)], jsonld=True),
    dict(f='roi/index.html',                               kind='insert',    trail=[('ROI Calculator', None)], jsonld=True),
    dict(f='methodology.html',                             kind='legal',     trail=[('Methodology', None)], jsonld=True),
    dict(f='privacy.html',                                 kind='legal',     trail=[('Privacy', None)], jsonld=True),
    dict(f='terms.html',                                   kind='legal',     trail=[('Terms', None)], jsonld=True),
    dict(f='sms-policy.html',                              kind='legal',     trail=[('SMS Policy', None)], jsonld=True),
]
for city, hub in [('milwaukee', '/milwaukee'), ('madison', '/madison'), ('west-bend', None)]:
    cname = city.replace('-', ' ').title()
    for trade in ['hvac', 'plumbing', 'electrical', 'dental', 'roofing']:
        tname = 'HVAC' if trade == 'hvac' else trade.title()
        PAGES.append(dict(f='%s-%s/index.html' % (city, trade), kind='circulant',
                          trail=W + [(cname, hub), (tname, None)]))


def crumb_html(trail):
    parts = ['<a href="/">Home</a>']
    for i, (label, href) in enumerate(trail):
        parts.append('<span class="bc-sep">/</span>')
        last = i == len(trail) - 1
        if last:
            parts.append('<span class="bc-here">%s</span>' % label)
        elif href:
            parts.append('<a href="%s">%s</a>' % (href, label))
        else:
            parts.append('<span>%s</span>' % label)
    return ('<!-- BRIDGE:CRUMB -->\n<nav class="bcrumb" aria-label="Breadcrumb">'
            + ''.join(parts) + '</nav>\n<!-- /BRIDGE:CRUMB -->')


def crumb_jsonld(path, trail):
    # linked items only + the current page (last item carries the page URL)
    url = 'https://aivoiceagency.ai/' + re.sub(r'(index\.html$|/index\.html$)', '', path).rstrip('/')
    if path == 'overview.html': url = 'https://aivoiceagency.ai/overview'
    if path.endswith('.html') and '/' not in path and path != 'overview.html':
        url = 'https://aivoiceagency.ai/' + path
    items, pos = [], 1
    items.append('{"@type":"ListItem","position":1,"name":"Home","item":"https://aivoiceagency.ai/"}')
    pos = 2
    for i, (label, href) in enumerate(trail):
        last = i == len(trail) - 1
        if last:
            items.append('{"@type":"ListItem","position":%d,"name":"%s","item":"%s"}' % (pos, label, url))
            pos += 1
        elif href:
            items.append('{"@type":"ListItem","position":%d,"name":"%s","item":"https://aivoiceagency.ai%s"}' % (pos, label, href))
            pos += 1
    return ('<!-- BRIDGE:CRUMBLD -->\n<script type="application/ld+json">'
            '{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":['
            + ','.join(items) + ']}</script>\n<!-- /BRIDGE:CRUMBLD -->')


def between(content, tag, block):
    """Replace an existing marker region, or return None if absent."""
    pat = re.compile(r'<!-- BRIDGE:%s -->[\s\S]*?<!-- /BRIDGE:%s -->' % (tag, tag))
    if pat.search(content):
        return pat.sub(lambda m: block, content, count=1)
    return None


def stamp(page):
    path = os.path.join(ROOT, page['f'])
    with io.open(path, 'r', encoding='utf-8') as fh:
        c = fh.read()
    orig = c
    kind = page['kind']
    crumb = crumb_html(page['trail']) if page['trail'] else ''
    navblock = NAV + ('\n' + crumb if crumb else '')

    # --- head ---
    done = between(c, 'HEAD', HEAD)
    c = done if done is not None else c.replace('</head>', HEAD + '\n</head>', 1)

    # --- nav (+ crumb rides with it) ---
    done = between(c, 'NAV', NAV)
    if done is not None:
        c = done
        redo = between(c, 'CRUMB', crumb)
        if redo is not None: c = redo
    else:
        if kind == 'home':
            c = re.sub(r'<header class="nav">[\s\S]*?</header>', lambda m: navblock, c, count=1)
        elif kind == 'book':
            c = re.sub(r'<header class="bar">[\s\S]*?</header>', lambda m: navblock, c, count=1)
        elif kind == 'circulant':
            c = re.sub(r'<nav class="main-nav">[\s\S]*?</nav>', lambda m: navblock, c, count=1)
        elif kind == 'legal':
            c = re.sub(r'<body>\s*<nav>[\s\S]*?</nav>', lambda m: '<body>\n' + navblock, c, count=1)
        elif kind == 'insert':
            if '<div class="brandbar">' in c:
                c = re.sub(r'<div class="brandbar">[\s\S]*?</div>', lambda m: navblock, c, count=1)
            else:
                c = re.sub(r'<body>', lambda m: '<body>\n' + navblock, c, count=1)

    # --- footer ---
    done = between(c, 'FOOTER', FOOTER)
    if done is not None:
        c = done
    else:
        if kind == 'home':
            c = re.sub(r'<footer class="foot">[\s\S]*?</footer>', lambda m: FOOTER, c, count=1)
        elif kind == 'circulant':
            c = re.sub(r'<footer class="main-footer">[\s\S]*?</footer>', lambda m: FOOTER, c, count=1)
        else:  # legal / insert / book — plain <footer>
            c = re.sub(r'<footer[^>]*>[\s\S]*?</footer>', lambda m: FOOTER, c, count=1)

    # --- call bar (not on the homepage: it keeps its own richer sticky bar) ---
    if kind != 'home':
        done = between(c, 'CALLBAR', CALLBAR)
        if done is not None:
            c = done
        elif re.search(r'<div id="mobile-cta">', c):
            c = re.sub(r'<div id="mobile-cta">[\s\S]*?</div>', lambda m: CALLBAR, c, count=1)
        else:
            c = c.replace('</body>', CALLBAR + '\n</body>', 1)

    # --- BreadcrumbList JSON-LD where the page has none ---
    if page.get('jsonld'):
        ld = crumb_jsonld(page['f'], page['trail'])
        done = between(c, 'CRUMBLD', ld)
        if done is not None:
            c = done
        elif 'BreadcrumbList' not in c:
            c = c.replace('</head>', ld + '\n</head>', 1)

    if c != orig:
        with io.open(path, 'w', encoding='utf-8', newline='\n') as fh:
            fh.write(c)
        return True
    return False


def main():
    changed = 0
    for p in PAGES:
        if stamp(p):
            changed += 1
            print('stamped  %s' % p['f'])
        else:
            print('nochange %s' % p['f'])
    print('--- %d/%d pages stamped ---' % (changed, len(PAGES)))


if __name__ == '__main__':
    main()
