#!/usr/bin/env bash
# Writes projects/<slug>/out/STATUS.md:  status.sh <slug> <state> <job> [logfile]
P="projects/$1"; mkdir -p "$P/out"
URL="$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"
{
  echo "# Render status: $2"; echo
  echo "- project: $1"; echo "- job: $3"; echo "- commit: $GITHUB_SHA"; echo "- run: $URL"; echo "- time (UTC): $(date -u +%F' '%T)"
  if [ -n "${4:-}" ] && [ -f "$4" ]; then echo; echo "## Last 60 log lines"; echo; echo '```'; tail -60 "$4"; echo '```'; fi
} > "$P/out/STATUS.md"
