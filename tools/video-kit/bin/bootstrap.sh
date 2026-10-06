#!/usr/bin/env bash
# tools/video-kit/bin/bootstrap.sh - get this machine ready to build a video.
#
#   bash tools/video-kit/bin/bootstrap.sh            check, and fix what it can
#   bash tools/video-kit/bin/bootstrap.sh --check    check only: installs and downloads nothing
#
# Idempotent: run it as often as you like. Prints a HAVE / MISSING table and exits 0 only when
# every row is HAVE. Runs on Linux (the cloud workspace) and on the Dell under Git Bash or WSL.
#
# Fixes by itself:  missing Python packages (pip), Chromium for Playwright, and the two font
#                   families (downloaded only when their files are absent).
# Only reports:     ffmpeg, ffprobe and Python itself. Those are yours to install.
#
# VK_PYTHON=/path/to/python picks the interpreter when the automatic choice is wrong.
set -u

CHECK=0
for arg in "$@"; do
  case "$arg" in
    --check) CHECK=1 ;;
    -h|--help) sed -n '2,14p' "$0"; exit 0 ;;
    *) echo "bootstrap.sh: unknown option: $arg (try --help)" >&2; exit 2 ;;
  esac
done

# pwd -W gives C:/... under Git Bash, a path both bash and a Windows python.exe can open.
KIT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && { pwd -W 2>/dev/null || pwd; })"

ROWS=""
MISSING=0
row() {  # row STATUS NAME DETAIL
  ROWS="${ROWS}$(printf '  %-8s %-16s %s' "$1" "$2" "$3")"$'\n'
  if [ "$1" = "MISSING" ]; then MISSING=$((MISSING + 1)); fi
}

# --- ffmpeg, ffprobe -------------------------------------------------------------------------
for tool in ffmpeg ffprobe; do
  if command -v "$tool" >/dev/null 2>&1; then
    row HAVE "$tool" "$("$tool" -version 2>/dev/null | head -n 1 | awk '{print $3}')"
  else
    row MISSING "$tool" "install ffmpeg  (Linux: sudo apt-get install -y ffmpeg / Dell: winget install Gyan.FFmpeg)"
  fi
done

# --- python3 ---------------------------------------------------------------------------------
# On the Dell, `python3` is the Windows Store stub and does not run. Take the first that does.
PY=""
for cand in "${VK_PYTHON:-}" python3 python "py -3"; do
  [ -n "$cand" ] || continue
  if $cand -c 'import sys; raise SystemExit(0 if sys.version_info[:2] >= (3, 9) else 1)' >/dev/null 2>&1; then
    PY="$cand"
    break
  fi
done

pymod() {  # pymod IMPORT_NAME PIP_NAME -> prints the version, fails when the import fails
  $PY -c 'import importlib, importlib.metadata, sys
m = importlib.import_module(sys.argv[1])
try:
    print(importlib.metadata.version(sys.argv[2]))
except Exception:
    print(getattr(m, "__version__", "present"))' "$1" "$2" 2>/dev/null
}

chromium_version() {  # a real headless launch: the only check that proves a render will work
  $PY -c 'from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch()
    print(b.version)
    b.close()' 2>/dev/null
}

if [ -z "$PY" ]; then
  row MISSING python3 "install Python 3.9 or newer  (Linux: sudo apt-get install -y python3 python3-pip / Dell: winget install Python.Python.3.12)"
  for name in numpy pillow faster-whisper playwright chromium space-grotesk jetbrains-mono; do
    row MISSING "$name" "needs python3 first"
  done
else
  PYV="$($PY -c 'import sys; print(".".join(map(str, sys.version_info[:3])))')"
  if [ "$PY" = "python3" ]; then row HAVE python3 "$PYV"; else row HAVE python3 "$PYV  (on this machine type: $PY)"; fi

  # --- Python packages -----------------------------------------------------------------------
  HAVE_PW=0
  for pair in numpy:numpy pillow:PIL faster-whisper:faster_whisper playwright:playwright; do
    pkg="${pair%%:*}"
    mod="${pair##*:}"
    ver="$(pymod "$mod" "$pkg")" || ver=""
    if [ -z "$ver" ] && [ "$CHECK" = 0 ]; then
      echo "bootstrap: installing $pkg with pip ..." >&2
      $PY -m pip install --disable-pip-version-check -q "$pkg" >&2 || true
      ver="$(pymod "$mod" "$pkg")" || ver=""
    fi
    if [ -n "$ver" ]; then
      row HAVE "$pkg" "$ver"
      if [ "$pkg" = "playwright" ]; then HAVE_PW=1; fi
    else
      row MISSING "$pkg" "$PY -m pip install $pkg  (system Python refuses? PIP_BREAK_SYSTEM_PACKAGES=1, or use a venv)"
    fi
  done

  # --- Chromium for Playwright ---------------------------------------------------------------
  if [ "$HAVE_PW" = 1 ]; then
    cv="$(chromium_version)" || cv=""
    if [ -z "$cv" ] && [ "$CHECK" = 0 ]; then
      echo "bootstrap: installing Chromium for Playwright ..." >&2
      $PY -m playwright install chromium >&2 || true
      cv="$(chromium_version)" || cv=""
    fi
    if [ -n "$cv" ]; then
      row HAVE chromium "$cv (headless launch ok)"
    else
      row MISSING chromium "$PY -m playwright install chromium  (Linux may also need: $PY -m playwright install-deps chromium)"
    fi
  else
    row MISSING chromium "needs the playwright package first"
  fi

  # --- fonts ---------------------------------------------------------------------------------
  FARG=""
  if [ "$CHECK" = 1 ]; then FARG="--check"; fi
  FOUT="$($PY "$KIT/bin/fonts.py" $FARG 2>&1)" || true
  while IFS= read -r line; do
    st="${line%% *}"
    rest="${line#* }"
    case "$st" in
      HAVE|MISSING) row "$st" "${rest%% *}" "${rest#* }" ;;
      *) if [ -n "$line" ]; then echo "bootstrap: fonts.py: $line" >&2; fi ;;
    esac
  done <<< "$FOUT"
fi

echo "VIDEO KIT bootstrap - $KIT"
printf '%s' "$ROWS"
if [ "$MISSING" = 0 ]; then
  echo "ALL PRESENT - ready to build."
  exit 0
fi
echo "$MISSING MISSING - the fix is on each MISSING row. Run this again after."
exit 1
