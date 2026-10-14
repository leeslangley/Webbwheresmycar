#!/bin/bash
# Rage of Christ on Lee's iPhone through TestFlight, driven from the Mac.
#
#   tools/ios/testflight.sh build  <name>   import, export with the shader baker, stamp the next build number from CASE,
#                                           archive unsigned -> /tmp/RageOfChrist-<name>.xcarchive
#   tools/ios/testflight.sh upload <name>   signed export + upload of that archive to App Store Connect, retried every
#                                           30 s until it goes (see "Signing in" below)
#
# Run `build` from a CLEAN checkout of the commit to ship (a throwaway `git worktree`): Godot rewrites project.godot and
# many .import files as it runs, and that noise must not reach the archive or the repo.
#
# Needs: Godot 4.7.2 at /Applications/Godot.app (or GODOT=...); Xcode with the iOS platform; Apple's Metal Toolchain
# (`xcodebuild -downloadComponent MetalToolchain`: without it the shader baker silently does nothing); ssh to CASE
# (clive@razer-case), which holds the build-number counter (tools/ios_build_number.py) so numbers only go up.
#
# Signing in: the upload needs an Apple session. Either Lee signs into Xcode (Settings -> Accounts; his session
# sometimes lasts over an hour, sometimes ~15 min, hence the retry loop), or an App Store Connect API key is used, which
# needs no sign-in at all: set ASC_KEY_PATH (the AuthKey_<id>.p8 file, normally in ~/.appstoreconnect/private_keys),
# ASC_KEY_ID and ASC_ISSUER_ID. Never read or print the .p8.
#
# Afterwards: Apple takes ~10-15 min to process the build; watch the TestFlight page in App Store Connect (app
# 6820172676), then Lee presses Update in TestFlight. Team G3G9X5XV82, bundle com.leelangley.rageofchrist.
set -u
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
G="${GODOT:-/Applications/Godot.app/Contents/MacOS/Godot}"
CASE="${CASE_HOST:-clive@razer-case}"
cmd="${1:-}"; name="${2:-}"
[ -n "$cmd" ] && [ -n "$name" ] || { sed -n '2,8p' "$0"; exit 2; }
ARCHIVE="/tmp/RageOfChrist-$name.xcarchive"

build() {
  cd "$ROOT" || exit 1
  echo "[$(date +%T)] import"
  make import GODOT="$G" 2>&1 | tail -1
  mkdir -p build/ios                                       # (build/ is git-ignored: a fresh worktree has none)
  rm -r -f build/ios/RageOfChrist.xcodeproj build/ios/RageOfChrist.pck
  # Windowed (not --headless) and --rendering-method mobile: only then does the shader baker run. Godot's own xcodebuild
  # step ends with rc=1 (nothing is signed there), but the Xcode project it writes first is what we archive.
  echo "[$(date +%T)] export (shader baker)"
  "$G" --rendering-method mobile --path game --export-release "iOS" ../build/ios/RageOfChrist.ipa > "/tmp/roc-export-$name.log" 2>&1
  [ -d build/ios/RageOfChrist.xcodeproj ] || { echo "EXPORT FAILED: no Xcode project"; exit 1; }
  echo "baker lines: $(tr '\r' '\n' < "/tmp/roc-export-$name.log" | grep -a -c 'baking_shaders'), pck $(ls -la build/ios/RageOfChrist.pck | awk '{printf "%.0f MB", $5/1048576}')"
  local plist=build/ios/RageOfChrist/RageOfChrist-Info.plist
  scp -q "$plist" "$CASE:/tmp/roc-mac-info.plist" \
    && ssh -o BatchMode=yes "$CASE" 'cd ~/work/rageofchrist && python3 tools/ios_build_number.py /tmp/roc-mac-info.plist' \
    && scp -q "$CASE:/tmp/roc-mac-info.plist" "$plist" || { echo "STAMPING FAILED"; exit 1; }
  echo "[$(date +%T)] stamped build $(plutil -extract CFBundleVersion raw "$plist")"
  rm -r -f "$ARCHIVE"
  echo "[$(date +%T)] archive"
  (cd build/ios && xcodebuild archive -project RageOfChrist.xcodeproj -scheme RageOfChrist -configuration Release \
    -destination 'generic/platform=iOS' -archivePath "$ARCHIVE" CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO \
    CODE_SIGN_IDENTITY="" ARCHS=arm64 ONLY_ACTIVE_ARCH=NO > "/tmp/roc-archive-$name.log" 2>&1)
  grep -a -E "ARCHIVE (SUCCEEDED|FAILED)" "/tmp/roc-archive-$name.log"
  local app="$ARCHIVE/Products/Applications/RageOfChrist.app"
  [ -d "$app" ] || { echo "ARCHIVE FAILED"; exit 1; }
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
  local log="/tmp/roc-upload-$name.log"
  rm -f "$log"
  for i in $(seq 1 90); do
    rm -r -f "/tmp/roc-export-$name"
    xcodebuild -exportArchive -archivePath "$ARCHIVE" -exportOptionsPlist "$ROOT/tools/ios/ExportOptions.plist" \
      -exportPath "/tmp/roc-export-$name" -allowProvisioningUpdates ${auth[@]+"${auth[@]}"} > "/tmp/roc-upload-try-$name.log" 2>&1
    local rc=$?
    local msg
    msg=$(grep -a -E '^error:|Upload (succeeded|failed)|EXPORT (SUCCEEDED|FAILED)|Uploaded' "/tmp/roc-upload-try-$name.log" | tr '\n' ' ' | cut -c1-230)
    echo "[$(date +%T)] attempt $i rc=$rc: $msg" | tee -a "$log"
    if [ $rc -eq 0 ]; then echo "UPLOAD DONE" | tee -a "$log"; exit 0; fi
    if grep -a -q -i -E "redundant|already been (used|uploaded)|previously uploaded|ITMS-90189|must be higher" "/tmp/roc-upload-try-$name.log"; then
      echo "ALREADY AT APPLE" | tee -a "$log"; exit 0
    fi
    sleep 30
  done
  echo "GAVE UP after 90 attempts" | tee -a "$log"
  exit 1
}

case "$cmd" in
  build) build ;;
  upload) upload ;;
  *) echo "unknown command $cmd (build | upload)"; exit 2 ;;
esac
