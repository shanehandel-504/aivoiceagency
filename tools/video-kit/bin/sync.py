#!/usr/bin/env python3
"""sync.py - shoot-sync. Put every source from a shoot on one clock.

  python3 sync.py WIDE.mov GOPRO.mp4 OBS.mkv PHONE2.mp4 --t0 2 --clean-audio call.wav

The first file is the master: the wide iPhone shot. Every other source is moved onto its clock.

How a file's marker is found
  The marker is the one clap at the start that every mic hears. In each file it is the first sample
  at or above -6 dBFS after --t0 seconds (use --t0 to skip a bump before the clap).
  A source that never heard the clap, like a screen recording with the mic off, gets its marker by
  hand:  --marker OBS.mkv=4.25   That is the second the clap happens in that file, or the second of
  any other moment you also mark by hand in the master (the ring that is visible in the wide shot).

--clean-audio FILE
  The clean call recording (Retell, or the phone's own) to swap in for the room sound. It never heard
  the clap, so it is lined up by matching its sound against the master's own audio. If the match is
  weak, sync.py stops and asks for  --clean-at SECONDS  (the master time where the clean file starts).
  It does not guess.

Writes offsets.json and prints the ffmpeg commands that put every source on the master clock. A source
that started late gets a delay (adelay for sound, tpad for picture). One that started early gets a
trim (-ss). The commands write new files into aligned/ and never touch an original.

Nothing here cuts a pause. Suspense, breaths and punchlines live in the pauses; they are cut by hand.
"""
import argparse
import json
import os
import subprocess
import sys

import numpy as np

SR = 48000          # marker search, sample-exact
SR_MATCH = 8000     # clean-audio match


def die(msg):
    sys.exit('sync.py: ' + msg)


def probe(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_type',
                        '-of', 'json', path], capture_output=True, text=True)
    if r.returncode != 0:
        die(f'ffprobe cannot read {path}: {r.stderr.strip()}')
    j = json.loads(r.stdout)
    kinds = [s.get('codec_type') for s in j.get('streams', [])]
    return float(j.get('format', {}).get('duration') or 0), 'video' in kinds, 'audio' in kinds


def pcm(path, sr):
    """The file's sound as mono int16 at sr, decoded by ffmpeg."""
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vn', '-ac', '1', '-ar', str(sr), '-f', 's16le', '-'],
                       capture_output=True)
    if r.returncode != 0:
        die(f'ffmpeg cannot decode the sound in {path}: {r.stderr.decode(errors="replace").strip()}')
    return np.frombuffer(r.stdout, dtype=np.int16)


def onset(x, t0, db):
    """Second of the first sample at or above db dBFS after t0, or None. Also the loudest sample after t0."""
    i0 = min(len(x), int(round(t0 * SR)))
    a = np.abs(x[i0:].astype(np.int32))
    if a.size == 0:
        return None, None, None
    pk = int(a.argmax())
    peak_db = 20 * np.log10(max(1, int(a[pk])) / 32768.0)
    hit = np.flatnonzero(a >= 32768.0 * 10 ** (db / 20.0))
    return ((i0 + int(hit[0])) / SR if hit.size else None), round(float(peak_db), 1), (i0 + pk) / SR


# A match is trusted only when the best lag clears both bars. Measured on test shoots: a true match
# in a hard room (quiet, echoing, someone talking over it) scored 1.6 and 40; unrelated speech and
# noise never passed 1.1 and 12.
MATCH_MIN_RATIO = 1.3     # best lag vs the next best lag anywhere else
MATCH_MIN_Z = 15.0        # best lag vs the spread of all lags, in standard deviations


def match(master_path, clean_path):
    """Where the clean file starts on the master clock, by cross-correlating the two sounds.
    Returns (seconds, ratio, z), or (None, 0, 0) when either file is too short to tell."""
    m = pcm(master_path, SR_MATCH).astype(np.float64)
    c = pcm(clean_path, SR_MATCH).astype(np.float64)[:SR_MATCH * 90]     # the first 90 s is plenty, and it limits clock drift
    if m.size < SR_MATCH or c.size < SR_MATCH:
        return None, 0.0, 0.0
    m, c = np.diff(m), np.diff(c)               # flatten the spectrum a little so one low rumble cannot win
    n = 1
    while n < m.size + c.size:
        n *= 2
    r = np.fft.irfft(np.fft.rfft(m, n) * np.conj(np.fft.rfft(c, n)), n)
    lags = np.concatenate([np.arange(0, m.size), np.arange(-(c.size - 1), 0)])
    a = np.abs(np.concatenate([r[:m.size], r[n - (c.size - 1):]]))
    k = int(a.argmax())
    elsewhere = np.abs(lags - lags[k]) > int(0.05 * SR_MATCH)           # more than 50 ms away is another peak
    ratio = a[k] / (a[elsewhere].max() or 1.0)
    z = (a[k] - a.mean()) / (a.std() or 1.0)
    return lags[k] / SR_MATCH, round(float(ratio), 2), round(float(z), 1)


def q(path):
    return '"' + str(path).replace('\\', '/').replace('"', '\\"') + '"'


def main():
    ap = argparse.ArgumentParser(description='Line up every source from a shoot on the master clock.')
    ap.add_argument('master', help='the wide shot: the master clock')
    ap.add_argument('sources', nargs='*', help='every other source that should carry the clap')
    ap.add_argument('--t0', type=float, default=0.0, help='ignore sound before this second when looking for the clap')
    ap.add_argument('--threshold', type=float, default=-6.0, help='onset level in dBFS (default -6)')
    ap.add_argument('--marker', action='append', default=[], metavar='FILE=SECONDS', help='set a marker by hand; repeat')
    ap.add_argument('--clean-audio', metavar='FILE')
    ap.add_argument('--clean-at', type=float, metavar='SECONDS', help='master time where the clean file starts')
    ap.add_argument('--out', default='offsets.json')
    ap.add_argument('--aligned', default='aligned', help='folder the printed commands write into')
    a = ap.parse_args()

    files = [a.master] + a.sources
    for f in files + ([a.clean_audio] if a.clean_audio else []):
        if not os.path.isfile(f):
            die(f'no file at {f}')
    by_hand = {}
    for m in a.marker:
        name, _, sec = m.rpartition('=')
        try:
            by_hand[name] = float(sec)
        except ValueError:
            die(f'--marker wants FILE=SECONDS, got {m!r}')
    known = {f: f for f in files}
    known.update({os.path.basename(f): f for f in files})
    for name in by_hand:
        if name not in known:
            die(f'--marker names {name}, which is not one of the sources')
    by_hand = {known[k]: v for k, v in by_hand.items()}

    rows = []
    for f in files:
        dur, has_v, has_a = probe(f)
        row = {'file': f, 'duration': round(dur, 3), 'video': has_v, 'audio': has_a}
        if f in by_hand:
            row.update(marker=round(by_hand[f], 4), how='by hand')
        else:
            if not has_a:
                die(f'{f} has no sound, so it cannot hear the clap. Give its marker by hand: --marker {os.path.basename(f)}=SECONDS')
            mk, peak_db, peak_at = onset(pcm(f, SR), a.t0, a.threshold)
            if mk is None:
                die(f'no sound at or above {a.threshold} dBFS after {a.t0} s in {f} '
                    f'(the loudest is {peak_db} dBFS at {peak_at:.2f} s). '
                    f'Lower --threshold, or give the marker by hand: --marker {os.path.basename(f)}=SECONDS')
            row.update(marker=round(mk, 4), how='onset')
        rows.append(row)

    m0 = rows[0]['marker']
    for i, r in enumerate(rows):
        r['role'] = 'master' if i == 0 else 'source'
        r['offset'] = round(m0 - r['marker'], 4)          # add this to a time in the file to get master time

    clean = None
    if a.clean_audio:
        if a.clean_at is not None:
            clean = {'file': a.clean_audio, 'role': 'clean-audio', 'how': 'by hand', 'offset': round(a.clean_at, 4)}
        else:
            if not rows[0]['audio']:
                die('the master has no sound to match the clean recording against. Pass --clean-at SECONDS.')
            off, ratio, z = match(a.master, a.clean_audio)
            if off is None or ratio < MATCH_MIN_RATIO or z < MATCH_MIN_Z:
                die(f'the clean recording does not clearly match the master sound '
                    f'(best lag is {ratio}x the next best, need {MATCH_MIN_RATIO}; {z} deviations, need {MATCH_MIN_Z}). '
                    'Find the second in the master where the clean file starts and pass --clean-at SECONDS.')
            clean = {'file': a.clean_audio, 'role': 'clean-audio', 'how': 'matched', 'offset': round(off, 4),
                     'confidence': ratio, 'deviations': z}
        clean['duration'] = round(probe(a.clean_audio)[0], 3)

    # the ffmpeg commands. Late start -> delay. Early start -> trim. Originals are never written to.
    cmds = [f'mkdir -p {q(a.aligned)}']
    for r in rows[1:]:
        stem = os.path.splitext(os.path.basename(r['file']))[0]
        off = r['offset']
        if r['video']:
            dst = q(os.path.join(a.aligned, stem + '.mov'))
            enc = '-c:v libx264 -crf 12 -preset fast -pix_fmt yuv420p ' + ('-c:a pcm_s16le' if r['audio'] else '-an')
            if off >= 0:
                af = f' -af "adelay={int(round(off * 1000))}:all=1"' if r['audio'] else ''
                r['command'] = f'ffmpeg -v error -n -i {q(r["file"])} -vf "tpad=start_duration={off:.4f}:color=black"{af} {enc} {dst}'
            else:
                r['command'] = f'ffmpeg -v error -n -ss {-off:.4f} -i {q(r["file"])} {enc} {dst}'
        else:
            dst = q(os.path.join(a.aligned, stem + '.wav'))
            if off >= 0:
                r['command'] = f'ffmpeg -v error -n -i {q(r["file"])} -af "adelay={int(round(off * 1000))}:all=1" -c:a pcm_s16le {dst}'
            else:
                r['command'] = f'ffmpeg -v error -n -ss {-off:.4f} -i {q(r["file"])} -c:a pcm_s16le {dst}'
        cmds.append(r['command'])
    if clean:
        stem = os.path.splitext(os.path.basename(a.master))[0]
        off = clean['offset']
        chain = f'adelay={int(round(off * 1000))}:all=1,apad' if off >= 0 else f'atrim=start={-off:.4f},asetpts=PTS-STARTPTS,apad'
        if rows[0]['video']:
            clean['command'] = (f'ffmpeg -v error -n -i {q(a.master)} -i {q(a.clean_audio)} -filter_complex "[1:a]{chain}[a]" '
                                f'-map 0:v -map "[a]" -c:v copy -c:a pcm_s16le -shortest {q(os.path.join(a.aligned, stem + "_clean.mov"))}')
        else:
            clean['command'] = (f'ffmpeg -v error -n -i {q(a.clean_audio)} -af "{chain}" -t {rows[0]["duration"]} '
                                f'-c:a pcm_s16le {q(os.path.join(a.aligned, stem + "_clean.wav"))}')
        cmds.append(clean['command'])

    result = {'master': a.master, 'threshold_dbfs': a.threshold, 't0': a.t0, 'sources': rows}
    if clean:
        result['clean_audio'] = clean
    with open(a.out, 'w', encoding='utf-8') as fh:
        json.dump(result, fh, indent=2)
        fh.write('\n')

    print(f'{"SOURCE":28s} {"MARKER":>9s}  {"HOW":8s} {"OFFSET":>9s} {"FRAMES@30":>10s}  ACTION')
    for r in rows:
        act = 'master clock' if r['role'] == 'master' else (f'delay {r["offset"]:.4f} s' if r['offset'] >= 0 else f'trim {-r["offset"]:.4f} s')
        print(f'{os.path.basename(r["file"])[:28]:28s} {r["marker"]:9.4f}  {r["how"]:8s} {r["offset"]:+9.4f} {r["offset"] * 30:+10.1f}  {act}')
    if clean:
        act = 'swap in for the room sound' + (f' (match {clean["confidence"]}x the next best)' if 'confidence' in clean else '')
        print(f'{os.path.basename(clean["file"])[:28]:28s} {"-":>9s}  {clean["how"]:8s} {clean["offset"]:+9.4f} {clean["offset"] * 30:+10.1f}  {act}')
    print(f'\nwrote {a.out}\n\n# Put every source on the master clock. New files only; the originals stay as they are.')
    for c in cmds:
        print(c)
    print('# No pause was removed. Cut pauses by hand, on purpose, or not at all.')


if __name__ == '__main__':
    main()
