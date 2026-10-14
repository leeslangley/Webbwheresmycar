#!/bin/sh
# Check tools/ios/sync_www.sh: the app bundle gets the game and none of the
# dev-only folders. ios/www is git-ignored, so nothing here is committed.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

ok=1

out=$(sh tools/ios/sync_www.sh 2>&1)
if [ $? -ne 0 ]; then
	echo "FAIL: sync_www.sh exited non-zero:"
	echo "$out"
	exit 1
fi

for f in ios/www/index.html ios/www/src/main.js; do
	if [ ! -f "$f" ]; then
		echo "FAIL: $f missing after sync"
		ok=0
	fi
done

for d in ios/www/docs ios/www/tests ios/www/tools ios/www/cards ios/www/assets/art/preview; do
	if [ -e "$d" ]; then
		echo "FAIL: $d must not be copied into ios/www"
		ok=0
	fi
done

if [ "$ok" -ne 0 ]; then
	echo "SYNC WWW OK"
else
	exit 1
fi
