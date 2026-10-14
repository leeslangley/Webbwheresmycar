#!/usr/bin/env python3
"""Planner tooling: turn card specs (a python file defining CARDS) into cards/<id>-<slug>.md and update cards/index.json.
usage: python3 tools/cards/newcard.py tools/cards/<specs>.py"""
import importlib.util, json, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MODEL = "DeepSeek-V4.1-Flash"

HEADER = """[Project: Webbwheresmycar]
# Task: [GLM-SPARK] {model} {id} {title}

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: {id}
Needs (already merged into `dev`): {needs}
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK ({model} via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

"""

RULES = """## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `{id}: {title}`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
"""

ACC = "`make test` last line starts with `ALL TESTS PASS`."


def bullets(items, num=False):
    return "\n".join(("%d. " % i if num else "- ") + x for i, x in enumerate(items, 1))


def render(c):
    out = HEADER.format(model=MODEL, id=c["id"], title=c["title"], needs=", ".join(c["needs"]) or "none")
    out += "## Goal\n%s\n\n## Read first\n%s\n\n" % (c["goal"], bullets(c["read"]))
    out += "## Files you may change (and nothing else)\n%s\n\n" % bullets(["`%s`" % f for f in c["files"]])
    out += "## Steps\n%s\n\n" % bullets(c["steps"], True)
    out += "## Acceptance (all must pass; exact commands)\n%s\n\n" % bullets(c["accept"] + [ACC])
    out += "## Out of scope (do not touch)\n%s\n\n" % bullets(c.get("oos", ["Everything not listed under files."]))
    out += RULES.format(id=c["id"], title=c["title"])
    return out


def main():
    spec = importlib.util.spec_from_file_location("specs", sys.argv[1])
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    idxp = os.path.join(ROOT, "cards", "index.json")
    idx = json.load(open(idxp))
    for c in mod.CARDS:
        slug = re.sub(r"[^a-z0-9]+", "-", c["title"].lower()).strip("-")[:40]
        fn = "%s-%s.md" % (c["id"], slug)
        open(os.path.join(ROOT, "cards", fn), "w").write(render(c))
        idx = [e for e in idx if e["id"] != c["id"]]
        idx.append(dict(id=c["id"], title=c["title"], needs=c["needs"], file=fn, files=c["files"]))
        print("wrote", fn)
    json.dump(idx, open(idxp, "w"), indent=1)


main()
