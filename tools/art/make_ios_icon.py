#!/usr/bin/env python3
"""Write godot/art/icon_ios_1024.png (1024x1024, no alpha) from the same cell list as the project icon (make_launch.py)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import make_launch as ml

grid = ml.fill_grid(ml.icon_rects(), ml.ICON_CELLS, ml.ICON_CELLS)
scale = 1024 // ml.ICON_CELLS
data = ml.encode_png(ml.ICON_CELLS * scale, ml.ICON_CELLS * scale, ml.rasterise_rows(grid, scale))
out = os.path.join(ml.ROOT, 'godot', 'art', 'icon_ios_1024.png')
open(out, 'wb').write(data)
print('WROTE', out, len(data), 'bytes')
