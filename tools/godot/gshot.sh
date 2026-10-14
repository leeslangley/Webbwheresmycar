#!/bin/bash
# gshot.sh <scene.tscn (res:// path or relative to godot/)> <out.png> [frames=8] [WxH=1280x720]: render a scene on CASE under
# Xvfb (software GL) for N frames and copy the viewport PNG back to <out.png>. Nothing opens on this Mac.
. "$(dirname "$0")/_common.sh"
SCENE="${1:?scene}"; OUT="${2:?out.png}"; FR="${3:-8}"; SZ="${4:-1280x720}"
case "$SCENE" in res://*) ;; *) SCENE="res://$SCENE";; esac
ship
scp -q -o BatchMode=yes "$HERE/shot.gd" "$HOST:$RDIR/_shot.gd"
ssh -o BatchMode=yes "$HOST" "cd $RDIR && rm -f _shot.png && timeout 600 $GODOT_REMOTE --headless --path . --import >/dev/null 2>&1; GD_SCENE='$SCENE' GD_FRAMES=$FR GD_OUT=$RDIR/_shot.png timeout 300 xvfb-run -a -s '-screen 0 ${SZ}x24' $GODOT_REMOTE --path . --resolution $SZ -s res://_shot.gd 2>&1 | grep -E 'SHOT|ERROR|SCRIPT' | head -20"
scp -q -o BatchMode=yes "$HOST:$RDIR/_shot.png" "$OUT" && echo "wrote $OUT" || { echo "no screenshot produced"; exit 1; }
