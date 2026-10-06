#!/usr/bin/env python3
"""tx.py - speech to text with word timings. faster-whisper, base.en, int8, on the CPU.

  python3 tx.py call.m4a                          -> words.json   [{"who","w","s","e"}, ...]
  python3 tx.py call.wav -o words.json --who a
  python3 tx.py stereo.wav --channels a,c         one speaker per channel (left = a, right = c)
  python3 tx.py call.wav --turn a@0 --turn c@6.2 --turn a@10.7    who is speaking from each second on
  python3 tx.py master.wav --start 1.4 --end 4.2  one window on its own

who: "a" is the AI, "c" is the caller. Whisper does not know who is speaking. One speaker per channel
is exact. --turn marks are by ear. With neither, every word gets --who and you fix words.json by hand.

The audio is decoded by ffmpeg to 16 kHz mono WAV and read with wave + numpy. PyAV is never used:
av.open(metadata_errors=...) breaks on the cloud stack, and whisper takes a numpy array just as well.

Check the words against the audio before a render. Whisper mishears names and numbers, and it skips
words right after a ring: run the greeting window on its own with --start and --end.
The first run downloads the model (about 140 MB) into the Hugging Face cache.
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile
import wave

import numpy as np


def decode(path, start, end, channel=None):
    """Any audio or video file -> float32 mono at 16 kHz, through ffmpeg + wave (no PyAV)."""
    tmp = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
    tmp.close()
    cmd = ['ffmpeg', '-y', '-v', 'error']
    if start:
        cmd += ['-ss', str(start)]
    if end is not None:
        cmd += ['-to', str(end)]
    cmd += ['-i', path, '-vn']
    cmd += ['-af', f'pan=mono|c0=c{channel}'] if channel is not None else ['-ac', '1']
    cmd += ['-ar', '16000', '-c:a', 'pcm_s16le', tmp.name]
    try:
        subprocess.run(cmd, check=True)
        w = wave.open(tmp.name)
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
        w.close()
        return x
    finally:
        try:
            os.unlink(tmp.name)
        except OSError:
            pass


def main():
    ap = argparse.ArgumentParser(description='Word timings for one recording.')
    ap.add_argument('audio')
    ap.add_argument('-o', '--out', default='words.json')
    ap.add_argument('--who', default='a', help='speaker for every word when nothing else says (default a)')
    ap.add_argument('--channels', help='one speaker per channel, in channel order, e.g. a,c')
    ap.add_argument('--turn', action='append', default=[], metavar='WHO@SECONDS',
                    help='who is speaking from this second on; repeat')
    ap.add_argument('--start', type=float, default=0.0)
    ap.add_argument('--end', type=float)
    ap.add_argument('--model', default='base.en')
    a = ap.parse_args()
    if not os.path.isfile(a.audio):
        sys.exit(f'tx.py: no file at {a.audio}')

    marks = []
    for m in a.turn:
        who, _, sec = m.partition('@')
        try:
            marks.append((float(sec), who))
        except ValueError:
            sys.exit(f'tx.py: --turn wants WHO@SECONDS, got {m!r}')
    marks.sort()

    from faster_whisper import WhisperModel
    model = WhisperModel(a.model, device='cpu', compute_type='int8')

    def transcribe(x, who):
        segs, _ = model.transcribe(x, language='en', word_timestamps=True, beam_size=5,
                                   condition_on_previous_text=False)
        out = []
        for s in segs:
            for w in (s.words or []):
                out.append({'who': who, 'w': w.word.strip(),
                            's': round(w.start + a.start, 3), 'e': round(w.end + a.start, 3)})
        return out

    if a.channels:
        words = []
        for i, who in enumerate(a.channels.split(',')):
            words += transcribe(decode(a.audio, a.start, a.end, channel=i), who.strip())
        words.sort(key=lambda w: w['s'])
    else:
        words = transcribe(decode(a.audio, a.start, a.end), a.who)
        for w in words:                             # the latest --turn mark at or before the word wins
            for sec, who in marks:
                if sec <= w['s']:
                    w['who'] = who

    with open(a.out, 'w', encoding='utf-8') as fh:   # one word per line: easy to read, easy to fix by hand
        fh.write('[\n' + ',\n'.join(json.dumps(w, ensure_ascii=False) for w in words) + '\n]\n')

    line = []
    for i, w in enumerate(words):                   # print it turn by turn, to check against the audio
        line.append(w)
        if i + 1 == len(words) or words[i + 1]['who'] != w['who']:
            print(f"{w['who']} {line[0]['s']:7.2f}-{line[-1]['e']:7.2f}  {' '.join(x['w'] for x in line)}")
            line = []
    print('words', len(words), '->', a.out)


if __name__ == '__main__':
    main()
