# Run from the working dir that holds s1..s5 shot mp4s, call_cut.wav, boom.wav (make_boom.py) and frames_v2/ (render.py full).
set -e
FC="[0:v]trim=1.5:5.58,setpts=PTS-STARTPTS,fps=30,scale=1080:1920,setsar=1[a];\
[1:v]trim=1.2:5.86,setpts=PTS-STARTPTS,fps=30,scale=1080:1920,setsar=1[b];\
[2:v]trim=0.9:5.96,setpts=PTS-STARTPTS,fps=30,scale=1210:2150,crop=1080:1920:65:230,setsar=1[c];\
[3:v]trim=0.2:5.95,setpts=PTS-STARTPTS,fps=30,scale=1080:1920,setsar=1[d];\
[4:v]trim=0.2:4.9,setpts=PTS-STARTPTS,fps=30,scale=1296:2304,crop=1080:1920:108:0,setsar=1[e];\
color=c=0x0A0A0F:s=1080x1920:r=30:d=3.2[f];\
[a][b][c][d][e][f]concat=n=6:v=1:a=0,trim=duration=27.2667,setpts=PTS-STARTPTS[base]"
ffmpeg -v error -y -i s1_phone.mp4 -i s2_jet.mp4 -i s3_car.mp4 -i s4_road.mp4 -i s5_golf.mp4 -filter_complex "$FC" -map "[base]" -c:v libx264 -crf 12 -preset fast -pix_fmt yuv420p base.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 base.mp4
# audio: call + boom
ffmpeg -v error -y -i call_cut.wav -i boom.wav -filter_complex "[0:a]aresample=48000,apad=whole_dur=27.2667[c];[1:a]aresample=48000,adelay=24250,apad=whole_dur=27.2667,volume=0.9[b];[c][b]amix=inputs=2:normalize=0:duration=first[m]" -map "[m]" -ac 1 premaster.wav
J=$(ffmpeg -hide_banner -i premaster.wav -af loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
MI=$(echo "$J"|python3 -c "import sys,json;d=json.load(sys.stdin);print(d['input_i'])"); MTP=$(echo "$J"|python3 -c "import sys,json;d=json.load(sys.stdin);print(d['input_tp'])"); MLRA=$(echo "$J"|python3 -c "import sys,json;d=json.load(sys.stdin);print(d['input_lra'])"); MTH=$(echo "$J"|python3 -c "import sys,json;d=json.load(sys.stdin);print(d['input_thresh'])"); OFF=$(echo "$J"|python3 -c "import sys,json;d=json.load(sys.stdin);print(d['target_offset'])")
ffmpeg -v error -y -i premaster.wav -af "loudnorm=I=-14:TP=-1.0:LRA=11:measured_I=$MI:measured_TP=$MTP:measured_LRA=$MLRA:measured_thresh=$MTH:offset=$OFF:linear=true,aresample=48000" -ac 2 master.wav
# composite
ffmpeg -v error -y -i base.mp4 -framerate 30 -i frames_v2/f%05d.png -i master.wav -filter_complex "[0:v][1:v]overlay=0:0:format=auto,format=yuv420p[v]" -map "[v]" -map 2:a -c:v libx264 -crf 17 -preset slow -profile:v high -level 4.2 -r 30 -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest AIC-VIDEO-01-airport-v2.mp4
ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate -of compact AIC-VIDEO-01-airport-v2.mp4
ffmpeg -hide_banner -i AIC-VIDEO-01-airport-v2.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -A12 Summary | grep -E "I:|Peak:|LRA:"
