"""
Two-agent triage chain: the Triage Agent drafts a classification + tenant reply,
the Policy Auditor Agent independently checks that draft against Marula's actual
policy documents (via RAG) and can reject it with a cited correction before it's
accepted. On rejection, the Triage Agent gets exactly one revision pass.

This is the "agent checks agent" mechanic the project exists to demonstrate - the
Auditor never sees the Triage Agent's reasoning, only its stated category/priority
and the ticket text, and it is prompted to ground its check strictly in retrieved
policy context rather than its own general knowledge of property management norms.
"""

import os
from dataclasses import dataclass
from typing import Literal

from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field

from app.retrieval import RetrievedChunk, retrieve

GENERATION_MODEL = "gemini-3.5-flash-lite"

CATEGORIES = [
    "Plumbing",
    "Electrical",
    "HVAC",
    "Elevator/Lift",
    "Fire Safety Systems",
    "Pest Control",
    "Structural/General Building",
    "Security/Access Control",
    "Common Area/Grounds",
    "Appliances",
]
PRIORITIES = ["Emergency", "Urgent", "Routine"]


class TriageOutput(BaseModel):
    category: str = Field(description=f"Exactly one of: {', '.join(CATEGORIES)}")
    priority: Literal["Emergency", "Urgent", "Routine"]
    sla_target: str = Field(description="Plain-language response/resolution window for this priority")
    draft_reply: str = Field(description="Short, empathetic tenant-facing reply")


class AuditOutput(BaseModel):
    verdict: Literal["approved", "rejected"]
    citation: str = Field(description="The exact 'Document Title §N' section this verdict is grounded in")
    critique: str = Field(description="Empty string if approved; explanation of the error if rejected")
    corrected_category: str = Field(default="", description="Only set if rejected and the category was wrong")
    corrected_priority: str = Field(default="", description="Only set if rejected and the priority was wrong")


@dataclass
class TriageDraft:
    category: str
    priority: str
    sla_target: str
    draft_reply: str


@dataclass
class AuditVerdict:
    verdict: str
    citation: str
    critique: str
    corrected_category: str
    corrected_priority: str


@dataclass
class TriageRun:
    ticket_text: str
    triage: TriageDraft
    auditor: AuditVerdict
    final: TriageDraft
    citations: list[str]


TRIAGE_SYSTEM_PROMPT = f"""You are the Triage Agent for Marula Property Group's maintenance helpdesk, a \
fictional South African property and facilities management company. Read the tenant's ticket and assign:

- category: exactly one of {", ".join(CATEGORIES)}
- priority: exactly one of {", ".join(PRIORITIES)} - Emergency means an immediate threat to life, safety, or \
structural integrity; Urgent means significant loss of amenity or a risk that will worsen if left alone, but not \
immediately dangerous; Routine means general wear-and-tear with no safety impact.
- sla_target: the plain-language response/resolution window for the priority you assigned
- draft_reply: a short, empathetic reply to the tenant acknowledging the ticket, its category, priority, and the \
SLA target

If the ticket describes more than one issue, classify by whichever element is most severe - do not average \
across issues. If you are genuinely unsure between two adjacent tiers, choose the higher one."""

_triage_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", TRIAGE_SYSTEM_PROMPT),
        ("human", "Ticket:\n{ticket_text}"),
    ]
)

_revision_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", TRIAGE_SYSTEM_PROMPT),
        (
            "human",
            "Ticket:\n{ticket_text}\n\n"
            "Your first classification was category={category}, priority={priority}. Marula's Policy Auditor "
            "rejected it, citing {citation}:\n{critique}\n\n"
            "Produce a corrected classification and reply.",
        ),
    ]
)

AUDITOR_SYSTEM_PROMPT = """You are the Policy Auditor Agent for Marula Property Group's maintenance helpdesk. \
You independently check the Triage Agent's category and priority assignment against the policy context below - \
you do not see or trust the Triage Agent's reasoning, only its stated category/priority and the ticket itself.

Rules:
- Base your check strictly on the provided context. Do not use outside knowledge of property management norms \
that isn't stated in the context.
- If the Triage Agent's category and priority are both correct per the context, verdict is "approved" - citation \
should be the section that best supports the assignment, critique should be an empty string, and leave both \
corrected_ fields empty.
- If either the category or the priority is wrong per the context, verdict is "rejected" - citation must be the \
exact "Document Title §N" section that shows the error, critique must explain what's wrong in one or two \
sentences, and corrected_category/corrected_priority must state the right value(s) (leave the other field empty \
if only one of the two was wrong).
- Never reject on a technicality the context doesn't actually support - if the context is genuinely ambiguous, \
approve."""

_auditor_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", AUDITOR_SYSTEM_PROMPT),
        (
            "human",
            "Ticket:\n{ticket_text}\n\nTriage Agent assigned: category={category}, priority={priority}\n\n"
            "Policy context:\n{context}",
        ),
    ]
)

_triage_llm: ChatGoogleGenerativeAI | None = None
_triage_chain = None
_revision_chain = None
_auditor_chain = None


def _get_triage_chain():
    global _triage_llm, _triage_chain
    if _triage_chain is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set")
        _triage_llm = ChatGoogleGenerativeAI(model=GENERATION_MODEL, google_api_key=api_key)
        _triage_chain = _triage_prompt | _triage_llm.with_structured_output(TriageOutput)
    return _triage_chain


def _get_revision_chain():
    global _revision_chain
    if _revision_chain is None:
        _get_triage_chain()  # ensures _triage_llm is initialized
        _revision_chain = _revision_prompt | _triage_llm.with_structured_output(TriageOutput)
    return _revision_chain


def _get_auditor_chain():
    global _auditor_chain
    if _auditor_chain is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set")
        llm = ChatGoogleGenerativeAI(model=GENERATION_MODEL, google_api_key=api_key)
        _auditor_chain = _auditor_prompt | llm.with_structured_output(AuditOutput)
    return _auditor_chain


def _format_context(chunks: list[RetrievedChunk]) -> str:
    return "\n\n".join(f"[{c.source_document} §{c.section}]\n{c.text}" for c in chunks)


def _dedupe_citations(chunks: list[RetrievedChunk]) -> list[str]:
    seen: set[tuple[str, str]] = set()
    citations: list[str] = []
    for c in chunks:
        key = (c.source_document, c.section)
        if key not in seen:
            seen.add(key)
            citations.append(f"{c.source_document} §{c.section}")
    return citations


def run_triage(ticket_text: str, top_k: int = 5) -> TriageRun:
    triage_chain = _get_triage_chain()
    draft: TriageOutput = triage_chain.invoke({"ticket_text": ticket_text})
    triage_draft = TriageDraft(
        category=draft.category,
        priority=draft.priority,
        sla_target=draft.sla_target,
        draft_reply=draft.draft_reply,
    )

    # The Auditor's retrieval query includes Triage's own classification, not just the raw
    # ticket - this surfaces the specific policy sections that would confirm or contradict
    # THAT classification, rather than generic sections about the ticket's topic.
    query = f"{ticket_text}\n\nAssigned category: {draft.category}, priority: {draft.priority}"
    chunks = retrieve(query, top_k=top_k)
    context = _format_context(chunks)
    citations = _dedupe_citations(chunks)

    auditor_chain = _get_auditor_chain()
    verdict: AuditOutput = auditor_chain.invoke(
        {
            "ticket_text": ticket_text,
            "category": draft.category,
            "priority": draft.priority,
            "context": context,
        }
    )
    audit_verdict = AuditVerdict(
        verdict=verdict.verdict,
        citation=verdict.citation,
        critique=verdict.critique,
        corrected_category=verdict.corrected_category,
        corrected_priority=verdict.corrected_priority,
    )

    if verdict.verdict == "approved":
        return TriageRun(ticket_text, triage_draft, audit_verdict, triage_draft, citations)

    revision_chain = _get_revision_chain()
    revised: TriageOutput = revision_chain.invoke(
        {
            "ticket_text": ticket_text,
            "category": draft.category,
            "priority": draft.priority,
            "citation": verdict.citation,
            "critique": verdict.critique,
        }
    )
    final_draft = TriageDraft(
        category=revised.category,
        priority=revised.priority,
        sla_target=revised.sla_target,
        draft_reply=revised.draft_reply,
    )
    return TriageRun(ticket_text, triage_draft, audit_verdict, final_draft, citations)
