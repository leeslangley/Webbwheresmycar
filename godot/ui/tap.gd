class_name UiTap
extends RefCounted

# The tap rule shared by every widget: remember the control pressed on press, and activate
# only on a release over that SAME control (port of the pressed-id logic in src/ui/kit_hits.js).

var pressed_id: String = ""


func press(id: String) -> void:
	pressed_id = id


# True when id is the control that was pressed. Always clears the pressed state.
func release(id: String) -> bool:
	var hit := pressed_id != "" and id == pressed_id
	pressed_id = ""
	return hit


func cancel() -> void:
	pressed_id = ""


func is_down() -> bool:
	return pressed_id != ""
