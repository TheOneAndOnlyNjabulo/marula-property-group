from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Loads backend/.env for local dev. In production env vars are injected directly,
# and this file won't exist - load_dotenv() silently no-ops rather than erroring.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

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
