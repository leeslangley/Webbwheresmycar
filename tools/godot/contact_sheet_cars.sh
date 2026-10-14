#!/bin/sh
# contact_sheet_cars.sh [out.png]: render the car contact sheet (res://art/car_sheet.tscn, GDA17) on CASE through
# gshot.sh and copy the 1280x720 PNG back to out.png (default /tmp/car_sheet.png). Every car in art/cars/manifest.json
# gets a side view at wear (index mod 4) and a three-quarter view at wear 0, each with its game name and wear.
# Usage: sh tools/godot/contact_sheet_cars.sh [/tmp/car_sheet.png]. Prints "SHEET <out.png>" on success.
HERE=$(cd "$(dirname "$0")" && pwd)
OUT=${1:-/tmp/car_sheet.png}
sh "$HERE/gshot.sh" art/car_sheet.tscn "$OUT" 40 1280x720
RC=$?
if [ "$RC" -eq 0 ]; then echo "SHEET $OUT"; fi
exit "$RC"
