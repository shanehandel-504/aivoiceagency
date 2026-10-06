#!/usr/bin/env python3
"""render.py - draw a template frame-exact with Playwright (Chromium) into PNGs.

  render.py test <t> [<t> ...]   a few frames at the given seconds -> <job>/test/o_SSS.SS.png
  render.py full                 every frame at (i + 0.5) / fps    -> <job>/frames/fNNNNN.png

  --overlay PATH     the template (default: templates/overlay.html in this kit)
  --brand ava|aic    the brand (default: "brand" in data.json, else ava)
  --job DIR          the job folder that holds data.json (default: the current folder)
  --data FILE        a data.json kept somewhere else (default: <job>/data.json)
  --set KEY=VALUE    hand a value to the template as a URL query key; repeat for more
  --dur SECONDS      length of a full render (default: the card's own length, else events.total)
  --start S --end S  render only part of a full render, to redo one beat
  --out DIR          where the PNGs go (default: <job>/test or <job>/frames)

Every PNG is 1080x1920 with a transparent background (omit_background). The page is driven through
its contract: setBrand(brand, jobBase), setData(data), then render(t) once per frame.

The last line printed is `errors [...]`: page errors, console errors, and any font or image that did
not load. It must read `errors []`. Anything else: stop and fix before rendering the full film.
"""
import argparse
import json
import os
import sys
from pathlib import Path
from urllib.parse import urlencode

KIT = Path(__file__).resolve().parent.parent
W, H = 1080, 1920

# Wait until every declared font face and every image is in. A face or image that fails is an error:
# a frame drawn with a fallback font is a wrong frame.
READY_JS = """async () => {
  const bad = [];
  await Promise.all([...document.fonts].map(f => f.load().catch(() => { bad.push('font did not load: ' + f.family + ' ' + f.weight); })));
  await document.fonts.ready;
  await Promise.all([...document.images].map(i => i.complete ? null : new Promise(r => { i.addEventListener('load', r); i.addEventListener('error', r); })));
  for (const i of document.images) {
    if (!i.getAttribute('src')) continue;
    if (!i.naturalWidth) bad.push('image did not load: ' + i.src);
    else if (i.decode) { try { await i.decode(); } catch (e) {} }
  }
  return bad;
}"""


def load_brand(brand_id):
    """brand/<id>.json, with its cover rotation pointer followed to the next color for this brand."""
    path = KIT / 'brand' / f'{brand_id}.json'
    if not path.is_file():
        sys.exit(f'render.py: no brand file {path} (brands: ava, aic)')
    brand = json.loads(path.read_text(encoding='utf-8'))
    pointer = (brand.get('covers') or {}).get('rotation')
    if pointer:
        rot_path = (path.parent / pointer).resolve()
        if rot_path.is_file():
            rot = json.loads(rot_path.read_text(encoding='utf-8'))
            order = [c for c in rot.get('rotation', []) if brand_id in c.get('brands', [brand_id])]
            ids = [c['id'] for c in order]
            if rot.get('next') in ids:
                brand['covers']['nextColor'] = order[ids.index(rot['next'])]['hex']
            elif order:
                brand['covers']['nextColor'] = order[0]['hex']
    return brand


def main():
    ap = argparse.ArgumentParser(description='Render a video-kit template to PNG frames.', add_help=True)
    ap.add_argument('mode', choices=['test', 'full'])
    ap.add_argument('times', nargs='*', type=float, help='test mode: the seconds to render')
    ap.add_argument('--overlay', default=str(KIT / 'templates' / 'overlay.html'))
    ap.add_argument('--brand', choices=['ava', 'aic'])
    ap.add_argument('--job', default='.')
    ap.add_argument('--data')
    ap.add_argument('--set', action='append', default=[], metavar='KEY=VALUE')
    ap.add_argument('--dur', type=float)
    ap.add_argument('--start', type=float, default=0.0)
    ap.add_argument('--end', type=float)
    ap.add_argument('--out')
    a = ap.parse_args()
    if a.mode == 'test' and not a.times:
        ap.error('test mode needs at least one time, e.g. render.py test 0.5 3.0 12.0')

    job = Path(a.job).resolve()
    overlay = Path(a.overlay).resolve()
    if not overlay.is_file():
        sys.exit(f'render.py: no template at {overlay}')
    data_path = Path(a.data).resolve() if a.data else job / 'data.json'
    if data_path.is_file():
        data = json.loads(data_path.read_text(encoding='utf-8'))
    else:
        data = {}
        print(f'note: no {data_path.name} in {data_path.parent} - rendering with empty data (fine for a cover or an end card)')

    brand_id = a.brand or data.get('brand') or 'ava'
    if a.brand and data.get('brand') and data['brand'] != a.brand:
        print(f'note: --brand {a.brand} overrides "brand": "{data["brand"]}" from data.json')
    brand = load_brand(brand_id)

    query = {'brand': brand_id}
    for kv in a.set:
        if '=' not in kv:
            sys.exit(f'render.py: --set wants KEY=VALUE, got {kv!r}')
        k, v = kv.split('=', 1)
        query[k] = v
    url = overlay.as_uri() + '?' + urlencode(query)

    from playwright.sync_api import sync_playwright
    errs = []
    with sync_playwright() as p:
        browser = p.chromium.launch(args=['--force-color-profile=srgb', '--font-render-hinting=none'])
        page = browser.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        page.on('pageerror', lambda e: errs.append(str(e)))
        page.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        page.on('requestfailed', lambda r: errs.append(f'request failed: {r.url}'))
        page.goto(url)
        page.evaluate('([b, base, d]) => { if (window.setBrand) setBrand(b, base); setData(d); }',
                      [brand, job.as_uri() + '/', data])
        errs.extend(page.evaluate(READY_JS))

        if a.mode == 'test':
            out = Path(a.out).resolve() if a.out else job / 'test'
            out.mkdir(parents=True, exist_ok=True)
            for t in a.times:
                page.evaluate('t => render(t)', t)
                png = out / f'o_{t:06.2f}.png'
                page.screenshot(path=str(png), omit_background=True)
                print('wrote', png)
        else:
            fps = data.get('fps', 30)
            # length: --dur, else the card's own DURATION (cover, end cards), else the job's events.total
            total = a.dur or page.evaluate('window.DURATION || 0') or (data.get('events') or {}).get('total')
            if not total:
                sys.exit('render.py: no length for a full render - pass --dur SECONDS, or give data.json an events.total')
            n = int(round(total * fps))
            first = max(0, int(round(a.start * fps)))
            last = n if a.end is None else min(n, int(round(a.end * fps)))
            out = Path(a.out).resolve() if a.out else job / 'frames'
            out.mkdir(parents=True, exist_ok=True)
            for i in range(first, last):
                page.evaluate('t => render(t)', (i + 0.5) / fps)
                page.screenshot(path=str(out / f'f{i:05d}.png'), omit_background=True)
                if (i - first) % 150 == 149:
                    print(f'  {i + 1 - first}/{last - first} frames', flush=True)
            print('frames', last - first, 'of', n, '->', out)
        browser.close()

    seen = list(dict.fromkeys(errs))          # one line per distinct error, first seen first
    print('errors', seen[:5])
    return 1 if seen else 0


if __name__ == '__main__':
    sys.exit(main())
