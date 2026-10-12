"""App icons for "Webb, where's my car?" (card W71a).

Writes the three PNG icons the web app manifest and iOS "Add to Home Screen" use:

    assets/icons/icon-192.png          192x192
    assets/icons/icon-512.png          512x512
    assets/icons/apple-touch-icon.png   180x180

Each icon is dark blue (#14102A) with a gold (#E8B923) number plate in the lower
half and a simple red car silhouette above it (section 1 of docs/DESIGN.md). The art
is drawn from filled rectangles and circles, so the only imports needed are `zlib`
and `struct`: python 3.9, standard library only.

    python3 tools/make_icons.py
"""

import os
import struct
import zlib

# Colours (see docs/DESIGN.md section 1: dark blue field, gold number plate).
BACKGROUND = (0x14, 0x10, 0x2A)
PLATE = (0xE8, 0xB9, 0x23)
PLATE_BORDER = (0x0B, 0x08, 0x18)
PLATE_INK = (0x14, 0x10, 0x2A)
CAR = (0xC0, 0x39, 0x2B)
CAR_DARK = (0x0B, 0x08, 0x18)

# Icon sizes: (file name, width, height).
ICONS = [
    ("icon-192.png", 192, 192),
    ("icon-512.png", 512, 512),
    ("apple-touch-icon.png", 180, 180),
]

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                       "assets", "icons")


def blank(width, height, colour):
    """An RGB canvas of one flat colour."""
    return bytearray(bytes(colour) * (width * height))


def fill_rect(buf, width, height, x0, y0, x1, y1, colour):
    """Fill the rectangle x0..x1 by y0..y1 (both ends inclusive), clipped to the canvas."""
    x0 = max(0, int(x0))
    y0 = max(0, int(y0))
    x1 = min(width - 1, int(x1))
    y1 = min(height - 1, int(y1))
    px = bytes(colour) * max(0, x1 - x0 + 1)
    for y in range(y0, y1 + 1):
        start = (y * width + x0) * 3
        buf[start:start + len(px)] = px


def fill_circle(buf, width, height, cx, cy, radius, colour):
    """Fill a solid circle centred on (cx, cy), clipped to the canvas."""
    r = int(radius)
    r2 = r * r
    for dy in range(-r, r + 1):
        y = int(cy) + dy
        if y < 0 or y >= height:
            continue
        span = int((r2 - dy * dy) ** 0.5) if r2 >= dy * dy else 0
        if span == 0:
            continue
        x0 = max(0, int(cx) - span)
        x1 = min(width - 1, int(cx) + span)
        px = bytes(colour) * max(0, x1 - x0 + 1)
        start = (y * width + x0) * 3
        buf[start:start + len(px)] = px


def draw_icon(width, height):
    """Dark blue field, gold plate, red car silhouette above the plate."""
    buf = blank(width, height, BACKGROUND)

    # Number plate: about 70% of the width and 28% of the height, centred.
    plate_w = 0.70 * width
    plate_h = 0.28 * height
    plate_x0 = (width - plate_w) / 2.0
    plate_y0 = 0.60 * height
    plate_x1 = plate_x0 + plate_w
    plate_y1 = plate_y0 + plate_h

    border = max(1, round(0.028 * width))
    fill_rect(buf, width, height, plate_x0 - border, plate_y0 - border,
              plate_x1 + border, plate_y1 + border, PLATE_BORDER)
    fill_rect(buf, width, height, plate_x0, plate_y0, plate_x1, plate_y1, PLATE)
    # Two dark stripes across the plate so it reads as a plate at icon size.
    stripe = max(1, round(0.05 * plate_h))
    fill_rect(buf, width, height, plate_x0, plate_y0 + plate_h * 0.18,
              plate_x1, plate_y0 + plate_h * 0.18 + stripe, PLATE_INK)
    fill_rect(buf, width, height, plate_x0, plate_y1 - plate_h * 0.18 - stripe,
              plate_x1, plate_y1 - plate_h * 0.18, PLATE_INK)

    # Car silhouette above the plate: bonnet/cabin body plus two wheels.
    body_x0 = 0.20 * width
    body_x1 = 0.80 * width
    body_h = 0.13 * height
    body_y1 = plate_y0 - border  # rest the body on top of the plate border
    body_y0 = body_y1 - body_h
    fill_rect(buf, width, height, body_x0, body_y0, body_x1, body_y1, CAR)

    cabin_x0 = 0.36 * width
    cabin_x1 = 0.64 * width
    cabin_h = 0.10 * height
    cabin_y1 = body_y0
    cabin_y0 = cabin_y1 - cabin_h
    fill_rect(buf, width, height, cabin_x0, cabin_y0, cabin_x1, cabin_y1, CAR)

    wheel_r = 0.045 * width
    for cx in (0.28 * width, 0.72 * width):
        fill_circle(buf, width, height, cx, body_y1, wheel_r, CAR_DARK)

    return buf


def write_png(path, width, height, buf):
    """Write a truecolour 8-bit PNG: IHDR, one IDAT, IEND, filter type 0 per row."""
    raw = bytearray()
    stride = width * 3
    for y in range(height):
        raw.append(0)
        raw += buf[y * stride:(y + 1) * stride]

    def chunk(tag, data):
        return (struct.pack(">I", len(data)) + tag + data
                + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr)
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as fh:
        fh.write(png)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for name, width, height in ICONS:
        path = os.path.join(OUT_DIR, name)
        write_png(path, width, height, draw_icon(width, height))
        print("wrote %s (%dx%d)" % (path, width, height))


if __name__ == "__main__":
    main()
