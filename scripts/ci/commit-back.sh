#!/usr/bin/env bash
# Commits result files (force-added past .gitignore) back to the branch that triggered the run.
#   commit-back.sh "<message>" file...
set -e
MSG="$1"; shift
git config user.name "render-bot"; git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add -f "$@"
git diff --cached --quiet && { echo "nothing to commit"; exit 0; }
git commit -q -m "$MSG"
for i in 1 2 3 4 5; do
  git pull -q --rebase --autostash origin "$GITHUB_REF_NAME" && git push -q origin "HEAD:$GITHUB_REF_NAME" && exit 0
  sleep $((i * 5))
done
echo "push failed"; exit 1
