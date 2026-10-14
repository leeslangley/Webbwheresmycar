#!/bin/bash
# sheet.sh <out.png> [scenes=title,office,garage,auction,endgame,settings,loading] [frames=10]
# Renders every listed room scene on CASE (Xvfb, one Godot process, sheet.gd) and writes ONE contact-sheet PNG to <out.png>:
# 640x360 tiles, three per row, each captioned with its scene name (1920x1080 for the default 7 scenes).
# Nothing opens on this Mac. Same mechanism as gshot.sh.
. "$(dirname "$0")/_common.sh"
OUT="${1:?out.png}"; SCENES="${2:-title,office,garage,auction,endgame,settings,loading}"; FR="${3:-10}"
ship
scp -q -o BatchMode=yes "$HERE/sheet.gd" "$HOST:$RDIR/_sheet.gd"
ssh -o BatchMode=yes "$HOST" "cd $RDIR && rm -f _sheet.png && timeout 600 $GODOT_REMOTE --headless --path . --import >/dev/null 2>&1; GD_SCENES='$SCENES' GD_FRAMES=$FR GD_OUT=$RDIR/_sheet.png timeout 600 xvfb-run -a -s '-screen 0 1280x720x24' $GODOT_REMOTE --path . --resolution 1280x720 -s res://_sheet.gd 2>&1 | grep -E 'SHEET|ERROR|SCRIPT' | head -40"
scp -q -o BatchMode=yes "$HOST:$RDIR/_sheet.png" "$OUT" && echo "wrote $OUT" || { echo "no sheet produced"; exit 1; }
