#!/bin/sh
# Render the toon-material check in Blender and print CHARLIB OK only when it passed.
# Blender is slow, so this is not part of `make test`.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

BLENDER=${BLENDER:-/opt/homebrew/bin/blender}

if res=$("$BLENDER" --background --python-exit-code 1 \
        --python tests/charlib_check.py 2>&1); then
	case "$res" in
	*"CHARLIB OK"*)
		printf '%s\n' "$res" | grep 'CHARLIB OK' | tail -1
		exit 0 ;;
	*)
		echo "CHARLIB FAIL: no CHARLIB OK line in output"
		printf '%s\n' "$res" | tail -20
		exit 2 ;;
	esac
else
	printf '%s\n' "$res" | tail -20
	case "$res" in
	*"CHARLIB FAIL"*) ;;
	*) echo "CHARLIB FAIL: blender exited non-zero" ;;
	esac
	exit 2
fi
