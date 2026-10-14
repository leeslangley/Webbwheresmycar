#!/bin/sh
# Check the pose library: selftest passes and the expression table has 16 faces and 11 mouths.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

ok=1

# 1. Selftest prints POSELIB OK
if out=$(python3 tools/art/poselib.py selftest 2>&1); then
	case "$out" in
	*"POSELIB OK"*) echo "$out" ;;
	*) echo "FAIL: selftest exited 0 but output missing 'POSELIB OK': $out"; ok=0 ;;
	esac
else
	echo "FAIL: selftest failed: $out"
	ok=0
fi

# 2. Expression table: 16 faces, 11 mouths, every face mouth is a known mouth
if out=$(python3 -c "
import json, sys
d = json.load(open('docs/characters/expressions.json'))
faces, mouths = d['faces'], d['mouths']
assert len(faces) == 16 and len(mouths) == 11, (len(faces), len(mouths))
for name, face in faces.items():
    assert face['mouth'] in mouths, (name, face['mouth'])
print('ok')
" 2>&1); then
	case "$out" in
	*ok*) ;;
	*) echo "FAIL: expression check output: $out"; ok=0 ;;
	esac
else
	echo "FAIL: expression table check: $out"
	ok=0
fi

if [ "$ok" -eq 1 ]; then
	echo "POSELIB TESTS OK"
	exit 0
fi
exit 1
