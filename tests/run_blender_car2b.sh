#!/bin/sh
# V02: check that shape_body tapers the body: the nose and tail narrow and the
# roof is pulled in (tumblehome), while the plan width is still roughly met.
# Blender is slow, so this is not part of `make test`.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

BLENDER=${BLENDER:-/opt/homebrew/bin/blender}
out=/tmp/v02.png
dossier=tests/fixtures/dossier_taper.json

ok=1

rm -f "$out"
if res=$("$BLENDER" --background --python-exit-code 1 \
        --python tools/art/blender_car2.py -- \
        --dossier "$dossier" --out "$out" --report 2>&1); then
	case "$res" in
	*"RENDERED $out"*) ;;
	*) echo "FAIL: $dossier exited 0 but output missing 'RENDERED $out'"; ok=0 ;;
	esac
	line=$(printf '%s\n' "$res" | sed -n 's/^\(REPORT body .*\)$/\1/p' | tail -1)
	if [ -z "$line" ]; then
		echo "FAIL: --report output missing a 'REPORT body ' line"
		ok=0
	else
		width=$(python3 -c \
			"import json,sys; print(json.load(open(sys.argv[1]))['plan']['width_units'])" \
			"$dossier")
		if ! python3 - "$line" "$width" <<'PY'
import re
import sys

line, width = sys.argv[1], float(sys.argv[2])
m = re.search(r'dx=([0-9.]+) dy=([0-9.]+)', line)
if m is None:
    print('FAIL: cannot read dx and dy from %r' % line)
    sys.exit(1)
dx, dy = float(m.group(1)), float(m.group(2))
if dy > width + 0.5:
    print('FAIL: body dy %.2f is more than width_units + 0.5 (%.2f)' % (dy, width + 0.5))
    sys.exit(1)
if dy < 0.8 * width:
    print('FAIL: body dy %.2f is under 0.8 * width_units (%.2f)' % (dy, 0.8 * width))
    sys.exit(1)
if abs(dx - 100.0) > 3.0:
    print('FAIL: body dx %.2f is not within 3 units of 100' % dx)
    sys.exit(1)
print('body dx=%.2f dy=%.2f (width_units %.2f)' % (dx, dy, width))
PY
		then
			ok=0
		fi
	fi
else
	echo "FAIL: $dossier did not exit 0:"
	echo "$res" | tail -5
	ok=0
fi

if [ "$ok" -eq 1 ]; then
	echo "BLENDER CAR2B OK"
	exit 0
fi
exit 1
