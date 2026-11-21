#!/usr/bin/env bash
# Reads the render request for one project and writes job outputs to $GITHUB_OUTPUT.
# Slug comes from the workflow_dispatch input, or from the projects/<slug>/render.txt changed in this push.
set -euo pipefail
SLUG="${INPUT_SLUG:-}"
if [ -z "$SLUG" ]; then
  if [ -n "${BEFORE:-}" ] && [ "$BEFORE" != "0000000000000000000000000000000000000000" ] && git cat-file -e "$BEFORE" 2>/dev/null; then
    CHANGED=$(git diff --name-only "$BEFORE" "$GITHUB_SHA")
  else
    CHANGED=$(git show --name-only --format= "$GITHUB_SHA")
  fi
  SLUG=$(echo "$CHANGED" | grep -E '^projects/[^/]+/render\.txt$' | tail -1 | cut -d/ -f2 || true)
fi
[ -n "$SLUG" ] || { echo "no projects/<slug>/render.txt in this push"; exit 1; }
P="projects/$SLUG"; R="$P/render.txt"
[ -f "$R" ] || { echo "$R missing"; exit 1; }
if [ ! -f "$P/voice.mp3" ]; then   # new project without a voice yet: nothing to render, skip quietly
  echo "$P/voice.mp3 not uploaded yet: skipping"; { echo "slug=$SLUG"; echo "mode=skip"; } | tee -a "${GITHUB_OUTPUT:-/dev/stdout}"; exit 0; fi
get() { grep -E "^$1:" "$R" | head -1 | sed -E "s/^$1:[[:space:]]*//; s/[[:space:]]+#.*$//; s/[[:space:]]+$//" || true; }
MODE=$(get mode); MODE=${MODE:-stills}
TITLE=$(get title); TITLE=${TITLE:-$SLUG}
STILLS=$(get stills); STILLS=${STILLS:-5,40,90,150}
SHARDS=$(get shards); SHARDS=${SHARDS:-6}
RELEASE=$(get release); RELEASE=${RELEASE:-yes}
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$P/voice.mp3")
TOTAL=$(awk -v d="$DUR" 'BEGIN{printf "%d", d*30+0.5}')
FRAMES=$(get frames); FRAMES=${FRAMES:-0-$((TOTAL-1))}
STORY_TOTAL=$(grep -oE 'TOTAL *= *[0-9]+' "$P/web/story.js" | grep -oE '[0-9]+' | head -1 || true)
[ -z "$STORY_TOTAL" ] || [ "$STORY_TOTAL" = "$TOTAL" ] || echo "::warning::story.js TOTAL=$STORY_TOTAL but voice.mp3 is $TOTAL frames"
SHARDS=$(awk -v n="$SHARDS" 'BEGIN{n=int(n); if(n<1)n=1; if(n>20)n=20; print n}')
SHARD_LIST=$(awk -v n="$SHARDS" 'BEGIN{s="["; for(i=0;i<n;i++) s=s (i?",":"") i; print s "]"}')
{
  echo "slug=$SLUG"; echo "mode=$MODE"; echo "title=$TITLE"; echo "stills=$STILLS"
  echo "frames=$FRAMES"; echo "total=$TOTAL"; echo "shards=$SHARD_LIST"; echo "nshards=$SHARDS"; echo "release=$RELEASE"
} | tee -a "${GITHUB_OUTPUT:-/dev/stdout}"
