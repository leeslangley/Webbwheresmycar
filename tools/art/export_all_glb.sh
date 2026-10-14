#!/bin/sh
# GDA02: export every car (or the one car id given) to godot/art/cars/<id>.glb with Blender
# (headless), keep each car's META line in build/glb/<id>.meta.json, then write
# godot/art/cars/manifest.json. Usage (any folder): sh tools/art/export_all_glb.sh [id]
# Prints OK <id> or FAIL <id> per car; exit 1 if any car failed.
cd "$(dirname "$0")/../.." || exit 1
BLENDER=${BLENDER:-/opt/homebrew/bin/blender}

if [ $# -ge 1 ]; then
	IDS=$1
else
	LIST=$(python3 tools/art/export_glb.py --list) || {
		echo "FAIL list"
		exit 1
	}
	IDS=$(printf '%s\n' "$LIST" | cut -f1)
fi

mkdir -p build/glb
FAILED=0
for id in $IDS; do
	log=build/glb/$id.log
	rm -f "build/glb/$id.meta.json"
	if "$BLENDER" --background --python-exit-code 1 --python tools/art/export_glb.py -- --id "$id" > "$log" 2>&1; then
		meta=$(grep '^META ' "$log" | tail -n 1)
		if [ -n "$meta" ]; then
			printf '%s\n' "${meta#META }" > "build/glb/$id.meta.json"
			echo "OK $id"
			continue
		fi
	fi
	echo "FAIL $id"
	FAILED=$((FAILED + 1))
done

MANIFEST_RC=0
python3 tools/art/glb_manifest.py build || MANIFEST_RC=1
if [ "$FAILED" -gt 0 ] || [ "$MANIFEST_RC" -ne 0 ]; then
	echo "EXPORT ALL FAILED $FAILED"
	exit 1
fi
exit 0
