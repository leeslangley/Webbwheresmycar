#!/bin/sh
# CA12: grilles per marque. dossier_ok is rendered with a details file that has one
# grille per style (7 styles, stacked up the nose at y 8 to 26, w 8, h 2.4, end
# front). The render must exit 0 and print RENDERED, with at least 7 grille_ and
# 30 grillebar_ REPORT lines, and no WARN part or DETAILS PROBLEM lines. Blender is
# slow, so this is not part of `make test`.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

BLENDER=${BLENDER:-/opt/homebrew/bin/blender}
out=/tmp/ca12_grilles.png
details=/tmp/ca12_details_grilles.json

ok=1

# The details file for this card, written to /tmp (the card's files list allows
# only the grille module and this script to change).
cat > "$details" <<'EOF'
{
 "version": 2,
 "id": "dossier_ok",
 "belt_y": 18,
 "parts": [
  {"kind": "grille", "x": 49, "y": 8, "w": 8, "h": 2.4, "style": "horizontal_bars", "end": "front"},
  {"kind": "grille", "x": 49, "y": 11, "w": 8, "h": 2.4, "style": "vertical_bars", "end": "front"},
  {"kind": "grille", "x": 49, "y": 14, "w": 8, "h": 2.4, "style": "egg_crate", "end": "front"},
  {"kind": "grille", "x": 49, "y": 17, "w": 8, "h": 2.4, "style": "slat_panel", "end": "front"},
  {"kind": "grille", "x": 49, "y": 20, "w": 8, "h": 2.4, "style": "oval_mesh", "end": "front"},
  {"kind": "grille", "x": 49, "y": 23, "w": 8, "h": 2.4, "style": "kidney", "end": "front"},
  {"kind": "grille", "x": 49, "y": 26, "w": 8, "h": 2.4, "style": "shield", "end": "front"}
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
	ngrille=$(printf '%s\n' "$res" | grep -c '^REPORT grille_')
	ngrillebar=$(printf '%s\n' "$res" | grep -c '^REPORT grillebar_')
	echo "grille_ reports: $ngrille, grillebar_ reports: $ngrillebar"
	if [ "$ngrille" -lt 7 ]; then
		echo "FAIL: expected at least 7 REPORT grille_ lines, got $ngrille"; ok=0
	fi
	if [ "$ngrillebar" -lt 30 ]; then
		echo "FAIL: expected at least 30 REPORT grillebar_ lines, got $ngrillebar"; ok=0
	fi
fi

if [ "$ok" -eq 1 ]; then
	echo "CA12 OK"
	exit 0
fi
exit 1
