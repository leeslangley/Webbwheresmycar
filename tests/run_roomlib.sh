#!/bin/sh
# Check tools/art/roomlib.py: a wall box and a floor point project onto the expected 1280x720 screen pixels.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

BLENDER=${BLENDER:-/opt/homebrew/bin/blender}

expr="import sys; sys.path.insert(0,'tools/art'); import roomlib as R; sc=R.reset(); R.setup_camera(sc); m=R.mat('t','#ffffff'); o=R.wbox('t',482,196,286,210,0.02,m,0.7,0.0); pp=[R.project(sc,o.matrix_world @ v.co) for v in o.data.vertices]; print('PROJ_WALL',round(min(p[0] for p in pp)),round(max(p[0] for p in pp)),round(min(p[1] for p in pp)),round(max(p[1] for p in pp))); fx,fy=R.project(sc,(R.wx(640),R.fy(560),0.0)); print('PROJ_FLOOR',round(fx),round(fy))"

if ! out=$("$BLENDER" --background --python-exit-code 1 --python-expr "$expr" 2>&1); then
	printf '%s\n' "$out"
	echo "ROOMLIB FAIL: blender exited with an error"
	exit 1
fi

wall=$(printf '%s\n' "$out" | grep '^PROJ_WALL' | head -n 1)
floor=$(printf '%s\n' "$out" | grep '^PROJ_FLOOR' | head -n 1)

if [ -z "$wall" ] || [ -z "$floor" ]; then
	printf '%s\n' "$out"
	echo "ROOMLIB FAIL: missing PROJ line"
	exit 1
fi

result=$(printf '%s\n%s\n' "$wall" "$floor" | awk '
$1 == "PROJ_WALL" {
	if ($2 >= 481 && $2 <= 483 && $3 >= 767 && $3 <= 769 && $4 >= 195 && $4 <= 197 && $5 >= 405 && $5 <= 408) w = 1
}
$1 == "PROJ_FLOOR" {
	if ($2 >= 639 && $2 <= 641 && $3 >= 559 && $3 <= 561) f = 1
}
END {
	if (w && f) print "ok"; else print "bad"
}')

if [ "$result" = "ok" ]; then
	echo "ROOMLIB OK"
	exit 0
fi

echo "$wall"
echo "$floor"
echo "ROOMLIB FAIL: projection outside expected pixels (wall x 482-768 y 196-405..408, floor 640,560)"
exit 1
