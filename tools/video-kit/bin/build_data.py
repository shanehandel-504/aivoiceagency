#!/usr/bin/env python3
"""build_data.py - job.json -> data.json, call_cut.wav and events.json for one call video.

Generalized from tools/aic-video/build_data.py. Nothing about a call is written in this file:
the edit list, the trip-sheet fields, the callouts and the events all come from job.json.

  python3 build_data.py job.json              outputs land in the current folder
  python3 build_data.py job.json --out DIR    outputs land in DIR

job.json (docs/job.example.json is the video-01 cut, ready to run):
  brand      "ava" | "aic"
  call       { "words": path, "audio": path, "pickup": seconds, "ping": seconds }
             words is tx.py's words.json [{who,w,s,e}], or a calls/<id>.json with turns, pickup, ping
  segments   [[in, out], ...]    the edit list: source seconds kept, in order
  endSeconds seconds of end card after the call (default 3.0)        fps  (default 30)
  fix        { "940.": "9:40." }  caption fixes, whole word to whole word
  fields     [{ "k": "PICKUP", "v": "O'Hare, tonight", "at": TIME }, ...]     trip-sheet rows
  callouts   [{ "txt": "YOUR RATES, QUOTED", "from": TIME, "to": TIME }, ...]
  events     { "booked": TIME, "ping": TIME, any other name: TIME }
  display    { "biz", "answeredBy", "speakers": {"a","c"}, "tag", "sheet": {"title","open","booked"} }
  cover      { "color", "headline", "img" }, or false for no cover
  endcard    "sell" | "reach" | "none"        end  { words to override on the card }

TIME is one of:
  12.5                the second in the original call. It must fall inside a kept segment.
  "pickup" | "booked" | "ping" | "callEnd"     the event of that name
  [TIME, 0.15]        that time, plus seconds added after the cut is made
  {"vt": 12.5}        a second in the finished video, used as it is
Paths are relative to the folder job.json is in.

Writes:  data.json (what the overlay reads) / call_cut.wav (the cut call, 48 kHz mono) /
         events.json (pickup, booked, ping, callEnd, total: what assemble.sh times the sound to)
The data.json shape is the video-01 shape, with brand, display, cover, endcard and end added.
"""
import argparse
import json
import os
import subprocess
import sys
import wave

import numpy as np


def die(msg):
    sys.exit('build_data.py: ' + msg)


def load_call(call, base):
    """-> (turns, pickup, ping). Accepts tx.py's flat word list or a calls/<id>.json with turns."""
    if not call.get('words'):
        die('job.json needs call.words: the word timings (tx.py writes them)')
    raw = json.load(open(os.path.join(base, call['words']), encoding='utf-8'))
    if isinstance(raw, list):                       # tx.py: one run of the same speaker is one turn
        turns = []
        for w in raw:
            if not turns or turns[-1]['who'] != w['who']:
                turns.append({'who': w['who'], 'words': []})
            turns[-1]['words'].append({'w': w['w'], 's': w['s'], 'e': w['e']})
        raw = {'turns': turns}
    pickup = call.get('pickup', raw.get('pickup'))
    if pickup is None:
        die('no pickup time: set call.pickup to the second the call is answered')
    return raw['turns'], float(pickup), call.get('ping', raw.get('ping'))


def main():
    ap = argparse.ArgumentParser(description='Build data.json, call_cut.wav and events.json from a job.json.')
    ap.add_argument('job', nargs='?', default='job.json')
    ap.add_argument('--out', default='.')
    a = ap.parse_args()
    if not os.path.isfile(a.job):
        die(f'no job file at {a.job}  (docs/job.example.json is a working one)')
    job = json.load(open(a.job, encoding='utf-8'))
    base = os.path.dirname(os.path.abspath(a.job))
    out = os.path.abspath(a.out)
    os.makedirs(out, exist_ok=True)

    call = job.get('call') or {}
    turns, PICK, PING = load_call(call, base)
    SEG = [(float(s[0]), float(s[1])) for s in job.get('segments') or []]
    if not SEG:
        die('job.json needs segments: [[in, out], ...] in source seconds')
    for i, (s0, s1) in enumerate(SEG):
        if s1 <= s0:
            die(f'segment {i} runs backwards: [{s0}, {s1}]')
        if i and s0 < SEG[i - 1][1]:
            die(f'segment {i} starts at {s0}, before segment {i - 1} ends at {SEG[i - 1][1]}')
    END = float(job.get('endSeconds', 3.0))
    FPS = int(job.get('fps', 30))

    # video-time offset of every segment
    vt0, acc = [], 0.0
    for s0, s1 in SEG:
        vt0.append(acc)
        acc += s1 - s0
    CALL_END, TOTAL = acc, acc + END

    def st2vt(st):
        for (s0, s1), o in zip(SEG, vt0):
            if s0 - 1e-6 <= st <= s1 + 1e-6:
                return o + (st - s0)
        return None

    events = {}

    def when(spec, what):
        """A TIME from job.json -> seconds in the finished video, to the millisecond."""
        plus = 0.0
        if isinstance(spec, list):
            if len(spec) != 2:
                die(f'{what}: a time list is [TIME, seconds to add], got {spec}')
            spec, plus = spec[0], float(spec[1])
        if isinstance(spec, dict):
            if 'vt' not in spec:
                die(f'{what}: a time object is {{"vt": seconds}}, got {spec}')
            return round(float(spec['vt']) + plus, 3)
        if isinstance(spec, str):
            if spec not in events:
                die(f'{what}: no event named "{spec}" yet (known: {", ".join(events) or "none"})')
            return round(events[spec] + plus, 3)
        if isinstance(spec, (int, float)):
            v = st2vt(float(spec))
            if v is None:
                die(f'{what}: {spec} s is not inside a kept segment. A detail said in a cut part needs a '
                    f'time that is kept: use [TIME, seconds] to stage it after one, e.g. [{SEG[0][0]}, 0.12]')
            return round(round(v, 3) + plus, 3)
        die(f'{what}: cannot read the time {spec!r}')

    # events: pickup, callEnd and total first, then whatever the job names (booked, ping, ...)
    jev = dict(job.get('events') or {})
    if 'pickup' in jev:
        events['pickup'] = when(jev.pop('pickup'), 'events.pickup')
    else:
        v = st2vt(PICK)
        if v is None:
            die(f'the pickup ({PICK} s) is cut out. Start the first segment on the last ring before pickup, '
                'or set events.pickup to {"vt": 0} for a film that opens mid-call')
        events['pickup'] = round(v, 3)
    events['callEnd'] = round(CALL_END, 3)
    events['total'] = round(TOTAL, 3)
    if 'ping' not in jev and PING is not None and st2vt(float(PING)) is not None:
        jev['ping'] = float(PING)
    for name, spec in jev.items():
        events[name] = when(spec, f'events.{name}')
    order = ['pickup', 'booked', 'ping']
    events = {k: events[k] for k in order + [k for k in events if k not in order + ['callEnd', 'total']] + ['callEnd', 'total']
              if k in events}

    # captions: one block per turn per segment, words light up as said
    FIX = job.get('fix') or {}
    caps = []
    for t in turns:
        ws, i, W = [], 0, t['words']
        while i < len(W):
            w = dict(W[i])
            # whisper splits O'Hare into "O" + "'Hare": a piece that starts with an apostrophe joins the word before
            if i + 1 < len(W) and W[i + 1]['w'][:1] in ("'", '’'):
                w = {'w': W[i]['w'] + W[i + 1]['w'], 's': W[i]['s'], 'e': W[i + 1]['e']}
                i += 1
            w['w'] = FIX.get(w['w'], w['w'])
            ws.append(w)
            i += 1
        for si, (s0, s1) in enumerate(SEG):
            inseg = [w for w in ws if w['s'] >= s0 - 0.02 and w['e'] <= s1 + 0.05]
            if not inseg:
                continue
            words = [{'w': w['w'], 's': round(st2vt(max(w['s'], s0)), 3)} for w in inseg]
            caps.append({'who': t['who'], 's': round(words[0]['s'] - 0.08, 3), 'e': 0, 'words': words, 'seg': si})
    caps.sort(key=lambda c: c['s'])
    for i, c in enumerate(caps):                    # a caption ends when the next one starts, or just after its segment
        nxt = caps[i + 1]['s'] if i + 1 < len(caps) else CALL_END
        c['e'] = round(min(nxt, vt0[c['seg']] + SEG[c['seg']][1] - SEG[c['seg']][0] + 0.6), 3)

    fields = []
    for n, f in enumerate(job.get('fields') or []):
        if not all(k in f for k in ('k', 'v', 'at')):
            die(f'fields[{n}] needs "k", "v" and "at": {f}')
        fields.append({'k': f['k'], 'v': f['v'], 't': when(f['at'], f'fields[{n}] {f["k"]}')})
    callouts = []
    for n, c in enumerate(job.get('callouts') or []):
        if not all(k in c for k in ('txt', 'from', 'to')):
            die(f'callouts[{n}] needs "txt", "from" and "to": {c}')
        callouts.append({'t': when(c['from'], f'callouts[{n}] from'), 'e': when(c['to'], f'callouts[{n}] to'), 'txt': c['txt']})

    # the cut call -> call_cut.wav (12 ms in, 15 ms out on every cut)
    if not call.get('audio'):
        die('job.json needs call.audio: the call recording')
    src = os.path.join(base, call['audio'])
    if not os.path.isfile(src):
        die(f'no call audio at {src}')
    filt, labs = [], []
    for i, (s0, s1) in enumerate(SEG):
        filt.append(f'[0:a]atrim={s0}:{s1},asetpts=PTS-STARTPTS,afade=t=in:d=0.012,afade=t=out:st={s1 - s0 - 0.015}:d=0.015[s{i}]')
        labs.append(f'[s{i}]')
    fc = ';'.join(filt) + ';' + ''.join(labs) + f'concat=n={len(SEG)}:v=0:a=1[c]'
    cut = os.path.join(out, 'call_cut.wav')
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', src, '-filter_complex', fc, '-map', '[c]',
                    '-ar', '48000', '-ac', '1', cut], check=True)

    # loudness per 1/60 s, for the live waveform
    w = wave.open(cut)
    sr = w.getframerate()
    x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
    w.close()
    hop = sr // 60
    rms = [float(np.sqrt((x[i:i + hop] ** 2).mean())) if len(x[i:i + hop]) else 0 for i in range(0, len(x), hop)]
    m = max(rms) or 1.0
    rms = [round(min(1, (r / m) ** 0.6), 3) for r in rms]

    data = {
        'fps': FPS, 'segs': [list(s) for s in SEG], 'vt0': [round(o, 6) for o in vt0],
        'cuts': [round(o, 3) for o in vt0[1:]], 'caps': caps, 'fields': fields, 'events': events,
        'callouts': callouts, 'clock': [{'vt': round(o, 3), 'st': s0} for (s0, s1), o in zip(SEG, vt0)],
        'pick': PICK, 'rms': rms, 'rmsRate': 60,
        # everything below is new in the kit: the words on screen, the cover and the end card
        'brand': job.get('brand', 'ava'), 'id': job.get('id', ''), 'display': job.get('display') or {},
        'cover': job.get('cover', {}), 'endcard': job.get('endcard', 'sell'), 'end': job.get('end') or {},
    }
    json.dump(data, open(os.path.join(out, 'data.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    with open(os.path.join(out, 'events.json'), 'w', encoding='utf-8') as fh:
        json.dump(dict(events, fps=FPS), fh, indent=2)
        fh.write('\n')

    print('CALL_END', events['callEnd'], 'TOTAL', events['total'], 'cuts', data['cuts'], 'events', events)
    for c in caps:
        print(c['who'], c['s'], c['e'], ' '.join(w['w'] for w in c['words']))
    if not data['display'].get('biz'):
        print('NOTE: display.biz is empty - the call card will show no business name')
    if isinstance(data['cover'], dict) and not data['cover'].get('color'):
        print('NOTE: cover.color is not set - the render will take the next color in presets/covers.json. Pin it in job.json.')
    print('wrote', os.path.join(out, 'data.json'), '+ call_cut.wav + events.json')


if __name__ == '__main__':
    main()
