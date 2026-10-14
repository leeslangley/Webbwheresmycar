#!/bin/sh
# Check the CA10 rear lamps: one car with six taillamp parts, one per shape
# (round, rect, vertical, cat_eye, fin, wrap), stacked at x -50, lat 8. The render
# must exit 0, print RENDERED, report at least 12 REPORT taillamp_ lines (6 shapes
# x 2 sides) and print no WARN line. Blender is slow, so this is not part of
# `make test`.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

BLENDER=${BLENDER:-/opt/homebrew/bin/blender}
details=/tmp/ca10_details_lamps_rear.json
out=/tmp/ca10_lamps_rear.png

cat > "$details" <<'EOF'
{
 "version": 2,
 "id": "dossier_ok",
 "belt_y": 26.5,
 "parts": [
  {"kind": "taillamp", "shape": "round", "x": -50, "y": 14, "lat": 8, "w": 3, "h": 2},
  {"kind": "taillamp", "shape": "rect", "x": -50, "y": 16, "lat": 8, "w": 3, "h": 2},
  {"kind": "taillamp", "shape": "vertical", "x": -50, "y": 18, "lat": 8, "w": 3, "h": 2},
  {"kind": "taillamp", "shape": "cat_eye", "x": -50, "y": 20, "lat": 8, "w": 3, "h": 2},
  {"kind": "taillamp", "shape": "fin", "x": -50, "y": 22, "lat": 8, "w": 3, "h": 2},
  {"kind": "taillamp", "shape": "wrap", "x": -50, "y": 24, "lat": 8, "w": 3, "h": 2}
 ]
}
EOF

ok=1
rm -f "$out"
if res=$("$BLENDER" --background --python-exit-code 1 \
        --python tools/art/blender_car2.py -- \
        --dossier tests/fixtures/dossier_ok.json --details "$details" \
        --out "$out" --report 2>&1); then
	case "$res" in
	*"RENDERED $out"*) ;;
	*) echo "FAIL: exited 0 but output missing 'RENDERED $out'"; ok=0 ;;
	esac
else
	echo "FAIL: render did not exit 0:"
	echo "$res" | tail -5
	ok=0
fi

if [ "$ok" -eq 1 ]; then
	n=$(printf '%s\n' "$res" | grep -c '^REPORT taillamp_')
	if [ "$n" -lt 12 ]; then
		echo "FAIL: expected at least 12 REPORT taillamp_ lines, found $n"
		ok=0
	fi
	if printf '%s\n' "$res" | grep -q 'WARN'; then
		echo "FAIL: output has a WARN line:"
		printf '%s\n' "$res" | grep 'WARN'
		ok=0
	fi
fi

if [ "$ok" -eq 1 ]; then
	echo "CA10 OK"
	exit 0
fi
exit 1
