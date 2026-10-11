#!/bin/sh
# Check the dossier checker: valid file passes, broken files fail for the right reason.
set -u

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

ok=1

# 1. Valid dossier: exit 0 and "DOSSIER OK dossier_ok"
if out=$(python3 tools/check_dossier.py tests/fixtures/dossier_ok.json 2>&1); then
	case "$out" in
	*"DOSSIER OK dossier_ok"*) ;;
	*) echo "FAIL: dossier_ok.json exited 0 but output missing 'DOSSIER OK dossier_ok': $out"; ok=0 ;;
	esac
else
	echo "FAIL: dossier_ok.json did not exit 0: $out"
	ok=0
fi

# 2. Broken dossier: exit 1 with height and ASCII complaints
if out=$(python3 tools/check_dossier.py tests/fixtures/dossier_bad.json 2>&1); then
	echo "FAIL: dossier_bad.json exited 0 (should be 1): $out"
	ok=0
else
	case "$out" in
	*height*) ;;
	*) echo "FAIL: dossier_bad.json output missing 'height': $out"; ok=0 ;;
	esac
	case "$out" in
	*ASCII*) ;;
	*) echo "FAIL: dossier_bad.json output missing 'ASCII': $out"; ok=0 ;;
	esac
fi

# 3. File name must match the id
cp tests/fixtures/dossier_ok.json /tmp/wrongname.json
if out=$(python3 tools/check_dossier.py /tmp/wrongname.json 2>&1); then
	echo "FAIL: wrongname.json exited 0 (should be 1): $out"
	ok=0
else
	case "$out" in
	*wrongname.json*) ;;
	*) echo "FAIL: wrongname.json failure does not mention the file name: $out"; ok=0 ;;
	esac
fi
rm -f /tmp/wrongname.json

if [ "$ok" -eq 1 ]; then
	echo "DOSSIER CHECKER OK"
	exit 0
fi
exit 1
