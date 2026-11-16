#!/usr/bin/env bash
# Encode frames + mix -> mp4 with burned-in captions, then QA.   bash finish.sh "<slug>"
# Same as kit/tools/finish.sh plus captions: builds work/captions.ass from work/words.json
# (scripts/captions.py) and burns it in with the bundled font. CAPTIONS=0 turns them off.
set -e; T="${1:-short}"; F="out/${T// /-}.mp4"; mkdir -p out
PY=python3; $PY -c 1 2>/dev/null || PY=python
ROOT="$(cd ../.. && pwd)"
VF="null"
if [ "${CAPTIONS:-1}" != "0" ]; then
  [ -f work/words.json ] || { echo "ERROR: work/words.json missing (run timing.py). Captions are required; set CAPTIONS=0 to skip."; exit 1; }
  $PY "$ROOT/scripts/captions.py" .
  mkdir -p fonts; cp -n "$ROOT"/assets/fonts/*.ttf fonts/ 2>/dev/null || true
  VF="ass=work/captions.ass:fontsdir=fonts"
fi
ffmpeg -v error -y -i mix_raw.wav -af "loudnorm=I=-14:TP=-1.5:LRA=7" -ar 48000 -ac 2 mix.wav
ffmpeg -v error -y -framerate 30 -i frames/f%04d.jpg -i mix.wav -map 0:v:0 -map 1:a:0 -vf "$VF" -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "$F"
ffprobe -v error -show_entries format=duration -show_entries stream=width,height,r_frame_rate -of compact "$F"
echo "--- QA (empty = no black/frozen spans)"; ffmpeg -i "$F" -vf "freezedetect=n=0.0005:d=0.4,blackdetect=d=0.05" -an -f null - 2>&1 | grep -E "freeze_start|black_start" || true
ffmpeg -i "$F" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1
[ "$VF" = "null" ] && echo "captions: OFF" || echo "captions: ON ($(grep -c '^Dialogue' work/captions.ass) events)"
ffmpeg -v error -y -i "$F" -vf "fps=2,scale=180:-1,tile=10x4" -frames:v 1 out/qa_sheet.jpg; echo "$F"
