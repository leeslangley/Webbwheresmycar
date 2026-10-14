class_name AdvertsMath
extends RefCounted

# Port of the numbers in src/ui/scenes/adverts.js (expectedBuzz, flopChance, bestBuzz) and the result text
# built from the src/sim/adsim.js outcome. Static only: no state, no nodes.


# Expected buzz for a medium: sum(w * buzz) / 100 (the weights sum to 100).
static func expected_buzz(medium: Dictionary) -> float:
	var sum := 0.0
	for o in medium.get("outcomes", []):
		sum += float(o.w) * float(o.buzz)
	return sum / 100.0


# Flop chance in percent: the weight of every outcome that gains almost nothing (buzz <= 5).
static func flop_chance(medium: Dictionary) -> int:
	var total := 0
	for o in medium.get("outcomes", []):
		if float(o.buzz) <= 5.0:
			total += int(o.w)
	return total


# Best case: the biggest buzz any outcome can give (0 when there are none).
static func best_buzz(medium: Dictionary) -> int:
	var best := 0
	for o in medium.get("outcomes", []):
		best = maxi(best, int(o.buzz))
	return best


# PAYS stars: JS Math.round(expectedBuzz / 10).
static func pays(medium: Dictionary) -> int:
	return int(floor(expected_buzz(medium) / 10.0 + 0.5))


# Lines for the result panel after a successful advert: the wrapped message, then the non-zero stat changes.
static func result_lines(res: Dictionary) -> Array[String]:
	var lines: Array[String] = UiText.wrap(str(res.get("msg", "")), 29, 5)
	var outcome: Dictionary = res.get("outcome", {})
	var buzz := int(outcome.get("buzz", 0))
	var rep := int(outcome.get("rep", 0))
	if buzz != 0:
		lines.append("Buzz " + _signed(buzz))
	if rep != 0:
		lines.append("Reputation " + _signed(rep))
	if buzz == 0 and rep == 0:
		lines.append("Nothing much changed.")
	return lines


static func _signed(n: int) -> String:
	return ("+" if n > 0 else "-") + str(absi(n))
