"""
Manual test script for the FAQ chatbot chain - run via CLI:
    cd backend
    .venv/Scripts/python.exe scripts/test_rag_chain.py

Includes a couple of in-scope questions and one deliberately out-of-scope
question, to confirm the context-validation sentinel and citation-aware prompt
behave correctly before this is wired into the Chat UI.
"""

import sys
from pathlib import Path

from dotenv import load_dotenv

sys.stdout.reconfigure(encoding="utf-8")

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))
load_dotenv(BACKEND_DIR / ".env")

from app.rag_chain import answer_question  # noqa: E402

SAMPLE_QUESTIONS = [
    "How long do I have before someone responds to a burst pipe?",
    "Who pays for a blocked drain caused by grease going down the sink?",
    "What's a good recipe for chocolate cake?",  # deliberately out of scope
]


def main() -> None:
    for question in SAMPLE_QUESTIONS:
        print(f"\n=== {question}")
        result = answer_question(question)
        print(result.answer)
        print("\nSources:")
        for s in result.sources:
            print(f"  - {s.document} §{s.section}")


if __name__ == "__main__":
    main()
