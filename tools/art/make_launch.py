#!/usr/bin/env python3
"""Draw the Godot project icon and the launch image for Webb, where's my car? (card GDA16).

Both pictures come from one rectangle list (CAR): a small orange two-door car on a purple
night street. Standard library only (no Blender, no PIL).

    python3 tools/art/make_launch.py           writes godot/icon.svg and godot/art/launch.png
    python3 tools/art/make_launch.py --check   re-reads both files and checks them

Output is deterministic: running it twice gives identical files.
"""

import os
import struct
import sys
import xml.etree.ElementTree as ET
import zlib

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ICON_PATH = os.path.join(ROOT, 'godot', 'icon.svg')
LAUNCH_PATH = os.path.join(ROOT, 'godot', 'art', 'launch.png')

LAUNCH_W, LAUNCH_H, LAUNCH_SCALE = 64, 36, 20   # 64 x 36 cells, 20 px each = 1280 x 720
ICON_CELLS = 32                                  # 32 x 32 grid, SVG viewBox 0 0 32 32
CAR_ROWS_DOWN_ICON = 7                           # car sits 7 cells lower in the icon
CAR_OFFSET_LAUNCH = (16, 8)                      # car is centred, wheels on the road

BLACK = '#000000'

# The car: (x, y, w, h, colour) on a 32 x 21 cell grid, drawn in this order.
CAR = [
    (2, 20, 28, 1, '#0b0918'),    # shadow
    (1, 10, 30, 6, '#c96f32'),    # body
    (22, 8, 8, 2, '#c96f32'),     # bonnet
    (7, 4, 15, 6, '#c96f32'),     # cabin
    (8, 4, 13, 1, '#e8a070'),     # roof highlight
    (1, 14, 30, 2, '#9a4f22'),    # lower shade
    (9, 5, 5, 4, '#a8d0e0'),      # window
    (15, 5, 6, 4, '#a8d0e0'),     # window
    (0, 13, 2, 3, '#e8e8ee'),     # bumper
    (30, 13, 2, 3, '#e8e8ee'),    # bumper
    (28, 10, 2, 2, '#ffe9a8'),    # headlamp
    (1, 10, 2, 2, '#d82020'),     # tail lamp
    (5, 14, 6, 6, '#14102a'),     # tyre
    (21, 14, 6, 6, '#14102a'),    # tyre
    (7, 16, 2, 2, '#e8e8ee'),     # hub
    (23, 16, 2, 2, '#e8e8ee'),    # hub
]

LAUNCH_STARS = [(5, 3), (14, 8), (22, 4), (31, 10), (40, 3),
                (47, 7), (55, 4), (60, 11), (9, 13), (36, 14)]


def icon_rects():
    rects = [
        (0, 0, 32, 32, '#2b2550'),    # background
        (0, 27, 32, 5, '#14102a'),    # road
        (4, 3, 1, 1, '#ffffff'),      # stars
        (12, 6, 1, 1, '#ffffff'),
        (20, 2, 1, 1, '#ffffff'),
        (27, 8, 1, 1, '#ffffff'),
        (24, 3, 4, 4, '#ffe9a8'),     # moon
    ]
    rects += [(x, y + CAR_ROWS_DOWN_ICON, w, h, c) for (x, y, w, h, c) in CAR]
    return rects


def launch_rects():
    dx, dy = CAR_OFFSET_LAUNCH
    rects = [
        (0, 0, 64, 18, '#14102a'),    # sky bands
        (0, 18, 64, 10, '#1d1840'),
        (0, 28, 64, 8, '#2b2550'),
    ]
    rects += [(x, y, 1, 1, '#ffffff') for (x, y) in LAUNCH_STARS]
    rects += [
        (52, 5, 4, 4, '#ffe9a8'),     # moon
        (0, 28, 64, 8, '#14102a'),    # road
        (0, 28, 64, 1, '#6c5eb5'),    # kerb line
    ]
    rects += [(x + dx, y + dy, w, h, c) for (x, y, w, h, c) in CAR]
    return rects


def hex_to_rgb(colour):
    colour = colour.lstrip('#')
    return bytes(int(colour[i:i + 2], 16) for i in (0, 2, 4))


def fill_grid(rects, cols, rows):
    """Paint rectangles in order into a cols x rows grid of RGB bytes (later ones win)."""
    grid = [[hex_to_rgb(BLACK)] * cols for _ in range(rows)]
    for x, y, w, h, colour in rects:
        if x < 0 or y < 0 or x + w > cols or y + h > rows:
            raise ValueError('rectangle %r is outside the %dx%d grid' % ((x, y, w, h, colour), cols, rows))
        rgb = hex_to_rgb(colour)
        for gy in range(y, y + h):
            for gx in range(x, x + w):
                grid[gy][gx] = rgb
    return grid


def rasterise_rows(grid, scale):
    """Expand each cell into scale x scale pixels; yields one PNG filter-0 row per pixel row."""
    for cell_row in grid:
        scaled = b''.join(cell * scale for cell in cell_row)
        for _ in range(scale):
            yield b'\x00' + scaled


def png_chunk(kind, data):
    return (struct.pack('>I', len(data)) + kind + data
            + struct.pack('>I', zlib.crc32(kind + data) & 0xFFFFFFFF))


def encode_png(width, height, rows):
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)  # 8-bit RGB, colour type 2
    idat = zlib.compress(b''.join(rows), 9)
    return (b'\x89PNG\r\n\x1a\n'
            + png_chunk(b'IHDR', ihdr)
            + png_chunk(b'IDAT', idat)
            + png_chunk(b'IEND', b''))


def icon_svg_text():
    rects = icon_rects()
    lines = ['<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 32 32" '
             'shape-rendering="crispEdges">']
    for x, y, w, h, colour in rects:
        lines.append('<rect x="%d" y="%d" width="%d" height="%d" fill="%s"/>' % (x, y, w, h, colour))
    lines.append('</svg>')
    return '\n'.join(lines) + '\n'


def build_outputs():
    icon_text = icon_svg_text()  # the icon is written as SVG rectangles, not rasterised
    launch_grid = fill_grid(launch_rects(), LAUNCH_W, LAUNCH_H)
    launch_png = encode_png(LAUNCH_W * LAUNCH_SCALE, LAUNCH_H * LAUNCH_SCALE,
                            rasterise_rows(launch_grid, LAUNCH_SCALE))
    return icon_text, launch_png


def read_png_chunks(data):
    """Return [(kind, payload)] after checking the signature and every chunk CRC."""
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError('not a PNG file')
    chunks = []
    pos = 8
    while pos < len(data):
        length, = struct.unpack('>I', data[pos:pos + 4])
        kind = data[pos + 4:pos + 8]
        payload = data[pos + 8:pos + 8 + length]
        crc, = struct.unpack('>I', data[pos + 8 + length:pos + 12 + length])
        if zlib.crc32(kind + payload) & 0xFFFFFFFF != crc:
            raise ValueError('bad CRC in %r chunk' % kind)
        chunks.append((kind, payload))
        pos += 12 + length
    return chunks


def check_launch():
    with open(LAUNCH_PATH, 'rb') as f:
        data = f.read()
    chunks = read_png_chunks(data)
    kinds = [kind for kind, _ in chunks]
    if kinds[0] != b'IHDR' or kinds[-1] != b'IEND' or b'IDAT' not in kinds:
        raise ValueError('PNG chunk layout is wrong: %r' % kinds)
    width, height, depth, colour_type, _, _, _ = struct.unpack('>IIBBBBB', chunks[0][1])
    if (width, height) != (LAUNCH_W * LAUNCH_SCALE, LAUNCH_H * LAUNCH_SCALE):
        raise ValueError('launch image is %dx%d' % (width, height))
    if (depth, colour_type) != (8, 2):
        raise ValueError('launch image is not 8-bit RGB')
    raw = zlib.decompress(b''.join(payload for kind, payload in chunks if kind == b'IDAT'))
    if len(raw) != height * (1 + width * 3):
        raise ValueError('launch image pixel data has the wrong length')
    print('LAUNCH OK %dx%d' % (width, height))


def check_icon():
    tree = ET.parse(ICON_PATH)
    root = tree.getroot()
    if root.get('viewBox') != '0 0 32 32':
        raise ValueError('icon viewBox is %r' % root.get('viewBox'))
    rect_count = len(root.findall('{http://www.w3.org/2000/svg}rect'))
    print('ICON OK rects=%d' % rect_count)


def main(argv):
    if '--check' in argv:
        check_launch()
        check_icon()
        return 0
    icon_text, launch_png = build_outputs()
    os.makedirs(os.path.dirname(LAUNCH_PATH), exist_ok=True)
    with open(ICON_PATH, 'w', encoding='ascii', newline='\n') as f:
        f.write(icon_text)
    with open(LAUNCH_PATH, 'wb') as f:
        f.write(launch_png)
    print('WROTE godot/icon.svg godot/art/launch.png')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
