# print_check.py · prints pdf/ava-overview.html in both looks with Chrome (Playwright), finishes the two PDFs
# (title, author, bookmarks), checks them, and saves one picture per page in the run folder.
# Usage: python -X utf8 tools/ava-pdf/print_check.py
import re, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
import pymupdf
import numpy as np
import cv2
from PIL import Image
from pypdf import PdfWriter
from pypdf.generic import NameObject, TextStringObject

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
PDF = REPO / 'pdf'
RUN = Path(r'C:\Users\offic\OneDrive\Desktop\PASTE\ava-try-pdf-polish')
PAGES = RUN / 'pdf-pages'
TMP = RUN / 'pdf-tmp'
PAGES.mkdir(parents=True, exist_ok=True)
TMP.mkdir(parents=True, exist_ok=True)
OUT = {'paper': PDF / 'ai-voice-agency-overview.pdf', 'night': PDF / 'ai-voice-agency-overview-night.pdf'}
BOOK = 'https://aivoiceagency.ai/book/'
LINKS_OK = {'tel:+14142408930', BOOK, 'https://aivoiceagency.ai/', 'mailto:shane@aivoiceagency.ai', 'https://aivoiceagency.ai/#plumbing'}
JS = r"""(()=>{const out={over:[],clip:[],gap:[]};
document.querySelectorAll('.page').forEach((s,i)=>{const r=s.getBoundingClientRect();
 s.querySelectorAll('*').forEach(e=>{const cs=getComputedStyle(e); if(cs.display==='none') return; const q=e.getBoundingClientRect(); if(!q.width||!q.height) return;
  if(q.bottom>r.bottom+0.5) out.over.push([i+1,(e.className||e.tagName)+'',Math.round(q.bottom-r.bottom)+'px below']);
  if(q.right>r.right+0.5) out.over.push([i+1,(e.className||e.tagName)+'',Math.round(q.right-r.right)+'px right']);
  if(!e.classList.contains('page') && !e.closest('.wave') && !e.classList.contains('dt') && cs.display!=='inline' && e.scrollWidth>e.clientWidth+1) out.clip.push([i+1,(e.className||e.tagName)+'',e.scrollWidth-e.clientWidth+'px wide']);
 });
 const b=s.querySelector('.body'); if(b){const k=[...b.children]; const f=k[k.length-1], p=k[k.length-2]; out.gap.push([i+1,((f.getBoundingClientRect().top-p.getBoundingClientRect().bottom)/96).toFixed(2)+'in free above footer'])}
 if(s.classList.contains('cover')){const c=s.querySelector('.cta'), m=s.querySelector('.main'); out.gap.push([1,((c.getBoundingClientRect().top-m.getBoundingClientRect().bottom)/96).toFixed(2)+'in free above the call row'])}
});
out.over=out.over.slice(0,20); out.clip=out.clip.slice(0,20); return out})()"""
BANNED = [r'sounds?\s+human', r'\bam\s+i\s+real\b', r'\bthe\s+only\s+ai\s+built\s+for\b', r'\b100\s+free\s+minutes\b', r'\blocked\s+in\b',
          r'\bunlimited\b', r'\bmulti-?lingual\b', r'\bmoney[-\s]back\b', r'\bflat\b', r'\bone\s+call\s+or\s+a\s+thousand\b', r'\bfirst[-\s]ring\b',
          r'\btry\s+to\s+break\s+it\b', r'\btry\s+to\s+stump\s+it\b', r'\bapis?\b', r'\bintegrations?\b', r'\bwebhooks?\b', r'\bworkflows?\b',
          r'\bautomations?\b', r'\bagentic\b', r'\bplatforms?\b', r'\b17\s+years\b', r'(?<![\d-])911(?![\d-])', r'\bnine[-\s]one[-\s]one\b',
          r'\bscope\s+my\s+setup\b', r'\bscop(?:e|ed|es|ing)\b', r'\bshe\b', r'\bher\b', '\u2014', '\u2013', r'talk\s+time', r'per[-\s]minute',
          r'\bcents?\b', r'setup\s+fee', r'\$997', r'guarantee', r'\bconfirmed\b', r'strategy\s+call', r'\bretell\b', r'\btwilio\b', r'\bdispatcher\b']
MUST = ['$497 a month', 'month to month with no contract', 'includes putting every job in your crm', 'priced on the ava discovery call',
        '20-minute', '414-240-8930', 'aivoiceagency.ai/book', 'shane@aivoiceagency.ai', 'every job lands in your crm, your texts and your inbox',
        'claude partner network. we use claude to build and run every setup we make.']
ok = True
with sync_playwright() as p:
    b = p.chromium.launch()
    for look in ('paper', 'night'):
        pg = b.new_page()
        pg.goto((PDF / 'ava-overview.html').as_uri())
        pg.evaluate(f"document.body.className = '{look}'")
        pg.evaluate('async () => { await document.fonts.ready; return 1 }')
        pg.wait_for_timeout(600)
        res = pg.evaluate(JS)
        fonts = pg.evaluate("[...document.fonts].map(f => f.family + ' ' + f.weight + ':' + f.status)")
        imgs = pg.evaluate("[...document.images].filter(i => getComputedStyle(i).display !== 'none' && (!i.complete || !i.naturalWidth)).map(i => i.src)")
        pg.pdf(path=str(TMP / f'{look}.pdf'), prefer_css_page_size=True, print_background=True, outline=True, tagged=True)
        print(f'== {look}: overflow {res["over"]} | clipped {res["clip"]}')
        print('   space:', res['gap'])
        print('   fonts:', fonts, '| broken images:', imgs)
        if res['over'] or res['clip'] or imgs or any(not f.endswith(':loaded') for f in fonts):
            ok = False
        pg.close()
    b.close()

for look, dst in OUT.items():
    w = PdfWriter(clone_from=str(TMP / f'{look}.pdf'))
    ol = w._root_object.get('/Outlines')
    if ol is not None and '/First' in ol.get_object():
        first = ol.get_object()['/First'].get_object()
        first[NameObject('/Title')] = TextStringObject('Overview')
    w.add_metadata({'/Title': 'AI Voice Agency: what AVA does for your business', '/Author': 'AI Voice Agency', '/Creator': 'AI Voice Agency',
                    '/Producer': 'AI Voice Agency', '/Subject': 'AVA overview for local service businesses',
                    '/Keywords': 'AVA, AI Voice Agency, phone, calls, bookings, CRM, dashboard, auto attendant'})
    w.write(str(dst))
    doc = pymupdf.open(str(dst))
    print(f'== {dst.name}: {dst.stat().st_size} bytes, pages {doc.page_count}, title "{doc.metadata.get("title")}", author "{doc.metadata.get("author")}"')
    if doc.page_count != 8:
        ok = False
    print('   bookmarks:', [(t, pn) for _, t, pn in doc.get_toc()])
    fonts = set()
    for i in range(doc.page_count):
        for f in doc.get_page_fonts(i):
            fonts.add((f[3], f[2], f[1]))
    print('   fonts:', sorted(fonts))
    if any(t == 'Type3' or ext == 'n/a' for _, t, ext in fonts) or any('SpaceGrotesk' not in n.replace(' ', '') for n, _, _ in fonts):
        ok = False
        print('   FONT PROBLEM')
    uris, jumps = {}, {}
    for i, page in enumerate(doc, 1):
        for l in page.get_links():
            if l.get('uri'):
                uris[l['uri']] = uris.get(l['uri'], 0) + 1
            elif l.get('kind') == pymupdf.LINK_GOTO:
                jumps.setdefault(i, set()).add(l['page'] + 1)
            elif l.get('kind') == pymupdf.LINK_NAMED and str(l.get('nameddest', '')).startswith('s'):
                jumps.setdefault(i, set()).add(int(l['nameddest'][1:]))
    print('   web links:', uris)
    print('   jump links per page:', {k: sorted(v) for k, v in jumps.items()})
    if set(uris) - LINKS_OK:
        ok = False
        print('   UNEXPECTED LINKS', set(uris) - LINKS_OK)
    text = '\n'.join(page.get_text() for page in doc)
    flat = re.sub(r'\s+', ' ', text)
    low = flat.lower()
    hits = [rx for rx in BANNED if re.search(rx, flat, re.I)]
    phones = sorted(set('-'.join(m.groups()) for m in re.finditer(r'(?<!\d)\(?(\d{3})\)?[\s.-](\d{3})[\s.-](\d{4})(?!\d)', flat)))
    dollars = sorted(set(re.findall(r'\$\s?\d[\d,]*', flat)))
    missing = [m for m in MUST if m not in low]
    print(f'   words {len(flat.split())} | banned hits {hits} | phones {phones} | dollars {dollars} | missing {missing}')
    if hits or missing or phones != ['414-240-8930']:
        ok = False
    for pn in (1, 8):
        pix = doc[pn - 1].get_pixmap(dpi=200)
        img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)[:, :, :3][:, :, ::-1].copy()
        val, _, _ = cv2.QRCodeDetector().detectAndDecode(img)
        print(f'   QR page {pn} -> {val or "NOT DECODED"}')
        if val != BOOK:
            ok = False
    shots = []
    for i, page in enumerate(doc, 1):
        f = PAGES / f'{look}-p{i}.png'
        page.get_pixmap(dpi=110).save(str(f))
        shots.append(f)
    ims = [Image.open(s) for s in shots]
    tw, th = ims[0].width // 2, ims[0].height // 2
    sheet = Image.new('RGB', (tw * 4 + 50, th * 2 + 30), (128, 128, 128))
    for k, im in enumerate(ims):
        sheet.paste(im.resize((tw, th)), (10 + (k % 4) * (tw + 10), 10 + (k // 4) * (th + 10)))
    sheet.save(str(RUN / f'AVA-PDF-{look.upper()}-all-pages.png'))
    doc.close()
    shutil.copy2(dst, RUN / dst.name)
print('ALL OK' if ok else 'CHECK FAILED')
