#!/usr/bin/env bash
# One-command project setup:  bash scripts/new-project.sh <slug>
# Runs kit/tools/setup.sh, then adds what setup.sh leaves out: mix.py, finish.sh,
# the stems-only audio.py template and a render.txt request file.
# Works in Git Bash on Windows, in Claude Code cloud sessions and in GitHub Actions.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SLUG="${1:?usage: bash scripts/new-project.sh <slug>}"
P="$ROOT/projects/$SLUG"
mkdir -p "$P"
# setup.sh copies the engine and tools. On Windows it stops at the type-strip step (it hands
# Git Bash paths to Node); prepare-project.sh below finishes the same work portably.
bash "$ROOT/kit/tools/setup.sh" "$P" || echo "(setup.sh stopped early; finishing with prepare-project.sh)"
[ -f "$P/web/main.js" ] && [ -f "$P/render.mjs" ] || { echo "setup.sh did not copy the engine"; exit 1; }
cp "$ROOT/mix.py" "$ROOT/templates/finish.sh" "$P/"      # finish.sh with burned-in captions
cp "$ROOT/templates/audio.py" "$P/audio.py"          # replaces the example's self-mixing audio.py
cp "$ROOT/templates/music.py" "$ROOT/scripts/thumbnail.py" "$P/"   # calm music library, thumbnail maker
bash "$ROOT/scripts/prepare-project.sh" "$P"
[ -f "$P/render.txt" ] || cat > "$P/render.txt" <<REQ
# Render request. Pushing a change to this file starts the GitHub Actions render.
# mode: stills  -> renders the frames listed in "stills" and commits stills/sheet_ci.jpg back
# mode: full    -> renders the whole video, publishes the MP4 as a GitHub Release
mode: stills
title: $SLUG
stills: 5,40,90,150
# frames: 0-59     (optional: render only this range, for tests)
# shards: 6        (optional: parallel render jobs, default 6)
# release: no      (optional: skip the GitHub Release, for tests)
# thumb: 1108                (caption-free frame for the thumbnail)
# thumb_text: HE BEAT A GIANT WITH ONE *WORD*   (*stars* = yellow)
# thumb_circle: 540,840,120   (optional red ring, 1080x1920 coords)
# thumb_focus: 0.4            (optional, vertical centre for the 16:9 version)
REQ
echo "project ready: projects/$SLUG"
