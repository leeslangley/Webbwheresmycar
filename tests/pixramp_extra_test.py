"""Blender-python tests for pixramp shadow_levels, find_lamps, game_mask (card CB17).

    /opt/homebrew/bin/blender --background --python-exit-code 1 --python tests/pixramp_extra_test.py 2>&1 | tail -1

Plain asserts: an uncaught exception makes Blender exit 1. Prints PIXRAMP EXTRA OK last.
"""

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), 'tools', 'art'))
sys.path.insert(0, os.path.join(os.getcwd(), 'tools', 'art'))

import numpy as np  # noqa: E402
import pixramp as p  # noqa: E402


def check_shadow_levels():
    alpha = np.zeros((2, 10), dtype=np.float64)
    alpha[0] = [0.9, 0.5, 0.2, 0.05, 0.0, 0.76, 0.75, 0.35, 0.08, 0.081]
    out = p.shadow_levels(alpha)
    assert out.dtype == np.uint8
    assert out.shape == (2, 10)
    assert out[0].tolist() == [150, 90, 40, 0, 0, 150, 90, 40, 0, 40]
    assert out[1].tolist() == [0] * 10


def check_find_lamps():
    paint = p.CLASS_NAMES.index('paint')
    cls = np.full((10, 10), paint, dtype=np.int64)
    opaque = np.ones((10, 10), dtype=bool)
    cls[2:4, 7:9] = p.LAMP_CLASS          # 2x2 headlamp block
    cls[5, 1] = p.TAIL_CLASS              # single tail pixel: skipped
    cls[8, 1:4] = p.TAIL_CLASS            # 3-pixel tail line
    lamps = p.find_lamps(cls, opaque)
    assert lamps == [
        {'x': 8.0, 'y': 3.0, 'r': 1.0, 'kind': 'head'},
        {'x': 2.5, 'y': 8.5, 'r': 1.0, 'kind': 'tail'},
    ], lamps
    # Transparent pixels never count as lamps.
    hidden = p.find_lamps(cls, np.zeros((10, 10), dtype=bool))
    assert hidden == []


def check_game_mask():
    cls2 = np.array([[-1, 0, 8], [1, 2, 5]], dtype=np.int64)
    idx2 = np.array([[-1, 3, 5], [0, 0, 0]], dtype=np.int64)
    out = p.game_mask(cls2, idx2)
    assert out.dtype == np.uint8
    assert out.shape == (2, 3, 4)
    expect = [
        [(0, 0, 0, 0), (1, 3, 0, 255), (2, 5, 0, 255)],
        [(3, 0, 0, 255), (4, 0, 0, 255), (0, 0, 0, 0)],
    ]
    for y in range(2):
        for x in range(3):
            assert tuple(int(v) for v in out[y, x]) == expect[y][x], (y, x, out[y, x])


def main():
    check_shadow_levels()
    check_find_lamps()
    check_game_mask()
    print('PIXRAMP EXTRA OK')
    # Blender prints its own "Blender quit" banner after the script ends, which
    # would push PIXRAMP EXTRA OK off the last line. Flush, then exit at once so it
    # stays last. Failures never reach this point: they raise and Blender exits 1.
    sys.stdout.flush()
    os._exit(0)


main()
