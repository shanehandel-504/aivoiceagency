# build.py · the AVA sales PDF (run ava-try-pdf-polish, Nov 24 2026).
# One HTML source (pdf/ava-overview.html), two looks set on <body>: paper (default) and night.
# Framework: the AI Chauffeur PDF studio v3 (route sheet: tab rail, one column, Example cards).
# Words: a words file of "ID | text" lines (ID* = approved or recorded). Facts: FACT-SHEET v3.6.
# Usage: python -X utf8 tools/ava-pdf/build.py <words file>
import sys, re, html, shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
OUT = REPO / 'pdf'
WORDS = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / 'WORDS.txt'

TEL = 'tel:+14142408930'
BOOK = 'https://aivoiceagency.ai/book/'
SITE = 'https://aivoiceagency.ai/'
MAIL = 'mailto:shane@aivoiceagency.ai'
HEAR = 'https://aivoiceagency.ai/#plumbing'
N = 8


def load(p):
    d = {}
    for line in p.read_text(encoding='utf-8').splitlines():
        if line.startswith('#') or ' | ' not in line:
            continue
        k, v = line.split(' | ', 1)
        d[k.strip().rstrip('*')] = v.strip()
    for k, v in list(d.items()):
        if v.startswith('@') and v[1:] in d:
            d[k] = d[v[1:]]
    return d


W = load(WORDS)
USED = set()


def t(k):
    USED.add(k)
    s = html.escape(W[k], quote=False)
    return s.replace("'", '’')


def parts(k, n=None):
    USED.add(k)
    return [html.escape(x.strip(), quote=False).replace("'", '’') for x in W[k].split(' | ')]


def kv(k):
    USED.add(k)
    a, b = W[k].split(': ', 1)
    return html.escape(a, quote=False), html.escape(b, quote=False).replace("'", '’')


def rail(n):
    items = ''.join(f'<li{" class=\"on\"" if i == n else ""}><a href="#s{i}">{t(f"PDF.tab.{i}")}</a></li>' for i in range(1, N + 1))
    return f'''<aside class="rail">
    <a class="logo" href="#s1"><span class="wm">AI Voice Agency</span></a>
    <nav aria-label="Sections"><ol class="tabs">{items}</ol></nav>
    <p class="pg">{n} / {N}</p>
  </aside>'''


def foot2():
    return f'''<footer class="foot2">
      <a href="{TEL}">{t('PDF.foot.call')}<span class="n">414-240-8930</span></a>
      <a href="{BOOK}"><span class="u">aivoiceagency.ai/book</span></a>
      <a href="{SITE}"><span class="u">aivoiceagency.ai</span></a>
    </footer>'''


def sec(n, name, aka, inner, foot=None, cls=''):
    aka_html = f'<span class="aka">{t(aka)}</span>' if aka else ''
    return f'''<section class="page sec{(' ' + cls) if cls else ''}" id="s{n}">
  {rail(n)}
  <div class="body">
    <header class="top"><h2>{t(name)}</h2>{aka_html}</header>
    {inner}
    {foot if foot is not None else foot2()}
  </div>
</section>'''


def ticket(wide=False):
    rows = ''.join('<dt>{}</dt><dd>{}</dd>'.format(*kv('PDF.tk.' + k)) for k in ('problem', 'customer', 'address', 'feequoted', 'calendar', 'text'))
    return f'''<div class="ticket{' wide' if wide else ''}">
        <div class="st"><span>{t('PDF.tk.biz')}</span><span class="tag ok">{t('PDF.tk.tag')}</span></div>
        <dl>{rows}</dl>
      </div>'''


def qr(cls=''):
    return (f'<img class="qr-paper {cls}" src="assets/qr-paper.png" alt="QR code that opens aivoiceagency.ai/book">'
            f'<img class="qr-night {cls}" src="assets/qr-night.png" alt="QR code that opens aivoiceagency.ai/book">')


def cover():
    stops = ''
    for i in range(1, 5):
        cls = ' class="booked"' if i == 4 else ''
        stops += f'<li{cls}><b>{t(f"PDF.1.s{i}.b")}</b><span>{t(f"PDF.1.s{i}.s")}</span></li>'
    inside = ''.join(f'<li><a href="#s{p}">{t(f"PDF.1.inside.{p}")}<span class="p">{p}</span></a></li>' for p in range(2, N + 1))
    return f'''<section class="page cover" id="s1">
  <div class="head">
    <span class="wm big">AI Voice Agency</span>
    <p class="for">{t('PDF.1.corner')}</p>
  </div>
  <h1>{t('PDF.1.h1')}</h1>
  <p class="lead">{t('PDF.1.lead.a')} {t('PDF.1.lead.b')}</p>
  <div class="main">
    <div class="route">
      <p class="kicker">{t('PDF.1.kicker')}</p>
      <ol class="stops">{stops}</ol>
      <div class="handoff"><b>{t('PDF.1.box.b')}</b><span>{t('PDF.1.box.s')}</span></div>
    </div>
    <div class="side">
      {ticket()}
      <p class="tcap">{t('PDF.1.ticket.cap')}</p>
      <div class="inside"><p>{t('PDF.1.inside')}</p><ol>{inside}</ol></div>
    </div>
  </div>
  <div class="cta">
    <a href="{TEL}"><p class="lab">{t('PDF.1.cta1.lab')}</p><p class="big call">414-240-8930</p><p class="note">{t('PDF.1.cta1.note')}</p></a>
    <a href="{BOOK}" class="qrrow">{qr()}<span><p class="lab">{t('PDF.1.cta2.lab')}</p><p class="url">aivoiceagency.ai/book</p><p class="note">{t('PDF.1.cta2.note')}</p></span></a>
    <div><a href="{SITE}"><p class="lab">{t('PDF.1.cta3.lab')}</p><p class="url">aivoiceagency.ai</p></a><a class="note mail" href="{MAIL}">{t('PDF.1.cta3.note')}</a></div>
  </div>
  <div class="foot"><span>{t('PDF.1.foot')}</span><span class="pg">1 / {N}</span></div>
</section>'''


def talk():
    out = ''
    for i in range(1, 6):
        k = f'PDF.2.talk.{i}'
        who, line = W[k].split(': ', 1)
        USED.add(k)
        a = ' class="a"' if who == 'AVA' else ''
        out += f'<li{a}><i>{html.escape(who)}</i>{html.escape(line, quote=False).replace(chr(39), chr(0x2019))}</li>'
    return out


def p2():
    rows = ''.join(f'<div class="row"><p class="big">{t(f"PDF.2.r{i}.big")}</p><p class="sm">{t(f"PDF.2.r{i}.sm")}</p></div>' for i in range(1, 5))
    facts = ''.join(f'<li><b>{t(f"PDF.2.f{i}.b")}</b><span>{t(f"PDF.2.f{i}.s")}</span></li>' for i in range(1, 4))
    inner = f'''<div class="ledger">{rows}</div>
    <div class="card">
      <p class="ck">{t('PDF.2.ex.ck')}</p>
      <p class="ct">{t('PDF.2.ex.ct')}</p>
      <div class="callcard">
        <div>
          <ol class="talk">{talk()}</ol>
          <a class="hear" href="{HEAR}">{t('PDF.2.ex.hear')}</a>
        </div>
        <div class="bookedcard">
          <p class="bl">{t('PDF.tk.tag')}</p>
          <p class="bb">{t('PDF.tk.booked.big')}</p>
          <p class="bs">{t('PDF.tk.booked.small')}</p>
          <p class="sf">{t('PDF.2.ex.sf')}</p>
        </div>
      </div>
    </div>
    <p class="madeup">{t('PDF.2.madeup')}</p>
    <ul class="facts">{facts}</ul>'''
    return sec(2, 'PDF.2.name', None, inner)


def pts(prefix, n=3, cls='three'):
    lis = ''.join(f'<li><b>{t(f"{prefix}.p{i}.b")}</b><span>{t(f"{prefix}.p{i}.s")}</span></li>' for i in range(1, n + 1))
    return f'<ul class="pts {cls}">{lis}</ul>'


def p3():
    fan = ''
    for i in range(1, 6):
        d, q = kv(f'PDF.3.fan.{i}')
        fan += f'<li><i></i><b>{d}</b><span>“{q}”</span></li>'
    langs = W['PDF.3.lang.list'].split(', ')
    USED.add('PDF.3.lang.list')
    if ' and more' in langs[-1]:
        head_, tail_ = langs[-1].split(' and more', 1)
        langs = langs[:-1] + [head_, 'and more' + tail_]
    last = langs[-1]
    ll = ''.join(f'<li>{html.escape(x)}</li>' for x in langs[:-1]) + f'<li class="more">{html.escape(last)}</li>'
    inner = f'''<p class="hl">{t('PDF.3.hl')}</p>
    <p class="lead">{t('PDF.3.lead')}</p>
    {pts('PDF.3')}
    <div class="card">
      <p class="ck">{t('PDF.2.ex.ck')}</p>
      <p class="ct">{t('PDF.3.ex.ct')}</p>
      <div class="fan">
        <div class="src"><b>{t('PDF.3.src.b')}</b><span>{t('PDF.3.src.s')}</span></div>
        <div class="trunk"></div>
        <ul>{fan}</ul>
      </div>
      <p class="cardfoot">{t('PDF.3.cardfoot')}</p>
    </div>
    <div class="langs">
      <div><b>{t('PDF.3.lang.b')}</b><p>{t('PDF.3.lang.p')}</p></div>
      <ul>{ll}</ul>
    </div>
    <p class="opt">{t('PDF.3.opt')}</p>'''
    return sec(3, 'PDF.3.name', 'PDF.3.aka', inner)


def p4():
    rows = ''
    for i in range(1, 4):
        when, what, tag, res = parts(f'PDF.4.row.{i}')
        k = 'ok' if tag == 'BOOKED' else ''
        rows += f'<div class="r"><span class="wn">{when}</span><span class="wh">{what}</span><span class="tag {k}">{tag}</span><span class="rs">{res}</span></div>'
    inner = f'''<p class="hl">{t('PDF.4.hl')}</p>
    <p class="lead">{t('PDF.4.lead')}</p>
    {pts('PDF.4')}
    <div class="card roomy">
      <p class="ck">{t('PDF.2.ex.ck')}</p>
      <p class="ct">{t('PDF.4.ex.ct')}</p>
      <div class="rows">{rows}</div>
    </div>
    <p class="oneline">{t('PDF.4.oneline')}</p>
    <p class="opt">{t('PDF.4.opt')}</p>'''
    return sec(4, 'PDF.4.name', None, inner, cls='airy')


def p5():
    steps = ''
    for i in range(1, 4):
        steps += f'<li><b>{t(f"PDF.5.st.{i}.b")}</b><span>{t(f"PDF.5.st.{i}.s")}</span></li>'
    inner = f'''<p class="hl">{t('PDF.5.hl')}</p>
    <p class="lead">{t('PDF.5.lead')}</p>
    {pts('PDF.5')}
    <div class="card roomy">
      <p class="ck">{t('PDF.2.ex.ck')}</p>
      <p class="ct">{t('PDF.5.ex.ct')}</p>
      <ol class="route3">{steps}</ol>
      {ticket(wide=True)}
    </div>
    <p class="promise">{t('PDF.5.promise')}</p>'''
    return sec(5, 'PDF.5.name', 'PDF.5.aka', inner, cls='airy')


def dash():
    rows = ''
    for i in range(1, 5):
        when, who, what, tag = parts(f'PDF.6.dash.row.{i}')
        k = 'ok' if tag == 'BOOKED' else ''
        on = ' on' if i == 1 else ''
        rows += f'<div class="dr{on}"><span class="dw">{when}</span><span class="dc">{who}</span><span class="dt">{what}</span><span class="tag {k}">{tag}</span></div>'
    tr = ''
    for i in range(1, 6):
        who, line = W[f'PDF.2.talk.{i}'].split(': ', 1)
        a = ' class="a"' if who == 'AVA' else ''
        tr += f'<li{a}><i>{html.escape(who)}</i>{html.escape(line, quote=False).replace(chr(39), chr(0x2019))}</li>'
    bars = ''.join(f'<i style="height:{h}px"></i>' for h in (5, 9, 13, 7, 11, 15, 9, 6, 12, 16, 10, 7, 13, 9, 5, 11, 14, 8, 6, 10, 13, 7, 9, 12, 6, 4, 8, 11, 6, 9))
    k1, k2, k3 = (parts(f'PDF.6.dash.n{i}') for i in range(1, 4))
    return f'''<div class="dash">
      <div class="dtop"><span class="dname">{t('PDF.tk.biz')}</span><span class="dlabel">{t('PDF.6.dash.label')}</span></div>
      <div class="dkpi">
        <div><p class="k">{k1[0]}</p><p class="v">{k1[1]}</p></div>
        <div><p class="k">{k2[0]}</p><p class="v ok">{k2[1]}</p></div>
        <div><p class="k">{k3[0]}</p><p class="v">{k3[1]}</p></div>
        <p class="week">{t('PDF.6.dash.week')}</p>
      </div>
      <div class="dgrid">
        <div class="dlist">{rows}</div>
        <div class="dcall">
          <p class="dct">{kv('PDF.tk.problem')[1]}</p>
          <p class="dcm">{kv('PDF.tk.calendar')[1]}<span>1:10</span></p>
          <p class="dsl">{t('PDF.6.dash.rec')}</p>
          <div class="player"><span class="play"></span><span class="wave">{bars}</span><span class="dur">1:10</span></div>
          <p class="dsl">{t('PDF.6.dash.tr')}</p>
          <ol class="talk mini">{tr}</ol>
        </div>
      </div>
      <div class="dfoot"><span class="dl">{t('PDF.6.dash.dl')}</span></div>
    </div>'''


def p6():
    notes = ''.join(f'<li><b>{t(f"PDF.6.n{i}.b")}</b><span>{t(f"PDF.6.n{i}.s")}</span></li>' for i in range(1, 4))
    inner = f'''<p class="hl">{t('PDF.6.hl')}</p>
    <p class="lead">{t('PDF.6.lead')}</p>
    {dash()}
    <ul class="notes">{notes}</ul>'''
    return sec(6, 'PDF.6.name', 'PDF.6.aka', inner)


def p7():
    def row(qs):
        s = ''
        for i, q in enumerate(qs, 1):
            mid = ' mid' if i == 2 else ''
            s += f'<div><p class="sl">{t(f"PDF.7.st.{i}.l")}</p><p class="sq{mid}">{t(q)}</p></div>'
        return s
    one = row(['PDF.7.st.1.q', 'PDF.7.st.2.q', 'PDF.7.st.3.q'])
    two = row(['PDF.7.st2.1.q', 'PDF.7.st.2.q', 'PDF.7.st2.3.q'])
    inner = f'''<p class="hl">{t('PDF.7.hl')}</p>
    <p class="lead">{t('PDF.7.lead')}</p>
    {pts('PDF.7')}
    <div class="card roomy">
      <p class="ck">{t('PDF.2.ex.ck')}</p>
      <p class="ct">{t('PDF.7.ex.ct')}</p>
      <div class="steps">{one}</div>
      <div class="alt"><div class="steps">{two}</div></div>
    </div>
    <p class="demo">{t('DEMO')}</p>
    <p class="oneline">{t('PDF.7.oneline')}</p>
    <p class="opt">{t('PDF.7.opt')}</p>'''
    return sec(7, 'PDF.7.name', 'PDF.7.aka', inner, cls='airy')


def p8():
    steps = ''.join(f'<li><b>{t(f"PDF.8.s{i}.b")}</b><span>{t(f"PDF.8.s{i}.s")}</span></li>' for i in range(1, 5))
    yrs = ''
    for i in range(1, 4):
        num, lb = parts(f'PDF.8.y{i}')
        yrs += f'<div><p class="num">{num}</p><p class="lb">{lb}</p></div>'
    inner = f'''<p class="hl">{t('PDF.8.hl')}</p>
    <p class="lead">{t('PDF.8.lead')}</p>
    <ol class="setup">{steps}</ol>
    <div class="price">
      <p class="pbig">$497<span>a month</span></p>
      <div><p class="pline">{t('PDF.8.price')}</p><p class="pext">{t('PDF.8.extras')}</p></div>
    </div>
    <div class="who">
      <p class="ck">{t('PDF.8.who')}</p>
      <div class="yrs">{yrs}</div>
      <p class="one">{t('PDF.8.one')}</p>
    </div>'''
    foot = f'''<div class="cta2">
      <a href="{TEL}"><p class="lab">{t('PDF.8.cta.lab')}</p><p class="big">414-240-8930</p>{('<p class="note">' + t('PDF.8.cta.note') + '</p>') if 'PDF.8.cta.note' in W else ''}</a>
      <ul class="links">
        <li><a href="{BOOK}"><span class="lab">{t('PDF.8.l1')}</span><span class="url">aivoiceagency.ai/book</span></a></li>
        <li><a href="{SITE}"><span class="lab">{t('PDF.8.l2')}</span><span class="url">aivoiceagency.ai</span></a></li>
        <li><a href="{MAIL}"><span class="lab">{t('PDF.8.l3')}</span><span class="url">shane@aivoiceagency.ai</span></a></li>
      </ul>
      <a class="qr" href="{BOOK}">{qr()}<p>{t('PDF.8.qr')}</p></a>
    </div>'''
    return sec(8, 'PDF.8.name', None, inner, foot)


def build():
    pages = [cover(), p2(), p3(), p4(), p5(), p6(), p7(), p8()]
    doc = f'''<!doctype html>
<!-- The AVA sales PDF, one source for both looks. Built by tools/ava-pdf/build.py from the run's words file.
     Printed by tools/ava-pdf/print_check.py to ai-voice-agency-overview.pdf (paper) and ai-voice-agency-overview-night.pdf (night). -->
<html lang="en"><head><meta charset="utf-8">
<title>AI Voice Agency: what AVA does for your business</title>
<meta name="robots" content="noindex, nofollow">
<meta name="author" content="AI Voice Agency">
<meta name="description" content="What AVA does for a local service business: answers every call, quotes your prices, books the job and puts it in your CRM.">
<link rel="stylesheet" href="overview.css"></head>
<body class="paper">
{chr(10).join(pages)}
</body></html>'''
    OUT.mkdir(exist_ok=True)
    (OUT / 'ava-overview.html').write_text(doc, encoding='utf-8')
    missing = sorted(k for k in W if k.startswith('PDF.') and k not in USED)
    print('built pdf/ava-overview.html', len(doc), 'bytes; words file lines not placed:', missing)


if __name__ == '__main__':
    build()
