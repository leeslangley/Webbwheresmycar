#!/bin/sh
# GDA02 test: export every car with export_all_glb.sh (Blender, headless), one OK line per id,
# MANIFEST <n> cars, glb_manifest.py check, a second build leaves the manifest md5 unchanged,
# and t1_chimp is Hillbilly Chimp at len_mm 3556. build/ is scratch and is removed at exit.
cd "$(dirname "$0")/../.." || exit 1
mkdir -p /tmp/gda02
rm -rf build
trap 'rm -rf build' EXIT

fail() {
	echo "EXPORT ALL FAIL: $1"
	exit 1
}

sh tools/art/export_all_glb.sh > /tmp/gda02/export.txt 2>&1 ||
	{ tail -40 /tmp/gda02/export.txt; fail "export_all_glb.sh exited non-zero"; }
cat /tmp/gda02/export.txt

python3 tools/art/export_glb.py --list | cut -f1 > /tmp/gda02/ids.txt || fail "--list exited non-zero"
n=$(wc -l < /tmp/gda02/ids.txt | tr -d ' ')
[ "$n" -gt 0 ] || fail "--list printed no ids"
while read -r id; do
	grep -qx "OK $id" /tmp/gda02/export.txt || fail "no OK line for $id"
done < /tmp/gda02/ids.txt
grep -qx "MANIFEST $n cars" /tmp/gda02/export.txt || fail "no MANIFEST $n cars line"

python3 tools/art/glb_manifest.py check > /tmp/gda02/check.txt 2>&1 ||
	{ cat /tmp/gda02/check.txt; fail "glb_manifest.py check failed"; }
cat /tmp/gda02/check.txt

md5_1=$(md5 -q godot/art/cars/manifest.json) || fail "md5 of the manifest"
python3 tools/art/glb_manifest.py build > /tmp/gda02/build2.txt 2>&1 || fail "second build failed"
md5_2=$(md5 -q godot/art/cars/manifest.json) || fail "md5 of the manifest after build"
[ "$md5_1" = "$md5_2" ] || fail "second build changed the manifest"

python3 - <<'PYEOF' || fail "t1_chimp entry is wrong (see the message above)"
import json
import sys

m = json.load(open('godot/art/cars/manifest.json', encoding='utf-8'))
c = m['cars'].get('t1_chimp')
if c is None:
    print('no t1_chimp in the manifest')
    sys.exit(1)
if c.get('game_name') != 'Hillbilly Chimp':
    print('t1_chimp game_name is %r' % c.get('game_name'))
    sys.exit(1)
if c.get('len_mm') != 3556:
    print('t1_chimp len_mm is %r' % c.get('len_mm'))
    sys.exit(1)
print('t1_chimp: %s, len_mm %s' % (c['game_name'], c['len_mm']))
PYEOF

echo "EXPORT ALL OK"
