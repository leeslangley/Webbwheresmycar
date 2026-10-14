#!/bin/sh
# GDA01 test: --list, a Blender export of t1_chimp to /tmp/gda01, a structure check of the
# .glb (classes, node names, no cameras or lights), the META bounds, and a bad --id.
cd "$(dirname "$0")/../.." || exit 1
BLENDER=${BLENDER:-/opt/homebrew/bin/blender}
mkdir -p /tmp/gda01
fail() {
	echo "EXPORT GLB FAIL: $1"
	exit 1
}

python3 tools/art/export_glb.py --list > /tmp/gda01/list.txt || fail "--list exited non-zero"

"$BLENDER" --background --python-exit-code 1 --python tools/art/export_glb.py -- \
	--id t1_chimp --out /tmp/gda01/t1_chimp.glb > /tmp/gda01/blender.log 2>&1 ||
	{ tail -30 /tmp/gda01/blender.log; fail "Blender export of t1_chimp exited non-zero"; }

if "$BLENDER" --background --python-exit-code 1 --python tools/art/export_glb.py -- \
	--id nope --out /tmp/gda01/nope.glb > /tmp/gda01/nope.log 2>&1; then
	fail "--id nope exited 0"
fi

python3 - <<'PYEOF' || fail "checks failed (see the message above)"
import json
import re
import struct
import sys

def bad(msg):
    print('CHECK FAILED: ' + msg)
    sys.exit(1)

# (a) the list
rows = open('/tmp/gda01/list.txt', encoding='utf-8').read().splitlines()
if 't1_chimp\tHillbilly Chimp' not in rows:
    bad('--list has no line t1_chimp TAB Hillbilly Chimp')
if len(rows) != 8:
    bad('--list printed %d lines, expected 8' % len(rows))

# (b) the export log
log = open('/tmp/gda01/blender.log', encoding='utf-8', errors='replace').read()
if 'EXPORTED t1_chimp' not in log:
    bad('no EXPORTED t1_chimp line in the Blender log')
meta_lines = [ln for ln in log.splitlines() if ln.startswith('META ')]
if not meta_lines:
    bad('no META line in the Blender log')
meta = json.loads(meta_lines[-1][len('META '):])

# (c) the glb: 12 byte header, then the JSON chunk
with open('/tmp/gda01/t1_chimp.glb', 'rb') as f:
    data = f.read()
if data[:4] != b'glTF':
    bad('file does not start with glTF')
clen, ctype = struct.unpack('<II', data[12:20])
if ctype != 0x4E4F534A:
    bad('first chunk is not JSON')
gltf = json.loads(data[20:20 + clen].decode('utf-8'))
classes = {'paint', 'paint2', 'chrome', 'glass', 'lamp', 'tail', 'trim', 'tyre', 'wall'}
mat_names = {m.get('name', '') for m in gltf.get('materials', [])}
if not mat_names <= classes:
    bad('material names not all classes: %s' % sorted(mat_names - classes))
for need in ('paint', 'tyre', 'glass', 'chrome'):
    if need not in mat_names:
        bad('material %s missing' % need)
pat = re.compile(r'^(paint|paint2|chrome|glass|lamp|tail|trim|tyre|wall)_[0-9][0-9]$')
node_names = [n.get('name', '') for n in gltf.get('nodes', [])]
if not node_names:
    bad('no nodes in the glb')
for name in node_names:
    if not pat.match(name):
        bad('node name %r does not match the part pattern' % name)
text = json.dumps(gltf)
if '"cameras"' in text or 'KHR_lights_punctual' in text:
    bad('glb has cameras or KHR_lights_punctual')

# META bounds (Godot axes, metres as units of 10 cm = the in-game model)
lo, hi = meta['bbox_min'], meta['bbox_max']
length = hi[0] - lo[0]
if not (9.5 <= length <= 10.6):
    bad('length %.3f not in 9.5..10.6' % length)
if not (3.0 <= hi[1] <= 4.5):
    bad('bbox_max y %.3f not in 3.0..4.5' % hi[1])
if not (-0.05 <= lo[1] <= 1.0):
    bad('bbox_min y %.3f not in -0.05..1.0' % lo[1])
if meta['wheels'] < 2:
    bad('wheels %s, expected 2 or more' % meta['wheels'])

print('glb: %d bytes, materials %s, %d nodes, length %.3f, bbox_max y %.3f, bbox_min y %.3f, wheels %d'
      % (len(data), sorted(mat_names), len(node_names), length, hi[1], lo[1], meta['wheels']))
PYEOF

echo "EXPORT GLB OK"
