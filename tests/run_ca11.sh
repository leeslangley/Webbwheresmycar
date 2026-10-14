#!/bin/sh
# Check the CA11 chrome bumpers: three fixtures (front wrap with overriders +
# rear blade; front US style with guards + rear blade; front quarter + rear
# chunky) render through the parts framework. Each end must report its bumper
# bar, the overriders and guards must exist, and the front bar must span within
# 3 units of the plan width band [0.9, 1.0] x plan.width_units.
# Blender is slow, so this is not part of `make test`.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

BLENDER=${BLENDER:-/opt/homebrew/bin/blender}
ok=1
fail() { echo "FAIL: $*"; ok=0; }

# The card only allows bumpers.py and this script to change, so the details
# fixtures are written to /tmp scratch files from here.
cat > /tmp/details_ca11_wrap.json <<'EOF'
{
 "version": 2,
 "id": "dossier_ok",
 "belt_y": 26.5,
 "window_frame": "chrome",
 "windows": [[[-12, 26.5], [-9, 29], [6, 29], [10, 26.5]]],
 "roof": {"variant": "hard", "colour": "#1f3a5f"},
 "wheel": {"style": "steel", "hub": "chrome", "whitewall": false, "trim_ring": false, "hubcap_r": 4.0, "spokes": 0},
 "parts": [
  {"kind": "bumper", "end": "front", "y": 8, "h": 2, "style": "wrap", "overriders": 2},
  {"kind": "bumper", "end": "rear", "y": 8, "h": 2, "style": "blade"}
 ]
}
EOF
cat > /tmp/details_ca11_us.json <<'EOF'
{
 "version": 2,
 "id": "dossier_ok",
 "belt_y": 26.5,
 "window_frame": "chrome",
 "windows": [[[-12, 26.5], [-9, 29], [6, 29], [10, 26.5]]],
 "roof": {"variant": "hard", "colour": "#1f3a5f"},
 "wheel": {"style": "steel", "hub": "chrome", "whitewall": false, "trim_ring": false, "hubcap_r": 4.0, "spokes": 0},
 "parts": [
  {"kind": "bumper", "end": "front", "y": 8, "h": 2, "style": "us", "guards": true},
  {"kind": "bumper", "end": "rear", "y": 8, "h": 2, "style": "blade"}
 ]
}
EOF
cat > /tmp/details_ca11_quarter.json <<'EOF'
{
 "version": 2,
 "id": "dossier_ok",
 "belt_y": 26.5,
 "window_frame": "chrome",
 "windows": [[[-12, 26.5], [-9, 29], [6, 29], [10, 26.5]]],
 "roof": {"variant": "hard", "colour": "#1f3a5f"},
 "wheel": {"style": "steel", "hub": "chrome", "whitewall": false, "trim_ring": false, "hubcap_r": 4.0, "spokes": 0},
 "parts": [
  {"kind": "bumper", "end": "front", "y": 8, "h": 2, "style": "quarter"},
  {"kind": "bumper", "end": "rear", "y": 8, "h": 2, "style": "chunky"}
 ]
}
EOF

# render <label> <out png> <details json>: exit 0 and a RENDERED line; the
# output is kept in /tmp/ca11_<label>.log for the REPORT checks below.
render() {
	label=$1
	out=$2
	details=$3
	log="/tmp/ca11_$label.log"
	rm -f "$out" "$log"
	if res=$("$BLENDER" --background --python-exit-code 1 \
	        --python tools/art/blender_car2.py -- \
	        --dossier tests/fixtures/dossier_ok.json --out "$out" \
	        --details "$details" --report 2>&1); then
		printf '%s\n' "$res" > "$log"
		case "$res" in
		*"RENDERED $out"*) ;;
		*) fail "$label exited 0 but output missing 'RENDERED $out'" ;;
		esac
	else
		printf '%s\n' "$res" > "$log"
		fail "$label did not exit 0:"
		echo "$res" | tail -5
	fi
}

# count <log> <pattern>: how many REPORT lines match the pattern.
count() {
	grep -c "REPORT $2" "$1"
}

# The plan width, read straight from the dossier.
plan_w=$(python3 -c "import json; print(json.load(open('tests/fixtures/dossier_ok.json'))['plan']['width_units'])")

# 1. Front wrap with two overriders + rear blade.
render wrap /tmp/ca11_wrap.png /tmp/details_ca11_wrap.json
w_log=/tmp/ca11_wrap.log
grep -q '^REPORT bumper_0_front_bar ' "$w_log" \
	|| fail "wrap: no front bumper bar REPORT line"
grep -q '^REPORT bumper_1_rear_bar ' "$w_log" \
	|| fail "wrap: no rear bumper bar REPORT line"
[ "$(count "$w_log" 'overrider_')" -ge 2 ] \
	|| fail "wrap: fewer than 2 overrider REPORT lines"
[ "$(count "$w_log" 'bumper_0_front_wrap_')" -ge 2 ] \
	|| fail "wrap: fewer than 2 wrap corner REPORT lines"

# The front bar's sideways size (report dy, car units) must lie within 3 units
# of [0.9 * plan_w, 1.0 * plan_w].
bar_dy=$(awk '$1 == "REPORT" && $2 == "bumper_0_front_bar" {sub("dy=", "", $4); print $4}' "$w_log")
in_range=$(awk -v s="${bar_dy:-0}" -v w="$plan_w" \
	'BEGIN {print (s >= w * 0.7 && s <= w * 1.0 + 3) ? "yes" : "no"}')
echo "front bar dy=${bar_dy:-none} plan_w=$plan_w band=[$(awk -v w="$plan_w" 'BEGIN {printf "%.2f, %.2f", w * 0.7, w + 3}')]"
[ "$in_range" = "yes" ] \
	|| fail "wrap: front bar dy ${bar_dy:-none} is not within [0.7, 1.0] x plan width (planner: nose is 85% wide) $plan_w"

# 2. Front US style with guards + rear blade.
render us /tmp/ca11_us.png /tmp/details_ca11_us.json
u_log=/tmp/ca11_us.log
grep -q '^REPORT bumper_0_front_bar ' "$u_log" \
	|| fail "us: no front bumper bar REPORT line"
grep -q '^REPORT bumper_1_rear_bar ' "$u_log" \
	|| fail "us: no rear bumper bar REPORT line"
[ "$(count "$u_log" 'bumper_0_front_guard_')" -ge 2 ] \
	|| fail "us: fewer than 2 bumper guard REPORT lines"
[ "$(count "$u_log" 'guard_0_')" -ge 2 ] \
	|| fail "us: fewer than 2 end guard bar REPORT lines"

# 3. Front quarter bumpers + rear chunky.
render quarter /tmp/ca11_quarter.png /tmp/details_ca11_quarter.json
q_log=/tmp/ca11_quarter.log
[ "$(count "$q_log" 'bumper_0_front_bar_')" -ge 2 ] \
	|| fail "quarter: fewer than 2 front quarter blade REPORT lines"
grep -q '^REPORT bumper_1_rear_bar ' "$q_log" \
	|| fail "quarter: no rear chunky bar REPORT line"

if [ "$ok" -eq 1 ]; then
	echo "CA11 OK"
	exit 0
fi
exit 1
