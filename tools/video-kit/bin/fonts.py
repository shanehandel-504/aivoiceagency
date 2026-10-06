#!/usr/bin/env python3
"""fonts.py - put Space Grotesk 2.0.0 and JetBrains Mono 2.304 into tools/video-kit/fonts/.

bootstrap.sh calls this. A release zip is downloaded only when a file it provides is absent.
The zip is checked against a pinned SHA-256, then only woff2 + ttf + OFL.txt are kept.
Both families are SIL Open Font License 1.1; the licence travels with the files.

  python3 fonts.py            install whatever is absent
  python3 fonts.py --check    report only, download nothing

Prints one line per family:  HAVE|MISSING <family> <detail>     Exit 0 when both are present.
"""
import hashlib
import io
import os
import subprocess
import sys
import tempfile
import urllib.request
import zipfile

KIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(KIT, 'fonts')

# zip member -> file name in fonts/<family>/. The variable files lose the [wght] in their names
# because square brackets are glob characters in a shell and need escaping in a URL.
FAMILIES = [
    {
        'name': 'space-grotesk',
        'label': 'Space Grotesk 2.0.0',
        'url': 'https://github.com/floriankarsten/space-grotesk/releases/download/2.0.0/SpaceGrotesk-2.0.0.zip',
        'sha256': '53b415577d4139248555300710bea0d268c7a5be67b93de53b716a9736cabffd',
        'files': {
            'SpaceGrotesk-2.0.0/OFL.txt': 'OFL.txt',
            # variable, weight 300-700: what the templates load (600 exists only here)
            'SpaceGrotesk-2.0.0/woff2/SpaceGrotesk[wght].woff2': 'SpaceGrotesk-VF.woff2',
            'SpaceGrotesk-2.0.0/ttf/SpaceGrotesk[wght].ttf': 'SpaceGrotesk-VF.ttf',
            # static, one weight per file: for ffmpeg drawtext and anything that cannot read an axis
            'SpaceGrotesk-2.0.0/woff2/static/SpaceGrotesk-Light.woff2': 'SpaceGrotesk-Light.woff2',
            'SpaceGrotesk-2.0.0/woff2/static/SpaceGrotesk-Regular.woff2': 'SpaceGrotesk-Regular.woff2',
            'SpaceGrotesk-2.0.0/woff2/static/SpaceGrotesk-Medium.woff2': 'SpaceGrotesk-Medium.woff2',
            'SpaceGrotesk-2.0.0/woff2/static/SpaceGrotesk-Bold.woff2': 'SpaceGrotesk-Bold.woff2',
            'SpaceGrotesk-2.0.0/ttf/static/SpaceGrotesk-Light.ttf': 'SpaceGrotesk-Light.ttf',
            'SpaceGrotesk-2.0.0/ttf/static/SpaceGrotesk-Regular.ttf': 'SpaceGrotesk-Regular.ttf',
            'SpaceGrotesk-2.0.0/ttf/static/SpaceGrotesk-Medium.ttf': 'SpaceGrotesk-Medium.ttf',
            'SpaceGrotesk-2.0.0/ttf/static/SpaceGrotesk-Bold.ttf': 'SpaceGrotesk-Bold.ttf',
        },
    },
    {
        'name': 'jetbrains-mono',
        'label': 'JetBrains Mono 2.304',
        'url': 'https://github.com/JetBrains/JetBrainsMono/releases/download/v2.304/JetBrainsMono-2.304.zip',
        'sha256': '6f6376c6ed2960ea8a963cd7387ec9d76e3f629125bc33d1fdcd7eb7012f7bbf',
        'files': {
            'OFL.txt': 'OFL.txt',
            # upright 400 / 500 / 600 / 700: every weight the micro layer uses
            'fonts/webfonts/JetBrainsMono-Regular.woff2': 'JetBrainsMono-Regular.woff2',
            'fonts/webfonts/JetBrainsMono-Medium.woff2': 'JetBrainsMono-Medium.woff2',
            'fonts/webfonts/JetBrainsMono-SemiBold.woff2': 'JetBrainsMono-SemiBold.woff2',
            'fonts/webfonts/JetBrainsMono-Bold.woff2': 'JetBrainsMono-Bold.woff2',
            'fonts/ttf/JetBrainsMono-Regular.ttf': 'JetBrainsMono-Regular.ttf',
            'fonts/ttf/JetBrainsMono-Medium.ttf': 'JetBrainsMono-Medium.ttf',
            'fonts/ttf/JetBrainsMono-SemiBold.ttf': 'JetBrainsMono-SemiBold.ttf',
            'fonts/ttf/JetBrainsMono-Bold.ttf': 'JetBrainsMono-Bold.ttf',
        },
    },
]


def absent(fam):
    d = os.path.join(FONTS, fam['name'])
    return [n for n in fam['files'].values()
            if not os.path.isfile(os.path.join(d, n)) or os.path.getsize(os.path.join(d, n)) == 0]


def download(url):
    """Return the zip bytes. urllib first; curl second, for machines where Python has no CA store."""
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'video-kit-bootstrap'})
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.read()
    except Exception as first:
        tmp = tempfile.NamedTemporaryFile(suffix='.zip', delete=False)
        tmp.close()
        try:
            subprocess.run(['curl', '-fsSL', '-o', tmp.name, url], check=True, timeout=300)
            with open(tmp.name, 'rb') as fh:
                return fh.read()
        except Exception as second:
            raise RuntimeError(f'download failed ({first}; curl: {second})')
        finally:
            try:
                os.unlink(tmp.name)
            except OSError:
                pass


def install(fam):
    blob = download(fam['url'])
    got = hashlib.sha256(blob).hexdigest()
    if got != fam['sha256']:
        raise RuntimeError(f'sha256 mismatch for {os.path.basename(fam["url"])}: got {got}')
    d = os.path.join(FONTS, fam['name'])
    os.makedirs(d, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(blob)) as z:
        for member, name in fam['files'].items():
            data = z.read(member)            # exact member names only: nothing else leaves the zip
            part = os.path.join(d, name + '.part')
            with open(part, 'wb') as fh:
                fh.write(data)
            os.replace(part, os.path.join(d, name))


def main():
    check_only = '--check' in sys.argv[1:]
    bad = 0
    for fam in FAMILIES:
        gone = absent(fam)
        note = ''
        if gone and not check_only:
            try:
                install(fam)
                note = ' (downloaded now)'
            except Exception as e:
                print(f'MISSING {fam["name"]} {fam["label"]}: {e}')
                bad += 1
                continue
            gone = absent(fam)
        if gone:
            print(f'MISSING {fam["name"]} {fam["label"]}: {len(gone)} of {len(fam["files"])} files absent')
            bad += 1
        else:
            print(f'HAVE {fam["name"]} {fam["label"]} - {len(fam["files"])} files, woff2 + ttf + OFL.txt{note}')
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
