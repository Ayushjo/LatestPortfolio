#!/bin/sh
# Renders scripts/og/card.html to public/og-v3.png (1200×630) with headless Chrome.
# Bump the file name (and ogImage in src/layouts/Base.astro) when the card changes,
# so X and LinkedIn fetch the new one instead of their cached copy.
set -e
cd "$(dirname "$0")/../.."
python3 -m http.server 8765 >/dev/null 2>&1 & SERVER=$!
trap 'kill $SERVER' EXIT
sleep 1
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=1 --window-size=1200,630 --virtual-time-budget=8000 \
  --screenshot="$PWD/public/og-v3.png" "http://localhost:8765/scripts/og/card.html" >/dev/null 2>&1
echo "wrote public/og-v3.png"
