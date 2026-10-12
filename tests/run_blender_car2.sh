#!/bin/sh
# Check the dossier-driven Blender car builder: it renders a dossier and fails
# clearly on a missing one. Blender is slow, so this is not part of `make test`.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

BLENDER=${BLENDER:-/opt/homebrew/bin/blender}
out=/tmp/b01.png

ok=1

# 1. Valid dossier: exit 0, RENDERED, a REPORT body line, a 1024x512 PNG.
rm -f "$out"
if res=$("$BLENDER" --background --python-exit-code 1 \
        --python tools/art/blender_car2.py -- \
        --dossier tests/fixtures/dossier_ok.json --out "$out" --report 2>&1); then
	case "$res" in
	*"RENDERED $out"*) ;;
	*) echo "FAIL: dossier_ok.json exited 0 but output missing 'RENDERED $out'"; ok=0 ;;
	esac
	case "$res" in
	*"REPORT body "*) ;;
	*) echo "FAIL: --report output missing a 'REPORT body ' line"; ok=0 ;;
	esac
else
	echo "FAIL: dossier_ok.json did not exit 0:"
	echo "$res" | tail -5
	ok=0
fi

if [ -f "$out" ]; then
	info=$(file "$out")
	case "$info" in
	*"1024 x 512"*) ;;
	*) echo "FAIL: $out is not 1024 x 512: $info"; ok=0 ;;
	esac
else
	echo "FAIL: $out was not written"
	ok=0
fi

# 2. Missing dossier: non-zero exit and the message says 'dossier'.
if res=$("$BLENDER" --background --python-exit-code 1 \
        --python tools/art/blender_car2.py -- \
        --dossier /nonexistent.json --out /tmp/b01_bad.png 2>&1); then
	echo "FAIL: /nonexistent.json exited 0 (should be non-zero)"
	ok=0
else
	case "$res" in
	*dossier*) ;;
	*) echo "FAIL: missing-dossier failure does not mention 'dossier': $res"; ok=0 ;;
	esac
fi

if [ "$ok" -eq 1 ]; then
	echo "BLENDER CAR2 OK"
	exit 0
fi
exit 1
