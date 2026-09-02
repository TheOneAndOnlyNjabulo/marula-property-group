"""
Evaluation set: 10 sample tickets spanning most trade categories and all three
priority tiers, with expected final category/priority cross-checked against the
actual docs/ text (grep'd, not recalled from memory) - a failure here means the
triage chain is wrong, not the eval data.

expected_category / expected_priority are scored against the chain's FINAL output
(after any Auditor-driven revision), not the Triage Agent's first pass - the whole
point of the two-agent design is that the first pass doesn't have to be perfect,
so grading the first pass would be grading the wrong thing.

Case 7 (bee swarm) is a deliberate regression case: it's the exact ticket that
tripped up the Triage Agent's first pass during step 5 testing, caught and
corrected by the Policy Auditor. Kept here specifically to make sure that
correction keeps happening as the prompts evolve.
"""

from dataclasses import dataclass


@dataclass
class EvalCase:
    ticket_text: str
    expected_category: str
    expected_priority: str


EVAL_SET: list[EvalCase] = [
    EvalCase(
        "There is a burst pipe flooding my bathroom right now, water everywhere!",
        "Plumbing",
        "Emergency",
    ),
    EvalCase(
        "My kitchen tap has been dripping constantly for the past two weeks, it's not urgent but it's annoying.",
        "Plumbing",
        "Routine",
    ),
    EvalCase(
        "There's no hot water in my unit since this morning. The geyser itself doesn't look like it's leaking.",
        "Plumbing",
        "Urgent",
    ),
    EvalCase(
        "I can smell burning and see sparks coming from the wall socket in my lounge.",
        "Electrical",
        "Emergency",
    ),
    EvalCase(
        "My entire unit has no power at all, but my neighbours' units seem to be fine.",
        "Electrical",
        "Urgent",
    ),
    EvalCase(
        "The plug socket in my guest room isn't working, but every other outlet in the unit is fine.",
        "Electrical",
        "Routine",
    ),
    EvalCase(
        "Someone is stuck in the lift on the third floor right now, please help!",
        "Elevator/Lift",
        "Emergency",
    ),
    EvalCase(
        "There's a big swarm of bees right at the main entrance of the building and people are too scared to "
        "walk past it.",
        "Pest Control",
        "Urgent",
    ),
    EvalCase(
        "The air conditioning in our fully-tenanted office has stopped cooling and it's the middle of a heatwave.",
        "HVAC",
        "Urgent",
    ),
    EvalCase(
        "The paint in the lobby is a bit scuffed near the entrance and could use touching up whenever you get a "
        "chance.",
        "Common Area/Grounds",
        "Routine",
    ),
]
