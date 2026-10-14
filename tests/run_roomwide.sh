#!/bin/sh
# Check tools/art/roomwide.py: a probe room renders on a 1568x720 frame, game-screen px are unchanged, edge boxes stretch.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

BLENDER=${BLENDER:-/opt/homebrew/bin/blender}
mkdir -p /tmp/wd08

cat > /tmp/wd08/probe.py <<'EOF'
import sys, bpy
sys.path.insert(0, 'tools/art')
import roomlib as R, roomwide as W
W.install()
sc = R.reset()
R.setup_camera(sc)
R.setup_render(sc, '/tmp/wd08/probe.png', 4)
R.world(sc, '#808080', 1.0)
m = R.mat('g', '#c08040')
R.box('wall', 0.0, 12.8, 0.0, 0.3, R.wz(700), R.wz(-200), m, 0)
R.box('mid', R.wx(400), R.wx(500), -0.5, 0.0, R.wz(400), R.wz(300), m, 0)
R.light('SUN', 'sun', (0, 5, 8), 3.0, '#ffffff', 1.0, (1.0, 0, 0))
print('WD08 res', sc.render.resolution_x, sc.render.resolution_y, round(sc.camera.data.ortho_scale, 3))
bpy.ops.render.render(write_still=True)
xs = [v.co.x for v in bpy.data.objects['wall'].data.vertices]
print('WD08 wall', round(min(xs), 3), round(max(xs), 3))
xs = [v.co.x for v in bpy.data.objects['mid'].data.vertices]
print('WD08 mid', round(min(xs), 3), round(max(xs), 3))
print('WD08 proj0 %.1f' % R.project(sc, (R.wx(0), 0.0, R.wz(300)))[0])
print('WD08 proj1280 %.1f' % R.project(sc, (R.wx(1280), 0.0, R.wz(300)))[0])
im = bpy.data.images.load('/tmp/wd08/probe.png')
w, h = im.size
a = im.pixels[:]
def alpha(x, y):
    return a[((h - 1 - y) * w + x) * 4 + 3]
print('WD08 img', w, h, 'alphaL %.2f alphaR %.2f alphaC %.2f' % (alpha(10, 300), alpha(w - 10, 300), alpha(w // 2, 300)))
EOF

if ! out=$("$BLENDER" --background --python-exit-code 1 --python /tmp/wd08/probe.py 2>&1); then
	printf '%s\n' "$out" | grep -E 'WD08|WIDE|Error|error' | head -n 40
	echo "ROOMWIDE FAIL: blender exited with an error"
	exit 1
fi

lines=$(printf '%s\n' "$out" | grep -E 'WD08|WIDE')

result=$(printf '%s\n' "$lines" | awk '
function near(a, b, t) { return (a - b < t && b - a < t) }
$1 == "WD08" && $2 == "res" { if ($3 == 1568 && $4 == 720 && near($5, 15.68, 0.001)) res = 1 }
$1 == "WIDE" && $2 ~ /^extended=/ { split($2, kv, "="); if (kv[2] + 0 >= 1) wide = 1 }
$1 == "WD08" && $2 == "wall" { if (near($3, -1.44, 0.01) && near($4, 14.24, 0.01)) wall = 1 }
$1 == "WD08" && $2 == "mid" { if (near($3, 4.0, 0.01) && near($4, 5.0, 0.01)) mid = 1 }
$1 == "WD08" && $2 == "proj0" { if (near($3, 0, 1)) p0 = 1 }
$1 == "WD08" && $2 == "proj1280" { if (near($3, 1280, 1)) p1 = 1 }
$1 == "WD08" && $2 == "img" { if ($3 == 1568 && $4 == 720 && near($6, 1, 0.01) && near($8, 1, 0.01) && near($10, 1, 0.01)) img = 1 }
END { if (res && wide && wall && mid && p0 && p1 && img) print "ok"; else print "bad" }')

if [ "$result" = "ok" ]; then
	echo "ROOMWIDE OK"
	exit 0
fi

printf '%s\n' "$lines"
echo "ROOMWIDE FAIL: expected res 1568 720, WIDE extended>=1, wall -1.44..14.24, mid 4..5, proj0 0, proj1280 1280, img 1568x720 fully opaque"
exit 1
