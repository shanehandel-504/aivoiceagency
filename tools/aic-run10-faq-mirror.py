# -*- coding: utf-8 -*-
"""AIC RUN 10 — FAQPage schema mirror.

WHY THIS EXISTS
---------------
Every chauffeur page that shows a Q&A also ships a FAQPage node describing it,
and the two were written by hand at different times. Measured before this run:
several answers in the schema were shortened versions of the answer on the page,
one dropped its final sentence, and one question existed in the markup and not in
the schema at all. Structured data that disagrees with the rendered page is worse
than no structured data — it is a machine-readable claim the page does not make.

So the schema is no longer authored. It is GENERATED from the rendered copy: the
<details> blocks inside <section id="faq"> are the single source, and this tool
rewrites every FAQPage node to match them verbatim, whether that node stands
alone or sits inside an @graph.

    python tools/aic-run10-faq-mirror.py            rewrite
    python tools/aic-run10-faq-mirror.py --check    exit 1 on any drift

--check is the gate. It never writes.
"""
import glob
import html
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CH = os.path.join(ROOT, 'chauffeur')

FAQ_SEC = re.compile(r'<section id="faq".*?</section>', re.S)
DETAIL = re.compile(r'<details>\s*<summary>(.*?)</summary>\s*<div>(.*?)</div>\s*</details>', re.S)
# /demo/ sets its Q&A as cards rather than an accordion. Both are visible copy,
# and the schema has to mirror whichever one the page actually renders — reading
# only <details> is how that page ended up shipping four questions in JSON-LD
# that appear nowhere on it.
CARD = re.compile(r'<h3 class="card-h">(.*?)</h3>\s*<p class="card-p">(.*?)</p>', re.S)
LD = re.compile(r'(<script type="application/ld\+json">\s*)(.*?)(\s*</script>)', re.S)


def text_of(fragment):
    """Rendered text of an HTML fragment: tags out, entities decoded, runs of
    whitespace collapsed. This is what a reader sees and therefore what the
    schema is allowed to say."""
    t = re.sub(r'<[^>]+>', '', fragment)
    return re.sub(r'\s+', ' ', html.unescape(t)).strip()


def visible_faq(page_src):
    m = FAQ_SEC.search(page_src)
    if not m:
        return []
    pairs = DETAIL.findall(m.group(0)) or CARD.findall(m.group(0))
    return [{'@type': 'Question', 'name': text_of(q),
             'acceptedAnswer': {'@type': 'Answer', 'text': text_of(a)}}
            for q, a in pairs]


def apply_to_node(node, entities):
    """Fill any FAQPage found at the top level or inside an @graph. Returns
    True if this document carried one."""
    hit = False
    nodes = node.get('@graph') if isinstance(node, dict) and '@graph' in node else [node]
    for n in nodes:
        if isinstance(n, dict) and n.get('@type') == 'FAQPage':
            n['mainEntity'] = entities
            hit = True
    return hit


def main():
    check = '--check' in sys.argv
    # RUN 12 · the depth-two glob. /integrations/limo-anywhere/ and
    # /integrations/fasttrak/ are the first pages on this host that live two
    # levels down, and until this line existed the mirror walked straight past
    # them — no error, no warning, just two pages whose FAQPage node was never
    # checked against the copy it describes. A tool that silently skips a file
    # reports "every FAQPage node mirrors its visible copy" about a set that
    # does not include the page you just wrote.
    pages = sorted(set(glob.glob(os.path.join(CH, '*.html')) +
                       glob.glob(os.path.join(CH, '*', 'index.html')) +
                       glob.glob(os.path.join(CH, '*', '*', 'index.html'))))
    drift, written, seen = 0, 0, 0
    for p in pages:
        src = io.open(p, encoding='utf-8', newline='').read()
        entities = visible_faq(src)
        rel = os.path.relpath(p, CH).replace('\\', '/')

        def repl(m):
            try:
                doc = json.loads(m.group(2))
            except ValueError:
                return m.group(0)
            if not apply_to_node(doc, entities):
                return m.group(0)
            return m.group(1) + json.dumps(doc, ensure_ascii=False,
                                           separators=(',', ':')) + m.group(3)

        out = LD.sub(repl, src)
        has_faq_node = '"FAQPage"' in src or '@type":"FAQPage' in src
        if has_faq_node:
            seen += 1
            if not entities:
                print('  NO VISIBLE Q&A but a FAQPage node ships: %s' % rel)
                drift += 1
                continue
        if out != src:
            drift += 1
            if check:
                print('  DRIFT  %s' % rel)
            else:
                io.open(p, 'w', encoding='utf-8', newline='').write(out)
                written += 1
                print('  mirrored  %-42s %d Q&A' % (rel, len(entities)))
        elif has_faq_node:
            print('  ok        %-42s %d Q&A' % (rel, len(entities)))

    print()
    print('  %d page(s) carry a FAQPage node' % seen)
    if check:
        print('  %d drifted' % drift if drift else '  every FAQPage node mirrors its visible copy')
        return 1 if drift else 0
    print('  %d rewritten' % written)
    return 0


if __name__ == '__main__':
    sys.exit(main())
