#!/bin/sh
# Check the room pixel stage (GE03): pixelbg makes a deterministic 640x360 plate,
# check_room accepts it and really fails a bad rectangle. Blender is slow, so this
# is not part of `make test`.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

BLENDER=${BLENDER:-/opt/homebrew/bin/blender}
in=/tmp/ge03_in.png
a=/tmp/ge03_a.png
b=/tmp/ge03_b.png
ok=1

rm -f "$in" "$a" "$b"

# 0. Synthetic 1280x720 room: a gradient with a transparent 200x100 hole at x 100..299, y 100..199.
make_expr='import bpy, numpy as np; w,h=1280,720; a=np.zeros((h,w,4),np.float32); a[:,:,0]=np.linspace(0,1,w)[None,:]; a[:,:,1]=np.linspace(0,1,h)[:,None]; a[:,:,2]=0.5; a[:,:,3]=1; a[h-200:h-100,100:300,3]=0; im=bpy.data.images.new("s",w,h,alpha=True); im.pixels.foreach_set(a.reshape(-1)); im.filepath_raw="/tmp/ge03_in.png"; im.file_format="PNG"; im.save()'
if ! "$BLENDER" --background --python-exit-code 1 --python-expr "$make_expr" >/dev/null 2>&1 || [ ! -s "$in" ]; then
	echo "FAIL: could not make the synthetic input $in"
	exit 1
fi

# 1. pixelbg on the synthetic input, twice: both runs must print PIXBG OK and be byte-identical.
run_pixelbg() {
	"$BLENDER" --background --python-exit-code 1 --python tools/art/pixelbg.py -- \
		--in "$in" --out "$1" --width 640 --colors 16 --dither 0.22
}
if res=$(run_pixelbg "$a" 2>&1); then
	case "$res" in
	*"PIXBG OK out=$a size=640x360"*) ;;
	*) echo "FAIL: pixelbg did not print 'PIXBG OK out=$a size=640x360': $res"; ok=0 ;;
	esac
else
	echo "FAIL: pixelbg exited non-zero: $res"
	ok=0
fi
if ! res=$(run_pixelbg "$b" 2>&1); then
	echo "FAIL: second pixelbg run exited non-zero: $res"
	ok=0
fi
if [ -f "$a" ] && [ -f "$b" ]; then
	if ! cmp -s "$a" "$b"; then
		echo "FAIL: two pixelbg runs on the same input differ ($a, $b)"
		ok=0
	fi
else
	echo "FAIL: pixelbg did not write $a and $b"
	ok=0
fi

# 2. Bad arguments: exit 2 and the message starts with 'pixelbg:'.
if res=$("$BLENDER" --background --python-exit-code 1 --python tools/art/pixelbg.py -- \
		--in "$in" 2>&1); then
	echo "FAIL: pixelbg without --out exited 0"
	ok=0
else
	case "$res" in
	*"pixelbg: "*) ;;
	*) echo "FAIL: pixelbg without --out gave no 'pixelbg:' message: $res"; ok=0 ;;
	esac
fi

# 3. check_room accepts the plate (size, palette, hole and solid rectangles in screen px).
if res=$("$BLENDER" --background --python-exit-code 1 --python tools/art/check_room.py -- \
		"$a" --size 640x360 --max-colors 16 --hole 110,110,180,80 --solid 400,300,100,100 2>&1); then
	case "$res" in
	*"ROOM OK"*) ;;
	*) echo "FAIL: check_room exited 0 but printed no 'ROOM OK': $res"; ok=0 ;;
	esac
else
	echo "FAIL: check_room rejected the plate: $res"
	ok=0
fi

# 4. check_room really fails: the opaque part of the plate is not a hole.
res=$("$BLENDER" --background --python-exit-code 1 --python tools/art/check_room.py -- \
		"$a" --size 640x360 --max-colors 16 --hole 400,300,100,100 2>&1)
rc=$?
if [ "$rc" -ne 2 ]; then
	echo "FAIL: check_room with a wrong --hole exited $rc (want 2): $res"
	ok=0
else
	case "$res" in
	*"ROOM FAIL"*) ;;
	*) echo "FAIL: check_room exited 2 but printed no 'ROOM FAIL': $res"; ok=0 ;;
	esac
fi

if [ "$ok" -eq 1 ]; then
	echo "PIXELBG OK"
	exit 0
fi
exit 1
