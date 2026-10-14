#!/bin/sh
# Check the CA03 parts framework: the fixture renders with an explicit details
# file, with --details none and with the default details (no file for it), then
# the registry, the side helper, the part names and the material set are checked
# inside Blender. Blender is slow, so this is not part of `make test`.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

BLENDER=${BLENDER:-/opt/homebrew/bin/blender}
out1=/tmp/ca03_details.png
out2=/tmp/ca03_none.png
out3=/tmp/ca03_default.png

ok=1

# check_render <label> <out png> <extra args...>: exit 0 and a RENDERED line.
check_render() {
	label=$1
	out=$2
	shift 2
	rm -f "$out"
	if res=$("$BLENDER" --background --python-exit-code 1 \
	        --python tools/art/blender_car2.py -- \
	        --dossier tests/fixtures/dossier_ok.json --out "$out" "$@" 2>&1); then
		case "$res" in
		*"RENDERED $out"*) ;;
		*) echo "FAIL: $label exited 0 but output missing 'RENDERED $out'"; ok=0 ;;
		esac
	else
		echo "FAIL: $label did not exit 0:"
		echo "$res" | tail -5
		ok=0
	fi
}

# 1. An explicit details file, with the report.
check_render "explicit details" "$out1" \
	--details tests/fixtures/details_ok.json --report

# 2. --details none: the V03/V04/V05 builders only.
check_render "--details none" "$out2" --details none

# 3. The default: dossier_ok has no details file, so the details come from
#    surface.default_details.
check_render "default details" "$out3"

# 4. The registry, the side helper, the part names and the material set, in one
#    Blender run with the dummy kind registered for this run only.
expr="import sys, re; sys.dont_write_bytecode = True; sys.path.insert(0, '$root/tools/art'); import parts, cbmat; from parts import _common, _mats; parts.register('ca03_dummy')(lambda part, ctx, i: None); assert 'ca03_dummy' in parts.BUILDERS; assert _common.side_list({'lat': 3}) == [-1, 1]; assert _common.part_name('x', 2, -1) == 'x_2_n'; m = _mats.make_all('#C96F32'); assert all(re.sub(r'\.\d{3}$', '', v.name) in cbmat.MASK_CLASS for v in m.values()), sorted(v.name for v in m.values()); assert m['black'] is m['trim']; print('PARTS FRAMEWORK OK')"
if res=$("$BLENDER" --background --python-exit-code 1 --python-expr "$expr" 2>&1); then
	case "$res" in
	*"PARTS FRAMEWORK OK"*) ;;
	*) echo "FAIL: framework check exited 0 but did not print PARTS FRAMEWORK OK"; ok=0 ;;
	esac
else
	echo "FAIL: framework check did not exit 0:"
	echo "$res" | tail -5
	ok=0
fi

if [ "$ok" -eq 1 ]; then
	echo "CA03 OK"
	exit 0
fi
exit 1
