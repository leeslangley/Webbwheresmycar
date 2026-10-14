#!/bin/sh
# CA16 (tail fins, running boards, vents and scoops, racks): a details file with one
# fin, one running board, one side vent (5 louvres), one bonnet scoop and one roof
# rack is validated, then rendered with --report on dossier_ok. The render must exit
# 0 and print RENDERED, with no DETAILS PROBLEM or WARN part lines, and at least 2
# REPORT fin_, 2 running_board_, 6 vent_ and 1 rack_ lines. Blender is slow, so this
# is not part of `make test`. The details file is written to /tmp at run time (as
# CA12 and CA15 do), because the card's files list does not include a fixture.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

BLENDER=${BLENDER:-/opt/homebrew/bin/blender}
details=/tmp/ca16_details_features.json
out=/tmp/ca16_features.png

cat > "$details" <<'EOF'
{
 "version": 2,
 "id": "dossier_ok",
 "belt_y": 26.5,
 "parts": [
  {"kind": "fin", "x": -35, "x2": -50, "y": 26, "h": 6},
  {"kind": "running_board", "x": -20, "x2": 20, "y": 5},
  {"kind": "vent", "where": "side", "x": -48, "x2": -42, "y": 14, "w": 2, "h": 6, "n": 5},
  {"kind": "vent", "where": "bonnet", "style": "scoop", "x": 22, "x2": 34, "y": 26, "w": 10, "h": 2},
  {"kind": "rack", "where": "roof", "x": -14, "x2": 14, "w": 16}
 ]
}
EOF

ok=1

# 1. The details file validates (no problems from the validator).
if ! res=$(python3 tools/art/details.py "$details" --dossier tests/fixtures/dossier_ok.json 2>&1); then
	echo "FAIL: details file did not validate:"
	echo "$res" | tail -5
	ok=0
fi

# 2. Render with the report: exit 0, RENDERED, no problems, the required REPORT lines.
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
	*"WARN part"*) echo "FAIL: a part was not built:"
		echo "$res" | grep "WARN part" | head -5; ok=0 ;;
	esac

	# 3. Count the REPORT lines for each kind.
	count() {
		printf '%s\n' "$res" | grep -c "^REPORT $1"
	}
	nfin=$(count fin_)
	nboard=$(count running_board_)
	nvent=$(count vent_)
	nrack=$(count rack_)
	echo "REPORT counts: fin_=$nfin running_board_=$nboard vent_=$nvent rack_=$nrack"
	if [ "$nfin" -lt 2 ]; then echo "FAIL: expected at least 2 REPORT fin_ lines, found $nfin"; ok=0; fi
	if [ "$nboard" -lt 2 ]; then echo "FAIL: expected at least 2 REPORT running_board_ lines, found $nboard"; ok=0; fi
	if [ "$nvent" -lt 6 ]; then echo "FAIL: expected at least 6 REPORT vent_ lines, found $nvent"; ok=0; fi
	if [ "$nrack" -lt 1 ]; then echo "FAIL: expected at least 1 REPORT rack_ line, found $nrack"; ok=0; fi
else
	echo "FAIL: render did not exit 0:"
	echo "$res" | tail -5
	ok=0
fi

if [ "$ok" -eq 1 ]; then
	echo "CA16 OK"
	exit 0
fi
exit 1
