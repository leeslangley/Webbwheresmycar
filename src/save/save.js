// Save and load (DESIGN.md 9.3). Turns a game state into a string and back,
// and stores it on a caller-supplied storage object (the UI passes in the
// browser's own key-value store). This module stays pure: the storage object
// is passed in, so nothing here touches the DOM or the global scope.
// Every loader path returns null instead of throwing on bad data.

export const SAVE_KEY = 'webb_save_v1';

// Keys a parsed save must have to be trusted (DESIGN.md 9.3). Extra keys are
// tolerated; missing ones are not.
const REQUIRED_KEYS = [
	'day', 'cash', 'reputation', 'buzz', 'garageSlots', 'cars', 'shop',
	'requests', 'auction', 'stats', 'plates', 'flags', 'rng',
];

export function serialize(state) {
	return JSON.stringify(state);
}

export function deserialize(str) {
	if (typeof str !== 'string') {
		return null;
	}
	let state;
	try {
		state = JSON.parse(str);
	} catch (e) {
		return null;
	}
	if (state === null || typeof state !== 'object' || Array.isArray(state)) {
		return null;
	}
	if (state.v !== 1) {
		return null;
	}
	for (let i = 0; i < REQUIRED_KEYS.length; i++) {
		if (!Object.prototype.hasOwnProperty.call(state, REQUIRED_KEYS[i])) {
			return null;
		}
	}
	if (!Array.isArray(state.cars)) {
		return null;
	}
	return state;
}

export function saveTo(storage, state) {
	try {
		storage.setItem(SAVE_KEY, serialize(state));
		return true;
	} catch (e) {
		return false;
	}
}

export function loadFrom(storage) {
	try {
		return deserialize(storage.getItem(SAVE_KEY));
	} catch (e) {
		return null;
	}
}

export function clearSave(storage) {
	try {
		storage.removeItem(SAVE_KEY);
		return true;
	} catch (e) {
		return false;
	}
}
