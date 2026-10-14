#!/bin/sh
# Check CA14 (small fittings): a details file with two handles (flap, bar), a door
# mirror (both sides), three badges (front disc, rear script, side shield), a
# two-arm wiper, an aerial and a fuel cap is validated, then rendered with --report
# on dossier_ok. The REPORT lines are counted per kind. Blender is slow, so this is
# not part of `make test`. The details file is written to /tmp at run time.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

BLENDER=${BLENDER:-/opt/homebrew/bin/blender}
details=/tmp/ca14_details.json
out=/tmp/ca14_fittings.png

cat > "$details" <<'EOF'
{
 "version": 2,
 "id": "dossier_ok",
 "belt_y": 26.5,
 "parts": [
  {"kind": "handle", "x": 8, "y": 14, "style": "flap", "len": 2.5, "side": "both"},
  {"kind": "handle", "x": -20, "y": 14, "style": "bar", "len": 3.0, "side": "both"},
  {"kind": "mirror", "x": 20, "y": 20, "lat": 18, "style": "door", "side": "both"},
  {"kind": "badge", "x": 0, "y": 12, "shape": "disc", "end": "front", "colour": "red"},
  {"kind": "badge", "x": -48, "y": 12, "shape": "script", "end": "rear", "colour": "chrome"},
  {"kind": "badge", "x": -10, "y": 14, "shape": "shield", "end": "side", "colour": "blue", "side": "near"},
  {"kind": "wiper", "x": 0, "y": 28, "n": 2},
  {"kind": "aerial", "x": 30, "y": 18, "lat": 19, "side": "near"},
  {"kind": "fuelcap", "x": -40, "y": 12, "r": 1.0, "side": "near"}
 ]
}
EOF

ok=1

# 1. The details file validates against the dossier (no problems from the checker).
if ! res=$(python3 tools/art/details.py "$details" --dossier tests/fixtures/dossier_ok.json 2>&1); then
	echo "FAIL: details file did not validate:"
	echo "$res" | tail -5
	ok=0
fi

# 2. Render with the report: exit 0, RENDERED, no loader problems, and the REPORT
#    line counts for each kind.
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
	case "$res" in
	*"WARN part"*) echo "FAIL: a part builder failed:"
		echo "$res" | grep "WARN part" | head -5; ok=0 ;;
	esac

	# count_at_least <prefix> <minimum>: at least that many REPORT lines for a kind.
	count_at_least() {
		n=$(printf '%s\n' "$res" | grep -c "^REPORT $1")
		if [ "$n" -lt "$2" ]; then
			echo "FAIL: expected at least $2 REPORT $1 lines, found $n"
			ok=0
		fi
	}
	count_at_least handle_ 4
	count_at_least mirror_ 2
	count_at_least badge_ 3
	count_at_least wiper_ 1
	count_at_least aerial_ 1
	count_at_least fuelcap_ 1
else
	echo "FAIL: render did not exit 0:"
	echo "$res" | tail -5
	ok=0
fi

if [ "$ok" -eq 1 ]; then
	echo "CA14 OK"
	exit 0
fi
exit 1
