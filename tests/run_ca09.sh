#!/bin/sh
# Check the CA09 front lamps: a details file with one headlamp per shape (round,
# square, oval, slanted, popup closed, popup open, quad) and three lamp parts
# renders with --report, with no WARN and no DETAILS PROBLEM. Every headlamp_ and
# lamp_ object is reported, with a positive dy. Blender is slow, so this is not
# part of `make test`. The details file is written into a scratch directory.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

BLENDER=${BLENDER:-/opt/homebrew/bin/blender}
out=/tmp/ca09_lamps.png
work=$(mktemp -d "${TMPDIR:-/tmp}/ca09.XXXXXX") || exit 1
trap 'rm -rf "$work"' EXIT
details="$work/details_lamps_front.json"
report="$work/report.txt"

cat > "$details" <<'EOF'
{
 "version": 2,
 "id": "dossier_ok",
 "belt_y": 26.5,
 "wheel": {"style": "steel", "hub": "chrome", "whitewall": false, "trim_ring": false, "hubcap_r": 4.0, "spokes": 0},
 "parts": [
  {"kind": "headlamp", "x": 47, "y": 16, "lat": 11, "r": 2.4, "shape": "round", "side": "both"},
  {"kind": "headlamp", "x": 45, "y": 16, "lat": 11, "r": 2.4, "shape": "square", "side": "both"},
  {"kind": "headlamp", "x": 43, "y": 16, "lat": 11, "r": 2.4, "shape": "oval", "side": "both"},
  {"kind": "headlamp", "x": 41, "y": 16, "lat": 11, "r": 2.4, "shape": "slanted", "side": "both"},
  {"kind": "headlamp", "x": 39, "y": 16, "lat": 11, "r": 2.4, "shape": "popup", "open": false, "side": "both"},
  {"kind": "headlamp", "x": 37, "y": 16, "lat": 11, "r": 2.4, "shape": "popup", "open": true, "side": "both"},
  {"kind": "headlamp", "x": 35, "y": 16, "lat": 11, "r": 2.4, "shape": "quad", "side": "both"},
  {"kind": "lamp", "x": 47, "y": 8, "lat": 9, "r": 1.6, "role": "foglamp", "side": "both"},
  {"kind": "lamp", "x": 48, "y": 11, "lat": 12, "role": "indicator", "shape": "rect", "side": "both"},
  {"kind": "lamp", "x": -48, "y": 8, "lat": 12, "r": 1.2, "role": "reflector", "side": "both"}
 ]
}
EOF

# Render with the report. The output must exit 0 and name the PNG.
if res=$("$BLENDER" --background --python-exit-code 1 \
        --python tools/art/blender_car2.py -- \
        --dossier tests/fixtures/dossier_ok.json --details "$details" \
        --out "$out" --report 2>&1); then
	:
else
	echo "FAIL: CA09 render did not exit 0:"
	echo "$res" | tail -5
	exit 1
fi
printf '%s\n' "$res" > "$report"

ok=1
case "$res" in
*"RENDERED $out"*) ;;
*) echo "FAIL: render exited 0 but output missing 'RENDERED $out'"; ok=0 ;;
esac
case "$res" in
*"WARN "*) echo "FAIL: render printed a WARN line:"; grep 'WARN ' "$report" | head -5; ok=0 ;;
esac
case "$res" in
*"DETAILS PROBLEM"*) echo "FAIL: details file has problems:"; grep 'DETAILS PROBLEM' "$report" | head -5; ok=0 ;;
esac

# The report lines: at least 28 headlamp_ (7 parts, both sides, bezel plus lens),
# at least 6 lamp_, and every one with a positive dy.
if ! python3 -I - "$report" <<'EOF'
import sys
head = lamp = 0
bad = []
for line in open(sys.argv[1]):
    if line.startswith('REPORT headlamp_'):
        head += 1
    elif line.startswith('REPORT lamp_'):
        lamp += 1
    else:
        continue
    dy = float(line.split(' dy=')[1].split()[0])
    if not dy > 0:
        bad.append(line.strip())
if head < 28 or lamp < 6 or bad:
    print('headlamp lines %d (need 28), lamp lines %d (need 6), dy not positive: %s'
          % (head, lamp, bad[:5]))
    sys.exit(1)
print('report: %d headlamp lines, %d lamp lines' % (head, lamp))
EOF
then
	echo "FAIL: report check"
	ok=0
fi

if [ "$ok" -eq 1 ]; then
	echo "CA09 OK"
	exit 0
fi
exit 1
