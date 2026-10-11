# Scene rules (read this instead of repeating it in every card)

A scene is an object `{id, enter(app,params), draw(ctx,app,t), pointer(app,type,x,y), key(app,key)}` exported as `<name>Scene` (DESIGN.md 9.5 and 9.7). Look at `src/ui/scenes/news.js`, `garage.js` and `tvshop.js`: copy their structure, imports and hit-list handling. Tests use `tests/fakectx.js` (`makeCtx`, `texts`), `tests/fakeapp.js` (`makeApp`) and `tests/harness.js`.

## TAP RULE (obey exactly, it was a real bug)
The screen is redrawn many times between a finger-down and its finger-up.
- The hit list (`this.hits = makeHits()`) is rebuilt at the START of every `draw`.
- NEVER reset the pressed state inside `draw`. Only `enter` and `'up'` reset it.
- On `'down'`: `const h = this.hits.hit(x, y); this.pressed = h ? h.id : null;` (remember the hit's ID, not the object).
- On `'up'`: `const e = this.hits.hit(x, y); if (e && this.pressed !== null && e.id === this.pressed && typeof e.onTap === 'function') e.onTap(e); this.pressed = null;`
- Tests must do `down`, then call `draw` again with a different `t`, then `up`.

## Sim actions
Actions that cost a day go through `app.act(() => fn(app.state, ...))`. Bids and reveals (no day) call the sim function directly and toast the returned `msg`. Never write to `app.state` from a scene.

## Text
Player-visible text is ASCII only. The pound sign comes only from `money()` in `src/core/format.js`. No real brands. Never he/she/him/her for customers or named people.

## Working rules for the worker
- Write your first complete version of the file within your first 10 turns, then run `make test`, then commit. Improve after that.
- Scratch files go in /tmp, never in the repo. Do not explore beyond the files the card names.
