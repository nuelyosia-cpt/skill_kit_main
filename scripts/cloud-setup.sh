#!/usr/bin/env bash
# SessionStart hook: gets a Claude Code cloud session ready to build videos.
# Does nothing on your own computer (only runs when CLAUDE_CODE_REMOTE=true).
# Installs what is missing: ffmpeg, Python numpy + Pillow, Playwright Chromium; prepares existing projects.
# Never fails the session: problems are reported as one line of context for Claude.
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
LOG="${TMPDIR:-/tmp}/cloud-setup.log"; : > "$LOG"
missing=()
SUDO=""; [ "$(id -u)" = "0" ] || SUDO="sudo"
if ! command -v ffmpeg >/dev/null; then
  ( $SUDO apt-get update -qq && $SUDO apt-get install -y -qq ffmpeg ) >>"$LOG" 2>&1 || missing+=("ffmpeg")
fi
python3 -c "import numpy, PIL" 2>/dev/null || pip install -q numpy pillow >>"$LOG" 2>&1 \
  || pip install -q --break-system-packages numpy pillow >>"$LOG" 2>&1 || missing+=("numpy/pillow")
# Chromium for stills checks in the session (the full render runs in GitHub Actions)
if ! ls ~/.cache/ms-playwright/chromium* >/dev/null 2>&1; then
  ( cd "$ROOT" && npx -y playwright install --with-deps chromium ) >>"$LOG" 2>&1 || missing+=("playwright-chromium")
fi
for p in "$ROOT"/projects/*/; do
  [ -f "$p/web/main.js" ] && bash "$ROOT/scripts/prepare-project.sh" "$p" >>"$LOG" 2>&1 || true
done
NODE=$(node -v 2>/dev/null || echo none)
if [ ${#missing[@]} -eq 0 ]; then MSG="cloud-setup: ready (node $NODE, ffmpeg, numpy/pillow, chromium)."
else MSG="cloud-setup: could not install ${missing[*]} (see $LOG). Use the GitHub Actions render (mode: stills) for picture checks."; fi
printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}\n' "$MSG"
