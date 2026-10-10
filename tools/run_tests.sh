#!/bin/sh
# Run every tests/*.test.mjs under macOS jsc -m and report pass/fail.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

: "${JSC:=/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc}"

n=0
k=0
for f in tests/*.test.mjs; do
	[ -e "$f" ] || continue
	n=$((n + 1))
	if out=$("$JSC" -m "$f" 2>&1); then
		echo "PASS $f"
	else
		echo "FAIL $f"
		echo "$out"
		k=$((k + 1))
	fi
done

if [ "$n" -eq 0 ]; then
	echo "NO TESTS"
	exit 1
fi
if [ "$k" -eq 0 ]; then
	echo "ALL TESTS PASS ($n files)"
	exit 0
fi
echo "TESTS FAILED ($k of $n files)"
exit 1
