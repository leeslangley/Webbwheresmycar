#!/bin/bash
# Shared by gtest.sh and gshot.sh: ship the Godot project to CASE (Linux box, Godot 4.7.2 headless/Xvfb) and run there.
# Godot never runs on the Mac, so it cannot steal window focus. Run from any directory; PROJ (default <repo>/godot) is the project.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
PROJ="${PROJ:-$ROOT/godot}"
HOST="${CASE_HOST:-razer-case}"
GODOT_REMOTE='~/opt/godot/4.7.2/Godot_v4.7.2-stable_linux.x86_64'
[ -f "$PROJ/project.godot" ] || { echo "no project.godot in $PROJ"; exit 2; }
KEY=$(printf '%s' "$PROJ" | cksum | cut -d' ' -f1)
RDIR="/tmp/gdw/$KEY"
ship() {
  ssh -o BatchMode=yes -o ConnectTimeout=10 "$HOST" "mkdir -p $RDIR" || { echo "CASE unreachable"; exit 3; }
  rsync -a --delete -e "ssh -o BatchMode=yes" --exclude '.godot/' --exclude '*.import' "$PROJ"/ "$HOST:$RDIR/"
}
