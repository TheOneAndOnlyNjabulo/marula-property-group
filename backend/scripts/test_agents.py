"""
Manual test script for the two-agent triage chain - run via CLI:
    cd backend
    .venv/Scripts/python.exe scripts/test_agents.py

Runs a handful of sample tickets through run_triage() and prints the full audit
trail (Triage draft -> Auditor verdict -> final result) for each, so the "agent
checks agent" mechanic can be verified end-to-end - including at least one ticket
expected to genuinely trip up the Triage Agent's first pass - before it's wired
into the /triage endpoint (step 6).
"""

import sys
from pathlib import Path

from dotenv import load_dotenv

sys.stdout.reconfigure(encoding="utf-8")

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))
load_dotenv(BACKEND_DIR / ".env")

from app.agents import run_triage  # noqa: E402

SAMPLE_TICKETS = [
    "My kitchen tap has been dripping constantly for the past two weeks, it's not urgent but it's annoying.",
    "There's no hot water in my unit since this morning. The geyser itself doesn't look like it's leaking.",
    "The sink in my kitchen is leaking a little bit onto the floor, and I can smell something burning from the "
    "wall socket right next to it.",
    "Someone is stuck in the lift on the third floor right now, please help!",
    "There's a swarm of bees right at the main entrance and people are scared to walk past it.",
]


def main() -> None:
    for ticket in SAMPLE_TICKETS:
        print(f"\n{'=' * 80}\nTICKET: {ticket}")
        run = run_triage(ticket)

        print(f"\n[Triage Agent draft]")
        print(f"  category={run.triage.category!r} priority={run.triage.priority!r}")
        print(f"  sla_target: {run.triage.sla_target}")
        print(f"  reply: {run.triage.draft_reply}")

        print(f"\n[Policy Auditor verdict: {run.auditor.verdict.upper()}]")
        print(f"  citation: {run.auditor.citation}")
        if run.auditor.verdict == "rejected":
            print(f"  critique: {run.auditor.critique}")
            print(
                f"  corrected: category={run.auditor.corrected_category!r} "
                f"priority={run.auditor.corrected_priority!r}"
            )

        print(f"\n[Final result]")
        print(f"  category={run.final.category!r} priority={run.final.priority!r}")
        print(f"  sla_target: {run.final.sla_target}")
        print(f"  reply: {run.final.draft_reply}")
        print(f"  citations used: {run.citations}")


if __name__ == "__main__":
    main()
