#!/bin/sh
# Check CA07 wheels v2: the fixture renders with its details file and the report
# shows 4 tyres, 4 hubcaps and WHEELS n=4; a copy of the fixture with a whitewall
# and trim ring renders with at least 4 whitewall objects. Blender is slow, so
# this is not part of `make test`.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

BLENDER=${BLENDER:-/opt/homebrew/bin/blender}
out1=/tmp/ca07_steel.png
out2=/tmp/ca07_whitewall.png
tmpd=$(mktemp -d "${TMPDIR:-/tmp}/ca07.XXXXXX")
trap 'rm -rf "$tmpd"' EXIT

ok=1

# The whitewall copy: the same details file with the wheel block changed.
ww_details="$tmpd/details_whitewall.json"
python3 -I - tests/fixtures/details_ok.json "$ww_details" <<'PY'
import json
import sys

with open(sys.argv[1]) as f:
	details = json.load(f)
details['wheel'] = {'style': 'steel', 'whitewall': True, 'trim_ring': True,
                    'hub': 'chrome'}
with open(sys.argv[2], 'w') as f:
	json.dump(details, f)
PY
if [ $? -ne 0 ]; then
	echo "FAIL: could not write the whitewall copy of the details fixture"
	exit 1
fi

# run_render <label> <out png> <details json>: exit 0, RENDERED, WHEELS n=4.
# The Blender output is left in $tmpd/<label>.log for the counts.
run_render() {
	label=$1
	out=$2
	details=$3
	log="$tmpd/$label.log"
	rm -f "$out"
	if "$BLENDER" --background --python-exit-code 1 \
	        --python tools/art/blender_car2.py -- \
	        --dossier tests/fixtures/dossier_ok.json --out "$out" \
	        --details "$details" --body loft --report > "$log" 2>&1; then
		if ! grep -q "^RENDERED $out" "$log"; then
			echo "FAIL: $label exited 0 but printed no 'RENDERED $out' line"
			ok=0
		fi
	else
		echo "FAIL: $label did not exit 0:"
		tail -5 "$log"
		ok=0
	fi
	if ! grep -q '^WHEELS n=4' "$log"; then
		echo "FAIL: $label did not print WHEELS n=4"
		ok=0
	fi
}

# 1. The fixture with its details file: 4 tyres and 4 hubcaps.
run_render "steel" "$out1" tests/fixtures/details_ok.json
log1="$tmpd/steel.log"
n_tyre=$(grep -c '^REPORT tyre_' "$log1")
n_hub=$(grep -c '^REPORT hubcap_' "$log1")
if [ "$n_tyre" -ne 4 ]; then
	echo "FAIL: expected 4 REPORT tyre_ lines, got $n_tyre"
	ok=0
fi
if [ "$n_hub" -ne 4 ]; then
	echo "FAIL: expected 4 REPORT hubcap_ lines, got $n_hub"
	ok=0
fi

# 2. The same fixture with a whitewall and trim ring: at least 4 whitewall objects.
run_render "whitewall" "$out2" "$ww_details"
n_ww=$(grep -c '^REPORT whitewall_' "$tmpd/whitewall.log")
if [ "$n_ww" -lt 4 ]; then
	echo "FAIL: expected at least 4 REPORT whitewall_ lines, got $n_ww"
	ok=0
fi

if [ "$ok" -eq 1 ]; then
	echo "CA07 OK"
	exit 0
fi
exit 1
