CARDS = [
 dict(id="G01", title="Dossier game_name check and three name fixes", needs=["R00"],
  files=["tools/check_dossier.py", "tests/fixtures/dossier_ok.json", "tests/fixtures/dossier_bad.json", "tests/fixtures/dossier_taper.json", "tests/run_dossier_check.sh", "docs/cars/t1_maurice.json", "docs/cars/t1_cooker.json", "docs/cars/t1_volksbeagle.json"],
  goal="Three merged dossiers carry the fixture's game_name `Webb, wheres my car?` instead of the real game name. Fix them and make the checker reject that mistake so it cannot happen again.",
  read=["tools/check_dossier.py and tests/run_dossier_check.sh (the checker and its sh test)", "docs/CAR_DOSSIER_SPEC.md (game_name field)"],
  steps=[
   "In `docs/cars/` set `game_name` to `Maurice Minor` in `t1_maurice.json`, `Minnie Cooker` in `t1_cooker.json`, `Volksbeagle Bug` in `t1_volksbeagle.json`. Change nothing else in those files.",
   "In `tests/fixtures/dossier_ok.json`, `dossier_bad.json` and `dossier_taper.json` set `game_name` to `Test Car` (they currently have the fake game title).",
   "In `tools/check_dossier.py` add a check: `game_name` must be a non-empty ASCII string, must not contain the text `Webb` and must not equal the text `wheres my car`; the failure line is `DOSSIER FAIL <file>: game_name looks copied from the fixture`.",
   "In `tests/run_dossier_check.sh` add a case: copy `dossier_ok.json` to /tmp with `game_name` set to `Webb, wheres my car?` (use python3 -c to edit the JSON), require exit 1 and the text `game_name`; keep every existing case and the final `DOSSIER CHECKER OK` line."],
  accept=["`sh tests/run_dossier_check.sh` prints `DOSSIER CHECKER OK`.", "`for f in docs/cars/*.json; do python3 tools/check_dossier.py $f; done` prints DOSSIER OK for every file."]),
]
