class_name UiText
extends RefCounted

# Pure text helpers shared by banner, toasts and channels. Wrapping works on CHARACTER COUNTS
# (the game fonts are monospaced), so it is testable headless. No state, no nodes.


static func wrap(text: String, max_chars: int, max_lines: int = 0) -> Array[String]:
	var flat: String = text.replace("\n", " ")
	var lines: Array[String] = []
	var cur: String = ""
	for word in flat.split(" ", false):
		if cur == "":
			cur = word
		elif cur.length() + 1 + word.length() <= max_chars:
			cur += " " + word
		else:
			lines.append(cur)
			cur = word
	if cur != "":
		lines.append(cur)
	if max_lines > 0 and lines.size() > max_lines:
		var kept: Array[String] = []
		for i in range(max_lines):
			kept.append(lines[i])
		var last: String = kept[max_lines - 1]
		if last.length() + 3 > max_chars:
			last = last.substr(0, maxi(max_chars - 3, 0)) + "..."
		else:
			last = last + "..."
		kept[max_lines - 1] = last
		return kept
	return lines


static func ellipsize(text: String, max_chars: int) -> String:
	if text.length() <= max_chars:
		return text
	if max_chars <= 3:
		return text.substr(0, maxi(max_chars, 0))
	return text.substr(0, max_chars - 3) + "..."


static func pips(n: int, total: int = 10) -> String:
	var t: int = maxi(total, 0)
	var k: int = clampi(n, 0, t)
	return "*".repeat(k) + "-".repeat(t - k)


static func upper(text: String) -> String:
	return text.to_upper()


static func lines_height(count: int, pitch: int) -> int:
	return count * pitch
