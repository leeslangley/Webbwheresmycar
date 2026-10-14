#!/bin/sh
# Check the CA06 windows stage: glass panes cut from the body shell, frame rims
# and pillars. Each render must exit 0 and print RENDERED. The fixture's window_0
# must be a band of body width (dy above 0.7 and below plan.width_units), and it
# needs a pillar_0_n, pillar_0_f and frame_0. docs/cars/t1_chimp.json, with no
# --details argument, must show at least one window_ line. Blender is slow, so
# this is not part of `make test`.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

BLENDER=${BLENDER:-/opt/homebrew/bin/blender}
out1=/tmp/ca06_windows.png
out2=/tmp/ca06_t1_chimp.png

ok=1

# run_car <label> <dossier json> <out png> <extra args...>
# Renders with --body loft --report and returns the output in $res.
run_car() {
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
		return 1
	fi
	case "$res" in
	*"RENDERED $out"*) ;;
	*) echo "FAIL: $label exited 0 but output missing 'RENDERED $out'"; ok=0; return 1 ;;
	esac
	return 0
}

# 1. The windows fixture: window_0 band, pillar_0_n, pillar_0_f and frame_0.
if run_car "windows" tests/fixtures/dossier_ok.json /tmp/ca06_windows.png \
	--details tests/fixtures/details_windows.json; then
	width=$(python3 -c 'import json, sys; print(json.load(open(sys.argv[1]))["plan"]["width_units"])' tests/fixtures/dossier_ok.json)
	line=$(printf '%s\n' "$res" | grep '^REPORT window_0 ' | head -n 1)
	if [ -z "$line" ]; then
		echo "FAIL: windows output has no 'REPORT window_0' line"
		ok=0
	else
		dy=$(printf '%s\n' "$line" | sed -n 's/.* dy=\([-0-9.]*\).*/\1/p')
		if awk -v dy="$dy" -v w="$width" \
		    'BEGIN { exit !((dy > 0.7 * w) && (dy < w + 0.5)) }'; then
			echo "windows: $line (width_units $width)"
		else
			echo "FAIL: window_0 dy out of range: $line (width_units $width)"
			ok=0
		fi
	fi
	for want in 'REPORT pillar_0_n ' 'REPORT pillar_0_f ' 'REPORT frame_0 '; do
		if ! printf '%s\n' "$res" | grep -q "^$want"; then
			echo "FAIL: windows output has no '$want' line"
			ok=0
		fi
	done
fi

# 2. t1_chimp with no --details argument: its own details file is used, and it
#    must produce at least one window_ piece.
if run_car "t1_chimp" docs/cars/t1_chimp.json /tmp/ca06_t1_chimp.png; then
	if printf '%s\n' "$res" | grep -q '^REPORT window_'; then
		printf '%s\n' "$res" | grep '^REPORT window_' | head -n 1 | sed 's/^/t1_chimp: /'
	else
		echo "FAIL: t1_chimp output has no 'REPORT window_' line"
		ok=0
	fi
fi

# 3. A degenerate window (2 points, not a face) is skipped with a WARN line, and
#    the rest of the car still builds: window_0 from the fixture must still appear.
degen=$(mktemp /tmp/ca06_degenerate.XXXXXX)
python3 -c 'import json, sys
d = json.load(open(sys.argv[1]))
d["windows"].append([[0, 26.5], [1, 27.5]])
json.dump(d, open(sys.argv[2], "w"))' tests/fixtures/details_windows.json "$degen"
if run_car "degenerate window" tests/fixtures/dossier_ok.json /tmp/ca06_degenerate.png --details "$degen"; then
	if ! printf '%s\n' "$res" | grep -q '^WARN window 1 degenerate$'; then
		echo "FAIL: degenerate window output has no 'WARN window 1 degenerate' line"
		ok=0
	fi
	if ! printf '%s\n' "$res" | grep -q '^REPORT window_0 '; then
		echo "FAIL: degenerate window: window_0 missing, the car did not build the rest"
		ok=0
	fi
fi
rm -f "$degen"

if [ "$ok" -eq 1 ]; then
	echo "CA06 OK"
	exit 0
fi
exit 1
