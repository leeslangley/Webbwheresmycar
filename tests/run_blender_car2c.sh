#!/bin/sh
# Check the V03 glass builder: the greenhouse renders as glass0 with a smaller
# dy (width) than the body. Blender is slow, so this is not part of `make test`.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

BLENDER=${BLENDER:-/opt/homebrew/bin/blender}
out=/tmp/b03.png

ok=1

rm -f "$out"
if res=$("$BLENDER" --background --python-exit-code 1 \
        --python tools/art/blender_car2.py -- \
        --dossier tests/fixtures/dossier_ok.json --out "$out" --report 2>&1); then
	case "$res" in
	*"RENDERED $out"*) ;;
	*) echo "FAIL: dossier_ok.json exited 0 but output missing 'RENDERED $out'"; ok=0 ;;
	esac
	if ! printf '%s\n' "$res" | awk '
		/^REPORT body /   { body = substr($4, 4) + 0 }
		/^REPORT glass0 / { glass = substr($4, 4) + 0; found = 1 }
		END {
			if (!found) {
				print "FAIL: --report output missing a REPORT glass0 line"
				exit 1
			}
			if (!body) {
				print "FAIL: --report output missing a REPORT body dy"
				exit 1
			}
			if (glass >= body) {
				printf "FAIL: glass0 dy %.2f is not smaller than body dy %.2f\n", glass, body
				exit 1
			}
		}'; then
		ok=0
	fi
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

if [ "$ok" -eq 1 ]; then
	echo "BLENDER CAR2C OK"
	exit 0
fi
exit 1
