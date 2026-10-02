#!/bin/bash
# usage: grab.sh <generation_id> <outfile>
J=$(ls -t /root/.claude/projects/-home-claude-aivoiceagency/*.jsonl | head -1)
U=$(grep -o "https://storage.googleapis.com/xi-backend[^\"\\\\]*$1/content.mp4?[^\"\\\\]*" "$J" | tail -1)
[ -z "$U" ] && { echo "no url for $1"; exit 1; }
curl -sS -L -o "$2" "$U" && ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,duration -of compact "$2"
