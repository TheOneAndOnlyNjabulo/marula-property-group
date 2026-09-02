"""
Manual test script for the retrieval function - run via CLI:
    cd backend
    .venv/Scripts/python.exe scripts/test_retrieval.py

Runs a handful of sample questions against the live Pinecone index and prints
the top matches, so retrieval quality can be eyeballed before it's wired into
the two-agent triage chain (step 5).
"""

import sys
from pathlib import Path

from dotenv import load_dotenv

sys.stdout.reconfigure(encoding="utf-8")

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))
load_dotenv(BACKEND_DIR / ".env")

from app.retrieval import retrieve  # noqa: E402

SAMPLE_QUERIES = [
    "How quickly should someone respond to a burst pipe?",
    "Who pays for a blocked drain caused by grease going down the sink?",
    "What happens if someone gets trapped in the lift?",
    "Is a load-shedding power cut a maintenance ticket?",
    "How is my personal information used when I log a ticket?",
    "What insurance cover does a plumbing vendor need before joining the panel?",
]


def main() -> None:
    for query in SAMPLE_QUERIES:
        print(f"\n=== {query}")
        for i, chunk in enumerate(retrieve(query, top_k=3), start=1):
            preview = chunk.text.replace("\n", " ")[:120]
            print(f"  {i}. [{chunk.score:.3f}] {chunk.source_document} §{chunk.section} - {preview}...")


if __name__ == "__main__":
    main()
