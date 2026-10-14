#!/bin/sh
# Check CA05 wheel arches: each fixture renders with --body loft and --report.
# dossier_ok (four wheels, round arches) must print ARCH OK n=4 and exactly four
# REPORT archwell_ lines. t1_robbin (three wheels) must print ARCH SKIP trike
# front, ARCH OK n=2 (one arch per side for the rear pair, see the notes below)
# and two REPORT archwell_ lines. Both must print the body vertex count before
# and after cutting, and the count must change. Blender is slow, so this is not
# part of `make test`.
#
# Notes: t1_robbin is rendered with its own details file, because --details none
# skips the parts framework (and so the arches stage). The robbin rear pair shares
# one x, so it gets one arch per side, not one per wheel entry.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

BLENDER=${BLENDER:-/opt/homebrew/bin/blender}
out1=/tmp/ca05_dossier_ok.png
out2=/tmp/ca05_t1_robbin.png
tmpd=$(mktemp -d "${TMPDIR:-/tmp}/ca05.XXXXXX")
trap 'rm -rf "$tmpd"' EXIT

ok=1

# run_case <label> <dossier> <out png> <details> <ARCH n> <archwell count> [skip text]
run_case() {
	label=$1
	dossier=$2
	out=$3
	details=$4
	want_n=$5
	want_wells=$6
	skip=${7:-}
	log="$tmpd/$label.log"
	rm -f "$out"
	if ! "$BLENDER" --background --python-exit-code 1 \
	        --python tools/art/blender_car2.py -- \
	        --dossier "$dossier" --out "$out" --body loft \
	        --details "$details" --report > "$log" 2>&1; then
		echo "FAIL: $label did not exit 0:"
		tail -5 "$log"
		ok=0
		return
	fi
	if ! grep -q "^RENDERED $out" "$log"; then
		echo "FAIL: $label exited 0 but printed no 'RENDERED $out' line"
		ok=0
		return
	fi
	if ! grep -q "^ARCH OK n=$want_n\$" "$log"; then
		echo "FAIL: $label did not print 'ARCH OK n=$want_n':"
		grep '^ARCH' "$log"
		ok=0
	fi
	if [ -n "$skip" ] && ! grep -q "^ARCH SKIP $skip\$" "$log"; then
		echo "FAIL: $label did not print 'ARCH SKIP $skip'"
		ok=0
	fi
	wells=$(grep -c '^REPORT archwell_' "$log")
	if [ "$wells" -ne "$want_wells" ]; then
		echo "FAIL: $label has $wells REPORT archwell_ lines, want $want_wells"
		ok=0
	fi
	before=$(sed -n 's/^ARCH VERTS before=\([0-9]*\)$/\1/p' "$log" | head -n 1)
	after=$(sed -n 's/^ARCH VERTS after=\([0-9]*\)$/\1/p' "$log" | head -n 1)
	if [ -z "$before" ] || [ -z "$after" ]; then
		echo "FAIL: $label printed no ARCH VERTS before/after counts"
		ok=0
	elif [ "$before" -eq "$after" ]; then
		echo "FAIL: $label body verts did not change: before=$before after=$after"
		ok=0
	else
		echo "$label: ARCH OK n=$want_n, $wells archwells, verts before=$before after=$after"
	fi
}

# 1. dossier_ok: four wheels, round arches, its explicit details file.
run_case "dossier_ok" tests/fixtures/dossier_ok.json "$out1" \
	tests/fixtures/details_ok.json 4 4

# 2. t1_robbin: three wheels, so the unique-x front wheel is skipped. Its own
#    details file is used (--details none would skip the parts stages).
run_case "t1_robbin" docs/cars/t1_robbin.json "$out2" \
	docs/cars/details/t1_robbin.json 2 2 "trike front"

if [ "$ok" -eq 1 ]; then
	echo "CA05 OK"
	exit 0
fi
exit 1
