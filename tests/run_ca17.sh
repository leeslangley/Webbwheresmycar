#!/bin/sh
# Check the CA17 paint zones: the dossier_ok car renders with a details file that
# gives it a paint2 roof zone and a vinyl centre stripe, once with the default slab
# body and once with the lofted body (--body loft). Each render must exit 0 and print
# RENDERED, a 'PAINT zones=2 faces=<n>' line and 'PAINT slots=3' (the paint, paint2
# and vinyl slots). The lofted body must paint more than 20 faces. The slab body is
# one extruded polygon with only 27 faces, so there it only needs n > 0.
# Blender is slow, so this is not part of `make test`.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

BLENDER=${BLENDER:-/opt/homebrew/bin/blender}
out1=/tmp/ca17_slab.png
out2=/tmp/ca17_loft.png
details=$(mktemp /tmp/ca17_details.XXXXXX) || exit 1
trap 'rm -f "$details"' EXIT

# The details file: the dossier_ok details with the CA17 paint block added.
if ! python3 -I -c '
import json, sys
src, dst = sys.argv[1], sys.argv[2]
d = json.load(open(src))
d["paint"] = {
    "colour2": "#eae6dd",
    "zones": [
        {"region": "roof", "use": "paint2"},
        {"region": "centre_stripe", "w": 4, "x0": -45, "x1": 45, "use": "vinyl"},
    ],
}
json.dump(d, open(dst, "w"))
' tests/fixtures/details_ok.json "$details"; then
	echo "FAIL: could not write the paint details"
	exit 1
fi

ok=1

# check_paint <label> <min faces> <out png> <extra args...>
check_paint() {
	label=$1
	min=$2
	out=$3
	shift 3
	rm -f "$out"
	if ! res=$("$BLENDER" --background --python-exit-code 1 \
	        --python tools/art/blender_car2.py -- \
	        --dossier tests/fixtures/dossier_ok.json --details "$details" \
	        --out "$out" --report "$@" 2>&1); then
		echo "FAIL: $label did not exit 0:"
		echo "$res" | tail -5
		ok=0
		return
	fi
	case "$res" in
	*"RENDERED $out"*) ;;
	*) echo "FAIL: $label exited 0 but output missing 'RENDERED $out'"; ok=0; return ;;
	esac
	line=$(printf '%s\n' "$res" | grep '^PAINT zones=2 faces=' | head -n 1)
	if [ -z "$line" ]; then
		echo "FAIL: $label output has no 'PAINT zones=2 faces=' line"
		ok=0
		return
	fi
	faces=$(printf '%s\n' "$line" | sed -n 's/^PAINT zones=2 faces=\([0-9]*\).*/\1/p')
	if [ -z "$faces" ] || [ "$faces" -le "$min" ]; then
		echo "FAIL: $label painted too few faces: $line"
		ok=0
		return
	fi
	case "$res" in
	*"PAINT slots=3"*) ;;
	*) echo "FAIL: $label output missing 'PAINT slots=3'"; echo "$res" | grep PAINT; ok=0; return ;;
	esac
	echo "$label: $line, PAINT slots=3"
}

check_paint "slab" 0 "$out1"
check_paint "loft" 20 "$out2" --body loft

if [ "$ok" -eq 1 ]; then
	echo "CA17 OK"
	exit 0
fi
exit 1
