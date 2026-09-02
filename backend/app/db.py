"""
Neon ticket run log. Every /triage attempt is logged here - including failed ones
(most fields NULL) - so the admin UI (step 10) can show a complete history, and a
failed run still shows up rather than silently vanishing.

The connection string already points at a Neon pooled endpoint (the "-pooler"
hostname, PgBouncer-backed), so opening a fresh connection per request is the
correct, intended usage - no extra client-side pool needed on top of it.
"""

import os

import psycopg


def _connect() -> psycopg.Connection:
    database_url = os.environ.get("NEON_DATABASE_URL")
    if not database_url:
        raise RuntimeError("NEON_DATABASE_URL is not set")
    return psycopg.connect(database_url)


def log_ticket_run(
    ticket_text: str,
    agent1_category: str | None,
    agent1_priority: str | None,
    agent1_draft: str | None,
    auditor_verdict: str | None,
    auditor_critique: str | None,
    final_category: str | None,
    final_priority: str | None,
    final_response: str | None,
    citations: list[str],
) -> str:
    """Inserts a ticket run and returns its generated id (as a string)."""
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                insert into ticket_runs (
                    ticket_text, agent1_category, agent1_priority, agent1_draft,
                    auditor_verdict, auditor_critique,
                    final_category, final_priority, final_response, citations
                )
                values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                returning id
                """,
                (
                    ticket_text,
                    agent1_category,
                    agent1_priority,
                    agent1_draft,
                    auditor_verdict,
                    auditor_critique,
                    final_category,
                    final_priority,
                    final_response,
                    citations,
                ),
            )
            return str(cur.fetchone()[0])


def list_ticket_runs(limit: int = 50) -> list[dict]:
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                select id, ticket_text, agent1_category, agent1_priority, auditor_verdict,
                       final_category, final_priority, created_at
                from ticket_runs
                order by created_at desc
                limit %s
                """,
                (limit,),
            )
            columns = [desc[0] for desc in cur.description]
            return [dict(zip(columns, row)) for row in cur.fetchall()]


def get_ticket_run(ticket_id: str) -> dict | None:
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                select id, ticket_text, agent1_category, agent1_priority, agent1_draft,
                       auditor_verdict, auditor_critique,
                       final_category, final_priority, final_response, citations, created_at
                from ticket_runs
                where id = %s
                """,
                (ticket_id,),
            )
            row = cur.fetchone()
            if row is None:
                return None
            columns = [desc[0] for desc in cur.description]
            return dict(zip(columns, row))
