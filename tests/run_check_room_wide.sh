#!/bin/sh
# Check the room checker's --wide option (card WD09). A synthetic 784x360 plate is
# the 1280x720 stage plus 144 px of bleed each side, at half size. Rectangles are in
# stage px and may have negative x. check_room must accept the right colours in the
# strips and really fail a wrong colour in the left strip. Blender is slow, so this
# is not part of `make test`.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

BLENDER=${BLENDER:-/opt/homebrew/bin/blender}
syn=/tmp/wd09_syn.png
ok=1

rm -f "$syn"

# 0. Synthetic 784x360 opaque plate: red left 72 columns, blue right 72 columns, green-ish between.
make_expr='import bpy, numpy as np; w,h=784,360; a=np.zeros((h,w,4),np.float32); a[:,:,3]=1; a[:,:,1]=0.6; a[:,:72,:3]=(1,0,0); a[:,712:,:3]=(0,0,1); im=bpy.data.images.new("s",w,h,alpha=True); im.pixels.foreach_set(a.reshape(-1)); im.filepath_raw="/tmp/wd09_syn.png"; im.file_format="PNG"; im.save()'
if ! "$BLENDER" --background --python-exit-code 1 --python-expr "$make_expr" >/dev/null 2>&1 || [ ! -s "$syn" ]; then
	echo "FAIL: could not make the synthetic input $syn"
	exit 1
fi

check() {
	"$BLENDER" --background --python-exit-code 1 --python tools/art/check_room.py -- "$syn" "$@" 2>&1
}

# 1. With --wide 144 the strips are stage x -144..0 (red, warm) and 1280..1424 (blue, cold).
res=$(check --size 784x360 --max-colors 8 --wide 144 --warm -144,0,144,720,100 --cold 1280,0,144,720,100 --solid -144,0,1568,720)
rc=$?
if [ "$rc" -ne 0 ]; then
	echo "FAIL: check_room --wide 144 rejected the plate (exit $rc): $res"
	ok=0
else
	case "$res" in
	*"ROOM OK"*) ;;
	*) echo "FAIL: check_room --wide 144 exited 0 but printed no 'ROOM OK': $res"; ok=0 ;;
	esac
fi

# 2. check_room really fails: the left strip is red, not blue.
res=$(check --size 784x360 --max-colors 8 --wide 144 --cold -144,0,144,720,100)
rc=$?
if [ "$rc" -ne 2 ]; then
	echo "FAIL: check_room --wide 144 with a wrong --cold exited $rc (want 2): $res"
	ok=0
else
	case "$res" in
	*"ROOM FAIL"*) ;;
	*) echo "FAIL: check_room exited 2 but printed no 'ROOM FAIL': $res"; ok=0 ;;
	esac
fi

# 3. Without --wide the old behaviour holds: the stage is the whole 784x360 picture.
res=$(check --size 784x360 --max-colors 8 --solid 0,0,1280,720)
rc=$?
if [ "$rc" -ne 0 ]; then
	echo "FAIL: check_room without --wide rejected the plate (exit $rc): $res"
	ok=0
else
	case "$res" in
	*"ROOM OK"*) ;;
	*) echo "FAIL: check_room without --wide exited 0 but printed no 'ROOM OK': $res"; ok=0 ;;
	esac
fi

if [ "$ok" -eq 1 ]; then
	echo "CHECKROOM WIDE OK"
	exit 0
fi
exit 1
