#!/usr/bin/env python3
# =============================================================================
# scripts/llms_full.py  ·  RECOVERY v1 · 2026-10-28
# -----------------------------------------------------------------------------
# Builds /llms-full.txt: the entity block, then the visible <main> text of
# /pricing, /ground-transportation, /wisconsin-limo and
# /blog/wisconsin-limo-crush, then the question and answers of every /answers/
# page in sitemap.xml. Every section is headed by its URL. The text is read
# from the repo's own HTML, so it says only what the pages say.
#
# USAGE   python scripts/llms_full.py            write llms-full.txt
#         python scripts/llms_full.py --dry-run  print the size, write nothing
# Standard library only. Output: UTF-8, LF, must stay under 200 KB.
# =============================================================================

import html as htmllib
import pathlib
import re
import subprocess
import sys
from html.parser import HTMLParser

HOST = "https://aivoiceagency.ai"
PAGES = [
    ("/pricing", "pricing/index.html"),
    ("/ground-transportation", "ground-transportation/index.html"),
    ("/wisconsin-limo", "wisconsin-limo/index.html"),
    ("/blog/wisconsin-limo-crush", "blog/wisconsin-limo-crush/index.html"),
]
LIMIT = 200 * 1024

ENTITY = """# AI Voice Agency — full text

AI Voice Agency builds AI phone agents for local service businesses. AVA answers every call in the company's name, books the job on the calendar, and sends the details to the owner right after the call. Built in Kewaskum, Wisconsin; set up for businesses nationwide. Any voice. Any business.

- Name: AI Voice Agency
- Site: https://aivoiceagency.ai
- Phone: 414-240-8930
- Email: shane@aivoiceagency.ai
- Mailing address: PO Box 241, Kewaskum, WI 53040
- Our limo and black car product is AI Chauffeur: https://aichauffeur.ai
- Facebook: https://www.facebook.com/AIVoiceAgency
- Instagram: https://www.instagram.com/aivoiceagency.ai
- TikTok: https://www.tiktok.com/@aivoiceagency.ai
- YouTube: https://www.youtube.com/@aivoiceagency
- LinkedIn: https://www.linkedin.com/company/aivoiceagency
- X: https://x.com/AIVoiceAgency
- Summary for AI engines: https://aivoiceagency.ai/llms.txt
"""

SKIP = {"script", "style", "svg", "noscript", "template", "button", "form", "audio", "video", "iframe"}
BLOCK = {"p", "div", "section", "article", "header", "footer", "aside", "ul", "ol", "li", "h1", "h2", "h3",
         "h4", "h5", "h6", "tr", "table", "dt", "dd", "dl", "blockquote", "figure", "figcaption", "details",
         "summary", "nav", "main", "hr"}
VOID = {"br", "hr", "img", "input", "meta", "link", "source", "wbr", "area", "base", "col", "embed", "track"}


class MainText(HTMLParser):
    """Visible text inside <main>, one line per block. Headings become '## ', list items '- '."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.in_main = 0
        self.skip = []  # stack of tags we are skipping inside
        self.lines = []
        self.cur = []
        self.prefix = ""
        self.classes = []  # class list stack (for callers)

    def flush(self):
        text = re.sub(r"\s+", " ", "".join(self.cur)).strip()
        text = re.sub(r" ([.,;:!?)])", r"\1", text)
        if text:
            self.lines.append(self.prefix + text)
        self.cur = []
        self.prefix = ""

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "main":
            self.in_main += 1
            return
        if not self.in_main:
            return
        if tag == "br" and not self.skip:
            self.cur.append(" ")
            return
        if not self.skip and re.search(r"\bhero-line\b", a.get("class") or ""):
            self.cur.append(" ")  # display:block line spans in a heading read as one sentence
        if self.skip:
            if tag not in VOID:
                self.skip.append(tag)
            return
        hidden = a.get("aria-hidden") == "true" or "hidden" in a or "visually-hidden" in (a.get("class") or "")
        if tag in SKIP or hidden:
            if tag not in VOID:
                self.skip.append(tag)
            return
        if tag in BLOCK:
            self.flush()
            if tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
                self.prefix = "## "
            elif tag == "li":
                self.prefix = "- "

    def handle_endtag(self, tag):
        if tag == "main":
            self.flush()
            self.in_main -= 1
            return
        if not self.in_main:
            return
        if self.skip:
            if self.skip[-1] == tag:
                self.skip.pop()
            return
        if tag in BLOCK:
            self.flush()

    def handle_data(self, data):
        if self.in_main and not self.skip:
            self.cur.append(data)


def main_lines(src):
    p = MainText()
    p.feed(src)
    p.flush()
    return p.lines


def answer_lines(src):
    """Question (h1), short answer, the answer body and the page's own Q and A. No CTA rows."""
    m = re.search(r"<main>(.*?)</main>", src, re.S)
    body = m.group(1)
    for cls in ("ans-cta", "ans-links", "ans-reviewed"):
        body = re.sub(r'<p class="%s">.*?</p>' % cls, "", body, flags=re.S)
    body = re.sub(r"<a class=\"cx-btn[^\"]*\"[^>]*>.*?</a>", "", body, flags=re.S)
    return main_lines("<main>" + body + "</main>")


def sitemap_answers(root):
    xml = re.sub(r"<!--.*?-->", "", (root / "sitemap.xml").read_text(encoding="utf-8"), flags=re.S)
    out = []
    for loc in re.findall(r"<loc>\s*([^<]+?)\s*</loc>", xml):
        path = loc.replace(HOST, "")
        if path.startswith("/answers/") and path != "/answers/":
            out.append((path, path[1:] + "index.html"))
    return out


def build(root):
    parts = [ENTITY.strip(), ""]
    for url, f in PAGES:
        lines = main_lines((root / f).read_text(encoding="utf-8"))
        parts += ["", "=" * 72, HOST + url, "=" * 72, ""] + lines
    answers = sitemap_answers(root)
    parts += ["", "=" * 72, "ANSWERS — " + HOST + "/answers/", "=" * 72]
    for url, f in answers:
        parts += ["", "-" * 72, HOST + url, "-" * 72, ""] + answer_lines((root / f).read_text(encoding="utf-8"))
    text = "\n".join(parts).rstrip() + "\n"
    return htmllib.unescape(text), len(answers)


def main():
    args = sys.argv[1:]
    if any(a != "--dry-run" for a in args):
        print("unknown argument (use --dry-run)")
        return 2
    root = pathlib.Path(subprocess.run(["git", "rev-parse", "--show-toplevel"], capture_output=True,
                                       text=True, check=True).stdout.strip())
    text, n = build(root)
    size = len(text.encode("utf-8"))
    print(f"llms-full.txt: {size} bytes ({size / 1024:.1f} KB), {len(PAGES)} pages + {n} answers")
    if size >= LIMIT:
        print("REFUSED: 200 KB or more")
        return 1
    if "--dry-run" not in args:
        (root / "llms-full.txt").write_bytes(text.encode("utf-8"))
        print("written llms-full.txt")
    return 0


if __name__ == "__main__":
    sys.exit(main())
