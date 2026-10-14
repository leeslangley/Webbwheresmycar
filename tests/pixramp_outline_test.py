"""Blender-python tests for add_outlines() in tools/art/pixramp.py (card CB14).

    /opt/homebrew/bin/blender --background --python-exit-code 1 --python tests/pixramp_outline_test.py 2>&1 | tail -1

Plain asserts: an uncaught exception makes Blender exit 1. Prints PIXRAMP OUTLINE OK last.
"""

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), 'tools', 'art'))
sys.path.insert(0, os.path.join(os.getcwd(), 'tools', 'art'))

import numpy as np  # noqa: E402
import pixramp as p  # noqa: E402

PAINT = '#C96F32'
PAINT_RGB = np.array([0.30, 0.20, 0.10], dtype=np.float64)
CHROME_RGB = np.array([0.80, 0.82, 0.90], dtype=np.float64)
GLASS_RGB = np.array([0.05, 0.10, 0.15], dtype=np.float64)
OUT_LIN = p.srgb_to_linear(p.hex_rgb(p.OUTLINE))
PAINT_FIRST = p.paint_ramp(PAINT)[0]
GLASS_FIRST = p.fixed_ramp('glass')[0]
N = 12        # sprite size
LAMP = 5      # class given to transparent cells, so a leak of the mask shows

# Original-grid regions (sprite coordinates, inclusive ranges as slices).
PAINT_BLOCK = (slice(2, 10), slice(2, 10))
CHROME_BLOCK = (slice(4, 7), slice(4, 7))
GLASS_STRIP = (slice(3, 5), slice(7, 10))


def build_sprite():
    cls = np.full((N, N), LAMP, dtype=np.int64)
    idx = np.full((N, N), -1, dtype=np.int64)
    opq = np.zeros((N, N), dtype=bool)
    rgb = np.zeros((N, N, 3), dtype=np.float64)
    opq[PAINT_BLOCK] = True
    cls[PAINT_BLOCK] = 0
    idx[PAINT_BLOCK] = 4
    rgb[PAINT_BLOCK] = PAINT_RGB
    cls[CHROME_BLOCK] = 1
    idx[CHROME_BLOCK] = -1          # quantise() gives -1 off paint
    rgb[CHROME_BLOCK] = CHROME_RGB
    cls[GLASS_STRIP] = 2
    idx[GLASS_STRIP] = -1
    rgb[GLASS_STRIP] = GLASS_RGB
    return rgb, cls, idx, opq


def check_ring(rgb2, alpha2, cls2, idx2):
    """Padded block is rows/cols 3..10; the 1 px ring around it is outline."""
    for r in range(N + 2):
        for c in range(N + 2):
            in_block = 3 <= r <= 10 and 3 <= c <= 10
            on_edge = (r in (2, 11) and 3 <= c <= 10) or (c in (2, 11) and 3 <= r <= 10)
            if on_edge:
                assert alpha2[r, c] == 1.0, (r, c, alpha2[r, c])
                assert np.allclose(rgb2[r, c], OUT_LIN), (r, c, rgb2[r, c])
                assert cls2[r, c] == -1 and idx2[r, c] == -1, (r, c)
            elif not in_block:
                assert alpha2[r, c] == 0.0, (r, c, alpha2[r, c])
                assert cls2[r, c] == -1 and idx2[r, c] == -1, (r, c)


def oracle(rgb, cls, idx, opq):
    """Independent per-pixel reference for the same rules (one loop, no arrays)."""
    h, w = opq.shape
    exp = {}
    for y in range(h):
        for x in range(w):
            if not opq[y, x]:
                continue
            k = int(cls[y, x])
            colour = rgb[y, x]
            i2 = int(idx[y, x])
            for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and opq[ny, nx] and int(cls[ny, nx]) != k:
                    if k == 0:
                        colour, i2 = PAINT_FIRST, 0
                    elif k == 2 or k == 4:
                        colour = GLASS_FIRST
                    break
            exp[(y + 1, x + 1)] = (colour, i2, k)
    return exp


def main():
    rgb, cls, idx, opq = build_sprite()
    rgb2, alpha2, cls2, idx2 = p.add_outlines(rgb, cls, idx, opq, PAINT)

    # Shapes: 14 x 14 with 1 px of padding on every side.
    assert rgb2.shape == (N + 2, N + 2, 3), rgb2.shape
    assert alpha2.shape == (N + 2, N + 2)
    assert cls2.shape == (N + 2, N + 2) and idx2.shape == (N + 2, N + 2)

    # Silhouette ring, and alpha 0 everywhere beyond it.
    check_ring(rgb2, alpha2, cls2, idx2)

    # Paint directly beside the chrome block: first paint step, idx 0, class 0.
    beside = [(3, 4), (3, 5), (3, 6), (7, 4), (7, 5), (7, 6),
              (4, 3), (5, 3), (6, 3), (5, 7), (6, 7)]
    for y, x in beside:
        r, c = y + 1, x + 1
        assert np.allclose(rgb2[r, c], PAINT_FIRST), (y, x, rgb2[r, c])
        assert idx2[r, c] == 0 and cls2[r, c] == 0, (y, x)

    # Chrome pixels are never changed: input colour, idx -1, class 1.
    for y in range(4, 7):
        for x in range(4, 7):
            r, c = y + 1, x + 1
            assert np.allclose(rgb2[r, c], CHROME_RGB), (y, x)
            assert idx2[r, c] == -1 and cls2[r, c] == 1, (y, x)

    # Plain paint (no different-class opaque neighbour) is unchanged, idx 4, class 0.
    plain = [(8, 2), (2, 5), (9, 9), (3, 3), (7, 7)]
    for y, x in plain:
        r, c = y + 1, x + 1
        assert np.allclose(rgb2[r, c], PAINT_RGB), (y, x)
        assert idx2[r, c] == 4 and cls2[r, c] == 0, (y, x)

    # Glass touching paint (every glass cell here does): first glass colour.
    for y in range(3, 5):
        for x in range(7, 10):
            r, c = y + 1, x + 1
            assert np.allclose(rgb2[r, c], GLASS_FIRST), (y, x)
            assert cls2[r, c] == 2, (y, x)

    # Full sweep against the per-pixel oracle, over every opaque cell.
    exp = oracle(rgb, cls, idx, opq)
    for (r, c), (colour, i2, k) in exp.items():
        assert np.allclose(rgb2[r, c], colour), (r, c)
        assert idx2[r, c] == i2 and cls2[r, c] == k, (r, c)
    assert len(exp) == int(opq.sum())

    # paint2 with its own colour: a paint2 cell beside paint takes color2's first step.
    cls_b = cls.copy()
    cls_b[2:4, 2:4] = 8
    color2 = '#2f5d8a'
    rgb_b, alpha_b, cls2_b, idx2_b = p.add_outlines(rgb, cls_b, idx, opq, PAINT, color2)
    # Original (3, 3) is paint2 beside paint at (4, 3): inner line in color2.
    assert np.allclose(rgb_b[4, 4], p.paint_ramp(color2)[0]), rgb_b[4, 4]
    assert idx2_b[4, 4] == 0 and cls2_b[4, 4] == 8
    # Original (2, 2) is paint2 with only paint2 or transparent neighbours: unchanged.
    assert np.allclose(rgb_b[3, 3], PAINT_RGB) and idx2_b[3, 3] == 4
    assert cls2_b[3, 3] == 8
    # Original (8, 8) is plain paint: unchanged.
    assert np.allclose(rgb_b[9, 9], PAINT_RGB) and idx2_b[9, 9] == 4

    # Bad shapes are refused.
    try:
        p.add_outlines(rgb, cls[:, :5], idx, opq, PAINT)
        raise AssertionError('shape mismatch was not refused')
    except ValueError:
        pass

    # Ring cells: 4 edges of 8, corners stay transparent (checked in check_ring).
    ring_cells = int(((alpha2 == 1.0) & (~np.pad(opq, 1))).sum())
    assert ring_cells == 32, ring_cells
    print('PIXRAMP OUTLINE OK')
    # Blender prints its own "Blender quit" banner after the script ends, which
    # would push PIXRAMP OUTLINE OK off the last line. Flush, then exit at once so it
    # stays last. Failures never reach this point: they raise and Blender exits 1.
    sys.stdout.flush()
    os._exit(0)


main()
