"""Signed caller for WF-RATE. Usage: python rate_call.py <json-file-with-args> [--shared]"""
import hashlib, hmac, io, json, os, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
URL = 'https://circulant.app.n8n.cloud/webhook/tools/rate-lookup'

with io.open(os.path.join(HERE, 'rate_secret.txt'), encoding='utf-8') as f:
    SECRET = f.read().strip()


def canon(body):
    return json.dumps(body, separators=(',', ':'), ensure_ascii=False)


def call(body, mode='hmac', bad_sig=False):
    payload = canon(body).encode('utf-8')
    headers = {'Content-Type': 'application/json'}
    if mode == 'hmac':
        sig = hmac.new(SECRET.encode('utf-8'), payload, hashlib.sha256).hexdigest()
        if bad_sig:
            sig = 'deadbeef' + sig[8:]
        headers['x-retell-signature'] = sig
    elif mode == 'shared':
        headers['x-rate-secret'] = ('WRONG' + SECRET[5:]) if bad_sig else SECRET
    # mode == 'none' -> no auth header
    req = urllib.request.Request(URL, data=payload, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        raw = e.read().decode('utf-8')
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {'raw': raw[:400]}
    except Exception as e:
        return 0, {'error': str(e)}


if __name__ == '__main__':
    with io.open(sys.argv[1], encoding='utf-8') as f:
        body = json.load(f)
    mode = 'shared' if '--shared' in sys.argv else ('none' if '--none' in sys.argv else 'hmac')
    st, resp = call(body, mode=mode, bad_sig='--bad' in sys.argv)
    print('HTTP', st)
    print(json.dumps(resp, indent=2))
