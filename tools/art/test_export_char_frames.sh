#!/bin/sh
# test_export_char_frames.sh: selftest of export_char_frames.py, then the real export when
# assets/art/characters/manifest.json exists. Run from anywhere; last line is EXPORT CHARS OK.
cd "$(dirname "$0")/../.." || exit 1

fail() {
	echo "EXPORT CHARS FAIL: $1"
	exit 1
}

out=$(python3 tools/art/export_char_frames.py --selftest 2>&1)
rc=$?
printf '%s\n' "$out"
[ "$rc" -eq 0 ] || fail "selftest exit $rc"
last=$(printf '%s\n' "$out" | tail -n 1)
[ "$last" = "CHAR EXPORT SELFTEST OK" ] || fail "selftest last line is not CHAR EXPORT SELFTEST OK"

if [ -f assets/art/characters/manifest.json ]; then
	real=$(python3 tools/art/export_char_frames.py --src assets/art/characters --out godot/art/chars --char all 2>&1)
	rc=$?
	printf '%s\n' "$real"
	[ "$rc" -eq 0 ] || fail "real export exit $rc"
	printf '%s\n' "$real" | grep -q '^EXPORTED mark ' || fail "no EXPORTED mark line"
	printf '%s\n' "$real" | grep -q '^EXPORTED dave ' || fail "no EXPORTED dave line"
	python3 -c "import json; json.load(open('godot/art/chars/mark.json'))" || fail "godot/art/chars/mark.json does not parse"
else
	echo "SKIP real export (no assets/art/characters/manifest.json yet)"
fi

echo "EXPORT CHARS OK"
