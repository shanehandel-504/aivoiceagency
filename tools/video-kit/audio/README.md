# audio/

Where the kit's sounds go: the signature boom, the opener hit, and later sound effects.
Both signature sounds are built by a script, so they are not stored here. Build them when a job needs them:

```bash
python3 tools/video-kit/bin/make_boom.py boom.wav       # 48 kHz mono, 1.8 s. Lands on the BOOKED slam, volume 0.9.
python3 tools/video-kit/bin/make_opener.py opener.wav   # 48 kHz mono, 0.4 s. Lands on the cover-to-call cut, volume 0.7.
```

Each script writes the same file every run. As built on Oct 6 2026 (Python 3.14, numpy 2.5):

| File | SHA-256 |
|---|---|
| `boom.wav` | `fff2be0aeb13c6d096a554dae14befac1a247aad26ed3d59620fc53771ffff5b` |
| `opener.wav` | `f773de38e10dad29e753d19cff51185860cfe0979c169036c2a849864575d0a7` |

A different machine may differ by a rounding step in a few samples. That is not audible.
The levels live in `presets/loudness.json`. Sound effects added later are 48 kHz WAV, with their
source and licence noted in this file.
