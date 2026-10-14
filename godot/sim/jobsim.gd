class_name SimJobSim
extends RefCounted

# Port of src/sim/jobsim.js (DESIGN.md sections 4.7 and 9.3): daily customer booking requests.
# expire_requests drops the requests whose time is up; generate_requests rolls today's requests.
# Pure: randomness only through state.rng (CoreRng), no node access, no dates.

# Maximum number of requests the board holds at once (DESIGN.md 4.7).
const MAX_REQUESTS := 6

# Balance v1 (DESIGN.md section 10, card B01): fees 40% fatter, requirements one point easier.
const FEE_MULT := 1.4
const EASE_DESIRABILITY := 1
const EASE_RELIABILITY := 1


# Remove requests whose time on the board is up: anything with expiresDay < day goes; one expiring
# today still shows. Returns the number removed.
static func expire_requests(state: Dictionary) -> int:
	var removed := 0
	var kept: Array = []
	for req in state["requests"]:
		if req["expiresDay"] < state["day"]:
			removed += 1
		else:
			kept.append(req)
	state["requests"] = kept
	return removed


# Roll up today's booking requests against the expected count
# (0.20 + 0.006*reputation + 0.015*buzz): floor(expected) for certain plus one more with probability
# of the fractional part. The board caps at MAX_REQUESTS, so later draws are dropped.
# Returns the number of requests added.
static func generate_requests(state: Dictionary) -> int:
	var expected: float = 0.20 + 0.006 * state["reputation"] + 0.015 * state["buzz"]
	var whole: int = floori(expected)
	var n: int = whole
	if CoreRng.chance(state, expected - whole):
		n += 1
	var added := 0
	for _i in range(n):
		if state["requests"].size() >= MAX_REQUESTS:
			break
		var job: Dictionary = CoreRng.pick(state, SimData.job_types())
		var customer: String = SimData.customer_name(state)
		var fee: int = SimUtil.jround((job["feeMin"] + CoreRng.rand(state) * (job["feeMax"] - job["feeMin"])) * (0.85 + 0.30 * state["reputation"] / 100.0) * FEE_MULT)
		var id: String = "Q" + str(state["nextId"])
		state["nextId"] = int(state["nextId"]) + 1
		var expires_day: int = int(state["day"]) + CoreRng.rand_int(state, 4, 9)
		var blurb: String = SimData.fill_text(str(CoreRng.pick(state, job["blurbs"])), {"customer": customer})
		state["requests"].append({
			"id": id,
			"jobTypeId": job["id"],
			"customer": customer,
			"fee": fee,
			"minDesirability": maxi(0, int(job["minD"]) - EASE_DESIRABILITY),
			"minReliability": maxi(0, int(job["minR"]) - EASE_RELIABILITY),
			"minCondition": job["minCond"],
			"expiresDay": expires_day,
			"blurb": blurb,
		})
		added += 1
	return added
