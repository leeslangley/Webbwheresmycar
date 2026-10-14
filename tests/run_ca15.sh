#!/bin/sh
# Check CA15 (number plates and exhaust pipes): a details file with plates (front
# white, rear yellow) and the four exhaust styles (round, twin, quad, sidepipe) is
# validated, then rendered with --report on dossier_ok. Blender is slow, so this is
# not part of `make test`. The details file is written to /tmp at run time.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

BLENDER=${BLENDER:-/opt/homebrew/bin/blender}
details=/tmp/ca15_details.json
out=/tmp/ca15_plates.png

cat > "$details" <<'EOF'
{
 "version": 2,
 "id": "dossier_ok",
 "belt_y": 26.5,
 "parts": [
  {"kind": "plate", "end": "front", "colour": "white"},
  {"kind": "plate", "end": "rear", "colour": "yellow"},
  {"kind": "exhaust", "style": "round"},
  {"kind": "exhaust", "style": "twin"},
  {"kind": "exhaust", "style": "quad"},
  {"kind": "exhaust", "style": "sidepipe"}
 ]
}
EOF

ok=1

# 1. The details file validates (no DETAILS PROBLEM lines from the loader).
if ! res=$(python3 tools/art/details.py "$details" --dossier tests/fixtures/dossier_ok.json 2>&1); then
	echo "FAIL: details file did not validate:"
	echo "$res" | tail -5
	ok=0
fi

# 2. Render with the report: exit 0, RENDERED, the plate and exhaust lines.
rm -f "$out"
if res=$("$BLENDER" --background --python-exit-code 1 \
        --python tools/art/blender_car2.py -- \
        --dossier tests/fixtures/dossier_ok.json --details "$details" \
        --out "$out" --report 2>&1); then
	case "$res" in
	*"RENDERED $out"*) ;;
	*) echo "FAIL: exited 0 but output missing 'RENDERED $out'"; ok=0 ;;
	esac
	case "$res" in
	*"DETAILS PROBLEM"*) echo "FAIL: the loader reported a details problem:"
		echo "$res" | grep "DETAILS PROBLEM" | head -5; ok=0 ;;
	esac

	# 3. Exactly two plate faces (front and rear), each about 12 units wide.
	plates=$(printf '%s\n' "$res" | grep '^REPORT plate_')
	nplate=$(printf '%s\n' "$plates" | grep -c '^REPORT plate_')
	if [ "$nplate" -ne 2 ]; then
		echo "FAIL: expected 2 REPORT plate_ lines, found $nplate"
		ok=0
	fi
	bad=$(printf '%s\n' "$plates" | awk '{ for (i = 1; i <= NF; i++) if ($i ~ /^dy=/) { v = substr($i, 4) + 0; if (v < 11 || v > 13) print } }')
	if [ -n "$bad" ]; then
		echo "FAIL: plate dy not within 1 of 12:"
		echo "$bad"
		ok=0
	fi

	# 4. At least 8 pipes (round 1 + twin 2 + quad 4 + sidepipe 1).
	nexh=$(printf '%s\n' "$res" | grep -c '^REPORT exhaust_')
	if [ "$nexh" -lt 8 ]; then
		echo "FAIL: expected at least 8 REPORT exhaust_ lines, found $nexh"
		ok=0
	fi
else
	echo "FAIL: render did not exit 0:"
	echo "$res" | tail -5
	ok=0
fi

if [ "$ok" -eq 1 ]; then
	echo "CA15 OK"
	exit 0
fi
exit 1
