# GC01 check: render a toon sphere with tools/art/charlib.py and test the bands.
# Run inside Blender through tests/run_charlib.sh. Not part of `make test`.
# Prints `CHARLIB OK opaque=<n> ratio=<x.xx>` or `CHARLIB FAIL <reason>` and exits 2
# on failure.
import os
import sys

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), 'tools', 'art'))

import charlib  # noqa: E402

OUT = '/tmp/charlib_t.png'
HEX = '#243a66'
W = 64
H = 64


def fail(reason):
    print('CHARLIB FAIL %s' % reason)
    sys.exit(2)


def srgb_hex_to_linear(hexstr):
    # Independent of charlib.lin so a broken conversion there cannot hide.
    s = hexstr.lstrip('#')
    out = []
    for j in (0, 2, 4):
        c = int(s[j:j + 2], 16) / 255.0
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return out


def main():
    scene = charlib.clear_scene()
    mat = charlib.toon_mat('t', HEX)
    charlib.sphere((0.0, 0.0, 0.0), (1.0, 1.0, 1.0), mat, 't_sphere')
    charlib.setup_char_scene(scene, 'front', (0.0, 0.0), 2.4, W, H)
    if os.path.exists(OUT):
        os.remove(OUT)
    charlib.render_png(scene, OUT)
    if not os.path.isfile(OUT):
        fail('render did not write %s' % OUT)

    img = bpy.data.images.load(OUT)
    img.colorspace_settings.name = 'Non-Color'
    w, h = img.size
    if (w, h) != (W, H):
        fail('render is %dx%d, expected %dx%d' % (w, h, W, H))
    flat = list(img.pixels[:])
    # Blender stores rows bottom-first; flip so row 0 is the top of the image.
    rows = [flat[y * w * 4:(y + 1) * w * 4] for y in range(h)][::-1]
    pix = []
    for row in rows:
        for x in range(w):
            i = x * 4
            pix.append((row[i], row[i + 1], row[i + 2], row[i + 3]))

    def idx(x, y):
        return y * w + x

    opaque = [p for p in pix if p[3] > 0.99]
    n = len(opaque)
    if not (1800 <= n <= 2300):
        fail('opaque pixel count %d, expected 1800..2300' % n)

    # Band colours: byte(lin(hex) * k) per channel, within +-4 on >= 8% of opaque.
    base = srgb_hex_to_linear(HEX)
    bytes_ = [tuple(int(round(v * 255)) for v in p[:3]) for p in opaque]
    for k in (0.58, 0.86, 1.06):
        want = tuple(charlib.byte(c * k) for c in base)
        hits = 0
        for b in bytes_:
            if all(abs(b[j] - want[j]) <= 4 for j in range(3)):
                hits += 1
        frac = hits / float(n)
        if frac < 0.08:
            fail('band k=%.2f colour %s found on %.1f%% of opaque pixels (need 8%%)'
                 % (k, want, 100.0 * frac))

    # Upper-left quarter must be brighter than lower-right (key light upper left).
    def lum_of(x0, y0):
        total = 0.0
        count = 0
        for y in range(y0, y0 + 32):
            for x in range(x0, x0 + 32):
                p = pix[idx(x, y)]
                total += 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]
                count += 1
        return total / count

    ul = lum_of(0, 0)
    lr = lum_of(32, 32)
    if lr <= 0.0:
        fail('lower-right quarter has zero luminance')
    ratio = ul / lr
    if ratio < 1.15:
        fail('upper-left/lower-right luminance ratio %.2f (need 1.15)' % ratio)

    print('CHARLIB OK opaque=%d ratio=%.2f' % (n, ratio))


if __name__ == '__main__':
    main()
