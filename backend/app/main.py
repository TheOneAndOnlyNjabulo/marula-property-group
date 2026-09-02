from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Loads backend/.env for local dev. In production env vars are injected directly,
# and this file won't exist - load_dotenv() silently no-ops rather than erroring.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from app.agents import run_triage  # noqa: E402
from app.db import log_ticket_run  # noqa: E402
from app.rag_chain import answer_question  # noqa: E402

app = FastAPI(title="Marula Ticket Triage Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+",
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


class TriageRequest(BaseModel):
    ticket_text: str


class TriageDraftResponse(BaseModel):
    category: str
    priority: str
    sla_target: str
    draft_reply: str


class AuditVerdictResponse(BaseModel):
    verdict: str
    citation: str
    critique: str
    corrected_category: str
    corrected_priority: str


class TriageResponse(BaseModel):
    triage: TriageDraftResponse
    auditor: AuditVerdictResponse
    final: TriageDraftResponse
    citations: list[str]


@app.post("/triage")
def triage(body: TriageRequest) -> TriageResponse:
    if not body.ticket_text.strip():
        raise HTTPException(status_code=422, detail="ticket_text must not be empty")

    try:
        run = run_triage(body.ticket_text)
    except Exception:
        log_ticket_run(
            ticket_text=body.ticket_text,
            agent1_category=None,
            agent1_priority=None,
            agent1_draft=None,
            auditor_verdict=None,
            auditor_critique=None,
            final_category=None,
            final_priority=None,
            final_response=None,
            citations=[],
        )
        raise HTTPException(status_code=502, detail="Failed to triage this ticket. Please try again.")

    log_ticket_run(
        ticket_text=run.ticket_text,
        agent1_category=run.triage.category,
        agent1_priority=run.triage.priority,
        agent1_draft=run.triage.draft_reply,
        auditor_verdict=run.auditor.verdict,
        auditor_critique=run.auditor.critique,
        final_category=run.final.category,
        final_priority=run.final.priority,
        final_response=run.final.draft_reply,
        citations=run.citations,
    )

    return TriageResponse(
        triage=TriageDraftResponse(**run.triage.__dict__),
        auditor=AuditVerdictResponse(**run.auditor.__dict__),
        final=TriageDraftResponse(**run.final.__dict__),
        citations=run.citations,
    )


class ChatRequest(BaseModel):
    question: str


class SourceResponse(BaseModel):
    document: str
    section: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceResponse]


@app.post("/chat")
def chat(body: ChatRequest) -> ChatResponse:
    if not body.question.strip():
        raise HTTPException(status_code=422, detail="question must not be empty")

    try:
        result = answer_question(body.question)
    except Exception:
        raise HTTPException(status_code=502, detail="Failed to generate an answer. Please try again.")

    return ChatResponse(
        answer=result.answer,
        sources=[SourceResponse(document=s.document, section=s.section) for s in result.sources],
    )
