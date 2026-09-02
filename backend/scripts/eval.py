"""
Evaluation harness: runs every case in eval/eval_set.py through the full two-agent
triage chain, scores the FINAL category/priority against the expected values, and
writes a markdown report to eval/eval_results.md (linked from the README, step 12).

Run manually via CLI:
    cd backend
    .venv/Scripts/python.exe scripts/eval.py

Scored against the chain's final output (post-revision, if any), not the Triage
Agent's raw first pass - the Policy Auditor's whole job is to catch and correct a
wrong first pass, so a case that gets corrected on the way to a right answer is a
system success, not a system failure. The Auditor's verdict is reported per-case
as context (how often did a correction actually happen), not scored pass/fail.
"""

import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

sys.stdout.reconfigure(encoding="utf-8")

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))
load_dotenv(BACKEND_DIR / ".env")

from app.agents import run_triage  # noqa: E402
from eval.eval_set import EVAL_SET, EvalCase  # noqa: E402

RESULTS_PATH = BACKEND_DIR / "eval" / "eval_results.md"


@dataclass
class CaseResult:
    case: EvalCase
    final_category: str
    final_priority: str
    auditor_verdict: str
    category_correct: bool
    priority_correct: bool

    @property
    def passed(self) -> bool:
        return self.category_correct and self.priority_correct


def run_case(case: EvalCase) -> CaseResult:
    run = run_triage(case.ticket_text)
    return CaseResult(
        case=case,
        final_category=run.final.category,
        final_priority=run.final.priority,
        auditor_verdict=run.auditor.verdict,
        category_correct=run.final.category == case.expected_category,
        priority_correct=run.final.priority == case.expected_priority,
    )


def format_report(results: list[CaseResult]) -> str:
    n = len(results)
    passed = sum(1 for r in results if r.passed)
    category_correct = sum(1 for r in results if r.category_correct)
    priority_correct = sum(1 for r in results if r.priority_correct)
    rejected = sum(1 for r in results if r.auditor_verdict == "rejected")

    lines = [
        "# Evaluation Results",
        "",
        f"Generated: {datetime.now(timezone.utc).isoformat(timespec='seconds')}",
        "",
        "## Summary",
        "",
        f"- Cases fully correct (final category + priority both match): {passed}/{n} ({passed / n:.0%})",
        f"- Category accuracy: {category_correct}/{n} ({category_correct / n:.0%})",
        f"- Priority accuracy: {priority_correct}/{n} ({priority_correct / n:.0%})",
        f"- Policy Auditor rejected the Triage Agent's first pass: {rejected}/{n} ({rejected / n:.0%}) - each "
        "rejection is a case the two-agent design caught and corrected that a single-agent system would not have.",
        "",
        "## Per-ticket results",
        "",
        "| # | Ticket | Expected | Final result | Auditor | Passed |",
        "|---|---|---|---|---|---|",
    ]

    for i, r in enumerate(results, start=1):
        ticket_short = r.case.ticket_text if len(r.case.ticket_text) <= 60 else r.case.ticket_text[:57] + "..."
        expected_cell = f"{r.case.expected_category} / {r.case.expected_priority}"
        final_cell = f"{r.final_category} / {r.final_priority}"
        if not r.category_correct:
            final_cell = f"**{final_cell}**"
        elif not r.priority_correct:
            final_cell = f"**{final_cell}**"
        auditor_cell = "rejected → corrected" if r.auditor_verdict == "rejected" else "approved"
        passed_cell = "yes" if r.passed else "**no**"
        lines.append(f"| {i} | {ticket_short} | {expected_cell} | {final_cell} | {auditor_cell} | {passed_cell} |")

    return "\n".join(lines) + "\n"


def main() -> None:
    results: list[CaseResult] = []
    start = time.perf_counter()

    for i, case in enumerate(EVAL_SET, start=1):
        print(f"[{i}/{len(EVAL_SET)}] {case.ticket_text}")
        result = run_case(case)
        status = "OK" if result.passed else "CHECK"
        print(
            f"    expected={case.expected_category}/{case.expected_priority} "
            f"final={result.final_category}/{result.final_priority} "
            f"auditor={result.auditor_verdict} [{status}]"
        )
        results.append(result)

    elapsed = time.perf_counter() - start
    report = format_report(results)
    RESULTS_PATH.write_text(report, encoding="utf-8")

    passed = sum(1 for r in results if r.passed)
    print(f"\nDone in {elapsed:.0f}s. Report written to {RESULTS_PATH}")
    print(f"Cases passed: {passed}/{len(results)}")


if __name__ == "__main__":
    main()
