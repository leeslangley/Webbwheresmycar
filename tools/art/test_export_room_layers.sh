#!/bin/sh
# test_export_room_layers.sh: run the room export selftest (last line must be ROOM EXPORT SELFTEST OK),
# then the real export when assets/art/rooms/manifest.json exists (must print at least one EXPORTED line).
cd "$(dirname "$0")/../.." || exit 1

out=$(python3 tools/art/export_room_layers.py --selftest 2>&1)
rc=$?
echo "$out"
if [ "$rc" -ne 0 ] || [ "$(echo "$out" | tail -n 1)" != "ROOM EXPORT SELFTEST OK" ]; then
	echo "EXPORT ROOMS FAIL (selftest)"
	exit 1
fi

if [ -f assets/art/rooms/manifest.json ]; then
	out=$(python3 tools/art/export_room_layers.py --room all 2>&1)
	echo "$out"
	if ! echo "$out" | grep -q '^EXPORTED '; then
		echo "EXPORT ROOMS FAIL (no EXPORTED line from the real export)"
		exit 1
	fi
else
	echo "SKIP real export (no assets/art/rooms/manifest.json yet)"
fi

echo "EXPORT ROOMS OK"
