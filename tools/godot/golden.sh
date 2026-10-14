#!/bin/sh
# golden.sh <name>: make godot/tests/golden/<name>.json from tools/godot/golden_<name>.mjs (run by jsc -m, on this Mac).
# The .mjs prints ONE line of JSON; python3 validates it and writes it as pure ASCII. Nothing is left half-written.
set -eu
cd "$(dirname "$0")/../.."
if [ "$#" -ne 1 ] || [ -z "$1" ]; then
	echo "usage: sh tools/godot/golden.sh <name>" >&2
	exit 2
fi
NAME="$1"
JSC="${JSC:-/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc}"
SRC="tools/godot/golden_$NAME.mjs"
OUT="godot/tests/golden/$NAME.json"
if [ ! -f "$SRC" ]; then
	echo "no golden_$NAME.mjs"
	exit 1
fi
RAW=$(mktemp)
TMP=$(mktemp godot/tests/golden/.golden.XXXXXX)
trap 'rm -f "$RAW" "$TMP"' EXIT
"$JSC" -m "$SRC" > "$RAW"
python3 -I -c 'import json,sys; print(json.dumps(json.loads(sys.stdin.buffer.read().decode("utf-8")), ensure_ascii=True, separators=(",", ":")))' < "$RAW" > "$TMP"
chmod 644 "$TMP"
mv "$TMP" "$OUT"
echo "wrote $OUT ($(wc -c < "$OUT" | tr -d ' ') bytes)"
