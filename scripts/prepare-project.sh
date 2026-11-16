#!/usr/bin/env bash
# Restores the generated, git-ignored parts of a project so it can render anywhere:
#   web/lib/three.module.js, web/toonbase.js, web/toon.js, node_modules/playwright
# Safe to run many times.   bash scripts/prepare-project.sh projects/<slug>
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
P="$(cd "${1:?project dir}" && pwd)"
TMP="${TMPDIR:-${RUNNER_TEMP:-/tmp}}"
mkdir -p "$P/web/lib"
if [ ! -s "$P/web/lib/three.module.js" ]; then
  ( cd "$TMP" && rm -rf _three && mkdir _three && cd _three && npm pack three@0.160.0 >/dev/null 2>&1 \
    && tar xzf three-0.160.0.tgz && cp package/build/three.module.js "$P/web/lib/" )
fi
if [ ! -s "$P/web/toonbase.js" ]; then
  # Node 22-25 support mode "transform"; Node 26+ only "strip" (enough for toon.ts: no enums or namespaces)
  ( cd "$P" && node -e "const m=require('node:module'),fs=require('fs');const src=fs.readFileSync(process.argv[1],'utf8');let out;try{out=m.stripTypeScriptTypes(src,{mode:'transform'})}catch(e){out=m.stripTypeScriptTypes(src,{mode:'strip'})}fs.writeFileSync('web/toonbase.js',out)" "$ROOT/kit/vendor/toon.ts" )
fi
mkdir -p "$P/fonts"; cp "$ROOT"/assets/fonts/*.ttf "$P/fonts/" 2>/dev/null || true
cat "$P/web/toonbase.js" "$P/web/roman.js" > "$P/web/toon.js"
# setup.sh links a global playwright; drop the link if it points nowhere, then install locally
if [ -L "$P/node_modules/playwright" ] && [ ! -e "$P/node_modules/playwright/package.json" ]; then rm -f "$P/node_modules/playwright"; fi
if [ -z "${NO_PLAYWRIGHT:-}" ] && [ ! -e "$P/node_modules/playwright/package.json" ]; then ( cd "$P" && npm install --no-save --no-audit --no-fund playwright >/dev/null ); fi
for f in web/lib/three.module.js web/toonbase.js web/toon.js; do [ -s "$P/$f" ] || { echo "missing $f"; exit 1; }; done
echo "prepared: $P"
