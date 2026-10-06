#!/usr/bin/env bash
# tools/video-kit/bin/assemble.sh - b-roll + overlay frames + the cut call + the boom -> the delivered MP4.
#
# Run it in the job folder, the one that holds call_cut.wav, events.json and frames/:
#
#   bash assemble.sh [options] SHOT [SHOT ...]
#
# SHOT is  FILE:IN:OUT             one b-roll cut, scaled to fill 1080x1920
#     or   FILE:IN:OUT:WxH+X+Y     scaled to WxH first, then cropped to 1080x1920 from (X,Y).
#                                  Use it to put the subject in the band y800-1128.
#   e.g.   s1_phone.mp4:1.5:5.58   s3_car.mp4:0.9:5.96:1210x2150+65+230
# The shots play in the order given. Whatever time is left is a void plate; the end card covers it.
#
# Options, each with its default:
#   -o, --out FILE          the MP4 to write                               out.mp4
#   -t, --total SECONDS     length of the film                             events.json "total"
#   -b, --boom-at SECONDS   where the boom lands                           the first end-card frame (events.json "callEnd")
#       --opener-at SECONDS where the opener hit lands                     the first frame of the call (events.json "pickup")
#       --call FILE         the cut call from build_data.py                call_cut.wav
#       --boom FILE         from make_boom.py; "none" for no boom          boom.wav
#       --opener FILE       from make_opener.py; used only if it exists    opener.wav
#       --frames DIR        overlay PNGs from render.py full               frames
#       --ui DIR            a second PNG layer on top (ui-google.html)     none
#
# The export and the loudness come from presets/export.json and presets/loudness.json.
# Leaves base.mp4, premaster.wav and master.wav beside the MP4 for checking. It ends by printing the
# probe and the measured loudness, with PASS or FAIL against the house standard. Exit 3 on FAIL.
set -euo pipefail

KIT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && { pwd -W 2>/dev/null || pwd; })"
die() { echo "assemble.sh: $*" >&2; exit 1; }

# jget FILE KEY -> a top-level number or string. Works because every key sits on its own line.
jget() {
  tr -d '\r' < "$1" | sed -n 's/^[[:space:]]*"'"$2"'"[[:space:]]*:[[:space:]]*"\{0,1\}\([^",]*\)"\{0,1\},\{0,1\}[[:space:]]*$/\1/p' | head -n 1
}
isnum() { [[ "$1" =~ ^-?[0-9]+(\.[0-9]+)?$ ]]; }

OUT="out.mp4"; TOTAL=""; BOOM_AT=""; OPENER_AT=""
CALL="call_cut.wav"; BOOM="boom.wav"; OPENER="opener.wav"; FRAMES="frames"; UI=""
SHOTS=()
while [ $# -gt 0 ]; do
  case "$1" in
    -o|--out) OUT="$2"; shift 2 ;;
    -t|--total) TOTAL="$2"; shift 2 ;;
    -b|--boom-at) BOOM_AT="$2"; shift 2 ;;
    --opener-at) OPENER_AT="$2"; shift 2 ;;
    --call) CALL="$2"; shift 2 ;;
    --boom) BOOM="$2"; shift 2 ;;
    --opener) OPENER="$2"; shift 2 ;;
    --frames) FRAMES="$2"; shift 2 ;;
    --ui) UI="$2"; shift 2 ;;
    -h|--help) sed -n '2,28p' "$0"; exit 0 ;;
    -*) die "unknown option $1 (try --help)" ;;
    *) SHOTS+=("$1"); shift ;;
  esac
done

EX="$KIT/presets/export.json"; LO="$KIT/presets/loudness.json"
[ -f "$EX" ] && [ -f "$LO" ] || die "presets missing under $KIT/presets"
W="$(jget "$EX" width)"; H="$(jget "$EX" height)"; FPS="$(jget "$EX" fps)"
LI="$(jget "$LO" integrated_lufs)"; LTP="$(jget "$LO" true_peak_target_dbtp)"; LCEIL="$(jget "$LO" true_peak_ceiling_dbtp)"
LRA="$(jget "$LO" lra)"; LTOL="$(jget "$LO" tolerance_lu)"; BOOM_VOL="$(jget "$LO" boom_volume)"; OPENER_VOL="$(jget "$LO" opener_volume)"

# times: an option wins, then events.json from build_data.py
EV="events.json"
if [ -z "$TOTAL" ] && [ -f "$EV" ]; then TOTAL="$(jget "$EV" total)"; fi
isnum "${TOTAL:-x}" || die "no film length: pass --total SECONDS, or run build_data.py here first (it writes events.json)"
# The overlay draws frame i at (i + 0.5) / fps. A sound belongs on the first frame at or after its event.
frame_time() { awk -v t="$1" -v f="$FPS" 'BEGIN { x = t * f - 0.5; i = int(x); if (i < x - 1e-9) i++; if (i < 0) i = 0; printf "%.4f", i / f }'; }
if [ -z "$BOOM_AT" ] && [ -f "$EV" ]; then v="$(jget "$EV" callEnd)"; if isnum "${v:-x}"; then BOOM_AT="$(frame_time "$v")"; fi; fi
if [ -z "$OPENER_AT" ] && [ -f "$EV" ]; then v="$(jget "$EV" pickup)"; if isnum "${v:-x}"; then OPENER_AT="$(frame_time "$v")"; fi; fi

[ -f "$CALL" ] || die "no call audio at $CALL (build_data.py writes call_cut.wav)"
[ -d "$FRAMES" ] || die "no overlay frames in $FRAMES/ (render.py full writes them)"
NEED="$(awk -v t="$TOTAL" -v f="$FPS" 'BEGIN { printf "%d", t * f + 0.5 }')"
HAVE="$(find "$FRAMES" -maxdepth 1 -name 'f[0-9]*.png' | wc -l | tr -d ' ')"
[ "$HAVE" -ge "$NEED" ] || die "$FRAMES/ holds $HAVE frames, the film needs $NEED ($TOTAL s at $FPS fps). Run render.py full."
if [ -n "$UI" ]; then [ -d "$UI" ] || die "no UI frames in $UI/"; fi
USE_BOOM=0
if [ "$BOOM" != "none" ]; then
  [ -f "$BOOM" ] || die "no boom at $BOOM (python3 make_boom.py boom.wav), or pass --boom none"
  isnum "${BOOM_AT:-x}" || die "no boom time: pass --boom-at SECONDS"
  USE_BOOM=1
fi
USE_OPENER=0
if [ "$OPENER" != "none" ] && [ -f "$OPENER" ] && isnum "${OPENER_AT:-x}"; then USE_OPENER=1; fi

echo "assemble: ${#SHOTS[@]} shots, total $TOTAL s, boom $([ $USE_BOOM = 1 ] && echo "at $BOOM_AT s" || echo off), opener $([ $USE_OPENER = 1 ] && echo "at $OPENER_AT s" || echo off)"

# ---- 1. base video: the b-roll cuts, then a void plate to the end ------------------------------
INS=(); FC=""; LABS=""; USED="0"; n=0
for spec in ${SHOTS[@]+"${SHOTS[@]}"}; do
  geo=""; last="${spec##*:}"
  if [[ "$last" =~ ^[0-9]+x[0-9]+\+[0-9]+\+[0-9]+$ ]]; then geo="$last"; spec="${spec%:*}"; fi
  s_out="${spec##*:}"; spec="${spec%:*}"; s_in="${spec##*:}"; file="${spec%:*}"
  isnum "$s_in" && isnum "$s_out" || die "a shot is FILE:IN:OUT or FILE:IN:OUT:WxH+X+Y, got: $file:$s_in:$s_out"
  [ -f "$file" ] || die "no shot file at $file"
  if [ -n "$geo" ]; then
    size="${geo%%+*}"; off="${geo#*+}"
    fit="scale=${size%x*}:${size#*x},crop=$W:$H:${off%+*}:${off#*+}"
  else
    fit="scale=$W:$H:force_original_aspect_ratio=increase,crop=$W:$H"
  fi
  INS+=(-i "$file")
  FC="${FC}[$n:v]trim=$s_in:$s_out,setpts=PTS-STARTPTS,fps=$FPS,$fit,setsar=1[v$n];"
  LABS="${LABS}[v$n]"
  USED="$(awk -v u="$USED" -v a="$s_in" -v b="$s_out" 'BEGIN { printf "%.4f", u + b - a }')"
  n=$((n + 1))
done
TAIL="$(awk -v t="$TOTAL" -v u="$USED" 'BEGIN { d = t - u; if (d < 0) d = 0; printf "%.4f", d + 0.5 }')"
# setparams writes the BT.709 tags onto the frames. Newer ffmpeg takes them from there, not from the options.
TAGS="setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=tv"
FC="${FC}color=c=0x0A0A0F:s=${W}x${H}:r=$FPS:d=$TAIL,setsar=1[vt];${LABS}[vt]concat=n=$((n + 1)):v=1:a=0,trim=duration=$TOTAL,setpts=PTS-STARTPTS,format=yuv420p,$TAGS[base]"
ffmpeg -v error -y ${INS[@]+"${INS[@]}"} -filter_complex "$FC" -map "[base]" \
  -c:v libx264 -crf "$(jget "$EX" base_crf)" -preset "$(jget "$EX" base_preset)" -pix_fmt yuv420p \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 base.mp4

# ---- 2. audio: the call, the boom on the slam, the opener on the cut ---------------------------
AIN=(-i "$CALL"); AFC="[0:a]aresample=48000,apad=whole_dur=$TOTAL[c];"; MIX="[c]"; k=1
if [ $USE_BOOM = 1 ]; then
  ms="$(awk -v t="$BOOM_AT" 'BEGIN { printf "%d", t * 1000 + 0.5 }')"
  AIN+=(-i "$BOOM"); AFC="${AFC}[$k:a]aresample=48000,adelay=$ms:all=1,apad=whole_dur=$TOTAL,volume=$BOOM_VOL[b];"; MIX="${MIX}[b]"; k=$((k + 1))
fi
if [ $USE_OPENER = 1 ]; then
  ms="$(awk -v t="$OPENER_AT" 'BEGIN { printf "%d", t * 1000 + 0.5 }')"
  AIN+=(-i "$OPENER"); AFC="${AFC}[$k:a]aresample=48000,adelay=$ms:all=1,apad=whole_dur=$TOTAL,volume=$OPENER_VOL[o];"; MIX="${MIX}[o]"; k=$((k + 1))
fi
AFC="${AFC}${MIX}amix=inputs=$k:normalize=0:duration=first[m]"
ffmpeg -v error -y "${AIN[@]}" -filter_complex "$AFC" -map "[m]" -ac 1 -t "$TOTAL" premaster.wav

# ---- 3. master: two-pass loudnorm ---------------------------------------------------------------
J="$(ffmpeg -hide_banner -nostats -i premaster.wav -af "loudnorm=I=$LI:TP=$LTP:LRA=$LRA:print_format=json" -f null - 2>&1 | tr -d '\r' | sed -n '/^{/,/^}/p')"
lval() { printf '%s\n' "$J" | sed -n 's/^[[:space:]]*"'"$1"'"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n 1; }
MI="$(lval input_i)"; MTP="$(lval input_tp)"; MLRA="$(lval input_lra)"; MTH="$(lval input_thresh)"; OFF="$(lval target_offset)"
isnum "${MI:-x}" || die "could not measure the premaster (silent audio?). loudnorm said: ${MI:-nothing}"
ffmpeg -v error -y -i premaster.wav \
  -af "loudnorm=I=$LI:TP=$LTP:LRA=$LRA:measured_I=$MI:measured_TP=$MTP:measured_LRA=$MLRA:measured_thresh=$MTH:offset=$OFF:linear=true,aresample=48000" \
  -ac 2 master.wav

# ---- 4. composite and export ----------------------------------------------------------------------
# The PNGs are sRGB. They go to YUV with the BT.709 matrix, stated, so a brand hex survives on every ffmpeg.
VIN=(-i base.mp4 -framerate "$FPS" -i "$FRAMES/f%05d.png"); a_idx=2
VFC="[1:v]format=rgba,scale=out_color_matrix=bt709:out_range=tv,format=yuva420p[ov];[0:v][ov]overlay=0:0:format=yuv420[v1]"
VLAST="[v1]"
if [ -n "$UI" ]; then
  VIN+=(-framerate "$FPS" -i "$UI/f%05d.png"); a_idx=3
  VFC="${VFC};[2:v]format=rgba,scale=out_color_matrix=bt709:out_range=tv,format=yuva420p[ou];[v1][ou]overlay=0:0:format=yuv420[v2]"
  VLAST="[v2]"
fi
VFC="${VFC};${VLAST}format=$(jget "$EX" pix_fmt),$TAGS[v]"
ffmpeg -v error -y "${VIN[@]}" -i master.wav -filter_complex "$VFC" -map "[v]" -map "$a_idx:a" \
  -c:v "$(jget "$EX" video_codec)" -crf "$(jget "$EX" crf)" -preset "$(jget "$EX" preset)" \
  -profile:v "$(jget "$EX" profile)" -level "$(jget "$EX" level)" -r "$FPS" -fps_mode cfr \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a "$(jget "$EX" audio_codec)" -b:a "$(jget "$EX" audio_bitrate)" -ar "$(jget "$EX" audio_rate)" -ac "$(jget "$EX" audio_channels)" \
  -movflags "$(jget "$EX" movflags)" -t "$TOTAL" "$OUT"

# ---- 5. what was made -----------------------------------------------------------------------------
echo "--- probe: $OUT"
ffprobe -v error -show_entries format=duration,size:stream=codec_name,profile,level,width,height,pix_fmt,r_frame_rate,sample_rate,channels -of compact "$OUT"
SUM="$(ffmpeg -hide_banner -nostats -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | tr -d '\r' | sed -n '/Summary:/,$p')"
GOT_I="$(printf '%s\n' "$SUM" | sed -n 's/^[[:space:]]*I:[[:space:]]*\(-\{0,1\}[0-9.]*\) LUFS.*/\1/p' | head -n 1)"
GOT_LRA="$(printf '%s\n' "$SUM" | sed -n 's/^[[:space:]]*LRA:[[:space:]]*\(-\{0,1\}[0-9.]*\) LU.*/\1/p' | head -n 1)"
GOT_TP="$(printf '%s\n' "$SUM" | sed -n 's/^[[:space:]]*Peak:[[:space:]]*\(-\{0,1\}[0-9.]*\) dBFS.*/\1/p' | head -n 1)"
echo "--- loudness: I $GOT_I LUFS (target $LI, +/- $LTOL) / true peak $GOT_TP dBTP (ceiling $LCEIL) / LRA $GOT_LRA LU"
if awk -v i="$GOT_I" -v t="$LI" -v tol="$LTOL" -v p="$GOT_TP" -v c="$LCEIL" 'BEGIN { d = i - t; if (d < 0) d = -d; exit !(d <= tol && p <= c + 0.05) }'; then
  echo "LOUDNESS PASS"
else
  echo "LOUDNESS FAIL - fix the mix before this file goes anywhere"
  exit 3
fi
