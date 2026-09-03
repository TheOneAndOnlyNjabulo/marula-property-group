"""Unit tests for FAQ retrieval and context validation."""

import sys
from pathlib import Path
import unittest
from unittest.mock import patch

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.rag_chain import (  # noqa: E402
    CONFIDENCE_THRESHOLD,
    INSUFFICIENT_CONTEXT_SENTINEL,
    NOT_FOUND_ANSWER,
    RetrievedChunk,
    answer_question,
)


def _chunk(score: float = CONFIDENCE_THRESHOLD + 0.1) -> RetrievedChunk:
    return RetrievedChunk(
        id="test::1",
        source_document="Test policy",
        section="1",
        text="Test context",
        score=score,
    )


class RagChainTest(unittest.TestCase):
    def test_uses_model_when_top_score_clears_the_threshold(self):
        with patch("app.rag_chain.retrieve", return_value=[_chunk()]) as retrieve_mock, patch(
            "app.rag_chain._get_chain"
        ) as get_chain:
            get_chain.return_value.invoke.return_value = "A policy-backed answer."
            result = answer_question("sla responce time")

        self.assertEqual(result.answer, "A policy-backed answer.")
        self.assertEqual(retrieve_mock.call_args.args[0], "sla responce time")
        get_chain.return_value.invoke.assert_called_once()

    def test_skips_model_when_top_score_is_below_the_threshold(self):
        # A low score means retrieval found nothing relevant - the LLM should never
        # be called, since nothing retrieved is usable to answer from anyway.
        with patch("app.rag_chain.retrieve", return_value=[_chunk(score=CONFIDENCE_THRESHOLD - 0.1)]), patch(
            "app.rag_chain._get_chain"
        ) as get_chain:
            result = answer_question("something off-topic")

        self.assertEqual(result.answer, NOT_FOUND_ANSWER)
        self.assertEqual(result.sources, [])
        get_chain.assert_not_called()

    def test_returns_not_found_when_retrieval_returns_no_context(self):
        with patch("app.rag_chain.retrieve", return_value=[]), patch("app.rag_chain._get_chain") as get_chain:
            result = answer_question("anything")

        self.assertEqual(result.answer, NOT_FOUND_ANSWER)
        get_chain.assert_not_called()

    def test_returns_not_found_when_model_rejects_retrieved_context(self):
        # Score clears the threshold (retrieval looked plausible), but the model itself
        # determines the retrieved text doesn't actually answer the question - this is
        # the guardrail the threshold alone can't catch (in-domain vocabulary that
        # retrieves plausible-looking but non-answering chunks).
        with patch("app.rag_chain.retrieve", return_value=[_chunk()]), patch(
            "app.rag_chain._get_chain"
        ) as get_chain:
            get_chain.return_value.invoke.return_value = INSUFFICIENT_CONTEXT_SENTINEL
            result = answer_question("unrelated question")

        self.assertEqual(result.answer, NOT_FOUND_ANSWER)
