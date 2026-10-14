#!/bin/bash
# Webb, where's my car? (Godot build) on Lee's iPhone through TestFlight, driven from the Mac. No Godot window opens:
# the export runs with --headless and takes a few seconds.
#
#   tools/ios/godot_testflight.sh build <name>    headless Godot iOS export -> Xcode project in /tmp, stamp a fresh
#                                                  build number (date +%y%m%d%H%M), archive unsigned
#                                                  -> /tmp/WebbGodot-<name>.xcarchive
#   tools/ios/godot_testflight.sh upload <name>   signed export + upload of that archive to App Store Connect
#                                                  (TestFlight), retried every 30 s, up to 40 times
#
# Upload signing: `source ~/.appstoreconnect/rage.env` first (ASC_KEY_PATH, ASC_KEY_ID, ASC_ISSUER_ID; this script never
# reads or prints the .p8). Without them xcodebuild uses the Apple session signed into Xcode.
# Bundle com.leelangley.webbwheresmycar, team G3G9X5XV82.
set -u
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
G="${GODOT:-/Applications/Godot.app/Contents/MacOS/Godot}"
cmd="${1:-}"; name="${2:-}"
[ -n "$cmd" ] && [ -n "$name" ] || { sed -n '2,12p' "$0"; exit 2; }
WORK="/tmp/webbgodot-$name"
ARCHIVE="/tmp/WebbGodot-$name.xcarchive"

build() {
  rm -r -f "$WORK"; mkdir -p "$WORK/build/ios"
  rsync -a --exclude '.godot/' "$ROOT/godot/" "$WORK/godot/" || exit 1
  cd "$WORK/godot" || exit 1
  echo "[$(date +%T)] import"
  "$G" --headless --path . --import > /dev/null 2>&1
  echo "[$(date +%T)] export (headless)"
  "$G" --headless --path . --export-release "iOS" ../build/ios/WebbWheresMyCar.ipa > "/tmp/webbgodot-export-$name.log" 2>&1
  local proj="$WORK/build/ios/WebbWheresMyCar.xcodeproj"
  [ -d "$proj" ] || { echo "EXPORT FAILED: no Xcode project (see /tmp/webbgodot-export-$name.log)"; exit 1; }
  local plist="$WORK/build/ios/WebbWheresMyCar/WebbWheresMyCar-Info.plist"
  [ -f "$plist" ] || plist=$(ls "$WORK"/build/ios/*/*-Info.plist | head -1)
  local n
  n=$(date +%y%m%d%H%M)
  plutil -replace CFBundleVersion -string "$n" "$plist" || { echo "STAMPING FAILED"; exit 1; }
  echo "[$(date +%T)] build number $n"
  rm -r -f "$ARCHIVE"
  echo "[$(date +%T)] archive (unsigned, iphoneos)"
  (cd "$WORK/build/ios" && xcodebuild archive -project WebbWheresMyCar.xcodeproj -scheme WebbWheresMyCar -configuration Release \
    -destination 'generic/platform=iOS' -archivePath "$ARCHIVE" CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO \
    CODE_SIGN_IDENTITY="" ARCHS=arm64 ONLY_ACTIVE_ARCH=NO > "/tmp/webbgodot-archive-$name.log" 2>&1)
  grep -a -E "ARCHIVE (SUCCEEDED|FAILED)" "/tmp/webbgodot-archive-$name.log"
  local app
  app=$(ls -d "$ARCHIVE"/Products/Applications/*.app 2>/dev/null | head -1)
  [ -n "$app" ] && [ -d "$app" ] || { echo "ARCHIVE FAILED (see /tmp/webbgodot-archive-$name.log)"; exit 1; }
  echo "archived: $(du -sh "$app" | cut -f1), build $(plutil -extract CFBundleVersion raw "$app/Info.plist")"
  echo "BUILD $name READY"
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
  local log="/tmp/webbgodot-upload-$name.log"
  rm -f "$log"
  local i rc msg
  for i in $(seq 1 40); do
    rm -r -f "/tmp/WebbGodot-export-$name"
    xcodebuild -exportArchive -archivePath "$ARCHIVE" -exportOptionsPlist "$ROOT/tools/ios/ExportOptions.plist" \
      -exportPath "/tmp/WebbGodot-export-$name" -allowProvisioningUpdates ${auth[@]+"${auth[@]}"} \
      > "/tmp/webbgodot-upload-try-$name.log" 2>&1
    rc=$?
    msg=$(grep -a -E '^error:|Upload (succeeded|failed)|EXPORT (SUCCEEDED|FAILED)|Uploaded' "/tmp/webbgodot-upload-try-$name.log" | tr '\n' ' ' | cut -c1-230)
    echo "[$(date +%T)] attempt $i rc=$rc: $msg" | tee -a "$log"
    if [ $rc -eq 0 ]; then echo "UPLOAD DONE" | tee -a "$log"; exit 0; fi
    if grep -a -q -i -E "redundant|already been (used|uploaded)|previously uploaded|ITMS-90189|must be higher" "/tmp/webbgodot-upload-try-$name.log"; then
      echo "BUILD NUMBER REJECTED: run build again (it stamps a fresh number)" | tee -a "$log"; exit 3
    fi
    sleep 30
  done
  echo "UPLOAD GAVE UP (see $log)"; exit 1
}

case "$cmd" in
  build) build ;;
  upload) upload ;;
  *) sed -n '2,12p' "$0"; exit 2 ;;
esac
