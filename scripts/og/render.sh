#!/bin/sh
# Renders the share cards in scripts/og/card.html (1200×630) with headless Chrome:
#   home   → public/og-v3.png          (every page)
#   resume → public/og-resume-v1.png   (/resume)
# Bump the file name (and ogImage in src/layouts/Base.astro) when the card changes,
# so X and LinkedIn fetch the new one instead of their cached copy.
set -e
cd "$(dirname "$0")/../.."
python3 -m http.server 8765 >/dev/null 2>&1 & SERVER=$!
trap 'kill $SERVER' EXIT
sleep 1
render() {
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=1 --window-size=1200,630 --virtual-time-budget=8000 \
    --screenshot="$PWD/public/$2" "http://localhost:8765/scripts/og/card.html?card=$1" >/dev/null 2>&1
  echo "wrote public/$2"
}
render home og-v3.png
render resume og-resume-v1.png
