"""Blender-python tests for pixramp.class_map (card CB12).

    /opt/homebrew/bin/blender --background --python-exit-code 1 --python tests/pixramp_class_test.py 2>&1 | tail -1

Plain asserts: an uncaught exception makes Blender exit 1. Prints PIXRAMP CLASS OK last.
"""

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), 'tools', 'art'))
sys.path.insert(0, os.path.join(os.getcwd(), 'tools', 'art'))

import numpy as np  # noqa: E402
import pixramp as p  # noqa: E402
import cbmat  # noqa: E402

PAINT = p.CLASS_NAMES.index('paint')
CHROME = p.CLASS_NAMES.index('chrome')
GLASS = p.CLASS_NAMES.index('glass')
TAIL = p.CLASS_NAMES.index('tail')
PAINT2 = p.CLASS_NAMES.index('paint2')


def blank(h, w):
    """Transparent (h, w, 4) mask, raw values 0..1."""
    return np.zeros((h, w, 4), dtype=np.float64)


def paint_block(mask, y0, x0, h, w, rgb255, alpha=1.0):
    mask[y0:y0 + h, x0:x0 + w, :3] = np.array(rgb255, dtype=np.float64) / 255.0
    mask[y0:y0 + h, x0:x0 + w, 3] = alpha


def check_tables():
    assert p.CLASS_NAMES == ['paint', 'chrome', 'glass', 'tyre', 'wall', 'lamp',
                             'trim', 'tail', 'paint2']
    assert set(p.MASK_FILE) == set(cbmat.MASK_RGB) == set(p.CLASS_NAMES)
    for k in p.CLASS_NAMES:
        want = tuple(v / 255 for v in cbmat.MASK_RGB[k])
        assert p.MASK_FILE[k] == want, (k, p.MASK_FILE[k], want)


def check_halves():
    # 40x40: left 20 columns paint, right 20 columns glass, all opaque.
    mask = blank(40, 40)
    paint_block(mask, 0, 0, 40, 20, (255, 0, 0))
    paint_block(mask, 0, 20, 40, 20, (0, 0, 255))
    cls, opaque = p.class_map(mask, 10, 10)
    assert cls.shape == (10, 10), cls.shape
    assert opaque.shape == (10, 10) and opaque.all()
    assert (cls[:, 0:5] == PAINT).all(), cls[:, 0:5]
    assert (cls[:, 5:10] == GLASS).all(), cls[:, 5:10]


def check_non_square():
    mask = blank(20, 40)
    paint_block(mask, 0, 0, 20, 40, (0, 255, 0))
    cls, opaque = p.class_map(mask, 10, 5)
    assert cls.shape == (5, 10), cls.shape
    assert (cls == CHROME).all() and opaque.all()


def fill_first(mask, n, rgb255, alpha=1.0):
    """Set the first n pixels (row by row) of the top-left 4x4 block."""
    for i in range(n):
        y, x = divmod(i, 4)
        mask[y, x, :3] = np.array(rgb255, dtype=np.float64) / 255.0
        mask[y, x, 3] = alpha


def check_majority():
    # 8x8 -> 2x2: the top-left 4x4 block holds 10 paint and 6 chrome pixels.
    mask = blank(8, 8)
    fill_first(mask, 10, (255, 0, 0))
    for i in range(10, 16):
        y, x = divmod(i, 4)
        mask[y, x, :3] = np.array((0, 255, 0)) / 255.0
        mask[y, x, 3] = 1.0
    cls, opaque = p.class_map(mask, 2, 2)
    assert cls[0, 0] == PAINT, cls
    assert opaque[0, 0]


def check_alpha_threshold():
    # Transparent 4x4 block: never opaque, whatever colour it holds.
    mask = blank(8, 8)
    paint_block(mask, 0, 0, 4, 4, (255, 0, 0), alpha=0.0)
    paint_block(mask, 0, 4, 4, 4, (0, 0, 255), alpha=1.0)
    cls, opaque = p.class_map(mask, 2, 2)
    assert not opaque[0, 0]
    assert opaque[0, 1] and cls[0, 1] == GLASS
    # Half coverage: 8 of 16 pixels opaque averages to alpha 0.5, which counts.
    mask = blank(8, 8)
    fill_first(mask, 8, (0, 0, 255))
    _, opaque = p.class_map(mask, 2, 2)
    assert opaque[0, 0]
    # 7 of 16 opaque averages to 0.4375, which does not.
    mask = blank(8, 8)
    fill_first(mask, 7, (0, 0, 255))
    _, opaque = p.class_map(mask, 2, 2)
    assert not opaque[0, 0]


def check_single_colours():
    # Pure tail black, opaque -> class 7.
    mask = blank(4, 4)
    paint_block(mask, 0, 0, 4, 4, (0, 0, 0))
    cls, opaque = p.class_map(mask, 1, 1)
    assert cls[0, 0] == TAIL and opaque[0, 0], cls
    # Dark red 128,0,0 is paint2, not paint.
    mask = blank(4, 4)
    paint_block(mask, 0, 0, 4, 4, (128, 0, 0))
    cls, _ = p.class_map(mask, 1, 1)
    assert cls[0, 0] == PAINT2, cls


def check_bad_shape():
    try:
        p.class_map(np.zeros((4, 4, 3)), 2, 2)
    except ValueError:
        return
    raise AssertionError('class_map accepted a (h, w, 3) array')


def main():
    check_tables()
    check_halves()
    check_non_square()
    check_majority()
    check_alpha_threshold()
    check_single_colours()
    check_bad_shape()
    print('PIXRAMP CLASS OK')
    # Blender prints its own "Blender quit" banner after the script ends, which
    # would push the result off the last line. Flush, then exit at once so it
    # stays last. Failures never reach this point: they raise and Blender exits 1.
    sys.stdout.flush()
    os._exit(0)


main()
