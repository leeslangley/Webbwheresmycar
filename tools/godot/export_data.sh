#!/bin/sh
# export_data.sh: export src/data/*.js to godot/data/<stem>.json and godot/tests/golden/data_counts.json (GDF03).
# Runs tools/godot/export_data.mjs under jsc, then writes the JSON with python3. Run from anywhere.
set -eu

ROOT=$(cd "$(dirname "$0")/../.." && pwd)
cd "$ROOT"

JSC=${JSC:-/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc}
mkdir -p godot/data godot/tests/golden

TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT
"$JSC" -m tools/godot/export_data.mjs > "$TMP"

python3 -I - "$TMP" <<'PY'
import json
import os
import sys

src = sys.argv[1]
with open(src, encoding='utf-8') as f:
    lines = f.read().split('\n')

tables = {}
i = 0
while i < len(lines):
    line = lines[i]
    if line == '':
        i += 1
        continue
    if not line.startswith('@@'):
        sys.exit('expected @@name line, got: ' + line[:80])
    tables[line[2:]] = json.loads(lines[i + 1])
    i += 2

if '_counts' not in tables:
    sys.exit('no _counts table in export output')

written = 0
for name, value in tables.items():
    if name == '_counts':
        continue
    path = os.path.join('godot', 'data', name + '.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(value, f, ensure_ascii=True, separators=(',', ':'))
    written += 1

with open(os.path.join('godot', 'tests', 'golden', 'data_counts.json'), 'w', encoding='utf-8') as f:
    json.dump(tables['_counts'], f, ensure_ascii=True, separators=(',', ':'))
written += 1

print('EXPORTED %d files' % written)
PY

rm -f "$TMP"
