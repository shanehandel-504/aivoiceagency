"""Signed caller for WF-ANI / WF-COMMIT.

Signing is identical to WF-RATE: HMAC-SHA256 over the exact request bytes, keyed with
RATE_SHARED_SECRET, hex, in x-retell-signature. The secret is read from rate_secret.txt
beside automation/rate-engine/ (never committed).

Usage:
  python aic_call.py ani  <json-file> [--shared|--none|--bad]
  python aic_call.py commit <json-file> [--shared|--none|--bad]
"""
import hashlib, hmac, io, json, os, sys, time, urllib.error, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
SECRET_PATH = os.path.join(HERE, '..', 'rate-engine', 'rate_secret.txt')
BASE = 'https://circulant.app.n8n.cloud/webhook/tools/'
ENDPOINTS = {'ani': BASE + 'ani-lookup', 'commit': BASE + 'commit-reservation'}

with io.open(SECRET_PATH, encoding='utf-8') as f:
    SECRET = f.read().strip()


def canon(body):
    return json.dumps(body, separators=(',', ':'), ensure_ascii=False)


def call(which, body, mode='hmac', bad_sig=False, timeout=60):
    url = ENDPOINTS[which]
    payload = canon(body).encode('utf-8')
    headers = {'Content-Type': 'application/json'}
    if mode == 'hmac':
        sig = hmac.new(SECRET.encode('utf-8'), payload, hashlib.sha256).hexdigest()
        if bad_sig:
            sig = 'deadbeef' + sig[8:]
        headers['x-retell-signature'] = sig
    elif mode == 'shared':
        headers['x-rate-secret'] = ('WRONG' + SECRET[5:]) if bad_sig else SECRET
    req = urllib.request.Request(url, data=payload, headers=headers, method='POST')
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            out = (r.status, json.loads(r.read().decode('utf-8')))
    except urllib.error.HTTPError as e:
        raw = e.read().decode('utf-8')
        try:
            out = (e.code, json.loads(raw))
        except Exception:
            out = (e.code, {'raw': raw[:400]})
    except Exception as e:
        out = (0, {'error': str(e)})
    return out[0], out[1], (time.time() - t0) * 1000.0


if __name__ == '__main__':
    which = sys.argv[1]
    with io.open(sys.argv[2], encoding='utf-8') as f:
        body = json.load(f)
    mode = 'shared' if '--shared' in sys.argv else ('none' if '--none' in sys.argv else 'hmac')
    st, resp, ms = call(which, body, mode=mode, bad_sig='--bad' in sys.argv)
    print('HTTP %s  %.0fms' % (st, ms))
    print(json.dumps(resp, indent=2))
