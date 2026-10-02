# tools/aic-video — AI Chauffeur call videos

Builds a 9:16 social video from one of the six sample calls on aichauffeur.ai/#demo. It was built for video 01, the O'Hare call, on Oct 2 2026; Shane rated v2 a 10.
This folder is excluded from deploys by `.vercelignore` (`tools`). The laws for the videos live in the `aic-call-video` skill, and the full build notes are in the Claude project doc `claude/AIC-VIDEO-01-KIT-2026-10-02.md`.

## What is here
| File | Job |
|---|---|
| `calls/<id>.json` | Word-level timings for the six calls (airport, corporate, wedding, driver, rebook, group): turns, words, pickup, ping. |
| `build_data.py` | Builds the edit list (`SEG`), captions, trip-sheet fields and callouts for one call. Writes `data.json` and `call_cut.wav`. The values in it are the airport cut, so edit `SEG`, `fields` and `callouts` for each new call. |
| `overlay.html` | The on-screen layer, driven by `render(t)`: the cover (the first 1.6 s, the phone shakes with the ring), the call card, the captions, the callouts, the trip sheet and the BOOKED end card. |
| `render.py` | `python3 render.py full` renders every frame as a transparent PNG into `frames_v2/`. `python3 render.py test 1.0 12.5` renders a few test frames. |
| `make_boom.py` | The signature end-card bass hit. It is deterministic and rebuilds the exact sound in video 01. |
| `assemble.sh` | Joins the b-roll cuts, lays the overlay on top, adds the boom, masters to -14 LUFS, and encodes the MP4. |
| `cover.html` | Cover mockups (A green, B black and green, C car band). A is the approved one. |
| `grab.sh` | Downloads an ElevenLabs generation by its id, using the master URL found in the session transcript. |

## Run it
1. Copy this folder to a scratch work folder.
2. Add these files to the work folder:
   - the fonts, `chauffeur/fonts/space-grotesk.woff2` and `chauffeur/fonts/jetbrains-mono.woff2`;
   - the brand files, `lockup-short.svg` and `mark-black.svg` from `chauffeur/assets/brand/`;
   - the cover background, `cover_bg_green.png` or the next color;
   - the five shots, `s1_phone.mp4`, `s2_jet.mp4`, `s3_car.mp4`, `s4_road.mp4`, `s5_golf.mp4`, or the new video's shots.
3. Run `CALL=airport CALL_WAV=/path/to/airport.m4a python3 build_data.py`. The call audio is in `chauffeur/audio/samples/v1/`.
4. Run `python3 make_boom.py boom.wav`.
5. Run `python3 render.py full`.
6. Run `bash assemble.sh`.
7. Check before sending:
   - a contact sheet of every beat;
   - speech-to-text of `master.wav`, plus the greeting window on its own;
   - loudness at -14 LUFS;
   - every callout is true in the cut.

You need Python 3 with numpy and Playwright (Chromium), and ffmpeg.

## Video 01 shots (ElevenLabs flow "AIC Video 01 — Airport call (Oct 2)")
Five Veo 3.1 shots, each 6 s, 9:16, 1080p, audio off, 7,272 credits apiece. They can be reused for any airport call.
- S1, phone on the dispatch desk: `eF84DSxyiziwutkvgCKw`
- S2, jet landing: `vwY9uPUZAgQLrHZDYQjO`
- S3, S-Class at the curb: `FXvp9bZmw9sJ9iSVbD7m`
- S4, S-Class on the expressway with a jet overhead: `Yie3ffCX94CbfvNbMtKC`
- S5, chauffeur and the golf bag: `nlx5D8aUSUBsuNfkqSTu`
- Cover phone (Gemini 3 Pro image): `RCxG2Xnud09g3XMfdTH0`
