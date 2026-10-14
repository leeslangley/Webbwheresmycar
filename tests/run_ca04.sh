#!/bin/sh
# Check the CA04 lofted body: each fixture renders with --body loft and --report.
# The render must exit 0 and print RENDERED and LOFT CHECK OK, and the REPORT body
# line must be the right size: dx within 3 of 100 (the profile length), dy no more
# than plan.width_units+0.5 and at least 0.8*plan.width_units. Blender is slow, so
# this is not part of `make test`.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

BLENDER=${BLENDER:-/opt/homebrew/bin/blender}
out1=/tmp/ca04_dossier_ok.png
out2=/tmp/ca04_t1_chimp.png

ok=1

# check_body <label> <dossier json> <out png> <extra args...>
check_body() {
	label=$1
	dossier=$2
	out=$3
	shift 3
	rm -f "$out"
	if ! res=$("$BLENDER" --background --python-exit-code 1 \
	        --python tools/art/blender_car2.py -- \
	        --dossier "$dossier" --out "$out" --body loft --report "$@" 2>&1); then
		echo "FAIL: $label did not exit 0:"
		echo "$res" | tail -5
		ok=0
		return
	fi
	case "$res" in
	*"RENDERED $out"*) ;;
	*) echo "FAIL: $label exited 0 but output missing 'RENDERED $out'"; ok=0; return ;;
	esac
	case "$res" in
	*"LOFT CHECK OK"*) ;;
	*) echo "FAIL: $label output missing 'LOFT CHECK OK'"; echo "$res" | grep LOFT; ok=0; return ;;
	esac
	line=$(printf '%s\n' "$res" | grep '^REPORT body ' | head -n 1)
	if [ -z "$line" ]; then
		echo "FAIL: $label output has no 'REPORT body' line"
		ok=0
		return
	fi
	dx=$(printf '%s\n' "$line" | sed -n 's/.* dx=\([-0-9.]*\).*/\1/p')
	dy=$(printf '%s\n' "$line" | sed -n 's/.* dy=\([-0-9.]*\).*/\1/p')
	width=$(python3 -c 'import json, sys; print(json.load(open(sys.argv[1]))["plan"]["width_units"])' "$dossier")
	if awk -v dx="$dx" -v dy="$dy" -v w="$width" \
	    'BEGIN { exit !((dx >= 97 && dx <= 103) && (dy <= w + 0.5) && (dy >= 0.8 * w)) }'; then
		echo "$label: $line (width_units $width)"
	else
		echo "FAIL: $label REPORT body size out of range: $line (width_units $width)"
		ok=0
	fi
}

# 1. dossier_ok with its explicit details file.
check_body "dossier_ok" tests/fixtures/dossier_ok.json "$out1" \
	--details tests/fixtures/details_ok.json

# 2. t1_chimp with its own details file. --details none would skip the parts
#    framework (and so the loft stage), so the real chimp details are used.
check_body "t1_chimp" docs/cars/t1_chimp.json "$out2" \
	--details docs/cars/details/t1_chimp.json

if [ "$ok" -eq 1 ]; then
	echo "CA04 OK"
	exit 0
fi
exit 1
