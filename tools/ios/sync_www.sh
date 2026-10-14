#!/bin/sh
# Copy the browser game into ios/www/ (the folder the app bundles).
# Called by tests/run_sync_www.sh and (later) the iOS build.
set -u

root=$(cd "$(dirname "$0")/../.." && pwd)
cd "$root"

if [ ! -f index.html ]; then
	echo "sync_www: index.html not found in $root" >&2
	exit 1
fi

rm -rf ios/www
mkdir -p ios/www

# Top-level files that exist.
for f in index.html manifest.webmanifest sw.js; do
	[ -f "$f" ] && cp "$f" ios/www/
done

# The whole src/ tree.
cp -R src ios/www/src

# assets/ minus the art previews and anything under a build/ folder.
cp -R assets ios/www/assets
rm -rf ios/www/assets/art/preview
find ios/www/assets -depth -name build -type d -exec rm -rf {} +

n=$(find ios/www -type f | wc -l | tr -d ' ')
echo "SYNCED $n files"
