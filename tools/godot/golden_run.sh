#!/bin/sh
# golden_run.sh <name>: run tools/godot/golden_<name>.mjs under macOS jsc and write godot/tests/golden/<name>.json.
# Prints GOLDEN <name> OK <bytes> bytes (exit 0), or GOLDEN <name> FAIL (exit 1). Missing name or script: exit 2.
set -u
NAME="${1:-}"
if [ -z "$NAME" ]; then
	echo "usage: sh tools/godot/golden_run.sh <name>" >&2
	exit 2
fi
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT" || exit 2
SCRIPT="tools/godot/golden_$NAME.mjs"
if [ ! -f "$SCRIPT" ]; then
	echo "usage: sh tools/godot/golden_run.sh <name> (missing $SCRIPT)" >&2
	exit 2
fi
JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc
OUT="godot/tests/golden/$NAME.json"
TMP="$OUT.tmp.$$"
mkdir -p godot/tests/golden
if ! "$JSC" -m "$SCRIPT" > "$TMP"; then
	rm -f "$TMP"
	echo "GOLDEN $NAME FAIL"
	exit 1
fi
if ! python3 -c "import json,sys;json.load(open(sys.argv[1]))" "$TMP"; then
	rm -f "$TMP"
	echo "GOLDEN $NAME FAIL"
	exit 1
fi
mv "$TMP" "$OUT"
BYTES=$(wc -c < "$OUT" | tr -d ' ')
echo "GOLDEN $NAME OK $BYTES bytes"
exit 0
