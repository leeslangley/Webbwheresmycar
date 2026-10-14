# CA03: the parts framework. Each detail kind lives in its own module in this
# package (a module whose name does not start with '_'). A module registers a
# builder for its kind with @register(kind), or a whole-car stage with
# @stage(name). build_all(ctx) runs them all inside Blender.
# This package is imported by blender_car2.py; nothing runs on import.
import importlib
import pkgutil
import sys

sys.dont_write_bytecode = True  # keep tools/art clean of __pycache__

BUILDERS = {}   # kind -> fn(part, ctx, i)
STAGES = {}     # name -> fn(ctx)

# Whole-car stages, run in this order when they are registered.
STAGE_ORDER = ('body', 'arches', 'windows', 'wheels', 'paint', 'cockpit', 'roof')

_loaded = False


def register(kind):
    """Decorator: BUILDERS[kind] = fn, where fn(part, ctx, i) builds one part."""
    def deco(fn):
        BUILDERS[kind] = fn
        return fn
    return deco


def stage(name):
    """Decorator: STAGES[name] = fn, where fn(ctx) builds one whole-car stage."""
    def deco(fn):
        STAGES[name] = fn
        return fn
    return deco


def load_all():
    """Import every module of this package whose name does not start with '_'.
    A failing import prints a WARN line and the rest still load. Runs once."""
    global _loaded
    if _loaded:
        return
    _loaded = True
    for info in pkgutil.iter_modules(__path__):
        if info.name.startswith('_'):
            continue
        try:
            importlib.import_module(__name__ + '.' + info.name)
        except Exception as e:  # keep going: one broken kind must not stop a car
            print('WARN parts.%s: %s' % (info.name, e))


def run_car_module(ctx):
    """Hook for the per-car module (card CA20). Nothing to do yet."""
    return None


def build_all(ctx):
    """Build the whole car: the stages, then each part of ctx['details']['parts']
    with its kind's builder, then the per-car hook, then the 'finish' stage."""
    load_all()
    for name in STAGE_ORDER:
        if name in STAGES:
            STAGES[name](ctx)
    for i, part in enumerate(ctx['details'].get('parts') or []):
        kind = part.get('kind') if isinstance(part, dict) else None
        try:
            if kind not in BUILDERS:
                raise ValueError('no builder for kind %r' % (kind,))
            BUILDERS[kind](part, ctx, i)
        except Exception as e:  # one bad part must not stop the car
            print('WARN part %d %s: %s' % (i, kind, e))
    run_car_module(ctx)
    if 'finish' in STAGES:
        STAGES['finish'](ctx)
