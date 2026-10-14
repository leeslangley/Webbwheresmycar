#!/bin/sh
# CA13: trim strips, body creases and shut lines. dossier_ok is rendered with a
# details file that has 1 strip sill (x -34..34, y 6), 1 strip waist (x -30..22,
# y 26.5), 1 crease (x -40..40, y 20) and 2 shutlines (a door path [[8,26.5],[8,7]]
# and a bonnet path [[24,26.5],[24,8]] with across_x 24). The render must exit 0 and
# print RENDERED, with at least 4 REPORT strip_ lines, 2 REPORT crease_ lines and at
# least 5 REPORT shutline_ lines (door 2 sides, bonnet 2 sides, bonnet top 1), and no
# WARN part or DETAILS PROBLEM lines. Blender is slow, so this is not part of
# `make test`.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

BLENDER=${BLENDER:-/opt/homebrew/bin/blender}
out=/tmp/ca13_trim.png
details=/tmp/ca13_details_trim.json

ok=1

# The details file for this card, written to /tmp (the card's files list allows
# only the trim module and this script to change).
cat > "$details" <<'EOF'
{
 "version": 2,
 "id": "dossier_ok",
 "belt_y": 26.5,
 "parts": [
  {"kind": "strip", "x": -34, "x2": 34, "y": 6, "role": "sill"},
  {"kind": "strip", "x": -30, "x2": 22, "y": 26.5, "role": "waist"},
  {"kind": "crease", "x": -40, "x2": 40, "y": 20},
  {"kind": "shutline", "path": [[8, 26.5], [8, 7]], "role": "door"},
  {"kind": "shutline", "path": [[24, 26.5], [24, 8]], "role": "bonnet", "across_x": 24}
 ]
}
EOF

res=$("$BLENDER" --background --python-exit-code 1 \
        --python tools/art/blender_car2.py -- \
        --dossier tests/fixtures/dossier_ok.json --details "$details" \
        --out "$out" --report 2>&1)
status=$?

if [ "$status" -ne 0 ]; then
	echo "FAIL: render did not exit 0:"
	echo "$res" | tail -5
	ok=0
else
	case "$res" in
	*"RENDERED $out"*) ;;
	*) echo "FAIL: render exited 0 but output missing 'RENDERED $out'"; ok=0 ;;
	esac
	case "$res" in
	*"WARN part"*|*"DETAILS PROBLEM"*)
		echo "FAIL: render printed a warning:"
		echo "$res" | grep "WARN part\|DETAILS PROBLEM" | head -5
		ok=0 ;;
	esac
	nstrip=$(printf '%s\n' "$res" | grep -c '^REPORT strip_')
	ncrease=$(printf '%s\n' "$res" | grep -c '^REPORT crease_')
	nshut=$(printf '%s\n' "$res" | grep -c '^REPORT shutline_')
	echo "strip_ reports: $nstrip, crease_ reports: $ncrease, shutline_ reports: $nshut"
	if [ "$nstrip" -lt 4 ]; then
		echo "FAIL: expected at least 4 REPORT strip_ lines, got $nstrip"; ok=0
	fi
	if [ "$ncrease" -lt 2 ]; then
		echo "FAIL: expected at least 2 REPORT crease_ lines, got $ncrease"; ok=0
	fi
	if [ "$nshut" -lt 5 ]; then
		echo "FAIL: expected at least 5 REPORT shutline_ lines, got $nshut"; ok=0
	fi
fi

if [ "$ok" -eq 1 ]; then
	echo "CA13 OK"
	exit 0
fi
exit 1
