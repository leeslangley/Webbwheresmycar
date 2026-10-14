#!/bin/sh
# test_make_launch.sh: regenerate godot/icon.svg and godot/art/launch.png with make_launch.py, check
# them, and check that a second run gives identical files. Last line is LAUNCH ASSETS OK (exit 0)
# or LAUNCH FAIL (exit 1). Standard library only.
set -e
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
cd "$ROOT"

python3 tools/art/make_launch.py
python3 tools/art/make_launch.py --check

if ! file godot/art/launch.png | grep -q '1280 x 720'; then
	echo 'LAUNCH FAIL: godot/art/launch.png is not 1280 x 720'
	exit 1
fi

# The icon must be an SVG with a 32 x 32 viewBox, at least one rect per listed rectangle, and ASCII only.
# The spec lists 7 icon rectangles plus the 16 car rectangles, so the expected count is exactly 23.
python3 - <<'EOF'
import sys
import xml.etree.ElementTree as ET

path = 'godot/icon.svg'
root = ET.parse(path).getroot()
if root.get('viewBox') != '0 0 32 32':
    sys.exit('LAUNCH FAIL: icon viewBox is %r' % root.get('viewBox'))
rects = root.findall('{http://www.w3.org/2000/svg}rect')
if len(rects) != 23:
    sys.exit('LAUNCH FAIL: icon has %d rect elements, expected 23' % len(rects))
with open(path, 'rb') as f:
    data = f.read()
if any(b > 126 for b in data):
    sys.exit('LAUNCH FAIL: icon.svg has a byte above 126')
EOF

hash_outputs() {
	python3 -c "import hashlib, sys; print(''.join(hashlib.md5(open(p, 'rb').read()).hexdigest() for p in sys.argv[1:]))" godot/icon.svg godot/art/launch.png
}

first=$(hash_outputs)
python3 tools/art/make_launch.py >/dev/null
second=$(hash_outputs)
if [ "$first" != "$second" ]; then
	echo 'LAUNCH FAIL: outputs differ between two runs'
	exit 1
fi

echo 'LAUNCH ASSETS OK'
