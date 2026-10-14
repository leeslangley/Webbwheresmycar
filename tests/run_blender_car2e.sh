#!/bin/sh
# Check the V05 lamps and plates: dossier_ok.json renders headlamps, tail lamps
# and number plates, and a dossier with an empty front falls back to the
# headlamp defaults. Blender is slow, so this is not part of `make test`.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

BLENDER=${BLENDER:-/opt/homebrew/bin/blender}
out=/tmp/b05e.png
empty=/tmp/b05e_front_empty.json
empty_out=/tmp/b05e_empty.png

ok=1

# 1. Valid dossier: exit 0, RENDERED, a 1024x512 PNG, and the lamps and plates reported.
rm -f "$out"
if res=$("$BLENDER" --background --python-exit-code 1 \
        --python tools/art/blender_car2.py -- \
        --dossier tests/fixtures/dossier_ok.json --out "$out" --details none --report 2>&1); then
	case "$res" in
	*"RENDERED $out"*) ;;
	*) echo "FAIL: dossier_ok.json exited 0 but output missing 'RENDERED $out'"; ok=0 ;;
	esac
	for prefix in headlamp_ taillamp_ plate_; do
		n=$(printf '%s\n' "$res" | grep -c "^REPORT $prefix")
		if [ "$n" -lt 2 ]; then
			echo "FAIL: expected at least 2 REPORT $prefix lines, got $n"
			ok=0
		fi
	done
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

# 2. The fixture with front = {}: exit 0, RENDERED, and the default headlamps.
if ! python3 -c "import json,sys; d=json.load(open(sys.argv[1])); d['front']={}; json.dump(d, open(sys.argv[2],'w'))" \
        tests/fixtures/dossier_ok.json "$empty"; then
	echo "FAIL: could not write the empty-front copy $empty"
	ok=0
fi
rm -f "$empty_out"
if res=$("$BLENDER" --background --python-exit-code 1 \
        --python tools/art/blender_car2.py -- \
        --dossier "$empty" --out "$empty_out" --details none --report 2>&1); then
	case "$res" in
	*"RENDERED $empty_out"*) ;;
	*) echo "FAIL: empty-front dossier exited 0 but output missing 'RENDERED $empty_out'"; ok=0 ;;
	esac
	n=$(printf '%s\n' "$res" | grep -c "^REPORT headlamp_")
	if [ "$n" -lt 2 ]; then
		echo "FAIL: empty-front dossier: expected default headlamps (2+ REPORT headlamp_ lines), got $n"
		ok=0
	fi
else
	echo "FAIL: empty-front dossier did not exit 0:"
	echo "$res" | tail -5
	ok=0
fi

if [ "$ok" -eq 1 ]; then
	echo "BLENDER CAR2E OK"
	exit 0
fi
exit 1
