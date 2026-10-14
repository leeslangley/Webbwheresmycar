#!/bin/sh
# Check CA08 wheels v2 and the spare wheel: the fixture renders three times, with
# its wheel style set to wire, knockoff and alloy, and one rear_door spare part.
# Each render exits 0, prints RENDERED and no WARN line for the spare, and
# reports a spare_0_c object (the spare is put first in the parts list). The wire render has at least 100 REPORT spoke_ lines, and
# the knockoff render has 4 REPORT spinner_ lines. Blender is slow, so this is
# not part of `make test`. The details copies are written into a scratch directory.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

BLENDER=${BLENDER:-/opt/homebrew/bin/blender}
work=$(mktemp -d "${TMPDIR:-/tmp}/ca08.XXXXXX") || exit 1
trap 'rm -rf "$work"' EXIT

ok=1

# run_render <style>: write the details copy, render it, check the report.
run_render() {
	style=$1
	details="$work/details_$style.json"
	log="$work/$style.log"
	out="$work/$style.png"
	python3 -I - tests/fixtures/details_ok.json "$details" "$style" <<'PY'
import json
import sys

with open(sys.argv[1]) as f:
	details = json.load(f)
details['wheel'] = {'style': sys.argv[3], 'hub': 'chrome', 'whitewall': False,
                    'trim_ring': False, 'hubcap_r': 4.0, 'spokes': 0}
details['parts'].insert(0, {'kind': 'spare', 'mount': 'rear_door', 'x': -50,
                            'y': 12, 'r': 7})
with open(sys.argv[2], 'w') as f:
	json.dump(details, f)
PY
	if [ $? -ne 0 ]; then
		echo "FAIL: could not write the $style details copy"
		ok=0
		return
	fi
	if "$BLENDER" --background --python-exit-code 1 \
	        --python tools/art/blender_car2.py -- \
	        --dossier tests/fixtures/dossier_ok.json --out "$out" \
	        --details "$details" --body loft --report > "$log" 2>&1; then
		if ! grep -q "^RENDERED $out" "$log"; then
			echo "FAIL: $style exited 0 but printed no 'RENDERED $out' line"
			ok=0
		fi
	else
		echo "FAIL: $style did not exit 0:"
		tail -5 "$log"
		ok=0
		return
	fi
	# Only the spare's WARN counts here: the fixture's shutline part has no
	# builder in this branch yet, which is another card's warning.
	if grep -q '^WARN part [0-9]* spare' "$log"; then
		echo "FAIL: $style printed a WARN line for the spare:"
		grep '^WARN part [0-9]* spare' "$log" | head -5
		ok=0
	fi
	if ! grep -q '^REPORT spare_0_c ' "$log"; then
		echo "FAIL: $style has no REPORT spare_0_c line"
		ok=0
	fi
}

run_render wire
n_spoke=$(grep -c '^REPORT spoke_' "$work/wire.log")
if [ "$n_spoke" -lt 100 ]; then
	echo "FAIL: expected at least 100 REPORT spoke_ lines, got $n_spoke"
	ok=0
fi

run_render knockoff
n_spin=$(grep -c '^REPORT spinner_' "$work/knockoff.log")
if [ "$n_spin" -ne 4 ]; then
	echo "FAIL: expected 4 REPORT spinner_ lines, got $n_spin"
	ok=0
fi

run_render alloy

if [ "$ok" -eq 1 ]; then
	echo "CA08 OK"
	exit 0
fi
exit 1
