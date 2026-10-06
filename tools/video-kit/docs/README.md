# tools/video-kit — the video kit, v1

The reusable kit for every AVA and AI Chauffeur film. Every chat and every Code session starts
from these files: the bootstrap, the brand tokens for both brands, the overlay, the cover, the two
end cards, the Google-style UI layer, the transcriber, the shoot-sync, the assemble presets.

**video-01 reference: tools/aic-video/ (frozen, do not edit)**

The kit was promoted from that folder on Oct 6 2026. It is additive: nothing in `tools/aic-video/`
was moved or changed. This folder never ships to the public site (`.vercelignore` excludes `tools`).

## Quickstart

Ten lines, from a clean machine to a finished MP4. Run them in a job folder outside the repo.

```bash
K=/path/to/aivoiceagency/tools/video-kit                 # 1  where the kit lives
bash $K/bin/bootstrap.sh                                 # 2  every row HAVE, exit 0
python3 $K/bin/tx.py call.m4a -o words.json              # 3  word timings. Check them by ear.
cp $K/docs/job.example.json job.json                     # 4  then edit it: call paths, segments, fields, callouts, events
python3 $K/bin/build_data.py job.json                    # 5  -> data.json, call_cut.wav, events.json
python3 $K/bin/render.py test 0.5 1.9 19.98 24.65        # 6  four test frames. The last line must be: errors []
python3 $K/bin/render.py full                            # 7  -> frames/, one PNG per frame
python3 $K/bin/make_boom.py boom.wav                     # 8  the signature boom
python3 $K/bin/make_opener.py opener.wav                 # 9  the short hit on the cover-to-call cut
bash $K/bin/assemble.sh -o out.mp4 s1.mp4:1.5:5.58 s2.mp4:1.2:5.86   # 10 -> the MP4, its probe, loudness PASS or FAIL
```

The four test times are `0.5`, pickup + 0.3, booked + 0.1 and callEnd + 0.4. `build_data.py` prints
those events. Look at the four frames at quarter size before the full render: a stranger has to read
the scenario, the speaker and the result with the sound off.

On the Dell under Git Bash, `python3` is the Windows Store stub and does not run. Type `python`
instead. The bootstrap prints the one that works on the machine it is on.

## The laws

- **Additive.** `tools/aic-video/` is the frozen video-01 source of truth. Copy from it, never edit it.
- **Never `git add -A`.** Explicit paths only.
- **No secrets, no private numbers, no prospect names** in any file, commit or log line. The same
  goes for the screen: sample data only.
- **Vanilla only.** Python 3, ffmpeg, Playwright (the Python package, Chromium), HTML, CSS, JS.
  No npm, no React, no build system, no new services.
- **Fonts.** Space Grotesk 2.0.0 for words, JetBrains Mono 2.304 for the micro layer. Both are OFL,
  from their GitHub release zips, kept in `fonts/` as woff2 + ttf + `OFL.txt`.
- **CIRCULANT tokens only** (`brand/circulant.css`):
  void `#0A0A0F` · panel `#12121A` · line `#23232E` · ink `#EEF0F4` · mute `#7E8299` ·
  cyan `#00D4FF` · booked-green `#2EE6A8` · amber `#FFB020` · miss-red `#FF3B4E` · neutral `#8A93A6`.
- **Two brands, never crossed.** AVA's accent is cyan. AI Chauffeur is leather-black, white type,
  amber. Green means booked on both. AVA is never named on an AI Chauffeur film, and AVA is never
  "she" or "her".
- **Every produced call carries DEMO SCENARIO on screen**, from the first frame to the last.
- **SELL end card** (every call video): BOOKED. / This could be your phone. / Get this on your
  phones. / Link in bio. / DEMO SCENARIO / lockup.
- **REACH end card** (fiction, comedy): the lockup and one line. No price, no number.
  Never put one lane's card on the other lane's film.
- **House export.** 1080x1920, 30 fps constant, H.264 high 4.2, CRF 17 preset slow, AAC 192k 48 kHz,
  -14 LUFS, true peak at or below -1 dBTP, faststart. `assemble.sh` reads it from `presets/`.

The film laws (one video at a time, cover rules, callouts, banned words) live in the
`aic-call-video`, `ava-ui-overlay` and `ava-video-director` skills. This kit is the tooling for them.

## What is here

| Path | Job |
|---|---|
| `bin/bootstrap.sh` | Checks ffmpeg, ffprobe, Python, numpy, pillow, faster-whisper, Playwright and Chromium, and the fonts. Installs the missing Python packages, Chromium and fonts. Prints HAVE / MISSING. Exit 0 only when all are present. `--check` only reports. |
| `bin/fonts.py` | Called by the bootstrap. Downloads a font zip only when its files are absent, checks its SHA-256, keeps woff2 + ttf + `OFL.txt`. |
| `bin/tx.py` | Speech to text with word timings: faster-whisper `base.en`, int8. Writes `words.json` as `[{who,w,s,e}]`. Reads audio with wave + numpy, never PyAV. |
| `bin/build_data.py` | `job.json` to `data.json`, `call_cut.wav`, `events.json`. Segments, fields, callouts and events come from the job file. |
| `bin/render.py` | Draws a template to transparent 1080x1920 PNGs. `test <times>` or `full`. `--overlay`, `--brand`, `--job`, `--set`. |
| `bin/assemble.sh` | B-roll + overlay frames + call + boom, two-pass loudnorm, house export. Ends with the probe and the measured loudness. |
| `bin/make_boom.py` | The signature end-card boom. Copied as it is from video 01. The same file every run. |
| `bin/make_opener.py` | A 0.4 s hit for the cover-to-call cut. Same style, 220 to 90 Hz, no noise thump. |
| `bin/sync.py` | Shoot-sync. Finds the clap in every source, writes `offsets.json`, prints the ffmpeg commands. |
| `bin/grab.sh` | Downloads an ElevenLabs generation by its id. Copied as it is. See the note below. |
| `templates/overlay.html` | The call overlay, start to finish: the cover (first 1.6 s), then the tag, lockup, call card, captions, callouts and trip sheet, then the SELL end card. |
| `templates/cover.html` | The cover on its own. Two variables: `COLOR` and `HEADLINE`. |
| `templates/endcard-sell.html` | The SELL end card on its own. |
| `templates/endcard-reach.html` | The REACH end card. |
| `templates/ui-google.html` | The Google-style UI layer: search bar, notification, calendar slot, text bubble, EDITED FOR TIME tag. |
| `templates/kit.js`, `kit.css` | Shared by every template: the stage, the cover, both end cards. |
| `brand/circulant.css` | The tokens and the font faces. Every template links it first. |
| `brand/ava.json`, `aic.json` | Per brand: accent, logo files, demo tag text, end-card lines, the pointer to the cover rotation. |
| `brand/*.svg` | `lockup-short.svg` and `mark-black.svg` (AI Chauffeur, from `chauffeur/assets/brand/`). `ava-logo-compact.svg` and `ava-logo-horizontal.svg` (AVA, from `brand/`). Copies. Do not redraw them. |
| `fonts/` | Space Grotesk and JetBrains Mono, each with its `OFL.txt`. |
| `presets/export.json` | The house export. |
| `presets/loudness.json` | -14 LUFS, the true-peak ceiling, the boom and opener levels. |
| `presets/layout.json` | The coordinate table. |
| `presets/covers.json` | The cover color rotation. |
| `audio/` | Where the boom, the opener and later sound effects go. |
| `docs/job.example.json` | Video 01, the O'Hare call, as a job file. |
| `docs/ui.example.json` | One of each part of the UI layer. |

## The contract every template keeps

`setBrand(brand, jobBase)`, then `setData(data)`, then `render(t)` once per frame. `render(t)` is
pure: the same `t` gives the same pixels. No timers, no clock, no random numbers. `render.py` drives
it at `(i + 0.5) / 30` and takes a transparent screenshot of each frame.

The brand comes from `?brand=ava|aic` (`render.py --brand`). Every word on screen comes from
`data.json` or from `brand/<id>.json`. Nothing about one call is written into a template.

## Layout, 1080x1920

| Zone | Where |
|---|---|
| Cover | Full frame for the first 1.6 s, then a hard cut on the second ring |
| DEMO SCENARIO tag and lockup | y136–198 |
| Call card | y214–440 |
| Caption | y478–800 |
| B-roll subject band | y800–1128. Frame or crop every shot to put the subject here. |
| Callout | y1030–1106 |
| Trip sheet | y1128–1500, x60–900, clear of the right-side buttons |
| Safe area | Text stays inside x60–1020 and above y1620 |

These are the video-01 numbers. The kit's overlay was measured against the frozen overlay box by
box: the difference is 0.0 px.

## The job file

`docs/job.example.json` is video 01. A time in a job file is one of:

| Form | Means |
|---|---|
| `12.5` | The second in the original call. It must fall inside a kept segment. |
| `"pickup"`, `"booked"`, `"ping"`, `"callEnd"` | The event of that name |
| `[58.30, 0.12]` | That time, plus seconds added after the cut. Use it to stage a detail said in a cut part. |
| `{"vt": 12.5}` | A second in the finished video, used as it is |

Every callout has to be true in the cut. Start the first segment on the last ring before pickup,
so "answered on the first ring" is what the viewer hears.

## The cover

One bright color field, one line, one object. A new color every video: `presets/covers.json` holds
the rotation. Green was used on Oct 2 2026. Purple `#B026FF` is next, then cyan, then amber for
AI Chauffeur only.

```bash
python3 $K/bin/render.py test 0 --overlay $K/templates/cover.html --brand aic --set still=1
python3 $K/bin/render.py test 0 --overlay $K/templates/cover.html --brand aic --set still=1 --set color=#3DDFA4 --set "headline=BUSINESS OWNERS: THIS COULD BE YOUR PHONE."
```

`HEADLINE` is one string. The words up to the first colon are set small above the rest. Pass a
generated plate with `--set img=cover_bg.png` (the object on the same flat color, no text in it).
Sample the plate's field and use that hex as the color, or the shake shows a seam. Without a plate,
a drawn phone stands in. When a video ships, add its date to that color in `covers.json` and move
`next` on.

## The end cards and the UI layer

```bash
python3 $K/bin/render.py full --overlay $K/templates/endcard-sell.html --brand aic --out frames_end
python3 $K/bin/render.py full --overlay $K/templates/endcard-reach.html --brand ava --set "line=One line." --out frames_end
python3 $K/bin/render.py full --overlay $K/templates/ui-google.html --data ui.json --out frames_ui
bash $K/bin/assemble.sh -o out.mp4 --ui frames_ui s1.mp4:0:8
```

The overlay already draws the SELL card at the end of a call, so the card files are for a film with
no call overlay. The UI layer shows only what happened in the film. A notification, a booking or a
number that did not happen is banned. Put EDITED FOR TIME wherever a cut could make something look
faster than it was.

## The sync recipe

1. **Shoot.** One clap at the start, heard by every mic. The ring that is visible in the wide shot
   is the second marker. The wide iPhone shot is the master clock.
2. **Run it.** The master goes first.
   ```bash
   python3 $K/bin/sync.py WIDE.mov GOPRO.mp4 PHONE2.mp4 OBS.mkv --t0 2 --marker OBS.mkv=4.25 --clean-audio call.wav
   ```
   - In each file the marker is the first sound at or above -6 dBFS after `--t0` seconds.
   - A source that never heard the clap (a screen recording with the mic off) gets its marker by
     hand with `--marker FILE=SECONDS`.
   - `--clean-audio` is the Retell or phone recording. It is lined up by matching its sound against
     the master's own audio. If the match is weak, the script stops and asks for `--clean-at SECONDS`.
     It does not guess.
3. **Read the table.** One row per source: marker, offset, and delay or trim.
4. **Run the printed commands.** They write new files into `aligned/`. A source that started late
   gets a delay (`adelay`, `tpad`). One that started early gets a trim (`-ss`). The clean audio
   replaces the room sound on the master.
5. **Keep every original.** Nothing here overwrites one.
6. **Pauses are never removed automatically.** Suspense, breaths and punchlines live there.

## Notes

- **`grab.sh`** reads the newest session transcript for the ElevenLabs `master_url` of a generation
  id, then downloads it. It is copied unchanged from video 01, and its transcript path is the cloud
  workspace's. On another machine, point its `J=` line at that machine's session transcripts.
- **`tx.py`** downloads the `base.en` model (about 140 MB) the first time it runs. Whisper mishears
  names and numbers, and it skips words right after a ring. Check the greeting window on its own
  with `--start` and `--end`. Fix a caption word with `"fix"` in the job file.
- **Color.** The PNGs are sRGB. `assemble.sh` converts them with the BT.709 matrix and tags the
  file BT.709, so a brand hex comes out within a few levels on any ffmpeg.
- **Loudness.** The master is aimed at -1.5 dBTP because AAC lifts peaks. The delivered file is
  measured and must pass: -14 LUFS, plus or minus 1, and true peak at or below -1 dBTP.
- **The AI Chauffeur accent** is the amber token. "Muted amber" has no ratified hex yet. When one
  is ratified, it is one line in `brand/aic.json`.
- **Checked on Oct 6 2026, on the Dell** (Git Bash, Python 3.14, ffmpeg 8.1, Playwright 1.63):
  the bootstrap, a full render and assemble of the video-01 job, the transcriber, the sync script.
  The kit's `build_data.py` rebuilds video 01's `data.json` and `call_cut.wav` exactly.
  **Not run on Linux yet.** The first cloud session runs `bootstrap.sh --check` and reports what it prints.
