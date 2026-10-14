#!/bin/sh
# Check the car details validator (card CA01): the ok fixture passes against its
# dossier, the bad fixture fails with at least 3 problems, and the spec doc is
# regenerated and mentions every kind.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

ok=1

# 1. Valid details against the matching dossier: exit 0 and the OK line
if out=$(python3 tools/art/details.py tests/fixtures/details_ok.json --dossier tests/fixtures/dossier_ok.json 2>&1); then
	case "$out" in
	"DETAILS OK dossier_ok parts=8 kinds="*) ;;
	*) echo "FAIL: details_ok.json exited 0 but output is not 'DETAILS OK dossier_ok parts=8 kinds=': $out"; ok=0 ;;
	esac
else
	echo "FAIL: details_ok.json did not exit 0: $out"
	ok=0
fi

# 2. Broken details: exit 1 with at least 3 DETAILS FAIL lines
if out=$(python3 tools/art/details.py tests/fixtures/details_bad.json 2>&1); then
	echo "FAIL: details_bad.json exited 0 (should be 1): $out"
	ok=0
else
	n=$(printf '%s\n' "$out" | grep -c '^DETAILS FAIL ')
	if [ "$n" -lt 3 ]; then
		echo "FAIL: details_bad.json gave $n DETAILS FAIL lines (need at least 3): $out"
		ok=0
	fi
fi

# 3. Spec doc is generated from the validator and mentions all 21 kinds
if python3 tools/art/details.py --doc > docs/CAR_DETAILS_SPEC.md; then
	for k in headlamp lamp taillamp grille bumper plate exhaust strip crease shutline handle mirror badge wiper aerial fuelcap fin running_board vent spare rack; do
		if ! grep -q "\`$k\`" docs/CAR_DETAILS_SPEC.md; then
			echo "FAIL: docs/CAR_DETAILS_SPEC.md does not mention kind $k"
			ok=0
		fi
	done
else
	echo "FAIL: python3 tools/art/details.py --doc failed"
	ok=0
fi

if [ "$ok" -eq 1 ]; then
	echo "DETAILS TEST OK"
	exit 0
fi
exit 1
