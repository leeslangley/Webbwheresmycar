#!/bin/bash
# Webb, wheres my car? on Lee's iPhone through TestFlight, driven from the Mac.
#
#   tools/ios/testflight.sh build <name>    sync ios/www, regenerate the Xcode project with a
#                                           fresh build number (date +%y%m%d%H%M) and archive
#                                           unsigned -> /tmp/WebbWheresMyCar-<name>.xcarchive
#   tools/ios/testflight.sh upload <name>   signed export of that archive + upload to App Store
#                                           Connect (TestFlight), retried every 30 s up to 20 times
#
# Upload signing: run `source ~/.appstoreconnect/rage.env` first so ASC_KEY_PATH (the
# AuthKey_<id>.p8, never read or printed by this script), ASC_KEY_ID and ASC_ISSUER_ID point at
# the App Store Connect API key. Without those three variables xcodebuild falls back to the
# Apple session signed into Xcode (Xcode Settings -> Accounts).
set -u
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cmd="${1:-}"; name="${2:-}"
usage() { sed -n '2,8p' "$0"; }
[ -n "$cmd" ] && [ -n "$name" ] || { usage; exit 2; }
ARCHIVE="/tmp/WebbWheresMyCar-$name.xcarchive"

build() {
  cd "$ROOT" || exit 1
  echo "[$(date +%T)] sync www"
  sh tools/ios/sync_www.sh || exit 1
  local n
  n=$(date +%y%m%d%H%M)
  echo "[$(date +%T)] build number $n"
  BUILD_NUMBER="$n" python3 ios/make_project.py || exit 1
  rm -r -f "$ARCHIVE"
  echo "[$(date +%T)] archive (unsigned, iphoneos)"
  xcodebuild -project ios/WebbWheresMyCar.xcodeproj -scheme WebbWheresMyCar -configuration Release \
    -sdk iphoneos -archivePath "$ARCHIVE" CODE_SIGNING_ALLOWED=NO archive > "/tmp/wmc-archive-$name.log" 2>&1
  grep -a -E "ARCHIVE (SUCCEEDED|FAILED)" "/tmp/wmc-archive-$name.log"
  [ -d "$ARCHIVE" ] || { echo "ARCHIVE FAILED (see /tmp/wmc-archive-$name.log)"; exit 1; }
  echo "$ARCHIVE"
  echo "BUILD $name READY (build number $n)"
}

upload() {
  [ -d "$ARCHIVE" ] || { echo "no archive at $ARCHIVE (run build first)"; exit 1; }
  local auth=()
  if [ -n "${ASC_KEY_PATH:-}" ] && [ -n "${ASC_KEY_ID:-}" ] && [ -n "${ASC_ISSUER_ID:-}" ]; then
    auth=(-authenticationKeyPath "$ASC_KEY_PATH" -authenticationKeyID "$ASC_KEY_ID" -authenticationKeyIssuerID "$ASC_ISSUER_ID")
    echo "using the App Store Connect API key $ASC_KEY_ID"
  else
    echo "using the Apple session in Xcode (Lee signs in: Xcode Settings -> Accounts)"
  fi
  local log="/tmp/wmc-upload-$name.log"
  rm -f "$log"
  local i rc msg
  for i in $(seq 1 20); do
    rm -r -f "/tmp/WebbWheresMyCar-export-$name"
    xcodebuild -exportArchive -archivePath "$ARCHIVE" -exportOptionsPlist "$ROOT/tools/ios/ExportOptions.plist" \
      -exportPath "/tmp/WebbWheresMyCar-export-$name" -allowProvisioningUpdates ${auth[@]+"${auth[@]}"} \
      > "/tmp/wmc-upload-try-$name.log" 2>&1
    rc=$?
    msg=$(grep -a -E '^error:|Upload (succeeded|failed)|EXPORT (SUCCEEDED|FAILED)|Uploaded' "/tmp/wmc-upload-try-$name.log" | tr '\n' ' ' | cut -c1-230)
    echo "[$(date +%T)] attempt $i rc=$rc: $msg" | tee -a "$log"
    if [ $rc -eq 0 ]; then echo "UPLOAD DONE" | tee -a "$log"; exit 0; fi
    if grep -a -q -i -E "redundant|already been (used|uploaded)|previously uploaded|ITMS-90189|must be higher" "/tmp/wmc-upload-try-$name.log"; then
      echo "ALREADY AT APPLE" | tee -a "$log"; exit 0
    fi
    sleep 30
  done
  echo "GAVE UP after 20 attempts" | tee -a "$log"
  exit 1
}

case "$cmd" in
  build) build ;;
  upload) upload ;;
  *) echo "unknown command $cmd (build | upload)"; usage; exit 2 ;;
esac
